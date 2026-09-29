import { describe, it, expect } from 'vitest';
import { loadJSON, saveJSON, newId } from './storage';

const memoryStore = () => {
    const data = {};
    return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = v; } };
};

describe('storage', () => {
    it('存取往返', () => {
        const s = memoryStore();
        expect(saveJSON('k', { a: [1, 2] }, s)).toBe(true);
        expect(loadJSON('k', null, s)).toEqual({ a: [1, 2] });
    });
    it('缺失或损坏时返回默认值', () => {
        const s = memoryStore();
        expect(loadJSON('none', 'dflt', s)).toBe('dflt');
        s.setItem('bad', '{oops');
        expect(loadJSON('bad', 'dflt', s)).toBe('dflt');
    });
    it('存储抛错时不崩溃', () => {
        const full = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
        expect(saveJSON('k', 1, full)).toBe(false);
    });
    it('newId 唯一', () => {
        expect(newId('x')).not.toBe(newId('x'));
        expect(newId('x')).toMatch(/^x-/);
    });
});
