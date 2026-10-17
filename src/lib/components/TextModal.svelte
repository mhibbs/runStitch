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
    grid
  } from '../stores/editorStore';
  import {
    CURATED_FONTS,
    FONT_CATEGORIES,
    loadGoogleFont,
    measureTextDimensions,
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
    Search,
    Layers
  } from 'lucide-svelte';

  let text = 'Stitched with Love';
  let selectedCategory: string = 'all';
  let selectedFont: CuratedFont = CURATED_FONTS[0];
  let customFontInput = '';
  let fontSize = 16;
  let isBold = false;
  let isItalic = false;
  let alignment: 'left' | 'center' | 'right' = 'center';
  let chosenColorHex = $activeColor.hex || '#000000';
  let isFontLoading = false;

  // React to modal opening or editing target change
  $: if ($isTextModalOpen) {
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
          selectedFont = match;
          customFontInput = '';
        } else {
          customFontInput = target.textData.fontFamily;
        }
      }
    } else {
      // New text default
      chosenColorHex = $activeColor.hex;
    }
  }

  // Load font when selected
  $: currentFamily = customFontInput.trim() || selectedFont.family;
  $: {
    if (currentFamily) {
      isFontLoading = true;
      loadGoogleFont(currentFamily).then(() => {
        isFontLoading = false;
      });
    }
  }

  // Filter fonts by category
  $: displayedFonts = selectedCategory === 'all'
    ? CURATED_FONTS
    : CURATED_FONTS.filter(f => f.category === selectedCategory);

  // Live calculated dimensions
  $: dimensions = measureTextDimensions(text, currentFamily, fontSize, isBold, isItalic);
  $: inchWidth = (dimensions.width / $grid.fabricCount).toFixed(1);
  $: inchHeight = (dimensions.height / $grid.fabricCount).toFixed(1);

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
            <p class="text-xs text-gray-400">Google Fonts & Yarndings crafting glyphs with automatic stitch rasterization</p>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          on:click={closeTextModal}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Modal Body (Two-column layout) -->
      <div class="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        <!-- Left: Text Input & Font Picker (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Text Input Area -->
          <div>
            <label for="text-input" class="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Text Content
            </label>
            <textarea
              id="text-input"
              bind:value={text}
              rows="3"
              placeholder="Enter letters, sampler text, or craft characters..."
              class="w-full bg-[#242432] border border-gray-700 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-sans shadow-inner resize-y"
            ></textarea>
          </div>

          <!-- Font Category Filter Tabs -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Font Family</span>
              <span class="text-[11px] text-indigo-400">{displayedFonts.length} curated fonts</span>
            </div>
            
            <div class="flex border-b border-gray-800 bg-[#14141c] rounded-t-lg p-1 space-x-1 overflow-x-auto text-xs">
              <button
                class="px-2.5 py-1 rounded transition-colors whitespace-nowrap {selectedCategory === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => (selectedCategory = 'all')}
              >
                All
              </button>
              {#each FONT_CATEGORIES as cat}
                <button
                  class="px-2.5 py-1 rounded transition-colors whitespace-nowrap {selectedCategory === cat.id ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
                  on:click={() => (selectedCategory = cat.id)}
                >
                  {cat.label}
                </button>
              {/each}
            </div>

            <!-- Font Cards Grid -->
            <div class="max-h-48 overflow-y-auto bg-[#1a1a24] border border-gray-800 rounded-b-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {#each displayedFonts as font}
                <button
                  type="button"
                  class="p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between
                  {currentFamily === font.family
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-[#22222e] border-gray-800/80 text-gray-300 hover:bg-[#2a2a3a] hover:border-gray-700'}"
                  on:click={() => {
                    selectedFont = font;
                    customFontInput = '';
                    if (!text || text === 'Stitched with Love') {
                      // Adapt sample if switching to Yarndings craft font
                      if (font.category === 'craft') text = font.sampleText;
                    }
                  }}
                >
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-xs truncate">{font.name}</span>
                    <span class="text-[10px] text-gray-400 uppercase font-mono">{font.category}</span>
                  </div>
                  <div
                    class="text-sm truncate mt-1 text-gray-200"
                    style="font-family: '{font.family}', sans-serif;"
                  >
                    {font.sampleText}
                  </div>
                </button>
              {/each}
            </div>

            <!-- Custom Font Override -->
            <div class="mt-2 flex items-center space-x-2">
              <span class="text-xs text-gray-400 whitespace-nowrap">Custom Font:</span>
              <input
                type="text"
                bind:value={customFontInput}
                placeholder="Type any Google Font (e.g. Lobster, Orbitron, Pacifico)..."
                class="w-full bg-[#242432] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <!-- Right: Formatting Controls & Live Preview (5 cols) -->
        <div class="lg:col-span-5 flex flex-col space-y-4">
          <!-- Controls Panel -->
          <div class="bg-[#20202c] border border-gray-800 rounded-xl p-3.5 space-y-3.5 text-xs">
            <!-- Font Size -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-gray-300 font-medium">Font Size (Stitch Height)</span>
                <span class="font-mono text-indigo-400 font-bold">{fontSize} stitches</span>
              </div>
              <input
                type="range"
                min="8"
                max="48"
                bind:value={fontSize}
                class="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <!-- Style & Alignment Row -->
            <div class="flex items-center justify-between pt-1 border-t border-gray-800">
              <!-- Bold / Italic -->
              <div class="flex items-center space-x-1 bg-[#161620] p-1 rounded-lg border border-gray-700/60">
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
              <div class="flex items-center space-x-1 bg-[#161620] p-1 rounded-lg border border-gray-700/60">
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

            <!-- Color Palette Swatch Picker -->
            <div class="pt-1 border-t border-gray-800">
              <span class="text-gray-300 font-medium block mb-1.5">Thread Color:</span>
              <div class="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
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

          <!-- Live Preview Box -->
          <div class="flex-1 min-h-[160px] bg-[#0E0E14] border border-gray-800 rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-inner relative">
            <div class="text-[11px] uppercase font-bold text-gray-500 tracking-wider flex items-center justify-between">
              <span>Preview</span>
              {#if isFontLoading}
                <span class="text-indigo-400 animate-pulse text-[10px]">Loading font...</span>
              {:else}
                <span class="text-gray-400 font-mono text-[10px]">{currentFamily}</span>
              {/if}
            </div>

            <!-- Centered preview text -->
            <div class="my-auto py-2 text-center overflow-x-auto">
              <div
                class="inline-block transition-all"
                style="
                  font-family: '{currentFamily}', sans-serif;
                  font-size: {Math.max(12, Math.min(36, fontSize * 1.5))}px;
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

            <!-- Bounding Dimensions Info -->
            <div class="text-[11px] font-mono text-gray-400 bg-[#161622] px-2.5 py-1 rounded-md border border-gray-800 flex items-center justify-between">
              <span>Grid: {dimensions.width}×{dimensions.height} st</span>
              <span>Size: {inchWidth}″ × {inchHeight}″</span>
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
            class="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            on:click={handleQuickDigitize}
            title="Convert directly into cross-stitches with active thread"
          >
            <Sparkles size={14} />
            <span>Digitize to Stitches</span>
          </button>

          <!-- Place as Text Layer -->
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
