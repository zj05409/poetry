// 创建一个用于渲染纸张纹理的函数

// 纸张纹理函数 - 用于绘制纸张效果
export const paperTexture = (ctx, x, y, width, height, options = {}) => {
    const {
        baseColor = 'rgba(250, 248, 240, 0.03)',
        noiseOpacity = 0.03,
        lineOpacity = 0.02,
        grainDensity = 15,
        grainSize = 0.8
    } = options;

    // 保存当前绘图状态
    ctx.save();

    // 1. 纸张底色
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, width, height);

    // 2. 水平细线（模拟纸张线条）
    ctx.fillStyle = `rgba(0, 0, 0, ${lineOpacity})`;
    for (let ly = y; ly < y + height; ly += 5) {
        ctx.fillRect(x, ly, width, 0.5);
    }

    // 3. 随机颗粒（模拟纸张颗粒）
    ctx.fillStyle = `rgba(0, 0, 0, ${noiseOpacity})`;
    for (let i = 0; i < grainDensity; i++) {
        const spotX = x + Math.random() * width;
        const spotY = y + Math.random() * height;
        const spotSize = Math.random() * grainSize + 0.2;
        ctx.beginPath();
        ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // 恢复绘图状态
    ctx.restore();

    return true;
};

// 墨水纹理函数 - 用于绘制水墨痕迹
export const inkTexture = (ctx, x, y, width, height, options = {}) => {
    const {
        inkColor = 'rgba(0, 0, 0, 0.8)',
        splatters = 4,
        maxSplatterSize = 8,
        droplets = 8,
        maxDropletSize = 3,
        blurAmount = 2
    } = options;

    ctx.save();

    // 墨水主体
    ctx.fillStyle = inkColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = blurAmount;

    // 墨水溅射
    for (let i = 0; i < splatters; i++) {
        const splatterX = x + Math.random() * width;
        const splatterY = y + Math.random() * height;
        const splatterSize = 2 + Math.random() * maxSplatterSize;

        ctx.beginPath();
        // 不规则形状模拟墨水溅射
        ctx.moveTo(splatterX, splatterY - splatterSize / 2);
        ctx.bezierCurveTo(
            splatterX + splatterSize, splatterY - splatterSize / 2,
            splatterX + splatterSize, splatterY + splatterSize / 2,
            splatterX, splatterY + splatterSize
        );
        ctx.bezierCurveTo(
            splatterX - splatterSize, splatterY + splatterSize / 2,
            splatterX - splatterSize, splatterY - splatterSize / 2,
            splatterX, splatterY - splatterSize / 2
        );
        ctx.fill();

        // 添加小墨滴
        for (let j = 0; j < droplets; j++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = splatterSize + Math.random() * (splatterSize * 2);
            const dropletX = splatterX + Math.cos(angle) * distance;
            const dropletY = splatterY + Math.sin(angle) * distance;
            const dropletSize = Math.random() * maxDropletSize;

            if (
                dropletX >= x &&
                dropletX <= x + width &&
                dropletY >= y &&
                dropletY <= y + height
            ) {
                ctx.beginPath();
                ctx.arc(dropletX, dropletY, dropletSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    ctx.restore();

    return true;
}; 