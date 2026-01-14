import { describe, it, expect } from 'vitest';
import {
  spiral,
  grid,
  herringbone,
  zoom,
  sphere,
  cascade,
  calculatePositions,
  getPositioner,
  isValidLayout,
  getLayoutNames,
} from '../../src/core/positioning/index.js';

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

    it('respects custom config', () => {
      const p = spiral(1, 5, { startRadius: 500, radiusIncrement: 100, angleIncrement: 90 });
      const radius = Math.sqrt(p.x ** 2 + p.y ** 2);
      expect(radius).toBeCloseTo(600, 0);
    });
  });

  describe('Grid', () => {
    it('arranges slides in rows and columns', () => {
      const positions = calculatePositions('grid', 8, { columns: 4 });
      expect(positions[4].y).toBeGreaterThan(positions[0].y); // Row 2 below row 1
      expect(positions[1].x).toBeGreaterThan(positions[0].x); // Col 2 right of col 1
    });

    it('wraps to new row after columns limit', () => {
      const positions = calculatePositions('grid', 5, { columns: 3 });
      expect(positions[3].x).toBe(0); // First column of second row
      expect(positions[3].y).toBeGreaterThan(positions[0].y);
    });

    it('handles single column', () => {
      const positions = calculatePositions('grid', 3, { columns: 1 });
      expect(positions[0].x).toBe(0);
      expect(positions[1].x).toBe(0);
      expect(positions[2].x).toBe(0);
    });
  });

  describe('Herringbone', () => {
    it('alternates y position', () => {
      const p0 = herringbone(0, 5);
      const p1 = herringbone(1, 5);
      expect(p0.y).toBeGreaterThan(0);
      expect(p1.y).toBeLessThan(0);
    });

    it('increments x position', () => {
      const p0 = herringbone(0, 5);
      const p1 = herringbone(1, 5);
      expect(p1.x).toBeGreaterThan(p0.x);
    });

    it('alternates rotation', () => {
      const p0 = herringbone(0, 5);
      const p1 = herringbone(1, 5);
      expect(p0.rotateZ).toBeGreaterThan(0);
      expect(p1.rotateZ).toBeLessThan(0);
    });
  });

  describe('Zoom', () => {
    it('increases scale exponentially', () => {
      const p0 = zoom(0, 5);
      const p2 = zoom(2, 5);
      expect(p2.scale).toBeGreaterThan(p0.scale);
    });

    it('moves along z axis', () => {
      const p0 = zoom(0, 5);
      const p1 = zoom(1, 5);
      expect(p1.z).not.toBe(p0.z);
    });

    it('supports zoom out direction', () => {
      const pIn = zoom(1, 5, { direction: 'in' });
      const pOut = zoom(1, 5, { direction: 'out' });
      expect(pIn.scale).toBeGreaterThan(1);
      expect(pOut.scale).toBeLessThan(1);
    });
  });

  describe('Sphere', () => {
    it('distributes points on sphere surface', () => {
      const positions = calculatePositions('sphere', 10, { radius: 1000 });
      positions.forEach((p) => {
        const r = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2);
        expect(r).toBeCloseTo(1000, 0);
      });
    });

    it('handles small number of slides', () => {
      const positions = calculatePositions('sphere', 2, { radius: 1000 });
      expect(positions).toHaveLength(2);
    });

    it('has rotation to face outward', () => {
      const p = sphere(5, 10);
      expect(typeof p.rotateX).toBe('number');
      expect(typeof p.rotateY).toBe('number');
    });
  });

  describe('Cascade', () => {
    it('increments all axes', () => {
      const p0 = cascade(0, 5);
      const p1 = cascade(1, 5);
      expect(p1.x).toBeGreaterThan(p0.x);
      expect(p1.y).toBeGreaterThan(p0.y);
      expect(p1.z).toBeLessThan(p0.z); // z goes negative
    });

    it('decreases scale progressively', () => {
      const p0 = cascade(0, 5);
      const p3 = cascade(3, 5);
      expect(p3.scale).toBeLessThan(p0.scale);
    });

    it('has minimum scale of 0.5', () => {
      const p = cascade(100, 200);
      expect(p.scale).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Router', () => {
    it('returns correct positioner for each layout', () => {
      const layouts = ['spiral', 'grid', 'herringbone', 'zoom', 'sphere', 'cascade'] as const;
      layouts.forEach((name) => {
        const fn = getPositioner(name);
        expect(typeof fn).toBe('function');
      });
    });

    it('throws for unknown layout', () => {
      expect(() => getPositioner('unknown' as any)).toThrow('Unknown layout: unknown');
    });

    it('validates layout names', () => {
      expect(isValidLayout('grid')).toBe(true);
      expect(isValidLayout('spiral')).toBe(true);
      expect(isValidLayout('invalid')).toBe(false);
    });

    it('returns all layout names', () => {
      const names = getLayoutNames();
      expect(names).toContain('spiral');
      expect(names).toContain('grid');
      expect(names).toContain('herringbone');
      expect(names).toContain('zoom');
      expect(names).toContain('sphere');
      expect(names).toContain('cascade');
    });
  });

  describe('calculatePositions', () => {
    it('generates correct number of positions', () => {
      const positions = calculatePositions('grid', 10);
      expect(positions).toHaveLength(10);
    });

    it('passes config to algorithm', () => {
      const positions = calculatePositions('grid', 4, { columns: 2, cellWidth: 100 });
      expect(positions[2].x).toBe(0); // Third slide starts new row
      expect(positions[1].x).toBe(100);
    });
  });
});
