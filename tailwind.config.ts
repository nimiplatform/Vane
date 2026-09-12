import typography from '@tailwindcss/typography';
import headless from '@headlessui/tailwindcss';
export default {
  darkMode: 'class',
  theme: { extend: { colors: {
    dark: { primary: '#0d1117', secondary: '#161b22', 50: '#0d1117', 100: '#161b22', 200: '#21262d', 300: '#30363d' },
    light: { primary: '#ffffff', secondary: '#f6f8fa', 50: '#ffffff', 100: '#f6f8fa', 200: '#e8edf1', 300: '#d0d7de' },
  } } },
  plugins: [typography, headless({ prefix: 'headless' })],
};
