import type { SlideAST } from '../../types.js';
import { parseFile, isFilePath } from './file.js';
import { parseNotionPublished, isNotionPublicUrl } from './notion-public.js';
import { parseNotionPrivate } from './notion-api.js';

export type InputSource = 'file' | 'notion-public' | 'notion-api';

export interface ParseOptions {
  notionToken?: string;
}

/**
 * Detect the input source type from the input string
 */
export function detectInputSource(input: string): InputSource {
  // Check for Notion URLs
  try {
    const url = new URL(input);
    // notion.site URLs are always public/published
    if (url.hostname.endsWith('notion.site')) {
      return 'notion-public';
    }
    // notion.so URLs require API access (private by default)
    if (url.hostname.includes('notion.so')) {
      return 'notion-api';
    }
  } catch {
    // Not a valid URL, treat as file path
  }
  return 'file';
}

/**
 * Parse input from any supported source into SlideAST
 */
export async function parseInput(
  input: string,
  options: ParseOptions = {}
): Promise<SlideAST> {
  const source = detectInputSource(input);

  switch (source) {
    case 'file':
      return parseFile(input);

    case 'notion-public':
      return parseNotionPublished(input);

    case 'notion-api':
      if (!options.notionToken) {
        throw new Error(
          'Notion API token required. Set NOTION_TOKEN environment variable or pass --notion-token.'
        );
      }
      return parseNotionPrivate(input, options.notionToken);

    default:
      throw new Error(`Unknown input source: ${source}`);
  }
}

// Re-export individual parsers
export { parseFile, isFilePath } from './file.js';
export { parseNotionPublished, isNotionPublicUrl, blocksToSlides } from './notion-public.js';
export { parseNotionPrivate, extractPageId } from './notion-api.js';
