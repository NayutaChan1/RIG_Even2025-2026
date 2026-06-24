// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  // Server-only runtime config. Override in production with NUXT_PYTHON_SERVER_URL.
  runtimeConfig: {
    pythonServerUrl: process.env.NUXT_PYTHON_SERVER_URL || 'http://localhost:8000',
  },

  // Allow mosec_desktop (Tauri) to call API endpoints
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  },
})

