import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageAdapter } from '../../src/adapters/storage/local.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'impressflow-test-'));
    adapter = new LocalStorageAdapter(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should save and get string content', async () => {
    const content = 'Hello, World!';
    await adapter.save('test.txt', content);

    const result = await adapter.get('test.txt');
    expect(result?.toString()).toBe(content);
  });

  it('should save and get buffer content', async () => {
    const content = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    await adapter.save('test.bin', content);

    const result = await adapter.get('test.bin');
    expect(result).toEqual(content);
  });

  it('should create nested directories', async () => {
    await adapter.save('nested/deep/file.txt', 'content');

    const result = await adapter.get('nested/deep/file.txt');
    expect(result?.toString()).toBe('content');
  });

  it('should return null for non-existent files', async () => {
    const result = await adapter.get('nonexistent.txt');
    expect(result).toBeNull();
  });

  it('should check if file exists', async () => {
    await adapter.save('exists.txt', 'content');

    expect(await adapter.exists('exists.txt')).toBe(true);
    expect(await adapter.exists('nonexistent.txt')).toBe(false);
  });

  it('should return file:// URL for public URL', async () => {
    const url = await adapter.getPublicUrl('test.txt');
    expect(url).toMatch(/^file:\/\//);
    expect(url).toContain('test.txt');
  });
});
