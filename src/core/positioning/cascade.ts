import type { Position } from '../../types.js';
import type { CascadeConfig } from './types.js';

/**
 * Cascade positioning algorithm
 *
 * Creates a stacked, cascading effect where each slide is offset
 * diagonally from the previous one with subtle rotation and scaling.
 */
export function cascade(index: number, total: number, config: CascadeConfig = {}): Position {
  const { stepX = 1600, stepY = 800, stepZ = -200, rotation = 5 } = config;

  return {
    x: index * stepX,
    y: index * stepY,
    z: index * stepZ,
    rotateX: index * rotation * 0.5,
    rotateY: 0,
    rotateZ: index * rotation,
    scale: Math.max(0.5, 1 - index * 0.02),
  };
}
