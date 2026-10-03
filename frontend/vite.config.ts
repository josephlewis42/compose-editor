import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative so the build works from any subpath/host, see
  // Design/publishing_workflow.md.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  assetsInclude: ['**/*.binpb'],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true
      }
    }
  }
})

