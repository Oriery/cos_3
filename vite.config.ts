import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unimport from 'unimport/unplugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Unimport.vite({
      addons: {
        vueTemplate: true,
      },
      dts: 'src/unimport.d.ts', // Optional if not using TypeScript
      imports: [
        {
          name: 'pushNotify',
          from: fileURLToPath(new URL('src/main.ts', import.meta.url)),
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
