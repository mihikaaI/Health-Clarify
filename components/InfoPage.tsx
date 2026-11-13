'use client';
import Link from 'next/link';
import { Accessibility, Activity, AlertTriangle, ArrowRight, BookOpenText, CircleHelp, FileHeart, ShieldCheck, Stethoscope, Sun } from 'lucide-react';
import { ContrastToggle } from './ContrastToggle';
import { useT } from '../lib/i18n';
import type { Key } from '../lib/i18n/en';

export function InfoPage({kind}:{kind:'safety'|'accessibility'}) {
  const { t } = useT();
  const safety = kind === 'safety';
  const cards = safety
    ? [{ I: BookOpenText, k: 'safety.c1' }, { I: FileHeart, k: 'safety.c2' }, { I: Stethoscope, k: 'safety.c3' }, { I: CircleHelp, k: 'safety.c4' }, { I: AlertTriangle, k: 'safety.c5' }]
    : [{ I: Accessibility, k: 'access.c1' }, { I: Activity, k: 'access.c2' }, { I: Sun, k: 'access.c3' }, { I: ShieldCheck, k: 'access.c4' }];
  const p = safety ? 'safety' : 'access';
  return <main className="info-page">
    <div className="breadcrumbs"><Link href="/">{t('nav.home')}</Link><span>/</span><span>{safety ? t('info.crumbSafety') : t('info.crumbAccess')}</span></div>
    <div className="info-hero"><span className="info-icon">{safety ? <ShieldCheck/> : <Accessibility/>}</span><div className="eyebrow">{t('info.brand')}</div><h1>{t(`${p}.title` as Key)}</h1><p>{t(`${p}.lede` as Key)}</p></div>
    {!safety && <ContrastToggle />}
    <div className="info-cards">{cards.map(({ I, k }) => <article key={k}><span className="info-card-icon"><I/></span><h2>{t(`${k}.t` as Key)}</h2><p>{t(`${k}.p` as Key)}</p></article>)}</div>
    <div className="info-bottom"><Link className="button primary" href="/dashboard">{t('info.explore')} <ArrowRight size={17}/></Link><Link className="text-link" href="/">{t('info.back')}</Link></div>
  </main>;
}
