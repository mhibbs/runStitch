<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Header from './lib/components/Header.svelte';
  import ToolOptionsBar from './lib/components/ToolOptionsBar.svelte';
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
  import ImageUrlModal from './lib/components/ImageUrlModal.svelte';
  import ProjectLibraryModal from './lib/components/ProjectLibraryModal.svelte';
  import {
    initProjectStorage,
    isProjectLibraryModalOpen,
    saveCurrentProjectToDB
  } from './lib/stores/projectStorage';
  import {
    activeTool,
    activeLayer,
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
    initialSaveTab,
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
    commitFloatingSelection,
    rotate90,
    flipHorizontal,
    flipVertical,
    addReferenceImageLayer,
    executeUniversalPaste,
    clipboard,
    openTextModal,
    quickDigitizeTextLayer,
    rotateTextLayer90,
    flipTextLayerHorizontal,
    flipTextLayerVertical,
    selectedColorId,
    activeColor
  } from './lib/stores/editorStore';
  import { SwatchBook, Layers as LayersIcon, ChevronDown, ChevronRight, ChevronLeft, X } from 'lucide-svelte';

  let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  $: isMobileDrawer = windowWidth < 768;

  let isPaletteExpanded = true;
  let isLayersExpanded = true;
  let isSideDockOpen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;

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
    if (isSideDockOpen && !isPaletteExpanded && !isLayersExpanded) {
      isPaletteExpanded = true;
      isLayersExpanded = true;
    }
  }

  function togglePaletteAccordion() {
    isPaletteExpanded = !isPaletteExpanded;
    if (!isPaletteExpanded && !isLayersExpanded) {
      isSideDockOpen = false;
    }
  }

  function toggleLayersAccordion() {
    isLayersExpanded = !isLayersExpanded;
    if (!isPaletteExpanded && !isLayersExpanded) {
      isSideDockOpen = false;
    }
  }

  function openDockTo(section: 'palette' | 'layers') {
    isSideDockOpen = true;
    if (section === 'palette') {
      isPaletteExpanded = true;
    } else {
      isLayersExpanded = true;
    }
  }

  function isInputFocused(): boolean {
    const active = document.activeElement;
    if (!active || !(active instanceof HTMLElement)) return false;
    const tag = active.tagName.toLowerCase();
    if (tag === 'textarea' || active.isContentEditable) return true;
    if (tag === 'input') {
      const type = (active as HTMLInputElement).type?.toLowerCase();
      // Only text-entry inputs should trap keyboard shortcuts for text editing
      return ['text', 'search', 'url', 'email', 'password', 'number', 'tel'].includes(type) || !type;
    }
    return false;
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

    // Open My Projects (Browser Library): Cmd+O or Ctrl+O
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      isProjectLibraryModalOpen.set(true);
      return;
    }

    // Save Pattern: Cmd+S (saves immediately to Browser Storage) or Cmd+Shift+S (Export .xstitch dialog)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (e.shiftKey) {
        initialSaveTab.set('xstitch');
        isSaveModalOpen.set(true);
      } else {
        saveCurrentProjectToDB();
      }
      return;
    }

    // Export / Print PDF Chart: Cmd+P or Ctrl+P
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      initialSaveTab.set('pdf');
      isSaveModalOpen.set(true);
      return;
    }

    const isZKey = e.key.toLowerCase() === 'z' || e.code === 'KeyZ';
    const isYKey = e.key.toLowerCase() === 'y' || e.code === 'KeyY';

    // Undo: Cmd+Z (Mac) or Ctrl+Z (Windows)
    if ((e.metaKey || e.ctrlKey) && isZKey && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    // Redo: Cmd+Shift+Z or Ctrl+Shift+Z or Cmd+Y or Ctrl+Y
    if ((e.metaKey || e.ctrlKey) && ((isZKey && e.shiftKey) || isYKey)) {
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
      // Allow browser native 'paste' event to fire so handleWindowPaste can read clipboardData (images, files, text).
      // Fall back to executeUniversalPaste if the browser does not fire 'paste' on non-editable elements.
      let pasteFired = false;
      const onPasteCheck = () => { pasteFired = true; };
      window.addEventListener('paste', onPasteCheck, { once: true, capture: true });
      setTimeout(() => {
        window.removeEventListener('paste', onPasteCheck, { capture: true });
        if (!pasteFired) {
          executeUniversalPaste();
        }
      }, 75);
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

    // Confirm / Finalize with Enter key (Floating Stitches or Active Text Layer)
    if (e.key === 'Enter') {
      if ($floatingSelection) {
        e.preventDefault();
        commitFloatingSelection();
        return;
      }
      if ($activeLayer && $activeLayer.type === 'text' && !$activeLayer.locked) {
        e.preventDefault();
        quickDigitizeTextLayer($activeLayer.id);
        return;
      }
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
        case 'h': // Hand / Pan tool OR Flip Floating Selection / Active Stamp / Text Layer Horizontally
          if ($floatingSelection) {
            flipHorizontal();
          } else if ($activeTool === 'stamp' && $activeStamp) {
            flipActiveStampHorizontal();
          } else if ($activeLayer && $activeLayer.type === 'text' && !$activeLayer.locked) {
            flipTextLayerHorizontal($activeLayer.id);
          } else {
            activeTool.set('pan');
          }
          e.preventDefault();
          break;
        case 'm': // Move Tool (M for Move)
          activeTool.set('move');
          e.preventDefault();
          break;
        case 'v': // Flip Floating Selection, Stamp, or Active Text Layer Vertically
          if ($floatingSelection) {
            flipVertical();
            e.preventDefault();
          } else if ($activeTool === 'stamp' && $activeStamp) {
            flipActiveStampVertical();
            e.preventDefault();
          } else if ($activeLayer && $activeLayer.type === 'text' && !$activeLayer.locked) {
            flipTextLayerVertical($activeLayer.id);
            e.preventDefault();
          }
          break;
        case 'l': // Line tool
          activeTool.set('line');
          e.preventDefault();
          break;
        case 'r': // Rectangle tool OR Rotate Floating Selection / Stamp / Active Text Layer (90 deg)
          if ($floatingSelection) {
            rotate90(!e.shiftKey);
          } else if ($activeTool === 'stamp' && $activeStamp) {
            rotateActiveStamp(!e.shiftKey);
          } else if ($activeLayer && $activeLayer.type === 'text' && !$activeLayer.locked) {
            rotateTextLayer90($activeLayer.id, !e.shiftKey);
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

  function handleWindowPaste(e: ClipboardEvent) {
    if (isInputFocused()) return;

    // 1. Check clipboard items for image data
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (event) => {
              const src = event.target?.result as string;
              if (src) {
                addReferenceImageLayer(
                  src,
                  `Pasted Image ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                );
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }

    // 2. Check clipboard files (e.g. copied from file explorer or Finder)
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const src = event.target?.result as string;
            if (src) {
              addReferenceImageLayer(
                src,
                `Pasted Image ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              );
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }

    // 3. Check plain text for image URL, data URI, or serialized stitches
    const text = e.clipboardData?.getData('text')?.trim();
    if (text) {
      if (text.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpe?g|webp|gif|svg|bmp)(\?.*)?$/i.test(text)) {
        e.preventDefault();
        addReferenceImageLayer(
          text,
          `Pasted Image ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        );
        return;
      }

      try {
        const parsed = JSON.parse(text);
        if (parsed?.type === 'xstitcher-stitches' && parsed.stitches) {
          e.preventDefault();
          clipboard.set({
            width: parsed.width,
            height: parsed.height,
            stitches: parsed.stitches
          });
          pasteClipboard();
          return;
        }
      } catch (_) {}
    }

    // 4. Fallback: If internal stitches exist in memory, paste them
    if ($clipboard && Object.keys($clipboard.stitches).length > 0) {
      e.preventDefault();
      pasteClipboard();
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

  let cleanupStorage: (() => void) | null = null;

  onMount(async () => {
    windowWidth = window.innerWidth;
    if (windowWidth < 1024) {
      isSideDockOpen = false;
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('paste', handleWindowPaste);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    cleanupStorage = await initProjectStorage();
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
    window.removeEventListener('paste', handleWindowPaste);
    window.removeEventListener('dragover', handleWindowDragOver);
    window.removeEventListener('drop', handleWindowDrop);
    if (cleanupStorage) cleanupStorage();
  });
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="flex flex-col w-dvw h-dvh safe-area-root overflow-hidden bg-[#141419] font-sans antialiased">
  <!-- Top Navigation Bar -->
  <Header />

  <!-- Contextual Tool Options Bar -->
  <ToolOptionsBar />

  <!-- Main Creative Studio Workspace -->
  <div class="flex flex-1 overflow-hidden relative">
    <!-- Left Photoshop-Style Tool Bar -->
    <Toolbar />

    <!-- Center Canvas Viewport (Infinite feel, multi-canvas stack) -->
    <main class="flex-1 relative h-full overflow-hidden min-w-0">
      <CanvasViewport />

      <!-- Floating Quick-Swatch & Layer Pill (Shown when Side Dock is collapsed) -->
      {#if !isSideDockOpen}
        <div
          class="absolute top-2.5 right-3 z-20 flex items-center space-x-1.5 bg-[#1e1e26]/95 backdrop-blur-md border border-[#3a3a4a] px-2 py-1.5 rounded-xl shadow-2xl max-w-[calc(100%-24px)] select-none"
          role="toolbar"
          aria-label="Quick Palette and Dock Controls"
        >
          <!-- Scrollable Quick Swatches -->
          <div class="flex items-center space-x-1.5 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-[260px] pr-1">
            {#each $palette as color (color.id)}
              <button
                type="button"
                class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-transform cursor-pointer border
                {$selectedColorId === color.id
                  ? 'border-white ring-2 ring-indigo-400 scale-105 shadow-md'
                  : 'border-black/40 opacity-85 hover:opacity-100'}"
                style="background-color: {color.hex}; color: {color.symbolColor || '#FFFFFF'};"
                on:click={() => selectedColorId.set(color.id)}
                title="{(color.brand || 'dmc').toUpperCase()} {color.dmc} - {color.name}"
                aria-label="Select {(color.brand || 'dmc').toUpperCase()} {color.dmc} {color.name}"
              >
                {color.symbol}
              </button>
            {/each}
          </div>

          <div class="w-px h-5 bg-[#363646] flex-shrink-0"></div>

          <!-- Open Palette Dock Button -->
          <button
            type="button"
            class="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-[#262632] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-xs font-medium flex-shrink-0 cursor-pointer"
            on:click={() => openDockTo('palette')}
            title="Open Floss & Palette Panel"
            aria-label="Open Floss and Palette Panel"
          >
            <SwatchBook size={13} class="text-indigo-400" />
            <span class="hidden sm:inline font-mono text-[11px]">{($activeColor?.brand || 'dmc').toUpperCase()} {$activeColor?.dmc || ''}</span>
            <span class="text-[10px] font-mono bg-[#17171f] text-indigo-300 px-1 py-0.2 rounded border border-indigo-900/50">
              {$palette.length}
            </span>
          </button>

          <!-- Open Layers Dock Button -->
          <button
            type="button"
            class="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-[#262632] hover:bg-indigo-600 text-gray-200 hover:text-white transition-colors text-xs font-medium flex-shrink-0 cursor-pointer"
            on:click={() => openDockTo('layers')}
            title="Open Layers Panel"
            aria-label="Open Layers Panel"
          >
            <LayersIcon size={13} class="text-indigo-400" />
            <span class="hidden sm:inline text-[11px] truncate max-w-[76px]">{$activeLayer?.name || 'Layers'}</span>
            <span class="text-[10px] font-mono bg-[#17171f] text-indigo-300 px-1 py-0.2 rounded border border-indigo-900/50">
              {$layers.length}
            </span>
          </button>
        </div>
      {/if}
    </main>

    <!-- Mobile Overlay Backdrop when Side Drawer is open -->
    {#if isMobileDrawer && isSideDockOpen}
      <button
        type="button"
        aria-label="Close side drawer"
        class="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-30 md:hidden cursor-default border-0 p-0"
        on:click={() => (isSideDockOpen = false)}
      ></button>
    {/if}

    <!-- Side Dock Collapse Toggle Button -->
    <button
      type="button"
      class="absolute top-1/2 -translate-y-1/2 z-40 bg-[#252530] hover:bg-indigo-600 text-gray-300 hover:text-white border-y border-l border-[#3a3a4a] px-1 py-2.5 rounded-l-md shadow-lg transition-all cursor-pointer"
      style="right: {isSideDockOpen ? (isMobileDrawer ? `min(${sideDockWidth}px, 88vw)` : `${sideDockWidth}px`) : '0px'};"
      on:click={toggleDock}
      title={isSideDockOpen ? 'Collapse Side Panel' : 'Expand Side Panel'}
      aria-label={isSideDockOpen ? 'Collapse Side Panel' : 'Expand Side Panel'}
    >
      {#if isSideDockOpen}
        <ChevronRight size={15} />
      {:else}
        <ChevronLeft size={15} />
      {/if}
    </button>

    <!-- Right Side Dock (Clean Accordion for Palette & Layers; Slide-Over Drawer on <768px) -->
    {#if isSideDockOpen}
      <aside
        class="h-full flex flex-col bg-[#1e1e24] border-l border-[#2e2e38] shadow-2xl flex-shrink-0 select-none {isMobileDrawer ? 'absolute right-0 top-0 bottom-0 z-40 max-w-[88vw]' : 'relative z-20'}"
        style="width: {isMobileDrawer ? `min(${sideDockWidth}px, 88vw)` : `${sideDockWidth}px`};"
      >
        <!-- Mobile Drawer Close Header -->
        {#if isMobileDrawer}
          <div class="px-3 py-2 bg-[#1a1a22] border-b border-[#2e2e38] flex items-center justify-between flex-shrink-0">
            <span class="text-xs font-bold text-gray-200 tracking-wide">Palette & Layers</span>
            <button
              type="button"
              class="p-1.5 rounded-lg bg-[#252532] hover:bg-[#323242] text-gray-300 hover:text-white transition-colors"
              on:click={() => (isSideDockOpen = false)}
              title="Close Panel"
              aria-label="Close Panel"
            >
              <X size={15} />
            </button>
          </div>
        {/if}

        <!-- Draggable Resizer on Left Edge of Dock (Desktop/Tablet) -->
        {#if !isMobileDrawer}
          <div
            class="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-500 z-30 transition-colors select-none"
            on:pointerdown={handleDockResizePointerDown}
            on:pointermove={handleDockResizePointerMove}
            on:pointerup={handleDockResizePointerUp}
            title="Drag left/right to resize panel width"
          ></div>
        {/if}
        <!-- Accordion Section 1: Floss & Palette -->
        <div class="flex flex-col {isPaletteExpanded ? (isLayersExpanded ? 'flex-1 min-h-0' : 'flex-1') : 'flex-shrink-0'} overflow-hidden">
          <button
            type="button"
            class="w-full px-3 py-2 bg-[#23232c] hover:bg-[#282834] border-b border-[#2e2e38] flex items-center justify-between text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
            on:click={togglePaletteAccordion}
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
            class="h-2 sm:h-1.5 w-full bg-[#252530] hover:bg-indigo-500/50 active:bg-indigo-500 cursor-row-resize flex items-center justify-center transition-colors group flex-shrink-0 relative select-none touch-none"
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
            type="button"
            class="w-full px-3 py-2 bg-[#23232c] hover:bg-[#282834] border-b border-[#2e2e38] flex items-center justify-between text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
            on:click={toggleLayersAccordion}
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
  <ImageUrlModal />
  <ProjectLibraryModal />
</div>


