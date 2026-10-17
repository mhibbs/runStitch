<script lang="ts">
  import {
    activeTool,
    shapeFillMode,
    isBorderModalOpen,
    isMotifLibraryModalOpen,
    activeStamp
  } from '../stores/editorStore';
  import type { ActiveTool } from '../types';
  import {
    BoxSelect,
    Pencil,
    Eraser,
    PaintBucket,
    Pipette,
    Slash,
    Square,
    Circle,
    Stamp,
    Frame,
    Hand
  } from 'lucide-svelte';

  const drawTools: { id: ActiveTool; label: string; icon: any; shortcut: string }[] = [
    { id: 'select', label: 'Marquee Select (S)', icon: BoxSelect, shortcut: 'S' },
    { id: 'pencil', label: 'Pencil Stitch (B)', icon: Pencil, shortcut: 'B' },
    { id: 'eraser', label: 'Eraser (E)', icon: Eraser, shortcut: 'E' },
    { id: 'bucket', label: 'Flood Fill (F)', icon: PaintBucket, shortcut: 'F' },
    { id: 'picker', label: 'Eyedropper (I)', icon: Pipette, shortcut: 'I' }
  ];
</script>

<aside class="w-14 bg-[#1f1f26] border-r border-[#2e2e38] flex flex-col items-center py-3 select-none z-20 space-y-3 shadow-md overflow-y-auto overflow-x-hidden">
  <!-- Primary Drawing Tools -->
  <div class="flex flex-col space-y-1 w-full items-center">
    {#each drawTools as tool}
      <button
        class="w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group
        {$activeTool === tool.id
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
          : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
        on:click={() => activeTool.set(tool.id)}
        title={tool.label}
        aria-label={tool.label}
      >
        <svelte:component this={tool.icon} size={19} />
        <!-- Tooltip -->
        <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {tool.label}
        </span>
      </button>
    {/each}
  </div>

  <div class="w-7 h-px bg-[#2e2e38]"></div>

  <!-- Geometric Shape Tools (Visually Grouped Cluster) -->
  <div class="flex flex-col space-y-1 w-11 items-center p-1 bg-[#17171e] rounded-xl border border-[#2d2d3a] shadow-inner">
    <!-- Line Tool -->
    <button
      class="w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'line'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => activeTool.set('line')}
      title="Line Tool (L)"
      aria-label="Line Tool"
    >
      <Slash size={17} />
      <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Line Tool (L)
      </span>
    </button>

    <!-- Rectangle Tool (Filled icon when Solid mode is active) -->
    <button
      class="w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'rectangle'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => activeTool.set('rectangle')}
      title="Rectangle Tool (R) - {$shapeFillMode === 'filled' ? 'Solid Filled' : 'Hollow Outline'}"
      aria-label="Rectangle Tool"
    >
      <Square
        size={17}
        fill={$shapeFillMode === 'filled' ? 'currentColor' : 'none'}
        strokeWidth={$shapeFillMode === 'filled' ? 0 : 2}
      />
      <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Rectangle Tool (R) [{$shapeFillMode === 'filled' ? 'Solid' : 'Outline'}]
      </span>
    </button>

    <!-- Ellipse Tool (Filled icon when Solid mode is active) -->
    <button
      class="w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'ellipse'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => activeTool.set('ellipse')}
      title="Ellipse Tool (O) - {$shapeFillMode === 'filled' ? 'Solid Filled' : 'Hollow Outline'}"
      aria-label="Ellipse Tool"
    >
      <Circle
        size={17}
        fill={$shapeFillMode === 'filled' ? 'currentColor' : 'none'}
        strokeWidth={$shapeFillMode === 'filled' ? 0 : 2}
      />
      <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Ellipse Tool (O) [{$shapeFillMode === 'filled' ? 'Solid' : 'Outline'}]
      </span>
    </button>

    <!-- Fill / Outline Mode Toggle (Iconified Dual Segment) -->
    <div class="flex items-center justify-center bg-[#131319] p-0.5 rounded-md border border-[#2e2e3c] mt-0.5" title="Shape Style: Outline vs Solid Fill">
      <button
        type="button"
        class="w-4 h-4 rounded flex items-center justify-center transition-colors {$shapeFillMode === 'outline' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}"
        on:click={() => shapeFillMode.set('outline')}
        title="Outline (Hollow)"
        aria-label="Outline mode"
      >
        <Square size={9} strokeWidth={2} fill="none" />
      </button>
      <button
        type="button"
        class="w-4 h-4 rounded flex items-center justify-center transition-colors {$shapeFillMode === 'filled' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}"
        on:click={() => shapeFillMode.set('filled')}
        title="Solid (Filled)"
        aria-label="Solid Fill mode"
      >
        <Square size={9} strokeWidth={0} fill="currentColor" />
      </button>
    </div>
  </div>

  <div class="w-7 h-px bg-[#2e2e38]"></div>

  <!-- Creative Cross-Stitch Tools: Stamp Library & Border Maker -->
  <div class="flex flex-col space-y-1 w-full items-center">
    <!-- Motif Stamp Library -->
    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'stamp'
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
        : 'text-emerald-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => isMotifLibraryModalOpen.set(true)}
      title="Motif & Stamp Library"
      aria-label="Motif Library"
    >
      <Stamp size={19} />
      <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Motif & Stamp Library
      </span>
    </button>

    <!-- Border Repeater / Maker -->
    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group text-amber-400 hover:text-white hover:bg-[#2b2b36]"
      on:click={() => isBorderModalOpen.set(true)}
      title="Border Repeater & Perimeter Maker"
      aria-label="Border Maker"
    >
      <Frame size={19} />
      <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Border Repeater...
      </span>
    </button>

    <!-- Pan Tool -->
    <button
      type="button"
      class="w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group
      {$activeTool === 'pan'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
      on:click={() => activeTool.set('pan')}
      title="Pan Hand (H)"
      aria-label="Pan Tool"
    >
      <Hand size={19} />
      <span class="absolute left-14 bg-gray-900 border border-gray-700 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        Pan Hand (H)
      </span>
    </button>
  </div>

</aside>
