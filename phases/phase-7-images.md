# Phase 7: Image Generation

**Completion Promise:** `<promise>PHASE_7_COMPLETE</promise>`

## Scope
Integrate Gemini Nano Banana for AI images with caching.

## Tasks
1. Set up @google/generative-ai
2. Implement prompt enhancement
3. Implement image generation function
4. Implement prompt hashing for cache keys
5. Implement LocalImageCache for CLI
6. Implement SupabaseImageCache interface (stub for Phase 9)
7. Implement placeholder SVG fallback
8. Add progress logging

## Files to Create

```
src/adapters/images/
├── index.ts          # Image generation orchestrator
├── gemini.ts         # Gemini API client
├── cache.ts          # Cache interface + implementations
├── placeholder.ts    # Fallback SVGs
└── hash.ts           # Prompt hashing
```

## Gemini Client

```typescript
// src/adapters/images/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ImageRequest, ImageResult, Theme } from '../../types';
import { hashPrompt } from './hash';

export interface GeminiConfig {
  apiKey: string;
  model?: string;  // Default: gemini-2.5-flash-image
}

export async function generateWithGemini(
  request: ImageRequest,
  theme: Theme,
  style: string,
  config: GeminiConfig
): Promise<{ buffer: Buffer; promptHash: string }> {
  const genAI = new GoogleGenerativeAI(config.apiKey);
  
  const model = genAI.getGenerativeModel({ 
    model: config.model || 'gemini-2.5-flash-image',
    generationConfig: { 
      responseModalities: ['TEXT', 'IMAGE'] 
    }
  });
  
  const enhancedPrompt = enhancePrompt(request.prompt, style, theme);
  const promptHash = hashPrompt(enhancedPrompt);
  
  const result = await model.generateContent(enhancedPrompt);
  const response = result.response;
  
  // Extract image from response parts
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/')
  );
  
  if (!imagePart?.inlineData?.data) {
    throw new Error('No image data in Gemini response');
  }
  
  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  
  return { buffer, promptHash };
}

export function enhancePrompt(
  basePrompt: string, 
  style: string, 
  theme: Theme
): string {
  const styleModifiers: Record<string, string> = {
    'flat-vector': 'flat vector illustration, clean lines, solid colors, no gradients',
    'photorealistic': 'professional photography, high resolution, realistic lighting',
    '3d-render': '3D render, soft lighting, smooth surfaces, studio quality',
    'hand-drawn': 'hand-drawn illustration, sketch style, artistic, organic lines',
    'minimalist': 'minimalist icon, simple shapes, single color, abstract',
  };
  
  return [
    basePrompt,
    styleModifiers[style] || styleModifiers['flat-vector'],
    theme.imagePromptModifier,
    'high quality, presentation slide graphic, 16:9 aspect ratio'
  ].join(', ');
}
```

## Prompt Hashing

```typescript
// src/adapters/images/hash.ts
import { createHash } from 'crypto';

export function hashPrompt(prompt: string): string {
  return createHash('sha256')
    .update(prompt)
    .digest('hex')
    .substring(0, 16);
}
```

## Cache Interface

```typescript
// src/adapters/images/cache.ts
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { ImageCache } from '../../types';

// Local filesystem cache for CLI
export class LocalImageCache implements ImageCache {
  constructor(private cacheDir: string) {}
  
  async exists(promptHash: string): Promise<boolean> {
    try {
      await access(this.getPath(promptHash));
      return true;
    } catch {
      return false;
    }
  }
  
  async get(promptHash: string): Promise<string | null> {
    if (await this.exists(promptHash)) {
      return this.getPath(promptHash);
    }
    return null;
  }
  
  async save(promptHash: string, buffer: Buffer): Promise<string> {
    await mkdir(this.cacheDir, { recursive: true });
    const filepath = this.getPath(promptHash);
    await writeFile(filepath, buffer);
    return filepath;
  }
  
  private getPath(promptHash: string): string {
    return join(this.cacheDir, `${promptHash}.png`);
  }
}

// Stub for Supabase - implemented in Phase 9
export class SupabaseImageCache implements ImageCache {
  constructor(private supabase: any) {}
  
  async exists(promptHash: string): Promise<boolean> {
    throw new Error('SupabaseImageCache not implemented - see Phase 9');
  }
  
  async get(promptHash: string): Promise<string | null> {
    throw new Error('SupabaseImageCache not implemented - see Phase 9');
  }
  
  async save(promptHash: string, buffer: Buffer): Promise<string> {
    throw new Error('SupabaseImageCache not implemented - see Phase 9');
  }
}
```

## Placeholder SVG

```typescript
// src/adapters/images/placeholder.ts
import { Theme } from '../../types';

export function generatePlaceholder(prompt: string, theme: Theme): string {
  const escapedPrompt = prompt
    .substring(0, 60)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  return `<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${theme.colors.codeBackground}"/>
    <rect x="10" y="10" width="780" height="430" 
          fill="none" stroke="${theme.colors.accent}" 
          stroke-width="2" stroke-dasharray="10,10"/>
    <text x="50%" y="45%" text-anchor="middle" 
          fill="${theme.colors.textMuted}" 
          font-family="sans-serif" font-size="20">
      ⏳ Image: ${escapedPrompt}${prompt.length > 60 ? '...' : ''}
    </text>
  </svg>`;
}

export function placeholderToDataUrl(svg: string): string {
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
```

## Image Generation Orchestrator

```typescript
// src/adapters/images/index.ts
import { SlideAST, Theme, ImageCache, ImageResult } from '../../types';
import { generateWithGemini, enhancePrompt } from './gemini';
import { LocalImageCache } from './cache';
import { hashPrompt } from './hash';
import { generatePlaceholder } from './placeholder';

export interface ImageGenOptions {
  enabled: boolean;
  cache: ImageCache;
  style: string;
  apiKey?: string;
}

export async function generateImages(
  ast: SlideAST,
  theme: Theme,
  outputDir: string,
  options?: Partial<ImageGenOptions>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  GEMINI_API_KEY not set. Using placeholders.');
    return results;
  }
  
  const cache = options?.cache || new LocalImageCache(`${outputDir}/images`);
  const style = options?.style || 'flat-vector';
  
  // Collect all image requests
  const imageRequests = ast.slides.flatMap(slide => slide.images);
  
  if (imageRequests.length === 0) {
    return results;
  }
  
  console.log(`🎨 Generating ${imageRequests.length} images...`);
  
  for (const request of imageRequests) {
    const enhancedPrompt = enhancePrompt(request.prompt, style, theme);
    const promptHash = hashPrompt(enhancedPrompt);
    
    // Check cache first
    const cached = await cache.get(promptHash);
    if (cached) {
      console.log(`   ✓ Cached: slide ${request.slideIndex + 1}`);
      results.set(promptHash, cached);
      continue;
    }
    
    // Generate new image
    try {
      console.log(`   ⏳ Generating: slide ${request.slideIndex + 1}...`);
      
      const { buffer } = await generateWithGemini(request, theme, style, { apiKey });
      const path = await cache.save(promptHash, buffer);
      
      results.set(promptHash, path);
      console.log(`   ✓ Generated: slide ${request.slideIndex + 1}`);
    } catch (error) {
      console.log(`   ⚠️ Failed: slide ${request.slideIndex + 1} - ${error.message}`);
      // Will use placeholder in renderer
    }
  }
  
  return results;
}
```

## Tests

```typescript
// tests/adapters/gemini.test.ts
import { describe, it, expect, vi } from 'vitest';
import { enhancePrompt, hashPrompt } from '../../src/adapters/images';
import { LocalImageCache } from '../../src/adapters/images/cache';
import { generatePlaceholder } from '../../src/adapters/images/placeholder';

describe('Image Generation', () => {
  it('enhances prompt with style modifiers', () => {
    const theme = { imagePromptModifier: 'cyberpunk style' } as any;
    const result = enhancePrompt('A robot', 'flat-vector', theme);
    expect(result).toContain('flat vector illustration');
    expect(result).toContain('A robot');
  });

  it('enhances prompt with theme modifiers', () => {
    const theme = { imagePromptModifier: 'neon lights, dark background' } as any;
    const result = enhancePrompt('A city', 'photorealistic', theme);
    expect(result).toContain('neon lights');
  });

  it('generates consistent prompt hash', () => {
    const hash1 = hashPrompt('test prompt');
    const hash2 = hashPrompt('test prompt');
    const hash3 = hashPrompt('different prompt');
    
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(16);
  });

  it('generates placeholder SVG', () => {
    const theme = {
      colors: { codeBackground: '#1a1a2e', accent: '#00d4ff', textMuted: '#888' }
    } as any;
    const svg = generatePlaceholder('A test image', theme);
    
    expect(svg).toContain('<svg');
    expect(svg).toContain('A test image');
    expect(svg).toContain('#1a1a2e');
  });

  describe('LocalImageCache', () => {
    it('saves and retrieves images', async () => {
      const cache = new LocalImageCache('/tmp/test-cache');
      const buffer = Buffer.from('test image data');
      
      await cache.save('testhash', buffer);
      expect(await cache.exists('testhash')).toBe(true);
      
      const path = await cache.get('testhash');
      expect(path).toContain('testhash.png');
    });

    it('returns null for missing images', async () => {
      const cache = new LocalImageCache('/tmp/test-cache');
      expect(await cache.get('nonexistent')).toBeNull();
    });
  });
});
```

## Verification

```bash
npm run typecheck && npm run test -- tests/adapters/gemini.test.ts
```
