'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, EyeOff, FileHeart, Lock, ShieldCheck, Trash2 } from 'lucide-react';
import { useT } from '../lib/i18n';
import { clearUploaded } from '../lib/results';

/** Optional: set NEXT_PUBLIC_GRIEVANCE_EMAIL to show a contact line. Nothing is shown (and nothing invented) when it is unset. */
const CONTACT = process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL;

export function PrivacyPage() {
  const { t, setLang } = useT();
  const [done, setDone] = useState(false);
  const clearAll = () => {
    clearUploaded();
    try { window.localStorage.removeItem('hc-senior'); } catch { /* storage unavailable */ }
    document.documentElement.dataset.senior = 'false';
    setLang('en');
    try { window.localStorage.removeItem('hc-lang'); } catch { /* storage unavailable */ }
    setDone(true);
  };
  const cards = [{ I: Lock, k: 'priv.c1' }, { I: FileHeart, k: 'priv.c2' }, { I: EyeOff, k: 'priv.c3' }, { I: ShieldCheck, k: 'priv.c4' }] as const;
  return <main className="info-page">
    <div className="breadcrumbs"><Link href="/">{t('nav.home')}</Link><span>/</span><span>{t('nav.privacy')}</span></div>
    <div className="info-hero"><span className="info-icon"><Lock /></span><div className="eyebrow">{t('info.brand')}</div><h1>{t('priv.title')}</h1><p>{t('priv.lede')}</p></div>
    <p className="draft-note priv-draft">{t('priv.draft')}</p>
    <div className="info-cards">{cards.map(({ I, k }) => <article key={k}><span className="info-card-icon"><I /></span><h2>{t(`${k}.t`)}</h2><p>{t(`${k}.p`)}</p></article>)}</div>
    <div className="info-bottom priv-actions">
      <button type="button" className="btn-quiet" onClick={clearAll}><Trash2 size={16} />{t('priv.clear')}</button>
      <Link className="text-link" href="/safety">{t('strip.link')} <ArrowRight size={16} /></Link>
    </div>
    {done && <p className="range-note priv-done" role="status">{t('priv.cleared')}</p>}
    {CONTACT && <p className="priv-contact">{t('priv.contact', { email: CONTACT })}</p>}
  </main>;
}
