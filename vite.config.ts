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
        // Simple chunk splitting — reliable on all CDNs including Hostinger
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    cssMinify: true,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
  },
  // Pre-bundle critical deps so first HMR is instant in dev
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', '@tanstack/react-query'],
  },
}));
