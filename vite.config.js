import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, open: true },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
