/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#1e1e24',
          panel: '#282830',
          panelLight: '#32323c',
          border: '#3c3c48',
          accent: '#6366f1',
          accentHover: '#4f46e5'
        }
      }
    },
  },
  plugins: [],
};
