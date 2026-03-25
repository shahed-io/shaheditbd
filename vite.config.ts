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
      registerType: "prompt",
      includeAssets: ["favicon.png", "apple-touch-icon.png", "splash-*.png", "robots.txt"],
      workbox: {
        clientsClaim: false,
        skipWaiting: false,
        // Never cache OAuth redirect or HTML navigation (always fresh)
        navigateFallbackDenylist: [/^\/~oauth/],
        // Only cache JS/CSS/images — never HTML (so SW stale app shell can't block render)
        globPatterns: ["**/*.{js,css,ico,png,svg,woff2}"],
        navigationPreload: true,
        runtimeCaching: [
          {
            // Network-first for all navigation (HTML) — SW can never serve a stale shell
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
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
    // Code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk — React + Router loaded separately
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI library chunk
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          // Supabase chunk (large library, separate chunk)
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Smaller chunks = faster initial paint
    chunkSizeWarningLimit: 600,
    // Minification
    minify: 'esbuild',
    target: 'es2020',
    // Source maps off in prod
    sourcemap: false,
    // CSS optimization
    cssMinify: true,
    // Assets inline limit (small assets inlined as base64)
    assetsInlineLimit: 4096,
  },
  // Optimize deps pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    exclude: [],
  },
}));
