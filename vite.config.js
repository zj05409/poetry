import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    // 相对路径部署，配合 HashRouter 可托管在任意静态目录下
    base: './',
    plugins: [react()],
    build: { sourcemap: false, outDir: 'build' },
    test: { environment: 'node', include: ['src/**/*.test.js'] }
});
