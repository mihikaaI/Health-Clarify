'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Accessibility, Activity, ClipboardList, Globe, Home, ShieldCheck, Type, UploadCloud } from 'lucide-react';
import { LANGUAGES, Lang, useT } from '../lib/i18n';

const SENIOR_KEY = 'hc-senior';

export function Header() {
  const { t, lang, setLang } = useT();
  const [senior, setSenior] = useState(false);
  // The real value is applied before first paint by the inline script in layout.tsx; this only syncs the button.
  useEffect(() => { setSenior(document.documentElement.dataset.senior === 'true'); }, []);
  const toggle = () => {
    const next = !senior;
    setSenior(next);
    document.documentElement.dataset.senior = next ? 'true' : 'false';
    try { window.localStorage.setItem(SENIOR_KEY, String(next)); } catch { /* storage unavailable */ }
  };
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label={t('nav.homeAria')}><span className="brand-mark"><Activity size={20} /></span><span>health<span className="brand-light">clarify</span></span></Link>
    <div className="header-right">
      <nav className="nav" aria-label={t('nav.main')}><Link href="/analyze">{t('nav.analyze')}</Link><Link href="/dashboard">{t('nav.demo')}</Link><Link href="/safety">{t('nav.safety')}</Link><Link href="/accessibility">{t('nav.accessibility')}</Link></nav>
      <label className="lang-picker"><Globe size={17} aria-hidden="true" /><span className="sr-only">{t('nav.language')}</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>{LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.label}</option>)}</select></label>
      <button type="button" className={'senior-toggle ' + (senior ? 'selected' : '')} onClick={toggle} aria-pressed={senior}>
        <Accessibility size={18} className="senior-icon-desktop" aria-hidden="true" /><Type size={18} className="senior-icon-mobile" aria-hidden="true" />
        <span className="senior-label-desktop">{t('nav.seniorMode')}</span><span className="senior-label-mobile">{t('nav.largerText')}</span>
        <span className="toggle-dot" aria-hidden="true" />
      </button>
    </div>
  </div></header>;
}

const TABS = [
  { href: '/', label: 'nav.home', Icon: Home },
  { href: '/analyze', label: 'nav.myReport', Icon: UploadCloud },
  { href: '/dashboard', label: 'nav.demoShort', Icon: ClipboardList },
  { href: '/safety', label: 'nav.safety', Icon: ShieldCheck },
] as const;

/** Phone-only dock: a full-width Upload button on Home and Demo, and the main pages one thumb-tap away. */
export function MobileDock() {
  const { t } = useT();
  const path = usePathname() || '/';
  // On Home the hero already has this button, so the sticky one appears only once the hero button scrolls away.
  const [heroButtonVisible, setHeroButtonVisible] = useState(false);
  useEffect(() => {
    const target = path === '/' ? document.querySelector('.hero-actions .primary') : null;
    if (!target || typeof IntersectionObserver === 'undefined') { setHeroButtonVisible(false); return; }
    const observer = new IntersectionObserver(([entry]) => setHeroButtonVisible(entry.isIntersecting), { rootMargin: '0px 0px -70px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [path]);
  const showCta = (path === '/' && !heroButtonVisible) || path === '/dashboard';
  return <>
    <div className={'dock-spacer' + (showCta ? ' with-cta' : '')} aria-hidden="true" />
    <div className="mobile-dock">
      {showCta && <Link href="/analyze" className="button primary mobile-cta"><UploadCloud size={19} aria-hidden="true" />{t('cta.upload')}</Link>}
      <nav className="bottom-nav" aria-label={t('nav.phone')}>
        {TABS.map(({ href, label, Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return <Link key={href} href={href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}><Icon size={22} aria-hidden="true" /><span>{t(label)}</span></Link>;
        })}
      </nav>
    </div>
  </>;
}

/** Always visible near the top of every page: a one-line reminder that this is education, not diagnosis. It cannot be dismissed. */
export function SafetyStrip() {
  const { t } = useT();
  return <div className="safety-strip" role="note"><ShieldCheck size={16} aria-hidden="true" /><p>{t('strip.text')} <Link href="/safety">{t('strip.link')}</Link></p></div>;
}

export function SafetyBanner() {
  const { t, isDraft } = useT();
  return <aside className="safety-banner" aria-label={t('footer.healthNote')}>
    <p><strong>{t('footer.noteLabel')}</strong> {t('footer.note')} <Link href="/accessibility" className="footer-link">{t('nav.accessibility')}</Link><Link href="/privacy" className="footer-link">{t('nav.privacy')}</Link><Link href="/terms" className="footer-link">{t('nav.terms')}</Link></p>
    {isDraft && <p className="draft-note">{t('footer.draftTranslation')}</p>}
  </aside>;
}
