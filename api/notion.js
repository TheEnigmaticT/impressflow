/**
 * Vercel Serverless Function: Fetch Notion page and convert to markdown
 */

/**
 * Extract page ID from various Notion URL formats
 */
function extractNotionPageId(url) {
  const patterns = [
    /([a-f0-9]{32})(?:\?|$)/i,
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:\?|$)/i,
    /-([a-f0-9]{32})(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/-/g, '');
    }
  }
  return null;
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

    for (const format of formats) {
      const formatType = format[0];
      switch (formatType) {
        case 'b':
          result = `**${result}**`;
          break;
        case 'i':
          result = `*${result}*`;
          break;
        case 'c':
          result = `\`${result}\``;
          break;
        case 'a':
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
        if (text && slideCount === 0) {
          lines.push(`# ${text}\n`);
          slideCount++;
        }
        break;

      case 'header':
        if (slideCount > 0) lines.push('\n---\n');
        lines.push(`# ${text}\n`);
        slideCount++;
        break;

      case 'sub_header':
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

  let content = lines.join('\n');
  content = content.replace(/---\n+---/g, '---');
  content = content.replace(/^\n*---\n/, '');
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.replace(/## title:.*\ntheme:.*\nlayout:.*\n/gi, '');

  const markdown = `---
title: Notion Import
theme: tech-dark
layout: line
---

${content.trim()}`;

  return markdown;
}

/**
 * Fetch Notion page content
 */
async function fetchNotionPage(pageId) {
  const response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Notion page: ${response.status}`);
  }

  const data = await response.json();
  return notionBlocksToMarkdown(data);
}

/**
 * Vercel serverless function handler
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionUrl = req.query.url;

  if (!notionUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const pageId = extractNotionPageId(notionUrl);
    if (!pageId) {
      throw new Error('Could not extract page ID from URL');
    }

    const markdown = await fetchNotionPage(pageId);

    return res.status(200).json({ markdown });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
