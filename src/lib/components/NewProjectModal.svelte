<script lang="ts">
  import { grid, resetProject, isNewProjectModalOpen, measurementUnit, formatDimensions } from '../stores/editorStore';
  import { Sparkles, X, Ruler } from 'lucide-svelte';

  let name = 'Untitled Pattern';
  let width = 60;
  let height = 40;
  let fabricCount = 14;
  let paletteChoice: 'default' | 'minimal' = 'default';

  let wasOpen = false;
  $: if ($isNewProjectModalOpen && !wasOpen) {
    name = 'Untitled Pattern';
    width = 60;
    height = 40;
    fabricCount = 14;
    wasOpen = true;
  } else if (!$isNewProjectModalOpen) {
    wasOpen = false;
  }

  const presets = [
    { label: 'Bookmark', w: 30, h: 90 },
    { label: 'Small (4×4")', w: 56, h: 56 },
    { label: 'Medium (60×40)', w: 60, h: 40 },
    { label: 'Standard (80×80)', w: 80, h: 80 },
    { label: 'Large (120×90)', w: 120, h: 90 }
  ];

  const fabricOptions = [11, 14, 16, 18, 22, 28];

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
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Sparkles class="text-indigo-400" size={18} />
          <h3 class="font-bold text-white text-sm">New Pattern Project</h3>
        </div>
        <button
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242]"
          on:click={() => isNewProjectModalOpen.set(false)}
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 space-y-4 text-xs text-gray-300">
        <!-- Project Name -->
        <div>
          <label for="new-proj-name" class="block text-gray-300 font-medium mb-1">Project Name</label>
          <input
            id="new-proj-name"
            type="text"
            bind:value={name}
            class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
            placeholder="e.g. Victorian Sampler"
          />
        </div>

        <!-- Quick Presets -->
        <div>
          <div class="block text-gray-400 uppercase font-semibold text-[11px] mb-1.5 tracking-wider">Quick Presets</div>
          <div class="flex flex-wrap gap-1.5">
            {#each presets as p}
              <button
                class="px-2.5 py-1 rounded bg-[#2b2b38] hover:bg-indigo-600 hover:text-white border border-[#3c3c4e] transition-colors"
                on:click={() => { width = p.w; height = p.h; }}
              >
                {p.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Dimensions -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="new-proj-width" class="block text-gray-400 font-medium mb-1">Width (stitches)</label>
            <input
              id="new-proj-width"
              type="number"
              min="5"
              max="1000"
              bind:value={width}
              class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label for="new-proj-height" class="block text-gray-400 font-medium mb-1">Height (stitches)</label>
            <input
              id="new-proj-height"
              type="number"
              min="5"
              max="1000"
              bind:value={height}
              class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Fabric Count -->
        <div>
          <div class="block text-gray-400 font-medium mb-1.5">Target Fabric Count</div>
          <div class="flex items-center space-x-1.5">
            {#each fabricOptions as ct}
              <button
                class="flex-1 py-1 rounded border text-center font-mono font-medium transition-all
                {fabricCount === ct
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-[#282834] border-[#363646] text-gray-300 hover:bg-[#323242]'}"
                on:click={() => fabricCount = ct}
              >
                {ct}-ct
              </button>
            {/each}
          </div>
        </div>

        <!-- Physical Dimension Preview Card -->
        <div class="p-2.5 bg-[#171720] rounded-lg border border-[#30303e] flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Ruler size={16} class="text-indigo-400" />
            <span class="text-gray-400">Finished Physical Size:</span>
          </div>
          <span class="font-mono font-bold text-white text-xs">{formatDimensions(width, height, fabricCount, $measurementUnit)}</span>
        </div>

        <!-- Starter Palette Option -->
        <div>
          <div class="block text-gray-400 font-medium mb-1.5">Palette Option</div>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="p-2 rounded border text-left transition-all
              {paletteChoice === 'default'
                ? 'bg-indigo-950/70 border-indigo-500 text-white'
                : 'bg-[#252530] border-[#363646] text-gray-300 hover:bg-[#2e2e3c]'}"
              on:click={() => paletteChoice = 'default'}
            >
              <div class="font-semibold text-xs">Standard Starter</div>
              <div class="text-[11px] text-gray-400">9 popular DMC colors</div>
            </button>
            <button
              class="p-2 rounded border text-left transition-all
              {paletteChoice === 'minimal'
                ? 'bg-indigo-950/70 border-indigo-500 text-white'
                : 'bg-[#252530] border-[#363646] text-gray-300 hover:bg-[#2e2e3c]'}"
              on:click={() => paletteChoice = 'minimal'}
            >
              <div class="font-semibold text-xs">Monochrome</div>
              <div class="text-[11px] text-gray-400">Black, White & Red</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-3 bg-[#191922] border-t border-gray-800 flex justify-end space-x-2">
        <button
          class="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-[#2a2a36] text-xs font-medium transition-colors"
          on:click={() => isNewProjectModalOpen.set(false)}
        >
          Cancel
        </button>
        <button
          class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-colors"
          on:click={handleCreate}
        >
          Create Canvas
        </button>
      </div>
    </div>
  </div>
{/if}
