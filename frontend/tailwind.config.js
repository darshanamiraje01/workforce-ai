/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
          300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
        },
        surface: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          700: '#1e2433', 800: '#151a27', 850: '#111622', 900: '#0d1117', 950: '#090d14',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'slide-in-right': 'slideInRight 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        glow: { '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.6)' } },
        countUp: { from: { opacity: 0, transform: 'scale(0.8)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-brand': '0 0 30px rgba(99,102,241,0.25)',
        'glow-success': '0 0 30px rgba(16,185,129,0.25)',
        'glow-danger': '0 0 30px rgba(239,68,68,0.25)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.2)',
      }
    }
  },
  plugins: []
}
