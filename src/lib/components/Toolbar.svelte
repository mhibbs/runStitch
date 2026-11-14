<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    activeTool,
    activeStitchType,
    activeShapeTool,
    shapeFillMode,
    shapeSize,
    activeColor,
    isBorderModalOpen,
    isMotifLibraryModalOpen,
    activeStamp,
    openTextModal
  } from '../stores/editorStore';
  import type { ActiveTool, StitchType } from '../types';
  import StitchIcon from './StitchIcon.svelte';
  import LineToolIcon from './LineToolIcon.svelte';
  import {
    Move,
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
    Check
  } from 'lucide-svelte';

  const selectionTools: { id: ActiveTool; label: string; icon: any; shortcut: string }[] = [
    { id: 'select', label: 'Marquee Select (S)', icon: BoxSelect, shortcut: 'S' },
    { id: 'lasso', label: 'Lasso Tool (Q)', icon: LassoSelect, shortcut: 'Q' },
    { id: 'wand', label: 'Magic Wand (W)', icon: Wand, shortcut: 'W' }
  ];

  const drawTools: { id: ActiveTool; label: string; icon: any; shortcut: string }[] = [
    { id: 'eraser', label: 'Eraser (E)', icon: Eraser, shortcut: 'E' },
    { id: 'bucket', label: 'Flood Fill (F)', icon: PaintBucket, shortcut: 'F' },
    { id: 'picker', label: 'Eyedropper (I)', icon: Pipette, shortcut: 'I' }
  ];

  const shapeVariants: { id: 'rectangle' | 'ellipse' | 'line'; label: string; icon: any; shortcut: string }[] = [
    { id: 'rectangle', label: 'Rectangle (R)', icon: Square, shortcut: 'R' },
    { id: 'ellipse', label: 'Ellipse (O)', icon: Circle, shortcut: 'O' },
    { id: 'line', label: 'Line (L)', icon: LineToolIcon, shortcut: 'L' }
  ];

  const stitchTypeVariants: { id: StitchType; label: string; symbol: string; desc: string }[] = [
    { id: 'full', label: 'Full Cross', symbol: '✕', desc: 'Standard X stitch' },
    { id: 'half_forward', label: 'Half Forward', symbol: '╱', desc: 'Diagonal / stitch' },
    { id: 'half_back', label: 'Half Back', symbol: '╲', desc: 'Diagonal \\ stitch' }
  ];

  let openFlyout: 'shapes' | 'stitch' | null = null;
  let longPressTimer: any = null;

  function closeFlyout() {
    openFlyout = null;
    clearTimeout(longPressTimer);
  }

  function handlePointerDown(flyout: 'shapes' | 'stitch') {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      openFlyout = flyout;
    }, 350);
  }

  function handlePointerUp() {
    clearTimeout(longPressTimer);
  }

  function selectShape(id: 'rectangle' | 'ellipse' | 'line') {
    activeShapeTool.set(id);
    activeTool.set(id);
    closeFlyout();
  }

  function selectStitchType(type: StitchType) {
    activeStitchType.set(type);
    activeTool.set('pencil');
    closeFlyout();
  }

  function toggleShapeTool() {
    activeTool.set($activeShapeTool);
  }

  $: isShapeActive = $activeTool === 'line' || $activeTool === 'rectangle' || $activeTool === 'ellipse';

  // Global click outside to dismiss flyouts
  function handleWindowClick(e: MouseEvent) {
    if (openFlyout) {
      const target = e.target as HTMLElement;
      if (!target.closest('.tool-flyout-container')) {
        closeFlyout();
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleWindowClick);
  }

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', handleWindowClick);
    }
    clearTimeout(longPressTimer);
  });
</script>

<aside class="w-14 bg-[#1f1f26] border-r border-[#2e2e38] flex flex-col items-center py-3 select-none z-20 space-y-2 sm:space-y-2.5 shadow-md relative max-h-full {openFlyout ? 'overflow-visible' : 'overflow-y-auto no-scrollbar'}">
  <!-- Move Tool (M) -->
  <button
    class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
    {$activeTool === 'move'
      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
      : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
    on:click={() => { closeFlyout(); activeTool.set('move'); }}
    title="Move Tool (M) - Drag selections or whole layer"
    aria-label="Move Tool"
  >
    <Move size={19} />
    <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
      Move Tool (M)
    </span>
  </button>

  <div class="w-7 h-px shrink-0 bg-[#2e2e38]"></div>

  <!-- Selection Tools Cluster -->
  <div class="flex flex-col space-y-1 w-12 items-center p-1 bg-[#17171e] rounded-xl border border-[#2d2d3a] shadow-inner shrink-0">
    {#each selectionTools as tool}
      <button
        class="w-9 h-9 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
        {$activeTool === tool.id
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
        on:click={() => { closeFlyout(); activeTool.set(tool.id); }}
        title={tool.label}
        aria-label={tool.label}
      >
        <svelte:component this={tool.icon} size={17} />
        <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {tool.label}
        </span>
      </button>
    {/each}
  </div>

  <div class="w-7 h-px shrink-0 bg-[#2e2e38]"></div>

  <!-- Primary Drawing Tools -->
  <div class="flex flex-col space-y-1 w-full items-center shrink-0">
    <!-- Pencil Tool with Stitch Type Flyout -->
    <div class="relative tool-flyout-container">
      <button
        class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
        {$activeTool === 'pencil'
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
        on:click={() => {
          if (openFlyout === 'stitch') {
            closeFlyout();
          } else {
            activeTool.set('pencil');
          }
        }}
        on:contextmenu|preventDefault={() => { openFlyout = openFlyout === 'stitch' ? null : 'stitch'; }}
        on:pointerdown={() => handlePointerDown('stitch')}
        on:pointerup={handlePointerUp}
        on:pointerleave={handlePointerUp}
        title="Stitch Tool (B) - Right-click or hold for stitch types"
        aria-label="Stitch Tool"
      >
        <StitchIcon type={$activeStitchType} color={$activeColor?.hex} size={21} />

        <!-- Tiny Photoshop Corner Mark Indicator -->
        <button
          type="button"
          aria-label="Stitch types flyout"
          class="absolute bottom-0.5 right-0.5 w-2 h-2 flex items-end justify-end cursor-pointer group/corner p-0 bg-transparent border-0"
          on:click|stopPropagation={() => { openFlyout = openFlyout === 'stitch' ? null : 'stitch'; }}
          title="Stitch types flyout"
        >
          <span class="w-0 h-0 border-solid border-t-0 border-l-0 border-r-[4.5px] border-b-[4.5px] border-transparent border-r-gray-400 group-hover/corner:border-r-indigo-300 pointer-events-none"></span>
        </button>

        <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          Stitch Tool (B) [{$activeStitchType === 'half_forward' ? 'Half /' : ($activeStitchType === 'half_back' ? 'Half \\' : 'Full X')}]
        </span>
      </button>

      <!-- Stitch Type Horizontal Flyout Menu -->
      {#if openFlyout === 'stitch'}
        <div class="absolute left-12 top-0 bg-[#1b1b24] border border-[#38384a] rounded-xl shadow-2xl p-1.5 flex items-center space-x-1.5 z-50">
          {#each stitchTypeVariants as st}
            <button
              type="button"
              class="flex flex-col items-center justify-center p-2 rounded-lg transition-all min-w-[58px]
              {$activeStitchType === st.id && $activeTool === 'pencil'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-[#2b2b3a]'}"
              on:click={() => selectStitchType(st.id)}
              title={st.desc}
            >
              <div class="mb-1">
                <StitchIcon type={st.id} color={$activeColor?.hex} size={20} />
              </div>
              <span class="text-[10px] font-medium leading-tight whitespace-nowrap">{st.label}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Other Draw Tools: Eraser, Bucket, Pipette -->
    {#each drawTools as tool}
      <button
        class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
        {$activeTool === tool.id
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
        on:click={() => { closeFlyout(); activeTool.set(tool.id); }}
        title={tool.label}
        aria-label={tool.label}
      >
        <svelte:component this={tool.icon} size={19} />
        <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {tool.label}
        </span>
      </button>
    {/each}
  </div>

  <div class="w-7 h-px shrink-0 bg-[#2e2e38]"></div>

  <!-- Consolidated Geometric Shape Slot with Photoshop Flyout -->
  <div class="relative tool-flyout-container shrink-0">
    <button
      class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
      {isShapeActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => {
        if (openFlyout === 'shapes') {
          closeFlyout();
        } else {
          toggleShapeTool();
        }
      }}
      on:contextmenu|preventDefault={() => { openFlyout = openFlyout === 'shapes' ? null : 'shapes'; }}
      on:pointerdown={() => handlePointerDown('shapes')}
      on:pointerup={handlePointerUp}
      on:pointerleave={handlePointerUp}
      title="Geometric Shapes - Right-click or hold for Line, Rectangle, Ellipse"
      aria-label="Shape Tools"
    >
      {#if $activeShapeTool === 'rectangle'}
        <Square
          size={18}
          fill={$shapeFillMode === 'filled' ? 'currentColor' : 'none'}
          strokeWidth={$shapeFillMode === 'filled' ? 0 : 2}
        />
      {:else if $activeShapeTool === 'ellipse'}
        <Circle
          size={18}
          fill={$shapeFillMode === 'filled' ? 'currentColor' : 'none'}
          strokeWidth={$shapeFillMode === 'filled' ? 0 : 2}
        />
      {:else}
        <LineToolIcon size={18} />
      {/if}

      <!-- Tiny Photoshop Corner Mark Indicator -->
      <button
        type="button"
        aria-label="Shape tools flyout"
        class="absolute bottom-0.5 right-0.5 w-2 h-2 flex items-end justify-end cursor-pointer group/corner p-0 bg-transparent border-0"
        on:click|stopPropagation={() => { openFlyout = openFlyout === 'shapes' ? null : 'shapes'; }}
        title="Shape tools flyout"
      >
        <span class="w-0 h-0 border-solid border-t-0 border-l-0 border-r-[4.5px] border-b-[4.5px] border-transparent border-r-gray-400 group-hover/corner:border-r-indigo-300 pointer-events-none"></span>
      </button>

      <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Shape ({$activeShapeTool.toUpperCase()}) • Right-click or hold for flyout
      </span>
    </button>

    <!-- Shape Flyout Menu -->
    {#if openFlyout === 'shapes'}
      <div class="absolute left-12 top-0 bg-[#1b1b24] border border-[#38384a] rounded-xl shadow-2xl p-2 flex flex-col space-y-2 z-50 min-w-[170px]">
        <div class="text-[10px] uppercase font-semibold text-gray-400 px-1 tracking-wider">Shape Tools</div>
        <div class="flex flex-col space-y-1">
          {#each shapeVariants as sv}
            <button
              type="button"
              class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors
              {$activeTool === sv.id && isShapeActive
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-gray-300 hover:text-white hover:bg-[#2b2b3a]'}"
              on:click={() => selectShape(sv.id)}
            >
              <div class="flex items-center space-x-2">
                <svelte:component this={sv.icon} size={15} />
                <span>{sv.label}</span>
              </div>
              <span class="text-[10px] text-gray-400">{sv.shortcut}</span>
            </button>
          {/each}
        </div>

        <div class="border-t border-[#2e2e3c] pt-2 flex items-center justify-between px-1">
          <span class="text-[11px] text-gray-400">Style:</span>
          <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] transition-colors {$shapeFillMode === 'outline' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => shapeFillMode.set('outline')}
            >
              Outline
            </button>
            <button
              type="button"
              class="px-2 py-0.5 rounded text-[11px] transition-colors {$shapeFillMode === 'filled' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => shapeFillMode.set('filled')}
            >
              Solid
            </button>
          </div>
        </div>

        <div class="border-t border-[#2e2e3c] pt-2 flex items-center justify-between px-1">
          <span class="text-[11px] text-gray-400">Size:</span>
          <div class="flex items-center space-x-1 bg-[#121218] p-0.5 rounded border border-[#2b2b3a]">
            {#each [1, 2, 3] as s}
              <button
                type="button"
                class="w-6 h-5 rounded text-[11px] flex items-center justify-center transition-colors {$shapeSize === s ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
                on:click={() => shapeSize.set(s)}
                title="Shape border/line thickness {s}×"
              >
                {s}×
              </button>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="w-7 h-px shrink-0 bg-[#2e2e38]"></div>

  <!-- Creative Cross-Stitch Tools: Stamp Library & Border Maker -->
  <div class="flex flex-col space-y-1 w-full items-center shrink-0">
    <!-- Motif Stamp Library -->
    <button
      type="button"
      class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'stamp'
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
        : 'text-emerald-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => { closeFlyout(); isMotifLibraryModalOpen.set(true); }}
      title="Motif & Stamp Library"
      aria-label="Motif Library"
    >
      <Stamp size={19} />
      <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Motif & Stamp Library
      </span>
    </button>

    <!-- Border Repeater / Maker -->
    <button
      type="button"
      class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group text-amber-400 hover:text-white hover:bg-[#2b2b36]"
      on:click={() => { closeFlyout(); isBorderModalOpen.set(true); }}
      title="Border Repeater & Perimeter Maker"
      aria-label="Border Maker"
    >
      <Frame size={19} />
      <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Border Repeater...
      </span>
    </button>

    <!-- Typography Text Tool -->
    <button
      type="button"
      class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'text'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-indigo-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => { closeFlyout(); activeTool.set('text'); openTextModal(); }}
      title="Typography Text Tool (T)"
      aria-label="Text Tool"
    >
      <Type size={19} />
      <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Typography & Text (T)
      </span>
    </button>

    <!-- Pan Tool -->
    <button
      type="button"
      class="w-10 h-10 shrink-0 touch-target rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'pan'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => { closeFlyout(); activeTool.set('pan'); }}
      title="Pan Hand (H)"
      aria-label="Pan Tool"
    >
      <Hand size={19} />
      <span class="hidden md:block absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Pan Hand (H)
      </span>
    </button>
  </div>
</aside>
