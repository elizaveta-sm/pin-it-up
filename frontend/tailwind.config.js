/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
          progress: {
              '0%': { width: '100%' },
              '100%': { width: '0%' },
          },
          pauseProgress: {
              '100%': { width: '100%' }, // Maintain current width when hovered
          },
      },
      animation: {
          progress: 'progress 3s linear forwards', 
          pauseProgress: 'pauseProgress 0s linear forwards', // No animation but keeps the current state
      },
    },
  },
  plugins: [],
}