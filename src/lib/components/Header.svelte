<script lang="ts">
  import {
    grid,
    layers,
    palette,
    undo,
    redo,
    canUndo,
    canRedo,
    isCanvasSizeModalOpen,
    isNewProjectModalOpen,
    isSaveModalOpen,
    initialSaveTab,
    projectName,
    measurementUnit,
    formatDimensions
  } from '../stores/editorStore';
  import {
    autosaveStatus,
    savedProjectsList,
    isProjectLibraryModalOpen,
    saveCurrentProjectToDB
  } from '../stores/projectStorage';
  import MenuBar from './MenuBar.svelte';
  import {
    Undo2,
    Redo2,
    Download,
    Plus,
    Maximize2,
    Pencil,
    Printer,
    FolderHeart,
    Check,
    Loader2,
    AlertCircle
  } from 'lucide-svelte';

  $: physicalDimensions = formatDimensions($grid.width, $grid.height, $grid.fabricCount, $measurementUnit);

  let isEditingName = false;
  let editNameValue = $projectName;
  let nameInputEl: HTMLInputElement;

  function startEditingName() {
    editNameValue = $projectName;
    isEditingName = true;
    setTimeout(() => {
      if (nameInputEl) {
        nameInputEl.focus();
        nameInputEl.select();
      }
    }, 20);
  }

  function commitName() {
    if (isEditingName) {
      const trimmed = editNameValue.trim();
      if (trimmed) {
        projectName.set(trimmed);
      }
      isEditingName = false;
    }
  }

  function cancelEditName() {
    isEditingName = false;
  }

  function handleNameKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditName();
    }
  }
</script>

<header class="h-12 bg-[#1b1b22] border-b border-[#2e2e38] px-3 flex items-center justify-between select-none z-30 shadow-sm">
  <!-- Left: Brand / Title + Desktop Menu Bar -->
  <div class="flex items-center space-x-3">
    <div class="flex items-center space-x-2">
      <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30 text-xs">
        RS
      </div>
      <div class="hidden md:flex items-baseline space-x-1.5">
        <h1 class="text-sm font-bold text-white tracking-wide">runStitch</h1>
        <span class="text-[10px] text-indigo-400 font-mono bg-indigo-950/60 px-1 py-0.2 rounded border border-indigo-800/40">
          Studio
        </span>
      </div>
    </div>

    <!-- Application Menu Bar (File, Edit, View, Fabric, Help) -->
    <div class="border-l border-[#2e2e38] pl-2">
      <MenuBar />
    </div>

    <!-- Editable Project Name & Browser Autosave Status -->
    <div class="hidden md:flex items-center border-l border-[#2e2e38] pl-3 ml-1 space-x-1.5">
      {#if isEditingName}
        <input
          bind:this={nameInputEl}
          type="text"
          bind:value={editNameValue}
          on:blur={commitName}
          on:keydown={handleNameKeyDown}
          class="bg-[#13131a] border border-indigo-500 rounded px-2 py-0.5 text-xs text-white font-medium focus:outline-none shadow-inner max-w-[200px]"
        />
      {:else}
        <button
          type="button"
          class="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-[#252532] text-xs text-gray-200 hover:text-white transition-colors cursor-pointer group"
          on:click={startEditingName}
          title="Click to rename project"
        >
          <span class="font-medium truncate max-w-[180px]">{$projectName}</span>
          <Pencil size={11} class="text-gray-500 group-hover:text-indigo-400 transition-colors" />
        </button>
      {/if}

      <!-- Autosave Status Badge -->
      <button
        type="button"
        class="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer
        {$autosaveStatus === 'saving'
          ? 'text-amber-300 bg-amber-950/40 border border-amber-800/40'
          : $autosaveStatus === 'error'
          ? 'text-red-300 bg-red-950/40 border border-red-800/40'
          : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-[#252532]'}"
        on:click={() => {
          saveCurrentProjectToDB();
          isProjectLibraryModalOpen.set(true);
        }}
        title="Auto-saved to browser storage • Click to open My Projects (Cmd+O)"
      >
        {#if $autosaveStatus === 'saving'}
          <Loader2 size={10} class="animate-spin" />
          <span>Saving…</span>
        {:else if $autosaveStatus === 'error'}
          <AlertCircle size={10} />
          <span>Storage Full</span>
        {:else}
          <Check size={10} />
          <span>Saved</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Center Project Dimensions & Physical Fabric Spec (Clickable to resize) -->
  <button
    class="hidden md:flex items-center space-x-3 bg-[#131318] hover:bg-[#202028] px-3 py-1 rounded-full border border-[#2e2e38] hover:border-indigo-500/60 text-xs cursor-pointer transition-all group"
    on:click={() => isCanvasSizeModalOpen.set(true)}
    title="Click to Resize Canvas or Change Count"
  >
    <div class="text-gray-300 font-medium">
      <span class="text-white font-mono">{$grid.width}×{$grid.height}</span> stitches
    </div>
    <div class="w-px h-3 bg-gray-700"></div>
    <div class="text-gray-400 group-hover:text-indigo-300 transition-colors">
      {$grid.fabricCount}-ct: <span class="text-gray-200 font-mono font-semibold">{physicalDimensions}</span>
    </div>
    <Maximize2 size={12} class="text-gray-500 group-hover:text-indigo-400" />
  </button>

  <!-- Right: Action Controls -->
  <div class="flex items-center space-x-1.5 sm:space-x-2">
    <!-- Undo / Redo -->
    <button
      class="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-[#2b2b36] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      on:click={undo}
      disabled={!$canUndo}
      title="Undo (Cmd+Z)"
    >
      <Undo2 size={16} />
    </button>
    <button
      class="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-[#2b2b36] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      on:click={redo}
      disabled={!$canRedo}
      title="Redo (Cmd+Shift+Z)"
    >
      <Redo2 size={16} />
    </button>

    <div class="w-px h-4 bg-gray-700 mx-1 hidden sm:block"></div>

    <!-- My Projects (Browser Library) Quick Button -->
    <button
      type="button"
      class="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium text-gray-200 hover:text-white bg-[#23232f] hover:bg-[#2d2d3d] border border-[#363648] transition-colors cursor-pointer"
      on:click={() => isProjectLibraryModalOpen.set(true)}
      title="Open My Projects Library (Cmd+O)"
    >
      <FolderHeart size={14} class="text-indigo-400" />
      <span class="hidden sm:inline">My Projects</span>
      {#if $savedProjectsList.length > 0}
        <span class="text-[10px] font-mono bg-[#16161f] text-indigo-300 px-1.5 py-0.2 rounded-full border border-indigo-900/60">
          {$savedProjectsList.length}
        </span>
      {/if}
    </button>

    <!-- New Canvas Quick Button -->
    <button
      class="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-300 hover:text-white hover:bg-[#2b2b36] border border-gray-700 transition-colors cursor-pointer"
      on:click={() => isNewProjectModalOpen.set(true)}
      title="New Project (Cmd+N)"
    >
      <Plus size={14} />
      <span>New</span>
    </button>

    <!-- Export / Print PDF Chart Quick Button -->
    <button
      type="button"
      class="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
      on:click={() => { initialSaveTab.set('pdf'); isSaveModalOpen.set(true); }}
      title="Export Print-Ready PDF Chart (Cmd+P)"
    >
      <Printer size={14} />
      <span class="hidden sm:inline">PDF Chart</span>
    </button>

    <!-- Export / Download Project -->
    <button
      type="button"
      class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
      on:click={() => { initialSaveTab.set('xstitch'); isSaveModalOpen.set(true); }}
      title="Download or Export Project File (Cmd+Shift+S)"
    >
      <Download size={14} />
      <span class="hidden sm:inline">Export</span>
    </button>
  </div>
</header>

