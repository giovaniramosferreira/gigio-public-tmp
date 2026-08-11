import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        poup: {
          50:  '#f5e9ff',
          100: '#e9ccff',
          200: '#d49dff',
          300: '#bc6aff',
          400: '#a83eff',
          500: '#8A05BE',
          600: '#7904a6',
          700: '#63038a',
          800: '#4d026b',
          900: '#350149',
          950: '#1e0029',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'count-up': 'countUp 1s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(138, 5, 190, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(138, 5, 190, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
