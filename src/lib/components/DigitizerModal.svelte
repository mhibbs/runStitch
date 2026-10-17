<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    isDigitizerModalOpen,
    digitizerSourceLayerId,
    closeDigitizerModal,
    grid,
    layers,
    palette,
    selection,
    applyDigitizedResult
  } from '../stores/editorStore';
  import {
    analyzeImageComplexity,
    digitizeImageToStitches,
    hexToRgb,
    type DigitizerResult,
    type ImageComplexityAnalysis
  } from '../engine/digitizer';
  import { getSelectedCells } from '../engine/geometry';
  import type { DigitizerOptions, DitherMode } from '../types';
  import {
    X,
    Sparkles,
    Check,
    ZoomIn,
    ZoomOut,
    Layers,
    Sliders,
    Pipette,
    Palette,
    Eye,
    Maximize2,
    Crop
  } from 'lucide-svelte';

  let previewCanvas: HTMLCanvasElement;
  let sourceImg: HTMLImageElement | null = null;
  let isImageLoaded = false;
  let complexity: ImageComplexityAnalysis | null = null;

  // Options state
  let maxColors = 14;
  let ditherMode: DitherMode = 'atkinson';
  let ignoreBackground = false;
  let backgroundHex = '#FFFFFF';
  let backgroundTolerance = 18;
  let targetLayer: 'new' | 'active' = 'new';
  let keepReferenceLayer = true;
  let useActivePaletteOnly = false;
  let restrictToSelection = true;

  // Preview display mode
  let previewView: 'stitches' | 'source' | 'split' = 'stitches';
  let previewZoom = 1;
  let isPickingBgColor = false;
  let isPanningPreview = false;
  let previewPanStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };
  let previewContainerEl: HTMLDivElement;

  // Result state
  let digitizeResult: DigitizerResult | null = null;
  let isProcessing = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Find source layer and its image
  $: sourceLayer = $layers.find(l => l.id === $digitizerSourceLayerId);
  $: refImage = sourceLayer?.image;
  $: hasActiveSelection = !!$selection;
  $: activeSelectionMask = hasActiveSelection ? getSelectedCells($selection) : null;

  $: if ($isDigitizerModalOpen && refImage) {
    loadImage(refImage.src);
  }

  function loadImage(src: string) {
    isImageLoaded = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      sourceImg = img;
      isImageLoaded = true;
      try {
        complexity = analyzeImageComplexity(img);
        if (complexity) {
          maxColors = complexity.recommendedColors;
          if (complexity.hasAlpha) {
            ignoreBackground = false; // Native transparency exists
          }
        }
      } catch (e) {
        console.warn('Complexity analysis failed:', e);
      }
      scheduleDigitize();
    };
  }

  function scheduleDigitize() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runDigitization();
    }, 40);
  }

  $: if (isImageLoaded && (maxColors || ditherMode || ignoreBackground || backgroundHex || backgroundTolerance || useActivePaletteOnly !== undefined || restrictToSelection !== undefined)) {
    scheduleDigitize();
  }

  function runDigitization() {
    if (!sourceImg || !refImage) return;
    isProcessing = true;

    try {
      const options: DigitizerOptions = {
        maxColors,
        ditherMode,
        ignoreBackground,
        backgroundHex,
        backgroundTolerance,
        targetLayer,
        keepReferenceLayer,
        useActivePaletteOnly,
        selectionMask: (restrictToSelection && activeSelectionMask && activeSelectionMask.size > 0) ? activeSelectionMask : undefined
      };

      const targetW = Math.max(1, Math.round(refImage.width));
      const targetH = Math.max(1, Math.round(refImage.height));

      // Extract existing project palette threads for closest-match quantization
      const projectFloss = $palette.map(p => {
        const rgb = hexToRgb(p.hex);
        return {
          code: p.dmc,
          name: p.name,
          hex: p.hex,
          r: rgb.r,
          g: rgb.g,
          b: rgb.b
        };
      });

      digitizeResult = digitizeImageToStitches(
        sourceImg,
        refImage.x,
        refImage.y,
        targetW,
        targetH,
        options,
        refImage.rotation || 0,
        projectFloss
      );

      renderPreview();
    } catch (err) {
      console.error('Digitization failed:', err);
    } finally {
      isProcessing = false;
    }
  }

  let previewFrameMode: 'canvas' | 'image' = 'canvas';
  let offscreenSourceCanvas: HTMLCanvasElement | null = null;
  let hoveredPickColor: string | null = null;
  let pickMousePos = { x: 0, y: 0 };

  function renderPreview() {
    if (!previewCanvas || !sourceImg || !refImage) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    let minX = 0;
    let minY = 0;
    let maxX = $grid.width;
    let maxY = $grid.height;

    if (previewFrameMode === 'canvas') {
      minX = Math.min(0, Math.floor(refImage.x));
      minY = Math.min(0, Math.floor(refImage.y));
      maxX = Math.max($grid.width, Math.ceil(refImage.x + refImage.width));
      maxY = Math.max($grid.height, Math.ceil(refImage.y + refImage.height));
    } else {
      minX = Math.floor(refImage.x);
      minY = Math.floor(refImage.y);
      maxX = Math.ceil(refImage.x + refImage.width);
      maxY = Math.ceil(refImage.y + refImage.height);
    }

    const totalCols = Math.max(1, maxX - minX);
    const totalRows = Math.max(1, maxY - minY);

    const baseCell = Math.max(4, Math.min(22, Math.floor(620 / Math.max(totalCols, totalRows))));
    const cellSize = Math.max(3, Math.floor(baseCell * previewZoom));

    const canvasW = totalCols * cellSize;
    const canvasH = totalRows * cellSize;

    previewCanvas.width = canvasW;
    previewCanvas.height = canvasH;

    if (!offscreenSourceCanvas) {
      offscreenSourceCanvas = document.createElement('canvas');
    }
    offscreenSourceCanvas.width = canvasW;
    offscreenSourceCanvas.height = canvasH;
    const offCtx = offscreenSourceCanvas.getContext('2d');
    if (offCtx) {
      offCtx.clearRect(0, 0, canvasW, canvasH);
    }

    ctx.clearRect(0, 0, canvasW, canvasH);

    // 1. Dark background for regions outside the stitch canvas
    const checkSize = 12;
    for (let cy = 0; cy < canvasH; cy += checkSize) {
      for (let cx = 0; cx < canvasW; cx += checkSize) {
        ctx.fillStyle = ((cx / checkSize + cy / checkSize) % 2 === 0) ? '#16161E' : '#1C1C26';
        ctx.fillRect(cx, cy, checkSize, checkSize);
      }
    }

    // 2. Stitch Canvas Area Backdrop & Grid
    const canvasStartX = (0 - minX) * cellSize;
    const canvasStartY = (0 - minY) * cellSize;
    const canvasPixelW = $grid.width * cellSize;
    const canvasPixelH = $grid.height * cellSize;

    // Aida cloth color for stitch canvas
    ctx.fillStyle = '#FAF7EE';
    ctx.fillRect(canvasStartX, canvasStartY, canvasPixelW, canvasPixelH);

    // Subtle 10x10 grid on canvas
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= $grid.width; gx += 10) {
      const px = canvasStartX + gx * cellSize;
      ctx.beginPath();
      ctx.moveTo(px, canvasStartY);
      ctx.lineTo(px, canvasStartY + canvasPixelH);
      ctx.stroke();
    }
    for (let gy = 0; gy <= $grid.height; gy += 10) {
      const py = canvasStartY + gy * cellSize;
      ctx.beginPath();
      ctx.moveTo(canvasStartX, py);
      ctx.lineTo(canvasStartX + canvasPixelW, py);
      ctx.stroke();
    }

    // Canvas boundary outline (Indigo)
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvasStartX, canvasStartY, canvasPixelW, canvasPixelH);

    // Canvas label badge
    if (previewFrameMode === 'canvas' && (minX < 0 || minY < 0 || maxX > $grid.width || maxY > $grid.height)) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
      ctx.font = 'bold 10px monospace';
      ctx.fillRect(canvasStartX, canvasStartY, 140, 16);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`CANVAS (${$grid.width}×${$grid.height} st)`, canvasStartX + 6, canvasStartY + 12);
    }

    // 3. Render Source Image into offscreen buffer & on preview
    const imgX = (refImage.x - minX) * cellSize;
    const imgY = (refImage.y - minY) * cellSize;
    const imgW = refImage.width * cellSize;
    const imgH = refImage.height * cellSize;
    const rot = refImage.rotation || 0;

    function drawTransformedImage(targetCtx: CanvasRenderingContext2D) {
      if (!sourceImg) return;
      targetCtx.save();
      targetCtx.translate(imgX + imgW / 2, imgY + imgH / 2);
      if (rot % 360 !== 0) {
        targetCtx.rotate((rot * Math.PI) / 180);
      }
      targetCtx.drawImage(sourceImg, -imgW / 2, -imgH / 2, imgW, imgH);
      targetCtx.restore();
    }

    // Draw into offscreen source buffer for pixel-perfect picking
    if (offCtx) {
      drawTransformedImage(offCtx);
    }

    // 4. Render based on active view mode
    if (previewView === 'source') {
      drawTransformedImage(ctx);
    } else if (previewView === 'split') {
      drawTransformedImage(ctx);
      const splitX = Math.floor(canvasW / 2);

      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, canvasW - splitX, canvasH);
      ctx.clip();

      drawStitchesOnCtx(ctx, minX, minY, cellSize);

      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvasH);
      ctx.stroke();
    } else {
      // 'stitches' view
      drawStitchesOnCtx(ctx, minX, minY, cellSize);
    }

    // Ensure canvas boundary is clearly outlined on top
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(canvasStartX, canvasStartY, canvasPixelW, canvasPixelH);
  }

  function drawStitchesOnCtx(
    ctx: CanvasRenderingContext2D,
    minX: number,
    minY: number,
    cellSize: number
  ) {
    if (!digitizeResult) return;

    for (const stitch of digitizeResult.stitches) {
      const px = (stitch.x - minX) * cellSize;
      const py = (stitch.y - minY) * cellSize;

      ctx.fillStyle = stitch.hex;
      ctx.fillRect(px, py, cellSize, cellSize);

      if (cellSize >= 9) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + 1);
        ctx.lineTo(px + cellSize - 1, py + cellSize - 1);
        ctx.moveTo(px + cellSize - 1, py + 1);
        ctx.lineTo(px + 1, py + cellSize - 1);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }

    // Visual feedback for selection boundary: dim out cells outside selection mask
    if (restrictToSelection && activeSelectionMask && activeSelectionMask.size > 0) {
      ctx.fillStyle = 'rgba(15, 15, 25, 0.45)';
      for (const stitch of digitizeResult.stitches) {
        const key = `${stitch.x},${stitch.y}`;
        if (!activeSelectionMask.has(key)) {
          const px = (stitch.x - minX) * cellSize;
          const py = (stitch.y - minY) * cellSize;
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      }
    }
  }

  function handleCanvasClick(e: MouseEvent) {
    if (!isPickingBgColor || !previewCanvas || !offscreenSourceCanvas) return;
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    const clickX = Math.floor((e.clientX - rect.left) * scaleX);
    const clickY = Math.floor((e.clientY - rect.top) * scaleY);

    if (clickX < 0 || clickX >= previewCanvas.width || clickY < 0 || clickY >= previewCanvas.height) return;

    const offCtx = offscreenSourceCanvas.getContext('2d');
    if (!offCtx) return;

    const pixel = offCtx.getImageData(clickX, clickY, 1, 1).data;
    if (pixel[3] < 10) return; // ignore transparent pixels outside image

    const rHex = pixel[0].toString(16).padStart(2, '0');
    const gHex = pixel[1].toString(16).padStart(2, '0');
    const bHex = pixel[2].toString(16).padStart(2, '0');
    backgroundHex = `#${rHex}${gHex}${bHex}`.toUpperCase();
    ignoreBackground = true;
    isPickingBgColor = false;
    hoveredPickColor = null;
    scheduleDigitize();
  }

  function handleCanvasPointerMove(e: MouseEvent) {
    if (!isPickingBgColor || !previewCanvas || !offscreenSourceCanvas) {
      hoveredPickColor = null;
      return;
    }
    const rect = previewCanvas.getBoundingClientRect();
    pickMousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    const clickX = Math.floor((e.clientX - rect.left) * scaleX);
    const clickY = Math.floor((e.clientY - rect.top) * scaleY);

    if (clickX < 0 || clickX >= previewCanvas.width || clickY < 0 || clickY >= previewCanvas.height) {
      hoveredPickColor = null;
      return;
    }

    const offCtx = offscreenSourceCanvas.getContext('2d');
    if (!offCtx) return;

    const pixel = offCtx.getImageData(clickX, clickY, 1, 1).data;
    if (pixel[3] < 10) {
      hoveredPickColor = null;
      return;
    }

    const rHex = pixel[0].toString(16).padStart(2, '0');
    const gHex = pixel[1].toString(16).padStart(2, '0');
    const bHex = pixel[2].toString(16).padStart(2, '0');
    hoveredPickColor = `#${rHex}${gHex}${bHex}`.toUpperCase();
  }

  function handlePreviewPointerDown(e: PointerEvent) {
    if (isPickingBgColor) return;
    if (previewZoom > 1 && previewContainerEl) {
      isPanningPreview = true;
      previewPanStart = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: previewContainerEl.scrollLeft,
        scrollTop: previewContainerEl.scrollTop
      };
      try {
        previewContainerEl.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  function handlePreviewPointerMove(e: PointerEvent) {
    if (isPanningPreview && previewContainerEl) {
      const dx = e.clientX - previewPanStart.x;
      const dy = e.clientY - previewPanStart.y;
      previewContainerEl.scrollLeft = previewPanStart.scrollLeft - dx;
      previewContainerEl.scrollTop = previewPanStart.scrollTop - dy;
    } else {
      handleCanvasPointerMove(e);
    }
  }

  function handlePreviewPointerUp(e: PointerEvent) {
    if (isPanningPreview) {
      isPanningPreview = false;
      try {
        previewContainerEl?.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  function handleCanvasPointerLeave() {
    hoveredPickColor = null;
  }

  function handleApply() {
    if (!digitizeResult || !$digitizerSourceLayerId) return;

    const options: DigitizerOptions = {
      maxColors,
      ditherMode,
      ignoreBackground,
      backgroundHex,
      backgroundTolerance,
      targetLayer,
      keepReferenceLayer
    };

    applyDigitizedResult($digitizerSourceLayerId, digitizeResult, options);
    closeDigitizerModal();
  }
</script>

{#if $isDigitizerModalOpen && refImage}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fadeIn"
    on:click|self={closeDigitizerModal}
    role="dialog"
    aria-modal="true"
    aria-labelledby="digitizer-title"
  >
    <!-- Modal Card -->
    <div
      class="bg-[#18181F] border border-cyan-500/30 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-gray-200"
      role="document"
      tabindex="-1"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#1D1D26]">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 id="digitizer-title" class="text-base font-bold text-white tracking-wide">
              {sourceLayer?.type === 'text' ? 'Digitize Text into DMC Stitches' : 'Digitize Image into DMC Stitches'}
            </h2>
            <p class="text-xs text-gray-400">Transform "{sourceLayer?.name || (sourceLayer?.type === 'text' ? 'Text' : 'Image')}" into standard cross-stitch chart</p>
          </div>
        </div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          on:click={closeDigitizerModal}
          title="Close Digitizer"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Main Body -->
      <div class="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <!-- Left Column: Interactive Live Preview (7 cols) -->
        <div class="lg:col-span-7 flex flex-col space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <!-- Framing Mode Selector -->
            <div class="flex items-center space-x-1 bg-[#121216] p-1 rounded-lg border border-gray-800 text-xs">
              <span class="text-[10px] text-gray-500 uppercase px-1 font-semibold">Frame:</span>
              <button
                type="button"
                class="px-2 py-0.5 rounded transition-colors cursor-pointer text-xs {previewFrameMode === 'canvas' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => { previewFrameMode = 'canvas'; renderPreview(); }}
                title="Frame to Stitch Canvas boundary"
              >
                Canvas ({$grid.width}×{$grid.height})
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded transition-colors cursor-pointer text-xs {previewFrameMode === 'image' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => { previewFrameMode = 'image'; renderPreview(); }}
                title="Frame tightly to Image boundary"
              >
                Image Only
              </button>
            </div>
            
            <!-- Preview Mode Switcher -->
            <div class="flex items-center space-x-1 bg-[#121216] p-1 rounded-lg border border-gray-800 text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded transition-colors cursor-pointer {previewView === 'stitches' ? 'bg-cyan-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => { previewView = 'stitches'; renderPreview(); }}
              >
                Stitches
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded transition-colors cursor-pointer {previewView === 'split' ? 'bg-cyan-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => { previewView = 'split'; renderPreview(); }}
              >
                Split
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded transition-colors cursor-pointer {previewView === 'source' ? 'bg-cyan-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => { previewView = 'source'; renderPreview(); }}
              >
                Source
              </button>
            </div>
          </div>

          <!-- Preview Frame (with Pan & Zoom Support) -->
          <div
            bind:this={previewContainerEl}
            class="relative flex-1 min-h-[340px] max-h-[460px] bg-[#0E0E12] rounded-xl border border-gray-800 overflow-auto p-4 flex {previewZoom > 1 ? (isPanningPreview ? 'cursor-grabbing' : 'cursor-grab') : ''}"
            on:pointerdown={handlePreviewPointerDown}
            on:pointermove={handlePreviewPointerMove}
            on:pointerup={handlePreviewPointerUp}
            on:pointercancel={handlePreviewPointerUp}
          >
            {#if !isImageLoaded}
              <div class="m-auto flex flex-col items-center space-y-2 text-gray-500">
                <span class="animate-spin text-cyan-400">⏳</span>
                <span class="text-xs">Loading image...</span>
              </div>
            {:else}
              <div class="m-auto w-fit h-fit flex-shrink-0">
                <canvas
                  bind:this={previewCanvas}
                  class="rounded shadow-xl object-contain block {previewZoom <= 1 ? 'max-w-full max-h-full' : ''} {isPickingBgColor ? 'cursor-crosshair' : (previewZoom > 1 ? (isPanningPreview ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default')}"
                  style={previewZoom > 1 && previewCanvas ? `width: ${previewCanvas.width}px; height: ${previewCanvas.height}px; flex-shrink: 0;` : ''}
                  on:click={handleCanvasClick}
                  on:pointerleave={handleCanvasPointerLeave}
                ></canvas>
              </div>
            {/if}

            {#if isPickingBgColor}
              <div class="absolute top-3 left-1/2 -translate-x-1/2 bg-cyan-900/95 border border-cyan-400 text-cyan-200 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg animate-pulse flex items-center space-x-2 z-10">
                <Pipette size={13} />
                <span>Click any pixel on image to pick background color</span>
              </div>

              {#if hoveredPickColor}
                <div
                  class="absolute pointer-events-none bg-[#161622]/95 border border-cyan-400 rounded-lg px-2.5 py-1.5 shadow-2xl flex items-center space-x-2 text-xs z-30 backdrop-blur"
                  style="left: {Math.min(pickMousePos.x + 16, 420)}px; top: {Math.min(pickMousePos.y + 16, 380)}px;"
                >
                  <div class="w-4 h-4 rounded border border-black/40 shadow-sm" style="background-color: {hoveredPickColor};"></div>
                  <span class="font-mono text-cyan-200 font-bold">{hoveredPickColor}</span>
                </div>
              {/if}
            {/if}
          </div>

          <!-- Stats Badge & Zoom -->
          <div class="flex items-center justify-between text-xs text-gray-400 px-1">
            <div class="flex items-center space-x-2">
              {#if digitizeResult}
                <span class="font-mono text-cyan-300 font-semibold">{digitizeResult.stats.totalStitches.toLocaleString()}</span> stitches
                <span>•</span>
                <span class="font-mono text-cyan-300 font-semibold">{digitizeResult.palette.length}</span> DMC colors
                <span>•</span>
                <span class="font-mono text-gray-300">{Math.round(refImage.width)} × {Math.round(refImage.height)}</span> cells
              {/if}
            </div>

            <!-- Preview Zoom Controls -->
            <div class="flex items-center space-x-1">
              <button
                type="button"
                class="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 cursor-pointer"
                on:click={() => { previewZoom = Math.max(0.5, previewZoom - 0.25); renderPreview(); }}
                title="Zoom Out Preview"
              >
                <ZoomOut size={14} />
              </button>
              <span class="font-mono text-[11px] w-10 text-center">{Math.round(previewZoom * 100)}%</span>
              <button
                type="button"
                class="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 cursor-pointer"
                on:click={() => { previewZoom = Math.min(4, previewZoom + 0.25); renderPreview(); }}
                title="Zoom In Preview"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono transition-colors ml-0.5 cursor-pointer"
                on:click={() => { previewZoom = 1; renderPreview(); }}
                title="Reset Zoom to 100%"
              >
                100%
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Settings & DMC Colors (5 cols) -->
        <div class="lg:col-span-5 flex flex-col space-y-4">
          <!-- Section 1: Color Quantization -->
          <div class="bg-[#121217] border border-gray-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Palette size={15} class="text-cyan-400" />
                <span class="text-xs font-semibold text-gray-200 uppercase tracking-wider">Thread Palette</span>
              </div>
              <span class="font-mono text-sm font-bold text-cyan-400">{useActivePaletteOnly ? $palette.length : maxColors} Colors</span>
            </div>

            <!-- Restrict to Active Palette Toggle -->
            <label class="flex items-center justify-between text-xs text-gray-300 p-2 rounded-lg bg-[#181820] border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors">
              <div class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  bind:checked={useActivePaletteOnly}
                  class="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
                <span class="font-medium">Limit to Active Palette ({$palette.length} colors)</span>
              </div>
              {#if useActivePaletteOnly}
                <span class="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700">
                  Closest Match
                </span>
              {/if}
            </label>

            {#if !useActivePaletteOnly}
              {#if complexity}
                <div class="bg-cyan-950/40 border border-cyan-800/50 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                  <span class="text-cyan-200">
                    ✦ {complexity.isGrayscale ? 'Monochrome / Grayscale' : 'Full Color'} image
                  </span>
                  <button
                    type="button"
                    class="text-cyan-400 hover:text-cyan-200 underline cursor-pointer font-medium ml-2"
                    on:click={() => { maxColors = complexity?.recommendedColors ?? 14; }}
                  >
                    Auto ({complexity.recommendedColors})
                  </button>
                </div>
              {/if}

              <div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  bind:value={maxColors}
                  class="w-full accent-cyan-500 cursor-pointer"
                />
                <div class="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>2 (Minimal)</span>
                  <span>12</span>
                  <span>24</span>
                  <span>40 (High Detail)</span>
                </div>
              </div>

              <!-- Quick Presets -->
              <div class="flex flex-wrap gap-1.5 pt-1">
                {#each [4, 8, 14, 20, 28] as presetCount}
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer {maxColors === presetCount ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 font-bold' : 'bg-[#181820] border-gray-700 text-gray-400 hover:text-gray-200'}"
                    on:click={() => { maxColors = presetCount; }}
                  >
                    {presetCount}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Selection Scope (if selection exists on canvas) -->
          {#if hasActiveSelection}
            <div class="bg-indigo-950/30 border border-indigo-800/50 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center space-x-1.5 text-indigo-300 font-semibold">
                  <Crop size={14} />
                  <span>Selection Scope</span>
                </div>
                <span class="font-mono text-[11px] text-indigo-400 font-bold">{activeSelectionMask?.size ?? 0} Stitches</span>
              </div>
              <label class="flex items-center space-x-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={restrictToSelection}
                  class="rounded border-gray-700 bg-gray-900 text-indigo-500 focus:ring-0"
                />
                <span>Only digitize inside current selection</span>
              </label>
            </div>
          {/if}

          <!-- Section 2: Dithering Method -->
          <div class="bg-[#121217] border border-gray-800 rounded-xl p-4 space-y-2.5">
            <div class="flex items-center space-x-2">
              <Sliders size={15} class="text-indigo-400" />
              <span class="text-xs font-semibold text-gray-200 uppercase tracking-wider">Dithering & Texture</span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="p-2 rounded-lg border text-left flex flex-col space-y-1 transition-all cursor-pointer {ditherMode === 'atkinson' ? 'bg-indigo-950/40 border-indigo-500 text-white shadow' : 'bg-[#181820] border-gray-800 text-gray-400 hover:text-gray-200'}"
                on:click={() => { ditherMode = 'atkinson'; }}
              >
                <span class="text-xs font-bold text-indigo-300">Atkinson</span>
                <span class="text-[10px] text-gray-400 leading-tight">Needlework style, crisp edges</span>
              </button>

              <button
                type="button"
                class="p-2 rounded-lg border text-left flex flex-col space-y-1 transition-all cursor-pointer {ditherMode === 'floyd_steinberg' ? 'bg-indigo-950/40 border-indigo-500 text-white shadow' : 'bg-[#181820] border-gray-800 text-gray-400 hover:text-gray-200'}"
                on:click={() => { ditherMode = 'floyd_steinberg'; }}
              >
                <span class="text-xs font-bold text-indigo-300">Floyd-St.</span>
                <span class="text-[10px] text-gray-400 leading-tight">Smooth photographic diffusion</span>
              </button>

              <button
                type="button"
                class="p-2 rounded-lg border text-left flex flex-col space-y-1 transition-all cursor-pointer {ditherMode === 'none' ? 'bg-indigo-950/40 border-indigo-500 text-white shadow' : 'bg-[#181820] border-gray-800 text-gray-400 hover:text-gray-200'}"
                on:click={() => { ditherMode = 'none'; }}
              >
                <span class="text-xs font-bold text-indigo-300">None</span>
                <span class="text-[10px] text-gray-400 leading-tight">Posterized flat color blocks</span>
              </button>
            </div>
          </div>

          <!-- Section 3: Background Removal -->
          <div class="bg-[#121217] border border-gray-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={ignoreBackground}
                  class="rounded border-gray-700 bg-gray-900 text-cyan-600 focus:ring-0 cursor-pointer"
                />
                <span class="text-xs font-semibold text-gray-200">Remove Background Color</span>
              </label>

              {#if ignoreBackground}
                <button
                  type="button"
                  class="px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 border transition-colors cursor-pointer {isPickingBgColor ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'}"
                  on:click={() => { isPickingBgColor = !isPickingBgColor; }}
                >
                  <Pipette size={11} />
                  <span>{isPickingBgColor ? 'Click on image...' : 'Pick from Preview'}</span>
                </button>
              {/if}
            </div>

            {#if ignoreBackground}
              <div class="space-y-2 pt-1 border-t border-gray-800">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-400">Target Color:</span>
                  <div class="flex items-center space-x-2">
                    <input
                      type="color"
                      bind:value={backgroundHex}
                      class="w-6 h-6 rounded cursor-pointer border border-gray-600 bg-transparent p-0"
                    />
                    <span class="font-mono text-[11px] text-gray-300">{backgroundHex}</span>
                  </div>
                </div>

                <div class="space-y-1">
                  <div class="flex justify-between text-[11px] text-gray-400">
                    <span>Tolerance:</span>
                    <span class="font-mono text-cyan-400">{backgroundTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    bind:value={backgroundTolerance}
                    class="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            {/if}
          </div>

          <!-- Section 4: Output Layer Target -->
          <div class="bg-[#121217] border border-gray-800 rounded-xl p-4 space-y-2.5">
            <div class="flex items-center space-x-2">
              <Layers size={15} class="text-emerald-400" />
              <span class="text-xs font-semibold text-gray-200 uppercase tracking-wider">Output Layer</span>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <label class="p-2 rounded-lg border flex items-center space-x-2 cursor-pointer {targetLayer === 'new' ? 'bg-emerald-950/30 border-emerald-500 text-white' : 'bg-[#181820] border-gray-800 text-gray-400'}">
                <input type="radio" value="new" bind:group={targetLayer} class="text-emerald-500 focus:ring-0" />
                <span>New Layer</span>
              </label>

              <label class="p-2 rounded-lg border flex items-center space-x-2 cursor-pointer {targetLayer === 'active' ? 'bg-emerald-950/30 border-emerald-500 text-white' : 'bg-[#181820] border-gray-800 text-gray-400'}">
                <input type="radio" value="active" bind:group={targetLayer} class="text-emerald-500 focus:ring-0" />
                <span>Active Layer</span>
              </label>
            </div>

            <label class="flex items-center space-x-2 text-xs text-gray-300 pt-1 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={keepReferenceLayer}
                class="rounded border-gray-700 bg-gray-900 text-emerald-600 focus:ring-0"
              />
              <span>Keep reference image layer (dimmed to 35%)</span>
            </label>
          </div>

          <!-- Section 6: Matched Thread Swatches (Always min-h-[114px] to prevent modal shrinking when < 4 colors) -->
          <div class="bg-[#121217] border border-gray-800 rounded-xl p-3 space-y-2">
            <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Matched Floss Threads</span>
              <span class="font-mono text-cyan-400">{digitizeResult?.palette?.length ?? 0} Threads</span>
            </div>

            <div class="min-h-[114px] max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {#if digitizeResult && digitizeResult.palette.length > 0}
                {#each digitizeResult.palette as thread}
                  <div class="flex items-center justify-between px-2 py-1 rounded bg-[#181820] text-xs">
                    <div class="flex items-center space-x-2">
                      <span
                        class="w-3.5 h-3.5 rounded-full border border-gray-600 shadow-sm flex-shrink-0"
                        style="background-color: {thread.hex};"
                      ></span>
                      <span class="font-mono font-bold text-gray-200">{thread.code}</span>
                      <span class="text-gray-400 truncate max-w-[130px]">{thread.name}</span>
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="h-[110px] flex items-center justify-center text-xs text-gray-500 italic">
                  Sampling colors...
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-800 bg-[#1D1D26] flex items-center justify-between">
        <div class="text-xs text-gray-400">
          Placement: <span class="font-mono text-cyan-300 font-semibold">{Math.round(refImage.width)} × {Math.round(refImage.height)}</span> stitches at X:{refImage.x}, Y:{refImage.y}
        </div>

        <div class="flex items-center space-x-3">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            on:click={closeDigitizerModal}
          >
            Cancel
          </button>

          <button
            type="button"
            class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
            disabled={!digitizeResult || isProcessing}
            on:click={handleApply}
          >
            <Sparkles size={14} />
            <span>Convert to Stitches</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 4px;
  }
</style>
