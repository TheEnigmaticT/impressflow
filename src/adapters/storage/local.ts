import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageAdapter } from '../../types.js';

/**
 * Local filesystem storage adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Save content to a file
   */
  async save(filePath: string, content: Buffer | string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);

    return fullPath;
  }

  /**
   * Get content from a file
   */
  async get(filePath: string): Promise<Buffer | null> {
    const fullPath = path.join(this.basePath, filePath);

    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, filePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get public URL for a file (for local storage, returns file:// URL)
   */
  async getPublicUrl(filePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    return `file://${fullPath}`;
  }
}
