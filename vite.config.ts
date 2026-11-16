import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 本番ビルドは相対パスにする。ドメイン直下の /assets を指すと、サブフォルダでは画面が欠ける。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}))
