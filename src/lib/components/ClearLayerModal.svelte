<script lang="ts">
  import {
    layers,
    activeLayerId,
    clearCurrentLayer,
    isClearLayerModalOpen
  } from '../stores/editorStore';
  import { Trash2, X, AlertTriangle, Layers } from 'lucide-svelte';

  $: activeLayer = $layers.find(l => l.id === $activeLayerId);
  $: stitchCount = activeLayer ? Object.keys(activeLayer.stitches).length : 0;

  function handleConfirmClear() {
    clearCurrentLayer();
    isClearLayerModalOpen.set(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      isClearLayerModalOpen.set(false);
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if $isClearLayerModalOpen}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Trash2 class="text-red-400" size={18} />
          <h3 class="font-bold text-white text-sm">Clear Active Layer</h3>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => isClearLayerModalOpen.set(false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 space-y-3.5 text-xs text-gray-300">
        <!-- Layer Spec Badge -->
        <div class="bg-[#181820] p-3 rounded-lg border border-[#30303e] flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Layers size={16} class="text-indigo-400" />
            <span class="font-semibold text-white">{activeLayer?.name || 'Active Layer'}</span>
          </div>
          <span class="font-mono text-gray-400 font-medium">
            {stitchCount} {stitchCount === 1 ? 'stitch' : 'stitches'}
          </span>
        </div>

        {#if activeLayer?.locked}
          <div class="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start space-x-2 text-amber-300 text-[11px]">
            <AlertTriangle size={15} class="flex-shrink-0 mt-0.5" />
            <span>This layer is locked. Unlock it in the Layers panel before modifying it.</span>
          </div>
        {:else if stitchCount === 0}
          <div class="text-gray-400 text-center py-2 italic">
            This layer is already empty. There are no stitches to clear.
          </div>
        {:else}
          <p class="text-gray-300 leading-relaxed">
            Are you sure you want to remove all <strong class="text-white font-semibold">{stitchCount} stitches</strong> from <span class="text-indigo-300 font-semibold">{activeLayer?.name}</span>?
          </p>

          <div class="p-2.5 bg-red-950/30 border border-red-800/50 rounded-lg flex items-start space-x-2 text-red-300 text-[11px]">
            <AlertTriangle size={15} class="flex-shrink-0 mt-0.5 text-red-400" />
            <span>Stitches on other layers will remain untouched. You can undo this at any time with <strong>Cmd+Z</strong>.</span>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      <div class="p-3 bg-[#191922] border-t border-gray-800 flex justify-end space-x-2">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-[#2a2a36] text-xs font-medium transition-colors"
          on:click={() => isClearLayerModalOpen.set(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-xs font-medium shadow-md shadow-red-600/30 transition-colors"
          on:click={handleConfirmClear}
          disabled={activeLayer?.locked || stitchCount === 0}
        >
          Clear Layer
        </button>
      </div>
    </div>
  </div>
{/if}
