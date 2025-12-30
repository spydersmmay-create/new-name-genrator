
import { StylePreset, AspectRatio } from './types';

export const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '1:1 Square', value: '1:1' },
  { label: '16:9 Wide', value: '16:9' },
  { label: '9:16 Portrait', value: '9:16' },
  { label: '4:3 Standard', value: '4:3' },
  { label: '3:4 Mobile', value: '3:4' },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'none',
    name: 'Natural',
    description: 'Original AI look',
    promptSuffix: '',
    previewUrl: 'https://picsum.photos/seed/natural/200/200'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon, futuristic, high-tech',
    promptSuffix: ', cyberpunk style, neon lights, highly detailed, futuristic city, blade runner aesthetic',
    previewUrl: 'https://picsum.photos/seed/cyber/200/200'
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classical canvas texture',
    promptSuffix: ', oil painting style, visible brushstrokes, rich textures, fine art masterpiece',
    previewUrl: 'https://picsum.photos/seed/oil/200/200'
  },
  {
    id: '3d-render',
    name: '3D Render',
    description: 'Octane render, Unreal Engine',
    promptSuffix: ', 3d render, octane render, cinematic lighting, 8k resolution, photorealistic, unreal engine 5',
    previewUrl: 'https://picsum.photos/seed/3d/200/200'
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style',
    promptSuffix: ', high quality anime style, studio ghibli inspired, vibrant colors, clean lines',
    previewUrl: 'https://picsum.photos/seed/anime/200/200'
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    description: 'Hand-drawn graphite',
    promptSuffix: ', detailed pencil sketch, graphite shading, hand-drawn look, artistic, monochromatic',
    previewUrl: 'https://picsum.photos/seed/sketch/200/200'
  }
];
