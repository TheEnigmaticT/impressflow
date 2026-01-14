# Phase 0: Project Scaffolding

**Completion Promise:** `<promise>PHASE_0_COMPLETE</promise>`

## Scope
Set up project structure with core/adapters separation.

## Tasks
1. Initialize npm project with TypeScript
2. Create directory structure (core/, adapters/, cli/)
3. Set up tsconfig.json with strict mode
4. Set up vitest
5. Create type definitions in src/types.ts
6. Install dependencies
7. Create storage interface with local implementation
8. Create this AGENTS.md file structure

## Dependencies to Install

```bash
npm init -y
npm install marked gray-matter commander @google/generative-ai handlebars @notionhq/client @supabase/supabase-js
npm install -D typescript @types/node vitest tsup playwright
```

## Directory Structure to Create

```
impressflow/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── AGENTS.md
├── docs/phases/          # Copy phase files here
├── src/
│   ├── index.ts          # CLI entry (stub)
│   ├── types.ts          # All interfaces
│   ├── core/
│   │   ├── parser/
│   │   ├── positioning/
│   │   ├── themes/
│   │   └── renderer/
│   ├── adapters/
│   │   ├── input/
│   │   ├── storage/
│   │   └── images/
│   └── cli/
├── tests/
│   ├── core/
│   ├── adapters/
│   └── e2e/
└── templates/
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## src/types.ts (starter)

```typescript
// Frontmatter from markdown
export interface Frontmatter {
  title?: string;
  theme?: string;
  layout?: string;
  imageStyle?: string;
  transitionDuration?: number;
  author?: string;
  date?: string;
  aspectRatio?: '16:9' | '4:3';
}

// Slide AST - common format for all input sources
export interface Slide {
  index: number;
  title: string;
  content: string;
  layout: LayoutType;
  images: ImageRequest[];
  notes: string;
}

export interface SlideAST {
  frontmatter: Frontmatter;
  slides: Slide[];
}

// Layout types
export type LayoutType =
  | 'single'
  | 'two-column'
  | 'three-column'
  | 'image-left'
  | 'image-right'
  | 'full-bleed'
  | 'title-only'
  | 'quote';

// Position for impress.js
export interface Position {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
}

// Image generation
export interface ImageRequest {
  prompt: string;
  slideIndex: number;
  imageIndex: number;
}

export interface ImageResult {
  success: boolean;
  path: string;
  promptHash: string;
  error?: string;
}

// Storage abstraction
export interface StorageAdapter {
  save(path: string, content: Buffer | string): Promise<string>;
  get(path: string): Promise<Buffer | null>;
  exists(path: string): Promise<boolean>;
  getPublicUrl(path: string): Promise<string>;
}

// Image cache abstraction
export interface ImageCache {
  exists(promptHash: string): Promise<boolean>;
  get(promptHash: string): Promise<string | null>;
  save(promptHash: string, buffer: Buffer): Promise<string>;
}
```

## Verification

```bash
npm run typecheck && npm run build
```

Both must pass before outputting completion promise.
