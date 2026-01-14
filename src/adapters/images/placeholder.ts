import type { Theme } from '../../core/themes/index.js';

/**
 * Generate a placeholder SVG for an image
 */
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
      Image: ${escapedPrompt}${prompt.length > 60 ? '...' : ''}
    </text>
  </svg>`;
}

/**
 * Convert an SVG string to a data URL
 */
export function placeholderToDataUrl(svg: string): string {
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
