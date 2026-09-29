// localStorage 的安全封装：隐私模式 / 配额超限时静默降级
const getStore = () => {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
};

export const CANVAS_KEY = 'poetry:canvas:v1';
export const PREFS_KEY = 'poetry:prefs:v1';

export const loadJSON = (key, fallback, store = getStore()) => {
    if (!store) return fallback;
    try {
        const raw = store.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

export const saveJSON = (key, value, store = getStore()) => {
    if (!store) return false;
    try {
        store.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

export const newId = (prefix = 'canvas') =>
    `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
