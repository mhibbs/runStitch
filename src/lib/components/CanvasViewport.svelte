<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    grid,
    layers,
    palette,
    viewport,
    viewMode,
    showGrid,
    hoverCoord,
    activeTool,
    selectedColorId,
    activeColor,
    beginStroke,
    commitStroke,
    setStitchAt,
    eraseStitchAt,
    floodFill,
    pickColorAt,
    patternBounds,
    setFabricCount,
    zoomToFitTrigger,
    selection,
    floatingSelection,
    selectionBounds,
    setSelection,
    clearSelection,
    copySelection,
    cutSelection,
    commitFloatingSelection,
    cancelFloatingSelection,
    shapeFillMode,
    activeStamp,
    applyStampAt,
    cancelActiveStamp,
    fabricColor,
    setFabricColor,
    FABRIC_COLOR_PRESETS,
    measurementUnit,
    formatDimensions
  } from '../stores/editorStore';
  import { renderBackground, renderStitches, renderOverlay } from '../engine/renderer';
  import {
    getLineCells,
    getRectangleCells,
    getEllipseCells,
    constrainCoordinates,
    type Point
  } from '../engine/geometry';
  import {
    Maximize,
    ChevronUp,
    Check,
    Eye,
    Grid,
    ZoomIn,
    ZoomOut
  } from 'lucide-svelte';

  let containerEl: HTMLDivElement;
  let bgCanvas: HTMLCanvasElement;
  let stitchCanvas: HTMLCanvasElement;
  let overlayCanvas: HTMLCanvasElement;

  let bgCtx: CanvasRenderingContext2D | null = null;
  let stitchCtx: CanvasRenderingContext2D | null = null;
  let overlayCtx: CanvasRenderingContext2D | null = null;

  let width = 800;
  let height = 600;

  // Interaction tracking
  let isPointerDown = false;
  let isPanning = false;
  let lastPointerPos = { x: 0, y: 0 };
  let activePointers = new Map<number, { x: number; y: number }>();
  let initialPinchDistance = 0;
  let initialPinchZoom = 24;

  // Marquee Selection and Floating Selection drag tracking
  let isSelecting = false;
  let selectionStart = { x: 0, y: 0 };
  let clearedSelectionOnClick = false;
  let didDragSelection = false;
  let isDraggingFloating = false;
  let dragFloatingOffset = { dx: 0, dy: 0 };

  // In-progress Shape drawing state
  let isDrawingShape = false;
  let shapeOrigin = { x: 0, y: 0 };
  let shapeCurrent = { x: 0, y: 0 };
  let shapePreviewCells: Point[] | null = null;

  // Marching ants animation loop
  let dashOffset = 0;
  let animFrameId: number | null = null;

  function startMarchingAnts() {
    if (animFrameId !== null) return;
    function loop() {
      if ($selection || $floatingSelection || ($activeTool === 'stamp' && $activeStamp)) {
        dashOffset = (dashOffset + 0.35) % 10;
        redrawOverlay();
        animFrameId = requestAnimationFrame(loop);
      } else {
        animFrameId = null;
        redrawOverlay();
      }
    }
    animFrameId = requestAnimationFrame(loop);
  }

  $: if ($selection || $floatingSelection || ($activeTool === 'stamp' && $activeStamp)) {
    startMarchingAnts();
  }

  // Spacebar panning state
  let isSpacePressed = false;

  function updateDimensions() {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);

    const dpr = window.devicePixelRatio || 1;

    [bgCanvas, stitchCanvas, overlayCanvas].forEach(canvas => {
      if (!canvas) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });

    [bgCtx, stitchCtx, overlayCtx].forEach(ctx => {
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    });

    redrawAll();
  }

  function redrawAll() {
    if (!bgCtx || !stitchCtx || !overlayCtx) return;
    renderBackground(bgCtx, width, height, $viewport, $grid, $viewMode, $fabricColor);
    renderStitches(stitchCtx, width, height, $viewport, $grid, $layers, $palette, $viewMode, $showGrid);
    redrawOverlay();
  }

  function redrawStitches() {
    if (!stitchCtx) return;
    renderStitches(stitchCtx, width, height, $viewport, $grid, $layers, $palette, $viewMode, $showGrid);
  }

  function redrawOverlay() {
    if (!overlayCtx) return;
    renderOverlay(
      overlayCtx,
      width,
      height,
      $viewport,
      $grid,
      $hoverCoord,
      $activeColor.hex,
      $selection,
      $floatingSelection,
      $palette,
      $activeTool,
      dashOffset,
      shapePreviewCells,
      $activeStamp
    );
  }

  function updateShapePreview(isShift: boolean) {
    if (!$activeTool) return;
    const tool = $activeTool;
    if (tool !== 'line' && tool !== 'rectangle' && tool !== 'ellipse') return;

    const constrained = constrainCoordinates(tool, shapeOrigin.x, shapeOrigin.y, shapeCurrent.x, shapeCurrent.y, isShift);

    if (tool === 'line') {
      shapePreviewCells = getLineCells(shapeOrigin.x, shapeOrigin.y, constrained.x, constrained.y);
    } else if (tool === 'rectangle') {
      shapePreviewCells = getRectangleCells(shapeOrigin.x, shapeOrigin.y, constrained.x, constrained.y, $shapeFillMode);
    } else if (tool === 'ellipse') {
      shapePreviewCells = getEllipseCells(shapeOrigin.x, shapeOrigin.y, constrained.x, constrained.y, $shapeFillMode);
    }
    redrawOverlay();
  }

  // Reactive redraw triggers
  $: if (bgCtx && ($viewport || $grid || $viewMode || $fabricColor)) {
    renderBackground(bgCtx, width, height, $viewport, $grid, $viewMode, $fabricColor);
  }

  $: if (stitchCtx && ($viewport || $grid || $layers || $palette || $viewMode || $showGrid)) {
    redrawStitches();
  }

  $: if (overlayCtx && ($viewport || $grid || $hoverCoord || $activeColor || $selection || $floatingSelection || $activeTool || $activeStamp || $shapeFillMode)) {
    redrawOverlay();
  }

  function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const rect = containerEl.getBoundingClientRect();
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;

    const gridX = Math.floor((clientX - $viewport.panX) / $viewport.zoom);
    const gridY = Math.floor((clientY - $viewport.panY) / $viewport.zoom);
    return { x: gridX, y: gridY };
  }

  function handlePointerDown(e: PointerEvent) {
    containerEl.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch start
    if (activePointers.size === 2) {
      isPanning = true;
      const pts = Array.from(activePointers.values());
      initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchZoom = $viewport.zoom;
      return;
    }

    // Middle-click or spacebar or Pan tool triggers panning
    if (e.button === 1 || isSpacePressed || $activeTool === 'pan') {
      isPanning = true;
      lastPointerPos = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    isPointerDown = true;
    lastPointerPos = { x: e.clientX, y: e.clientY };

    const { x, y } = screenToGrid(e.clientX, e.clientY);

    // Floating Selection Drag & Commit logic
    if ($floatingSelection) {
      const f = $floatingSelection;
      const isInside = x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height;
      if (isInside) {
        isDraggingFloating = true;
        dragFloatingOffset = { dx: x - f.x, dy: y - f.y };
        return;
      } else {
        // Clicking outside commits the floating selection
        commitFloatingSelection();
      }
    }

    // Active Stamp Placement logic
    if ($activeTool === 'stamp' && $activeStamp) {
      const originX = x - Math.floor($activeStamp.width / 2);
      const originY = y - Math.floor($activeStamp.height / 2);
      applyStampAt(originX, originY, $activeStamp, false);
      redrawStitches();
      return;
    }

    // Shape Tool Start logic
    if ($activeTool === 'line' || $activeTool === 'rectangle' || $activeTool === 'ellipse') {
      isDrawingShape = true;
      shapeOrigin = { x, y };
      shapeCurrent = { x, y };
      updateShapePreview(e.shiftKey);
      return;
    }

    // Marquee Selection Tool logic (requires dragging to form a selection; single click clears)
    if ($activeTool === 'select') {
      const prior = $selection;
      if (prior) {
        clearSelection();
      }

      isSelecting = true;
      selectionStart = { x, y };
      didDragSelection = false;
      return;
    }

    if (x >= 0 && x < $grid.width && y >= 0 && y < $grid.height) {
      if ($activeTool === 'pencil') {
        beginStroke('Pencil Stitch');
        setStitchAt(x, y, $selectedColorId);
      } else if ($activeTool === 'eraser') {
        beginStroke('Erase Stitch');
        eraseStitchAt(x, y);
      } else if ($activeTool === 'bucket') {
        floodFill(x, y, $selectedColorId);
      } else if ($activeTool === 'picker') {
        pickColorAt(x, y);
      }
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (activePointers.has(e.pointerId)) {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 2-finger pinch & pan
    if (activePointers.size === 2 && isPanning) {
      const pts = Array.from(activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (initialPinchDistance > 0) {
        const factor = dist / initialPinchDistance;
        const newZoom = Math.min(64, Math.max(4, Math.round(initialPinchZoom * factor)));
        viewport.update(v => ({ ...v, zoom: newZoom }));
      }
      return;
    }

    // Pan movement
    if (isPanning) {
      const dx = e.clientX - lastPointerPos.x;
      const dy = e.clientY - lastPointerPos.y;
      lastPointerPos = { x: e.clientX, y: e.clientY };
      viewport.update(v => ({
        ...v,
        panX: v.panX + dx,
        panY: v.panY + dy
      }));
      return;
    }

    // Update hover coordinates
    const { x, y } = screenToGrid(e.clientX, e.clientY);
    if (x >= 0 && x < $grid.width && y >= 0 && y < $grid.height) {
      hoverCoord.set({ x, y });
    } else {
      hoverCoord.set(null);
    }

    // Moving floating selection
    if (isDraggingFloating && $floatingSelection) {
      const newX = x - dragFloatingOffset.dx;
      const newY = y - dragFloatingOffset.dy;
      floatingSelection.update(f => f ? ({ ...f, x: newX, y: newY }) : null);
      return;
    }

    // Dragging marquee selection box
    if (isSelecting) {
      const clampedX = Math.max(0, Math.min($grid.width - 1, x));
      const clampedY = Math.max(0, Math.min($grid.height - 1, y));
      if (clampedX !== selectionStart.x || clampedY !== selectionStart.y) {
        didDragSelection = true;
        const minX = Math.min(selectionStart.x, clampedX);
        const maxX = Math.max(selectionStart.x, clampedX);
        const minY = Math.min(selectionStart.y, clampedY);
        const maxY = Math.max(selectionStart.y, clampedY);
        setSelection({
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1
        });
      }
      return;
    }

    // In-progress shape drawing
    if (isDrawingShape) {
      shapeCurrent = { x, y };
      updateShapePreview(e.shiftKey);
      return;
    }

    // Drag drawing
    if (isPointerDown) {
      if ($activeTool === 'pencil') {
        setStitchAt(x, y, $selectedColorId);
      } else if ($activeTool === 'eraser') {
        eraseStitchAt(x, y);
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);

    if (activePointers.size === 0) {
      if (isDrawingShape && shapePreviewCells && shapePreviewCells.length > 0) {
        const toolLabel = $activeTool === 'line' ? 'Draw Line' : ($activeTool === 'rectangle' ? 'Draw Rectangle' : 'Draw Ellipse');
        beginStroke(toolLabel);
        for (const cell of shapePreviewCells) {
          if (cell.x >= 0 && cell.x < $grid.width && cell.y >= 0 && cell.y < $grid.height) {
            setStitchAt(cell.x, cell.y, $selectedColorId);
          }
        }
        commitStroke(toolLabel);
        redrawStitches();
      }
      isDrawingShape = false;
      shapePreviewCells = null;

      if (isPointerDown) {
        commitStroke();
      }
      isPointerDown = false;
      isPanning = false;
      if (isSelecting) {
        if (clearedSelectionOnClick && !didDragSelection) {
          clearSelection();
        }
        isSelecting = false;
        clearedSelectionOnClick = false;
        didDragSelection = false;
      }
      isDraggingFloating = false;
      redrawOverlay();
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = containerEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Trackpad pinch gesture (macOS sends wheel with ctrlKey=true) or Ctrl/Cmd + wheel
    if (e.ctrlKey || e.metaKey) {
      // Damped smooth zoom factor (avoids massive jumps from high-frequency wheel events)
      const zoomDelta = -e.deltaY * 0.006;
      const factor = Math.exp(zoomDelta);
      const currentZoom = $viewport.zoom;
      let targetZoom = Math.round(currentZoom * factor);
      if (targetZoom === currentZoom && Math.abs(e.deltaY) > 4) {
        targetZoom = currentZoom + (e.deltaY < 0 ? 1 : -1);
      }
      targetZoom = Math.min(80, Math.max(4, targetZoom));

      if (targetZoom !== currentZoom) {
        const panX = mouseX - (mouseX - $viewport.panX) * (targetZoom / currentZoom);
        const panY = mouseY - (mouseY - $viewport.panY) * (targetZoom / currentZoom);
        viewport.set({
          zoom: targetZoom,
          panX: Math.round(panX),
          panY: Math.round(panY)
        });
      }
      return;
    }

    // Alt + wheel: discrete step zoom
    if (e.altKey) {
      const step = e.deltaY < 0 ? 2 : -2;
      const currentZoom = $viewport.zoom;
      const targetZoom = Math.min(80, Math.max(4, currentZoom + step));
      if (targetZoom !== currentZoom) {
        const panX = mouseX - (mouseX - $viewport.panX) * (targetZoom / currentZoom);
        const panY = mouseY - (mouseY - $viewport.panY) * (targetZoom / currentZoom);
        viewport.set({
          zoom: targetZoom,
          panX: Math.round(panX),
          panY: Math.round(panY)
        });
      }
      return;
    }

    // Default two-finger trackpad drag or scroll wheel: Smooth Canvas Panning
    viewport.update(v => ({
      ...v,
      panX: Math.round(v.panX - e.deltaX),
      panY: Math.round(v.panY - e.deltaY)
    }));
  }

  let showZoomMenu = false;
  let showFabricMenu = false;
  let showFabricColorMenu = false;
  let showViewModeMenu = false;

  function zoomIn() {
    const currentZoom = $viewport.zoom;
    const targetZoom = Math.min(80, currentZoom + (currentZoom < 16 ? 2 : currentZoom < 32 ? 4 : 8));
    setPresetZoom(targetZoom);
  }

  function zoomOut() {
    const currentZoom = $viewport.zoom;
    const targetZoom = Math.max(4, currentZoom - (currentZoom <= 16 ? 2 : currentZoom <= 32 ? 4 : 8));
    setPresetZoom(targetZoom);
  }

  export function zoomToFit() {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
    }
    if (width <= 0 || height <= 0) return;

    const gridW = Number($grid.width) || 60;
    const gridH = Number($grid.height) || 40;
    const padding = 60;
    const availW = Math.max(100, width - padding);
    const availH = Math.max(100, height - padding);
    const fitZoomW = availW / gridW;
    const fitZoomH = availH / gridH;
    const optimalZoom = Math.min(80, Math.max(4, Math.floor(Math.min(fitZoomW, fitZoomH))));

    const gridPixelW = gridW * optimalZoom;
    const gridPixelH = gridH * optimalZoom;

    viewport.set({
      zoom: optimalZoom,
      panX: Math.round((width - gridPixelW) / 2),
      panY: Math.round((height - gridPixelH) / 2)
    });
  }

  function setPresetZoom(targetZoom: number) {
    const currentZoom = $viewport.zoom;
    const panX = (width / 2) - ((width / 2) - $viewport.panX) * (targetZoom / currentZoom);
    const panY = (height / 2) - ((height / 2) - $viewport.panY) * (targetZoom / currentZoom);
    viewport.set({
      zoom: targetZoom,
      panX: Math.round(panX),
      panY: Math.round(panY)
    });
    showZoomMenu = false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !isSpacePressed) {
      isSpacePressed = true;
    }
    if (e.key === 'Shift' && isDrawingShape) {
      updateShapePreview(true);
    }


    // Cmd+0 or Ctrl+0: Zoom to fit
    if ((e.metaKey || e.ctrlKey) && e.key === '0') {
      e.preventDefault();
      zoomToFit();
      return;
    }

    // Enter commits floating selection
    if (e.key === 'Enter' && $floatingSelection) {
      e.preventDefault();
      commitFloatingSelection();
      return;
    }

    // Escape cancels floating selection, shape drawing, stamp mode, or clears selection
    if (e.key === 'Escape') {
      if (isDrawingShape) {
        isDrawingShape = false;
        shapePreviewCells = null;
        redrawOverlay();
        return;
      }
      if ($activeTool === 'stamp' && $activeStamp) {
        cancelActiveStamp();
        return;
      }
      if ($floatingSelection) {
        cancelFloatingSelection();
        return;
      }
      if ($selection) {
        clearSelection();
        return;
      }
    }

    // Arrow keys nudge floating selection by 1 stitch
    if ($floatingSelection) {
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -1;
      else if (e.key === 'ArrowRight') dx = 1;
      else if (e.key === 'ArrowUp') dy = -1;
      else if (e.key === 'ArrowDown') dy = 1;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        floatingSelection.update(f => f ? ({ ...f, x: f.x + dx, y: f.y + dy }) : null);
        return;
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      isSpacePressed = false;
    }
    if (e.key === 'Shift' && isDrawingShape) {
      updateShapePreview(false);
    }
  }

  export function centerGrid() {
    const gridPixelW = $grid.width * $viewport.zoom;
    const gridPixelH = $grid.height * $viewport.zoom;
    viewport.update(v => ({
      ...v,
      panX: Math.round((width - gridPixelW) / 2),
      panY: Math.round((height - gridPixelH) / 2)
    }));
  }

  $: if ($zoomToFitTrigger > 0) {
    requestAnimationFrame(() => {
      zoomToFit();
    });
  }

  function handleWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.hud-container')) {
      showFabricMenu = false;
      showFabricColorMenu = false;
      showZoomMenu = false;
      showViewModeMenu = false;
    }
  }

  onMount(() => {
    bgCtx = bgCanvas.getContext('2d');
    stitchCtx = stitchCanvas.getContext('2d');
    overlayCtx = overlayCanvas.getContext('2d');

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('click', handleWindowClick);

    updateDimensions();
    zoomToFit();
  });

  onDestroy(() => {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
    }
    window.removeEventListener('resize', updateDimensions);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('click', handleWindowClick);
  });
</script>

<div
  bind:this={containerEl}
  class="relative w-full h-full overflow-hidden bg-[#121216] cursor-crosshair touch-none select-none"
  class:cursor-grab={isSpacePressed || $activeTool === 'pan'}
  class:cursor-grabbing={isPanning}
  on:pointerdown={handlePointerDown}
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={handlePointerUp}
  on:pointerleave={() => hoverCoord.set(null)}
  on:wheel={handleWheel}
>
  <!-- Background Fabric Canvas -->
  <canvas bind:this={bgCanvas} class="absolute inset-0 pointer-events-none"></canvas>

  <!-- Stitches & Grid Canvas -->
  <canvas bind:this={stitchCanvas} class="absolute inset-0 pointer-events-none"></canvas>

  <!-- Interactive Overlays & Hover Highlight -->
  <canvas bind:this={overlayCanvas} class="absolute inset-0 pointer-events-none"></canvas>

  <!-- HUD Coordinate & Live Details Bar (Bottom Left) -->
  <div
    class="hud-container absolute bottom-3 left-3 bg-[#1e1e24]/95 backdrop-blur-md border border-[#3a3a4a] px-3.5 py-2 rounded-xl text-xs text-gray-300 flex flex-col space-y-1.5 shadow-2xl z-20 pointer-events-auto select-none"
    role="toolbar"
    aria-label="Canvas HUD and Controls"
    tabindex="-1"
    on:pointerdown|stopPropagation
    on:pointerup|stopPropagation
    on:pointermove|stopPropagation
    on:click|stopPropagation
    on:keydown|stopPropagation
  >
    <!-- Line 1: Interactive Controls (Standard Desktop Order) -->
    <div class="flex items-center space-x-2.5">
      <!-- Cloth Color Swatch Button & Popover -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center space-x-1 p-1 rounded hover:bg-[#2b2b36] transition-colors cursor-pointer group"
          on:click={() => { showFabricColorMenu = !showFabricColorMenu; showFabricMenu = false; showZoomMenu = false; showViewModeMenu = false; }}
          title="Fabric Color ({$fabricColor})"
        >
          <span
            class="w-3.5 h-3.5 rounded-full border border-gray-400 group-hover:border-white shadow-sm transition-colors flex-shrink-0"
            style="background-color: {$fabricColor};"
          ></span>
          <ChevronUp size={11} class="text-gray-400" />
        </button>

        {#if showFabricColorMenu}
          <div class="absolute bottom-full mb-2 left-0 w-44 bg-[#23232e] border border-gray-700 rounded-lg shadow-2xl py-1 text-xs text-gray-200 z-50">
            <div class="px-2.5 py-1 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-700">Fabric Color</div>
            {#each FABRIC_COLOR_PRESETS as preset}
              <button
                type="button"
                class="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
                on:click={() => { setFabricColor(preset.hex); showFabricColorMenu = false; }}
              >
                <div class="flex items-center space-x-2">
                  <span
                    class="w-3.5 h-3.5 rounded-full border border-gray-500 shadow-sm flex-shrink-0"
                    style="background-color: {preset.hex};"
                  ></span>
                  <span class="truncate">{preset.name}</span>
                </div>
                {#if $fabricColor.toUpperCase() === preset.hex.toUpperCase()}<Check size={12} class="text-indigo-400" />{/if}
              </button>
            {/each}
            <div class="my-1 border-t border-gray-700"></div>
            <!-- Custom Fabric Color Input -->
            <div class="px-2.5 py-1.5 flex items-center justify-between hover:bg-indigo-600/30 transition-colors">
              <label for="hud-custom-fabric-color" class="flex items-center space-x-2 cursor-pointer w-full justify-between">
                <span class="text-[11px] text-gray-300">Custom Color...</span>
                <input
                  id="hud-custom-fabric-color"
                  type="color"
                  bind:value={$fabricColor}
                  class="w-5 h-5 rounded cursor-pointer border border-gray-600 bg-transparent p-0"
                  title="Pick Custom Fabric Color"
                />
              </label>
            </div>
          </div>
        {/if}
      </div>

      <!-- Fabric Count Picker Pill (No "Aida") -->
      <div class="relative">
        <button
          type="button"
          class="font-mono text-gray-300 hover:text-white flex items-center space-x-1 transition-colors hover:bg-[#2b2b36] px-1.5 py-0.5 rounded cursor-pointer"
          on:click={() => { showFabricMenu = !showFabricMenu; showFabricColorMenu = false; showZoomMenu = false; showViewModeMenu = false; }}
          title="Change Fabric Count"
        >
          <span>{$grid.fabricCount}-ct</span>
          <ChevronUp size={11} class="text-gray-400" />
        </button>

        {#if showFabricMenu}
          <div class="absolute bottom-full mb-2 left-0 w-36 bg-[#23232e] border border-gray-700 rounded-lg shadow-2xl py-1 text-xs text-gray-200 z-50">
            <div class="px-2.5 py-1 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-700">Fabric Count</div>
            {#each [11, 14, 16, 18, 22, 28] as ct}
              <button
                type="button"
                class="w-full px-2.5 py-1 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
                on:click={() => { setFabricCount(ct); showFabricMenu = false; }}
              >
                <span>{ct}-count {ct === 14 ? '(Standard)' : ''}</span>
                {#if $grid.fabricCount === ct}<Check size={12} class="text-indigo-400" />{/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="w-px h-3.5 bg-gray-700"></div>

      <!-- Hover Coordinate -->
      <div class="font-mono flex items-center space-x-1 min-w-[80px]">
        {#if $hoverCoord}
          <span class="text-indigo-400 font-semibold">X: {$hoverCoord.x + 1}</span>
          <span class="text-gray-500">,</span>
          <span class="text-indigo-400 font-semibold">Y: {$hoverCoord.y + 1}</span>
        {:else}
          <span class="text-gray-500">X: --, Y: --</span>
        {/if}
      </div>

      <div class="w-px h-3.5 bg-gray-700"></div>

      <!-- Zoom Controls: Zoom Out, Zoom %, Zoom In, Fit to Window -->
      <div class="relative flex items-center space-x-0.5">
        <button
          type="button"
          class="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2b2b36] transition-colors cursor-pointer"
          on:click={zoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>

        <!-- Zoom Presets Dropdown -->
        <div class="relative">
          <button
            type="button"
            class="font-mono text-gray-300 hover:text-white flex items-center space-x-0.5 transition-colors hover:bg-[#2b2b36] px-1 py-0.5 rounded cursor-pointer"
            on:click={() => { showZoomMenu = !showZoomMenu; showFabricColorMenu = false; showFabricMenu = false; showViewModeMenu = false; }}
            title="Zoom Options (Click for presets)"
          >
            <span>{Math.round(($viewport.zoom / 24) * 100)}%</span>
            <ChevronUp size={11} class="text-gray-400" />
          </button>

          {#if showZoomMenu}
            <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-[#23232e] border border-gray-700 rounded-lg shadow-2xl py-1 text-xs text-gray-200 z-50">
              <button
                type="button"
                class="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white font-medium transition-colors"
                on:click={() => { zoomToFit(); showZoomMenu = false; }}
              >
                <span>Fit to Window</span>
                <span class="text-[10px] text-gray-400">Cmd+0</span>
              </button>
              <div class="my-1 border-t border-gray-700"></div>
              {#each [
                { label: '25%', zoom: 6 },
                { label: '50%', zoom: 12 },
                { label: '100% (Actual)', zoom: 24 },
                { label: '200%', zoom: 48 },
                { label: '300%', zoom: 72 }
              ] as opt}
                <button
                  type="button"
                  class="w-full px-3 py-1 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
                  on:click={() => setPresetZoom(opt.zoom)}
                >
                  <span>{opt.label}</span>
                  {#if $viewport.zoom === opt.zoom}<Check size={12} class="text-indigo-400" />{/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <button
          type="button"
          class="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2b2b36] transition-colors cursor-pointer"
          on:click={zoomIn}
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>

        <button
          type="button"
          class="p-1 rounded text-gray-400 hover:text-indigo-400 hover:bg-[#2b2b36] transition-colors cursor-pointer"
          on:click={zoomToFit}
          title="Fit Canvas to Window (Cmd+0)"
        >
          <Maximize size={13} />
        </button>
      </div>

      <div class="w-px h-3.5 bg-gray-700"></div>

      <!-- Grid Toggle Button -->
      <button
        type="button"
        class="p-1 rounded transition-colors cursor-pointer {$showGrid ? 'text-indigo-400 bg-indigo-900/40 hover:bg-indigo-900/60' : 'text-gray-400 hover:text-white hover:bg-[#2b2b36]'}"
        on:click={() => showGrid.update(v => !v)}
        title="Toggle Grid Overlay (G)"
        aria-label="Toggle Grid"
      >
        <Grid size={13} />
      </button>

      <div class="w-px h-3.5 bg-gray-700"></div>

      <!-- View Mode Button & Popover -->
      <div class="relative">
        <button
          type="button"
          class="text-gray-300 hover:text-white flex items-center space-x-1 transition-colors hover:bg-[#2b2b36] px-1.5 py-0.5 rounded cursor-pointer"
          on:click={() => { showViewModeMenu = !showViewModeMenu; showFabricColorMenu = false; showFabricMenu = false; showZoomMenu = false; }}
          title="View Mode"
        >
          <Eye size={12} class="text-indigo-400" />
          <span class="capitalize text-[11px]">
            {$viewMode === 'chart' ? 'Chart' : ($viewMode === 'mockup' ? 'Mockup' : 'Symbols')}
          </span>
          <ChevronUp size={11} class="text-gray-400" />
        </button>

        {#if showViewModeMenu}
          <div class="absolute bottom-full mb-2 right-0 w-48 bg-[#23232e] border border-gray-700 rounded-lg shadow-2xl py-1 text-xs text-gray-200 z-50">
            <div class="px-2.5 py-1 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-700">
              View Mode
            </div>
            <button
              type="button"
              class="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
              on:click={() => { viewMode.set('chart'); showViewModeMenu = false; }}
            >
              <span>Chart (Color & Symbol)</span>
              {#if $viewMode === 'chart'}<Check size={12} class="text-indigo-400" />{/if}
            </button>
            <button
              type="button"
              class="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
              on:click={() => { viewMode.set('symbols_only'); showViewModeMenu = false; }}
            >
              <span>Symbols Only (B&W)</span>
              {#if $viewMode === 'symbols_only'}<Check size={12} class="text-indigo-400" />{/if}
            </button>
            <button
              type="button"
              class="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-indigo-600 hover:text-white transition-colors"
              on:click={() => { viewMode.set('mockup'); showViewModeMenu = false; }}
            >
              <span>Mockup (Realistic Thread)</span>
              {#if $viewMode === 'mockup'}<Check size={12} class="text-indigo-400" />{/if}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Line 2: Pattern / Selection Status Bar -->
    <div class="pt-1.5 border-t border-[#2e2e3a] font-mono text-[11px] text-gray-400 flex items-center justify-between">
      {#if $activeTool === 'stamp' && $activeStamp}
        <div class="flex items-center space-x-2 text-emerald-300">
          <span>Motif Stamp: <strong class="text-white">{$activeStamp.name}</strong> ({$activeStamp.width}×{$activeStamp.height} st) &bull; Click to place &bull; Press <strong class="text-white">R</strong> to rotate, <strong class="text-white">H/V</strong> to flip</span>
          <button
            type="button"
            class="text-[10px] bg-[#2a2a36] hover:bg-[#323242] text-gray-300 px-2 py-0.5 rounded font-sans font-medium transition-colors cursor-pointer"
            on:click={cancelActiveStamp}
          >
            Cancel (Esc)
          </button>
        </div>
      {:else if $floatingSelection}
        <div class="flex items-center space-x-2 text-indigo-300">
          <span>Floating Selection: <strong class="text-white">{$floatingSelection.width}×{$floatingSelection.height} st</strong> &bull; Click or Enter to Commit &bull; Press <strong class="text-white">R</strong> to rotate, <strong class="text-white">H/V</strong> to flip</span>
          <button
            type="button"
            class="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded font-sans font-medium transition-colors shadow-sm cursor-pointer"
            on:click={commitFloatingSelection}
          >
            Commit
          </button>
          <button
            type="button"
            class="text-[10px] bg-[#2a2a36] hover:bg-[#323242] text-gray-300 px-2 py-0.5 rounded font-sans font-medium transition-colors cursor-pointer"
            on:click={cancelFloatingSelection}
          >
            Cancel (Esc)
          </button>
        </div>
      {:else if $selectionBounds}
        <div class="flex items-center space-x-2">
          <span>
            Selection: <strong class="text-indigo-300 font-medium">{$selectionBounds.width}×{$selectionBounds.height} st</strong>
            <span class="text-gray-500">({formatDimensions($selectionBounds.width, $selectionBounds.height, $grid.fabricCount, $measurementUnit)})</span>
            &bull; <strong class="text-indigo-200 font-medium">{$selectionBounds.stitchCount} st</strong>
          </span>
          <div class="flex items-center space-x-1 pl-2">
            <button
              type="button"
              class="text-[10px] bg-[#2a2a36] hover:bg-indigo-600 hover:text-white text-gray-300 px-1.5 py-0.5 rounded font-sans transition-colors cursor-pointer"
              on:click={copySelection}
              title="Copy (Cmd+C)"
            >
              Copy
            </button>
            <button
              type="button"
              class="text-[10px] bg-[#2a2a36] hover:bg-indigo-600 hover:text-white text-gray-300 px-1.5 py-0.5 rounded font-sans transition-colors cursor-pointer"
              on:click={cutSelection}
              title="Cut (Cmd+X)"
            >
              Cut
            </button>
            <button
              type="button"
              class="text-[10px] bg-[#2a2a36] hover:bg-red-900/60 hover:text-red-300 text-gray-400 px-1.5 py-0.5 rounded font-sans transition-colors cursor-pointer"
              on:click={clearSelection}
              title="Deselect (Esc)"
            >
              Deselect
            </button>
          </div>
        </div>
      {:else if $patternBounds && $patternBounds.totalStitches > 0}
        <span>Pattern is <strong class="text-indigo-300 font-medium">{$patternBounds.totalStitches} st</strong> in <strong class="text-indigo-200 font-medium">{$patternBounds.width}×{$patternBounds.height} st</strong> area <span class="text-gray-500">({formatDimensions($patternBounds.width, $patternBounds.height, $grid.fabricCount, $measurementUnit)})</span></span>
      {:else}
        <span class="text-gray-500 italic">Pattern is empty (0 stitches)</span>
      {/if}
    </div>
  </div>
</div>

