import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brandblue: {
          DEFAULT: '#0c274a',
          dark: '#061a35',
          light: '#163a66',
        }
      }
    },
  },
  safelist: [
    'text-brandblue',
    'bg-brandblue',
    'bg-brandblue/5',
    'bg-brandblue/10',
    'border-brandblue',
    'border-brandblue-dark',
    'border-brandblue/20',
    'fill-yellow-500',
    'text-yellow-500',
    // Dark mode classes
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:bg-gray-700',
    'dark:bg-gray-700/50',
    'dark:text-white',
    'dark:text-gray-100',
    'dark:text-gray-300',
    'dark:text-gray-400',
    'dark:text-gray-500',
    'dark:border-gray-700',
    'dark:border-gray-600',
    'dark:hover:bg-gray-700',
    'dark:hover:border-gray-600',
    'dark:bg-brandblue/10',
    'dark:bg-brandblue/20',
    'dark:text-brandblue-light',
    'dark:border-brandblue/30',
  ],
  plugins: [],
}
export default config
