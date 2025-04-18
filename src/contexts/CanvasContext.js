import React, { createContext, useContext, useState } from 'react';

// 创建Canvas上下文
const CanvasContext = createContext();

// Canvas上下文提供者组件
export const CanvasProvider = ({ children }) => {
    const [canvasData, setCanvasData] = useState({
        fragments: [],
        selectedFragmentId: null,
        canvasScale: 1,
        showGrid: false
    });

    // 提供上下文值和更新函数
    const contextValue = {
        canvasData,
        setCanvasData,

        // 辅助函数
        selectFragment: (fragmentId) => {
            setCanvasData(prev => ({
                ...prev,
                selectedFragmentId: fragmentId
            }));
        },

        addFragment: (fragment) => {
            setCanvasData(prev => ({
                ...prev,
                fragments: [...prev.fragments, fragment]
            }));
        },

        updateFragment: (fragmentId, updates) => {
            setCanvasData(prev => ({
                ...prev,
                fragments: prev.fragments.map(f =>
                    f.id === fragmentId ? { ...f, ...updates } : f
                )
            }));
        },

        removeFragment: (fragmentId) => {
            setCanvasData(prev => ({
                ...prev,
                fragments: prev.fragments.filter(f => f.id !== fragmentId),
                selectedFragmentId: prev.selectedFragmentId === fragmentId ? null : prev.selectedFragmentId
            }));
        },

        setCanvasScale: (scale) => {
            setCanvasData(prev => ({
                ...prev,
                canvasScale: scale
            }));
        },

        toggleGrid: () => {
            setCanvasData(prev => ({
                ...prev,
                showGrid: !prev.showGrid
            }));
        }
    };

    return (
        <CanvasContext.Provider value={contextValue}>
            {children}
        </CanvasContext.Provider>
    );
};

// 自定义Hook，方便在组件中使用这个上下文
export const useCanvasContext = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvasContext必须在CanvasProvider内部使用');
    }
    return context;
}; 