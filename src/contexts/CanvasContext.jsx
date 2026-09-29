import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CANVAS_KEY, loadJSON, saveJSON } from '../utils/storage';
import { ensureFragmentStyle } from '../utils/fragmentRenderer';

// 画布状态的唯一来源：碎片列表 + 选中项，并负责本地自动保存
const CanvasContext = createContext(null);

const SAVE_DELAY = 500;

const loadInitialFragments = () => {
    const saved = loadJSON(CANVAS_KEY, null);
    return Array.isArray(saved?.fragments) ? saved.fragments.map(ensureFragmentStyle) : [];
};

export const CanvasProvider = ({ children }) => {
    const [fragments, setFragments] = useState(loadInitialFragments);
    const [selectedFragmentId, setSelectedFragmentId] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
    const fragmentsRef = useRef(fragments);
    const exporterRef = useRef(null); // Canvas 组件注册的导出函数
    const statusTimer = useRef(null);
    const saveTimer = useRef(null);

    const persist = useCallback(() => {
        clearTimeout(saveTimer.current);
        const ok = saveJSON(CANVAS_KEY, { savedAt: Date.now(), fragments: fragmentsRef.current });
        setSaveStatus(ok ? 'saved' : 'idle');
        clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setSaveStatus('idle'), 1500);
        return ok;
    }, []);

    // 碎片变化后防抖自动保存
    const firstRun = useRef(true);
    useEffect(() => {
        fragmentsRef.current = fragments;
        if (firstRun.current) { firstRun.current = false; return undefined; }
        saveTimer.current = setTimeout(() => saveJSON(CANVAS_KEY, { savedAt: Date.now(), fragments }), SAVE_DELAY);
        return () => clearTimeout(saveTimer.current);
    }, [fragments]);

    // 页面关闭前保证落盘
    useEffect(() => {
        const flush = () => saveJSON(CANVAS_KEY, { savedAt: Date.now(), fragments: fragmentsRef.current });
        window.addEventListener('pagehide', flush);
        return () => window.removeEventListener('pagehide', flush);
    }, []);

    const value = useMemo(() => ({
        fragments,
        selectedFragmentId,
        saveStatus,
        exporterRef,
        selectFragment: setSelectedFragmentId,
        addFragment: (fragment) => {
            setFragments(prev => [...prev, { ...fragment, zIndex: prev.reduce((m, f) => Math.max(m, f.zIndex || 0), 0) + 1 }]);
            setSelectedFragmentId(fragment.id);
        },
        updateFragment: (id, updates) =>
            setFragments(prev => prev.map(f => (f.id === id ? { ...f, ...(typeof updates === 'function' ? updates(f) : updates) } : f))),
        bringToFront: (id) =>
            setFragments(prev => {
                const top = prev.reduce((m, f) => Math.max(m, f.zIndex || 0), 0);
                const target = prev.find(f => f.id === id);
                if (!target || (target.zIndex || 0) === top) return prev;
                return prev.map(f => (f.id === id ? { ...f, zIndex: top + 1 } : f));
            }),
        removeFragment: (id) => {
            setFragments(prev => prev.filter(f => f.id !== id));
            setSelectedFragmentId(prev => (prev === id ? null : prev));
        },
        clearFragments: () => {
            setFragments([]);
            setSelectedFragmentId(null);
        },
        saveNow: persist
    }), [fragments, selectedFragmentId, saveStatus, persist]);

    return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};

export const useCanvasContext = () => {
    const context = useContext(CanvasContext);
    if (!context) throw new Error('useCanvasContext必须在CanvasProvider内部使用');
    return context;
};
