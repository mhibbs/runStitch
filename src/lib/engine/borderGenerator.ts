import type { MotifStamp, StitchType, CompositeBorder } from '../types';

export interface BorderGeneratorParams {
  motif?: MotifStamp;
  compositeBorder?: CompositeBorder;
  mode: 'perimeter_canvas' | 'perimeter_selection' | 'horizontal_band' | 'vertical_band';
  bounds: { x: number; y: number; width: number; height: number };
  margin: number;
  spacing: number;
  autoCorners: boolean;
  bandCoordinate?: number; // Y for horizontal, X for vertical
}

export interface PlacedStitch {
  x: number;
  y: number;
  dmc: string;
  type: StitchType;
}

export interface BorderFitMetrics {
  repeatsX: number;
  repeatsY: number;
  effectiveMarginX: number;
  effectiveMarginY: number;
  borderWidth: number;
  borderHeight: number;
  summary: string;
}

/**
 * Calculates exact integer repeats and symmetrical centering margins
 * so border motifs always repeat evenly without partial cuts or broken corners.
 */
export function calculateBorderFit(params: BorderGeneratorParams): BorderFitMetrics {
  const { motif, compositeBorder, mode, bounds, margin, spacing } = params;
  const W = bounds.width;
  const H = bounds.height;

  // Determine corner and runner dimensions
  let cornerW = 0;
  let cornerH = 0;
  let runnerW = 0;
  let runnerH = 0;

  if (compositeBorder) {
    cornerW = compositeBorder.cornerMotif.width;
    cornerH = compositeBorder.cornerMotif.height;
    runnerW = compositeBorder.runnerMotif.width;
    runnerH = compositeBorder.runnerMotif.height;
  } else if (motif) {
    const cornerDim = Math.max(motif.width, motif.height);
    cornerW = cornerDim;
    cornerH = cornerDim;
    runnerW = motif.width;
    runnerH = motif.height;
  } else {
    return {
      repeatsX: 0,
      repeatsY: 0,
      effectiveMarginX: margin,
      effectiveMarginY: margin,
      borderWidth: 0,
      borderHeight: 0,
      summary: 'No motif selected'
    };
  }

  if (mode === 'horizontal_band') {
    const availW = Math.max(0, W - 2 * margin);
    const step = runnerW + spacing;
    const repeatsX = availW >= runnerW ? 1 + Math.floor((availW - runnerW) / step) : 0;
    const bandW = repeatsX > 0 ? repeatsX * runnerW + (repeatsX - 1) * spacing : 0;
    const effMarginX = Math.max(0, Math.floor((W - bandW) / 2));

    return {
      repeatsX,
      repeatsY: 1,
      effectiveMarginX: effMarginX,
      effectiveMarginY: margin,
      borderWidth: bandW,
      borderHeight: runnerH,
      summary: repeatsX > 0
        ? `Fits ${repeatsX} repeats • Centered with ${effMarginX} st side margins`
        : 'Width too small for band'
    };
  }

  if (mode === 'vertical_band') {
    const availH = Math.max(0, H - 2 * margin);
    const step = runnerH + spacing;
    const repeatsY = availH >= runnerH ? 1 + Math.floor((availH - runnerH) / step) : 0;
    const bandH = repeatsY > 0 ? repeatsY * runnerH + (repeatsY - 1) * spacing : 0;
    const effMarginY = Math.max(0, Math.floor((H - bandH) / 2));

    return {
      repeatsX: 1,
      repeatsY,
      effectiveMarginX: margin,
      effectiveMarginY: effMarginY,
      borderWidth: runnerW,
      borderHeight: bandH,
      summary: repeatsY > 0
        ? `Fits ${repeatsY} repeats • Centered with ${effMarginY} st top/bottom margins`
        : 'Height too small for band'
    };
  }

  // Perimeter Mode (canvas or selection)
  let minCornerSpaceX = 0;
  let minCornerSpaceY = 0;

  if (compositeBorder) {
    minCornerSpaceX = cornerW * 2;
    minCornerSpaceY = cornerH * 2;
  } else if (motif) {
    // For single seamless unit motif:
    // Along Top edge: Top-Left corner is motif.width, Top-Right corner is motif.height
    // Along Bottom edge: Bottom-Left corner is motif.height, Bottom-Right corner is motif.width
    // Along Left edge: Top-Left is motif.height, Bottom-Left is motif.width
    // Along Right edge: Top-Right is motif.width, Bottom-Right is motif.height
    // On all four edges, the combined corner space consumed is exactly motif.width + motif.height
    minCornerSpaceX = motif.width + motif.height;
    minCornerSpaceY = motif.width + motif.height;
  }

  const availW = Math.max(0, W - 2 * margin);
  const availH = Math.max(0, H - 2 * margin);

  // Runners between corners
  const spaceForRunnersX = Math.max(0, availW - minCornerSpaceX);
  const stepX = runnerW + spacing;
  const gapAtEndsX = spacing > 0 ? spacing : 0;
  const repeatsX = spaceForRunnersX >= runnerW + gapAtEndsX * 2
    ? Math.floor((spaceForRunnersX - gapAtEndsX * 2 + spacing) / stepX)
    : (spaceForRunnersX >= runnerW ? Math.floor(spaceForRunnersX / runnerW) : 0);

  const runnerSpanX = repeatsX > 0 ? repeatsX * runnerW + (repeatsX - 1) * spacing + gapAtEndsX * 2 : 0;
  const totalBorderW = minCornerSpaceX + runnerSpanX;
  const effMarginX = Math.max(0, Math.floor((W - totalBorderW) / 2));

  // Vertical sides: runner is rotated 90°, so its along-edge length is runnerW (motif.width)
  const runnerVLength = runnerW;
  const spaceForRunnersY = Math.max(0, availH - minCornerSpaceY);
  const stepY = runnerVLength + spacing;
  const gapAtEndsY = spacing > 0 ? spacing : 0;
  const repeatsY = spaceForRunnersY >= runnerVLength + gapAtEndsY * 2
    ? Math.floor((spaceForRunnersY - gapAtEndsY * 2 + spacing) / stepY)
    : (spaceForRunnersY >= runnerVLength ? Math.floor(spaceForRunnersY / runnerVLength) : 0);

  const runnerSpanY = repeatsY > 0 ? repeatsY * runnerVLength + (repeatsY - 1) * spacing + gapAtEndsY * 2 : 0;
  const totalBorderH = minCornerSpaceY + runnerSpanY;
  const effMarginY = Math.max(0, Math.floor((H - totalBorderH) / 2));

  return {
    repeatsX,
    repeatsY,
    effectiveMarginX: effMarginX,
    effectiveMarginY: effMarginY,
    borderWidth: totalBorderW,
    borderHeight: totalBorderH,
    summary: (totalBorderW <= W && totalBorderH <= H)
      ? `Fits ${repeatsX} horiz & ${repeatsY} vert repeats • Balanced ${effMarginX}×${effMarginY} st margins`
      : 'Area too small for selected border'
  };
}

/**
 * Stamps a motif at (startX, startY) with optional 2D transformation.
 */
function stampMotif(
  motif: MotifStamp,
  startX: number,
  startY: number,
  transform: 'none' | 'flipH' | 'flipV' | 'rotate180' | 'rotate90CW' | 'rotate90CCW',
  placedMap: Set<string>,
  result: PlacedStitch[]
) {
  for (const [relKey, stitch] of Object.entries(motif.stitches)) {
    const [rx, ry] = relKey.split(',').map(Number);
    let tx = rx;
    let ty = ry;

    switch (transform) {
      case 'flipH':
        tx = motif.width - 1 - rx;
        break;
      case 'flipV':
        ty = motif.height - 1 - ry;
        break;
      case 'rotate180':
        tx = motif.width - 1 - rx;
        ty = motif.height - 1 - ry;
        break;
      case 'rotate90CW':
        tx = motif.height - 1 - ry;
        ty = rx;
        break;
      case 'rotate90CCW':
        tx = ry;
        ty = motif.width - 1 - rx;
        break;
    }

    const gx = startX + tx;
    const gy = startY + ty;
    const key = `${gx},${gy}`;

    if (!placedMap.has(key)) {
      placedMap.add(key);
      result.push({
        x: gx,
        y: gy,
        dmc: stitch.dmc,
        type: stitch.type
      });
    }
  }
}

/**
 * Generates an array of placed stitches for a repeated border pattern with auto-fitting math.
 */
export function generateBorderStitches(params: BorderGeneratorParams): PlacedStitch[] {
  const { motif, compositeBorder, mode, bounds, spacing, autoCorners, bandCoordinate } = params;
  const result: PlacedStitch[] = [];
  const placedMap = new Set<string>();

  const fit = calculateBorderFit(params);
  const activeMotif = compositeBorder ? compositeBorder.runnerMotif : motif;
  if (!activeMotif && !compositeBorder) return result;

  // 1. Horizontal Band
  if (mode === 'horizontal_band' && activeMotif) {
    const y = bandCoordinate !== undefined ? bandCoordinate : Math.floor(bounds.y + (bounds.height - activeMotif.height) / 2);
    const startX = bounds.x + fit.effectiveMarginX;
    const step = activeMotif.width + spacing;

    for (let i = 0; i < fit.repeatsX; i++) {
      const x = startX + i * step;
      stampMotif(activeMotif, x, y, 'none', placedMap, result);
    }
    return result;
  }

  // 2. Vertical Band
  if (mode === 'vertical_band' && activeMotif) {
    const x = bandCoordinate !== undefined ? bandCoordinate : Math.floor(bounds.x + (bounds.width - activeMotif.width) / 2);
    const startY = bounds.y + fit.effectiveMarginY;
    const step = activeMotif.height + spacing;

    for (let i = 0; i < fit.repeatsY; i++) {
      const y = startY + i * step;
      stampMotif(activeMotif, x, y, 'none', placedMap, result);
    }
    return result;
  }

  // 3. Perimeter (Canvas or Selection)
  if (compositeBorder) {
    const corner = compositeBorder.cornerMotif;
    const runner = compositeBorder.runnerMotif;

    const left = bounds.x + fit.effectiveMarginX;
    const right = left + fit.borderWidth;
    const top = bounds.y + fit.effectiveMarginY;
    const bottom = top + fit.borderHeight;

    // Place 4 distinct corners
    stampMotif(corner, left, top, 'none', placedMap, result); // Top-Left
    stampMotif(corner, right - corner.width, top, autoCorners ? 'flipH' : 'none', placedMap, result); // Top-Right
    stampMotif(corner, left, bottom - corner.height, autoCorners ? 'flipV' : 'none', placedMap, result); // Bottom-Left
    stampMotif(corner, right - corner.width, bottom - corner.height, autoCorners ? 'rotate180' : 'none', placedMap, result); // Bottom-Right

    // Top & Bottom Runners (Flush with outer edges: top at Y=top, bottom at Y=bottom-runner.height)
    const runnerStartX = left + corner.width + (spacing > 0 ? spacing : 0);
    const stepX = runner.width + spacing;
    const topRunnerY = top;
    const bottomRunnerY = bottom - runner.height;

    for (let i = 0; i < fit.repeatsX; i++) {
      const rx = runnerStartX + i * stepX;
      stampMotif(runner, rx, topRunnerY, 'none', placedMap, result);
      stampMotif(runner, rx, bottomRunnerY, autoCorners ? 'flipV' : 'none', placedMap, result);
    }

    // Left & Right Runners (Runner rotated 90° vertically: width = runner.height, height = runner.width)
    // Flush with outer edges: left at X=left, right at X=right-runner.height
    const runnerStartY = top + corner.height + (spacing > 0 ? spacing : 0);
    const stepY = runner.width + spacing;
    const leftRunnerX = left;
    const rightRunnerX = right - runner.height;

    for (let j = 0; j < fit.repeatsY; j++) {
      const ry = runnerStartY + j * stepY;
      stampMotif(runner, leftRunnerX, ry, 'rotate90CW', placedMap, result);
      stampMotif(runner, rightRunnerX, ry, autoCorners ? 'rotate90CCW' : 'rotate90CW', placedMap, result);
    }

    return result;
  }

  // Single Seamless Motif Perimeter
  if (motif) {
    const left = bounds.x + fit.effectiveMarginX;
    const right = left + fit.borderWidth;
    const top = bounds.y + fit.effectiveMarginY;
    const bottom = top + fit.borderHeight;

    const gapAtEndsX = spacing > 0 ? spacing : 0;
    const gapAtEndsY = spacing > 0 ? spacing : 0;

    // 4 Corners: outer edges flush with outer frame boundary
    // Top-Left (0°): width = motif.width, height = motif.height
    stampMotif(motif, left, top, 'none', placedMap, result);

    // Top-Right (90° CW): rotated width = motif.height, rotated height = motif.width
    // Flush at outer top & right: X: right - motif.height, Y: top
    if (right - motif.height > left) {
      stampMotif(motif, right - motif.height, top, autoCorners ? 'rotate90CW' : 'none', placedMap, result);
    }

    // Bottom-Left (90° CCW): rotated width = motif.height, rotated height = motif.width
    // Flush at outer bottom & left: X: left, Y: bottom - motif.width
    if (bottom - motif.width > top) {
      stampMotif(motif, left, bottom - motif.width, autoCorners ? 'rotate90CCW' : 'none', placedMap, result);
    }

    // Bottom-Right (180°): rotated width = motif.width, rotated height = motif.height
    // Flush at outer bottom & right: X: right - motif.width, Y: bottom - motif.height
    if (right - motif.width > left && bottom - motif.height > top) {
      stampMotif(motif, right - motif.width, bottom - motif.height, autoCorners ? 'rotate180' : 'none', placedMap, result);
    }

    // Top Runner: starts immediately after Top-Left corner (X = left + motif.width), flush with Y = top
    const topRunnerStartX = left + motif.width + gapAtEndsX;
    const stepX = motif.width + spacing;
    for (let i = 0; i < fit.repeatsX; i++) {
      const rx = topRunnerStartX + i * stepX;
      stampMotif(motif, rx, top, 'none', placedMap, result);
    }

    // Bottom Runner: starts immediately after Bottom-Left corner (X = left + motif.height), flush with Y = bottom - motif.height
    const bottomRunnerStartX = left + motif.height + gapAtEndsX;
    const bottomRunnerY = bottom - motif.height;
    if (bottom - motif.height > top) {
      for (let i = 0; i < fit.repeatsX; i++) {
        const rx = bottomRunnerStartX + i * stepX;
        stampMotif(motif, rx, bottomRunnerY, autoCorners ? 'rotate180' : 'none', placedMap, result);
      }
    }

    // Left Runner: starts immediately after Top-Left corner (Y = top + motif.height), flush with X = left
    // Motif rotated 90° CCW (along edge height is motif.width, width is motif.height)
    const leftRunnerStartY = top + motif.height + gapAtEndsY;
    const stepY = motif.width + spacing;
    for (let j = 0; j < fit.repeatsY; j++) {
      const ry = leftRunnerStartY + j * stepY;
      stampMotif(motif, left, ry, autoCorners ? 'rotate90CCW' : 'rotate90CW', placedMap, result);
    }

    // Right Runner: starts immediately after Top-Right corner (Y = top + motif.width), flush with X = right - motif.height
    // Motif rotated 90° CW (along edge height is motif.width, width is motif.height)
    const rightRunnerStartY = top + motif.width + gapAtEndsY;
    const rightRunnerX = right - motif.height;
    if (right - motif.height > left) {
      for (let j = 0; j < fit.repeatsY; j++) {
        const ry = rightRunnerStartY + j * stepY;
        stampMotif(motif, rightRunnerX, ry, 'rotate90CW', placedMap, result);
      }
    }

    return result;
  }

  return result;
}
