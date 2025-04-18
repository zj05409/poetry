import React, { useEffect, useRef, useState } from 'react';
import { generateRandomColors } from '../utils/colorUtils';
import './BackgroundTester.css';

const BackgroundTester = () => {
    const [backgroundTypes, setBackgroundTypes] = useState([]);
    const canvasRefs = useRef({});

    useEffect(() => {
        // 生成不同类型的背景样例
        const types = [
            { type: 'solid', label: '单色背景' },
            { type: 'gradient', label: '渐变背景' },
            { type: 'textured', label: '纹理背景' },
            { type: 'parchment', label: '宣纸/羊皮纸' }
        ];

        // 为每种类型生成5个不同样例
        const samples = [];
        types.forEach(type => {
            for (let i = 0; i < 5; i++) {
                const colors = generateRandomColors();
                // 强制使用特定类型
                if (type.type === 'solid') {
                    colors.backgroundType = 'solid';
                } else if (type.type === 'gradient') {
                    colors.backgroundType = 'gradient';
                } else if (type.type === 'textured') {
                    colors.backgroundType = 'textured';
                } else if (type.type === 'parchment') {
                    colors.backgroundType = 'parchment';
                }
                samples.push({
                    id: `${type.type}-${i}`,
                    typeLabel: type.label,
                    colors
                });
            }
        });

        setBackgroundTypes(samples);
    }, []);

    useEffect(() => {
        // 当背景类型数据准备好后，绘制所有示例
        backgroundTypes.forEach(sample => {
            const canvas = canvasRefs.current[sample.id];
            if (canvas) {
                drawSample(canvas, sample.colors);
            }
        });
    }, [backgroundTypes]);

    // 绘制背景示例
    const drawSample = (canvas, colorData) => {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 根据背景类型绘制不同效果
        drawBackgroundByType(ctx, 0, 0, width, height, colorData);

        // 添加示例文字
        const sampleText = "诗词美学";
        const fontStyles = colorData.fontStyles || {
            family: 'Songti SC',
            weight: 'normal',
            isItalic: false,
            sizeModifier: 1
        };

        ctx.font = `${fontStyles.isItalic ? 'italic' : 'normal'} ${fontStyles.weight} ${24 * fontStyles.sizeModifier}px ${fontStyles.family}`;
        ctx.fillStyle = colorData.text || 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sampleText, width / 2, height / 2);
    };

    // 根据背景类型绘制不同效果 (从Canvas.js中复制而来)
    const drawBackgroundByType = (ctx, x, y, width, height, colorData) => {
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

    // 刷新所有示例
    const refreshSamples = () => {
        const updatedSamples = backgroundTypes.map(sample => {
            const colors = generateRandomColors();
            // 保持原始类型
            colors.backgroundType = sample.colors.backgroundType;
            return {
                ...sample,
                colors
            };
        });
        setBackgroundTypes(updatedSamples);
    };

    // 分类显示示例
    const renderSamplesByType = () => {
        const grouped = {};
        backgroundTypes.forEach(sample => {
            if (!grouped[sample.typeLabel]) {
                grouped[sample.typeLabel] = [];
            }
            grouped[sample.typeLabel].push(sample);
        });

        return Object.keys(grouped).map(typeLabel => (
            <div key={typeLabel} className="background-type-group">
                <h3>{typeLabel}</h3>
                <div className="samples-container">
                    {grouped[typeLabel].map(sample => (
                        <div key={sample.id} className="sample-container">
                            <canvas
                                ref={el => canvasRefs.current[sample.id] = el}
                                width={200}
                                height={120}
                                className="sample-canvas"
                            />
                            <div className="sample-info">
                                <small>
                                    {sample.colors.backgroundType === 'solid' && sample.colors.background}
                                    {sample.colors.backgroundType === 'gradient' && `${sample.colors.color1} → ${sample.colors.color2}`}
                                    {sample.colors.backgroundType === 'textured' && sample.colors.baseColor}
                                    {sample.colors.backgroundType === 'parchment' && sample.colors.baseColor}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ));
    };

    return (
        <div className="background-tester">
            <div className="tester-header">
                <h2>背景样式测试工具</h2>
                <button onClick={refreshSamples} className="refresh-button">
                    刷新样例
                </button>
            </div>
            <div className="samples-grid">
                {renderSamplesByType()}
            </div>
        </div>
    );
};

export default BackgroundTester; 