/**
 * Hand-Charted Cross-Stitch Alphabets & Bitmap Lettering Engine
 * 
 * Defines discrete 1:1 cross-stitch pixel alphabets that bypass vector
 * rasterization, ensuring authentic, perfectly proportioned heirloom stitches.
 */

export interface StitchGlyph {
  width: number;
  height: number;
  bitmap: string[]; // '#' or '*' is a full cross stitch, ' ' or '.' is empty cloth
}

export interface StitchAlphabet {
  id: string;
  name: string;
  author: string;
  height: number; // Nominal cap height in stitches
  defaultSpacing: number; // Default kerning / letter spacing in stitches
  defaultLineSpacing: number; // Default spacing between lines in stitches
  description: string;
  glyphs: Record<string, StitchGlyph>;
}

// -------------------------------------------------------------
// 1. MINI SAMPLER (5 stitches tall) - Ideal for dates & small tags
// -------------------------------------------------------------
const MINI_SAMPLER_GLYPHS: Record<string, StitchGlyph> = {
  'A': { width: 4, height: 5, bitmap: [' ## ', '#  #', '####', '#  #', '#  #'] },
  'B': { width: 4, height: 5, bitmap: ['### ', '#  #', '### ', '#  #', '### '] },
  'C': { width: 4, height: 5, bitmap: [' ###', '#   ', '#   ', '#   ', ' ###'] },
  'D': { width: 4, height: 5, bitmap: ['### ', '#  #', '#  #', '#  #', '### '] },
  'E': { width: 4, height: 5, bitmap: ['####', '#   ', '### ', '#   ', '####'] },
  'F': { width: 4, height: 5, bitmap: ['####', '#   ', '### ', '#   ', '#   '] },
  'G': { width: 4, height: 5, bitmap: [' ###', '#   ', '# ##', '#  #', ' ###'] },
  'H': { width: 4, height: 5, bitmap: ['#  #', '#  #', '####', '#  #', '#  #'] },
  'I': { width: 3, height: 5, bitmap: ['###', ' # ', ' # ', ' # ', '###'] },
  'J': { width: 4, height: 5, bitmap: ['   #', '   #', '   #', '#  #', ' ## '] },
  'K': { width: 4, height: 5, bitmap: ['#  #', '# # ', '##  ', '# # ', '#  #'] },
  'L': { width: 4, height: 5, bitmap: ['#   ', '#   ', '#   ', '#   ', '####'] },
  'M': { width: 5, height: 5, bitmap: ['#   #', '## ##', '# # #', '#   #', '#   #'] },
  'N': { width: 4, height: 5, bitmap: ['#  #', '## #', '# ##', '#  #', '#  #'] },
  'O': { width: 4, height: 5, bitmap: [' ## ', '#  #', '#  #', '#  #', ' ## '] },
  'P': { width: 4, height: 5, bitmap: ['### ', '#  #', '### ', '#   ', '#   '] },
  'Q': { width: 4, height: 5, bitmap: [' ## ', '#  #', '#  #', '# ##', ' ##X'] },
  'R': { width: 4, height: 5, bitmap: ['### ', '#  #', '### ', '# # ', '#  #'] },
  'S': { width: 4, height: 5, bitmap: [' ###', '#   ', ' ## ', '   #', '### '] },
  'T': { width: 5, height: 5, bitmap: ['#####', '  #  ', '  #  ', '  #  ', '  #  '] },
  'U': { width: 4, height: 5, bitmap: ['#  #', '#  #', '#  #', '#  #', ' ## '] },
  'V': { width: 5, height: 5, bitmap: ['#   #', '#   #', ' # # ', ' # # ', '  #  '] },
  'W': { width: 5, height: 5, bitmap: ['#   #', '#   #', '# # #', '## ##', '#   #'] },
  'X': { width: 5, height: 5, bitmap: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'] },
  'Y': { width: 5, height: 5, bitmap: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '] },
  'Z': { width: 4, height: 5, bitmap: ['####', '   #', '  # ', ' #  ', '####'] },
  '0': { width: 4, height: 5, bitmap: [' ## ', '# ##', '#  #', '## #', ' ## '] },
  '1': { width: 3, height: 5, bitmap: [' # ', '## ', ' # ', ' # ', '###'] },
  '2': { width: 4, height: 5, bitmap: ['### ', '   #', ' ## ', '#   ', '####'] },
  '3': { width: 4, height: 5, bitmap: ['### ', '   #', ' ## ', '   #', '### '] },
  '4': { width: 4, height: 5, bitmap: ['#  #', '#  #', '####', '   #', '   #'] },
  '5': { width: 4, height: 5, bitmap: ['####', '#   ', '### ', '   #', '### '] },
  '6': { width: 4, height: 5, bitmap: [' ## ', '#   ', '### ', '#  #', ' ## '] },
  '7': { width: 4, height: 5, bitmap: ['####', '   #', '  # ', ' #  ', '#   '] },
  '8': { width: 4, height: 5, bitmap: [' ## ', '#  #', ' ## ', '#  #', ' ## '] },
  '9': { width: 4, height: 5, bitmap: [' ## ', '#  #', ' ###', '   #', ' ## '] },
  ' ': { width: 3, height: 5, bitmap: ['   ', '   ', '   ', '   ', '   '] },
  '.': { width: 2, height: 5, bitmap: ['  ', '  ', '  ', '  ', '##'] },
  ',': { width: 2, height: 5, bitmap: ['  ', '  ', '  ', ' #', '# '] },
  '!': { width: 2, height: 5, bitmap: ['##', '##', '##', '  ', '##'] },
  '?': { width: 4, height: 5, bitmap: ['### ', '   #', ' ## ', '    ', ' #  '] },
  '-': { width: 3, height: 5, bitmap: ['   ', '   ', '###', '   ', '   '] },
  '&': { width: 5, height: 5, bitmap: [' ##  ', '#  # ', ' ##  ', '#  # ', ' ###X'] },
  '♥': { width: 5, height: 5, bitmap: [' # # ', '#####', '#####', ' ### ', '  #  '] },
  '★': { width: 5, height: 5, bitmap: ['  #  ', '#####', ' ### ', '# # #', '#   #'] }
};

// -------------------------------------------------------------
// 2. CLASSIC CROSS SAMPLER (7 stitches tall) - Traditional heirloom
// -------------------------------------------------------------
const CLASSIC_SAMPLER_GLYPHS: Record<string, StitchGlyph> = {
  'A': { width: 5, height: 7, bitmap: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'] },
  'B': { width: 5, height: 7, bitmap: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '] },
  'C': { width: 5, height: 7, bitmap: [' ####', '#    ', '#    ', '#    ', '#    ', '#    ', ' ####'] },
  'D': { width: 5, height: 7, bitmap: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '] },
  'E': { width: 5, height: 7, bitmap: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'] },
  'F': { width: 5, height: 7, bitmap: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '] },
  'G': { width: 5, height: 7, bitmap: [' ####', '#    ', '#    ', '#  ##', '#   #', '#   #', ' ####'] },
  'H': { width: 5, height: 7, bitmap: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'] },
  'I': { width: 3, height: 7, bitmap: ['###', ' # ', ' # ', ' # ', ' # ', ' # ', '###'] },
  'J': { width: 5, height: 7, bitmap: ['  ###', '   # ', '   # ', '   # ', '   # ', '#  # ', ' ##  '] },
  'K': { width: 5, height: 7, bitmap: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'] },
  'L': { width: 5, height: 7, bitmap: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'] },
  'M': { width: 7, height: 7, bitmap: ['#     #', '##   ##', '# # # #', '#  #  #', '#     #', '#     #', '#     #'] },
  'N': { width: 6, height: 7, bitmap: ['#    #', '##   #', '# #  #', '#  # #', '#   ##', '#    #', '#    #'] },
  'O': { width: 5, height: 7, bitmap: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '] },
  'P': { width: 5, height: 7, bitmap: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '] },
  'Q': { width: 5, height: 7, bitmap: [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'] },
  'R': { width: 5, height: 7, bitmap: ['#### ', '#   #', '#   #', '#### ', '#  # ', '#   #', '#   #'] },
  'S': { width: 5, height: 7, bitmap: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '] },
  'T': { width: 5, height: 7, bitmap: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '] },
  'U': { width: 5, height: 7, bitmap: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '] },
  'V': { width: 5, height: 7, bitmap: ['#   #', '#   #', '#   #', ' # # ', ' # # ', ' # # ', '  #  '] },
  'W': { width: 7, height: 7, bitmap: ['#     #', '#     #', '#     #', '#  #  #', '# # # #', '##   ##', '#     #'] },
  'X': { width: 5, height: 7, bitmap: ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'] },
  'Y': { width: 5, height: 7, bitmap: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '] },
  'Z': { width: 5, height: 7, bitmap: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'] },
  // Lowercase
  'a': { width: 5, height: 7, bitmap: ['     ', '     ', ' ### ', '    #', ' ####', '#   #', ' ####'] },
  'b': { width: 5, height: 7, bitmap: ['#    ', '#    ', '#### ', '#   #', '#   #', '#   #', '#### '] },
  'c': { width: 4, height: 7, bitmap: ['    ', '    ', ' ###', '#   ', '#   ', '#   ', ' ###'] },
  'd': { width: 5, height: 7, bitmap: ['    #', '    #', ' ####', '#   #', '#   #', '#   #', ' ####'] },
  'e': { width: 5, height: 7, bitmap: ['     ', '     ', ' ### ', '#   #', '#####', '#    ', ' ####'] },
  'f': { width: 4, height: 7, bitmap: ['  ##', ' #  ', '####', ' #  ', ' #  ', ' #  ', ' #  '] },
  'g': { width: 5, height: 7, bitmap: ['     ', ' ####', '#   #', '#   #', ' ####', '    #', '#### '] },
  'h': { width: 5, height: 7, bitmap: ['#    ', '#    ', '#### ', '#   #', '#   #', '#   #', '#   #'] },
  'i': { width: 2, height: 7, bitmap: [' #', '  ', '##', ' #', ' #', ' #', '##'] },
  'j': { width: 3, height: 7, bitmap: ['  #', '   ', ' ##', '  #', '  #', '# #', ' # '] },
  'k': { width: 4, height: 7, bitmap: ['#   ', '#  #', '# # ', '##  ', '# # ', '#  #', '#   '] },
  'l': { width: 2, height: 7, bitmap: ['##', ' #', ' #', ' #', ' #', ' #', '##'] },
  'm': { width: 7, height: 7, bitmap: ['       ', '       ', '## # ##', '# # # #', '# # # #', '#   # #', '#     #'] },
  'n': { width: 5, height: 7, bitmap: ['     ', '     ', '#### ', '#   #', '#   #', '#   #', '#   #'] },
  'o': { width: 5, height: 7, bitmap: ['     ', '     ', ' ### ', '#   #', '#   #', '#   #', ' ### '] },
  'p': { width: 5, height: 7, bitmap: ['     ', '#### ', '#   #', '#   #', '#### ', '#    ', '#    '] },
  'q': { width: 5, height: 7, bitmap: ['     ', ' ####', '#   #', '#   #', ' ####', '    #', '    #'] },
  'r': { width: 4, height: 7, bitmap: ['    ', '    ', '####', '#  #', '#   ', '#   ', '#   '] },
  's': { width: 4, height: 7, bitmap: ['    ', '    ', ' ###', '#   ', ' ## ', '   #', '### '] },
  't': { width: 4, height: 7, bitmap: [' #  ', '####', ' #  ', ' #  ', ' #  ', ' # #', '  # '] },
  'u': { width: 5, height: 7, bitmap: ['     ', '     ', '#   #', '#   #', '#   #', '#   #', ' ####'] },
  'v': { width: 5, height: 7, bitmap: ['     ', '     ', '#   #', '#   #', ' # # ', ' # # ', '  #  '] },
  'w': { width: 7, height: 7, bitmap: ['       ', '       ', '#     #', '#  #  #', '#  #  #', ' # # # ', '  # #  '] },
  'x': { width: 5, height: 7, bitmap: ['     ', '     ', '#   #', ' # # ', '  #  ', ' # # ', '#   #'] },
  'y': { width: 5, height: 7, bitmap: ['     ', '#   #', '#   #', '#   #', ' ####', '    #', '#### '] },
  'z': { width: 4, height: 7, bitmap: ['    ', '    ', '####', '  # ', ' #  ', '#   ', '####'] },
  // Digits
  '0': { width: 5, height: 7, bitmap: [' ### ', '#  ##', '# # #', '##  #', '#   #', '#   #', ' ### '] },
  '1': { width: 3, height: 7, bitmap: [' # ', '## ', ' # ', ' # ', ' # ', ' # ', '###'] },
  '2': { width: 5, height: 7, bitmap: [' ####', '#   #', '    #', '  ## ', ' #   ', '#    ', '#####'] },
  '3': { width: 5, height: 7, bitmap: ['#### ', '    #', '   # ', ' ### ', '    #', '    #', '#### '] },
  '4': { width: 5, height: 7, bitmap: ['#   #', '#   #', '#   #', '#####', '    #', '    #', '    #'] },
  '5': { width: 5, height: 7, bitmap: ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '] },
  '6': { width: 5, height: 7, bitmap: [' ### ', '#    ', '#    ', '#### ', '#   #', '#   #', ' ### '] },
  '7': { width: 5, height: 7, bitmap: ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '] },
  '8': { width: 5, height: 7, bitmap: [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '] },
  '9': { width: 5, height: 7, bitmap: [' ### ', '#   #', '#   #', ' ####', '    #', '    #', ' ### '] },
  ' ': { width: 3, height: 7, bitmap: ['   ', '   ', '   ', '   ', '   ', '   ', '   '] },
  '.': { width: 2, height: 7, bitmap: ['  ', '  ', '  ', '  ', '  ', '##', '##'] },
  ',': { width: 2, height: 7, bitmap: ['  ', '  ', '  ', '  ', '  ', ' #', '# '] },
  ':': { width: 2, height: 7, bitmap: ['  ', '##', '##', '  ', '##', '##', '  '] },
  ';': { width: 2, height: 7, bitmap: ['  ', '##', '##', '  ', ' #', '# ', '  '] },
  '!': { width: 2, height: 7, bitmap: ['##', '##', '##', '##', '  ', '##', '##'] },
  '?': { width: 5, height: 7, bitmap: [' ### ', '#   #', '    #', '  ## ', '  #  ', '     ', '  #  '] },
  '-': { width: 4, height: 7, bitmap: ['    ', '    ', '    ', '####', '    ', '    ', '    '] },
  '+': { width: 5, height: 7, bitmap: ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '] },
  '/': { width: 5, height: 7, bitmap: ['    #', '   # ', '   # ', '  #  ', ' #   ', ' #   ', '#    '] },
  '♥': { width: 7, height: 7, bitmap: [' ## ## ', '#######', '#######', '#######', ' ##### ', '  ###  ', '   #   '] },
  '★': { width: 7, height: 7, bitmap: ['   #   ', '  ###  ', '#######', ' ##### ', ' #######', '#  #  #', '#     #'] }
};

// -------------------------------------------------------------
// 3. ROMAN SERIF SAMPLER (9 stitches tall) - Elegant Heirloom
// -------------------------------------------------------------
const ROMAN_SERIF_GLYPHS: Record<string, StitchGlyph> = {
  'A': { width: 7, height: 9, bitmap: ['  ###  ', '  # #  ', ' #   # ', ' #   # ', ' #   # ', ' ##### ', '#     #', '#     #', '### ###'] },
  'B': { width: 6, height: 9, bitmap: ['##### ', ' #   #', ' #   #', ' #####', ' #   #', ' #   #', ' #   #', '##### ', '######'] },
  'C': { width: 6, height: 9, bitmap: [' #### ', '#    #', '#     ', '#     ', '#     ', '#     ', '#     ', '#    #', ' #### '] },
  'D': { width: 6, height: 9, bitmap: ['##### ', ' #   #', ' #   #', ' #   #', ' #   #', ' #   #', ' #   #', ' #   #', '##### '] },
  'E': { width: 6, height: 9, bitmap: ['######', ' #    ', ' #    ', ' #### ', ' #    ', ' #    ', ' #    ', ' #    ', '######'] },
  'F': { width: 6, height: 9, bitmap: ['######', ' #    ', ' #    ', ' #### ', ' #    ', ' #    ', ' #    ', ' #    ', '###   '] },
  'G': { width: 7, height: 9, bitmap: ['  #### ', ' #    #', '#      ', '#      ', '#   ###', '#     #', '#     #', ' #    #', '  #### '] },
  'H': { width: 7, height: 9, bitmap: ['### ###', ' #   # ', ' #   # ', ' ##### ', ' #   # ', ' #   # ', ' #   # ', ' #   # ', '### ###'] },
  'I': { width: 5, height: 9, bitmap: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '#####'] },
  'J': { width: 5, height: 9, bitmap: [' ####', '   # ', '   # ', '   # ', '   # ', '   # ', '#  # ', '#  # ', ' ##  '] },
  'K': { width: 7, height: 9, bitmap: ['###  ##', ' #  #  ', ' # #   ', ' ##    ', ' # #   ', ' #  #  ', ' #   # ', ' #   # ', '### ###'] },
  'L': { width: 6, height: 9, bitmap: ['###   ', ' #    ', ' #    ', ' #    ', ' #    ', ' #    ', ' #    ', ' #    ', '######'] },
  'M': { width: 9, height: 9, bitmap: ['###   ###', ' # # # # ', ' # # # # ', ' #  #  # ', ' #     # ', ' #     # ', ' #     # ', ' #     # ', '###   ###'] },
  'N': { width: 7, height: 9, bitmap: ['###  ##', ' ##   #', ' # #  #', ' #  # #', ' #  # #', ' #   ##', ' #    #', ' #    #', '###  ##'] },
  'O': { width: 7, height: 9, bitmap: ['  ###  ', ' #   # ', '#     #', '#     #', '#     #', '#     #', '#     #', ' #   # ', '  ###  '] },
  'P': { width: 6, height: 9, bitmap: ['##### ', ' #   #', ' #   #', ' #####', ' #    ', ' #    ', ' #    ', ' #    ', '###   '] },
  'Q': { width: 7, height: 9, bitmap: ['  ###  ', ' #   # ', '#     #', '#     #', '#     #', '#     #', '#   # #', ' #   ##', '  ####X'] },
  'R': { width: 7, height: 9, bitmap: ['#####  ', ' #   # ', ' #   # ', ' ##### ', ' #  #  ', ' #   # ', ' #   # ', ' #   # ', '### ###'] },
  'S': { width: 6, height: 9, bitmap: [' #### ', '#    #', '#     ', ' ###  ', '    # ', '     #', '#    #', '#    #', ' #### '] },
  'T': { width: 7, height: 9, bitmap: ['#######', '#  #  #', '   #   ', '   #   ', '   #   ', '   #   ', '   #   ', '   #   ', ' ##### '] },
  'U': { width: 7, height: 9, bitmap: ['### ###', ' #   # ', ' #   # ', ' #   # ', ' #   # ', ' #   # ', ' #   # ', ' #   # ', '  ###  '] },
  'V': { width: 7, height: 9, bitmap: ['### ###', ' #   # ', ' #   # ', ' #   # ', '  # #  ', '  # #  ', '  # #  ', '   #   ', '   #   '] },
  'W': { width: 9, height: 9, bitmap: ['###   ###', ' #     # ', ' #     # ', ' #     # ', ' #  #  # ', ' # # # # ', ' # # # # ', ' ##   ## ', ' #     # '] },
  'X': { width: 7, height: 9, bitmap: ['### ###', ' #   # ', '  # #  ', '   #   ', '   #   ', '  # #  ', ' #   # ', ' #   # ', '### ###'] },
  'Y': { width: 7, height: 9, bitmap: ['### ###', ' #   # ', '  # #  ', '   #   ', '   #   ', '   #   ', '   #   ', '   #   ', ' ##### '] },
  'Z': { width: 7, height: 9, bitmap: ['#######', '     # ', '    #  ', '   #   ', '  #    ', ' #     ', '#      ', '#     #', '#######'] },
  ' ': { width: 4, height: 9, bitmap: ['    ', '    ', '    ', '    ', '    ', '    ', '    ', '    ', '    '] },
  '.': { width: 3, height: 9, bitmap: ['   ', '   ', '   ', '   ', '   ', '   ', '   ', '###', '###'] },
  ',': { width: 3, height: 9, bitmap: ['   ', '   ', '   ', '   ', '   ', '   ', '  #', ' ##', '#  '] },
  '!': { width: 3, height: 9, bitmap: ['###', '###', '###', ' # ', ' # ', '   ', '   ', '###', '###'] },
  '-': { width: 4, height: 9, bitmap: ['    ', '    ', '    ', '    ', '####', '    ', '    ', '    ', '    '] },
  '♥': { width: 9, height: 9, bitmap: ['  ## ##  ', ' ####### ', '#########', '#########', '#########', ' ####### ', '  #####  ', '   ###   ', '    #    '] }
};

// -------------------------------------------------------------
// 4. VICTORIAN MONOGRAM (13 stitches tall) - Ornate Decorative Caps
// -------------------------------------------------------------
const VICTORIAN_MONOGRAM_GLYPHS: Record<string, StitchGlyph> = {
  'A': { width: 11, height: 13, bitmap: [
    '    ###    ',
    '   ## ##   ',
    '   #   #   ',
    '  ##   ##  ',
    '  #     #  ',
    ' ##     ## ',
    ' #       # ',
    ' ######### ',
    '##       ##',
    '#         #',
    '#  #   #  #',
    '## #   # ##',
    '####   ####'
  ]},
  'B': { width: 10, height: 13, bitmap: [
    '########  ',
    ' ##    ## ',
    ' #      # ',
    ' #      # ',
    ' ##    ## ',
    ' #######  ',
    ' ##    ## ',
    ' #      # ',
    ' #      # ',
    ' #      # ',
    ' ##    ## ',
    '########  ',
    '####      '
  ]},
  'C': { width: 10, height: 13, bitmap: [
    '  ######  ',
    ' ###  ### ',
    '##      # ',
    '#         ',
    '#         ',
    '#         ',
    '#         ',
    '#         ',
    '#         ',
    '##      # ',
    ' ###  ### ',
    '  ######  ',
    '   ####   '
  ]},
  'D': { width: 10, height: 13, bitmap: [
    '#######   ',
    ' ##   ### ',
    ' #      ##',
    ' #       #',
    ' #       #',
    ' #       #',
    ' #       #',
    ' #       #',
    ' #       #',
    ' #      ##',
    ' ##   ### ',
    '#######   ',
    '####      '
  ]},
  'E': { width: 9, height: 13, bitmap: [
    '#########',
    ' ##    ##',
    ' #      #',
    ' #       ',
    ' #       ',
    ' ######  ',
    ' ##   #  ',
    ' #       ',
    ' #       ',
    ' #      #',
    ' ##    ##',
    '#########',
    '####     '
  ]},
  'H': { width: 11, height: 13, bitmap: [
    '####   ####',
    ' ##     ## ',
    ' #       # ',
    ' #       # ',
    ' #       # ',
    ' ######### ',
    ' ##     ## ',
    ' #       # ',
    ' #       # ',
    ' #       # ',
    ' #       # ',
    ' ##     ## ',
    '####   ####'
  ]},
  'M': { width: 13, height: 13, bitmap: [
    '####     ####',
    ' ##       ## ',
    ' ###     ### ',
    ' # ##   ## # ',
    ' #  #   #  # ',
    ' #  ## ##  # ',
    ' #   ###   # ',
    ' #    #    # ',
    ' #         # ',
    ' #         # ',
    ' #         # ',
    ' ##       ## ',
    '####     ####'
  ]},
  'S': { width: 10, height: 13, bitmap: [
    '  ######  ',
    ' ###  ### ',
    '##      # ',
    '#         ',
    ' ##       ',
    '  ######  ',
    '   ###### ',
    '        ##',
    '         #',
    '#       ##',
    '##      # ',
    ' ###  ### ',
    '  ######  '
  ]},
  '♥': { width: 11, height: 13, bitmap: [
    '  ### ###  ',
    ' ##### #####',
    '###########',
    '###########',
    '###########',
    '###########',
    ' ######### ',
    '  #######  ',
    '   #####   ',
    '    ###    ',
    '     #     ',
    '           ',
    '           '
  ]},
  ' ': { width: 5, height: 13, bitmap: [
    '     ', '     ', '     ', '     ', '     ',
    '     ', '     ', '     ', '     ', '     ',
    '     ', '     ', '     '
  ]}
};

// -------------------------------------------------------------
// Catalog of Authentic Stitch Alphabets
// -------------------------------------------------------------
export const STITCH_ALPHABETS: StitchAlphabet[] = [
  {
    id: 'classic_sampler_7',
    name: 'Classic Sampler 7pt',
    author: 'Traditional Cross-Stitch',
    height: 7,
    defaultSpacing: 1,
    defaultLineSpacing: 2,
    description: 'Quintessential 7-row heirloom cross-stitch sampler alphabet with full uppercase, lowercase, and numbers.',
    glyphs: CLASSIC_SAMPLER_GLYPHS
  },
  {
    id: 'mini_sampler_5',
    name: 'Mini Sampler 5pt',
    author: 'Petite Needlework',
    height: 5,
    defaultSpacing: 1,
    defaultLineSpacing: 2,
    description: 'Compact 5-stitch tall alphabet. Perfect for stitching dates, initials, bookmarks, and small motifs.',
    glyphs: MINI_SAMPLER_GLYPHS
  },
  {
    id: 'roman_serif_9',
    name: 'Roman Serif 9pt',
    author: 'Victorian Heirloom',
    height: 9,
    defaultSpacing: 1,
    defaultLineSpacing: 3,
    description: 'Stately 9-stitch serif capital letters with proportioned foot serifs and balanced crossbars.',
    glyphs: ROMAN_SERIF_GLYPHS
  },
  {
    id: 'victorian_monogram_13',
    name: 'Victorian Monogram 13pt',
    author: 'Illuminated Monograms',
    height: 13,
    defaultSpacing: 2,
    defaultLineSpacing: 4,
    description: 'Ornate 13-stitch tall illuminated heirloom capital letters for monogramming cushions and wedding samplers.',
    glyphs: VICTORIAN_MONOGRAM_GLYPHS
  }
];

export interface RenderedStitchFont {
  width: number;
  height: number;
  stitches: Array<{ x: number; y: number }>;
}

/**
 * Typesets arbitrary text using a hand-charted stitch alphabet with
 * customizable discrete kerning (letterSpacing) and line spacing.
 */
export function typesetStitchAlphabet(
  alphabet: StitchAlphabet,
  text: string,
  options: {
    letterSpacing?: number;
    lineSpacing?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): RenderedStitchFont {
  const spacing = options.letterSpacing !== undefined ? options.letterSpacing : alphabet.defaultSpacing;
  const lineGap = options.lineSpacing !== undefined ? options.lineSpacing : alphabet.defaultLineSpacing;
  const align = options.align || 'left';

  const rawLines = text.split('\n');
  const renderedLines: Array<{
    lineWidth: number;
    stitches: Array<{ x: number; y: number }>;
  }> = [];

  let maxWidth = 0;

  for (const lineText of rawLines) {
    let cursorX = 0;
    const lineStitches: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      let glyph = alphabet.glyphs[char];

      // Fallbacks
      if (!glyph) {
        glyph = alphabet.glyphs[char.toUpperCase()] || alphabet.glyphs[char.toLowerCase()];
      }
      if (!glyph && char === ' ') {
        glyph = alphabet.glyphs[' '] || { width: 3, height: alphabet.height, bitmap: [] };
      }
      if (!glyph) {
        // Unknown character placeholder box
        glyph = {
          width: 4,
          height: alphabet.height,
          bitmap: ['####', '#  #', '#  #', '#  #', '####']
        };
      }

      // Add stitches from glyph bitmap
      for (let r = 0; r < glyph.bitmap.length; r++) {
        const rowStr = glyph.bitmap[r];
        for (let c = 0; c < rowStr.length; c++) {
          const ch = rowStr[c];
          if (ch === '#' || ch === '*' || ch === 'X') {
            lineStitches.push({
              x: cursorX + c,
              y: r
            });
          }
        }
      }

      cursorX += glyph.width + spacing;
    }

    const effectiveWidth = Math.max(0, cursorX - (lineText.length > 0 ? spacing : 0));
    maxWidth = Math.max(maxWidth, effectiveWidth);

    renderedLines.push({
      lineWidth: effectiveWidth,
      stitches: lineStitches
    });
  }

  // Combine lines with vertical lineGap and alignment
  const allStitches: Array<{ x: number; y: number }> = [];
  const totalH = rawLines.length * alphabet.height + (rawLines.length - 1) * lineGap;

  for (let lIdx = 0; lIdx < renderedLines.length; lIdx++) {
    const line = renderedLines[lIdx];
    const lineY = lIdx * (alphabet.height + lineGap);

    let offsetX = 0;
    if (align === 'center') {
      offsetX = Math.floor((maxWidth - line.lineWidth) / 2);
    } else if (align === 'right') {
      offsetX = maxWidth - line.lineWidth;
    }

    for (const st of line.stitches) {
      allStitches.push({
        x: st.x + offsetX,
        y: st.y + lineY
      });
    }
  }

  return {
    width: Math.max(1, maxWidth),
    height: Math.max(1, totalH),
    stitches: allStitches
  };
}
