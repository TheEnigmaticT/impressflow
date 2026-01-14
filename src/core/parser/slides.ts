/**
 * Split markdown content into individual slides
 *
 * Rules:
 * 1. `# Title` (H1 header) creates a new slide
 * 2. `---` (horizontal rule) forces a slide break
 * 3. Everything between breaks belongs to one slide
 */
export function splitIntoSlides(body: string): string[] {
  const lines = body.split('\n');
  const slides: string[] = [];
  let currentSlide: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for horizontal rule (slide break)
    if (isHorizontalRule(trimmedLine)) {
      if (currentSlide.length > 0) {
        slides.push(currentSlide.join('\n').trim());
        currentSlide = [];
      }
      continue;
    }

    // Check for H1 header (new slide)
    if (isH1Header(trimmedLine) && currentSlide.length > 0) {
      slides.push(currentSlide.join('\n').trim());
      currentSlide = [line];
      continue;
    }

    currentSlide.push(line);
  }

  // Push remaining content as a slide
  if (currentSlide.length > 0) {
    const slideContent = currentSlide.join('\n').trim();
    if (slideContent) {
      slides.push(slideContent);
    }
  }

  // Filter out empty slides
  return slides.filter((slide) => slide.trim().length > 0);
}

/**
 * Check if a line is a horizontal rule
 */
function isHorizontalRule(line: string): boolean {
  // Must be at least 3 of the same character (-, *, _)
  // Can have spaces between them
  const hrPatterns = [/^-{3,}$/, /^\*{3,}$/, /^_{3,}$/, /^[-\s]{3,}$/, /^[\*\s]{3,}$/, /^[_\s]{3,}$/];

  const trimmed = line.trim();

  // Don't match frontmatter delimiter at the start
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
    // These are valid horizontal rules
    return true;
  }

  // Check for patterns like "- - -" or "* * *"
  const dashOnly = trimmed.replace(/\s/g, '');
  if (dashOnly.length >= 3 && /^-+$/.test(dashOnly)) return true;
  if (dashOnly.length >= 3 && /^\*+$/.test(dashOnly)) return true;
  if (dashOnly.length >= 3 && /^_+$/.test(dashOnly)) return true;

  return false;
}

/**
 * Check if a line is an H1 header
 */
function isH1Header(line: string): boolean {
  return /^#\s+.+/.test(line);
}
