import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logoBeachCam.png', 'logoBeachCam.svg', 'logoBeachCam.ico'],
      manifest: {
        name: 'BeachCam',
        short_name: 'BeachCam',
        description: 'BeachCam - Aplicativo de placar e ranking para Beach Tennis',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'logoBeachCam.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logoBeachCam.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
