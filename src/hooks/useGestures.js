import { useEffect, useRef } from 'react';
import Hammer from 'hammerjs';
import { clamp, snapAngle } from '../utils/geometry';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// 双指缩放 / 旋转（触屏）以及滚轮缩放 / Shift+滚轮旋转（桌面）。
// getSelected / onChange 通过 ref 读取最新值，避免闭包过期、也不必反复重建 Hammer。
export const useGestures = (containerRef, { getSelected, onChange }) => {
    const latest = useRef({ getSelected, onChange });
    latest.current = { getSelected, onChange };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return undefined;

        const base = { scale: 1, rotation: 0 };
        const hammer = new Hammer.Manager(el, {
            recognizers: [[Hammer.Pinch], [Hammer.Rotate, {}, ['pinch']]]
        });

        const begin = () => {
            const f = latest.current.getSelected();
            if (f) { base.scale = f.scale || 1; base.rotation = f.rotation || 0; }
        };
        hammer.on('pinchstart rotatestart', begin);
        // Hammer 的 e.scale / e.rotation 是相对手势起点的累计值
        hammer.on('pinchmove', (e) => {
            const f = latest.current.getSelected();
            if (f) latest.current.onChange(f.id, { scale: clamp(base.scale * e.scale, MIN_SCALE, MAX_SCALE) });
        });
        hammer.on('rotatemove', (e) => {
            const f = latest.current.getSelected();
            if (f) latest.current.onChange(f.id, { rotation: snapAngle(base.rotation + e.rotation) });
        });

        const onWheel = (e) => {
            const f = latest.current.getSelected();
            if (!f) return;
            e.preventDefault();
            if (e.shiftKey) {
                const delta = (e.deltaY || e.deltaX) > 0 ? 5 : -5;
                latest.current.onChange(f.id, { rotation: (f.rotation || 0) + delta });
            } else {
                const factor = e.deltaY > 0 ? 0.95 : 1.05;
                latest.current.onChange(f.id, { scale: clamp((f.scale || 1) * factor, MIN_SCALE, MAX_SCALE) });
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            hammer.destroy();
            el.removeEventListener('wheel', onWheel);
        };
    }, [containerRef]);
};
