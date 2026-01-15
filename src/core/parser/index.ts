import { marked } from 'marked';
import type { SlideAST, Frontmatter, Slide, LayoutType } from '../../types.js';
import { extractFrontmatter } from './frontmatter.js';
import { splitIntoSlides, splitIntoSlidesWithDirections } from './slides.js';
import { detectLayout } from './layouts.js';
import { parseImages } from './images.js';

// Supported transform types for word-level animations
const TRANSFORM_TYPES = ['appear', 'reveal', 'slideup', 'slideleft', 'skew', 'glow', 'big', 'highlight'];

/**
 * Extended SlideAST with direction markers for line layout
 */
export interface SlideASTWithDirections extends SlideAST {
  directions: Array<'right' | 'down'>;
}

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
 * Parse markdown content into a SlideAST with direction markers
 * Use this for line layout which supports ^ markers for vertical drops
 */
export function parseMarkdownWithDirections(content: string): SlideASTWithDirections {
  const { frontmatter, body } = extractFrontmatter(content);
  const { slides: rawSlides, directions } = splitIntoSlidesWithDirections(body);

  const slides: Slide[] = rawSlides.map((raw, index) => ({
    index,
    title: extractTitle(raw),
    content: parseContent(raw),
    layout: detectLayout(raw),
    images: parseImages(raw, index),
    notes: extractNotes(raw),
  }));

  return { frontmatter, slides, directions };
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

  // Process transform blocks first (before other directives)
  const contentWithTransforms = parseTransformBlocks(contentWithoutNotes);

  // Remove remaining layout directives for cleaner output
  const contentWithoutDirectives = contentWithTransforms.replace(
    /^:::\s*(?!transform-)[\w-]+\s*$[\s\S]*?^:::\s*$/gm,
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
 * Parse transform blocks for word-level animations
 *
 * Syntax:
 *   ::: transform-appear
 *   This text will >>>fade in<<< word by word
 *   :::
 *
 * Supported transforms: appear, reveal, slideup, slideleft, skew, glow, big, highlight
 */
function parseTransformBlocks(content: string): string {
  const transformRegex = /:::\s*transform-(\w+)\s*\n([\s\S]*?)\n\s*:::/g;

  return content.replace(transformRegex, (match, transformType: string, blockContent: string) => {
    // Validate transform type
    if (!TRANSFORM_TYPES.includes(transformType)) {
      return match; // Return unchanged if unknown transform
    }

    // Process word markers: >>>text<<< becomes <span class="substep substep-{type}">text</span>
    let substepIndex = 0;
    const processedContent = blockContent.replace(/>>>([^<]+)<<</g, (_markerMatch, text: string) => {
      substepIndex++;
      return `<span class="substep substep-${transformType}" data-substep="${substepIndex}">${text}</span>`;
    });

    // Wrap in a div with transform class
    return `<div class="transform-block transform-${transformType}">\n${processedContent}\n</div>`;
  });
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

// Export transform constants
export { TRANSFORM_TYPES };

// Re-export sub-modules
export { extractFrontmatter } from './frontmatter.js';
export { splitIntoSlides, splitIntoSlidesWithDirections } from './slides.js';
export type { SplitResult } from './slides.js';
export { detectLayout, extractLayoutContent } from './layouts.js';
export { parseImages, extractImageReferences, replaceImagePlaceholders } from './images.js';
