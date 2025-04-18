import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ToolBar from './components/ToolBar';
import Canvas from './components/Canvas';
import FragmentTray from './components/FragmentTray';
import BackgroundTester from './components/BackgroundTester';
import { fragmentData } from './utils/fragmentData';
import TutorialOverlay from './components/TutorialOverlay';
import { generateRandomColors } from './utils/colorUtils';
import { CanvasProvider } from './contexts/CanvasContext';

// 生成随机边缘点，用于模拟剪刀剪切效果
const generateEdgePoints = () => {
    // 使用更接近矩形的基础形状
    const noiseAmount = 0.1; // 降低不规则程度，值越小边缘越平滑
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

// 主页组件
const MainApp = ({
    fragments,
    handleAddFragmentToCanvas,
    selectedFragment,
    setSelectedFragment,
    backgroundPattern,
    fontSize,
    offlineMode,
    isFirstVisit,
    handleChangeBackground,
    handleChangeFontSize,
    completeTutorial
}) => {
    return (
        <CanvasProvider>
            <div className={`app-container background-${backgroundPattern}`}>
                {offlineMode && (
                    <div className="offline-banner">
                        已进入离线模式，您的创作将被本地缓存
                    </div>
                )}

                <div className="app-layout">
                    <ToolBar
                        onChangeBackground={handleChangeBackground}
                        onChangeFontSize={handleChangeFontSize}
                        fontSize={fontSize}
                        backgroundPattern={backgroundPattern}
                    />

                    <Canvas
                        selectedFragment={selectedFragment}
                        setSelectedFragment={setSelectedFragment}
                        fontSize={fontSize}
                    />

                    <FragmentTray
                        fragments={fragments}
                        onSelectFragment={handleAddFragmentToCanvas}
                    />
                </div>

                {isFirstVisit && (
                    <TutorialOverlay onComplete={completeTutorial} />
                )}
            </div>
        </CanvasProvider>
    );
};

// 导航菜单组件
const NavMenu = () => {
    return (
        <div className="nav-menu">
            <ul>
                <li><Link to="/">主页</Link></li>
                <li><Link to="/test-backgrounds">背景测试</Link></li>
            </ul>
        </div>
    );
};

function App() {
    const [fragments, setFragments] = useState([]);
    const [selectedFragment, setSelectedFragment] = useState(null);
    const [backgroundPattern, setBackgroundPattern] = useState('paper'); // 'paper', 'ink', 'plain'
    const [fontSize, setFontSize] = useState('small'); // 'small', 'large'
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const [offlineMode, setOfflineMode] = useState(false);
    const [showNav, setShowNav] = useState(false);

    // 初始化加载碎片数据
    useEffect(() => {
        // 在真实应用中，这里可能会从API加载数据
        // 现在我们使用模拟数据
        setFragments(fragmentData); // 使用所有碎片数据，不限制数量

        // 检查是否是首次访问
        const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
        if (hasVisitedBefore) {
            setIsFirstVisit(false);
        }

        // 检查网络状态
        const updateOnlineStatus = () => {
            setOfflineMode(!navigator.onLine);
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    // 将碎片添加到画布的处理函数
    const handleAddFragmentToCanvas = (fragment) => {
        // 如果已有选中碎片，先取消选中
        if (selectedFragment) {
            setSelectedFragment(null);
        }

        // 生成随机颜色和字体样式
        const randomStyles = generateRandomColors();

        // 创建新的碎片实例 - 为每个添加到画布上的碎片生成随机ID
        const canvasFragment = {
            ...fragment,
            id: `canvas-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            initialX: 0,
            initialY: 0,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            rotation: 0,
            scale: 1,
            colors: randomStyles, // 添加随机颜色
            edgePoints: generateEdgePoints() // 添加随机边缘点
        };

        // 将新碎片传递给画布组件
        setSelectedFragment(canvasFragment);
    };

    // 切换背景样式
    const handleChangeBackground = () => {
        const patterns = ['paper', 'ink', 'plain'];
        const currentIndex = patterns.indexOf(backgroundPattern);
        const nextIndex = (currentIndex + 1) % patterns.length;
        setBackgroundPattern(patterns[nextIndex]);
    };

    // 切换字体大小
    const handleChangeFontSize = () => {
        setFontSize(fontSize === 'small' ? 'large' : 'small');
    };

    // 完成教程
    const completeTutorial = () => {
        setIsFirstVisit(false);
        localStorage.setItem('hasVisitedBefore', 'true');
    };

    // 切换导航菜单显示
    const toggleNav = () => {
        setShowNav(!showNav);
    };

    return (
        <Router>
            <div className="app-wrapper">
                <button className="nav-toggle" onClick={toggleNav}>
                    {showNav ? '×' : '≡'}
                </button>

                {showNav && <NavMenu />}

                <Routes>
                    <Route path="/" element={
                        <MainApp
                            fragments={fragments}
                            handleAddFragmentToCanvas={handleAddFragmentToCanvas}
                            selectedFragment={selectedFragment}
                            setSelectedFragment={setSelectedFragment}
                            backgroundPattern={backgroundPattern}
                            fontSize={fontSize}
                            offlineMode={offlineMode}
                            isFirstVisit={isFirstVisit}
                            handleChangeBackground={handleChangeBackground}
                            handleChangeFontSize={handleChangeFontSize}
                            completeTutorial={completeTutorial}
                        />
                    } />
                    <Route path="/test-backgrounds" element={<BackgroundTester />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App; 