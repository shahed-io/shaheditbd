import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dpvdavjwqyviredzoorj.supabase.co';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Proxy /sitemap.xml to the Supabase edge function in dev
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
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt"],
      workbox: {
        // Never cache OAuth redirect
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      manifest: {
        name: "Shahed Store – Digital Software Bangladesh",
        short_name: "Shahed Store",
        description: "Buy Windows 11, Microsoft Office, Adobe & digital software at the lowest price in Bangladesh.",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "bn",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          { src: "/pwa-screenshot-mobile.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Shahed Store Mobile" },
        ],
        categories: ["shopping", "business"],
        shortcuts: [
          { name: "আমার অর্ডার", short_name: "Orders", url: "/dashboard?tab=orders", icons: [{ src: "/pwa-192.png", sizes: "192x192" }] },
          { name: "Shop", short_name: "Shop", url: "/shop", icons: [{ src: "/pwa-192.png", sizes: "192x192" }] },
        ],
      },
    }),
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
          // Core React — tiny, must be first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // Supabase (large) — separate chunk
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // Charting libs (heavy) — only loaded on admin/dashboard
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Radix UI components — split from main bundle
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // Form / validation
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform/')) {
            return 'vendor-forms';
          }
          // Date utilities (heavy)
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-dates';
          }
          // Lucide icons — medium size
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Everything else in node_modules → vendor-misc
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    // esbuild optimizations — remove dead code aggressively
    target: 'es2020',
    sourcemap: false,
    cssMinify: true,
    // Inline small assets (< 2KB) to save requests
    assetsInlineLimit: 2048,
    // Reduce JS size by dropping console logs in prod
    esbuildOptions: {
      drop: ['debugger'],
      legalComments: 'none',
      treeShaking: true,
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    exclude: [],
  },
}));
