import { Noto_Sans_Devanagari } from 'next/font/google';

/** Used for Hindi and Marathi. Loaded only when needed: Next.js serves just the Devanagari subset. */
export const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400', '500', '600', '700'], variable: '--font-deva', display: 'swap' });
