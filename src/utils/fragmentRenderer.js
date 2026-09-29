import { generateRandomColors } from './colorUtils';
import { drawBackgroundByType } from './paperBackground';
import { generateEdgePoints, scaleEdgePoints, traceEdgePath, getBounds } from './fragmentShape';
import { BG_WIDTH, BG_HEIGHT, DROP_AREA_WIDTH, DROP_AREA_HEIGHT } from './geometry';

const PADDING = 15; // 给不规则边缘留出的空隙
const SPRITE_MARGIN = 6; // sprite 四周额外留白（描边 / 锯齿）
const MAX_CACHE = 400;

// 碎片 sprite 缓存：纸张纹理里的随机细节只在生成时计算一次，
// 这样重绘（拖动、选中）时不会闪烁，也无需每帧重新生成几百个随机点。
const spriteCache = new Map();
let measureCtx = null;
let onFontsLoaded = null;

export const setFontLoadListener = (fn) => {
    onFontsLoaded = fn;
};

export const clearSpriteCache = () => spriteCache.clear();

const getMeasureCtx = () => {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    return measureCtx;
};

export const getFontSpec = (fragment, fontSize) => {
    const styles = fragment.colors?.fontStyles || {};
    const base = fontSize === 'small' ? 18 : 30;
    const size = Math.round(base * (styles.sizeModifier || 1));
    const weight = styles.weight || 'normal';
    const style = styles.isItalic ? 'italic' : 'normal';
    const family = styles.family || 'sans-serif';
    return { size, font: `${style} ${weight} ${size}px ${family}` };
};

// 纸条尺寸（逻辑坐标，未乘 scale）
export const measureFragment = (fragment, fontSize) => {
    const { size, font } = getFontSpec(fragment, fontSize);
    const ctx = getMeasureCtx();
    ctx.font = font;
    const textWidth = ctx.measureText(fragment.text).width;
    const textHeight = size * 0.8;
    return {
        size,
        font,
        noteWidth: textWidth + PADDING * 2,
        noteHeight: textHeight * 2 + PADDING * 2
    };
};

// 补全缺失的样式数据（旧存档 / 手动录入的碎片）
export const ensureFragmentStyle = (fragment) => {
    if (fragment.colors && fragment.edgePoints) return fragment;
    return {
        ...fragment,
        colors: fragment.colors || generateRandomColors(),
        edgePoints: fragment.edgePoints || generateEdgePoints(),
        lightAngle: fragment.lightAngle ?? Math.random() * Math.PI * 2
    };
};

const paintPaperDetails = (ctx, fragment, w, h) => {
    if (fragment.colors.backgroundType !== 'textured') {
        ctx.fillStyle = 'rgba(250, 248, 240, 0.03)';
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // 随机光源产生轻微的光影
        const gradientSize = Math.max(w, h);
        const angle = fragment.lightAngle ?? 0;
        const lx = (Math.cos(angle) * gradientSize) / 2;
        const ly = (Math.sin(angle) * gradientSize) / 2;
        const gradient = ctx.createRadialGradient(lx, ly, 0, lx, ly, gradientSize);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    // 水平细线（模拟书页线条）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let y = -h / 2; y < h / 2; y += 5) ctx.fillRect(-w / 2, y, w, 0.5);

    // 纸张颗粒
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc((Math.random() - 0.5) * w, (Math.random() - 0.5) * h, Math.random() * 0.8 + 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 偶尔出现的暗色小印迹
    if (Math.random() < 0.3) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        const mx = (Math.random() - 0.5) * w * 0.7;
        const my = (Math.random() - 0.5) * h * 0.7;
        const ms = 1 + Math.random() * 3;
        const kind = Math.floor(Math.random() * 3);
        ctx.beginPath();
        if (kind === 0) {
            ctx.arc(mx, my, ms, 0, Math.PI * 2);
        } else if (kind === 1) {
            ctx.rect(mx - ms / 2, my - ms / 2, ms, ms);
        } else {
            ctx.moveTo(mx, my - ms / 2);
            ctx.lineTo(mx + ms / 2, my);
            ctx.lineTo(mx, my + ms / 2);
            ctx.lineTo(mx - ms / 2, my);
            ctx.closePath();
        }
        ctx.fill();
    }

    // 2-3 条轻微的褶皱线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.7;
    const wrinkles = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < wrinkles; i++) {
        const sx = -w / 2 + Math.random() * w;
        const ex = -w / 2 + Math.random() * w;
        const y = -h / 2 + Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(sx, y);
        ctx.quadraticCurveTo((sx + ex) / 2, y + (Math.random() - 0.5) * 5, ex, y);
        ctx.stroke();
    }
};

const buildSprite = (fragment, fontSize, pixelScale) => {
    const { font, noteWidth, noteHeight } = measureFragment(fragment, fontSize);
    const points = scaleEdgePoints(fragment.edgePoints, noteWidth, noteHeight);
    const b = getBounds(points);
    const halfW = Math.max(-b.minX, b.maxX) + SPRITE_MARGIN;
    const halfH = Math.max(-b.minY, b.maxY) + SPRITE_MARGIN;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(halfW * 2 * pixelScale);
    canvas.height = Math.ceil(halfH * 2 * pixelScale);
    const ctx = canvas.getContext('2d');
    ctx.scale(pixelScale, pixelScale);
    ctx.translate(halfW, halfH);

    ctx.save();
    traceEdgePath(ctx, points);
    ctx.clip();
    drawBackgroundByType(ctx, -noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, fragment.colors);
    paintPaperDetails(ctx, fragment, noteWidth, noteHeight);

    // 边缘微阴影
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 0.5;
    traceEdgePath(ctx, scaleEdgePoints(fragment.edgePoints, noteWidth * 0.99, noteHeight * 0.99));
    ctx.stroke();
    ctx.restore();

    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = fragment.colors.text;
    ctx.fillText(fragment.text, 0, 0);

    return { canvas, halfW, halfH, noteWidth, noteHeight, points, font };
};

// 网络字体尚未加载完成时，先用回退字体，加载完后作废缓存并通知重绘
const watchFont = (key, font, text) => {
    if (typeof document === 'undefined' || !document.fonts || document.fonts.check(font, text)) return;
    document.fonts.load(font, text).then(() => {
        if (spriteCache.delete(key) && onFontsLoaded) onFontsLoaded();
    }).catch(() => { });
};

export const getFragmentSprite = (fragment, fontSize, pixelScale) => {
    const key = `${fragment.id}|${fontSize}|${pixelScale.toFixed(2)}`;
    let sprite = spriteCache.get(key);
    if (!sprite) {
        if (spriteCache.size >= MAX_CACHE) spriteCache.clear();
        sprite = buildSprite(fragment, fontSize, pixelScale);
        spriteCache.set(key, sprite);
        watchFont(key, sprite.font, fragment.text);
    }
    return sprite;
};

const drawGrid = (ctx) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    const size = BG_WIDTH / 40;
    ctx.beginPath();
    for (let x = 0; x <= BG_WIDTH; x += size) { ctx.moveTo(x, 0); ctx.lineTo(x, BG_HEIGHT); }
    for (let y = 0; y <= BG_HEIGHT; y += size) { ctx.moveTo(0, y); ctx.lineTo(BG_WIDTH, y); }
    ctx.stroke();
};

// 绘制整个场景。pixelScale = 逻辑坐标 → 位图像素的比例；overlays=false 用于导出图片。
export const drawScene = (ctx, { fragments, selectedId, fontSize, background, pixelScale, overlays = true, dropHighlight = false }) => {
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    ctx.clearRect(0, 0, BG_WIDTH, BG_HEIGHT);
    if (background) ctx.drawImage(background, 0, 0, BG_WIDTH, BG_HEIGHT);

    if (overlays && dropHighlight) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect((BG_WIDTH - DROP_AREA_WIDTH) / 2, (BG_HEIGHT - DROP_AREA_HEIGHT) / 2, DROP_AREA_WIDTH, DROP_AREA_HEIGHT);
        ctx.setLineDash([]);
        drawGrid(ctx);
    }

    const sorted = [...fragments].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    for (const raw of sorted) {
        const fragment = ensureFragmentStyle(raw);
        // 分档取 sprite 分辨率，避免缩放手势中不断生成新缓存
        const spriteScale = Math.max(0.5, Math.ceil(pixelScale * (fragment.scale || 1) * 4) / 4);
        const sprite = getFragmentSprite(fragment, fontSize, spriteScale);
        const selected = overlays && fragment.id === selectedId;

        ctx.save();
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(((fragment.rotation || 0) * Math.PI) / 180);
        ctx.scale(fragment.scale || 1, fragment.scale || 1);

        ctx.shadowColor = selected ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = (selected ? 12 : 8) * pixelScale;
        ctx.shadowOffsetX = selected ? 0 : 3 * pixelScale;
        ctx.shadowOffsetY = selected ? 0 : 3 * pixelScale;
        ctx.drawImage(sprite.canvas, -sprite.halfW, -sprite.halfH, sprite.halfW * 2, sprite.halfH * 2);
        ctx.shadowColor = 'transparent';

        if (selected) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.scale(1.1, 1.1);
            traceEdgePath(ctx, sprite.points);
            ctx.stroke();
        }
        ctx.restore();
    }
};

// 导出为 PNG（不含选中框 / 网格），scale 为相对逻辑尺寸的放大倍数
export const exportPng = (state, scale = 2) =>
    new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = BG_WIDTH * scale;
        canvas.height = BG_HEIGHT * scale;
        drawScene(canvas.getContext('2d'), { ...state, pixelScale: scale, overlays: false });
        canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('导出失败'))), 'image/png');
    });
