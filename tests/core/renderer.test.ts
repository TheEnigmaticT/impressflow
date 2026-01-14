import { describe, it, expect } from 'vitest';
import { render } from '../../src/core/renderer/index.js';
import { getTheme } from '../../src/core/themes/index.js';
import type { SlideAST } from '../../src/types.js';

describe('Renderer', () => {
  const mockAST: SlideAST = {
    frontmatter: { title: 'Test Presentation' },
    slides: [
      {
        index: 0,
        title: 'Slide 1',
        content: '<p>Content</p>',
        layout: 'single',
        images: [],
        notes: '',
      },
      {
        index: 1,
        title: 'Slide 2',
        content: '<p>More</p>',
        layout: 'single',
        images: [],
        notes: 'Speaker note',
      },
    ],
  };

  it('generates valid HTML5 document', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<html');
    expect(result.html).toContain('</html>');
  });

  it('embeds impress.js script', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('impress().init()');
  });

  it('generates correct data attributes for positioning', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'grid',
    });
    expect(result.html).toContain('data-x=');
    expect(result.html).toContain('data-y=');
    expect(result.html).toContain('data-z=');
    expect(result.html).toContain('data-scale=');
  });

  it('includes speaker notes in hidden divs', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('class="notes"');
    expect(result.html).toContain('Speaker note');
  });

  it('creates overview slide', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('id="overview"');
  });

  it('includes title in HTML', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('<title>Test Presentation</title>');
  });

  it('includes theme CSS', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('--accent:');
    expect(result.html).toContain('#00d4ff');
  });

  it('includes Google Fonts links', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('fonts.googleapis.com');
  });

  it('includes layout CSS', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('.layout-single');
    expect(result.html).toContain('.layout-two-column');
  });

  it('generates layout classes for slides', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('class="step slide layout-single"');
  });

  it('returns metadata with render result', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.metadata).toEqual({
      title: 'Test Presentation',
      slideCount: 2,
      theme: 'tech-dark',
      layout: 'spiral',
    });
  });

  it('includes lazy loader script when configured', () => {
    const result = render(mockAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
      lazyImages: true,
      apiEndpoint: '/api/images',
    });
    expect(result.html).toContain('/api/images');
    expect(result.html).toContain('IntersectionObserver');
  });

  it('handles empty slides array', () => {
    const emptyAST: SlideAST = {
      frontmatter: { title: 'Empty' },
      slides: [],
    };
    const result = render(emptyAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.metadata.slideCount).toBe(0);
  });

  it('uses default title when not provided', () => {
    const noTitleAST: SlideAST = {
      frontmatter: {},
      slides: [],
    };
    const result = render(noTitleAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).toContain('<title>Presentation</title>');
    expect(result.metadata.title).toBe('Presentation');
  });

  it('escapes HTML in title', () => {
    const xssAST: SlideAST = {
      frontmatter: { title: '<script>alert("xss")</script>' },
      slides: [],
    };
    const result = render(xssAST, {
      theme: getTheme('tech-dark'),
      layout: 'spiral',
    });
    expect(result.html).not.toContain('<script>alert');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('works with all layout types', () => {
    const layouts = [
      'spiral',
      'grid',
      'herringbone',
      'zoom',
      'sphere',
      'cascade',
    ] as const;
    layouts.forEach((layout) => {
      const result = render(mockAST, {
        theme: getTheme('tech-dark'),
        layout,
      });
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.metadata.layout).toBe(layout);
    });
  });

  it('works with all themes', () => {
    const themes = ['tech-dark', 'clean-light', 'creative', 'corporate', 'workshop'];
    themes.forEach((themeName) => {
      const result = render(mockAST, {
        theme: getTheme(themeName),
        layout: 'spiral',
      });
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.metadata.theme).toBe(themeName);
    });
  });
});
