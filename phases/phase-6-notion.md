# Phase 6: Notion Input Adapters

**Completion Promise:** `<promise>PHASE_6_COMPLETE</promise>`

## Scope
Parse Notion published pages and Notion API content into SlideAST.

## Tasks
1. Implement Notion published page fetcher (HTTP scrape)
2. Parse Notion HTML to SlideAST
3. Implement Notion API adapter with @notionhq/client
4. Map Notion block types to slide content
5. Handle Notion-specific formatting (callouts, toggles, etc.)
6. Extract images from Notion (use external URLs)

## Files to Create

```
src/adapters/input/
├── index.ts              # Input router
├── file.ts               # Local file reader (already done)
├── notion-public.ts      # Published page scraper
└── notion-api.ts         # Notion API client
```

## Notion Block Type Mapping

| Notion Block | ImpressFlow Equivalent |
|--------------|------------------------|
| `heading_1` | New slide (title) |
| `heading_2` | Section header within slide |
| `heading_3` | Subheader |
| `paragraph` | Paragraph text |
| `bulleted_list_item` | Bullet point |
| `numbered_list_item` | Numbered list |
| `quote` | Blockquote callout |
| `code` | Code block |
| `image` | Image (external URL) |
| `callout` | Styled callout box |
| `divider` | Slide break |
| `column_list` | Multi-column layout |

## Published Page Scraper

```typescript
// src/adapters/input/notion-public.ts
import { SlideAST, Slide, Frontmatter } from '../../types';

export async function parseNotionPublished(url: string): Promise<SlideAST> {
  // Validate URL
  if (!isNotionPublicUrl(url)) {
    throw new Error('Invalid Notion published URL');
  }
  
  // Fetch the page
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch Notion page: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Parse HTML to extract content
  const { title, blocks } = parseNotionHTML(html);
  
  // Convert blocks to slides
  const slides = blocksToSlides(blocks);
  
  return {
    frontmatter: { title },
    slides,
  };
}

function isNotionPublicUrl(url: string): boolean {
  return url.includes('notion.site') || 
         url.includes('notion.so') && url.includes('/');
}

interface NotionBlock {
  type: string;
  content: string;
  children?: NotionBlock[];
  url?: string;  // For images
  language?: string;  // For code blocks
}

function parseNotionHTML(html: string): { title: string; blocks: NotionBlock[] } {
  // Notion renders content in specific class patterns
  // This is a simplified parser - real implementation needs JSDOM or similar
  
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch?.[1]?.replace(' | Notion', '') || 'Untitled';
  
  const blocks: NotionBlock[] = [];
  
  // Extract content blocks from Notion's rendered HTML
  // Look for data-block-id attributes and class patterns
  const blockPattern = /class="notion-([a-z_]+)-block"[^>]*>([^<]*)/g;
  let match;
  
  while ((match = blockPattern.exec(html)) !== null) {
    const [, type, content] = match;
    blocks.push({ type: type.replace('_', '-'), content: content.trim() });
  }
  
  return { title, blocks };
}

function blocksToSlides(blocks: NotionBlock[]): Slide[] {
  const slides: Slide[] = [];
  let currentSlide: Partial<Slide> | null = null;
  let contentBuffer: string[] = [];
  
  for (const block of blocks) {
    if (block.type === 'heading-1' || block.type === 'divider') {
      // Save current slide
      if (currentSlide) {
        currentSlide.content = contentBuffer.join('\n');
        slides.push(currentSlide as Slide);
      }
      
      // Start new slide
      currentSlide = {
        index: slides.length,
        title: block.type === 'heading-1' ? block.content : '',
        layout: 'single',
        images: [],
        notes: '',
      };
      contentBuffer = [];
    } else if (currentSlide) {
      contentBuffer.push(blockToHTML(block));
    }
  }
  
  // Don't forget last slide
  if (currentSlide) {
    currentSlide.content = contentBuffer.join('\n');
    slides.push(currentSlide as Slide);
  }
  
  return slides;
}

function blockToHTML(block: NotionBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${block.content}</p>`;
    case 'heading-2':
      return `<h2>${block.content}</h2>`;
    case 'heading-3':
      return `<h3>${block.content}</h3>`;
    case 'bulleted-list-item':
      return `<li>${block.content}</li>`;
    case 'quote':
      return `<blockquote>${block.content}</blockquote>`;
    case 'code':
      return `<pre><code class="language-${block.language || 'text'}">${block.content}</code></pre>`;
    case 'image':
      return `<img src="${block.url}" alt="">`;
    case 'callout':
      return `<div class="callout">${block.content}</div>`;
    default:
      return `<p>${block.content}</p>`;
  }
}
```

## Notion API Adapter

```typescript
// src/adapters/input/notion-api.ts
import { Client } from '@notionhq/client';
import { SlideAST, Slide } from '../../types';

export async function parseNotionPrivate(
  pageUrl: string, 
  accessToken: string
): Promise<SlideAST> {
  const notion = new Client({ auth: accessToken });
  
  // Extract page ID from URL
  const pageId = extractPageId(pageUrl);
  
  // Fetch page metadata
  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = extractTitle(page);
  
  // Fetch all blocks
  const blocks = await fetchAllBlocks(notion, pageId);
  
  // Convert to slides
  const slides = notionBlocksToSlides(blocks);
  
  return {
    frontmatter: { title },
    slides,
  };
}

function extractPageId(url: string): string {
  // Handle various Notion URL formats
  // https://www.notion.so/workspace/Page-Title-abc123def456
  // https://notion.so/abc123def456
  const match = url.match(/([a-f0-9]{32}|[a-f0-9-]{36})(?:\?|$)/i);
  if (!match) {
    throw new Error('Could not extract Notion page ID from URL');
  }
  return match[1].replace(/-/g, '');
}

async function fetchAllBlocks(notion: Client, blockId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;
  
  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    
    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  
  // Recursively fetch children for blocks that have them
  for (const block of blocks) {
    if (block.has_children) {
      block.children = await fetchAllBlocks(notion, block.id);
    }
  }
  
  return blocks;
}

function notionBlocksToSlides(blocks: any[]): Slide[] {
  const slides: Slide[] = [];
  let currentSlide: Partial<Slide> | null = null;
  let contentBuffer: string[] = [];
  
  for (const block of blocks) {
    const blockType = block.type;
    
    if (blockType === 'heading_1' || blockType === 'divider') {
      if (currentSlide) {
        currentSlide.content = contentBuffer.join('\n');
        slides.push(currentSlide as Slide);
      }
      
      currentSlide = {
        index: slides.length,
        title: blockType === 'heading_1' ? getRichText(block.heading_1.rich_text) : '',
        layout: 'single',
        images: [],
        notes: '',
      };
      contentBuffer = [];
    } else if (currentSlide) {
      contentBuffer.push(notionBlockToHTML(block));
      
      // Check for images
      if (blockType === 'image') {
        const imageUrl = block.image.type === 'external' 
          ? block.image.external.url 
          : block.image.file.url;
        currentSlide.images!.push({
          prompt: '', // External image, no generation needed
          slideIndex: currentSlide.index!,
          imageIndex: currentSlide.images!.length,
        });
      }
    }
  }
  
  if (currentSlide) {
    currentSlide.content = contentBuffer.join('\n');
    slides.push(currentSlide as Slide);
  }
  
  return slides;
}

function getRichText(richText: any[]): string {
  return richText.map(t => t.plain_text).join('');
}

function notionBlockToHTML(block: any): string {
  const type = block.type;
  
  switch (type) {
    case 'paragraph':
      return `<p>${getRichText(block.paragraph.rich_text)}</p>`;
    case 'heading_2':
      return `<h2>${getRichText(block.heading_2.rich_text)}</h2>`;
    case 'heading_3':
      return `<h3>${getRichText(block.heading_3.rich_text)}</h3>`;
    case 'bulleted_list_item':
      return `<li>${getRichText(block.bulleted_list_item.rich_text)}</li>`;
    case 'numbered_list_item':
      return `<li>${getRichText(block.numbered_list_item.rich_text)}</li>`;
    case 'quote':
      return `<blockquote>${getRichText(block.quote.rich_text)}</blockquote>`;
    case 'code':
      return `<pre><code class="language-${block.code.language}">${getRichText(block.code.rich_text)}</code></pre>`;
    case 'image':
      const url = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
      return `<img src="${url}" alt="">`;
    case 'callout':
      return `<div class="callout">${block.callout.icon?.emoji || ''} ${getRichText(block.callout.rich_text)}</div>`;
    default:
      return '';
  }
}
```

## Tests

```typescript
// tests/adapters/notion-public.test.ts
describe('Notion Published Parser', () => {
  it('validates Notion public URL', () => {
    expect(isNotionPublicUrl('https://my-site.notion.site/Page-123')).toBe(true);
    expect(isNotionPublicUrl('https://google.com')).toBe(false);
  });

  it('extracts page ID from URL', () => {
    expect(extractPageId('https://notion.so/Page-abc123def456789012345678901234')).toBe('abc123def456789012345678901234');
  });

  it('converts H1 blocks to slides', () => {
    const blocks = [
      { type: 'heading-1', content: 'Slide 1' },
      { type: 'paragraph', content: 'Content' },
      { type: 'heading-1', content: 'Slide 2' },
    ];
    const slides = blocksToSlides(blocks);
    expect(slides).toHaveLength(2);
  });

  it('outputs standard SlideAST format', async () => {
    // Mock fetch for testing
    const result = await parseNotionPublished('https://test.notion.site/Test-123');
    expect(result).toHaveProperty('frontmatter');
    expect(result).toHaveProperty('slides');
    expect(result.slides[0]).toHaveProperty('index');
    expect(result.slides[0]).toHaveProperty('title');
    expect(result.slides[0]).toHaveProperty('content');
  });
});
```

## Verification

```bash
npm run typecheck && npm run test -- tests/adapters/notion-public.test.ts
```
