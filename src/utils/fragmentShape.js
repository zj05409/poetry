// 碎片的"剪刀剪切"轮廓：四条边各随机套用一种变形效果
// 0: 基本直边(微调), 1: 拉长/缩短, 2: 弧线, 3: 邮票锯齿, 4: 钝角

const SEGMENTS_PER_SIDE = 10;
const NOISE_AMOUNT = 0.1;

// 生成归一化（-1..1）的轮廓点。rng 可注入以便测试。
export const generateEdgePoints = (rng = Math.random) => {
    const points = [];
    const edgeEffects = [0, 1, 2, 3].map(() => Math.floor(rng() * 5));

    // 确保四种特殊效果各至少出现一次（用不同的边，避免互相覆盖）
    const sides = [0, 1, 2, 3].sort(() => rng() - 0.5);
    [1, 2, 3, 4].forEach((effect, i) => {
        if (!edgeEffects.includes(effect)) edgeEffects[sides[i]] = effect;
    });

    for (let i = 0; i < SEGMENTS_PER_SIDE * 4; i++) {
        const sideIndex = Math.floor(i / SEGMENTS_PER_SIDE);
        const sidePos = (i % SEGMENTS_PER_SIDE) / SEGMENTS_PER_SIDE;
        const effect = edgeEffects[sideIndex];
        const wave = Math.sin(sidePos * Math.PI);

        let x;
        let y;
        switch (sideIndex) {
            case 0: x = -1 + 2 * sidePos; y = -1; break; // 上边
            case 1: x = 1; y = -1 + 2 * sidePos; break; // 右边
            case 2: x = 1 - 2 * sidePos; y = 1; break; // 下边
            default: x = -1; y = 1 - 2 * sidePos; break; // 左边
        }

        // 沿边的外法线方向偏移（上/下边影响 y，左/右边影响 x）
        const outward = [-1, 1, 1, -1][sideIndex];
        const horizontal = sideIndex === 0 || sideIndex === 2;
        const push = (amount) => {
            if (horizontal) y += amount * (sideIndex === 0 ? -1 : 1);
            else x += amount * outward;
        };

        switch (effect) {
            case 0:
                if (horizontal) y += (rng() - 0.5) * NOISE_AMOUNT;
                else x += (rng() - 0.5) * NOISE_AMOUNT;
                break;
            case 1: {
                const k = 0.7 + rng() * 0.6;
                if (horizontal) y *= k;
                else x *= k;
                break;
            }
            case 2:
                // 与旧实现保持一致：弧线向内凹
                if (horizontal) y += wave * (0.1 + rng() * 0.2);
                else x += (sideIndex === 1 ? 1 : -1) * wave * (0.1 + rng() * 0.2);
                break;
            case 3: {
                const teeth = 0.03 + rng() * 0.04;
                const freq = 6 + Math.floor(rng() * 8);
                push(Math.abs(Math.sin(sidePos * Math.PI * freq)) * teeth);
                break;
            }
            case 4:
                if (sidePos > 0.4 && sidePos < 0.6) {
                    const bend = 0.15 + rng() * 0.1;
                    const offset = bend * Math.max(0, 1 - Math.abs(sidePos - 0.5) / 0.1);
                    push(-offset);
                }
                break;
            default:
                break;
        }

        points.push({ x, y });
    }
    return points;
};

// 把归一化轮廓点缩放到实际纸条尺寸
export const scaleEdgePoints = (edgePoints, width, height) =>
    edgePoints.map(p => ({ x: p.x * (width / 2), y: p.y * (height / 2) }));

// 在 ctx 上建立（不描边/填充）轮廓路径
export const traceEdgePath = (ctx, points) => {
    if (!points || points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
};

export const getBounds = (points) => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};
