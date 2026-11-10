<script lang="ts">
  import {
    isProjectLibraryModalOpen,
    savedProjectsList,
    currentProjectId,
    openSavedProject,
    duplicateSavedProject,
    renameSavedProject,
    deleteSavedProject,
    downloadProjectRecordAsFile,
    saveCurrentProjectToDB,
    type SavedProjectRecord
  } from '../stores/projectStorage';
  import {
    isNewProjectModalOpen,
    loadCompleteProject
  } from '../stores/editorStore';
  import { parseOxsXml } from '../engine/oxsExport';
  import {
    FolderHeart,
    Plus,
    Upload,
    Search,
    Check,
    Copy,
    Download,
    Trash2,
    Pencil,
    X,
    Layers,
    Sparkles,
    Clock,
    HardDrive
  } from 'lucide-svelte';

  let searchQuery = '';
  let sortBy: 'updated' | 'name' | 'stitches' = 'updated';
  let editingId: string | null = null;
  let editingName = '';
  let confirmingDeleteId: string | null = null;
  let fileInputEl: HTMLInputElement;

  let wasOpen = false;
  $: if ($isProjectLibraryModalOpen && !wasOpen) {
    wasOpen = true;
    searchQuery = '';
    editingId = null;
    confirmingDeleteId = null;
    // Refresh current active project thumbnail before displaying gallery
    saveCurrentProjectToDB();
  } else if (!$isProjectLibraryModalOpen) {
    wasOpen = false;
  }

  $: filteredProjects = $savedProjectsList
    .filter(p => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stitches') return (b.stitchCount || 0) - (a.stitchCount || 0);
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  function formatRelativeTime(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  async function handleSelectProject(proj: SavedProjectRecord) {
    if (editingId === proj.id || confirmingDeleteId === proj.id) return;
    if (proj.id !== $currentProjectId) {
      await openSavedProject(proj.id);
    }
    isProjectLibraryModalOpen.set(false);
  }

  function startRename(proj: SavedProjectRecord) {
    editingId = proj.id;
    editingName = proj.name;
    confirmingDeleteId = null;
  }

  async function commitRename(id: string) {
    if (editingId === id) {
      const trimmed = editingName.trim();
      if (trimmed) {
        await renameSavedProject(id, trimmed);
      }
      editingId = null;
    }
  }

  function handleNewProject() {
    isProjectLibraryModalOpen.set(false);
    isNewProjectModalOpen.set(true);
  }

  function handleImportFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.toLowerCase().endsWith('.oxs') || file.name.toLowerCase().endsWith('.xml')) {
          const parsed = parseOxsXml(text);
          loadCompleteProject(parsed);
        } else {
          const json = JSON.parse(text);
          loadCompleteProject(json);
        }
        await saveCurrentProjectToDB();
        isProjectLibraryModalOpen.set(false);
      } catch (err) {
        alert('Could not parse pattern file. Supported formats: .xstitch, .oxs, .json');
      }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!$isProjectLibraryModalOpen) return;
    if (e.key === 'Escape') {
      if (editingId) {
        editingId = null;
        return;
      }
      if (confirmingDeleteId) {
        confirmingDeleteId = null;
        return;
      }
      e.preventDefault();
      isProjectLibraryModalOpen.set(false);
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<input
  bind:this={fileInputEl}
  type="file"
  accept=".xstitch,.json,.oxs,.xml"
  on:change={handleImportFile}
  class="hidden"
/>

{#if $isProjectLibraryModalOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-label="My Projects Library"
    on:click|self={() => isProjectLibraryModalOpen.set(false)}
  >
    <div class="bg-[#181822] border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-gray-200">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-[#1f1f2c]">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <FolderHeart size={19} />
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="font-bold text-white text-sm">My Projects</h3>
              <span class="text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                {$savedProjectsList.length} {$savedProjectsList.length === 1 ? 'pattern' : 'patterns'}
              </span>
            </div>
            <p class="text-[11px] text-gray-400">
              Automatically saved in your browser storage &bull; Switch patterns anytime or download <code class="text-gray-300">.xstitch</code> backups
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-[#252535] hover:bg-[#2f2f44] border border-gray-700 text-xs text-gray-200 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
            on:click={() => fileInputEl?.click()}
            title="Import a .xstitch or .oxs file from your computer"
          >
            <Upload size={13} class="text-cyan-400" />
            <span>Open File from Disk...</span>
          </button>

          <button
            type="button"
            class="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium flex items-center space-x-1.5 shadow-md shadow-indigo-600/25 transition-colors cursor-pointer"
            on:click={handleNewProject}
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>

          <button
            type="button"
            class="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer ml-1"
            on:click={() => isProjectLibraryModalOpen.set(false)}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <!-- Filter & Sort Subbar -->
      <div class="px-5 py-3 bg-[#15151e] border-b border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Filter projects by name..."
            class="w-full bg-[#1e1e2a] border border-gray-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="flex items-center space-x-2 text-[11px] text-gray-400">
          <span>Sort by:</span>
          <div class="flex items-center space-x-1 bg-[#1e1e2a] p-0.5 rounded-lg border border-gray-700/80">
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {sortBy === 'updated' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => (sortBy = 'updated')}
            >
              Last Modified
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {sortBy === 'name' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => (sortBy = 'name')}
            >
              Name
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-md transition-colors cursor-pointer {sortBy === 'stitches' ? 'bg-indigo-600 text-white font-medium' : 'text-gray-400 hover:text-gray-200'}"
              on:click={() => (sortBy = 'stitches')}
            >
              Stitch Count
            </button>
          </div>
        </div>
      </div>

      <!-- Projects Grid -->
      <div class="flex-1 overflow-y-auto p-5">
        {#if filteredProjects.length === 0}
          <div class="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-[#222230] border border-gray-700 flex items-center justify-center text-gray-500">
              <FolderHeart size={24} />
            </div>
            <div class="text-sm font-semibold text-gray-300">
              {searchQuery ? 'No matching projects found' : 'No saved projects yet'}
            </div>
            <p class="text-xs text-gray-500 max-w-sm">
              {searchQuery
                ? 'Try clearing your search filter or create a new pattern.'
                : 'Your active pattern is automatically saved here as you draw.'}
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each filteredProjects as proj (proj.id)}
              {@const isCurrent = proj.id === $currentProjectId}
              <div
                class="group rounded-xl border transition-all flex flex-col overflow-hidden bg-[#1e1e2a]
                {isCurrent
                  ? 'border-indigo-500 ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-950/40'
                  : 'border-gray-800 hover:border-gray-600 hover:shadow-xl'}"
              >
                <!-- Thumbnail Preview Area -->
                <button
                  type="button"
                  class="relative h-36 w-full bg-[#13131a] flex items-center justify-center p-3 overflow-hidden cursor-pointer border-b border-gray-800/80"
                  on:click={() => handleSelectProject(proj)}
                  title={isCurrent ? 'Continue editing this pattern' : `Open "${proj.name}"`}
                >
                  {#if proj.thumbnailDataUrl}
                    <img
                      src={proj.thumbnailDataUrl}
                      alt={proj.name}
                      class="max-w-full max-h-full object-contain rounded shadow-md transition-transform duration-200 group-hover:scale-105"
                      style="image-rendering: pixelated;"
                    />
                  {:else}
                    <div
                      class="w-24 h-16 rounded shadow-inner border border-gray-700"
                      style="background-color: {proj.fabricColor || '#F9F6EE'};"
                    ></div>
                  {/if}

                  {#if isCurrent}
                    <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center space-x-1 shadow-md">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                      <span>Active</span>
                    </span>
                  {/if}

                  <span class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-gray-300 border border-white/10">
                    {proj.grid.width}×{proj.grid.height} st &bull; {proj.grid.fabricCount}ct
                  </span>
                </button>

                <!-- Card Details & Controls -->
                <div class="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {#if editingId === proj.id}
                      <div class="flex items-center space-x-1">
                        <input
                          type="text"
                          bind:value={editingName}
                          on:keydown={(e) => {
                            if (e.key === 'Enter') commitRename(proj.id);
                            if (e.key === 'Escape') editingId = null;
                          }}
                          on:blur={() => commitRename(proj.id)}
                          class="w-full bg-[#13131a] border border-indigo-500 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                        />
                        <button
                          type="button"
                          class="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500"
                          on:click={() => commitRename(proj.id)}
                          title="Save Name"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    {:else}
                      <div class="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          class="text-left font-bold text-xs text-white hover:text-indigo-300 truncate transition-colors cursor-pointer"
                          on:click={() => handleSelectProject(proj)}
                        >
                          {proj.name}
                        </button>
                        <button
                          type="button"
                          class="p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-[#2a2a3a] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                          on:click|stopPropagation={() => startRename(proj)}
                          title="Rename Project"
                        >
                          <Pencil size={11} />
                        </button>
                      </div>
                    {/if}

                    <div class="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                      <span class="font-mono text-gray-300">
                        {(proj.stitchCount || 0).toLocaleString()} {proj.stitchCount === 1 ? 'stitch' : 'stitches'}
                      </span>
                      <span class="flex items-center space-x-1 text-gray-500" title={new Date(proj.updatedAt).toLocaleString()}>
                        <Clock size={10} />
                        <span>{formatRelativeTime(proj.updatedAt)}</span>
                      </span>
                    </div>
                  </div>

                  <!-- Bottom Action Row -->
                  {#if confirmingDeleteId === proj.id}
                    <div class="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px]">
                      <span class="text-red-300 font-medium">Delete pattern?</span>
                      <div class="flex items-center space-x-1.5">
                        <button
                          type="button"
                          class="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-medium cursor-pointer"
                          on:click={() => {
                            deleteSavedProject(proj.id);
                            confirmingDeleteId = null;
                          }}
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          class="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 cursor-pointer"
                          on:click={() => (confirmingDeleteId = null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  {:else}
                    <div class="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer
                        {isCurrent
                          ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40'
                          : 'bg-[#282838] hover:bg-indigo-600 text-gray-200 hover:text-white'}"
                        on:click={() => handleSelectProject(proj)}
                      >
                        {isCurrent ? 'Continue Editing' : 'Open Pattern'}
                      </button>

                      <div class="flex items-center space-x-1">
                        <button
                          type="button"
                          class="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a3a] transition-colors cursor-pointer"
                          on:click|stopPropagation={() => duplicateSavedProject(proj.id, false)}
                          title="Duplicate Pattern"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-300 hover:bg-[#2a2a3a] transition-colors cursor-pointer"
                          on:click|stopPropagation={() => downloadProjectRecordAsFile(proj)}
                          title="Download .xstitch Backup File"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          type="button"
                          class="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                          on:click|stopPropagation={() => (confirmingDeleteId = proj.id)}
                          title="Delete from Browser Library"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 bg-[#15151e] border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
        <div class="flex items-center space-x-2">
          <HardDrive size={13} class="text-indigo-400" />
          <span>Stored locally in browser IndexedDB &bull; Changes auto-save as you work</span>
        </div>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-[#252534] text-xs font-medium transition-colors cursor-pointer"
          on:click={() => isProjectLibraryModalOpen.set(false)}
        >
          Done
        </button>
      </div>
    </div>
  </div>
{/if}

