import type { SlideAST, Slide, ImageRequest } from '../../types.js';

/**
 * Check if a URL is a Notion public/published page
 */
export function isNotionPublicUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith('notion.site') ||
      (parsed.hostname.includes('notion.so') && parsed.pathname.length > 1)
    );
  } catch {
    return false;
  }
}

/**
 * Parse a published Notion page into SlideAST
 */
export async function parseNotionPublished(url: string): Promise<SlideAST> {
  if (!isNotionPublicUrl(url)) {
    throw new Error('Invalid Notion published URL');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch Notion page: ${response.status}`);
  }

  const html = await response.text();
  const { title, blocks } = parseNotionHTML(html);
  const slides = blocksToSlides(blocks);

  return {
    frontmatter: { title },
    slides,
  };
}

interface NotionBlock {
  type: string;
  content: string;
  children?: NotionBlock[];
  url?: string;
  language?: string;
}

/**
 * Parse Notion HTML to extract blocks
 */
function parseNotionHTML(html: string): { title: string; blocks: NotionBlock[] } {
  // Extract title from the page
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch?.[1]?.replace(' | Notion', '').trim() || 'Untitled';

  const blocks: NotionBlock[] = [];

  // Notion uses specific CSS classes for different block types
  // This is a simplified parser - production would use a proper HTML parser

  // Extract heading_1 blocks (new slides)
  const h1Pattern =
    /class="[^"]*notion-header-block[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi;
  let match;
  while ((match = h1Pattern.exec(html)) !== null) {
    blocks.push({ type: 'heading-1', content: match[1].trim() });
  }

  // Extract text blocks
  const textPattern =
    /class="[^"]*notion-text-block[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi;
  while ((match = textPattern.exec(html)) !== null) {
    blocks.push({ type: 'paragraph', content: match[1].trim() });
  }

  // Extract bulleted lists
  const bulletPattern =
    /class="[^"]*notion-bulleted_list[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi;
  while ((match = bulletPattern.exec(html)) !== null) {
    blocks.push({ type: 'bulleted-list-item', content: match[1].trim() });
  }

  // Extract dividers
  const dividerPattern = /class="[^"]*notion-divider-block[^"]*"/gi;
  while ((match = dividerPattern.exec(html)) !== null) {
    blocks.push({ type: 'divider', content: '' });
  }

  // Extract images
  const imagePattern = /class="[^"]*notion-image-block[^"]*"[\s\S]*?src="([^"]+)"/gi;
  while ((match = imagePattern.exec(html)) !== null) {
    blocks.push({ type: 'image', content: '', url: match[1] });
  }

  // Extract code blocks
  const codePattern =
    /class="[^"]*notion-code-block[^"]*"[\s\S]*?<code[^>]*>([^<]+)<\/code>/gi;
  while ((match = codePattern.exec(html)) !== null) {
    blocks.push({ type: 'code', content: match[1], language: 'text' });
  }

  // If no blocks found, create a single slide from the title
  if (blocks.length === 0 && title !== 'Untitled') {
    blocks.push({ type: 'heading-1', content: title });
  }

  return { title, blocks };
}

/**
 * Convert blocks to slides, splitting on heading_1 and divider
 */
export function blocksToSlides(blocks: NotionBlock[]): Slide[] {
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

      // Track images
      if (block.type === 'image' && block.url) {
        // External images don't need generation
        currentSlide.images = currentSlide.images || [];
      }
    } else {
      // First block but no slide yet - create one
      currentSlide = {
        index: 0,
        title: block.type === 'heading-1' ? block.content : '',
        layout: 'single',
        images: [],
        notes: '',
      };
      if (block.type !== 'heading-1') {
        contentBuffer.push(blockToHTML(block));
      }
    }
  }

  // Don't forget last slide
  if (currentSlide) {
    currentSlide.content = contentBuffer.join('\n');
    slides.push(currentSlide as Slide);
  }

  return slides;
}

/**
 * Convert a single block to HTML
 */
function blockToHTML(block: NotionBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${escapeHtml(block.content)}</p>`;
    case 'heading-2':
      return `<h2>${escapeHtml(block.content)}</h2>`;
    case 'heading-3':
      return `<h3>${escapeHtml(block.content)}</h3>`;
    case 'bulleted-list-item':
      return `<li>${escapeHtml(block.content)}</li>`;
    case 'numbered-list-item':
      return `<li>${escapeHtml(block.content)}</li>`;
    case 'quote':
      return `<blockquote>${escapeHtml(block.content)}</blockquote>`;
    case 'code':
      return `<pre><code class="language-${block.language || 'text'}">${escapeHtml(block.content)}</code></pre>`;
    case 'image':
      return block.url ? `<img src="${escapeHtml(block.url)}" alt="">` : '';
    case 'callout':
      return `<div class="callout">${escapeHtml(block.content)}</div>`;
    default:
      return block.content ? `<p>${escapeHtml(block.content)}</p>` : '';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
