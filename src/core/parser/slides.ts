/**
 * Result of splitting slides with direction markers
 */
export interface SplitResult {
  slides: string[];
  directions: Array<'right' | 'down'>;
}

/**
 * Split markdown content into individual slides
 *
 * Rules:
 * 1. `# Title` (H1 header) creates a new slide
 * 2. `---` (horizontal rule) forces a slide break
 * 3. Everything between breaks belongs to one slide
 */
export function splitIntoSlides(body: string): string[] {
  return splitIntoSlidesWithDirections(body).slides;
}

/**
 * Split markdown content into slides and extract direction markers
 *
 * If a slide ends with `^` on its own line, the next slide will be
 * positioned below instead of to the right (for line layout).
 */
export function splitIntoSlidesWithDirections(body: string): SplitResult {
  const lines = body.split('\n');
  const slides: string[] = [];
  const directions: Array<'right' | 'down'> = [];
  let currentSlide: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check for horizontal rule (slide break)
    if (isHorizontalRule(trimmedLine)) {
      if (currentSlide.length > 0) {
        const { content, direction } = extractDirectionMarker(currentSlide);
        slides.push(content);
        directions.push(direction);
        currentSlide = [];
      }
      continue;
    }

    // Check for H1 header (new slide)
    if (isH1Header(trimmedLine) && currentSlide.length > 0) {
      const { content, direction } = extractDirectionMarker(currentSlide);
      slides.push(content);
      directions.push(direction);
      currentSlide = [line];
      continue;
    }

    currentSlide.push(line);
  }

  // Push remaining content as a slide
  if (currentSlide.length > 0) {
    const { content, direction } = extractDirectionMarker(currentSlide);
    if (content) {
      slides.push(content);
      directions.push(direction);
    }
  }

  // Filter out empty slides (and their corresponding directions)
  const filtered: SplitResult = { slides: [], directions: [] };
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].trim().length > 0) {
      filtered.slides.push(slides[i]);
      filtered.directions.push(directions[i]);
    }
  }

  return filtered;
}

/**
 * Extract direction marker from slide content
 * If slide ends with `^` on its own line, remove it and return 'down'
 */
function extractDirectionMarker(lines: string[]): { content: string; direction: 'right' | 'down' } {
  // Work backwards to find the last non-empty line
  let lastContentIndex = lines.length - 1;
  while (lastContentIndex >= 0 && lines[lastContentIndex].trim() === '') {
    lastContentIndex--;
  }

  // Check if the last content line is just `^`
  if (lastContentIndex >= 0 && lines[lastContentIndex].trim() === '^') {
    // Remove the marker and return 'down'
    const contentLines = [...lines];
    contentLines.splice(lastContentIndex, 1);
    return {
      content: contentLines.join('\n').trim(),
      direction: 'down',
    };
  }

  return {
    content: lines.join('\n').trim(),
    direction: 'right',
  };
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
