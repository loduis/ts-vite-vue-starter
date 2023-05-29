import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import yaml from '@rollup/plugin-yaml'
import compression from 'vite-plugin-compression'
import markdown from './plugins/markdown'
import afterBuild from './plugins/after_build'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [yaml(), markdown(), vue(), compression(), afterBuild()]
})
