import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { ink: '#153c46', teal: '#147d79', mist: '#f3f7f6' } } }, plugins: [] };
export default config;
