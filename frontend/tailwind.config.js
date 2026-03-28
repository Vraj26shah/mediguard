/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Custom keyframes for the BLOCK flash animation
      // Triggers when ArmorClaw blocks a tool call — screen flashes red
      keyframes: {
        blockFlash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '20%, 60%': { backgroundColor: 'rgba(239, 68, 68, 0.25)' },
        },
      },
      animation: {
        'block-flash': 'blockFlash 0.8s ease-in-out',
      },
    },
  },
  plugins: [],
};
