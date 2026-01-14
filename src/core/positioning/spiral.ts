import type { Position } from '../../types.js';
import type { SpiralConfig } from './types.js';

/**
 * Spiral positioning algorithm
 *
 * Creates a spiral pattern expanding outward from the center.
 * Each slide is positioned at an increasing radius with rotation.
 */
export function spiral(index: number, total: number, config: SpiralConfig = {}): Position {
  const { startRadius = 1000, radiusIncrement = 300, angleIncrement = 45 } = config;

  const angle = index * angleIncrement * (Math.PI / 180);
  const radius = startRadius + index * radiusIncrement;

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: (index * angleIncrement) % 360,
    scale: 1,
  };
}
