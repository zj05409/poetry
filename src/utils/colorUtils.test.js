import { describe, it, expect } from 'vitest';
import { generateRandomColors } from './colorUtils';

describe('generateRandomColors', () => {
    it('每次都返回可绘制的样式数据', () => {
        for (let i = 0; i < 200; i++) {
            const c = generateRandomColors();
            expect(['solid', 'gradient', 'textured', 'parchment']).toContain(c.backgroundType);
            expect(typeof c.text).toBe('string');
            expect(c.fontStyles.family).toBeTruthy();
            expect(c.fontStyles.sizeModifier).toBeGreaterThan(0.8);
        }
    });
});
