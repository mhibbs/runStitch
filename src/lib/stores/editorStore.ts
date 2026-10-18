import { writable, derived, get } from 'svelte/store';
import type { 
  Layer, 
  Stitch, 
  StitchType,
  PaletteColor, 
  ActiveTool, 
  ViewMode, 
  Viewport, 
  GridDimensions, 
  HistoryDelta,
  SelectionBox,
  FloatingSelection,
  ClipboardData,
  ShapeFillMode,
  MotifStamp,
  BorderConfig,
  FabricColorPreset,
  CompositeBorder,
  ReferenceImage,
  DigitizerOptions,
  TextLayerData
} from '../types';
import { createDefaultPalette, CHART_SYMBOLS, getHighContrastTextColor, DMC_CATALOG, type DMCEntry } from '../data/dmcPalette';
import { saveCustomStamp } from '../data/motifLibrary';
import type { PlacedStitch } from '../engine/borderGenerator';
import { hexToRgb, type DigitizerResult } from '../engine/digitizer';
import {
  invertSelection,
  growSelection,
  shrinkSelection,
  isCellSelected,
  getSelectedCells
} from '../engine/geometry';
import { convertPaletteToBrand, THREAD_BRANDS } from '../data/threadBrands';
import { measureTextDimensions, rasterizeTextLayer } from '../data/fontCatalog';

// Initial state
const defaultPalette = createDefaultPalette();

const initialLayer: Layer = {
  id: 'layer-1',
  name: 'Base Pattern',
  visible: true,
  locked: false,
  opacity: 1.0,
  stitches: {}
};

export const grid = writable<GridDimensions>({
  width: 60,
  height: 40,
  fabricCount: 14
});

export const layers = writable<Layer[]>([initialLayer]);
export const activeLayerId = writable<string>('layer-1');
export const palette = writable<PaletteColor[]>(defaultPalette);
export const selectedColorId = writable<number>(defaultPalette[2].id); // Red by default
export const activeTool = writable<ActiveTool>('pencil');
export const viewMode = writable<ViewMode>('chart');
export const showGrid = writable<boolean>(true);

export const viewport = writable<Viewport>({
  zoom: 24, // 24px per stitch square
  panX: 50,
  panY: 50
});

// Cursor hovered stitch coordinate (null if off-canvas)
export const hoverCoord = writable<{ x: number; y: number } | null>(null);

// Marquee Selection & Clipboard Stores
export const selection = writable<SelectionBox | null>(null);
export const floatingSelection = writable<FloatingSelection | null>(null);
export const clipboard = writable<ClipboardData | null>(null);

// Derived active selection metrics
export const selectionBounds = derived(
  [selection, layers, activeLayerId, grid],
  ([$sel, $layers, $activeId, $grid]) => {
    if (!$sel) return null;
    const active = $layers.find(l => l.id === $activeId);
    let stitchCount = 0;
    if (active) {
      if ($sel.cells) {
        for (const key of $sel.cells) {
          if (active.stitches[key]) {
            stitchCount++;
          }
        }
      } else {
        for (let y = $sel.y; y < $sel.y + $sel.height; y++) {
          for (let x = $sel.x; x < $sel.x + $sel.width; x++) {
            if (active.stitches[`${x},${y}`]) {
              stitchCount++;
            }
          }
        }
      }
    }
    return {
      ...$sel,
      stitchCount,
      totalCells: $sel.cells ? $sel.cells.size : $sel.width * $sel.height,
      inchWidth: ($sel.width / $grid.fabricCount).toFixed(1),
      inchHeight: ($sel.height / $grid.fabricCount).toFixed(1)
    };
  }
);

// History stacks for sparse delta undo/redo
export const undoStack = writable<HistoryDelta[]>([]);
export const redoStack = writable<HistoryDelta[]>([]);

export const canUndo = derived(undoStack, $s => $s.length > 0);
export const canRedo = derived(redoStack, $s => $s.length > 0);

// Active layer derived store
export const activeLayer = derived(
  [layers, activeLayerId],
  ([$layers, $activeId]) => $layers.find(l => l.id === $activeId) || $layers[0]
);

// Active color object derived store
export const activeColor = derived(
  [palette, selectedColorId],
  ([$palette, $id]) => $palette.find(c => c.id === $id) || $palette[0]
);

// In-progress stroke delta accumulator
let currentStrokeDelta: {
  layerId: string;
  before: Record<string, Stitch | null>;
  after: Record<string, Stitch | null>;
} | null = null;

export function beginStroke(desc = 'Draw Stitches') {
  const currentActiveId = get(activeLayerId);
  currentStrokeDelta = {
    layerId: currentActiveId,
    before: {},
    after: {}
  };
}

export function commitStroke(desc = 'Draw Stitches') {
  if (!currentStrokeDelta) return;
  if (Object.keys(currentStrokeDelta.after).length > 0) {
    undoStack.update(stack => [
      ...stack.slice(-50), // Keep last 50 actions
      {
        description: desc,
        layerId: currentStrokeDelta!.layerId,
        before: currentStrokeDelta!.before,
        after: currentStrokeDelta!.after
      }
    ]);
    redoStack.set([]); // Clear redo on new action
  }
  currentStrokeDelta = null;
}

export function setStitchAt(x: number, y: number, colorId: number) {
  const currentLayers = get(layers);
  const activeId = get(activeLayerId);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

  const key = `${x},${y}`;
  const existingStitch = targetLayer.stitches[key];

  // If already matches, skip
  if (existingStitch && existingStitch.colorId === colorId && existingStitch.type === 'full') {
    return;
  }

  // Record in delta
  if (currentStrokeDelta) {
    if (!(key in currentStrokeDelta.before)) {
      currentStrokeDelta.before[key] = existingStitch ? { ...existingStitch } : null;
    }
    currentStrokeDelta.after[key] = { colorId, type: 'full' };
  }

  // Update layer
  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      return {
        ...l,
        stitches: {
          ...l.stitches,
          [key]: { colorId, type: 'full' }
        }
      };
    }
    return l;
  }));
}

export function eraseStitchAt(x: number, y: number) {
  const currentLayers = get(layers);
  const activeId = get(activeLayerId);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

  const key = `${x},${y}`;
  const existingStitch = targetLayer.stitches[key];
  if (!existingStitch) return;

  // Record in delta
  if (currentStrokeDelta) {
    if (!(key in currentStrokeDelta.before)) {
      currentStrokeDelta.before[key] = { ...existingStitch };
    }
    currentStrokeDelta.after[key] = null;
  }

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };
      delete updated[key];
      return { ...l, stitches: updated };
    }
    return l;
  }));
}

export function floodFill(startX: number, startY: number, newColorId: number) {
  const currentGrid = get(grid);
  if (startX < 0 || startX >= currentGrid.width || startY < 0 || startY >= currentGrid.height) return;

  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

  const startKey = `${startX},${startY}`;
  const targetStitch = targetLayer.stitches[startKey];
  const targetColorId = targetStitch ? targetStitch.colorId : null;

  if (targetColorId === newColorId) return;

  beginStroke('Flood Fill');

  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (x < 0 || x >= currentGrid.width || y < 0 || y >= currentGrid.height) continue;

    const currentStitch = targetLayer.stitches[key];
    const currentColor = currentStitch ? currentStitch.colorId : null;

    if (currentColor === targetColorId) {
      setStitchAt(x, y, newColorId);
      // 4-way neighbors
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
  }

  commitStroke('Flood Fill');
}

export function pickColorAt(x: number, y: number): boolean {
  const currentLayers = get(layers);
  const key = `${x},${y}`;
  // Scan layers from top to bottom
  for (let i = currentLayers.length - 1; i >= 0; i--) {
    const layer = currentLayers[i];
    if (!layer.visible) continue;
    const stitch = layer.stitches[key];
    if (stitch) {
      selectedColorId.set(stitch.colorId);
      return true;
    }
  }
  return false;
}

export function undo() {
  const stack = get(undoStack);
  if (stack.length === 0) return;

  const action = stack[stack.length - 1];
  undoStack.set(stack.slice(0, -1));

  if (action.layersSnapshot) {
    const current = get(layers);
    redoStack.update(r => [...r, { ...action, layersSnapshot: current }]);
    layers.set(action.layersSnapshot);
    if (action.layersSnapshot.length > 0) {
      activeLayerId.set(action.layersSnapshot[0].id);
    }
    return;
  }

  // Revert layer stitches
  layers.update(ls => ls.map(l => {
    if (l.id === action.layerId) {
      const updated = { ...l.stitches };
      for (const [key, prevStitch] of Object.entries(action.before)) {
        if (prevStitch === null) {
          delete updated[key];
        } else {
          updated[key] = prevStitch;
        }
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  // Push to redo
  redoStack.update(r => [...r, action]);
}

export function redo() {
  const rStack = get(redoStack);
  if (rStack.length === 0) return;

  const action = rStack[rStack.length - 1];
  redoStack.set(rStack.slice(0, -1));

  if (action.layersSnapshot) {
    const current = get(layers);
    undoStack.update(u => [...u, { ...action, layersSnapshot: current }]);
    layers.set(action.layersSnapshot);
    if (action.layersSnapshot.length > 0) {
      activeLayerId.set(action.layersSnapshot[0].id);
    }
    return;
  }

  // Apply next stitches
  layers.update(ls => ls.map(l => {
    if (l.id === action.layerId) {
      const updated = { ...l.stitches };
      for (const [key, nextStitch] of Object.entries(action.after)) {
        if (nextStitch === null) {
          delete updated[key];
        } else {
          updated[key] = nextStitch;
        }
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  // Push to undo
  undoStack.update(u => [...u, action]);
}

export function addColorToActivePalette(entry: { code: string; name: string; hex: string; brandId?: string }) {
  palette.update(pal => {
    // Check if already in palette
    const existing = pal.find(p => p.dmc === entry.code && (!entry.brandId || p.brand === entry.brandId));
    if (existing) {
      selectedColorId.set(existing.id);
      return pal;
    }
    const nextId = pal.length > 0 ? Math.max(...pal.map(p => p.id)) + 1 : 1;
    const newColor: PaletteColor = {
      id: nextId,
      dmc: entry.code,
      name: entry.name,
      hex: entry.hex,
      brand: entry.brandId || 'dmc',
      symbol: CHART_SYMBOLS[(pal.length) % CHART_SYMBOLS.length],
      symbolColor: getHighContrastTextColor(entry.hex)
    };
    selectedColorId.set(nextId);
    return [...pal, newColor];
  });
}

export function updatePaletteColorSymbol(colorId: number, symbol: string) {
  palette.update(pal => pal.map(c => c.id === colorId ? { ...c, symbol } : c));
}

export function updatePaletteColorHex(colorId: number, hex: string) {
  palette.update(pal => pal.map(c => c.id === colorId ? { 
    ...c, 
    hex, 
    symbolColor: getHighContrastTextColor(hex) 
  } : c));
}

export interface PatternBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  totalStitches: number;
  patternStitches: number;
  pasteboardStitches: number;
}

// Live bounding box and total stitch count across all visible layers (Artboard vs Pasteboard)
export const patternBounds = derived([layers, grid], ([$layers, $grid]): PatternBounds | null => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let patternStitches = 0;
  let pasteboardStitches = 0;

  for (const layer of $layers) {
    if (!layer.visible) continue;
    for (const key of Object.keys(layer.stitches)) {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);
      const isInside = x >= 0 && x < $grid.width && y >= 0 && y < $grid.height;
      if (isInside) {
        patternStitches++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      } else {
        pasteboardStitches++;
      }
    }
  }

  const totalStitches = patternStitches + pasteboardStitches;
  if (totalStitches === 0) return null;

  return {
    minX: patternStitches > 0 ? minX : 0,
    minY: patternStitches > 0 ? minY : 0,
    maxX: patternStitches > 0 ? maxX : 0,
    maxY: patternStitches > 0 ? maxY : 0,
    width: patternStitches > 0 ? maxX - minX + 1 : 0,
    height: patternStitches > 0 ? maxY - minY + 1 : 0,
    totalStitches,
    patternStitches,
    pasteboardStitches
  };
});

export function setFabricCount(count: number) {
  grid.update(g => ({ ...g, fabricCount: Math.max(1, count) }));
}

export function resizeGrid(newWidth: number, newHeight: number, anchor: 'center' | 'top-left' = 'top-left') {
  const currentGrid = get(grid);
  const oldWidth = currentGrid.width;
  const oldHeight = currentGrid.height;
  if (newWidth === oldWidth && newHeight === oldHeight) return;

  const dx = anchor === 'center' ? Math.floor((newWidth - oldWidth) / 2) : 0;
  const dy = anchor === 'center' ? Math.floor((newHeight - oldHeight) / 2) : 0;

  grid.update(g => ({ ...g, width: newWidth, height: newHeight }));

  layers.update(ls => ls.map(l => {
    const newStitches: Record<string, Stitch> = {};
    for (const [key, stitch] of Object.entries(l.stitches)) {
      const [xStr, yStr] = key.split(',');
      const nx = parseInt(xStr, 10) + dx;
      const ny = parseInt(yStr, 10) + dy;
      if (nx >= 0 && nx < newWidth && ny >= 0 && ny < newHeight) {
        newStitches[`${nx},${ny}`] = stitch;
      }
    }
    return { ...l, stitches: newStitches };
  }));
}

export function clearCurrentLayer() {
  const currentLayers = get(layers);
  const activeId = get(activeLayerId);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!targetLayer || targetLayer.locked) return;
  if (Object.keys(targetLayer.stitches).length === 0) return;

  const beforeDelta: Record<string, Stitch | null> = {};
  for (const [key, stitch] of Object.entries(targetLayer.stitches)) {
    beforeDelta[key] = { ...stitch };
  }

  undoStack.update(u => [
    ...u,
    {
      description: `Clear Layer "${targetLayer.name}"`,
      layerId: activeId,
      before: beforeDelta,
      after: {}
    }
  ]);
  redoStack.set([]);

  layers.update(ls => ls.map(l => l.id === activeId ? { ...l, stitches: {} } : l));
}

// Project metadata
export const projectName = writable<string>('Untitled Pattern');
export const isSaveModalOpen = writable<boolean>(false);
export const initialSaveTab = writable<'pdf' | 'oxs' | 'xstitch'>('pdf');

export function saveProjectFile(customFileName?: string) {
  const currentName = get(projectName) || 'Untitled Pattern';
  let fileName = customFileName?.trim() || `${currentName}.xstitch`;
  if (!fileName.toLowerCase().endsWith('.xstitch')) {
    fileName += '.xstitch';
  }

  const data = {
    version: '1.0',
    generator: 'XStitcher Studio',
    name: currentName,
    timestamp: new Date().toISOString(),
    grid: get(grid),
    fabricColor: get(fabricColor),
    palette: get(palette),
    layers: get(layers)
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadCompleteProject(data: {
  name?: string;
  grid?: GridDimensions;
  palette?: PaletteColor[];
  layers?: Layer[];
  fabricColor?: string;
}) {
  if (data.name) projectName.set(data.name);
  if (data.grid) grid.set(data.grid);
  if (data.palette) palette.set(data.palette);
  if (data.layers) layers.set(data.layers);
  if (data.fabricColor) fabricColor.set(data.fabricColor);
  undoStack.set([]);
  redoStack.set([]);
  triggerZoomToFit();
}

export function resetProject(dimensions: GridDimensions & { name?: string }, paletteChoice: 'default' | 'minimal' = 'default') {
  grid.set({
    width: dimensions.width,
    height: dimensions.height,
    fabricCount: dimensions.fabricCount
  });
  if (dimensions.name !== undefined) {
    projectName.set(dimensions.name.trim() || 'Untitled Pattern');
  } else {
    projectName.set('Untitled Pattern');
  }
  const baseLayer: Layer = {
    id: `layer-${Date.now()}`,
    name: 'Base Pattern',
    visible: true,
    locked: false,
    opacity: 1.0,
    stitches: {}
  };
  layers.set([baseLayer]);
  activeLayerId.set(baseLayer.id);
  const newPalette = paletteChoice === 'default' ? createDefaultPalette() : createDefaultPalette().slice(0, 3);
  palette.set(newPalette);
  selectedColorId.set(newPalette[0].id);
  undoStack.set([]);
  redoStack.set([]);
  activeTool.set('pencil');
  triggerZoomToFit();
}

// Global modal triggers & viewport signals
export const zoomToFitTrigger = writable<number>(0);
export function triggerZoomToFit() {
  zoomToFitTrigger.update(n => n + 1);
}

export const isNewProjectModalOpen = writable<boolean>(false);
export const isCanvasSizeModalOpen = writable<boolean>(false);
export const isShortcutsModalOpen = writable<boolean>(false);
export const isFabricCountModalOpen = writable<boolean>(false);
export const isClearLayerModalOpen = writable<boolean>(false);
export const isBorderModalOpen = writable<boolean>(false);
export const isMotifLibraryModalOpen = writable<boolean>(false);
export const borderInitialMotif = writable<MotifStamp | null>(null);
export const isTextModalOpen = writable<boolean>(false);
export const editingTextLayerId = writable<string | null>(null);
export const hideNonStitchLayers = writable<boolean>(false);

export function toggleHideNonStitchLayers() {
  hideNonStitchLayers.update(h => !h);
}

export type MeasurementUnit = 'in' | 'cm';
export const measurementUnit = writable<MeasurementUnit>('in');

export function formatDimension(stitches: number, fabricCount: number, unit: MeasurementUnit): string {
  if (unit === 'cm') {
    return `${((stitches / fabricCount) * 2.54).toFixed(1)} cm`;
  }
  return `${(stitches / fabricCount).toFixed(1)}"`;
}

export function formatDimensions(width: number, height: number, fabricCount: number, unit: MeasurementUnit): string {
  if (unit === 'cm') {
    const cmW = ((width / fabricCount) * 2.54).toFixed(1);
    const cmH = ((height / fabricCount) * 2.54).toFixed(1);
    return `${cmW} × ${cmH} cm`;
  }
  const inW = (width / fabricCount).toFixed(1);
  const inH = (height / fabricCount).toFixed(1);
  return `${inW}" × ${inH}"`;
}

// Standard Cross-Stitch Aida Fabric Color Presets
export const FABRIC_COLOR_PRESETS: FabricColorPreset[] = [
  { id: 'white', name: 'Bright White', hex: '#FFFFFF' },
  { id: 'antique_white', name: 'Antique White / Ecru', hex: '#F9F6EE' },
  { id: 'oatmeal', name: 'Natural Oatmeal / Flax', hex: '#E7DEC8' },
  { id: 'sky_blue', name: 'Pale Sky Blue', hex: '#E3ECF5' },
  { id: 'sage', name: 'Vintage Sage Green', hex: '#DEE5DA' },
  { id: 'dusty_rose', name: 'Dusty Rose', hex: '#F4E7E7' },
  { id: 'charcoal', name: 'Charcoal Black', hex: '#1C1C22' }
];

export const fabricColor = writable<string>('#F9F6EE');

export function setFabricColor(hex: string) {
  fabricColor.set(hex);
}

// Milestone 4: Shape Tools & Motif Stamps
export const shapeFillMode = writable<ShapeFillMode>('outline');
export const activeStamp = writable<MotifStamp | null>(null);

export function ensureDmcInPalette(dmcCode: string): number {
  const currentPal = get(palette);
  const existing = currentPal.find(p => p.dmc === dmcCode);
  if (existing) return existing.id;

  const entry = DMC_CATALOG.find(d => d.code === dmcCode) || DMC_CATALOG[0];
  const nextId = currentPal.length > 0 ? Math.max(...currentPal.map(p => p.id)) + 1 : 1;
  const newColor: PaletteColor = {
    id: nextId,
    dmc: entry.code,
    name: entry.name,
    hex: entry.hex,
    symbol: CHART_SYMBOLS[(currentPal.length) % CHART_SYMBOLS.length],
    symbolColor: getHighContrastTextColor(entry.hex)
  };
  palette.update(pal => [...pal, newColor]);
  return nextId;
}

// ==========================================
// Selection & Clipboard Actions (Milestone 3)
// ==========================================

export function setSelection(box: SelectionBox | null) {
  selection.set(box);
}

export function clearSelection() {
  selection.set(null);
}

export function selectAll() {
  const g = get(grid);
  selection.set({
    x: 0,
    y: 0,
    width: g.width,
    height: g.height
  });
  activeTool.set('select');
}

export function copySelection(): boolean {
  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer) return false;

  const relStitches: Record<string, Stitch> = {};
  if (sel.cells) {
    for (const key of sel.cells) {
      const s = targetLayer.stitches[key];
      if (s) {
        const [x, y] = key.split(',').map(Number);
        relStitches[`${x - sel.x},${y - sel.y}`] = { ...s };
      }
    }
  } else {
    for (let y = sel.y; y < sel.y + sel.height; y++) {
      for (let x = sel.x; x < sel.x + sel.width; x++) {
        const s = targetLayer.stitches[`${x},${y}`];
        if (s) {
          relStitches[`${x - sel.x},${y - sel.y}`] = { ...s };
        }
      }
    }
  }

  clipboard.set({
    width: sel.width,
    height: sel.height,
    stitches: relStitches
  });
  return true;
}

export function cutSelection(): boolean {
  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer || targetLayer.locked) return false;

  copySelection();

  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  const keysToDelete = sel.cells ? Array.from(sel.cells) : [];
  if (!sel.cells) {
    for (let y = sel.y; y < sel.y + sel.height; y++) {
      for (let x = sel.x; x < sel.x + sel.width; x++) {
        keysToDelete.push(`${x},${y}`);
      }
    }
  }

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };
      for (const key of keysToDelete) {
        if (updated[key]) {
          beforeDelta[key] = { ...updated[key] };
          afterDelta[key] = null;
          delete updated[key];
        }
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  if (Object.keys(beforeDelta).length > 0) {
    undoStack.update(u => [
      ...u,
      {
        description: 'Cut Selection',
        layerId: activeId,
        before: beforeDelta,
        after: afterDelta
      }
    ]);
    redoStack.set([]);
  }

  selection.set(null);
  return true;
}

/**
 * Lifts stitches inside the active selection into a floating selection in-place,
 * ready for immediate interactive dragging without jumping to the center of the screen.
 * If copyInstead is true (e.g. Alt/Option + drag), the original stitches remain.
 */
export function liftSelection(copyInstead = false): boolean {
  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer || targetLayer.locked) return false;

  const relStitches: Record<string, Stitch> = {};
  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  const keys = sel.cells ? Array.from(sel.cells) : [];
  if (!sel.cells) {
    for (let y = sel.y; y < sel.y + sel.height; y++) {
      for (let x = sel.x; x < sel.x + sel.width; x++) {
        keys.push(`${x},${y}`);
      }
    }
  }

  for (const key of keys) {
    const s = targetLayer.stitches[key];
    if (s) {
      const [x, y] = key.split(',').map(Number);
      relStitches[`${x - sel.x},${y - sel.y}`] = { ...s };
      if (!copyInstead) {
        beforeDelta[key] = { ...s };
        afterDelta[key] = null;
      }
    }
  }

  if (Object.keys(relStitches).length === 0) return false;

  if (!copyInstead && Object.keys(beforeDelta).length > 0) {
    layers.update(ls => ls.map(l => {
      if (l.id === activeId) {
        const updated = { ...l.stitches };
        for (const key of Object.keys(beforeDelta)) {
          delete updated[key];
        }
        return { ...l, stitches: updated };
      }
      return l;
    }));

    undoStack.update(u => [
      ...u,
      {
        description: 'Move Selection',
        layerId: activeId,
        before: beforeDelta,
        after: afterDelta
      }
    ]);
    redoStack.set([]);
  }

  floatingSelection.set({
    x: sel.x,
    y: sel.y,
    width: sel.width,
    height: sel.height,
    stitches: relStitches
  });

  selection.set(null);
  return true;
}

/**
 * Translates all stitches on the active layer by (dx, dy).
 * Used by the Move Tool when dragging with no selection.
 */
export function offsetLayerStitches(layerId: string, dx: number, dy: number) {
  if (dx === 0 && dy === 0) return;
  const currentLayers = get(layers);
  const target = currentLayers.find(l => l.id === layerId);
  if (!target || target.locked) return;

  const g = get(grid);
  const updatedStitches: Record<string, Stitch> = {};

  for (const [key, stitch] of Object.entries(target.stitches)) {
    const [x, y] = key.split(',').map(Number);
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < g.width && ny >= 0 && ny < g.height) {
      updatedStitches[`${nx},${ny}`] = { ...stitch };
    }
  }

  layers.update(ls => ls.map(l => {
    if (l.id === layerId) {
      return { ...l, stitches: updatedStitches };
    }
    return l;
  }));
}

/**
 * Commits a layer stitch move action with sparse undo/redo.
 */
export function commitLayerStitchesMove(
  layerId: string,
  initialStitches: Record<string, Stitch>,
  finalStitches: Record<string, Stitch>
) {
  const currentLayers = get(layers);
  const target = currentLayers.find(l => l.id === layerId);
  if (!target) return;

  const before: Record<string, Stitch | null> = {};
  const after: Record<string, Stitch | null> = {};
  const allKeys = new Set([...Object.keys(initialStitches), ...Object.keys(finalStitches)]);
  let hasChange = false;

  for (const k of allKeys) {
    const sInit = initialStitches[k];
    const sFinal = finalStitches[k];
    if (!sInit && sFinal) {
      before[k] = null;
      after[k] = { ...sFinal };
      hasChange = true;
    } else if (sInit && !sFinal) {
      before[k] = { ...sInit };
      after[k] = null;
      hasChange = true;
    } else if (sInit && sFinal && (sInit.colorId !== sFinal.colorId || sInit.symbol !== sFinal.symbol)) {
      before[k] = { ...sInit };
      after[k] = { ...sFinal };
      hasChange = true;
    }
  }

  if (hasChange) {
    undoStack.update(stack => [
      ...stack.slice(-50),
      {
        description: 'Move Layer Stitches',
        layerId,
        before,
        after
      }
    ]);
    redoStack.set([]);
  }
}

/**
 * Deletes all stitches inside the active selection on the active layer (Delete / Backspace).
 */
export function deleteSelection(): boolean {
  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer || targetLayer.locked) return false;

  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  const keysToDelete = sel.cells ? Array.from(sel.cells) : [];
  if (!sel.cells) {
    for (let y = sel.y; y < sel.y + sel.height; y++) {
      for (let x = sel.x; x < sel.x + sel.width; x++) {
        keysToDelete.push(`${x},${y}`);
      }
    }
  }

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };
      for (const key of keysToDelete) {
        if (updated[key]) {
          beforeDelta[key] = { ...updated[key] };
          afterDelta[key] = null;
          delete updated[key];
        }
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  if (Object.keys(beforeDelta).length > 0) {
    undoStack.update(u => [
      ...u,
      {
        description: 'Delete Selected Stitches',
        layerId: activeId,
        before: beforeDelta,
        after: afterDelta
      }
    ]);
    redoStack.set([]);
    return true;
  }

  return false;
}

export function invertCurrentSelection() {
  const g = get(grid);
  const sel = get(selection);
  const inverted = invertSelection(sel, g.width, g.height);
  selection.set(inverted);
}

export function growCurrentSelection() {
  const g = get(grid);
  const sel = get(selection);
  const grown = growSelection(sel, g.width, g.height);
  if (grown) selection.set(grown);
}

export function shrinkCurrentSelection() {
  const g = get(grid);
  const sel = get(selection);
  const shrunk = shrinkSelection(sel, g.width, g.height);
  selection.set(shrunk);
}

// Active Thread Brand ('dmc' | 'anchor' | 'cosmo' | 'rainbow')
export const activeThreadBrand = writable<string>('dmc');

/**
 * Swaps a specific palette color across the pattern with a chosen replacement thread.
 */
export function swapPaletteColor(
  targetColorId: number,
  newThread: { code: string; name: string; hex: string; brandId?: string }
) {
  const currentPalette = get(palette);
  const currentLayers = get(layers);

  const targetColor = currentPalette.find(c => c.id === targetColorId);
  if (!targetColor) return;

  // Check if newThread already exists in the palette under another color ID
  const existingSameColor = currentPalette.find(c => c.dmc === newThread.code && c.id !== targetColorId);

  // Snapshot layers and palette for undo
  const oldLayersSnapshot = JSON.parse(JSON.stringify(currentLayers));

  if (existingSameColor) {
    // Merge targetColor into existingSameColor across all layers
    const targetId = existingSameColor.id;
    layers.update(ls => ls.map(l => {
      if (l.type === 'image') return l;
      const updated = { ...l.stitches };
      let changed = false;
      for (const [key, stitch] of Object.entries(updated)) {
        if (stitch.colorId === targetColorId) {
          updated[key] = { ...stitch, colorId: targetId };
          changed = true;
        }
      }
      return changed ? { ...l, stitches: updated } : l;
    }));

    // Remove targetColor from palette
    palette.update(ps => ps.filter(c => c.id !== targetColorId));
    if (get(selectedColorId) === targetColorId) {
      selectedColorId.set(targetId);
    }
  } else {
    // In-place replace of the thread details
    palette.update(ps => ps.map(c => {
      if (c.id === targetColorId) {
        return {
          ...c,
          dmc: newThread.code,
          name: newThread.name,
          hex: newThread.hex,
          brand: newThread.brandId || 'dmc'
        };
      }
      return c;
    }));
  }

  // Record Undo Delta
  undoStack.update(u => [
    ...u,
    {
      description: `Swap Thread ${targetColor.dmc} → ${newThread.code}`,
      layerId: get(activeLayerId),
      before: {},
      after: {},
      layersSnapshot: oldLayersSnapshot
    }
  ]);
  redoStack.set([]);
}

/**
 * Performs a global closest-match color swap for all open pattern colors to a target thread brand.
 */
export function convertProjectToBrand(targetBrandId: string) {
  const currentPalette = get(palette);
  const oldLayersSnapshot = JSON.parse(JSON.stringify(get(layers)));

  const { updatedPalette } = convertPaletteToBrand(currentPalette, targetBrandId);
  palette.set(updatedPalette);
  activeThreadBrand.set(targetBrandId);

  undoStack.update(u => [
    ...u,
    {
      description: `Convert to ${targetBrandId.toUpperCase()} Threads`,
      layerId: get(activeLayerId),
      before: {},
      after: {},
      layersSnapshot: oldLayersSnapshot
    }
  ]);
  redoStack.set([]);
}

export function pasteClipboard() {
  const clip = get(clipboard);
  if (!clip || Object.keys(clip.stitches).length === 0) return;

  const sel = get(selection);
  const g = get(grid);

  let startX = sel ? sel.x : Math.max(0, Math.floor((g.width - clip.width) / 2));
  let startY = sel ? sel.y : Math.max(0, Math.floor((g.height - clip.height) / 2));

  floatingSelection.set({
    x: startX,
    y: startY,
    width: clip.width,
    height: clip.height,
    stitches: { ...clip.stitches }
  });

  activeTool.set('select');
  selection.set(null);
}

export function commitFloatingSelection(): boolean {
  const floating = get(floatingSelection);
  if (!floating) return false;

  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!targetLayer || targetLayer.locked) {
    floatingSelection.set(null);
    return false;
  }

  const g = get(grid);
  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };
      for (const [relKey, stitch] of Object.entries(floating.stitches)) {
        const [rx, ry] = relKey.split(',').map(Number);
        const gx = floating.x + rx;
        const gy = floating.y + ry;
        if (gx >= -100 && gx < g.width + 100 && gy >= -100 && gy < g.height + 100) {
          const key = `${gx},${gy}`;
          beforeDelta[key] = updated[key] ? { ...updated[key] } : null;
          afterDelta[key] = { ...stitch };
          updated[key] = { ...stitch };
        }
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  if (Object.keys(afterDelta).length > 0) {
    undoStack.update(u => [
      ...u,
      {
        description: 'Paste Stitches',
        layerId: activeId,
        before: beforeDelta,
        after: afterDelta
      }
    ]);
    redoStack.set([]);
  }

  floatingSelection.set(null);
  return true;
}

export function cancelFloatingSelection() {
  floatingSelection.set(null);
}

export function flipHorizontal() {
  const floating = get(floatingSelection);
  if (floating) {
    const flipped: Record<string, Stitch> = {};
    for (const [relKey, stitch] of Object.entries(floating.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const newRx = floating.width - 1 - rx;
      flipped[`${newRx},${ry}`] = { ...stitch };
    }
    floatingSelection.set({ ...floating, stitches: flipped });
    return;
  }

  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer || targetLayer.locked) return;

  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };
      const boxStitches: Record<string, Stitch> = {};
      for (let y = sel.y; y < sel.y + sel.height; y++) {
        for (let x = sel.x; x < sel.x + sel.width; x++) {
          const key = `${x},${y}`;
          if (updated[key]) {
            beforeDelta[key] = { ...updated[key] };
            boxStitches[key] = { ...updated[key] };
            delete updated[key];
          }
        }
      }
      for (const [key, stitch] of Object.entries(boxStitches)) {
        const [x, y] = key.split(',').map(Number);
        const rx = x - sel.x;
        const newX = sel.x + (sel.width - 1 - rx);
        const newKey = `${newX},${y}`;
        updated[newKey] = stitch;
        afterDelta[newKey] = stitch;
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  undoStack.update(u => [
    ...u,
    {
      description: 'Flip Horizontal',
      layerId: activeId,
      before: beforeDelta,
      after: afterDelta
    }
  ]);
  redoStack.set([]);
}

export function flipVertical() {
  const floating = get(floatingSelection);
  if (floating) {
    const flipped: Record<string, Stitch> = {};
    for (const [relKey, stitch] of Object.entries(floating.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const newRy = floating.height - 1 - ry;
      flipped[`${rx},${newRy}`] = { ...stitch };
    }
    floatingSelection.set({ ...floating, stitches: flipped });
    return;
  }

  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer || targetLayer.locked) return;

  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };
      const boxStitches: Record<string, Stitch> = {};
      for (let y = sel.y; y < sel.y + sel.height; y++) {
        for (let x = sel.x; x < sel.x + sel.width; x++) {
          const key = `${x},${y}`;
          if (updated[key]) {
            beforeDelta[key] = { ...updated[key] };
            boxStitches[key] = { ...updated[key] };
            delete updated[key];
          }
        }
      }
      for (const [key, stitch] of Object.entries(boxStitches)) {
        const [x, y] = key.split(',').map(Number);
        const ry = y - sel.y;
        const newY = sel.y + (sel.height - 1 - ry);
        const newKey = `${x},${newY}`;
        updated[newKey] = stitch;
        afterDelta[newKey] = stitch;
      }
      return { ...l, stitches: updated };
    }
    return l;
  }));

  undoStack.update(u => [
    ...u,
    {
      description: 'Flip Vertical',
      layerId: activeId,
      before: beforeDelta,
      after: afterDelta
    }
  ]);
  redoStack.set([]);
}

export function rotate90(clockwise: boolean = true) {
  const floating = get(floatingSelection);
  if (floating) {
    const rotated: Record<string, Stitch> = {};
    const oldW = floating.width;
    const oldH = floating.height;
    for (const [relKey, stitch] of Object.entries(floating.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const newRx = clockwise ? oldH - 1 - ry : ry;
      const newRy = clockwise ? rx : oldW - 1 - rx;
      rotated[`${newRx},${newRy}`] = { ...stitch };
    }
    floatingSelection.set({
      x: floating.x,
      y: floating.y,
      width: oldH,
      height: oldW,
      stitches: rotated
    });
    return;
  }

  const sel = get(selection);
  if (sel) {
    cutSelection();
    pasteClipboard();
    rotate90(clockwise);
  }
}

// ==========================================
// Layer Stack Operations (Milestone 3)
// ==========================================

export function duplicateLayer(id: string) {
  const currentLayers = get(layers);
  const index = currentLayers.findIndex(l => l.id === id);
  if (index === -1) return;

  const src = currentLayers[index];
  const newId = `layer-${Date.now()}`;
  const duplicated: Layer = {
    ...src,
    id: newId,
    name: `${src.name} Copy`,
    stitches: { ...src.stitches }
  };

  const next = [...currentLayers];
  next.splice(index + 1, 0, duplicated);
  layers.set(next);
  activeLayerId.set(newId);
}

export function moveLayer(id: string, direction: 'up' | 'down') {
  const currentLayers = get(layers);
  const index = currentLayers.findIndex(l => l.id === id);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= currentLayers.length) return;

  const next = [...currentLayers];
  const [removed] = next.splice(index, 1);
  next.splice(targetIndex, 0, removed);
  layers.set(next);
}

export function mergeLayerDown(id: string) {
  const currentLayers = get(layers);
  const index = currentLayers.findIndex(l => l.id === id);
  if (index <= 0) return; // Cannot merge down bottom-most layer

  const upper = currentLayers[index];
  const lower = currentLayers[index - 1];

  const mergedStitches = {
    ...lower.stitches,
    ...upper.stitches
  };

  const next = currentLayers.filter(l => l.id !== id).map(l => {
    if (l.id === lower.id) {
      return { ...l, stitches: mergedStitches };
    }
    return l;
  });

  layers.set(next);
  activeLayerId.set(lower.id);
}

export function renameLayer(id: string, newName: string) {
  const trimmed = newName.trim();
  if (!trimmed) return;
  layers.update(ls => ls.map(l => l.id === id ? { ...l, name: trimmed } : l));
}

export function reorderLayers(newOrderedLayers: Layer[]) {
  layers.set(newOrderedLayers);
}

export function flattenAllLayers() {
  const currentLayers = get(layers);
  if (currentLayers.length <= 1) return;

  const flattenedStitches: Record<string, Stitch> = {};
  for (const l of currentLayers) {
    if (!l.visible) continue;
    for (const [key, stitch] of Object.entries(l.stitches)) {
      flattenedStitches[key] = { ...stitch };
    }
  }

  const baseLayerId = `layer-${Date.now()}`;
  const baseLayer: Layer = {
    id: baseLayerId,
    name: 'Flattened Pattern',
    visible: true,
    locked: false,
    opacity: 1.0,
    stitches: flattenedStitches
  };

  undoStack.update(u => [
    ...u,
    {
      description: 'Flatten All Layers',
      layerId: baseLayerId,
      before: {},
      after: {},
      layersSnapshot: currentLayers
    }
  ]);
  redoStack.set([]);

  layers.set([baseLayer]);
  activeLayerId.set(baseLayerId);
}

// ==========================================
// Reference Image & Digitizer Operations (Milestone 5)
// ==========================================

export const isDigitizerModalOpen = writable<boolean>(false);
export const digitizerSourceLayerId = writable<string | null>(null);

export function setLayerOpacity(layerId: string, opacity: number) {
  layers.update(ls => ls.map(l => l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l));
}

export function toggleLayerVisibility(layerId: string) {
  layers.update(ls => ls.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
}

export async function addReferenceImageLayer(
  src: string,
  name: string = 'Reference Image',
  naturalWidth?: number,
  naturalHeight?: number
): Promise<string> {
  const currentGrid = get(grid);

  let nw = naturalWidth || 0;
  let nh = naturalHeight || 0;

  if (!nw || !nh) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        nw = img.naturalWidth;
        nh = img.naturalHeight;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  // Calculate initial fitting size (around 70-80% of canvas grid dimensions)
  const maxW = Math.max(10, Math.floor(currentGrid.width * 0.75));
  const maxH = Math.max(10, Math.floor(currentGrid.height * 0.75));

  let w = maxW;
  let h = maxH;
  if (nw > 0 && nh > 0) {
    const scale = Math.min(maxW / nw, maxH / nh);
    w = Math.max(4, Math.round(nw * scale));
    h = Math.max(4, Math.round(nh * scale));
  }

  const x = Math.max(0, Math.floor((currentGrid.width - w) / 2));
  const y = Math.max(0, Math.floor((currentGrid.height - h) / 2));

  const newId = `layer-img-${Date.now()}`;
  const newLayer: Layer = {
    id: newId,
    name,
    type: 'image',
    visible: true,
    locked: false,
    opacity: 0.70,
    stitches: {},
    image: {
      src,
      naturalWidth: nw || w,
      naturalHeight: nh || h,
      x,
      y,
      width: w,
      height: h,
      rotation: 0
    }
  };

  const currentLayers = get(layers);
  layers.set([...currentLayers, newLayer]);
  activeLayerId.set(newId);

  undoStack.update(u => [
    ...u,
    {
      description: `Import ${name}`,
      layerId: newId,
      before: {},
      after: {},
      layersSnapshot: currentLayers
    }
  ]);
  redoStack.set([]);

  return newId;
}

/**
 * Helper to ensure a color exists in the palette and returns its palette ID.
 */
export function getOrAddPaletteColor(hex: string): number {
  const currentPal = get(palette);
  const existing = currentPal.find(p => p.hex.toLowerCase() === hex.toLowerCase());
  if (existing) return existing.id;

  let bestDMC = DMC_CATALOG[0];
  let minDiff = Infinity;
  const targetR = parseInt(hex.slice(1, 3), 16) || 0;
  const targetG = parseInt(hex.slice(3, 5), 16) || 0;
  const targetB = parseInt(hex.slice(5, 7), 16) || 0;
  for (const d of DMC_CATALOG) {
    const dr = parseInt(d.hex.slice(1, 3), 16) || 0;
    const dg = parseInt(d.hex.slice(3, 5), 16) || 0;
    const db = parseInt(d.hex.slice(5, 7), 16) || 0;
    const diff = (targetR - dr) ** 2 + (targetG - dg) ** 2 + (targetB - db) ** 2;
    if (diff < minDiff) {
      minDiff = diff;
      bestDMC = d;
      if (diff === 0) break;
    }
  }
  return addColorToPalette(bestDMC.code);
}

/**
 * Computes live cross-stitch cells for a text layer given its configuration.
 */
export function computeTextLayerStitches(
  textData: TextLayerData,
  colorId: number,
  gridWidth: number,
  gridHeight: number
): Record<string, Stitch> {
  const canvas = rasterizeTextLayer(
    textData.text,
    textData.fontFamily,
    textData.fontSize,
    '#000000',
    textData.bold,
    textData.italic,
    textData.align || 'left',
    textData.lineHeight ?? 1.25,
    textData.letterSpacing ?? 0
  );

  const padLeft = (canvas as any).padLeft || 0;
  const padTop = (canvas as any).padTop || 0;

  const ctx = canvas.getContext('2d');
  if (!ctx) return {};
  const sampleW = canvas.width;
  const sampleH = canvas.height;
  let sampleData = ctx.getImageData(0, 0, sampleW, sampleH).data;

  const rot = textData.rotation || 0;
  if (rot % 360 !== 0) {
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = sampleW;
    rotCanvas.height = sampleH;
    const rCtx = rotCanvas.getContext('2d');
    if (rCtx) {
      rCtx.save();
      rCtx.translate(sampleW / 2, sampleH / 2);
      rCtx.rotate((rot * Math.PI) / 180);
      rCtx.drawImage(canvas, -sampleW / 2, -sampleH / 2);
      rCtx.restore();
      sampleData = rCtx.getImageData(0, 0, sampleW, sampleH).data;
    }
  }

  const stitchesMap: Record<string, Stitch> = {};
  const originX = textData.x;
  const originY = textData.y;
  const thresholdAlpha = Math.round((textData.threshold ?? 0.35) * 255);

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const idx = (y * sampleW + x) * 4;
      const alpha = sampleData[idx + 3];
      if (alpha > thresholdAlpha) {
        const gx = originX + x - padLeft;
        const gy = originY + y - padTop;
        if (gx >= -150 && gx < gridWidth + 150 && gy >= -150 && gy < gridHeight + 150) {
          stitchesMap[`${gx},${gy}`] = {
            colorId,
            type: 'full'
          };
        }
      }
    }
  }

  return stitchesMap;
}

export function addTextLayer(config: {
  text: string;
  fontFamily: string;
  fontSize: number;
  color?: string;
  x?: number;
  y?: number;
  rotation?: number;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  threshold?: number;
}): string {
  const currentGrid = get(grid);
  const activeClr = get(activeColor);
  const color = config.color || activeClr.hex || '#000000';
  const colorId = getOrAddPaletteColor(color);

  const previewCanvas = rasterizeTextLayer(
    config.text,
    config.fontFamily,
    config.fontSize,
    color,
    config.bold,
    config.italic,
    config.align || 'left',
    config.lineHeight ?? 1.25,
    config.letterSpacing ?? 0
  );

  const padLeft = (previewCanvas as any).padLeft || 0;
  const padTop = (previewCanvas as any).padTop || 0;
  const w = previewCanvas.width;
  const h = previewCanvas.height;

  const x = config.x !== undefined ? config.x : Math.max(0, Math.floor((currentGrid.width - (w - padLeft * 2)) / 2));
  const y = config.y !== undefined ? config.y : Math.max(0, Math.floor((currentGrid.height - (h - padTop * 2)) / 2));

  const textData: TextLayerData = {
    text: config.text,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    color,
    x,
    y,
    width: w,
    height: h,
    rotation: config.rotation || 0,
    bold: config.bold || false,
    italic: config.italic || false,
    align: config.align || 'left',
    lineHeight: config.lineHeight ?? 1.25,
    letterSpacing: config.letterSpacing ?? 0,
    threshold: config.threshold ?? 0.35,
    padLeft,
    padTop
  };

  const initialStitches = computeTextLayerStitches(textData, colorId, currentGrid.width, currentGrid.height);

  const newId = `layer-text-${Date.now()}`;
  const shortText = config.text.split('\n')[0].slice(0, 16);
  const name = `Text: "${shortText}${config.text.length > 16 ? '...' : ''}"`;

  const newLayer: Layer = {
    id: newId,
    name,
    type: 'text',
    visible: true,
    locked: false,
    opacity: 1.0,
    stitches: initialStitches,
    textData,
    image: {
      src: previewCanvas.toDataURL(),
      naturalWidth: previewCanvas.width,
      naturalHeight: previewCanvas.height,
      x: x - padLeft,
      y: y - padTop,
      width: w,
      height: h,
      rotation: config.rotation || 0
    }
  };

  const currentLayers = get(layers);
  layers.set([...currentLayers, newLayer]);
  activeLayerId.set(newId);

  undoStack.update(u => [
    ...u,
    {
      description: `Add Text "${shortText}"`,
      layerId: newId,
      before: {},
      after: {},
      layersSnapshot: currentLayers
    }
  ]);
  redoStack.set([]);

  return newId;
}

export function updateTextLayer(layerId: string, updates: Partial<TextLayerData>) {
  const currentLayers = get(layers);
  const target = currentLayers.find(l => l.id === layerId);
  if (!target || target.type !== 'text' || !target.textData) return;

  const merged: TextLayerData = { ...target.textData, ...updates };
  const curGrid = get(grid);
  const colorId = getOrAddPaletteColor(merged.color);

  const previewCanvas = rasterizeTextLayer(
    merged.text,
    merged.fontFamily,
    merged.fontSize,
    merged.color,
    merged.bold,
    merged.italic,
    merged.align || 'left',
    merged.lineHeight ?? 1.25,
    merged.letterSpacing ?? 0
  );

  const padLeft = (previewCanvas as any).padLeft || 0;
  const padTop = (previewCanvas as any).padTop || 0;
  const w = previewCanvas.width;
  const h = previewCanvas.height;

  merged.width = w;
  merged.height = h;
  merged.padLeft = padLeft;
  merged.padTop = padTop;

  const updatedStitches = computeTextLayerStitches(merged, colorId, curGrid.width, curGrid.height);

  const shortText = merged.text.split('\n')[0].slice(0, 16);
  const name = `Text: "${shortText}${merged.text.length > 16 ? '...' : ''}"`;

  layers.update(ls => ls.map(l => {
    if (l.id === layerId) {
      return {
        ...l,
        name,
        stitches: updatedStitches,
        textData: merged,
        image: {
          src: previewCanvas.toDataURL(),
          naturalWidth: previewCanvas.width,
          naturalHeight: previewCanvas.height,
          x: merged.x - padLeft,
          y: merged.y - padTop,
          width: w,
          height: h,
          rotation: merged.rotation
        }
      };
    }
    return l;
  }));

  undoStack.update(u => [
    ...u,
    {
      description: `Edit Text "${shortText}"`,
      layerId,
      before: {},
      after: {},
      layersSnapshot: currentLayers
    }
  ]);
  redoStack.set([]);
}

export function openTextModal(layerId?: string) {
  editingTextLayerId.set(layerId || null);
  isTextModalOpen.set(true);
}

export function closeTextModal() {
  isTextModalOpen.set(false);
  editingTextLayerId.set(null);
}

/**
 * Permanently rasterizes/flattens a text layer into a normal stitch layer (Photoshop style).
 */
export function rasterizeTextLayerToStitches(layerId: string) {
  const currentLayers = get(layers);
  const target = currentLayers.find(l => l.id === layerId);
  if (!target || target.type !== 'text') return;

  const shortText = target.textData?.text ? target.textData.text.split('\n')[0].slice(0, 16) : 'Text';
  const newName = target.name.startsWith('Text:') ? `Stitches: "${shortText}"` : target.name;

  layers.update(ls => ls.map(l => {
    if (l.id === layerId) {
      return {
        ...l,
        name: newName,
        type: 'stitch',
        stitches: { ...target.stitches },
        textData: undefined,
        image: undefined
      };
    }
    return l;
  }));

  undoStack.update(u => [
    ...u,
    {
      description: `Rasterize Text Layer "${shortText}"`,
      layerId,
      before: {},
      after: {},
      layersSnapshot: currentLayers
    }
  ]);
  redoStack.set([]);
}

export function quickDigitizeTextLayer(layerId: string) {
  rasterizeTextLayerToStitches(layerId);
}

export function updateImageLayer(layerId: string, updates: Partial<ReferenceImage>) {
  const curGrid = get(grid);
  layers.update(ls => ls.map(l => {
    if (l.id === layerId && l.image) {
      const updatedImage = { ...l.image, ...updates };
      const padLeft = l.textData?.padLeft || 0;
      const padTop = l.textData?.padTop || 0;

      const updatedTextData = l.textData ? {
        ...l.textData,
        x: updatedImage.x + padLeft,
        y: updatedImage.y + padTop,
        width: updatedImage.width,
        height: updatedImage.height,
        rotation: updatedImage.rotation
      } : undefined;

      let updatedStitches = l.stitches;
      if (updatedTextData) {
        const colorId = getOrAddPaletteColor(updatedTextData.color);
        updatedStitches = computeTextLayerStitches(updatedTextData, colorId, curGrid.width, curGrid.height);
      }

      return {
        ...l,
        image: updatedImage,
        stitches: updatedStitches,
        ...(updatedTextData ? { textData: updatedTextData } : {})
      };
    }
    return l;
  }));
}

/**
 * Clears any stitches residing outside the pattern artboard [0..width-1, 0..height-1].
 * Useful for tidying up scratch work on the pasteboard.
 */
export function clearPasteboardStitches(layerId?: string) {
  const g = get(grid);
  const currentLayers = get(layers);

  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  layers.update(ls => ls.map(l => {
    if (layerId && l.id !== layerId) return l;
    if (l.locked) return l;
    const updated = { ...l.stitches };
    for (const [key, stitch] of Object.entries(l.stitches)) {
      const [x, y] = key.split(',').map(Number);
      if (x < 0 || x >= g.width || y < 0 || y >= g.height) {
        beforeDelta[key] = { ...stitch };
        afterDelta[key] = null;
        delete updated[key];
      }
    }
    return { ...l, stitches: updated };
  }));

  if (Object.keys(beforeDelta).length > 0) {
    undoStack.update(u => [
      ...u,
      {
        description: 'Clear Pasteboard Stitches',
        layerId: layerId || 'all',
        before: beforeDelta,
        after: afterDelta,
        layersSnapshot: currentLayers
      }
    ]);
    redoStack.set([]);
  }
}

export function rotateImageLayer(layerId: string, clockwise = true) {
  layers.update(ls => ls.map(l => {
    if (l.id === layerId && l.image) {
      const currentRot = l.image.rotation || 0;
      const nextRot = (currentRot + (clockwise ? 90 : 270)) % 360;
      return {
        ...l,
        image: {
          ...l.image,
          rotation: nextRot
        }
      };
    }
    return l;
  }));
}

export function fitImageLayerToCanvas(layerId: string) {
  const currentGrid = get(grid);
  layers.update(ls => ls.map(l => {
    if (l.id === layerId && l.image) {
      const nw = l.image.naturalWidth;
      const nh = l.image.naturalHeight;
      const scale = Math.min(currentGrid.width / nw, currentGrid.height / nh);
      const w = Math.max(4, Math.round(nw * scale));
      const h = Math.max(4, Math.round(nh * scale));
      const x = Math.max(0, Math.floor((currentGrid.width - w) / 2));
      const y = Math.max(0, Math.floor((currentGrid.height - h) / 2));
      return {
        ...l,
        image: {
          ...l.image,
          x,
          y,
          width: w,
          height: h
        }
      };
    }
    return l;
  }));
}

export function openDigitizerForLayer(layerId: string) {
  digitizerSourceLayerId.set(layerId);
  isDigitizerModalOpen.set(true);
}

export function closeDigitizerModal() {
  isDigitizerModalOpen.set(false);
  digitizerSourceLayerId.set(null);
}

export function applyDigitizedResult(
  sourceLayerId: string,
  result: DigitizerResult,
  options: DigitizerOptions
) {
  const currentLayers = get(layers);
  const srcLayer = currentLayers.find(l => l.id === sourceLayerId);
  const currentPalette = get(palette);

  // 1. Ensure all DMC colors used in result exist in palette
  const updatedPalette = [...currentPalette];
  const dmcToColorId = new Map<string, number>();

  for (const c of updatedPalette) {
    dmcToColorId.set(c.dmc, c.id);
  }

  const usedSymbols = new Set(updatedPalette.map(c => c.symbol));

  for (const dmcItem of result.palette) {
    if (!dmcToColorId.has(dmcItem.code)) {
      const nextId = Math.max(0, ...updatedPalette.map(c => c.id)) + 1;
      const nextSymbol = CHART_SYMBOLS.find(s => !usedSymbols.has(s)) || '#';
      usedSymbols.add(nextSymbol);

      const rgb = hexToRgb(dmcItem.hex);
      const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

      const newColor: PaletteColor = {
        id: nextId,
        dmc: dmcItem.code,
        name: dmcItem.name,
        hex: dmcItem.hex,
        symbol: nextSymbol,
        symbolColor: lum > 0.5 ? '#111827' : '#FFFFFF'
      };
      updatedPalette.push(newColor);
      dmcToColorId.set(dmcItem.code, nextId);
    }
  }

  palette.set(updatedPalette);

  // 2. Build stitches map
  const stitchesMap: Record<string, Stitch> = {};
  for (const cell of result.stitches) {
    const colorId = dmcToColorId.get(cell.dmc);
    if (colorId !== undefined) {
      stitchesMap[`${cell.x},${cell.y}`] = {
        colorId,
        type: cell.type
      };
    }
  }

  // 3. Create or update layer
  const newStitchLayerId = `layer-${Date.now()}`;
  const newStitchLayer: Layer = {
    id: newStitchLayerId,
    name: `Digitized: ${srcLayer?.name || 'Image'}`,
    type: 'stitch',
    visible: true,
    locked: false,
    opacity: 1.0,
    stitches: stitchesMap
  };

  let nextLayers = [...currentLayers];
  if (options.targetLayer === 'new') {
    const srcIndex = nextLayers.findIndex(l => l.id === sourceLayerId);
    if (srcIndex !== -1) {
      nextLayers.splice(srcIndex + 1, 0, newStitchLayer);
      if (!options.keepReferenceLayer) {
        nextLayers = nextLayers.filter(l => l.id !== sourceLayerId);
      } else {
        // Dim reference layer to 0.35 so stitches pop clearly
        nextLayers = nextLayers.map(l => l.id === sourceLayerId ? { ...l, opacity: Math.min(l.opacity, 0.35) } : l);
      }
    } else {
      nextLayers.push(newStitchLayer);
    }
  } else {
    // Merge into active layer
    const activeId = get(activeLayerId);
    nextLayers = nextLayers.map(l => {
      if (l.id === activeId) {
        return {
          ...l,
          stitches: { ...l.stitches, ...stitchesMap }
        };
      }
      return l;
    });
    if (!options.keepReferenceLayer && sourceLayerId !== activeId) {
      nextLayers = nextLayers.filter(l => l.id !== sourceLayerId);
    }
  }

  layers.set(nextLayers);
  activeLayerId.set(newStitchLayerId);

  // Record undo delta
  undoStack.update(u => [
    ...u,
    {
      description: `Digitize ${srcLayer?.name || 'Image'}`,
      layerId: newStitchLayerId,
      before: {},
      after: {},
      layersSnapshot: currentLayers
    }
  ]);
  redoStack.set([]);

  isDigitizerModalOpen.set(false);
}

// ==========================================
// Motif Stamp & Border Operations (Milestone 4)
// ==========================================

export function cancelActiveStamp() {
  activeStamp.set(null);
  const tool = get(activeTool);
  if (tool === 'stamp') {
    activeTool.set('pencil');
  }
}

export function rotateActiveStamp(clockwise: boolean = true) {
  const st = get(activeStamp);
  if (!st) return;

  const rotated: Record<string, { dmc: string; type: StitchType }> = {};
  for (const [relKey, stitch] of Object.entries(st.stitches)) {
    const [rx, ry] = relKey.split(',').map(Number);
    const newRx = clockwise ? st.height - 1 - ry : ry;
    const newRy = clockwise ? rx : st.width - 1 - rx;
    rotated[`${newRx},${newRy}`] = stitch;
  }

  activeStamp.set({
    ...st,
    width: st.height,
    height: st.width,
    stitches: rotated
  });
}

export function flipActiveStampHorizontal() {
  const st = get(activeStamp);
  if (!st) return;

  const flipped: Record<string, { dmc: string; type: StitchType }> = {};
  for (const [relKey, stitch] of Object.entries(st.stitches)) {
    const [rx, ry] = relKey.split(',').map(Number);
    const newRx = st.width - 1 - rx;
    const newRy = ry;
    flipped[`${newRx},${newRy}`] = stitch;
  }

  activeStamp.set({
    ...st,
    stitches: flipped
  });
}

export function flipActiveStampVertical() {
  const st = get(activeStamp);
  if (!st) return;

  const flipped: Record<string, { dmc: string; type: StitchType }> = {};
  for (const [relKey, stitch] of Object.entries(st.stitches)) {
    const [rx, ry] = relKey.split(',').map(Number);
    const newRx = rx;
    const newRy = st.height - 1 - ry;
    flipped[`${newRx},${newRy}`] = stitch;
  }

  activeStamp.set({
    ...st,
    stitches: flipped
  });
}

export function applyStampAt(
  originX: number,
  originY: number,
  stamp: MotifStamp,
  useActiveColor: boolean = false
): boolean {
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!targetLayer || targetLayer.locked) return false;

  const g = get(grid);
  const fallbackColorId = get(selectedColorId);
  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  layers.update(ls => ls.map(l => {
    if (l.id === activeId) {
      const updated = { ...l.stitches };

      for (const [relKey, stitch] of Object.entries(stamp.stitches)) {
        const [rx, ry] = relKey.split(',').map(Number);
        const gx = originX + rx;
        const gy = originY + ry;

        if (gx >= 0 && gx < g.width && gy >= 0 && gy < g.height) {
          const key = `${gx},${gy}`;
          const colorId = useActiveColor ? fallbackColorId : ensureDmcInPalette(stitch.dmc);
          const newStitch: Stitch = { colorId, type: stitch.type };

          beforeDelta[key] = updated[key] ? { ...updated[key] } : null;
          afterDelta[key] = newStitch;
          updated[key] = newStitch;
        }
      }

      return { ...l, stitches: updated };
    }
    return l;
  }));

  if (Object.keys(afterDelta).length > 0) {
    undoStack.update(u => [
      ...u,
      {
        description: `Stamp "${stamp.name}"`,
        layerId: activeId,
        before: beforeDelta,
        after: afterDelta
      }
    ]);
    redoStack.set([]);
  }

  return true;
}

export function applyBorderStitches(
  placedStitches: PlacedStitch[],
  targetLayerOption: 'active' | 'new' = 'active',
  borderName: string = 'Border',
  useActiveColor: boolean = false
): void {
  if (placedStitches.length === 0) return;

  const g = get(grid);
  const fallbackColorId = get(selectedColorId);
  let targetId = get(activeLayerId);

  if (targetLayerOption === 'new') {
    const newLayerId = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id: newLayerId,
      name: borderName,
      visible: true,
      locked: false,
      opacity: 1.0,
      stitches: {}
    };
    layers.update(ls => [...ls, newLayer]);
    activeLayerId.set(newLayerId);
    targetId = newLayerId;
  }

  const beforeDelta: Record<string, Stitch | null> = {};
  const afterDelta: Record<string, Stitch | null> = {};

  layers.update(ls => ls.map(l => {
    if (l.id === targetId) {
      const updated = { ...l.stitches };

      for (const s of placedStitches) {
        if (s.x >= 0 && s.x < g.width && s.y >= 0 && s.y < g.height) {
          const key = `${s.x},${s.y}`;
          const colorId = useActiveColor ? fallbackColorId : ensureDmcInPalette(s.dmc);
          const stitch: Stitch = { colorId, type: s.type };

          beforeDelta[key] = updated[key] ? { ...updated[key] } : null;
          afterDelta[key] = stitch;
          updated[key] = stitch;
        }
      }

      return { ...l, stitches: updated };
    }
    return l;
  }));

  if (Object.keys(afterDelta).length > 0) {
    undoStack.update(u => [
      ...u,
      {
        description: `Apply Border (${placedStitches.length} st)`,
        layerId: targetId,
        before: beforeDelta,
        after: afterDelta
      }
    ]);
    redoStack.set([]);
  }
}

export function saveSelectionAsStamp(
  name: string,
  category: 'corners' | 'accents' | 'alphabets' | 'borders' | 'custom' = 'custom'
): MotifStamp | null {
  const sel = get(selection);
  const activeId = get(activeLayerId);
  const currentLayers = get(layers);
  const targetLayer = currentLayers.find(l => l.id === activeId);
  if (!sel || !targetLayer) return null;

  const currentPal = get(palette);
  const palMap = new Map(currentPal.map(p => [p.id, p.dmc]));
  const relStitches: Record<string, { dmc: string; type: StitchType }> = {};
  let stitchCount = 0;

  for (let y = sel.y; y < sel.y + sel.height; y++) {
    for (let x = sel.x; x < sel.x + sel.width; x++) {
      const s = targetLayer.stitches[`${x},${y}`];
      if (s) {
        const dmcCode = palMap.get(s.colorId) || '310';
        relStitches[`${x - sel.x},${y - sel.y}`] = {
          dmc: dmcCode,
          type: s.type
        };
        stitchCount++;
      }
    }
  }

  if (stitchCount === 0) return null;

  const stamp: MotifStamp = {
    id: `custom-${Date.now()}`,
    name: name.trim() || `Custom Stamp ${new Date().toLocaleDateString()}`,
    category,
    width: sel.width,
    height: sel.height,
    stitches: relStitches
  };

  saveCustomStamp(stamp);
  return stamp;
}

export function saveClipboardAsStamp(
  name: string,
  category: 'corners' | 'accents' | 'alphabets' | 'borders' | 'custom' = 'custom'
): MotifStamp | null {
  const clip = get(clipboard);
  if (!clip || Object.keys(clip.stitches).length === 0) return null;

  const currentPal = get(palette);
  const palMap = new Map(currentPal.map(p => [p.id, p.dmc]));
  const relStitches: Record<string, { dmc: string; type: StitchType }> = {};

  for (const [relKey, stitch] of Object.entries(clip.stitches)) {
    const dmcCode = palMap.get(stitch.colorId) || '310';
    relStitches[relKey] = {
      dmc: dmcCode,
      type: stitch.type
    };
  }

  const stamp: MotifStamp = {
    id: `custom-${Date.now()}`,
    name: name.trim() || `Clipboard Stamp ${new Date().toLocaleDateString()}`,
    category,
    width: clip.width,
    height: clip.height,
    stitches: relStitches
  };

  saveCustomStamp(stamp);
  return stamp;
}



