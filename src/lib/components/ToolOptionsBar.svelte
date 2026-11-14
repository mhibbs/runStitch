<script lang="ts">
  import {
    activeTool,
    activeStitchType,
    brushSize,
    eraserSize,
    shapeSize,
    activeColor,
    wandTolerance,
    wandContiguous,
    lassoFilterMode,
    selectionCombineMode,
    shapeFillMode,
    activeShapeTool,
    activeStamp,
    selection,
    floatingSelection,
    clearSelection,
    invertCurrentSelection,
    copySelection,
    cutSelection,
    openTextModal,
    quickDigitizeTextLayer,
    activeLayer,
    rotateActiveStamp,
    flipActiveStampHorizontal,
    flipActiveStampVertical,
    fitImageLayerToCanvas,
    rotateImageLayer,
    commitFloatingSelection,
    cancelFloatingSelection,
    rotate90,
    flipHorizontal,
    flipVertical,
    isMotifLibraryModalOpen,
    isBorderModalOpen,
    deleteSelection,
    pencilOnlyMode,
    hasDetectedPencil
  } from '../stores/editorStore';
  import type { StitchType } from '../types';
  import StitchIcon from './StitchIcon.svelte';
  import LineToolIcon from './LineToolIcon.svelte';
  import {
    BoxSelect,
    LassoSelect,
    Wand,
    Eraser,
    PaintBucket,
    Pipette,
    Square,
    Circle,
    Stamp,
    Frame,
    Hand,
    Type,
    Move,
    RotateCw,
    FlipHorizontal as FlipHIcon,
    FlipVertical as FlipVIcon,
    Maximize,
    Scissors,
    Copy,
    Check,
    X,
    Sparkles,
    ChevronRight,
    HelpCircle,
    Trash2,
    PenTool
  } from 'lucide-svelte';

  const stitchTypes: { id: StitchType; label: string; symbol: string; title: string }[] = [
    { id: 'full', label: 'Full Cross', symbol: '✕', title: 'Full Cross Stitch (X)' },
    { id: 'half_forward', label: 'Half Forward', symbol: '╱', title: 'Half Stitch Forward (/)' },
    { id: 'half_back', label: 'Half Back', symbol: '╲', title: 'Half Stitch Back (\\)' }
  ];

  function setTool(tool: any) {
    activeTool.set(tool);
  }
</script>

<div class="min-h-9 py-1 bg-[#171720] border-b border-[#282834] px-3 flex items-center justify-between text-xs text-gray-300 select-none z-20 shadow-sm shrink-0 overflow-x-auto overflow-y-hidden no-scrollbar">
  <!-- Left Side: Active Tool Indicator & Contextual Controls -->
  <div class="flex items-center space-x-3.5 min-w-max">
    <!-- Active Tool Badge -->
    <div class="flex items-center space-x-1.5 pr-2.5 border-r border-[#2d2d3c] text-indigo-300 font-medium">
      {#if $activeTool === 'move'}
        <Move size={14} class="text-indigo-400" />
        <span>Move</span>
      {:else if $activeTool === 'select'}
        <BoxSelect size={14} class="text-indigo-400" />
        <span>Marquee</span>
      {:else if $activeTool === 'lasso'}
        <LassoSelect size={14} class="text-indigo-400" />
        <span>Lasso</span>
      {:else if $activeTool === 'wand'}
        <Wand size={14} class="text-indigo-400" />
        <span>Magic Wand</span>
      {:else if $activeTool === 'pencil'}
        <StitchIcon type={$activeStitchType} color={$activeColor?.hex} size={15} />
        <span>Stitch</span>
      {:else if $activeTool === 'eraser'}
        <Eraser size={14} class="text-indigo-400" />
        <span>Eraser</span>
      {:else if $activeTool === 'bucket'}
        <PaintBucket size={14} class="text-indigo-400" />
        <span>Flood Fill</span>
      {:else if $activeTool === 'picker'}
        <Pipette size={14} class="text-indigo-400" />
        <span>Eyedropper</span>
      {:else if $activeTool === 'line' || $activeTool === 'rectangle' || $activeTool === 'ellipse'}
        {#if $activeTool === 'line'}
          <LineToolIcon size={14} />
          <span>Line</span>
        {:else if $activeTool === 'rectangle'}
          <Square size={14} class="text-indigo-400" />
          <span>Rectangle</span>
        {:else}
          <Circle size={14} class="text-indigo-400" />
          <span>Ellipse</span>
        {/if}
      {:else if $activeTool === 'text'}
        <Type size={14} class="text-indigo-400" />
        <span>Text</span>
      {:else if $activeTool === 'stamp'}
        <Stamp size={14} class="text-emerald-400" />
        <span class="text-emerald-300">Stamp</span>
      {:else if $activeTool === 'pan'}
        <Hand size={14} class="text-indigo-400" />
        <span>Pan</span>
      {/if}
    </div>

    <!-- Contextual Controls for Magic Wand -->
    {#if $activeTool === 'wand'}
      <!-- Selection Combine Mode -->
      <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'replace' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('replace')}
          title="New Selection (Replace)"
        >
          New
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'add' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('add')}
          title="Add to Selection (Shift)"
        >
          + Add
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'subtract' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('subtract')}
          title="Subtract from Selection (Alt / Option)"
        >
          - Sub
        </button>
      </div>

      <!-- Tolerance Slider & Value -->
      <div class="flex items-center space-x-1.5 pl-1">
        <span class="text-[11px] text-gray-400">Tolerance:</span>
        <input
          type="range"
          min="0"
          max="100"
          bind:value={$wandTolerance}
          class="w-20 accent-indigo-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
          title="Color distance tolerance (0 = exact match only, 100 = broad color family)"
        />
        <span class="font-mono text-[11px] text-gray-200 w-6 text-right font-medium">{$wandTolerance}</span>
      </div>

      <!-- Contiguous Checkbox -->
      <label class="flex items-center space-x-1.5 cursor-pointer pl-1 text-[11px] text-gray-300 hover:text-white" title="When checked, only contiguous connected stitches are selected. Uncheck to select all matching colors across the whole layer.">
        <input
          type="checkbox"
          bind:checked={$wandContiguous}
          class="rounded bg-[#121218] border-gray-600 text-indigo-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
        />
        <span>Contiguous</span>
      </label>

    <!-- Contextual Controls for Freehand Lasso -->
    {:else if $activeTool === 'lasso'}
      <!-- Selection Combine Mode -->
      <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'replace' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('replace')}
          title="New Selection (Replace)"
        >
          New
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'add' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('add')}
          title="Add to Selection (Shift)"
        >
          + Add
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'subtract' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('subtract')}
          title="Subtract from Selection (Alt / Option)"
        >
          - Sub
        </button>
      </div>

      <!-- Lasso Filter Mode -->
      <div class="flex items-center space-x-1.5 pl-1">
        <span class="text-[11px] text-gray-400">Capture:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] transition-colors {$lassoFilterMode === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
            on:click={() => lassoFilterMode.set('all')}
            title="Select all cells within the lasso loop"
          >
            All Cells
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] transition-colors {$lassoFilterMode === 'stitches_only' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
            on:click={() => lassoFilterMode.set('stitches_only')}
            title="Select only cells that have stitches on the active layer"
          >
            Stitches Only
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] transition-colors {$lassoFilterMode === 'active_color' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
            on:click={() => lassoFilterMode.set('active_color')}
            title="Select only stitches matching the active color in the palette"
          >
            Active Color
          </button>
        </div>
      </div>

      {#if $lassoFilterMode === 'active_color'}
        <div class="flex items-center space-x-1.5 pl-1">
          <span class="text-[11px] text-gray-400">Tolerance:</span>
          <input
            type="range"
            min="0"
            max="100"
            bind:value={$wandTolerance}
            class="w-16 accent-indigo-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
          />
          <span class="font-mono text-[11px] text-gray-200 w-5 text-right font-medium">{$wandTolerance}</span>
        </div>
      {/if}

    <!-- Contextual Controls for Marquee Select -->
    {:else if $activeTool === 'select'}
      <!-- Selection Combine Mode -->
      <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'replace' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('replace')}
          title="New Selection (Replace)"
        >
          New
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'add' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('add')}
          title="Add to Selection (Shift)"
        >
          + Add
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded text-[11px] transition-colors {$selectionCombineMode === 'subtract' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
          on:click={() => selectionCombineMode.set('subtract')}
          title="Subtract from Selection (Alt / Option)"
        >
          - Sub
        </button>
      </div>

      {#if $selection}
        <div class="flex items-center space-x-1 pl-1">
          <button
            type="button"
            class="px-2 py-0.5 rounded bg-[#20202c] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={copySelection}
            title="Copy Selection (Cmd+C)"
          >
            <Copy size={11} />
            <span>Copy</span>
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded bg-[#20202c] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={cutSelection}
            title="Cut Selection (Cmd+X)"
          >
            <Scissors size={11} />
            <span>Cut</span>
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded bg-[#20202c] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-[11px]"
            on:click={invertCurrentSelection}
            title="Invert Selection (Cmd+Shift+I)"
          >
            Invert
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded bg-[#20202c] hover:bg-red-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={deleteSelection}
            title="Delete Selection Stitches (Delete/Backspace)"
          >
            <Trash2 size={11} />
            <span>Delete</span>
          </button>
        </div>
      {/if}

    <!-- Contextual Controls for Pencil / Stitch Tool -->
    {:else if $activeTool === 'pencil'}
      <!-- Stitch Type Selector -->
      <div class="flex items-center space-x-1.5">
        <span class="text-[11px] text-gray-400">Stitch:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          {#each stitchTypes as st}
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] flex items-center space-x-1.5 transition-colors {$activeStitchType === st.id ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => activeStitchType.set(st.id)}
              title={st.title}
            >
              <StitchIcon type={st.id} color={$activeColor?.hex} size={14} />
              <span>{st.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Brush Size -->
      <div class="flex items-center space-x-1.5 pl-2 border-l border-[#2d2d3c]">
        <span class="text-[11px] text-gray-400">Size:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          {#each [1, 2, 3] as s}
            <button
              type="button"
              class="w-6 h-5 rounded text-[11px] flex items-center justify-center transition-colors {$brushSize === s ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => brushSize.set(s)}
              title="{s}×{s} cell block"
            >
              {s}×
            </button>
          {/each}
        </div>
      </div>

    <!-- Contextual Controls for Eraser -->
    {:else if $activeTool === 'eraser'}
      <div class="flex items-center space-x-1.5">
        <span class="text-[11px] text-gray-400">Eraser Size:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          {#each [1, 2, 3] as s}
            <button
              type="button"
              class="w-6 h-5 rounded text-[11px] flex items-center justify-center transition-colors {$eraserSize === s ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => eraserSize.set(s)}
              title="Eraser {s}×{s} cell block"
            >
              {s}×
            </button>
          {/each}
        </div>
      </div>

    <!-- Contextual Controls for Flood Fill Bucket -->
    {:else if $activeTool === 'bucket'}
      <!-- Fill Stitch Type -->
      <div class="flex items-center space-x-1.5">
        <span class="text-[11px] text-gray-400">Fill As:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          {#each stitchTypes as st}
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] flex items-center space-x-1.5 transition-colors {$activeStitchType === st.id ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => activeStitchType.set(st.id)}
              title="Fill with {st.title}"
            >
              <StitchIcon type={st.id} color={$activeColor?.hex} size={14} />
              <span>{st.label}</span>
            </button>
          {/each}
        </div>
      </div>

    <!-- Contextual Controls for Shape Tools -->
    {:else if $activeTool === 'line' || $activeTool === 'rectangle' || $activeTool === 'ellipse'}
      <!-- Shape Switcher -->
      <div class="flex items-center space-x-1.5">
        <span class="text-[11px] text-gray-400">Shape:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 transition-colors {$activeTool === 'rectangle' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
            on:click={() => setTool('rectangle')}
            title="Rectangle Tool (R)"
          >
            <Square size={11} />
            <span>Rect</span>
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 transition-colors {$activeTool === 'ellipse' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
            on:click={() => setTool('ellipse')}
            title="Ellipse Tool (O)"
          >
            <Circle size={11} />
            <span>Ellipse</span>
          </button>
          <button
            type="button"
            class="px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 transition-colors {$activeTool === 'line' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
            on:click={() => setTool('line')}
            title="Line Tool (L)"
          >
            <LineToolIcon size={12} />
            <span>Line</span>
          </button>
        </div>
      </div>

      {#if $activeTool !== 'line'}
        <!-- Outline vs Solid Fill Style -->
        <div class="flex items-center space-x-1.5 pl-2 border-l border-[#2d2d3c]">
          <span class="text-[11px] text-gray-400">Style:</span>
          <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] transition-colors {$shapeFillMode === 'outline' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => shapeFillMode.set('outline')}
              title="Hollow outline perimeter"
            >
              Outline
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] transition-colors {$shapeFillMode === 'filled' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => shapeFillMode.set('filled')}
              title="Solid filled shape interior"
            >
              Solid Fill
            </button>
          </div>
        </div>
      {/if}

      <!-- Shape Border / Line Thickness (Independent of Pencil & Eraser) -->
      {#if $activeTool === 'line' || $shapeFillMode === 'outline'}
        <div class="flex items-center space-x-1.5 pl-2 border-l border-[#2d2d3c]">
          <span class="text-[11px] text-gray-400">{$activeTool === 'line' ? 'Size:' : 'Border:'}</span>
          <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
            {#each [1, 2, 3] as s}
              <button
                type="button"
                class="w-6 h-5 rounded text-[11px] flex items-center justify-center transition-colors {$shapeSize === s ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => shapeSize.set(s)}
                title="Shape thickness {s}×{s}"
              >
                {s}×
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Shape Stitch Type -->
      <div class="flex items-center space-x-1.5 pl-2 border-l border-[#2d2d3c]">
        <span class="text-[11px] text-gray-400">Stitch:</span>
        <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
          {#each stitchTypes as st}
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] flex items-center space-x-1 transition-colors {$activeStitchType === st.id ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => activeStitchType.set(st.id)}
              title="Draw shape with {st.title}"
            >
              <StitchIcon type={st.id} color={$activeColor?.hex} size={14} />
            </button>
          {/each}
        </div>
      </div>

    <!-- Contextual Controls for Move Tool -->
    {:else if $activeTool === 'move'}
      {#if $floatingSelection}
        <div class="flex items-center space-x-2">
          <span class="text-amber-300 text-[11px] font-medium">Floating Selection Active:</span>
          <button
            type="button"
            class="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-1 shadow-sm text-[11px]"
            on:click={commitFloatingSelection}
            title="Commit Stitches to Active Layer (Enter)"
          >
            <Check size={12} />
            <span>Commit (Enter)</span>
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-[11px] flex items-center space-x-1"
            on:click={cancelFloatingSelection}
            title="Cancel Floating Selection (Esc)"
          >
            <X size={12} />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={() => rotate90(true)}
            title="Rotate 90° CW (R)"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={flipHorizontal}
            title="Flip Horizontal (H)"
          >
            <FlipHIcon size={13} />
          </button>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={flipVertical}
            title="Flip Vertical (V)"
          >
            <FlipVIcon size={13} />
          </button>
        </div>
      {:else if $activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text')}
        <div class="flex items-center space-x-2">
          <span class="text-cyan-300 text-[11px] font-medium">Active Layer: {$activeLayer.name}</span>
          <button
            type="button"
            class="px-2 py-1 rounded bg-[#20202c] hover:bg-cyan-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={() => fitImageLayerToCanvas($activeLayer.id)}
            title="Scale and center image to fill the pattern canvas"
          >
            <Maximize size={11} />
            <span>Fit Canvas</span>
          </button>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={() => rotateImageLayer($activeLayer.id, true)}
            title="Rotate 90° Clockwise"
          >
            <RotateCw size={13} />
          </button>
        </div>
      {:else}
        <span class="text-gray-400 text-[11px]">Click and drag anywhere to move layer stitches or floating selections</span>
      {/if}

    <!-- Contextual Controls for Text Tool -->
    {:else if $activeTool === 'text'}
      <div class="flex items-center space-x-2">
        <button
          type="button"
          class="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-1 shadow-sm text-[11px]"
          on:click={() => openTextModal()}
          title="Open Text Configuration & Typography Dialog"
        >
          <Type size={12} />
          <span>Edit Text...</span>
        </button>
        {#if $activeLayer && $activeLayer.type === 'text'}
          <button
            type="button"
            class="px-2 py-1 rounded bg-[#242434] hover:bg-purple-600 text-purple-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={() => quickDigitizeTextLayer($activeLayer.id)}
            title="Bake text into editable stitch cells (Enter)"
          >
            <Sparkles size={11} />
            <span>Bake to Stitches (Enter)</span>
          </button>
        {/if}
      </div>

    <!-- Contextual Controls for Stamp Tool -->
    {:else if $activeTool === 'stamp'}
      <div class="flex items-center space-x-2">
        {#if $activeStamp}
          <span class="text-emerald-300 text-[11px] font-medium truncate max-w-[150px]">
            Stamp: {$activeStamp.name} ({$activeStamp.width}×{$activeStamp.height})
          </span>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={() => rotateActiveStamp(true)}
            title="Rotate Stamp 90° Clockwise (R)"
          >
            <RotateCw size={13} />
          </button>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={flipActiveStampHorizontal}
            title="Flip Stamp Horizontally (H)"
          >
            <FlipHIcon size={13} />
          </button>
          <button
            type="button"
            class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
            on:click={flipActiveStampVertical}
            title="Flip Stamp Vertically (V)"
          >
            <FlipVIcon size={13} />
          </button>
        {/if}
        <button
          type="button"
          class="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-600 text-emerald-200 hover:text-white transition-colors text-[11px]"
          on:click={() => isMotifLibraryModalOpen.set(true)}
        >
          Choose Motif...
        </button>
      </div>

    <!-- Eyedropper / Pan prompt -->
    {:else if $activeTool === 'picker'}
      <span class="text-gray-400 text-[11px]">Click any stitch on the canvas to select its DMC floss color into your active palette</span>
    {:else if $activeTool === 'pan'}
      <span class="text-gray-400 text-[11px]">Click and drag canvas to pan view • Or hold Spacebar from any drawing tool</span>
    {/if}
  </div>

  <!-- Right Side: Floating Selection / Selection Quick Actions & Stylus Mode -->
  <div class="flex items-center space-x-2 pl-3 shrink-0">
    {#if $floatingSelection && $activeTool !== 'move'}
      <div class="flex items-center space-x-1.5 pl-2 border-l border-[#2d2d3c]">
        <button
          type="button"
          class="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-1 text-[11px]"
          on:click={commitFloatingSelection}
          title="Commit Stitches to Active Layer (Enter)"
        >
          <Check size={11} />
          <span>Commit</span>
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-[11px] flex items-center space-x-1"
          on:click={cancelFloatingSelection}
          title="Cancel Floating Selection (Esc)"
        >
          <X size={11} />
          <span>Cancel</span>
        </button>
        <button
          type="button"
          class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
          on:click={() => rotate90(true)}
          title="Rotate 90° CW (R)"
        >
          <RotateCw size={12} />
        </button>
        <button
          type="button"
          class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
          on:click={flipHorizontal}
          title="Flip Horizontal (H)"
        >
          <FlipHIcon size={12} />
        </button>
        <button
          type="button"
          class="p-1 rounded hover:bg-[#2b2b38] text-gray-300 hover:text-white"
          on:click={flipVertical}
          title="Flip Vertical (V)"
        >
          <FlipVIcon size={12} />
        </button>
      </div>
    {/if}

    {#if $selection}
      <div class="flex items-center space-x-1.5 pl-2 border-l border-[#2d2d3c] text-indigo-300 text-[11px] shrink-0">
        {#if $activeTool !== 'select'}
          <button
            type="button"
            class="px-1.5 py-0.5 rounded bg-[#20202c] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={copySelection}
            title="Copy Selection (Cmd+C)"
          >
            <Copy size={10} />
            <span class="hidden sm:inline">Copy</span>
          </button>
          <button
            type="button"
            class="px-1.5 py-0.5 rounded bg-[#20202c] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={cutSelection}
            title="Cut Selection (Cmd+X)"
          >
            <Scissors size={10} />
            <span class="hidden sm:inline">Cut</span>
          </button>
          <button
            type="button"
            class="px-1.5 py-0.5 rounded bg-[#20202c] hover:bg-red-600 text-gray-200 hover:text-white transition-colors text-[11px] flex items-center space-x-1"
            on:click={deleteSelection}
            title="Delete Selection Stitches (Delete/Backspace)"
          >
            <Trash2 size={10} />
            <span class="hidden sm:inline">Delete</span>
          </button>
        {/if}
        <span>{$selection.width}×{$selection.height} sel</span>
        <button
          type="button"
          class="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-red-600 hover:text-white text-gray-300 transition-colors flex items-center space-x-0.5 text-[10px]"
          on:click={clearSelection}
          title="Deselect (Esc)"
        >
          <X size={10} />
          <span>Esc</span>
        </button>
      </div>
    {/if}

    <button
      type="button"
      class="{$hasDetectedPencil ? 'flex' : 'hidden [@media(pointer:coarse)]:flex'} items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer shrink-0
      {$pencilOnlyMode
        ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-200 hover:bg-indigo-600/40'
        : 'bg-[#20202c] border-[#323244] text-gray-300 hover:text-white hover:bg-[#2a2a38]'}"
      on:click={() => pencilOnlyMode.update(v => !v)}
      title={$pencilOnlyMode
        ? 'Pencil Draws / Finger Pans enabled — tap to allow finger drawing'
        : 'Tap to enable Pencil Draws / Finger Pans mode'}
    >
      {#if $pencilOnlyMode}
        <PenTool size={11} class="text-indigo-400" />
        <span>Pencil Draws</span>
        <span class="text-gray-400 hidden sm:inline">/ Finger Pans</span>
      {:else}
        <Hand size={11} class="text-gray-400" />
        <span>Touch Draws</span>
      {/if}
    </button>
  </div>
</div>
