import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dpvdavjwqyviredzoorj.supabase.co';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      '/sitemap.xml': {
        target: `${SUPABASE_URL}/functions/v1/sitemap`,
        changeOrigin: true,
        rewrite: () => '',
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — must load first
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/scheduler/')
          ) return 'vendor-react';

          // Supabase SDK
          if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';

          // All Radix UI components together
          if (id.includes('node_modules/@radix-ui/')) return 'vendor-radix';

          // TanStack Query
          if (id.includes('node_modules/@tanstack/')) return 'vendor-query';

          // Charts — only admin uses these
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-') ||
            id.includes('node_modules/victory-')
          ) return 'vendor-charts';
        },
      },
    },
    chunkSizeWarningLimit: 700,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    cssMinify: true,
    cssCodeSplit: false, // Single CSS file — avoids chunk load failures on Hostinger
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', '@tanstack/react-query'],
  },
}));
