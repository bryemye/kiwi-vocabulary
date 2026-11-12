/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kiwi: {
          vivid: '#7BB33B',      // Primary active / Vivid Kiwi
          lime: '#84C341',       // High-visibility kiwi
          olive: '#2F441E',      // Deep foliage text accent
          tint: '#EDF5E5',       // Soft kiwi badge/tag fill
          bark: '#42281D',       // Deep bark brown
          darkbark: '#301B13',   // Shadow bark
          caramel: '#C29B78',    // Warm caramel
          cream: '#EFE8DF',      // Warm cream
          parchment: '#FAFBF8',  // Canvas backing
          pure: '#FFFFFF',       // Pure white canvas base
          black: '#111410',      // Jet black border & solids
          charcoal: '#1A2017',   // Dark contrast
          muted: '#62685E',      // Technical mono labels
          border: '#111410',     // 2px architectural borders
        }
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(17, 20, 16, 0.04)',
        'soft-sm': '0 2px 5px 0 rgba(17, 20, 16, 0.05)',
        'soft-md': '0 4px 14px -1px rgba(17, 20, 16, 0.07)',
        'soft-lg': '0 10px 25px -3px rgba(17, 20, 16, 0.08), 0 4px 10px -2px rgba(17, 20, 16, 0.03)',
        'soft-xl': '0 20px 35px -5px rgba(17, 20, 16, 0.08), 0 8px 16px -4px rgba(17, 20, 16, 0.03)',
        'card-glow': '0 12px 36px -4px rgba(123, 179, 59, 0.12), 0 4px 14px -2px rgba(66, 40, 29, 0.05)',
        'brutal': '4px 4px 0px 0px #111410',
        'brutal-sm': '2px 2px 0px 0px #111410',
        'brutal-lg': '6px 6px 0px 0px #111410',
        'brutal-brown': '4px 4px 0px 0px #42281D',
        'brutal-brown-sm': '2px 2px 0px 0px #42281D',
        'brutal-kiwi': '4px 4px 0px 0px #7BB33B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
