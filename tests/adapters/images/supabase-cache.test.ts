import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseImageCache } from '../../../src/adapters/images/cache.js';

// Mock Supabase client
const createMockSupabase = () => {
  const mockDb = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };

  const mockStorage = {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/cache/abc123.png' },
    }),
  };

  return {
    from: vi.fn(() => mockDb),
    storage: {
      from: vi.fn(() => mockStorage),
    },
    _mockDb: mockDb,
    _mockStorage: mockStorage,
  };
};

describe('SupabaseImageCache', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let cache: SupabaseImageCache;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    cache = new SupabaseImageCache(mockSupabase as unknown as Parameters<typeof SupabaseImageCache>[0], 'images');
  });

  describe('exists', () => {
    it('should return true if image exists in database', async () => {
      mockSupabase._mockDb.single.mockResolvedValueOnce({
        data: { id: 'uuid-123' },
        error: null,
      });

      const result = await cache.exists('abc123');

      expect(mockSupabase.from).toHaveBeenCalledWith('image_cache');
      expect(result).toBe(true);
    });

    it('should return false if image does not exist', async () => {
      mockSupabase._mockDb.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await cache.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should return public URL for existing cached image', async () => {
      mockSupabase._mockDb.single.mockResolvedValueOnce({
        data: { storage_path: 'cache/abc123.png' },
        error: null,
      });

      const result = await cache.get('abc123');

      expect(result).toBe('https://example.com/cache/abc123.png');
    });

    it('should return null if image not found', async () => {
      mockSupabase._mockDb.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await cache.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should upload image and record in database', async () => {
      const buffer = Buffer.from('fake image data');
      const result = await cache.save('abc123', buffer);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('images');
      expect(mockSupabase._mockStorage.upload).toHaveBeenCalledWith(
        'cache/abc123.png',
        buffer,
        expect.objectContaining({ contentType: 'image/png', upsert: true })
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('image_cache');
      expect(result).toBe('https://example.com/cache/abc123.png');
    });

    it('should throw error on upload failure', async () => {
      mockSupabase._mockStorage.upload.mockResolvedValueOnce({
        error: { message: 'Storage full' },
      });

      const buffer = Buffer.from('data');

      await expect(cache.save('abc123', buffer)).rejects.toThrow(
        'Failed to upload image: Storage full'
      );
    });

    it('should throw error on database failure', async () => {
      mockSupabase._mockDb.upsert.mockResolvedValueOnce({
        error: { message: 'Database error' },
      });

      const buffer = Buffer.from('data');

      await expect(cache.save('abc123', buffer)).rejects.toThrow(
        'Failed to record image in cache: Database error'
      );
    });
  });

  describe('saveWithMetadata', () => {
    it('should save with full metadata', async () => {
      const buffer = Buffer.from('fake image');
      const metadata = {
        promptText: 'A beautiful sunset',
        styleModifier: 'cyberpunk',
        width: 1920,
        height: 1080,
      };

      const result = await cache.saveWithMetadata('abc123', buffer, metadata);

      expect(mockSupabase._mockDb.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt_hash: 'abc123',
          prompt_text: 'A beautiful sunset',
          style_modifier: 'cyberpunk',
          width: 1920,
          height: 1080,
        }),
        expect.any(Object)
      );
      expect(result).toBe('https://example.com/cache/abc123.png');
    });

    it('should use default dimensions when not provided', async () => {
      const buffer = Buffer.from('data');
      const metadata = { promptText: 'Test' };

      await cache.saveWithMetadata('abc123', buffer, metadata);

      expect(mockSupabase._mockDb.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1024,
          height: 1024,
        }),
        expect.any(Object)
      );
    });
  });
});
