import React, { useState, useEffect } from 'react';
import './FragmentTray.css';
import { newId } from '../utils/storage';

const FragmentTray = ({ fragments, onSelectFragment }) => {
    const [displayedFragments, setDisplayedFragments] = useState([]);
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [manualFragments, setManualFragments] = useState([]);

    // 设置显示的碎片
    useEffect(() => {
        if (!isManualMode) {
            setDisplayedFragments([...fragments]); // 直接显示所有碎片
        }
    }, [fragments, isManualMode]);

    // 双击碎片时自动添加到画布中央
    const handleDoubleClick = (fragment) => {
        onSelectFragment(fragment);
    };

    // 长按激活拖拽（触摸设备）
    const handleTouchStart = (fragment, e) => {
        const touchTimeout = setTimeout(() => {
            // 添加拖拽中的样式类
            e.currentTarget.classList.add('dragging');
            // 这里可以添加振动反馈 - 在真实设备上测试
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500); // 0.5秒长按

        // 存储timeout ID用于取消
        e.currentTarget.touchTimeout = touchTimeout;
    };

    const handleTouchEnd = (e) => {
        // 清除长按timeout
        if (e.currentTarget.touchTimeout) {
            clearTimeout(e.currentTarget.touchTimeout);
        }

        // 移除拖拽中的样式类
        e.currentTarget.classList.remove('dragging');
    };

    // 实际拖拽处理
    const handleDragStart = (fragment, e) => {
        // 设置拖拽数据
        e.dataTransfer.setData('text/plain', JSON.stringify(fragment));
        // 设置拖拽效果
        e.dataTransfer.effectAllowed = 'move';

        // 自定义拖拽图像 (可选)
        const dragImage = document.createElement('div');
        dragImage.classList.add('drag-image');
        dragImage.textContent = fragment.text;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 30, 30);

        // 延迟移除拖拽图像元素
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    };

    // 处理打乱词汇顺序
    const handleShuffleFragments = () => {
        if (isManualMode) {
            const shuffled = [...manualFragments].sort(() => 0.5 - Math.random());
            setManualFragments(shuffled);
            setDisplayedFragments(shuffled);
        } else {
            const shuffled = [...displayedFragments].sort(() => 0.5 - Math.random());
            setDisplayedFragments(shuffled);
        }
    };

    // 切换手动录入模式
    const toggleManualMode = () => {
        if (!isManualMode) {
            // 进入手动模式时，清空显示的碎片
            setDisplayedFragments([]);
            setManualFragments([]);
        } else {
            // 退出手动模式时，恢复显示预设碎片
            setDisplayedFragments([...fragments]);
        }
        setIsManualMode(!isManualMode);
        setManualInput('');
    };

    // 处理手动输入
    const handleManualInputChange = (e) => {
        setManualInput(e.target.value);
    };

    // 添加手动输入的碎片
    const handleAddManualFragment = () => {
        if (!manualInput.trim()) return;

        // 如果包含空格，按空格分割成多个碎片
        const texts = manualInput.trim().split(/\s+/);

        const newFragments = texts.map((text) => ({
            id: newId('manual'),
            text: text,
            source: '手动录入'
        }));

        const updatedFragments = [...manualFragments, ...newFragments];
        setManualFragments(updatedFragments);
        setDisplayedFragments(updatedFragments);
        setManualInput(''); // 清空输入框
    };

    // 按回车键添加
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddManualFragment();
        }
    };

    // 清空所有手动录入的碎片
    const handleClearManualFragments = () => {
        setManualFragments([]);
        setDisplayedFragments([]);
    };

    return (
        <div className={`fragment-tray ${isManualMode ? 'manual-mode' : ''}`}>
            <div className="tray-controls">
                <button
                    className="shuffle-button"
                    onClick={handleShuffleFragments}
                    title="打乱词汇顺序"
                >
                    🔀 打乱词汇
                </button>

                <button
                    className={`mode-toggle-button ${isManualMode ? 'active' : ''}`}
                    onClick={toggleManualMode}
                    title={isManualMode ? "使用预设碎片" : "切换到手动录入模式"}
                >
                    {isManualMode ? "📚 预设碎片" : "✏️ 手动录入"}
                </button>

                {isManualMode && (
                    <button
                        className="clear-button"
                        onClick={handleClearManualFragments}
                        title="清空所有手动录入的碎片"
                    >
                        🗑️ 清空
                    </button>
                )}
            </div>

            {isManualMode && (
                <div className="manual-input-container">
                    <input
                        type="text"
                        value={manualInput}
                        onChange={handleManualInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="输入碎片文字，多个碎片用空格分隔"
                        className="manual-input"
                    />
                    <button
                        className="add-fragment-button"
                        onClick={handleAddManualFragment}
                    >
                        添加
                    </button>
                </div>
            )}

            <div className="tray-container">
                {displayedFragments.map((fragment) => (
                    <div
                        key={fragment.id}
                        className="fragment"
                        draggable="true"
                        onDragStart={(e) => handleDragStart(fragment, e)}
                        onDoubleClick={() => handleDoubleClick(fragment)}
                        onTouchStart={(e) => handleTouchStart(fragment, e)}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="fragment-content">
                            {fragment.text}
                        </div>
                        <div className="fragment-source">{fragment.source}</div>
                    </div>
                ))}

                {displayedFragments.length === 0 && !isManualMode && (
                    <div className="empty-tray-message">
                        所有碎片已用完，请点击左侧素材按钮获取更多
                    </div>
                )}

                {displayedFragments.length === 0 && isManualMode && (
                    <div className="empty-tray-message">
                        请在上方输入框中添加自定义碎片
                    </div>
                )}
            </div>
        </div>
    );
};

export default FragmentTray; 