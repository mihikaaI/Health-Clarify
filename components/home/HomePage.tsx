'use client';
import Link from 'next/link';
import { Accessibility, Activity, ArrowDown, ArrowRight, BookOpenText, Check, FileHeart, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { ResultCard } from '../ResultCard';
import { LANGUAGES, useT } from '../../lib/i18n';
import { sampleResults } from '../../lib/results';

export function HomePage() {
  const { t, rich, lang, setLang } = useT();
  const preview = sampleResults;
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/>{t('home.eyebrow')}</div>
        <h1>{rich('home.title', undefined, 'em')}</h1>
        <p className="hero-lede">{t('home.lede')}</p>
        <div className="hero-actions"><Link className="button primary" href="/analyze">{t('cta.upload')} <ArrowRight size={18}/></Link><Link className="button secondary" href="/dashboard">{t('home.ctaSample')}</Link><Link className="text-link" href="/safety">{t('home.howSafe')} <ArrowDown size={16}/></Link></div>
        <div className="hero-note"><ShieldCheck size={17}/>{t('home.note')}</div>
        <div className="hero-langs" role="group" aria-label={t('home.langs')}>{LANGUAGES.map((l) => <button key={l.code} type="button" lang={l.code} aria-pressed={lang === l.code} className={lang === l.code ? 'on' : ''} onClick={() => setLang(l.code)}>{l.label}</button>)}</div>
      </div>
      <div className="hero-art" aria-label={t('home.artAria')}><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
        <div className="report-preview">
          <div className="report-head"><div className="mini-logo"><Activity size={15}/></div><div><b>{t('home.art.sample')}</b><small>{t('home.art.demo')}</small></div><span className="report-check"><Check size={14}/></span></div>
          <div className="report-rule"/><div className="report-label"><span>{t('home.art.test')}</span><span>{t('home.art.result')}</span></div>
          <div className="report-row"><span><b>Hemoglobin</b><small>{t('home.art.cbc')}</small></span><strong className="demo-low">11.2 <small>g/dL</small></strong></div>
          <div className="report-row"><span><b>Triglycerides</b><small>{t('home.art.lipid')}</small></span><strong>210 <small>mg/dL</small></strong></div>
          <div className="report-row"><span><b>TSH</b><small>{t('home.art.thyroid')}</small></span><strong>6.2 <small>µIU/mL</small></strong></div>
          <div className="report-footer"><span><Check size={14}/> {t('home.art.footer')}</span><div className="mini-bars"><i/><i/><i/><i/><i/></div></div>
        </div>
        <div className="floating-note"><span className="note-check"><Check size={14}/></span><span><b>{t('home.art.float1')}</b><small>{t('home.art.float2')}</small></span></div><div className="art-sparkle"><Sparkles size={22}/></div>
      </div>
    </section>
    <section className="trust-strip">
      <div><ShieldCheck/><span><b>{t('home.trust1.t')}</b><small>{t('home.trust1.s')}</small></span></div>
      <div><FileHeart/><span><b>{t('home.trust2.t')}</b><small>{t('home.trust2.s')}</small></span></div>
      <div><Accessibility/><span><b>{t('home.trust3.t')}</b><small>{t('home.trust3.s')}</small></span></div>
    </section>
    <section className="home-content">
      <div className="section-heading"><div><div className="eyebrow">{t('home.start.eyebrow')}</div><h2>{t('home.start.title')}</h2></div><p>{t('home.start.lede')}</p></div>
      <div className="feature-grid">
        <article className="feature-card"><span className="feature-icon lavender"><BookOpenText/></span><span className="step-number">01</span><h3>{t('home.f1.t')}</h3><p>{t('home.f1.p')}</p></article>
        <article className="feature-card"><span className="feature-icon aqua"><Activity/></span><span className="step-number">02</span><h3>{t('home.f2.t')}</h3><p>{t('home.f2.p')}</p></article>
        <article className="feature-card"><span className="feature-icon peach"><Stethoscope/></span><span className="step-number">03</span><h3>{t('home.f3.t')}</h3><p>{t('home.f3.p')}</p></article>
      </div>
      <div className="preview-wrap"><div className="section-heading compact"><div><div className="eyebrow">{t('home.look.eyebrow')}</div><h2>{t('home.look.title')}</h2></div><Link className="text-link" href="/dashboard">{t('home.look.link')} <ArrowRight size={16}/></Link></div>
        <div className="preview-grid">{preview.filter(r=>r.panel==='CBC').slice(0,2).map((r,i)=><ResultCard key={i} r={r}/>)}</div></div>
    </section>
  </main>;
}

