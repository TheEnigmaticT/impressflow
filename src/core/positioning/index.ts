import type { Position } from '../../types.js';
import { spiral } from './spiral.js';
import { grid } from './grid.js';
import { herringbone } from './herringbone.js';
import { zoom } from './zoom.js';
import { sphere } from './sphere.js';
import { cascade } from './cascade.js';
import type { PositionConfig } from './types.js';

export type LayoutName = 'spiral' | 'grid' | 'herringbone' | 'zoom' | 'sphere' | 'cascade';

type PositionFn = (index: number, total: number, config?: PositionConfig) => Position;

const algorithms: Record<LayoutName, PositionFn> = {
  spiral: spiral as PositionFn,
  grid: grid as PositionFn,
  herringbone: herringbone as PositionFn,
  zoom: zoom as PositionFn,
  sphere: sphere as PositionFn,
  cascade: cascade as PositionFn,
};

/**
 * Get a positioning function by name
 */
export function getPositioner(name: LayoutName): PositionFn {
  const fn = algorithms[name];
  if (!fn) {
    throw new Error(`Unknown layout: ${name}`);
  }
  return fn;
}

/**
 * Calculate positions for all slides
 */
export function calculatePositions(
  name: LayoutName,
  count: number,
  config?: PositionConfig
): Position[] {
  const fn = getPositioner(name);
  return Array.from({ length: count }, (_, i) => fn(i, count, config));
}

/**
 * Check if a layout name is valid
 */
export function isValidLayout(name: string): name is LayoutName {
  return name in algorithms;
}

/**
 * Get all available layout names
 */
export function getLayoutNames(): LayoutName[] {
  return Object.keys(algorithms) as LayoutName[];
}

// Re-export individual algorithms
export { spiral } from './spiral.js';
export { grid } from './grid.js';
export { herringbone } from './herringbone.js';
export { zoom } from './zoom.js';
export { sphere } from './sphere.js';
export { cascade } from './cascade.js';

// Re-export types
export type {
  SpiralConfig,
  GridConfig,
  HerringboneConfig,
  ZoomConfig,
  SphereConfig,
  CascadeConfig,
  PositionConfig,
} from './types.js';
