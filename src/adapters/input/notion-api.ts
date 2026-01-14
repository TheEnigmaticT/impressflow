import { Client } from '@notionhq/client';
import type { SlideAST, Slide } from '../../types.js';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints.js';

/**
 * Parse a private Notion page via the API
 */
export async function parseNotionPrivate(
  pageUrl: string,
  accessToken: string
): Promise<SlideAST> {
  const notion = new Client({ auth: accessToken });

  // Extract page ID from URL
  const pageId = extractPageId(pageUrl);

  // Fetch page metadata
  const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
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

/**
 * Extract page ID from various Notion URL formats
 */
export function extractPageId(url: string): string {
  // Handle formats:
  // https://www.notion.so/workspace/Page-Title-abc123def456789012345678901234
  // https://notion.so/abc123def456789012345678901234
  // https://notion.so/abc123de-f456-7890-1234-567890123456

  // First try UUID format with dashes
  const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1].replace(/-/g, '');
  }

  // Try 32-character hex ID at end of path or before query
  const hexMatch = url.match(/([a-f0-9]{32})(?:\?|$|\/)/i);
  if (hexMatch) {
    return hexMatch[1];
  }

  // Try to extract from the path (ID might be at the end of a hyphenated slug)
  const slugMatch = url.match(/-([a-f0-9]{32})(?:\?|$)/i);
  if (slugMatch) {
    return slugMatch[1];
  }

  // Final attempt: look for any 32-char hex string in the URL
  const anyMatch = url.match(/([a-f0-9]{32})/i);
  if (anyMatch) {
    return anyMatch[1];
  }

  throw new Error('Could not extract Notion page ID from URL');
}

/**
 * Extract title from Notion page properties
 */
function extractTitle(page: PageObjectResponse): string {
  const properties = page.properties;

  // Look for a title property
  for (const prop of Object.values(properties)) {
    if (prop.type === 'title' && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join('');
    }
  }

  return 'Untitled';
}

/**
 * Fetch all blocks from a Notion page, including children
 */
async function fetchAllBlocks(
  notion: Client,
  blockId: string
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });

    for (const result of response.results) {
      if ('type' in result) {
        blocks.push(result as BlockObjectResponse);
      }
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  // Recursively fetch children for blocks that have them
  for (const block of blocks) {
    if (block.has_children) {
      const children = await fetchAllBlocks(notion, block.id);
      (block as any).children = children;
    }
  }

  return blocks;
}

/**
 * Convert Notion API blocks to slides
 */
function notionBlocksToSlides(blocks: BlockObjectResponse[]): Slide[] {
  const slides: Slide[] = [];
  let currentSlide: Partial<Slide> | null = null;
  let contentBuffer: string[] = [];

  for (const block of blocks) {
    const blockType = block.type;

    if (blockType === 'heading_1' || blockType === 'divider') {
      // Save current slide
      if (currentSlide) {
        currentSlide.content = contentBuffer.join('\n');
        slides.push(currentSlide as Slide);
      }

      // Start new slide
      currentSlide = {
        index: slides.length,
        title:
          blockType === 'heading_1'
            ? getRichText((block as any).heading_1.rich_text)
            : '',
        layout: 'single',
        images: [],
        notes: '',
      };
      contentBuffer = [];
    } else if (currentSlide) {
      const html = notionBlockToHTML(block);
      if (html) {
        contentBuffer.push(html);
      }
    } else {
      // First content before any heading - create initial slide
      currentSlide = {
        index: 0,
        title: '',
        layout: 'single',
        images: [],
        notes: '',
      };
      const html = notionBlockToHTML(block);
      if (html) {
        contentBuffer.push(html);
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
 * Extract plain text from rich text array
 */
function getRichText(richText: RichTextItemResponse[]): string {
  return richText.map((t) => t.plain_text).join('');
}

/**
 * Convert a Notion block to HTML
 */
function notionBlockToHTML(block: BlockObjectResponse): string {
  const type = block.type;

  switch (type) {
    case 'paragraph':
      return `<p>${getRichText((block as any).paragraph.rich_text)}</p>`;
    case 'heading_2':
      return `<h2>${getRichText((block as any).heading_2.rich_text)}</h2>`;
    case 'heading_3':
      return `<h3>${getRichText((block as any).heading_3.rich_text)}</h3>`;
    case 'bulleted_list_item':
      return `<li>${getRichText((block as any).bulleted_list_item.rich_text)}</li>`;
    case 'numbered_list_item':
      return `<li>${getRichText((block as any).numbered_list_item.rich_text)}</li>`;
    case 'quote':
      return `<blockquote>${getRichText((block as any).quote.rich_text)}</blockquote>`;
    case 'code': {
      const codeBlock = (block as any).code;
      return `<pre><code class="language-${codeBlock.language}">${getRichText(codeBlock.rich_text)}</code></pre>`;
    }
    case 'image': {
      const imageBlock = (block as any).image;
      const url =
        imageBlock.type === 'external' ? imageBlock.external.url : imageBlock.file.url;
      return `<img src="${url}" alt="">`;
    }
    case 'callout': {
      const calloutBlock = (block as any).callout;
      const icon = calloutBlock.icon?.emoji || '';
      return `<div class="callout">${icon} ${getRichText(calloutBlock.rich_text)}</div>`;
    }
    case 'toggle': {
      const toggleBlock = (block as any).toggle;
      return `<details><summary>${getRichText(toggleBlock.rich_text)}</summary></details>`;
    }
    default:
      return '';
  }
}
