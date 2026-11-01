/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#101A24',
          light: '#1B2937',
          dark: '#0A1118',
        },
        forest: {
          DEFAULT: '#183D35',
          dark: '#0E2922',
          light: '#245248',
          deep: '#0B201B',
        },
        ivory: {
          DEFAULT: '#F7F3EB',
          light: '#FCFAF5',
          dark: '#EFECE3',
          surface: '#F4F0E6',
        },
        parchment: {
          DEFAULT: '#EDE3D1',
          light: '#F5EFE3',
          dark: '#DFCDB7',
          aged: '#E5D6C1',
        },
        sage: {
          DEFAULT: '#A8B8A6',
          light: '#E2E8E1',
          dark: '#7A8C78',
          subtle: '#EEF2ED',
        },
        gold: {
          DEFAULT: '#B99A64',
          light: '#D4BE92',
          dark: '#927545',
          muted: '#C5AA7A',
          foil: '#E8D5AC',
        },
        charcoal: {
          DEFAULT: '#4D565C',
          light: '#717B82',
          dark: '#30373C',
        },
        border: {
          subtle: '#DED8CD',
          parchment: '#D6C8B2',
          dark: '#243A34',
          midnight: 'rgba(255, 255, 255, 0.12)',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', '"Manrope"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(16, 26, 36, 0.04)',
        'card': '0 10px 30px -5px rgba(16, 26, 36, 0.07)',
        'elevated': '0 20px 40px -10px rgba(16, 26, 36, 0.10)',
        'parchment': '0 12px 35px -8px rgba(16, 26, 36, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'glow-gold': '0 0 25px rgba(185, 154, 100, 0.25)',
      },
      letterSpacing: {
        'editorial': '0.04em',
        'loose-editorial': '0.14em',
        'cartographic': '0.22em',
      }
    },
  },
  plugins: [],
}
