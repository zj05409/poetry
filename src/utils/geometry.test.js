import { describe, it, expect } from 'vitest';
import { BG_WIDTH, BG_HEIGHT, clamp, clientToCanvas, isInDropArea, pointInFragment, snapAngle } from './geometry';

describe('clientToCanvas', () => {
    it('按显示尺寸折算到逻辑坐标', () => {
        const rect = { left: 100, top: 50, width: BG_WIDTH / 2, height: BG_HEIGHT / 2 };
        expect(clientToCanvas(100 + BG_WIDTH / 4, 50 + BG_HEIGHT / 4, rect)).toEqual({ x: BG_WIDTH / 2, y: BG_HEIGHT / 2 });
    });
});

describe('isInDropArea', () => {
    it('中心在内，角落在外', () => {
        expect(isInDropArea(BG_WIDTH / 2, BG_HEIGHT / 2)).toBe(true);
        expect(isInDropArea(5, 5)).toBe(false);
    });
});

describe('pointInFragment', () => {
    const f = { x: 100, y: 100, rotation: 0, scale: 1 };
    it('未旋转时按矩形判断', () => {
        expect(pointInFragment(110, 100, f, 40, 20)).toBe(true);
        expect(pointInFragment(130, 100, f, 40, 20)).toBe(false);
    });
    it('旋转 90° 后长宽互换', () => {
        const r = { ...f, rotation: 90 };
        expect(pointInFragment(100, 115, r, 40, 20)).toBe(true); // 原本的横条变成竖条
        expect(pointInFragment(115, 100, r, 40, 20)).toBe(false);
        expect(pointInFragment(115, 100, r, 20, 40)).toBe(true);
    });
    it('考虑缩放', () => {
        expect(pointInFragment(130, 100, { ...f, scale: 2 }, 40, 20)).toBe(true);
    });
});

describe('clamp / snapAngle', () => {
    it('clamp', () => expect([clamp(5, 0, 3), clamp(-1, 0, 3), clamp(2, 0, 3)]).toEqual([3, 0, 2]));
    it('snapAngle 吸附到 15°', () => expect([snapAngle(7), snapAngle(8), snapAngle(-22)]).toEqual([0, 15, -15]));
});
