import type { Metadata, Viewport } from 'next';
import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';
import './theme.css';
import { Header, MobileDock, SafetyBanner, SafetyStrip } from '../components/Shell';
import { I18nProvider } from '../lib/i18n';
import { devanagari } from './fonts';

const body = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const head = Manrope({ subsets: ['latin'], variable: '--font-head', display: 'swap' });

export const metadata: Metadata = { title: 'HealthClarify — understand your lab report', description: 'Plain-language help to understand your lab report before your doctor visit. Educational only, not medical advice.', icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#0b3b3a' };
/** Runs before first paint so Senior mode does not flash: reads the saved choice and sets the same data attribute the CSS uses. */
const SENIOR_SCRIPT = `try{document.documentElement.dataset.senior=localStorage.getItem('hc-senior')==='true'?'true':'false'}catch(e){}`;
/** Same idea for language: if a non-English language is saved, set it now and hide the page for a moment so English never flashes. A CSS timer reveals the page anyway if the language file is slow. */
/** And for high contrast: the saved choice, or the device's own "more contrast" setting when nothing is saved. */
const CONTRAST_SCRIPT = `try{var c=localStorage.getItem('hc-contrast');if(c==='high'||c==='normal')document.documentElement.dataset.contrast=c}catch(e){}`;
const LANG_SCRIPT = `try{var l=localStorage.getItem('hc-lang');if(l==='hi'||l==='mr'){document.documentElement.lang=l;document.documentElement.dataset.i18nPending='true'}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${body.variable} ${head.variable} ${devanagari.variable}`} suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: SENIOR_SCRIPT + CONTRAST_SCRIPT + LANG_SCRIPT }} /></head>
    <body><I18nProvider><Header /><SafetyStrip />{children}<SafetyBanner /><MobileDock /></I18nProvider></body>
  </html>;
}
