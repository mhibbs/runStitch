# runStitch: Project Specification & Architecture Blueprint

## 1. Executive Summary
**runStitch** is a client-side, web-based cross-stitch design application built with **Svelte + TailwindCSS + Vite**. It combines the creative workflows of image editing software (Photoshop-style layers, toolbars, marquee selections, history stacks) with specialized craft capabilities (standard DMC thread catalogs, symbol-coded printable charts, skein usage estimators, and image-to-pattern digitization).

The application is engineered to run completely client-side in the browser and is optimized for both desktop and touch/tablet devices (iPad / stylus).

---

## 2. Core Architecture & Tech Stack

* **Framework & UI**: Svelte 5 / Svelte 4 with Vite and TailwindCSS (or UnoCSS).
* **Execution Model**: 100% Client-Side. No mandatory backend server; fully functional offline.
* **Canvas Architecture**: Multi-Canvas Stack:
  1. **Background Canvas**: Renders fabric texture (e.g., Aida cloth) or dimmed reference tracing image.
  2. **Stitch & Grid Canvas**: High-performance rendering of the stitches across all active layers, 10×10 numbered grid lines, and center markers.
  3. **Interactive Overlay Canvas**: 60 FPS cursor preview, brush shape hover, active marquee selection box, and in-progress drawing vectors.
* **Touch & Pointer Engine**:
  * Unified Web `PointerEvents` API with explicit `pointerType` discrimination (`mouse`, `pen`/stylus, `touch`).
  * 1-finger / stylus = Draw / Erase / Select.
  * 2-finger pinch = Smooth zoom; 2-finger drag = Pan.
  * Palm rejection for stylus input.

---

## 3. Data Representation & Runtime Storage

### A. Runtime Memory Structure
To ensure instant $O(1)$ lookups, low memory usage, and zero GC stutter during continuous brush strokes:
* **Per-Layer Stitch Storage**:
  * Sparse coordinate map: `Map<string, Stitch>` where key is `"x,y"` or a packed 32-bit integer `(y << 16) | x`.
  * `Stitch` object:
    ```typescript
    interface Stitch {
      colorId: number;     // References palette entry
      type: StitchType;    // 'full' | 'half_forward' | 'half_back' | 'quarter' | 'three_quarter'
    }
    ```
  * **Backstitch Storage**: Separate map or array of line segments between grid points `(x1, y1) -> (x2, y2)`.
* **Bounding Box Tracking**: Each layer tracks its `minX, minY, maxX, maxY` for fast dirty-rectangle updates and cropping.

### B. File Formats
1. **Native Format (`.xstitch`)**:
   * A clean, open, JSON-based format storing metadata, palette, symbols, multi-layer stitch maps, reference images, and history tags.
2. **Interoperability Import/Export**:
   * **`.oxs` (Open X-Stitch XML)**: Universal open standard supported by desktop tools (WinStitch, MacStitch, FlossCross).
   * **Print-ready PDF**: Paginated vector/raster charts with 10×10 coordinate grids, symbols, and DMC floss keys.
   * **Image Export (PNG/SVG)**: Realistic mockup with cloth texture or clean flat chart.

---

## 4. Feature Modules

### Module 1: The Canvas & Tooling
* **Tools**:
  * Drawing: Pencil (single / continuous drag), Eraser, Paint Bucket (flood fill), Eyedropper.
  * Geometric Shapes: Line, Rectangle (outline / filled), Ellipse (outline / filled).
  * Selection & Transform: Marquee Select (cut, copy, paste, move floating selection, flip horizontal/vertical, rotate 90°).
  * Navigation: Pan (Hand tool, Spacebar+drag, 2-finger trackpad drag), Zoom (wheel, pinch, HUD controls).
* **Cross-Stitch Specific Creative Tools**:
  * **Border Maker**: Repeat a stitch motif or corner element continuously along horizontal lines, vertical lines, or around a rectangular/oval perimeter.
  * **Motif & Stamp Library**: Built-in library of common cross-stitch accents, flourishes, alphabets, and symbols; ability to save marquee selections as custom stamps for rapid re-use.
* **Views**:
  * *Chart View*: Clear grid with color blocks and high-contrast symbols.
  * *Mockup View*: Simulated woven Aida fabric with realistic diagonal thread crosses, rounded ends, and specular highlights (optimized with offscreen caching for 60 FPS).
  * *Grayscale / Symbol View*: Traditional monochrome chart enhanced with proportional grayscale background tints for legible stitch density.
* **History & Shortcuts**:
  * Sparse command delta stack (`undo` / `redo`) recording only changed cell diffs.
  * Global keyboard shortcuts (`B`, `E`, `G`, `I`, `H`, `Cmd/Ctrl+Z`, `Cmd/Ctrl+Y`, `Cmd/Ctrl+Shift+Z`, `Space`, `Esc`).

### Module 2: DMC Floss & Symbol Management
* Pre-loaded community standard DMC color catalog (full standard stranded cotton line with ~489 colors, names, Hex, and CIELAB).
* Searchable floss modal (search by DMC number or color description).
* Pattern Palette: Tracks colors currently in use, live stitch counts, and estimated skeins based on fabric count.
* Automated distinct symbol allocator with user customization (ability to click any floss entry to manually reassign its symbol or display tint).
* Dual Dock Workspace: Persistent split layout allowing simultaneous viewing of active floss palette and layer hierarchy.

### Module 3: Photoshop-Style Layer Stack
* Layer management: Add, duplicate, delete, hide/show, lock/unlock, and adjust opacity (10%–100%).
* Drag-and-drop layer reordering.
* Support for dimmed tracing reference layers.

### Module 4: Image-to-Pattern Digitizer
* Image import (PNG, JPG, SVG, WebP).
* Dimension scaler (stitches wide × high or physical inches on target Aida count).
* Perceptual color reduction using CIEDE2000 / $\Delta E$ matching to real DMC colors with configurable max color count.
* Dithering options: Floyd-Steinberg, Atkinson, or None.
* Live preview modal before committing to a new layer.

### Module 5: Cross-Stitch Typography (Text Tool)
* Pre-designed cross-stitch pixel fonts (5px, 7px, 10px tall alphabets, plus script styles).
* Font rasterizer to convert typed text into crisp grid stitches.

### Module 6: Chart Export & Printing
* Print-ready paginated PDF charts with 10×10 numbered grids, floss keys, and skein usage calculations.
* Interoperability: `.oxs` (Open X-Stitch XML) import/export.
* Native `.xstitch` JSON save and load.

---

## 5. Development Milestones & Roadmap

* **Milestone 1: Core Scaffolding & Canvas Engine** `[COMPLETED]`
  * Svelte + Vite + Tailwind architecture.
  * 3-canvas stack (Aida background, Stitches & Grid, Interactive Overlay).
  * Basic pan/zoom, 10×10 grid markers, center arrows, coordinate HUD.
  * Pencil and eraser tools with continuous drag drawing.
  * Initial DMC palette integration, flood fill, color picker, and basic `.xstitch` JSON save/load.

* **Milestone 2: Ergonomics, Performance & Full Catalog Polish** `[COMPLETED]`
  * **Global Keyboard Shortcuts**: Wired `B` (Pencil), `E` (Eraser), `G` (Bucket), `I` (Picker), `H` (Pan), `Cmd/Ctrl+Z` (Undo), `Cmd/Ctrl+Y` / `Cmd/Ctrl+Shift+Z` (Redo), and `Esc` (Deselect/Cancel) with input focus protection.
  * **Trackpad & Navigation Polish**: Dampened trackpad pinch-to-zoom with smooth logarithmic scaling; enabled native two-finger trackpad swipe-to-pan.
  * **Mockup Mode Performance Optimization**: Replaced per-stitch `shadowBlur` with hardware-accelerated offscreen stitch sprite blitting (`ctx.drawImage`), locking performance at 60 FPS.
  * **Enhanced Grayscale / Symbol View**: Added luminance-based grayscale cell background shading with high-contrast symbol pairing for clear chart legibility.
  * **Full DMC Catalog**: Expanded to all 491 standard DMC Six-Strand Embroidery Floss colors (including classic 454, Blanc/B5200/Ecru, and 01–35 series) with instant search.
  * **Workspace Layout & Symbol Customization**: Clickable symbol customization modal and palette swatch management.

* **UI & Studio Architecture Overhaul** `[COMPLETED]`
  * **Unified Accordion Workspace**: Consolidated Floss Palette and Layer Manager into a collapsible accordion sidebar in [App.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/App.svelte).
  * **Traditional Desktop MenuBar**: `File`, `Edit`, `View`, `Help` menus in [MenuBar.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/MenuBar.svelte) with standard shortcuts (`Cmd+N`, `Cmd+O`, `Cmd+S`, `Cmd+Z`, `Cmd+Shift+Z`, `Cmd+0`, `Cmd+1`, etc.).
  * **New Canvas Project Modal**: Presets (Bookmark, Small, Medium, Standard, Large), custom width/height/Aida count, starter palettes, and auto zoom-to-fit recentering in [NewProjectModal.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/NewProjectModal.svelte).
  * **Canvas Resizing**: Dynamic grid resizing preserving all existing stitches across layers, with user-friendly placement options (`Add/Remove evenly from all edges` vs. `Add/Remove from bottom & right`) and crop warnings in [CanvasSizeModal.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/CanvasSizeModal.svelte).
  * **Two-Line Live HUD & Fabric Picker**: Stable coordinates, on-the-fly Aida count switching, zoom presets popover, and live pattern bounding box calculation: `Pattern is # st in #×# st area (#" × #")` (or `Pattern is empty`).
  * **Decoupled View Modes**: Direct selection in View menu and Toolbar flyout (`Symbol + Color`, `Symbol Only (B&W)`, `Realistic Mockup`).
  * **Styled Modals**: Custom app-themed modal dialogs for all operations, including [ClearLayerModal.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/ClearLayerModal.svelte) with active layer stitch counts and undo reassurance.

* **Milestone 3: Marquee Selection & Advanced Layer Operations** `[COMPLETED]`
  * **Rectangular Marquee Tool (`M`)**: Click-and-drag selection rectangle on the overlay canvas with animated dual-layer high-contrast marching-ants border.
  * **Live Selection HUD**: Dedicated HUD display showing active selection dimensions, inches on fabric, stitch counts, and quick actions (`Copy`, `Cut`, `Deselect`) or floating commit controls.
  * **Clipboard Operations**:
    * Cut (`Cmd+X`): Copy selected stitches to memory clipboard and atomically erase from active layer with undo support.
    * Copy (`Cmd+C`): Copy selected stitches to clipboard.
    * Paste (`Cmd+V`): Instantiate interactive floating selection that can be freely dragged, nudged with arrow keys, committed with `Enter` / outside-click, or cancelled with `Esc`.
  * **Transformations**: Flip Horizontal, Flip Vertical, and Rotate 90° CW on active selection or floating selection.
  * **Layer Stack Operations**: Move layer up/down in the visual stack, duplicate layer, and merge down onto underlying layer.

* **Milestone 4: Shape Tools, Border Repeater & Motif Stamp Library** `[COMPLETED]`
  * **Geometric Shape Tools**: Line (`L`), Rectangle (`R`), and Ellipse (`O`) with 60 FPS live drag preview on overlay canvas, Shift-key aspect constraint (square / circle / 45° angle lock).
  * **Dynamic Shape Tool Icons & Visual Grouping**: Framed shape sub-cluster on the toolbar with dynamic icon fills (Square and Circle icons switch between hollow line and solid filled shapes matching the active `Solid` / `Line` toggle).
  * **Auto-Fitting Border Repeater & 2-Part Flourish System**:
    * **Auto-Fitting Math**: Computes exact integer repeats $N = \lfloor (W_{\text{avail}} - \dots) / (U + S) \rfloor$ and evenly centers leftover margin slack on opposite sides, ensuring border motifs repeat seamlessly without partial cutoffs, gaps, or broken corners.
    * **2-Part Composite Borders**: Format supporting distinct Corner Motifs ($W_c \times H_c$) and Runner Motifs ($U_r \times H_r$), automatically rotating runners 90° along vertical edges and mirroring corner flourishes (`flipH`, `flipV`, `rotate180`). Includes built-in designs: *Vintage Rose & Ivy*, *Celtic Interlace & Braid*, *Nordic Folk Star & Chevron*, and *Victorian Lace & Rosette*.
    * **Live Coordinate Slider Fix**: Isolated band row/column coordinate reactivity for smooth, persistent adjustments.
    * **Cloth Tint Preview**: Miniature preview canvas renders directly against the active Aida cloth color so all floss colors remain clearly legible.
  * **Aida Fabric Color System**: Configurable cloth tint store (`fabricColor`) with standard cross-stitch presets (*Bright White*, *Antique White/Ecru*, *Natural Oatmeal/Flax*, *Pale Sky Blue*, *Vintage Sage Green*, *Dusty Rose*, *Charcoal Black*) plus native custom color picker, visible in View menu, chart mode, realistic mockup mode, and dialog previews.
  * **Keyboard Shortcut Refactoring & Conflict Resolution**:
    * Standardized single-key shortcuts: `S` (Marquee Select), `F` (Flood Fill), `O` (Ellipse / Oval), `R` (Rectangle), `B` (Pencil), `E` (Eraser), `I` (Eyedropper), `L` (Line), `H` (Hand / Pan).
    * Resolved stamp rotation conflict: Pressing `R` with an active stamp rotates the motif 90° CW instead of switching to Rectangle tool.
    * Clean Marquee Deselect: Clicking outside an active selection deselects cleanly without leaving behind an accidental 1×1 single-stitch box.
  * **Adjustable Accordion Splitter**: Draggable resizer bar between Floss Palette and Layers panels, enabling fluid resizing of the layer manager.
  * **Expanded Layer Management**:
    * Drag-and-drop layer reordering in visual stack with drop indicators.
    * Dedicated per-row Up and Down reordering arrow buttons.
    * Inline double-click and pencil icon layer renaming.
    * "Flatten All Visible Layers" action with atomic undo/redo snapshot support.
  * **Custom Stamp Organization**: Moved canvas selection stamp saving exclusively to the "My Custom Stamps" tab in [MotifLibraryModal.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/MotifLibraryModal.svelte).

* **Milestone 5: Reference Image Layers & DMC Image Digitizer** `[COMPLETED]`
  * **Unified Reference Image Layer**:
    * Integrated reference images directly into the native layer stack (`LayerType = 'image' | 'stitch'`), providing stack re-ordering (drawing stitches over or under photos), per-layer opacity control for tracing/fine-grained editing, visibility toggle, and locking.
    * On-canvas interactive transform system with 60 FPS live rendering in `renderOverlay`: cyan dashed marching frame, 4 corner resize handles, 4 edge handles, top rotation node, and real-time dimension & angle badges.
    * Canvas hit-testing supporting move dragging, corner/edge scaling (preserving aspect ratio with Shift or corner drag), 15° snap or free rotation.
    * Floating on-canvas action pill when an image layer is active: `[⚡ Digitize to Stitches...]`, `[Rotate 90° CW]`, `[Fit to Canvas]`, and opacity slider.
  * **Intelligent DMC Color Quantization & Digitizer Engine**:
    * Perceptual color science: CIE $L^*a^*b^*$ conversion and Euclidean $\Delta E$ matching against the entire 491-color standard DMC catalog.
    * Dynamic complexity estimation (`analyzeImageComplexity`): analyzes color variance, saturation, and entropy to automatically recommend optimal starting colors (e.g., 2–3 for monochrome line art, 6–8 for grayscale photos, and 18–24 for complex color photos).
    * Median Cut color clustering in Lab space to find $K$ representative cluster centers mapped to unique DMC colors.
    * Advanced dithering algorithms:
      * *Atkinson* (Recommended for needlepoint: crisper details, diffuses $\frac{3}{4}$ error to eliminate muddy color bleeding).
      * *Floyd-Steinberg* (Smooth photographic error diffusion for soft gradients).
      * *None* (Posterized flat color blocks, ideal for clean pixel art).
    * Background removal: Color keying with tolerance slider (0%–100%) and interactive on-preview pipette dropper, plus native alpha transparency support.
    * Groundwork for physical cross-stitch photo recognition: high-contrast cell sampling, grid coordinate snapping, and contrast thresholds.
  * **Dedicated Digitizer Modal (`DigitizerModal.svelte`)**:
    * Multi-view live interactive preview: `Stitches`, `Split (Source / Stitches)`, and `Source`.
    * Interactive color slider with dynamic auto-detection and quick preset pills (`4 Minimal`, `8 Icon`, `14 Medium`, `24 Detailed`, `28 Photo`).
    * Extracted DMC thread list with swatches, DMC numbers, and thread names.
    * Output layer options: create a new stitch layer or merge into active layer, with option to keep or hide the reference image layer.
  * **Bundled Stock Samples for 1-Click Testing**:
    * `Cool Cat in Sunglasses` (`/samples/cool_cat.jpg`): High-complexity colorful portrait with vibrant tones and patterns.
    * `Retro Coffee Mug` (`/samples/retro_coffee.jpg`): Graphic illustration on solid white background for background removal testing.
    * Integrated into "+ Image" dropdown in the Layers panel and File menu.
  * **Desktop File Drag-and-Drop**:
    * Dragging any image file (`PNG`, `JPG`, `WebP`, `SVG`) directly from the desktop/finder onto the window immediately loads it as an active reference image layer on the canvas.
  * **Rotated/Transformed Digitization & Matching Preview**:
    * Digitization sampling respects reference image layer scaling and rotation angles around center.
    * Live digitizer preview matches the exact transformed canvas rotation and orientation.
    * "Limit to Active Palette": Quantizes directly against the open project's existing floss colors using closest perceptual $\Delta E$ without introducing new palette slots.
    * Selection-Scoped Digitization: When an active canvas selection exists, option to digitize strictly inside the selection mask, leaving surrounding areas untouched.
    * Stable Modal Layout: `min-h-[114px]` container prevents dialog resizing/bouncing when color count is reduced below 4.

* **Milestone 5.5: Arbitrary Selection Engine & Multi-Brand Thread Architecture** `[COMPLETED]`
  * **Arbitrary Selection Tools**:
    * **Marquee Selection (`S`)**: Rectangular bounding box with live resize and move.
    * **Magic Wand (`W`)**: Contiguous flood selection of stitches (by `colorId`) on stitch layers, or pixels (by color distance tolerance) on reference image layers.
    * **Freehand Lasso (`Q`)**: Arbitrary hand-drawn loops rasterized to discrete grid stitches via polygon ray-casting.
    * **Selection Combinators**: Hold `Shift` for Union (add to selection), hold `Alt/Option` for Difference (subtract from selection).
    * **Selection Modifications**: Dedicated "Select" menu with Select All (`Cmd+A`), Deselect (`Cmd+D`/`Esc`), Invert Selection (`Cmd+Shift+I`), Grow (+1 stitch), Shrink (-1 stitch), and Delete Selected Stitches (`Del`/`Backspace`).
    * Discrete cross-stitch cell precision without unwanted feathering or accidental 1×1 stitch artifacts on click-off.
  * **Multi-Brand Reference Thread Architecture (`threadBrands.ts`)**:
    * Modular thread catalogs: **DMC Mouliné Spécial** (491 colors), **Anchor Stranded Cotton** (220 colors), **Cosmo Lecien** (65 colors), and **Digital Rainbow Gamut** (241 uniform perceptual RGB colors).
    * Instant global pattern conversion: convert all current colors to the closest perceptual $\Delta E$ match in any target brand across all stitches with full undo/redo history.
    * Thread Color Swapping: select any color in the active palette and swap it with any thread from any catalog across the entire project in a single undoable step.

* **Milestone 6: Cross-Stitch Typography & Layer Ergonomics** `[COMPLETED]`
  * **Dedicated Vector-to-Stitch Live Text Layers (`LayerType = 'text'`)**:
    * **Live Cross-Stitch Canvas Rendering**: Text layers render live cross-stitches directly on the canvas in both Chart mode (with thread symbols) and Mockup mode (with realistic 3D thread sprites), eliminating separate digitization steps.
    * **Dynamic Handle-Based Font Resizing**: Dragging transform handles scales `fontSize` in real time while maintaining vector text properties, alignment, and spacing.
    * **Photoshop-Style Rasterization**: "Rasterize to Stitches" action converts text layers into normal editable stitch layers with sparse undo/redo history.
    * **Double-Click to Edit**: Double-clicking on an active or hovered text layer directly on the canvas opens the typography editor immediately.
  * **Font Bounding Box & Protective Swash Padding**:
    * Full font metric extent measurement using `actualBoundingBoxLeft`, `actualBoundingBoxRight`, `actualBoundingBoxAscent`, and `actualBoundingBoxDescent`.
    * Automatic detection of cursive/script flourishes and italic overhangs (e.g. *Great Vibes*), expanding internal canvas buffer with protective padding (`padLeft`, `padTop`, `padRight`, `padBottom`).
    * Transform bounding box aligns snugly with `layer.image.x = textData.x - padLeft` and `layer.image.y = textData.y - padTop`, ensuring no glyph flourishes or italics are clipped or lean outside the box.
  * **Interactive Stitch Thickness / Rasterization Weight Control**:
    * Continuous slider (10% to 90%, default 50% / balanced) controlling the alpha threshold for stitch rasterization.
    * Labels: *Delicate / Thin* (higher threshold, capturing only core glyph strokes) ↔ *Chunky / Bold* (lower threshold, converting anti-aliased edge coverage to stitches).
    * Real-time live update of the stitch preview grid and on-canvas stitches.
  * **Font Dropdown Stars & Pinned Favorites Organization**:
    * Gold star represents pinned favorite fonts, persisted to `localStorage`.
    * Section 1: ⭐ **Pinned Favorites** at the top with gold stars; unpinning moves the font down.
    * Section 2: ➕ **More Google Fonts** categorized and searchable; clicking an outline star immediately pins the font and moves it into favorites.
    * Section 3: 📁 **Uploaded Custom Fonts** (.ttf, .otf, .woff, .woff2).
    * Section 4: 🔍 **Custom Google Font** loader by name.
  * **Illustrator-Style Artboard & Pasteboard System**:
    * **Artboard vs. Pasteboard**: Official pattern area defined within the Artboard (`[0..width-1, 0..height-1]`) with Aida cloth texture, 10x10 numbered grid lines, center point indicators, crisp boundary frame, and drop shadow.
    * **Non-Destructive Staging Pasteboard**: Stitches, motifs, and test elements dragged outside the pattern boundary are preserved on the pasteboard rather than deleted.
    * **Dimmed Staging Visualization**: Stitches outside the artboard render faded at 40% opacity, making the active pattern area unmistakable.
    * **HUD & Status Indicators**: Coordinate tracker displays `[Pasteboard]` with amber indicator; status bar shows exact count of stitches in pattern vs. staging pasteboard.
    * **Clean Pasteboard Action**: Edit menu command to clear stray pasteboard stitches in a single undoable step.
  * **Layer Manager & Workspace Ergonomics**:
    * **Toggle Non-Stitch Layers**: Dedicated toggle button (`Eye` / `EyeOff`) next to copy/flatten to hide reference images and vector text layers for clean pattern and mockup inspection.
    * **Bounded "+ New" Layer Dropdown**: Constrained dropdown height (`max-h-[min(360px,calc(100vh-140px))]`) preventing overflow past the bottom of the window.
    * **Digitizer Pan-to-Left Fix**: Fixed negative scroll clamping on centered preview canvas, allowing full panning to the left edge when zoomed in.
    * **Shortcut Remapping**: `M` mapped to Move Tool, `V` reserved strictly for vertical flip during floating selection and motif stamping.

* **Milestone 7: Print-Ready PDF & Interchange Formats** `[COMPLETED]`
  * **Print-Ready PDF Chart Generator (`pdfExport.ts`)**:
    * **Artboard-Scoped Publishing**: PDF charts strictly scope and chart the official pattern artboard (`[0..width-1, 0..height-1]`), reporting any staging stitches on the pasteboard separately.
    * **Cover & Summary Page**: Professional title header, author/designer info, physical finished dimensions calculated for 14ct, 16ct, and 18ct Aida (in inches and cm), Aida cloth color, total stitches, and total unique thread shades.
    * **High-Resolution Embroidery Mockup**: Realistic 3D cross-stitch rendering of the finished design with Aida weave and thread sheen directly on the cover.
    * **Floss Legend & Skein Estimator Table**:
      * Complete listing of all threads used in the pattern: Symbol, Color Swatch, Thread Brand (DMC, Anchor, Cosmo, Rainbow), Floss Code, Color Description, Total Stitches, and Skein Count (calculated for standard 8m 6-strand skeins with 2 strands @ 1,800 stitches/skein).
    * **High-Contrast Chart Grid**:
      * Dual Chart Modes: **Color Symbols** (tinted cell backgrounds with high-contrast symbols) vs. **Black & White Chart** (crisp black symbols on white grid, the traditional publication standard).
      * 10×10 numbered border markers (10, 20, 30...) on all four sides.
      * Bold 10×10 major grid lines and fine 1×1 minor stitch grid lines.
      * Red center triangular arrows marking the exact horizontal and vertical center of the design.
      * Smart Auto-Pagination: Large patterns automatically paginate across manageable grid pages (e.g. 50×70 stitches/page) with 3-stitch shaded overlaps and mini page thumbnail overview maps.
  * **Open X-Stitch (.oxs) XML Engine (`oxsExport.ts`)**:
    * **Full Export**: Generates standardized `.oxs` (Open X-Stitch XML) interchange files containing chart properties, artboard dimensions, multi-brand floss definitions, layer metadata, and stitches, compatible with WinStitch, MacStitch, Pattern Maker, and PCStitch.
    * **Full Import**: Parses `.oxs` XML files, reconstructing the pattern artboard, thread palette, layers, and stitches with instant zoom-to-fit and full undo capability.
  * **Unified Export & Publishing Center (`SaveProjectModal.svelte`)**:
    * Tabbed studio interface supporting Print-Ready PDF Chart (`Cmd+P`), Open X-Stitch (.oxs), and native project files (.xstitch JSON).
    * Integrated into top Header ("Export PDF" and "Save"), MenuBar File menu, and global shortcuts.
  * **Typography Studio Refinements**:
    * **Responsive Thickness Slider**: Fixed reactive reset bug so the stitch thickness/rasterization weight slider drags smoothly and updates stitches in real time.
    * **Fitted 100% Zoom Preview**: The entire text is always fully framed within the preview window at 100% zoom; increasing font size keeps the text framed while making the stitch dots finer and more detailed.
    * **Multi-Line Alignment Helper**: Clarified line alignment controls with tooltips and contextual status indicators.

* **Milestone 6: Authentic Stitch Alphabets, Publishing & Workflow Polish** `[COMPLETED]`
  * **Bidirectional Units in Canvas Resize & New Project**:
    * Live synchronized inputs linking stitch counts with physical dimensions (Inches and Centimeters) based on the active or selected fabric count (e.g. 14ct, 16ct, 18ct, etc.).
    * Modifying physical inches or cm immediately updates stitch counts with proper rounding, and vice versa.
  * **Clipboard Image Paste & Web URL Importer**:
    * Direct clipboard image paste (`Cmd+V` / `Ctrl+V`): copying any screenshot or picture to the clipboard and pasting automatically creates a reference image layer.
    * Dedicated **From Image URL...** modal ([ImageUrlModal.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/ImageUrlModal.svelte)) with URL connectivity testing, dimensions badge, live preview, and quick test samples.
  * **Authentic Hand-Charted Stitch Alphabets (Bitmap Fonts)**:
    * Created dedicated stitch typography engine ([stitchAlphabets.ts](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/data/stitchAlphabets.ts)) defining discrete hand-charted cross-stitch alphabets that bypass vector rasterization entirely.
    * 4 complete built-in classic fonts: *Mini Sampler 5pt*, *Classic Sampler 7pt*, *Roman Serif 9pt*, and *Victorian Monogram 13pt*.
    * Dual typography mode in [TextModal.svelte](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/components/TextModal.svelte) allowing instant switching between 1:1 Stitch Alphabets and Google Vector Fonts.
    * Real-letter default font set to *Pixelify Sans* (#1) and *Silkscreen* (#2).
  * **Precision Typography Alignment & Center-Pivot Rotation**:
    * Vector typography overlay shadow alignment in [renderer.ts](file:///Users/mhibbs/Dropbox/Projects/XStitcher/src/lib/engine/renderer.ts) properly incorporates internal padding, locking vector text directly over the stitches on the z-axis with zero X/Y drift.
    * Dynamic trigonometric rotation math around true layer center `(centerX, centerY)`, preventing text stitches from clipping or rotating outside bounding boxes.
    * Discrete kerning (letter spacing) and line spacing controls in typography dialog.
  * **Text Layer Workflow Hotkeys**:
    * Press `Enter` on canvas to immediately digitize and finalize an active text layer into regular stitches.
    * Press `R` to rotate active text layer 90° CW/CCW.
    * Press `H` to flip active text layer horizontally, `V` to flip vertically.
    * Contextual bottom status bar guidance pill with quick click-to-finalize button.
  * **High-Definition PDF Chart Publishing & Direct Printing**:
    * **Unicode Symbol Rendering**: Legend symbols rendered via high-resolution HTML5 canvas images into PDF, completely eliminating `%XX` character encoding artifacts.
    * **Clean Specifications Card**: Split design size across two lines (`W″ × H″` and `(W × H cm)`) to fit specification boxes cleanly without overflow.
    * **Uniform Remnant Page Scaling**: All chart pages maintain identical physical millimeter cell sizes (`cellMm`), ensuring remnant border pages align 1-to-1 seamlessly when cut out and taped together.
    * **User-Configurable PDF Options**: Selectable page margins (*Minimal 6mm*, *Narrow 10mm*, *Standard 14mm*), chart grid density (*Compact 2.8mm*, *Standard 3.4mm*, *Large Print 4.5mm*), header/footer & overview map toggle, and customizable skein yield (default 2,000 stitches).
    * **Direct Printing**: Added "Print Directly" button triggering native browser print dialog via an automated invisible PDF iframe.

---

## 6. Codebase Architecture & File Structure

```
src/
├── App.svelte                   # Shell, desktop layout, accordion sidebar, window drag-drop, global shortcuts
├── main.ts                      # App mount point & global styles
├── app.css                      # Tailwind & custom CSS utilities
├── lib/
│   ├── types/
│   │   └── index.ts             # Core interfaces (Stitch, Layer, TextLayerData, ReferenceImage, etc.)
│   ├── stores/
│   │   └── editorStore.ts       # Central Svelte stores (grid, layers, palette, typography, image transforms)
│   ├── engine/
│   │   ├── renderer.ts          # 3-canvas rendering engine, sprite caching, image/text layer rendering
│   │   ├── geometry.ts          # Bresenham line, rectangle, midpoint ellipse, aspect constraints
│   │   ├── borderGenerator.ts   # Perimeter and runner border repetition generator
│   │   └── digitizer.ts         # CIE Lab matching, Median Cut palette, Atkinson/Floyd-Steinberg dithering
│   ├── data/
│   │   ├── dmcPalette.ts        # 491 standard DMC colors, Delta-E matching, starter palettes
│   │   ├── threadBrands.ts      # Multi-brand catalog (DMC, Anchor, Cosmo, Rainbow RGB) & brand conversion
│   │   ├── fontCatalog.ts       # Curated Google Fonts, Yarndings craft glyphs, dynamic font loader
│   │   ├── motifLibrary.ts      # Curated flourishes, accents, borders, custom stamp persistence
│   │   └── sampleImages.ts      # Registry of bundled stock photos (Cool Cat, Retro Coffee)
│   └── components/
│       ├── Header.svelte        # Top navigation, project dimensions pill, quick actions
│       ├── MenuBar.svelte       # Traditional Desktop menus (File, Edit, Select, Design, View, Help)
│       ├── Toolbar.svelte       # Drawing tools, Selection tools (S, W, Q), Shape tools (L, R, O), Typography (T)
│       ├── CanvasViewport.svelte# Multi-canvas interactive viewport, image transforms, floating controls, stable HUD
│       ├── PaletteDock.svelte   # Active swatches, color picker, brand switcher, color swapper
│       ├── LayerManager.svelte  # Layer list, image/text badges, +Image / +Text, digitize buttons, reordering
│       ├── TextModal.svelte     # Cross-stitch typography modal with Google Fonts & Yarndings glyphs
│       ├── DigitizerModal.svelte # Image & text digitization modal with live preview, framing & pipette
│       ├── NewProjectModal.svelte # Canvas creation presets, custom dimensions, starter palettes
│       ├── CanvasSizeModal.svelte # Preserving resize modal with center vs. top-left space allocation
│       ├── ClearLayerModal.svelte # Styled confirmation dialog with stitch counts and Cmd+Z reminder
│       ├── MotifLibraryModal.svelte # Tabbed motif catalog, text generator, custom stamp saver
│       ├── BorderMakerModal.svelte  # Border repeater with real-time miniature preview
│       ├── ShortcutsModal.svelte    # Keyboard shortcut cheat-sheet dialog
│       └── SymbolPickerModal.svelte # Custom chart symbol re-assignment dialog
```
