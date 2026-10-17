/**
 * Geometry & rasterization utilities for cross-stitch integer grids.
 * Provides Bresenham line, rectangle, and midpoint ellipse algorithms.
 */

import type { Layer, ReferenceImage, SelectionBox } from '../types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Bresenham's line algorithm.
 * Returns an array of grid cells connecting (x0, y0) to (x1, y1).
 */
export function getLineCells(x0: number, y0: number, x1: number, y1: number): Point[] {
  const cells: Point[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let currX = x0;
  let currY = y0;

  while (true) {
    cells.push({ x: currX, y: currY });

    if (currX === x1 && currY === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currY += sy;
    }
  }

  return cells;
}

/**
 * Returns rectangle cells between (x0, y0) and (x1, y1).
 * Can be 'outline' (perimeter only) or 'filled' (all cells within bounds).
 */
export function getRectangleCells(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fillMode: 'outline' | 'filled' = 'outline'
): Point[] {
  const cells: Point[] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (fillMode === 'filled') {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        cells.push({ x, y });
      }
    }
  } else {
    // Top and bottom horizontal edges
    for (let x = minX; x <= maxX; x++) {
      cells.push({ x, y: minY });
      if (maxY > minY) {
        cells.push({ x, y: maxY });
      }
    }
    // Left and right vertical edges (excluding corners already added)
    for (let y = minY + 1; y < maxY; y++) {
      cells.push({ x: minX, y });
      if (maxX > minX) {
        cells.push({ x: maxX, y });
      }
    }
  }

  return cells;
}

/**
 * Midpoint Ellipse Algorithm.
 * Fits an ellipse inside the bounding box defined by (x0, y0) and (x1, y1).
 * Works for any aspect ratio, including 1x1, narrow lines, and large circles.
 */
export function getEllipseCells(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fillMode: 'outline' | 'filled' = 'outline'
): Point[] {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  if (w <= 2 || h <= 2) {
    // Degenerate small box - fallback to rectangle
    return getRectangleCells(minX, minY, maxX, maxY, fillMode);
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;

  const cellsMap = new Map<string, Point>();

  if (fillMode === 'filled') {
    for (let y = minY; y <= maxY; y++) {
      const dy = (y - cy) / ry;
      const dySq = dy * dy;
      if (dySq > 1.0) continue;
      // Solve for dx: (dx/rx)^2 <= 1 - dySq
      const maxDx = rx * Math.sqrt(Math.max(0, 1.0001 - dySq));
      const left = Math.max(minX, Math.round(cx - maxDx));
      const right = Math.min(maxX, Math.round(cx + maxDx));
      for (let x = left; x <= right; x++) {
        cellsMap.set(`${x},${y}`, { x, y });
      }
    }
    return Array.from(cellsMap.values());
  }

  // Outline Mode: Scan perimeter with sub-pixel stepping or midpoint ellipse
  // To avoid any diagonal gaps on low-res pixel grids, we evaluate the normalized ellipse distance
  // and identify boundary cells that have an exterior neighbor
  const inside = (x: number, y: number) => {
    const ndx = (x - cx) / rx;
    const ndy = (y - cy) / ry;
    return (ndx * ndx + ndy * ndy) <= 1.05;
  };

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (inside(x, y)) {
        // If it's inside, check if any of 4-neighbors is outside or outside bounds
        const isBoundary =
          x === minX || x === maxX || y === minY || y === maxY ||
          !inside(x - 1, y) ||
          !inside(x + 1, y) ||
          !inside(x, y - 1) ||
          !inside(x, y + 1);

        if (isBoundary) {
          cellsMap.set(`${x},${y}`, { x, y });
        }
      }
    }
  }

  return Array.from(cellsMap.values());
}

/**
 * Constrains shape dragging when Shift key is pressed.
 * - Line: snaps to 0°, 45°, 90°, 135°, etc.
 * - Rectangle / Ellipse: constrains to 1:1 aspect ratio (Square / Circle).
 */
export function constrainCoordinates(
  tool: 'line' | 'rectangle' | 'ellipse',
  startX: number,
  startY: number,
  currX: number,
  currY: number,
  isShiftPressed: boolean
): { x: number; y: number } {
  if (!isShiftPressed) return { x: currX, y: currY };

  const dx = currX - startX;
  const dy = currY - startY;

  if (tool === 'line') {
    // Snap to 0°, 45°, 90°, 135°, 180°, etc.
    const angle = Math.atan2(dy, dx);
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const dist = Math.hypot(dx, dy);
    return {
      x: Math.round(startX + dist * Math.cos(snapAngle)),
      y: Math.round(startY + dist * Math.sin(snapAngle))
    };
  }

  if (tool === 'rectangle' || tool === 'ellipse') {
    // Constrain to square / circle
    const maxDelta = Math.max(Math.abs(dx), Math.abs(dy));
    const sx = dx >= 0 ? 1 : -1;
    const sy = dy >= 0 ? 1 : -1;
    return {
      x: startX + sx * maxDelta,
      y: startY + sy * maxDelta
    };
  }

  return { x: currX, y: currY };
}

// ============================================================
// Advanced Selection & Polygon Rasterization (Wand & Lasso)
// ============================================================

/**
 * Checks whether an integer coordinate (or cell) falls inside an active selection.
 */
export function isCellSelected(sel: SelectionBox | null, x: number, y: number): boolean {
  if (!sel) return false;
  if (sel.cells) {
    return sel.cells.has(`${x},${y}`);
  }
  return x >= sel.x && x < sel.x + sel.width && y >= sel.y && y < sel.y + sel.height;
}

/**
 * Returns a full Set of "x,y" keys for all stitches included in the selection.
 */
export function getSelectedCells(sel: SelectionBox | null): Set<string> {
  const result = new Set<string>();
  if (!sel) return result;
  if (sel.cells) {
    return new Set(sel.cells);
  }
  for (let y = sel.y; y < sel.y + sel.height; y++) {
    for (let x = sel.x; x < sel.x + sel.width; x++) {
      result.add(`${x},${y}`);
    }
  }
  return result;
}

/**
 * Creates a normalized SelectionBox from an arbitrary Set of "x,y" cell keys.
 */
export function createSelectionFromCells(cells: Set<string>): SelectionBox | null {
  if (cells.size === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const key of cells) {
    const [x, y] = key.split(',').map(Number);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    cells
  };
}

/**
 * Standard Jordan curve theorem / ray casting point-in-polygon test.
 */
export function pointInPolygon(px: number, py: number, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = ((yi > py) !== (yj > py)) &&
      (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Rasterizes a freehand lasso polygon into an array of grid cells.
 */
export function getLassoCells(points: Point[], gridW: number, gridH: number): Point[] {
  if (points.length === 0) return [];
  if (points.length < 3) {
    return points.filter(p => p.x >= 0 && p.x < gridW && p.y >= 0 && p.y < gridH);
  }

  // 1. Calculate bounding box of the polygon
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const startX = Math.max(0, minX);
  const endX = Math.min(gridW - 1, maxX);
  const startY = Math.max(0, minY);
  const endY = Math.min(gridH - 1, maxY);

  const selectedCells = new Map<string, Point>();

  // 2. Trace the perimeter using Bresenham lines to guarantee closed outline cells
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const edgeCells = getLineCells(p1.x, p1.y, p2.x, p2.y);
    for (const ec of edgeCells) {
      if (ec.x >= 0 && ec.x < gridW && ec.y >= 0 && ec.y < gridH) {
        selectedCells.set(`${ec.x},${ec.y}`, ec);
      }
    }
  }

  // 3. Scan candidate grid cells within bounding box testing center (x + 0.5, y + 0.5)
  for (let cy = startY; cy <= endY; cy++) {
    for (let cx = startX; cx <= endX; cx++) {
      const key = `${cx},${cy}`;
      if (selectedCells.has(key)) continue;

      if (pointInPolygon(cx + 0.5, cy + 0.5, points)) {
        selectedCells.set(key, { x: cx, y: cy });
      }
    }
  }

  return Array.from(selectedCells.values());
}

/**
 * 4-connected BFS flood selection for stitches on a Stitch layer.
 * Selects all contiguous stitches of the exact same colorId (or empty contiguous cells).
 */
export function floodSelectStitches(
  startX: number,
  startY: number,
  layer: Layer,
  gridW: number,
  gridH: number
): Set<string> {
  const result = new Set<string>();
  if (startX < 0 || startX >= gridW || startY < 0 || startY >= gridH) {
    return result;
  }

  const startKey = `${startX},${startY}`;
  const startStitch = layer.stitches[startKey];
  const targetColorId = startStitch ? startStitch.colorId : null;

  const queue: Point[] = [{ x: startX, y: startY }];
  result.add(startKey);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
        const nKey = `${nx},${ny}`;
        if (!result.has(nKey)) {
          const nStitch = layer.stitches[nKey];
          const nColorId = nStitch ? nStitch.colorId : null;
          if (nColorId === targetColorId) {
            result.add(nKey);
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }
  }

  return result;
}

/**
 * 4-connected BFS flood selection on an Image layer.
 * Samples pixel color at grid resolution and selects contiguous cells within color distance tolerance.
 */
export function floodSelectImage(
  startX: number,
  startY: number,
  imageEl: HTMLImageElement,
  refImage: ReferenceImage,
  tolerance: number = 20,
  gridW: number,
  gridH: number
): Set<string> {
  const result = new Set<string>();
  const W = Math.max(1, Math.round(refImage.width));
  const H = Math.max(1, Math.round(refImage.height));

  const relX = startX - refImage.x;
  const relY = startY - refImage.y;
  if (relX < 0 || relX >= W || relY < 0 || relY >= H) {
    return result;
  }

  // Offscreen sampling canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return result;

  const rot = refImage.rotation || 0;
  if (rot % 360 !== 0) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(imageEl, -W / 2, -H / 2, W, H);
    ctx.restore();
  } else {
    ctx.drawImage(imageEl, 0, 0, W, H);
  }

  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  const startIdx = (relY * W + relX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  const maxDist = tolerance * 2.5;

  const visited = new Uint8Array(W * H);
  const queue: Point[] = [{ x: relX, y: relY }];
  visited[relY * W + relX] = 1;

  result.add(`${refImage.x + relX},${refImage.y + relY}`);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        const nIdx = (ny * W + nx) * 4;
        const cellIdx = ny * W + nx;

        if (!visited[cellIdx]) {
          visited[cellIdx] = 1;
          const nr = data[nIdx];
          const ng = data[nIdx + 1];
          const nb = data[nIdx + 2];
          const na = data[nIdx + 3];

          // If both have alpha < 100, they match as transparent
          let matches = false;
          if (targetA < 100 && na < 100) {
            matches = true;
          } else if (targetA >= 100 && na >= 100) {
            const dist = Math.hypot(nr - targetR, ng - targetG, nb - targetB);
            if (dist <= maxDist) {
              matches = true;
            }
          }

          if (matches) {
            const gx = refImage.x + nx;
            const gy = refImage.y + ny;
            if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
              result.add(`${gx},${gy}`);
              queue.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  return result;
}

/**
 * Union (Add) selection operation: current + newCells.
 */
export function unionSelection(existing: SelectionBox | null, newCells: Set<string>): SelectionBox {
  const combined = getSelectedCells(existing);
  for (const c of newCells) {
    combined.add(c);
  }
  return createSelectionFromCells(combined)!;
}

/**
 * Subtract (Difference) selection operation: current - removeCells.
 */
export function subtractSelection(existing: SelectionBox | null, removeCells: Set<string>): SelectionBox | null {
  if (!existing) return null;
  const current = getSelectedCells(existing);
  for (const c of removeCells) {
    current.delete(c);
  }
  return createSelectionFromCells(current);
}

/**
 * Invert Selection: Selects all cells in canvas grid except those currently selected.
 */
export function invertSelection(existing: SelectionBox | null, gridW: number, gridH: number): SelectionBox {
  const current = getSelectedCells(existing);
  const inverted = new Set<string>();

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const key = `${x},${y}`;
      if (!current.has(key)) {
        inverted.add(key);
      }
    }
  }

  return createSelectionFromCells(inverted)!;
}

/**
 * Grow Selection (+1 perimeter stitch): Expands selection by 1 cell in all 4 cardinal directions.
 */
export function growSelection(existing: SelectionBox | null, gridW: number, gridH: number): SelectionBox | null {
  if (!existing) return null;
  const current = getSelectedCells(existing);
  const grown = new Set<string>(current);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  for (const key of current) {
    const [x, y] = key.split(',').map(Number);
    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
        grown.add(`${nx},${ny}`);
      }
    }
  }

  return createSelectionFromCells(grown);
}

/**
 * Shrink Selection (-1 perimeter stitch): Erodes selection by removing edge cells.
 */
export function shrinkSelection(existing: SelectionBox | null, gridW: number, gridH: number): SelectionBox | null {
  if (!existing) return null;
  const current = getSelectedCells(existing);
  const shrunk = new Set<string>();

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  for (const key of current) {
    const [x, y] = key.split(',').map(Number);
    let keep = true;

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH || !current.has(`${nx},${ny}`)) {
        keep = false;
        break;
      }
    }

    if (keep) {
      shrunk.add(key);
    }
  }

  return createSelectionFromCells(shrunk);
}

