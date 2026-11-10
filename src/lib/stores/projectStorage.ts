import { writable, get } from 'svelte/store';
import type { GridDimensions, Layer, PaletteColor } from '../types';
import {
  projectName,
  grid,
  fabricColor,
  palette,
  layers,
  activeLayerId,
  undoStack,
  redoStack,
  triggerZoomToFit,
  registerNewProjectSessionHook
} from './editorStore';
import { getCachedImageElement } from '../engine/renderer';

export interface SavedProjectRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  stitchCount: number;
  thumbnailDataUrl?: string;
  grid: GridDimensions;
  fabricColor: string;
  palette: PaletteColor[];
  layers: Layer[];
}

const DB_NAME = 'runstitch_studio_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_META = 'meta';

export const currentProjectId = writable<string>('');
export const savedProjectsList = writable<SavedProjectRecord[]>([]);
export const autosaveStatus = writable<'idle' | 'saving' | 'saved' | 'error'>('idle');
export const lastSavedAt = writable<Date | null>(null);
export const isProjectLibraryModalOpen = writable<boolean>(false);

let dbPromise: Promise<IDBDatabase> | null = null;
let isRestoringProject = false;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let storageInitialized = false;

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function getMeta(key: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const req = tx.objectStore(STORE_META).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

async function setMeta(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putProjectRecord(record: SavedProjectRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getProjectRecord(id: string): Promise<SavedProjectRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const req = tx.objectStore(STORE_PROJECTS).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function getAllProjectRecords(): Promise<SavedProjectRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const req = tx.objectStore(STORE_PROJECTS).getAll();
    req.onsuccess = () => {
      const list = (req.result || []) as SavedProjectRecord[];
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteProjectRecordFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function isBlankUntitledRecord(rec: SavedProjectRecord | null): boolean {
  if (!rec) return false;
  if (rec.stitchCount > 0) return false;
  if (rec.name && rec.name !== 'Untitled Pattern') return false;
  if (rec.layers.some(l => l.image || l.textData || Object.keys(l.stitches || {}).length > 0)) {
    return false;
  }
  return true;
}

/**
 * Generates a lightweight data URL thumbnail for the pattern artboard.
 */
export function generateProjectThumbnail(
  g: GridDimensions,
  ls: Layer[],
  pal: PaletteColor[],
  fabHex: string
): { thumbnailDataUrl: string; stitchCount: number } {
  let stitchCount = 0;
  const palMap = new Map<number, string>();
  for (const p of pal) {
    palMap.set(p.id, p.hex);
  }

  for (const layer of ls) {
    if (!layer.visible) continue;
    for (const key of Object.keys(layer.stitches)) {
      const [x, y] = key.split(',').map(Number);
      if (x >= 0 && x < g.width && y >= 0 && y < g.height) {
        stitchCount++;
      }
    }
  }

  if (typeof document === 'undefined') {
    return { thumbnailDataUrl: '', stitchCount };
  }

  const maxThumbW = 180;
  const maxThumbH = 135;
  const w = Math.max(1, g.width);
  const h = Math.max(1, g.height);
  const cellPx = Math.max(1, Math.min(maxThumbW / w, maxThumbH / h));
  const canvasW = Math.max(24, Math.round(w * cellPx));
  const canvasH = Math.max(24, Math.round(h * cellPx));

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { thumbnailDataUrl: '', stitchCount };
  }

  // Fill fabric color background
  ctx.fillStyle = fabHex || '#F9F6EE';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Subtle 10x10 grid hint
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 10; gx < w; gx += 10) {
    const px = Math.floor(gx * cellPx) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvasH);
  }
  for (let gy = 10; gy < h; gy += 10) {
    const py = Math.floor(gy * cellPx) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(canvasW, py);
  }
  ctx.stroke();

  // Render visible layers (reference images + stitches)
  for (const layer of ls) {
    if (!layer.visible || layer.opacity <= 0) continue;
    ctx.globalAlpha = layer.opacity;

    if (layer.type === 'image' && layer.image) {
      const img = getCachedImageElement(layer.image.src);
      if (img) {
        const ix = layer.image.x * cellPx;
        const iy = layer.image.y * cellPx;
        const iw = layer.image.width * cellPx;
        const ih = layer.image.height * cellPx;
        ctx.save();
        if (layer.image.rotation && layer.image.rotation % 360 !== 0) {
          ctx.translate(ix + iw / 2, iy + ih / 2);
          ctx.rotate((layer.image.rotation * Math.PI) / 180);
          ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
        } else {
          ctx.drawImage(img, ix, iy, iw, ih);
        }
        ctx.restore();
      }
      continue;
    }

    for (const [key, stitch] of Object.entries(layer.stitches)) {
      const [x, y] = key.split(',').map(Number);
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const hex = palMap.get(stitch.colorId);
      if (!hex) continue;
      ctx.fillStyle = hex;
      const px = x * cellPx;
      const py = y * cellPx;
      const stType = stitch.type || 'full';
      if (stType === 'half_forward' && cellPx >= 3) {
        ctx.beginPath();
        ctx.moveTo(px, py + cellPx);
        ctx.lineTo(px + cellPx, py);
        ctx.lineTo(px + cellPx, py + cellPx);
        ctx.closePath();
        ctx.fill();
      } else if (stType === 'half_back' && cellPx >= 3) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + cellPx, py + cellPx);
        ctx.lineTo(px, py + cellPx);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(px, py, Math.ceil(cellPx), Math.ceil(cellPx));
      }
    }
  }

  ctx.globalAlpha = 1.0;
  return {
    thumbnailDataUrl: canvas.toDataURL('image/png'),
    stitchCount
  };
}

function serializeLayersForStorage(ls: Layer[]): Layer[] {
  return ls.map(l => ({
    id: l.id,
    name: l.name,
    type: l.type,
    visible: l.visible,
    locked: l.locked,
    opacity: l.opacity,
    stitches: { ...l.stitches },
    image: l.image ? { ...l.image } : undefined,
    textData: l.textData ? { ...l.textData } : undefined
  }));
}

export async function refreshSavedProjectsList(): Promise<SavedProjectRecord[]> {
  try {
    const list = await getAllProjectRecords();
    savedProjectsList.set(list);
    return list;
  } catch (err) {
    console.error('Failed to load saved projects from IndexedDB:', err);
    return [];
  }
}

export async function saveCurrentProjectToDB(options?: {
  asNewCopy?: boolean;
  customName?: string;
}): Promise<string | null> {
  if (typeof indexedDB === 'undefined') return null;

  try {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    autosaveStatus.set('saving');
    let id = get(currentProjectId);
    const nowIso = new Date().toISOString();
    let createdAt = nowIso;

    if (!id || options?.asNewCopy) {
      id = generateId();
      currentProjectId.set(id);
    } else {
      const existing = await getProjectRecord(id);
      if (existing?.createdAt) {
        createdAt = existing.createdAt;
      }
    }

    const name = (options?.customName ?? get(projectName) ?? 'Untitled Pattern').trim() || 'Untitled Pattern';
    if (options?.customName && options.customName.trim()) {
      isRestoringProject = true;
      projectName.set(name);
      isRestoringProject = false;
    }

    const currentGrid = { ...get(grid) };
    const currentFabric = get(fabricColor);
    const currentPalette = get(palette).map(p => ({ ...p }));
    const currentLayers = serializeLayersForStorage(get(layers));

    const { thumbnailDataUrl, stitchCount } = generateProjectThumbnail(
      currentGrid,
      currentLayers,
      currentPalette,
      currentFabric
    );

    const record: SavedProjectRecord = {
      id,
      name,
      createdAt,
      updatedAt: nowIso,
      stitchCount,
      thumbnailDataUrl,
      grid: currentGrid,
      fabricColor: currentFabric,
      palette: currentPalette,
      layers: currentLayers
    };

    await putProjectRecord(record);
    await setMeta('activeProjectId', id);
    await refreshSavedProjectsList();

    autosaveStatus.set('saved');
    lastSavedAt.set(new Date());
    return id;
  } catch (err) {
    console.error('Failed to save project to IndexedDB:', err);
    autosaveStatus.set('error');
    return null;
  }
}

export function scheduleAutosave() {
  if (isRestoringProject || !storageInitialized) return;
  autosaveStatus.set('saving');
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  autosaveTimer = setTimeout(() => {
    saveCurrentProjectToDB();
  }, 600);
}

/**
 * Called synchronously before resetting or importing a new project so the previous work stays safely saved
 * in its own library record (unless the previous record was an untouched blank Untitled draft).
 */
export function prepareNewProjectSession(): void {
  if (!storageInitialized) return;
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  const prevId = get(currentProjectId);
  const newId = generateId();
  currentProjectId.set(newId);

  if (prevId) {
    getProjectRecord(prevId)
      .then(prevRec => {
        if (isBlankUntitledRecord(prevRec)) {
          return deleteProjectRecordFromDB(prevId).then(() => refreshSavedProjectsList());
        }
      })
      .catch(() => {});
  }
}

export async function openSavedProject(id: string): Promise<boolean> {
  try {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
      await saveCurrentProjectToDB();
    }

    const prevId = get(currentProjectId);
    if (prevId && prevId !== id) {
      const prevRec = await getProjectRecord(prevId);
      if (isBlankUntitledRecord(prevRec)) {
        await deleteProjectRecordFromDB(prevId);
      }
    }

    const record = await getProjectRecord(id);
    if (!record) return false;

    isRestoringProject = true;
    currentProjectId.set(record.id);
    projectName.set(record.name || 'Untitled Pattern');
    grid.set({ ...record.grid });
    fabricColor.set(record.fabricColor || '#F9F6EE');
    palette.set(record.palette.map(p => ({ ...p })));
    const restoredLayers = serializeLayersForStorage(record.layers);
    layers.set(restoredLayers);
    if (restoredLayers.length > 0) {
      activeLayerId.set(restoredLayers[restoredLayers.length - 1].id);
    }
    undoStack.set([]);
    redoStack.set([]);
    await setMeta('activeProjectId', record.id);
    await refreshSavedProjectsList();
    lastSavedAt.set(new Date(record.updatedAt));
    autosaveStatus.set('saved');
    isRestoringProject = false;

    triggerZoomToFit();
    return true;
  } catch (err) {
    isRestoringProject = false;
    console.error('Failed to open saved project:', err);
    return false;
  }
}

export async function duplicateSavedProject(id: string, switchToCopy = false): Promise<string | null> {
  try {
    if (id === get(currentProjectId)) {
      await saveCurrentProjectToDB();
    }
    const source = await getProjectRecord(id);
    if (!source) return null;
    const nowIso = new Date().toISOString();
    const copyId = generateId();
    const copyRecord: SavedProjectRecord = {
      ...source,
      id: copyId,
      name: `${source.name} (Copy)`,
      createdAt: nowIso,
      updatedAt: nowIso,
      grid: { ...source.grid },
      palette: source.palette.map(p => ({ ...p })),
      layers: serializeLayersForStorage(source.layers)
    };
    await putProjectRecord(copyRecord);
    await refreshSavedProjectsList();
    if (switchToCopy) {
      await openSavedProject(copyId);
    }
    return copyId;
  } catch (err) {
    console.error('Failed to duplicate project:', err);
    return null;
  }
}

export async function duplicateCurrentProject(): Promise<string | null> {
  const id = get(currentProjectId);
  if (!id) {
    return saveCurrentProjectToDB({ asNewCopy: true, customName: `${get(projectName)} (Copy)` });
  }
  return duplicateSavedProject(id, true);
}

export async function renameSavedProject(id: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) return;
  try {
    const record = await getProjectRecord(id);
    if (!record) return;
    record.name = trimmed;
    record.updatedAt = new Date().toISOString();
    await putProjectRecord(record);
    if (id === get(currentProjectId)) {
      isRestoringProject = true;
      projectName.set(trimmed);
      isRestoringProject = false;
    }
    await refreshSavedProjectsList();
  } catch (err) {
    console.error('Failed to rename project:', err);
  }
}

export async function deleteSavedProject(id: string): Promise<void> {
  try {
    await deleteProjectRecordFromDB(id);
    const list = await refreshSavedProjectsList();
    if (id === get(currentProjectId)) {
      if (list.length > 0) {
        await openSavedProject(list[0].id);
      } else {
        const freshId = generateId();
        currentProjectId.set(freshId);
        isRestoringProject = true;
        projectName.set('Untitled Pattern');
        grid.set({ width: 60, height: 40, fabricCount: 14 });
        const freshLayer: Layer = {
          id: `layer-${Date.now()}`,
          name: 'Base Pattern',
          visible: true,
          locked: false,
          opacity: 1.0,
          stitches: {}
        };
        layers.set([freshLayer]);
        activeLayerId.set(freshLayer.id);
        undoStack.set([]);
        redoStack.set([]);
        isRestoringProject = false;
        await saveCurrentProjectToDB();
        triggerZoomToFit();
      }
    }
  } catch (err) {
    console.error('Failed to delete saved project:', err);
  }
}

export function downloadProjectRecordAsFile(record: SavedProjectRecord) {
  let fileName = `${record.name || 'Untitled Pattern'}.xstitch`;
  if (!fileName.toLowerCase().endsWith('.xstitch')) {
    fileName += '.xstitch';
  }
  const data = {
    version: '1.0',
    generator: 'runStitch Studio',
    name: record.name,
    timestamp: record.updatedAt,
    grid: record.grid,
    fabricColor: record.fabricColor,
    palette: record.palette,
    layers: record.layers
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function initProjectStorage(): Promise<() => void> {
  if (typeof indexedDB === 'undefined') return () => {};

  try {
    const allProjects = await refreshSavedProjectsList();
    const activeId = await getMeta('activeProjectId');
    let targetRecord: SavedProjectRecord | null = null;

    if (activeId) {
      targetRecord = allProjects.find(p => p.id === activeId) || null;
    }
    if (!targetRecord && allProjects.length > 0) {
      targetRecord = allProjects[0];
    }

    if (targetRecord) {
      isRestoringProject = true;
      currentProjectId.set(targetRecord.id);
      projectName.set(targetRecord.name || 'Untitled Pattern');
      grid.set({ ...targetRecord.grid });
      fabricColor.set(targetRecord.fabricColor || '#F9F6EE');
      palette.set(targetRecord.palette.map(p => ({ ...p })));
      const restoredLayers = serializeLayersForStorage(targetRecord.layers);
      layers.set(restoredLayers);
      if (restoredLayers.length > 0) {
        activeLayerId.set(restoredLayers[restoredLayers.length - 1].id);
      }
      lastSavedAt.set(new Date(targetRecord.updatedAt));
      autosaveStatus.set('saved');
      isRestoringProject = false;
      triggerZoomToFit();
    } else {
      const initialId = generateId();
      currentProjectId.set(initialId);
      await saveCurrentProjectToDB();
    }
  } catch (err) {
    isRestoringProject = false;
    console.error('Error initializing IndexedDB project storage:', err);
  }

  storageInitialized = true;
  registerNewProjectSessionHook(prepareNewProjectSession);

  // Subscribe to core project stores for automatic debounced persistence
  let initialSkip = 5; // skip the initial synchronous fire of 5 stores on subscribe
  const onStoreChange = () => {
    if (initialSkip > 0) {
      initialSkip--;
      return;
    }
    scheduleAutosave();
  };

  const unsubs = [
    projectName.subscribe(onStoreChange),
    grid.subscribe(onStoreChange),
    fabricColor.subscribe(onStoreChange),
    palette.subscribe(onStoreChange),
    layers.subscribe(onStoreChange)
  ];

  return () => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    unsubs.forEach(u => u());
  };
}
