<script lang="ts">
  import {
    palette,
    selectedColorId,
    activeColor,
    layers,
    addColorToActivePalette,
    updatePaletteColorSymbol,
    activeThreadBrand,
    swapPaletteColor,
    convertProjectToBrand
  } from '../stores/editorStore';
  import { THREAD_BRANDS, THREAD_BRAND_LIST, type FlossThread, type ThreadBrand } from '../data/threadBrands';
  import { CHART_SYMBOLS } from '../data/dmcPalette';
  import type { PaletteColor } from '../types';
  import { Plus, Search, Sparkles, Edit3, X, ArrowLeftRight, Check, RefreshCw } from 'lucide-svelte';

  let showAddModal = false;
  let modalBrandId = $activeThreadBrand || 'dmc';
  let searchQuery = '';

  let swappingColor: PaletteColor | null = null;
  let swapBrandId = $activeThreadBrand || 'dmc';
  let swapSearchQuery = '';

  let showConvertModal = false;
  let targetConvertBrand = 'anchor';

  let editingSymbolColor: PaletteColor | null = null;
  let customSymbolInput = '';

  function openAddModal() {
    modalBrandId = $activeThreadBrand || 'dmc';
    searchQuery = '';
    showAddModal = true;
  }

  function openSwapModal(color: PaletteColor) {
    swappingColor = color;
    swapBrandId = color.brand || $activeThreadBrand || 'dmc';
    swapSearchQuery = '';
  }

  // Calculate live stitch counts per color across all visible layers
  $: stitchCounts = (() => {
    const counts: Record<number, number> = {};
    for (const layer of $layers) {
      if (layer.type === 'image') continue;
      for (const stitch of Object.values(layer.stitches)) {
        counts[stitch.colorId] = (counts[stitch.colorId] || 0) + 1;
      }
    }
    return counts;
  })();

  // Filter threads for Add modal
  $: currentAddBrand = THREAD_BRANDS[modalBrandId] || THREAD_BRANDS.dmc;
  $: filteredCatalog = (currentAddBrand?.threads || []).filter(entry => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return entry.code.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q);
  });

  // Filter threads for Swap modal
  $: currentSwapBrand = THREAD_BRANDS[swapBrandId] || THREAD_BRANDS.dmc;
  $: filteredSwapCatalog = (currentSwapBrand?.threads || []).filter(entry => {
    const q = swapSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return entry.code.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q);
  });

  function selectThreadToAdd(entry: FlossThread) {
    addColorToActivePalette(entry);
    showAddModal = false;
    searchQuery = '';
  }

  function selectThreadToSwap(entry: FlossThread) {
    if (!swappingColor) return;
    swapPaletteColor(swappingColor.id, entry);
    swappingColor = null;
    swapSearchQuery = '';
  }

  function executeConvert() {
    convertProjectToBrand(targetConvertBrand);
    activeThreadBrand.set(targetConvertBrand);
    showConvertModal = false;
  }

  function openSymbolEditor(color: PaletteColor) {
    editingSymbolColor = color;
    customSymbolInput = color.symbol;
  }

  function applySymbol(symbol: string) {
    if (!editingSymbolColor || !symbol.trim()) return;
    updatePaletteColorSymbol(editingSymbolColor.id, symbol.trim());
    editingSymbolColor = null;
  }
</script>

<div class="flex flex-col h-full bg-[#1e1e24] text-gray-200 select-none">
  <!-- Active Color Summary Card -->
  <div class="p-3 border-b border-[#2e2e38] bg-[#23232c] flex-shrink-0">
    <div class="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center justify-between">
      <span>Active Thread</span>
      <span class="text-indigo-400 text-[11px] font-mono">
        {($activeColor.brand || 'dmc').toUpperCase()} {$activeColor.dmc}
      </span>
    </div>
    <div class="flex items-center space-x-3 bg-[#18181f] p-2 rounded-lg border border-[#343442]">
      <!-- Swatch with symbol -->
      <button
        class="w-10 h-10 rounded-md border border-black/30 flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer"
        style="background-color: {$activeColor.hex}; color: {$activeColor.symbolColor || '#FFFFFF'};"
        on:click={() => openSymbolEditor($activeColor)}
        title="Click to edit chart symbol"
      >
        {$activeColor.symbol}
      </button>
      <div class="overflow-hidden flex-1">
        <div class="font-semibold text-sm truncate text-white">{$activeColor.name}</div>
        <div class="text-xs text-gray-400 font-mono flex items-center justify-between">
          <span>{$activeColor.hex}</span>
          <div class="flex items-center space-x-2">
            <button
              class="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5 cursor-pointer"
              on:click={() => openSymbolEditor($activeColor)}
              title="Edit symbol"
            >
              <Edit3 size={11} />
              <span>Symbol</span>
            </button>
            <button
              class="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-0.5 cursor-pointer"
              on:click={() => openSwapModal($activeColor)}
              title="Swap thread color across pattern"
            >
              <ArrowLeftRight size={11} />
              <span>Swap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reference Catalog Bar & Convert Button -->
  <div class="px-3 py-1.5 border-b border-[#2e2e38] bg-[#1a1a23] flex items-center justify-between text-xs flex-shrink-0">
    <div class="flex items-center space-x-1.5 min-w-0">
      <span class="text-gray-400 text-[11px] font-medium">Catalog:</span>
      <select
        bind:value={$activeThreadBrand}
        class="bg-[#262634] text-xs font-semibold text-gray-200 border border-gray-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
        title="Active Reference Thread Catalog"
      >
        {#each THREAD_BRAND_LIST as b}
          <option value={b.id}>{b.shortName} ({b.threadCount})</option>
        {/each}
      </select>
    </div>
    <button
      class="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center space-x-1 bg-indigo-950/40 hover:bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-800/40 transition-colors cursor-pointer"
      on:click={() => (showConvertModal = true)}
      title="Convert entire pattern to closest match in target brand"
    >
      <Sparkles size={11} />
      <span>Convert...</span>
    </button>
  </div>

  <!-- Palette Header -->
  <div class="px-3 py-2 border-b border-[#2e2e38] flex items-center justify-between bg-[#1f1f27] flex-shrink-0">
    <span class="text-xs font-bold text-gray-300 uppercase tracking-wide">
      Pattern Palette ({$palette.length})
    </span>
    <button
      class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center space-x-1 font-medium transition-colors cursor-pointer"
      on:click={openAddModal}
    >
      <Plus size={14} />
      <span>Add Thread</span>
    </button>
  </div>

  <!-- Swatch Grid -->
  <div class="flex-1 overflow-y-auto p-2.5 space-y-1 min-h-0">
    {#each $palette as color}
      <div
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer group
        {$selectedColorId === color.id
          ? 'bg-indigo-950/60 border-indigo-500/80 shadow-sm'
          : 'bg-[#25252e] border-transparent hover:bg-[#2c2c38] hover:border-gray-600'}"
        on:click={() => selectedColorId.set(color.id)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && selectedColorId.set(color.id)}
      >
        <div class="flex items-center space-x-2.5 min-w-0 flex-1">
          <!-- Clickable Symbol Box to Change Symbol -->
          <button
            class="w-6 h-6 rounded flex items-center justify-center font-bold text-xs border border-black/20 flex-shrink-0 shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer"
            style="background-color: {color.hex}; color: {color.symbolColor || '#FFFFFF'};"
            on:click|stopPropagation={() => openSymbolEditor(color)}
            title="Click to edit symbol"
          >
            {color.symbol}
          </button>
          <div class="truncate">
            <span class="text-xs font-semibold text-gray-200">
              {(color.brand || 'dmc').toUpperCase()} {color.dmc}
            </span>
            <span class="text-[11px] text-gray-400 ml-1 truncate">({color.name})</span>
          </div>
        </div>

        <div class="flex items-center space-x-1.5 flex-shrink-0">
          <span class="text-[11px] font-mono text-gray-400 bg-[#191920] px-1.5 py-0.5 rounded border border-[#31313d]">
            {stitchCounts[color.id] || 0} st
          </span>
          <button
            class="p-1 rounded text-gray-400 hover:text-amber-300 hover:bg-[#343444] transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
            on:click|stopPropagation={() => openSwapModal(color)}
            title="Swap thread color across pattern"
          >
            <ArrowLeftRight size={13} />
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Add Thread Catalog Search Modal -->
{#if showAddModal}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Sparkles class="text-indigo-400" size={18} />
          <div>
            <h3 class="font-bold text-white text-sm">Add Thread Color</h3>
            <span class="text-[11px] text-gray-400 font-mono">{currentAddBrand.name} ({currentAddBrand.threadCount} colors)</span>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => (showAddModal = false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Brand Selector Tabs -->
      <div class="flex border-b border-gray-800 bg-[#1b1b24] px-3 pt-2 space-x-1 overflow-x-auto">
        {#each THREAD_BRAND_LIST as brand}
          <button
            class="px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors whitespace-nowrap
            {modalBrandId === brand.id
              ? 'border-indigo-500 text-white bg-[#252532]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#20202c]'}"
            on:click={() => (modalBrandId = brand.id)}
          >
            {brand.shortName} <span class="text-[10px] opacity-60">({brand.threadCount})</span>
          </button>
        {/each}
      </div>

      <!-- Search Input -->
      <div class="p-3 border-b border-gray-800 bg-[#1c1c24]">
        <div class="relative">
          <Search class="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder={`Search ${currentAddBrand.shortName} by # or name...`}
            class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div class="mt-1 text-[11px] text-gray-400 flex justify-between px-1">
          <span>Showing {filteredCatalog.length} matching colors</span>
          {#if searchQuery}
            <button class="text-indigo-400 hover:underline" on:click={() => (searchQuery = '')}>Clear search</button>
          {/if}
        </div>
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
        {#each filteredCatalog as entry}
          <button
            class="w-full flex items-center justify-between p-2 rounded-lg bg-[#252530] hover:bg-[#30303e] border border-[#333342] transition-colors cursor-pointer text-left"
            on:click={() => selectThreadToAdd(entry)}
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-7 h-7 rounded border border-black/30 shadow-sm flex-shrink-0"
                style="background-color: {entry.hex};"
              ></div>
              <div>
                <div class="text-xs font-bold text-white">{currentAddBrand.shortName} {entry.code}</div>
                <div class="text-[11px] text-gray-400">{entry.name}</div>
              </div>
            </div>
            <div class="text-xs font-mono text-gray-400">{entry.hex}</div>
          </button>
        {/each}

        {#if filteredCatalog.length === 0}
          <div class="py-8 text-center text-xs text-gray-500">
            No {currentAddBrand.shortName} colors matched "{searchQuery}".
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Swap Thread Color Modal -->
{#if swappingColor}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2.5">
          <ArrowLeftRight class="text-amber-400" size={18} />
          <div>
            <h3 class="font-bold text-white text-sm">Swap Thread Color</h3>
            <span class="text-[11px] text-gray-400">Replaces color across pattern stitches</span>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => (swappingColor = null)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Current Thread Banner -->
      <div class="px-4 py-2.5 bg-amber-950/30 border-b border-amber-900/40 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div
            class="w-7 h-7 rounded border border-black/40 flex items-center justify-center font-bold text-xs shadow-sm"
            style="background-color: {swappingColor.hex}; color: {swappingColor.symbolColor || '#FFFFFF'};"
          >
            {swappingColor.symbol}
          </div>
          <div>
            <div class="text-xs font-bold text-amber-200">
              Current: {(swappingColor.brand || 'dmc').toUpperCase()} {swappingColor.dmc} &bull; {swappingColor.name}
            </div>
            <div class="text-[11px] text-amber-400/80 font-mono">
              Used in {stitchCounts[swappingColor.id] || 0} stitches
            </div>
          </div>
        </div>
        <span class="text-[11px] font-medium bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50">
          Replacing
        </span>
      </div>

      <!-- Brand Selector Tabs -->
      <div class="flex border-b border-gray-800 bg-[#1b1b24] px-3 pt-2 space-x-1 overflow-x-auto">
        {#each THREAD_BRAND_LIST as brand}
          <button
            class="px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors whitespace-nowrap
            {swapBrandId === brand.id
              ? 'border-amber-500 text-white bg-[#252532]'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#20202c]'}"
            on:click={() => (swapBrandId = brand.id)}
          >
            {brand.shortName} <span class="text-[10px] opacity-60">({brand.threadCount})</span>
          </button>
        {/each}
      </div>

      <!-- Search Input -->
      <div class="p-3 border-b border-gray-800 bg-[#1c1c24]">
        <div class="relative">
          <Search class="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            bind:value={swapSearchQuery}
            placeholder={`Choose replacement in ${currentSwapBrand.shortName}...`}
            class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto p-3 space-y-1.5">
        {#each filteredSwapCatalog as entry}
          <button
            class="w-full flex items-center justify-between p-2 rounded-lg bg-[#252530] hover:bg-[#30303e] border border-[#333342] hover:border-amber-500/60 transition-colors cursor-pointer text-left"
            on:click={() => selectThreadToSwap(entry)}
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-7 h-7 rounded border border-black/30 shadow-sm flex-shrink-0"
                style="background-color: {entry.hex};"
              ></div>
              <div>
                <div class="text-xs font-bold text-white">{currentSwapBrand.shortName} {entry.code}</div>
                <div class="text-[11px] text-gray-400">{entry.name}</div>
              </div>
            </div>
            <span class="text-xs text-amber-400 font-medium">Select Swap &rarr;</span>
          </button>
        {/each}

        {#if filteredSwapCatalog.length === 0}
          <div class="py-8 text-center text-xs text-gray-500">
            No {currentSwapBrand.shortName} colors matched "{swapSearchQuery}".
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Convert Pattern Brand Modal -->
{#if showConvertModal}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Sparkles class="text-indigo-400" size={18} />
          <h3 class="font-bold text-white text-sm">Convert Pattern Thread Brand</h3>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => (showConvertModal = false)}
        >
          <X size={18} />
        </button>
      </div>

      <div class="p-4 space-y-4 text-xs">
        <div>
          <label for="target-brand-select" class="block text-gray-400 font-medium mb-1.5">Target Thread Catalog:</label>
          <select
            id="target-brand-select"
            bind:value={targetConvertBrand}
            class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
          >
            {#each THREAD_BRAND_LIST as b}
              <option value={b.id}>{b.name} &bull; {b.threadCount} shades ({b.manufacturer})</option>
            {/each}
          </select>
        </div>

        <div class="bg-[#181822] p-3 rounded-lg border border-[#303040] space-y-1.5 text-gray-300">
          <p class="font-medium text-white">How this works:</p>
          <p class="text-[11px] leading-relaxed">
            Every color in your current palette ({$palette.length} colors) will be replaced with its closest perceptual match (CIE ΔE 2000) in the chosen target standard.
          </p>
          <p class="text-[11px] text-indigo-400 font-semibold">
            All stitches on canvas will be converted automatically. This action can be undone with Cmd+Z.
          </p>
        </div>
      </div>

      <div class="p-3 bg-[#191922] border-t border-gray-800 flex justify-end space-x-2">
        <button
          class="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-[#282834] text-xs font-medium transition-colors"
          on:click={() => (showConvertModal = false)}
        >
          Cancel
        </button>
        <button
          class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
          on:click={executeConvert}
        >
          <Check size={14} />
          <span>Convert All Colors</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Symbol Selector Modal -->
{#if editingSymbolColor}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2.5">
          <div
            class="w-6 h-6 rounded border border-black/40 flex items-center justify-center font-bold text-xs"
            style="background-color: {editingSymbolColor.hex}; color: {editingSymbolColor.symbolColor || '#FFFFFF'};"
          >
            {editingSymbolColor.symbol}
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">Choose Chart Symbol</h3>
            <span class="text-[11px] text-gray-400 font-mono">
              {(editingSymbolColor.brand || 'dmc').toUpperCase()} {editingSymbolColor.dmc} &bull; {editingSymbolColor.name}
            </span>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => (editingSymbolColor = null)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Custom Symbol Input -->
      <div class="p-3 border-b border-gray-800 bg-[#1c1c24] flex items-center space-x-2">
        <span class="text-xs text-gray-400 font-medium">Custom symbol:</span>
        <input
          type="text"
          maxlength="2"
          bind:value={customSymbolInput}
          class="w-16 bg-[#2a2a36] border border-gray-700 rounded px-2 py-1 text-center font-bold text-white text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1 rounded font-medium transition-colors"
          on:click={() => applySymbol(customSymbolInput)}
        >
          Set
        </button>
      </div>

      <!-- Standard Symbols Grid -->
      <div class="p-4 overflow-y-auto">
        <div class="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
          Standard Symbols
        </div>
        <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {#each CHART_SYMBOLS as sym}
            <button
              class="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold transition-all border
              {editingSymbolColor.symbol === sym
                ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-400/50'
                : 'bg-[#282834] border-[#363646] text-gray-200 hover:bg-indigo-950/70 hover:border-indigo-500'}"
              on:click={() => applySymbol(sym)}
              title="Select symbol {sym}"
            >
              {sym}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
