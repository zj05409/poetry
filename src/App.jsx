import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ToolBar from './components/ToolBar';
import Canvas from './components/Canvas';
import FragmentTray from './components/FragmentTray';
import TutorialOverlay from './components/TutorialOverlay';
import { fragmentData } from './utils/fragmentData';
import { CanvasProvider, useCanvasContext } from './contexts/CanvasContext';
import { createCanvasFragment } from './utils/fragmentFactory';
import { BG_WIDTH, BG_HEIGHT } from './utils/geometry';
import { PREFS_KEY, loadJSON, saveJSON } from './utils/storage';

// 背景样式调试页只在开发环境提供，生产包里不会包含
const IS_DEV = import.meta.env.DEV;
const BackgroundTester = IS_DEV ? lazy(() => import('./components/BackgroundTester')) : null;

const BACKGROUND_PATTERNS = ['paper', 'ink', 'plain'];

const MainApp = ({ backgroundPattern, fontSize, offlineMode, isFirstVisit, onChangeBackground, onChangeFontSize, onCompleteTutorial }) => {
    const { addFragment } = useCanvasContext();

    // 双击托盘碎片：放到画布中心附近（稍作随机偏移，避免完全重叠）
    const handleAddFragmentToCanvas = useCallback((fragment) => {
        addFragment(createCanvasFragment(fragment, {
            x: BG_WIDTH / 2 + (Math.random() - 0.5) * 120,
            y: BG_HEIGHT / 2 + (Math.random() - 0.5) * 200,
            rotation: Math.random() * 10 - 5
        }));
    }, [addFragment]);

    return (
        <div className={`app-container background-${backgroundPattern}`}>
            {offlineMode && (
                <div className="offline-banner">已进入离线模式，您的创作将被本地缓存</div>
            )}

            <div className="app-layout">
                <ToolBar
                    onChangeBackground={onChangeBackground}
                    onChangeFontSize={onChangeFontSize}
                    fontSize={fontSize}
                    backgroundPattern={backgroundPattern}
                />
                <Canvas fontSize={fontSize} />
                <FragmentTray fragments={fragmentData} onSelectFragment={handleAddFragmentToCanvas} />
            </div>

            {isFirstVisit && <TutorialOverlay onComplete={onCompleteTutorial} />}
        </div>
    );
};

const NavMenu = () => (
    <div className="nav-menu">
        <ul>
            <li><Link to="/">主页</Link></li>
            <li><Link to="/test-backgrounds">背景测试</Link></li>
        </ul>
    </div>
);

function App() {
    const [prefs, setPrefs] = useState(() => ({
        backgroundPattern: 'paper', // 'paper' | 'ink' | 'plain'
        fontSize: 'small', // 'small' | 'large'
        hasVisited: false,
        ...loadJSON(PREFS_KEY, {})
    }));
    const [offlineMode, setOfflineMode] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
    const [showNav, setShowNav] = useState(false);

    useEffect(() => { saveJSON(PREFS_KEY, prefs); }, [prefs]);

    useEffect(() => {
        const update = () => setOfflineMode(!navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    const cycleBackground = () => setPrefs(p => ({
        ...p,
        backgroundPattern: BACKGROUND_PATTERNS[(BACKGROUND_PATTERNS.indexOf(p.backgroundPattern) + 1) % BACKGROUND_PATTERNS.length]
    }));
    const toggleFontSize = () => setPrefs(p => ({ ...p, fontSize: p.fontSize === 'small' ? 'large' : 'small' }));
    const completeTutorial = () => setPrefs(p => ({ ...p, hasVisited: true }));

    return (
        <CanvasProvider>
            <Router>
                <div className="app-wrapper">
                    {IS_DEV && (
                        <>
                            <button className="nav-toggle" onClick={() => setShowNav(v => !v)}>{showNav ? '×' : '≡'}</button>
                            {showNav && <NavMenu />}
                        </>
                    )}

                    <Routes>
                        <Route path="/" element={
                            <MainApp
                                backgroundPattern={prefs.backgroundPattern}
                                fontSize={prefs.fontSize}
                                offlineMode={offlineMode}
                                isFirstVisit={!prefs.hasVisited}
                                onChangeBackground={cycleBackground}
                                onChangeFontSize={toggleFontSize}
                                onCompleteTutorial={completeTutorial}
                            />
                        } />
                        {IS_DEV && (
                            <Route path="/test-backgrounds" element={
                                <Suspense fallback={null}><BackgroundTester /></Suspense>
                            } />
                        )}
                    </Routes>
                </div>
            </Router>
        </CanvasProvider>
    );
}

export default App;
