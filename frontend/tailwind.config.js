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
          DEFAULT: '#12172B',
          light: '#1C2340',
          soft: '#2A3358',
        },
        canvas: '#F5F6F8',
        ember: {
          DEFAULT: '#FF5A36',
          dark: '#E64522',
          light: '#FFE6DE',
        },
        signal: {
          DEFAULT: '#0EA5A0',
          light: '#DDF5F3',
        },
        warn: {
          DEFAULT: '#F5A524',
          light: '#FDF0DA',
        },
        danger: {
          DEFAULT: '#E11D48',
          light: '#FCE4EA',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
}
