import matter from 'gray-matter';
import type { Frontmatter } from '../../types.js';

/**
 * Default frontmatter values
 */
const DEFAULT_FRONTMATTER: Frontmatter = {
  theme: 'default',
  transitionDuration: 1000,
  aspectRatio: '16:9',
};

/**
 * Extract and validate frontmatter from markdown content
 */
export function extractFrontmatter(content: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  const { data, content: body } = matter(content);

  const frontmatter: Frontmatter = {
    ...DEFAULT_FRONTMATTER,
    ...data,
  };

  // Validate aspectRatio
  if (
    frontmatter.aspectRatio &&
    frontmatter.aspectRatio !== '16:9' &&
    frontmatter.aspectRatio !== '4:3'
  ) {
    frontmatter.aspectRatio = '16:9';
  }

  // Ensure transitionDuration is a number
  if (typeof frontmatter.transitionDuration === 'string') {
    frontmatter.transitionDuration = parseInt(frontmatter.transitionDuration, 10);
  }

  return { frontmatter, body };
}
