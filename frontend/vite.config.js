import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Lokal ishlashda /api so'rovlari backendga yo'naltiriladi
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3001'

  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': { target, changeOrigin: true },
      },
    },
  }
})
