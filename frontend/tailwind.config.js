/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF6EF',
        latte: '#F0E6D6',
        sand: '#E4D3B8',
        caramel: '#C08457',
        mocha: '#96603A',
        espresso: '#5A3A25',
        bean: '#2E1C13',
        // Status accents
        received: '#B0743A',
        preparing: '#C99A2E',
        ready: '#2F8F4E',
        delivered: '#5B6B7A',
        cancelled: '#B23B3B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Poppins"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(46, 28, 19, 0.08)',
        pop: '0 6px 24px rgba(46, 28, 19, 0.16)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
