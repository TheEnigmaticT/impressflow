import { describe, it, expect } from 'vitest';
import { extractPageId } from '../../src/adapters/input/notion-api.js';

describe('Notion API Parser', () => {
  describe('extractPageId', () => {
    it('extracts ID from standard URL', () => {
      // 32-char hex ID at the end of a slug
      const id = extractPageId(
        'https://www.notion.so/workspace/Page-Title-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'
      );
      expect(id).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    });

    it('extracts ID from short URL', () => {
      const id = extractPageId('https://notion.so/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
      expect(id).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    });

    it('extracts ID with dashes (UUID format)', () => {
      const id = extractPageId(
        'https://notion.so/a1b2c3d4-e5f6-a1b2-c3d4-e5f6a1b2c3d4'
      );
      expect(id).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    });

    it('extracts ID with query parameters', () => {
      const id = extractPageId(
        'https://notion.so/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4?v=123'
      );
      expect(id).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
    });

    it('throws on invalid URL', () => {
      expect(() => extractPageId('https://notion.so/')).toThrow(
        'Could not extract Notion page ID'
      );
      expect(() => extractPageId('https://google.com')).toThrow(
        'Could not extract Notion page ID'
      );
    });

    it('throws on URL without ID', () => {
      expect(() => extractPageId('https://notion.so/invalid')).toThrow(
        'Could not extract Notion page ID'
      );
    });
  });
});
