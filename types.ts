
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: string;
  model: string;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  previewUrl: string;
}

export enum ModelTier {
  STANDARD = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}
