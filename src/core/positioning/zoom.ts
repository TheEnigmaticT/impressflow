import type { Position } from '../../types.js';
import type { ZoomConfig } from './types.js';

/**
 * Zoom positioning algorithm
 *
 * Creates a zooming effect by moving slides along the Z axis
 * with exponentially changing scale.
 */
export function zoom(index: number, total: number, config: ZoomConfig = {}): Position {
  const { scaleMultiplier = 3, zDepth = -3000, direction = 'in' } = config;

  const scaleFactor =
    direction === 'in'
      ? Math.pow(scaleMultiplier, index)
      : Math.pow(1 / scaleMultiplier, index);

  return {
    x: 0,
    y: 0,
    z: index * zDepth,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: scaleFactor,
  };
}
