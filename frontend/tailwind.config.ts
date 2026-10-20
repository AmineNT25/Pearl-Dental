import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        muted: "#5f6f89",
        line: "#d8e1ed",
        surface: "#f5f8fb",
        brand: { DEFAULT: "#246bfe", dark: "#184eb8", soft: "#eef5ff" },
        teal: "#11a7a1",
      },
      boxShadow: { panel: "0 10px 24px rgba(20, 33, 61, 0.06)" },
    },
  },
  plugins: [],
};

export default config;
