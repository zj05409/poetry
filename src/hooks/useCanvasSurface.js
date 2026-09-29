import { useEffect, useState } from 'react';
import { BG_WIDTH, BG_HEIGHT } from '../utils/geometry';

// 让画布按容器大小等比缩放，并按设备像素比分配位图，避免高清屏文字发虚。
// 返回的 pixelScale = 逻辑坐标 → 位图像素的比例；surface 变化即需要重绘。
export const useCanvasSurface = (containerRef, canvasRef) => {
    const [surface, setSurface] = useState({ pixelScale: 1, version: 0 });

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return undefined;

        const resize = () => {
            const cssScale = Math.min(container.clientWidth / BG_WIDTH, container.clientHeight / BG_HEIGHT);
            if (!(cssScale > 0)) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            const pixelScale = cssScale * dpr;
            canvas.width = Math.round(BG_WIDTH * pixelScale);
            canvas.height = Math.round(BG_HEIGHT * pixelScale);
            canvas.style.width = `${BG_WIDTH * cssScale}px`;
            canvas.style.height = `${BG_HEIGHT * cssScale}px`;
            setSurface(prev => ({ pixelScale, version: prev.version + 1 }));
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        window.addEventListener('resize', resize); // dpr 变化（缩放 / 换屏）时也要重算
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [containerRef, canvasRef]);

    return surface;
};
