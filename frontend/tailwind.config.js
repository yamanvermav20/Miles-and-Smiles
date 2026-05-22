/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Typography
      fontFamily: {
        'display': ['"Clash Display"', 'system-ui', 'sans-serif'],
        'body': ['"Satoshi"', 'system-ui', 'sans-serif'],
      },
      // Colors - mapped to CSS variables
      colors: {
        bg: 'var(--bg)',
        'bg-deep': 'var(--bg-deep)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-soft': 'var(--accent-soft)',
        emerald: 'var(--emerald)',
        'emerald-soft': 'var(--emerald-soft)',
        violet: 'var(--violet)',
        'violet-soft': 'var(--violet-soft)',
        amber: 'var(--amber)',
        'amber-soft': 'var(--amber-soft)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
      },
      // Border radius - larger, bolder
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      // Box shadows
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'glow': 'var(--shadow-glow)',
        'glow-accent': '0 0 40px var(--accent-glow)',
      },
      // Animations
      animation: {
        'page-reveal': 'pageReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'hero': 'heroEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stagger': 'cardStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'box-capture': 'box-capture 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'box-capture': {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Spacing additions
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
