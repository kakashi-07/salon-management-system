/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0B0B0F',
          secondary: '#141418',
          card:      '#1C1C24',
          elevated:  '#22222C',
        },
        accent: {
          DEFAULT: '#D4A574',
          light:   '#E8C49A',
          dark:    '#B8865A',
        },
        text: {
          primary:   '#F5F0E8',
          secondary: '#9B9680',
          muted:     '#5A5A6A',
        },
        border: '#2A2A38',
        success: '#4ADE80',
        error:   '#F87171',
        warning: '#FBD38D',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body:    ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 4px 24px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(212,165,116,0.25)',
        inner: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'linear-gradient(135deg, #0B0B0F 0%, #141418 50%, #1C1C24 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'slide-in':   'slideIn 0.3s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                     to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 5px rgba(212,165,116,0.2)' }, '50%': { boxShadow: '0 0 25px rgba(212,165,116,0.5)' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
