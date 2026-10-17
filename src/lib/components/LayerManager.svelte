<script lang="ts">
  import {
    layers,
    activeLayerId,
    activeLayer,
    duplicateLayer,
    moveLayer,
    mergeLayerDown,
    renameLayer,
    reorderLayers,
    flattenAllLayers
  } from '../stores/editorStore';
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
    FoldVertical
  } from 'lucide-svelte';

  // Inline Rename state
  let editingLayerId: string | null = null;
  let editingName = '';

  // Drag and Drop state
  let draggedLayerId: string | null = null;
  let dragOverLayerId: string | null = null;

  function addNewLayer() {
    const nextNum = $layers.length + 1;
    const newId = `layer-${Date.now()}`;
    layers.update(ls => [
      ...ls,
      {
        id: newId,
        name: `Layer ${nextNum}`,
        visible: true,
        locked: false,
        opacity: 1.0,
        stitches: {}
      }
    ]);
    activeLayerId.set(newId);
  }

  function toggleVisible(id: string) {
    layers.update(ls => ls.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }

  function toggleLock(id: string) {
    layers.update(ls => ls.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  }

  function deleteLayer(id: string) {
    if ($layers.length <= 1) return; // Keep at least one layer
    layers.update(ls => ls.filter(l => l.id !== id));
    if ($activeLayerId === id) {
      activeLayerId.set($layers[0].id);
    }
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

      <div class="w-px h-3.5 bg-gray-700 mx-0.5"></div>

      <button
        type="button"
        class="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded flex items-center space-x-1 font-medium transition-colors shadow-sm"
        on:click={addNewLayer}
        title="Create New Stitch Layer"
      >
        <Plus size={13} />
        <span>New</span>
      </button>
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
          ? 'bg-indigo-950/60 border-indigo-500/80 shadow-sm'
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
              <Eye size={14} class="text-indigo-400" />
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
              class="text-xs font-medium truncate flex-1 cursor-text {layer.visible ? 'text-gray-200' : 'text-gray-500'}"
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

          <!-- Stitch count badge -->
          <span class="text-[10px] font-mono text-gray-400 bg-[#1a1a22] px-1.5 py-0.5 rounded border border-[#30303c]">
            {Object.keys(layer.stitches).length}
          </span>

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
