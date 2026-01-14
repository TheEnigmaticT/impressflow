import type { LayoutType } from '../../types.js';

/**
 * Valid layout types
 */
const VALID_LAYOUTS: LayoutType[] = [
  'single',
  'two-column',
  'three-column',
  'image-left',
  'image-right',
  'full-bleed',
  'title-only',
  'quote',
];

/**
 * Detect layout directive from slide content
 *
 * Looks for directive blocks like:
 * ::: two-column
 * content
 * :::
 */
export function detectLayout(slideContent: string): LayoutType {
  // Check for explicit layout directive
  const directiveMatch = slideContent.match(/^:::\s*([\w-]+)\s*$/m);

  if (directiveMatch) {
    const layoutName = directiveMatch[1] as LayoutType;
    if (VALID_LAYOUTS.includes(layoutName)) {
      return layoutName;
    }
  }

  // Auto-detect based on content
  return inferLayout(slideContent);
}

/**
 * Infer layout from content structure
 */
function inferLayout(content: string): LayoutType {
  const lines = content.split('\n').filter((l) => l.trim());

  // Check for quote layout (starts with blockquote)
  if (content.trim().startsWith('>')) {
    return 'quote';
  }

  // Check for title-only (only has an H1 and maybe a subtitle)
  const h1Match = content.match(/^#\s+(.+)$/m);
  const h2Match = content.match(/^##\s+(.+)$/m);
  const otherContent = content
    .replace(/^#\s+.+$/m, '')
    .replace(/^##\s+.+$/m, '')
    .trim();

  if (h1Match && !otherContent) {
    return 'title-only';
  }

  // Check for image layouts
  const hasImage = content.includes('![');
  if (hasImage) {
    // Check for image:left or image:right hints
    if (content.includes('![image:left') || content.includes('![left:')) {
      return 'image-left';
    }
    if (content.includes('![image:right') || content.includes('![right:')) {
      return 'image-right';
    }
  }

  // Default to single layout
  return 'single';
}

/**
 * Extract content from layout directive blocks
 */
export function extractLayoutContent(slideContent: string): {
  layout: LayoutType;
  content: string;
  columns?: string[];
} {
  const layout = detectLayout(slideContent);

  // Check for directive block
  const directiveRegex = /^:::\s*([\w-]+)\s*$([\s\S]*?)^:::\s*$/gm;
  const match = directiveRegex.exec(slideContent);

  if (match) {
    const innerContent = match[2].trim();

    // For multi-column layouts, split on ### headers or column markers
    if (layout === 'two-column' || layout === 'three-column') {
      const columns = splitColumns(innerContent, layout === 'three-column' ? 3 : 2);
      return { layout, content: innerContent, columns };
    }

    return { layout, content: innerContent };
  }

  return { layout, content: slideContent };
}

/**
 * Split content into columns for multi-column layouts
 */
function splitColumns(content: string, numColumns: number): string[] {
  // Try to split on ### headers first
  const parts = content.split(/^###\s*/m).filter((p) => p.trim());

  if (parts.length >= numColumns) {
    return parts.slice(0, numColumns).map((p) => p.trim());
  }

  // Fall back to splitting on column markers
  const columnMarkerParts = content.split(/^---column---$/m).filter((p) => p.trim());

  if (columnMarkerParts.length >= numColumns) {
    return columnMarkerParts.slice(0, numColumns).map((p) => p.trim());
  }

  // If we can't split, return the whole content as the first column
  const result = [content.trim()];
  while (result.length < numColumns) {
    result.push('');
  }

  return result;
}
