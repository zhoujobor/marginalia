/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#F5F5F5",
          900: "#FFFFFF",
          800: "#F8F8F8",
          700: "#F9FAFB",
          600: "#EEEEEE",
          500: "#E0E0E0",
          400: "#BDBDBD",
        },
        paper: {
          DEFAULT: "#1A1A1A",
          50: "#666666",
          100: "#1A1A1A",
          200: "#2D2D2D",
          300: "#424242",
        },
        gold: {
          DEFAULT: "#F59E0B",
          50: "#FEF3C7",
          100: "#FCD34D",
          200: "#F59E0B",
          300: "#D97706",
          400: "#B45309",
        },
        teal: {
          DEFAULT: "#14B8A6",
          50: "#CCFBF1",
          100: "#99F6E4",
          200: "#14B8A6",
          300: "#0D9488",
          400: "#0F766E",
        },
        crimson: {
          DEFAULT: "#EF4444",
          50: "#FEE2E2",
          100: "#FECACA",
          200: "#EF4444",
          300: "#DC2626",
        },
        moss: {
          DEFAULT: "#22C55E",
          50: "#DCFCE7",
          100: "#BBF7D0",
          200: "#22C55E",
        },
        smoke: {
          DEFAULT: "#4B5563",
          50: "#374151",
          100: "#4B5563",
        },
        blue: {
          DEFAULT: "#3B82F6",
          50: "#DBEAFE",
          100: "#BFDBFE",
          200: "#3B82F6",
          300: "#2563EB",
          400: "#1D4ED8",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#8B5CF6",
          300: "#7C3AED",
        },
        orange: {
          DEFAULT: "#F97316",
          50: "#FFEDD5",
          100: "#FDBA74",
          200: "#F97316",
          300: "#EA580C",
        },
        pink: {
          DEFAULT: "#EC4899",
          50: "#FCE7F3",
          100: "#FBCFE8",
          200: "#EC4899",
          300: "#DB2777",
        },
        cyan: {
          DEFAULT: "#06B6D4",
          50: "#CFFAFE",
          100: "#A5F3FC",
          200: "#06B6D4",
          300: "#0891B2",
        },
        indigo: {
          DEFAULT: "#6366F1",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#6366F1",
          300: "#4F46E5",
        },
      },
      fontFamily: {
        display: ['system-ui', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        sans: ['system-ui', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        'editorial': '0.04em',
        'wide-2': '0.12em',
        'wide-3': '0.2em',
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'gold-glow': '0 0 0 1px rgba(245, 158, 11, 0.4), 0 4px 16px rgba(245, 158, 11, 0.3)',
        'ai-glow': '0 0 0 1px rgba(20, 184, 166, 0.4), 0 4px 16px rgba(20, 184, 166, 0.3)',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E\")",
        'paper-grain': "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 1px), url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.10'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ai': {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(20, 184, 166, 0.4), 0 0 14px -4px rgba(20, 184, 166, 0.4)' },
          '50%': { boxShadow: '0 0 0 1px rgba(20, 184, 166, 0.6), 0 0 24px -2px rgba(20, 184, 166, 0.5)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-fast': 'fade-in-fast 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'pulse-ai': 'pulse-ai 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
