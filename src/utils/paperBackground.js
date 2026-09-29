// 渐变
const drawGradient = (ctx, x, y, width, height, colorData) => {
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
};

// 斑驳纹理
const drawTextured = (ctx, x, y, width, height, colorData) => {
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
};

// 宣纸 / 羊皮纸
const drawParchment = (ctx, x, y, width, height, colorData) => {
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
};

// 根据背景类型绘制碎片纸张的不同底色效果
export const drawBackgroundByType = (ctx, x, y, width, height, colorData) => {
    switch (colorData.backgroundType) {
        case 'gradient':
            drawGradient(ctx, x, y, width, height, colorData);
            break;
        case 'textured':
            drawTextured(ctx, x, y, width, height, colorData);
            break;
        case 'parchment':
            drawParchment(ctx, x, y, width, height, colorData);
            break;
        case 'solid':
        default:
            ctx.fillStyle = colorData.background;
            ctx.fillRect(x, y, width, height);
            break;
    }
};
