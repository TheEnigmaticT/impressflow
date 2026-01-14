import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const ROOT_DIR = resolve(__dirname, '../..');
const OUTPUT_DIR = resolve(__dirname, 'output');
const FIXTURES_DIR = resolve(__dirname, 'fixtures');

test.describe('E2E Browser Tests', () => {
  test.beforeAll(async () => {
    // Ensure output directory exists
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generate test presentation
    execSync(
      `node dist/index.js ${FIXTURES_DIR}/all-features.md -o ${OUTPUT_DIR} --no-images`,
      { cwd: ROOT_DIR }
    );
  });

  test('impress.js initializes without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`file://${OUTPUT_DIR}/index.html`);

    // Wait for impress to initialize
    await page.waitForSelector('body.impress-enabled', { timeout: 5000 });

    // No JavaScript errors should have occurred
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
    const slideCount = await page.$$eval('.step.slide', (slides) => slides.length);
    expect(slideCount).toBeGreaterThan(0);

    // Navigate through all slides
    for (let i = 1; i <= slideCount; i++) {
      await page.goto(`file://${OUTPUT_DIR}/index.html#/slide-${i}`);
      await page.waitForTimeout(500);
      const activeSlide = await page.$(`#slide-${i}.active`);
      expect(activeSlide).not.toBeNull();
    }
  });

  test('theme colors are applied', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');

    // Check that CSS variables are set
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
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

  test('overview slide exists', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');

    const overview = await page.$('#overview');
    expect(overview).not.toBeNull();
  });

  test('HTML structure is correct', async ({ page }) => {
    await page.goto(`file://${OUTPUT_DIR}/index.html`);
    await page.waitForSelector('body.impress-enabled');

    // Check for impress container
    const impressContainer = await page.$('#impress');
    expect(impressContainer).not.toBeNull();

    // Check slides have required data attributes
    const hasDataX = await page.$eval('#slide-1', (el) => el.hasAttribute('data-x'));
    const hasDataY = await page.$eval('#slide-1', (el) => el.hasAttribute('data-y'));
    expect(hasDataX).toBe(true);
    expect(hasDataY).toBe(true);
  });
});
