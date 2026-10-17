<script lang="ts">
  import { grid, resizeGrid, isCanvasSizeModalOpen, measurementUnit, formatDimensions } from '../stores/editorStore';
  import { Maximize2, X, AlertTriangle, Check } from 'lucide-svelte';

  let newWidth = $grid.width;
  let newHeight = $grid.height;
  let anchor: 'center' | 'top-left' = 'center';

  let wasOpen = false;
  $: if ($isCanvasSizeModalOpen && !wasOpen) {
    newWidth = $grid.width;
    newHeight = $grid.height;
    anchor = 'center';
    wasOpen = true;
  } else if (!$isCanvasSizeModalOpen) {
    wasOpen = false;
  }

  $: isShrinking = newWidth < $grid.width || newHeight < $grid.height;

  function handleResize() {
    const w = Number(newWidth);
    const h = Number(newHeight);
    if (isNaN(w) || isNaN(h) || w < 5 || h < 5) {
      alert('Width and height must be at least 5 stitches.');
      return;
    }
    resizeGrid(w, h, anchor);
    isCanvasSizeModalOpen.set(false);
  }
</script>

{#if $isCanvasSizeModalOpen}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Maximize2 class="text-indigo-400" size={18} />
          <h3 class="font-bold text-white text-sm">Resize Canvas</h3>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => isCanvasSizeModalOpen.set(false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 space-y-4 text-xs text-gray-300">
        <!-- Current Info -->
        <div class="bg-[#181820] p-2.5 rounded-lg border border-[#30303e] flex justify-between items-center text-xs">
          <span class="text-gray-400">Current Size:</span>
          <span class="font-mono font-bold text-white">{$grid.width} × {$grid.height} st ({formatDimensions($grid.width, $grid.height, $grid.fabricCount, $measurementUnit)})</span>
        </div>

        <!-- New Dimensions Inputs -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="canvas-new-width" class="block text-gray-400 font-medium mb-1">New Width (stitches)</label>
            <input
              id="canvas-new-width"
              type="number"
              min="5"
              max="1000"
              bind:value={newWidth}
              class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label for="canvas-new-height" class="block text-gray-400 font-medium mb-1">New Height (stitches)</label>
            <input
              id="canvas-new-height"
              type="number"
              min="5"
              max="1000"
              bind:value={newHeight}
              class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- New Physical Size Preview -->
        <div class="bg-[#181820] p-2 rounded-lg border border-[#30303e] flex justify-between items-center text-xs">
          <span class="text-gray-400">New Physical Size:</span>
          <span class="font-mono font-bold text-indigo-300">{formatDimensions(Number(newWidth) || 0, Number(newHeight) || 0, $grid.fabricCount, $measurementUnit)}</span>
        </div>

        <!-- Where to add or remove space -->
        <div>
          <span class="block text-gray-400 font-medium mb-1.5">Where to add or remove space:</span>
          <div class="space-y-2">
            <button
              type="button"
              class="w-full p-2.5 rounded-lg border text-left flex items-start justify-between transition-all
              {anchor === 'center'
                ? 'bg-indigo-950/60 border-indigo-500 text-white'
                : 'bg-[#252530] border-[#363646] text-gray-300 hover:bg-[#2c2c3a]'}"
              on:click={() => anchor = 'center'}
            >
              <div>
                <div class="font-semibold text-xs text-white">Add / Remove evenly from all edges</div>
                <div class="text-[11px] text-gray-400 mt-0.5">Keeps current stitches centered on canvas</div>
              </div>
              {#if anchor === 'center'}
                <Check size={16} class="text-indigo-400 flex-shrink-0 mt-0.5" />
              {/if}
            </button>

            <button
              type="button"
              class="w-full p-2.5 rounded-lg border text-left flex items-start justify-between transition-all
              {anchor === 'top-left'
                ? 'bg-indigo-950/60 border-indigo-500 text-white'
                : 'bg-[#252530] border-[#363646] text-gray-300 hover:bg-[#2c2c3a]'}"
              on:click={() => anchor = 'top-left'}
            >
              <div>
                <div class="font-semibold text-xs text-white">Add / Remove from bottom & right</div>
                <div class="text-[11px] text-gray-400 mt-0.5">Keeps stitches anchored at top-left corner</div>
              </div>
              {#if anchor === 'top-left'}
                <Check size={16} class="text-indigo-400 flex-shrink-0 mt-0.5" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Warning if shrinking -->
        {#if isShrinking}
          <div class="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start space-x-2 text-amber-300 text-[11px]">
            <AlertTriangle size={15} class="flex-shrink-0 mt-0.5" />
            <span>Shrinking the canvas will crop stitches that fall outside the new dimensions.</span>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      <div class="p-3 bg-[#191922] border-t border-gray-800 flex justify-end space-x-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-[#2a2a36] text-xs font-medium transition-colors"
          on:click={() => isCanvasSizeModalOpen.set(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-colors"
          on:click={handleResize}
        >
          Apply Resize
        </button>
      </div>
    </div>
  </div>
{/if}
