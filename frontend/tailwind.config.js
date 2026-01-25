module.exports = {
  content: ["./app/**/*.{tsx,jsx}", "./components/**/*.{tsx,jsx}"],
  theme: {
    extend: {
      colors: {
        luxury: {
          50: '#f5f7ff',
          100: '#ebefff',
          200: '#d6deff',
          300: '#b4c1ff',
          400: '#8b9bff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          pink: '#ec4899',
          purple: '#a855f7',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['6.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-lg': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-md': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'luxury': '0 8px 32px rgba(99, 102, 241, 0.2)',
        'luxury-lg': '0 12px 48px rgba(99, 102, 241, 0.25)',
      }
    },
  },
  plugins: []
};