'use client';
import Link from 'next/link';
import { ArrowRight, BookOpenText, CircleHelp, FileHeart, ShieldCheck } from 'lucide-react';
import { useT } from '../lib/i18n';

export function TermsPage() {
  const { t } = useT();
  const cards = [{ I: BookOpenText, k: 'terms.c1' }, { I: CircleHelp, k: 'terms.c2' }, { I: FileHeart, k: 'terms.c3' }, { I: ShieldCheck, k: 'terms.c4' }] as const;
  return <main className="info-page">
    <div className="breadcrumbs"><Link href="/">{t('nav.home')}</Link><span>/</span><span>{t('nav.terms')}</span></div>
    <div className="info-hero"><span className="info-icon"><BookOpenText /></span><div className="eyebrow">{t('info.brand')}</div><h1>{t('terms.title')}</h1><p>{t('terms.lede')}</p></div>
    <p className="draft-note priv-draft">{t('priv.draft')}</p>
    <div className="info-cards">{cards.map(({ I, k }) => <article key={k}><span className="info-card-icon"><I /></span><h2>{t(`${k}.t`)}</h2><p>{t(`${k}.p`)}</p></article>)}</div>
    <div className="info-bottom"><Link className="button primary" href="/dashboard">{t('info.explore')} <ArrowRight size={17} /></Link><Link className="text-link" href="/privacy">{t('nav.privacy')}</Link></div>
  </main>;
}
