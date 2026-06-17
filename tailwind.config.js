/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ── Accent cuivré ────────────────────────────────────────
        accent: {
          DEFAULT: '#c9843a',
          hover:   '#e09548',
          light:   '#e8b07a',
          dim:     'rgba(201,132,58,0.12)',
          glow:    'rgba(201,132,58,0.25)',
        },

        // ── Statuts ──────────────────────────────────────────────
        'color-success': '#4ade80',
        'color-danger':  '#f87171',
        'color-warning': '#fbbf24',
        'color-info':    '#60a5fa',

        // ── Tokens bg/text/border via var() CSS ──────────────────
        // Ces tokens permettent d'utiliser les classes Tailwind existantes
        // (bg-bg-card, text-text-primary, border-border, etc.)
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card:      'var(--bg-card)',
          hover:     'var(--bg-hover)'
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)'
        },
        border: {
          DEFAULT: 'var(--border)',
          hover:   'var(--border-hover)'
        }
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4' }],
        'xs':  ['11px', { lineHeight: '1.4' }],
        'sm':  ['12px', { lineHeight: '1.5' }],
        'base':['13px', { lineHeight: '1.5' }],
        'md':  ['14px', { lineHeight: '1.5' }],
        'lg':  ['15px', { lineHeight: '1.4' }],
        'xl':  ['18px', { lineHeight: '1.3' }],
        '2xl': ['22px', { lineHeight: '1.2' }],
        '3xl': ['28px', { lineHeight: '1.1' }],
      },

      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },

      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        popup: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        glow:  '0 0 0 3px rgba(201,132,58,0.25)',
      },

      animation: {
        'popup-in': 'popup-in 0.18s ease',
        'fade-in':  'fade-in 0.15s ease',
      },
      keyframes: {
        'popup-in': {
          from: { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
