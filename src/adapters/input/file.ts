import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseMarkdown } from '../../core/parser/index.js';
import type { SlideAST } from '../../types.js';

/**
 * Parse a local markdown file into a SlideAST
 */
export function parseFile(filePath: string): SlideAST {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(absolutePath, 'utf-8');

  if (!content.trim()) {
    throw new Error('File is empty');
  }

  return parseMarkdown(content);
}

/**
 * Check if a string looks like a file path
 */
export function isFilePath(input: string): boolean {
  return (
    input.endsWith('.md') ||
    input.endsWith('.markdown') ||
    input.startsWith('./') ||
    input.startsWith('/') ||
    input.startsWith('~/')
  );
}
