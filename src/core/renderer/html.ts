import type { Slide, Position } from '../../types.js';
import type { Theme } from '../themes/index.js';
import crypto from 'node:crypto';

/**
 * Generate HTML for a single slide
 */
export function generateSlideHTML(
  slide: Slide,
  position: Position,
  theme: Theme,
  lazyImages: boolean
): string {
  const layoutClass = `layout-${slide.layout}`;

  // Handle images - either immediate src or lazy placeholder
  let content = slide.content;
  if (lazyImages) {
    content = processLazyImages(content, theme);
  }

  return `
    <div id="slide-${slide.index + 1}"
         class="step slide ${layoutClass}"
         data-x="${position.x}"
         data-y="${position.y}"
         data-z="${position.z}"
         data-rotate-x="${position.rotateX}"
         data-rotate-y="${position.rotateY}"
         data-rotate-z="${position.rotateZ}"
         data-scale="${position.scale}">
      <div class="slide-content">
        ${slide.title ? `<h1 class="slide-title">${escapeHtml(slide.title)}</h1>` : ''}
        <div class="content-body">
          ${content}
        </div>
      </div>
      ${slide.notes ? `<div class="notes" style="display:none;">${escapeHtml(slide.notes)}</div>` : ''}
    </div>
  `;
}

/**
 * Process images for lazy loading
 */
function processLazyImages(content: string, theme: Theme): string {
  // Match image tags with data-prompt attribute or standard img tags
  return content.replace(
    /<img\s+([^>]*?)(?:src="[^"]*")?([^>]*?)alt="image:\s*([^"]+)"([^>]*?)>/gi,
    (match, before, middle, prompt, after) => {
      const fullPrompt = `${prompt.trim()} ${theme.imagePromptModifier}`;
      const hash = hashPrompt(fullPrompt);
      const placeholder = generatePlaceholderDataUrl(prompt.trim(), theme);

      return `<img ${before}${middle}src="${placeholder}"
        data-prompt-hash="${hash}"
        data-prompt="${escapeHtml(prompt.trim())}"
        data-theme="${theme.name}"
        data-loading="pending"
        alt="${escapeHtml(prompt.trim())}"
        class="slide-image"${after}>`;
    }
  );
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate hash from prompt for caching
 */
export function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

/**
 * Generate a placeholder data URL for lazy-loaded images
 */
export function generatePlaceholderDataUrl(prompt: string, theme: Theme): string {
  // Create an SVG placeholder with the prompt text
  const bgColor = theme.colors.codeBackground.replace('#', '%23');
  const textColor = theme.colors.textMuted.replace('#', '%23');
  const truncatedPrompt = prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="45%" fill="${textColor}" font-family="sans-serif" font-size="24" text-anchor="middle">Loading image...</text>
    <text x="50%" y="55%" fill="${textColor}" font-family="sans-serif" font-size="16" text-anchor="middle">${escapeHtml(truncatedPrompt)}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Calculate the position for the overview slide
 */
export function calculateOverviewPosition(positions: Position[]): Position {
  if (positions.length === 0) {
    return { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
  }

  // Find the center of all slides
  const sumX = positions.reduce((sum, p) => sum + p.x, 0);
  const sumY = positions.reduce((sum, p) => sum + p.y, 0);

  return {
    x: sumX / positions.length,
    y: sumY / positions.length,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
  };
}

/**
 * Generate the lazy loader script for client-side image loading
 */
export function generateLazyLoaderScript(apiEndpoint?: string): string {
  const endpoint = apiEndpoint || '/api/images';

  return `
  <script>
    (function() {
      const endpoint = '${endpoint}';
      const images = document.querySelectorAll('img[data-loading="pending"]');

      async function loadImage(img) {
        const hash = img.dataset.promptHash;
        const prompt = img.dataset.prompt;
        const theme = img.dataset.theme;

        try {
          img.dataset.loading = 'loading';

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash, prompt, theme })
          });

          if (!response.ok) throw new Error('Failed to load image');

          const data = await response.json();
          if (data.url) {
            img.src = data.url;
            img.dataset.loading = 'loaded';
          }
        } catch (error) {
          console.error('Failed to load image:', error);
          img.dataset.loading = 'error';
        }
      }

      // Load images when they become visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.loading === 'pending') {
              loadImage(img);
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '50px' });

      images.forEach(img => observer.observe(img));
    })();
  </script>
  `;
}
