import { describe, it, expect } from 'vitest';
import {
  isNotionPublicUrl,
  blocksToSlides,
} from '../../src/adapters/input/notion-public.js';

describe('Notion Published Parser', () => {
  describe('isNotionPublicUrl', () => {
    it('validates notion.site URLs', () => {
      expect(isNotionPublicUrl('https://my-site.notion.site/Page-123')).toBe(true);
      expect(isNotionPublicUrl('https://example.notion.site/My-Page-abc123')).toBe(true);
    });

    it('validates notion.so URLs with paths', () => {
      expect(isNotionPublicUrl('https://www.notion.so/workspace/Page-abc123')).toBe(true);
      expect(isNotionPublicUrl('https://notion.so/abc123def456')).toBe(true);
    });

    it('rejects non-Notion URLs', () => {
      expect(isNotionPublicUrl('https://google.com')).toBe(false);
      expect(isNotionPublicUrl('https://github.com/notion')).toBe(false);
      expect(isNotionPublicUrl('notion.so')).toBe(false); // Not a valid URL
    });

    it('rejects notion.so root without path', () => {
      expect(isNotionPublicUrl('https://notion.so/')).toBe(false);
      expect(isNotionPublicUrl('https://notion.so')).toBe(false);
    });
  });

  describe('blocksToSlides', () => {
    it('converts H1 blocks to slides', () => {
      const blocks = [
        { type: 'heading-1', content: 'Slide 1' },
        { type: 'paragraph', content: 'Content' },
        { type: 'heading-1', content: 'Slide 2' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides).toHaveLength(2);
      expect(slides[0].title).toBe('Slide 1');
      expect(slides[1].title).toBe('Slide 2');
    });

    it('splits on dividers', () => {
      const blocks = [
        { type: 'heading-1', content: 'Slide 1' },
        { type: 'paragraph', content: 'Content' },
        { type: 'divider', content: '' },
        { type: 'paragraph', content: 'More content' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides).toHaveLength(2);
    });

    it('includes content in slides', () => {
      const blocks = [
        { type: 'heading-1', content: 'Title' },
        { type: 'paragraph', content: 'Paragraph text' },
        { type: 'bulleted-list-item', content: 'List item' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides[0].content).toContain('<p>Paragraph text</p>');
      expect(slides[0].content).toContain('<li>List item</li>');
    });

    it('handles empty block list', () => {
      const slides = blocksToSlides([]);
      expect(slides).toHaveLength(0);
    });

    it('handles content before first heading', () => {
      const blocks = [
        { type: 'paragraph', content: 'Intro text' },
        { type: 'heading-1', content: 'First Slide' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides.length).toBeGreaterThanOrEqual(1);
    });

    it('converts images to img tags', () => {
      const blocks = [
        { type: 'heading-1', content: 'Images' },
        { type: 'image', content: '', url: 'https://example.com/image.png' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides[0].content).toContain('<img src="https://example.com/image.png"');
    });

    it('converts code blocks with language', () => {
      const blocks = [
        { type: 'heading-1', content: 'Code' },
        { type: 'code', content: 'const x = 1;', language: 'javascript' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides[0].content).toContain('language-javascript');
      expect(slides[0].content).toContain('const x = 1;');
    });

    it('outputs standard SlideAST format', () => {
      const blocks = [{ type: 'heading-1', content: 'Test' }];
      const slides = blocksToSlides(blocks);

      expect(slides[0]).toHaveProperty('index');
      expect(slides[0]).toHaveProperty('title');
      expect(slides[0]).toHaveProperty('content');
      expect(slides[0]).toHaveProperty('layout');
      expect(slides[0]).toHaveProperty('images');
      expect(slides[0]).toHaveProperty('notes');
    });

    it('assigns correct indices', () => {
      const blocks = [
        { type: 'heading-1', content: 'Slide 1' },
        { type: 'heading-1', content: 'Slide 2' },
        { type: 'heading-1', content: 'Slide 3' },
      ];
      const slides = blocksToSlides(blocks);
      expect(slides[0].index).toBe(0);
      expect(slides[1].index).toBe(1);
      expect(slides[2].index).toBe(2);
    });
  });
});
