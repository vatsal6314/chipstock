/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chip: {
          bg: '#F8F9FA',
          card: '#FFFFFF',
          dark: '#18181B',
          muted: '#71717A',
          amber: '#F59E0B',
          red: '#EF4444',
          orange: '#F97316',
          green: '#10B981',
          emerald: '#059669',
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'sheet': '0 -4px 20px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
      },
      padding: {
        'safe-bottom': 'env(safe-area-inset-bottom, 16px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
}
