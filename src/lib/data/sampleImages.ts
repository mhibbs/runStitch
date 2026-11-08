/// <reference types="vite/client" />

export interface SampleImage {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
}

const baseUrl = import.meta.env.BASE_URL || '/';

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'cool_cat',
    name: 'Cool Cat in Sunglasses',
    title: 'Cool Cat in Sunglasses',
    description: 'Vibrant colorful cat portrait with rich DMC tones and patterns',
    url: `${baseUrl}samples/cool_cat.jpg`
  },
  {
    id: 'retro_coffee',
    name: 'Retro Coffee Mug',
    title: 'Retro Coffee Mug',
    description: 'Cute coffee mug with steam on white background (great for background removal test)',
    url: `${baseUrl}samples/retro_coffee.jpg`
  }
];
