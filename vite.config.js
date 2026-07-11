import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': "".concat(__dirname, "/src"),
            '@components': "".concat(__dirname, "/src/components"),
            '@screens': "".concat(__dirname, "/src/screens"),
            '@types': "".concat(__dirname, "/src/types"),
            '@hooks': "".concat(__dirname, "/src/hooks"),
            '@services': "".concat(__dirname, "/src/services"),
            '@utils': "".concat(__dirname, "/src/utils"),
        },
    },
    server: {
        port: 5173,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
