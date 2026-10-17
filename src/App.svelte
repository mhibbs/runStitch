<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import Toolbar from './lib/components/Toolbar.svelte';
  import CanvasViewport from './lib/components/CanvasViewport.svelte';
  import PaletteDock from './lib/components/PaletteDock.svelte';
  import LayerManager from './lib/components/LayerManager.svelte';
  import NewProjectModal from './lib/components/NewProjectModal.svelte';
  import CanvasSizeModal from './lib/components/CanvasSizeModal.svelte';
  import ShortcutsModal from './lib/components/ShortcutsModal.svelte';
  import ClearLayerModal from './lib/components/ClearLayerModal.svelte';
  import MotifLibraryModal from './lib/components/MotifLibraryModal.svelte';
  import BorderMakerModal from './lib/components/BorderMakerModal.svelte';
  import SaveProjectModal from './lib/components/SaveProjectModal.svelte';
  import DigitizerModal from './lib/components/DigitizerModal.svelte';
  import TextModal from './lib/components/TextModal.svelte';
  import {
    activeTool,
    undo,
    redo,
    palette,
    layers,
    isNewProjectModalOpen,
    isCanvasSizeModalOpen,
    isShortcutsModalOpen,
    isMotifLibraryModalOpen,
    isBorderModalOpen,
    isSaveModalOpen,
    copySelection,
    cutSelection,
    pasteClipboard,
    selectAll,
    clearSelection,
    invertCurrentSelection,
    deleteSelection,
    selection,
    activeStamp,
    rotateActiveStamp,
    flipActiveStampHorizontal,
    flipActiveStampVertical,
    floatingSelection,
    rotate90,
    flipHorizontal,
    flipVertical,
    addReferenceImageLayer,
    openTextModal
  } from './lib/stores/editorStore';
  import { SwatchBook, Layers as LayersIcon, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-svelte';

  let isPaletteExpanded = true;
  let isLayersExpanded = true;
  let isSideDockOpen = true;

  // Draggable accordion splitter state
  let layersPaneHeight = 280;
  let isResizingSplitter = false;
  let startSplitterY = 0;
  let startLayersHeight = 280;

  // Draggable side dock width state
  let sideDockWidth = 340;
  let isResizingSideDock = false;
  let startDockX = 0;
  let startDockWidth = 340;

  function handleDockResizePointerDown(e: PointerEvent) {
    isResizingSideDock = true;
    startDockX = e.clientX;
    startDockWidth = sideDockWidth;
    (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
  }

  function handleDockResizePointerMove(e: PointerEvent) {
    if (!isResizingSideDock) return;
    const dx = e.clientX - startDockX;
    const newWidth = Math.max(260, Math.min(650, startDockWidth - dx));
    sideDockWidth = newWidth;
  }

  function handleDockResizePointerUp(e: PointerEvent) {
    if (isResizingSideDock) {
      isResizingSideDock = false;
      try {
        (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  function handleSplitterPointerDown(e: PointerEvent) {
    isResizingSplitter = true;
    startSplitterY = e.clientY;
    startLayersHeight = layersPaneHeight;
    (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
  }

  function handleSplitterPointerMove(e: PointerEvent) {
    if (!isResizingSplitter) return;
    const dy = e.clientY - startSplitterY;
    const newHeight = Math.max(120, Math.min(window.innerHeight - 200, startLayersHeight - dy));
    layersPaneHeight = newHeight;
  }

  function handleSplitterPointerUp(e: PointerEvent) {
    if (isResizingSplitter) {
      isResizingSplitter = false;
      try {
        (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  function toggleDock() {
    isSideDockOpen = !isSideDockOpen;
  }

  function isInputFocused(): boolean {
    const active = document.activeElement;
    if (!active || !(active instanceof HTMLElement)) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || active.isContentEditable;
  }

  function handleGlobalKeyDown(e: KeyboardEvent) {
    // Skip shortcut processing if user is currently typing in an input
    if (isInputFocused()) {
      if (e.key === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
      return;
    }

    // New Canvas: Cmd+N or Ctrl+N
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      isNewProjectModalOpen.set(true);
      return;
    }

    // Save Pattern: Cmd+S or Ctrl+S
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      isSaveModalOpen.set(true);
      return;
    }

    // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    // Redo: Cmd+Shift+Z or Ctrl+Y
    if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      redo();
      return;
    }

    // Cut: Cmd+X or Ctrl+X
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      cutSelection();
      return;
    }

    // Copy: Cmd+C or Ctrl+C
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copySelection();
      return;
    }

    // Paste: Cmd+V or Ctrl+V
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      pasteClipboard();
      return;
    }

    // Select All: Cmd+A or Ctrl+A
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectAll();
      return;
    }

    // Deselect: Cmd+D or Ctrl+D
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      clearSelection();
      return;
    }

    // Invert Selection: Cmd+Shift+I or Ctrl+Shift+I
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      invertCurrentSelection();
      return;
    }

    // Delete Selected Stitches: Del or Backspace when selection exists
    if ((e.key === 'Delete' || e.key === 'Backspace') && $selection) {
      e.preventDefault();
      deleteSelection();
      return;
    }

    // Single-key tool switches (only when no modifier keys are held)
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 's': // Marquee Selection tool (S for Select)
          activeTool.set('select');
          e.preventDefault();
          break;
        case 'w': // Magic Wand Selection tool
          activeTool.set('wand');
          e.preventDefault();
          break;
        case 'q': // Lasso Selection tool
          activeTool.set('lasso');
          e.preventDefault();
          break;
        case 'b': // Brush / Pencil
          activeTool.set('pencil');
          e.preventDefault();
          break;
        case 'e': // Eraser
          activeTool.set('eraser');
          e.preventDefault();
          break;
        case 'f': // Flood Fill / Bucket (F for Fill)
          activeTool.set('bucket');
          e.preventDefault();
          break;
        case 'i': // Eyedropper / Pipette
          activeTool.set('picker');
          e.preventDefault();
          break;
        case 'h': // Hand / Pan tool OR Flip Floating Selection / Active Stamp Horizontally
          if ($floatingSelection) {
            flipHorizontal();
          } else if ($activeTool === 'stamp' && $activeStamp) {
            flipActiveStampHorizontal();
          } else {
            activeTool.set('pan');
          }
          e.preventDefault();
          break;
        case 'm': // Move Tool (M for Move)
          activeTool.set('move');
          e.preventDefault();
          break;
        case 'v': // Flip Floating Selection or Stamp Vertically
          if ($floatingSelection) {
            flipVertical();
            e.preventDefault();
          } else if ($activeTool === 'stamp' && $activeStamp) {
            flipActiveStampVertical();
            e.preventDefault();
          }
          break;
        case 'l': // Line tool
          activeTool.set('line');
          e.preventDefault();
          break;
        case 'r': // Rectangle tool OR Rotate Floating Selection / Stamp (90 degrees CW)
          if ($floatingSelection) {
            rotate90(!e.shiftKey);
          } else if ($activeTool === 'stamp' && $activeStamp) {
            rotateActiveStamp(!e.shiftKey);
          } else {
            activeTool.set('rectangle');
          }
          e.preventDefault();
          break;
        case 'o': // Ellipse / Oval tool (O for Oval)
          activeTool.set('ellipse');
          e.preventDefault();
          break;
        case 't': // Typography Text Tool
          activeTool.set('text');
          openTextModal();
          e.preventDefault();
          break;
        case '?': // Shortcuts help
          isShortcutsModalOpen.set(true);
          e.preventDefault();
          break;
        case 'escape':
          activeTool.set('pencil');
          break;
      }
    }
  }

  function handleWindowDragOver(e: DragEvent) {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleWindowDrop(e: DragEvent) {
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return;
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith('image/')) {
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          addReferenceImageLayer(src, file.name.replace(/\.[^/.]+$/, ''), img.naturalWidth, img.naturalHeight);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
    window.removeEventListener('dragover', handleWindowDragOver);
    window.removeEventListener('drop', handleWindowDrop);
  });
</script>

<div class="flex flex-col w-screen h-screen overflow-hidden bg-[#141419] font-sans antialiased">
  <!-- Top Navigation Bar -->
  <Header />

  <!-- Main Creative Studio Workspace -->
  <div class="flex flex-1 overflow-hidden relative">
    <!-- Left Photoshop-Style Tool Bar -->
    <Toolbar />

    <!-- Center Canvas Viewport (Infinite feel, multi-canvas stack) -->
    <main class="flex-1 relative h-full overflow-hidden">
      <CanvasViewport />
    </main>

    <!-- Side Dock Collapse Toggle Button -->
    <button
      class="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-[#252530] hover:bg-indigo-600 text-gray-400 hover:text-white border-y border-l border-[#3a3a4a] p-1 rounded-l-md shadow-lg transition-all hidden md:block"
      style="right: {isSideDockOpen ? `${sideDockWidth}px` : '0px'};"
      on:click={toggleDock}
      title={isSideDockOpen ? 'Collapse Side Panel' : 'Expand Side Panel'}
    >
      {#if isSideDockOpen}
        <ChevronRight size={14} />
      {:else}
        <ChevronLeft size={14} />
      {/if}
    </button>

    <!-- Right Side Dock (Clean Accordion for Palette & Layers) -->
    {#if isSideDockOpen}
      <aside
        class="h-full flex flex-col bg-[#1e1e24] border-l border-[#2e2e38] shadow-2xl z-20 flex-shrink-0 select-none relative"
        style="width: {sideDockWidth}px;"
      >
        <!-- Draggable Resizer on Left Edge of Dock -->
        <div
          class="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-500 z-30 transition-colors select-none"
          on:pointerdown={handleDockResizePointerDown}
          on:pointermove={handleDockResizePointerMove}
          on:pointerup={handleDockResizePointerUp}
          title="Drag left/right to resize panel width"
        ></div>
        <!-- Accordion Section 1: Floss & Palette -->
        <div class="flex flex-col {isPaletteExpanded ? (isLayersExpanded ? 'flex-1 min-h-0' : 'flex-1') : 'flex-shrink-0'} overflow-hidden">
          <button
            class="w-full px-3 py-2 bg-[#23232c] hover:bg-[#282834] border-b border-[#2e2e38] flex items-center justify-between text-xs font-semibold text-gray-300 transition-colors"
            on:click={() => (isPaletteExpanded = !isPaletteExpanded)}
            title={isPaletteExpanded ? 'Collapse Floss & Palette' : 'Expand Floss & Palette'}
          >
            <div class="flex items-center space-x-2">
              <SwatchBook size={14} class="text-indigo-400" />
              <span>Floss & Palette</span>
              <span class="text-[10px] font-mono text-gray-400 bg-[#191922] px-1.5 py-0.5 rounded border border-[#30303c]">
                {$palette.length}
              </span>
            </div>
            {#if isPaletteExpanded}
              <ChevronDown size={14} class="text-gray-400" />
            {:else}
              <ChevronRight size={14} class="text-gray-400" />
            {/if}
          </button>

          {#if isPaletteExpanded}
            <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
              <PaletteDock />
            </div>
          {/if}
        </div>

        <!-- Draggable Resizer Splitter Bar (Active when both panels expanded) -->
        {#if isPaletteExpanded && isLayersExpanded}
          <div
            class="h-1.5 w-full bg-[#252530] hover:bg-indigo-500/50 active:bg-indigo-500 cursor-row-resize flex items-center justify-center transition-colors group flex-shrink-0 relative select-none"
            on:pointerdown={handleSplitterPointerDown}
            on:pointermove={handleSplitterPointerMove}
            on:pointerup={handleSplitterPointerUp}
            title="Drag to resize Floss Palette vs Layers heights"
          >
            <div class="w-8 h-0.5 bg-gray-500 group-hover:bg-white rounded-full"></div>
          </div>
        {/if}

        <!-- Accordion Section 2: Layers (Adjustable height) -->
        <div
          class="flex flex-col {isLayersExpanded ? (isPaletteExpanded ? 'flex-shrink-0' : 'flex-1') : 'flex-shrink-0'} border-t border-[#2e2e38] overflow-hidden"
          style={isLayersExpanded && isPaletteExpanded ? `height: ${layersPaneHeight}px;` : ''}
        >
          <button
            class="w-full px-3 py-2 bg-[#23232c] hover:bg-[#282834] border-b border-[#2e2e38] flex items-center justify-between text-xs font-semibold text-gray-300 transition-colors"
            on:click={() => (isLayersExpanded = !isLayersExpanded)}
            title={isLayersExpanded ? 'Collapse Layers' : 'Expand Layers'}
          >
            <div class="flex items-center space-x-2">
              <LayersIcon size={14} class="text-indigo-400" />
              <span>Layers</span>
              <span class="text-[10px] font-mono text-gray-400 bg-[#191922] px-1.5 py-0.5 rounded border border-[#30303c]">
                {$layers.length}
              </span>
            </div>
            {#if isLayersExpanded}
              <ChevronDown size={14} class="text-gray-400" />
            {:else}
              <ChevronRight size={14} class="text-gray-400" />
            {/if}
          </button>

          {#if isLayersExpanded}
            <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
              <LayerManager />
            </div>
          {/if}
        </div>
      </aside>
    {/if}
  </div>

  <!-- Global Modals -->
  <NewProjectModal />
  <CanvasSizeModal />
  <ShortcutsModal />
  <ClearLayerModal />
  <MotifLibraryModal />
  <BorderMakerModal />
  <SaveProjectModal />
  <DigitizerModal />
  <TextModal />
</div>


