/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-color)',
        card: 'var(--card-bg)',
        primary: {
          DEFAULT: 'var(--primary-main)',
          light: 'var(--primary-light)',
          glow: 'var(--primary-glow)',
        },
        success: '#10B981',
        danger: '#EF4444',
        neutral: {
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border-color)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
        input: '10px',
        chip: '999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(124, 92, 191, 0.08)',
        hover: '0 8px 32px rgba(124, 92, 191, 0.14)',
      }
    },
  },
  plugins: [],
}
