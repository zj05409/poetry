import React, { useState } from 'react';
import './ToolBar.css';

const ToolBar = ({ onChangeBackground, onChangeFontSize, fontSize, backgroundPattern }) => {
    const [materialMenuOpen, setMaterialMenuOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');

    // 切换素材菜单显示状态
    const toggleMaterialMenu = () => {
        setMaterialMenuOpen(!materialMenuOpen);
    };

    // 处理搜索输入变化
    const handleSearchChange = (e) => {
        setSearchKeyword(e.target.value);
    };

    // 处理搜索提交
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        // 在实际应用中，这里会触发搜索API
        console.log('搜索关键词:', searchKeyword);
    };

    // 模拟上传个人素材
    const handleUploadMaterial = () => {
        alert('上传素材功能将在正式版中提供');
    };

    // 保存草稿
    const handleSaveDraft = () => {
        // 模拟保存过程
        const savingIndicator = document.querySelector('.saving-indicator');
        savingIndicator.classList.add('saving');

        setTimeout(() => {
            savingIndicator.classList.remove('saving');
            savingIndicator.classList.add('saved');

            setTimeout(() => {
                savingIndicator.classList.remove('saved');
            }, 1500);
        }, 1000);
    };

    // 完成创作
    const handleFinishCreation = () => {
        alert('恭喜！您的创作已完成，分享功能将在正式版中提供');
    };

    return (
        <div className="toolbar">
            <div className="toolbar-section">
                <button
                    className="toolbar-button material-button"
                    onClick={toggleMaterialMenu}
                >
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                        <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v8l2.5-1.5L13 12V4h5v16z" />
                    </svg>
                    <span>素材</span>
                </button>

                {materialMenuOpen && (
                    <div className="submenu material-submenu">
                        <form onSubmit={handleSearchSubmit} className="search-form">
                            <input
                                type="text"
                                placeholder="搜索公版素材..."
                                value={searchKeyword}
                                onChange={handleSearchChange}
                                className="search-input"
                            />
                            <button type="submit" className="search-button">搜索</button>
                        </form>

                        <div className="submenu-divider"></div>

                        <button
                            className="submenu-button upload-button"
                            onClick={handleUploadMaterial}
                        >
                            <svg viewBox="0 0 24 24" className="submenu-icon">
                                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                            </svg>
                            <span>上传个人素材</span>
                            <span className="remaining-count">今日剩余：1</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="toolbar-section">
                <button
                    className={`toolbar-button font-button font-${fontSize}`}
                    onClick={onChangeFontSize}
                >
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                        <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z" />
                    </svg>
                    <span>{fontSize === 'small' ? '小' : '大'}</span>
                </button>

                <button
                    className={`toolbar-button background-button background-${backgroundPattern}`}
                    onClick={onChangeBackground}
                >
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                        <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67 0 1.38-1.12 2.5-2.5 2.5zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5 0-.16-.08-.28-.14-.35-.41-.46-.63-1.05-.63-1.65 0-1.38 1.12-2.5 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z" />
                    </svg>
                    <span>底纹</span>
                </button>
            </div>

            <div className="toolbar-section">
                <button
                    className="toolbar-button save-button"
                    onClick={handleSaveDraft}
                >
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" />
                    </svg>
                    <span>保存</span>
                    <div className="saving-indicator"></div>
                </button>

                <button
                    className="toolbar-button finish-button"
                    onClick={handleFinishCreation}
                >
                    <svg viewBox="0 0 24 24" className="toolbar-icon">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>完成</span>
                </button>
            </div>
        </div>
    );
};

export default ToolBar; 