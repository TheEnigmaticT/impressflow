import type { ImageRequest } from '../../types.js';

/**
 * Parse image generation syntax from slide content
 *
 * Syntax: ![image: prompt text](placeholder)
 * or:    ![image: prompt text]()
 */
export function parseImages(slideContent: string, slideIndex: number): ImageRequest[] {
  const images: ImageRequest[] = [];

  // Match markdown image syntax with "image:" prefix in alt text
  const imageRegex = /!\[(image:\s*([^\]]+))\]\([^)]*\)/gi;
  let match: RegExpExecArray | null;
  let imageIndex = 0;

  while ((match = imageRegex.exec(slideContent)) !== null) {
    const prompt = match[2].trim();

    if (prompt) {
      images.push({
        prompt,
        slideIndex,
        imageIndex: imageIndex++,
      });
    }
  }

  return images;
}

/**
 * Extract all image references from slide content (both generated and static)
 */
export function extractImageReferences(slideContent: string): {
  generated: ImageRequest[];
  static: Array<{ alt: string; src: string }>;
} {
  const generated: ImageRequest[] = [];
  const staticImages: Array<{ alt: string; src: string }> = [];

  // Match all markdown images
  const imageRegex = /!\[([^\]]*)\]\(([^)]*)\)/gi;
  let match: RegExpExecArray | null;
  let imageIndex = 0;

  while ((match = imageRegex.exec(slideContent)) !== null) {
    const alt = match[1];
    const src = match[2];

    if (alt.toLowerCase().startsWith('image:')) {
      // Generated image
      const prompt = alt.slice(6).trim();
      generated.push({
        prompt,
        slideIndex: 0, // Will be set by caller
        imageIndex: imageIndex++,
      });
    } else if (src && src !== 'placeholder') {
      // Static image
      staticImages.push({ alt, src });
    }
  }

  return { generated, static: staticImages };
}

/**
 * Replace image placeholder syntax with actual image paths
 */
export function replaceImagePlaceholders(
  content: string,
  imagePaths: Map<string, string>
): string {
  return content.replace(
    /!\[(image:\s*([^\]]+))\]\([^)]*\)/gi,
    (match, fullAlt, prompt) => {
      const path = imagePaths.get(prompt.trim());
      if (path) {
        return `![${prompt.trim()}](${path})`;
      }
      return match;
    }
  );
}
