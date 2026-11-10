<script lang="ts">
  import {
    isSaveModalOpen,
    initialSaveTab,
    projectName,
    grid,
    palette,
    layers,
    fabricColor,
    patternBounds,
    saveProjectFile,
    loadCompleteProject,
    measurementUnit,
    formatDimensions
  } from '../stores/editorStore';
  import { generatePrintReadyPdf, printPdfDirectly, getArtboardStitchData } from '../engine/pdfExport';
  import { exportToOxs, downloadOxsFile, parseOxsXml } from '../engine/oxsExport';
  import {
    isProjectLibraryModalOpen,
    saveCurrentProjectToDB,
    duplicateCurrentProject
  } from '../stores/projectStorage';
  import {
    FileText,
    Download,
    Save,
    X,
    Check,
    FolderOpen,
    FolderHeart,
    Copy,
    Sparkles,
    Printer,
    Layers,
    Share2,
    Palette as PaletteIcon,
    AlertCircle,
    Loader2
  } from 'lucide-svelte';

  let activeTab: 'pdf' | 'oxs' | 'xstitch' = 'pdf';
  let wasOpen = false;

  // PDF Form State
  let pdfTitle = '';
  let pdfAuthor = 'runStitch Studio';
  let pdfNotes = '';
  let chartStyle: 'color_symbols' | 'black_and_white' = 'color_symbols';
  let includeCover = true;
  let includeFlossKey = true;
  let includeMockup = true;
  let paginateLarge = true;
  let marginSize: 'minimal' | 'narrow' | 'standard' = 'standard';
  let gridDensity: 'compact' | 'standard' | 'large_print' = 'standard';
  let includeHeaderFooter = true;
  let skeinYield = 2000;
  let isGeneratingPdf = false;
  let isPrintingPdf = false;
  let pdfSuccessMsg = '';

  // File Names
  let xstitchFileName = '';
  let oxsFileName = '';

  // Import Inputs
  let oxsFileInputEl: HTMLInputElement;
  let jsonFileInputEl: HTMLInputElement;

  $: if ($isSaveModalOpen && !wasOpen) {
    const base = $projectName ? $projectName.trim() : 'Untitled Pattern';
    pdfTitle = base;
    xstitchFileName = `${base}.xstitch`;
    oxsFileName = `${base}.oxs`;
    activeTab = $initialSaveTab || 'pdf';
    pdfSuccessMsg = '';
    wasOpen = true;
  } else if (!$isSaveModalOpen) {
    wasOpen = false;
  }

  // Reactive artboard stats
  $: artboardData = getArtboardStitchData($grid, $layers, $palette);

  async function handleGeneratePdf() {
    isGeneratingPdf = true;
    pdfSuccessMsg = '';
    try {
      await generatePrintReadyPdf(
        $grid,
        $layers,
        $palette,
        $fabricColor,
        {
          title: pdfTitle || $projectName,
          author: pdfAuthor,
          notes: pdfNotes,
          chartStyle,
          includeCover,
          includeFlossKey,
          includeMockup,
          paginateLarge,
          marginSize,
          gridDensity,
          includeHeaderFooter,
          skeinYield
        }
      );
      pdfSuccessMsg = 'PDF Chart generated and downloaded successfully!';
      setTimeout(() => {
        pdfSuccessMsg = '';
      }, 4000);
    } catch (err) {
      console.error('Failed to generate PDF chart:', err);
      alert('Error generating PDF chart. Please check console for details.');
    } finally {
      isGeneratingPdf = false;
    }
  }

  async function handlePrintDirectly() {
    isPrintingPdf = true;
    pdfSuccessMsg = '';
    try {
      await printPdfDirectly(
        $grid,
        $layers,
        $palette,
        $fabricColor,
        {
          title: pdfTitle || $projectName,
          author: pdfAuthor,
          notes: pdfNotes,
          chartStyle,
          includeCover,
          includeFlossKey,
          includeMockup,
          paginateLarge,
          marginSize,
          gridDensity,
          includeHeaderFooter,
          skeinYield
        }
      );
      pdfSuccessMsg = 'Preparing print dialog...';
      setTimeout(() => {
        pdfSuccessMsg = '';
      }, 4000);
    } catch (err) {
      console.error('Failed to print PDF chart directly:', err);
      alert('Error printing PDF chart. Please check console for details.');
    } finally {
      isPrintingPdf = false;
    }
  }

  function handleExportOxs() {
    let name = oxsFileName.trim() || `${$projectName || 'pattern'}.oxs`;
    if (!name.toLowerCase().endsWith('.oxs')) name += '.oxs';

    const xml = exportToOxs(
      $grid,
      $layers,
      $palette,
      $fabricColor,
      pdfTitle || $projectName,
      pdfAuthor
    );
    downloadOxsFile(xml, name);
  }

  function handleImportOxs(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlStr = event.target?.result as string;
        const parsed = parseOxsXml(xmlStr);
        loadCompleteProject(parsed);
        isSaveModalOpen.set(false);
      } catch (err: any) {
        alert(err.message || 'Failed to parse Open X-Stitch (.oxs) file.');
      }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  }

  function handleSaveXStitch() {
    let name = xstitchFileName.trim();
    if (!name) name = `${$projectName || 'Untitled Pattern'}.xstitch`;
    if (!name.toLowerCase().endsWith('.xstitch')) name += '.xstitch';

    const baseName = name.replace(/\.xstitch$/i, '').trim();
    if (baseName && baseName !== $projectName) {
      projectName.set(baseName);
    }

    saveProjectFile(name);
    isSaveModalOpen.set(false);
  }

  function handleImportXStitch(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        loadCompleteProject(json);
        isSaveModalOpen.set(false);
      } catch (err) {
        alert('Invalid .xstitch or JSON file format.');
      }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!$isSaveModalOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      isSaveModalOpen.set(false);
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<!-- Hidden File Inputs -->
<input
  bind:this={oxsFileInputEl}
  type="file"
  accept=".oxs,.xml"
  on:change={handleImportOxs}
  class="hidden"
/>

<input
  bind:this={jsonFileInputEl}
  type="file"
  accept=".xstitch,.json"
  on:change={handleImportXStitch}
  class="hidden"
/>

{#if $isSaveModalOpen}
  <div
    class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn"
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-[#181822] border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-gray-200">
      <!-- Modal Header -->
      <div class="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1f1f2c]">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Share2 size={18} />
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">Export & Publishing Center</h3>
            <p class="text-xs text-gray-400">Print-ready PDF charts, Open X-Stitch (.oxs), and project backups</p>
          </div>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          on:click={() => isSaveModalOpen.set(false)}
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-gray-800 bg-[#16161e] px-4 pt-2 space-x-2">
        <button
          type="button"
          class="flex items-center space-x-2 px-4 py-2 border-b-2 text-xs font-medium transition-colors cursor-pointer {activeTab === 'pdf' ? 'border-indigo-500 text-white bg-[#222230] rounded-t-lg' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'pdf')}
        >
          <FileText size={14} class="{activeTab === 'pdf' ? 'text-indigo-400' : ''}" />
          <span>Print-Ready PDF</span>
        </button>

        <button
          type="button"
          class="flex items-center space-x-2 px-4 py-2 border-b-2 text-xs font-medium transition-colors cursor-pointer {activeTab === 'oxs' ? 'border-cyan-500 text-white bg-[#222230] rounded-t-lg' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'oxs')}
        >
          <Sparkles size={14} class="{activeTab === 'oxs' ? 'text-cyan-400' : ''}" />
          <span>Open X-Stitch (.oxs)</span>
        </button>

        <button
          type="button"
          class="flex items-center space-x-2 px-4 py-2 border-b-2 text-xs font-medium transition-colors cursor-pointer {activeTab === 'xstitch' ? 'border-emerald-500 text-white bg-[#222230] rounded-t-lg' : 'border-transparent text-gray-400 hover:text-gray-200'}"
          on:click={() => (activeTab = 'xstitch')}
        >
          <Save size={14} class="{activeTab === 'xstitch' ? 'text-emerald-400' : ''}" />
          <span>Project File (.xstitch)</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        <!-- ============================================== -->
        <!-- TAB 1: PRINT-READY PDF CHART                   -->
        <!-- ============================================== -->
        {#if activeTab === 'pdf'}
          <div class="space-y-4">
            <!-- Title & Author Row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="pdf-title-input" class="block text-gray-300 font-medium mb-1">
                  Pattern Chart Title
                </label>
                <input
                  id="pdf-title-input"
                  type="text"
                  bind:value={pdfTitle}
                  placeholder="e.g. Heirloom Floral Sampler"
                  class="w-full bg-[#242432] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label for="pdf-author-input" class="block text-gray-300 font-medium mb-1">
                  Designer / Author
                </label>
                <input
                  id="pdf-author-input"
                  type="text"
                  bind:value={pdfAuthor}
                  placeholder="e.g. Your Studio Name"
                  class="w-full bg-[#242432] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            </div>

            <!-- Chart Appearance & Format Options -->
            <div class="bg-[#20202c] border border-gray-800 rounded-xl p-3.5 space-y-3">
              <span class="text-xs font-semibold text-gray-300 block">Chart Symbol Mode</span>
              <div class="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  class="p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition-colors cursor-pointer {chartStyle === 'color_symbols' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#181822] border-gray-700/60 text-gray-400 hover:text-gray-200'}"
                  on:click={() => (chartStyle = 'color_symbols')}
                >
                  <div class="w-4 h-4 rounded bg-gradient-to-tr from-purple-500 to-indigo-500 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div class="font-bold text-xs text-white">Color Symbols</div>
                    <div class="text-[10px] text-gray-400">Tinted cells with contrasting high-visibility symbols</div>
                  </div>
                </button>

                <button
                  type="button"
                  class="p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition-colors cursor-pointer {chartStyle === 'black_and_white' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#181822] border-gray-700/60 text-gray-400 hover:text-gray-200'}"
                  on:click={() => (chartStyle = 'black_and_white')}
                >
                  <div class="w-4 h-4 rounded bg-white border border-gray-400 flex items-center justify-center text-black font-bold text-[10px] flex-shrink-0 mt-0.5">
                    ●
                  </div>
                  <div>
                    <div class="font-bold text-xs text-white">Black & White Chart</div>
                    <div class="text-[10px] text-gray-400">Classic publication-style crisp black symbols on white grid</div>
                  </div>
                </button>
              </div>

              <!-- Included Sections Checkboxes -->
              <div class="pt-2 border-t border-gray-700/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={includeCover}
                    class="rounded bg-gray-800 border-gray-700 text-indigo-600 accent-indigo-500"
                  />
                  <span>Cover & 3D Mockup Page</span>
                </label>

                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={includeFlossKey}
                    class="rounded bg-gray-800 border-gray-700 text-indigo-600 accent-indigo-500"
                  />
                  <span>Floss Key & Skein Estimator</span>
                </label>

                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={paginateLarge}
                    class="rounded bg-gray-800 border-gray-700 text-indigo-600 accent-indigo-500"
                  />
                  <span>Auto-Paginate Large Patterns</span>
                </label>

                <label class="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={includeHeaderFooter}
                    class="rounded bg-gray-800 border-gray-700 text-indigo-600 accent-indigo-500"
                  />
                  <span>Header, Coordinates & Page Map</span>
                </label>
              </div>

              <!-- Page Margins & Grid Density Row -->
              <div class="pt-2.5 border-t border-gray-700/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label for="pdf-margins-select" class="block text-gray-400 text-[11px] font-medium mb-1">Page Borders / Margins</label>
                  <select
                    id="pdf-margins-select"
                    bind:value={marginSize}
                    class="w-full bg-[#181824] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="minimal">Minimal (6 mm)</option>
                    <option value="narrow">Narrow (10 mm)</option>
                    <option value="standard">Standard (14 mm)</option>
                  </select>
                </div>

                <div>
                  <label for="pdf-density-select" class="block text-gray-400 text-[11px] font-medium mb-1">Chart Grid Density</label>
                  <select
                    id="pdf-density-select"
                    bind:value={gridDensity}
                    class="w-full bg-[#181824] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="compact">Compact (~2.8 mm/cell)</option>
                    <option value="standard">Standard (~3.4 mm/cell)</option>
                    <option value="large_print">Large Print (~4.5 mm/cell)</option>
                  </select>
                </div>

                <div>
                  <label for="pdf-skein-yield-input" class="block text-gray-400 text-[11px] font-medium mb-1">Stitches / Skein Yield</label>
                  <div class="relative">
                    <input
                      id="pdf-skein-yield-input"
                      type="number"
                      bind:value={skeinYield}
                      min="500"
                      max="10000"
                      step="100"
                      class="w-full bg-[#181824] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span class="absolute right-2 top-1.5 text-[10px] text-gray-500 pointer-events-none">st</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pattern Artboard Statistics Summary -->
            <div class="bg-[#171720] rounded-xl border border-gray-800 p-3.5 space-y-2 text-xs">
              <div class="flex items-center justify-between text-gray-400">
                <span>Pattern Artboard:</span>
                <span class="font-mono text-white font-semibold">
                  {$grid.width} × {$grid.height} stitches ({($grid.width / $grid.fabricCount).toFixed(1)}″ × {($grid.height / $grid.fabricCount).toFixed(1)}″ @ {$grid.fabricCount}ct)
                </span>
              </div>

              <div class="flex items-center justify-between text-gray-400">
                <span>Stitch Count in Pattern:</span>
                <span class="font-mono text-emerald-400 font-semibold">
                  {artboardData.totalStitches.toLocaleString()} stitches
                </span>
              </div>

              {#if artboardData.pasteboardStitches > 0}
                <div class="flex items-center justify-between text-amber-400/90 text-[11px]">
                  <span>Staging Pasteboard:</span>
                  <span>{artboardData.pasteboardStitches} stitches excluded from print chart</span>
                </div>
              {/if}

              <div class="flex items-center justify-between text-gray-400">
                <span>Active Floss Palette:</span>
                <span class="font-mono text-gray-200">
                  {artboardData.usedColors.length} unique thread colors
                </span>
              </div>
            </div>

            {#if pdfSuccessMsg}
              <div class="p-2.5 rounded-lg bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                <Check size={14} class="text-emerald-400" />
                <span>{pdfSuccessMsg}</span>
              </div>
            {/if}
          </div>

        <!-- ============================================== -->
        <!-- TAB 2: OPEN X-STITCH (.oxs) XML                -->
        <!-- ============================================== -->
        {:else if activeTab === 'oxs'}
          <div class="space-y-4">
            <div class="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 text-xs text-cyan-200 space-y-1">
              <div class="font-bold flex items-center space-x-1.5 text-cyan-300">
                <Sparkles size={14} />
                <span>Standard Open X-Stitch XML (.oxs)</span>
              </div>
              <p class="text-[11px] text-cyan-200/80 leading-relaxed">
                Open X-Stitch is an open cross-stitch interchange format supported by professional stitching software like WinStitch, MacStitch, and Pattern Maker. It preserves grid geometry, DMC floss definitions, and multi-layer stitches.
              </p>
            </div>

            <div>
              <label for="oxs-filename-input" class="block text-gray-300 font-medium mb-1.5">
                Export File Name
              </label>
              <input
                id="oxs-filename-input"
                type="text"
                bind:value={oxsFileName}
                placeholder="my-pattern.oxs"
                class="w-full bg-[#242432] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            <div class="pt-3 border-t border-gray-800 flex items-center justify-between">
              <div>
                <span class="text-xs text-gray-300 block font-medium">Import Open X-Stitch File</span>
                <span class="text-[11px] text-gray-500">Load a .oxs pattern from another application</span>
              </div>
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-lg bg-[#252535] hover:bg-[#2d2d42] border border-gray-700 text-xs text-gray-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                on:click={() => oxsFileInputEl?.click()}
              >
                <FolderOpen size={13} class="text-cyan-400" />
                <span>Import .oxs...</span>
              </button>
            </div>
          </div>

        <!-- ============================================== -->
        <!-- TAB 3: PROJECT FILE (.xstitch)                 -->
        <!-- ============================================== -->
        {:else if activeTab === 'xstitch'}
          <div class="space-y-4">
            <!-- Browser Library Callout -->
            <div class="bg-indigo-950/35 border border-indigo-700/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div class="space-y-0.5">
                <div class="font-bold text-indigo-300 flex items-center space-x-1.5 text-xs">
                  <FolderHeart size={14} />
                  <span>Auto-Saved in Browser Storage</span>
                </div>
                <p class="text-[11px] text-indigo-200/80">
                  Your pattern is automatically saved in <strong>My Projects</strong> as you draw. Download a <code class="text-white">.xstitch</code> file below for external backup or sharing.
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg bg-[#242438] hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-600/40 text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                  on:click={() => { duplicateCurrentProject(); }}
                  title="Save a duplicate snapshot in browser library"
                >
                  <Copy size={12} />
                  <span>Make a Copy</span>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                  on:click={() => {
                    isSaveModalOpen.set(false);
                    isProjectLibraryModalOpen.set(true);
                  }}
                >
                  <FolderHeart size={12} />
                  <span>Open My Projects</span>
                </button>
              </div>
            </div>

            <div>
              <label for="save-filename-input" class="block text-gray-300 font-medium mb-1.5">
                Download Backup File Name (.xstitch)
              </label>
              <input
                id="save-filename-input"
                type="text"
                bind:value={xstitchFileName}
                placeholder="my-pattern.xstitch"
                class="w-full bg-[#242432] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <span class="text-[11px] text-gray-500 mt-1 block">
                Saved as native cross-stitch project format (.xstitch JSON with full layer and artboard data)
              </span>
            </div>

            <div class="bg-[#171720] rounded-xl border border-gray-800 p-3.5 space-y-2 text-xs">
              <div class="flex items-center justify-between text-gray-400">
                <span>Artboard Dimensions:</span>
                <span class="font-mono text-gray-200">{$grid.width} × {$grid.height} stitches</span>
              </div>
              <div class="flex items-center justify-between text-gray-400">
                <span>Layers Preserved:</span>
                <span class="font-mono text-gray-200">{$layers.length} layers</span>
              </div>
              <div class="flex items-center justify-between text-gray-400">
                <span>Fabric Count & Color:</span>
                <span class="font-mono text-gray-200">{$grid.fabricCount}-ct • {$fabricColor}</span>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-800 flex items-center justify-between">
              <div>
                <span class="text-xs text-gray-300 block font-medium">Open Existing Project</span>
                <span class="text-[11px] text-gray-500">Restore a previously saved .xstitch project</span>
              </div>
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-lg bg-[#252535] hover:bg-[#2d2d42] border border-gray-700 text-xs text-gray-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                on:click={() => jsonFileInputEl?.click()}
              >
                <FolderOpen size={13} class="text-emerald-400" />
                <span>Open .xstitch...</span>
              </button>
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-[#1b1b26] border-t border-gray-800 flex items-center justify-between">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-[#282838] text-xs font-medium transition-colors cursor-pointer"
          on:click={() => isSaveModalOpen.set(false)}
        >
          Cancel
        </button>

        <div>
          {#if activeTab === 'pdf'}
            <div class="flex items-center space-x-2.5">
              <button
                type="button"
                class="px-4 py-2 rounded-xl bg-[#28283c] hover:bg-[#34344d] border border-gray-700 text-gray-200 text-xs font-medium transition-all shadow-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                disabled={isPrintingPdf || isGeneratingPdf}
                on:click={handlePrintDirectly}
              >
                {#if isPrintingPdf}
                  <Loader2 size={14} class="animate-spin text-indigo-400" />
                  <span>Preparing Print...</span>
                {:else}
                  <Printer size={14} class="text-indigo-400" />
                  <span>Print Directly</span>
                {/if}
              </button>

              <button
                type="button"
                class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                disabled={isGeneratingPdf || isPrintingPdf}
                on:click={handleGeneratePdf}
              >
                {#if isGeneratingPdf}
                  <Loader2 size={14} class="animate-spin" />
                  <span>Generating PDF...</span>
                {:else}
                  <Download size={14} />
                  <span>Download PDF Chart</span>
                {/if}
              </button>
            </div>
          {:else if activeTab === 'oxs'}
            <button
              type="button"
              class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-2 cursor-pointer"
              on:click={handleExportOxs}
            >
              <Download size={14} />
              <span>Download Open X-Stitch (.oxs)</span>
            </button>
          {:else if activeTab === 'xstitch'}
            <button
              type="button"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md flex items-center space-x-2 cursor-pointer"
              on:click={handleSaveXStitch}
            >
              <Save size={14} />
              <span>Save .xstitch Project</span>
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
