import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { ImageCache } from '../../types.js';

/**
 * Local filesystem cache for CLI usage
 */
export class LocalImageCache implements ImageCache {
  constructor(private cacheDir: string) {}

  async exists(promptHash: string): Promise<boolean> {
    try {
      await access(this.getPath(promptHash));
      return true;
    } catch {
      return false;
    }
  }

  async get(promptHash: string): Promise<string | null> {
    if (await this.exists(promptHash)) {
      return this.getPath(promptHash);
    }
    return null;
  }

  async save(promptHash: string, buffer: Buffer): Promise<string> {
    await mkdir(this.cacheDir, { recursive: true });
    const filepath = this.getPath(promptHash);
    await writeFile(filepath, buffer);
    return filepath;
  }

  private getPath(promptHash: string): string {
    return join(this.cacheDir, `${promptHash}.png`);
  }
}

/**
 * Supabase-backed image cache for web app usage
 */
export class SupabaseImageCache implements ImageCache {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(supabase: SupabaseClient, bucket: string = 'images') {
    this.supabase = supabase;
    this.bucket = bucket;
  }

  /**
   * Check if an image exists in the cache (database lookup)
   */
  async exists(promptHash: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('image_cache')
      .select('id')
      .eq('prompt_hash', promptHash)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  }

  /**
   * Get the public URL for a cached image
   */
  async get(promptHash: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('image_cache')
      .select('storage_path')
      .eq('prompt_hash', promptHash)
      .single();

    if (error || !data) {
      return null;
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(data.storage_path);

    return urlData.publicUrl;
  }

  /**
   * Save an image to Supabase storage and record in database
   */
  async save(promptHash: string, buffer: Buffer): Promise<string> {
    const storagePath = `cache/${promptHash}.png`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Record in database
    const { error: dbError } = await this.supabase
      .from('image_cache')
      .upsert({
        prompt_hash: promptHash,
        storage_path: storagePath,
      }, {
        onConflict: 'prompt_hash',
      });

    if (dbError) {
      throw new Error(`Failed to record image in cache: ${dbError.message}`);
    }

    // Return public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  }

  /**
   * Save image with additional metadata (prompt text, style)
   */
  async saveWithMetadata(
    promptHash: string,
    buffer: Buffer,
    metadata: { promptText?: string; styleModifier?: string; width?: number; height?: number }
  ): Promise<string> {
    const storagePath = `cache/${promptHash}.png`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Record in database with metadata
    const { error: dbError } = await this.supabase
      .from('image_cache')
      .upsert({
        prompt_hash: promptHash,
        storage_path: storagePath,
        prompt_text: metadata.promptText,
        style_modifier: metadata.styleModifier,
        width: metadata.width || 1024,
        height: metadata.height || 1024,
      }, {
        onConflict: 'prompt_hash',
      });

    if (dbError) {
      throw new Error(`Failed to record image in cache: ${dbError.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  }
}

// Type import for Supabase client
import type { SupabaseClient } from '@supabase/supabase-js';
