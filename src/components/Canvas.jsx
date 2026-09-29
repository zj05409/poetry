import React, { useEffect, useRef, useState } from 'react';
import './Canvas.css';
import backgroundImageSrc from '../assets/background.webp';
import { useCanvasContext } from '../contexts/CanvasContext';
import { useCanvasSurface } from '../hooks/useCanvasSurface';
import { useGestures } from '../hooks/useGestures';
import { createCanvasFragment } from '../utils/fragmentFactory';
import { drawScene, exportPng, measureFragment, setFontLoadListener, ensureFragmentStyle } from '../utils/fragmentRenderer';
import { clientToCanvas, isInDropArea, pointInFragment } from '../utils/geometry';

const ARROW_STEP = { ArrowUp: [0, -5], ArrowDown: [0, 5], ArrowLeft: [-5, 0], ArrowRight: [5, 0] };

const isTypingTarget = (el) =>
    !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

const Canvas = ({ fontSize }) => {
    const {
        fragments, selectedFragmentId, selectFragment, addFragment,
        updateFragment, bringToFront, removeFragment, exporterRef
    } = useCanvasContext();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const dragRef = useRef(null);
    const pointersRef = useRef(new Set());
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [background, setBackground] = useState(null);
    const [fontTick, setFontTick] = useState(0);
    const surface = useCanvasSurface(containerRef, canvasRef);

    const selected = fragments.find(f => f.id === selectedFragmentId) || null;
    const live = useRef({});
    live.current = { fragments, selected, fontSize, background };

    // 背景图
    useEffect(() => {
        const img = new Image();
        img.onload = () => setBackground(img);
        img.src = backgroundImageSrc;
    }, []);

    // 网络字体加载完成后重绘
    useEffect(() => {
        setFontLoadListener(() => setFontTick(t => t + 1));
        return () => setFontLoadListener(null);
    }, []);

    // 重绘：rAF 合并同一帧内的多次状态变化
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            drawScene(canvas.getContext('2d'), {
                fragments, selectedId: selectedFragmentId, fontSize, background,
                pixelScale: surface.pixelScale, dropHighlight: isDraggingOver
            });
        });
        return () => cancelAnimationFrame(id);
    }, [fragments, selectedFragmentId, fontSize, background, surface, isDraggingOver, fontTick]);

    // 向工具栏暴露"导出图片"
    useEffect(() => {
        exporterRef.current = () => exportPng({ fragments: live.current.fragments, fontSize: live.current.fontSize, background: live.current.background });
        return () => { exporterRef.current = null; };
    }, [exporterRef]);

    useGestures(containerRef, {
        getSelected: () => live.current.selected,
        onChange: updateFragment
    });

    // 键盘：方向键微调、Delete 删除（输入框聚焦时不响应）
    useEffect(() => {
        const onKeyDown = (e) => {
            const target = live.current.selected;
            if (!target || isTypingTarget(e.target)) return;
            const step = ARROW_STEP[e.key];
            if (step) {
                e.preventDefault();
                updateFragment(target.id, { x: target.x + step[0], y: target.y + step[1] });
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                removeFragment(target.id);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [updateFragment, removeFragment]);

    const toCanvasPoint = (e) => clientToCanvas(e.clientX, e.clientY, canvasRef.current.getBoundingClientRect());

    // ---- 从托盘拖放 ----
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
        const { x, y } = toCanvasPoint(e);
        e.dataTransfer.dropEffect = isInDropArea(x, y) ? 'copy' : 'none';
    };

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const { x, y } = toCanvasPoint(e);
        if (!isInDropArea(x, y)) return;
        try {
            const source = JSON.parse(e.dataTransfer.getData('text/plain'));
            addFragment(createCanvasFragment(source, { x, y, rotation: Math.random() * 10 - 5 }));
        } catch (error) {
            console.error('拖放处理错误:', error);
        }
    };

    // ---- 指针：点选 + 拖动（鼠标 / 触摸 / 笔统一） ----
    const hitTest = (point) => {
        const sorted = [...live.current.fragments].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        return sorted.find(f => {
            const styled = ensureFragmentStyle(f);
            const { noteWidth, noteHeight } = measureFragment(styled, live.current.fontSize);
            return pointInFragment(point.x, point.y, f, noteWidth, noteHeight);
        }) || null;
    };

    const handlePointerDown = (e) => {
        if (e.target.closest('.canvas-controls')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        pointersRef.current.add(e.pointerId);
        if (pointersRef.current.size > 1) { dragRef.current = null; return; } // 双指手势交给 Hammer

        const point = toCanvasPoint(e);
        const hit = hitTest(point);
        if (!hit) {
            selectFragment(null);
            return;
        }
        selectFragment(hit.id);
        bringToFront(hit.id);
        dragRef.current = { id: hit.id, dx: point.x - hit.x, dy: point.y - hit.y };
        containerRef.current.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag || pointersRef.current.size !== 1) return;
        const point = toCanvasPoint(e);
        updateFragment(drag.id, { x: point.x - drag.dx, y: point.y - drag.dy });
    };

    const handlePointerEnd = (e) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) dragRef.current = null;
    };

    return (
        <div
            className="canvas-container"
            ref={containerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
        >
            <canvas ref={canvasRef} className="poetry-canvas" />

            {fragments.length === 0 && (
                <div className="empty-canvas-prompt">试着把第一个碎片拖到这里（或双击右侧碎片）</div>
            )}

            {selected && (
                <div className="canvas-controls">
                    <button className="delete-button" onClick={() => removeFragment(selected.id)} title="删除碎片">
                        <svg viewBox="0 0 24 24" className="control-icon">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Canvas;
