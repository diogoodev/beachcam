import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      includeAssets: ['logoBeachCam.png', 'logoBeachCam.svg', 'logoBeachCam.ico', 'screenshot_mobile.png', 'screenshot_mobile_1.png', 'screenshot_mobile_2.png', 'screenshot_mobile_3.png', 'screenshot_mobile_4.png', 'screenshot_desktop.png', 'court-bg.jpg', 'logoBeachCam-192.png', 'logoBeachCam-512.png'],
      manifest: {
        id: '/?source=pwa',
        start_url: '/?source=pwa',
        name: 'BeachCam',
        short_name: 'BeachCam',
        description: 'BeachCam - Aplicativo de placar e ranking para Beach Tennis',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'browser'],
        scope: '/',
        orientation: 'portrait',
        dir: 'ltr',
        lang: 'pt-BR',
        categories: ['sports', 'games', 'entertainment'],
        launch_handler: {
          client_mode: 'navigate-existing'
        },
        edge_side_panel: {
          preferred_width: 400
        },
        icons: [
          {
            src: 'logoBeachCam-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logoBeachCam-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot_mobile.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Splash Screen - BeachCam'
          },
          {
            src: 'screenshot_mobile_1.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Arena Players - Adicionar Jogadores'
          },
          {
            src: 'screenshot_mobile_2.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Ranking de Jogadores e Duplas'
          },
          {
            src: 'screenshot_mobile_3.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Status da Partida em Andamento'
          },
          {
            src: 'screenshot_mobile_4.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Configurações do App'
          },
          {
            src: 'screenshot_desktop.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Visão Geral do Jogo'
          }
        ],
        shortcuts: [
          {
            name: "Novo Jogo",
            short_name: "Novo Jogo",
            description: "Iniciar uma nova partida de Beach Tennis",
            url: "/?action=new",
            icons: [{ src: "logoBeachCam-192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "Ver Ranking",
            short_name: "Ranking",
            description: "Checar o ranking atualizado",
            url: "/?action=ranking",
            icons: [{ src: "logoBeachCam-192.png", sizes: "192x192", type: "image/png" }]
          }
        ]
      }
    })
  ],
})
