import { describe, it, expect } from 'vitest';
import { detectInputSource, parseInput } from '../../src/adapters/input/index.js';

describe('Input Router', () => {
  describe('detectInputSource', () => {
    it('detects local file paths', () => {
      expect(detectInputSource('./presentation.md')).toBe('file');
      expect(detectInputSource('/path/to/file.md')).toBe('file');
      expect(detectInputSource('~/docs/slides.md')).toBe('file');
      expect(detectInputSource('presentation.md')).toBe('file');
    });

    it('detects Notion public URLs', () => {
      expect(detectInputSource('https://my-site.notion.site/Page')).toBe('notion-public');
      expect(detectInputSource('https://example.notion.site/Doc-abc123')).toBe(
        'notion-public'
      );
    });

    it('detects Notion API URLs', () => {
      expect(detectInputSource('https://www.notion.so/workspace/Page-abc123')).toBe(
        'notion-api'
      );
      expect(detectInputSource('https://notion.so/Page-a1b2c3d4')).toBe('notion-api');
    });
  });

  describe('parseInput', () => {
    it('parses local files', async () => {
      const ast = await parseInput('tests/fixtures/simple.md');
      expect(ast.frontmatter.title).toBe('Test Presentation');
      expect(ast.slides.length).toBe(2);
    });

    it('throws on missing file', async () => {
      await expect(parseInput('nonexistent.md')).rejects.toThrow('File not found');
    });

    it('throws on Notion API without token', async () => {
      await expect(
        parseInput('https://www.notion.so/workspace/Page-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4')
      ).rejects.toThrow('Notion API token required');
    });
  });
});
