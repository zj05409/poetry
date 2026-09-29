import { generateRandomColors } from './colorUtils';
import { generateEdgePoints } from './fragmentShape';
import { newId } from './storage';

// 由托盘里的文字碎片创建画布上的碎片实例（带随机配色、轮廓、光照角度）
export const createCanvasFragment = (source, { x, y, rotation = 0 }) => ({
    id: newId('canvas'),
    text: source.text,
    source: source.source,
    x,
    y,
    rotation,
    scale: 1,
    colors: generateRandomColors(),
    edgePoints: generateEdgePoints(),
    lightAngle: Math.random() * Math.PI * 2
});
