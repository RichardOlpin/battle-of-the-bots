/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'background': '#0B0C1E',
        'text-primary': '#E0E1FF',
        'text-secondary': '#A1A6D2',
        'brand': '#8A98FF',
        'brand-light': '#A5B4FF',
        'brand-dark': '#6B7AE5',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'glass-bg': 'rgba(255, 255, 255, 0.05)',
        'aurora-purple': '#8A98FF',
        'aurora-blue': '#4E54C8',
        'aurora-pink': '#FF6B9D',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '12px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
