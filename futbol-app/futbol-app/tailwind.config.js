/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cancha: {
          verde: "#1D9E75",
          verdeoscuro: "#085041",
        },
      },
    },
  },
  plugins: [],
};
