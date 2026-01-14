import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  presentationId: string;
  source: string;
  sourceType: 'markdown' | 'notion-public' | 'notion-api';
  theme?: string;
  layout?: string;
  generateImages?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const body: GenerateRequest = await req.json();
    const { presentationId, source, sourceType, theme = 'tech-dark', layout = 'spiral', generateImages = false } = body;

    // Update presentation status to processing
    await supabase
      .from('presentations')
      .update({ status: 'processing' })
      .eq('id', presentationId);

    // Fetch content based on source type
    let markdownContent: string;

    if (sourceType === 'markdown') {
      markdownContent = source;
    } else if (sourceType === 'notion-public') {
      // Fetch from public Notion page
      markdownContent = await fetchNotionPublic(source);
    } else if (sourceType === 'notion-api') {
      // Get user's Notion connection
      const authHeader = req.headers.get('Authorization')!;
      const token = authHeader.replace('Bearer ', '');

      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        throw new Error('Unauthorized');
      }

      const { data: connection } = await supabase
        .from('notion_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      if (!connection) {
        throw new Error('No Notion connection found');
      }

      markdownContent = await fetchNotionAPI(source, connection.access_token);
    } else {
      throw new Error(`Invalid source type: ${sourceType}`);
    }

    // Parse markdown to AST
    const slideAST = parseMarkdown(markdownContent, theme, layout);

    // Generate HTML
    const html = generateHTML(slideAST, theme, layout);

    // If images are requested, queue image generation
    if (generateImages && slideAST.images.length > 0) {
      for (const image of slideAST.images) {
        // Queue image generation via separate function
        await supabase.functions.invoke('generate-image', {
          body: {
            presentationId,
            prompt: image.prompt,
            slideIndex: image.slideIndex,
            imageIndex: image.imageIndex,
          },
        });
      }
    }

    // Save generated HTML
    const storagePath = `presentations/${presentationId}/index.html`;
    await supabase.storage
      .from('presentations')
      .upload(storagePath, html, {
        contentType: 'text/html',
        upsert: true,
      });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('presentations')
      .getPublicUrl(storagePath);

    // Update presentation with output
    await supabase
      .from('presentations')
      .update({
        html_output: urlData.publicUrl,
        status: 'completed',
      })
      .eq('id', presentationId);

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        presentationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating presentation:', error);

    // Update presentation with error status
    if (error instanceof Error) {
      const body = await req.json().catch(() => ({}));
      if (body.presentationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('presentations')
          .update({
            status: 'error',
            error_message: error.message,
          })
          .eq('id', body.presentationId);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Fetch content from a public Notion page
 */
async function fetchNotionPublic(url: string): Promise<string> {
  // Simplified: In production, use a proper scraper
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Notion page: ${response.statusText}`);
  }

  const html = await response.text();
  // Extract text content (simplified)
  // In production, use a proper HTML parser
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return textContent;
}

/**
 * Fetch content from Notion API
 */
async function fetchNotionAPI(pageId: string, accessToken: string): Promise<string> {
  // Get page content via Notion API
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Notion API: ${response.statusText}`);
  }

  const data = await response.json();

  // Convert blocks to markdown
  let markdown = '';
  for (const block of data.results) {
    markdown += blockToMarkdown(block) + '\n';
  }

  return markdown;
}

/**
 * Convert Notion block to Markdown
 */
function blockToMarkdown(block: Record<string, unknown>): string {
  const type = block.type as string;
  const content = block[type] as Record<string, unknown>;

  switch (type) {
    case 'heading_1':
      return `# ${extractRichText(content.rich_text as unknown[])}`;
    case 'heading_2':
      return `## ${extractRichText(content.rich_text as unknown[])}`;
    case 'heading_3':
      return `### ${extractRichText(content.rich_text as unknown[])}`;
    case 'paragraph':
      return extractRichText(content.rich_text as unknown[]);
    case 'bulleted_list_item':
      return `- ${extractRichText(content.rich_text as unknown[])}`;
    case 'numbered_list_item':
      return `1. ${extractRichText(content.rich_text as unknown[])}`;
    case 'code':
      return `\`\`\`${content.language || ''}\n${extractRichText(content.rich_text as unknown[])}\n\`\`\``;
    case 'quote':
      return `> ${extractRichText(content.rich_text as unknown[])}`;
    case 'divider':
      return '---';
    default:
      return '';
  }
}

/**
 * Extract plain text from Notion rich text array
 */
function extractRichText(richText: unknown[]): string {
  if (!Array.isArray(richText)) return '';
  return richText.map((item: unknown) => {
    const text = item as { plain_text?: string };
    return text.plain_text || '';
  }).join('');
}

/**
 * Simplified markdown parser for edge function
 */
function parseMarkdown(content: string, theme: string, layout: string): {
  frontmatter: Record<string, string>;
  slides: Array<{ title: string; content: string; index: number }>;
  images: Array<{ prompt: string; slideIndex: number; imageIndex: number }>;
} {
  // Split into slides on H1 or ---
  const slideTexts = content.split(/(?=^# )|^---$/m).filter(s => s.trim());

  const slides = slideTexts.map((text, index) => {
    const titleMatch = text.match(/^#\s+(.+)$/m);
    return {
      index,
      title: titleMatch ? titleMatch[1] : `Slide ${index + 1}`,
      content: text.trim(),
    };
  });

  // Extract image prompts
  const images: Array<{ prompt: string; slideIndex: number; imageIndex: number }> = [];
  slides.forEach((slide, slideIndex) => {
    const imageMatches = slide.content.matchAll(/!\[image:\s*([^\]]+)\]/g);
    let imageIndex = 0;
    for (const match of imageMatches) {
      images.push({
        prompt: match[1],
        slideIndex,
        imageIndex: imageIndex++,
      });
    }
  });

  return {
    frontmatter: { theme, layout },
    slides,
    images,
  };
}

/**
 * Generate HTML presentation
 */
function generateHTML(
  slideAST: ReturnType<typeof parseMarkdown>,
  theme: string,
  layout: string
): string {
  const positions = calculatePositions(slideAST.slides.length, layout);

  const slidesHtml = slideAST.slides.map((slide, i) => {
    const pos = positions[i];
    return `
      <div id="slide-${slide.index + 1}"
           class="step slide"
           data-x="${pos.x}"
           data-y="${pos.y}"
           data-z="${pos.z}"
           data-rotate-x="${pos.rotateX}"
           data-rotate-y="${pos.rotateY}"
           data-rotate-z="${pos.rotateZ}"
           data-scale="${pos.scale}">
        <div class="slide-content">
          ${simpleMarkdownToHtml(slide.content)}
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ImpressFlow Presentation</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    ${getThemeCSS(theme)}
    ${getBaseCSS()}
  </style>
</head>
<body class="impress-not-supported">
  <div id="impress">
    ${slidesHtml}
    <div id="overview" class="step" data-x="0" data-y="0" data-scale="10"></div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/impress.js@2.0.0/js/impress.min.js"></script>
  <script>impress().init();</script>
</body>
</html>`;
}

/**
 * Simple markdown to HTML conversion
 */
function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, '<p>$1</p>')
    .replace(/<p><h/g, '<h')
    .replace(/<\/h(\d)><\/p>/g, '</h$1>');
}

/**
 * Calculate slide positions based on layout
 */
function calculatePositions(count: number, layout: string): Array<{
  x: number; y: number; z: number;
  rotateX: number; rotateY: number; rotateZ: number;
  scale: number;
}> {
  const positions = [];

  for (let i = 0; i < count; i++) {
    let pos;

    switch (layout) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(count));
        const col = i % cols;
        const row = Math.floor(i / cols);
        pos = { x: col * 1500, y: row * 1000, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };
        break;
      }
      case 'zoom': {
        pos = { x: 0, y: 0, z: -i * 3000, rotateX: 0, rotateY: 0, rotateZ: 0, scale: Math.pow(0.8, i) };
        break;
      }
      case 'spiral':
      default: {
        const angle = (i / count) * Math.PI * 4;
        const radius = 800 + i * 200;
        pos = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: -i * 500,
          rotateX: 0,
          rotateY: 0,
          rotateZ: (angle * 180) / Math.PI,
          scale: 1,
        };
        break;
      }
    }

    positions.push(pos);
  }

  return positions;
}

/**
 * Get theme CSS variables
 */
function getThemeCSS(theme: string): string {
  const themes: Record<string, Record<string, string>> = {
    'tech-dark': {
      '--background': '#0a0a0f',
      '--foreground': '#ffffff',
      '--primary': '#00d4ff',
      '--secondary': '#7c3aed',
      '--accent': '#f472b6',
    },
    'clean-light': {
      '--background': '#ffffff',
      '--foreground': '#1a1a1a',
      '--primary': '#2563eb',
      '--secondary': '#64748b',
      '--accent': '#f59e0b',
    },
    'creative': {
      '--background': '#fef3c7',
      '--foreground': '#1e1b4b',
      '--primary': '#ec4899',
      '--secondary': '#8b5cf6',
      '--accent': '#06b6d4',
    },
    'corporate': {
      '--background': '#f8fafc',
      '--foreground': '#0f172a',
      '--primary': '#1e40af',
      '--secondary': '#475569',
      '--accent': '#059669',
    },
    'workshop': {
      '--background': '#18181b',
      '--foreground': '#fafafa',
      '--primary': '#22c55e',
      '--secondary': '#a855f7',
      '--accent': '#eab308',
    },
  };

  const colors = themes[theme] || themes['tech-dark'];
  return `:root {
    ${Object.entries(colors).map(([k, v]) => `${k}: ${v};`).join('\n    ')}
  }`;
}

/**
 * Get base CSS styles
 */
function getBaseCSS(): string {
  return `
    body {
      font-family: 'Inter', sans-serif;
      background: var(--background);
      color: var(--foreground);
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }

    .step.slide {
      width: 1200px;
      height: 700px;
      padding: 40px;
      box-sizing: border-box;
      background: var(--background);
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .slide h1 {
      font-size: 3rem;
      color: var(--primary);
      margin-bottom: 1rem;
    }

    .slide h2 {
      font-size: 2rem;
      color: var(--secondary);
    }

    .slide p {
      font-size: 1.5rem;
      line-height: 1.6;
    }

    .slide code {
      background: rgba(0,0,0,0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
    }

    .impress-enabled .step {
      opacity: 0.3;
      transition: opacity 0.5s;
    }

    .impress-enabled .step.active {
      opacity: 1;
    }
  `;
}
