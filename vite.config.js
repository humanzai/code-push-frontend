import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import config from "./config.json";
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3002,
        open: true, // Automatically open the browser
        proxy: {
            '/api': {
                target: config.BACKEND_URL, // Replace with your API server URL
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true, // Enable source maps for easier debugging
    },
    resolve: {
        alias: {
            '@': '/src', // Simplify imports with alias
        },
    },
});