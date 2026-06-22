/** @type {import('tailwindcss').Config} */
export default {
  content: ["./popup.html", "./options.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFAF7",
        ink: "#1C1B19",
        muted: "#6E6A63",
        accent: "#B23A2E",
        line: "#E6E2DA",
        soft: "#F3F1EC",
      },
      fontFamily: {
        serif: ["Georgia", '"Times New Roman"', "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
