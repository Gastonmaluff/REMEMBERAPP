import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'REMEMBERAPP'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? `/${repoName}/` : '/',
}))
