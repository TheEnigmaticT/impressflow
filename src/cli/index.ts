import { Command } from 'commander';
import { generate } from './commands.js';
import { getThemeNames } from '../core/themes/index.js';

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
  .action(async (input: string, options: { theme: string; layout: string; output: string; images: boolean }) => {
    try {
      await generate(input, options);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.addHelpText(
  'after',
  `
Examples:
  $ impressflow presentation.md
  $ impressflow deck.md --theme workshop --layout cascade
  $ impressflow slides.md -t tech-dark -l sphere -o ./dist
  $ impressflow quick.md --no-images

Available themes: ${getThemeNames().join(', ')}
Available layouts: spiral, grid, herringbone, zoom, sphere, cascade
`
);

program.parse();
