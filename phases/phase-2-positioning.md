# Phase 2: Positioning Algorithms

**Completion Promise:** `<promise>PHASE_2_COMPLETE</promise>`

## Scope
Implement all 6 spatial positioning algorithms for impress.js.

## Tasks
1. Define Position interface (already in types.ts)
2. Implement spiral algorithm
3. Implement grid algorithm
4. Implement herringbone algorithm
5. Implement zoom algorithm
6. Implement sphere algorithm
7. Implement cascade algorithm
8. Create algorithm router

## Files to Create

```
src/core/positioning/
├── index.ts          # Router: getPositioner(name) → algorithm
├── types.ts          # Config interfaces for each algorithm
├── spiral.ts
├── grid.ts
├── herringbone.ts
├── zoom.ts
├── sphere.ts
└── cascade.ts
```

## Algorithm Implementations

### spiral.ts
```typescript
import { Position } from '../../types';

export interface SpiralConfig {
  startRadius?: number;      // Default: 1000
  radiusIncrement?: number;  // Default: 300
  angleIncrement?: number;   // Default: 45 (degrees)
}

export function spiral(index: number, total: number, config: SpiralConfig = {}): Position {
  const { startRadius = 1000, radiusIncrement = 300, angleIncrement = 45 } = config;
  
  const angle = index * angleIncrement * (Math.PI / 180);
  const radius = startRadius + (index * radiusIncrement);
  
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: (index * angleIncrement) % 360,
    scale: 1
  };
}
```

### grid.ts
```typescript
export interface GridConfig {
  columns?: number;    // Default: 4
  cellWidth?: number;  // Default: 2200
  cellHeight?: number; // Default: 1400
}

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
    scale: 1
  };
}
```

### herringbone.ts
```typescript
export interface HerringboneConfig {
  stepX?: number;           // Default: 1800
  zigzagAmplitude?: number; // Default: 600
  rotationAngle?: number;   // Default: 15
}

export function herringbone(index: number, total: number, config: HerringboneConfig = {}): Position {
  const { stepX = 1800, zigzagAmplitude = 600, rotationAngle = 15 } = config;
  
  const direction = index % 2 === 0 ? 1 : -1;
  
  return {
    x: index * stepX,
    y: direction * zigzagAmplitude,
    z: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: direction * rotationAngle,
    scale: 1
  };
}
```

### zoom.ts
```typescript
export interface ZoomConfig {
  scaleMultiplier?: number; // Default: 3
  zDepth?: number;          // Default: -3000
  direction?: 'in' | 'out'; // Default: 'in'
}

export function zoom(index: number, total: number, config: ZoomConfig = {}): Position {
  const { scaleMultiplier = 3, zDepth = -3000, direction = 'in' } = config;
  
  const scaleFactor = direction === 'in' 
    ? Math.pow(scaleMultiplier, index)
    : Math.pow(1 / scaleMultiplier, index);
  
  return {
    x: 0,
    y: 0,
    z: index * zDepth,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: scaleFactor
  };
}
```

### sphere.ts
```typescript
export interface SphereConfig {
  radius?: number; // Default: 4000
}

export function sphere(index: number, total: number, config: SphereConfig = {}): Position {
  const { radius = 4000 } = config;
  
  // Fibonacci sphere distribution
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  
  return {
    x, y, z,
    rotateX: (phi * 180 / Math.PI) - 90,
    rotateY: theta * 180 / Math.PI,
    rotateZ: 0,
    scale: 1
  };
}
```

### cascade.ts
```typescript
export interface CascadeConfig {
  stepX?: number;    // Default: 1600
  stepY?: number;    // Default: 800
  stepZ?: number;    // Default: -200
  rotation?: number; // Default: 5
}

export function cascade(index: number, total: number, config: CascadeConfig = {}): Position {
  const { stepX = 1600, stepY = 800, stepZ = -200, rotation = 5 } = config;
  
  return {
    x: index * stepX,
    y: index * stepY,
    z: index * stepZ,
    rotateX: index * rotation * 0.5,
    rotateY: 0,
    rotateZ: index * rotation,
    scale: Math.max(0.5, 1 - (index * 0.02))
  };
}
```

### index.ts (router)
```typescript
import { Position } from '../../types';
import { spiral } from './spiral';
import { grid } from './grid';
import { herringbone } from './herringbone';
import { zoom } from './zoom';
import { sphere } from './sphere';
import { cascade } from './cascade';

export type LayoutName = 'spiral' | 'grid' | 'herringbone' | 'zoom' | 'sphere' | 'cascade';

type PositionFn = (index: number, total: number, config?: any) => Position;

const algorithms: Record<LayoutName, PositionFn> = {
  spiral, grid, herringbone, zoom, sphere, cascade
};

export function getPositioner(name: LayoutName): PositionFn {
  const fn = algorithms[name];
  if (!fn) throw new Error(`Unknown layout: ${name}`);
  return fn;
}

export function calculatePositions(name: LayoutName, count: number, config?: any): Position[] {
  const fn = getPositioner(name);
  return Array.from({ length: count }, (_, i) => fn(i, count, config));
}
```

## Tests Required

```typescript
// tests/core/positioning.test.ts
describe('Positioning', () => {
  describe('Spiral', () => {
    it('generates increasing radius', () => {
      const p0 = spiral(0, 10);
      const p5 = spiral(5, 10);
      const r0 = Math.sqrt(p0.x ** 2 + p0.y ** 2);
      const r5 = Math.sqrt(p5.x ** 2 + p5.y ** 2);
      expect(r5).toBeGreaterThan(r0);
    });
    
    it('handles single slide', () => {
      const p = spiral(0, 1);
      expect(p).toHaveProperty('x');
      expect(p.scale).toBe(1);
    });
  });

  describe('Grid', () => {
    it('arranges slides in rows and columns', () => {
      const positions = calculatePositions('grid', 8, { columns: 4 });
      expect(positions[4].y).toBeGreaterThan(positions[0].y); // Row 2 below row 1
      expect(positions[1].x).toBeGreaterThan(positions[0].x); // Col 2 right of col 1
    });
  });

  describe('Sphere', () => {
    it('distributes points on sphere surface', () => {
      const positions = calculatePositions('sphere', 10, { radius: 1000 });
      positions.forEach(p => {
        const r = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2);
        expect(r).toBeCloseTo(1000, 0);
      });
    });
  });

  describe('Zoom', () => {
    it('increases scale exponentially', () => {
      const p0 = zoom(0, 5);
      const p2 = zoom(2, 5);
      expect(p2.scale).toBeGreaterThan(p0.scale);
    });
  });
});
```

## Verification

```bash
npm run typecheck && npm run test -- tests/core/positioning.test.ts
```
