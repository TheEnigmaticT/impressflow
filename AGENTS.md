# AGENTS.md - ImpressFlow Development Guide
#claudeai

## Quick Start

**What is this?** ImpressFlow converts Markdown/Notion → impress.js 3D presentations.

**Verification command (run after every phase):**
```bash
npm run typecheck && npm run test && npm run build
```

**Phase completion:** Output `<promise>PHASE_X_COMPLETE</promise>` ONLY when verification passes.

---

## Architecture Overview

```
src/
├── core/           # Pure functions, NO I/O
│   ├── parser/     # Markdown → SlideAST
│   ├── positioning/# 6 spatial algorithms
│   ├── themes/     # 5 themes
│   └── renderer/   # SlideAST → HTML
│
├── adapters/       # I/O boundaries
│   ├── input/      # File, Notion public, Notion API
│   ├── storage/    # Local filesystem, Supabase
│   └── images/     # Gemini API, caching
│
├── cli/            # Commander.js entry
│
supabase/
└── functions/      # Edge functions for web app
```

**Key principle:** Core has zero dependencies on adapters. Adapters implement interfaces.

---

## Key Interfaces

```typescript
// All input sources produce this
interface SlideAST {
  frontmatter: Frontmatter;
  slides: Slide[];
}

interface Slide {
  index: number;
  title: string;
  content: string;  // HTML
  layout: LayoutType;
  images: ImageRequest[];
  notes: string;
}

// Storage abstraction
interface StorageAdapter {
  save(path: string, content: Buffer | string): Promise<string>;
  get(path: string): Promise<Buffer | null>;
  exists(path: string): Promise<boolean>;
  getPublicUrl(path: string): Promise<string>;
}

// Image caching
interface ImageCache {
  exists(promptHash: string): Promise<boolean>;
  get(promptHash: string): Promise<string | null>;
  save(promptHash: string, buffer: Buffer): Promise<string>;
}
```

---

## Phase Files

Read the relevant phase file when starting work on that phase:

| Phase | File | Scope |
|-------|------|-------|
| 0 | `phases/phase-0-scaffolding.md` | Project setup, directory structure |
| 1 | `phases/phase-1-parser.md` | Markdown → SlideAST |
| 2 | `phases/phase-2-positioning.md` | 6 spatial algorithms |
| 3 | `phases/phase-3-themes.md` | 5 themes + CSS generation |
| 4 | `phases/phase-4-renderer.md` | SlideAST → HTML |
| 5 | `phases/phase-5-cli.md` | Commander.js CLI |
| 6 | `phases/phase-6-notion.md` | Notion adapters |
| 7 | `phases/phase-7-images.md` | Gemini/Nano Banana + caching |
| 8 | `phases/phase-8-e2e.md` | Browser tests with agent-browser |
| 9 | `phases/phase-9-supabase.md` | Storage, DB, edge functions |
| 10 | `phases/phase-10-webapp.md` | Web UI, polish, docs |

---

## Do NOT

- Skip writing tests
- Commit if tests fail
- Put I/O in `src/core/`
- Assume external APIs are available (mock them)
- Output completion promise before verification passes

## Do

- Write small, focused functions
- Add JSDoc comments to public functions
- Log meaningful error messages
- Handle edge cases (empty files, missing frontmatter, etc.)
- Run `npm run typecheck && npm run test` frequently
