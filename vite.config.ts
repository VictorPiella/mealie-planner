import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const mealieUrl = env.VITE_MEALIE_URL ?? ''

  return {
    plugins: [react()],

    // Base path for assets. Override with VITE_BASE_PATH for sub-path hosting
    // (e.g. GitHub Pages sets this to /mealie-planner/).
    base: env.VITE_BASE_PATH || '/',

    server: {
      // Proxy /api/* to the Mealie instance during dev — avoids CORS entirely.
      // The browser only ever talks to localhost:5173.
      proxy: mealieUrl
        ? {
            '/api': {
              target:       mealieUrl,
              changeOrigin: true,
              secure:       true,
            },
          }
        : undefined,
    },
  }
})
