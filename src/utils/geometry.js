// 画布逻辑尺寸（与背景图一致）
export const BG_WIDTH = 864;
export const BG_HEIGHT = 1152;

// 可拖放区域尺寸（居中）
export const DROP_AREA_WIDTH = 500;
export const DROP_AREA_HEIGHT = 762;

// 把屏幕坐标换算为画布逻辑坐标（rect 为 canvas 的 getBoundingClientRect）
export const clientToCanvas = (clientX, clientY, rect) => ({
    x: ((clientX - rect.left) / rect.width) * BG_WIDTH,
    y: ((clientY - rect.top) / rect.height) * BG_HEIGHT
});

export const isInDropArea = (x, y) =>
    Math.abs(x - BG_WIDTH / 2) <= DROP_AREA_WIDTH / 2 &&
    Math.abs(y - BG_HEIGHT / 2) <= DROP_AREA_HEIGHT / 2;

// 考虑旋转与缩放的点击检测：把点变换到碎片局部坐标后与矩形比较
export const pointInFragment = (px, py, fragment, noteWidth, noteHeight) => {
    const rad = -((fragment.rotation || 0) * Math.PI) / 180;
    const dx = px - fragment.x;
    const dy = py - fragment.y;
    const scale = fragment.scale || 1;
    const lx = (dx * Math.cos(rad) - dy * Math.sin(rad)) / scale;
    const ly = (dx * Math.sin(rad) + dy * Math.cos(rad)) / scale;
    return Math.abs(lx) <= noteWidth / 2 && Math.abs(ly) <= noteHeight / 2;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// 旋转吸附到 step 度
export const snapAngle = (angle, step = 15) => Math.round(angle / step) * step;
