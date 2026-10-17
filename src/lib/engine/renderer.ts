import type { Layer, PaletteColor, ViewMode, Viewport, GridDimensions, SelectionBox, FloatingSelection, ActiveTool, MotifStamp } from '../types';
import { getColorLuminance, DMC_CATALOG } from '../data/dmcPalette';

const GLOBAL_DMC_MAP = new Map(DMC_CATALOG.map(d => [d.code, d.hex]));

// Image element cache for smooth 60fps reference layer rendering
const imageElementCache = new Map<string, HTMLImageElement>();

export function getCachedImageElement(src: string, onLoaded?: () => void): HTMLImageElement | null {
  let img = imageElementCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imageElementCache.set(src, img);
    if (onLoaded) {
      img.onload = onLoaded;
    }
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// Hardware-accelerated stitch sprite cache for 60 FPS Mockup rendering
const stitchSpriteCache = new Map<string, HTMLCanvasElement>();

function getRealisticStitchSprite(hex: string, size: number): HTMLCanvasElement {
  const key = `${hex}_${size}`;
  const existing = stitchSpriteCache.get(key);
  if (existing) return existing;

  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const sCtx = sprite.getContext('2d');
  if (!sCtx) return sprite;

  const pad = size * 0.1;
  const threadWidth = Math.max(1.5, size * 0.35);

  sCtx.lineCap = 'round';
  sCtx.lineJoin = 'round';

  // Bottom diagonal subtle shadow underneath (fabric contact shadow)
  sCtx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  sCtx.lineWidth = threadWidth;
  sCtx.beginPath();
  sCtx.moveTo(pad, size - pad + 1);
  sCtx.lineTo(size - pad, pad + 1);
  sCtx.stroke();

  // Bottom diagonal (/)
  sCtx.strokeStyle = hex;
  sCtx.lineWidth = threadWidth;
  sCtx.beginPath();
  sCtx.moveTo(pad, size - pad);
  sCtx.lineTo(size - pad, pad);
  sCtx.stroke();

  // Top diagonal subtle shadow
  sCtx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  sCtx.lineWidth = threadWidth;
  sCtx.beginPath();
  sCtx.moveTo(pad, pad + 1);
  sCtx.lineTo(size - pad, size - pad + 1);
  sCtx.stroke();

  // Top diagonal (\)
  sCtx.strokeStyle = hex;
  sCtx.lineWidth = threadWidth;
  sCtx.beginPath();
  sCtx.moveTo(pad, pad);
  sCtx.lineTo(size - pad, size - pad);
  sCtx.stroke();

  // Highlight sheen on top thread
  sCtx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  sCtx.lineWidth = Math.max(1, threadWidth * 0.3);
  sCtx.beginPath();
  sCtx.moveTo(pad + 1, pad + 1);
  sCtx.lineTo(size - pad - 1, size - pad - 1);
  sCtx.stroke();

  if (stitchSpriteCache.size > 500) {
    stitchSpriteCache.clear();
  }
  stitchSpriteCache.set(key, sprite);
  return sprite;
}

// Draw the background Aida fabric texture
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: Viewport,
  grid: GridDimensions,
  viewMode: ViewMode,
  fabricColorHex: string = '#F9F6EE'
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const { zoom, panX, panY } = viewport;
  const gridPixelW = grid.width * zoom;
  const gridPixelH = grid.height * zoom;

  // Background fabric color (in symbols_only, use crisp white for print clarity, else use chosen fabricColor)
  const bg = viewMode === 'symbols_only' ? '#FFFFFF' : fabricColorHex;
  ctx.fillStyle = bg;
  ctx.fillRect(panX, panY, gridPixelW, gridPixelH);

  // Subtle fabric texture if in mockup mode
  if (viewMode === 'mockup' && zoom >= 12) {
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= grid.width; x++) {
      const px = panX + x * zoom;
      ctx.beginPath();
      ctx.moveTo(px, panY);
      ctx.lineTo(px, panY + gridPixelH);
      ctx.stroke();
    }
    for (let y = 0; y <= grid.height; y++) {
      const py = panY + y * zoom;
      ctx.beginPath();
      ctx.moveTo(panX, py);
      ctx.lineTo(panX + gridPixelW, py);
      ctx.stroke();
    }
  }

  // Shadow around the cloth canvas
  ctx.strokeStyle = '#3c3c48';
  ctx.lineWidth = 1;
  ctx.strokeRect(panX, panY, gridPixelW, gridPixelH);

  ctx.restore();
}

// Render grid lines & stitches
export function renderStitches(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: Viewport,
  grid: GridDimensions,
  layers: Layer[],
  palette: PaletteColor[],
  viewMode: ViewMode,
  showGrid: boolean,
  onImageLoaded?: () => void
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const { zoom, panX, panY } = viewport;

  // Quick lookup for palette colors by id
  const paletteMap = new Map<number, PaletteColor>();
  for (const c of palette) {
    paletteMap.set(c.id, c);
  }

  // Calculate visible range of cells (viewport culling)
  const startX = Math.max(0, Math.floor(-panX / zoom));
  const endX = Math.min(grid.width, Math.ceil((width - panX) / zoom));
  const startY = Math.max(0, Math.floor(-panY / zoom));
  const endY = Math.min(grid.height, Math.ceil((height - panY) / zoom));

  // Render layers in stack order
  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;

    ctx.globalAlpha = layer.opacity;

    // 1. Reference Image Layer
    if (layer.type === 'image' && layer.image) {
      const img = getCachedImageElement(layer.image.src, onImageLoaded);
      if (img) {
        const { x, y, width: iw, height: ih, rotation = 0 } = layer.image;
        const px = panX + x * zoom;
        const py = panY + y * zoom;
        const pw = iw * zoom;
        const ph = ih * zoom;

        ctx.save();
        if (rotation % 360 !== 0) {
          const cx = px + pw / 2;
          const cy = py + ph / 2;
          ctx.translate(cx, cy);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
        } else {
          ctx.drawImage(img, px, py, pw, ph);
        }
        ctx.restore();
      }
      continue;
    }

    // 2. Stitch Layer

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const key = `${x},${y}`;
        const stitch = layer.stitches[key];
        if (!stitch) continue;

        const color = paletteMap.get(stitch.colorId);
        if (!color) continue;

        const px = panX + x * zoom;
        const py = panY + y * zoom;

        if (viewMode === 'mockup') {
          const sprite = getRealisticStitchSprite(color.hex, zoom);
          ctx.drawImage(sprite, px, py);
        } else if (viewMode === 'chart') {
          // Color block with symbol
          ctx.fillStyle = color.hex;
          ctx.fillRect(px, py, zoom, zoom);

          // Draw symbol if zoom is large enough to be legible
          if (zoom >= 14) {
            ctx.fillStyle = color.symbolColor || '#FFFFFF';
            ctx.font = `bold ${Math.floor(zoom * 0.6)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(color.symbol, px + zoom / 2, py + zoom / 2 + 1);
          }
        } else if (viewMode === 'symbols_only') {
          // Enhanced Grayscale / Symbol View
          const lum = getColorLuminance(color.hex);
          let bgTone: string;
          let textColor: string;
          if (lum < 0.25) {
            bgTone = '#9CA3AF'; // Gray-400 tone for deep dark threads
            textColor = '#FFFFFF';
          } else if (lum < 0.70) {
            bgTone = '#E5E7EB'; // Gray-200 tone for mid tones
            textColor = '#111827';
          } else {
            bgTone = '#F9FAFB'; // Gray-50 tone for bright/white threads
            textColor = '#111827';
          }

          ctx.fillStyle = bgTone;
          ctx.fillRect(px, py, zoom, zoom);

          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, zoom - 1, zoom - 1);

          if (zoom >= 12) {
            ctx.fillStyle = textColor;
            ctx.font = `bold ${Math.floor(zoom * 0.65)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(color.symbol, px + zoom / 2, py + zoom / 2 + 1);
          }
        }
      }
    }
  }

  ctx.globalAlpha = 1.0;

  // Draw Grid Lines (standard 1x1 faint lines, and 10x10 bold lines with center marks)
  if (showGrid && zoom >= 6) {
    const gridPixelW = grid.width * zoom;
    const gridPixelH = grid.height * zoom;

    // 1x1 minor grid lines
    ctx.strokeStyle = viewMode === 'mockup' ? 'rgba(0,0,0,0.1)' : 'rgba(100, 100, 120, 0.25)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x++) {
      if (x % 10 === 0) continue; // Skip 10x10 lines for bold pass
      const px = Math.floor(panX + x * zoom) + 0.5;
      ctx.moveTo(px, Math.max(panY, 0));
      ctx.lineTo(px, Math.min(panY + gridPixelH, height));
    }
    for (let y = startY; y <= endY; y++) {
      if (y % 10 === 0) continue;
      const py = Math.floor(panY + y * zoom) + 0.5;
      ctx.moveTo(Math.max(panX, 0), py);
      ctx.lineTo(Math.min(panX + gridPixelW, width), py);
    }
    ctx.stroke();

    // 10x10 major grid lines (classic cross-stitch convention)
    ctx.strokeStyle = viewMode === 'mockup' ? 'rgba(0,0,0,0.3)' : 'rgba(50, 50, 70, 0.7)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let x = 0; x <= grid.width; x += 10) {
      if (x < startX || x > endX) continue;
      const px = Math.floor(panX + x * zoom) + 0.5;
      ctx.moveTo(px, panY);
      ctx.lineTo(px, panY + gridPixelH);
    }
    for (let y = 0; y <= grid.height; y += 10) {
      if (y < startY || y > endY) continue;
      const py = Math.floor(panY + y * zoom) + 0.5;
      ctx.moveTo(panX, py);
      ctx.lineTo(panX + gridPixelW, py);
    }
    ctx.stroke();

    // Center markers (traditional arrow triangles at width/2 and height/2)
    const midX = Math.floor(grid.width / 2);
    const midY = Math.floor(grid.height / 2);

    ctx.fillStyle = '#EF4444';
    // Top center marker
    const topPx = panX + midX * zoom;
    ctx.beginPath();
    ctx.moveTo(topPx - 4, panY - 8);
    ctx.lineTo(topPx + 4, panY - 8);
    ctx.lineTo(topPx, panY);
    ctx.fill();

    // Left center marker
    const leftPy = panY + midY * zoom;
    ctx.beginPath();
    ctx.moveTo(panX - 8, leftPy - 4);
    ctx.lineTo(panX - 8, leftPy + 4);
    ctx.lineTo(panX, leftPy);
    ctx.fill();
  }

  ctx.restore();
}

// Render cursor hover cell, selection marquee, and floating selection overlays
export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: Viewport,
  grid: GridDimensions,
  hoverCoord: { x: number; y: number } | null,
  activeColorHex: string,
  selection: SelectionBox | null = null,
  floatingSelection: FloatingSelection | null = null,
  palette: PaletteColor[] = [],
  activeTool: ActiveTool = 'pencil',
  dashOffset: number = 0,
  shapePreviewCells: { x: number; y: number }[] | null = null,
  activeStamp: MotifStamp | null = null,
  activeImageLayer: Layer | null = null,
  lassoPoints: { x: number; y: number }[] | null = null
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const { zoom, panX, panY } = viewport;

  // 0. Render Active Image Layer Transform Frame & Handles
  if (activeImageLayer && activeImageLayer.type === 'image' && activeImageLayer.image && activeImageLayer.visible) {
    const img = activeImageLayer.image;
    const cx = panX + (img.x + img.width / 2) * zoom;
    const cy = panY + (img.y + img.height / 2) * zoom;
    const hw = (img.width * zoom) / 2;
    const hh = (img.height * zoom) / 2;
    const rad = ((img.rotation || 0) * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    if (rad !== 0) ctx.rotate(rad);

    // Bounding frame with dashed cyan outline
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = '#06B6D4'; // Cyan-500
    ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
    ctx.setLineDash([]);

    // Helper for handle squares
    function drawHandle(hx: number, hy: number) {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0891B2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(hx - 5, hy - 5, 10, 10);
      ctx.fill();
      ctx.stroke();
    }

    // 4 Corner handles
    drawHandle(-hw, -hh); // NW
    drawHandle(hw, -hh);  // NE
    drawHandle(hw, hh);   // SE
    drawHandle(-hw, hh);  // SW

    // 4 Edge handles
    drawHandle(0, -hh);   // N
    drawHandle(hw, 0);    // E
    drawHandle(0, hh);    // S
    drawHandle(-hw, 0);   // W

    // Rotation handle with connector stem
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(0, -hh - 22);
    ctx.stroke();

    ctx.fillStyle = '#06B6D4';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -hh - 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dimensions badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#0891B2';
    ctx.lineWidth = 1;
    const badgeText = `${Math.round(img.width)} × ${Math.round(img.height)} stitches${img.rotation ? ` • ${img.rotation}°` : ''}`;
    ctx.font = '600 11px system-ui, sans-serif';
    const textW = ctx.measureText(badgeText).width;
    const badgeX = -textW / 2 - 8;
    const badgeY = hh + 12;

    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, textW + 16, 22, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, badgeY + 11);

    ctx.restore();
  }

  // 1. Render active Selection (Marching Ants) - Supports Arbitrary Cells (Wand/Lasso) & Marquee
  if (selection && selection.width > 0 && selection.height > 0) {
    if (selection.cells && selection.cells.size > 0) {
      // Arbitrary non-rectangular selection (Wand, Lasso, Invert, Grow, Shrink)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.20)';

      // Highlight each cell in the selection
      for (const key of selection.cells) {
        const [cx, cy] = key.split(',').map(Number);
        const px = Math.floor(panX + cx * zoom);
        const py = Math.floor(panY + cy * zoom);
        ctx.fillRect(px, py, zoom, zoom);
      }

      // Collect boundary segments where cell touches an unselected cell or canvas edge
      interface Segment { x1: number; y1: number; x2: number; y2: number }
      const segments: Segment[] = [];

      for (const key of selection.cells) {
        const [cx, cy] = key.split(',').map(Number);
        const px = Math.floor(panX + cx * zoom);
        const py = Math.floor(panY + cy * zoom);

        // Top edge
        if (!selection.cells.has(`${cx},${cy - 1}`)) {
          segments.push({ x1: px, y1: py, x2: px + zoom, y2: py });
        }
        // Bottom edge
        if (!selection.cells.has(`${cx},${cy + 1}`)) {
          segments.push({ x1: px, y1: py + zoom, x2: px + zoom, y2: py + zoom });
        }
        // Left edge
        if (!selection.cells.has(`${cx - 1},${cy}`)) {
          segments.push({ x1: px, y1: py, x2: px, y2: py + zoom });
        }
        // Right edge
        if (!selection.cells.has(`${cx + 1},${cy}`)) {
          segments.push({ x1: px + zoom, y1: py, x2: px + zoom, y2: py + zoom });
        }
      }

      // Double-layer marching ants for maximum contrast
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeStyle = '#0F0F17';
      ctx.beginPath();
      for (const s of segments) {
        ctx.moveTo(s.x1 + 0.5, s.y1 + 0.5);
        ctx.lineTo(s.x2 + 0.5, s.y2 + 0.5);
      }
      ctx.stroke();

      ctx.lineDashOffset = -dashOffset + 5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();
      for (const s of segments) {
        ctx.moveTo(s.x1 + 0.5, s.y1 + 0.5);
        ctx.lineTo(s.x2 + 0.5, s.y2 + 0.5);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Standard rectangular selection
      const sx = Math.floor(panX + selection.x * zoom);
      const sy = Math.floor(panY + selection.y * zoom);
      const sw = Math.floor(selection.width * zoom);
      const sh = Math.floor(selection.height * zoom);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.16)';
      ctx.fillRect(sx, sy, sw, sh);

      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -dashOffset;
      ctx.strokeStyle = '#0F0F17';
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);

      ctx.lineDashOffset = -dashOffset + 5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
      ctx.setLineDash([]);
    }
  }

  // 1.5. Render In-Progress Lasso Freehand Path
  if (lassoPoints && lassoPoints.length > 1) {
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    const firstX = Math.floor(panX + (lassoPoints[0].x + 0.5) * zoom);
    const firstY = Math.floor(panY + (lassoPoints[0].y + 0.5) * zoom);
    ctx.moveTo(firstX, firstY);

    for (let i = 1; i < lassoPoints.length; i++) {
      const px = Math.floor(panX + (lassoPoints[i].x + 0.5) * zoom);
      const py = Math.floor(panY + (lassoPoints[i].y + 0.5) * zoom);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Render Floating Selection (Stitches preview & positioning border)
  if (floatingSelection) {
    const fx = Math.floor(panX + floatingSelection.x * zoom);
    const fy = Math.floor(panY + floatingSelection.y * zoom);
    const fw = Math.floor(floatingSelection.width * zoom);
    const fh = Math.floor(floatingSelection.height * zoom);

    // Hover offset: subtle shift up and left so dragged material looks like it hovers above canvas
    const hoverOffsetX = -Math.max(2, Math.round(Math.min(zoom * 0.16, 7)));
    const hoverOffsetY = -Math.max(2, Math.round(Math.min(zoom * 0.16, 7)));

    // A. Draw landing footprint (darkened tint on canvas cells where stitches will land)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    const paletteMap = new Map(palette.map(p => [p.id, p]));
    for (const [relKey] of Object.entries(floatingSelection.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const gx = floatingSelection.x + rx;
      const gy = floatingSelection.y + ry;
      if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
        const tpx = Math.floor(panX + gx * zoom);
        const tpy = Math.floor(panY + gy * zoom);
        ctx.fillRect(tpx, tpy, zoom, zoom);
      }
    }

    // Footprint dashed boundary on the canvas
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
    ctx.setLineDash([]);

    // B. Draw hovering floating selection (offset up and left with translucent alpha and drop shadow)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = Math.max(3, Math.round(zoom * 0.2));
    ctx.shadowOffsetX = -hoverOffsetX * 0.7;
    ctx.shadowOffsetY = -hoverOffsetY * 0.7;

    for (const [relKey, stitch] of Object.entries(floatingSelection.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const spx = Math.floor(fx + hoverOffsetX + rx * zoom);
      const spy = Math.floor(fy + hoverOffsetY + ry * zoom);
      const color = paletteMap.get(stitch.colorId);
      if (color) {
        ctx.fillStyle = color.hex;
        ctx.globalAlpha = 0.65; // Translucent and clean without cluttering symbols
        ctx.fillRect(spx, spy, zoom, zoom);
      }
    }
    ctx.restore();

    // Floating selection frame around hovering motif
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = '#6366F1';
    ctx.strokeRect(fx + hoverOffsetX + 0.5, fy + hoverOffsetY + 0.5, fw - 1, fh - 1);
    ctx.setLineDash([]);
  }

  // 3. Render In-Progress Shape Drag Preview
  if (shapePreviewCells && shapePreviewCells.length > 0) {
    for (const cell of shapePreviewCells) {
      if (cell.x >= 0 && cell.x < grid.width && cell.y >= 0 && cell.y < grid.height) {
        const cpx = Math.floor(panX + cell.x * zoom);
        const cpy = Math.floor(panY + cell.y * zoom);

        ctx.fillStyle = activeColorHex;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(cpx, cpy, zoom, zoom);

        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cpx + 0.5, cpy + 0.5, zoom - 1, zoom - 1);
      }
    }
  }

  // 4. Render Active Stamp Hover Ghost
  if (activeTool === 'stamp' && activeStamp && hoverCoord) {
    const originX = hoverCoord.x - Math.floor(activeStamp.width / 2);
    const originY = hoverCoord.y - Math.floor(activeStamp.height / 2);

    const stPx = Math.floor(panX + originX * zoom);
    const stPy = Math.floor(panY + originY * zoom);
    const stPw = Math.floor(activeStamp.width * zoom);
    const stPh = Math.floor(activeStamp.height * zoom);

    const hoverOffsetX = -Math.max(2, Math.round(Math.min(zoom * 0.16, 7)));
    const hoverOffsetY = -Math.max(2, Math.round(Math.min(zoom * 0.16, 7)));

    // A. Draw landing footprint (darkened tint on target grid cells)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (const [relKey] of Object.entries(activeStamp.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const gx = originX + rx;
      const gy = originY + ry;
      if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
        const tpx = Math.floor(panX + gx * zoom);
        const tpy = Math.floor(panY + gy * zoom);
        ctx.fillRect(tpx, tpy, zoom, zoom);
      }
    }

    // Footprint landing frame
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.strokeRect(stPx + 0.5, stPy + 0.5, stPw - 1, stPh - 1);
    ctx.setLineDash([]);

    // B. Hovering stamp ghost (offset up & left with shadow)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = Math.max(3, Math.round(zoom * 0.2));
    ctx.shadowOffsetX = -hoverOffsetX * 0.7;
    ctx.shadowOffsetY = -hoverOffsetY * 0.7;

    const dmcMap = new Map(palette.map(p => [p.dmc, p.hex]));
    for (const [relKey, stitch] of Object.entries(activeStamp.stitches)) {
      const [rx, ry] = relKey.split(',').map(Number);
      const gx = originX + rx;
      const gy = originY + ry;

      if (gx >= 0 && gx < grid.width && gy >= 0 && gy < grid.height) {
        const px = Math.floor(panX + hoverOffsetX + gx * zoom);
        const py = Math.floor(panY + hoverOffsetY + gy * zoom);
        // Look up true DMC color from catalog first to prevent color shifts before first stamp
        const hex = GLOBAL_DMC_MAP.get(stitch.dmc) || dmcMap.get(stitch.dmc) || activeColorHex;

        ctx.fillStyle = hex;
        ctx.globalAlpha = 0.72;
        ctx.fillRect(px, py, zoom, zoom);

        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, zoom - 1, zoom - 1);
      }
    }
    ctx.restore();

    // Bounding frame around hovering stamp
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = '#10B981'; // Emerald frame for stamps
    ctx.strokeRect(stPx + hoverOffsetX + 0.5, stPy + hoverOffsetY + 0.5, stPw - 1, stPh - 1);
    ctx.setLineDash([]);
  }

  // 5. Render standard single-cell hover cursor
  const isDraggingShape = shapePreviewCells && shapePreviewCells.length > 0;
  const isImageActive = activeImageLayer && activeImageLayer.type === 'image';
  if (hoverCoord && !floatingSelection && activeTool !== 'select' && activeTool !== 'stamp' && !isDraggingShape && !isImageActive) {
    const { x, y } = hoverCoord;
    if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
      const px = panX + x * zoom;
      const py = panY + y * zoom;

      // Semi-transparent ghost preview of current color
      ctx.fillStyle = activeColorHex;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(px, py, zoom, zoom);

      // High-visibility focus ring around hover cell
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 0.5, py + 0.5, zoom - 1, zoom - 1);
    }
  }

  ctx.restore();
}

export type ImageHandleType = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | 'rotate' | 'body';

export function getImageHandleAt(
  screenX: number,
  screenY: number,
  image: { x: number; y: number; width: number; height: number; rotation?: number },
  viewport: Viewport
): ImageHandleType | null {
  const { zoom, panX, panY } = viewport;
  const cx = panX + (image.x + image.width / 2) * zoom;
  const cy = panY + (image.y + image.height / 2) * zoom;
  const hw = (image.width * zoom) / 2;
  const hh = (image.height * zoom) / 2;
  const rad = ((image.rotation || 0) * Math.PI) / 180;

  // Un-rotate the point around image center to test in local axis-aligned coords
  const dx = screenX - cx;
  const dy = screenY - cy;
  const cos = Math.cos(-rad);
  const sin = Math.sin(-rad);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  const handleRadius = 12;

  // Rotation handle is at (0, -hh - 22)
  if (Math.hypot(localX, localY - (-hh - 22)) <= handleRadius + 4) {
    return 'rotate';
  }

  // 4 Corners
  if (Math.hypot(localX - (-hw), localY - (-hh)) <= handleRadius) return 'nw';
  if (Math.hypot(localX - hw, localY - (-hh)) <= handleRadius) return 'ne';
  if (Math.hypot(localX - hw, localY - hh) <= handleRadius) return 'se';
  if (Math.hypot(localX - (-hw), localY - hh) <= handleRadius) return 'sw';

  // 4 Edges
  if (Math.abs(localY - (-hh)) <= handleRadius && Math.abs(localX) < hw) return 'n';
  if (Math.abs(localY - hh) <= handleRadius && Math.abs(localX) < hw) return 's';
  if (Math.abs(localX - (-hw)) <= handleRadius && Math.abs(localY) < hh) return 'w';
  if (Math.abs(localX - hw) <= handleRadius && Math.abs(localY) < hh) return 'e';

  // Bounding border for moving/dragging the image layer
  // A narrow band (8px) around the perimeter of the bounding box
  const borderBand = 8;
  const isNearBorder =
    (Math.abs(localX - (-hw)) <= borderBand && localY >= -hh - borderBand && localY <= hh + borderBand) ||
    (Math.abs(localX - hw) <= borderBand && localY >= -hh - borderBand && localY <= hh + borderBand) ||
    (Math.abs(localY - (-hh)) <= borderBand && localX >= -hw - borderBand && localX <= hw + borderBand) ||
    (Math.abs(localY - hh) <= borderBand && localX >= -hw - borderBand && localX <= hw + borderBand);

  if (isNearBorder) {
    return 'body';
  }

  // Inside body returns null to allow selection tools (Marquee, Lasso, Wand) or drawing to start inside
  return null;
}
