export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gaming: {
          dark: "#0a0e27",
          darker: "#05071a",
          card: "#1a1f3a",
          purple: "#a855f7",
          cyan: "#06b6d4",
          gold: "#f59e0b",
          green: "#10b981",
          red: "#ef4444"
        }
      },
      boxShadow: {
        glow: "0 0 20px rgba(168, 85, 247, 0.5)",
        "glow-lg": "0 0 40px rgba(168, 85, 247, 0.6)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.5)",
        "glow-gold": "0 0 20px rgba(245, 158, 11, 0.5)"
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite"
      },
      keyframes: {
        glow: {
          "0%, 100%": { "box-shadow": "0 0 20px rgba(168, 85, 247, 0.5)" },
          "50%": { "box-shadow": "0 0 40px rgba(168, 85, 247, 0.8)" }
        }
      }
    }
  },
  plugins: []
}
