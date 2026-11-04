/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // NoBroker-inspired White and Lite Gold Design System
        nobroker: {
          bg: '#FFFFFF',
          surface: '#FAF8F5',
          card: '#FFFFFF',
          border: '#EBE3D0',
          borderLight: '#F5EFE3',
          gold: '#C5A059',
          goldLight: '#FAF4E6',
          goldDark: '#9A7818',
          goldMuted: '#D8BC76',
          textMain: '#1E2329',
          textMuted: '#5A6573',
        },
        brand: {
          gold: '#C5A059',
          'gold-light': '#FAF4E6',
          'gold-dark': '#9A7818',
          'gold-metallic': '#D4AF37',
          surface: '#FAF8F5',
          border: '#EBE3D0',
          navy: '#1A2A3A',
          'navy-dark': '#111A24',
          'navy-deep': '#0A121A',
        },
        // Primary Theme: Lite Gold
        primary: {
          50: '#FDFBF7',
          100: '#FAF4E6',
          200: '#F3E8CE',
          300: '#E6D3A3',
          400: '#D8BC76',
          500: '#C5A059', // Signature Lite Gold
          600: '#B08B40', // Rich Lite Gold
          700: '#8F6E2D',
          800: '#6F5320',
          900: '#4C3612',
        },
        // Map 'orange' to Lite Gold for seamless compatibility
        orange: {
          50: '#FDFBF7',
          100: '#FAF4E6',
          200: '#F3E8CE',
          300: '#E6D3A3',
          400: '#D8BC76',
          500: '#D4AF37',
          600: '#C5A059', // Signature Lite Gold
          700: '#B08B40',
          800: '#8F6E2D',
          900: '#6F5320',
          950: '#4C3612',
        },
        // Accent Gold
        gold: {
          50: '#FDFBF7',
          100: '#FAF4E6',
          200: '#F3E8CE',
          300: '#E6D3A3',
          400: '#D8BC76',
          500: '#D4AF37',
          600: '#C5A059',
          700: '#B08B40',
          800: '#8F6E2D',
          900: '#4C3612',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Noto Sans Tamil', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'Noto Sans Tamil', 'sans-serif'],
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
