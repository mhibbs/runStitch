<script lang="ts">
  import {
    isBorderModalOpen,
    grid,
    layers,
    activeLayerId,
    selection,
    borderInitialMotif,
    applyBorderStitches,
    selectedColorId,
    activeColor,
    fabricColor
  } from '../stores/editorStore';
  import type { MotifStamp, CompositeBorder } from '../types';
  import { BUILTIN_MOTIFS, COMPOSITE_BORDERS } from '../data/motifLibrary';
  import { DMC_CATALOG } from '../data/dmcPalette';
  import {
    generateBorderStitches,
    calculateBorderFit,
    type BorderGeneratorParams,
    type PlacedStitch
  } from '../engine/borderGenerator';
  import { X, Frame, Check, Layers, Sliders, Sparkles, Wand2 } from 'lucide-svelte';

  let borderMotifs = BUILTIN_MOTIFS.filter(m => m.category === 'borders');
  let selectedMotif: MotifStamp = borderMotifs[0];

  type BorderType = 'composite' | 'single';
  let borderType: BorderType = 'composite';
  let selectedComposite: CompositeBorder = COMPOSITE_BORDERS[0];

  type BorderMode = 'perimeter_canvas' | 'perimeter_selection' | 'horizontal_band' | 'vertical_band';
  let mode: BorderMode = 'perimeter_canvas';

  let margin = 2;
  let spacing = 0;
  let autoCorners = true;
  let targetLayerOption: 'active' | 'new' = 'active';
  let newLayerName = 'Decorative Border';
  let colorMode: 'original' | 'active_color' = 'original';

  let bandCoordinate = 20;
  let lastMode: BorderMode = 'perimeter_canvas';

  // Update default band coordinate ONLY when switching to a band mode
  $: if (mode !== lastMode) {
    lastMode = mode;
    if (mode === 'horizontal_band') {
      bandCoordinate = Math.floor($grid.height / 2);
    } else if (mode === 'vertical_band') {
      bandCoordinate = Math.floor($grid.width / 2);
    }
  }

  // If an initial motif was explicitly requested (e.g. from Motif Library "Use in Border Maker"), use it
  $: if ($borderInitialMotif && $isBorderModalOpen) {
    selectedMotif = $borderInitialMotif;
    borderType = 'single';
    borderInitialMotif.set(null);
  }

  function closeModal() {
    isBorderModalOpen.set(false);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && $isBorderModalOpen) {
      closeModal();
    }
  }

  // Calculate live preview stitches and auto-fitting metrics
  $: calculatedParams = {
    motif: borderType === 'single' ? selectedMotif : undefined,
    compositeBorder: borderType === 'composite' ? selectedComposite : undefined,
    mode,
    bounds:
      mode === 'perimeter_selection' && $selection
        ? { x: $selection.x, y: $selection.y, width: $selection.width, height: $selection.height }
        : { x: 0, y: 0, width: $grid.width, height: $grid.height },
    margin,
    spacing,
    autoCorners,
    bandCoordinate
  } as BorderGeneratorParams;

  $: fitMetrics = calculateBorderFit(calculatedParams);
  $: previewStitches = generateBorderStitches(calculatedParams);

  function handleApply() {
    if (previewStitches.length === 0) return;
    const borderTitle = borderType === 'composite' ? selectedComposite.name : selectedMotif.name;
    applyBorderStitches(
      previewStitches,
      targetLayerOption,
      newLayerName.trim() || borderTitle || 'Border',
      colorMode === 'active_color'
    );
    closeModal();
  }

  // Canvas preview rendering (reactive to stitches, cloth color, colorMode, and active floss)
  let previewCanvas: HTMLCanvasElement;
  $: if (previewCanvas && previewStitches && $fabricColor && colorMode && $activeColor) {
    renderMiniPreview(previewCanvas, previewStitches, $grid.width, $grid.height, $fabricColor, colorMode, $activeColor);
  }

  function renderMiniPreview(
    canvas: HTMLCanvasElement,
    stitches: PlacedStitch[],
    gridW: number,
    gridH: number,
    clothHex: string,
    modeColor: 'original' | 'active_color',
    floss: { dmc: string; hex: string }
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Modal dark backdrop
    ctx.fillStyle = '#14141b';
    ctx.fillRect(0, 0, w, h);

    const pad = 8;
    const scaleX = (w - pad * 2) / gridW;
    const scaleY = (h - pad * 2) / gridH;
    const scale = Math.min(scaleX, scaleY);

    const clothPixelW = gridW * scale;
    const clothPixelH = gridH * scale;
    const offsetX = Math.round((w - clothPixelW) / 2);
    const offsetY = Math.round((h - clothPixelH) / 2);

    // Aida cloth background using active fabric color
    ctx.fillStyle = clothHex;
    ctx.fillRect(offsetX, offsetY, clothPixelW, clothPixelH);

    // Subtle cloth border
    ctx.strokeStyle = '#4a4a58';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, clothPixelW, clothPixelH);

    const dmcMap = new Map(DMC_CATALOG.map(d => [d.code, d.hex]));

    // Render stitches using chosen colorMode
    for (const s of stitches) {
      const px = Math.floor(offsetX + s.x * scale);
      const py = Math.floor(offsetY + s.y * scale);
      const hex = modeColor === 'active_color' ? floss.hex : (dmcMap.get(s.dmc) || '#6366F1');

      ctx.fillStyle = hex;
      ctx.fillRect(px, py, Math.max(1, scale), Math.max(1, scale));
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if $isBorderModalOpen}
  <div
    class="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
    on:click|self={closeModal}
    role="presentation"
  >
    <div
      class="bg-[#1b1b24] border border-[#2d2d3c] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-gray-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="border-modal-title"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-[#2d2d3c] flex items-center justify-between bg-[#21212c]">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Frame size={20} />
          </div>
          <div>
            <h2 id="border-modal-title" class="text-base font-bold text-white tracking-wide">
              Border Repeater & Perimeter Maker
            </h2>
            <p class="text-xs text-gray-400">
              Auto-fits repeating borders with balanced margins and perfect corners
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

      <!-- Main Body -->
      <div class="p-6 overflow-y-auto flex-1 space-y-5">
        <!-- 1. Border Style Selector (2-Part Composite vs Single Seamless) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Select Border Style</span>
            <div class="flex bg-[#16161f] p-0.5 rounded-lg border border-[#2d2d3c] text-xs">
              <button
                type="button"
                class="px-3 py-1 rounded-md transition-colors {borderType === 'composite' ? 'bg-amber-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}"
                on:click={() => (borderType = 'composite')}
              >
                2-Part Borders (Corner + Runner)
              </button>
              <button
                type="button"
                class="px-3 py-1 rounded-md transition-colors {borderType === 'single' ? 'bg-amber-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}"
                on:click={() => (borderType = 'single')}
              >
                Seamless Unit Motifs
              </button>
            </div>
          </div>

          {#if borderType === 'composite'}
            <div class="grid grid-cols-2 gap-2.5">
              {#each COMPOSITE_BORDERS as comp}
                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all
                  {selectedComposite.id === comp.id
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-[#22222e] border-[#2e2e3e] text-gray-400 hover:text-white hover:bg-[#282836]'}"
                  on:click={() => (selectedComposite = comp)}
                >
                  <div class="w-8 h-8 rounded-lg bg-[#171720] border border-gray-700 flex flex-col items-center justify-center text-amber-400 shrink-0 font-bold text-[10px]">
                    <span>{comp.cornerMotif.width}×{comp.cornerMotif.height}</span>
                  </div>
                  <div class="truncate">
                    <div class="text-xs font-medium truncate">{comp.name}</div>
                    <div class="text-[10px] text-gray-400 font-mono">Corner + Runner Band</div>
                  </div>
                </button>
              {/each}
            </div>
          {:else}
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {#each borderMotifs as motif}
                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all
                  {selectedMotif.id === motif.id
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-[#22222e] border-[#2e2e3e] text-gray-400 hover:text-white hover:bg-[#282836]'}"
                  on:click={() => (selectedMotif = motif)}
                >
                  <div class="w-7 h-7 rounded bg-[#171720] border border-gray-700 flex items-center justify-center text-amber-400 shrink-0 font-bold text-xs">
                    {motif.width}×{motif.height}
                  </div>
                  <div class="truncate">
                    <div class="text-xs font-medium truncate">{motif.name}</div>
                    <div class="text-[10px] text-gray-500 font-mono">{Object.keys(motif.stitches).length} st</div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- 2. Target Mode -->
        <div class="space-y-2">
          <div class="text-xs font-semibold text-gray-300 uppercase tracking-wider">Border Placement</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              class="p-3 rounded-xl border text-left transition-all
              {mode === 'perimeter_canvas'
                ? 'bg-indigo-950/50 border-indigo-500 text-white'
                : 'bg-[#22222e] border-[#2e2e3e] text-gray-400 hover:text-white'}"
              on:click={() => (mode = 'perimeter_canvas')}
            >
              <div class="font-semibold text-xs">Canvas Perimeter</div>
              <div class="text-[10px] text-gray-400 mt-0.5">Along all 4 edges of the pattern</div>
            </button>

            <button
              type="button"
              class="p-3 rounded-xl border text-left transition-all
              {mode === 'perimeter_selection'
                ? 'bg-indigo-950/50 border-indigo-500 text-white'
                : 'bg-[#22222e] border-[#2e2e3e] text-gray-400 hover:text-white'}"
              on:click={() => (mode = 'perimeter_selection')}
              disabled={!$selection}
            >
              <div class="font-semibold text-xs">Selection Perimeter</div>
              <div class="text-[10px] text-gray-400 mt-0.5">
                {$selection ? `Around ${$selection.width}×${$selection.height} st selection` : 'Requires active selection'}
              </div>
            </button>

            <button
              type="button"
              class="p-3 rounded-xl border text-left transition-all
              {mode === 'horizontal_band'
                ? 'bg-indigo-950/50 border-indigo-500 text-white'
                : 'bg-[#22222e] border-[#2e2e3e] text-gray-400 hover:text-white'}"
              on:click={() => (mode = 'horizontal_band')}
            >
              <div class="font-semibold text-xs">Horizontal Runner</div>
              <div class="text-[10px] text-gray-400 mt-0.5">Single horizontal row across canvas</div>
            </button>

            <button
              type="button"
              class="p-3 rounded-xl border text-left transition-all
              {mode === 'vertical_band'
                ? 'bg-indigo-950/50 border-indigo-500 text-white'
                : 'bg-[#22222e] border-[#2e2e3e] text-gray-400 hover:text-white'}"
              on:click={() => (mode = 'vertical_band')}
            >
              <div class="font-semibold text-xs">Vertical Runner</div>
              <div class="text-[10px] text-gray-400 mt-0.5">Single vertical column down canvas</div>
            </button>
          </div>
        </div>

        <!-- 3. Sliders & Placement Settings -->
        <div class="bg-[#22222e] border border-[#2d2d3c] rounded-xl p-4 space-y-4">
          <!-- Auto-fitting math summary badge -->
          <div class="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center justify-between text-xs text-amber-200">
            <div class="flex items-center space-x-2">
              <Sparkles size={14} class="text-amber-400" />
              <span>{fitMetrics.summary}</span>
            </div>
            <span class="font-mono text-[11px] text-amber-400">
              Border: {fitMetrics.borderWidth}×{fitMetrics.borderHeight} st
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Margin -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-300 font-medium">Requested Margin from Edge</span>
                <span class="text-amber-400 font-mono font-semibold">{margin} st</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.min(25, Math.floor($grid.width / 3))}
                bind:value={margin}
                class="w-full accent-amber-500 bg-[#16161f] rounded-lg h-2"
              />
              <div class="text-[10px] text-gray-400">
                Auto-fit centers evenly at {fitMetrics.effectiveMarginX}×{fitMetrics.effectiveMarginY} st
              </div>
            </div>

            <!-- Spacing -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-300 font-medium">Spacing Between Repeats</span>
                <span class="text-amber-400 font-mono font-semibold">{spacing} st</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                bind:value={spacing}
                class="w-full accent-amber-500 bg-[#16161f] rounded-lg h-2"
              />
              <div class="text-[10px] text-gray-400">
                Gap between consecutive runner motifs
              </div>
            </div>
          </div>

          <!-- Runner Coordinate (working smoothly for band modes) -->
          {#if mode === 'horizontal_band' || mode === 'vertical_band'}
            <div class="space-y-1 pt-2 border-t border-[#2e2e3c]">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-300 font-medium">
                  {mode === 'horizontal_band' ? 'Band Row Position (Grid Y)' : 'Band Column Position (Grid X)'}
                </span>
                <span class="text-amber-400 font-mono font-semibold">{bandCoordinate} st</span>
              </div>
              <input
                type="range"
                min="0"
                max={mode === 'horizontal_band' ? Math.max(0, $grid.height - (borderType === 'composite' ? selectedComposite.runnerMotif.height : selectedMotif.height)) : Math.max(0, $grid.width - (borderType === 'composite' ? selectedComposite.runnerMotif.width : selectedMotif.width))}
                bind:value={bandCoordinate}
                class="w-full accent-amber-500 bg-[#16161f] rounded-lg h-2"
              />
            </div>
          {/if}

          <!-- Corner Handling & Color Mode -->
          <div class="pt-2 border-t border-[#2e2e3c] flex flex-wrap items-center justify-between gap-4 text-xs">
            {#if mode === 'perimeter_canvas' || mode === 'perimeter_selection'}
              <label class="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  bind:checked={autoCorners}
                  class="rounded bg-[#181820] border-gray-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Auto-rotate & mirror corner motifs</span>
              </label>
            {/if}

            <div class="flex items-center space-x-3">
              <span class="text-gray-400">Color:</span>
              <label class="flex items-center space-x-1.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="radio"
                  name="colorMode"
                  value="original"
                  bind:group={colorMode}
                  class="text-amber-500 focus:ring-amber-500"
                />
                <span>Motif Colors</span>
              </label>
              <label class="flex items-center space-x-1.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="radio"
                  name="colorMode"
                  value="active_color"
                  bind:group={colorMode}
                  class="text-amber-500 focus:ring-amber-500"
                />
                <span>Active Swatch ({$activeColor.name})</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 4. Target Layer & Live Preview -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <!-- Layer Placement -->
          <div class="space-y-2 text-xs">
            <div class="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">Destination Layer</div>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="radio"
                  name="targetLayer"
                  value="active"
                  bind:group={targetLayerOption}
                  class="text-amber-500"
                />
                <span>Add to Active Layer</span>
              </label>

              <label class="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="radio"
                  name="targetLayer"
                  value="new"
                  bind:group={targetLayerOption}
                  class="text-amber-500"
                />
                <span>Create New Dedicated "Border" Layer</span>
              </label>
            </div>
          </div>

          <!-- Live Miniature Canvas Preview on Fabric Color -->
          <div class="flex flex-col items-center justify-center p-3 bg-[#15151e] border border-[#2d2d3c] rounded-xl shadow-inner">
            <canvas
              bind:this={previewCanvas}
              width="200"
              height="130"
              class="rounded border border-gray-700 shadow-sm"
            ></canvas>
            <div class="text-[11px] font-mono text-gray-400 mt-2">
              Will place <strong class="text-amber-400">{previewStitches.length} st</strong> on {$fabricColor} cloth
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-[#171720] border-t border-[#2d2d3c] flex items-center justify-between">
        <button
          type="button"
          class="px-4 py-2 bg-[#2a2a36] hover:bg-[#343444] text-white rounded-lg text-xs font-medium transition-colors"
          on:click={closeModal}
        >
          Cancel
        </button>

        <button
          type="button"
          class="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-lg shadow-amber-600/30 disabled:opacity-50"
          on:click={handleApply}
          disabled={previewStitches.length === 0}
        >
          <Check size={16} />
          <span>Apply Border ({previewStitches.length} st)</span>
        </button>
      </div>
    </div>
  </div>
{/if}
