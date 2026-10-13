import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // Datas e horas previsíveis em qualquer máquina/CI
    env: { TZ: 'America/Sao_Paulo', VITE_SUPABASE_URL: 'http://localhost', VITE_SUPABASE_KEY: 'chave-de-teste' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**', 'src/**/*.test.{js,jsx}'],
    },
  },
})
