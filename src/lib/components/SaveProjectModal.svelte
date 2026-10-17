<script lang="ts">
  import {
    isSaveModalOpen,
    projectName,
    grid,
    palette,
    patternBounds,
    saveProjectFile,
    measurementUnit,
    formatDimensions
  } from '../stores/editorStore';
  import { Save, X, FileText, Check } from 'lucide-svelte';

  let fileName = '';
  let wasOpen = false;

  $: if ($isSaveModalOpen && !wasOpen) {
    const base = $projectName ? $projectName.trim() : 'Untitled Pattern';
    fileName = `${base}.xstitch`;
    wasOpen = true;
  } else if (!$isSaveModalOpen) {
    wasOpen = false;
  }

  function handleSave() {
    let name = fileName.trim();
    if (!name) {
      name = `${$projectName || 'Untitled Pattern'}.xstitch`;
    }
    if (!name.toLowerCase().endsWith('.xstitch')) {
      name += '.xstitch';
    }

    // Also update project name if user gave a custom file base name
    const baseName = name.replace(/\.xstitch$/i, '').trim();
    if (baseName && baseName !== $projectName) {
      projectName.set(baseName);
    }

    saveProjectFile(name);
    isSaveModalOpen.set(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!$isSaveModalOpen) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isSaveModalOpen.set(false);
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if $isSaveModalOpen}
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-[#1f1f28] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#262632]">
        <div class="flex items-center space-x-2">
          <Save class="text-indigo-400" size={18} />
          <h3 class="font-bold text-white text-sm">Save Pattern File</h3>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-white p-1 rounded hover:bg-[#323242] transition-colors cursor-pointer"
          on:click={() => isSaveModalOpen.set(false)}
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-xs">
        <div>
          <label for="save-filename-input" class="block text-gray-300 font-medium mb-1.5">
            File Name
          </label>
          <div class="relative flex items-center">
            <input
              id="save-filename-input"
              type="text"
              bind:value={fileName}
              class="w-full bg-[#2a2a36] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
              placeholder="my-pattern.xstitch"
            />
          </div>
          <span class="text-[11px] text-gray-500 mt-1 block">
            Saved as native cross-stitch format (.xstitch JSON)
          </span>
        </div>

        <!-- Pattern Metadata Card -->
        <div class="bg-[#171720] rounded-xl border border-[#2d2d3a] p-3.5 space-y-2">
          <div class="flex items-center justify-between text-gray-400 text-xs">
            <span class="flex items-center space-x-1.5">
              <FileText size={14} class="text-indigo-400" />
              <span>Project Name:</span>
            </span>
            <span class="font-semibold text-white font-mono">{$projectName}</span>
          </div>

          <div class="flex items-center justify-between text-gray-400 text-xs">
            <span>Canvas Dimensions:</span>
            <span class="font-mono text-gray-200">{$grid.width} × {$grid.height} stitches</span>
          </div>

          <div class="flex items-center justify-between text-gray-400 text-xs">
            <span>Physical Size:</span>
            <span class="font-mono text-gray-200">
              {$grid.fabricCount}-ct ({formatDimensions($grid.width, $grid.height, $grid.fabricCount, $measurementUnit)})
            </span>
          </div>

          <div class="flex items-center justify-between text-gray-400 text-xs">
            <span>Stitch Count:</span>
            <span class="font-mono text-emerald-400 font-semibold">
              {$patternBounds ? $patternBounds.totalStitches : 0} stitches
            </span>
          </div>

          <div class="flex items-center justify-between text-gray-400 text-xs">
            <span>Palette Colors:</span>
            <span class="font-mono text-gray-200">{$palette.length} colors</span>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="p-3 bg-[#191922] border-t border-gray-800 flex justify-end space-x-2">
        <button
          type="button"
          class="px-4 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-[#2a2a36] text-xs font-medium transition-colors cursor-pointer"
          on:click={() => isSaveModalOpen.set(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
          on:click={handleSave}
        >
          <Save size={14} />
          <span>Save Pattern</span>
        </button>
      </div>
    </div>
  </div>
{/if}
