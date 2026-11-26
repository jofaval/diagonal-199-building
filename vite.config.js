import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Keep the renderer cached when only the architecture or the lighting changes.
        manualChunks(id) {
          if (id.includes('/three/build/')) return 'three';
        },
      },
    },
  },
});
