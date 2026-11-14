<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import type { Stitch } from '../types';
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
    deleteSelection,
    liftSelection,
    offsetLayerStitches,
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
    formatDimensions,
    activeLayer,
    activeLayerId,
    updateImageLayer,
    rotateImageLayer,
    fitImageLayerToCanvas,
    openDigitizerForLayer,
    setLayerOpacity,
    toggleLayerVisibility,
    hideNonStitchLayers,
    updateTextLayer,
    openTextModal,
    quickDigitizeTextLayer,
    commitLayerStitchesMove,
    cloneLayers,
    undoStack,
    redoStack,
    wandTolerance,
    wandContiguous,
    lassoFilterMode,
    selectionCombineMode,
    activeStitchType,
    brushSize,
    eraserSize,
    shapeSize,
    cancelStroke,
    undo,
    redo,
    pencilOnlyMode,
    hasDetectedPencil
  } from '../stores/editorStore';
  import {
    renderBackground,
    renderStitches,
    renderOverlay,
    getImageHandleAt,
    getCachedImageElement,
    type ImageHandleType
  } from '../engine/renderer';
  import {
    getLineCells,
    getRectangleCells,
    getEllipseCells,
    expandCellsBySize,
    constrainCoordinates,
    getLassoCells,
    floodSelectStitches,
    floodSelectImage,
    unionSelection,
    subtractSelection,
    createSelectionFromCells,
    isCellSelected,
    type Point
  } from '../engine/geometry';
  import {
    Maximize,
    ChevronUp,
    Check,
    Eye,
    EyeOff,
    Grid,
    ZoomIn,
    ZoomOut,
    Sparkles,
    RotateCw,
    Pipette
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
  let hasMeasuredDimensions = false;
  let resizeObserver: ResizeObserver | null = null;

  // Interaction tracking
  let isPointerDown = false;
  let isPanning = false;
  let lastPointerPos = { x: 0, y: 0 };
  let activePointers = new Map<number, { x: number; y: number }>();
  let initialPinchDistance = 0;
  let initialPinchZoom = 24;
  let pinchStartMid = { x: 0, y: 0 };
  let pinchStartPan = { panX: 0, panY: 0 };

  // Multi-touch gesture disambiguation (2-finger tap undo, 3-finger tap redo, pinch rollback)
  let touchGestureStartTime = 0;
  let touchGestureMaxPointers = 0;
  let touchGestureMaxMove = 0;
  let touchStartPositions = new Map<number, { x: number; y: number }>();

  // Long-press touch eyedropper state
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressOrigin: { screenX: number; screenY: number; gridX: number; gridY: number } | null = null;
  let pickedColorToast: { hex: string; dmc: string; name: string } | null = null;
  let pickedToastTimer: ReturnType<typeof setTimeout> | null = null;

  // Continuous stroke cell tracking (Bresenham interpolation between move events)
  let lastStrokeCell: { x: number; y: number } | null = null;

  // Marquee Selection and Floating Selection drag tracking
  let isSelecting = false;
  let selectionStart = { x: 0, y: 0 };
  let clearedSelectionOnClick = false;
  let didDragSelection = false;
  let isDraggingFloating = false;
  let dragFloatingOffset = { dx: 0, dy: 0 };

  // Freehand Lasso tool state
  let isDrawingLasso = false;
  let lassoPoints: Point[] | null = null;

  // In-progress Shape drawing state
  let isDrawingShape = false;
  let shapeOrigin = { x: 0, y: 0 };
  let shapeCurrent = { x: 0, y: 0 };
  let shapePreviewCells: Point[] | null = null;

  // Active Image Layer transform tracking
  let isTransformingImage = false;
  let transformStartLayersSnapshot: any = null;
  let activeImageHandle: ImageHandleType | null = null;
  let dynamicCursor = '';
  let imageTransformStart = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    pointerScreenX: 0,
    pointerScreenY: 0,
    fontSize: 16
  };

  // Move Tool stitch layer translation (non-destructive off-canvas drag)
  let isMovingStitchLayer = false;
  let moveStitchStartGrid = { x: 0, y: 0 };
  let moveLayerInitialStitches: Record<string, Stitch> = {};

  // Marching ants animation loop
  let dashOffset = 0;
  let animFrameId: number | null = null;

  function startMarchingAnts() {
    if (animFrameId !== null) return;
    function loop() {
      if ($selection || $floatingSelection || ($activeTool === 'stamp' && $activeStamp) || ($activeLayer?.type === 'image' || $activeLayer?.type === 'text') || isDrawingLasso) {
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

  $: if ($selection || $floatingSelection || ($activeTool === 'stamp' && $activeStamp) || ($activeLayer?.type === 'image' || $activeLayer?.type === 'text') || isDrawingLasso) {
    startMarchingAnts();
  }

  // Spacebar panning state
  let isSpacePressed = false;

  function updateDimensions() {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const newW = Math.floor(rect.width);
    const newH = Math.floor(rect.height);
    if (newW <= 0 || newH <= 0) return;
    if (hasMeasuredDimensions && newW === width && newH === height) return;

    if (hasMeasuredDimensions) {
      const dx = Math.round((newW - width) / 2);
      const dy = Math.round((newH - height) / 2);
      if (dx !== 0 || dy !== 0) {
        viewport.update(v => ({
          ...v,
          panX: v.panX + dx,
          panY: v.panY + dy
        }));
      }
    }

    width = newW;
    height = newH;
    hasMeasuredDimensions = true;

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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    });

    redrawAll();
  }

  function redrawAll() {
    if (!bgCtx || !stitchCtx || !overlayCtx) return;
    renderBackground(bgCtx, width, height, $viewport, $grid, $viewMode, $fabricColor);
    renderStitches(stitchCtx, width, height, $viewport, $grid, $layers, $palette, $viewMode, $showGrid, redrawStitches, $hideNonStitchLayers);
    redrawOverlay();
  }

  function redrawStitches() {
    if (!stitchCtx) return;
    renderStitches(stitchCtx, width, height, $viewport, $grid, $layers, $palette, $viewMode, $showGrid, () => {
      redrawStitches();
    }, $hideNonStitchLayers);
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
      $activeStamp,
      $activeLayer,
      lassoPoints,
      $activeStitchType,
      $brushSize,
      $eraserSize,
      $shapeSize,
      $shapeFillMode
    );
  }

  function updateShapePreview(isShift: boolean) {
    if (!$activeTool) return;
    const tool = $activeTool;
    if (tool !== 'line' && tool !== 'rectangle' && tool !== 'ellipse') return;

    const constrained = constrainCoordinates(tool, shapeOrigin.x, shapeOrigin.y, shapeCurrent.x, shapeCurrent.y, isShift);

    let baseCells: Point[] = [];
    if (tool === 'line') {
      baseCells = getLineCells(shapeOrigin.x, shapeOrigin.y, constrained.x, constrained.y);
    } else if (tool === 'rectangle') {
      baseCells = getRectangleCells(shapeOrigin.x, shapeOrigin.y, constrained.x, constrained.y, $shapeFillMode);
    } else if (tool === 'ellipse') {
      baseCells = getEllipseCells(shapeOrigin.x, shapeOrigin.y, constrained.x, constrained.y, $shapeFillMode);
    }

    const effectiveSize = (tool === 'line' || $shapeFillMode === 'outline') ? $shapeSize : 1;
    shapePreviewCells = expandCellsBySize(baseCells, effectiveSize);
    redrawOverlay();
  }

  // Reactive redraw triggers
  $: if (bgCtx && ($viewport || $grid || $viewMode || $fabricColor)) {
    renderBackground(bgCtx, width, height, $viewport, $grid, $viewMode, $fabricColor);
  }

  $: if (stitchCtx && ($viewport || $grid || $layers || $palette || $viewMode || $showGrid || $hideNonStitchLayers !== undefined)) {
    redrawStitches();
  }

  $: if (overlayCtx && ($viewport || $grid || $hoverCoord || $activeColor || $selection || $floatingSelection || $activeTool || $activeStamp || $shapeFillMode || $activeLayer || $brushSize || $eraserSize || $shapeSize || $activeStitchType)) {
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

  function screenToPreciseGrid(screenX: number, screenY: number): { x: number; y: number } {
    const rect = containerEl.getBoundingClientRect();
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;

    return {
      x: (clientX - $viewport.panX) / $viewport.zoom,
      y: (clientY - $viewport.panY) / $viewport.zoom
    };
  }

  function clearLongPressTimer() {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressOrigin = null;
  }

  function showPickedColorToast(colorId: number) {
    const c = $palette.find(p => p.id === colorId);
    if (!c) return;
    pickedColorToast = {
      hex: c.hex,
      dmc: `${(c.brand || 'dmc').toUpperCase()} ${c.dmc}`,
      name: c.name
    };
    if (pickedToastTimer !== null) clearTimeout(pickedToastTimer);
    pickedToastTimer = setTimeout(() => {
      pickedColorToast = null;
      pickedToastTimer = null;
    }, 1500);
  }

  function startLongPressEyedropper(screenX: number, screenY: number, gridX: number, gridY: number) {
    clearLongPressTimer();
    longPressOrigin = { screenX, screenY, gridX, gridY };
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      longPressOrigin = null;
      cancelStroke();
      isPointerDown = false;
      lastStrokeCell = null;
      if (pickColorAt(gridX, gridY)) {
        showPickedColorToast(get(selectedColorId));
      }
      redrawStitches();
      redrawOverlay();
    }, 450);
  }

  function rollbackInProgressSingleTouchAction() {
    clearLongPressTimer();
    cancelStroke();
    isPointerDown = false;
    lastStrokeCell = null;
    isDrawingShape = false;
    shapePreviewCells = null;
    isDrawingLasso = false;
    lassoPoints = null;
    isSelecting = false;
    clearedSelectionOnClick = false;
    didDragSelection = false;
    isDraggingFloating = false;
    isMovingStitchLayer = false;
    if (Object.keys(moveLayerInitialStitches).length > 0 && $activeLayer) {
      layers.update(ls => ls.map(l => l.id === $activeLayer.id ? { ...l, stitches: moveLayerInitialStitches } : l));
      moveLayerInitialStitches = {};
    }
    isTransformingImage = false;
    activeImageHandle = null;
    transformStartLayersSnapshot = null;
    redrawStitches();
    redrawOverlay();
  }

  function handlePointerDown(e: PointerEvent) {
    containerEl.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Auto-detect Apple Pencil / Stylus and enable Pencil Draws / Finger Pans mode
    if (e.pointerType === 'pen' && !$hasDetectedPencil) {
      hasDetectedPencil.set(true);
      pencilOnlyMode.set(true);
    }

    // Track multi-touch gesture timing & movement for disambiguation and tap shortcuts
    if (e.pointerType === 'touch') {
      if (activePointers.size === 1) {
        touchGestureStartTime = Date.now();
        touchGestureMaxPointers = 1;
        touchGestureMaxMove = 0;
        touchStartPositions.clear();
      } else {
        touchGestureMaxPointers = Math.max(touchGestureMaxPointers, activePointers.size);
      }
      touchStartPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 3+ fingers: cancel accidental stroke/pan for clean 3-finger tap Redo
    if (activePointers.size >= 3) {
      clearLongPressTimer();
      if (Date.now() - touchGestureStartTime < 220 && touchGestureMaxMove < 18) {
        rollbackInProgressSingleTouchAction();
      }
      isPanning = false;
      return;
    }

    // Multi-touch 2-finger pinch-zoom & simultaneous pan start
    if (activePointers.size === 2) {
      clearLongPressTimer();
      if (Date.now() - touchGestureStartTime < 180 && touchGestureMaxMove < 18) {
        rollbackInProgressSingleTouchAction();
      } else {
        if (isPointerDown) {
          commitStroke();
        }
        isPointerDown = false;
        lastStrokeCell = null;
        isDrawingShape = false;
        shapePreviewCells = null;
        isDrawingLasso = false;
        lassoPoints = null;
        isSelecting = false;
        clearedSelectionOnClick = false;
        didDragSelection = false;
        isDraggingFloating = false;
        isMovingStitchLayer = false;
        isTransformingImage = false;
        redrawOverlay();
      }

      isPanning = true;
      const pts = Array.from(activePointers.values());
      const rect = containerEl.getBoundingClientRect();
      initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchZoom = $viewport.zoom;
      pinchStartMid = {
        x: (pts[0].x + pts[1].x) / 2 - rect.left,
        y: (pts[0].y + pts[1].y) / 2 - rect.top
      };
      pinchStartPan = { panX: $viewport.panX, panY: $viewport.panY };
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

    // Active Image or Text Layer Handle Hit-Testing & Interaction
    if ($activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text') && $activeLayer.image && $activeLayer.visible) {
      const rect = containerEl.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const handle = getImageHandleAt(clientX, clientY, $activeLayer.image, $viewport, e.pointerType !== 'mouse');
      if (handle) {
        isTransformingImage = true;
        transformStartLayersSnapshot = cloneLayers($layers);
        activeImageHandle = handle;
        imageTransformStart = {
          x: $activeLayer.image.x,
          y: $activeLayer.image.y,
          width: $activeLayer.image.width,
          height: $activeLayer.image.height,
          rotation: $activeLayer.image.rotation || 0,
          pointerScreenX: e.clientX,
          pointerScreenY: e.clientY,
          fontSize: $activeLayer.textData?.fontSize || 16
        };
        return;
      }
    }

    const { x, y } = screenToGrid(e.clientX, e.clientY);

    // Floating Selection Drag & Commit logic (check inside-drag before Pencil-mode touch pan)
    if ($floatingSelection) {
      const f = $floatingSelection;
      const isInside = x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height;
      if (isInside) {
        isDraggingFloating = true;
        dragFloatingOffset = { dx: x - f.x, dy: y - f.y };
        return;
      } else if (!($pencilOnlyMode && e.pointerType === 'touch')) {
        // Clicking outside commits the floating selection (unless finger-panning in Pencil mode)
        commitFloatingSelection();
      }
    }

    // In "Pencil Draws / Finger Pans" mode, single-finger touch always pans the canvas
    if ($pencilOnlyMode && e.pointerType === 'touch') {
      isPointerDown = false;
      isPanning = true;
      lastPointerPos = { x: e.clientX, y: e.clientY };
      return;
    }

    // Move Tool logic (Photoshop/Illustrator standard)
    if ($activeTool === 'move') {
      if ($floatingSelection) {
        isDraggingFloating = true;
        dragFloatingOffset = { dx: x - $floatingSelection.x, dy: y - $floatingSelection.y };
        return;
      }
      if ($selection && isCellSelected($selection, x, y)) {
        liftSelection(e.altKey);
        const floatSel = get(floatingSelection);
        if (floatSel) {
          isDraggingFloating = true;
          dragFloatingOffset = { dx: x - floatSel.x, dy: y - floatSel.y };
        }
        return;
      }
      if ($activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text') && $activeLayer.image) {
        isTransformingImage = true;
        transformStartLayersSnapshot = cloneLayers($layers);
        activeImageHandle = 'body';
        imageTransformStart = {
          x: $activeLayer.image.x,
          y: $activeLayer.image.y,
          width: $activeLayer.image.width,
          height: $activeLayer.image.height,
          rotation: $activeLayer.image.rotation || 0,
          pointerScreenX: e.clientX,
          pointerScreenY: e.clientY,
          fontSize: $activeLayer.textData?.fontSize || 16
        };
        return;
      }
      if ($activeLayer && (!$activeLayer.type || $activeLayer.type === 'stitch')) {
        isMovingStitchLayer = true;
        moveStitchStartGrid = { x, y };
        moveLayerInitialStitches = { ...$activeLayer.stitches };
        return;
      }
    }

    // Selection Tool in-place drag (lift & move selection content for Marquee, Lasso, and Magic Wand)
    const isSelectionTool = $activeTool === 'select' || $activeTool === 'lasso' || $activeTool === 'wand';
    const isCombineModify = e.shiftKey || e.altKey || $selectionCombineMode === 'add' || $selectionCombineMode === 'subtract';
    if (isSelectionTool && $selection && isCellSelected($selection, x, y) && !isCombineModify) {
      liftSelection(false);
      const floatSel = get(floatingSelection);
      if (floatSel) {
        isDraggingFloating = true;
        dragFloatingOffset = { dx: x - floatSel.x, dy: y - floatSel.y };
      }
      return;
    }

    // Prevent stitch-drawing tools from operating on Image or Text layers
    const isStitchDrawingTool = ['pencil', 'eraser', 'bucket', 'line', 'rectangle', 'ellipse'].includes($activeTool);
    if (isStitchDrawingTool && $activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text')) {
      return;
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

    // Clicking off an active selection deselects (unless holding Shift/Alt or combine mode is add/sub)
    if ($selection && !isCombineModify && !isCellSelected($selection, x, y)) {
      clearSelection();
    }

    // Magic Wand Selection Tool logic
    if ($activeTool === 'wand') {
      if (x >= 0 && x < $grid.width && y >= 0 && y < $grid.height) {
        let cells = new Set<string>();
        if ($activeLayer.type === 'image' && $activeLayer.image) {
          const img = getCachedImageElement($activeLayer.image.src);
          if (img) {
            cells = floodSelectImage(x, y, img, $activeLayer.image, $wandTolerance, $grid.width, $grid.height, $wandContiguous);
          }
        } else {
          cells = floodSelectStitches(x, y, $activeLayer, $grid.width, $grid.height, $wandTolerance, $wandContiguous, $palette);
        }

        const isAdd = e.shiftKey || $selectionCombineMode === 'add';
        const isSub = e.altKey || $selectionCombineMode === 'subtract';
        if (isAdd) {
          setSelection(unionSelection($selection, cells));
        } else if (isSub) {
          setSelection(subtractSelection($selection, cells));
        } else {
          setSelection(createSelectionFromCells(cells));
        }
        redrawOverlay();
        return;
      }
    }

    // Freehand Lasso Selection Tool logic
    if ($activeTool === 'lasso') {
      isDrawingLasso = true;
      const pt = screenToPreciseGrid(e.clientX, e.clientY);
      lassoPoints = [pt];
      redrawOverlay();
      return;
    }

    // Marquee Selection Tool logic (requires dragging to form a selection; single click clears)
    if ($activeTool === 'select') {
      if (!e.shiftKey && !e.altKey && $selection) {
        clearedSelectionOnClick = true;
      }

      isSelecting = true;
      selectionStart = { x, y };
      didDragSelection = false;
      return;
    }

    const isWithinPasteboard = x >= -60 && x < $grid.width + 60 && y >= -60 && y < $grid.height + 60;
    if (isWithinPasteboard) {
      if ($activeTool === 'pencil') {
        const hadPreexistingStitch =
          e.pointerType === 'touch' &&
          !$pencilOnlyMode &&
          $layers.some(l => l.visible && !!l.stitches[`${x},${y}`]);
        beginStroke('Pencil Stitch');
        setStitchAt(x, y, $selectedColorId);
        lastStrokeCell = { x, y };
        if (hadPreexistingStitch) {
          startLongPressEyedropper(e.clientX, e.clientY, x, y);
        }
      } else if ($activeTool === 'eraser') {
        beginStroke('Erase Stitch');
        eraseStitchAt(x, y);
        lastStrokeCell = { x, y };
      } else if ($activeTool === 'bucket') {
        floodFill(x, y, $selectedColorId);
      } else if ($activeTool === 'picker') {
        if (pickColorAt(x, y)) {
          showPickedColorToast(get(selectedColorId));
        }
      }
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (activePointers.has(e.pointerId)) {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (e.pointerType === 'pen' && !$hasDetectedPencil) {
      hasDetectedPencil.set(true);
      pencilOnlyMode.set(true);
    }

    if (e.pointerType === 'touch') {
      const startPos = touchStartPositions.get(e.pointerId);
      if (startPos) {
        const moveDist = Math.hypot(e.clientX - startPos.x, e.clientY - startPos.y);
        if (moveDist > touchGestureMaxMove) {
          touchGestureMaxMove = moveDist;
        }
      }
      if (longPressOrigin && Math.hypot(e.clientX - longPressOrigin.screenX, e.clientY - longPressOrigin.screenY) > 8) {
        clearLongPressTimer();
      }
    }

    // 2-finger simultaneous pinch-zoom & focal-point pan
    if (activePointers.size === 2 && isPanning) {
      const pts = Array.from(activePointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const rect = containerEl.getBoundingClientRect();
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const scale = initialPinchDistance > 10 ? dist / initialPinchDistance : 1;
      const newZoom = Math.min(80, Math.max(4, Math.round(initialPinchZoom * scale)));
      const worldX = (pinchStartMid.x - pinchStartPan.panX) / initialPinchZoom;
      const worldY = (pinchStartMid.y - pinchStartPan.panY) / initialPinchZoom;

      viewport.set({
        zoom: newZoom,
        panX: Math.round(midX - worldX * newZoom),
        panY: Math.round(midY - worldY * newZoom)
      });
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

    // Active Image or Text Layer transformation
    if (isTransformingImage && $activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text') && $activeLayer.image && activeImageHandle) {
      const dxScreen = e.clientX - imageTransformStart.pointerScreenX;
      const dyScreen = e.clientY - imageTransformStart.pointerScreenY;
      const rect = containerEl.getBoundingClientRect();

      if (activeImageHandle === 'body') {
        const dGridX = Math.round(dxScreen / $viewport.zoom);
        const dGridY = Math.round(dyScreen / $viewport.zoom);
        updateImageLayer($activeLayer.id, {
          x: imageTransformStart.x + dGridX,
          y: imageTransformStart.y + dGridY
        });
      } else if (activeImageHandle === 'rotate') {
        const cx = $viewport.panX + (imageTransformStart.x + imageTransformStart.width / 2) * $viewport.zoom;
        const cy = $viewport.panY + (imageTransformStart.y + imageTransformStart.height / 2) * $viewport.zoom;
        const currentAngle = Math.atan2((e.clientY - rect.top) - cy, (e.clientX - rect.left) - cx) * (180 / Math.PI);
        const startAngle = Math.atan2((imageTransformStart.pointerScreenY - rect.top) - cy, (imageTransformStart.pointerScreenX - rect.left) - cx) * (180 / Math.PI);
        let newRot = Math.round(imageTransformStart.rotation + (currentAngle - startAngle));
        if (e.shiftKey) {
          newRot = Math.round(newRot / 15) * 15;
        }
        updateImageLayer($activeLayer.id, {
          rotation: ((newRot % 360) + 360) % 360
        });
      } else {
        // Scaling handles: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w'
        const rad = ((imageTransformStart.rotation || 0) * Math.PI) / 180;
        const dStitchX = dxScreen / $viewport.zoom;
        const dStitchY = dyScreen / $viewport.zoom;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const localDx = dStitchX * cos - dStitchY * sin;
        const localDy = dStitchX * sin + dStitchY * cos;

        let newW = imageTransformStart.width;
        let newH = imageTransformStart.height;
        let newX = imageTransformStart.x;
        let newY = imageTransformStart.y;

        const isCorner = ['nw', 'ne', 'se', 'sw'].includes(activeImageHandle);
        const preserveAspect = e.shiftKey || isCorner;
        const aspect = imageTransformStart.width / Math.max(1, imageTransformStart.height);

        if (activeImageHandle === 'se') {
          newW = Math.max(2, Math.round(imageTransformStart.width + localDx));
          if (preserveAspect) {
            newH = Math.max(2, Math.round(newW / aspect));
          } else {
            newH = Math.max(2, Math.round(imageTransformStart.height + localDy));
          }
        } else if (activeImageHandle === 'e') {
          newW = Math.max(2, Math.round(imageTransformStart.width + localDx));
        } else if (activeImageHandle === 's') {
          newH = Math.max(2, Math.round(imageTransformStart.height + localDy));
        } else if (activeImageHandle === 'sw') {
          newW = Math.max(2, Math.round(imageTransformStart.width - localDx));
          if (preserveAspect) {
            newH = Math.max(2, Math.round(newW / aspect));
          } else {
            newH = Math.max(2, Math.round(imageTransformStart.height + localDy));
          }
          newX = imageTransformStart.x + (imageTransformStart.width - newW);
        } else if (activeImageHandle === 'w') {
          newW = Math.max(2, Math.round(imageTransformStart.width - localDx));
          newX = imageTransformStart.x + (imageTransformStart.width - newW);
        } else if (activeImageHandle === 'ne') {
          newW = Math.max(2, Math.round(imageTransformStart.width + localDx));
          if (preserveAspect) {
            newH = Math.max(2, Math.round(newW / aspect));
          } else {
            newH = Math.max(2, Math.round(imageTransformStart.height - localDy));
          }
          newY = imageTransformStart.y + (imageTransformStart.height - newH);
        } else if (activeImageHandle === 'n') {
          newH = Math.max(2, Math.round(imageTransformStart.height - localDy));
          newY = imageTransformStart.y + (imageTransformStart.height - newH);
        } else if (activeImageHandle === 'nw') {
          newW = Math.max(2, Math.round(imageTransformStart.width - localDx));
          if (preserveAspect) {
            newH = Math.max(2, Math.round(newW / aspect));
          } else {
            newH = Math.max(2, Math.round(imageTransformStart.height - localDy));
          }
          newX = imageTransformStart.x + (imageTransformStart.width - newW);
          newY = imageTransformStart.y + (imageTransformStart.height - newH);
        }

        if ($activeLayer.type === 'text' && $activeLayer.textData) {
          const scale = isCorner
            ? Math.max(newW / Math.max(1, imageTransformStart.width), newH / Math.max(1, imageTransformStart.height))
            : (['n', 's'].includes(activeImageHandle) ? newH / Math.max(1, imageTransformStart.height) : newW / Math.max(1, imageTransformStart.width));
          const baseFontSize = imageTransformStart.fontSize || $activeLayer.textData.fontSize || 16;
          const newFontSize = Math.max(6, Math.min(160, Math.round(baseFontSize * scale)));
          updateTextLayer($activeLayer.id, {
            fontSize: newFontSize,
            x: newX,
            y: newY
          });
        } else {
          updateImageLayer($activeLayer.id, {
            x: newX,
            y: newY,
            width: newW,
            height: newH
          });
        }
      }
      return;
    }

    // Update hover coordinates (inside Artboard or on Pasteboard margin)
    const { x, y } = screenToGrid(e.clientX, e.clientY);
    if (x >= -60 && x < $grid.width + 60 && y >= -60 && y < $grid.height + 60) {
      hoverCoord.set({ x, y });
    } else {
      hoverCoord.set(null);
    }

    // Dynamic cursor hover feedback for image/text handles, active selections, or invalid tools
    const isStitchDrawingTool = ['pencil', 'eraser', 'bucket', 'line', 'rectangle', 'ellipse'].includes($activeTool);
    const isSelectionTool = $activeTool === 'select' || $activeTool === 'lasso' || $activeTool === 'wand';
    const isCombineModify = e.shiftKey || e.altKey || $selectionCombineMode === 'add' || $selectionCombineMode === 'subtract';
    const isOverFloating = !!$floatingSelection && x >= $floatingSelection.x && x < $floatingSelection.x + $floatingSelection.width && y >= $floatingSelection.y && y < $floatingSelection.y + $floatingSelection.height;
    const isOverMovableSelection = isSelectionTool && !!$selection && isCellSelected($selection, x, y) && !isCombineModify;

    if (isStitchDrawingTool && $activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text')) {
      dynamicCursor = 'not-allowed';
    } else if (isOverFloating || isOverMovableSelection) {
      dynamicCursor = 'move';
    } else if (!isTransformingImage && $activeLayer && ($activeLayer.type === 'image' || $activeLayer.type === 'text') && $activeLayer.image && $activeLayer.visible) {
      const rect = containerEl.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const handle = getImageHandleAt(clientX, clientY, $activeLayer.image, $viewport, e.pointerType !== 'mouse');
      if (handle) {
        if (handle === 'nw' || handle === 'se') dynamicCursor = 'nwse-resize';
        else if (handle === 'ne' || handle === 'sw') dynamicCursor = 'nesw-resize';
        else if (handle === 'n' || handle === 's') dynamicCursor = 'ns-resize';
        else if (handle === 'e' || handle === 'w') dynamicCursor = 'ew-resize';
        else if (handle === 'rotate') dynamicCursor = 'grab';
        else if (handle === 'body') dynamicCursor = 'move';
      } else if ($activeTool === 'move') {
        dynamicCursor = 'move';
      } else {
        dynamicCursor = '';
      }
    } else if ($activeTool === 'move') {
      dynamicCursor = 'move';
    } else if (!isTransformingImage && dynamicCursor !== '') {
      dynamicCursor = '';
    }

    // Moving stitch layer with Move Tool (non-destructive during drag: all original stitches shifted relative to start)
    if (isMovingStitchLayer && $activeLayer) {
      const totalDx = x - moveStitchStartGrid.x;
      const totalDy = y - moveStitchStartGrid.y;
      const updated: Record<string, Stitch> = {};
      for (const [key, stitch] of Object.entries(moveLayerInitialStitches)) {
        const [ox, oy] = key.split(',').map(Number);
        updated[`${ox + totalDx},${oy + totalDy}`] = { ...stitch };
      }
      layers.update(ls => ls.map(l => l.id === $activeLayer.id ? { ...l, stitches: updated } : l));
      redrawStitches();
      return;
    }

    // Drawing freehand lasso path with sub-grid precision
    if (isDrawingLasso && lassoPoints) {
      const { x: preciseX, y: preciseY } = screenToPreciseGrid(e.clientX, e.clientY);
      const lastPt = lassoPoints[lassoPoints.length - 1];
      if (Math.hypot(preciseX - lastPt.x, preciseY - lastPt.y) > 0.15) {
        lassoPoints = [...lassoPoints, { x: preciseX, y: preciseY }];
        redrawOverlay();
      }
      return;
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
      const clampedX = Math.max(-60, Math.min($grid.width + 59, x));
      const clampedY = Math.max(-60, Math.min($grid.height + 59, y));
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

    // Drag drawing with continuous Bresenham line interpolation
    if (isPointerDown) {
      if ($activeTool === 'pencil') {
        const pts = lastStrokeCell ? getLineCells(lastStrokeCell.x, lastStrokeCell.y, x, y) : [{ x, y }];
        for (const pt of pts) {
          if (pt.x >= -60 && pt.x < $grid.width + 60 && pt.y >= -60 && pt.y < $grid.height + 60) {
            setStitchAt(pt.x, pt.y, $selectedColorId);
          }
        }
        lastStrokeCell = { x, y };
      } else if ($activeTool === 'eraser') {
        const pts = lastStrokeCell ? getLineCells(lastStrokeCell.x, lastStrokeCell.y, x, y) : [{ x, y }];
        for (const pt of pts) {
          if (pt.x >= -60 && pt.x < $grid.width + 60 && pt.y >= -60 && pt.y < $grid.height + 60) {
            eraseStitchAt(pt.x, pt.y);
          }
        }
        lastStrokeCell = { x, y };
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);
    clearLongPressTimer();

    // Update lastPointerPos when transitioning from 2-finger pinch/pan back to 1 finger
    if (activePointers.size === 1 && isPanning) {
      const remaining = Array.from(activePointers.values())[0];
      lastPointerPos = { x: remaining.x, y: remaining.y };
    }

    if (activePointers.size === 0) {
      lastStrokeCell = null;

      // Check for Procreate-style 2-finger tap Undo / 3-finger tap Redo
      if (e.pointerType === 'touch') {
        hoverCoord.set(null);
        const elapsed = Date.now() - touchGestureStartTime;
        if (elapsed < 280 && touchGestureMaxMove < 16) {
          if (touchGestureMaxPointers === 2) {
            undo();
          } else if (touchGestureMaxPointers === 3) {
            redo();
          }
        }
        touchGestureMaxPointers = 0;
        touchStartPositions.clear();
      }
      if (isMovingStitchLayer && $activeLayer) {
        commitLayerStitchesMove($activeLayer.id, moveLayerInitialStitches, $activeLayer.stitches);
        isMovingStitchLayer = false;
        moveLayerInitialStitches = {};
        redrawStitches();
      }
      if (isTransformingImage) {
        if ($activeLayer?.image && transformStartLayersSnapshot) {
          const img = $activeLayer.image;
          const hasChanged = img.x !== imageTransformStart.x ||
                             img.y !== imageTransformStart.y ||
                             img.width !== imageTransformStart.width ||
                             img.height !== imageTransformStart.height ||
                             img.rotation !== imageTransformStart.rotation;
          if (hasChanged) {
            undoStack.update(u => [
              ...u.slice(-50),
              {
                description: `Transform ${$activeLayer.name || 'Layer'}`,
                layerId: $activeLayer.id,
                before: {},
                after: {},
                layersSnapshot: transformStartLayersSnapshot
              }
            ]);
            redoStack.set([]);
          }
        }
        isTransformingImage = false;
        activeImageHandle = null;
        transformStartLayersSnapshot = null;
      }

      // Finalize Freehand Lasso Selection
      if (isDrawingLasso && lassoPoints) {
        if (lassoPoints.length >= 3) {
          const rawCells = getLassoCells(lassoPoints, $grid.width, $grid.height);
          let filteredCells = rawCells;

          if ($lassoFilterMode === 'stitches_only') {
            filteredCells = rawCells.filter(c => !!$activeLayer.stitches[`${c.x},${c.y}`]);
          } else if ($lassoFilterMode === 'active_color') {
            const activeColor = $palette.find(p => p.id === $selectedColorId);
            const targetRGB = activeColor ? {
              r: parseInt(activeColor.hex.slice(1, 3), 16) || 0,
              g: parseInt(activeColor.hex.slice(3, 5), 16) || 0,
              b: parseInt(activeColor.hex.slice(5, 7), 16) || 0
            } : null;
            const maxDistance = ($wandTolerance / 100) * 442;
            const colorMap = new Map<number, { r: number; g: number; b: number }>();
            for (const p of $palette) {
              colorMap.set(p.id, {
                r: parseInt(p.hex.slice(1, 3), 16) || 0,
                g: parseInt(p.hex.slice(3, 5), 16) || 0,
                b: parseInt(p.hex.slice(5, 7), 16) || 0
              });
            }

            filteredCells = rawCells.filter(c => {
              const st = $activeLayer.stitches[`${c.x},${c.y}`];
              if (!st || !targetRGB) return false;
              if (st.colorId === $selectedColorId) return true;
              if ($wandTolerance === 0) return false;
              const nRGB = colorMap.get(st.colorId);
              if (!nRGB) return false;
              return Math.hypot(targetRGB.r - nRGB.r, targetRGB.g - nRGB.g, targetRGB.b - nRGB.b) <= maxDistance;
            });
          }

          const cellSet = new Set(filteredCells.map(c => `${c.x},${c.y}`));
          const isAdd = e.shiftKey || $selectionCombineMode === 'add';
          const isSub = e.altKey || $selectionCombineMode === 'subtract';
          if (isAdd) {
            setSelection(unionSelection($selection, cellSet));
          } else if (isSub) {
            setSelection(subtractSelection($selection, cellSet));
          } else {
            setSelection(createSelectionFromCells(cellSet));
          }
        } else if (!e.shiftKey && !e.altKey && $selectionCombineMode === 'replace') {
          clearSelection();
        }
        isDrawingLasso = false;
        lassoPoints = null;
        redrawOverlay();
      }

      if (isDrawingShape && shapePreviewCells && shapePreviewCells.length > 0) {
        const toolLabel = $activeTool === 'line' ? 'Draw Line' : ($activeTool === 'rectangle' ? 'Draw Rectangle' : 'Draw Ellipse');
        beginStroke(toolLabel);
        for (const cell of shapePreviewCells) {
          if (cell.x >= 0 && cell.x < $grid.width && cell.y >= 0 && cell.y < $grid.height) {
            setStitchAt(cell.x, cell.y, $selectedColorId, $activeStitchType, 1);
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

      // Finalize Marquee Selection (with Shift=Union and Alt=Subtract modifier support)
      if (isSelecting) {
        if (didDragSelection) {
          const { x, y } = screenToGrid(e.clientX, e.clientY);
          const clampedX = Math.max(0, Math.min($grid.width - 1, x));
          const clampedY = Math.max(0, Math.min($grid.height - 1, y));
          const minX = Math.min(selectionStart.x, clampedX);
          const maxX = Math.max(selectionStart.x, clampedX);
          const minY = Math.min(selectionStart.y, clampedY);
          const maxY = Math.max(selectionStart.y, clampedY);

          const isAdd = e.shiftKey || $selectionCombineMode === 'add';
          const isSub = e.altKey || $selectionCombineMode === 'subtract';
          if (isAdd || isSub) {
            const boxCells = new Set<string>();
            for (let by = minY; by <= maxY; by++) {
              for (let bx = minX; bx <= maxX; bx++) {
                boxCells.add(`${bx},${by}`);
              }
            }
            if (isAdd) {
              setSelection(unionSelection($selection, boxCells));
            } else if (isSub) {
              setSelection(subtractSelection($selection, boxCells));
            }
          } else {
            setSelection({
              x: minX,
              y: minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1
            });
          }
        } else if (clearedSelectionOnClick) {
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

  function handleDblClick(e: MouseEvent) {
    if ($activeLayer && $activeLayer.type === 'text') {
      openTextModal($activeLayer.id);
      return;
    }
    const { x, y } = screenToGrid(e.clientX, e.clientY);
    const key = `${x},${y}`;
    for (const l of $layers) {
      if (l.type === 'text' && (l.stitches[key] || (l.image && x >= l.image.x && x < l.image.x + l.image.width && y >= l.image.y && y < l.image.y + l.image.height))) {
        activeLayerId.set(l.id);
        openTextModal(l.id);
        return;
      }
    }
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

    // Enter commits floating selection or finalizes active text layer
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

    // Delete or Backspace deletes selected stitches on active layer
    if ((e.key === 'Delete' || e.key === 'Backspace') && $selection) {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      deleteSelection();
      redrawStitches();
      return;
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

    if (typeof ResizeObserver !== 'undefined' && containerEl) {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerEl);
    }

    updateDimensions();
    zoomToFit();
  });

  onDestroy(() => {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
    }
    clearLongPressTimer();
    if (pickedToastTimer !== null) {
      clearTimeout(pickedToastTimer);
      pickedToastTimer = null;
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener('resize', updateDimensions);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('click', handleWindowClick);
  });
</script>

<div
  bind:this={containerEl}
  role="region"
  aria-label="Cross-stitch Canvas Workspace"
  class="relative w-full h-full overflow-hidden bg-[#121216] cursor-crosshair touch-none select-none"
  class:cursor-grab={isSpacePressed || $activeTool === 'pan'}
  class:cursor-grabbing={isPanning}
  style:cursor={dynamicCursor || undefined}
  on:pointerdown={handlePointerDown}
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={handlePointerUp}
  on:pointerleave={() => hoverCoord.set(null)}
  on:wheel={handleWheel}
  on:dblclick={handleDblClick}
>
  <!-- Background Fabric Canvas -->
  <canvas bind:this={bgCanvas} class="absolute inset-0 pointer-events-none"></canvas>

  <!-- Stitches & Grid Canvas -->
  <canvas bind:this={stitchCanvas} class="absolute inset-0 pointer-events-none"></canvas>

  <!-- Interactive Overlays & Hover Highlight -->
  <canvas bind:this={overlayCanvas} class="absolute inset-0 pointer-events-none"></canvas>

  <!-- Eyedropper Picked Color Toast (Long-press / Touch feedback) -->
  {#if pickedColorToast}
    <div
      class="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1e1e24]/95 backdrop-blur-md border border-indigo-500/50 shadow-2xl px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs text-gray-100 z-40 pointer-events-none select-none animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      <span
        class="w-4 h-4 rounded-full border border-white/30 shrink-0 shadow-sm"
        style="background-color: {pickedColorToast.hex};"
      ></span>
      <span class="font-mono font-semibold text-indigo-300">{pickedColorToast.dmc}</span>
      <span class="text-gray-300 truncate max-w-[140px]">{pickedColorToast.name}</span>
    </div>
  {/if}

  <!-- Floating Image Layer Controls Pill -->
  {#if $activeLayer && $activeLayer.type === 'image' && $activeLayer.image}
    <div
      class="absolute top-14 md:top-4 left-1/2 -translate-x-1/2 max-w-[calc(100%-20px)] overflow-x-auto no-scrollbar bg-[#1e1e24]/95 backdrop-blur-md border border-cyan-500/50 shadow-2xl px-3 py-1.5 rounded-xl flex items-center space-x-2.5 text-xs text-gray-200 z-30 select-none pointer-events-auto"
      role="toolbar"
      aria-label="Image Layer Controls"
      tabindex="-1"
      on:pointerdown|stopPropagation
      on:pointerup|stopPropagation
      on:pointermove|stopPropagation
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <div class="flex items-center space-x-1.5 pr-2 border-r border-gray-700">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span class="font-medium text-cyan-300">{$activeLayer.name}</span>
      </div>

      <button
        type="button"
        class="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold flex items-center space-x-1.5 shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer"
        on:click={() => openDigitizerForLayer($activeLayer.id)}
        title="Digitize reference image into DMC stitches"
      >
        <Sparkles size={13} />
        <span>Digitize to Stitches...</span>
      </button>

      <button
        type="button"
        class="p-1.5 rounded hover:bg-[#2b2b36] text-gray-300 hover:text-white transition-colors cursor-pointer"
        on:click={() => rotateImageLayer($activeLayer.id, true)}
        title="Rotate 90° Clockwise"
      >
        <RotateCw size={13} />
      </button>

      <button
        type="button"
        class="px-2 py-1 rounded hover:bg-[#2b2b36] text-gray-300 hover:text-white transition-colors cursor-pointer text-[11px]"
        on:click={() => fitImageLayerToCanvas($activeLayer.id)}
        title="Fit Image to Canvas"
      >
        Fit Canvas
      </button>

      <div class="flex items-center space-x-1.5 pl-2 border-l border-gray-700">
        <span class="text-[10px] text-gray-400">Opacity:</span>
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={$activeLayer.opacity}
          on:input={(e) => setLayerOpacity($activeLayer.id, parseFloat(e.currentTarget.value))}
          class="w-16 accent-cyan-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
          title="Layer Opacity ({Math.round($activeLayer.opacity * 100)}%)"
        />
        <span class="font-mono text-[10px] text-gray-400 w-7 text-right">{Math.round($activeLayer.opacity * 100)}%</span>
      </div>

      <button
        type="button"
        class="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors ml-1 cursor-pointer"
        on:click={() => toggleLayerVisibility($activeLayer.id)}
        title={$activeLayer.visible ? "Hide Layer" : "Show Layer"}
      >
        {#if $activeLayer.visible}
          <Eye size={13} />
        {:else}
          <EyeOff size={13} />
        {/if}
      </button>
    </div>
  {/if}

  <!-- HUD Coordinate & Live Details Bar (Bottom Left) -->
  <div
    class="hud-container absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 max-w-[calc(100%-20px)] bg-[#1e1e24]/95 backdrop-blur-md border border-[#3a3a4a] px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs text-gray-300 flex flex-col space-y-1.5 shadow-2xl z-20 pointer-events-auto select-none"
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
    <div class="flex flex-wrap items-center gap-y-1 gap-x-2 sm:gap-x-2.5">
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

      <div class="w-px h-3.5 bg-gray-700 {$hoverCoord ? '' : 'hidden sm:block'}"></div>

      <!-- Hover Coordinate (with [Pasteboard] indicator when outside Artboard) -->
      <div class="font-mono {$hoverCoord ? 'flex' : 'hidden sm:flex'} items-center text-xs whitespace-pre select-none tracking-tight">
        {#if $hoverCoord}
          {@const isOutside = $hoverCoord.x < 0 || $hoverCoord.x >= $grid.width || $hoverCoord.y < 0 || $hoverCoord.y >= $grid.height}
          <span class="{isOutside ? 'text-amber-400/90' : 'text-indigo-400'} font-semibold">X:{String($hoverCoord.x + 1).padEnd(3, ' ')}</span>
          <span class="text-gray-500">,</span>
          <span class="{isOutside ? 'text-amber-400/90' : 'text-indigo-400'} font-semibold">Y:{String($hoverCoord.y + 1).padEnd(3, ' ')}</span>
          {#if isOutside}
            <span class="ml-1 text-[10px] text-amber-400/80 font-sans uppercase font-medium">[Pasteboard]</span>
          {/if}
        {:else}
          <span class="text-gray-500">X:-- ,Y:-- </span>
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
        <div class="flex flex-wrap items-center gap-2 text-emerald-300">
          <span>Motif Stamp: <strong class="text-white">{$activeStamp.name}</strong> ({$activeStamp.width}×{$activeStamp.height} st)<span class="hidden md:inline"> &bull; Click to place &bull; Press <strong class="text-white">R</strong> to rotate, <strong class="text-white">H/V</strong> to flip</span></span>
          <button
            type="button"
            class="text-[10px] bg-[#2a2a36] hover:bg-[#323242] text-gray-300 px-2 py-0.5 rounded font-sans font-medium transition-colors cursor-pointer"
            on:click={cancelActiveStamp}
          >
            Cancel (Esc)
          </button>
        </div>
      {:else if $floatingSelection}
        <div class="flex flex-wrap items-center gap-2 text-indigo-300">
          <span>Floating Selection: <strong class="text-white">{$floatingSelection.width}×{$floatingSelection.height} st</strong><span class="hidden md:inline"> &bull; Click or Enter to Commit &bull; Press <strong class="text-white">R</strong> to rotate, <strong class="text-white">H/V</strong> to flip</span></span>
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
      {:else if $activeLayer && $activeLayer.type === 'text' && !$activeLayer.locked}
        <div class="flex flex-wrap items-center gap-2 text-purple-300">
          <span>
            Text Layer: <strong class="text-white">{$activeLayer.name}</strong><span class="hidden md:inline"> &bull;
            Drag handles to position &bull;
            Press <strong class="text-white">Enter</strong> to finalize stitches &bull;
            Press <strong class="text-white">R</strong> to rotate, <strong class="text-white">H/V</strong> to flip</span>
          </span>
          <button
            type="button"
            class="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded font-sans font-medium transition-colors shadow-sm cursor-pointer"
            on:click={() => quickDigitizeTextLayer($activeLayer.id)}
            title="Finalize to regular stitches (Enter)"
          >
            Finalize (Enter)
          </button>
        </div>
      {:else if $selectionBounds}
        <div class="flex flex-wrap items-center gap-2">
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
        <span>
          Pattern Artboard: <strong class="text-indigo-200 font-medium">{$grid.width}×{$grid.height} st</strong>
          <span class="text-gray-500">({formatDimensions($grid.width, $grid.height, $grid.fabricCount, $measurementUnit)})</span>
          &bull; <strong class="text-indigo-300 font-medium">{$patternBounds.patternStitches} st</strong> in pattern
          {#if $patternBounds.pasteboardStitches > 0}
            &bull; <span class="text-amber-400 font-medium">({$patternBounds.pasteboardStitches} on pasteboard)</span>
          {/if}
        </span>
      {:else}
        <span>Pattern Artboard: <strong class="text-indigo-200 font-medium">{$grid.width}×{$grid.height} st</strong> &bull; <span class="text-gray-500 italic">0 stitches in pattern</span></span>
      {/if}
    </div>
  </div>
</div>

