import type { PaletteColor } from '../types';

export const CHART_SYMBOLS = [
  '●', '■', '▲', '◆', '★', '✚', '✖', '▼', '◀', '▶',
  '○', '□', '△', '◇', '☆', '✦', '✜', '☼', '♠', '♣',
  '♥', '♦', 'Ω', '§', 'Ψ', 'Φ', 'θ', 'λ', 'Ж', 'Ю',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L',
  'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'Y',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
  '#', '%', '&', '@', '$', '?', '!', '~', '≠', '✓'
];

export interface DMCEntry {
  code: string;
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

// Complete Standard DMC Six-Strand Embroidery Floss Catalog (491 colors)
export const DMC_CATALOG: DMCEntry[] = [
  {
    "code": "01",
    "name": "White Tin",
    "hex": "#E3E3E6",
    "r": 227,
    "g": 227,
    "b": 230
  },
  {
    "code": "02",
    "name": "Tin",
    "hex": "#D7D7D8",
    "r": 215,
    "g": 215,
    "b": 216
  },
  {
    "code": "03",
    "name": "Medium Tin",
    "hex": "#B8B8BB",
    "r": 184,
    "g": 184,
    "b": 187
  },
  {
    "code": "04",
    "name": "Dark Tin",
    "hex": "#676464",
    "r": 103,
    "g": 100,
    "b": 100
  },
  {
    "code": "05",
    "name": "Light Driftwood",
    "hex": "#EAE6E1",
    "r": 234,
    "g": 230,
    "b": 225
  },
  {
    "code": "06",
    "name": "Medium Light Driftwood",
    "hex": "#D0C9C0",
    "r": 208,
    "g": 201,
    "b": 192
  },
  {
    "code": "07",
    "name": "Driftwood",
    "hex": "#AEA496",
    "r": 174,
    "g": 164,
    "b": 150
  },
  {
    "code": "08",
    "name": "Dark Driftwood",
    "hex": "#887B68",
    "r": 136,
    "g": 123,
    "b": 104
  },
  {
    "code": "09",
    "name": "Very Dark Cocoa",
    "hex": "#45382B",
    "r": 69,
    "g": 56,
    "b": 43
  },
  {
    "code": "10",
    "name": "Very Light Tender Green",
    "hex": "#E1F1D8",
    "r": 225,
    "g": 241,
    "b": 216
  },
  {
    "code": "11",
    "name": "Light Tender Green",
    "hex": "#BDE5A7",
    "r": 189,
    "g": 229,
    "b": 167
  },
  {
    "code": "12",
    "name": "Tender Green",
    "hex": "#98D57A",
    "r": 152,
    "g": 213,
    "b": 122
  },
  {
    "code": "13",
    "name": "Medium Light Nile Green",
    "hex": "#A9DEB5",
    "r": 169,
    "g": 222,
    "b": 181
  },
  {
    "code": "14",
    "name": "Pale Apple Green",
    "hex": "#D0E69C",
    "r": 208,
    "g": 230,
    "b": 156
  },
  {
    "code": "15",
    "name": "Apple Green",
    "hex": "#A9C962",
    "r": 169,
    "g": 201,
    "b": 98
  },
  {
    "code": "16",
    "name": "Light Chartreuse",
    "hex": "#D6E266",
    "r": 214,
    "g": 226,
    "b": 102
  },
  {
    "code": "17",
    "name": "Light Yellow Plum",
    "hex": "#F7E78D",
    "r": 247,
    "g": 231,
    "b": 141
  },
  {
    "code": "18",
    "name": "Yellow Plum",
    "hex": "#EECD53",
    "r": 238,
    "g": 205,
    "b": 83
  },
  {
    "code": "19",
    "name": "Medium Light Autumn Gold",
    "hex": "#E3A857",
    "r": 227,
    "g": 168,
    "b": 87
  },
  {
    "code": "20",
    "name": "Shrimp",
    "hex": "#F4978E",
    "r": 244,
    "g": 151,
    "b": 142
  },
  {
    "code": "21",
    "name": "Light Alizarin",
    "hex": "#EB6866",
    "r": 235,
    "g": 104,
    "b": 102
  },
  {
    "code": "22",
    "name": "Alizarin",
    "hex": "#D43D43",
    "r": 212,
    "g": 61,
    "b": 67
  },
  {
    "code": "23",
    "name": "Apple Blossom",
    "hex": "#A52328",
    "r": 165,
    "g": 35,
    "b": 40
  },
  {
    "code": "24",
    "name": "White Lavender",
    "hex": "#F6F0F6",
    "r": 246,
    "g": 240,
    "b": 246
  },
  {
    "code": "25",
    "name": "Ultra Light Lavender",
    "hex": "#E9DCED",
    "r": 233,
    "g": 220,
    "b": 237
  },
  {
    "code": "26",
    "name": "Pale Lavender",
    "hex": "#D5BEDC",
    "r": 213,
    "g": 190,
    "b": 220
  },
  {
    "code": "27",
    "name": "White Violet",
    "hex": "#ECE7F0",
    "r": 236,
    "g": 231,
    "b": 240
  },
  {
    "code": "28",
    "name": "Medium Light Eggplant",
    "hex": "#896C85",
    "r": 137,
    "g": 108,
    "b": 133
  },
  {
    "code": "29",
    "name": "Eggplant",
    "hex": "#5C3E57",
    "r": 92,
    "g": 62,
    "b": 87
  },
  {
    "code": "30",
    "name": "Medium Light Blueberry",
    "hex": "#7B94B5",
    "r": 123,
    "g": 148,
    "b": 181
  },
  {
    "code": "31",
    "name": "Blueberry",
    "hex": "#536E94",
    "r": 83,
    "g": 110,
    "b": 148
  },
  {
    "code": "32",
    "name": "Dark Blueberry",
    "hex": "#364D70",
    "r": 54,
    "g": 77,
    "b": 112
  },
  {
    "code": "33",
    "name": "Fuchsia",
    "hex": "#B8336A",
    "r": 184,
    "g": 51,
    "b": 106
  },
  {
    "code": "34",
    "name": "Dark Fuchsia",
    "hex": "#8E2052",
    "r": 142,
    "g": 32,
    "b": 82
  },
  {
    "code": "35",
    "name": "Very Dark Fuchsia",
    "hex": "#5E1D44",
    "r": 94,
    "g": 29,
    "b": 68
  },
  {
    "code": "150",
    "name": "Dusty Rose Ult Vy Dk",
    "hex": "#AB0249",
    "r": 171,
    "g": 2,
    "b": 73
  },
  {
    "code": "151",
    "name": "Dusty Rose Vry Lt",
    "hex": "#F0CED4",
    "r": 240,
    "g": 206,
    "b": 212
  },
  {
    "code": "152",
    "name": "Shell Pink Med Light",
    "hex": "#E2A099",
    "r": 226,
    "g": 160,
    "b": 153
  },
  {
    "code": "153",
    "name": "Violet Very Light",
    "hex": "#E6CCD9",
    "r": 230,
    "g": 204,
    "b": 217
  },
  {
    "code": "154",
    "name": "Grape Very Dark",
    "hex": "#572433",
    "r": 87,
    "g": 36,
    "b": 51
  },
  {
    "code": "155",
    "name": "Blue Violet Med Dark",
    "hex": "#9891B6",
    "r": 152,
    "g": 145,
    "b": 182
  },
  {
    "code": "156",
    "name": "Blue Violet Med Lt",
    "hex": "#A3AED1",
    "r": 163,
    "g": 174,
    "b": 209
  },
  {
    "code": "157",
    "name": "Cornflower Blue Vy Lt",
    "hex": "#BBC3D9",
    "r": 187,
    "g": 195,
    "b": 217
  },
  {
    "code": "158",
    "name": "Cornflower Blu M V D",
    "hex": "#4C526E",
    "r": 76,
    "g": 82,
    "b": 110
  },
  {
    "code": "159",
    "name": "Blue Gray Light",
    "hex": "#C7CAD7",
    "r": 199,
    "g": 202,
    "b": 215
  },
  {
    "code": "160",
    "name": "Blue Gray Medium",
    "hex": "#999FB7",
    "r": 153,
    "g": 159,
    "b": 183
  },
  {
    "code": "161",
    "name": "Blue Gray",
    "hex": "#7880A4",
    "r": 120,
    "g": 128,
    "b": 164
  },
  {
    "code": "162",
    "name": "Blue Ultra Very Light",
    "hex": "#DBECF5",
    "r": 219,
    "g": 236,
    "b": 245
  },
  {
    "code": "163",
    "name": "Celadon Green Md",
    "hex": "#4D8361",
    "r": 77,
    "g": 131,
    "b": 97
  },
  {
    "code": "164",
    "name": "Forest Green Lt",
    "hex": "#C8D8B8",
    "r": 200,
    "g": 216,
    "b": 184
  },
  {
    "code": "165",
    "name": "Moss Green Vy Lt",
    "hex": "#EFF4A4",
    "r": 239,
    "g": 244,
    "b": 164
  },
  {
    "code": "166",
    "name": "Moss Green Md Lt",
    "hex": "#C0C840",
    "r": 192,
    "g": 200,
    "b": 64
  },
  {
    "code": "167",
    "name": "Yellow Beige V Dk",
    "hex": "#A77C49",
    "r": 167,
    "g": 124,
    "b": 73
  },
  {
    "code": "168",
    "name": "Pewter Very Light",
    "hex": "#D1D1D1",
    "r": 209,
    "g": 209,
    "b": 209
  },
  {
    "code": "169",
    "name": "Pewter Light",
    "hex": "#848484",
    "r": 132,
    "g": 132,
    "b": 132
  },
  {
    "code": "208",
    "name": "Lavender Very Dark",
    "hex": "#835B8B",
    "r": 131,
    "g": 91,
    "b": 139
  },
  {
    "code": "209",
    "name": "Lavender Dark",
    "hex": "#A37BA7",
    "r": 163,
    "g": 123,
    "b": 167
  },
  {
    "code": "210",
    "name": "Lavender Medium",
    "hex": "#C39FC3",
    "r": 195,
    "g": 159,
    "b": 195
  },
  {
    "code": "211",
    "name": "Lavender Light",
    "hex": "#E3CBE3",
    "r": 227,
    "g": 203,
    "b": 227
  },
  {
    "code": "221",
    "name": "Shell Pink Vy Dk",
    "hex": "#883E43",
    "r": 136,
    "g": 62,
    "b": 67
  },
  {
    "code": "223",
    "name": "Shell Pink Light",
    "hex": "#CC847C",
    "r": 204,
    "g": 132,
    "b": 124
  },
  {
    "code": "224",
    "name": "Shell Pink Very Light",
    "hex": "#EBB7AF",
    "r": 235,
    "g": 183,
    "b": 175
  },
  {
    "code": "225",
    "name": "Shell Pink Ult Vy Lt",
    "hex": "#FFDFD5",
    "r": 255,
    "g": 223,
    "b": 213
  },
  {
    "code": "300",
    "name": "Mahogany Vy Dk",
    "hex": "#6F2F00",
    "r": 111,
    "g": 47,
    "b": 0
  },
  {
    "code": "301",
    "name": "Mahogany Med",
    "hex": "#B35F2B",
    "r": 179,
    "g": 95,
    "b": 43
  },
  {
    "code": "304",
    "name": "Red Medium",
    "hex": "#B71F33",
    "r": 183,
    "g": 31,
    "b": 51
  },
  {
    "code": "307",
    "name": "Lemon",
    "hex": "#FDED54",
    "r": 253,
    "g": 237,
    "b": 84
  },
  {
    "code": "309",
    "name": "Rose Dark",
    "hex": "#564A4A",
    "r": 86,
    "g": 74,
    "b": 74
  },
  {
    "code": "310",
    "name": "Black",
    "hex": "#000000",
    "r": 0,
    "g": 0,
    "b": 0
  },
  {
    "code": "311",
    "name": "Wedgewood Ult VyDk",
    "hex": "#1C5066",
    "r": 28,
    "g": 80,
    "b": 102
  },
  {
    "code": "312",
    "name": "Baby Blue Very Dark",
    "hex": "#35668B",
    "r": 53,
    "g": 102,
    "b": 139
  },
  {
    "code": "315",
    "name": "Antique Mauve Md Dk",
    "hex": "#814952",
    "r": 129,
    "g": 73,
    "b": 82
  },
  {
    "code": "316",
    "name": "Antique Mauve Med",
    "hex": "#B7737F",
    "r": 183,
    "g": 115,
    "b": 127
  },
  {
    "code": "317",
    "name": "Pewter Gray",
    "hex": "#6C6C6C",
    "r": 108,
    "g": 108,
    "b": 108
  },
  {
    "code": "318",
    "name": "Steel Gray Lt",
    "hex": "#ABABAB",
    "r": 171,
    "g": 171,
    "b": 171
  },
  {
    "code": "319",
    "name": "Pistachio Grn Vy Dk",
    "hex": "#205F2E",
    "r": 32,
    "g": 95,
    "b": 46
  },
  {
    "code": "320",
    "name": "Pistachio Green Med",
    "hex": "#69885A",
    "r": 105,
    "g": 136,
    "b": 90
  },
  {
    "code": "321",
    "name": "Red",
    "hex": "#C72B3B",
    "r": 199,
    "g": 43,
    "b": 59
  },
  {
    "code": "322",
    "name": "Baby Blue Dark",
    "hex": "#5A8FB8",
    "r": 90,
    "g": 143,
    "b": 184
  },
  {
    "code": "326",
    "name": "Rose Very Dark",
    "hex": "#B33B4B",
    "r": 179,
    "g": 59,
    "b": 75
  },
  {
    "code": "327",
    "name": "Violet Dark",
    "hex": "#633666",
    "r": 99,
    "g": 54,
    "b": 102
  },
  {
    "code": "333",
    "name": "Blue Violet Very Dark",
    "hex": "#5C5478",
    "r": 92,
    "g": 84,
    "b": 120
  },
  {
    "code": "334",
    "name": "Baby Blue Medium",
    "hex": "#739FC1",
    "r": 115,
    "g": 159,
    "b": 193
  },
  {
    "code": "335",
    "name": "Rose",
    "hex": "#EE546E",
    "r": 238,
    "g": 84,
    "b": 110
  },
  {
    "code": "336",
    "name": "Navy Blue",
    "hex": "#253B73",
    "r": 37,
    "g": 59,
    "b": 115
  },
  {
    "code": "340",
    "name": "Blue Violet Medium",
    "hex": "#ADA7C7",
    "r": 173,
    "g": 167,
    "b": 199
  },
  {
    "code": "341",
    "name": "Blue Violet Light",
    "hex": "#B7BFDD",
    "r": 183,
    "g": 191,
    "b": 221
  },
  {
    "code": "347",
    "name": "Salmon Very Dark",
    "hex": "#BF2D2D",
    "r": 191,
    "g": 45,
    "b": 45
  },
  {
    "code": "349",
    "name": "Coral Dark",
    "hex": "#D21035",
    "r": 210,
    "g": 16,
    "b": 53
  },
  {
    "code": "350",
    "name": "Coral Medium",
    "hex": "#E04848",
    "r": 224,
    "g": 72,
    "b": 72
  },
  {
    "code": "351",
    "name": "Coral",
    "hex": "#E96A67",
    "r": 233,
    "g": 106,
    "b": 103
  },
  {
    "code": "352",
    "name": "Coral Light",
    "hex": "#FD9C97",
    "r": 253,
    "g": 156,
    "b": 151
  },
  {
    "code": "353",
    "name": "Peach",
    "hex": "#FED7CC",
    "r": 254,
    "g": 215,
    "b": 204
  },
  {
    "code": "355",
    "name": "Terra Cotta Dark",
    "hex": "#984436",
    "r": 152,
    "g": 68,
    "b": 54
  },
  {
    "code": "356",
    "name": "Terra Cotta Med",
    "hex": "#C56A5B",
    "r": 197,
    "g": 106,
    "b": 91
  },
  {
    "code": "367",
    "name": "Pistachio Green Dk",
    "hex": "#617A52",
    "r": 97,
    "g": 122,
    "b": 82
  },
  {
    "code": "368",
    "name": "Pistachio Green Lt",
    "hex": "#A6C298",
    "r": 166,
    "g": 194,
    "b": 152
  },
  {
    "code": "369",
    "name": "Pistachio Green Vy Lt",
    "hex": "#D7EDCC",
    "r": 215,
    "g": 237,
    "b": 204
  },
  {
    "code": "370",
    "name": "Mustard Medium",
    "hex": "#B89D64",
    "r": 184,
    "g": 157,
    "b": 100
  },
  {
    "code": "371",
    "name": "Mustard",
    "hex": "#BFA671",
    "r": 191,
    "g": 166,
    "b": 113
  },
  {
    "code": "372",
    "name": "Mustard Lt",
    "hex": "#CCB784",
    "r": 204,
    "g": 183,
    "b": 132
  },
  {
    "code": "400",
    "name": "Mahogany Dark",
    "hex": "#8F430F",
    "r": 143,
    "g": 67,
    "b": 15
  },
  {
    "code": "402",
    "name": "Mahogany Vy Lt",
    "hex": "#F7A777",
    "r": 247,
    "g": 167,
    "b": 119
  },
  {
    "code": "407",
    "name": "Desert Sand Med",
    "hex": "#BB8161",
    "r": 187,
    "g": 129,
    "b": 97
  },
  {
    "code": "413",
    "name": "Pewter Gray Dark",
    "hex": "#565656",
    "r": 86,
    "g": 86,
    "b": 86
  },
  {
    "code": "414",
    "name": "Steel Gray Dk",
    "hex": "#8C8C8C",
    "r": 140,
    "g": 140,
    "b": 140
  },
  {
    "code": "415",
    "name": "Pearl Gray",
    "hex": "#D3D3D6",
    "r": 211,
    "g": 211,
    "b": 214
  },
  {
    "code": "420",
    "name": "Hazelnut Brown Dk",
    "hex": "#A07042",
    "r": 160,
    "g": 112,
    "b": 66
  },
  {
    "code": "422",
    "name": "Hazelnut Brown Lt",
    "hex": "#C69F7B",
    "r": 198,
    "g": 159,
    "b": 123
  },
  {
    "code": "433",
    "name": "Brown Med",
    "hex": "#7A451F",
    "r": 122,
    "g": 69,
    "b": 31
  },
  {
    "code": "434",
    "name": "Brown Light",
    "hex": "#985E33",
    "r": 152,
    "g": 94,
    "b": 51
  },
  {
    "code": "435",
    "name": "Brown Very Light",
    "hex": "#B87748",
    "r": 184,
    "g": 119,
    "b": 72
  },
  {
    "code": "436",
    "name": "Tan",
    "hex": "#CB9051",
    "r": 203,
    "g": 144,
    "b": 81
  },
  {
    "code": "437",
    "name": "Tan Light",
    "hex": "#E4BB8E",
    "r": 228,
    "g": 187,
    "b": 142
  },
  {
    "code": "444",
    "name": "Lemon Dark",
    "hex": "#FFD600",
    "r": 255,
    "g": 214,
    "b": 0
  },
  {
    "code": "445",
    "name": "Lemon Light",
    "hex": "#FFFB8B",
    "r": 255,
    "g": 251,
    "b": 139
  },
  {
    "code": "451",
    "name": "Shell Gray Dark",
    "hex": "#917B73",
    "r": 145,
    "g": 123,
    "b": 115
  },
  {
    "code": "452",
    "name": "Shell Gray Med",
    "hex": "#C0B3AE",
    "r": 192,
    "g": 179,
    "b": 174
  },
  {
    "code": "453",
    "name": "Shell Gray Light",
    "hex": "#D7CECB",
    "r": 215,
    "g": 206,
    "b": 203
  },
  {
    "code": "469",
    "name": "Avocado Green",
    "hex": "#72843C",
    "r": 114,
    "g": 132,
    "b": 60
  },
  {
    "code": "470",
    "name": "Avocado Grn Lt",
    "hex": "#94AB4F",
    "r": 148,
    "g": 171,
    "b": 79
  },
  {
    "code": "471",
    "name": "Avocado Grn V Lt",
    "hex": "#AEBF79",
    "r": 174,
    "g": 191,
    "b": 121
  },
  {
    "code": "472",
    "name": "Avocado Grn U Lt",
    "hex": "#D8E498",
    "r": 216,
    "g": 228,
    "b": 152
  },
  {
    "code": "498",
    "name": "Red Dark",
    "hex": "#A7132B",
    "r": 167,
    "g": 19,
    "b": 43
  },
  {
    "code": "500",
    "name": "Blue Green Vy Dk",
    "hex": "#044D33",
    "r": 4,
    "g": 77,
    "b": 51
  },
  {
    "code": "501",
    "name": "Blue Green Dark",
    "hex": "#396F52",
    "r": 57,
    "g": 111,
    "b": 82
  },
  {
    "code": "502",
    "name": "Blue Green",
    "hex": "#5B9071",
    "r": 91,
    "g": 144,
    "b": 113
  },
  {
    "code": "503",
    "name": "Blue Green Med",
    "hex": "#7BAC94",
    "r": 123,
    "g": 172,
    "b": 148
  },
  {
    "code": "504",
    "name": "Blue Green Vy Lt",
    "hex": "#C4DECC",
    "r": 196,
    "g": 222,
    "b": 204
  },
  {
    "code": "505",
    "name": "Jade Green",
    "hex": "#338362",
    "r": 51,
    "g": 131,
    "b": 98
  },
  {
    "code": "517",
    "name": "Wedgewood Dark",
    "hex": "#3B768F",
    "r": 59,
    "g": 118,
    "b": 143
  },
  {
    "code": "518",
    "name": "Wedgewood Light",
    "hex": "#4F93A7",
    "r": 79,
    "g": 147,
    "b": 167
  },
  {
    "code": "519",
    "name": "Sky Blue",
    "hex": "#7EB1C8",
    "r": 126,
    "g": 177,
    "b": 200
  },
  {
    "code": "520",
    "name": "Fern Green Dark",
    "hex": "#666D4F",
    "r": 102,
    "g": 109,
    "b": 79
  },
  {
    "code": "522",
    "name": "Fern Green",
    "hex": "#969E7E",
    "r": 150,
    "g": 158,
    "b": 126
  },
  {
    "code": "523",
    "name": "Fern Green Lt",
    "hex": "#ABB197",
    "r": 171,
    "g": 177,
    "b": 151
  },
  {
    "code": "524",
    "name": "Fern Green Vy Lt",
    "hex": "#C4CDAC",
    "r": 196,
    "g": 205,
    "b": 172
  },
  {
    "code": "535",
    "name": "Ash Gray Vy Lt",
    "hex": "#636458",
    "r": 99,
    "g": 100,
    "b": 88
  },
  {
    "code": "543",
    "name": "Beige Brown Ult Vy Lt",
    "hex": "#F2E3CE",
    "r": 242,
    "g": 227,
    "b": 206
  },
  {
    "code": "550",
    "name": "Violet Very Dark",
    "hex": "#5C184E",
    "r": 92,
    "g": 24,
    "b": 78
  },
  {
    "code": "552",
    "name": "Violet  Medium",
    "hex": "#803A6B",
    "r": 128,
    "g": 58,
    "b": 107
  },
  {
    "code": "553",
    "name": "Violet",
    "hex": "#A3638B",
    "r": 163,
    "g": 99,
    "b": 139
  },
  {
    "code": "554",
    "name": "Violet Light",
    "hex": "#DBB3CB",
    "r": 219,
    "g": 179,
    "b": 203
  },
  {
    "code": "561",
    "name": "Celadon Green VD",
    "hex": "#2C6A45",
    "r": 44,
    "g": 106,
    "b": 69
  },
  {
    "code": "562",
    "name": "Jade Medium",
    "hex": "#53976A",
    "r": 83,
    "g": 151,
    "b": 106
  },
  {
    "code": "563",
    "name": "Jade Light",
    "hex": "#8FC098",
    "r": 143,
    "g": 192,
    "b": 152
  },
  {
    "code": "564",
    "name": "Jade Very Light",
    "hex": "#A7CDAF",
    "r": 167,
    "g": 205,
    "b": 175
  },
  {
    "code": "580",
    "name": "Moss Green Dk",
    "hex": "#888D33",
    "r": 136,
    "g": 141,
    "b": 51
  },
  {
    "code": "581",
    "name": "Moss Green",
    "hex": "#A7AE38",
    "r": 167,
    "g": 174,
    "b": 56
  },
  {
    "code": "597",
    "name": "Turquoise",
    "hex": "#5BA3B3",
    "r": 91,
    "g": 163,
    "b": 179
  },
  {
    "code": "598",
    "name": "Turquoise Light",
    "hex": "#90C3CC",
    "r": 144,
    "g": 195,
    "b": 204
  },
  {
    "code": "600",
    "name": "Cranberry Very Dark",
    "hex": "#CD2F63",
    "r": 205,
    "g": 47,
    "b": 99
  },
  {
    "code": "601",
    "name": "Cranberry Dark",
    "hex": "#D1286A",
    "r": 209,
    "g": 40,
    "b": 106
  },
  {
    "code": "602",
    "name": "Cranberry Medium",
    "hex": "#E24874",
    "r": 226,
    "g": 72,
    "b": 116
  },
  {
    "code": "603",
    "name": "Cranberry",
    "hex": "#FFA4BE",
    "r": 255,
    "g": 164,
    "b": 190
  },
  {
    "code": "604",
    "name": "Cranberry Light",
    "hex": "#FFB0BE",
    "r": 255,
    "g": 176,
    "b": 190
  },
  {
    "code": "605",
    "name": "Cranberry Very Light",
    "hex": "#FFC0CD",
    "r": 255,
    "g": 192,
    "b": 205
  },
  {
    "code": "606",
    "name": "Orange?Red Bright",
    "hex": "#FA3203",
    "r": 250,
    "g": 50,
    "b": 3
  },
  {
    "code": "608",
    "name": "Burnt Orange Bright",
    "hex": "#FD5D35",
    "r": 253,
    "g": 93,
    "b": 53
  },
  {
    "code": "610",
    "name": "Drab Brown Dk",
    "hex": "#796047",
    "r": 121,
    "g": 96,
    "b": 71
  },
  {
    "code": "611",
    "name": "Drab Brown",
    "hex": "#967656",
    "r": 150,
    "g": 118,
    "b": 86
  },
  {
    "code": "612",
    "name": "Drab Brown Lt",
    "hex": "#BC9A78",
    "r": 188,
    "g": 154,
    "b": 120
  },
  {
    "code": "613",
    "name": "Drab Brown V Lt",
    "hex": "#DCC4AA",
    "r": 220,
    "g": 196,
    "b": 170
  },
  {
    "code": "632",
    "name": "Desert Sand Ult Vy Dk",
    "hex": "#875539",
    "r": 135,
    "g": 85,
    "b": 57
  },
  {
    "code": "640",
    "name": "Beige Gray Vy Dk",
    "hex": "#857B61",
    "r": 133,
    "g": 123,
    "b": 97
  },
  {
    "code": "642",
    "name": "Beige Gray Dark",
    "hex": "#A49878",
    "r": 164,
    "g": 152,
    "b": 120
  },
  {
    "code": "644",
    "name": "Beige Gray Med",
    "hex": "#DDD8CB",
    "r": 221,
    "g": 216,
    "b": 203
  },
  {
    "code": "645",
    "name": "Beaver Gray Vy Dk",
    "hex": "#6E655C",
    "r": 110,
    "g": 101,
    "b": 92
  },
  {
    "code": "646",
    "name": "Beaver Gray Dk",
    "hex": "#877D73",
    "r": 135,
    "g": 125,
    "b": 115
  },
  {
    "code": "647",
    "name": "Beaver Gray Med",
    "hex": "#B0A69C",
    "r": 176,
    "g": 166,
    "b": 156
  },
  {
    "code": "648",
    "name": "Beaver Gray Lt",
    "hex": "#BCB4AC",
    "r": 188,
    "g": 180,
    "b": 172
  },
  {
    "code": "666",
    "name": "Bright Red",
    "hex": "#E31D42",
    "r": 227,
    "g": 29,
    "b": 66
  },
  {
    "code": "676",
    "name": "Old Gold Lt",
    "hex": "#E5CE97",
    "r": 229,
    "g": 206,
    "b": 151
  },
  {
    "code": "677",
    "name": "Old Gold Vy Lt",
    "hex": "#F5ECCB",
    "r": 245,
    "g": 236,
    "b": 203
  },
  {
    "code": "680",
    "name": "Old Gold Dark",
    "hex": "#BC8D0E",
    "r": 188,
    "g": 141,
    "b": 14
  },
  {
    "code": "699",
    "name": "Green",
    "hex": "#056517",
    "r": 5,
    "g": 101,
    "b": 23
  },
  {
    "code": "700",
    "name": "Green Bright",
    "hex": "#07731B",
    "r": 7,
    "g": 115,
    "b": 27
  },
  {
    "code": "701",
    "name": "Green Light",
    "hex": "#3F8F29",
    "r": 63,
    "g": 143,
    "b": 41
  },
  {
    "code": "702",
    "name": "Kelly Green",
    "hex": "#47A72F",
    "r": 71,
    "g": 167,
    "b": 47
  },
  {
    "code": "703",
    "name": "Chartreuse",
    "hex": "#7BB547",
    "r": 123,
    "g": 181,
    "b": 71
  },
  {
    "code": "704",
    "name": "Chartreuse Bright",
    "hex": "#9ECF34",
    "r": 158,
    "g": 207,
    "b": 52
  },
  {
    "code": "712",
    "name": "Cream",
    "hex": "#FFFBEF",
    "r": 255,
    "g": 251,
    "b": 239
  },
  {
    "code": "718",
    "name": "Plum",
    "hex": "#9C2462",
    "r": 156,
    "g": 36,
    "b": 98
  },
  {
    "code": "720",
    "name": "Orange Spice Dark",
    "hex": "#E55C1F",
    "r": 229,
    "g": 92,
    "b": 31
  },
  {
    "code": "721",
    "name": "Orange Spice Med",
    "hex": "#F27842",
    "r": 242,
    "g": 120,
    "b": 66
  },
  {
    "code": "722",
    "name": "Orange Spice Light",
    "hex": "#F7976F",
    "r": 247,
    "g": 151,
    "b": 111
  },
  {
    "code": "725",
    "name": "Topaz Med Lt",
    "hex": "#FFC840",
    "r": 255,
    "g": 200,
    "b": 64
  },
  {
    "code": "726",
    "name": "Topaz Light",
    "hex": "#FDD755",
    "r": 253,
    "g": 215,
    "b": 85
  },
  {
    "code": "727",
    "name": "Topaz Vy Lt",
    "hex": "#FFF1AF",
    "r": 255,
    "g": 241,
    "b": 175
  },
  {
    "code": "728",
    "name": "Topaz",
    "hex": "#E4B468",
    "r": 228,
    "g": 180,
    "b": 104
  },
  {
    "code": "729",
    "name": "Old Gold Medium",
    "hex": "#D0A53E",
    "r": 208,
    "g": 165,
    "b": 62
  },
  {
    "code": "730",
    "name": "Olive Green V Dk",
    "hex": "#827B30",
    "r": 130,
    "g": 123,
    "b": 48
  },
  {
    "code": "731",
    "name": "Olive Green Dk",
    "hex": "#938B37",
    "r": 147,
    "g": 139,
    "b": 55
  },
  {
    "code": "732",
    "name": "Olive Green",
    "hex": "#948C36",
    "r": 148,
    "g": 140,
    "b": 54
  },
  {
    "code": "733",
    "name": "Olive Green Md",
    "hex": "#BCB34C",
    "r": 188,
    "g": 179,
    "b": 76
  },
  {
    "code": "734",
    "name": "Olive Green Lt",
    "hex": "#C7C077",
    "r": 199,
    "g": 192,
    "b": 119
  },
  {
    "code": "738",
    "name": "Tan Very Light",
    "hex": "#ECCC9E",
    "r": 236,
    "g": 204,
    "b": 158
  },
  {
    "code": "739",
    "name": "Tan Ult Vy Lt",
    "hex": "#F8E4C8",
    "r": 248,
    "g": 228,
    "b": 200
  },
  {
    "code": "740",
    "name": "Tangerine",
    "hex": "#FF8B00",
    "r": 255,
    "g": 139,
    "b": 0
  },
  {
    "code": "741",
    "name": "Tangerine Med",
    "hex": "#FFA32B",
    "r": 255,
    "g": 163,
    "b": 43
  },
  {
    "code": "742",
    "name": "Tangerine Light",
    "hex": "#FFBF57",
    "r": 255,
    "g": 191,
    "b": 87
  },
  {
    "code": "743",
    "name": "Yellow Med",
    "hex": "#FED376",
    "r": 254,
    "g": 211,
    "b": 118
  },
  {
    "code": "744",
    "name": "Yellow Pale",
    "hex": "#FFE793",
    "r": 255,
    "g": 231,
    "b": 147
  },
  {
    "code": "745",
    "name": "Yellow Pale Light",
    "hex": "#FFE9AD",
    "r": 255,
    "g": 233,
    "b": 173
  },
  {
    "code": "746",
    "name": "Off White",
    "hex": "#FCFCEE",
    "r": 252,
    "g": 252,
    "b": 238
  },
  {
    "code": "747",
    "name": "Peacock Blue Vy Lt",
    "hex": "#E5FCFD",
    "r": 229,
    "g": 252,
    "b": 253
  },
  {
    "code": "754",
    "name": "Peach Light",
    "hex": "#F7CBBF",
    "r": 247,
    "g": 203,
    "b": 191
  },
  {
    "code": "758",
    "name": "Terra Cotta Vy Lt",
    "hex": "#EEAA9B",
    "r": 238,
    "g": 170,
    "b": 155
  },
  {
    "code": "760",
    "name": "Salmon",
    "hex": "#F5ADAD",
    "r": 245,
    "g": 173,
    "b": 173
  },
  {
    "code": "761",
    "name": "Salmon Light",
    "hex": "#FFC9C9",
    "r": 255,
    "g": 201,
    "b": 201
  },
  {
    "code": "762",
    "name": "Pearl Gray Vy Lt",
    "hex": "#ECECEC",
    "r": 236,
    "g": 236,
    "b": 236
  },
  {
    "code": "772",
    "name": "Yellow Green Vy Lt",
    "hex": "#E4ECD4",
    "r": 228,
    "g": 236,
    "b": 212
  },
  {
    "code": "775",
    "name": "Baby Blue Very Light",
    "hex": "#D9EBF1",
    "r": 217,
    "g": 235,
    "b": 241
  },
  {
    "code": "776",
    "name": "Pink Medium",
    "hex": "#FCB0B9",
    "r": 252,
    "g": 176,
    "b": 185
  },
  {
    "code": "777",
    "name": "Raspberry Very Dark",
    "hex": "#913546",
    "r": 145,
    "g": 53,
    "b": 70
  },
  {
    "code": "778",
    "name": "Antique Mauve Vy Lt",
    "hex": "#DFB3BB",
    "r": 223,
    "g": 179,
    "b": 187
  },
  {
    "code": "779",
    "name": "Cocoa Dark",
    "hex": "#624B45",
    "r": 98,
    "g": 75,
    "b": 69
  },
  {
    "code": "780",
    "name": "Topaz Ultra Vy Dk",
    "hex": "#94631A",
    "r": 148,
    "g": 99,
    "b": 26
  },
  {
    "code": "781",
    "name": "Topaz Very Dark",
    "hex": "#A26D20",
    "r": 162,
    "g": 109,
    "b": 32
  },
  {
    "code": "782",
    "name": "Topaz Dark",
    "hex": "#AE7720",
    "r": 174,
    "g": 119,
    "b": 32
  },
  {
    "code": "783",
    "name": "Topaz Medium",
    "hex": "#CE9124",
    "r": 206,
    "g": 145,
    "b": 36
  },
  {
    "code": "791",
    "name": "Cornflower Blue V D",
    "hex": "#464563",
    "r": 70,
    "g": 69,
    "b": 99
  },
  {
    "code": "792",
    "name": "Cornflower Blue Dark",
    "hex": "#555B7B",
    "r": 85,
    "g": 91,
    "b": 123
  },
  {
    "code": "793",
    "name": "Cornflower Blue Med",
    "hex": "#707DA2",
    "r": 112,
    "g": 125,
    "b": 162
  },
  {
    "code": "794",
    "name": "Cornflower Blue Light",
    "hex": "#8F9CC1",
    "r": 143,
    "g": 156,
    "b": 193
  },
  {
    "code": "796",
    "name": "Royal Blue Dark",
    "hex": "#11416D",
    "r": 17,
    "g": 65,
    "b": 109
  },
  {
    "code": "797",
    "name": "Royal Blue",
    "hex": "#13477D",
    "r": 19,
    "g": 71,
    "b": 125
  },
  {
    "code": "798",
    "name": "Delft Blue Dark",
    "hex": "#466A8E",
    "r": 70,
    "g": 106,
    "b": 142
  },
  {
    "code": "799",
    "name": "Delft Blue Medium",
    "hex": "#748EB6",
    "r": 116,
    "g": 142,
    "b": 182
  },
  {
    "code": "800",
    "name": "Delft Blue Pale",
    "hex": "#C0CCDE",
    "r": 192,
    "g": 204,
    "b": 222
  },
  {
    "code": "801",
    "name": "Coffee Brown Dk",
    "hex": "#653919",
    "r": 101,
    "g": 57,
    "b": 25
  },
  {
    "code": "803",
    "name": "Baby Blue Ult Vy Dk",
    "hex": "#2C597C",
    "r": 44,
    "g": 89,
    "b": 124
  },
  {
    "code": "806",
    "name": "Peacock Blue Dark",
    "hex": "#3D95A5",
    "r": 61,
    "g": 149,
    "b": 165
  },
  {
    "code": "807",
    "name": "Peacock Blue",
    "hex": "#64ABBA",
    "r": 100,
    "g": 171,
    "b": 186
  },
  {
    "code": "809",
    "name": "Delft Blue",
    "hex": "#94A8C6",
    "r": 148,
    "g": 168,
    "b": 198
  },
  {
    "code": "813",
    "name": "Blue Light",
    "hex": "#A1C2D7",
    "r": 161,
    "g": 194,
    "b": 215
  },
  {
    "code": "814",
    "name": "Garnet Dark",
    "hex": "#7B001B",
    "r": 123,
    "g": 0,
    "b": 27
  },
  {
    "code": "815",
    "name": "Garnet Medium",
    "hex": "#87071F",
    "r": 135,
    "g": 7,
    "b": 31
  },
  {
    "code": "816",
    "name": "Garnet",
    "hex": "#970B23",
    "r": 151,
    "g": 11,
    "b": 35
  },
  {
    "code": "817",
    "name": "Coral Red Very Dark",
    "hex": "#BB051F",
    "r": 187,
    "g": 5,
    "b": 31
  },
  {
    "code": "818",
    "name": "Baby Pink",
    "hex": "#FFDFD9",
    "r": 255,
    "g": 223,
    "b": 217
  },
  {
    "code": "819",
    "name": "Baby Pink Light",
    "hex": "#FFEEEB",
    "r": 255,
    "g": 238,
    "b": 235
  },
  {
    "code": "820",
    "name": "Royal Blue Very Dark",
    "hex": "#0E365C",
    "r": 14,
    "g": 54,
    "b": 92
  },
  {
    "code": "822",
    "name": "Beige Gray Light",
    "hex": "#E7E2D3",
    "r": 231,
    "g": 226,
    "b": 211
  },
  {
    "code": "823",
    "name": "Navy Blue Dark",
    "hex": "#213063",
    "r": 33,
    "g": 48,
    "b": 99
  },
  {
    "code": "824",
    "name": "Blue Very Dark",
    "hex": "#396987",
    "r": 57,
    "g": 105,
    "b": 135
  },
  {
    "code": "825",
    "name": "Blue Dark",
    "hex": "#4781A5",
    "r": 71,
    "g": 129,
    "b": 165
  },
  {
    "code": "826",
    "name": "Blue Medium",
    "hex": "#6B9EBF",
    "r": 107,
    "g": 158,
    "b": 191
  },
  {
    "code": "827",
    "name": "Blue Very Light",
    "hex": "#BDDDED",
    "r": 189,
    "g": 221,
    "b": 237
  },
  {
    "code": "828",
    "name": "Sky Blue Vy Lt",
    "hex": "#C5E8ED",
    "r": 197,
    "g": 232,
    "b": 237
  },
  {
    "code": "829",
    "name": "Golden Olive Vy Dk",
    "hex": "#7E6B42",
    "r": 126,
    "g": 107,
    "b": 66
  },
  {
    "code": "830",
    "name": "Golden Olive Dk",
    "hex": "#8D784B",
    "r": 141,
    "g": 120,
    "b": 75
  },
  {
    "code": "831",
    "name": "Golden Olive Md",
    "hex": "#AA8F56",
    "r": 170,
    "g": 143,
    "b": 86
  },
  {
    "code": "832",
    "name": "Golden Olive",
    "hex": "#BD9B51",
    "r": 189,
    "g": 155,
    "b": 81
  },
  {
    "code": "833",
    "name": "Golden Olive Lt",
    "hex": "#C8AB6C",
    "r": 200,
    "g": 171,
    "b": 108
  },
  {
    "code": "834",
    "name": "Golden Olive Vy Lt",
    "hex": "#DBBE7F",
    "r": 219,
    "g": 190,
    "b": 127
  },
  {
    "code": "838",
    "name": "Beige Brown Vy Dk",
    "hex": "#594937",
    "r": 89,
    "g": 73,
    "b": 55
  },
  {
    "code": "839",
    "name": "Beige Brown Dk",
    "hex": "#675541",
    "r": 103,
    "g": 85,
    "b": 65
  },
  {
    "code": "840",
    "name": "Beige Brown Med",
    "hex": "#9A7C5C",
    "r": 154,
    "g": 124,
    "b": 92
  },
  {
    "code": "841",
    "name": "Beige Brown Lt",
    "hex": "#B69B7E",
    "r": 182,
    "g": 155,
    "b": 126
  },
  {
    "code": "842",
    "name": "Beige Brown Vy Lt",
    "hex": "#D1BAA1",
    "r": 209,
    "g": 186,
    "b": 161
  },
  {
    "code": "844",
    "name": "Beaver Gray Ult Dk",
    "hex": "#484848",
    "r": 72,
    "g": 72,
    "b": 72
  },
  {
    "code": "869",
    "name": "Hazelnut Brown V Dk",
    "hex": "#835E39",
    "r": 131,
    "g": 94,
    "b": 57
  },
  {
    "code": "890",
    "name": "Pistachio Grn Ult V D",
    "hex": "#174923",
    "r": 23,
    "g": 73,
    "b": 35
  },
  {
    "code": "891",
    "name": "Carnation Dark",
    "hex": "#FF5773",
    "r": 255,
    "g": 87,
    "b": 115
  },
  {
    "code": "892",
    "name": "Carnation Medium",
    "hex": "#FF798C",
    "r": 255,
    "g": 121,
    "b": 140
  },
  {
    "code": "893",
    "name": "Carnation Light",
    "hex": "#FC90A2",
    "r": 252,
    "g": 144,
    "b": 162
  },
  {
    "code": "894",
    "name": "Carnation Very Light",
    "hex": "#FFB2BB",
    "r": 255,
    "g": 178,
    "b": 187
  },
  {
    "code": "895",
    "name": "Hunter Green Vy Dk",
    "hex": "#1B5300",
    "r": 27,
    "g": 83,
    "b": 0
  },
  {
    "code": "898",
    "name": "Coffee Brown Vy Dk",
    "hex": "#492A13",
    "r": 73,
    "g": 42,
    "b": 19
  },
  {
    "code": "899",
    "name": "Rose Medium",
    "hex": "#F27688",
    "r": 242,
    "g": 118,
    "b": 136
  },
  {
    "code": "900",
    "name": "Burnt Orange Dark",
    "hex": "#D15807",
    "r": 209,
    "g": 88,
    "b": 7
  },
  {
    "code": "902",
    "name": "Garnet Very Dark",
    "hex": "#822637",
    "r": 130,
    "g": 38,
    "b": 55
  },
  {
    "code": "904",
    "name": "Parrot Green V Dk",
    "hex": "#557822",
    "r": 85,
    "g": 120,
    "b": 34
  },
  {
    "code": "905",
    "name": "Parrot Green Dk",
    "hex": "#628A28",
    "r": 98,
    "g": 138,
    "b": 40
  },
  {
    "code": "906",
    "name": "Parrot Green Md",
    "hex": "#7FB335",
    "r": 127,
    "g": 179,
    "b": 53
  },
  {
    "code": "907",
    "name": "Parrot Green Lt",
    "hex": "#C7E666",
    "r": 199,
    "g": 230,
    "b": 102
  },
  {
    "code": "909",
    "name": "Emerald Green Vy Dk",
    "hex": "#156F49",
    "r": 21,
    "g": 111,
    "b": 73
  },
  {
    "code": "910",
    "name": "Emerald Green Dark",
    "hex": "#187E56",
    "r": 24,
    "g": 126,
    "b": 86
  },
  {
    "code": "911",
    "name": "Emerald Green Med",
    "hex": "#189065",
    "r": 24,
    "g": 144,
    "b": 101
  },
  {
    "code": "912",
    "name": "Emerald Green Lt",
    "hex": "#1B9D6B",
    "r": 27,
    "g": 157,
    "b": 107
  },
  {
    "code": "913",
    "name": "Nile Green Med",
    "hex": "#6DAB77",
    "r": 109,
    "g": 171,
    "b": 119
  },
  {
    "code": "915",
    "name": "Plum Dark",
    "hex": "#820043",
    "r": 130,
    "g": 0,
    "b": 67
  },
  {
    "code": "917",
    "name": "Plum Medium",
    "hex": "#9B1359",
    "r": 155,
    "g": 19,
    "b": 89
  },
  {
    "code": "918",
    "name": "Red?Copper Dark",
    "hex": "#82340A",
    "r": 130,
    "g": 52,
    "b": 10
  },
  {
    "code": "919",
    "name": "Red?Copper",
    "hex": "#A64510",
    "r": 166,
    "g": 69,
    "b": 16
  },
  {
    "code": "920",
    "name": "Copper Med",
    "hex": "#AC5414",
    "r": 172,
    "g": 84,
    "b": 20
  },
  {
    "code": "921",
    "name": "Copper",
    "hex": "#C66218",
    "r": 198,
    "g": 98,
    "b": 24
  },
  {
    "code": "922",
    "name": "Copper Light",
    "hex": "#E27323",
    "r": 226,
    "g": 115,
    "b": 35
  },
  {
    "code": "924",
    "name": "Gray Green Vy Dark",
    "hex": "#566A6A",
    "r": 86,
    "g": 106,
    "b": 106
  },
  {
    "code": "926",
    "name": "Gray Green Med",
    "hex": "#98AEAE",
    "r": 152,
    "g": 174,
    "b": 174
  },
  {
    "code": "927",
    "name": "Gray Green Light",
    "hex": "#BDCBCB",
    "r": 189,
    "g": 203,
    "b": 203
  },
  {
    "code": "928",
    "name": "Gray Green Vy Lt",
    "hex": "#DDE3E3",
    "r": 221,
    "g": 227,
    "b": 227
  },
  {
    "code": "930",
    "name": "Antique Blue Dark",
    "hex": "#455C71",
    "r": 69,
    "g": 92,
    "b": 113
  },
  {
    "code": "931",
    "name": "Antique Blue Medium",
    "hex": "#6A859E",
    "r": 106,
    "g": 133,
    "b": 158
  },
  {
    "code": "932",
    "name": "Antique Blue Light",
    "hex": "#A2B5C6",
    "r": 162,
    "g": 181,
    "b": 198
  },
  {
    "code": "934",
    "name": "Avocado Grn Black",
    "hex": "#313919",
    "r": 49,
    "g": 57,
    "b": 25
  },
  {
    "code": "935",
    "name": "Avocado Green Dk",
    "hex": "#424D21",
    "r": 66,
    "g": 77,
    "b": 33
  },
  {
    "code": "936",
    "name": "Avocado Grn V Dk",
    "hex": "#4C5826",
    "r": 76,
    "g": 88,
    "b": 38
  },
  {
    "code": "937",
    "name": "Avocado Green Md",
    "hex": "#627133",
    "r": 98,
    "g": 113,
    "b": 51
  },
  {
    "code": "938",
    "name": "Coffee Brown Ult Dk",
    "hex": "#361F0E",
    "r": 54,
    "g": 31,
    "b": 14
  },
  {
    "code": "939",
    "name": "Navy Blue Very Dark",
    "hex": "#1B2853",
    "r": 27,
    "g": 40,
    "b": 83
  },
  {
    "code": "943",
    "name": "Green Bright Md",
    "hex": "#3D9384",
    "r": 61,
    "g": 147,
    "b": 132
  },
  {
    "code": "945",
    "name": "Tawny",
    "hex": "#FBD5BB",
    "r": 251,
    "g": 213,
    "b": 187
  },
  {
    "code": "946",
    "name": "Burnt Orange Med",
    "hex": "#EB6307",
    "r": 235,
    "g": 99,
    "b": 7
  },
  {
    "code": "947",
    "name": "Burnt Orange",
    "hex": "#FF7B4D",
    "r": 255,
    "g": 123,
    "b": 77
  },
  {
    "code": "948",
    "name": "Peach Very Light",
    "hex": "#FEE7DA",
    "r": 254,
    "g": 231,
    "b": 218
  },
  {
    "code": "950",
    "name": "Desert Sand Light",
    "hex": "#EED3C4",
    "r": 238,
    "g": 211,
    "b": 196
  },
  {
    "code": "951",
    "name": "Tawny Light",
    "hex": "#FFE2CF",
    "r": 255,
    "g": 226,
    "b": 207
  },
  {
    "code": "954",
    "name": "Nile Green",
    "hex": "#88BA91",
    "r": 136,
    "g": 186,
    "b": 145
  },
  {
    "code": "955",
    "name": "Nile Green Light",
    "hex": "#A2D6AD",
    "r": 162,
    "g": 214,
    "b": 173
  },
  {
    "code": "956",
    "name": "Geranium",
    "hex": "#FF9191",
    "r": 255,
    "g": 145,
    "b": 145
  },
  {
    "code": "957",
    "name": "Geranium Pale",
    "hex": "#FDB5B5",
    "r": 253,
    "g": 181,
    "b": 181
  },
  {
    "code": "958",
    "name": "Sea Green Dark",
    "hex": "#3EB6A1",
    "r": 62,
    "g": 182,
    "b": 161
  },
  {
    "code": "959",
    "name": "Sea Green Med",
    "hex": "#59C7B4",
    "r": 89,
    "g": 199,
    "b": 180
  },
  {
    "code": "961",
    "name": "Dusty Rose Dark",
    "hex": "#CF7373",
    "r": 207,
    "g": 115,
    "b": 115
  },
  {
    "code": "962",
    "name": "Dusty Rose Medium",
    "hex": "#E68A8A",
    "r": 230,
    "g": 138,
    "b": 138
  },
  {
    "code": "963",
    "name": "Dusty Rose Ult Vy Lt",
    "hex": "#FFD7D7",
    "r": 255,
    "g": 215,
    "b": 215
  },
  {
    "code": "964",
    "name": "Sea Green Light",
    "hex": "#A9E2D8",
    "r": 169,
    "g": 226,
    "b": 216
  },
  {
    "code": "966",
    "name": "Jade Ultra Vy Lt",
    "hex": "#B9D7C0",
    "r": 185,
    "g": 215,
    "b": 192
  },
  {
    "code": "967",
    "name": "Apricot Very Light",
    "hex": "#FFDED5",
    "r": 255,
    "g": 222,
    "b": 213
  },
  {
    "code": "970",
    "name": "Pumpkin Light",
    "hex": "#F78B13",
    "r": 247,
    "g": 139,
    "b": 19
  },
  {
    "code": "971",
    "name": "Pumpkin",
    "hex": "#F67F00",
    "r": 246,
    "g": 127,
    "b": 0
  },
  {
    "code": "972",
    "name": "Canary Deep",
    "hex": "#FFB515",
    "r": 255,
    "g": 181,
    "b": 21
  },
  {
    "code": "973",
    "name": "Canary Bright",
    "hex": "#FFE300",
    "r": 255,
    "g": 227,
    "b": 0
  },
  {
    "code": "975",
    "name": "Golden Brown Dk",
    "hex": "#914F12",
    "r": 145,
    "g": 79,
    "b": 18
  },
  {
    "code": "976",
    "name": "Golden Brown Med",
    "hex": "#C28142",
    "r": 194,
    "g": 129,
    "b": 66
  },
  {
    "code": "977",
    "name": "Golden Brown Light",
    "hex": "#DC9C56",
    "r": 220,
    "g": 156,
    "b": 86
  },
  {
    "code": "986",
    "name": "Forest Green Vy Dk",
    "hex": "#405230",
    "r": 64,
    "g": 82,
    "b": 48
  },
  {
    "code": "987",
    "name": "Forest Green Dk",
    "hex": "#587141",
    "r": 88,
    "g": 113,
    "b": 65
  },
  {
    "code": "988",
    "name": "Forest Green Med",
    "hex": "#738B5B",
    "r": 115,
    "g": 139,
    "b": 91
  },
  {
    "code": "989",
    "name": "Forest Green",
    "hex": "#8DA675",
    "r": 141,
    "g": 166,
    "b": 117
  },
  {
    "code": "991",
    "name": "Aquamarine Dk",
    "hex": "#477B6E",
    "r": 71,
    "g": 123,
    "b": 110
  },
  {
    "code": "992",
    "name": "Aquamarine Lt",
    "hex": "#6FAE9F",
    "r": 111,
    "g": 174,
    "b": 159
  },
  {
    "code": "993",
    "name": "Aquamarine Vy Lt",
    "hex": "#90C0B4",
    "r": 144,
    "g": 192,
    "b": 180
  },
  {
    "code": "995",
    "name": "Electric Blue Dark",
    "hex": "#2696B6",
    "r": 38,
    "g": 150,
    "b": 182
  },
  {
    "code": "996",
    "name": "Electric Blue Medium",
    "hex": "#30C2EC",
    "r": 48,
    "g": 194,
    "b": 236
  },
  {
    "code": "3011",
    "name": "Khaki Green Dk",
    "hex": "#898A58",
    "r": 137,
    "g": 138,
    "b": 88
  },
  {
    "code": "3012",
    "name": "Khaki Green Md",
    "hex": "#A6A75D",
    "r": 166,
    "g": 167,
    "b": 93
  },
  {
    "code": "3013",
    "name": "Khaki Green Lt",
    "hex": "#B9B982",
    "r": 185,
    "g": 185,
    "b": 130
  },
  {
    "code": "3021",
    "name": "Brown Gray Vy Dk",
    "hex": "#4F4B41",
    "r": 79,
    "g": 75,
    "b": 65
  },
  {
    "code": "3022",
    "name": "Brown Gray Med",
    "hex": "#8E9078",
    "r": 142,
    "g": 144,
    "b": 120
  },
  {
    "code": "3023",
    "name": "Brown Gray Light",
    "hex": "#B1AA97",
    "r": 177,
    "g": 170,
    "b": 151
  },
  {
    "code": "3024",
    "name": "Brown Gray Vy Lt",
    "hex": "#EBEAE7",
    "r": 235,
    "g": 234,
    "b": 231
  },
  {
    "code": "3031",
    "name": "Mocha Brown Vy Dk",
    "hex": "#4B3C2A",
    "r": 75,
    "g": 60,
    "b": 42
  },
  {
    "code": "3032",
    "name": "Mocha Brown Med",
    "hex": "#B39F8B",
    "r": 179,
    "g": 159,
    "b": 139
  },
  {
    "code": "3033",
    "name": "Mocha Brown Vy Lt",
    "hex": "#E3D8CC",
    "r": 227,
    "g": 216,
    "b": 204
  },
  {
    "code": "3041",
    "name": "Antique Violet Medium",
    "hex": "#956F7C",
    "r": 149,
    "g": 111,
    "b": 124
  },
  {
    "code": "3042",
    "name": "Antique Violet Light",
    "hex": "#B79DA7",
    "r": 183,
    "g": 157,
    "b": 167
  },
  {
    "code": "3045",
    "name": "Yellow Beige Dk",
    "hex": "#BC966A",
    "r": 188,
    "g": 150,
    "b": 106
  },
  {
    "code": "3046",
    "name": "Yellow Beige Md",
    "hex": "#D8BC9A",
    "r": 216,
    "g": 188,
    "b": 154
  },
  {
    "code": "3047",
    "name": "Yellow Beige Lt",
    "hex": "#E7D6C1",
    "r": 231,
    "g": 214,
    "b": 193
  },
  {
    "code": "3051",
    "name": "Green Gray Dk",
    "hex": "#5F6648",
    "r": 95,
    "g": 102,
    "b": 72
  },
  {
    "code": "3052",
    "name": "Green Gray Md",
    "hex": "#889268",
    "r": 136,
    "g": 146,
    "b": 104
  },
  {
    "code": "3053",
    "name": "Green Gray",
    "hex": "#9CA482",
    "r": 156,
    "g": 164,
    "b": 130
  },
  {
    "code": "3064",
    "name": "Desert Sand",
    "hex": "#C48E70",
    "r": 196,
    "g": 142,
    "b": 112
  },
  {
    "code": "3072",
    "name": "Beaver Gray Vy Lt",
    "hex": "#E6E8E8",
    "r": 230,
    "g": 232,
    "b": 232
  },
  {
    "code": "3078",
    "name": "Golden Yellow Vy Lt",
    "hex": "#FDF9CD",
    "r": 253,
    "g": 249,
    "b": 205
  },
  {
    "code": "3325",
    "name": "Baby Blue Light",
    "hex": "#B8D2E6",
    "r": 184,
    "g": 210,
    "b": 230
  },
  {
    "code": "3326",
    "name": "Rose Light",
    "hex": "#FBADB4",
    "r": 251,
    "g": 173,
    "b": 180
  },
  {
    "code": "3328",
    "name": "Salmon Dark",
    "hex": "#E36D6D",
    "r": 227,
    "g": 109,
    "b": 109
  },
  {
    "code": "3340",
    "name": "Apricot Med",
    "hex": "#FF836F",
    "r": 255,
    "g": 131,
    "b": 111
  },
  {
    "code": "3341",
    "name": "Apricot",
    "hex": "#FCAB98",
    "r": 252,
    "g": 171,
    "b": 152
  },
  {
    "code": "3345",
    "name": "Hunter Green Dk",
    "hex": "#1B5915",
    "r": 27,
    "g": 89,
    "b": 21
  },
  {
    "code": "3346",
    "name": "Hunter Green",
    "hex": "#406A3A",
    "r": 64,
    "g": 106,
    "b": 58
  },
  {
    "code": "3347",
    "name": "Yellow Green Med",
    "hex": "#71935C",
    "r": 113,
    "g": 147,
    "b": 92
  },
  {
    "code": "3348",
    "name": "Yellow Green Lt",
    "hex": "#CCD9B1",
    "r": 204,
    "g": 217,
    "b": 177
  },
  {
    "code": "3350",
    "name": "Dusty Rose Ultra Dark",
    "hex": "#BC4365",
    "r": 188,
    "g": 67,
    "b": 101
  },
  {
    "code": "3354",
    "name": "Dusty Rose Light",
    "hex": "#E4A6AC",
    "r": 228,
    "g": 166,
    "b": 172
  },
  {
    "code": "3362",
    "name": "Pine Green Dk",
    "hex": "#5E6B47",
    "r": 94,
    "g": 107,
    "b": 71
  },
  {
    "code": "3363",
    "name": "Pine Green Md",
    "hex": "#728256",
    "r": 114,
    "g": 130,
    "b": 86
  },
  {
    "code": "3364",
    "name": "Pine Green",
    "hex": "#83975F",
    "r": 131,
    "g": 151,
    "b": 95
  },
  {
    "code": "3371",
    "name": "Black Brown",
    "hex": "#1E1108",
    "r": 30,
    "g": 17,
    "b": 8
  },
  {
    "code": "3607",
    "name": "Plum Light",
    "hex": "#C54989",
    "r": 197,
    "g": 73,
    "b": 137
  },
  {
    "code": "3608",
    "name": "Plum Very Light",
    "hex": "#EA9CC4",
    "r": 234,
    "g": 156,
    "b": 196
  },
  {
    "code": "3609",
    "name": "Plum Ultra Light",
    "hex": "#F4AED5",
    "r": 244,
    "g": 174,
    "b": 213
  },
  {
    "code": "3685",
    "name": "Mauve Very Dark",
    "hex": "#881531",
    "r": 136,
    "g": 21,
    "b": 49
  },
  {
    "code": "3687",
    "name": "Mauve",
    "hex": "#C96B70",
    "r": 201,
    "g": 107,
    "b": 112
  },
  {
    "code": "3688",
    "name": "Mauve Medium",
    "hex": "#E7A9AC",
    "r": 231,
    "g": 169,
    "b": 172
  },
  {
    "code": "3689",
    "name": "Mauve Light",
    "hex": "#FBBFC2",
    "r": 251,
    "g": 191,
    "b": 194
  },
  {
    "code": "3705",
    "name": "Melon Dark",
    "hex": "#FF7992",
    "r": 255,
    "g": 121,
    "b": 146
  },
  {
    "code": "3706",
    "name": "Melon Medium",
    "hex": "#FFADBC",
    "r": 255,
    "g": 173,
    "b": 188
  },
  {
    "code": "3708",
    "name": "Melon Light",
    "hex": "#FFCBD5",
    "r": 255,
    "g": 203,
    "b": 213
  },
  {
    "code": "3712",
    "name": "Salmon Medium",
    "hex": "#F18787",
    "r": 241,
    "g": 135,
    "b": 135
  },
  {
    "code": "3713",
    "name": "Salmon Very Light",
    "hex": "#FFE2E2",
    "r": 255,
    "g": 226,
    "b": 226
  },
  {
    "code": "3716",
    "name": "Dusty Rose Med Vy Lt",
    "hex": "#FFBDBD",
    "r": 255,
    "g": 189,
    "b": 189
  },
  {
    "code": "3721",
    "name": "Shell Pink Dark",
    "hex": "#A14B51",
    "r": 161,
    "g": 75,
    "b": 81
  },
  {
    "code": "3722",
    "name": "Shell Pink Med",
    "hex": "#BC6C64",
    "r": 188,
    "g": 108,
    "b": 100
  },
  {
    "code": "3726",
    "name": "Antique Mauve Dark",
    "hex": "#9B5B66",
    "r": 155,
    "g": 91,
    "b": 102
  },
  {
    "code": "3727",
    "name": "Antique Mauve Light",
    "hex": "#DBA9B2",
    "r": 219,
    "g": 169,
    "b": 178
  },
  {
    "code": "3731",
    "name": "Dusty Rose Very Dark",
    "hex": "#DA6783",
    "r": 218,
    "g": 103,
    "b": 131
  },
  {
    "code": "3733",
    "name": "Dusty Rose",
    "hex": "#E8879B",
    "r": 232,
    "g": 135,
    "b": 155
  },
  {
    "code": "3740",
    "name": "Antique Violet Dark",
    "hex": "#785762",
    "r": 120,
    "g": 87,
    "b": 98
  },
  {
    "code": "3743",
    "name": "Antique Violet Vy Lt",
    "hex": "#D7CBD3",
    "r": 215,
    "g": 203,
    "b": 211
  },
  {
    "code": "3746",
    "name": "Blue Violet Dark",
    "hex": "#776B98",
    "r": 119,
    "g": 107,
    "b": 152
  },
  {
    "code": "3747",
    "name": "Blue Violet Vy Lt",
    "hex": "#D3D7ED",
    "r": 211,
    "g": 215,
    "b": 237
  },
  {
    "code": "3750",
    "name": "Antique Blue Very Dk",
    "hex": "#384C5E",
    "r": 56,
    "g": 76,
    "b": 94
  },
  {
    "code": "3752",
    "name": "Antique Blue Very Lt",
    "hex": "#C7D1DB",
    "r": 199,
    "g": 209,
    "b": 219
  },
  {
    "code": "3753",
    "name": "Antique Blue Ult Vy Lt",
    "hex": "#DBE2E9",
    "r": 219,
    "g": 226,
    "b": 233
  },
  {
    "code": "3755",
    "name": "Baby Blue",
    "hex": "#93B4CE",
    "r": 147,
    "g": 180,
    "b": 206
  },
  {
    "code": "3756",
    "name": "Baby Blue Ult Vy Lt",
    "hex": "#EEFCFC",
    "r": 238,
    "g": 252,
    "b": 252
  },
  {
    "code": "3760",
    "name": "Wedgewood Med",
    "hex": "#3E85A2",
    "r": 62,
    "g": 133,
    "b": 162
  },
  {
    "code": "3761",
    "name": "Sky Blue Light",
    "hex": "#ACD8E2",
    "r": 172,
    "g": 216,
    "b": 226
  },
  {
    "code": "3765",
    "name": "Peacock Blue Vy Dk",
    "hex": "#347F8C",
    "r": 52,
    "g": 127,
    "b": 140
  },
  {
    "code": "3766",
    "name": "Peacock Blue Light",
    "hex": "#99CFD9",
    "r": 153,
    "g": 207,
    "b": 217
  },
  {
    "code": "3768",
    "name": "Gray Green Dark",
    "hex": "#657F7F",
    "r": 101,
    "g": 127,
    "b": 127
  },
  {
    "code": "3770",
    "name": "Tawny Vy Light",
    "hex": "#FFEEE3",
    "r": 255,
    "g": 238,
    "b": 227
  },
  {
    "code": "3771",
    "name": "Terra Cotta Ult Vy Lt",
    "hex": "#F4BBA9",
    "r": 244,
    "g": 187,
    "b": 169
  },
  {
    "code": "3772",
    "name": "Desert Sand Vy Dk",
    "hex": "#A06C50",
    "r": 160,
    "g": 108,
    "b": 80
  },
  {
    "code": "3773",
    "name": "Desert Sand Dark",
    "hex": "#B67552",
    "r": 182,
    "g": 117,
    "b": 82
  },
  {
    "code": "3774",
    "name": "Desert Sand Vy Lt",
    "hex": "#F3E1D7",
    "r": 243,
    "g": 225,
    "b": 215
  },
  {
    "code": "3776",
    "name": "Mahogany Light",
    "hex": "#CF7939",
    "r": 207,
    "g": 121,
    "b": 57
  },
  {
    "code": "3777",
    "name": "Terra Cotta Vy Dk",
    "hex": "#863022",
    "r": 134,
    "g": 48,
    "b": 34
  },
  {
    "code": "3778",
    "name": "Terra Cotta Light",
    "hex": "#D98978",
    "r": 217,
    "g": 137,
    "b": 120
  },
  {
    "code": "3779",
    "name": "Rosewood Ult Vy Lt",
    "hex": "#F8CAC8",
    "r": 248,
    "g": 202,
    "b": 200
  },
  {
    "code": "3781",
    "name": "Mocha Brown Dk",
    "hex": "#6B5743",
    "r": 107,
    "g": 87,
    "b": 67
  },
  {
    "code": "3782",
    "name": "Mocha Brown Lt",
    "hex": "#D2BCA6",
    "r": 210,
    "g": 188,
    "b": 166
  },
  {
    "code": "3787",
    "name": "Brown Gray Dark",
    "hex": "#625D50",
    "r": 98,
    "g": 93,
    "b": 80
  },
  {
    "code": "3790",
    "name": "Beige Gray Ult Dk",
    "hex": "#7F6A55",
    "r": 127,
    "g": 106,
    "b": 85
  },
  {
    "code": "3799",
    "name": "Pewter Gray Vy Dk",
    "hex": "#424242",
    "r": 66,
    "g": 66,
    "b": 66
  },
  {
    "code": "3801",
    "name": "Melon Very Dark",
    "hex": "#E74967",
    "r": 231,
    "g": 73,
    "b": 103
  },
  {
    "code": "3802",
    "name": "Antique Mauve Vy Dk",
    "hex": "#714149",
    "r": 113,
    "g": 65,
    "b": 73
  },
  {
    "code": "3803",
    "name": "Mauve Dark",
    "hex": "#AB3357",
    "r": 171,
    "g": 51,
    "b": 87
  },
  {
    "code": "3804",
    "name": "Cyclamen Pink Dark",
    "hex": "#E02876",
    "r": 224,
    "g": 40,
    "b": 118
  },
  {
    "code": "3805",
    "name": "Cyclamen Pink",
    "hex": "#F3478B",
    "r": 243,
    "g": 71,
    "b": 139
  },
  {
    "code": "3806",
    "name": "Cyclamen Pink Light",
    "hex": "#FF8CAE",
    "r": 255,
    "g": 140,
    "b": 174
  },
  {
    "code": "3807",
    "name": "Cornflower Blue",
    "hex": "#60678C",
    "r": 96,
    "g": 103,
    "b": 140
  },
  {
    "code": "3808",
    "name": "Turquoise Ult Vy Dk",
    "hex": "#366970",
    "r": 54,
    "g": 105,
    "b": 112
  },
  {
    "code": "3809",
    "name": "Turquoise Vy Dark",
    "hex": "#3F7C85",
    "r": 63,
    "g": 124,
    "b": 133
  },
  {
    "code": "3810",
    "name": "Turquoise Dark",
    "hex": "#488E9A",
    "r": 72,
    "g": 142,
    "b": 154
  },
  {
    "code": "3811",
    "name": "Turquoise Very Light",
    "hex": "#BCE3E6",
    "r": 188,
    "g": 227,
    "b": 230
  },
  {
    "code": "3812",
    "name": "Sea Green Vy Dk",
    "hex": "#2F8C84",
    "r": 47,
    "g": 140,
    "b": 132
  },
  {
    "code": "3813",
    "name": "Blue Green Lt",
    "hex": "#B2D4BD",
    "r": 178,
    "g": 212,
    "b": 189
  },
  {
    "code": "3814",
    "name": "Aquamarine",
    "hex": "#508B7D",
    "r": 80,
    "g": 139,
    "b": 125
  },
  {
    "code": "3815",
    "name": "Celadon Green Dk",
    "hex": "#477759",
    "r": 71,
    "g": 119,
    "b": 89
  },
  {
    "code": "3816",
    "name": "Celadon Green",
    "hex": "#65A57D",
    "r": 101,
    "g": 165,
    "b": 125
  },
  {
    "code": "3817",
    "name": "Celadon Green Lt",
    "hex": "#99C3AA",
    "r": 153,
    "g": 195,
    "b": 170
  },
  {
    "code": "3818",
    "name": "Emerald Grn Ult V Dk",
    "hex": "#115A3B",
    "r": 17,
    "g": 90,
    "b": 59
  },
  {
    "code": "3819",
    "name": "Moss Green Lt",
    "hex": "#E0E868",
    "r": 224,
    "g": 232,
    "b": 104
  },
  {
    "code": "3820",
    "name": "Straw Dark",
    "hex": "#DFB65F",
    "r": 223,
    "g": 182,
    "b": 95
  },
  {
    "code": "3821",
    "name": "Straw",
    "hex": "#F3CE75",
    "r": 243,
    "g": 206,
    "b": 117
  },
  {
    "code": "3822",
    "name": "Straw Light",
    "hex": "#F6DC98",
    "r": 246,
    "g": 220,
    "b": 152
  },
  {
    "code": "3823",
    "name": "Yellow Ultra Pale",
    "hex": "#FFFDE3",
    "r": 255,
    "g": 253,
    "b": 227
  },
  {
    "code": "3824",
    "name": "Apricot Light",
    "hex": "#FECDC2",
    "r": 254,
    "g": 205,
    "b": 194
  },
  {
    "code": "3825",
    "name": "Pumpkin Pale",
    "hex": "#FDBD96",
    "r": 253,
    "g": 189,
    "b": 150
  },
  {
    "code": "3826",
    "name": "Golden Brown",
    "hex": "#AD7239",
    "r": 173,
    "g": 114,
    "b": 57
  },
  {
    "code": "3827",
    "name": "Golden Brown Pale",
    "hex": "#F7BB77",
    "r": 247,
    "g": 187,
    "b": 119
  },
  {
    "code": "3828",
    "name": "Hazelnut Brown",
    "hex": "#B78B61",
    "r": 183,
    "g": 139,
    "b": 97
  },
  {
    "code": "3829",
    "name": "Old Gold Vy Dark",
    "hex": "#A98204",
    "r": 169,
    "g": 130,
    "b": 4
  },
  {
    "code": "3830",
    "name": "Terra Cotta",
    "hex": "#B95544",
    "r": 185,
    "g": 85,
    "b": 68
  },
  {
    "code": "3831",
    "name": "Raspberry Dark",
    "hex": "#B32F48",
    "r": 179,
    "g": 47,
    "b": 72
  },
  {
    "code": "3832",
    "name": "Raspberry Medium",
    "hex": "#DB556E",
    "r": 219,
    "g": 85,
    "b": 110
  },
  {
    "code": "3833",
    "name": "Raspberry Light",
    "hex": "#EA8699",
    "r": 234,
    "g": 134,
    "b": 153
  },
  {
    "code": "3834",
    "name": "Grape Dark",
    "hex": "#72375D",
    "r": 114,
    "g": 55,
    "b": 93
  },
  {
    "code": "3835",
    "name": "Grape Medium",
    "hex": "#946083",
    "r": 148,
    "g": 96,
    "b": 131
  },
  {
    "code": "3836",
    "name": "Grape Light",
    "hex": "#BA91AA",
    "r": 186,
    "g": 145,
    "b": 170
  },
  {
    "code": "3837",
    "name": "Lavender Ultra Dark",
    "hex": "#6C3A6E",
    "r": 108,
    "g": 58,
    "b": 110
  },
  {
    "code": "3838",
    "name": "Lavender Blue Dark",
    "hex": "#5C7294",
    "r": 92,
    "g": 114,
    "b": 148
  },
  {
    "code": "3839",
    "name": "Lavender Blue Med",
    "hex": "#7B8EAB",
    "r": 123,
    "g": 142,
    "b": 171
  },
  {
    "code": "3840",
    "name": "Lavender Blue Light",
    "hex": "#B0C0DA",
    "r": 176,
    "g": 192,
    "b": 218
  },
  {
    "code": "3841",
    "name": "Baby Blue Pale",
    "hex": "#CDDFED",
    "r": 205,
    "g": 223,
    "b": 237
  },
  {
    "code": "3842",
    "name": "Wedgewood Vry Dk",
    "hex": "#32667C",
    "r": 50,
    "g": 102,
    "b": 124
  },
  {
    "code": "3843",
    "name": "Electric Blue",
    "hex": "#14AAD0",
    "r": 20,
    "g": 170,
    "b": 208
  },
  {
    "code": "3844",
    "name": "Turquoise Bright Dark",
    "hex": "#12AEBA",
    "r": 18,
    "g": 174,
    "b": 186
  },
  {
    "code": "3845",
    "name": "Turquoise Bright Med",
    "hex": "#04C4CA",
    "r": 4,
    "g": 196,
    "b": 202
  },
  {
    "code": "3846",
    "name": "Turquoise Bright Light",
    "hex": "#06E3E6",
    "r": 6,
    "g": 227,
    "b": 230
  },
  {
    "code": "3847",
    "name": "Teal Green Dark",
    "hex": "#347D75",
    "r": 52,
    "g": 125,
    "b": 117
  },
  {
    "code": "3848",
    "name": "Teal Green Med",
    "hex": "#559392",
    "r": 85,
    "g": 147,
    "b": 146
  },
  {
    "code": "3849",
    "name": "Teal Green Light",
    "hex": "#52B3A4",
    "r": 82,
    "g": 179,
    "b": 164
  },
  {
    "code": "3850",
    "name": "Green Bright Dk",
    "hex": "#378477",
    "r": 55,
    "g": 132,
    "b": 119
  },
  {
    "code": "3851",
    "name": "Green Bright Lt",
    "hex": "#49B3A1",
    "r": 73,
    "g": 179,
    "b": 161
  },
  {
    "code": "3852",
    "name": "Straw Very Dark",
    "hex": "#CD9D37",
    "r": 205,
    "g": 157,
    "b": 55
  },
  {
    "code": "3853",
    "name": "Autumn Gold Dk",
    "hex": "#F29746",
    "r": 242,
    "g": 151,
    "b": 70
  },
  {
    "code": "3854",
    "name": "Autumn Gold Med",
    "hex": "#F2AF68",
    "r": 242,
    "g": 175,
    "b": 104
  },
  {
    "code": "3855",
    "name": "Autumn Gold Lt",
    "hex": "#FAD396",
    "r": 250,
    "g": 211,
    "b": 150
  },
  {
    "code": "3856",
    "name": "Mahogany Ult Vy Lt",
    "hex": "#FFD3B5",
    "r": 255,
    "g": 211,
    "b": 181
  },
  {
    "code": "3857",
    "name": "Rosewood Dark",
    "hex": "#68251A",
    "r": 104,
    "g": 37,
    "b": 26
  },
  {
    "code": "3858",
    "name": "Rosewood Med",
    "hex": "#964A3F",
    "r": 150,
    "g": 74,
    "b": 63
  },
  {
    "code": "3859",
    "name": "Rosewood Light",
    "hex": "#BA8B7C",
    "r": 186,
    "g": 139,
    "b": 124
  },
  {
    "code": "3860",
    "name": "Cocoa",
    "hex": "#7D5D57",
    "r": 125,
    "g": 93,
    "b": 87
  },
  {
    "code": "3861",
    "name": "Cocoa Light",
    "hex": "#A68881",
    "r": 166,
    "g": 136,
    "b": 129
  },
  {
    "code": "3862",
    "name": "Mocha Beige Dark",
    "hex": "#8A6E4E",
    "r": 138,
    "g": 110,
    "b": 78
  },
  {
    "code": "3863",
    "name": "Mocha Beige Med",
    "hex": "#A4835C",
    "r": 164,
    "g": 131,
    "b": 92
  },
  {
    "code": "3864",
    "name": "Mocha Beige Light",
    "hex": "#CBB69C",
    "r": 203,
    "g": 182,
    "b": 156
  },
  {
    "code": "3865",
    "name": "Winter White",
    "hex": "#F9F7F1",
    "r": 249,
    "g": 247,
    "b": 241
  },
  {
    "code": "3866",
    "name": "Mocha Brn Ult Vy Lt",
    "hex": "#FAF6F0",
    "r": 250,
    "g": 246,
    "b": 240
  },
  {
    "code": "B5200",
    "name": "Snow White",
    "hex": "#FDFEFE",
    "r": 253,
    "g": 254,
    "b": 254
  },
  {
    "code": "Blanc",
    "name": "White",
    "hex": "#FFFFFF",
    "r": 255,
    "g": 255,
    "b": 255
  },
  {
    "code": "ECRU",
    "name": "Ecru",
    "hex": "#F0EAD6",
    "r": 240,
    "g": 234,
    "b": 214
  },
  {
    "code": "Ecru",
    "name": "Ecru",
    "hex": "#F0EADA",
    "r": 240,
    "g": 234,
    "b": 218
  },
  {
    "code": "White",
    "name": "White",
    "hex": "#FCFBF8",
    "r": 252,
    "g": 251,
    "b": 248
  }
];

export function getHighContrastTextColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#111111' : '#FFFFFF';
}

export function getColorLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function createDefaultPalette(): PaletteColor[] {
  const starters = ['310', 'Blanc', '666', '720', '973', '700', '796', '550', '433'];
  return starters.map((dmcCode, index) => {
    const entry = DMC_CATALOG.find(d => d.code === dmcCode) || DMC_CATALOG[0];
    return {
      id: index + 1,
      dmc: entry.code,
      name: entry.name,
      hex: entry.hex,
      symbol: CHART_SYMBOLS[index % CHART_SYMBOLS.length],
      symbolColor: getHighContrastTextColor(entry.hex)
    };
  });
}
