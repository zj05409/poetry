// 生成随机颜色和样式组合的函数
export const generateRandomColors = () => {
    // 随机数决定背景样式类型
    const backgroundType = getRandomBackgroundType();

    // 文字大小随机变化（相对于基础大小）
    const fontSizeModifier = 0.85 + Math.random() * 0.3; // 0.85-1.15倍变化范围

    // 随机字体样式
    const fontStyles = {
        // 字体家族
        family: getRandomFontFamily(),
        // 粗细：普通(normal)或粗体(bold)
        weight: Math.random() < 0.5 ? 'normal' : 'bold',
        // 是否倾斜
        isItalic: Math.random() < 0.3, // 30%概率倾斜
        // 相对大小调整
        sizeModifier: fontSizeModifier
    };

    if (backgroundType === 'gradient') {
        // 渐变背景
        const color1 = getRandomSoftColor('gradient');
        const color2 = getRandomSoftColor('gradient');
        const gradientAngle = Math.floor(Math.random() * 360);

        return {
            backgroundType: 'gradient',
            gradientAngle,
            color1,
            color2,
            text: getRandomTextColor(),
            fontStyles: fontStyles
        };
    } else if (backgroundType === 'textured') {
        // 斑驳纹理
        const baseColor = getRandomSoftColor('textured');
        const spotDensity = 5 + Math.floor(Math.random() * 10);
        const spotContrast = 0.05 + Math.random() * 0.1;

        return {
            backgroundType: 'textured',
            baseColor,
            spotDensity,
            spotContrast,
            text: getRandomTextColor(),
            fontStyles: fontStyles
        };
    } else if (backgroundType === 'parchment') {
        // 宣纸/羊皮纸效果
        const baseColor = getRandomSoftColor('parchment');
        // 宣纸纹理参数
        const fibersCount = 80 + Math.floor(Math.random() * 100); // 纤维数量
        const fiberIntensity = 0.02 + Math.random() * 0.04; // 纤维强度
        const ageSpots = 10 + Math.floor(Math.random() * 30); // 年代斑点数
        const ageFactor = 0.1 + Math.random() * 0.2; // 老化程度

        return {
            backgroundType: 'parchment',
            baseColor,
            fibersCount,
            fiberIntensity,
            ageSpots,
            ageFactor,
            text: getRandomTextColor('parchment'),
            fontStyles: fontStyles
        };
    } else {
        // 默认普通单色背景
        const background = getRandomSoftColor('solid');
        return {
            backgroundType: 'solid',
            background,
            text: getRandomTextColor(),
            fontStyles: fontStyles
        };
    }
};

// 随机选择背景类型
function getRandomBackgroundType() {
    const types = [
        'solid',     // 普通单色
        'gradient',  // 渐变
        'textured',  // 斑驳纹理
        'parchment'  // 宣纸/羊皮纸效果
    ];

    // 分配不同概率权重 - 增加宣纸效果的比例，符合诗歌主题
    const weights = [0.30, 0.20, 0.20, 0.30]; // 总和为1

    // 加权随机选择
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (rand < sum) {
            return types[i];
        }
    }
    return types[0]; // 默认返回普通类型
}

// 获取随机柔和颜色 - 根据背景类型提供适合的色系
function getRandomSoftColor(type = 'solid') {
    // 基本柔和颜色
    const baseColors = [
        // 浅色调
        'hsl(210, 40%, 90%)', // 浅蓝
        'hsl(120, 40%, 90%)', // 浅绿
        'hsl(60, 40%, 90%)',  // 浅黄
        'hsl(180, 35%, 85%)', // 浅青色
        'hsl(0, 30%, 90%)',   // 浅粉红
        'hsl(30, 35%, 90%)',  // 浅橙色
        'hsl(330, 30%, 90%)', // 浅紫红
        'hsl(300, 25%, 90%)', // 浅紫色
        'hsl(240, 25%, 90%)', // 浅蓝紫
        'hsl(90, 30%, 90%)',  // 浅黄绿

        // 灰色调
        'hsl(0, 0%, 95%)',    // 几乎白色
        'hsl(0, 0%, 90%)',    // 浅灰

        // 米色和沙色调
        'hsl(40, 30%, 90%)',  // 奶油色
        'hsl(30, 25%, 85%)',  // 米色
        'hsl(35, 30%, 80%)',  // 沙色

        // 粉彩色调
        'hsl(210, 25%, 85%)', // 粉彩蓝
        'hsl(150, 25%, 85%)', // 粉彩绿
        'hsl(70, 25%, 85%)',  // 粉彩黄
        'hsl(10, 25%, 85%)',  // 粉彩红
        'hsl(350, 25%, 85%)', // 粉彩粉
        'hsl(280, 20%, 85%)', // 粉彩紫

        // 明亮的中性色调
        'hsl(30, 20%, 80%)',  // 淡棕色
        'hsl(40, 20%, 85%)',  // 杏色
        'hsl(60, 15%, 85%)',  // 浅卡其

        // 明亮色调
        'hsl(45, 100%, 90%)',  // 明亮的黄色
        'hsl(200, 100%, 85%)', // 明亮的天蓝
        'hsl(160, 100%, 88%)', // 明亮的薄荷
        'hsl(340, 100%, 88%)', // 明亮的粉红
        'hsl(50, 100%, 90%)',  // 明亮的金色
    ];

    // 古风特有颜色 - 传统中国传统颜色系统
    const classicalColors = [
        // 传统颜色名称与HSL近似值
        'hsl(30, 25%, 90%)',   // 象牙白
        'hsl(48, 38%, 89%)',   // 米黄
        'hsl(40, 80%, 90%)',   // 杏黄
        'hsl(0, 0%, 90%)',     // 银白
        'hsl(42, 37%, 85%)',   // 铜色
        'hsl(26, 30%, 75%)',   // 驼色
        'hsl(3, 27%, 87%)',    // 珊瑚粉
        'hsl(27, 80%, 85%)',   // 橘色
        'hsl(358, 30%, 80%)',  // 胭脂
        'hsl(340, 40%, 80%)',  // 粉红
        'hsl(350, 67%, 84%)',  // 品红
        'hsl(12, 85%, 77%)',   // 朱红
        'hsl(8, 83%, 74%)',    // 绯红
        'hsl(5, 73%, 66%)',    // 丹红
        'hsl(0, 72%, 65%)',    // 茜红
        'hsl(24, 57%, 82%)',   // 杏红
        'hsl(15, 27%, 60%)',   // 栗色
        'hsl(0, 0%, 85%)',     // 银灰
        'hsl(14, 75%, 70%)',   // 砖红
        'hsl(0, 60%, 65%)',    // 火红
        'hsl(0, 76%, 40%)',    // 赫赤
        'hsl(45, 100%, 93%)',  // 鹅黄
        'hsl(30, 100%, 70%)',  // 枢机红
        'hsl(28, 80%, 75%)',   // 杏黄
        'hsl(46, 90%, 85%)',   // 鸭黄
        'hsl(49, 80%, 82%)',   // 樱草黄
        'hsl(52, 95%, 80%)',   // 鹅黄
        'hsl(32, 98%, 83%)',   // 缃色(橙黄)
        'hsl(52, 93%, 78%)',   // 赤金
        'hsl(51, 100%, 70%)',  // 金色
        'hsl(45, 90%, 60%)',   // 雄黄
    ];

    // 古纸/宣纸色调
    const parchmentColors = [
        'hsl(40, 30%, 92%)',   // 浅米色
        'hsl(35, 35%, 90%)',   // 淡牙黄
        'hsl(30, 25%, 88%)',   // 象牙白
        'hsl(45, 20%, 87%)',   // 羊皮纸色
        'hsl(42, 28%, 85%)',   // 浅黄棕
        'hsl(38, 22%, 95%)',   // 几乎白色宣纸
        'hsl(34, 30%, 94%)',   // 非常浅的米色
        'hsl(33, 35%, 93%)',   // 稍微带黄的宣纸
        'hsl(32, 25%, 92%)',   // 古纸色
        'hsl(36, 20%, 91%)',   // 陈旧纸色
        'hsl(39, 30%, 90%)',   // 经典宣纸色
        'hsl(37, 35%, 89%)',   // 老旧宣纸
        'hsl(40, 25%, 91%)',   // 古董白
        'hsl(43, 15%, 93%)',   // 清浅米白
    ];

    // 按背景类型返回不同的颜色系列
    if (type === 'parchment') {
        return parchmentColors[Math.floor(Math.random() * parchmentColors.length)];
    } else if (type === 'solid' || type === 'textured') {
        // 单色或纹理背景混合使用现代和传统颜色
        const allColors = [...baseColors, ...classicalColors];
        return allColors[Math.floor(Math.random() * allColors.length)];
    } else {
        // 渐变或其他类型
        return baseColors[Math.floor(Math.random() * baseColors.length)];
    }
}

// 获取随机文字颜色
function getRandomTextColor(type = 'default') {
    // 普通深色文本
    const darkColors = [
        'hsl(0, 0%, 10%)',     // 近黑色
        'hsl(0, 0%, 15%)',     // 深灰黑
        'hsl(0, 0%, 20%)',     // 深灰
        'hsl(25, 30%, 20%)',   // 深褐色
        'hsl(220, 20%, 25%)',  // 深蓝灰
    ];

    // 传统墨色 - 更适合诗歌
    const inkColors = [
        'hsl(0, 0%, 10%)',      // 墨黑
        'hsl(0, 0%, 15%)',      // 淡墨
        'hsl(25, 25%, 20%)',    // 墨褐
        'hsl(200, 15%, 20%)',   // 蓝墨
        'hsl(280, 10%, 25%)',   // 紫墨
        'hsl(0, 25%, 25%)',     // 朱砂色
        'hsl(10, 65%, 30%)',    // 朱红色
        'hsl(0, 70%, 40%)',     // 印章红
    ];

    // 宣纸专用墨色
    if (type === 'parchment') {
        // 宣纸上更偏向传统墨色
        return inkColors[Math.floor(Math.random() * inkColors.length)];
    } else {
        // 其他背景混合使用现代和传统墨色
        const allColors = [...darkColors, ...inkColors];
        return allColors[Math.floor(Math.random() * allColors.length)];
    }
}

// 随机选择字体
function getRandomFontFamily() {
    // 包含系统自带的中文字体和一些通用字体族
    const fonts = [
        // 系统中文字体
        '"Heiti SC"', // 黑体
        '"Songti SC"', // 宋体 
        '"Kaiti SC"', // 楷体
        '"PingFang SC"', // 苹方
        '"Hiragino Sans GB"', // 冬青黑体
        '"Microsoft YaHei"', // 微软雅黑

        // 中文网络字体(需要在HTML中加载)
        '"Noto Sans SC"', // 思源黑体
        '"Noto Serif SC"', // 思源宋体
        '"ZCOOL XiaoWei"', // 站酷小薇
        '"ZCOOL QingKe HuangYou"', // 站酷庆科黄油体
        '"ZCOOL KuaiLe"', // 站酷快乐体
        '"Ma Shan Zheng"', // 马善政楷体
        '"Zhi Mang Xing"', // 智慢星
        '"Long Cang"', // 龙藏
        '"Liu Jian Mao Cao"', // 柳建毛草

        // 基础字体
        'sans-serif',
        'serif'
    ];

    return fonts[Math.floor(Math.random() * fonts.length)];
} 