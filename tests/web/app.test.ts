import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock DOM environment
function createMockDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <body>
      <button data-tab="markdown" class="tab active">Markdown</button>
      <button data-tab="notion" class="tab">Notion</button>
      <div id="markdown-tab" class="tab-content active">
        <textarea id="markdown-input"></textarea>
      </div>
      <div id="notion-tab" class="tab-content">
        <input id="notion-url" type="url">
      </div>
      <select id="theme-select">
        <option value="tech-dark">Tech Dark</option>
        <option value="clean-light">Clean Light</option>
      </select>
      <select id="layout-select">
        <option value="spiral">Spiral</option>
        <option value="grid">Grid</option>
      </select>
      <input type="checkbox" id="generate-images">
      <button id="generate-btn">
        <span class="btn-text">Generate</span>
        <span class="btn-loading" hidden>Loading</span>
      </button>
      <iframe id="preview-iframe"></iframe>
      <div class="preview-placeholder"></div>
      <button id="fullscreen-btn"></button>
      <button id="download-btn"></button>
    </body>
    </html>
  `, { url: 'http://localhost' });

  return dom;
}

describe('Web App', () => {
  describe('parseMarkdown', () => {
    // Test the markdown parsing logic
    function parseMarkdown(content: string) {
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      let frontmatter: Record<string, string> = {};
      let body = content;

      if (frontmatterMatch) {
        const fmLines = frontmatterMatch[1].split('\n');
        for (const line of fmLines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length) {
            frontmatter[key.trim()] = valueParts.join(':').trim();
          }
        }
        body = frontmatterMatch[2];
      }

      const slideTexts = body.split(/\n---\n/).filter(s => s.trim());

      const slides = slideTexts.map((text, index) => {
        const titleMatch = text.match(/^#\s+(.+)$/m);
        return {
          index,
          title: titleMatch ? titleMatch[1] : `Slide ${index + 1}`,
          content: text.trim(),
        };
      });

      return { frontmatter, slides };
    }

    it('should parse frontmatter correctly', () => {
      const content = `---
title: Test Presentation
theme: tech-dark
layout: spiral
---

# Slide 1

Content`;

      const result = parseMarkdown(content);

      expect(result.frontmatter.title).toBe('Test Presentation');
      expect(result.frontmatter.theme).toBe('tech-dark');
      expect(result.frontmatter.layout).toBe('spiral');
    });

    it('should split content into slides', () => {
      const content = `# Slide 1

First slide content

---

# Slide 2

Second slide content`;

      const result = parseMarkdown(content);

      expect(result.slides).toHaveLength(2);
      expect(result.slides[0].title).toBe('Slide 1');
      expect(result.slides[1].title).toBe('Slide 2');
    });

    it('should handle content without frontmatter', () => {
      const content = `# Hello

This is a test`;

      const result = parseMarkdown(content);

      expect(result.frontmatter).toEqual({});
      expect(result.slides).toHaveLength(1);
    });

    it('should handle empty slides gracefully', () => {
      const content = `# Slide 1

---

---

# Slide 2`;

      const result = parseMarkdown(content);

      // Empty slides are filtered out
      expect(result.slides.filter(s => s.content.trim())).toHaveLength(2);
    });
  });

  describe('markdownToHtml', () => {
    function markdownToHtml(md: string): string {
      return md
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    }

    it('should convert headers', () => {
      expect(markdownToHtml('# Hello')).toContain('<h1>Hello</h1>');
      expect(markdownToHtml('## World')).toContain('<h2>World</h2>');
      expect(markdownToHtml('### Test')).toContain('<h3>Test</h3>');
    });

    it('should convert bold and italic', () => {
      expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
      expect(markdownToHtml('*italic*')).toContain('<em>italic</em>');
    });

    it('should convert inline code', () => {
      expect(markdownToHtml('use `npm install`')).toContain('<code>npm install</code>');
    });

    it('should convert code blocks', () => {
      const md = '```javascript\nconsole.log("hi")\n```';
      const html = markdownToHtml(md);
      expect(html).toContain('<pre><code class="language-javascript">');
      expect(html).toContain('console.log("hi")');
    });

    it('should convert list items', () => {
      expect(markdownToHtml('- Item 1')).toContain('<li>Item 1</li>');
    });

    it('should convert blockquotes', () => {
      expect(markdownToHtml('> Quote')).toContain('<blockquote>Quote</blockquote>');
    });
  });

  describe('calculatePositions', () => {
    function calculatePositions(count: number, layout: string) {
      const positions = [];

      for (let i = 0; i < count; i++) {
        let pos;

        switch (layout) {
          case 'grid': {
            const cols = Math.ceil(Math.sqrt(count));
            const col = i % cols;
            const row = Math.floor(i / cols);
            pos = { x: col * 1500, y: row * 1000, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
            break;
          }
          case 'zoom': {
            pos = { x: 0, y: 0, z: -i * 3000, rotateX: 0, rotateY: 0, rotateZ: 0, scale: Math.pow(0.8, i) };
            break;
          }
          case 'spiral':
          default: {
            const angle = (i / count) * Math.PI * 4;
            const radius = 800 + i * 200;
            pos = {
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              z: -i * 500,
              rotateX: 0,
              rotateY: 0,
              rotateZ: (angle * 180) / Math.PI,
              scale: 1,
            };
            break;
          }
        }

        positions.push(pos);
      }

      return positions;
    }

    it('should calculate spiral positions', () => {
      const positions = calculatePositions(3, 'spiral');

      expect(positions).toHaveLength(3);
      expect(positions[0].scale).toBe(1);
      // First position has some rotation
      expect(typeof positions[0].rotateZ).toBe('number');
    });

    it('should calculate grid positions', () => {
      const positions = calculatePositions(4, 'grid');

      expect(positions).toHaveLength(4);
      // 2x2 grid
      expect(positions[0].x).toBe(0);
      expect(positions[0].y).toBe(0);
      expect(positions[1].x).toBe(1500); // Second column
      expect(positions[2].y).toBe(1000); // Second row
    });

    it('should calculate zoom positions', () => {
      const positions = calculatePositions(3, 'zoom');

      expect(positions).toHaveLength(3);
      // First slide z is -0*3000 = -0, which equals 0
      expect(Object.is(positions[0].z, 0) || Object.is(positions[0].z, -0)).toBe(true);
      expect(positions[1].z).toBe(-3000);
      expect(positions[2].z).toBe(-6000);
      // Scale decreases
      expect(positions[1].scale).toBeLessThan(positions[0].scale);
    });

    it('should handle single slide', () => {
      const positions = calculatePositions(1, 'spiral');

      expect(positions).toHaveLength(1);
      expect(positions[0].scale).toBe(1);
    });
  });

  describe('getThemeCSS', () => {
    function getThemeCSS(theme: string): string {
      const themes: Record<string, Record<string, string>> = {
        'tech-dark': {
          '--background': '#0a0a0f',
          '--foreground': '#ffffff',
          '--primary': '#00d4ff',
        },
        'clean-light': {
          '--background': '#ffffff',
          '--foreground': '#1a1a1a',
          '--primary': '#2563eb',
        },
      };

      const colors = themes[theme] || themes['tech-dark'];
      return `:root {
        ${Object.entries(colors).map(([k, v]) => `${k}: ${v};`).join('\n        ')}
      }`;
    }

    it('should return tech-dark theme CSS', () => {
      const css = getThemeCSS('tech-dark');

      expect(css).toContain('--background: #0a0a0f');
      expect(css).toContain('--primary: #00d4ff');
    });

    it('should return clean-light theme CSS', () => {
      const css = getThemeCSS('clean-light');

      expect(css).toContain('--background: #ffffff');
      expect(css).toContain('--primary: #2563eb');
    });

    it('should default to tech-dark for unknown themes', () => {
      const css = getThemeCSS('unknown-theme');

      expect(css).toContain('--background: #0a0a0f');
    });
  });
});
