<script lang="ts">
  import {
    palette,
    selectedColorId,
    activeColor,
    layers,
    addColorToActivePalette,
    updatePaletteColorSymbol
  } from '../stores/editorStore';
  import { DMC_CATALOG, CHART_SYMBOLS, type DMCEntry } from '../data/dmcPalette';
  import type { PaletteColor } from '../types';
  import { Plus, Search, Sparkles, Tag, Edit3, X } from 'lucide-svelte';

  let showDmcModal = false;
  let searchQuery = '';
  let editingSymbolColor: PaletteColor | null = null;
  let customSymbolInput = '';

  // Calculate live stitch counts per color across all visible layers
  $: stitchCounts = (() => {
    const counts: Record<number, number> = {};
    for (const layer of $layers) {
      for (const stitch of Object.values(layer.stitches)) {
        counts[stitch.colorId] = (counts[stitch.colorId] || 0) + 1;
      }
    }
    return counts;
  })();

  // Filter DMC catalog for modal search
  $: filteredCatalog = DMC_CATALOG.filter(entry => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return entry.code.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q);
  });

  function selectDmc(entry: DMCEntry) {
    addColorToActivePalette(entry);
    showDmcModal = false;
    searchQuery = '';
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
      <span class="text-indigo-400 text-[11px] font-mono">DMC {$activeColor.dmc}</span>
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
          <button
            class="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
            on:click={() => openSymbolEditor($activeColor)}
          >
            <Edit3 size={11} />
            <span>Edit Symbol</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Palette Header -->
  <div class="px-3 py-2 border-b border-[#2e2e38] flex items-center justify-between bg-[#1f1f27] flex-shrink-0">
    <span class="text-xs font-bold text-gray-300 uppercase tracking-wide">
      Pattern Palette ({$palette.length})
    </span>
    <button
      class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center space-x-1 font-medium transition-colors"
      on:click={() => (showDmcModal = true)}
    >
      <Plus size={14} />
      <span>Add DMC</span>
    </button>
  </div>

  <!-- Swatch Grid -->
  <div class="flex-1 overflow-y-auto p-2.5 space-y-1 min-h-0">
    {#each $palette as color}
      <div
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer
        {$selectedColorId === color.id
          ? 'bg-indigo-950/60 border-indigo-500/80 shadow-sm'
          : 'bg-[#25252e] border-transparent hover:bg-[#2c2c38] hover:border-gray-600'}"
        on:click={() => selectedColorId.set(color.id)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && selectedColorId.set(color.id)}
      >
        <div class="flex items-center space-x-2.5 min-w-0">
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
            <span class="text-xs font-semibold text-gray-200">DMC {color.dmc}</span>
            <span class="text-[11px] text-gray-400 ml-1 truncate">({color.name})</span>
          </div>
        </div>

        <div class="flex items-center space-x-1 flex-shrink-0">
          <span class="text-[11px] font-mono text-gray-400 bg-[#191920] px-1.5 py-0.5 rounded border border-[#31313d]">
            {stitchCounts[color.id] || 0} st
          </span>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- DMC Catalog Search Modal -->
{#if showDmcModal}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Sparkles class="text-indigo-400" size={18} />
          <div>
            <h3 class="font-bold text-white text-sm">Add DMC Floss Color</h3>
            <span class="text-[11px] text-gray-400 font-mono">DMC Catalog ({DMC_CATALOG.length} colors)</span>
          </div>
        </div>
        <button
          class="text-gray-400 hover:text-white text-lg font-bold p-1 rounded hover:bg-[#323242]"
          on:click={() => (showDmcModal = false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Search Input -->
      <div class="p-3 border-b border-gray-800 bg-[#1c1c24]">
        <div class="relative">
          <Search class="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search by DMC # or name (e.g. 310, White, Red, 666, 01)..."
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
            class="w-full flex items-center justify-between p-2 rounded-lg bg-[#252530] hover:bg-[#30303e] border border-[#333342] transition-colors"
            on:click={() => selectDmc(entry)}
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-7 h-7 rounded border border-black/30 shadow-sm flex-shrink-0"
                style="background-color: {entry.hex};"
              ></div>
              <div class="text-left">
                <div class="text-xs font-bold text-white">DMC {entry.code}</div>
                <div class="text-[11px] text-gray-400">{entry.name}</div>
              </div>
            </div>
            <div class="text-xs font-mono text-gray-400">{entry.hex}</div>
          </button>
        {/each}

        {#if filteredCatalog.length === 0}
          <div class="py-8 text-center text-xs text-gray-500">
            No DMC colors matched "{searchQuery}".
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Symbol Selector Modal -->
{#if editingSymbolColor}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
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
            <span class="text-[11px] text-gray-400 font-mono">DMC {editingSymbolColor.dmc} &bull; {editingSymbolColor.name}</span>
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

