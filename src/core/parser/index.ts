import { marked } from 'marked';
import type { SlideAST, Frontmatter, Slide, LayoutType } from '../../types.js';
import { extractFrontmatter } from './frontmatter.js';
import { splitIntoSlides } from './slides.js';
import { detectLayout } from './layouts.js';
import { parseImages } from './images.js';

/**
 * Parse markdown content into a SlideAST
 */
export function parseMarkdown(content: string): SlideAST {
  const { frontmatter, body } = extractFrontmatter(content);
  const rawSlides = splitIntoSlides(body);

  const slides: Slide[] = rawSlides.map((raw, index) => ({
    index,
    title: extractTitle(raw),
    content: parseContent(raw),
    layout: detectLayout(raw),
    images: parseImages(raw, index),
    notes: extractNotes(raw),
  }));

  return { frontmatter, slides };
}

/**
 * Extract title from slide content (first H1 header)
 */
function extractTitle(slideContent: string): string {
  const match = slideContent.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Parse slide content from markdown to HTML
 */
function parseContent(slideContent: string): string {
  // Remove speaker notes before parsing
  const contentWithoutNotes = slideContent.replace(/<!--\s*NOTES:\s*[\s\S]*?-->/gi, '');

  // Remove layout directives for cleaner output
  const contentWithoutDirectives = contentWithoutNotes.replace(
    /^:::\s*[\w-]+\s*$[\s\S]*?^:::\s*$/gm,
    (match) => {
      // Keep the content inside the directive, just remove the markers
      return match.replace(/^:::\s*[\w-]+\s*$/m, '').replace(/^:::\s*$/m, '').trim();
    }
  );

  // Parse markdown to HTML
  const html = marked.parse(contentWithoutDirectives, { async: false }) as string;

  return html.trim();
}

/**
 * Extract speaker notes from HTML comments
 *
 * Syntax: <!-- NOTES: speaker notes here -->
 */
function extractNotes(slideContent: string): string {
  const match = slideContent.match(/<!--\s*NOTES:\s*([\s\S]*?)-->/i);
  return match ? match[1].trim() : '';
}

// Re-export sub-modules
export { extractFrontmatter } from './frontmatter.js';
export { splitIntoSlides } from './slides.js';
export { detectLayout, extractLayoutContent } from './layouts.js';
export { parseImages, extractImageReferences, replaceImagePlaceholders } from './images.js';
