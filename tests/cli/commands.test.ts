import { describe, it, expect, afterEach } from 'vitest';
import { generate } from '../../src/cli/commands.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('CLI Commands', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('errors on missing input file', async () => {
    await expect(
      generate('nonexistent.md', {
        theme: 'tech-dark',
        layout: 'spiral',
        output: './output',
        images: false,
      })
    ).rejects.toThrow('Input file not found');
  });

  it('errors on invalid theme name', async () => {
    await expect(
      generate('tests/fixtures/simple.md', {
        theme: 'invalid-theme',
        layout: 'spiral',
        output: './output',
        images: false,
      })
    ).rejects.toThrow('Unknown theme');
  });

  it('errors on invalid layout name', async () => {
    await expect(
      generate('tests/fixtures/simple.md', {
        theme: 'tech-dark',
        layout: 'invalid-layout',
        output: './output',
        images: false,
      })
    ).rejects.toThrow('Unknown layout');
  });

  it('generates presentation from markdown file', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-test-'));

    await generate('tests/fixtures/simple.md', {
      theme: 'tech-dark',
      layout: 'spiral',
      output: tempDir,
      images: false,
    });

    // Check output files exist
    const htmlContent = await fs.readFile(path.join(tempDir, 'index.html'), 'utf-8');
    expect(htmlContent).toContain('<!DOCTYPE html>');
    expect(htmlContent).toContain('Test Presentation');
    expect(htmlContent).toContain('Slide One');
    expect(htmlContent).toContain('Slide Two');

    const metadataContent = await fs.readFile(
      path.join(tempDir, 'presentation.json'),
      'utf-8'
    );
    const metadata = JSON.parse(metadataContent);
    expect(metadata.title).toBe('Test Presentation');
    expect(metadata.slideCount).toBe(2);
    expect(metadata.theme).toBe('tech-dark');
    expect(metadata.layout).toBe('spiral');
  });

  it('uses different themes', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-test-'));

    await generate('tests/fixtures/simple.md', {
      theme: 'workshop',
      layout: 'cascade',
      output: tempDir,
      images: false,
    });

    const htmlContent = await fs.readFile(path.join(tempDir, 'index.html'), 'utf-8');
    expect(htmlContent).toContain('--accent: #facc15'); // Workshop theme accent

    const metadataContent = await fs.readFile(
      path.join(tempDir, 'presentation.json'),
      'utf-8'
    );
    const metadata = JSON.parse(metadataContent);
    expect(metadata.theme).toBe('workshop');
    expect(metadata.layout).toBe('cascade');
  });

  it('errors on empty input file', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-test-'));
    const emptyFile = path.join(tempDir, 'empty.md');
    await fs.writeFile(emptyFile, '');

    await expect(
      generate(emptyFile, {
        theme: 'tech-dark',
        layout: 'spiral',
        output: tempDir,
        images: false,
      })
    ).rejects.toThrow('Input file is empty');
  });
});
