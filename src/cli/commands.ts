import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { parseMarkdown } from '../core/parser/index.js';
import { render } from '../core/renderer/index.js';
import { getTheme, getThemeNames } from '../core/themes/index.js';
import { isValidLayout, type LayoutName } from '../core/positioning/index.js';
import { LocalStorageAdapter } from '../adapters/storage/local.js';

export interface GenerateOptions {
  theme: string;
  layout: string;
  output: string;
  images: boolean;
}

/**
 * Generate a presentation from a markdown file
 */
export async function generate(inputPath: string, options: GenerateOptions): Promise<void> {
  // Validate input file
  const absolutePath = resolve(inputPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  // Validate theme
  const themeNames = getThemeNames();
  if (!themeNames.includes(options.theme)) {
    throw new Error(`Unknown theme "${options.theme}". Available: ${themeNames.join(', ')}`);
  }

  // Validate layout
  if (!isValidLayout(options.layout)) {
    const validLayouts = ['spiral', 'grid', 'herringbone', 'zoom', 'sphere', 'cascade'];
    throw new Error(`Unknown layout "${options.layout}". Available: ${validLayouts.join(', ')}`);
  }

  console.log(`📄 Parsing ${basename(inputPath)}...`);

  // Read and parse
  const content = readFileSync(absolutePath, 'utf-8');
  if (!content.trim()) {
    throw new Error('Input file is empty');
  }

  const ast = parseMarkdown(content);
  console.log(`   Found ${ast.slides.length} slides`);

  // Get theme
  const theme = getTheme(options.theme);

  // Note: Image generation will be implemented in Phase 7
  const hasImages = ast.slides.some((s) => s.images.length > 0);
  if (options.images && hasImages) {
    console.log(`🎨 Image generation will be available in a future version`);
  }

  // Render
  console.log(`⚙️  Rendering with ${options.theme} theme, ${options.layout} layout...`);
  const result = render(ast, {
    theme,
    layout: options.layout as LayoutName,
    lazyImages: false,
  });

  // Write output
  const storage = new LocalStorageAdapter(resolve(options.output));
  await storage.save('index.html', result.html);
  await storage.save('presentation.json', JSON.stringify(result.metadata, null, 2));

  console.log(`✅ Created ${options.output}/index.html`);
  console.log(`   Open in browser to present!`);
}
