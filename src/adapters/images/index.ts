import type { SlideAST, ImageCache } from '../../types.js';
import type { Theme } from '../../core/themes/index.js';
import { generateWithGemini, enhancePrompt } from './gemini.js';
import { LocalImageCache } from './cache.js';
import { hashPrompt } from './hash.js';

export interface ImageGenOptions {
  enabled: boolean;
  cache: ImageCache;
  style: string;
  apiKey?: string;
}

/**
 * Generate all images for a presentation
 */
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
  const imageRequests = ast.slides.flatMap((slide) => slide.images);

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
      console.log(
        `   ⚠️ Failed: slide ${request.slideIndex + 1} - ${(error as Error).message}`
      );
      // Will use placeholder in renderer
    }
  }

  return results;
}

// Re-export sub-modules
export { hashPrompt } from './hash.js';
export { generatePlaceholder, placeholderToDataUrl } from './placeholder.js';
export { LocalImageCache, SupabaseImageCache } from './cache.js';
export { generateWithGemini, enhancePrompt } from './gemini.js';
