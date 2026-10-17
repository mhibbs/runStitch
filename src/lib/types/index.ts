export type StitchType = 'full' | 'half_forward' | 'half_back' | 'quarter' | 'three_quarter';

export interface Stitch {
  colorId: number;
  type: StitchType;
}

export interface PaletteColor {
  id: number;
  dmc: string;
  name: string;
  hex: string;
  symbol: string;
  symbolColor?: string; // High contrast text color for the symbol
}

export type LayerType = 'stitch' | 'image';

export interface ReferenceImage {
  src: string;          // Data URL or URL of the image
  naturalWidth: number;
  naturalHeight: number;
  x: number;            // Top-left in grid coordinates (cells)
  y: number;            // Top-left in grid coordinates (cells)
  width: number;        // Width in grid cells
  height: number;       // Height in grid cells
  rotation: number;     // 0, 90, 180, 270 degrees
}

export type DitherMode = 'none' | 'floyd_steinberg' | 'atkinson';

export interface DigitizerOptions {
  maxColors: number;
  ditherMode: DitherMode;
  ignoreBackground: boolean;
  backgroundHex?: string;
  backgroundTolerance?: number; // 0-100
  targetLayer: 'new' | 'active';
  keepReferenceLayer: boolean;
}

export interface Layer {
  id: string;
  name: string;
  type?: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  // Keyed by "x,y" coordinate string for sparse O(1) access
  stitches: Record<string, Stitch>;
  image?: ReferenceImage;
  // Bounding box for dirty rendering
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export type ActiveTool =
  | 'pencil'
  | 'eraser'
  | 'bucket'
  | 'picker'
  | 'pan'
  | 'select'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'stamp';

export type ShapeFillMode = 'outline' | 'filled';

export interface MotifStamp {
  id: string;
  name: string;
  category: 'corners' | 'accents' | 'alphabets' | 'borders' | 'custom';
  width: number;
  height: number;
  // Keyed by relative "rx,ry" coordinates
  stitches: Record<string, { dmc: string; type: StitchType }>;
}

export interface BorderConfig {
  motifId: string;
  mode: 'perimeter_canvas' | 'perimeter_selection' | 'horizontal_band' | 'vertical_band';
  margin: number;
  spacing: number;
  autoCorners: boolean;
  targetLayer: 'active' | 'new';
  useOriginalColors: boolean;
}

export interface SelectionBox {
  x: number;      // top-left grid X
  y: number;      // top-left grid Y
  width: number;  // width in stitches
  height: number; // height in stitches
}

export interface FloatingSelection {
  x: number;      // current grid top-left placement
  y: number;
  width: number;
  height: number;
  stitches: Record<string, Stitch>; // relative "rx,ry" coordinate string
}

export interface ClipboardData {
  width: number;
  height: number;
  stitches: Record<string, Stitch>; // relative "rx,ry" coordinate string
}

export type ViewMode = 'mockup' | 'chart' | 'symbols_only';

export interface Viewport {
  zoom: number;       // Pixels per stitch cell
  panX: number;       // Offset in canvas pixels
  panY: number;
}

export interface GridDimensions {
  width: number;      // Width in stitches
  height: number;     // Height in stitches
  fabricCount: number; // Stitches per inch, e.g. 14, 16, 18
}

export interface FabricColorPreset {
  id: string;
  name: string;
  hex: string;
}

export interface CompositeBorder {
  id: string;
  name: string;
  cornerMotif: MotifStamp;
  runnerMotif: MotifStamp;
}

export interface HistoryDelta {
  description: string;
  layerId: string;
  before: Record<string, Stitch | null>; // null indicates stitch did not exist
  after: Record<string, Stitch | null>;
  layersSnapshot?: Layer[]; // For multi-layer structural actions like flatten
}
