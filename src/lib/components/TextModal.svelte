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
    DEFAULT_CURATED_FONTS,
    EXTENDED_FONTS,
    CURATED_FONTS,
    FONT_CATEGORIES,
    preloadAllCuratedFonts,
    loadGoogleFont,
    loadCustomFontFile,
    favoriteFontFamilies,
    toggleFavoriteFont,
    customUploadedFonts,
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
    ZoomOut,
    ChevronDown,
    Star,
    Upload,
    Search
  } from 'lucide-svelte';

  let text = 'Stitched with Love';
  let selectedFontFamily = DEFAULT_CURATED_FONTS[0].family;
  let customFontInput = '';
  let fontSize = 16;
  let rasterStrength = 50; // 10 (Fine / Delicate) to 90 (Chunky / Bold)
  let isBold = false;
  let isItalic = false;
  let alignment: 'left' | 'center' | 'right' = 'center';
  let chosenColorHex = $activeColor.hex || '#000000';
  let isFontLoading = false;
  let isFontDropdownOpen = false;
  let fontSearchQuery = '';
  let fileUploadInputEl: HTMLInputElement;

  // Preview Mode: 'stitched' shows actual pixelated DMC stitches; 'smooth' shows vector font
  let previewType: 'stitched' | 'smooth' = 'stitched';
  let previewCanvasEl: HTMLCanvasElement;
  let previewZoom = 1.0;

  // Threshold computed from rasterStrength: 10% -> 0.60 (delicate), 50% -> 0.35 (balanced default), 90% -> 0.15 (chunky bold)
  $: threshold = rasterStrength <= 50
    ? 0.35 + ((50 - rasterStrength) / 40) * 0.25
    : 0.35 - ((rasterStrength - 50) / 40) * 0.20;

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

        if (target.textData.threshold !== undefined) {
          const t = target.textData.threshold;
          if (t <= 0.35) {
            rasterStrength = Math.round(50 + ((0.35 - t) / 0.20) * 40);
          } else {
            rasterStrength = Math.round(50 - ((t - 0.35) / 0.25) * 40);
          }
          rasterStrength = Math.max(10, Math.min(90, rasterStrength));
        } else {
          rasterStrength = 50;
        }

        const match = CURATED_FONTS.find(f => f.family.toLowerCase() === target.textData?.fontFamily.toLowerCase())
          || $customUploadedFonts.find(f => f.family.toLowerCase() === target.textData?.fontFamily.toLowerCase());
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
      rasterStrength = 50;
    }
  }

  // Active family
  $: currentFamily = (selectedFontFamily === 'custom' ? customFontInput.trim() : selectedFontFamily) || DEFAULT_CURATED_FONTS[0].family;

  // Filtered and organized fonts for the dropdown
  $: filteredFonts = CURATED_FONTS.filter(f =>
    !fontSearchQuery ||
    f.name.toLowerCase().includes(fontSearchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(fontSearchQuery.toLowerCase())
  );
  $: pinnedFavorites = filteredFonts.filter(f => $favoriteFontFamilies.includes(f.family));
  $: otherFonts = filteredFonts.filter(f => !$favoriteFontFamilies.includes(f.family));

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

  // Re-render stitch preview when any parameter changes, including previewZoom and threshold
  $: if (
    previewCanvasEl &&
    previewType === 'stitched' &&
    (text || currentFamily || fontSize || isBold || isItalic || chosenColorHex || alignment || $fabricColor || $fontsReadyTrigger || previewZoom || threshold)
  ) {
    renderStitchPreview();
  }

  async function handleFontFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      try {
        const loadedName = await loadCustomFontFile(file);
        selectedFontFamily = loadedName;
        customFontInput = '';
        isFontDropdownOpen = false;
        renderStitchPreview();
      } catch (err) {
        console.error('Failed to load custom font:', err);
      }
    }
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

    // Fixed natural stitch cell size (11px * previewZoom).
    // Smaller font size = smaller stitch cells, fitting MORE text across the preview!
    const cellSize = Math.max(4, Math.round(11 * previewZoom));

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

    // Cutoff based on rasterStrength (10 to 90) -> threshold
    const thresholdAlpha = Math.round(threshold * 255);

    // Render stitches
    let stitchCount = 0;
    for (let y = 0; y < rH; y++) {
      for (let x = 0; x < rW; x++) {
        const idx = (y * rW + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha >= thresholdAlpha) {
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
        align: alignment,
        threshold
      });
    } else {
      addTextLayer({
        text,
        fontFamily: currentFamily,
        fontSize,
        color: chosenColorHex,
        bold: isBold,
        italic: isItalic,
        align: alignment,
        threshold
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
        align: alignment,
        threshold
      });
    } else {
      updateTextLayer(targetLayerId, {
        text,
        fontFamily: currentFamily,
        fontSize,
        color: chosenColorHex,
        bold: isBold,
        italic: isItalic,
        align: alignment,
        threshold
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

          <!-- Font Family Custom Dropdown with Real Typeface Previews -->
          <div class="relative">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Font Family
              </span>
              {#if isFontLoading}
                <span class="text-[11px] text-indigo-400 animate-pulse">Loading font...</span>
              {/if}
            </div>

            <!-- Custom Dropdown Trigger Button -->
            <button
              type="button"
              class="w-full bg-[#242432] hover:bg-[#2a2a3a] border border-gray-700 hover:border-indigo-500 rounded-xl px-3 py-2 text-left flex items-center justify-between transition-colors shadow-inner cursor-pointer"
              on:click={() => (isFontDropdownOpen = !isFontDropdownOpen)}
            >
              <div class="flex items-center space-x-2.5 truncate">
                <span class="text-xs font-medium text-white truncate">{currentFamily}</span>
                <span
                  class="text-xs text-indigo-300 opacity-90 truncate max-w-[140px]"
                  style="font-family: '{currentFamily}', sans-serif;"
                >
                  Aa Bb Cc 123
                </span>
              </div>
              <ChevronDown size={14} class="text-gray-400 flex-shrink-0 transition-transform {isFontDropdownOpen ? 'rotate-180' : ''}" />
            </button>

            <!-- Hidden File Input for Custom TTF/OTF Upload -->
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              class="hidden"
              bind:this={fileUploadInputEl}
              on:change={handleFontFileUpload}
            />

            <!-- Dropdown Menu Window -->
            {#if isFontDropdownOpen}
              <div
                class="absolute left-0 right-0 top-full mt-1.5 bg-[#1c1c26] border border-indigo-500/50 rounded-xl shadow-2xl p-2.5 z-50 text-xs max-h-80 overflow-y-auto space-y-2 animate-fadeIn"
              >
                <!-- Search & Upload Bar -->
                <div class="flex items-center space-x-1.5 pb-2 border-b border-gray-800">
                  <div class="relative flex-1">
                    <Search size={12} class="absolute left-2.5 top-2 text-gray-400" />
                    <input
                      type="text"
                      bind:value={fontSearchQuery}
                      placeholder="Filter fonts..."
                      class="w-full bg-[#272736] border border-gray-700 rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <button
                    type="button"
                    class="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer flex-shrink-0"
                    on:click={() => fileUploadInputEl?.click()}
                    title="Upload local .ttf, .otf, or .woff font"
                  >
                    <Upload size={11} />
                    <span>Upload Font</span>
                  </button>
                </div>

                <!-- 1. Pinned Favorites Section -->
                <div>
                  <div class="text-[10px] uppercase font-bold text-amber-400 px-1 py-1 flex items-center justify-between">
                    <div class="flex items-center space-x-1">
                      <Star size={11} class="fill-amber-400 text-amber-400" />
                      <span>Pinned Favorites ({pinnedFavorites.length})</span>
                    </div>
                  </div>
                  {#if pinnedFavorites.length === 0}
                    <div class="px-2 py-1.5 text-[11px] text-gray-500 italic">
                      No pinned fonts. Click the star on any font below to pin it here.
                    </div>
                  {:else}
                    <div class="space-y-1">
                      {#each pinnedFavorites as font}
                        <button
                          type="button"
                          class="w-full text-left group flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer {selectedFontFamily === font.family ? 'bg-indigo-600 text-white' : 'hover:bg-[#282838] text-gray-200'}"
                          on:click={() => { selectedFontFamily = font.family; isFontDropdownOpen = false; }}
                        >
                          <div class="flex items-center space-x-2 truncate">
                            <span
                              role="button"
                              tabindex="0"
                              class="text-amber-400 hover:text-amber-300 p-0.5 rounded cursor-pointer"
                              on:click|stopPropagation={() => toggleFavoriteFont(font.family)}
                              on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavoriteFont(font.family); } }}
                              title="Unpin from favorites"
                            >
                              <Star size={12} class="fill-amber-400 text-amber-400" />
                            </span>
                            <span class="font-medium text-xs">{font.name}</span>
                            <span class="text-[10px] px-1.5 py-0.2 rounded bg-black/30 text-gray-400 uppercase font-mono">
                              {font.category}
                            </span>
                          </div>
                          <span
                            class="text-sm font-normal text-right truncate max-w-[120px] opacity-90"
                            style="font-family: '{font.family}', sans-serif;"
                          >
                            {font.sampleText}
                          </span>
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>

                <!-- 2. User Uploaded Fonts (if any) -->
                {#if $customUploadedFonts.length > 0}
                  <div class="pt-1.5 border-t border-gray-800">
                    <div class="text-[10px] uppercase font-bold text-cyan-400 px-1 py-0.5">Uploaded Custom Fonts</div>
                    <div class="space-y-1">
                      {#each $customUploadedFonts as font}
                        <button
                          type="button"
                          class="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#282838] text-gray-200 cursor-pointer {selectedFontFamily === font.family ? 'bg-cyan-700/80 text-white' : ''}"
                          on:click={() => { selectedFontFamily = font.family; isFontDropdownOpen = false; }}
                        >
                          <span class="font-medium text-xs">{font.name}</span>
                          <span
                            class="text-sm font-normal text-right truncate max-w-[140px]"
                            style="font-family: '{font.family}', sans-serif;"
                          >
                            AaBb 123
                          </span>
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- 3. Browse More Google Fonts (Categorized / Pin to Favorites) -->
                <div class="pt-1.5 border-t border-gray-800">
                  <div class="text-[10px] uppercase font-bold text-gray-400 px-1 py-1 flex items-center justify-between">
                    <span>More Google Fonts ({otherFonts.length})</span>
                    <span class="text-[9px] text-gray-500 font-normal">Click star to pin</span>
                  </div>
                  <div class="space-y-1">
                    {#each otherFonts as font}
                      <button
                        type="button"
                        class="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#282838] text-gray-300 hover:text-white cursor-pointer {selectedFontFamily === font.family ? 'bg-indigo-600 text-white' : ''}"
                        on:click={() => { selectedFontFamily = font.family; isFontDropdownOpen = false; }}
                      >
                        <div class="flex items-center space-x-2 truncate">
                          <span
                            role="button"
                            tabindex="0"
                            class="text-gray-500 hover:text-amber-400 p-0.5 rounded cursor-pointer"
                            on:click|stopPropagation={() => toggleFavoriteFont(font.family)}
                            on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFavoriteFont(font.family); } }}
                            title="Pin to favorites"
                          >
                            <Star size={12} class="hover:fill-amber-400" />
                          </span>
                          <span class="text-xs">{font.name}</span>
                          <span class="text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-gray-400 uppercase font-mono">
                            {font.category}
                          </span>
                        </div>
                        <span
                          class="text-xs text-right truncate max-w-[120px] opacity-80"
                          style="font-family: '{font.family}', sans-serif;"
                        >
                          {font.sampleText}
                        </span>
                      </button>
                    {/each}
                  </div>
                </div>

                <!-- 4. Custom Google Font Name Input -->
                <div class="pt-2 border-t border-gray-800">
                  <div class="text-[10px] uppercase font-bold text-gray-400 px-1 mb-1">Custom Google Font</div>
                  <div class="flex items-center space-x-1.5">
                    <input
                      type="text"
                      bind:value={customFontInput}
                      placeholder="Type font name (e.g. Lobster, Pacifico)..."
                      class="flex-1 bg-[#272736] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                      on:click={() => {
                        if (customFontInput.trim()) {
                          selectedFontFamily = 'custom';
                          isFontDropdownOpen = false;
                        }
                      }}
                    >
                      Use
                    </button>
                  </div>
                </div>
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

          <!-- Stitch Thickness / Rasterization Weight Slider -->
          <div class="bg-[#20202c] border border-gray-800 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1.5">
                <span class="text-xs text-gray-300 font-medium">Stitch Thickness</span>
                <span class="text-[10px] text-gray-400">
                  {#if rasterStrength < 35}
                    (Fine / Delicate)
                  {:else if rasterStrength > 65}
                    (Chunky / Bold)
                  {:else}
                    (Balanced)
                  {/if}
                </span>
              </div>
              <span class="font-mono text-indigo-400 font-bold text-xs">{rasterStrength}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              bind:value={rasterStrength}
              class="w-full accent-indigo-500 cursor-pointer h-1.5 bg-gray-700 rounded"
            />
            <div class="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>Delicate / Thin</span>
              <span>Chunky / Bold</span>
            </div>
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
          <div class="flex-1 min-h-[300px] max-h-[440px] bg-[#0E0E14] border border-gray-800 rounded-xl overflow-auto p-4 relative shadow-inner flex">
            {#if previewType === 'stitched'}
              <div class="m-auto w-fit h-fit p-2">
                <canvas
                  bind:this={previewCanvasEl}
                  class="rounded border border-gray-700/60 shadow-2xl block"
                ></canvas>
              </div>
            {:else}
              <!-- Smooth Vector Font Preview -->
              <div class="m-auto text-center p-4 max-w-full">
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
