import type { Config } from 'tailwindcss'

const config: Config = {
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
  ],
  plugins: [],
}
export default config
