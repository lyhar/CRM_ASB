/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f0f0f',
          secondary: '#141414',
          card: '#1a1a1a',
          hover: '#222222'
        },
        accent: {
          blue: '#3b82f6',
          'blue-hover': '#2563eb',
          green: '#22c55e',
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308'
        },
        text: {
          primary: '#e5e5e5',
          secondary: '#a3a3a3',
          muted: '#525252'
        },
        border: {
          DEFAULT: '#262626',
          hover: '#3f3f3f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
}
