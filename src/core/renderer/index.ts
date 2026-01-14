import type { SlideAST, Position } from '../../types.js';
import type { Theme } from '../themes/index.js';
import { generateThemeCSS, generateFontLinks } from '../themes/index.js';
import { calculatePositions, type LayoutName } from '../positioning/index.js';
import { generateLayoutCSS } from './css.js';
import {
  generateSlideHTML,
  calculateOverviewPosition,
  generateLazyLoaderScript,
} from './html.js';
import { IMPRESS_JS_SOURCE } from './impress.js';

export interface RenderOptions {
  theme: Theme;
  layout: LayoutName;
  lazyImages?: boolean;
  apiEndpoint?: string;
}

export interface RenderResult {
  html: string;
  metadata: {
    title: string;
    slideCount: number;
    theme: string;
    layout: string;
  };
}

interface TemplateParams {
  title: string;
  fontLinks: string;
  themeCSS: string;
  layoutCSS: string;
  slidesHTML: string;
  overviewPosition: Position;
  transitionDuration: number;
  lazyImages: boolean;
  apiEndpoint?: string;
}

/**
 * Render a SlideAST to a complete HTML presentation
 */
export function render(ast: SlideAST, options: RenderOptions): RenderResult {
  const { theme, layout, lazyImages = false, apiEndpoint } = options;

  const positions = calculatePositions(layout, ast.slides.length);
  const themeCSS = generateThemeCSS(theme);
  const layoutCSS = generateLayoutCSS();
  const fontLinks = generateFontLinks(theme);

  const slidesHTML = ast.slides
    .map((slide, i) => generateSlideHTML(slide, positions[i], theme, lazyImages))
    .join('\n');

  const overviewPosition = calculateOverviewPosition(positions);

  const html = generateFullHTML({
    title: ast.frontmatter.title || 'Presentation',
    fontLinks,
    themeCSS,
    layoutCSS,
    slidesHTML,
    overviewPosition,
    transitionDuration: ast.frontmatter.transitionDuration || 1000,
    lazyImages,
    apiEndpoint,
  });

  return {
    html,
    metadata: {
      title: ast.frontmatter.title || 'Presentation',
      slideCount: ast.slides.length,
      theme: theme.name,
      layout,
    },
  };
}

/**
 * Generate the complete HTML document
 */
function generateFullHTML(params: TemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1920">
  <title>${escapeHtml(params.title)}</title>
  ${params.fontLinks}
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* impress.js required styles */
    .impress-not-supported .step { position: relative; margin: 20px auto; }
    .impress-enabled .step { position: absolute; }
    .impress-enabled .step.active { pointer-events: auto; }

    /* Theme */
    ${params.themeCSS}

    /* Layouts */
    ${params.layoutCSS}

    /* Slides base */
    .step.slide {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .fallback-message { display: none; }
    .impress-not-supported .fallback-message { display: block; }
  </style>
</head>
<body class="impress-not-supported">
  <div class="fallback-message">
    <p>Your browser doesn't support impress.js features.</p>
  </div>

  <div id="impress"
       data-transition-duration="${params.transitionDuration}"
       data-width="1920"
       data-height="1080"
       data-max-scale="3"
       data-min-scale="0"
       data-perspective="1000">

    ${params.slidesHTML}

    <div id="overview" class="step"
         data-x="${params.overviewPosition.x}"
         data-y="${params.overviewPosition.y}"
         data-scale="10">
    </div>
  </div>

  ${params.lazyImages ? generateLazyLoaderScript(params.apiEndpoint) : ''}

  <script>
    ${IMPRESS_JS_SOURCE}
  </script>
  <script>impress().init();</script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Re-export for convenience
export { generateLayoutCSS } from './css.js';
export {
  generateSlideHTML,
  calculateOverviewPosition,
  generateLazyLoaderScript,
  hashPrompt,
  generatePlaceholderDataUrl,
} from './html.js';
export { IMPRESS_JS_SOURCE } from './impress.js';
