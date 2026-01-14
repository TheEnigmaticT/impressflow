import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '../../src/core/parser/index.js';

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

  it('extracts slide title from H1', () => {
    const input = `# My Presentation Title\nSome content here`;
    const result = parseMarkdown(input);
    expect(result.slides[0].title).toBe('My Presentation Title');
  });

  it('uses default frontmatter values when not provided', () => {
    const input = `# Slide`;
    const result = parseMarkdown(input);
    expect(result.frontmatter.theme).toBe('default');
    expect(result.frontmatter.transitionDuration).toBe(1000);
    expect(result.frontmatter.aspectRatio).toBe('16:9');
  });

  it('detects quote layout', () => {
    const input = `> This is a quote\n> - Author`;
    const result = parseMarkdown(input);
    expect(result.slides[0].layout).toBe('quote');
  });

  it('detects title-only layout', () => {
    const input = `# Title Only`;
    const result = parseMarkdown(input);
    expect(result.slides[0].layout).toBe('title-only');
  });

  it('parses multiple images in one slide', () => {
    const input = `# Slide\n![image: First image]()\n![image: Second image]()`;
    const result = parseMarkdown(input);
    expect(result.slides[0].images).toHaveLength(2);
    expect(result.slides[0].images[0].prompt).toBe('First image');
    expect(result.slides[0].images[1].prompt).toBe('Second image');
  });

  it('converts markdown to HTML in content', () => {
    const input = `# Slide\n**bold** and *italic*`;
    const result = parseMarkdown(input);
    expect(result.slides[0].content).toContain('<strong>bold</strong>');
    expect(result.slides[0].content).toContain('<em>italic</em>');
  });

  it('handles complex multi-slide presentations', () => {
    const input = `---
title: Complex Presentation
theme: modern
---

# Introduction
Welcome to the presentation

<!-- NOTES: Introduce yourself -->

---

# Features
::: two-column
Left content
### Right content
:::

![image: A diagram showing features](placeholder)

---

# Conclusion
> Thank you for watching!
`;
    const result = parseMarkdown(input);

    expect(result.frontmatter.title).toBe('Complex Presentation');
    expect(result.frontmatter.theme).toBe('modern');
    expect(result.slides).toHaveLength(3);
    expect(result.slides[0].title).toBe('Introduction');
    expect(result.slides[0].notes).toBe('Introduce yourself');
    expect(result.slides[1].layout).toBe('two-column');
    expect(result.slides[1].images).toHaveLength(1);
  });
});
