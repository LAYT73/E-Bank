import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  preview: {
    allowedHosts: true,
  },
  plugins: [
    svgr({
      include: '**/*.svg',
    }),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx,js,jsx}"',
        useFlatConfig: true,
      },
    }),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) as any,
    tailwindcss(),
    react({ jsxRuntime: 'automatic' }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (content, loaderContext) => {
          const file = loaderContext || '';

          if (file.includes('/styles/')) {
            return content;
          }

          return `@use "/src/app/styles/variables.scss" as *;\n${content}`;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // === Build optimization ===
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['@radix-ui/react-slot', 'framer-motion', 'lucide-react', 'tailwind-merge', 'class-variance-authority'],
          utils: ['axios', 'date-fns', 'zod', 'uuid', 'sass'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: process.env.NODE_ENV !== 'production',
  },

  server: {
    hmr: { overlay: false },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      '@radix-ui/react-slot',
      'framer-motion',
      'lucide-react',
      'tailwind-merge',
      'class-variance-authority',
      'axios',
      'date-fns',
      'zod',
      'uuid',
      'sass',
    ],
  },
});
