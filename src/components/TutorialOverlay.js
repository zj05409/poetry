import React, { useState } from 'react';
import './TutorialOverlay.css';

const TutorialOverlay = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 3;

    const tutorialSteps = [
        {
            title: '欢迎使用拼诗诗',
            content: '在这里，您可以通过拖拽文字碎片，创作属于自己的诗歌作品。',
            position: 'center'
        },
        {
            title: '从托盘找到碎片',
            content: '右侧托盘中包含各种诗句碎片，长按或拖拽将它们添加到画布上。',
            position: 'right'
        },
        {
            title: '调整位置和大小',
            content: '双指可以旋转和缩放碎片，拖拽可以改变位置，创造出独特的排版效果。',
            position: 'center'
        }
    ];

    const handleNextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const currentTutorial = tutorialSteps[currentStep];

    return (
        <div className="tutorial-overlay">
            <div className={`tutorial-bubble ${currentTutorial.position}`}>
                <h3 className="tutorial-title">{currentTutorial.title}</h3>
                <p className="tutorial-content">{currentTutorial.content}</p>

                <div className="tutorial-controls">
                    <div className="tutorial-dots">
                        {tutorialSteps.map((_, index) => (
                            <span
                                key={index}
                                className={`tutorial-dot ${index === currentStep ? 'active' : ''}`}
                            />
                        ))}
                    </div>

                    <div className="tutorial-buttons">
                        <button
                            className="tutorial-skip"
                            onClick={handleSkip}
                        >
                            跳过
                        </button>
                        <button
                            className="tutorial-next"
                            onClick={handleNextStep}
                        >
                            {currentStep === totalSteps - 1 ? '开始创作' : '下一步'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialOverlay; 