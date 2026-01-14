# Phase 5: CLI Interface

**Completion Promise:** `<promise>PHASE_5_COMPLETE</promise>`

## Scope
Create command-line interface with local storage adapter.

## Tasks
1. Set up commander.js
2. Implement `impressflow <input.md>` command
3. Add `--theme` option
4. Add `--layout` option
5. Add `--output` option
6. Add `--no-images` option
7. Wire up local storage adapter
8. Add `--help` with examples

## Files to Create

```
src/cli/
├── index.ts          # Commander setup
└── commands.ts       # Command implementations

src/adapters/storage/
├── index.ts          # Storage interface
└── local.ts          # Local filesystem implementation
```

## CLI Setup

```typescript
// src/cli/index.ts
import { Command } from 'commander';
import { generate } from './commands';
import { getThemeNames } from '../core/themes';

const program = new Command();

program
  .name('impressflow')
  .description('Convert Markdown to impress.js presentations')
  .version('1.0.0');

program
  .argument('<input>', 'Input markdown file')
  .option('-t, --theme <name>', 'Theme name', 'tech-dark')
  .option('-l, --layout <name>', 'Layout algorithm', 'spiral')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-i, --no-images', 'Disable AI image generation')
  .action(async (input, options) => {
    try {
      await generate(input, options);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.addHelpText('after', `
Examples:
  $ impressflow presentation.md
  $ impressflow deck.md --theme workshop --layout cascade
  $ impressflow slides.md -t tech-dark -l sphere -o ./dist
  $ impressflow quick.md --no-images

Available themes: ${getThemeNames().join(', ')}
Available layouts: spiral, grid, herringbone, zoom, sphere, cascade
`);

program.parse();
```

## Generate Command

```typescript
// src/cli/commands.ts
import { readFileSync, existsSync } from 'fs';
import { resolve, basename, dirname } from 'path';
import { parseMarkdown } from '../core/parser';
import { render } from '../core/renderer';
import { getTheme, getThemeNames } from '../core/themes';
import { LocalStorage } from '../adapters/storage/local';
import { generateImages } from '../adapters/images';

interface GenerateOptions {
  theme: string;
  layout: string;
  output: string;
  images: boolean;  // Note: --no-images makes this false
}

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
  const validLayouts = ['spiral', 'grid', 'herringbone', 'zoom', 'sphere', 'cascade'];
  if (!validLayouts.includes(options.layout)) {
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
  
  // Generate images if enabled
  if (options.images && ast.slides.some(s => s.images.length > 0)) {
    console.log(`🎨 Generating images...`);
    await generateImages(ast, theme, options.output);
  }
  
  // Render
  console.log(`⚙️  Rendering with ${options.theme} theme, ${options.layout} layout...`);
  const result = render(ast, {
    theme,
    layout: options.layout as any,
    lazyImages: false,  // CLI generates all images upfront
  });
  
  // Write output
  const storage = new LocalStorage(resolve(options.output));
  await storage.save('index.html', result.html);
  await storage.save('presentation.json', JSON.stringify(result.metadata, null, 2));
  
  console.log(`✅ Created ${options.output}/index.html`);
  console.log(`   Open in browser to present!`);
}
```

## Local Storage Adapter

```typescript
// src/adapters/storage/local.ts
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { StorageAdapter } from '../../types';

export class LocalStorage implements StorageAdapter {
  constructor(private baseDir: string) {}
  
  async save(path: string, content: Buffer | string): Promise<string> {
    const fullPath = join(this.baseDir, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
    return fullPath;
  }
  
  async get(path: string): Promise<Buffer | null> {
    try {
      const fullPath = join(this.baseDir, path);
      return await readFile(fullPath);
    } catch {
      return null;
    }
  }
  
  async exists(path: string): Promise<boolean> {
    try {
      await access(join(this.baseDir, path));
      return true;
    } catch {
      return false;
    }
  }
  
  async getPublicUrl(path: string): Promise<string> {
    // For local, just return file:// URL
    return `file://${join(this.baseDir, path)}`;
  }
}
```

## Entry Point

```typescript
// src/index.ts
#!/usr/bin/env node
import './cli';
```

## Package.json Scripts

```json
{
  "bin": {
    "impressflow": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Tests

```typescript
// tests/cli/commands.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generate } from '../../src/cli/commands';

describe('CLI', () => {
  it('errors on missing input file', async () => {
    await expect(generate('nonexistent.md', {
      theme: 'tech-dark',
      layout: 'spiral',
      output: './output',
      images: false
    })).rejects.toThrow('Input file not found');
  });

  it('errors on invalid theme name', async () => {
    // Create temp file first
    await expect(generate('tests/fixtures/simple.md', {
      theme: 'invalid-theme',
      layout: 'spiral',
      output: './output',
      images: false
    })).rejects.toThrow('Unknown theme');
  });

  it('errors on invalid layout name', async () => {
    await expect(generate('tests/fixtures/simple.md', {
      theme: 'tech-dark',
      layout: 'invalid-layout',
      output: './output',
      images: false
    })).rejects.toThrow('Unknown layout');
  });
});

// Also test via CLI execution
describe('CLI execution', () => {
  it('displays help with --help', async () => {
    const { execSync } = await import('child_process');
    const output = execSync('node dist/index.js --help', { encoding: 'utf-8' });
    expect(output).toContain('impressflow');
    expect(output).toContain('--theme');
    expect(output).toContain('--layout');
  });

  it('displays version with --version', async () => {
    const { execSync } = await import('child_process');
    const output = execSync('node dist/index.js --version', { encoding: 'utf-8' });
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });
});
```

## Test Fixture

Create `tests/fixtures/simple.md`:
```markdown
---
title: Test Presentation
theme: tech-dark
---

# Slide One

This is the first slide.

---

# Slide Two

This is the second slide.
```

## Verification

```bash
npm run typecheck && npm run test -- tests/cli/
```
