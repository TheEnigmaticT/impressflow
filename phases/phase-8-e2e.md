 Left Side
Content for the left column.

### Right Side
Content for the right column.
:::

---

# Code Block

```javascript
function hello() {
  console.log('Hello, world!');
}
```

---

# Quote Slide

> This is a blockquote that should be styled nicely.

---

# Image Slide

![image: A friendly robot waving hello](placeholder)

---

# The End

Thank you!
```

## Playwright Test File

```typescript
// tests/e2e/browser.test.ts
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { resolve } from 'path';

const OUTPUT_DIR = resolve(__dirname, 'output');
const FIXTURES_DIR = resolve(__dirname, 'fixtures');

test.describe('E2E Browser Tests', () => {
  test.beforeAll(async () => {
    // Generate test presentation
    execSync(
      `node dist/index.js ${FIXTURES_DIR}/simple.md -o ${OUTPUT_DIR} --no-images`,
      { cwd: resolve(__dirname, '../..') }
    );
  });

  test('impress.js initializes without errors', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    
    // Wait for impress to initialize
    await page.waitForSelector('body.impress-enabled', { timeout: 5000 });
    
    // Check no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    expect(errors).toHaveLength(0);
  });

  test('first slide is visible on load', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    const firstSlide = await page.$('#slide-1');
    expect(firstSlide).not.toBeNull();
    
    // Check it has the active class
    const isActive = await page.$('#slide-1.active');
    expect(isActive).not.toBeNull();
  });

  test('spacebar advances to next slide', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    // First slide should be active
    expect(await page.$('#slide-1.active')).not.toBeNull();
    
    // Press spacebar
    await page.keyboard.press('Space');
    await page.waitForTimeout(1200); // Wait for transition
    
    // Second slide should now be active
    expect(await page.$('#slide-2.active')).not.toBeNull();
  });

  test('arrow keys navigate slides', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);
    expect(await page.$('#slide-2.active')).not.toBeNull();
    
    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1200);
    expect(await page.$('#slide-1.active')).not.toBeNull();
  });

  test('all slides are reachable', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    // Count total slides
    const slideCount = await page.$$eval('.step.slide', slides => slides.length);
    expect(slideCount).toBeGreaterThan(0);
    
    // Navigate through all slides
    for (let i = 1; i <= slideCount; i++) {
      await page.goto(`file://${OUTPUT_DIR}/index.html#/slide-${i}`);
      await page.waitForTimeout(500);
      expect(await page.$(`#slide-${i}.active`)).not.toBeNull();
    }
  });

  test('theme colors are applied', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    // Check that CSS variables are set
    const bgColor = await page.evaluate(() => 
      getComputedStyle(document.body).getPropertyValue('--background').trim()
    );
    expect(bgColor).toBeTruthy();
  });

  test('fonts are loaded', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    // Check that Google Fonts link exists
    const fontLink = await page.$('link[href*="fonts.googleapis.com"]');
    expect(fontLink).not.toBeNull();
  });

  test('speaker notes are hidden', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    const notes = await page.$('.notes');
    if (notes) {
      const isVisible = await notes.isVisible();
      expect(isVisible).toBe(false);
    }
  });

  test('overview slide exists', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');
    
    const overview = await page.$('#overview');
    expect(overview).not.toBeNull();
  });
});
```

## agent-browser Manual Testing

For manual visual verification:

```bash
# Build the project first
npm run build

# Generate a test presentation
node dist/index.js tests/e2e/fixtures/all-features.md -o tests/e2e/output --no-images

# Open with agent-browser
agent-browser open file://$(pwd)/tests/e2e/output/index.html

# Take snapshot to verify structure
agent-browser snapshot -i

# Navigate and verify
agent-browser press Space
agent-browser snapshot -i

# Take screenshots for visual regression
agent-browser screenshot tests/e2e/snapshots/slide-1.png
```

## Visual Regression (Optional)

```typescript
// tests/e2e/visual.test.ts
import { test, expect } from '@playwright/test';

test('visual regression - slide 1', async ({ page }) => {
  await page.goto(`file://${OUTPUT_DIR}/index.html`);
  await page.waitForSelector('body.impress-enabled');
  
  // Compare against baseline
  expect(await page.screenshot()).toMatchSnapshot('slide-1.png');
});

test('visual regression - slide 2', async ({ page }) => {
  await page.goto(`file://${OUTPUT_DIR}/index.html#/slide-2`);
  await page.waitForSelector('body.impress-enabled');
  await page.waitForTimeout(1200);
  
  expect(await page.screenshot()).toMatchSnapshot('slide-2.png');
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test tests/e2e/",
    "test:e2e:ui": "playwright test tests/e2e/ --ui",
    "test:e2e:debug": "playwright test tests/e2e/ --debug"
  }
}
```

## playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

## Verification

```bash
npm run typecheck && npm run test && npm run test:e2e
```
