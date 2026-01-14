import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageAdapter } from '../../types.js';

/**
 * Supabase storage adapter for presentations and assets
 */
export class SupabaseStorage implements StorageAdapter {
  private supabase: SupabaseClient;
  private bucket: string;

  /**
   * Create a Supabase storage adapter
   * @param supabase - Supabase client instance
   * @param bucket - Storage bucket name (default: 'presentations')
   */
  constructor(supabase: SupabaseClient, bucket: string = 'presentations') {
    this.supabase = supabase;
    this.bucket = bucket;
  }

  /**
   * Save content to Supabase storage
   * @param path - Path within the bucket
   * @param content - File content as Buffer or string
   * @returns Public URL of the saved file
   */
  async save(path: string, content: Buffer | string): Promise<string> {
    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    const contentType = this.getContentType(path);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to save to Supabase storage: ${error.message}`);
    }

    return this.getPublicUrl(path);
  }

  /**
   * Get content from Supabase storage
   * @param path - Path within the bucket
   * @returns File content as Buffer, or null if not found
   */
  async get(path: string): Promise<Buffer | null> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(path);

    if (error) {
      if (error.message.includes('not found') || error.message.includes('Object not found')) {
        return null;
      }
      throw new Error(`Failed to get from Supabase storage: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Check if a file exists in Supabase storage
   * @param path - Path within the bucket
   * @returns True if file exists
   */
  async exists(path: string): Promise<boolean> {
    // Use list with exact path prefix to check existence
    const dir = path.substring(0, path.lastIndexOf('/') + 1) || '';
    const filename = path.substring(path.lastIndexOf('/') + 1);

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(dir, {
        search: filename,
        limit: 1,
      });

    if (error) {
      return false;
    }

    return data.some(file => file.name === filename);
  }

  /**
   * Get public URL for a file
   * @param path - Path within the bucket
   * @returns Public URL
   */
  async getPublicUrl(path: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete a file from storage
   * @param path - Path within the bucket
   */
  async delete(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete from Supabase storage: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   * @param prefix - Directory prefix
   * @returns Array of file paths
   */
  async list(prefix: string = ''): Promise<string[]> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(prefix);

    if (error) {
      throw new Error(`Failed to list Supabase storage: ${error.message}`);
    }

    return data.map(file => `${prefix}${prefix ? '/' : ''}${file.name}`);
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }
}

/**
 * Create a Supabase storage adapter from environment variables
 */
export function createSupabaseStorage(
  supabase: SupabaseClient,
  bucket?: string
): SupabaseStorage {
  return new SupabaseStorage(supabase, bucket);
}
