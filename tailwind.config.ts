import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Design System Colors
        "ds-text": {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
          disabled: "var(--text-disabled)",
        },
        "ds-border": {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        "ds-bg": {
          page: "var(--bg-page)",
          card: "var(--bg-card)",
          muted: "var(--bg-muted)",
          hover: "var(--bg-hover)",
          active: "var(--bg-active)",
        },
        success: {
          bg: "var(--success-bg)",
          text: "var(--success-text)",
          border: "var(--success-border)",
        },
        warning: {
          bg: "var(--warning-bg)",
          text: "var(--warning-text)",
          border: "var(--warning-border)",
        },
        error: {
          bg: "var(--error-bg)",
          text: "var(--error-text)",
          border: "var(--error-border)",
        },
        info: {
          bg: "var(--info-bg)",
          text: "var(--info-text)",
          border: "var(--info-border)",
        },
      },
      spacing: {
        "ds-1": "var(--space-1)",
        "ds-2": "var(--space-2)",
        "ds-3": "var(--space-3)",
        "ds-4": "var(--space-4)",
        "ds-5": "var(--space-5)",
        "ds-6": "var(--space-6)",
        "ds-8": "var(--space-8)",
        "ds-10": "var(--space-10)",
        "ds-12": "var(--space-12)",
        "ds-16": "var(--space-16)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "ds-xs": "var(--radius-xs)",
        "ds-sm": "var(--radius-sm)",
        "ds-md": "var(--radius-md)",
        "ds-lg": "var(--radius-lg)",
        "ds-xl": "var(--radius-xl)",
        "ds-pill": "var(--radius-pill)",
      },
      boxShadow: {
        "ds-sm": "var(--shadow-sm)",
        "ds-md": "var(--shadow-md)",
        "ds-lg": "var(--shadow-lg)",
      },
      fontSize: {
        "ds-display": ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        "ds-page-title": ["24px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "ds-section-title": ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "ds-card-title": ["16px", { lineHeight: "1.4", fontWeight: "600" }],
        "ds-body": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "ds-body-small": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "ds-label": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "ds-meta": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "ds-overline": ["11px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      height: {
        "ds-input": "var(--height-input)",
        "ds-button": "var(--height-button)",
        "ds-button-sm": "var(--height-button-sm)",
        "ds-button-lg": "var(--height-button-lg)",
        "ds-sidebar-item": "var(--height-sidebar-item)",
        "ds-table-row": "var(--height-table-row)",
        "ds-tab": "var(--height-tab)",
      },
      width: {
        "ds-sidebar": "var(--sidebar-width)",
        "ds-sidebar-collapsed": "var(--sidebar-width-collapsed)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      transitionDuration: {
        "150": "150ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

