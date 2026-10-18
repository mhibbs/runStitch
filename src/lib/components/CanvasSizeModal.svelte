<script lang="ts">
  import { grid, resizeGrid, isCanvasSizeModalOpen, measurementUnit, formatDimensions } from '../stores/editorStore';
  import { Maximize2, X, AlertTriangle, Check } from 'lucide-svelte';

  let newWidth = $grid.width;
  let newHeight = $grid.height;
  let anchor: 'center' | 'top-left' = 'center';
  let unit: 'in' | 'cm' = 'in';
  let fabricCount = $grid.fabricCount || 14;
  let physicalWidth = '4.3';
  let physicalHeight = '2.9';

  let wasOpen = false;
  $: if ($isCanvasSizeModalOpen && !wasOpen) {
    newWidth = $grid.width;
    newHeight = $grid.height;
    fabricCount = $grid.fabricCount || 14;
    unit = $measurementUnit || 'in';
    anchor = 'center';
    syncFromStitches();
    wasOpen = true;
  } else if (!$isCanvasSizeModalOpen) {
    wasOpen = false;
  }

  function syncFromStitches() {
    const fc = fabricCount || 14;
    const w = Number(newWidth) || 0;
    const h = Number(newHeight) || 0;
    if (unit === 'cm') {
      physicalWidth = ((w / fc) * 2.54).toFixed(1);
      physicalHeight = ((h / fc) * 2.54).toFixed(1);
    } else {
      physicalWidth = (w / fc).toFixed(1);
      physicalHeight = (h / fc).toFixed(1);
    }
  }

  function handlePhysicalWidthChange() {
    const val = parseFloat(physicalWidth);
    const fc = fabricCount || 14;
    if (!isNaN(val) && val > 0) {
      newWidth = Math.max(5, Math.round(unit === 'cm' ? (val / 2.54) * fc : val * fc));
    }
  }

  function handlePhysicalHeightChange() {
    const val = parseFloat(physicalHeight);
    const fc = fabricCount || 14;
    if (!isNaN(val) && val > 0) {
      newHeight = Math.max(5, Math.round(unit === 'cm' ? (val / 2.54) * fc : val * fc));
    }
  }

  function handleStitchesWidthChange() {
    syncFromStitches();
  }

  function handleStitchesHeightChange() {
    syncFromStitches();
  }

  function handleUnitChange(newUnit: 'in' | 'cm') {
    unit = newUnit;
    syncFromStitches();
  }

  function handleFabricCountChange(ct: number) {
    fabricCount = ct;
    syncFromStitches();
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
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
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
          <span class="text-gray-400">Current Canvas:</span>
          <span class="font-mono font-bold text-white">{$grid.width} × {$grid.height} st ({formatDimensions($grid.width, $grid.height, $grid.fabricCount, unit)})</span>
        </div>

        <!-- Fabric Count selector -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-gray-300 font-medium">Fabric Count</span>
            <span class="text-[11px] text-indigo-400 font-mono">{fabricCount} count</span>
          </div>
          <div class="grid grid-cols-6 gap-1.5">
            {#each [11, 14, 16, 18, 22, 28] as ct}
              <button
                type="button"
                class="py-1 rounded border text-center font-mono font-medium text-xs transition-all cursor-pointer
                {fabricCount === ct
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-[#282834] border-[#363646] text-gray-300 hover:bg-[#323242]'}"
                on:click={() => handleFabricCountChange(ct)}
              >
                {ct}ct
              </button>
            {/each}
          </div>
        </div>

        <!-- Linked Dimensions: Stitches <-> Physical -->
        <div class="bg-[#171720] rounded-xl border border-[#2d2d3c] p-3.5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-300">New Dimensions</span>
            <div class="flex items-center space-x-1 bg-[#242432] p-0.5 rounded-lg border border-gray-700 text-[10px]">
              <button
                type="button"
                class="px-2 py-0.5 rounded transition-colors cursor-pointer {unit === 'in' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-white'}"
                on:click={() => handleUnitChange('in')}
              >
                Inches
              </button>
              <button
                type="button"
                class="px-2 py-0.5 rounded transition-colors cursor-pointer {unit === 'cm' ? 'bg-indigo-600 text-white font-bold' : 'text-gray-400 hover:text-white'}"
                on:click={() => handleUnitChange('cm')}
              >
                CM
              </button>
            </div>
          </div>

          <!-- Width Row -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <label for="canvas-new-width-st" class="block text-[11px] text-gray-400 mb-1">Width (stitches)</label>
              <div class="relative flex items-center">
                <input
                  id="canvas-new-width-st"
                  type="number"
                  min="5"
                  max="1000"
                  bind:value={newWidth}
                  on:input={handleStitchesWidthChange}
                  class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span class="absolute right-2.5 text-gray-500 text-[10px]">st</span>
              </div>
            </div>

            <div>
              <label for="canvas-new-width-phys" class="block text-[11px] text-gray-400 mb-1">Width ({unit})</label>
              <div class="relative flex items-center">
                <input
                  id="canvas-new-width-phys"
                  type="number"
                  step="0.1"
                  min="0.5"
                  bind:value={physicalWidth}
                  on:input={handlePhysicalWidthChange}
                  class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span class="absolute right-2.5 text-gray-500 text-[10px]">{unit}</span>
              </div>
            </div>
          </div>

          <!-- Height Row -->
          <div class="grid grid-cols-2 gap-3 items-center">
            <div>
              <label for="canvas-new-height-st" class="block text-[11px] text-gray-400 mb-1">Height (stitches)</label>
              <div class="relative flex items-center">
                <input
                  id="canvas-new-height-st"
                  type="number"
                  min="5"
                  max="1000"
                  bind:value={newHeight}
                  on:input={handleStitchesHeightChange}
                  class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span class="absolute right-2.5 text-gray-500 text-[10px]">st</span>
              </div>
            </div>

            <div>
              <label for="canvas-new-height-phys" class="block text-[11px] text-gray-400 mb-1">Height ({unit})</label>
              <div class="relative flex items-center">
                <input
                  id="canvas-new-height-phys"
                  type="number"
                  step="0.1"
                  min="0.5"
                  bind:value={physicalHeight}
                  on:input={handlePhysicalHeightChange}
                  class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span class="absolute right-2.5 text-gray-500 text-[10px]">{unit}</span>
              </div>
            </div>
          </div>

          <div class="text-[10px] text-gray-500 italic pt-1 border-t border-gray-800">
            * Stitches and {unit === 'in' ? 'inches' : 'centimeters'} are linked automatically based on {fabricCount}ct fabric.
          </div>
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
