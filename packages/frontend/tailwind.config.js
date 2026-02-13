/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        text: {
          DEFAULT: '#1a1a1a',
          muted: '#6b6b6b',
          body: '#3a3a3a',
          inverse: '#ffffff',
          disabled: '#9a9a9a',
        },
        bg: {
          DEFAULT: '#ffffff',
          subtle: '#f5f5f5',
          inverse: '#1a1a1a',
        },
        border: {
          DEFAULT: '#d4d4d4',
        },
        dark: {
          text: {
            DEFAULT: '#e8e8e8',
            body: '#c8c8c8',
            muted: '#8a8a8a',
            inverse: '#d0d0d0',
          },
          bg: {
            DEFAULT: '#121212',
            subtle: '#1e1e1e',
            inverse: '#0a0a0a',
          },
          border: {
            DEFAULT: '#333333',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest: '0.15em',
      },
      lineHeight: {
        relaxed: '1.6',
      },
    },
  },
  plugins: [],
}
