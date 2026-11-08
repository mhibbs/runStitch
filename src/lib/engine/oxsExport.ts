import type { GridDimensions, Layer, PaletteColor, Stitch } from '../types';

/**
 * Open X-Stitch XML Export and Import Engine (.oxs).
 * Follows the standard open interchange format for cross-stitch embroidery charts.
 */

export function exportToOxs(
  grid: GridDimensions,
  layers: Layer[],
  palette: PaletteColor[],
  fabricColorHex: string = '#F9F6EE',
  projectName: string = 'Untitled Pattern',
  author: string = 'runStitch Studio'
): string {
  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<open-x-stitch version="1.0" generator="runStitch Studio" timestamp="${new Date().toISOString()}">\n`;

  // 1. Chart Properties
  xml += `  <properties>\n`;
  xml += `    <title>${escapeXml(projectName)}</title>\n`;
  xml += `    <author>${escapeXml(author)}</author>\n`;
  xml += `    <artboard width="${grid.width}" height="${grid.height}" fabric-count="${grid.fabricCount}" fabric-color="${escapeXml(fabricColorHex)}" />\n`;
  xml += `    <instructions>Created with runStitch Studio • Standard full cross-stitches</instructions>\n`;
  xml += `  </properties>\n`;

  // 2. Floss Palette
  xml += `  <floss-palette>\n`;
  for (const c of palette) {
    xml += `    <floss id="${c.id}" brand="${escapeXml(c.brand || 'DMC')}" code="${escapeXml(c.dmc)}" name="${escapeXml(c.name)}" hex="${escapeXml(c.hex)}" symbol="${escapeXml(c.symbol)}" symbol-color="${escapeXml(c.symbolColor || '#FFFFFF')}" />\n`;
  }
  xml += `  </floss-palette>\n`;

  // 3. Layers & Stitches
  xml += `  <layers>\n`;
  for (const layer of layers) {
    // Only stitch layers and text layers with stitches are exported to OXS
    if (layer.type === 'image') continue;

    const stitchEntries = Object.entries(layer.stitches || {});
    xml += `    <layer id="${escapeXml(layer.id)}" name="${escapeXml(layer.name)}" visible="${layer.visible}" opacity="${layer.opacity}">\n`;
    for (const [coord, stitch] of stitchEntries) {
      const [x, y] = coord.split(',');
      xml += `      <stitch x="${x}" y="${y}" color-id="${stitch.colorId}" type="full" />\n`;
    }
    xml += `    </layer>\n`;
  }
  xml += `  </layers>\n`;
  xml += `</open-x-stitch>\n`;

  return xml;
}

export function downloadOxsFile(xmlContent: string, fileName: string = 'pattern.oxs') {
  let cleanName = fileName.trim();
  if (!cleanName.toLowerCase().endsWith('.oxs')) {
    cleanName += '.oxs';
  }
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedOxsData {
  name: string;
  grid: GridDimensions;
  palette: PaletteColor[];
  layers: Layer[];
  fabricColor: string;
}

export function parseOxsXml(xmlString: string): ParsedOxsData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid Open X-Stitch (.oxs) XML syntax');
  }

  // 1. Properties
  const titleEl = doc.querySelector('properties > title');
  const name = titleEl?.textContent?.trim() || 'Imported OXS Pattern';

  const artboardEl = doc.querySelector('properties > artboard') || doc.querySelector('properties > dimensions');
  const width = parseInt(artboardEl?.getAttribute('width') || '80', 10);
  const height = parseInt(artboardEl?.getAttribute('height') || '80', 10);
  const fabricCount = parseInt(artboardEl?.getAttribute('fabric-count') || '14', 10);
  const fabricColor = artboardEl?.getAttribute('fabric-color') || '#F9F6EE';

  const grid: GridDimensions = { width, height, fabricCount };

  // 2. Palette
  const flossEls = doc.querySelectorAll('floss-palette > floss');
  const palette: PaletteColor[] = [];

  flossEls.forEach((el, idx) => {
    const id = parseInt(el.getAttribute('id') || `${idx + 1}`, 10);
    const brand = el.getAttribute('brand') || 'DMC';
    const dmc = el.getAttribute('code') || `${id}`;
    const colorName = el.getAttribute('name') || `Color ${dmc}`;
    const hex = el.getAttribute('hex') || el.getAttribute('color') || '#000000';
    const symbol = el.getAttribute('symbol') || '●';
    const symbolColor = el.getAttribute('symbol-color') || '#FFFFFF';

    palette.push({
      id,
      brand,
      dmc,
      name: colorName,
      hex,
      symbol,
      symbolColor
    });
  });

  if (palette.length === 0) {
    palette.push({
      id: 1,
      brand: 'DMC',
      dmc: '310',
      name: 'Black',
      hex: '#000000',
      symbol: '●',
      symbolColor: '#FFFFFF'
    });
  }

  // 3. Layers & Stitches
  const layerEls = doc.querySelectorAll('layers > layer');
  const layers: Layer[] = [];

  layerEls.forEach((el, lIdx) => {
    const lId = el.getAttribute('id') || `layer-${Date.now()}-${lIdx}`;
    const lName = el.getAttribute('name') || (lIdx === 0 ? 'Base Pattern' : `Layer ${lIdx + 1}`);
    const visible = el.getAttribute('visible') !== 'false';
    const opacity = parseFloat(el.getAttribute('opacity') || '1.0');

    const stitches: Record<string, Stitch> = {};
    const stitchEls = el.querySelectorAll('stitch');

    stitchEls.forEach(stEl => {
      const x = parseInt(stEl.getAttribute('x') || '0', 10);
      const y = parseInt(stEl.getAttribute('y') || '0', 10);
      const colorId = parseInt(stEl.getAttribute('color-id') || '1', 10);
      const type = (stEl.getAttribute('type') as any) || 'full';
      stitches[`${x},${y}`] = { colorId, type };
    });

    layers.push({
      id: lId,
      name: lName,
      visible,
      locked: false,
      opacity,
      stitches
    });
  });

  if (layers.length === 0) {
    layers.push({
      id: `layer-${Date.now()}`,
      name: 'Base Pattern',
      visible: true,
      locked: false,
      opacity: 1.0,
      stitches: {}
    });
  }

  return {
    name,
    grid,
    palette,
    layers,
    fabricColor
  };
}
