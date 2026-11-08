import { DMC_CATALOG, type DMCEntry } from './dmcPalette';
import { rgbToLab, labDistance, hexToRgb, type LabColor } from '../engine/digitizer';
import type { PaletteColor } from '../types';

export interface FlossThread {
  code: string;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
  brandId: string;
}

export interface ThreadBrand {
  id: string; // 'dmc' | 'anchor' | 'cosmo' | 'rainbow'
  name: string;
  shortName: string;
  manufacturer: string;
  description: string;
  threadCount: number;
  threads: FlossThread[];
}

// 1. DMC Six-Strand Embroidery Floss (491 colors)
const dmcThreads: FlossThread[] = DMC_CATALOG.map(d => ({
  code: d.code,
  name: d.name,
  hex: d.hex,
  r: d.r,
  g: d.g,
  b: d.b,
  brandId: 'dmc'
}));

// 2. Anchor Stranded Cotton Floss (Coats Crafts - Popular international standard)
// Comprehensive curated collection of Anchor embroidery floss shades
const rawAnchor: [string, string, string][] = [
  ['1', 'Snow White', '#FFFFFF'],
  ['2', 'White', '#F5F5F0'],
  ['6', 'Salmon Very Light', '#FDE0D9'],
  ['8', 'Salmon Light', '#F8B5A7'],
  ['9', 'Salmon Med Light', '#EE8D79'],
  ['10', 'Salmon Med', '#DE6854'],
  ['11', 'Salmon Dark', '#CB4634'],
  ['13', 'Salmon Very Dark', '#AD2E20'],
  ['19', 'Burgundy Light', '#B03A48'],
  ['20', 'Burgundy Med', '#942232'],
  ['22', 'Burgundy Dark', '#6A1521'],
  ['23', 'Carnation Light', '#FBC7D0'],
  ['24', 'Carnation Med Light', '#F494A7'],
  ['25', 'Carnation Med', '#E86682'],
  ['26', 'Carnation Dark', '#D13F61'],
  ['27', 'Carnation Very Dark', '#B52144'],
  ['28', 'Carnation Ultra Dark', '#941434'],
  ['31', 'Blush Light', '#FCDAD6'],
  ['33', 'Blush Med Light', '#F7ADB2'],
  ['35', 'Blush Med', '#E47B89'],
  ['36', 'Blush Dark', '#C84F65'],
  ['38', 'Blush Very Dark', '#A72D48'],
  ['39', 'Blush Deep', '#881A36'],
  ['46', 'Crimson Red', '#D7182A'],
  ['47', 'Carmine Red', '#C21025'],
  ['48', 'Christmas Red Light', '#FF4343'],
  ['49', 'Christmas Red', '#DE1E29'],
  ['50', 'Christmas Red Dark', '#B81320'],
  ['52', 'China Red Light', '#FF5757'],
  ['55', 'China Red Med', '#D9232B'],
  ['57', 'China Red Dark', '#B01822'],
  ['59', 'China Red Very Dark', '#870F19'],
  ['60', 'Wild Rose Light', '#FDE7EA'],
  ['62', 'Wild Rose Med Light', '#F9BCC6'],
  ['63', 'Wild Rose Med', '#ED7C92'],
  ['65', 'Wild Rose Dark', '#D24765'],
  ['66', 'Wild Rose Very Dark', '#B02648'],
  ['68', 'Wild Rose Ultra Dark', '#8C1635'],
  ['69', 'Rose Wine Light', '#F1B2C2'],
  ['70', 'Rose Wine Med', '#DC7690'],
  ['72', 'Rose Wine Dark', '#BE4263'],
  ['74', 'Antique Rose Light', '#EAAEB8'],
  ['75', 'Antique Rose Med', '#D17C8B'],
  ['76', 'Antique Rose Dark', '#AF5466'],
  ['77', 'Antique Rose Very Dark', '#8D3547'],
  ['78', 'Antique Rose Deep', '#6D2030'],
  ['85', 'Orchid Light', '#F4D5E6'],
  ['86', 'Orchid Med Light', '#E8A7CD'],
  ['87', 'Orchid Med', '#D06EA6'],
  ['88', 'Orchid Dark', '#AE4282'],
  ['89', 'Orchid Very Dark', '#882462'],
  ['92', 'Plum Light', '#DF99BD'],
  ['94', 'Plum Med', '#B95D8E'],
  ['95', 'Plum Dark', '#93356A'],
  ['96', 'Violet Light', '#DFC4DE'],
  ['98', 'Violet Med', '#B986BA'],
  ['99', 'Violet Dark', '#944E96'],
  ['100', 'Violet Very Dark', '#732B77'],
  ['101', 'Violet Ultra Dark', '#57185B'],
  ['102', 'Lavender Light', '#D0C3DF'],
  ['103', 'Lavender Med', '#A38BC1'],
  ['108', 'Lavender Dark', '#76529E'],
  ['109', 'Lavender Very Dark', '#52307C'],
  ['110', 'Lavender Deep', '#381C5C'],
  ['111', 'Lavender Night', '#251042'],
  ['117', 'Thistle Light', '#CAD2E6'],
  ['118', 'Thistle Med', '#94A3CA'],
  ['119', 'Thistle Dark', '#5C71A8'],
  ['120', 'Cobalt Light', '#7694CE'],
  ['121', 'Cobalt Med', '#456BB5'],
  ['122', 'Cobalt Dark', '#274794'],
  ['123', 'Cobalt Very Dark', '#152C70'],
  ['127', 'Electric Blue Light', '#8EB4E3'],
  ['128', 'Electric Blue Med', '#4F84C4'],
  ['129', 'Electric Blue Dark', '#20579E'],
  ['130', 'Indigo Light', '#7295BD'],
  ['131', 'Indigo Med', '#406B9A'],
  ['132', 'Indigo Dark', '#214775'],
  ['133', 'Indigo Very Dark', '#112C52'],
  ['134', 'Indigo Night', '#081730'],
  ['136', 'Delft Blue Light', '#8DA9C4'],
  ['137', 'Delft Blue Med', '#52779D'],
  ['139', 'Delft Blue Dark', '#2D4E72'],
  ['140', 'Sky Blue Light', '#A5D3E8'],
  ['142', 'Sky Blue Med', '#62A9D1'],
  ['143', 'Sky Blue Dark', '#2C7DB2'],
  ['144', 'Baby Blue Light', '#C2E5F2'],
  ['145', 'Baby Blue Med Light', '#8CC9E3'],
  ['146', 'Baby Blue Med', '#54A6CE'],
  ['147', 'Baby Blue Dark', '#2982B0'],
  ['148', 'Baby Blue Very Dark', '#145D87'],
  ['149', 'Baby Blue Deep', '#0B4061'],
  ['158', 'Sapphire Light', '#8DB6CD'],
  ['159', 'Sapphire Med', '#4F82A2'],
  ['160', 'Sapphire Dark', '#265778'],
  ['161', 'Sapphire Very Dark', '#123A56'],
  ['162', 'Sapphire Night', '#092337'],
  ['164', 'Royal Blue Med', '#1C4587'],
  ['167', 'Royal Blue Dark', '#0C2B5C'],
  ['168', 'Navy Blue Med', '#1B365D'],
  ['169', 'Navy Blue Dark', '#0E2240'],
  ['170', 'Navy Blue Very Dark', '#071326'],
  ['175', 'Ocean Blue Light', '#8EC7D2'],
  ['176', 'Ocean Blue Med', '#4FA3B3'],
  ['177', 'Ocean Blue Dark', '#267B8D'],
  ['178', 'Ocean Blue Very Dark', '#115564'],
  ['185', 'Sea Green Light', '#B4E2DA'],
  ['186', 'Sea Green Med Light', '#7ACABF'],
  ['187', 'Sea Green Med', '#42ADA0'],
  ['188', 'Sea Green Dark', '#218B7E'],
  ['189', 'Sea Green Very Dark', '#11655B'],
  ['203', 'Mint Light', '#C5EAD9'],
  ['204', 'Mint Med Light', '#8CD2B4'],
  ['205', 'Mint Med', '#4DB48A'],
  ['206', 'Spruce Light', '#67A888'],
  ['208', 'Spruce Med', '#3C7B5D'],
  ['209', 'Spruce Dark', '#1D5339'],
  ['210', 'Spruce Very Dark', '#0E3622'],
  ['211', 'Spruce Night', '#062013'],
  ['213', 'Emerald Light', '#6BBF8C'],
  ['214', 'Emerald Med Light', '#3FA066'],
  ['215', 'Emerald Med', '#228148'],
  ['216', 'Emerald Dark', '#136332'],
  ['217', 'Emerald Very Dark', '#0B4621'],
  ['218', 'Emerald Deep', '#063015'],
  ['225', 'Grass Green Light', '#8ED276'],
  ['226', 'Grass Green Med', '#5FB442'],
  ['227', 'Grass Green Dark', '#3E8E24'],
  ['228', 'Grass Green Very Dark', '#276A14'],
  ['229', 'Grass Green Deep', '#174A0B'],
  ['238', 'Spring Green Light', '#A2DE6B'],
  ['239', 'Spring Green Med', '#7BC438'],
  ['240', 'Chartreuse Light', '#CEEA63'],
  ['242', 'Chartreuse Med', '#A9CD31'],
  ['243', 'Olive Light', '#9DB83A'],
  ['244', 'Olive Med Light', '#809B29'],
  ['245', 'Olive Med', '#627B1B'],
  ['246', 'Olive Dark', '#475C11'],
  ['253', 'Parrot Green Light', '#BEE36B'],
  ['255', 'Parrot Green Med', '#94C733'],
  ['256', 'Parrot Green Dark', '#6EA01C'],
  ['257', 'Parrot Green Very Dark', '#4C750F'],
  ['258', 'Parrot Green Deep', '#335208'],
  ['264', 'Avocado Light', '#ADC268'],
  ['265', 'Avocado Med Light', '#8FA645'],
  ['266', 'Avocado Med', '#708629'],
  ['267', 'Avocado Dark', '#516517'],
  ['268', 'Avocado Very Dark', '#38480D'],
  ['278', 'Olive Grove Light', '#9C9F58'],
  ['279', 'Olive Grove Med', '#7D803A'],
  ['280', 'Olive Grove Dark', '#5D6022'],
  ['281', 'Olive Grove Very Dark', '#404313'],
  ['288', 'Canary Yellow Light', '#FFF494'],
  ['289', 'Canary Yellow Med Light', '#FFEE5C'],
  ['290', 'Canary Yellow Med', '#FFE224'],
  ['291', 'Canary Yellow Dark', '#F5C800'],
  ['293', 'Sun Yellow Light', '#FFE87A'],
  ['295', 'Sun Yellow Med', '#FFD23B'],
  ['297', 'Sun Yellow Dark', '#F7B30C'],
  ['298', 'Sun Yellow Very Dark', '#E09200'],
  ['300', 'Citrus Light', '#FFF8A6'],
  ['301', 'Citrus Med Light', '#FFF06E'],
  ['302', 'Citrus Med', '#FFE338'],
  ['303', 'Citrus Dark', '#FACF0F'],
  ['304', 'Citrus Very Dark', '#E8B000'],
  ['305', 'Topaz Light', '#FCE18B'],
  ['306', 'Topaz Med', '#F5C453'],
  ['307', 'Topaz Dark', '#E5A124'],
  ['308', 'Topaz Very Dark', '#C87F0D'],
  ['309', 'Topaz Deep', '#A66004'],
  ['311', 'Tangerine Light', '#FFD185'],
  ['313', 'Tangerine Med Light', '#FFAF4D'],
  ['314', 'Tangerine Med', '#FF8C1F'],
  ['316', 'Tangerine Dark', '#E66A00'],
  ['323', 'Apricot Light', '#FFE0B8'],
  ['324', 'Apricot Med Light', '#FFC585'],
  ['326', 'Apricot Med', '#FFA252'],
  ['328', 'Apricot Dark', '#F07A24'],
  ['329', 'Apricot Very Dark', '#D4570D'],
  ['330', 'Copper Light', '#E8986B'],
  ['332', 'Copper Med', '#C96E3D'],
  ['333', 'Copper Dark', '#A7491C'],
  ['334', 'Copper Very Dark', '#842F0D'],
  ['335', 'Terra Cotta Dark', '#B84725'],
  ['336', 'Terra Cotta Light', '#F19579'],
  ['338', 'Terra Cotta Med', '#D66645'],
  ['339', 'Terra Cotta Deep', '#922E14'],
  ['340', 'Rust Light', '#D97350'],
  ['342', 'Rust Med', '#B54C2B'],
  ['343', 'Rust Dark', '#8D3014'],
  ['347', 'Bark Light', '#D0AC87'],
  ['349', 'Bark Med', '#A97E55'],
  ['351', 'Bark Dark', '#7F5630'],
  ['352', 'Bark Very Dark', '#5A381A'],
  ['355', 'Mocha Light', '#C9B59E'],
  ['357', 'Mocha Med', '#9E846A'],
  ['358', 'Coffee Dark', '#6E553F'],
  ['359', 'Coffee Very Dark', '#473424'],
  ['360', 'Espresso Dark', '#2D2015'],
  ['361', 'Nutmeg Light', '#D6B995'],
  ['362', 'Nutmeg Med', '#B28E64'],
  ['363', 'Nutmeg Dark', '#8B643A'],
  ['365', 'Nutmeg Very Dark', '#634220'],
  ['366', 'Nutmeg Deep', '#422810'],
  ['368', 'Spice Light', '#DC9B72'],
  ['369', 'Spice Med', '#B97144'],
  ['370', 'Spice Dark', '#924B22'],
  ['371', 'Spice Very Dark', '#6C2F10'],
  ['372', 'Desert Sand Light', '#E8D4B8'],
  ['373', 'Desert Sand Med Light', '#D2B792'],
  ['374', 'Desert Sand Med', '#B5956B'],
  ['375', 'Desert Sand Dark', '#927147'],
  ['380', 'Fawn Light', '#DEC8B0'],
  ['381', 'Fawn Med', '#BC9F82'],
  ['382', 'Fawn Dark', '#957557'],
  ['386', 'Bisque Light', '#F4E7D7'],
  ['387', 'Ecru Cream', '#EFE6D2'],
  ['388', 'Cream', '#F8F1DD'],
  ['390', 'Linen Light', '#E2D8C6'],
  ['391', 'Linen Med', '#C3B69F'],
  ['392', 'Linen Dark', '#9F9077'],
  ['393', 'Linen Very Dark', '#7B6C55'],
  ['397', 'Pearl Grey Light', '#E4E5E7'],
  ['398', 'Grey Light', '#C8C9CE'],
  ['399', 'Grey Med Light', '#A5A7AF'],
  ['400', 'Grey Med', '#7E818B'],
  ['401', 'Grey Dark', '#575A64'],
  ['403', 'Black', '#111113']
];

const anchorThreads: FlossThread[] = rawAnchor.map(([code, name, hex]) => {
  const { r, g, b } = hexToRgb(hex);
  return { code, name, hex, r, g, b, brandId: 'anchor' };
});

// 3. Cosmo (Lecien) Stranded Cotton Floss (Japan - World renowned delicate palette)
const rawCosmo: [string, string, string][] = [
  ['100', 'Pure White', '#FFFFFF'],
  ['101', 'Soft Cream', '#FFFBF0'],
  ['104', 'Ivory White', '#F7F3E6'],
  ['111', 'Cherry Pink Very Light', '#FDE7EC'],
  ['113', 'Cherry Pink Light', '#F9C0CE'],
  ['115', 'Cherry Pink Med', '#F08AA4'],
  ['117', 'Cherry Blossom Dark', '#DC5377'],
  ['120', 'Camellia Red', '#C72448'],
  ['125', 'Crimson Rose', '#A31535'],
  ['141', 'Peony Light', '#FCE2D6'],
  ['143', 'Peony Med', '#F5A992'],
  ['145', 'Coral Flame', '#E8664B'],
  ['148', 'Persimmon Orange', '#D34024'],
  ['150', 'Vermilion Deep', '#AA2411'],
  ['203', 'Apricot Blossom Light', '#FEE6CD'],
  ['205', 'Apricot Blossom Med', '#FBBF8C'],
  ['208', 'Tangerine Sun', '#F38C3B'],
  ['210', 'Marigold Glow', '#E36412'],
  ['231', 'Lemon Chiffon', '#FFFDC7'],
  ['233', 'Mimosa Light', '#FFF88A'],
  ['235', 'Mimosa Yellow', '#FFE942'],
  ['238', 'Sunflower Gold', '#F6C912'],
  ['241', 'Honey Amber Light', '#FAD97A'],
  ['243', 'Honey Amber Med', '#E8B63A'],
  ['246', 'Topaz Ochre', '#C68E18'],
  ['305', 'Pistachio Light', '#E8F5D0'],
  ['308', 'Wasabi Leaf', '#C4E798'],
  ['311', 'Spring Bamboo', '#9ACF5D'],
  ['314', 'Green Tea Med', '#6FA834'],
  ['318', 'Matcha Dark', '#4C7E1C'],
  ['322', 'Forest Pine', '#2D5810'],
  ['331', 'Mint Frost', '#D9F3E8'],
  ['334', 'Spearmint Med', '#9CE0C2'],
  ['337', 'Celadon Green', '#5CBD95'],
  ['340', 'Jadeite Dark', '#2D8E67'],
  ['343', 'Deep Cedar', '#156142'],
  ['411', 'Fuji Morning Mist', '#E1EDF7'],
  ['413', 'Hydrangea Light', '#B2D3EE'],
  ['415', 'Hydrangea Sky', '#72AEE0'],
  ['418', 'Daybreak Blue', '#3884CA'],
  ['421', 'Gentian Blue', '#195DA6'],
  ['425', 'Indigo Night', '#0C3772'],
  ['451', 'Iris Violet Light', '#E8E1F5'],
  ['453', 'Iris Violet Med', '#BCABDF'],
  ['456', 'Wisteria Purple', '#8A6FC2'],
  ['459', 'Bellflower Dark', '#5C3C9C'],
  ['462', 'Imperial Purple', '#3C1E74'],
  ['501', 'Plum Blossom Light', '#F5E1EC'],
  ['503', 'Plum Blossom Med', '#DEADC9'],
  ['506', 'Mauve Twilight', '#BA6D9C'],
  ['509', 'Berry Wine', '#8E3870'],
  ['512', 'Mulberry Dark', '#621B4B'],
  ['600', 'Obsidian Black', '#0D0E11'],
  ['701', 'White Rice', '#F4F2EC'],
  ['703', 'Raw Silk', '#E3DDD0'],
  ['706', 'Bamboo Shoot', '#C7BBA8'],
  ['709', 'Earthen Clay', '#A3927B'],
  ['712', 'Chestnut Brown', '#7C674E'],
  ['715', 'Dark Bark', '#4F3F2E'],
  ['751', 'Stone Grey Light', '#DCDDE0'],
  ['753', 'Pebble Grey Med', '#B2B4BB'],
  ['756', 'Granite Slate', '#7C7F89'],
  ['759', 'Charcoal Smoke', '#474A53']
];

const cosmoThreads: FlossThread[] = rawCosmo.map(([code, name, hex]) => {
  const { r, g, b } = hexToRgb(hex);
  return { code, name, hex, r, g, b, brandId: 'cosmo' };
});

// 4. Digital Rainbow (241-color perceptually uniform monitor gamut palette)
// 15 hue families × 15 saturation/luminance steps + 16 monochrome neutrals
const HUE_FAMILIES = [
  { prefix: 'R', name: 'Ruby Red', h: 0 },
  { prefix: 'CR', name: 'Coral Rose', h: 18 },
  { prefix: 'OR', name: 'Tangerine', h: 32 },
  { prefix: 'AM', name: 'Amber Gold', h: 45 },
  { prefix: 'YL', name: 'Canary Yellow', h: 58 },
  { prefix: 'LM', name: 'Lime Zest', h: 80 },
  { prefix: 'GR', name: 'Emerald Green', h: 130 },
  { prefix: 'TL', name: 'Peacock Teal', h: 165 },
  { prefix: 'CY', name: 'Aqua Cyan', h: 185 },
  { prefix: 'SK', name: 'Sky Cerulean', h: 205 },
  { prefix: 'BL', name: 'Cobalt Blue', h: 225 },
  { prefix: 'IN', name: 'Royal Indigo', h: 248 },
  { prefix: 'VT', name: 'Amethyst Violet', h: 275 },
  { prefix: 'MG', name: 'Bright Magenta', h: 305 },
  { prefix: 'PK', name: 'Flamingo Pink', h: 330 },
];

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number; hex: string } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x; }
  else if (hp >= 1 && hp < 2) { r1 = x; g1 = c; }
  else if (hp >= 2 && hp < 3) { g1 = c; b1 = x; }
  else if (hp >= 3 && hp < 4) { g1 = x; b1 = c; }
  else if (hp >= 4 && hp < 5) { r1 = x; b1 = c; }
  else if (hp >= 5 && hp < 6) { r1 = c; b1 = x; }
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  return { r, g, b, hex };
}

const rainbowThreads: FlossThread[] = [];

// Generate chromatic rainbow threads (15 hues × 15 steps = 225 colors)
HUE_FAMILIES.forEach(fam => {
  const steps = [
    { num: '01', s: 0.95, l: 0.14, desc: 'Deep' },
    { num: '02', s: 0.92, l: 0.20, desc: 'Dark' },
    { num: '03', s: 0.88, l: 0.26, desc: 'Shadow' },
    { num: '04', s: 0.85, l: 0.32, desc: 'Rich' },
    { num: '05', s: 0.88, l: 0.38, desc: 'Medium Dark' },
    { num: '06', s: 0.92, l: 0.44, desc: 'Medium' },
    { num: '07', s: 0.95, l: 0.50, desc: 'Vivid' },
    { num: '08', s: 0.92, l: 0.56, desc: 'Bright' },
    { num: '09', s: 0.88, l: 0.62, desc: 'Light Vivid' },
    { num: '10', s: 0.82, l: 0.68, desc: 'Light' },
    { num: '11', s: 0.75, l: 0.74, desc: 'Soft' },
    { num: '12', s: 0.65, l: 0.80, desc: 'Pastel' },
    { num: '13', s: 0.52, l: 0.86, desc: 'Pale' },
    { num: '14', s: 0.38, l: 0.92, desc: 'Mist' },
    { num: '15', s: 0.22, l: 0.96, desc: 'Tinge' }
  ];

  for (const step of steps) {
    const { r, g, b, hex } = hslToRgb(fam.h, step.s, step.l);
    rainbowThreads.push({
      code: `${fam.prefix}-${step.num}`,
      name: `${fam.name} ${step.desc}`,
      hex,
      r,
      g,
      b,
      brandId: 'rainbow'
    });
  }
});

// 16 Monochrome Neutrals / Greys
const neutralSteps = [
  { code: 'N-00', name: 'Absolute Black', l: 0.04 },
  { code: 'N-01', name: 'Pitch Charcoal', l: 0.10 },
  { code: 'N-02', name: 'Onyx Dark', l: 0.16 },
  { code: 'N-03', name: 'Cast Iron', l: 0.22 },
  { code: 'N-04', name: 'Charcoal Grey', l: 0.28 },
  { code: 'N-05', name: 'Gunmetal', l: 0.34 },
  { code: 'N-06', name: 'Slate Deep', l: 0.40 },
  { code: 'N-07', name: 'Medium Neutral Grey', l: 0.50 },
  { code: 'N-08', name: 'Battleship Grey', l: 0.58 },
  { code: 'N-09', name: 'Silver Ash', l: 0.66 },
  { code: 'N-10', name: 'Pewter Light', l: 0.74 },
  { code: 'N-11', name: 'Soft Mist Grey', l: 0.80 },
  { code: 'N-12', name: 'Pale Fog', l: 0.86 },
  { code: 'N-13', name: 'Cloud Grey', l: 0.91 },
  { code: 'N-14', name: 'Ghost White', l: 0.96 },
  { code: 'N-15', name: 'Pure White', l: 1.00 }
];

for (const n of neutralSteps) {
  const v = Math.round(n.l * 255);
  const hex = '#' + [v, v, v].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  rainbowThreads.push({
    code: n.code,
    name: n.name,
    hex,
    r: v,
    g: v,
    b: v,
    brandId: 'rainbow'
  });
}

// Thread Brands Registry
export const THREAD_BRANDS: Record<string, ThreadBrand> = {
  dmc: {
    id: 'dmc',
    name: 'DMC Mouliné Spécial',
    shortName: 'DMC',
    manufacturer: 'DMC France',
    description: 'The global gold standard in six-strand cotton embroidery floss with 491 shades.',
    threadCount: dmcThreads.length,
    threads: dmcThreads
  },
  anchor: {
    id: 'anchor',
    name: 'Anchor Stranded Cotton',
    shortName: 'Anchor',
    manufacturer: 'Coats Crafts UK',
    description: 'Premier European embroidery thread standard favored in traditional cross-stitch.',
    threadCount: anchorThreads.length,
    threads: anchorThreads
  },
  cosmo: {
    id: 'cosmo',
    name: 'Cosmo Embroidery Floss',
    shortName: 'Cosmo',
    manufacturer: 'Lecien Japan',
    description: 'World-renowned Japanese extra-long staple cotton with exquisite delicate pastel and earth tones.',
    threadCount: cosmoThreads.length,
    threads: cosmoThreads
  },
  rainbow: {
    id: 'rainbow',
    name: 'Digital Rainbow Gamut',
    shortName: 'Rainbow',
    manufacturer: 'runStitch Digital Engine',
    description: '241-color uniform perceptual RGB gamut optimized for digital art, monitor displays, and pixel graphics.',
    threadCount: rainbowThreads.length,
    threads: rainbowThreads
  }
};

export const THREAD_BRAND_LIST: ThreadBrand[] = Object.values(THREAD_BRANDS);

// Cached Lab colors for instant Delta-E matching
interface ThreadWithLab extends FlossThread {
  lab: LabColor;
}

const BRAND_CACHED_LABS: Record<string, ThreadWithLab[]> = {};

function getBrandLabCache(brandId: string): ThreadWithLab[] {
  if (!BRAND_CACHED_LABS[brandId]) {
    const brand = THREAD_BRANDS[brandId] || THREAD_BRANDS.dmc;
    BRAND_CACHED_LABS[brandId] = brand.threads.map(t => ({
      ...t,
      lab: rgbToLab(t.r, t.g, t.b)
    }));
  }
  return BRAND_CACHED_LABS[brandId];
}

/**
 * Finds the perceptually closest thread color in a given thread brand.
 */
export function findClosestInBrand(r: number, g: number, b: number, brandId: string = 'dmc'): FlossThread {
  const cache = getBrandLabCache(brandId);
  const targetLab = rgbToLab(r, g, b);
  let bestDist = Infinity;
  let bestThread = cache[0];

  for (let i = 0; i < cache.length; i++) {
    const item = cache[i];
    const dist = labDistance(targetLab, item.lab);
    if (dist < bestDist) {
      bestDist = dist;
      bestThread = item;
    }
  }

  return bestThread;
}

/**
 * Converts a project palette to the closest Delta-E matches in a target thread brand.
 */
export function convertPaletteToBrand(
  palette: PaletteColor[],
  targetBrandId: string
): { updatedPalette: PaletteColor[]; mappings: Map<number, FlossThread> } {
  const mappings = new Map<number, FlossThread>();

  const updatedPalette = palette.map(color => {
    const rgb = hexToRgb(color.hex);
    const closest = findClosestInBrand(rgb.r, rgb.g, rgb.b, targetBrandId);
    mappings.set(color.id, closest);

    return {
      ...color,
      dmc: closest.code,
      name: closest.name,
      hex: closest.hex,
      brand: targetBrandId
    };
  });

  return { updatedPalette, mappings };
}
