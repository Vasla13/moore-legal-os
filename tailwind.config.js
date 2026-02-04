/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f3ff',
        'neon-pink': '#ff00ff',
        'deep-black': '#050505',
        'dark-gray': '#121212',
      },
      fontFamily: {
        'orbitron': ['"Orbitron"', 'sans-serif'],
        'mono': ['"Share Tech Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}