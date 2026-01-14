import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseStorage } from '../../../src/adapters/storage/supabase.js';

// Mock Supabase client
const createMockSupabase = () => {
  const storage = {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn().mockResolvedValue({ error: null }),
    download: vi.fn().mockResolvedValue({
      data: new Blob(['test content']),
      error: null,
    }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/test.html' },
    }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  };

  return {
    storage: {
      from: vi.fn(() => storage),
    },
  };
};

describe('SupabaseStorage', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let storage: SupabaseStorage;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    storage = new SupabaseStorage(mockSupabase as unknown as Parameters<typeof SupabaseStorage>[0], 'test-bucket');
  });

  describe('save', () => {
    it('should save string content to storage', async () => {
      const result = await storage.save('test.html', '<html></html>');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(result).toBe('https://example.com/test.html');
    });

    it('should save buffer content to storage', async () => {
      const buffer = Buffer.from('binary content');
      const result = await storage.save('image.png', buffer);

      expect(result).toBe('https://example.com/test.html');
    });

    it('should throw error on upload failure', async () => {
      const failingStorage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
          getPublicUrl: vi.fn(),
        }),
      };

      const failingSupabase = { storage: failingStorage };
      const failingAdapter = new SupabaseStorage(
        failingSupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      await expect(failingAdapter.save('test.html', 'content')).rejects.toThrow(
        'Failed to save to Supabase storage: Upload failed'
      );
    });
  });

  describe('get', () => {
    it('should return buffer for existing file', async () => {
      const result = await storage.get('test.html');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should return null for non-existent file', async () => {
      const notFoundStorage = {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Object not found' },
          }),
        }),
      };

      const notFoundSupabase = { storage: notFoundStorage };
      const adapter = new SupabaseStorage(
        notFoundSupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      const result = await adapter.get('nonexistent.html');
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true if file exists in listing', async () => {
      const listingStorage = {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({
            data: [{ name: 'test.html' }],
            error: null,
          }),
        }),
      };

      const listingSupabase = { storage: listingStorage };
      const adapter = new SupabaseStorage(
        listingSupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      const result = await adapter.exists('test.html');
      expect(result).toBe(true);
    });

    it('should return false if file not in listing', async () => {
      const emptyStorage = {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      };

      const emptySupabase = { storage: emptyStorage };
      const adapter = new SupabaseStorage(
        emptySupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      const result = await adapter.exists('missing.html');
      expect(result).toBe(false);
    });
  });

  describe('getPublicUrl', () => {
    it('should return public URL for file', async () => {
      const result = await storage.getPublicUrl('test.html');

      expect(result).toBe('https://example.com/test.html');
    });
  });

  describe('delete', () => {
    it('should delete file from storage', async () => {
      await expect(storage.delete('test.html')).resolves.not.toThrow();
    });

    it('should throw error on delete failure', async () => {
      const failingStorage = {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      };

      const failingSupabase = { storage: failingStorage };
      const adapter = new SupabaseStorage(
        failingSupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      await expect(adapter.delete('test.html')).rejects.toThrow(
        'Failed to delete from Supabase storage: Delete failed'
      );
    });
  });

  describe('list', () => {
    it('should list files in directory', async () => {
      const listingStorage = {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({
            data: [{ name: 'file1.html' }, { name: 'file2.html' }],
            error: null,
          }),
        }),
      };

      const listingSupabase = { storage: listingStorage };
      const adapter = new SupabaseStorage(
        listingSupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      const result = await adapter.list('presentations');
      expect(result).toEqual(['presentations/file1.html', 'presentations/file2.html']);
    });
  });

  describe('getContentType', () => {
    it('should return correct content types for various extensions', async () => {
      // Test is indirect through save - the upload mock receives contentType
      const uploadSpy = vi.fn().mockResolvedValue({ error: null });
      const spyStorage = {
        from: vi.fn().mockReturnValue({
          upload: uploadSpy,
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } }),
        }),
      };

      const spySupabase = { storage: spyStorage };
      const adapter = new SupabaseStorage(
        spySupabase as unknown as Parameters<typeof SupabaseStorage>[0],
        'test'
      );

      await adapter.save('test.html', 'content');
      expect(uploadSpy).toHaveBeenCalledWith(
        'test.html',
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'text/html' })
      );

      await adapter.save('image.png', Buffer.from(''));
      expect(uploadSpy).toHaveBeenCalledWith(
        'image.png',
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'image/png' })
      );
    });
  });
});
