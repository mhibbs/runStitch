<script lang="ts">
  import { grid, resetProject, isNewProjectModalOpen, measurementUnit, formatDimensions } from '../stores/editorStore';
  import { Sparkles, X, Ruler } from 'lucide-svelte';

  let name = 'Untitled Pattern';
  let width = 60;
  let height = 40;
  let fabricCount = 14;
  let unit: 'in' | 'cm' = 'in';
  let physicalWidth = '4.3';
  let physicalHeight = '2.9';
  let paletteChoice: 'default' | 'minimal' = 'default';

  let wasOpen = false;
  $: if ($isNewProjectModalOpen && !wasOpen) {
    name = 'Untitled Pattern';
    width = 60;
    height = 40;
    fabricCount = 14;
    unit = $measurementUnit || 'in';
    syncFromStitches();
    wasOpen = true;
  } else if (!$isNewProjectModalOpen) {
    wasOpen = false;
  }

  function syncFromStitches() {
    if (unit === 'cm') {
      physicalWidth = (((width || 0) / fabricCount) * 2.54).toFixed(1);
      physicalHeight = (((height || 0) / fabricCount) * 2.54).toFixed(1);
    } else {
      physicalWidth = ((width || 0) / fabricCount).toFixed(1);
      physicalHeight = ((height || 0) / fabricCount).toFixed(1);
    }
  }

  function handlePhysicalWidthChange() {
    const val = parseFloat(physicalWidth);
    if (!isNaN(val) && val > 0) {
      width = Math.max(5, Math.round(unit === 'cm' ? (val / 2.54) * fabricCount : val * fabricCount));
    }
  }

  function handlePhysicalHeightChange() {
    const val = parseFloat(physicalHeight);
    if (!isNaN(val) && val > 0) {
      height = Math.max(5, Math.round(unit === 'cm' ? (val / 2.54) * fabricCount : val * fabricCount));
    }
  }

  function handleStitchesWidthChange() {
    syncFromStitches();
  }

  function handleStitchesHeightChange() {
    syncFromStitches();
  }

  function handleFabricCountChange(ct: number) {
    fabricCount = ct;
    syncFromStitches();
  }

  function handleUnitChange(newUnit: 'in' | 'cm') {
    unit = newUnit;
    syncFromStitches();
  }

  const presets = [
    { label: 'Bookmark (30×90)', w: 30, h: 90 },
    { label: 'Small 4×4" (56×56)', w: 56, h: 56 },
    { label: 'Medium (60×40)', w: 60, h: 40 },
    { label: 'Standard (80×80)', w: 80, h: 80 },
    { label: 'Large (120×90)', w: 120, h: 90 }
  ];

  const fabricOptions = [11, 14, 16, 18, 22, 28];

  function applyPreset(p: { w: number; h: number }) {
    width = p.w;
    height = p.h;
    syncFromStitches();
  }

  function handleCreate() {
    const w = Number(width);
    const h = Number(height);
    const fc = Number(fabricCount);
    if (isNaN(w) || isNaN(h) || w < 5 || h < 5) {
      alert('Width and height must be at least 5 stitches.');
      return;
    }
    resetProject({ width: w, height: h, fabricCount: fc || 14, name: name.trim() || 'Untitled Pattern' }, paletteChoice);
    isNewProjectModalOpen.set(false);
  }
</script>

{#if $isNewProjectModalOpen}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Sparkles class="text-indigo-400" size={18} />
          <h3 class="font-bold text-white text-sm">New Pattern Project</h3>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#323242] transition-colors cursor-pointer"
          on:click={() => isNewProjectModalOpen.set(false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-xs">
        <!-- Project Name -->
        <div>
          <label for="new-proj-name" class="block text-gray-300 font-medium mb-1">Project Name</label>
          <input
            id="new-proj-name"
            type="text"
            bind:value={name}
            class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
            placeholder="e.g. Victorian Sampler"
          />
        </div>

        <!-- Quick Presets -->
        <div>
          <div class="block text-gray-400 uppercase font-semibold text-[10px] mb-1.5 tracking-wider">Quick Presets</div>
          <div class="flex flex-wrap gap-1.5">
            {#each presets as p}
              <button
                type="button"
                class="px-2.5 py-1 rounded-lg bg-[#2b2b38] hover:bg-indigo-600 hover:text-white border border-[#3c3c4e] transition-colors cursor-pointer text-xs"
                on:click={() => applyPreset(p)}
              >
                {p.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Target Fabric Count -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-gray-300 font-medium">Fabric Count</span>
            <span class="text-[11px] text-indigo-400 font-mono">{fabricCount} stitches per inch</span>
          </div>
          <div class="grid grid-cols-6 gap-1.5">
            {#each fabricOptions as ct}
              <button
                type="button"
                class="py-1 rounded-lg border text-center font-mono font-medium text-xs transition-all cursor-pointer
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

        <!-- Linked Dimensions: Stitches ↔ Physical Size -->
        <div class="bg-[#171720] rounded-xl border border-[#2d2d3c] p-3.5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-300">Dimensions</span>
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
              <label for="new-proj-width-st" class="block text-[11px] text-gray-400 mb-1">Width (stitches)</label>
              <div class="relative flex items-center">
                <input
                  id="new-proj-width-st"
                  type="number"
                  min="5"
                  max="1000"
                  bind:value={width}
                  on:input={handleStitchesWidthChange}
                  class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span class="absolute right-2.5 text-gray-500 text-[10px]">st</span>
              </div>
            </div>

            <div>
              <label for="new-proj-width-phys" class="block text-[11px] text-gray-400 mb-1">Width ({unit})</label>
              <div class="relative flex items-center">
                <input
                  id="new-proj-width-phys"
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
              <label for="new-proj-height-st" class="block text-[11px] text-gray-400 mb-1">Height (stitches)</label>
              <div class="relative flex items-center">
                <input
                  id="new-proj-height-st"
                  type="number"
                  min="5"
                  max="1000"
                  bind:value={height}
                  on:input={handleStitchesHeightChange}
                  class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
                <span class="absolute right-2.5 text-gray-500 text-[10px]">st</span>
              </div>
            </div>

            <div>
              <label for="new-proj-height-phys" class="block text-[11px] text-gray-400 mb-1">Height ({unit})</label>
              <div class="relative flex items-center">
                <input
                  id="new-proj-height-phys"
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
            * Stitches and {unit === 'in' ? 'inches' : 'centimeters'} are tied together automatically based on {fabricCount}ct fabric.
          </div>
        </div>

        <!-- Starter Palette Option -->
        <div>
          <div class="block text-gray-300 font-medium mb-1.5">Starter Palette</div>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="p-2.5 rounded-xl border text-left transition-all cursor-pointer
              {paletteChoice === 'default'
                ? 'bg-indigo-950/70 border-indigo-500 text-white'
                : 'bg-[#252530] border-[#363646] text-gray-300 hover:bg-[#2e2e3c]'}"
              on:click={() => paletteChoice = 'default'}
            >
              <div class="font-semibold text-xs text-white">Standard Starter</div>
              <div class="text-[10px] text-gray-400">9 popular DMC colors</div>
            </button>
            <button
              type="button"
              class="p-2.5 rounded-xl border text-left transition-all cursor-pointer
              {paletteChoice === 'minimal'
                ? 'bg-indigo-950/70 border-indigo-500 text-white'
                : 'bg-[#252530] border-[#363646] text-gray-300 hover:bg-[#2e2e3c]'}"
              on:click={() => paletteChoice = 'minimal'}
            >
              <div class="font-semibold text-xs text-white">Monochrome / Minimal</div>
              <div class="text-[10px] text-gray-400">Black, white & red</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-4 bg-[#191922] border-t border-gray-800 flex justify-end space-x-2">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-[#2a2a36] text-xs font-medium transition-colors cursor-pointer"
          on:click={() => isNewProjectModalOpen.set(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
          on:click={handleCreate}
        >
          Create Project
        </button>
      </div>
    </div>
  </div>
{/if}
