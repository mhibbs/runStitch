/**
 * Curated Google Fonts catalog and dynamic font loader for XStitcher Typography.
 */

export interface CuratedFont {
  name: string;
  family: string;
  category: 'craft' | 'pixel' | 'script' | 'sampler_serif' | 'modern';
  description: string;
  googleFontQuery: string;
  sampleText: string;
  suggestedSize: number; // in stitches
}

export const FONT_CATEGORIES = [
  { id: 'craft', label: 'Craft & Motifs' },
  { id: 'pixel', label: 'Pixel & 8-Bit' },
  { id: 'script', label: 'Cursive & Script' },
  { id: 'sampler_serif', label: 'Sampler Serifs' },
  { id: 'modern', label: 'Modern Sans' }
] as const;

// 1 Curated Font per Category as the primary defaults requested by user
export const DEFAULT_CURATED_FONTS: CuratedFont[] = [
  {
    name: 'Yarndings 20',
    family: 'Yarndings 20',
    category: 'craft',
    description: 'Needlework, embroidery, and knitting icon glyphs',
    googleFontQuery: 'family=Yarndings+20',
    sampleText: 'abcdefghijk',
    suggestedSize: 20
  },
  {
    name: 'Silkscreen',
    family: 'Silkscreen',
    category: 'pixel',
    description: 'Crisp 8-bit geometric pixel typography',
    googleFontQuery: 'family=Silkscreen:wght@400;700',
    sampleText: 'CROSS STITCH',
    suggestedSize: 12
  },
  {
    name: 'Great Vibes',
    family: 'Great Vibes',
    category: 'script',
    description: 'Flowing, graceful cursive sampler calligraphy',
    googleFontQuery: 'family=Great+Vibes',
    sampleText: 'Bless This Home',
    suggestedSize: 24
  },
  {
    name: 'Cinzel',
    family: 'Cinzel',
    category: 'sampler_serif',
    description: 'Classical Roman proportions, iconic for heirloom samplers',
    googleFontQuery: 'family=Cinzel:wght@400..700',
    sampleText: 'SAMPLER 2026',
    suggestedSize: 18
  },
  {
    name: 'Comfortaa',
    family: 'Comfortaa',
    category: 'modern',
    description: 'Friendly, rounded modern geometric letterforms',
    googleFontQuery: 'family=Comfortaa:wght@400..700',
    sampleText: 'Handmade with Love',
    suggestedSize: 18
  }
];

export const EXTENDED_FONTS: CuratedFont[] = [
  // Craft
  {
    name: 'Yarndings 12',
    family: 'Yarndings 12',
    category: 'craft',
    description: 'Charming yarn, craft tools, and stitching motif symbols',
    googleFontQuery: 'family=Yarndings+12',
    sampleText: 'abcdefABCDEF',
    suggestedSize: 18
  },
  {
    name: 'Yarndings 20 Charted',
    family: 'Yarndings 20 Charted',
    category: 'craft',
    description: 'Authentic cross-stitch charted symbols and decorative motifs',
    googleFontQuery: 'family=Yarndings+20+Charted',
    sampleText: '1234567890',
    suggestedSize: 20
  },
  {
    name: 'Jacquard 12',
    family: 'Jacquard 12',
    category: 'craft',
    description: 'Woven tapestry pixelated historical lettering',
    googleFontQuery: 'family=Jacquard+12',
    sampleText: 'Home Sweet Home',
    suggestedSize: 16
  },
  // Pixel
  {
    name: 'Press Start 2P',
    family: 'Press Start 2P',
    category: 'pixel',
    description: 'Classic arcade chunky retro bitmap font',
    googleFontQuery: 'family=Press+Start+2P',
    sampleText: 'PRESS START',
    suggestedSize: 14
  },
  {
    name: 'VT323',
    family: 'VT323',
    category: 'pixel',
    description: 'Retro monochrome CRT terminal dot matrix',
    googleFontQuery: 'family=VT323',
    sampleText: 'SYSTEM READY 1984',
    suggestedSize: 18
  },
  {
    name: 'Pixelify Sans',
    family: 'Pixelify Sans',
    category: 'pixel',
    description: 'Modern high-resolution pixel letterforms',
    googleFontQuery: 'family=Pixelify+Sans:wght@400..700',
    sampleText: 'Handmade with Love',
    suggestedSize: 16
  },
  // Script
  {
    name: 'Dancing Script',
    family: 'Dancing Script',
    category: 'script',
    description: 'Lively, warm handwritten cursive script',
    googleFontQuery: 'family=Dancing+Script:wght@400..700',
    sampleText: 'Bless This Nest',
    suggestedSize: 20
  },
  {
    name: 'Pacifico',
    family: 'Pacifico',
    category: 'script',
    description: 'Fun, vibrant brush script lettering',
    googleFontQuery: 'family=Pacifico',
    sampleText: 'Good Vibes Only',
    suggestedSize: 22
  },
  {
    name: 'Caveat',
    family: 'Caveat',
    category: 'script',
    description: 'Warm, natural handwritten signature script',
    googleFontQuery: 'family=Caveat:wght@400..700',
    sampleText: 'Stitched for You',
    suggestedSize: 22
  },
  // Serif
  {
    name: 'Playfair Display',
    family: 'Playfair Display',
    category: 'sampler_serif',
    description: 'Regal antique high-contrast serif lettering',
    googleFontQuery: 'family=Playfair+Display:ital,wght@0,400..700;1,400..700',
    sampleText: 'Home & Hearth',
    suggestedSize: 20
  },
  {
    name: 'MedievalSharp',
    family: 'MedievalSharp',
    category: 'sampler_serif',
    description: 'Gothic medieval sampler alphabet',
    googleFontQuery: 'family=MedievalSharp',
    sampleText: 'Once Upon A Time',
    suggestedSize: 18
  },
  // Modern
  {
    name: 'Outfit',
    family: 'Outfit',
    category: 'modern',
    description: 'Clean, modern geometric sans-serif',
    googleFontQuery: 'family=Outfit:wght@400..700',
    sampleText: 'CREATE TODAY',
    suggestedSize: 16
  },
  {
    name: 'Bungee',
    family: 'Bungee',
    category: 'modern',
    description: 'Ultra-bold chunky headline lettering',
    googleFontQuery: 'family=Bungee',
    sampleText: 'CROSS STITCH',
    suggestedSize: 18
  }
];

export const CURATED_FONTS: CuratedFont[] = [
  ...DEFAULT_CURATED_FONTS,
  ...EXTENDED_FONTS
];

import { writable } from 'svelte/store';

export interface UserUploadedFont {
  name: string;
  family: string;
  format: string;
}

export const customUploadedFonts = writable<UserUploadedFont[]>([]);
export const favoriteFontFamilies = writable<string[]>(loadInitialFavorites());

function loadInitialFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('xstitcher_favorite_fonts');
    return raw ? JSON.parse(raw) : ['Comfortaa', 'Cinzel', 'Silkscreen'];
  } catch {
    return ['Comfortaa', 'Cinzel', 'Silkscreen'];
  }
}

export function toggleFavoriteFont(family: string) {
  favoriteFontFamilies.update(favs => {
    const next = favs.includes(family)
      ? favs.filter(f => f !== family)
      : [...favs, family];
    try {
      localStorage.setItem('xstitcher_favorite_fonts', JSON.stringify(next));
    } catch (_) {}
    return next;
  });
}

/**
 * Loads a user-provided font file (.ttf, .otf, .woff, .woff2) into the browser FontFace set.
 */
export async function loadCustomFontFile(file: File): Promise<string> {
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim() || 'CustomFont';
  
  const ext = file.name.split('.').pop()?.toLowerCase() || 'ttf';
  const buffer = await file.arrayBuffer();

  const fontFace = new FontFace(cleanName, buffer);
  await fontFace.load();
  document.fonts.add(fontFace);
  LOADED_FONTS.add(cleanName);

  customUploadedFonts.update(list => {
    if (list.some(f => f.family.toLowerCase() === cleanName.toLowerCase())) return list;
    return [...list, { name: cleanName, family: cleanName, format: ext }];
  });

  fontsReadyTrigger.update(n => n + 1);
  return cleanName;
}

export const fontsReadyTrigger = writable<number>(0);
const LOADED_FONTS = new Set<string>();
let isPreloadingStarted = false;

/**
 * Preloads all curated Google Fonts in the background so dropdown previews and
 * canvas typography render in their genuine typefaces immediately.
 */
export function preloadAllCuratedFonts() {
  if (typeof window === 'undefined' || isPreloadingStarted) return;
  isPreloadingStarted = true;

  const bundleLinkId = 'google-fonts-curated-bundle';
  if (!document.getElementById(bundleLinkId)) {
    const combinedFamilies = [
      'family=Yarndings+12',
      'family=Yarndings+20',
      'family=Yarndings+20+Charted',
      'family=Jacquard+12',
      'family=Jacquarda+Bastarda+9',
      'family=Silkscreen:wght@400;700',
      'family=Press+Start+2P',
      'family=VT323',
      'family=DotGothic16',
      'family=Pixelify+Sans:wght@400..700',
      'family=Great+Vibes',
      'family=Dancing+Script:wght@400..700',
      'family=Pacifico',
      'family=Caveat:wght@400..700',
      'family=Cinzel:wght@400..700',
      'family=Playfair+Display:ital,wght@0,400..700;1,400..700',
      'family=Marcellus',
      'family=MedievalSharp',
      'family=Comfortaa:wght@400..700',
      'family=Outfit:wght@400..700',
      'family=Bungee'
    ].join('&');

    const link = document.createElement('link');
    link.id = bundleLinkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${combinedFamilies}&display=swap`;
    document.head.appendChild(link);
  }

  // Trigger ready notification once browser finishes layout
  if (document.fonts) {
    document.fonts.ready.then(() => {
      for (const f of CURATED_FONTS) {
        LOADED_FONTS.add(f.family);
      }
      fontsReadyTrigger.update(n => n + 1);
    }).catch(err => {
      console.warn('Font bundle ready failed:', err);
      fontsReadyTrigger.update(n => n + 1);
    });
  }
}

/**
 * Dynamically loads a Google Font by family name.
 */
export async function loadGoogleFont(fontInput: CuratedFont | string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const fontName = typeof fontInput === 'string' ? fontInput : fontInput.family;
  if (LOADED_FONTS.has(fontName)) return true;

  const curated = CURATED_FONTS.find(f => f.family.toLowerCase() === fontName.toLowerCase());
  const query = curated ? curated.googleFontQuery : `family=${encodeURIComponent(fontName)}:ital,wght@0,400..700;1,400..700`;

  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    document.head.appendChild(link);
  }

  try {
    // Wait for the font to be ready in the document
    await document.fonts.load(`16px "${fontName}"`);
    LOADED_FONTS.add(fontName);
    fontsReadyTrigger.update(n => n + 1);
    return true;
  } catch (err) {
    console.warn(`Could not load font ${fontName}:`, err);
    LOADED_FONTS.add(fontName); // Mark to avoid infinite re-fetching
    return false;
  }
}

/**
 * Calculates accurate bounding box dimensions in grid stitches for a given text configuration.
 */
export function measureTextDimensions(
  text: string,
  fontFamily: string,
  fontSize: number,
  bold: boolean = false,
  italic: boolean = false,
  lineHeight: number = 1.25,
  letterSpacing: number = 0
): { width: number; height: number; lines: string[] } {
  if (typeof document === 'undefined') {
    return { width: Math.max(10, text.length * Math.round(fontSize * 0.6)), height: fontSize, lines: [text] };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { width: Math.max(10, text.length * Math.round(fontSize * 0.6)), height: fontSize, lines: [text] };
  }

  const lines = text.split('\n');
  const fontSpec = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px "${fontFamily}", sans-serif`;
  ctx.font = fontSpec;

  let maxLineWidth = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line);
    const spacingExtra = letterSpacing * Math.max(0, line.length - 1);
    const lineWidth = metrics.width + spacingExtra;
    if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
  }

  const totalHeight = Math.max(fontSize, Math.round(lines.length * fontSize * lineHeight));
  const totalWidth = Math.max(1, Math.ceil(maxLineWidth));

  return {
    width: Math.max(2, totalWidth),
    height: Math.max(2, totalHeight),
    lines
  };
}

/**
 * Rasterizes text layer data into an offscreen canvas.
 * Can be used for digitizing into stitches or exporting.
 */
export function rasterizeTextLayer(
  text: string,
  fontFamily: string,
  fontSize: number,
  color: string,
  bold: boolean = false,
  italic: boolean = false,
  align: 'left' | 'center' | 'right' = 'left',
  lineHeight: number = 1.25,
  letterSpacing: number = 0,
  scale: number = 1
): HTMLCanvasElement {
  const scaledSize = fontSize * scale;
  const { width: rawW, height: rawH, lines } = measureTextDimensions(
    text,
    fontFamily,
    fontSize,
    bold,
    italic,
    lineHeight,
    letterSpacing
  );

  const canvasW = Math.max(4, Math.ceil(rawW * scale));
  const canvasH = Math.max(4, Math.ceil(rawH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, canvasW, canvasH);

  const fontSpec = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${scaledSize}px "${fontFamily}", sans-serif`;
  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = align;

  const lineStep = scaledSize * lineHeight;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const yPos = i * lineStep;
    let xPos = 0;
    if (align === 'center') xPos = canvasW / 2;
    else if (align === 'right') xPos = canvasW;

    ctx.fillText(line, xPos, yPos);
  }

  return canvas;
}
