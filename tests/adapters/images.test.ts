import { describe, it, expect, afterEach } from 'vitest';
import { enhancePrompt } from '../../src/adapters/images/gemini.js';
import { hashPrompt } from '../../src/adapters/images/hash.js';
import { LocalImageCache } from '../../src/adapters/images/cache.js';
import { generatePlaceholder, placeholderToDataUrl } from '../../src/adapters/images/placeholder.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Theme } from '../../src/core/themes/index.js';

describe('Image Generation', () => {
  const mockTheme = {
    imagePromptModifier: 'cyberpunk style',
    colors: {
      codeBackground: '#1a1a2e',
      accent: '#00d4ff',
      textMuted: '#888888',
    },
  } as Theme;

  it('enhances prompt with style modifiers', () => {
    const result = enhancePrompt('A robot', 'flat-vector', mockTheme);
    expect(result).toContain('flat vector illustration');
    expect(result).toContain('A robot');
  });

  it('enhances prompt with theme modifiers', () => {
    const theme = {
      ...mockTheme,
      imagePromptModifier: 'neon lights, dark background',
    } as Theme;
    const result = enhancePrompt('A city', 'photorealistic', theme);
    expect(result).toContain('neon lights');
    expect(result).toContain('professional photography');
  });

  it('uses flat-vector as default style', () => {
    const result = enhancePrompt('A robot', 'unknown-style', mockTheme);
    expect(result).toContain('flat vector illustration');
  });

  it('generates consistent prompt hash', () => {
    const hash1 = hashPrompt('test prompt');
    const hash2 = hashPrompt('test prompt');
    const hash3 = hashPrompt('different prompt');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(16);
  });

  it('generates placeholder SVG', () => {
    const svg = generatePlaceholder('A test image', mockTheme);

    expect(svg).toContain('<svg');
    expect(svg).toContain('A test image');
    expect(svg).toContain('#1a1a2e');
    expect(svg).toContain('#00d4ff');
  });

  it('truncates long prompts in placeholder', () => {
    const longPrompt = 'A'.repeat(100);
    const svg = generatePlaceholder(longPrompt, mockTheme);
    expect(svg).toContain('...');
    expect(svg).not.toContain('A'.repeat(100));
  });

  it('escapes HTML in placeholder', () => {
    const svg = generatePlaceholder('Test <script>alert("xss")</script>', mockTheme);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });

  it('converts placeholder to data URL', () => {
    const svg = '<svg></svg>';
    const dataUrl = placeholderToDataUrl(svg);
    expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  describe('LocalImageCache', () => {
    let tempDir: string;
    let cache: LocalImageCache;

    afterEach(async () => {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });

    it('saves and retrieves images', async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-cache-'));
      cache = new LocalImageCache(tempDir);
      const buffer = Buffer.from('test image data');

      await cache.save('testhash', buffer);
      expect(await cache.exists('testhash')).toBe(true);

      const filePath = await cache.get('testhash');
      expect(filePath).toContain('testhash.png');
    });

    it('returns null for missing images', async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-cache-'));
      cache = new LocalImageCache(tempDir);
      expect(await cache.get('nonexistent')).toBeNull();
    });

    it('reports false for non-existent hash', async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-cache-'));
      cache = new LocalImageCache(tempDir);
      expect(await cache.exists('nonexistent')).toBe(false);
    });

    it('creates cache directory if it does not exist', async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-cache-'));
      const nestedDir = path.join(tempDir, 'nested', 'cache');
      cache = new LocalImageCache(nestedDir);

      await cache.save('testhash', Buffer.from('data'));

      const stats = await fs.stat(nestedDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });
});
