import { jsPDF } from 'jspdf';
import type { GridDimensions, Layer, PaletteColor } from '../types';
import { getColorLuminance } from '../data/dmcPalette';

export interface PdfExportOptions {
  title?: string;
  author?: string;
  notes?: string;
  chartStyle: 'color_symbols' | 'black_and_white';
  includeCover: boolean;
  includeFlossKey: boolean;
  includeMockup: boolean;
  paginateLarge: boolean;
  pageSize?: 'a4' | 'letter';
  marginSize?: 'minimal' | 'narrow' | 'standard'; // 6mm, 10mm, 14mm
  includeHeaderFooter?: boolean; // toggle page overview header/footer
  gridDensity?: 'compact' | 'standard' | 'large_print'; // 2.8mm, 3.5mm, 4.6mm
  skeinYield?: number; // stitches per skein (default 2000)
}

/**
 * Compiles all stitches inside the Artboard boundaries [0..width-1, 0..height-1].
 */
export function getArtboardStitchData(
  grid: GridDimensions,
  layers: Layer[],
  palette: PaletteColor[]
) {
  const artboardStitches = new Map<string, number>(); // `${x},${y}` -> colorId
  const colorCounts = new Map<number, number>(); // colorId -> count
  let totalStitches = 0;

  // Staging pasteboard counter
  let pasteboardStitches = 0;

  for (const layer of layers) {
    if (!layer.visible || layer.opacity <= 0) continue;
    for (const [key, stitch] of Object.entries(layer.stitches)) {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr, 10);
      const y = parseInt(yStr, 10);

      if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
        artboardStitches.set(key, stitch.colorId);
        colorCounts.set(stitch.colorId, (colorCounts.get(stitch.colorId) || 0) + 1);
        totalStitches++;
      } else {
        pasteboardStitches++;
      }
    }
  }

  // Filter and sort palette to only used colors in the Artboard
  const usedColors = palette
    .filter(c => (colorCounts.get(c.id) || 0) > 0)
    .sort((a, b) => (colorCounts.get(b.id) || 0) - (colorCounts.get(a.id) || 0));

  return {
    artboardStitches,
    colorCounts,
    usedColors,
    totalStitches,
    pasteboardStitches
  };
}

/**
 * Renders an offscreen canvas of the realistic finished embroidery mockup on Aida cloth.
 */
export function renderMockupCanvas(
  grid: GridDimensions,
  artboardStitches: Map<string, number>,
  palette: PaletteColor[],
  fabricColorHex: string = '#F9F6EE',
  maxDim: number = 900
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const cellSize = Math.max(3, Math.min(22, Math.floor(maxDim / Math.max(grid.width, grid.height))));
  canvas.width = Math.max(40, grid.width * cellSize);
  canvas.height = Math.max(40, grid.height * cellSize);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background cloth
  ctx.fillStyle = fabricColorHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Aida weave texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
  for (let x = 0; x < canvas.width; x += 2) {
    ctx.fillRect(x, 0, 1, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillRect(0, y, canvas.width, 1);
  }

  const palMap = new Map(palette.map(c => [c.id, c]));
  const pad = cellSize * 0.12;
  const threadWidth = Math.max(1.4, cellSize * 0.36);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [key, colorId] of artboardStitches.entries()) {
    const [xStr, yStr] = key.split(',');
    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const color = palMap.get(colorId);
    if (!color) continue;

    const px = x * cellSize;
    const py = y * cellSize;

    // Bottom stitch shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = threadWidth;
    ctx.beginPath();
    ctx.moveTo(px + pad, py + cellSize - pad + 1);
    ctx.lineTo(px + cellSize - pad, py + pad + 1);
    ctx.stroke();

    // Bottom diagonal (/)
    ctx.strokeStyle = color.hex;
    ctx.lineWidth = threadWidth;
    ctx.beginPath();
    ctx.moveTo(px + pad, py + cellSize - pad);
    ctx.lineTo(px + cellSize - pad, py + pad);
    ctx.stroke();

    // Top stitch shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = threadWidth;
    ctx.beginPath();
    ctx.moveTo(px + pad, py + pad + 1);
    ctx.lineTo(px + cellSize - pad, py + cellSize - pad + 1);
    ctx.stroke();

    // Top diagonal (\)
    ctx.strokeStyle = color.hex;
    ctx.lineWidth = threadWidth;
    ctx.beginPath();
    ctx.moveTo(px + pad, py + pad);
    ctx.lineTo(px + cellSize - pad, py + cellSize - pad);
    ctx.stroke();

    // Thread sheen highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
    ctx.lineWidth = Math.max(0.8, threadWidth * 0.3);
    ctx.beginPath();
    ctx.moveTo(px + pad + 1, py + pad + 1);
    ctx.lineTo(px + cellSize - pad - 1, py + cellSize - pad - 1);
    ctx.stroke();
  }

  return canvas;
}

/**
 * Renders an offscreen canvas for a single chart page tile with 10x10 numbered borders,
 * center markers, and symbols.
 */
export function renderChartPageCanvas(
  grid: GridDimensions,
  artboardStitches: Map<string, number>,
  palette: PaletteColor[],
  chartStyle: 'color_symbols' | 'black_and_white',
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  overlapStartX: number,
  overlapStartY: number
): HTMLCanvasElement {
  const dpr = 2; // 2x high-resolution print density
  const cellPx = 28 * dpr; // 28 physical pixels per stitch cell
  const borderMargin = 40 * dpr; // margin space for numbers on edges

  const cols = endX - startX;
  const rows = endY - startY;

  const canvas = document.createElement('canvas');
  canvas.width = cols * cellPx + borderMargin * 2;
  canvas.height = rows * cellPx + borderMargin * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const palMap = new Map(palette.map(c => [c.id, c]));
  const centerX = Math.floor(grid.width / 2);
  const centerY = Math.floor(grid.height / 2);

  // 1. Shaded overlap areas (if this page overlaps adjacent pages)
  for (let r = 0; r < rows; r++) {
    const gy = startY + r;
    for (let c = 0; c < cols; c++) {
      const gx = startX + c;
      const isOverlap = (gx < overlapStartX && startX > 0) || (gy < overlapStartY && startY > 0);
      if (isOverlap) {
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(borderMargin + c * cellPx, borderMargin + r * cellPx, cellPx, cellPx);
      }
    }
  }

  // 2. Stitch cells & symbols
  for (let r = 0; r < rows; r++) {
    const gy = startY + r;
    for (let c = 0; c < cols; c++) {
      const gx = startX + c;
      const key = `${gx},${gy}`;
      const colorId = artboardStitches.get(key);
      if (colorId === undefined) continue;

      const color = palMap.get(colorId);
      if (!color) continue;

      const px = borderMargin + c * cellPx;
      const py = borderMargin + r * cellPx;

      if (chartStyle === 'color_symbols') {
        // Light tinted color fill for contrast
        ctx.fillStyle = color.hex;
        ctx.fillRect(px, py, cellPx, cellPx);

        // Symbol
        ctx.fillStyle = color.symbolColor || '#FFFFFF';
        ctx.font = `bold ${Math.round(cellPx * 0.62)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.symbol, px + cellPx / 2, py + cellPx / 2 + 1);
      } else {
        // Black and white chart
        const lum = getColorLuminance(color.hex);
        // Subtle background tint for very dark or very light threads to improve readability
        if (lum < 0.20) {
          ctx.fillStyle = '#E5E7EB';
          ctx.fillRect(px, py, cellPx, cellPx);
        }

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(cellPx * 0.65)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.symbol, px + cellPx / 2, py + cellPx / 2 + 1);
      }
    }
  }

  // 3. Grid Lines (1x1 minor lines, 10x10 major lines)
  // Minor lines
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1 * dpr;

  for (let c = 0; c <= cols; c++) {
    const gx = startX + c;
    if (gx % 10 !== 0) {
      const px = borderMargin + c * cellPx;
      ctx.beginPath();
      ctx.moveTo(px, borderMargin);
      ctx.lineTo(px, borderMargin + rows * cellPx);
      ctx.stroke();
    }
  }
  for (let r = 0; r <= rows; r++) {
    const gy = startY + r;
    if (gy % 10 !== 0) {
      const py = borderMargin + r * cellPx;
      ctx.beginPath();
      ctx.moveTo(borderMargin, py);
      ctx.lineTo(borderMargin + cols * cellPx, py);
      ctx.stroke();
    }
  }

  // Major lines (every 10 stitches)
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2.5 * dpr;

  for (let c = 0; c <= cols; c++) {
    const gx = startX + c;
    if (gx % 10 === 0) {
      const px = borderMargin + c * cellPx;
      ctx.beginPath();
      ctx.moveTo(px, borderMargin);
      ctx.lineTo(px, borderMargin + rows * cellPx);
      ctx.stroke();
    }
  }
  for (let r = 0; r <= rows; r++) {
    const gy = startY + r;
    if (gy % 10 === 0) {
      const py = borderMargin + r * cellPx;
      ctx.beginPath();
      ctx.moveTo(borderMargin, py);
      ctx.lineTo(borderMargin + cols * cellPx, py);
      ctx.stroke();
    }
  }

  // Chart outer frame border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3 * dpr;
  ctx.strokeRect(borderMargin, borderMargin, cols * cellPx, rows * cellPx);

  // 4. Numbered 10x10 edge markers
  ctx.fillStyle = '#374151';
  ctx.font = `bold ${Math.round(12 * dpr)}px monospace`;

  // Top and bottom numbers
  for (let c = 0; c <= cols; c++) {
    const gx = startX + c;
    if (gx > 0 && gx < grid.width && gx % 10 === 0) {
      const px = borderMargin + c * cellPx;
      ctx.textAlign = 'center';

      // Top number
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${gx}`, px, borderMargin - 4 * dpr);

      // Bottom number
      ctx.textBaseline = 'top';
      ctx.fillText(`${gx}`, px, borderMargin + rows * cellPx + 4 * dpr);
    }
  }

  // Left and right numbers
  for (let r = 0; r <= rows; r++) {
    const gy = startY + r;
    if (gy > 0 && gy < grid.height && gy % 10 === 0) {
      const py = borderMargin + r * cellPx;
      ctx.textBaseline = 'middle';

      // Left number
      ctx.textAlign = 'right';
      ctx.fillText(`${gy}`, borderMargin - 6 * dpr, py);

      // Right number
      ctx.textAlign = 'left';
      ctx.fillText(`${gy}`, borderMargin + cols * cellPx + 6 * dpr, py);
    }
  }

  // 5. Red Center Triangular Arrows (at grid center horizontal and vertical)
  ctx.fillStyle = '#EF4444';
  const arrowSize = 9 * dpr;

  // Vertical Center Arrow (top & bottom)
  if (centerX >= startX && centerX <= endX) {
    const cX = borderMargin + (centerX - startX) * cellPx;
    // Top arrow pointing down
    ctx.beginPath();
    ctx.moveTo(cX, borderMargin - 1);
    ctx.lineTo(cX - arrowSize, borderMargin - arrowSize - 2);
    ctx.lineTo(cX + arrowSize, borderMargin - arrowSize - 2);
    ctx.closePath();
    ctx.fill();

    // Bottom arrow pointing up
    ctx.beginPath();
    ctx.moveTo(cX, borderMargin + rows * cellPx + 1);
    ctx.lineTo(cX - arrowSize, borderMargin + rows * cellPx + arrowSize + 2);
    ctx.lineTo(cX + arrowSize, borderMargin + rows * cellPx + arrowSize + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Horizontal Center Arrow (left & right)
  if (centerY >= startY && centerY <= endY) {
    const cY = borderMargin + (centerY - startY) * cellPx;
    // Left arrow pointing right
    ctx.beginPath();
    ctx.moveTo(borderMargin - 1, cY);
    ctx.lineTo(borderMargin - arrowSize - 2, cY - arrowSize);
    ctx.lineTo(borderMargin - arrowSize - 2, cY + arrowSize);
    ctx.closePath();
    ctx.fill();

    // Right arrow pointing left
    ctx.beginPath();
    ctx.moveTo(borderMargin + cols * cellPx + 1, cY);
    ctx.lineTo(borderMargin + cols * cellPx + arrowSize + 2, cY - arrowSize);
    ctx.lineTo(borderMargin + cols * cellPx + arrowSize + 2, cY + arrowSize);
    ctx.closePath();
    ctx.fill();
  }

  return canvas;
}

/**
 * Renders an offscreen high-resolution square canvas for a Unicode symbol to embed in jsPDF
 * avoiding font encoding limitations with non-ASCII glyphs.
 */
function renderSymbolCanvas(symbol: string, textColor: string = '#000000'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 48, 48);
    ctx.fillStyle = textColor;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol || '●', 24, 25);
  }
  return canvas.toDataURL('image/png');
}

/**
 * Compiles and builds the full jsPDF document instance with all configured pages.
 */
export async function createPdfDocument(
  grid: GridDimensions,
  layers: Layer[],
  palette: PaletteColor[],
  fabricColorHex: string,
  options: PdfExportOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: options.pageSize === 'letter' ? 'letter' : 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Margins: minimal (6mm), narrow (10mm), standard (14mm)
  const margin = options.marginSize === 'minimal' ? 6 : options.marginSize === 'narrow' ? 10 : 14;
  const contentWidth = pageWidth - margin * 2;

  const data = getArtboardStitchData(grid, layers, palette);
  const title = options.title?.trim() || 'Cross-Stitch Pattern';
  const author = options.author?.trim() || 'XStitcher Studio';

  const inWidth = (grid.width / grid.fabricCount).toFixed(1);
  const inHeight = (grid.height / grid.fabricCount).toFixed(1);
  const cmWidth = ((grid.width / grid.fabricCount) * 2.54).toFixed(1);
  const cmHeight = ((grid.height / grid.fabricCount) * 2.54).toFixed(1);

  let isFirstPage = true;

  // ==========================================
  // PAGE 1: COVER & EMBROIDERY MOCKUP
  // ==========================================
  if (options.includeCover) {
    // Header Bar
    doc.setFillColor(30, 27, 75); // Deep Indigo (#1E1B4B)
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 205, 235);
    doc.text(`Designed by ${author} • Generated by XStitcher Studio`, margin, 21);

    // Decorative Gold Line
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    doc.line(0, 28, pageWidth, 28);

    // Mockup Hero Box
    const mockupCanvas = renderMockupCanvas(grid, data.artboardStitches, palette, fabricColorHex, 800);
    const maxMockupW = contentWidth;
    const maxMockupH = 96;
    const aspect = mockupCanvas.width / mockupCanvas.height;
    let mW = maxMockupW;
    let mH = mW / aspect;
    if (mH > maxMockupH) {
      mH = maxMockupH;
      mW = mH * aspect;
    }
    const mX = margin + (contentWidth - mW) / 2;
    const mY = 34;

    // Soft drop shadow / border around mockup
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(mX - 2, mY - 2, mW + 4, mH + 4, 2, 2, 'F');
    doc.addImage(mockupCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', mX, mY, mW, mH);

    // Metadata Card
    const cardY = mY + mH + 8;
    const cardH = 58;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, cardY, contentWidth, cardH, 3, 3, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PATTERN SPECIFICATIONS', margin + 6, cardY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const col1X = margin + 6;
    const col2X = margin + contentWidth / 2 + 4;

    doc.text(`Grid Artboard:`, col1X, cardY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${grid.width} × ${grid.height} stitches`, col1X + 32, cardY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fabric Count:`, col1X, cardY + 26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${grid.fabricCount} count Aida`, col1X + 32, cardY + 26);

    // Design Size split across two lines so it fits comfortably
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Design Size:`, col1X, cardY + 34);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${inWidth}″ × ${inHeight}″`, col1X + 32, cardY + 34);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`(${cmWidth} × ${cmHeight} cm)`, col1X + 32, cardY + 41);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Stitches:`, col2X, cardY + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.totalStitches.toLocaleString()} stitches`, col2X + 32, cardY + 18);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Colors Used:`, col2X, cardY + 26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${data.usedColors.length} floss shades`, col2X + 32, cardY + 26);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Cloth Color:`, col2X, cardY + 34);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${fabricColorHex}`, col2X + 32, cardY + 34);

    if (data.pasteboardStitches > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text(
        `* ${data.pasteboardStitches} staging stitches outside the pattern artboard excluded from chart.`,
        col1X,
        cardY + 50
      );
    }

    // Stitching Instructions & Tips Box
    const instY = cardY + cardH + 6;
    doc.setFillColor(254, 249, 195); // Pale Amber (#FEF9C3)
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(margin, instY, contentWidth, 34, 2, 2, 'FD');

    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('STITCHING INSTRUCTIONS', margin + 6, instY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 53, 15);
    doc.text(
      '• Use 2 strands of embroidery floss over 1 fabric square for full cross-stitches.',
      margin + 6,
      instY + 13
    );
    doc.text(
      '• Locate the red arrows at the chart borders to start stitching from the exact pattern center.',
      margin + 6,
      instY + 19
    );
    doc.text(
      '• Allow an extra 3 inches (7.5 cm) of fabric border on all four sides for framing and finishing.',
      margin + 6,
      instY + 25
    );

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('XStitcher Studio • Professional Cross-Stitch Publishing System', margin, pageHeight - 8);

    isFirstPage = false;
  }

  // ==========================================
  // PAGE 2: FLOSS KEY & SKEIN ESTIMATOR
  // ==========================================
  if (options.includeFlossKey && data.usedColors.length > 0) {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // Header
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${title} — Floss Legend & Skein Estimator`, margin, 13);

    // Table Columns
    const startY = 28;
    const rowH = 7.2;

    const colSym = margin;
    const colSwatch = margin + 14;
    const colBrand = margin + 26;
    const colCode = margin + 50;
    const colName = margin + 74;
    const colCount = margin + 130;
    const colSkeins = margin + 154;

    // Table Header Row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, startY, contentWidth, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, startY + 8, margin + contentWidth, startY + 8);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Sym', colSym + 2, startY + 5.5);
    doc.text('Color', colSwatch, startY + 5.5);
    doc.text('Brand', colBrand, startY + 5.5);
    doc.text('Code', colCode, startY + 5.5);
    doc.text('Color Description', colName, startY + 5.5);
    doc.text('Stitches', colCount, startY + 5.5);
    doc.text('Skein Estimate', colSkeins, startY + 5.5);

    let curY = startY + 8;
    const skeinYield = Math.max(500, options.skeinYield || 2000);
    const symbolImgCache = new Map<string, string>();

    for (let i = 0; i < data.usedColors.length; i++) {
      const color = data.usedColors[i];
      const count = data.colorCounts.get(color.id) || 0;
      const skeins = Math.max(1, Math.ceil(count / skeinYield));

      // Page overflow check
      if (curY + rowH > pageHeight - 16) {
        doc.addPage();
        curY = 24;
      }

      // Zebra striping
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, curY, contentWidth, rowH, 'F');
      }

      // Row separator
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, curY + rowH, margin + contentWidth, curY + rowH);

      // 1. Symbol Box with canvas-rendered PNG image to completely eliminate % escape glitches
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(156, 163, 175);
      doc.rect(colSym + 1, curY + 1.2, 5, 5, 'FD');

      let symDataUrl = symbolImgCache.get(color.symbol);
      if (!symDataUrl) {
        symDataUrl = renderSymbolCanvas(color.symbol, '#000000');
        symbolImgCache.set(color.symbol, symDataUrl);
      }
      doc.addImage(symDataUrl, 'PNG', colSym + 1.2, curY + 1.2, 5, 5);

      // 2. Swatch Color Box
      const [r, g, b] = hexToRgb(color.hex);
      doc.setFillColor(r, g, b);
      doc.setDrawColor(100, 100, 100);
      doc.rect(colSwatch, curY + 1.5, 8, 4.5, 'FD');

      // 3. Brand
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(color.brand || 'DMC', colBrand, curY + 4.8);

      // 4. Floss Code
      doc.setFont('helvetica', 'bold');
      doc.text(`${color.dmc}`, colCode, curY + 4.8);

      // 5. Name
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const truncatedName = color.name.length > 28 ? color.name.slice(0, 26) + '...' : color.name;
      doc.text(truncatedName, colName, curY + 4.8);

      // 6. Stitch Count
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(count.toLocaleString(), colCount, curY + 4.8);

      // 7. Skein Estimate
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${skeins} skein${skeins > 1 ? 's' : ''}`, colSkeins, curY + 4.8);

      curY += rowH;
    }

    // Footnote explaining skein estimation
    curY += 8;
    if (curY < pageHeight - 20) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `* Skein estimation based on standard 8-meter cotton floss skeins with 2 strands (~${skeinYield.toLocaleString()} stitches/skein).`,
        margin,
        curY
      );
    }
  }

  // ==========================================
  // PAGE 3+: CROSS-STITCH CHART PAGES
  // ==========================================
  const showHeaderFooter = options.includeHeaderFooter !== false;
  const topHeaderH = showHeaderFooter ? 16 : 0;
  const bottomFooterH = showHeaderFooter ? 14 : 0;

  // Grid density physical cell size in millimeters on printed page
  const cellMm = options.gridDensity === 'compact' ? 2.8 : options.gridDensity === 'large_print' ? 4.5 : 3.4;
  const borderMarginRatio = 40 / 28; // borderMargin (40) / cellPx (28)
  const borderMarginMm = cellMm * borderMarginRatio;

  // Compute maximum stitch columns and rows that fit inside the page content area at this cell size
  const maxAvailableTileW = contentWidth - borderMarginMm * 2;
  const maxAvailableTileH = (pageHeight - margin * 2 - topHeaderH - bottomFooterH) - borderMarginMm * 2;

  const maxStitchesPerCol = options.paginateLarge ? Math.max(15, Math.floor(maxAvailableTileW / cellMm)) : grid.width;
  const maxStitchesPerRow = options.paginateLarge ? Math.max(15, Math.floor(maxAvailableTileH / cellMm)) : grid.height;
  const overlap = options.paginateLarge ? 3 : 0; // 3 stitches shaded overlap between pages

  const numCols = Math.ceil(grid.width / Math.max(1, maxStitchesPerCol - overlap));
  const numRows = Math.ceil(grid.height / Math.max(1, maxStitchesPerRow - overlap));
  const totalChartPages = numCols * numRows;

  let pageNum = 0;

  for (let rIdx = 0; rIdx < numRows; rIdx++) {
    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      pageNum++;
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const startX = cIdx === 0 ? 0 : cIdx * (maxStitchesPerCol - overlap);
      const endX = Math.min(grid.width, startX + maxStitchesPerCol);
      const overlapStartX = cIdx > 0 ? startX + overlap : startX;

      const startY = rIdx === 0 ? 0 : rIdx * (maxStitchesPerRow - overlap);
      const endY = Math.min(grid.height, startY + maxStitchesPerRow);
      const overlapStartY = rIdx > 0 ? startY + overlap : startY;

      const cols = endX - startX;
      const rows = endY - startY;

      // Page Header (if enabled)
      if (showHeaderFooter) {
        doc.setFillColor(30, 27, 75);
        doc.rect(0, 0, pageWidth, 16, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const sectionName = totalChartPages > 1 ? ` (Page ${pageNum} of ${totalChartPages})` : '';
        doc.text(`${title} — Chart${sectionName}`, margin, 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);
        doc.text(
          `Stitches: [${startX + 1}..${endX}] × [${startY + 1}..${endY}] • ${options.chartStyle === 'color_symbols' ? 'Color Symbols' : 'Black & White Chart'}`,
          pageWidth - margin,
          11,
          { align: 'right' }
        );
      }

      // Render the chart canvas tile
      const chartCanvas = renderChartPageCanvas(
        grid,
        data.artboardStitches,
        palette,
        options.chartStyle,
        startX,
        endX,
        startY,
        endY,
        overlapStartX,
        overlapStartY
      );

      // Enforce UNIFORM physical mm cell scale across all pages (including remnants)
      // Every stitch is EXACTLY cellMm wide and tall on paper!
      const pW = cols * cellMm + borderMarginMm * 2;
      const pH = rows * cellMm + borderMarginMm * 2;

      // Center within the printable chart area
      const pX = margin + (contentWidth - pW) / 2;
      const availableTileAreaH = pageHeight - margin * 2 - topHeaderH - bottomFooterH;
      const pY = margin + topHeaderH + (availableTileAreaH - pH) / 2;

      doc.addImage(chartCanvas.toDataURL('image/png'), 'PNG', pX, pY, pW, pH);

      // Page Footer with Mini Page Grid Map (if enabled)
      if (showHeaderFooter) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          '▲ Red arrows indicate pattern center. Gray shaded cells overlap adjacent pages.',
          margin,
          pageHeight - 6
        );

        if (totalChartPages > 1) {
          // Draw tiny overview thumbnail in lower right corner
          const mapW = 12;
          const mapH = 12;
          const mapX = pageWidth - margin - mapW;
          const mapY = pageHeight - mapH - 4;

          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.2);

          for (let ri = 0; ri < numRows; ri++) {
            for (let ci = 0; ci < numCols; ci++) {
              const cellX = mapX + (ci * mapW) / numCols;
              const cellY = mapY + (ri * mapH) / numRows;
              const cWidth = mapW / numCols;
              const cHeight = mapH / numRows;

              if (ri === rIdx && ci === cIdx) {
                doc.setFillColor(99, 102, 241); // Active indigo
                doc.rect(cellX, cellY, cWidth, cHeight, 'FD');
              } else {
                doc.setFillColor(243, 244, 246);
                doc.rect(cellX, cellY, cWidth, cHeight, 'FD');
              }
            }
          }
        }
      }
    }
  }

  return doc;
}

/**
 * Generates and downloads a complete, professional, print-ready PDF chart.
 */
export async function generatePrintReadyPdf(
  grid: GridDimensions,
  layers: Layer[],
  palette: PaletteColor[],
  fabricColorHex: string,
  options: PdfExportOptions
): Promise<void> {
  const doc = await createPdfDocument(grid, layers, palette, fabricColorHex, options);
  const cleanName = (options.title?.trim() || 'Cross_Stitch').replace(/[^a-zA-Z0-9_\-]/g, '_');
  doc.save(`${cleanName}_Chart.pdf`);
}

/**
 * Generates the PDF document and immediately opens the native browser print dialog.
 */
export async function printPdfDirectly(
  grid: GridDimensions,
  layers: Layer[],
  palette: PaletteColor[],
  fabricColorHex: string,
  options: PdfExportOptions
): Promise<void> {
  const doc = await createPdfDocument(grid, layers, palette, fabricColorHex, options);
  doc.autoPrint();
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Direct iframe print failed, falling back to window.open', e);
      window.open(blobUrl, '_blank');
    }
  };
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

