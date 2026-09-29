import { describe, it, expect } from 'vitest';
import { generateEdgePoints, scaleEdgePoints, getBounds } from './fragmentShape';

const seeded = (seed = 1) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

describe('generateEdgePoints', () => {
    it('生成 40 个有限的点', () => {
        const pts = generateEdgePoints(seeded(42));
        expect(pts).toHaveLength(40);
        pts.forEach(p => {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        });
    });

    it('轮廓大致接近单位矩形', () => {
        for (let s = 1; s < 50; s++) {
            const b = getBounds(generateEdgePoints(seeded(s)));
            expect(b.minX).toBeGreaterThan(-1.6);
            expect(b.maxX).toBeLessThan(1.6);
            expect(b.minY).toBeGreaterThan(-1.6);
            expect(b.maxY).toBeLessThan(1.6);
        }
    });

    it('相同随机序列得到相同结果', () => {
        expect(generateEdgePoints(seeded(7))).toEqual(generateEdgePoints(seeded(7)));
    });
});

describe('scaleEdgePoints', () => {
    it('按半宽 / 半高缩放', () => {
        expect(scaleEdgePoints([{ x: 1, y: -1 }], 100, 40)).toEqual([{ x: 50, y: -20 }]);
    });
});
