import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    root: './',
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
            filename: 'sw.js',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true
            },
            manifest: {
                name: 'PageOnline OS',
                short_name: 'PageOS',
                start_url: '/',
                display: 'standalone',
                background_color: '#000000ff',
                theme_color: '#000000ff',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        port: 3000,
        open: false,
    },
});
