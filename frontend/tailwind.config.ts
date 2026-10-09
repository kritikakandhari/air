import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./context/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { rausch: "#FF385C", rausch2: "#E31C5F", ink: "#222222", mute: "#717171", line: "#DDDDDD", soft: "#F7F7F7" },
      fontFamily: { sans: ['"Airbnb Cereal VF"', "Circular", "-apple-system", "BlinkMacSystemFont", "Roboto", '"Helvetica Neue"', "sans-serif"] },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,.12)", search: "0 3px 12px rgba(0,0,0,.1)", pop: "0 8px 28px rgba(0,0,0,.28)",
        header: "0 1px 0 rgba(0,0,0,.08)",
      },
      keyframes: { pop: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
                   fade: { from: { opacity: "0" }, to: { opacity: "1" } } },
      animation: { pop: "pop .18s ease-out", fade: "fade .15s ease-out" },
    },
  },
  plugins: [],
};
export default config;
