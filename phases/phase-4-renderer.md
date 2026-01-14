# Phase 4: HTML Renderer

**Completion Promise:** `<promise>PHASE_4_COMPLETE</promise>`

## Scope
Generate complete HTML output from SlideAST.

## Tasks
1. Create base HTML template
2. Embed impress.js
3. Generate slide divs with positioning attributes
4. Generate CSS from theme
5. Implement layout-specific HTML structures
6. Add overview slide generation
7. Embed lazy image loader script (for web mode)
8. Create output interface (works with any storage adapter)

## Files to Create

```
src/core/renderer/
├── index.ts          # Main render function
├── html.ts           # HTML generation
├── css.ts            # Layout CSS
└── templates/
    └── base.html     # Base template (or inline string)

templates/
└── impress.min.js    # Copy from impress.js repo
```

## Main Renderer

```typescript
// src/core/renderer/index.ts
import { SlideAST, Position } from '../../types';
import { Theme, generateThemeCSS, generateFontLinks } from '../themes';
import { calculatePositions, LayoutName } from '../positioning';
import { generateLayoutCSS } from './css';
import { generateSlideHTML } from './html';

export interface RenderOptions {
  theme: Theme;
  layout: LayoutName;
  lazyImages?: boolean;
  apiEndpoint?: string;  // For lazy image loading
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

export function render(ast: SlideAST, options: RenderOptions): RenderResult {
  const { theme, layout, lazyImages = false, apiEndpoint } = options;
  
  const positions = calculatePositions(layout, ast.slides.length);
  const themeCSS = generateThemeCSS(theme);
  const layoutCSS = generateLayoutCSS();
  const fontLinks = generateFontLinks(theme);
  
  const slidesHTML = ast.slides.map((slide, i) => 
    generateSlideHTML(slide, positions[i], theme, lazyImages)
  ).join('\n');
  
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
    }
  };
}
```

## HTML Generation

```typescript
// src/core/renderer/html.ts
import { Slide, Position } from '../../types';
import { Theme } from '../themes';

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
    content = content.replace(
      /<img([^>]*?)data-prompt="([^"]*)"([^>]*?)>/g,
      (match, before, prompt, after) => {
        const hash = hashPrompt(prompt + theme.imagePromptModifier);
        return `<img${before}src="${generatePlaceholderDataUrl(prompt, theme)}" 
          data-prompt-hash="${hash}" 
          data-prompt="${prompt}"
          data-theme="${theme.name}"
          data-loading="pending"
          class="slide-image"${after}>`;
      }
    );
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

## Full HTML Template

```typescript
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

export function generateFullHTML(params: TemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1920">
  <title>${params.title}</title>
  ${params.fontLinks}
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    /* impress.js required */
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
```

## Layout CSS

```typescript
// src/core/renderer/css.ts
export function generateLayoutCSS(): string {
  return `
.layout-single .slide-content {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
}

.layout-two-column .columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--column-gap);
}

.layout-three-column .columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--column-gap);
}

.layout-image-left .slide-content {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: var(--column-gap);
}

.layout-image-right .slide-content {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: var(--column-gap);
}

.layout-title-only .slide-content {
  justify-content: center;
  align-items: center;
  text-align: center;
}

.layout-quote blockquote {
  font-size: 150%;
  text-align: center;
  max-width: 80%;
  margin: 0 auto;
}

.slide-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
}
`;
}
```

## Tests

```typescript
// tests/core/renderer.test.ts
describe('Renderer', () => {
  const mockAST: SlideAST = {
    frontmatter: { title: 'Test Presentation' },
    slides: [
      { index: 0, title: 'Slide 1', content: '<p>Content</p>', layout: 'single', images: [], notes: '' },
      { index: 1, title: 'Slide 2', content: '<p>More</p>', layout: 'single', images: [], notes: 'Speaker note' },
    ]
  };
  
  it('generates valid HTML5 document', () => {
    const result = render(mockAST, { theme: getTheme('tech-dark'), layout: 'spiral' });
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<html');
    expect(result.html).toContain('</html>');
  });

  it('embeds impress.js script', () => {
    const result = render(mockAST, { theme: getTheme('tech-dark'), layout: 'spiral' });
    expect(result.html).toContain('impress().init()');
  });

  it('generates correct data attributes for positioning', () => {
    const result = render(mockAST, { theme: getTheme('tech-dark'), layout: 'grid' });
    expect(result.html).toContain('data-x=');
    expect(result.html).toContain('data-y=');
  });

  it('includes speaker notes in hidden divs', () => {
    const result = render(mockAST, { theme: getTheme('tech-dark'), layout: 'spiral' });
    expect(result.html).toContain('class="notes"');
    expect(result.html).toContain('Speaker note');
  });

  it('creates overview slide', () => {
    const result = render(mockAST, { theme: getTheme('tech-dark'), layout: 'spiral' });
    expect(result.html).toContain('id="overview"');
  });

  it('includes lazy loader script when configured', () => {
    const result = render(mockAST, { 
      theme: getTheme('tech-dark'), 
      layout: 'spiral',
      lazyImages: true,
      apiEndpoint: '/api/images'
    });
    expect(result.html).toContain('data-loading="pending"');
  });
});
```

## Verification

```bash
npm run typecheck && npm run test -- tests/core/renderer.test.ts
```
