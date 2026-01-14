import type { Position } from '../../types.js';
import type { HerringboneConfig } from './types.js';

/**
 * Herringbone positioning algorithm
 *
 * Creates a zigzag pattern alternating above and below a central line,
 * with slight rotation for visual interest.
 */
export function herringbone(
  index: number,
  total: number,
  config: HerringboneConfig = {}
): Position {
  const { stepX = 1800, zigzagAmplitude = 600, rotationAngle = 15 } = config;

  const direction = index % 2 === 0 ? 1 : -1;

  return {
    x: index * stepX,
    y: direction * zigzagAmplitude,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: direction * rotationAngle,
    scale: 1,
  };
}
