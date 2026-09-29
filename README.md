# 拼诗诗 - 创意拼贴诗创作工具

一个让用户通过拖拽、旋转、缩放文字碎片，创作个性化诗歌的网页应用。

## 功能特点

- **直观的拖拽操作**：从右侧托盘拖拽文字碎片到画布上
- **丰富的交互体验**：双指缩放和旋转，精确调整诗句位置
- **碎片随机变形**：每个碎片四条边会随机应用不同效果（拉长、缩短、弧线、邮票锯齿、钝角等）
- **手动录入模式**：支持手动输入自定义碎片，可以一次性输入多个（空格分隔）
- **多样背景选择**：三种底纹样式，满足不同创作风格
- **字体大小切换**：支持大小字体切换，灵活排版
- **本地保存功能**：支持离线模式，自动缓存创作内容
- **新手引导教程**：首次使用时的简明教程引导

## 快速开始

```
git clone https://github.com/zj05409/poetry.git
cd poetry
npm install
npm start          # 开发服务器（Vite）
npm run build      # 生产构建，产物在 build/
npm run preview    # 本地预览生产构建
npm test           # 单元测试（Vitest）
npm run lint       # ESLint
```

## 部署

纯静态站点：把 `build/` 目录放到任意静态托管（Vercel / Netlify / GitHub Pages / Nginx）即可。
使用相对路径 + HashRouter，因此无需配置 SPA 回退，也可部署在子目录下。

## 使用提示

- 拖拽或双击右侧碎片放到画布；点击碎片选中并拖动
- 缩放 / 旋转：触屏双指；桌面滚轮缩放，Shift+滚轮旋转；方向键微调，Delete 删除
- 创作内容自动保存在浏览器本地，刷新不丢；"导出"可下载 2 倍分辨率 PNG

## 技术栈

React 18 · Vite · React Router（HashRouter） · Canvas 2D · Hammer.js · Vitest

## 项目结构

```
src/
  components/   Canvas / ToolBar / FragmentTray / TutorialOverlay / BackgroundTester(仅开发环境)
  contexts/     CanvasContext：碎片与选中状态的唯一来源，含自动保存
  hooks/        useCanvasSurface（自适应 + 高清屏）、useGestures（缩放/旋转/滚轮）
  utils/        fragmentRenderer（sprite 缓存 + 场景绘制 + 导出）、fragmentShape、
                geometry、storage、colorUtils、paperBackground ……
```
