import type { Position } from '../../types.js';
import type { GridConfig } from './types.js';

/**
 * Grid positioning algorithm
 *
 * Arranges slides in a simple grid pattern with configurable columns.
 */
export function grid(index: number, total: number, config: GridConfig = {}): Position {
  const { columns = 4, cellWidth = 2200, cellHeight = 1400 } = config;

  const col = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: col * cellWidth,
    y: row * cellHeight,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
  };
}
