/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        nasij: {
          primary: '#2F5D4A',
          'primary-dark': '#1F3F32',
          'primary-light': '#3E7962',
          secondary: '#EAD9B6',
          'secondary-light': '#F5EBD5',
          accent: '#D8B37A',
          'accent-dark': '#B8935A',
          cream: '#FAF5EA',
          ink: '#1C1917',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-dm-serif)', 'serif'],
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'weave': 'weave 3s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        weave: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'thread-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23D8B37A' stroke-width='0.5' opacity='0.15'%3E%3Cpath d='M0 30 Q15 20 30 30 T60 30'/%3E%3Cpath d='M0 40 Q15 30 30 40 T60 40'/%3E%3Cpath d='M0 20 Q15 10 30 20 T60 20'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
