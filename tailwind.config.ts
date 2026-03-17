import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sora:      ['Sora', 'sans-serif'],
        jakarta:   ['Plus Jakarta Sans', 'sans-serif'],
        fira:      ['Fira Code', 'monospace'],
        orbitron:  ['Orbitron', 'sans-serif'],
      },
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          indigo:  "hsl(258, 78%, 68%)",
          coral:   "hsl(330, 85%, 62%)",
          emerald: "hsl(162, 72%, 46%)",
          amber:   "hsl(42, 96%, 58%)",
          violet:  "hsl(258, 78%, 68%)",
          cyan:    "hsl(186, 78%, 50%)",
          gold:    "hsl(42, 96%, 58%)",
        },
        neon: {
          violet: "hsl(258, 78%, 68%)",
          cyan:   "hsl(186, 78%, 50%)",
          pink:   "hsl(330, 85%, 62%)",
          amber:  "hsl(42, 96%, 58%)",
          gold:   "hsl(42, 96%, 58%)",
        },
        emerald: "hsl(var(--emerald))",
        surface: {
          white: "hsl(var(--surface-white))",
          light: "hsl(var(--surface-light))",
          soft:  "hsl(var(--surface-soft))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xl:   "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "neon-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsla(271,91%,65%,0.5), 0 0 30px hsla(271,91%,65%,0.2)" },
          "50%":      { boxShadow: "0 0 20px hsla(271,91%,65%,0.9), 0 0 60px hsla(271,91%,65%,0.4)" },
        },
        "cyber-scan": {
          "0%":   { top: "-100%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.3s ease-out",
        "scale-in":        "scale-in 0.2s ease-out",
        "neon-glow":       "neon-glow 2s ease-in-out infinite",
        "cyber-scan":      "cyber-scan 2s linear infinite",
        "enter":           "fade-in 0.3s ease-out, scale-in 0.2s ease-out",
      },
        backgroundImage: {
        'gradient-hero':    'linear-gradient(135deg, hsl(258,78%,55%), hsl(200,90%,45%))',
        'gradient-warm':    'linear-gradient(135deg, hsl(330,85%,55%), hsl(42,96%,50%))',
        'gradient-cool':    'linear-gradient(135deg, hsl(200,90%,45%), hsl(162,72%,38%))',
        'gradient-radial':  'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'cyber-grid':       "linear-gradient(hsla(258,78%,55%,0.04) 1px, transparent 1px), linear-gradient(90deg, hsla(258,78%,55%,0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        'soft':         '0 2px 20px hsla(226,35%,12%,0.08)',
        'medium':       '0 8px 40px hsla(226,35%,12%,0.12)',
        'strong':       '0 20px 60px hsla(226,35%,12%,0.18)',
        'indigo':       '0 4px 20px hsla(258,78%,55%,0.30), 0 1px 6px hsla(258,78%,55%,0.15)',
        'coral':        '0 4px 20px hsla(330,85%,55%,0.30), 0 1px 6px hsla(330,85%,55%,0.15)',
        'neon-violet':  '0 4px 20px hsla(258,78%,55%,0.35), 0 1px 6px hsla(258,78%,55%,0.20)',
        'neon-cyan':    '0 4px 20px hsla(200,90%,45%,0.35), 0 1px 6px hsla(200,90%,45%,0.20)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    function({ addUtilities }: any) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width':    'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
} satisfies Config;
