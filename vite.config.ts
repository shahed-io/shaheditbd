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
        // Fine-grained code splitting: each chunk loads only when needed
        manualChunks(id) {
          // React core — loaded first, cached aggressively
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Supabase SDK — large, separate chunk
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // Recharts — only used on admin pages, defer
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
          // Radix UI — split from main bundle
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-ui';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // Admin-only pages — loaded only when /ceo/* is visited
          if (id.includes('src/pages/admin/') || id.includes('src/components/admin/')) {
            return 'admin';
          }
        },
      },
    },
    // Warn if any chunk exceeds 500kB
    chunkSizeWarningLimit: 500,
    // esbuild is faster and produces smaller output than terser
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    cssMinify: true,
    // Inline tiny assets (< 4kB) as base64 to save HTTP round trips
    assetsInlineLimit: 4096,
    // Ensure CSS is extracted to a separate file so it can be cached
    cssCodeSplit: true,
  },
  // Pre-bundle critical deps so first HMR is instant in dev
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', '@tanstack/react-query'],
  },
}));
