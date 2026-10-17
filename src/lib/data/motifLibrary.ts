import type { MotifStamp, StitchType, CompositeBorder } from '../types';

export const BUILTIN_MOTIFS: MotifStamp[] = [
  // ----------------------------------------------------
  // 1. CORNERS & FLOURISHES
  // ----------------------------------------------------
  {
    id: 'floral_corner_rose',
    name: 'Vintage Rose Corner',
    category: 'corners',
    width: 11,
    height: 11,
    stitches: {
      // Corner rosebud & stem
      '0,0': { dmc: '700', type: 'full' },
      '1,0': { dmc: '700', type: 'full' },
      '2,0': { dmc: '700', type: 'full' },
      '3,0': { dmc: '700', type: 'full' },
      '4,0': { dmc: '700', type: 'full' },
      '5,0': { dmc: '700', type: 'full' },
      '0,1': { dmc: '700', type: 'full' },
      '0,2': { dmc: '700', type: 'full' },
      '0,3': { dmc: '700', type: 'full' },
      '0,4': { dmc: '700', type: 'full' },
      '0,5': { dmc: '700', type: 'full' },
      '2,2': { dmc: '702', type: 'full' },
      '3,2': { dmc: '700', type: 'full' },
      '2,3': { dmc: '700', type: 'full' },
      '3,3': { dmc: '666', type: 'full' },
      '4,3': { dmc: '666', type: 'full' },
      '3,4': { dmc: '666', type: 'full' },
      '4,4': { dmc: '321', type: 'full' },
      '5,4': { dmc: '666', type: 'full' },
      '4,5': { dmc: '666', type: 'full' },
      '5,5': { dmc: '321', type: 'full' },
      '6,4': { dmc: '702', type: 'full' },
      '4,6': { dmc: '702', type: 'full' },
      '7,3': { dmc: '700', type: 'full' },
      '3,7': { dmc: '700', type: 'full' },
      '8,2': { dmc: '666', type: 'full' },
      '2,8': { dmc: '666', type: 'full' },
      '9,1': { dmc: '666', type: 'full' },
      '1,9': { dmc: '666', type: 'full' },
      '10,0': { dmc: '702', type: 'full' },
      '0,10': { dmc: '702', type: 'full' }
    }
  },
  {
    id: 'celtic_knot_corner',
    name: 'Celtic Knot Corner',
    category: 'corners',
    width: 9,
    height: 9,
    stitches: {
      '0,0': { dmc: '700', type: 'full' },
      '1,0': { dmc: '700', type: 'full' },
      '2,0': { dmc: '700', type: 'full' },
      '3,0': { dmc: '700', type: 'full' },
      '4,0': { dmc: '700', type: 'full' },
      '0,1': { dmc: '700', type: 'full' },
      '0,2': { dmc: '700', type: 'full' },
      '0,3': { dmc: '700', type: 'full' },
      '0,4': { dmc: '700', type: 'full' },
      '2,2': { dmc: '700', type: 'full' },
      '3,2': { dmc: '700', type: 'full' },
      '4,2': { dmc: '700', type: 'full' },
      '2,3': { dmc: '700', type: 'full' },
      '2,4': { dmc: '700', type: 'full' },
      '4,4': { dmc: '702', type: 'full' },
      '5,4': { dmc: '700', type: 'full' },
      '4,5': { dmc: '700', type: 'full' },
      '6,3': { dmc: '700', type: 'full' },
      '3,6': { dmc: '700', type: 'full' },
      '7,2': { dmc: '700', type: 'full' },
      '2,7': { dmc: '700', type: 'full' },
      '8,1': { dmc: '700', type: 'full' },
      '1,8': { dmc: '700', type: 'full' },
      '6,6': { dmc: '702', type: 'full' },
      '7,7': { dmc: '700', type: 'full' },
      '8,8': { dmc: '700', type: 'full' }
    }
  },
  {
    id: 'victorian_scroll',
    name: 'Victorian Scroll Flourish',
    category: 'corners',
    width: 11,
    height: 7,
    stitches: {
      '5,0': { dmc: '433', type: 'full' },
      '4,1': { dmc: '433', type: 'full' },
      '6,1': { dmc: '433', type: 'full' },
      '3,2': { dmc: '898', type: 'full' },
      '5,2': { dmc: '720', type: 'full' },
      '7,2': { dmc: '898', type: 'full' },
      '2,3': { dmc: '898', type: 'full' },
      '8,3': { dmc: '898', type: 'full' },
      '1,4': { dmc: '433', type: 'full' },
      '9,4': { dmc: '433', type: 'full' },
      '0,5': { dmc: '433', type: 'full' },
      '1,5': { dmc: '898', type: 'full' },
      '9,5': { dmc: '898', type: 'full' },
      '10,5': { dmc: '433', type: 'full' },
      '0,6': { dmc: '898', type: 'full' },
      '10,6': { dmc: '898', type: 'full' },
      '4,4': { dmc: '433', type: 'full' },
      '5,4': { dmc: '433', type: 'full' },
      '6,4': { dmc: '433', type: 'full' }
    }
  },
  {
    id: 'acorn_oak_corner',
    name: 'Autumn Acorn Corner',
    category: 'corners',
    width: 9,
    height: 9,
    stitches: {
      '0,0': { dmc: '898', type: 'full' },
      '1,0': { dmc: '898', type: 'full' },
      '0,1': { dmc: '898', type: 'full' },
      '2,1': { dmc: '433', type: 'full' },
      '1,2': { dmc: '433', type: 'full' },
      '2,2': { dmc: '898', type: 'full' },
      '3,2': { dmc: '898', type: 'full' },
      '2,3': { dmc: '898', type: 'full' },
      '3,3': { dmc: '433', type: 'full' },
      '4,3': { dmc: '433', type: 'full' },
      '3,4': { dmc: '433', type: 'full' },
      '4,4': { dmc: '780', type: 'full' },
      '5,4': { dmc: '780', type: 'full' },
      '4,5': { dmc: '780', type: 'full' },
      '5,5': { dmc: '780', type: 'full' },
      '6,5': { dmc: '433', type: 'full' },
      '5,6': { dmc: '433', type: 'full' },
      '6,6': { dmc: '898', type: 'full' },
      '7,7': { dmc: '898', type: 'full' }
    }
  },

  // ----------------------------------------------------
  // 2. MINIS & SAMPLER ACCENTS
  // ----------------------------------------------------
  {
    id: 'mini_red_rose',
    name: 'Mini Red Rose',
    category: 'accents',
    width: 7,
    height: 7,
    stitches: {
      '2,0': { dmc: '666', type: 'full' },
      '3,0': { dmc: '666', type: 'full' },
      '1,1': { dmc: '666', type: 'full' },
      '2,1': { dmc: '321', type: 'full' },
      '3,1': { dmc: '321', type: 'full' },
      '4,1': { dmc: '666', type: 'full' },
      '2,2': { dmc: '666', type: 'full' },
      '3,2': { dmc: '666', type: 'full' },
      '4,2': { dmc: '321', type: 'full' },
      '3,3': { dmc: '700', type: 'full' },
      '2,4': { dmc: '702', type: 'full' },
      '3,4': { dmc: '700', type: 'full' },
      '3,5': { dmc: '700', type: 'full' },
      '4,5': { dmc: '702', type: 'full' },
      '3,6': { dmc: '700', type: 'full' }
    }
  },
  {
    id: 'ripe_strawberry',
    name: 'Ripe Strawberry',
    category: 'accents',
    width: 7,
    height: 8,
    stitches: {
      '2,0': { dmc: '702', type: 'full' },
      '4,0': { dmc: '702', type: 'full' },
      '1,1': { dmc: '700', type: 'full' },
      '2,1': { dmc: '700', type: 'full' },
      '3,1': { dmc: '702', type: 'full' },
      '4,1': { dmc: '700', type: 'full' },
      '5,1': { dmc: '700', type: 'full' },
      '1,2': { dmc: '666', type: 'full' },
      '2,2': { dmc: '666', type: 'full' },
      '3,2': { dmc: '973', type: 'full' },
      '4,2': { dmc: '666', type: 'full' },
      '5,2': { dmc: '666', type: 'full' },
      '0,3': { dmc: '666', type: 'full' },
      '1,3': { dmc: '973', type: 'full' },
      '2,3': { dmc: '666', type: 'full' },
      '3,3': { dmc: '666', type: 'full' },
      '4,3': { dmc: '973', type: 'full' },
      '5,3': { dmc: '666', type: 'full' },
      '6,3': { dmc: '666', type: 'full' },
      '1,4': { dmc: '666', type: 'full' },
      '2,4': { dmc: '666', type: 'full' },
      '3,4': { dmc: '973', type: 'full' },
      '4,4': { dmc: '666', type: 'full' },
      '5,4': { dmc: '666', type: 'full' },
      '2,5': { dmc: '666', type: 'full' },
      '3,5': { dmc: '666', type: 'full' },
      '4,5': { dmc: '973', type: 'full' },
      '2,6': { dmc: '666', type: 'full' },
      '3,6': { dmc: '666', type: 'full' },
      '3,7': { dmc: '666', type: 'full' }
    }
  },
  {
    id: 'honeybee',
    name: 'Honeybee',
    category: 'accents',
    width: 9,
    height: 7,
    stitches: {
      '2,0': { dmc: '799', type: 'full' },
      '6,0': { dmc: '799', type: 'full' },
      '1,1': { dmc: '799', type: 'full' },
      '2,1': { dmc: 'Blanc', type: 'full' },
      '6,1': { dmc: 'Blanc', type: 'full' },
      '7,1': { dmc: '799', type: 'full' },
      '2,2': { dmc: '799', type: 'full' },
      '4,2': { dmc: '310', type: 'full' },
      '6,2': { dmc: '799', type: 'full' },
      '3,3': { dmc: '310', type: 'full' },
      '4,3': { dmc: '973', type: 'full' },
      '5,3': { dmc: '310', type: 'full' },
      '3,4': { dmc: '310', type: 'full' },
      '4,4': { dmc: '310', type: 'full' },
      '5,4': { dmc: '310', type: 'full' },
      '3,5': { dmc: '973', type: 'full' },
      '4,5': { dmc: '973', type: 'full' },
      '5,5': { dmc: '973', type: 'full' },
      '4,6': { dmc: '310', type: 'full' }
    }
  },
  {
    id: 'monarch_butterfly',
    name: 'Monarch Butterfly',
    category: 'accents',
    width: 11,
    height: 9,
    stitches: {
      '4,0': { dmc: '310', type: 'full' },
      '6,0': { dmc: '310', type: 'full' },
      '1,1': { dmc: '310', type: 'full' },
      '2,1': { dmc: '310', type: 'full' },
      '5,1': { dmc: '310', type: 'full' },
      '8,1': { dmc: '310', type: 'full' },
      '9,1': { dmc: '310', type: 'full' },
      '0,2': { dmc: '310', type: 'full' },
      '1,2': { dmc: '720', type: 'full' },
      '2,2': { dmc: '970', type: 'full' },
      '3,2': { dmc: '310', type: 'full' },
      '5,2': { dmc: '310', type: 'full' },
      '7,2': { dmc: '310', type: 'full' },
      '8,2': { dmc: '970', type: 'full' },
      '9,2': { dmc: '720', type: 'full' },
      '10,2': { dmc: '310', type: 'full' },
      '0,3': { dmc: '310', type: 'full' },
      '1,3': { dmc: '970', type: 'full' },
      '2,3': { dmc: '970', type: 'full' },
      '3,3': { dmc: '720', type: 'full' },
      '4,3': { dmc: '310', type: 'full' },
      '5,3': { dmc: '310', type: 'full' },
      '6,3': { dmc: '310', type: 'full' },
      '7,3': { dmc: '720', type: 'full' },
      '8,3': { dmc: '970', type: 'full' },
      '9,3': { dmc: '970', type: 'full' },
      '10,3': { dmc: '310', type: 'full' },
      '1,4': { dmc: '310', type: 'full' },
      '2,4': { dmc: '720', type: 'full' },
      '3,4': { dmc: '310', type: 'full' },
      '5,4': { dmc: '310', type: 'full' },
      '7,4': { dmc: '310', type: 'full' },
      '8,4': { dmc: '720', type: 'full' },
      '9,4': { dmc: '310', type: 'full' },
      '2,5': { dmc: '310', type: 'full' },
      '3,5': { dmc: '970', type: 'full' },
      '4,5': { dmc: '310', type: 'full' },
      '5,5': { dmc: '310', type: 'full' },
      '6,5': { dmc: '310', type: 'full' },
      '7,5': { dmc: '970', type: 'full' },
      '8,5': { dmc: '310', type: 'full' },
      '3,6': { dmc: '310', type: 'full' },
      '4,6': { dmc: '720', type: 'full' },
      '5,6': { dmc: '310', type: 'full' },
      '6,6': { dmc: '720', type: 'full' },
      '7,6': { dmc: '310', type: 'full' },
      '4,7': { dmc: '310', type: 'full' },
      '5,7': { dmc: '310', type: 'full' },
      '6,7': { dmc: '310', type: 'full' },
      '5,8': { dmc: '310', type: 'full' }
    }
  },
  {
    id: 'sweetheart',
    name: 'Folk Sweetheart',
    category: 'accents',
    width: 7,
    height: 7,
    stitches: {
      '1,0': { dmc: '666', type: 'full' },
      '2,0': { dmc: '666', type: 'full' },
      '4,0': { dmc: '666', type: 'full' },
      '5,0': { dmc: '666', type: 'full' },
      '0,1': { dmc: '666', type: 'full' },
      '1,1': { dmc: '321', type: 'full' },
      '2,1': { dmc: '321', type: 'full' },
      '3,1': { dmc: '666', type: 'full' },
      '4,1': { dmc: '321', type: 'full' },
      '5,1': { dmc: '321', type: 'full' },
      '6,1': { dmc: '666', type: 'full' },
      '0,2': { dmc: '666', type: 'full' },
      '1,2': { dmc: '321', type: 'full' },
      '2,2': { dmc: 'Blanc', type: 'full' },
      '3,2': { dmc: '321', type: 'full' },
      '4,2': { dmc: '321', type: 'full' },
      '5,2': { dmc: '321', type: 'full' },
      '6,2': { dmc: '666', type: 'full' },
      '1,3': { dmc: '666', type: 'full' },
      '2,3': { dmc: '321', type: 'full' },
      '3,3': { dmc: '321', type: 'full' },
      '4,3': { dmc: '321', type: 'full' },
      '5,3': { dmc: '666', type: 'full' },
      '2,4': { dmc: '666', type: 'full' },
      '3,4': { dmc: '321', type: 'full' },
      '4,4': { dmc: '666', type: 'full' },
      '3,5': { dmc: '666', type: 'full' }
    }
  },
  {
    id: 'nordic_pine',
    name: 'Nordic Pine Tree',
    category: 'accents',
    width: 7,
    height: 9,
    stitches: {
      '3,0': { dmc: '973', type: 'full' },
      '3,1': { dmc: '700', type: 'full' },
      '2,2': { dmc: '700', type: 'full' },
      '3,2': { dmc: '702', type: 'full' },
      '4,2': { dmc: '700', type: 'full' },
      '1,3': { dmc: '700', type: 'full' },
      '2,3': { dmc: '700', type: 'full' },
      '3,3': { dmc: '702', type: 'full' },
      '4,3': { dmc: '700', type: 'full' },
      '5,3': { dmc: '700', type: 'full' },
      '2,4': { dmc: '700', type: 'full' },
      '3,4': { dmc: '700', type: 'full' },
      '4,4': { dmc: '700', type: 'full' },
      '1,5': { dmc: '700', type: 'full' },
      '2,5': { dmc: '702', type: 'full' },
      '3,5': { dmc: '700', type: 'full' },
      '4,5': { dmc: '702', type: 'full' },
      '5,5': { dmc: '700', type: 'full' },
      '0,6': { dmc: '700', type: 'full' },
      '1,6': { dmc: '700', type: 'full' },
      '2,6': { dmc: '700', type: 'full' },
      '3,6': { dmc: '702', type: 'full' },
      '4,6': { dmc: '700', type: 'full' },
      '5,6': { dmc: '700', type: 'full' },
      '6,6': { dmc: '700', type: 'full' },
      '3,7': { dmc: '433', type: 'full' },
      '3,8': { dmc: '433', type: 'full' }
    }
  },
  {
    id: 'folk_star',
    name: '8-Point Folk Star',
    category: 'accents',
    width: 7,
    height: 7,
    stitches: {
      '3,0': { dmc: '666', type: 'full' },
      '3,1': { dmc: '666', type: 'full' },
      '1,2': { dmc: '666', type: 'full' },
      '3,2': { dmc: '321', type: 'full' },
      '5,2': { dmc: '666', type: 'full' },
      '0,3': { dmc: '666', type: 'full' },
      '1,3': { dmc: '666', type: 'full' },
      '2,3': { dmc: '321', type: 'full' },
      '3,3': { dmc: '973', type: 'full' },
      '4,3': { dmc: '321', type: 'full' },
      '5,3': { dmc: '666', type: 'full' },
      '6,3': { dmc: '666', type: 'full' },
      '1,4': { dmc: '666', type: 'full' },
      '3,4': { dmc: '321', type: 'full' },
      '5,4': { dmc: '666', type: 'full' },
      '3,5': { dmc: '666', type: 'full' },
      '3,6': { dmc: '666', type: 'full' }
    }
  },
  {
    id: 'cat_silhouette',
    name: 'Black Cat Silhouette',
    category: 'accents',
    width: 7,
    height: 9,
    stitches: {
      '1,0': { dmc: '310', type: 'full' },
      '4,0': { dmc: '310', type: 'full' },
      '1,1': { dmc: '310', type: 'full' },
      '2,1': { dmc: '310', type: 'full' },
      '3,1': { dmc: '310', type: 'full' },
      '4,1': { dmc: '310', type: 'full' },
      '1,2': { dmc: '310', type: 'full' },
      '2,2': { dmc: '973', type: 'full' },
      '3,2': { dmc: '310', type: 'full' },
      '4,2': { dmc: '973', type: 'full' },
      '5,2': { dmc: '310', type: 'full' },
      '2,3': { dmc: '310', type: 'full' },
      '3,3': { dmc: '310', type: 'full' },
      '4,3': { dmc: '310', type: 'full' },
      '2,4': { dmc: '310', type: 'full' },
      '3,4': { dmc: '310', type: 'full' },
      '4,4': { dmc: '310', type: 'full' },
      '1,5': { dmc: '310', type: 'full' },
      '2,5': { dmc: '310', type: 'full' },
      '3,5': { dmc: '310', type: 'full' },
      '4,5': { dmc: '310', type: 'full' },
      '1,6': { dmc: '310', type: 'full' },
      '2,6': { dmc: '310', type: 'full' },
      '3,6': { dmc: '310', type: 'full' },
      '4,6': { dmc: '310', type: 'full' },
      '5,6': { dmc: '310', type: 'full' },
      '0,7': { dmc: '310', type: 'full' },
      '1,7': { dmc: '310', type: 'full' },
      '2,7': { dmc: '310', type: 'full' },
      '3,7': { dmc: '310', type: 'full' },
      '4,7': { dmc: '310', type: 'full' },
      '6,7': { dmc: '310', type: 'full' },
      '1,8': { dmc: '310', type: 'full' },
      '2,8': { dmc: '310', type: 'full' },
      '3,8': { dmc: '310', type: 'full' },
      '4,8': { dmc: '310', type: 'full' },
      '5,8': { dmc: '310', type: 'full' }
    }
  },

  // ----------------------------------------------------
  // 3. REPEATING BORDERS
  // ----------------------------------------------------
  {
    id: 'greek_key',
    name: 'Greek Key (Meander)',
    category: 'borders',
    width: 8,
    height: 6,
    stitches: {
      '0,0': { dmc: '796', type: 'full' },
      '1,0': { dmc: '796', type: 'full' },
      '2,0': { dmc: '796', type: 'full' },
      '3,0': { dmc: '796', type: 'full' },
      '4,0': { dmc: '796', type: 'full' },
      '5,0': { dmc: '796', type: 'full' },
      '6,0': { dmc: '796', type: 'full' },
      '7,0': { dmc: '796', type: 'full' },
      '7,1': { dmc: '796', type: 'full' },
      '7,2': { dmc: '796', type: 'full' },
      '7,3': { dmc: '796', type: 'full' },
      '7,4': { dmc: '796', type: 'full' },
      '7,5': { dmc: '796', type: 'full' },
      '6,5': { dmc: '796', type: 'full' },
      '5,5': { dmc: '796', type: 'full' },
      '4,5': { dmc: '796', type: 'full' },
      '4,4': { dmc: '796', type: 'full' },
      '4,3': { dmc: '796', type: 'full' },
      '4,2': { dmc: '796', type: 'full' },
      '3,2': { dmc: '796', type: 'full' },
      '2,2': { dmc: '796', type: 'full' },
      '2,3': { dmc: '796', type: 'full' },
      '2,4': { dmc: '796', type: 'full' },
      '2,5': { dmc: '796', type: 'full' },
      '1,5': { dmc: '796', type: 'full' },
      '0,5': { dmc: '796', type: 'full' },
      '0,4': { dmc: '796', type: 'full' },
      '0,3': { dmc: '796', type: 'full' },
      '0,2': { dmc: '796', type: 'full' },
      '0,1': { dmc: '796', type: 'full' }
    }
  },
  {
    id: 'ivy_vine',
    name: 'Ivy Leaf & Vine',
    category: 'borders',
    width: 8,
    height: 5,
    stitches: {
      '0,2': { dmc: '700', type: 'full' },
      '1,2': { dmc: '700', type: 'full' },
      '2,1': { dmc: '700', type: 'full' },
      '3,1': { dmc: '700', type: 'full' },
      '4,2': { dmc: '700', type: 'full' },
      '5,2': { dmc: '700', type: 'full' },
      '6,3': { dmc: '700', type: 'full' },
      '7,3': { dmc: '700', type: 'full' },
      '2,0': { dmc: '702', type: 'full' },
      '3,0': { dmc: '702', type: 'full' },
      '1,0': { dmc: '702', type: 'full' },
      '6,4': { dmc: '702', type: 'full' },
      '7,4': { dmc: '702', type: 'full' },
      '5,4': { dmc: '702', type: 'full' }
    }
  },
  {
    id: 'diamond_chain',
    name: 'Diamond Lattice Chain',
    category: 'borders',
    width: 6,
    height: 6,
    stitches: {
      '2,0': { dmc: '310', type: 'full' },
      '3,0': { dmc: '310', type: 'full' },
      '1,1': { dmc: '310', type: 'full' },
      '4,1': { dmc: '310', type: 'full' },
      '0,2': { dmc: '310', type: 'full' },
      '5,2': { dmc: '310', type: 'full' },
      '2,2': { dmc: '666', type: 'full' },
      '3,2': { dmc: '666', type: 'full' },
      '0,3': { dmc: '310', type: 'full' },
      '5,3': { dmc: '310', type: 'full' },
      '2,3': { dmc: '666', type: 'full' },
      '3,3': { dmc: '666', type: 'full' },
      '1,4': { dmc: '310', type: 'full' },
      '4,4': { dmc: '310', type: 'full' },
      '2,5': { dmc: '310', type: 'full' },
      '3,5': { dmc: '310', type: 'full' }
    }
  },
  {
    id: 'sweetheart_band',
    name: 'Sweetheart Running Band',
    category: 'borders',
    width: 6,
    height: 5,
    stitches: {
      '1,0': { dmc: '666', type: 'full' },
      '3,0': { dmc: '666', type: 'full' },
      '0,1': { dmc: '666', type: 'full' },
      '1,1': { dmc: '321', type: 'full' },
      '2,1': { dmc: '666', type: 'full' },
      '3,1': { dmc: '321', type: 'full' },
      '4,1': { dmc: '666', type: 'full' },
      '0,2': { dmc: '666', type: 'full' },
      '1,2': { dmc: '321', type: 'full' },
      '2,2': { dmc: '321', type: 'full' },
      '3,2': { dmc: '321', type: 'full' },
      '4,2': { dmc: '666', type: 'full' },
      '1,3': { dmc: '666', type: 'full' },
      '2,3': { dmc: '321', type: 'full' },
      '3,3': { dmc: '666', type: 'full' },
      '2,4': { dmc: '666', type: 'full' }
    }
  },
  {
    id: 'scallop_lace',
    name: 'Scalloped Lace Edge',
    category: 'borders',
    width: 6,
    height: 4,
    stitches: {
      '0,0': { dmc: '310', type: 'full' },
      '1,0': { dmc: '310', type: 'full' },
      '2,0': { dmc: '310', type: 'full' },
      '3,0': { dmc: '310', type: 'full' },
      '4,0': { dmc: '310', type: 'full' },
      '5,0': { dmc: '310', type: 'full' },
      '0,1': { dmc: '310', type: 'full' },
      '5,1': { dmc: '310', type: 'full' },
      '1,2': { dmc: '310', type: 'full' },
      '4,2': { dmc: '310', type: 'full' },
      '2,3': { dmc: '310', type: 'full' },
      '3,3': { dmc: '310', type: 'full' }
    }
  }
];

// ==========================================
// 4. SAMPLER PIXEL ALPHABETS
// ==========================================

// 3x5 Pixel Font bitmap matrices (A-Z, 0-9)
const FONT_5PX: Record<string, string[]> = {
  'A': ['010', '101', '111', '101', '101'],
  'B': ['110', '101', '110', '101', '110'],
  'C': ['011', '100', '100', '100', '011'],
  'D': ['110', '101', '101', '101', '110'],
  'E': ['111', '100', '110', '100', '111'],
  'F': ['111', '100', '110', '100', '100'],
  'G': ['011', '100', '101', '101', '011'],
  'H': ['101', '101', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'],
  'J': ['001', '001', '001', '101', '010'],
  'K': ['101', '110', '100', '110', '101'],
  'L': ['100', '100', '100', '100', '111'],
  'M': ['101', '111', '101', '101', '101'],
  'N': ['101', '111', '111', '101', '101'],
  'O': ['010', '101', '101', '101', '010'],
  'P': ['110', '101', '110', '100', '100'],
  'Q': ['010', '101', '101', '110', '011'],
  'R': ['110', '101', '110', '101', '101'],
  'S': ['011', '100', '010', '001', '110'],
  'T': ['111', '010', '010', '010', '010'],
  'U': ['101', '101', '101', '101', '111'],
  'V': ['101', '101', '101', '101', '010'],
  'W': ['101', '101', '101', '111', '101'],
  'X': ['101', '101', '010', '101', '101'],
  'Y': ['101', '101', '010', '010', '010'],
  'Z': ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '-': ['000', '000', '111', '000', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '.': ['000', '000', '000', '000', '010'],
  ' ': ['000', '000', '000', '000', '000']
};

/**
 * Converts a text string into a MotifStamp using the 3x5 mini sampler font.
 * Spacing: 1 empty stitch between letters, 3 empty stitches for space.
 */
export function renderTextToMotif(text: string, dmcColor: string = '310'): MotifStamp {
  const upper = text.toUpperCase();
  const stitches: Record<string, { dmc: string; type: StitchType }> = {};
  let currentX = 0;
  const height = 5;

  for (let i = 0; i < upper.length; i++) {
    const char = upper[i];
    if (char === ' ') {
      currentX += 3;
      continue;
    }

    const bitmap = FONT_5PX[char] || FONT_5PX['?'] || ['111', '101', '111', '100', '100'];
    const charWidth = bitmap[0].length;

    for (let r = 0; r < height; r++) {
      const row = bitmap[r];
      for (let c = 0; c < charWidth; c++) {
        if (row[c] === '1') {
          stitches[`${currentX + c},${r}`] = { dmc: dmcColor, type: 'full' };
        }
      }
    }

    currentX += charWidth + 1; // 1 stitch gap between letters
  }

  const finalWidth = Math.max(1, currentX > 0 ? currentX - 1 : 1);

  return {
    id: `text-${Date.now()}`,
    name: text.length > 15 ? text.substring(0, 15) + '...' : text,
    category: 'alphabets',
    width: finalWidth,
    height: 5,
    stitches
  };
}

// ==========================================
// 5. USER CUSTOM STAMPS (LOCALSTORAGE)
// ==========================================

const CUSTOM_STAMPS_KEY = 'xstitcher_custom_stamps';

export function loadCustomStamps(): MotifStamp[] {
  try {
    const json = localStorage.getItem(CUSTOM_STAMPS_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to load custom stamps from localStorage', err);
    return [];
  }
}

export function saveCustomStamp(stamp: MotifStamp): void {
  try {
    const current = loadCustomStamps();
    const updated = [stamp, ...current.filter(s => s.id !== stamp.id)];
    localStorage.setItem(CUSTOM_STAMPS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom stamp to localStorage', err);
  }
}

export function deleteCustomStamp(id: string): void {
  try {
    const current = loadCustomStamps();
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem(CUSTOM_STAMPS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom stamp from localStorage', err);
  }
}

// ==========================================
// 6. COMPOSITE 2-PART BORDERS (Corner + Runner)
// ==========================================

export const COMPOSITE_BORDERS: CompositeBorder[] = [
  {
    id: 'rose_and_ivy',
    name: 'Vintage Rose & Ivy Band',
    cornerMotif: {
      id: 'rose_corner_5x5',
      name: 'Rose Corner',
      category: 'corners',
      width: 5,
      height: 5,
      stitches: {
        '0,0': { dmc: '700', type: 'full' },
        '1,0': { dmc: '700', type: 'full' },
        '2,0': { dmc: '700', type: 'full' },
        '0,1': { dmc: '700', type: 'full' },
        '1,1': { dmc: '702', type: 'full' },
        '2,1': { dmc: '666', type: 'full' },
        '0,2': { dmc: '700', type: 'full' },
        '1,2': { dmc: '666', type: 'full' },
        '2,2': { dmc: '321', type: 'full' },
        '3,2': { dmc: '666', type: 'full' },
        '2,3': { dmc: '666', type: 'full' },
        '3,3': { dmc: '702', type: 'full' },
        '4,0': { dmc: '700', type: 'full' },
        '0,4': { dmc: '700', type: 'full' }
      }
    },
    runnerMotif: {
      id: 'ivy_runner_5x3',
      name: 'Ivy Runner',
      category: 'borders',
      width: 5,
      height: 3,
      stitches: {
        '0,1': { dmc: '700', type: 'full' },
        '1,1': { dmc: '700', type: 'full' },
        '2,0': { dmc: '702', type: 'full' },
        '2,1': { dmc: '700', type: 'full' },
        '3,1': { dmc: '700', type: 'full' },
        '3,2': { dmc: '702', type: 'full' },
        '4,1': { dmc: '700', type: 'full' }
      }
    }
  },
  {
    id: 'celtic_interlace',
    name: 'Celtic Interlace & Braid',
    cornerMotif: {
      id: 'celtic_corner_5x5',
      name: 'Celtic Corner',
      category: 'corners',
      width: 5,
      height: 5,
      stitches: {
        '0,0': { dmc: '700', type: 'full' },
        '1,0': { dmc: '700', type: 'full' },
        '2,0': { dmc: '700', type: 'full' },
        '3,0': { dmc: '700', type: 'full' },
        '0,1': { dmc: '700', type: 'full' },
        '2,1': { dmc: '702', type: 'full' },
        '0,2': { dmc: '700', type: 'full' },
        '1,2': { dmc: '702', type: 'full' },
        '2,2': { dmc: '700', type: 'full' },
        '3,2': { dmc: '700', type: 'full' },
        '0,3': { dmc: '700', type: 'full' },
        '2,3': { dmc: '700', type: 'full' },
        '3,3': { dmc: '702', type: 'full' },
        '4,0': { dmc: '700', type: 'full' },
        '0,4': { dmc: '700', type: 'full' }
      }
    },
    runnerMotif: {
      id: 'celtic_runner_4x3',
      name: 'Celtic Runner',
      category: 'borders',
      width: 4,
      height: 3,
      stitches: {
        '0,0': { dmc: '700', type: 'full' },
        '1,0': { dmc: '700', type: 'full' },
        '2,1': { dmc: '702', type: 'full' },
        '3,0': { dmc: '700', type: 'full' },
        '0,2': { dmc: '700', type: 'full' },
        '1,2': { dmc: '700', type: 'full' },
        '2,2': { dmc: '700', type: 'full' },
        '3,2': { dmc: '700', type: 'full' }
      }
    }
  },
  {
    id: 'folk_star_chevron',
    name: 'Nordic Folk Star & Chevron',
    cornerMotif: {
      id: 'folk_star_corner_5x5',
      name: 'Folk Star Corner',
      category: 'corners',
      width: 5,
      height: 5,
      stitches: {
        '2,0': { dmc: '666', type: 'full' },
        '1,1': { dmc: '321', type: 'full' },
        '2,1': { dmc: '666', type: 'full' },
        '3,1': { dmc: '321', type: 'full' },
        '0,2': { dmc: '666', type: 'full' },
        '1,2': { dmc: '666', type: 'full' },
        '2,2': { dmc: 'Blanc', type: 'full' },
        '3,2': { dmc: '666', type: 'full' },
        '4,2': { dmc: '666', type: 'full' },
        '1,3': { dmc: '321', type: 'full' },
        '2,3': { dmc: '666', type: 'full' },
        '3,3': { dmc: '321', type: 'full' },
        '2,4': { dmc: '666', type: 'full' }
      }
    },
    runnerMotif: {
      id: 'chevron_runner_4x3',
      name: 'Chevron Runner',
      category: 'borders',
      width: 4,
      height: 3,
      stitches: {
        '0,0': { dmc: '666', type: 'full' },
        '1,1': { dmc: '321', type: 'full' },
        '2,2': { dmc: '666', type: 'full' },
        '3,1': { dmc: '321', type: 'full' }
      }
    }
  },
  {
    id: 'scallop_lace_flourish',
    name: 'Victorian Lace & Rosette',
    cornerMotif: {
      id: 'lace_corner_5x5',
      name: 'Lace Corner',
      category: 'corners',
      width: 5,
      height: 5,
      stitches: {
        '0,0': { dmc: '310', type: 'full' },
        '1,0': { dmc: '310', type: 'full' },
        '2,0': { dmc: '310', type: 'full' },
        '0,1': { dmc: '310', type: 'full' },
        '2,1': { dmc: '720', type: 'full' },
        '0,2': { dmc: '310', type: 'full' },
        '1,2': { dmc: '720', type: 'full' },
        '2,2': { dmc: '310', type: 'full' },
        '3,1': { dmc: '310', type: 'full' },
        '1,3': { dmc: '310', type: 'full' },
        '4,0': { dmc: '310', type: 'full' },
        '0,4': { dmc: '310', type: 'full' }
      }
    },
    runnerMotif: {
      id: 'scallop_runner_4x3',
      name: 'Scallop Runner',
      category: 'borders',
      width: 4,
      height: 3,
      stitches: {
        '0,0': { dmc: '310', type: 'full' },
        '1,0': { dmc: '310', type: 'full' },
        '2,0': { dmc: '310', type: 'full' },
        '3,0': { dmc: '310', type: 'full' },
        '0,1': { dmc: '310', type: 'full' },
        '3,1': { dmc: '310', type: 'full' },
        '1,2': { dmc: '310', type: 'full' },
        '2,2': { dmc: '310', type: 'full' }
      }
    }
  }
];

