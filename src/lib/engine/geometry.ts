/**
 * Geometry & rasterization utilities for cross-stitch integer grids.
 * Provides Bresenham line, rectangle, and midpoint ellipse algorithms.
 */

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
