import React, { useRef, useEffect, useState } from 'react';
import Hammer from 'hammerjs';
import './Canvas.css';
import { generateRandomColors } from '../utils/colorUtils';
import { paperTexture } from '../utils/textures';

// 在组件外部添加 roundRect 的 polyfill
// 如果浏览器不支持 roundRect 方法，添加一个自定义实现
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

// 生成剪刀剪切的不规则路径 - 接近矩形但边缘略微不齐
function createScissorsPath(ctx, x, y, width, height, fragment) {
    // 如果已经有缓存的路径点，则使用已有的
    if (fragment.edgePoints) {
        // 缩放点以适应实际尺寸
        const scaledPoints = fragment.edgePoints.map(point => ({
            x: point.x * (width / 2),
            y: point.y * (height / 2)
        }));
        drawScissorsPathFromPoints(ctx, scaledPoints);
        return;
    }

    // 没有缓存，生成新的路径点
    const segmentsPerSide = 10; // 每边的点数
    const totalPoints = segmentsPerSide * 4;
    const points = [];

    // 为每条边随机选择一种变形效果
    // 0: 基本直边(微调), 1: 拉长/缩短, 2: 弧线, 3: 邮票锯齿, 4: 钝角
    const edgeEffects = [
        Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 5)
    ];

    // 确保至少有一种每种效果
    if (!edgeEffects.includes(1)) edgeEffects[Math.floor(Math.random() * 4)] = 1;
    if (!edgeEffects.includes(2)) edgeEffects[Math.floor(Math.random() * 4)] = 2;
    if (!edgeEffects.includes(3)) edgeEffects[Math.floor(Math.random() * 4)] = 3;
    if (!edgeEffects.includes(4)) edgeEffects[Math.floor(Math.random() * 4)] = 4;

    for (let i = 0; i < totalPoints; i++) {
        let baseX, baseY;
        const sideIndex = Math.floor(i / segmentsPerSide);
        const sidePos = (i % segmentsPerSide) / segmentsPerSide;
        const edgeEffect = edgeEffects[sideIndex];

        // 确定基础点位置（矩形的四条边）
        switch (sideIndex) {
            case 0: // 上边
                baseX = -width / 2 + width * sidePos;
                baseY = -height / 2;
                break;
            case 1: // 右边
                baseX = width / 2;
                baseY = -height / 2 + height * sidePos;
                break;
            case 2: // 下边
                baseX = width / 2 - width * sidePos;
                baseY = height / 2;
                break;
            case 3: // 左边
                baseX = -width / 2;
                baseY = height / 2 - height * sidePos;
                break;
        }

        // 应用选择的边缘效果
        let finalX = baseX;
        let finalY = baseY;
        const noiseAmount = 0.1 * Math.min(width, height); // 噪点大小随碎片大小调整

        switch (edgeEffect) {
            case 0: // 基本直边(微调)
                // 添加轻微的随机偏移
                if (sideIndex === 0 || sideIndex === 2) { // 上下边
                    finalY += (Math.random() - 0.5) * noiseAmount;
                } else { // 左右边
                    finalX += (Math.random() - 0.5) * noiseAmount;
                }
                break;

            case 1: // 拉长/缩短
                // 决定是拉长还是缩短 (0.7-1.3倍)
                const scaleFactor = 0.7 + Math.random() * 0.6;
                if (sideIndex === 0) { // 上边
                    finalY = -height / 2 * scaleFactor;
                } else if (sideIndex === 1) { // 右边
                    finalX = width / 2 * scaleFactor;
                } else if (sideIndex === 2) { // 下边
                    finalY = height / 2 * scaleFactor;
                } else { // 左边
                    finalX = -width / 2 * scaleFactor;
                }
                break;

            case 2: // 弧线效果
                // 通过正弦函数创建弧形
                const arcHeight = (0.1 + Math.random() * 0.2) * Math.min(width, height) / 2; // 弧高
                if (sideIndex === 0) { // 上边
                    finalY += Math.sin(sidePos * Math.PI) * arcHeight;
                } else if (sideIndex === 1) { // 右边
                    finalX += Math.sin(sidePos * Math.PI) * arcHeight;
                } else if (sideIndex === 2) { // 下边
                    finalY += Math.sin(sidePos * Math.PI) * arcHeight;
                } else { // 左边
                    finalX -= Math.sin(sidePos * Math.PI) * arcHeight;
                }
                break;

            case 3: // 邮票锯齿
                const teethSize = (0.03 + Math.random() * 0.04) * Math.min(width, height); // 锯齿大小
                const teethFreq = 6 + Math.floor(Math.random() * 8); // 锯齿频率

                if (sideIndex === 0) { // 上边
                    finalY -= Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                } else if (sideIndex === 1) { // 右边
                    finalX += Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                } else if (sideIndex === 2) { // 下边
                    finalY += Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                } else { // 左边
                    finalX -= Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                }
                break;

            case 4: // 接近平角的钝角
                // 钝角效果 - 在中间点处添加一个接近平角的折线
                if (sidePos > 0.4 && sidePos < 0.6) {
                    const bendAmount = (0.15 + Math.random() * 0.1) * Math.min(width, height) / 2; // 折线程度
                    // 最接近中点的位置产生最大偏移
                    const normalizedPos = Math.abs(sidePos - 0.5) / 0.1; // 0.0-1.0
                    const offset = bendAmount * Math.max(0, 1 - normalizedPos);

                    if (sideIndex === 0) { // 上边
                        finalY += offset;
                    } else if (sideIndex === 1) { // 右边
                        finalX -= offset;
                    } else if (sideIndex === 2) { // 下边
                        finalY -= offset;
                    } else { // 左边
                        finalX += offset;
                    }
                }
                break;
        }

        points.push({ x: finalX, y: finalY });
    }

    // 缓存路径点以便重用（归一化处理）
    fragment.edgePoints = points.map(point => ({
        x: point.x / (width / 2),
        y: point.y / (height / 2)
    }));

    // 绘制路径
    drawScissorsPathFromPoints(ctx, points);
}

// 根据点集合绘制路径
function drawScissorsPathFromPoints(ctx, points) {
    if (!points || points.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    // 使用线段连接各点而不是贝塞尔曲线，使边缘看起来更像剪刀切的
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    // 闭合路径
    ctx.closePath();
}

// 绘制纸条翘起的效果
function drawPaperLift(ctx, fragment, width, height) {
    // 如果没有预设的翘起数据，生成一个
    if (!fragment.liftData) {
        // 随机决定哪条边或哪个角会翘起
        const liftOptions = ['top', 'right', 'bottom', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'];
        const liftType = liftOptions[Math.floor(Math.random() * liftOptions.length)];

        // 翘起的程度 (10-25像素)
        const liftAmount = 10 + Math.random() * 15;

        // 翘起的宽度/范围
        const liftWidth = width * (0.3 + Math.random() * 0.3); // 30%-60%的边长

        fragment.liftData = {
            type: liftType,
            amount: liftAmount,
            width: liftWidth,
            // 随机控制点偏移，使曲线更自然
            ctrlOffset1: 0.3 + Math.random() * 0.2,
            ctrlOffset2: 0.6 + Math.random() * 0.2
        };
    }

    const { type, amount, width: liftWidth, ctrlOffset1, ctrlOffset2 } = fragment.liftData;

    // 设置阴影效果增强立体感
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = amount * 0.4;
    ctx.shadowOffsetY = amount * 0.4;

    // 开始绘制翘起部分
    ctx.beginPath();

    // 根据不同的翘起类型设置不同的路径
    switch (type) {
        case 'top':
            // 顶部中间翘起
            // 起点（左上）
            ctx.moveTo(-width / 2, -height / 2);

            // 左侧到翘起开始
            ctx.lineTo(-liftWidth / 2, -height / 2);

            // 绘制翘起的曲线
            ctx.bezierCurveTo(
                -liftWidth / 2 + liftWidth * ctrlOffset1, -height / 2 - amount * 0.5, // 第一控制点
                -liftWidth / 2 + liftWidth * ctrlOffset2, -height / 2 - amount, // 第二控制点
                liftWidth / 2, -height / 2 - amount * 0.8 // 翘起最高点
            );

            // 曲线回落
            ctx.bezierCurveTo(
                liftWidth / 2 + liftWidth * (1 - ctrlOffset2) * 0.5, -height / 2 - amount, // 第一控制点
                liftWidth / 2 + liftWidth * (1 - ctrlOffset1) * 0.5, -height / 2 - amount * 0.5, // 第二控制点
                width / 2, -height / 2 // 终点（右上）
            );

            // 完成矩形其余部分
            ctx.lineTo(width / 2, height / 2); // 右下
            ctx.lineTo(-width / 2, height / 2); // 左下
            ctx.closePath();
            break;

        case 'right':
            // 右侧中间翘起
            ctx.moveTo(-width / 2, -height / 2); // 左上
            ctx.lineTo(width / 2, -height / 2); // 右上

            // 右上到翘起开始
            ctx.lineTo(width / 2, -liftWidth / 2);

            // 绘制翘起的曲线
            ctx.bezierCurveTo(
                width / 2 + amount * 0.5, -liftWidth / 2 + liftWidth * ctrlOffset1, // 第一控制点
                width / 2 + amount, -liftWidth / 2 + liftWidth * ctrlOffset2, // 第二控制点
                width / 2 + amount * 0.8, liftWidth / 2 // 翘起最突出点
            );

            // 曲线回落
            ctx.bezierCurveTo(
                width / 2 + amount, liftWidth / 2 + liftWidth * (1 - ctrlOffset2) * 0.5, // 第一控制点
                width / 2 + amount * 0.5, liftWidth / 2 + liftWidth * (1 - ctrlOffset1) * 0.5, // 第二控制点
                width / 2, height / 2 // 终点（右下）
            );

            // 完成矩形其余部分
            ctx.lineTo(-width / 2, height / 2); // 左下
            ctx.closePath();
            break;

        case 'bottom':
            // 底部中间翘起
            ctx.moveTo(-width / 2, -height / 2); // 左上
            ctx.lineTo(width / 2, -height / 2); // 右上
            ctx.lineTo(width / 2, height / 2); // 右下

            // 右下到翘起开始
            ctx.lineTo(liftWidth / 2, height / 2);

            // 绘制翘起的曲线
            ctx.bezierCurveTo(
                liftWidth / 2 - liftWidth * ctrlOffset1, height / 2 + amount * 0.5, // 第一控制点
                liftWidth / 2 - liftWidth * ctrlOffset2, height / 2 + amount, // 第二控制点
                -liftWidth / 2, height / 2 + amount * 0.8 // 翘起最低点
            );

            // 曲线回落
            ctx.bezierCurveTo(
                -liftWidth / 2 - liftWidth * (1 - ctrlOffset2) * 0.5, height / 2 + amount, // 第一控制点
                -liftWidth / 2 - liftWidth * (1 - ctrlOffset1) * 0.5, height / 2 + amount * 0.5, // 第二控制点
                -width / 2, height / 2 // 终点（左下）
            );

            ctx.closePath();
            break;

        case 'left':
            // 左侧中间翘起
            ctx.moveTo(-width / 2, -height / 2); // 左上

            // 左上到翘起开始
            ctx.lineTo(-width / 2, -liftWidth / 2);

            // 绘制翘起的曲线
            ctx.bezierCurveTo(
                -width / 2 - amount * 0.5, -liftWidth / 2 + liftWidth * ctrlOffset1, // 第一控制点
                -width / 2 - amount, -liftWidth / 2 + liftWidth * ctrlOffset2, // 第二控制点
                -width / 2 - amount * 0.8, liftWidth / 2 // 翘起最突出点
            );

            // 曲线回落
            ctx.bezierCurveTo(
                -width / 2 - amount, liftWidth / 2 + liftWidth * (1 - ctrlOffset2) * 0.5, // 第一控制点
                -width / 2 - amount * 0.5, liftWidth / 2 + liftWidth * (1 - ctrlOffset1) * 0.5, // 第二控制点
                -width / 2, height / 2 // 终点（左下）
            );

            // 完成矩形其余部分
            ctx.lineTo(width / 2, height / 2); // 右下
            ctx.lineTo(width / 2, -height / 2); // 右上
            ctx.closePath();
            break;

        case 'topRight':
            // 右上角翘起
            ctx.moveTo(-width / 2, -height / 2); // 左上
            ctx.lineTo(width / 4, -height / 2); // 右上翘起开始点

            // 绘制翘起的曲线
            ctx.bezierCurveTo(
                width / 2 - liftWidth * 0.2, -height / 2 - amount * 0.5, // 第一控制点
                width / 2, -height / 2 - amount * 0.7, // 第二控制点
                width / 2 + amount * 0.5, -height / 2 - amount * 0.5 // 翘起最高点
            );

            // 曲线向右下回落
            ctx.bezierCurveTo(
                width / 2 + amount * 0.3, -height / 4, // 第一控制点
                width / 2 + amount * 0.1, 0, // 第二控制点
                width / 2, height / 4 // 回落到右侧
            );

            // 完成矩形其余部分
            ctx.lineTo(width / 2, height / 2); // 右下
            ctx.lineTo(-width / 2, height / 2); // 左下
            ctx.closePath();
            break;

        // 其他角落的翘起类似实现...
        case 'bottomRight':
        case 'bottomLeft':
        case 'topLeft':
            // 简化处理，只实现一个角的翘起作为示例
            // 实际应用中，可以根据 type 分别实现各个角的翘起效果
            ctx.moveTo(-width / 2, -height / 2); // 左上
            ctx.lineTo(width / 2, -height / 2); // 右上
            ctx.lineTo(width / 2, height / 2); // 右下
            ctx.lineTo(-width / 2, height / 2); // 左下
            ctx.closePath();
            break;

        default:
            // 如果没有有效的翘起类型，绘制普通矩形
            ctx.moveTo(-width / 2, -height / 2); // 左上
            ctx.lineTo(width / 2, -height / 2); // 右上
            ctx.lineTo(width / 2, height / 2); // 右下
            ctx.lineTo(-width / 2, height / 2); // 左下
            ctx.closePath();
    }

    // 不调用fill()，只返回路径
    return true; // 返回true表示已绘制翘起效果
}

const Canvas = ({ selectedFragment, setSelectedFragment, fontSize }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [canvasFragments, setCanvasFragments] = useState([]);
    const [canvasScale, setCanvasScale] = useState(1);
    const [showGrid, setShowGrid] = useState(false);
    const [showEmptyPrompt, setShowEmptyPrompt] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    // 画布尺寸比例（A4）
    const CANVAS_RATIO = 210 / 297;

    // 初始化画布尺寸
    useEffect(() => {
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                // 保存旧尺寸用于计算比例
                const oldWidth = canvasRef.current.width;
                const oldHeight = canvasRef.current.height;

                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;

                // 计算新尺寸
                let canvasWidth, canvasHeight;

                if (containerWidth / containerHeight > CANVAS_RATIO) {
                    canvasHeight = containerHeight * 0.9;
                    canvasWidth = canvasHeight * CANVAS_RATIO;
                } else {
                    canvasWidth = containerWidth * 0.9;
                    canvasHeight = canvasWidth / CANVAS_RATIO;
                }

                // 计算缩放比例
                const scaleX = canvasWidth / oldWidth;
                const scaleY = canvasHeight / oldHeight;

                // 设置新尺寸
                canvasRef.current.width = canvasWidth;
                canvasRef.current.height = canvasHeight;

                // 调整所有碎片的位置
                if (oldWidth > 0 && oldHeight > 0) { // 防止初始化时除以零
                    setCanvasFragments(prev =>
                        prev.map(fragment => ({
                            ...fragment,
                            x: fragment.x * scaleX,
                            y: fragment.y * scaleY
                        }))
                    );
                }

                // 重新绘制
                drawCanvas();
            }
        };

        // 初始调整
        resizeCanvas();

        // 监听窗口大小变化
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    // 处理从托盘添加的新碎片
    useEffect(() => {
        if (selectedFragment && !canvasFragments.find(f => f.id === selectedFragment.id)) {
            // 添加新碎片到画布
            setCanvasFragments(prev => [...prev, selectedFragment]);
            setShowEmptyPrompt(false);
        }
    }, [selectedFragment]);

    // 重绘画布内容
    useEffect(() => {
        drawCanvas();
        // 如果画布上有碎片，隐藏提示
        setShowEmptyPrompt(canvasFragments.length === 0);
    }, [canvasFragments, fontSize, canvasScale]);

    // 设置触摸手势识别
    useEffect(() => {
        if (containerRef.current) {
            const hammer = new Hammer(containerRef.current);

            // 启用旋转和缩放识别
            const pinch = new Hammer.Pinch();
            const rotate = new Hammer.Rotate();
            pinch.recognizeWith(rotate);
            hammer.add([pinch, rotate]);

            // 处理碎片缩放
            hammer.on('pinch', (e) => {
                if (selectedFragment && !isDragging) {
                    const newScale = Math.min(Math.max(selectedFragment.scale * e.scale, 0.5), 3);

                    setCanvasFragments(prev =>
                        prev.map(f =>
                            f.id === selectedFragment.id
                                ? { ...f, scale: newScale }
                                : f
                        )
                    );
                }
            });

            // 处理碎片旋转
            hammer.on('rotate', (e) => {
                if (selectedFragment && !isDragging) {
                    // 计算新旋转角度，以15度为步进单位
                    const currentRotation = selectedFragment.rotation || 0;
                    const rotation = currentRotation + e.rotation;
                    const snappedRotation = Math.round(rotation / 15) * 15;

                    setCanvasFragments(prev =>
                        prev.map(f =>
                            f.id === selectedFragment.id
                                ? { ...f, rotation: snappedRotation }
                                : f
                        )
                    );
                }
            });

            return () => {
                hammer.destroy();
            };
        }
    }, [selectedFragment, isDragging]);

    // 画布拖放处理
    const handleDragOver = (e) => {
        e.preventDefault();
        setShowGrid(true);
    };

    const handleDragLeave = () => {
        setShowGrid(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setShowGrid(false);

        try {
            const fragment = JSON.parse(e.dataTransfer.getData('text/plain'));
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 生成随机颜色和字体样式
            const randomStyles = generateRandomColors();
            console.log("拖放添加碎片，背景类型:", randomStyles.backgroundType,
                "颜色:", randomStyles.background || randomStyles.baseColor ||
            (randomStyles.color1 + "/" + randomStyles.color2));

            // 预先生成边缘点数据 - 创建不规则边缘
            const edgePoints = generateEdgePoints();
            // 随机光照角度
            const lightAngle = Math.random() * Math.PI * 2;

            // 添加随机翘起效果数据
            const liftOptions = ['top', 'right', 'bottom', 'left', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'];
            const liftType = liftOptions[Math.floor(Math.random() * liftOptions.length)];
            const liftAmount = 10 + Math.random() * 15;
            const liftWidth = 30 + Math.random() * 30; // 翘起的宽度范围

            const liftData = {
                type: liftType,
                amount: liftAmount,
                width: liftWidth,
                ctrlOffset1: 0.3 + Math.random() * 0.2,
                ctrlOffset2: 0.6 + Math.random() * 0.2
            };

            // 创建新碎片并添加颜色和字体样式属性
            const newFragment = {
                ...fragment,
                id: `canvas-${Date.now()}`,
                x,
                y,
                rotation: Math.random() * 10 - 5, // 随机轻微旋转
                scale: 1,
                zIndex: canvasFragments.length + 1,
                colors: randomStyles, // 添加随机颜色和字体样式
                edgePoints: edgePoints, // 添加预生成的边缘点
                lightAngle: lightAngle, // 添加光照角度
                liftData: liftData // 添加翘起效果数据
            };

            setCanvasFragments(prev => [...prev, newFragment]);
            setSelectedFragment(newFragment);
            setShowEmptyPrompt(false);
        } catch (error) {
            console.error('拖放处理错误:', error);
        }
    };

    // 生成随机边缘点
    const generateEdgePoints = () => {
        // 使用更接近矩形的基础形状
        const noiseAmount = 0.1; // 大幅降低不规则程度，值越小边缘越平滑
        const points = [];

        // 生成"矩形"的四个边
        const segmentsPerSide = 10; // 每边的点数
        const totalPoints = segmentsPerSide * 4;

        // 为每条边随机选择一种变形效果
        // 0: 基本直边(微调), 1: 拉长/缩短, 2: 弧线, 3: 邮票锯齿, 4: 钝角
        const edgeEffects = [
            Math.floor(Math.random() * 5),
            Math.floor(Math.random() * 5),
            Math.floor(Math.random() * 5),
            Math.floor(Math.random() * 5)
        ];

        // 确保至少有一种每种效果
        if (!edgeEffects.includes(1)) edgeEffects[Math.floor(Math.random() * 4)] = 1;
        if (!edgeEffects.includes(2)) edgeEffects[Math.floor(Math.random() * 4)] = 2;
        if (!edgeEffects.includes(3)) edgeEffects[Math.floor(Math.random() * 4)] = 3;
        if (!edgeEffects.includes(4)) edgeEffects[Math.floor(Math.random() * 4)] = 4;

        for (let i = 0; i < totalPoints; i++) {
            let baseX, baseY;
            const sideIndex = Math.floor(i / segmentsPerSide);
            const sidePos = (i % segmentsPerSide) / segmentsPerSide;
            const edgeEffect = edgeEffects[sideIndex];

            // 确定基础点位置（矩形的四条边）
            switch (sideIndex) {
                case 0: // 上边
                    baseX = -1 + 2 * sidePos;
                    baseY = -1;
                    break;
                case 1: // 右边
                    baseX = 1;
                    baseY = -1 + 2 * sidePos;
                    break;
                case 2: // 下边
                    baseX = 1 - 2 * sidePos;
                    baseY = 1;
                    break;
                case 3: // 左边
                    baseX = -1;
                    baseY = 1 - 2 * sidePos;
                    break;
            }

            // 应用选择的边缘效果
            let finalX = baseX;
            let finalY = baseY;

            switch (edgeEffect) {
                case 0: // 基本直边(微调)
                    // 添加轻微的随机偏移
                    if (sideIndex === 0 || sideIndex === 2) { // 上下边
                        finalY += (Math.random() - 0.5) * noiseAmount;
                    } else { // 左右边
                        finalX += (Math.random() - 0.5) * noiseAmount;
                    }
                    break;

                case 1: // 拉长/缩短
                    // 决定是拉长还是缩短 (0.7-1.3倍)
                    const scaleFactor = 0.7 + Math.random() * 0.6;
                    if (sideIndex === 0) { // 上边
                        finalY = -1 * scaleFactor;
                    } else if (sideIndex === 1) { // 右边
                        finalX = 1 * scaleFactor;
                    } else if (sideIndex === 2) { // 下边
                        finalY = 1 * scaleFactor;
                    } else { // 左边
                        finalX = -1 * scaleFactor;
                    }
                    break;

                case 2: // 弧线效果
                    // 通过正弦函数创建弧形
                    const arcHeight = 0.1 + Math.random() * 0.2; // 弧高 0.1-0.3
                    if (sideIndex === 0) { // 上边
                        finalY += Math.sin(sidePos * Math.PI) * arcHeight;
                    } else if (sideIndex === 1) { // 右边
                        finalX += Math.sin(sidePos * Math.PI) * arcHeight;
                    } else if (sideIndex === 2) { // 下边
                        finalY += Math.sin(sidePos * Math.PI) * arcHeight;
                    } else { // 左边
                        finalX -= Math.sin(sidePos * Math.PI) * arcHeight;
                    }
                    break;

                case 3: // 邮票锯齿
                    const teethSize = 0.03 + Math.random() * 0.04; // 锯齿大小 0.03-0.07
                    const teethFreq = 6 + Math.floor(Math.random() * 8); // 锯齿频率 6-13

                    if (sideIndex === 0) { // 上边
                        finalY -= Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                    } else if (sideIndex === 1) { // 右边
                        finalX += Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                    } else if (sideIndex === 2) { // 下边
                        finalY += Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                    } else { // 左边
                        finalX -= Math.abs(Math.sin(sidePos * Math.PI * teethFreq)) * teethSize;
                    }
                    break;

                case 4: // 接近平角的钝角
                    // 钝角效果 - 在中间点处添加一个接近平角的折线
                    if (sidePos > 0.4 && sidePos < 0.6) {
                        const bendAmount = 0.15 + Math.random() * 0.1; // 折线程度 0.15-0.25
                        // 最接近中点的位置产生最大偏移
                        const normalizedPos = Math.abs(sidePos - 0.5) / 0.1; // 0.0-1.0
                        const offset = bendAmount * Math.max(0, 1 - normalizedPos);

                        if (sideIndex === 0) { // 上边
                            finalY += offset;
                        } else if (sideIndex === 1) { // 右边
                            finalX -= offset;
                        } else if (sideIndex === 2) { // 下边
                            finalY -= offset;
                        } else { // 左边
                            finalX += offset;
                        }
                    }
                    break;
            }

            points.push({ x: finalX, y: finalY });
        }

        return points;
    };

    // 点击画布碎片
    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 反向遍历，以便先检测具有较高z-index的元素
        for (let i = canvasFragments.length - 1; i >= 0; i--) {
            const fragment = canvasFragments[i];

            // 计算旋转后的碎片区域
            const textWidth = getTextWidth(fragment.text, fontSize, fragment.colors?.fontStyles);
            const textHeight = fontSize === 'small' ? 30 : 50;

            // 简化版的碰撞检测（这里没有考虑旋转，实际应用中应考虑）
            if (
                x >= fragment.x - textWidth / 2 &&
                x <= fragment.x + textWidth / 2 &&
                y >= fragment.y - textHeight / 2 &&
                y <= fragment.y + textHeight / 2
            ) {
                setSelectedFragment(fragment);

                // 将选中的碎片提升到最顶层
                setCanvasFragments(prev => [
                    ...prev.filter(f => f.id !== fragment.id),
                    { ...fragment, zIndex: Math.max(...prev.map(f => f.zIndex)) + 1 }
                ]);

                return;
            }
        }

        // 如果点击空白区域，取消选择
        setSelectedFragment(null);
    };

    // 开始拖动画布上的碎片
    const handleStartDrag = (e) => {
        if (!selectedFragment) return;

        setIsDragging(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        // 计算鼠标与碎片中心的偏移
        const offsetX = startX - selectedFragment.x;
        const offsetY = startY - selectedFragment.y;

        const handleMouseMove = (moveEvent) => {
            const newX = moveEvent.clientX - rect.left - offsetX;
            const newY = moveEvent.clientY - rect.top - offsetY;

            // 更新碎片位置
            setCanvasFragments(prev =>
                prev.map(f =>
                    f.id === selectedFragment.id
                        ? { ...f, x: newX, y: newY }
                        : f
                )
            );
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // 获取文本宽度（使用canvas实际测量）
    const getTextWidth = (text, size, fontStyles) => {
        if (!canvasRef.current) {
            // 如果canvas还未初始化，使用估算
            const baseWidth = text.length * (size === 'small' ? 20 : 35);
            return baseWidth;
        }

        const ctx = canvasRef.current.getContext('2d');
        // 如果有指定的字体样式，使用它；否则使用默认样式
        if (fontStyles) {
            const baseSize = size === 'small' ? '18' : '30';
            const fontWeight = fontStyles.weight || 'normal';
            const fontStyle = fontStyles.isItalic ? 'italic' : 'normal';
            const fontFamily = fontStyles.family || 'sans-serif';

            ctx.font = `${fontStyle} ${fontWeight} ${baseSize}px ${fontFamily}`;
        } else {
            ctx.font = `${size === 'small' ? '18' : '30'}px sans-serif`;
        }

        return ctx.measureText(text).width;
    };

    // 绘制画布内容
    const drawCanvas = () => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        // 清除画布
        ctx.clearRect(0, 0, width, height);

        // 绘制网格（如果启用）
        if (showGrid) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 0.5;

            // 5mm网格
            const gridSize = width / 40;

            for (let x = 0; x <= width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            for (let y = 0; y <= height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
        }

        // 按照z-index排序碎片
        const sortedFragments = [...canvasFragments].sort((a, b) => a.zIndex - b.zIndex);

        // 绘制所有碎片
        sortedFragments.forEach(fragment => {
            ctx.save();

            // 移动到碎片位置
            ctx.translate(fragment.x, fragment.y);

            // 应用缩放
            ctx.scale(fragment.scale, fragment.scale);

            // 应用旋转（转换为弧度）
            const rotation = fragment.rotation || 0;
            ctx.rotate((rotation * Math.PI) / 180);

            // 为每个碎片生成或使用已有的颜色和字体样式
            if (!fragment.colors) {
                fragment.colors = generateRandomColors();
            }

            // 设置样式 - 使用随机大小调整
            const sizeModifier = fragment.colors.fontStyles.sizeModifier || 1;
            const baseSize = fontSize === 'small' ? 18 : 30;
            const adjustedSize = Math.round(baseSize * sizeModifier);

            const fontWeight = fragment.colors.fontStyles.weight || 'normal';
            const fontStyle = fragment.colors.fontStyles.isItalic ? 'italic' : 'normal';
            const fontFamily = fragment.colors.fontStyles.family || 'sans-serif';

            ctx.font = `${fontStyle} ${fontWeight} ${adjustedSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 测量文本尺寸
            const textWidth = ctx.measureText(fragment.text).width;
            const textHeight = adjustedSize * 0.8;
            const padding = 15; // 增加填充，给不规则边缘留出空间

            // 纸条的宽度和高度
            const noteWidth = textWidth + padding * 2;
            const noteHeight = textHeight * 2 + padding * 2;

            // 设置主要阴影效果
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            // 创建剪裁路径使碎片具有不规则边缘
            ctx.save();
            createScissorsPath(ctx, 0, 0, noteWidth, noteHeight, fragment);
            ctx.clip();

            // 根据背景类型绘制不同效果
            drawBackgroundByType(ctx, -noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, fragment.colors, fragment);

            // 重置阴影
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // 添加纸质纹理（微妙的线条和颗粒感）
            // 绘制书页纹理 - 减轻纹理效果
            // 只有在不是textured背景类型时添加纹理（避免重复）
            if (fragment.colors.backgroundType !== 'textured') {
                // 1. 细微的纸张纹理底色
                ctx.fillStyle = 'rgba(250, 248, 240, 0.03)'; // 降低不透明度
                ctx.fillRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight);

                // 2. 添加凹凸不平的光影效果
                // 使用渐变创建轻微的光影效果
                const gradientSize = Math.max(noteWidth, noteHeight);

                // 随机光源方向 - 如果没有预设的光源角度，生成一个
                if (!fragment.lightAngle) {
                    fragment.lightAngle = Math.random() * Math.PI * 2;
                }

                // 光源位置 - 从片段中心向光源方向延伸
                const lightX = Math.cos(fragment.lightAngle) * gradientSize / 2;
                const lightY = Math.sin(fragment.lightAngle) * gradientSize / 2;

                // 创建径向渐变
                const gradient = ctx.createRadialGradient(
                    lightX, lightY, 0,
                    lightX, lightY, gradientSize
                );

                // 设置渐变颜色
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)'); // 亮部
                gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)'); // 中性
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)'); // 暗部

                // 应用渐变
                ctx.fillStyle = gradient;
                ctx.fillRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight);
            }

            // 3. 添加微妙的边缘阴影效果
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
            ctx.lineWidth = 0.5;
            // 使用比实际尺寸略小的尺寸，在边缘创建细微的内阴影
            createScissorsPath(ctx, 0, 0, noteWidth * 0.99, noteHeight * 0.99, fragment);
            ctx.stroke();

            // 4. 水平细线（模拟书页线条）- 减少数量
            ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
            for (let y = -noteHeight / 2; y < noteHeight / 2; y += 5) { // 增大间距
                ctx.fillRect(-noteWidth / 2, y, noteWidth, 0.5);
            }

            // 5. 随机细微斑点（模拟纸张颗粒）- 减少数量
            ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'; // 降低不透明度
            for (let i = 0; i < 15; i++) { // 减少数量
                const spotX = (Math.random() - 0.5) * noteWidth;
                const spotY = (Math.random() - 0.5) * noteHeight;
                const spotSize = Math.random() * 0.8 + 0.2; // 减小尺寸
                ctx.beginPath();
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // 6. 随机暗色小印迹 - 减少概率
            if (Math.random() < 0.3) { // 降低概率
                ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'; // 降低不透明度
                const markX = (Math.random() - 0.5) * (noteWidth * 0.7);
                const markY = (Math.random() - 0.5) * (noteHeight * 0.7);
                const markSize = 1 + Math.random() * 3; // 减小尺寸

                // 随机形状的印迹
                const markType = Math.floor(Math.random() * 3);
                if (markType === 0) {
                    // 圆形印迹
                    ctx.beginPath();
                    ctx.arc(markX, markY, markSize, 0, Math.PI * 2);
                    ctx.fill();
                } else if (markType === 1) {
                    // 矩形印迹
                    ctx.fillRect(markX - markSize / 2, markY - markSize / 2, markSize, markSize);
                } else {
                    // 不规则形状
                    ctx.beginPath();
                    ctx.moveTo(markX, markY - markSize / 2);
                    ctx.lineTo(markX + markSize / 2, markY);
                    ctx.lineTo(markX, markY + markSize / 2);
                    ctx.lineTo(markX - markSize / 2, markY);
                    ctx.closePath();
                    ctx.fill();
                }
            }

            // 7. 添加一些微妙的纸质褶皱效果
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 0.7;

            // 添加2-3条随机的轻微弯曲线条模拟纸张的褶皱
            const wrinkleCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < wrinkleCount; i++) {
                // 随机起点和终点
                const startX = -noteWidth / 2 + Math.random() * noteWidth;
                const endX = -noteWidth / 2 + Math.random() * noteWidth;
                const y = -noteHeight / 2 + Math.random() * noteHeight;

                // 控制点 - 添加一些弯曲
                const ctrlX = (startX + endX) / 2;
                const ctrlY = y + (Math.random() - 0.5) * 5;

                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.quadraticCurveTo(ctrlX, ctrlY, endX, y);
                ctx.stroke();
            }

            ctx.restore(); // 恢复剪切区域

            // 如果是选中状态，添加特殊效果
            if (selectedFragment && fragment.id === selectedFragment.id) {
                // 为选中的碎片添加发光效果
                ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
                ctx.shadowBlur = 10;
            }

            // 绘制文本
            ctx.fillStyle = fragment.colors.text;
            ctx.fillText(fragment.text, 0, 0);

            // 重置阴影
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // 如果是选中状态，绘制控制点（使用点状边框而不是实线框）
            if (selectedFragment && fragment.id === selectedFragment.id) {
                const controlFrameWidth = noteWidth + 10;
                const controlFrameHeight = noteHeight + 10;

                // 使用虚线勾勒选中区域
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]); // 虚线效果

                // 使用相同的不规则形状，但略大一些
                ctx.save();
                ctx.scale(1.1, 1.1); // 放大10%
                createScissorsPath(ctx, 0, 0, noteWidth, noteHeight, fragment);
                ctx.stroke();
                ctx.restore();

                ctx.setLineDash([]); // 重置为实线
            }

            ctx.restore();
        });
    };

    // 根据背景类型绘制不同效果
    const drawBackgroundByType = (ctx, x, y, width, height, colorData, fragment) => {
        const { backgroundType } = colorData;

        switch (backgroundType) {
            case 'gradient':
                // 绘制渐变背景
                const gradient = ctx.createLinearGradient(
                    x, y,
                    x + width * Math.cos(colorData.gradientAngle * Math.PI / 180),
                    y + height * Math.sin(colorData.gradientAngle * Math.PI / 180)
                );
                gradient.addColorStop(0, colorData.color1);
                gradient.addColorStop(1, colorData.color2);
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, width, height);
                break;

            case 'textured':
                // 绘制斑驳纹理
                ctx.fillStyle = colorData.baseColor;
                ctx.fillRect(x, y, width, height);

                // 随机噪点
                const spotSize = Math.max(width, height) / colorData.spotDensity;
                const spotCount = Math.floor((width * height) / (spotSize * spotSize) * 2);

                for (let i = 0; i < spotCount; i++) {
                    const spotX = x + Math.random() * width;
                    const spotY = y + Math.random() * height;
                    const spotRadius = Math.random() * spotSize / 2;

                    // 解析基础颜色的HSL值以创建略有不同的斑点颜色
                    const baseHsl = colorData.baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                    if (baseHsl) {
                        const h = parseInt(baseHsl[1]);
                        const s = parseInt(baseHsl[2]);
                        const l = parseInt(baseHsl[3]);

                        // 亮度变化，有些斑点稍暗，有些稍亮
                        const lVariation = l * (1 + (Math.random() - 0.5) * colorData.spotContrast);
                        ctx.fillStyle = `hsl(${h}, ${s}%, ${lVariation}%)`;

                        ctx.beginPath();
                        ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;

            case 'parchment':
                // 绘制宣纸/羊皮纸效果
                // 1. 绘制基础背景色
                ctx.fillStyle = colorData.baseColor;
                ctx.fillRect(x, y, width, height);

                // 2. 添加微妙的纸张纹理纤维 - 模拟宣纸的纤维
                const { fibersCount, fiberIntensity, ageSpots, ageFactor } = colorData;

                // 解析基础颜色
                const parchHsl = colorData.baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (parchHsl) {
                    const h = parseInt(parchHsl[1]);
                    const s = parseInt(parchHsl[2]);
                    const l = parseInt(parchHsl[3]);

                    // 绘制随机纤维
                    for (let i = 0; i < fibersCount; i++) {
                        // 随机纤维起点
                        const startX = x + Math.random() * width;
                        const startY = y + Math.random() * height;

                        // 纤维长度和方向
                        const fiberLength = 2 + Math.random() * 6; // 短纤维
                        const angle = Math.random() * Math.PI * 2;
                        const endX = startX + Math.cos(angle) * fiberLength;
                        const endY = startY + Math.sin(angle) * fiberLength;

                        // 纤维颜色 - 比背景略深或略浅
                        const lDiff = (Math.random() - 0.5) * 10; // 亮度变化
                        ctx.strokeStyle = `hsla(${h}, ${s}%, ${Math.max(0, Math.min(100, l + lDiff))}%, ${fiberIntensity})`;
                        ctx.lineWidth = 0.5;

                        // 绘制纤维
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                    }

                    // 3. 添加老旧斑点 - 模拟年代感
                    for (let i = 0; i < ageSpots; i++) {
                        const spotX = x + Math.random() * width;
                        const spotY = y + Math.random() * height;
                        const spotRadius = 1 + Math.random() * 3; // 小斑点

                        // 老化斑点颜色 - 偏黄褐色
                        const spotH = 30 + Math.random() * 20; // 黄棕色系
                        const spotS = 20 + Math.random() * 30;
                        const spotL = l - 10 - Math.random() * 15; // 比背景暗

                        ctx.fillStyle = `hsla(${spotH}, ${spotS}%, ${spotL}%, ${ageFactor})`;

                        ctx.beginPath();
                        ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // 4. 添加边缘轻微晕染
                    // 创建边缘渐变，增加年代感
                    const edgeWidth = Math.min(width, height) * 0.15; // 边缘宽度

                    // 顶部边缘
                    const topGradient = ctx.createLinearGradient(x, y, x, y + edgeWidth);
                    topGradient.addColorStop(0, `hsla(${h - 5}, ${s + 5}%, ${l - 10}%, 0.1)`);
                    topGradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
                    ctx.fillStyle = topGradient;
                    ctx.fillRect(x, y, width, edgeWidth);

                    // 右侧边缘
                    const rightGradient = ctx.createLinearGradient(x + width - edgeWidth, y, x + width, y);
                    rightGradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0)`);
                    rightGradient.addColorStop(1, `hsla(${h - 5}, ${s + 5}%, ${l - 10}%, 0.1)`);
                    ctx.fillStyle = rightGradient;
                    ctx.fillRect(x + width - edgeWidth, y, edgeWidth, height);

                    // 底部边缘
                    const bottomGradient = ctx.createLinearGradient(x, y + height - edgeWidth, x, y + height);
                    bottomGradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0)`);
                    bottomGradient.addColorStop(1, `hsla(${h - 5}, ${s + 5}%, ${l - 10}%, 0.1)`);
                    ctx.fillStyle = bottomGradient;
                    ctx.fillRect(x, y + height - edgeWidth, width, edgeWidth);

                    // 左侧边缘
                    const leftGradient = ctx.createLinearGradient(x, y, x + edgeWidth, y);
                    leftGradient.addColorStop(0, `hsla(${h - 5}, ${s + 5}%, ${l - 10}%, 0.1)`);
                    leftGradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
                    ctx.fillStyle = leftGradient;
                    ctx.fillRect(x, y, edgeWidth, height);
                }
                break;

            case 'solid':
            default:
                // 普通单色背景
                ctx.fillStyle = colorData.background;
                ctx.fillRect(x, y, width, height);
                break;
        }
    };

    // 删除当前选中的碎片
    const handleDeleteFragment = () => {
        if (selectedFragment) {
            setCanvasFragments(prev => prev.filter(f => f.id !== selectedFragment.id));
            setSelectedFragment(null);
        }
    };

    // 监听键盘事件，支持方向键移动和删除
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedFragment) return;

            switch (e.key) {
                case 'ArrowUp':
                    setCanvasFragments(prev =>
                        prev.map(f =>
                            f.id === selectedFragment.id
                                ? { ...f, y: f.y - 5 }
                                : f
                        )
                    );
                    break;
                case 'ArrowDown':
                    setCanvasFragments(prev =>
                        prev.map(f =>
                            f.id === selectedFragment.id
                                ? { ...f, y: f.y + 5 }
                                : f
                        )
                    );
                    break;
                case 'ArrowLeft':
                    setCanvasFragments(prev =>
                        prev.map(f =>
                            f.id === selectedFragment.id
                                ? { ...f, x: f.x - 5 }
                                : f
                        )
                    );
                    break;
                case 'ArrowRight':
                    setCanvasFragments(prev =>
                        prev.map(f =>
                            f.id === selectedFragment.id
                                ? { ...f, x: f.x + 5 }
                                : f
                        )
                    );
                    break;
                case 'Delete':
                case 'Backspace':
                    handleDeleteFragment();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedFragment]);

    return (
        <div
            className="canvas-container"
            ref={containerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleCanvasClick}
            onMouseDown={handleStartDrag}
        >
            <canvas
                ref={canvasRef}
                className="poetry-canvas"
            />

            {showEmptyPrompt && (
                <div className="empty-canvas-prompt">
                    试着把第一个碎片拖到这里
                </div>
            )}

            {selectedFragment && (
                <div className="canvas-controls">
                    <button
                        className="delete-button"
                        onClick={handleDeleteFragment}
                        title="删除碎片"
                    >
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