// Frontmatter from markdown
export interface Frontmatter {
  title?: string;
  theme?: string;
  layout?: string;
  imageStyle?: string;
  transitionDuration?: number;
  author?: string;
  date?: string;
  aspectRatio?: '16:9' | '4:3';
}

// Slide AST - common format for all input sources
export interface Slide {
  index: number;
  title: string;
  content: string;
  layout: LayoutType;
  images: ImageRequest[];
  notes: string;
}

export interface SlideAST {
  frontmatter: Frontmatter;
  slides: Slide[];
}

// Layout types
export type LayoutType =
  | 'single'
  | 'two-column'
  | 'three-column'
  | 'image-left'
  | 'image-right'
  | 'full-bleed'
  | 'title-only'
  | 'quote';

// Position for impress.js
export interface Position {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
}

// Image generation
export interface ImageRequest {
  prompt: string;
  slideIndex: number;
  imageIndex: number;
}

export interface ImageResult {
  success: boolean;
  path: string;
  promptHash: string;
  error?: string;
}

// Storage abstraction
export interface StorageAdapter {
  save(path: string, content: Buffer | string): Promise<string>;
  get(path: string): Promise<Buffer | null>;
  exists(path: string): Promise<boolean>;
  getPublicUrl(path: string): Promise<string>;
}

// Image cache abstraction
export interface ImageCache {
  exists(promptHash: string): Promise<boolean>;
  get(promptHash: string): Promise<string | null>;
  save(promptHash: string, buffer: Buffer): Promise<string>;
}
