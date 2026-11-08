<script lang="ts">
  import {
    layers,
    activeLayerId,
    activeLayer,
    createNewLayer,
    deleteLayer,
    duplicateLayer,
    moveLayer,
    mergeLayerDown,
    renameLayer,
    reorderLayers,
    flattenAllLayers,
    addReferenceImageLayer,
    openDigitizerForLayer,
    openTextModal,
    hideNonStitchLayers,
    toggleHideNonStitchLayers,
    rasterizeTextLayerToStitches,
    isImageUrlModalOpen
  } from '../stores/editorStore';
  import { SAMPLE_IMAGES } from '../data/sampleImages';
  import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Plus,
    Trash2,
    Layers as LayersIcon,
    Copy,
    ArrowUp,
    ArrowDown,
    ArrowDownToLine,
    Edit2,
    GripVertical,
    FoldVertical,
    Image as ImageIcon,
    Sparkles,
    Upload,
    Globe,
    ChevronDown,
    Type
  } from 'lucide-svelte';

  // Inline Rename state
  let editingLayerId: string | null = null;
  let editingName = '';

  // Drag and Drop state
  let draggedLayerId: string | null = null;
  let dragOverLayerId: string | null = null;

  // Dropdown menus state
  let showNewLayerMenu = false;
  let fileInputEl: HTMLInputElement;

  function addNewLayer() {
    createNewLayer();
  }

  function toggleVisible(id: string) {
    layers.update(ls => ls.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }

  function toggleLock(id: string) {
    layers.update(ls => ls.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  }

  function handleDeleteLayer(id: string) {
    deleteLayer(id);
  }

  function startRename(layer: { id: string; name: string }) {
    editingLayerId = layer.id;
    editingName = layer.name;
  }

  function commitRename() {
    if (editingLayerId && editingName.trim()) {
      renameLayer(editingLayerId, editingName);
    }
    editingLayerId = null;
  }

  function handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      commitRename();
    } else if (e.key === 'Escape') {
      editingLayerId = null;
    }
  }

  function updateOpacity(id: string, opacity: number) {
    layers.update(ls => ls.map(l => l.id === id ? { ...l, opacity } : l));
  }

  function handleOpacityInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if ($activeLayer) {
      updateOpacity($activeLayer.id, parseFloat(target.value));
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
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
    input.value = '';
    showNewLayerMenu = false;
  }

  function handleLoadSample(sampleUrl: string, sampleTitle: string) {
    const img = new Image();
    img.onload = () => {
      addReferenceImageLayer(sampleUrl, sampleTitle, img.naturalWidth, img.naturalHeight);
    };
    img.src = sampleUrl;
    showNewLayerMenu = false;
  }

  // Drag-and-drop handlers
  function handleDragStart(e: DragEvent, id: string) {
    draggedLayerId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
  }

  function handleDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== id) {
      dragOverLayerId = id;
    }
  }

  function handleDragLeave(id: string) {
    if (dragOverLayerId === id) {
      dragOverLayerId = null;
    }
  }

  function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) {
      draggedLayerId = null;
      dragOverLayerId = null;
      return;
    }

    const current = [...$layers];
    const fromIndex = current.findIndex(l => l.id === draggedLayerId);
    const toIndex = current.findIndex(l => l.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      reorderLayers(current);
    }

    draggedLayerId = null;
    dragOverLayerId = null;
  }

  function handleDragEnd() {
    draggedLayerId = null;
    dragOverLayerId = null;
  }
</script>

<div class="flex flex-col h-full bg-[#1e1e24] text-gray-200 select-none">
  <!-- Hidden file input for uploading reference images -->
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp,image/svg+xml"
    bind:this={fileInputEl}
    on:change={handleFileSelect}
    class="hidden"
  />

  <!-- Header & Toolbar -->
  <div class="p-2 border-b border-[#2e2e38] flex items-center justify-between bg-[#23232c] flex-shrink-0">
    <div class="flex items-center space-x-1.5">
      <LayersIcon size={14} class="text-indigo-400" />
      <span class="text-xs uppercase font-bold text-gray-300 tracking-wider">Layers</span>
    </div>

    <!-- Quick Layer Actions -->
    <div class="flex items-center space-x-1">
      {#if $activeLayer}
        <button
          type="button"
          class="p-1 rounded text-gray-400 hover:text-white hover:bg-[#323242] transition-colors"
          on:click={() => duplicateLayer($activeLayer.id)}
          title="Duplicate Active Layer"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          class="p-1 rounded text-gray-400 hover:text-white hover:bg-[#323242] transition-colors"
          on:click={() => mergeLayerDown($activeLayer.id)}
          title="Merge Layer Down"
        >
          <ArrowDownToLine size={13} />
        </button>
      {/if}

      {#if $layers.length > 1}
        <button
          type="button"
          class="p-1 rounded text-amber-400 hover:text-amber-200 hover:bg-[#323242] transition-colors"
          on:click={flattenAllLayers}
          title="Flatten All Visible Layers"
        >
          <FoldVertical size={13} />
        </button>
      {/if}

      <!-- Toggle Hide/Show Non-Stitch Layers (Reference Images & Text) -->
      <button
        type="button"
        class="p-1 rounded transition-colors {$hideNonStitchLayers ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-gray-400 hover:text-white hover:bg-[#323242]'}"
        on:click={toggleHideNonStitchLayers}
        title={$hideNonStitchLayers ? 'Show Reference & Text Layers' : 'Hide Reference & Text Layers (Pure Stitches Mode)'}
      >
        {#if $hideNonStitchLayers}
          <EyeOff size={13} />
        {:else}
          <Eye size={13} />
        {/if}
      </button>

      <div class="w-px h-3.5 bg-gray-700 mx-0.5"></div>

      <!-- Unified New Layer Split Button with Dropdown -->
      <div class="relative flex items-center">
        <button
          type="button"
          class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded-l flex items-center space-x-1 font-medium transition-colors shadow-sm cursor-pointer"
          on:click={addNewLayer}
          title="Create New Stitch Layer"
        >
          <Plus size={12} />
          <span>New</span>
        </button>
        <button
          type="button"
          class="text-xs bg-indigo-750 hover:bg-indigo-600 text-white px-1 py-0.5 rounded-r border-l border-indigo-400/40 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          on:click={() => { showNewLayerMenu = !showNewLayerMenu; }}
          title="Choose Layer Type (Stitch, Text, Image)"
        >
          <ChevronDown size={11} />
        </button>

        {#if showNewLayerMenu}
          <div
            class="absolute right-0 top-full mt-1.5 w-56 max-h-[min(360px,calc(100vh-140px))] overflow-y-auto bg-[#23232e] border border-indigo-500/40 rounded-xl shadow-2xl py-1.5 text-xs text-gray-200 z-50 animate-fadeIn"
            role="menu"
            tabindex="-1"
          >
            <!-- 1. Stitch Layer -->
            <button
              type="button"
              class="w-full px-3 py-1.5 flex items-center space-x-2.5 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer text-left"
              on:click={() => { showNewLayerMenu = false; addNewLayer(); }}
            >
              <LayersIcon size={14} class="text-indigo-400" />
              <div>
                <div class="font-medium">Stitch Layer</div>
                <div class="text-[10px] text-gray-400">Default grid for hand stitching</div>
              </div>
            </button>

            <!-- 2. Text Layer -->
            <button
              type="button"
              class="w-full px-3 py-1.5 flex items-center space-x-2.5 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer text-left"
              on:click={() => { showNewLayerMenu = false; openTextModal(); }}
            >
              <Type size={14} class="text-purple-400" />
              <div>
                <div class="font-medium">Text Layer...</div>
                <div class="text-[10px] text-gray-400">Google Fonts & Yarndings glyphs (T)</div>
              </div>
            </button>

            <div class="my-1 border-t border-gray-700/80"></div>

            <!-- 3. Reference Image: Upload -->
            <button
              type="button"
              class="w-full px-3 py-1.5 flex items-center space-x-2.5 hover:bg-cyan-600 hover:text-white transition-colors cursor-pointer text-left"
              on:click={() => { showNewLayerMenu = false; fileInputEl?.click(); }}
            >
              <Upload size={14} class="text-cyan-400" />
              <div>
                <div class="font-medium">Upload Image File...</div>
                <div class="text-[10px] text-gray-400">PNG, JPG, WebP, SVG</div>
              </div>
            </button>

            <!-- 4. Reference Image: From Web URL -->
            <button
              type="button"
              class="w-full px-3 py-1.5 flex items-center space-x-2.5 hover:bg-cyan-600 hover:text-white transition-colors cursor-pointer text-left"
              on:click={() => { showNewLayerMenu = false; isImageUrlModalOpen.set(true); }}
            >
              <Globe size={14} class="text-cyan-400" />
              <div>
                <div class="font-medium">From Image URL...</div>
                <div class="text-[10px] text-gray-400">Web image address or paste (Cmd+V)</div>
              </div>
            </button>

            <div class="px-3 pt-1.5 pb-0.5 text-[10px] uppercase font-bold text-gray-400">Sample Photos</div>
            {#each SAMPLE_IMAGES as sample}
              <button
                type="button"
                class="w-full px-3 py-1 flex items-center space-x-2 hover:bg-cyan-600 hover:text-white transition-colors cursor-pointer text-left"
                on:click={() => { showNewLayerMenu = false; handleLoadSample(sample.url, sample.title); }}
              >
                <span class="text-sm flex-shrink-0">
                  {sample.id.includes('cat') ? '🕶️' : '☕'}
                </span>
                <span class="truncate font-medium text-[11px]">{sample.title}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Opacity Control for Active Layer -->
  {#if $activeLayer}
    <div class="px-3 py-1.5 border-b border-[#2e2e38] bg-[#1a1a20] flex items-center justify-between text-xs flex-shrink-0">
      <span class="text-gray-400">Opacity:</span>
      <div class="flex items-center space-x-2">
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={$activeLayer.opacity}
          on:input={handleOpacityInput}
          class="w-24 accent-indigo-500 h-1 bg-gray-700 rounded-lg cursor-pointer"
        />
        <span class="font-mono text-gray-300 text-[11px] w-8 text-right">
          {Math.round($activeLayer.opacity * 100)}%
        </span>
      </div>
    </div>
  {/if}

  <!-- Layer List (Stacked from top to bottom) -->
  <div class="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
    {#each [...$layers].reverse() as layer, visualIndex (layer.id)}
      {@const actualIndex = $layers.length - 1 - visualIndex}
      {@const isTop = actualIndex === $layers.length - 1}
      {@const isBottom = actualIndex === 0}
      <div
        class="flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer group relative
        {$activeLayerId === layer.id
          ? (layer.type === 'image' ? 'bg-cyan-950/60 border-cyan-500/80 shadow-sm' : layer.type === 'text' ? 'bg-purple-950/60 border-purple-500/80 shadow-sm' : 'bg-indigo-950/60 border-indigo-500/80 shadow-sm')
          : 'bg-[#25252e] border-transparent hover:bg-[#2b2b36]'}
        {dragOverLayerId === layer.id ? 'ring-2 ring-indigo-400 bg-indigo-900/40' : ''}"
        on:click={() => activeLayerId.set(layer.id)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && activeLayerId.set(layer.id)}
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, layer.id)}
        on:dragover={(e) => handleDragOver(e, layer.id)}
        on:dragleave={() => handleDragLeave(layer.id)}
        on:drop={(e) => handleDrop(e, layer.id)}
        on:dragend={handleDragEnd}
      >
        <div class="flex items-center space-x-1.5 min-w-0 flex-1 mr-1">
          <!-- Drag Handle Grip -->
          <div class="text-gray-600 group-hover:text-gray-400 cursor-grab active:cursor-grabbing p-0.5">
            <GripVertical size={13} />
          </div>

          <!-- Visibility Eye -->
          <button
            class="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
            on:click|stopPropagation={() => toggleVisible(layer.id)}
            title={layer.visible ? 'Hide Layer' : 'Show Layer'}
          >
            {#if layer.visible}
              <Eye size={14} class={layer.type === 'image' ? 'text-cyan-400' : layer.type === 'text' ? 'text-purple-400' : 'text-indigo-400'} />
            {:else}
              <EyeOff size={14} class="text-gray-600" />
            {/if}
          </button>

          <!-- Lock toggle -->
          <button
            class="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
            on:click|stopPropagation={() => toggleLock(layer.id)}
            title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
          >
            {#if layer.locked}
              <Lock size={13} class="text-amber-500" />
            {:else}
              <Unlock size={13} class="text-gray-600 hover:text-gray-400" />
            {/if}
          </button>

          <!-- Layer Icon Indicator -->
          {#if layer.type === 'image'}
            <ImageIcon size={13} class="text-cyan-400 flex-shrink-0" />
          {:else if layer.type === 'text'}
            <Type size={13} class="text-purple-400 flex-shrink-0" />
          {/if}

          <!-- Layer Name & Inline Renaming -->
          {#if editingLayerId === layer.id}
            <!-- svelte-ignore a11y-autofocus -->
            <input
              type="text"
              autofocus
              bind:value={editingName}
              on:blur={commitRename}
              on:keydown={handleRenameKeydown}
              on:click|stopPropagation
              class="px-1.5 py-0.5 text-xs bg-[#14141c] border border-indigo-400 rounded text-white focus:outline-none w-28"
            />
          {:else}
            <span
              class="text-xs font-medium truncate flex-1 cursor-text {layer.visible ? (layer.type === 'image' ? 'text-cyan-200' : layer.type === 'text' ? 'text-purple-200' : 'text-gray-200') : 'text-gray-500'}"
              on:dblclick|stopPropagation={() => startRename(layer)}
              title="Double-click to rename"
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && startRename(layer)}
            >
              {layer.name}
            </span>
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white p-0.5 transition-opacity"
              on:click|stopPropagation={() => startRename(layer)}
              title="Rename Layer"
            >
              <Edit2 size={11} />
            </button>
          {/if}
        </div>

        <div class="flex items-center space-x-1 flex-shrink-0">
          <!-- Digitize button on Image Layers (compact icon) -->
          {#if layer.type === 'image'}
            <button
              type="button"
              class="p-1 rounded bg-cyan-900/60 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/30 transition-all cursor-pointer mr-0.5"
              on:click|stopPropagation={() => openDigitizerForLayer(layer.id)}
              title="Digitize image into DMC stitches"
            >
              <Sparkles size={11} />
            </button>
          {:else if layer.type === 'text'}
            <button
              type="button"
              class="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 transition-all cursor-pointer mr-0.5"
              on:click|stopPropagation={() => openTextModal(layer.id)}
              title="Edit text, font, size, or styling"
            >
              <Edit2 size={11} />
            </button>
            <button
              type="button"
              class="p-1 rounded bg-purple-900/60 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 transition-all cursor-pointer mr-0.5"
              on:click|stopPropagation={() => rasterizeTextLayerToStitches(layer.id)}
              title="Rasterize to Stitches - flatten to standard editable stitch layer (Photoshop style)"
            >
              <Sparkles size={11} />
            </button>
          {/if}

          <!-- Re-order buttons (Up/Down in visual list) -->
          <div class="flex flex-col space-y-0.5 mr-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              class="text-gray-400 hover:text-white disabled:opacity-20 p-0.5 rounded hover:bg-gray-700/50"
              on:click|stopPropagation={() => moveLayer(layer.id, 'up')}
              disabled={isTop}
              title="Move Layer Up"
            >
              <ArrowUp size={11} />
            </button>
            <button
              type="button"
              class="text-gray-400 hover:text-white disabled:opacity-20 p-0.5 rounded hover:bg-gray-700/50"
              on:click|stopPropagation={() => moveLayer(layer.id, 'down')}
              disabled={isBottom}
              title="Move Layer Down"
            >
              <ArrowDown size={11} />
            </button>
          </div>

          <!-- Stitch count, Image dimension, or Text dimension badge -->
          {#if layer.type === 'image'}
            <span class="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60" title="Image dimensions in grid cells">
              {Math.round(layer.image?.width || 0)}×{Math.round(layer.image?.height || 0)}
            </span>
          {:else if layer.type === 'text'}
            <span class="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/60" title="Text bounding box in grid cells">
              {Math.round(layer.textData?.width || layer.image?.width || 0)}×{Math.round(layer.textData?.height || layer.image?.height || 0)}
            </span>
          {:else}
            <span class="text-[10px] font-mono text-gray-400 bg-[#1a1a22] px-1.5 py-0.5 rounded border border-[#30303c]" title="Stitch count">
              {Object.keys(layer.stitches).length}
            </span>
          {/if}

          <!-- Delete layer (if more than 1) -->
          {#if $layers.length > 1}
            <button
              class="text-gray-500 hover:text-red-400 p-0.5 rounded transition-colors"
              on:click|stopPropagation={() => deleteLayer(layer.id)}
              title="Delete Layer"
            >
              <Trash2 size={13} />
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
