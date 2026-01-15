/**
 * Configuration interfaces for each positioning algorithm
 */

export interface SpiralConfig {
  startRadius?: number;      // Default: 1000
  radiusIncrement?: number;  // Default: 300
  angleIncrement?: number;   // Default: 45 (degrees)
}

export interface GridConfig {
  columns?: number;    // Default: 4
  cellWidth?: number;  // Default: 2200
  cellHeight?: number; // Default: 1400
}

export interface HerringboneConfig {
  stepX?: number;           // Default: 1800
  zigzagAmplitude?: number; // Default: 600
  rotationAngle?: number;   // Default: 15
}

export interface ZoomConfig {
  scaleMultiplier?: number; // Default: 3
  zDepth?: number;          // Default: -3000
  direction?: 'in' | 'out'; // Default: 'in'
}

export interface SphereConfig {
  radius?: number; // Default: 4000
}

export interface CascadeConfig {
  stepX?: number;    // Default: 1600
  stepY?: number;    // Default: 800
  stepZ?: number;    // Default: -200
  rotation?: number; // Default: 5
}

export interface LineConfig {
  stepX?: number;                        // Default: 2200
  stepY?: number;                        // Default: 1400
  directions?: Array<'right' | 'down'>;  // Direction after each slide
}

export type PositionConfig =
  | SpiralConfig
  | GridConfig
  | HerringboneConfig
  | ZoomConfig
  | SphereConfig
  | CascadeConfig
  | LineConfig;
