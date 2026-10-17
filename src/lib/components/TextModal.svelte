<script lang="ts">
  import { onMount } from 'svelte';
  import {
    isTextModalOpen,
    editingTextLayerId,
    closeTextModal,
    addTextLayer,
    updateTextLayer,
    quickDigitizeTextLayer,
    layers,
    palette,
    activeColor,
    grid,
    fabricColor
  } from '../stores/editorStore';
  import {
    CURATED_FONTS,
    FONT_CATEGORIES,
    preloadAllCuratedFonts,
    loadGoogleFont,
    measureTextDimensions,
    rasterizeTextLayer,
    fontsReadyTrigger,
    type CuratedFont
  } from '../data/fontCatalog';
  import {
    Type,
    X,
    Check,
    Sparkles,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ZoomIn,
    ZoomOut
  } from 'lucide-svelte';

  let text = 'Stitched with Love';
  let selectedFontFamily = CURATED_FONTS[0].family;
  let customFontInput = '';
  let fontSize = 16;
  let isBold = false;
  let isItalic = false;
  let alignment: 'left' | 'center' | 'right' = 'center';
  let chosenColorHex = $activeColor.hex || '#000000';
  let isFontLoading = false;

  // Preview Mode: 'stitched' shows actual pixelated DMC stitches; 'smooth' shows vector font
  let previewType: 'stitched' | 'smooth' = 'stitched';
  let previewCanvasEl: HTMLCanvasElement;
  let previewZoom = 1.0;

  onMount(() => {
    preloadAllCuratedFonts();
  });

  // React to modal opening or editing target change
  $: if ($isTextModalOpen) {
    preloadAllCuratedFonts();
    if ($editingTextLayerId) {
      const target = $layers.find(l => l.id === $editingTextLayerId);
      if (target && target.type === 'text' && target.textData) {
        text = target.textData.text;
        fontSize = target.textData.fontSize;
        isBold = !!target.textData.bold;
        isItalic = !!target.textData.italic;
        alignment = target.textData.align || 'center';
        chosenColorHex = target.textData.color;

        const match = CURATED_FONTS.find(f => f.family.toLowerCase() === target.textData?.fontFamily.toLowerCase());
        if (match) {
          selectedFontFamily = match.family;
          customFontInput = '';
        } else {
          selectedFontFamily = 'custom';
          customFontInput = target.textData.fontFamily;
        }
      }
    } else {
      chosenColorHex = $activeColor.hex;
    }
  }

  // Active family
  $: currentFamily = (selectedFontFamily === 'custom' ? customFontInput.trim() : selectedFontFamily) || CURATED_FONTS[0].family;

  // Load font dynamically if custom or not yet cached
  $: {
    if (currentFamily) {
      isFontLoading = true;
      loadGoogleFont(currentFamily).then(() => {
        isFontLoading = false;
        renderStitchPreview();
      });
    }
  }

  // Live calculated dimensions
  $: dimensions = measureTextDimensions(text, currentFamily, fontSize, isBold, isItalic);
  $: inchWidth = (dimensions.width / $grid.fabricCount).toFixed(1);
  $: inchHeight = (dimensions.height / $grid.fabricCount).toFixed(1);

  // Re-render stitch preview when any parameter changes
  $: if (
    previewCanvasEl &&
    previewType === 'stitched' &&
    (text || currentFamily || fontSize || isBold || isItalic || chosenColorHex || alignment || $fabricColor || $fontsReadyTrigger)
  ) {
    renderStitchPreview();
  }

  function renderStitchPreview() {
    if (!previewCanvasEl) return;
    const ctx = previewCanvasEl.getContext('2d');
    if (!ctx) return;

    const raster = rasterizeTextLayer(
      text,
      currentFamily,
      fontSize,
      '#000000',
      isBold,
      isItalic,
      alignment
    );

    const rW = raster.width;
    const rH = raster.height;
    const rCtx = raster.getContext('2d');
    if (!rCtx) return;

    const imgData = rCtx.getImageData(0, 0, rW, rH).data;

    // Determine scale for display cells (e.g. 8px - 14px per stitch cell)
    const baseCell = Math.max(7, Math.min(16, Math.floor(220 / Math.max(rH, 1))));
    const cellSize = Math.round(baseCell * previewZoom);

    previewCanvasEl.width = rW * cellSize;
    previewCanvasEl.height = rH * cellSize;

    // Background cloth
    ctx.fillStyle = $fabricColor || '#F9F6EE';
    ctx.fillRect(0, 0, previewCanvasEl.width, previewCanvasEl.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= rW; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, rH * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= rH; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(rW * cellSize, y * cellSize);
      ctx.stroke();
    }

    // Render stitches
    let stitchCount = 0;
    for (let y = 0; y < rH; y++) {
      for (let x = 0; x < rW; x++) {
        const idx = (y * rW + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha > 70) {
          stitchCount++;
          const px = x * cellSize;
          const py = y * cellSize;

          // Stitch block
          ctx.fillStyle = chosenColorHex;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

          // Subtle cross lines if cell size permits
          if (cellSize >= 8) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 2, py + 2);
            ctx.lineTo(px + cellSize - 2, py + cellSize - 2);
            ctx.moveTo(px + cellSize - 2, py + 2);
            ctx.lineTo(px + 2, py + cellSize - 2);
            ctx.stroke();
          }
        }
      }
    }
  }

  function handleSaveTextLayer() {
    if (!text.trim()) return;

    if ($editingTextLayerId) {
      updateTextLayer($editingTextLayerId, {
        text,
        fontFamily: currentFamily,
        fontSize,
        color: chosenColorHex,
        bold: isBold,
        italic: isItalic,
        align: alignment
      });
    } else {
      addTextLayer({
        text,
        fontFamily: currentFamily,
        fontSize,
        color: chosenColorHex,
        bold: isBold,
        italic: isItalic,
        align: alignment
      });
    }

    closeTextModal();
  }

  function handleQuickDigitize() {
    if (!text.trim()) return;

    let targetLayerId = $editingTextLayerId;
    if (!targetLayerId) {
      targetLayerId = addTextLayer({
        text,
        fontFamily: currentFamily,
        fontSize,
        color: chosenColorHex,
        bold: isBold,
        italic: isItalic,
        align: alignment
      });
    } else {
      updateTextLayer(targetLayerId, {
        text,
        fontFamily: currentFamily,
        fontSize,
        color: chosenColorHex,
        bold: isBold,
        italic: isItalic,
        align: alignment
      });
    }

    quickDigitizeTextLayer(targetLayerId);
    closeTextModal();
  }
</script>

{#if $isTextModalOpen}
  <div class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
    <div class="bg-[#181820] border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-gray-200">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1f1f2a]">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Type size={18} />
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">
              {$editingTextLayerId ? 'Edit Text Layer' : 'Add Cross-Stitch Typography'}
            </h3>
            <p class="text-xs text-gray-400">Google Fonts & Yarndings crafting glyphs with live cross-stitch pixel preview</p>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          on:click={closeTextModal}
          title="Close Dialog"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Modal Body (Two-column layout) -->
      <div class="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        <!-- Left: Text Input & Typography Controls (5 cols) -->
        <div class="lg:col-span-5 space-y-4 flex flex-col">
          <!-- Text Input Area -->
          <div>
            <label for="text-input" class="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Text Content
            </label>
            <textarea
              id="text-input"
              bind:value={text}
              rows="3"
              placeholder="Enter lettering or craft glyphs..."
              class="w-full bg-[#242432] border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-sans shadow-inner resize-y"
            ></textarea>
          </div>

          <!-- Font Family Dropdown -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="font-select" class="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Font Family
              </label>
              {#if isFontLoading}
                <span class="text-[11px] text-indigo-400 animate-pulse">Loading font...</span>
              {/if}
            </div>

            <select
              id="font-select"
              bind:value={selectedFontFamily}
              class="w-full bg-[#242432] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              {#each FONT_CATEGORIES as category}
                <optgroup label="── {category.label} ──">
                  {#each CURATED_FONTS.filter(f => f.category === category.id) as font}
                    <option value={font.family}>
                      {font.name} ({font.description})
                    </option>
                  {/each}
                </optgroup>
              {/each}
              <optgroup label="── Custom ──">
                <option value="custom">Custom Google Font...</option>
              </optgroup>
            </select>

            <!-- Custom Font Input (if selected or typed) -->
            {#if selectedFontFamily === 'custom'}
              <div class="mt-2">
                <input
                  type="text"
                  bind:value={customFontInput}
                  placeholder="Type any Google Font (e.g. Lobster, Orbitron, Pacifico)..."
                  class="w-full bg-[#1e1e28] border border-indigo-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 shadow-inner"
                />
              </div>
            {/if}
          </div>

          <!-- Font Size (Stitches Height) -->
          <div class="bg-[#20202c] border border-gray-800 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-300 font-medium">Font Size (Stitch Height)</span>
              <span class="font-mono text-indigo-400 font-bold text-xs">{fontSize} stitches</span>
            </div>
            <input
              type="range"
              min="7"
              max="48"
              bind:value={fontSize}
              class="w-full accent-indigo-500 cursor-pointer h-1.5 bg-gray-700 rounded"
            />
          </div>

          <!-- Style & Alignment Row -->
          <div class="flex items-center justify-between">
            <!-- Bold / Italic -->
            <div class="flex items-center space-x-1 bg-[#1a1a24] p-1 rounded-lg border border-gray-700/60">
              <button
                type="button"
                class="p-1.5 rounded transition-colors {isBold ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}"
                on:click={() => (isBold = !isBold)}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                class="p-1.5 rounded transition-colors {isItalic ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}"
                on:click={() => (isItalic = !isItalic)}
                title="Italic"
              >
                <Italic size={13} />
              </button>
            </div>

            <!-- Alignment -->
            <div class="flex items-center space-x-1 bg-[#1a1a24] p-1 rounded-lg border border-gray-700/60">
              <button
                type="button"
                class="p-1.5 rounded transition-colors {alignment === 'left' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}"
                on:click={() => (alignment = 'left')}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                class="p-1.5 rounded transition-colors {alignment === 'center' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}"
                on:click={() => (alignment = 'center')}
                title="Align Center"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                class="p-1.5 rounded transition-colors {alignment === 'right' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}"
                on:click={() => (alignment = 'right')}
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
            </div>
          </div>

          <!-- Thread Color Palette Swatch Picker -->
          <div class="bg-[#20202c] border border-gray-800 rounded-xl p-3">
            <span class="text-xs text-gray-300 font-medium block mb-1.5">Thread Color:</span>
            <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {#each $palette as color}
                <button
                  type="button"
                  class="w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-bold shadow-sm transition-transform hover:scale-110 cursor-pointer
                  {chosenColorHex.toLowerCase() === color.hex.toLowerCase()
                    ? 'ring-2 ring-indigo-400 border-white scale-105'
                    : 'border-black/30 opacity-85 hover:opacity-100'}"
                  style="background-color: {color.hex}; color: {color.symbolColor || '#FFFFFF'};"
                  on:click={() => (chosenColorHex = color.hex)}
                  title="{color.name} (DMC {color.dmc})"
                >
                  {color.symbol}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Right: Live Digitized Stitches & Typography Preview (7 cols) -->
        <div class="lg:col-span-7 flex flex-col space-y-3">
          <!-- Preview Header & Mode Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Preview</span>
              <span class="text-[11px] font-mono text-indigo-400">
                {currentFamily}
              </span>
            </div>

            <!-- View Switcher & Zoom Controls -->
            <div class="flex items-center space-x-2">
              <div class="flex items-center space-x-1 bg-[#121216] p-0.5 rounded-lg border border-gray-800 text-xs">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded transition-colors cursor-pointer {previewType === 'stitched' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                  on:click={() => (previewType = 'stitched')}
                  title="Show actual pixelated cross-stitch chart"
                >
                  Stitched (Grid)
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded transition-colors cursor-pointer {previewType === 'smooth' ? 'bg-indigo-600 text-white font-medium shadow' : 'text-gray-400 hover:text-gray-200'}"
                  on:click={() => (previewType = 'smooth')}
                  title="Show smooth vector font preview"
                >
                  Smooth
                </button>
              </div>

              {#if previewType === 'stitched'}
                <div class="flex items-center space-x-1 bg-[#121216] p-0.5 rounded-lg border border-gray-800 text-xs text-gray-400">
                  <button
                    type="button"
                    class="p-1 hover:text-white rounded hover:bg-gray-800 transition-colors cursor-pointer"
                    on:click={() => (previewZoom = Math.max(0.5, previewZoom - 0.25))}
                    title="Zoom Out"
                  >
                    <ZoomOut size={12} />
                  </button>
                  <span class="font-mono text-[10px] w-8 text-center">{Math.round(previewZoom * 100)}%</span>
                  <button
                    type="button"
                    class="p-1 hover:text-white rounded hover:bg-gray-800 transition-colors cursor-pointer"
                    on:click={() => (previewZoom = Math.min(2.5, previewZoom + 0.25))}
                    title="Zoom In"
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>
              {/if}
            </div>
          </div>

          <!-- Preview Frame -->
          <div class="flex-1 min-h-[300px] max-h-[440px] bg-[#0E0E14] border border-gray-800 rounded-xl overflow-auto p-4 flex items-center justify-center relative shadow-inner">
            {#if previewType === 'stitched'}
              <div class="overflow-auto max-w-full max-h-full flex items-center justify-center p-2">
                <canvas
                  bind:this={previewCanvasEl}
                  class="rounded border border-gray-700/60 shadow-2xl"
                ></canvas>
              </div>
            {:else}
              <!-- Smooth Vector Font Preview -->
              <div class="text-center overflow-auto max-w-full p-4">
                <div
                  class="inline-block transition-all"
                  style="
                    font-family: '{currentFamily}', sans-serif;
                    font-size: {Math.max(14, Math.min(48, fontSize * 1.6))}px;
                    color: {chosenColorHex};
                    font-weight: {isBold ? 'bold' : 'normal'};
                    font-style: {isItalic ? 'italic' : 'normal'};
                    text-align: {alignment};
                    white-space: pre-line;
                    line-height: 1.25;
                  "
                >
                  {text || 'Sample Text'}
                </div>
              </div>
            {/if}
          </div>

          <!-- Dimension & Scale Status Card -->
          <div class="bg-[#1a1a24] border border-gray-800 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs font-mono text-gray-300">
            <div>
              Grid Bounds: <strong class="text-indigo-400 font-bold">{dimensions.width}×{dimensions.height} stitches</strong>
            </div>
            <div class="text-gray-400">
              Fabric Size: <strong class="text-gray-200">{inchWidth}″ × {inchHeight}″</strong> (@ {$grid.fabricCount} count)
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-4 bg-[#1b1b26] border-t border-gray-800 flex items-center justify-between">
        <button
          type="button"
          class="px-3.5 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-[#282838] text-xs font-medium transition-colors cursor-pointer"
          on:click={closeTextModal}
        >
          Cancel
        </button>

        <div class="flex items-center space-x-2">
          <!-- 1-Click Digitize -->
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            on:click={handleQuickDigitize}
            title="Convert directly into cross-stitches with active thread"
          >
            <Sparkles size={14} />
            <span>Digitize to Stitches</span>
          </button>

          <!-- Place as Editable Text Layer -->
          <button
            type="button"
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            on:click={handleSaveTextLayer}
          >
            <Check size={14} />
            <span>{$editingTextLayerId ? 'Update Text Layer' : 'Place Text Layer'}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
