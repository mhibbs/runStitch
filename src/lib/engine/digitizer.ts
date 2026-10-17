import { DMC_CATALOG, type DMCEntry } from '../data/dmcPalette';
import type { DitherMode, DigitizerOptions, Stitch, StitchType } from '../types';

export interface DigitizedCell {
  x: number;      // Canvas grid X
  y: number;      // Canvas grid Y
  dmc: string;    // DMC floss code
  name: string;   // DMC color name
  hex: string;    // DMC color hex
  type: StitchType;
}

export interface DigitizerResult {
  stitches: DigitizedCell[];
  palette: DMCEntry[];
  stats: {
    totalStitches: number;
    colorCount: number;
    width: number;
    height: number;
  };
}

// ----------------------------------------------------
// Color Science: RGB to CIE Lab (D65 standard illuminant)
// ----------------------------------------------------
export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export function rgbToLab(r: number, g: number, b: number): LabColor {
  // sRGB to linear RGB
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;

  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  // Linear RGB to XYZ (D65 standard observer)
  const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
  const Y = (R * 0.2126729 + G * 0.7151522 + B * 0.0721750) / 1.00000;
  const Z = (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) / 1.08883;

  const fX = X > 0.008856 ? Math.cbrt(X) : (7.787 * X) + (16 / 116);
  const fY = Y > 0.008856 ? Math.cbrt(Y) : (7.787 * Y) + (16 / 116);
  const fZ = Z > 0.008856 ? Math.cbrt(Z) : (7.787 * Z) + (16 / 116);

  return {
    L: (116 * fY) - 16,
    a: 500 * (fX - fY),
    b: 200 * (fY - fZ)
  };
}

export function labDistance(c1: LabColor, c2: LabColor): number {
  const dL = c1.L - c2.L;
  const da = c1.a - c2.a;
  const db = c1.b - c2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

// Precompute Lab coordinates for all catalog entries for instant lookup
interface CachedDMC extends DMCEntry {
  lab: LabColor;
}

const DMC_WITH_LAB: CachedDMC[] = DMC_CATALOG.map(entry => ({
  ...entry,
  lab: rgbToLab(entry.r, entry.g, entry.b)
}));

/**
 * Finds the perceptually closest DMC thread color to an RGB pixel.
 */
export function findClosestDMC(r: number, g: number, b: number, pool: CachedDMC[] = DMC_WITH_LAB): CachedDMC {
  const targetLab = rgbToLab(r, g, b);
  let bestDist = Infinity;
  let bestEntry = pool[0];

  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i];
    const dist = labDistance(targetLab, entry.lab);
    if (dist < bestDist) {
      bestDist = dist;
      bestEntry = entry;
      if (dist < 1.0) break; // Imperceptible difference
    }
  }

  return bestEntry;
}

// ----------------------------------------------------
// Smart Image Complexity & Variance Analysis
// ----------------------------------------------------
export interface ImageAnalysis {
  recommendedColors: number;
  isGrayscale: boolean;
  hasAlpha: boolean;
  uniqueColorCount: number;
}

export type ImageComplexityAnalysis = ImageAnalysis;

export function analyzeImageComplexity(source: HTMLImageElement | ImageData): ImageAnalysis {
  let imgData: ImageData;
  if ('data' in source) {
    imgData = source;
  } else {
    const canvas = document.createElement('canvas');
    const sampleW = Math.min(128, source.naturalWidth || 64);
    const sampleH = Math.min(128, source.naturalHeight || 64);
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { recommendedColors: 14, isGrayscale: false, hasAlpha: false, uniqueColorCount: 50 };
    }
    ctx.drawImage(source, 0, 0, sampleW, sampleH);
    imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  }

  const data = imgData.data;
  const len = data.length;
  let hasAlpha = false;
  let maxSat = 0;
  const colorBuckets = new Set<number>();

  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3];
    if (a < 240) hasAlpha = true;
    if (a < 50) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Saturation
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat > maxSat) maxSat = sat;

    // 4-bit quantized color key for entropy estimation
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    colorBuckets.add(key);
  }

  const isGrayscale = maxSat < 0.08;
  const unique = colorBuckets.size;

  let recommended = 14;
  if (isGrayscale) {
    if (unique < 8) recommended = 3;
    else if (unique < 25) recommended = 6;
    else recommended = 8;
  } else {
    if (unique < 15) recommended = 5;
    else if (unique < 50) recommended = 10;
    else if (unique < 150) recommended = 16;
    else if (unique < 400) recommended = 22;
    else recommended = 28;
  }

  return {
    recommendedColors: recommended,
    isGrayscale,
    hasAlpha,
    uniqueColorCount: unique
  };
}

// ----------------------------------------------------
// Color Quantization: Median Cut Algorithm in Lab space
// ----------------------------------------------------
interface ColorBox {
  pixels: { r: number; g: number; b: number; weight: number }[];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
  volume: number;
}

function createBox(pixels: { r: number; g: number; b: number; weight: number }[]): ColorBox {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }
  const volume = (rMax - rMin) * (gMax - gMin) * (bMax - bMin);
  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax, volume };
}

function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  const rRange = box.rMax - box.rMin;
  const gRange = box.gMax - box.gMin;
  const bRange = box.bMax - box.bMin;

  let comp: 'r' | 'g' | 'b' = 'r';
  if (gRange >= rRange && gRange >= bRange) comp = 'g';
  else if (bRange >= rRange && bRange >= gRange) comp = 'b';

  box.pixels.sort((p1, p2) => p1[comp] - p2[comp]);

  const mid = Math.floor(box.pixels.length / 2);
  return [
    createBox(box.pixels.slice(0, mid)),
    createBox(box.pixels.slice(mid))
  ];
}

/**
 * Extracts the optimal K representative DMC colors from the image cells.
 */
export function extractDmcPalette(
  pixels: { r: number; g: number; b: number }[],
  k: number
): CachedDMC[] {
  if (pixels.length === 0) return [DMC_WITH_LAB[0]];

  // Histogram to combine duplicate colors and speed up median cut
  const histo = new Map<number, { r: number; g: number; b: number; weight: number }>();
  for (const p of pixels) {
    const key = (p.r << 16) | (p.g << 8) | p.b;
    const existing = histo.get(key);
    if (existing) {
      existing.weight++;
    } else {
      histo.set(key, { r: p.r, g: p.g, b: p.b, weight: 1 });
    }
  }

  const uniqueList = Array.from(histo.values());
  if (uniqueList.length <= k) {
    const dmcSet = new Map<string, CachedDMC>();
    for (const p of uniqueList) {
      const match = findClosestDMC(p.r, p.g, p.b);
      dmcSet.set(match.code, match);
    }
    return Array.from(dmcSet.values());
  }

  let boxes: ColorBox[] = [createBox(uniqueList)];

  while (boxes.length < k) {
    // Pick box with highest volume
    boxes.sort((a, b) => b.volume - a.volume);
    const toSplit = boxes.shift();
    if (!toSplit || toSplit.pixels.length <= 1) {
      if (toSplit) boxes.push(toSplit);
      break;
    }
    const [b1, b2] = splitBox(toSplit);
    boxes.push(b1);
    boxes.push(b2);
  }

  const dmcSet = new Map<string, CachedDMC>();
  for (const box of boxes) {
    let sumR = 0, sumG = 0, sumB = 0, totalW = 0;
    for (const p of box.pixels) {
      sumR += p.r * p.weight;
      sumG += p.g * p.weight;
      sumB += p.b * p.weight;
      totalW += p.weight;
    }
    if (totalW > 0) {
      const avgR = Math.round(sumR / totalW);
      const avgG = Math.round(sumG / totalW);
      const avgB = Math.round(sumB / totalW);
      const match = findClosestDMC(avgR, avgG, avgB);
      dmcSet.set(match.code, match);
    }
  }

  return Array.from(dmcSet.values());
}

// ----------------------------------------------------
// Main Digitization Function: Samples & Dithers Image
// ----------------------------------------------------
export function digitizeImageToStitches(
  imageEl: HTMLImageElement,
  gridX: number,
  gridY: number,
  targetWidthStitches: number,
  targetHeightStitches: number,
  options: DigitizerOptions
): DigitizerResult {
  const W = Math.max(1, Math.round(targetWidthStitches));
  const H = Math.max(1, Math.round(targetHeightStitches));

  // Render image onto offscreen canvas scaled exactly to W × H stitch cells
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      stitches: [],
      palette: [],
      stats: { totalStitches: 0, colorCount: 0, width: W, height: H }
    };
  }

  ctx.drawImage(imageEl, 0, 0, W, H);
  const imgData = ctx.getImageData(0, 0, W, H);
  const pixels = imgData.data;

  // Background removal color matching
  let bgRgb = { r: 255, g: 255, b: 255 };
  let bgLab: LabColor | null = null;
  const bgTol = (options.backgroundTolerance ?? 15) * 1.5;
  if (options.ignoreBackground && options.backgroundHex) {
    bgRgb = hexToRgb(options.backgroundHex);
    bgLab = rgbToLab(bgRgb.r, bgRgb.g, bgRgb.b);
  }

  // Pass 1: Identify valid foreground pixels
  const validCells: boolean[] = new Array(W * H).fill(false);
  const samplePixels: { r: number; g: number; b: number }[] = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      // Alpha threshold
      if (a < 100) continue;

      // Color key background exclusion
      if (options.ignoreBackground && bgLab) {
        const cellLab = rgbToLab(r, g, b);
        if (labDistance(cellLab, bgLab) <= bgTol) {
          continue;
        }
      }

      validCells[y * W + x] = true;
      samplePixels.push({ r, g, b });
    }
  }

  // Pass 2: Quantize palette to target K DMC colors
  const activePalette = extractDmcPalette(samplePixels, Math.max(2, options.maxColors));

  // Pass 3: Map cells to DMC with optional Error Diffusion Dithering
  // Buffers for floating-point RGB error diffusion
  const bufR = new Float32Array(W * H);
  const bufG = new Float32Array(W * H);
  const bufB = new Float32Array(W * H);

  for (let i = 0; i < W * H; i++) {
    const idx = i * 4;
    bufR[i] = pixels[idx];
    bufG[i] = pixels[idx + 1];
    bufB[i] = pixels[idx + 2];
  }

  const resultStitches: DigitizedCell[] = [];
  const usedDmcMap = new Map<string, DMCEntry>();

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const cellIdx = y * W + x;
      if (!validCells[cellIdx]) continue;

      const curR = Math.min(255, Math.max(0, bufR[cellIdx]));
      const curG = Math.min(255, Math.max(0, bufG[cellIdx]));
      const curB = Math.min(255, Math.max(0, bufB[cellIdx]));

      // Find best match strictly among the activePalette
      const best = findClosestDMC(curR, curG, curB, activePalette);
      usedDmcMap.set(best.code, best);

      resultStitches.push({
        x: gridX + x,
        y: gridY + y,
        dmc: best.code,
        name: best.name,
        hex: best.hex,
        type: 'full'
      });

      // Error diffusion
      const errR = curR - best.r;
      const errG = curG - best.g;
      const errB = curB - best.b;

      if (options.ditherMode === 'floyd_steinberg') {
        // Floyd-Steinberg: (x+1, y) += 7/16, (x-1, y+1) += 3/16, (x, y+1) += 5/16, (x+1, y+1) += 1/16
        if (x + 1 < W) {
          bufR[cellIdx + 1] += (errR * 7) / 16;
          bufG[cellIdx + 1] += (errG * 7) / 16;
          bufB[cellIdx + 1] += (errB * 7) / 16;
        }
        if (y + 1 < H) {
          if (x - 1 >= 0) {
            const nextIdx = (y + 1) * W + (x - 1);
            bufR[nextIdx] += (errR * 3) / 16;
            bufG[nextIdx] += (errG * 3) / 16;
            bufB[nextIdx] += (errB * 3) / 16;
          }
          const downIdx = (y + 1) * W + x;
          bufR[downIdx] += (errR * 5) / 16;
          bufG[downIdx] += (errG * 5) / 16;
          bufB[downIdx] += (errB * 5) / 16;
          if (x + 1 < W) {
            const downRightIdx = (y + 1) * W + (x + 1);
            bufR[downRightIdx] += (errR * 1) / 16;
            bufG[downRightIdx] += (errG * 1) / 16;
            bufB[downRightIdx] += (errB * 1) / 16;
          }
        }
      } else if (options.ditherMode === 'atkinson') {
        // Atkinson: 1/8 to (x+1, y), (x+2, y), (x-1, y+1), (x, y+1), (x+1, y+1), (x, y+2)
        const d8 = 1 / 8;
        if (x + 1 < W) {
          bufR[cellIdx + 1] += errR * d8;
          bufG[cellIdx + 1] += errG * d8;
          bufB[cellIdx + 1] += errB * d8;
        }
        if (x + 2 < W) {
          bufR[cellIdx + 2] += errR * d8;
          bufG[cellIdx + 2] += errG * d8;
          bufB[cellIdx + 2] += errB * d8;
        }
        if (y + 1 < H) {
          if (x - 1 >= 0) {
            const i1 = (y + 1) * W + (x - 1);
            bufR[i1] += errR * d8;
            bufG[i1] += errG * d8;
            bufB[i1] += errB * d8;
          }
          const i2 = (y + 1) * W + x;
          bufR[i2] += errR * d8;
          bufG[i2] += errG * d8;
          bufB[i2] += errB * d8;
          if (x + 1 < W) {
            const i3 = (y + 1) * W + (x + 1);
            bufR[i3] += errR * d8;
            bufG[i3] += errG * d8;
            bufB[i3] += errB * d8;
          }
        }
        if (y + 2 < H) {
          const i4 = (y + 2) * W + x;
          bufR[i4] += errR * d8;
          bufG[i4] += errG * d8;
          bufB[i4] += errB * d8;
        }
      }
    }
  }

  return {
    stitches: resultStitches,
    palette: Array.from(usedDmcMap.values()),
    stats: {
      totalStitches: resultStitches.length,
      colorCount: usedDmcMap.size,
      width: W,
      height: H
    }
  };
}
