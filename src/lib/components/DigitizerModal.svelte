<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    isDigitizerModalOpen,
    digitizerSourceLayerId,
    closeDigitizerModal,
    layers,
    palette,
    applyDigitizedResult
  } from '../stores/editorStore';
  import {
    analyzeImageComplexity,
    digitizeImageToStitches,
    type DigitizerResult,
    type ImageComplexityAnalysis
  } from '../engine/digitizer';
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
    Maximize2
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

  // Preview display mode
  let previewView: 'stitches' | 'source' | 'split' = 'stitches';
  let previewZoom = 1;
  let isPickingBgColor = false;

  // Result state
  let digitizeResult: DigitizerResult | null = null;
  let isProcessing = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Find source layer and its image
  $: sourceLayer = $layers.find(l => l.id === $digitizerSourceLayerId);
  $: refImage = sourceLayer?.image;

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

  $: if (isImageLoaded && (maxColors || ditherMode || ignoreBackground || backgroundHex || backgroundTolerance)) {
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
        keepReferenceLayer
      };

      const targetW = Math.max(1, Math.round(refImage.width));
      const targetH = Math.max(1, Math.round(refImage.height));

      digitizeResult = digitizeImageToStitches(
        sourceImg,
        refImage.x,
        refImage.y,
        targetW,
        targetH,
        options
      );

      renderPreview();
    } catch (err) {
      console.error('Digitization failed:', err);
    } finally {
      isProcessing = false;
    }
  }

  function renderPreview() {
    if (!previewCanvas || !sourceImg || !refImage) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    const targetW = Math.max(1, Math.round(refImage.width));
    const targetH = Math.max(1, Math.round(refImage.height));

    const cellSize = Math.max(4, Math.floor(18 * previewZoom));
    const canvasW = targetW * cellSize;
    const canvasH = targetH * cellSize;

    previewCanvas.width = canvasW;
    previewCanvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Checkerboard backdrop for transparency
    const checkSize = 12;
    for (let cy = 0; cy < canvasH; cy += checkSize) {
      for (let cx = 0; cx < canvasW; cx += checkSize) {
        ctx.fillStyle = ((cx / checkSize + cy / checkSize) % 2 === 0) ? '#1E1E24' : '#282832';
        ctx.fillRect(cx, cy, checkSize, checkSize);
      }
    }

    if (previewView === 'source') {
      // Draw source image scaled to preview
      ctx.drawImage(sourceImg, 0, 0, canvasW, canvasH);
    } else if (previewView === 'split') {
      // Left half source, right half stitches
      ctx.drawImage(sourceImg, 0, 0, canvasW, canvasH);
      const splitX = Math.floor(canvasW / 2);

      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, canvasW - splitX, canvasH);
      ctx.clip();

      drawStitchesOnCtx(ctx, targetW, targetH, cellSize);

      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvasH);
      ctx.stroke();
    } else {
      // Stitches view
      drawStitchesOnCtx(ctx, targetW, targetH, cellSize);
    }
  }

  function drawStitchesOnCtx(
    ctx: CanvasRenderingContext2D,
    targetW: number,
    targetH: number,
    cellSize: number
  ) {
    if (!digitizeResult || !refImage) return;

    const originX = refImage.x;
    const originY = refImage.y;

    // Draw fabric backdrop in cell bounds
    ctx.fillStyle = '#F9F6EE';
    ctx.fillRect(0, 0, targetW * cellSize, targetH * cellSize);

    // Stitches
    for (const cell of digitizeResult.stitches) {
      const lx = cell.x - originX;
      const ly = cell.y - originY;
      if (lx >= 0 && lx < targetW && ly >= 0 && ly < targetH) {
        const px = lx * cellSize;
        const py = ly * cellSize;

        // Fabric cell
        ctx.fillStyle = cell.hex;
        ctx.fillRect(px, py, cellSize, cellSize);

        // Subtle cross-stitch cross symbol if cell is large enough
        if (cellSize >= 10) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 1, py + 1);
          ctx.lineTo(px + cellSize - 1, py + cellSize - 1);
          ctx.moveTo(px + cellSize - 1, py + 1);
          ctx.lineTo(px + 1, py + cellSize - 1);
          ctx.stroke();
        }

        // Cell border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }
  }

  function handleCanvasClick(e: MouseEvent) {
    if (!isPickingBgColor || !previewCanvas || !sourceImg) return;
    const rect = previewCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Sample from original image
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = previewCanvas.width;
    sampleCanvas.height = previewCanvas.height;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return;

    sCtx.drawImage(sourceImg, 0, 0, sampleCanvas.width, sampleCanvas.height);
    const pixel = sCtx.getImageData(Math.floor(clickX), Math.floor(clickY), 1, 1).data;

    const rHex = pixel[0].toString(16).padStart(2, '0');
    const gHex = pixel[1].toString(16).padStart(2, '0');
    const bHex = pixel[2].toString(16).padStart(2, '0');
    backgroundHex = `#${rHex}${gHex}${bHex}`.toUpperCase();
    ignoreBackground = true;
    isPickingBgColor = false;
    scheduleDigitize();
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
            <h2 id="digitizer-title" class="text-base font-bold text-white tracking-wide">Digitize Image into DMC Stitches</h2>
            <p class="text-xs text-gray-400">Transform "{sourceLayer?.name || 'Image'}" into standard cross-stitch chart</p>
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
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Preview Canvas</span>
            
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

          <!-- Preview Frame -->
          <div class="relative flex-1 min-h-[340px] max-h-[460px] bg-[#0E0E12] rounded-xl border border-gray-800 overflow-auto flex items-center justify-center p-4">
            {#if !isImageLoaded}
              <div class="flex flex-col items-center space-y-2 text-gray-500">
                <span class="animate-spin text-cyan-400">⏳</span>
                <span class="text-xs">Loading image...</span>
              </div>
            {:else}
              <canvas
                bind:this={previewCanvas}
                class="max-w-full max-h-full rounded shadow-xl object-contain {isPickingBgColor ? 'cursor-crosshair' : 'cursor-default'}"
                on:click={handleCanvasClick}
              ></canvas>
            {/if}

            {#if isPickingBgColor}
              <div class="absolute top-3 left-1/2 -translate-x-1/2 bg-cyan-900/90 border border-cyan-400 text-cyan-200 px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
                Click any pixel on preview to select background color
              </div>
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
                on:click={() => { previewZoom = Math.min(3, previewZoom + 0.25); renderPreview(); }}
                title="Zoom In Preview"
              >
                <ZoomIn size={14} />
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
                <span class="text-xs font-semibold text-gray-200 uppercase tracking-wider">DMC Thread Palette</span>
              </div>
              <span class="font-mono text-sm font-bold text-cyan-400">{maxColors} Colors</span>
            </div>

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
          </div>

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

          <!-- Section 5: Extracted DMC Palette Swatches -->
          {#if digitizeResult && digitizeResult.palette.length > 0}
            <div class="bg-[#121217] border border-gray-800 rounded-xl p-3 space-y-2">
              <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Matched DMC Floss</span>
                <span class="font-mono text-cyan-400">{digitizeResult.palette.length} Threads</span>
              </div>

              <div class="max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {#each digitizeResult.palette as thread}
                  <div class="flex items-center justify-between px-2 py-1 rounded bg-[#181820] text-xs">
                    <div class="flex items-center space-x-2">
                      <span
                        class="w-3.5 h-3.5 rounded-full border border-gray-600 shadow-sm flex-shrink-0"
                        style="background-color: {thread.hex};"
                      ></span>
                      <span class="font-mono font-bold text-gray-200">DMC {thread.code}</span>
                      <span class="text-gray-400 truncate max-w-[130px]">{thread.name}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
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
