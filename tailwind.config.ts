import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ivory: '#FDFBF7',
          cream: '#FAF6F0',
          warmWhite: '#F5F0E8',
          espresso: '#2D1B15',
          espressoLight: '#3D2B22',
          charcoal: '#1A1A1A',
          terracotta: '#C45D3B',
          terracottaLight: '#D47D5D',
          burgundy: '#6B1D2D',
          burgundyLight: '#8B2D3D',
          antiqueGold: '#C9A86B',
          antiqueGoldLight: '#D8BC8A',
          antiqueGoldDark: '#A88A4E',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 8vw, 7rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.2', letterSpacing: '0' }],
        'editorial-lg': ['clamp(1.25rem, 2.5vw, 1.75rem)', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'editorial-md': ['clamp(1.125rem, 2vw, 1.375rem)', { lineHeight: '1.7', letterSpacing: '0.01em' }],
        'editorial-sm': ['clamp(1rem, 1.5vw, 1.125rem)', { lineHeight: '1.75', letterSpacing: '0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.7s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'slide-down': 'slideDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'reveal': 'reveal 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        reveal: {
          '0%': { clipPath: 'inset(100% 0 0 0)', opacity: '0' },
          '100%': { clipPath: 'inset(0 0 0 0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'jaali-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A86B' fill-opacity='0.04'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'arch-pattern': "url(\"data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A86B' fill-opacity='0.03'%3E%3Cpath d='M60 0C26.86 0 0 26.86 0 60s26.86 60 60 60 60-26.86 60-60-26.86-60-60-60zm0 108C33.5 108 12 86.5 12 60S33.5 12 60 12s48 21.5 48 48-21.5 48-48 48z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'paisley-pattern': "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A86B' fill-opacity='0.025'%3E%3Cpath d='M40 0c-12.5 0-24 8.5-28 20 0 12 15 25 28 35 13-10 28-23 28-35C64 8.5 52.5 0 40 0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
export default config