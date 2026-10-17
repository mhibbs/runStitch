<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    grid,
    layers,
    palette,
    viewMode,
    showGrid,
    viewport,
    undo,
    redo,
    canUndo,
    canRedo,
    setFabricCount,
    clearCurrentLayer,
    triggerZoomToFit,
    isNewProjectModalOpen,
    isCanvasSizeModalOpen,
    isShortcutsModalOpen,
    isClearLayerModalOpen,
    isBorderModalOpen,
    isMotifLibraryModalOpen,
    activeTool,
    shapeFillMode,
    selection,
    floatingSelection,
    clipboard,
    copySelection,
    cutSelection,
    pasteClipboard,
    selectAll,
    clearSelection,
    invertCurrentSelection,
    growCurrentSelection,
    shrinkCurrentSelection,
    deleteSelection,
    flipHorizontal,
    flipVertical,
    rotate90,
    fabricColor,
    setFabricColor,
    FABRIC_COLOR_PRESETS,
    measurementUnit,
    isSaveModalOpen,
    projectName,
    activeLayer,
    addReferenceImageLayer,
    openDigitizerForLayer
  } from '../stores/editorStore';
  import { SAMPLE_IMAGES } from '../data/sampleImages';
  import {
    FileText,
    FolderOpen,
    Save,
    Maximize2,
    Undo2,
    Redo2,
    Trash2,
    ZoomIn,
    ZoomOut,
    Maximize,
    Grid,
    Keyboard,
    Check,
    Scissors,
    Copy,
    Clipboard,
    FlipHorizontal,
    FlipVertical,
    RotateCw,
    Stamp,
    Frame,
    Slash,
    Square,
    Circle,
    Sparkles,
    Image as ImageIcon,
    BoxSelect,
    Expand,
    Shrink,
    RefreshCw,
    X
  } from 'lucide-svelte';

  let openMenu: 'file' | 'edit' | 'select' | 'design' | 'view' | 'help' | null = null;
  let fileInputEl: HTMLInputElement;
  let imageInputEl: HTMLInputElement;

  function toggleMenu(menu: 'file' | 'edit' | 'select' | 'design' | 'view' | 'help') {
    openMenu = openMenu === menu ? null : menu;
  }

  function handleImageFileSelect(e: Event) {
    closeMenu();
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
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
    (e.target as HTMLInputElement).value = '';
  }

  function handleLoadSample(sampleUrl: string, sampleTitle: string) {
    closeMenu();
    const img = new Image();
    img.onload = () => {
      addReferenceImageLayer(sampleUrl, sampleTitle, img.naturalWidth, img.naturalHeight);
    };
    img.src = sampleUrl;
  }

  function closeMenu() {
    openMenu = null;
  }

  function handleExport() {
    closeMenu();
    isSaveModalOpen.set(true);
  }

  function handleFileImport(e: Event) {
    closeMenu();
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.name) {
          projectName.set(json.name);
        } else if (file.name) {
          const baseName = file.name.replace(/\.xstitch$/i, '').replace(/\.json$/i, '');
          projectName.set(baseName || 'Imported Pattern');
        }
        if (json.grid) grid.set(json.grid);
        if (json.palette) palette.set(json.palette);
        if (json.layers) layers.set(json.layers);
        triggerZoomToFit();
      } catch (err) {
        alert('Invalid .xstitch file format');
      }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  }

  function handleClearLayer() {
    closeMenu();
    isClearLayerModalOpen.set(true);
  }

  function handleDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.app-menubar')) {
      closeMenu();
    }
  }

  onMount(() => {
    window.addEventListener('click', handleDocClick);
  });

  onDestroy(() => {
    window.removeEventListener('click', handleDocClick);
  });
</script>

<input
  bind:this={fileInputEl}
  type="file"
  accept=".xstitch,.json"
  on:change={handleFileImport}
  class="hidden"
/>

<input
  bind:this={imageInputEl}
  type="file"
  accept="image/png,image/jpeg,image/webp,image/svg+xml"
  on:change={handleImageFileSelect}
  class="hidden"
/>

<div class="app-menubar flex items-center space-x-0.5 text-xs text-gray-300 relative select-none">
  <!-- File Menu -->
  <div class="relative">
    <button
      class="px-2.5 py-1 rounded hover:bg-[#2e2e3c] transition-colors {openMenu === 'file' ? 'bg-[#2e2e3c] text-white' : ''}"
      on:click|stopPropagation={() => toggleMenu('file')}
    >
      File
    </button>
    {#if openMenu === 'file'}
      <div class="absolute left-0 top-full mt-1 w-56 bg-[#1f1f28] border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); isNewProjectModalOpen.set(true); }}
        >
          <div class="flex items-center space-x-2">
            <FileText size={14} />
            <span>New Canvas...</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+N</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); fileInputEl.click(); }}
        >
          <div class="flex items-center space-x-2">
            <FolderOpen size={14} />
            <span>Open Pattern...</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+O</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={handleExport}
        >
          <div class="flex items-center space-x-2">
            <Save size={14} />
            <span>Save .xstitch</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+S</span>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-cyan-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); imageInputEl.click(); }}
        >
          <div class="flex items-center space-x-2">
            <ImageIcon size={14} class="text-cyan-400" />
            <span>Import Image Layer...</span>
          </div>
        </button>

        {#each SAMPLE_IMAGES as sample}
          <button
            class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-cyan-600 hover:text-white transition-colors text-left"
            on:click={() => handleLoadSample(sample.url, sample.title)}
          >
            <div class="flex items-center space-x-2 truncate">
              <span class="text-xs">{sample.id.includes('cat') ? '🕶️' : '☕'}</span>
              <span class="truncate">Try Sample: {sample.title}</span>
            </div>
          </button>
        {/each}

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); isCanvasSizeModalOpen.set(true); }}
        >
          <div class="flex items-center space-x-2">
            <Maximize2 size={14} />
            <span>Canvas Size...</span>
          </div>
        </button>
      </div>
    {/if}
  </div>

  <!-- Edit Menu -->
  <div class="relative">
    <button
      class="px-2.5 py-1 rounded hover:bg-[#2e2e3c] transition-colors {openMenu === 'edit' ? 'bg-[#2e2e3c] text-white' : ''}"
      on:click|stopPropagation={() => toggleMenu('edit')}
    >
      Edit
    </button>
    {#if openMenu === 'edit'}
      <div class="absolute left-0 top-full mt-1 w-52 bg-[#1f1f28] border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); undo(); }}
          disabled={!$canUndo}
        >
          <div class="flex items-center space-x-2">
            <Undo2 size={14} />
            <span>Undo</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+Z</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); redo(); }}
          disabled={!$canRedo}
        >
          <div class="flex items-center space-x-2">
            <Redo2 size={14} />
            <span>Redo</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+Shift+Z</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); cutSelection(); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <Scissors size={14} />
            <span>Cut</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+X</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); copySelection(); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <Copy size={14} />
            <span>Copy</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+C</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); pasteClipboard(); }}
          disabled={!$clipboard}
        >
          <div class="flex items-center space-x-2">
            <Clipboard size={14} />
            <span>Paste</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+V</span>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); selectAll(); }}
        >
          <span>Select All</span>
          <span class="text-[10px] text-gray-400">Cmd+A</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); clearSelection(); }}
          disabled={!$selection && !$floatingSelection}
        >
          <span>Deselect</span>
          <span class="text-[10px] text-gray-400">Esc</span>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); flipHorizontal(); }}
          disabled={!$selection && !$floatingSelection}
        >
          <div class="flex items-center space-x-2">
            <FlipHorizontal size={14} />
            <span>Flip Horizontal</span>
          </div>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); flipVertical(); }}
          disabled={!$selection && !$floatingSelection}
        >
          <div class="flex items-center space-x-2">
            <FlipVertical size={14} />
            <span>Flip Vertical</span>
          </div>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); rotate90(true); }}
          disabled={!$selection && !$floatingSelection}
        >
          <div class="flex items-center space-x-2">
            <RotateCw size={14} />
            <span>Rotate 90° CW</span>
          </div>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-red-600 hover:text-white transition-colors"
          on:click={handleClearLayer}
        >
          <div class="flex items-center space-x-2">
            <Trash2 size={14} />
            <span>Clear Active Layer...</span>
          </div>
        </button>
      </div>
    {/if}
  </div>

  <!-- Select Menu -->
  <div class="relative">
    <button
      class="px-2.5 py-1 rounded hover:bg-[#2e2e3c] transition-colors {openMenu === 'select' ? 'bg-[#2e2e3c] text-white' : ''}"
      on:click|stopPropagation={() => toggleMenu('select')}
    >
      Select
    </button>
    {#if openMenu === 'select'}
      <div class="absolute left-0 top-full mt-1 w-56 bg-[#1f1f28] border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); selectAll(); }}
        >
          <div class="flex items-center space-x-2">
            <BoxSelect size={14} />
            <span>Select All</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+A</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); clearSelection(); }}
          disabled={!$selection && !$floatingSelection}
        >
          <div class="flex items-center space-x-2">
            <X size={14} />
            <span>Deselect</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+D / Esc</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); invertCurrentSelection(); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <RefreshCw size={14} />
            <span>Invert Selection</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+Shift+I</span>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); growCurrentSelection(); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <Expand size={14} />
            <span>Grow Selection (+1 Stitch)</span>
          </div>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); shrinkCurrentSelection(); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <Shrink size={14} />
            <span>Shrink Selection (-1 Stitch)</span>
          </div>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-red-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); deleteSelection(); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <Trash2 size={14} />
            <span>Delete Selected Stitches</span>
          </div>
          <span class="text-[10px] text-gray-400">Del</span>
        </button>
      </div>
    {/if}
  </div>

  <!-- Design Menu -->
  <div class="relative">
    <button
      class="px-2.5 py-1 rounded hover:bg-[#2e2e3c] transition-colors {openMenu === 'design' ? 'bg-[#2e2e3c] text-white' : ''}"
      on:click|stopPropagation={() => toggleMenu('design')}
    >
      Design
    </button>
    {#if openMenu === 'design'}
      <div class="absolute left-0 top-full mt-1 w-56 bg-[#1f1f28] border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-emerald-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); isMotifLibraryModalOpen.set(true); }}
        >
          <div class="flex items-center space-x-2">
            <Stamp size={14} class="text-emerald-400" />
            <span>Motif & Stamp Library...</span>
          </div>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-amber-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); isBorderModalOpen.set(true); }}
        >
          <div class="flex items-center space-x-2">
            <Frame size={14} class="text-amber-400" />
            <span>Border Repeater...</span>
          </div>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-cyan-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); if ($activeLayer?.type === 'image') openDigitizerForLayer($activeLayer.id); }}
          disabled={!$activeLayer || $activeLayer.type !== 'image'}
        >
          <div class="flex items-center space-x-2">
            <Sparkles size={14} class="text-cyan-400" />
            <span>Digitize Image to Stitches...</span>
          </div>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-40"
          on:click={() => { closeMenu(); isMotifLibraryModalOpen.set(true); }}
          disabled={!$selection}
        >
          <div class="flex items-center space-x-2">
            <Sparkles size={14} />
            <span>Save Selection as Stamp...</span>
          </div>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <div class="px-3 py-1 text-[10px] font-bold uppercase text-gray-500">Shape Tools</div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); activeTool.set('line'); }}
        >
          <div class="flex items-center space-x-2">
            <Slash size={14} />
            <span>Line Tool</span>
          </div>
          <span class="text-[10px] text-gray-400">L</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); activeTool.set('rectangle'); }}
        >
          <div class="flex items-center space-x-2">
            <Square size={14} />
            <span>Rectangle Tool</span>
          </div>
          <span class="text-[10px] text-gray-400">R</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); activeTool.set('ellipse'); }}
        >
          <div class="flex items-center space-x-2">
            <Circle size={14} />
            <span>Ellipse Tool</span>
          </div>
          <span class="text-[10px] text-gray-400">O</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { shapeFillMode.update(m => m === 'outline' ? 'filled' : 'outline'); }}
        >
          <div class="flex items-center space-x-2">
            <span class="text-[10px] font-mono text-indigo-400">{$shapeFillMode === 'filled' ? '●' : '○'}</span>
            <span>Shape Style: {$shapeFillMode === 'filled' ? 'Solid Filled' : 'Hollow Outline'}</span>
          </div>
        </button>
      </div>
    {/if}
  </div>

  <!-- View Menu (Includes Zoom, Modes & Fabric) -->
  <div class="relative">
    <button
      class="px-2.5 py-1 rounded hover:bg-[#2e2e3c] transition-colors {openMenu === 'view' ? 'bg-[#2e2e3c] text-white' : ''}"
      on:click|stopPropagation={() => toggleMenu('view')}
    >
      View
    </button>
    {#if openMenu === 'view'}
      <div class="absolute left-0 top-full mt-1 w-56 bg-[#1f1f28] border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
        <!-- Zoom Controls -->
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors font-medium"
          on:click={() => { closeMenu(); triggerZoomToFit(); }}
        >
          <div class="flex items-center space-x-2">
            <Maximize size={14} />
            <span>Fit to Window</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+0</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); viewport.update(v => ({ ...v, zoom: 24 })); }}
        >
          <span>Actual Size (100%)</span>
          <span class="text-[10px] text-gray-400">Cmd+1</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); viewport.update(v => ({ ...v, zoom: Math.min(80, Math.round(v.zoom * 1.25)) })); }}
        >
          <div class="flex items-center space-x-2">
            <ZoomIn size={14} />
            <span>Zoom In</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd++</span>
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); viewport.update(v => ({ ...v, zoom: Math.max(4, Math.round(v.zoom * 0.8)) })); }}
        >
          <div class="flex items-center space-x-2">
            <ZoomOut size={14} />
            <span>Zoom Out</span>
          </div>
          <span class="text-[10px] text-gray-400">Cmd+-</span>
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); showGrid.update(g => !g); }}
        >
          <div class="flex items-center space-x-2">
            <Grid size={14} />
            <span>Show Grid Lines</span>
          </div>
          {#if $showGrid}<Check size={14} class="text-indigo-400" />{/if}
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <!-- Clean Short View Mode Options -->
        <div class="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          View Mode
        </div>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); viewMode.set('chart'); }}
        >
          <span>Symbol + Color</span>
          {#if $viewMode === 'chart'}<Check size={14} class="text-indigo-400" />{/if}
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); viewMode.set('symbols_only'); }}
        >
          <span>Symbol Only (B&W)</span>
          {#if $viewMode === 'symbols_only'}<Check size={14} class="text-indigo-400" />{/if}
        </button>

        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); viewMode.set('mockup'); }}
        >
          <span>Realistic Mockup</span>
          {#if $viewMode === 'mockup'}<Check size={14} class="text-indigo-400" />{/if}
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <!-- Units of Measure Section -->
        <div class="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          Units of Measure
        </div>
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); measurementUnit.set('in'); }}
        >
          <span>Inches (in)</span>
          {#if $measurementUnit === 'in'}<Check size={14} class="text-indigo-400" />{/if}
        </button>
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); measurementUnit.set('cm'); }}
        >
          <span>Metric (cm)</span>
          {#if $measurementUnit === 'cm'}<Check size={14} class="text-indigo-400" />{/if}
        </button>

        <div class="my-1 border-t border-gray-700"></div>

        <!-- Fabric Count Submenu Section -->
        <div class="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          Fabric Count
        </div>
        {#each [11, 14, 16, 18, 22, 28] as ct}
          <button
            class="w-full px-3 py-1 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
            on:click={() => { closeMenu(); setFabricCount(ct); }}
          >
            <span>{ct}-count {ct === 14 ? '(Standard)' : ''}</span>
            {#if $grid.fabricCount === ct}<Check size={14} class="text-indigo-400" />{/if}
          </button>
        {/each}

        <div class="my-1 border-t border-gray-700"></div>

        <!-- Fabric Color / Cloth Tint Section -->
        <div class="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          Fabric Color
        </div>
        {#each FABRIC_COLOR_PRESETS as preset}
          <button
            class="w-full px-3 py-1 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
            on:click={() => { closeMenu(); setFabricColor(preset.hex); }}
          >
            <div class="flex items-center space-x-2">
              <span
                class="w-3.5 h-3.5 rounded-full border border-gray-500 shadow-sm flex-shrink-0"
                style="background-color: {preset.hex};"
              ></span>
              <span class="truncate">{preset.name}</span>
            </div>
            {#if $fabricColor.toUpperCase() === preset.hex.toUpperCase()}<Check size={14} class="text-indigo-400" />{/if}
          </button>
        {/each}

        <!-- Custom Color Picker -->
        <div class="px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600/30 transition-colors">
          <label for="custom-fabric-color" class="flex items-center space-x-2 cursor-pointer w-full justify-between">
            <span class="text-xs text-gray-300">Custom Cloth Tint...</span>
            <input
              id="custom-fabric-color"
              type="color"
              bind:value={$fabricColor}
              class="w-6 h-5 rounded cursor-pointer border border-gray-600 bg-transparent"
              title="Pick Custom Fabric Color"
            />
          </label>
        </div>
      </div>
    {/if}
  </div>

  <!-- Help Menu -->
  <div class="relative">
    <button
      class="px-2.5 py-1 rounded hover:bg-[#2e2e3c] transition-colors {openMenu === 'help' ? 'bg-[#2e2e3c] text-white' : ''}"
      on:click|stopPropagation={() => toggleMenu('help')}
    >
      Help
    </button>
    {#if openMenu === 'help'}
      <div class="absolute left-0 top-full mt-1 w-48 bg-[#1f1f28] border border-gray-700 rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200">
        <button
          class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
          on:click={() => { closeMenu(); isShortcutsModalOpen.set(true); }}
        >
          <div class="flex items-center space-x-2">
            <Keyboard size={14} />
            <span>Shortcuts...</span>
          </div>
          <span class="text-[10px] text-gray-400">?</span>
        </button>
        <div class="my-1 border-t border-gray-700"></div>
        <div class="px-3 py-1.5 text-[11px] text-gray-400">
          <span class="text-white font-bold">XStitcher Studio</span> v0.2
        </div>
      </div>
    {/if}
  </div>
</div>
