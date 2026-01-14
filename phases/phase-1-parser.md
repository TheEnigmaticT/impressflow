# Phase 1: Core Parser

**Completion Promise:** `<promise>PHASE_1_COMPLETE</promise>`

## Scope
Parse markdown into SlideAST format.

## Tasks
1. Implement frontmatter parser with gray-matter
2. Implement slide splitter (H1 and --- detection)
3. Implement content parser (markdown to HTML via marked)
4. Implement layout detector (column syntax)
5. Implement image syntax parser (`![image: prompt]()`)
6. Extract speaker notes from `<!-- NOTES: ... -->`

## Files to Create

```
src/core/parser/
├── index.ts          # Main parser, exports parseMarkdown()
├── frontmatter.ts    # Extract and validate frontmatter
├── slides.ts         # Split content into slides
├── layouts.ts        # Detect layout directives
└── images.ts         # Parse image generation syntax
```

## Key Implementation

### src/core/parser/index.ts

```typescript
import { SlideAST, Frontmatter, Slide } from '../../types';
import { extractFrontmatter } from './frontmatter';
import { splitIntoSlides } from './slides';
import { detectLayout } from './layouts';
import { parseImages } from './images';

export function parseMarkdown(content: string): SlideAST {
  const { frontmatter, body } = extractFrontmatter(content);
  const rawSlides = splitIntoSlides(body);
  
  const slides: Slide[] = rawSlides.map((raw, index) => ({
    index,
    title: extractTitle(raw),
    content: parseContent(raw),
    layout: detectLayout(raw),
    images: parseImages(raw),
    notes: extractNotes(raw),
  }));
  
  return { frontmatter, slides };
}
```

### Slide Splitting Rules

1. `# Title` creates a new slide
2. `---` (horizontal rule) forces a slide break
3. Everything between breaks belongs to one slide

### Layout Detection

Look for directive blocks:
```markdown
::: two-column
content
:::
```

Parse with regex: `/^:::\s*(\w+[-\w]*)\s*$([\s\S]*?)^:::\s*$/gm`

### Image Syntax

```markdown
![image: A robot helping an entrepreneur](placeholder)
```

Extract prompt from alt text starting with `image:`.

## Tests Required

```typescript
// tests/core/parser.test.ts
describe('Parser', () => {
  it('extracts frontmatter correctly', () => {
    const input = `---
title: Test
theme: tech-dark
---
# Slide 1`;
    const result = parseMarkdown(input);
    expect(result.frontmatter.title).toBe('Test');
    expect(result.frontmatter.theme).toBe('tech-dark');
  });

  it('splits slides on H1 headers', () => {
    const input = `# Slide 1\nContent\n# Slide 2\nMore`;
    const result = parseMarkdown(input);
    expect(result.slides).toHaveLength(2);
  });

  it('splits slides on horizontal rules', () => {
    const input = `# Slide 1\n---\n# Slide 2`;
    const result = parseMarkdown(input);
    expect(result.slides).toHaveLength(2);
  });

  it('detects two-column layout syntax', () => {
    const input = `# Slide\n::: two-column\nLeft\n### Right\n:::`;
    const result = parseMarkdown(input);
    expect(result.slides[0].layout).toBe('two-column');
  });

  it('parses image generation syntax', () => {
    const input = `# Slide\n![image: A futuristic city](placeholder)`;
    const result = parseMarkdown(input);
    expect(result.slides[0].images[0].prompt).toBe('A futuristic city');
  });

  it('extracts speaker notes from HTML comments', () => {
    const input = `# Slide\nContent\n<!-- NOTES: Say this -->`;
    const result = parseMarkdown(input);
    expect(result.slides[0].notes).toBe('Say this');
  });

  it('handles empty slides gracefully', () => {
    const input = `# Slide 1\n---\n---\n# Slide 2`;
    const result = parseMarkdown(input);
    expect(result.slides.length).toBeGreaterThan(0);
  });

  it('outputs standard SlideAST format', () => {
    const input = `# Test`;
    const result = parseMarkdown(input);
    expect(result).toHaveProperty('frontmatter');
    expect(result).toHaveProperty('slides');
    expect(result.slides[0]).toHaveProperty('index');
    expect(result.slides[0]).toHaveProperty('title');
    expect(result.slides[0]).toHaveProperty('content');
    expect(result.slides[0]).toHaveProperty('layout');
    expect(result.slides[0]).toHaveProperty('images');
    expect(result.slides[0]).toHaveProperty('notes');
  });
});
```

## Verification

```bash
npm run typecheck && npm run test -- tests/core/parser.test.ts
```
