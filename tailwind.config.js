/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5faff',
          100: '#e0f2ff',
          500: '#f65a3bff',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        tactical: {
          canvas: '#05070A',
          surface1: '#0B1017',
          surface2: '#111822',
          hover: '#16202D',
          cyan: '#38BDF8',
          amber: '#F59E0B',
          emerald: '#10B981',
          danger: '#EF4444',
          lightCanvas: '#F3F5F8',
          lightSurface: '#FFFFFF',
          lightElevated: '#E9EEF4',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};