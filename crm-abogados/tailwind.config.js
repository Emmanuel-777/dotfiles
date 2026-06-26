/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta derivada del logo LexCRM (escudo azul royal → navy)
        blue: {
          50: '#eff5ff',
          100: '#dae8ff',
          200: '#b8d3ff',
          300: '#8ab4ff',
          400: '#5a90f5',
          500: '#3b7bf0',
          600: '#2563eb', // royal — acciones primarias / "CRM"
          700: '#1c47b8',
          800: '#16336f',
          900: '#14254c', // navy profundo — base del escudo
        },
        primary: {
          50: '#eff5ff',
          100: '#dae8ff',
          500: '#3b7bf0',
          600: '#2563eb',
          700: '#1c47b8',
          800: '#16336f',
          900: '#14254c',
        },
        navy: {
          700: '#16336f',
          800: '#152a52',
          900: '#0f1c36',
        },
      },
    },
  },
  plugins: [],
}
