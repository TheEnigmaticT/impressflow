import type { Position } from '../../types.js';
import type { SphereConfig } from './types.js';

/**
 * Sphere positioning algorithm
 *
 * Distributes slides evenly on a sphere surface using Fibonacci spiral distribution.
 * Creates a 3D globe-like effect.
 */
export function sphere(index: number, total: number, config: SphereConfig = {}): Position {
  const { radius = 4000 } = config;

  // Fibonacci sphere distribution for even spacing
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return {
    x,
    y,
    z,
    rotateX: (phi * 180) / Math.PI - 90,
    rotateY: (theta * 180) / Math.PI,
    rotateZ: 0,
    scale: 1,
  };
}
