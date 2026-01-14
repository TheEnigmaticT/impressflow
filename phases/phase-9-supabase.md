# Phase 9: Supabase Integration

**Completion Promise:** `<promise>PHASE_9_COMPLETE</promise>`

## Scope
Implement Supabase storage, database, and edge functions for web app.

## Tasks
1. Create Supabase project config (config.toml)
2. Create database migration (001_initial.sql)
3. Implement SupabaseImageCache adapter
4. Implement SupabaseStorage adapter
5. Create generate-presentation edge function
6. Create generate-image edge function
7. Create notion-oauth-callback edge function
8. Test with local Supabase (docker-compose)

## Project Setup

### Initialize Supabase

```bash
npx supabase init
```

### config.toml

```toml
[api]
enabled = true
port = 54321
schemas = ["public"]

[db]
port = 54322

[storage]
enabled = true
file_size_limit = "50MiB"
```

## Database Migration

```sql
-- supabase/migrations/001_initial.sql

-- Presentations table
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('markdown', 'notion_published', 'notion_private')),
  source_url TEXT,
  notion_page_id TEXT,
  theme TEXT NOT NULL DEFAULT 'tech-dark',
  layout TEXT NOT NULL DEFAULT 'spiral',
  image_style TEXT NOT NULL DEFAULT 'flat-vector',
  storage_path TEXT NOT NULL,
  slide_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX presentations_user_id_idx ON presentations(user_id);
CREATE INDEX presentations_notion_page_id_idx ON presentations(notion_page_id);

-- Image cache tracking
CREATE TABLE image_cache (
  prompt_hash TEXT PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  style TEXT NOT NULL,
  theme TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notion OAuth tokens
CREATE TABLE notion_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  workspace_id TEXT,
  workspace_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own presentations"
  ON presentations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presentations"
  ON presentations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presentations"
  ON presentations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presentations"
  ON presentations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own Notion connection"
  ON notion_connections FOR ALL USING (auth.uid() = user_id);
```

## Supabase Storage Adapter

```typescript
// src/adapters/storage/supabase.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter } from '../../types';

export class SupabaseStorage implements StorageAdapter {
  constructor(
    private supabase: SupabaseClient,
    private bucket: string = 'presentations'
  ) {}
  
  async save(path: string, content: Buffer | string): Promise<string> {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    const contentType = path.endsWith('.html') ? 'text/html' : 
                        path.endsWith('.json') ? 'application/json' : 
                        'image/png';
    
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true
      });
    
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    
    return path;
  }
  
  async get(path: string): Promise<Buffer | null> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(path);
    
    if (error) return null;
    
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  
  async exists(path: string): Promise<boolean> {
    const { data } = await this.supabase.storage
      .from(this.bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      });
    
    return (data?.length ?? 0) > 0;
  }
  
  async getPublicUrl(path: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}
```

## Supabase Image Cache

```typescript
// src/adapters/images/supabase-cache.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { ImageCache } from '../../types';

export class SupabaseImageCache implements ImageCache {
  constructor(private supabase: SupabaseClient) {}
  
  async exists(promptHash: string): Promise<boolean> {
    const { data } = await this.supabase.storage
      .from('image_cache')
      .list('', { search: `${promptHash}.png` });
    
    return (data?.length ?? 0) > 0;
  }
  
  async get(promptHash: string): Promise<string | null> {
    if (await this.exists(promptHash)) {
      const { data } = this.supabase.storage
        .from('image_cache')
        .getPublicUrl(`${promptHash}.png`);
      
      return data.publicUrl;
    }
    return null;
  }
  
  async save(promptHash: string, buffer: Buffer): Promise<string> {
    const { error } = await this.supabase.storage
      .from('image_cache')
      .upload(`${promptHash}.png`, buffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) throw new Error(`Cache save failed: ${error.message}`);
    
    const { data } = this.supabase.storage
      .from('image_cache')
      .getPublicUrl(`${promptHash}.png`);
    
    return data.publicUrl;
  }
}
```

## Edge Function: Generate Presentation

```typescript
// supabase/functions/generate-presentation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GenerateRequest {
  source: 'markdown' | 'notion_published' | 'notion_private';
  input: string;
  theme?: string;
  layout?: string;
  imageStyle?: string;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body: GenerateRequest = await req.json();
    
    // Import core modules (would need bundling for Deno)
    // For now, this is pseudocode showing the structure
    const slides = await parseInput(body.source, body.input, supabase, user.id);
    
    const presentationId = crypto.randomUUID();
    const html = await generatePresentation(slides, {
      theme: body.theme ?? 'tech-dark',
      layout: body.layout ?? 'spiral',
      lazyImages: true,
      apiEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-image`
    });
    
    // Save to storage
    const storagePath = `${user.id}/${presentationId}`;
    await supabase.storage
      .from('presentations')
      .upload(`${storagePath}/index.html`, html, { contentType: 'text/html' });
    
    // Save to database
    await supabase.from('presentations').insert({
      id: presentationId,
      user_id: user.id,
      title: slides[0]?.title ?? 'Untitled',
      source_type: body.source,
      source_url: body.source !== 'markdown' ? body.input : null,
      theme: body.theme ?? 'tech-dark',
      layout: body.layout ?? 'spiral',
      image_style: body.imageStyle ?? 'flat-vector',
      storage_path: storagePath,
      slide_count: slides.length
    });
    
    const { data: urlData } = supabase.storage
      .from('presentations')
      .getPublicUrl(`${storagePath}/index.html`);
    
    return new Response(JSON.stringify({
      id: presentationId,
      url: urlData.publicUrl,
      slideCount: slides.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## Edge Function: Generate Image

```typescript
// supabase/functions/generate-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { promptHash, prompt, theme, style } = await req.json();
  
  // Check cache
  const { data: cached } = await supabase.storage
    .from('image_cache')
    .list('', { search: `${promptHash}.png` });
  
  if (cached && cached.length > 0) {
    const { data } = supabase.storage
      .from('image_cache')
      .getPublicUrl(`${promptHash}.png`);
    return new Response(JSON.stringify({ url: data.publicUrl }));
  }
  
  // Generate with Gemini
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-image',
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
  });
  
  const enhancedPrompt = `${prompt}, ${style}, presentation slide graphic`;
  const result = await model.generateContent(enhancedPrompt);
  
  const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/')
  );
  
  if (!imagePart?.inlineData?.data) {
    return new Response(JSON.stringify({ error: 'No image generated' }), { status: 500 });
  }
  
  // Decode and save
  const buffer = Uint8Array.from(atob(imagePart.inlineData.data), c => c.charCodeAt(0));
  
  await supabase.storage
    .from('image_cache')
    .upload(`${promptHash}.png`, buffer, { contentType: 'image/png', upsert: true });
  
  const { data } = supabase.storage.from('image_cache').getPublicUrl(`${promptHash}.png`);
  
  return new Response(JSON.stringify({ url: data.publicUrl }));
});
```

## Tests

```typescript
// tests/adapters/supabase.test.ts
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client for testing
const mockSupabase = {
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      download: vi.fn().mockResolvedValue({ data: new Blob(['test']), error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.png' } }),
    })),
  },
  from: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  })),
};

describe('Supabase Integration', () => {
  it('saves presentation to storage', async () => {
    const storage = new SupabaseStorage(mockSupabase as any);
    const path = await storage.save('test/index.html', '<html></html>');
    expect(path).toBe('test/index.html');
  });

  it('retrieves public URL', async () => {
    const storage = new SupabaseStorage(mockSupabase as any);
    const url = await storage.getPublicUrl('test/index.html');
    expect(url).toContain('https://');
  });

  it('caches image by prompt hash', async () => {
    const cache = new SupabaseImageCache(mockSupabase as any);
    const url = await cache.save('abc123', Buffer.from('test'));
    expect(url).toContain('https://');
  });
});
```

## Local Testing

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Serve functions locally
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/generate-presentation \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"source": "markdown", "input": "# Test\nContent"}'
```

## Verification

```bash
npm run typecheck && npm run test -- tests/adapters/supabase.test.ts
supabase functions serve  # Should start without errors
```
