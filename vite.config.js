import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Posters and icons are small; everything else stays a real file so the
    // browser can stream the video instead of parsing it out of the bundle.
    assetsInlineLimit: 2048,
  },
});
