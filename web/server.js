/**
 * Simple development server for the ImpressFlow web app
 * Usage: node web/server.js [port]
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');
const PORT = parseInt(process.argv[2]) || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function serveFile(filePath, res) {
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

/**
 * Extract page ID from various Notion URL formats
 */
function extractNotionPageId(url) {
  // Handle various Notion URL formats:
  // https://www.notion.so/workspace/Page-Title-abc123def456...
  // https://notion.site/Page-Title-abc123def456...
  // https://workspace.notion.site/Page-Title-abc123def456...
  const patterns = [
    /([a-f0-9]{32})(?:\?|$)/i,  // 32 char hex ID
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:\?|$)/i,  // UUID format
    /-([a-f0-9]{32})(?:\?|$)/i,  // ID after last dash
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      // Remove dashes if present and return
      return match[1].replace(/-/g, '');
    }
  }
  return null;
}

/**
 * Fetch Notion page content and convert to markdown
 */
async function fetchNotionPage(pageId) {
  // Use Notion's unofficial API for public pages
  // This fetches the page data without requiring authentication
  const response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Notion page: ${response.status}`);
  }

  const data = await response.json();

  // Convert Notion blocks to markdown
  return notionBlocksToMarkdown(data);
}

/**
 * Extract rich text from Notion properties, preserving formatting
 */
function extractRichText(titleArray) {
  if (!titleArray) return '';

  return titleArray.map(segment => {
    const text = segment[0] || '';
    const formats = segment[1] || [];

    let result = text;

    // Apply formatting
    for (const format of formats) {
      const formatType = format[0];
      switch (formatType) {
        case 'b': // bold
          result = `**${result}**`;
          break;
        case 'i': // italic
          result = `*${result}*`;
          break;
        case 'c': // code
          result = `\`${result}\``;
          break;
        case 'a': // link
          result = `[${result}](${format[1]})`;
          break;
      }
    }

    return result;
  }).join('');
}

/**
 * Convert Notion API blocks to markdown
 */
function notionBlocksToMarkdown(blocks) {
  const lines = [];
  let slideCount = 0;

  for (const [blockId, block] of Object.entries(blocks)) {
    if (!block || !block.value) continue;

    const { type, properties } = block.value;
    const text = extractRichText(properties?.title) || '';

    switch (type) {
      case 'page':
        // Page title becomes first slide
        if (text && slideCount === 0) {
          lines.push(`# ${text}\n`);
          slideCount++;
        }
        break;

      case 'header':
        // H1 creates new slide
        if (slideCount > 0) lines.push('\n---\n');
        lines.push(`# ${text}\n`);
        slideCount++;
        break;

      case 'sub_header':
        // Check if this is a direction marker (^)
        if (text.trim() === '^') {
          lines.push(`^\n`);
        } else {
          lines.push(`## ${text}\n`);
        }
        break;

      case 'sub_sub_header':
        lines.push(`### ${text}\n`);
        break;

      case 'text':
        if (text) {
          // Escape leading > to prevent markdown blockquotes
          const escapedText = text.startsWith('>') ? '\\' + text : text;
          lines.push(`${escapedText}\n`);
        }
        break;

      case 'bulleted_list':
        lines.push(`- ${text}\n`);
        break;

      case 'numbered_list':
        lines.push(`1. ${text}\n`);
        break;

      case 'quote':
        lines.push(`> ${text}\n`);
        break;

      case 'code':
        const language = properties?.language?.[0]?.[0] || '';
        lines.push(`\`\`\`${language}\n${text}\n\`\`\`\n`);
        break;

      case 'divider':
        lines.push('\n---\n');
        slideCount++;
        break;

      case 'image':
        const imageUrl = block.value.format?.display_source ||
                        block.value.properties?.source?.[0]?.[0] || '';
        if (imageUrl) {
          lines.push(`![Image](${imageUrl})\n`);
        }
        break;

      case 'callout':
        lines.push(`> **Note:** ${text}\n`);
        break;
    }
  }

  // Clean up the content
  let content = lines.join('\n');

  // Remove duplicate dividers (handles ---\n\n---\n patterns)
  content = content.replace(/---\n+---/g, '---');

  // Remove dividers at the very start
  content = content.replace(/^\n*---\n/, '');

  // Clean up excessive newlines
  content = content.replace(/\n{3,}/g, '\n\n');

  // Remove any frontmatter-like blocks that got included in content
  content = content.replace(/## title:.*\ntheme:.*\nlayout:.*\n/gi, '');

  // Add frontmatter
  const markdown = `---
title: Notion Import
theme: tech-dark
layout: line
---

${content.trim()}`;

  return markdown;
}

/**
 * Handle API requests
 */
async function handleApiRequest(req, res, pathname) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  if (pathname === '/api/notion' && req.method === 'GET') {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const notionUrl = url.searchParams.get('url');

    if (!notionUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing url parameter' }));
      return true;
    }

    try {
      const pageId = extractNotionPageId(notionUrl);
      if (!pageId) {
        throw new Error('Could not extract page ID from URL');
      }

      const markdown = await fetchNotionPage(pageId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ markdown }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return true;
  }

  return false;
}

const server = createServer(async (req, res) => {
  // Remove query string for pathname, but keep full URL for API
  let pathname = decodeURIComponent(req.url.split('?')[0]);

  // Handle API requests
  if (pathname.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res, pathname);
    if (handled) return;
  }

  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = join(PUBLIC_DIR, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  try {
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Serve index.html from directory
      await serveFile(join(filePath, 'index.html'), res);
    } else {
      await serveFile(filePath, res);
    }
  } catch {
    // File not found, try serving index.html for SPA routing
    await serveFile(join(PUBLIC_DIR, 'index.html'), res);
  }
});

server.listen(PORT, () => {
  console.log(`
  ImpressFlow Web App
  -------------------
  Local:   http://localhost:${PORT}

  Press Ctrl+C to stop
  `);
});
