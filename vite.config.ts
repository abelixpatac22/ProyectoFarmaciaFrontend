import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En desarrollo, todo lo que empiece con /api se reenvía al backend local.
    // Así el código usa rutas relativas ("/api/productos") igual en local y en producción.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
