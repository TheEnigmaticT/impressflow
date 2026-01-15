import type { Position } from '../../types.js';
import type { LineConfig } from './types.js';

/**
 * Line positioning algorithm
 *
 * Arranges slides in a line with optional vertical drops.
 * By default slides go horizontally (right). When a slide is marked
 * with a direction of 'down', the next slide appears below it.
 *
 * This creates a path like:
 *   [1] → [2] → [3]
 *                ↓
 *   [6] ← [5] ← [4]
 *    ↓
 *   [7] → [8] → ...
 */
export function line(index: number, total: number, config: LineConfig = {}): Position {
  const {
    stepX = 2200,
    stepY = 1400,
    directions = [],
  } = config;

  // Calculate position by walking through all previous slides
  let x = 0;
  let y = 0;
  let currentDirection: 'right' | 'left' = 'right';

  for (let i = 0; i < index; i++) {
    // Move in current direction
    if (currentDirection === 'right') {
      x += stepX;
    } else {
      x -= stepX;
    }

    // Check if this slide has a 'down' marker (affects next slide)
    if (directions[i] === 'down') {
      // Next slide goes down, then we reverse horizontal direction
      y += stepY;
      currentDirection = currentDirection === 'right' ? 'left' : 'right';
      // Undo the horizontal move since we're going down instead
      if (currentDirection === 'left') {
        x -= stepX; // We moved right but should stay in place for down
      } else {
        x += stepX; // We moved left but should stay in place for down
      }
    }
  }

  return {
    x,
    y,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
  };
}

/**
 * Pre-calculate all line positions at once
 * This is more efficient than calculating per-index for line layout
 */
export function calculateLinePositions(
  total: number,
  config: LineConfig = {}
): Position[] {
  const {
    stepX = 2200,
    stepY = 1400,
    directions = [],
  } = config;

  const positions: Position[] = [];
  let x = 0;
  let y = 0;
  let horizontalDir: 1 | -1 = 1; // 1 = right, -1 = left

  for (let i = 0; i < total; i++) {
    // Record current position
    positions.push({
      x,
      y,
      z: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
    });

    // Determine next move based on direction marker
    if (directions[i] === 'down') {
      // Move down and reverse horizontal direction
      y += stepY;
      horizontalDir = horizontalDir === 1 ? -1 : 1;
    } else {
      // Move horizontally
      x += stepX * horizontalDir;
    }
  }

  return positions;
}
