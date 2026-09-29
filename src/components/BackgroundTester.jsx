import React, { useEffect, useRef, useState } from 'react';
import { generateRandomColors } from '../utils/colorUtils';
import { drawBackgroundByType } from '../utils/paperBackground';
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