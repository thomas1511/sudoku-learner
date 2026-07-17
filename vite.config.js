import { defineConfig } from 'vite';

// Optimized static-SPA build for Netlify. `base: './'` keeps asset URLs relative
// so the app works at any deploy path (including preview subdomains).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Split the large precomputed technique data into its own chunk so the
        // app shell/logic can be parsed and cached independently of the dataset.
        manualChunks: {
          data: ['./src/data/cases.js', './src/data/traces.js'],
        },
      },
    },
  },
});
