<script lang="ts">
  import { onMount } from 'svelte';
  import {
    isMotifLibraryModalOpen,
    activeTool,
    activeStamp,
    selection,
    clipboard,
    saveSelectionAsStamp,
    saveClipboardAsStamp,
    selectedColorId,
    activeColor,
    isBorderModalOpen,
    borderInitialMotif,
    fabricColor
  } from '../stores/editorStore';
  import type { MotifStamp } from '../types';
  import {
    BUILTIN_MOTIFS,
    loadCustomStamps,
    deleteCustomStamp,
    renderTextToMotif
  } from '../data/motifLibrary';
  import { DMC_CATALOG } from '../data/dmcPalette';
  import { X, Stamp, Plus, Trash2, Type, Frame, Sparkles, Check, Clipboard } from 'lucide-svelte';

  type Tab = 'accents' | 'corners' | 'borders' | 'text' | 'custom';
  let activeTab: Tab = 'accents';

  let customStamps: MotifStamp[] = [];
  let customStampName = '';
  let showSaveSuccess = false;

  // Text Sampler generator state
  let samplerText = 'XSTITCH 2026';
  let samplerFontDmc = '310';

  function refreshCustomStamps() {
    customStamps = loadCustomStamps();
  }

  $: if ($isMotifLibraryModalOpen) {
    refreshCustomStamps();
  }

  function closeModal() {
    isMotifLibraryModalOpen.set(false);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $isMotifLibraryModalOpen) {
      closeModal();
    }
  }

  function selectStamp(stamp: MotifStamp) {
    activeStamp.set(stamp);
    activeTool.set('stamp');
    closeModal();
  }

  function useInBorderMaker(stamp: MotifStamp) {
    borderInitialMotif.set(stamp);
    closeModal();
    isBorderModalOpen.set(true);
  }

  function handleSaveSelection() {
    const name = customStampName.trim() || `My Stamp ${customStamps.length + 1}`;
    const saved = saveSelectionAsStamp(name, 'custom');
    if (saved) {
      customStampName = '';
      refreshCustomStamps();
      activeTab = 'custom';
      showSaveSuccess = true;
      setTimeout(() => (showSaveSuccess = false), 2500);
    }
  }

  function handleSaveClipboard() {
    const name = customStampName.trim() || `My Stamp ${customStamps.length + 1}`;
    const saved = saveClipboardAsStamp(name, 'custom');
    if (saved) {
      customStampName = '';
      refreshCustomStamps();
      activeTab = 'custom';
      showSaveSuccess = true;
      setTimeout(() => (showSaveSuccess = false), 2500);
    }
  }

  function handleDeleteCustom(id: string) {
    deleteCustomStamp(id);
    refreshCustomStamps();
  }

  function handleStampGeneratedText() {
    if (!samplerText.trim()) return;
    const stamp = renderTextToMotif(samplerText.trim(), samplerFontDmc);
    selectStamp(stamp);
  }

  // Canvas thumbnail helper
  function drawThumbnail(canvas: HTMLCanvasElement, stamp: MotifStamp, clothHex: string = $fabricColor) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Fabric cloth background
    ctx.fillStyle = clothHex;
    ctx.fillRect(0, 0, w, h);

    // Subtle fabric border
    ctx.strokeStyle = '#3a3a48';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    const pad = 6;
    const cellW = (w - pad * 2) / Math.max(1, stamp.width);
    const cellH = (h - pad * 2) / Math.max(1, stamp.height);
    const cellSize = Math.min(cellW, cellH, 8);

    const startX = Math.round((w - stamp.width * cellSize) / 2);
    const startY = Math.round((h - stamp.height * cellSize) / 2);

    const dmcMap = new Map(DMC_CATALOG.map(d => [d.code, d.hex]));

    for (const [relKey, stitch] of Object.entries(stamp.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const px = startX + rx * cellSize;
      const py = startY + ry * cellSize;
      const hex = dmcMap.get(stitch.dmc) || '#E11D48';

      ctx.fillStyle = hex;
      ctx.fillRect(px, py, Math.max(1, cellSize - 0.5), Math.max(1, cellSize - 0.5));
    }
  }

  function canvasAction(node: HTMLCanvasElement, stamp: MotifStamp) {
    drawThumbnail(node, stamp, $fabricColor);
    return {
      update(newStamp: MotifStamp) {
        drawThumbnail(node, newStamp, $fabricColor);
      }
    };
  }

  $: filteredMotifs = BUILTIN_MOTIFS.filter(m => m.category === activeTab);
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $isMotifLibraryModalOpen}
  <div
    class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
    on:click|self={closeModal}
    role="presentation"
  >
    <div
      class="bg-[#1b1b24] border border-[#2d2d3c] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-gray-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="motif-library-title"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-[#2d2d3c] flex items-center justify-between bg-[#21212c]">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Stamp size={20} />
          </div>
          <div>
            <h2 id="motif-library-title" class="text-base font-bold text-white tracking-wide">
              Motif & Stamp Library
            </h2>
            <p class="text-xs text-gray-400">
              Curated cross-stitch flourishes, sampler alphabets, borders, and custom stamps
            </p>
          </div>
        </div>

        <button
          type="button"
          class="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center transition-colors"
          on:click={closeModal}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="flex border-b border-[#2d2d3c] px-6 bg-[#181820] space-x-1 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          class="px-4 py-3 border-b-2 transition-all {activeTab === 'accents' ? 'border-emerald-500 text-white font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'accents')}
        >
          Minis & Accents
        </button>
        <button
          type="button"
          class="px-4 py-3 border-b-2 transition-all {activeTab === 'corners' ? 'border-emerald-500 text-white font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'corners')}
        >
          Corners & Flourishes
        </button>
        <button
          type="button"
          class="px-4 py-3 border-b-2 transition-all {activeTab === 'borders' ? 'border-emerald-500 text-white font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'borders')}
        >
          Repeating Borders
        </button>
        <button
          type="button"
          class="px-4 py-3 border-b-2 transition-all {activeTab === 'text' ? 'border-emerald-500 text-white font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'text')}
        >
          Sampler Alphabet & Text
        </button>
        <button
          type="button"
          class="px-4 py-3 border-b-2 transition-all flex items-center space-x-1.5 {activeTab === 'custom' ? 'border-emerald-500 text-white font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'custom')}
        >
          <span>My Custom Stamps</span>
          {#if customStamps.length > 0}
            <span class="bg-[#2d2d3c] text-[10px] px-1.5 py-0.2 rounded-full text-emerald-400">{customStamps.length}</span>
          {/if}
        </button>
      </div>

      <!-- Main Body -->
      <div class="p-6 overflow-y-auto flex-1 space-y-5">

        <!-- TAB CONTENT: Text Sampler Typer -->
        {#if activeTab === 'text'}
          <div class="bg-[#22222e] border border-[#2d2d3c] rounded-xl p-5 space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-white flex items-center space-x-2">
                <Type size={16} class="text-emerald-400" />
                <span>Mini Sampler Font (3×5 px)</span>
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Type any initials, name, year, or traditional sampler verse to convert into stitches.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-2 space-y-1">
                <label for="sampler-text-input" class="text-[11px] font-medium text-gray-300">Message / Text</label>
                <input
                  id="sampler-text-input"
                  type="text"
                  bind:value={samplerText}
                  placeholder="e.g. LOVE 2026, HOME, A B C"
                  maxlength="30"
                  class="w-full px-3 py-2 bg-[#171720] border border-gray-700 rounded-lg text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div class="space-y-1">
                <label for="sampler-floss-select" class="text-[11px] font-medium text-gray-300">Floss Color</label>
                <select
                  id="sampler-floss-select"
                  bind:value={samplerFontDmc}
                  class="w-full px-3 py-2 bg-[#171720] border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="310">DMC 310 (Black)</option>
                  <option value="666">DMC 666 (Bright Red)</option>
                  <option value="796">DMC 796 (Dark Royal Blue)</option>
                  <option value="700">DMC 700 (Bright Green)</option>
                  <option value="433">DMC 433 (Medium Brown)</option>
                  <option value="550">DMC 550 (Very Dark Violet)</option>
                  <option value="Blanc">DMC Blanc (White)</option>
                </select>
              </div>
            </div>

            <!-- Live Text Preview -->
            {#if samplerText.trim()}
              {@const genStamp = renderTextToMotif(samplerText.trim(), samplerFontDmc)}
              <div class="pt-2 border-t border-[#2d2d3c] flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex items-center space-x-3">
                  <canvas
                    width="140"
                    height="45"
                    class="rounded border border-gray-700 bg-[#121218]"
                    use:canvasAction={genStamp}
                  ></canvas>
                  <div class="text-xs text-gray-400 font-mono">
                    <div>Dimensions: <strong class="text-white">{genStamp.width}×5 st</strong></div>
                    <div>Stitch Count: <strong class="text-emerald-400">{Object.keys(genStamp.stitches).length} st</strong></div>
                  </div>
                </div>

                <button
                  type="button"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  on:click={handleStampGeneratedText}
                >
                  <Stamp size={16} />
                  <span>Stamp This Text onto Canvas</span>
                </button>
              </div>
            {/if}
          </div>

        <!-- TAB CONTENT: Custom Stamps -->
        {:else if activeTab === 'custom'}
          <!-- Save Active Selection Banner (Only on Custom Tab) -->
          {#if $selection && $selection.width > 0 && $selection.height > 0}
            <div class="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm mb-4">
              <div class="flex items-center space-x-2.5">
                <Sparkles size={18} class="text-emerald-400" />
                <div>
                  <div class="text-xs font-semibold text-emerald-200">Active Canvas Selection ({$selection.width}×{$selection.height} st)</div>
                  <div class="text-[11px] text-emerald-400/80">
                    Save the current selection on active layer as a reusable custom stamp
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Stamp name..."
                  bind:value={customStampName}
                  class="px-2.5 py-1.5 text-xs bg-[#15151e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-40"
                />
                <button
                  type="button"
                  class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  on:click={handleSaveSelection}
                >
                  <Plus size={14} />
                  <span>Save Stamp</span>
                </button>
              </div>
            </div>
          {:else if $clipboard && $clipboard.width > 0 && $clipboard.height > 0}
            <div class="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm mb-4">
              <div class="flex items-center space-x-2.5">
                <Clipboard size={18} class="text-emerald-400" />
                <div>
                  <div class="text-xs font-semibold text-emerald-200">Clipboard Pattern ({$clipboard.width}×{$clipboard.height} st)</div>
                  <div class="text-[11px] text-emerald-400/80">
                    Save your copied clipboard stitches as a reusable custom stamp
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Stamp name..."
                  bind:value={customStampName}
                  class="px-2.5 py-1.5 text-xs bg-[#15151e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-40"
                />
                <button
                  type="button"
                  class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  on:click={handleSaveClipboard}
                >
                  <Plus size={14} />
                  <span>Save Stamp</span>
                </button>
              </div>
            </div>
          {/if}

          {#if showSaveSuccess}
            <div class="p-2.5 bg-emerald-900/60 border border-emerald-500 text-emerald-200 rounded-lg text-xs flex items-center space-x-2 mb-4">
              <Check size={16} />
              <span>Stamp successfully saved to your custom stamps collection!</span>
            </div>
          {/if}

          {#if customStamps.length === 0}
            <div class="py-12 text-center text-gray-500 space-y-2">
              <Stamp size={36} class="mx-auto text-gray-600" />
              <div class="text-sm font-medium text-gray-400">No Custom Stamps Yet</div>
              <p class="text-xs max-w-sm mx-auto text-gray-500">
                Use the Marquee Select tool (S) or copy stitches (Cmd+C) to your clipboard, then return here to save as a custom stamp!
              </p>
            </div>
          {:else}
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {#each customStamps as stamp}
                <div class="bg-[#22222e] border border-[#2d2d3c] rounded-xl p-3 flex flex-col items-center hover:border-emerald-500/60 transition-all group relative">
                  <canvas
                    width="90"
                    height="90"
                    class="rounded-lg border border-gray-800 bg-[#14141b] mb-2.5"
                    use:canvasAction={stamp}
                  ></canvas>

                  <div class="w-full text-center">
                    <div class="text-xs font-semibold text-white truncate" title={stamp.name}>{stamp.name}</div>
                    <div class="text-[10px] text-gray-400 font-mono mt-0.5">
                      {stamp.width}×{stamp.height} st &bull; {Object.keys(stamp.stitches).length} st
                    </div>
                  </div>

                  <div class="w-full mt-3 flex items-center space-x-1">
                    <button
                      type="button"
                      class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1"
                      on:click={() => selectStamp(stamp)}
                    >
                      <Stamp size={13} />
                      <span>Use Stamp</span>
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                      on:click={() => handleDeleteCustom(stamp.id)}
                      title="Delete Custom Stamp"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

        <!-- TAB CONTENT: Built-in Categories (Accents, Corners, Borders) -->
        {:else}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {#each filteredMotifs as stamp}
              <div class="bg-[#22222e] border border-[#2d2d3c] rounded-xl p-3 flex flex-col items-center hover:border-emerald-500/60 transition-all group">
                <canvas
                  width="90"
                  height="90"
                  class="rounded-lg border border-gray-800 bg-[#14141b] mb-2.5"
                  use:canvasAction={stamp}
                ></canvas>

                <div class="w-full text-center">
                  <div class="text-xs font-semibold text-white truncate" title={stamp.name}>{stamp.name}</div>
                  <div class="text-[10px] text-gray-400 font-mono mt-0.5">
                    {stamp.width}×{stamp.height} st &bull; {Object.keys(stamp.stitches).length} st
                  </div>
                </div>

                <div class="w-full mt-3 flex flex-col space-y-1">
                  <button
                    type="button"
                    class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    on:click={() => selectStamp(stamp)}
                  >
                    <Stamp size={13} />
                    <span>Stamp on Canvas</span>
                  </button>

                  {#if activeTab === 'borders'}
                    <button
                      type="button"
                      class="w-full py-1 bg-[#2b2b3a] hover:bg-amber-600 hover:text-white text-amber-300 rounded text-[10px] font-medium transition-colors flex items-center justify-center space-x-1"
                      on:click={() => useInBorderMaker(stamp)}
                    >
                      <Frame size={12} />
                      <span>Use as Repeating Border</span>
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-3.5 bg-[#171720] border-t border-[#2d2d3c] flex items-center justify-between text-xs text-gray-400">
        <div>
          Tip: While hovering with a stamp on the canvas, press <kbd class="px-1.5 py-0.5 bg-gray-800 text-white rounded border border-gray-700 font-mono text-[10px]">R</kbd> to rotate 90° CW!
        </div>
        <button
          type="button"
          class="px-4 py-1.5 bg-[#2a2a36] hover:bg-[#343444] text-white rounded-lg text-xs font-medium transition-colors"
          on:click={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
