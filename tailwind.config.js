/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bdd2ff',
          300: '#8fb3ff',
          400: '#5a89ff',
          500: '#3563ff',
          600: '#1f44f5',
          700: '#1a36d8',
          800: '#1c30a5',
          900: '#1d2f7d',
          950: '#152055'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        soft: '0 4px 20px rgba(16,24,40,0.06)'
      }
    }
  },
  plugins: []
}
