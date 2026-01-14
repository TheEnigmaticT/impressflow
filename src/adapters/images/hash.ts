import { createHash } from 'node:crypto';

/**
 * Generate a hash from a prompt for use as a cache key
 */
export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}
