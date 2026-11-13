'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, ArrowUp, Check, ChevronDown, CircleHelp, ClipboardList, Droplet, FileHeart, Filter, Pill, FlaskConical, HeartPulse, Info, ShieldCheck, Stethoscope, Sun, Trash2 } from 'lucide-react';
import { ResultCard } from '../ResultCard';
import { ResultActions } from '../ResultActions';
import { useT } from '../../lib/i18n';
import { Result, SexKey, StoredRow, clearUploaded, hasSexRanges, loadSexChoice, loadUploaded, resultFromExtraction, sampleResults, saveSexChoice } from '../../lib/results';
import type { Key } from '../../lib/i18n/en';

const panelIcons: Record<string, typeof Activity> = { CBC: Activity, 'Lipid Profile': HeartPulse, Thyroid: FlaskConical, Other: ClipboardList, Diabetes: Droplet, Vitamins: Sun, Liver: Pill, Kidney: Filter };
/** What each panel covers. Kept in English until a clinician has reviewed translations (see the note on each result card). */
const panelDescriptions: Record<string,string> = { CBC:'A complete blood count looks at several types of cells in your blood.', 'Lipid Profile':'A lipid profile measures different fats and cholesterol-carrying particles in blood.', Other:'Tests that are not part of the supported CBC, lipid or thyroid panels are shown as printed, without a comparison.', Thyroid:'Thyroid tests measure hormones involved in thyroid signaling.', Diabetes:'These tests look at sugar (glucose) in the blood, now and on average over the past few months.', Vitamins:'These tests measure the amount of certain vitamins in the blood.', Liver:'Liver tests measure enzymes and other substances that come from the liver.', Kidney:'Kidney tests measure waste products that the kidneys normally filter from the blood.' };
const GROUPS: { k: Result['status']; label: Key }[] = [{ k: 'outside_range', label: 'grp.outside' }, { k: 'within_range', label: 'grp.within' }, { k: 'needs_verification', label: 'grp.verify' }];
const panelKey = (name: string) => (`panel.${name}`) as Key;

function DoctorQuestionsCard() {
  const { t } = useT();
  return <section className="questions-card"><div className="questions-icon"><Stethoscope/></div><div><h3>{t('side.visit.title')}</h3><p>{t('side.visit.body')}</p><details><summary>{t('side.visit.summary')} <ChevronDown size={16}/></summary><ul><li>{t('side.visit.q1')}</li><li>{t('side.visit.q2')}</li><li>{t('side.visit.q3')}</li></ul></details></div></section>;
}

export function DashboardPage() {
  const { t } = useT();
  const [uploaded, setUploaded] = useState<StoredRow[]>([]);
  const [source, setSource] = useState<'sample' | 'yours'>('sample');
  const [panel, setPanel] = useState('All');
  const [sex, setSex] = useState<SexKey | null>(null);

  useEffect(() => {
    const rows = loadUploaded();
    setUploaded(rows);
    setSex(loadSexChoice());
    if (rows.length && new URLSearchParams(window.location.search).get('source') === 'upload') setSource('yours');
  }, []);

  const all: Result[] = useMemo(() => source === 'yours' ? uploaded.map((row) => resultFromExtraction(row, sex)) : sampleResults, [source, uploaded, sex]);
  const needsSexChoice = useMemo(() => hasSexRanges(uploaded), [uploaded]);
  const chooseSex = (next: SexKey | null) => { setSex(next); saveSexChoice(next); };
  const choices = useMemo(() => ['All', ...Array.from(new Set(all.map((r) => r.panel)))], [all]);
  const active = choices.includes(panel) ? panel : 'All';
  const visible = useMemo(() => active === 'All' ? all : all.filter((r) => r.panel === active), [all, active]);
  const count = (status: Result['status']) => visible.filter((r) => r.status === status).length;
  const yours = source === 'yours';
  const PanelIcon = (name: string) => { const I = panelIcons[name] ?? Activity; return <I size={16} />; };
  const removeUpload = () => { clearUploaded(); setUploaded([]); setSex(null); setSource('sample'); setPanel('All'); };

  return <main className="dashboard-page">
    <div className="breadcrumbs"><Link href="/">{t('nav.home')}</Link><span>/</span><span>{yours ? t('dash.crumbYours') : t('dash.crumbSample')}</span></div>
    <section className="dash-heading">
      <div>
        <div className="eyebrow">{yours ? t('dash.eyebrowYours') : t('dash.eyebrowSample')} <span className="demo-tag">{yours ? t('dash.tagYours') : t('dash.tagSample')}</span></div>
        <h1>{t('dash.title')}</h1>
        <p>{yours ? t('dash.ledeYours') : t('dash.ledeSample')}</p>
      </div>
      <div className="dash-file"><div className="file-icon"><FileHeart /></div><span><b>{yours ? t('dash.fileYours') : t('dash.fileSample')}</b><small>{yours ? t('dash.fileYoursSub') : t('dash.fileSampleSub')}</small></span><ShieldCheck size={19} /></div>
    </section>
    {uploaded.length > 0 && <div className="panel-tabs source-tabs" role="tablist" aria-label={t('dash.whichReport')}>
      <button role="tab" aria-selected={yours} className={yours ? 'active' : ''} onClick={() => { setSource('yours'); setPanel('All'); }}><FileHeart size={16} />{t('dash.tabYours')}</button>
      <button role="tab" aria-selected={!yours} className={!yours ? 'active' : ''} onClick={() => { setSource('sample'); setPanel('All'); }}><Activity size={16} />{t('dash.tabSample')}</button>
    </div>}
    <div className="report-info"><Info size={17} /><p>{yours ? t('dash.infoYours') : t('dash.infoSample')}</p></div>
    {yours && needsSexChoice && <section className="sex-picker" aria-labelledby="sex-picker-title">
      <h2 id="sex-picker-title">{t('dash.sex.title')}</h2>
      <p>{t('dash.sex.body')}</p>
      <div className="sex-picker-options">
        <div className="sex-radios" role="radiogroup" aria-labelledby="sex-picker-title">{([['male', t('dash.sex.male')], ['female', t('dash.sex.female')]] as [SexKey, string][]).map(([key, label]) =>
          <button key={key} type="button" role="radio" aria-checked={sex === key} onClick={() => chooseSex(key)}>{label}</button>)}</div>
        {sex && <button type="button" className="sex-clear" onClick={() => chooseSex(null)}>{t('dash.sex.clear')}</button>}
      </div>
    </section>}
    {visible.length > 0 && <div className="glance" role="img" aria-label={`${t('dash.within')}: ${count('within_range')}, ${t('dash.outside')}: ${count('outside_range')}, ${t('dash.verify')}: ${count('needs_verification')}`}>
      {(['within_range', 'outside_range', 'needs_verification'] as const).map((k) => count(k) > 0 && <span key={k} className={'glance-seg ' + k} style={{ flexGrow: count(k) }} />)}
    </div>}
    <section className="summary-row" aria-label={t('dash.summary')}>
      <div className="summary-card"><span className="summary-icon"><ClipboardList /></span><div><small>{t('dash.shown')}</small><strong>{visible.length}</strong></div></div>
      <div className="summary-card"><span className="summary-icon good-icon"><Check /></span><div><small>{t('dash.within')}</small><strong>{count('within_range')}</strong></div></div>
      <div className="summary-card"><span className="summary-icon outside-icon"><ArrowUp /></span><div><small>{t('dash.outside')}</small><strong>{count('outside_range')}</strong></div></div>
      <div className="summary-card"><span className="summary-icon verify-icon"><CircleHelp /></span><div><small>{t('dash.verify')}</small><strong>{count('needs_verification')}</strong></div></div>
    </section>
    <div className="dashboard-layout">
      <section className="results-section">
        <div className="panel-heading"><div><h2>{t('dash.reported')}</h2><p>{yours ? t('dash.chooseYours') : t('dash.chooseSample')}</p></div>{!yours && <span className="sample-only"><ShieldCheck size={15} />{t('dash.demoOnly')}</span>}</div>
        <div className="panel-tabs" role="tablist" aria-label={t('dash.panelAria')}>{choices.map((choice) => <button key={choice} role="tab" aria-selected={active === choice} className={active === choice ? 'active' : ''} onClick={() => setPanel(choice)}>{choice === 'All' ? <Activity size={16} /> : PanelIcon(choice)}{t(panelKey(choice))}</button>)}</div>
        {active !== 'All' && panelDescriptions[active] && <div className="panel-intro"><span className="panel-intro-icon">{PanelIcon(active)}</span><p>{panelDescriptions[active]}</p></div>}
        {visible.length === 0 && <p className="range-note">{t('dash.empty')}</p>}
        {GROUPS.map(({ k, label }) => {
          const items = visible.filter((r) => r.status === k);
          if (!items.length) return null;
          return <section key={k} className="result-group" aria-labelledby={`grp-${k}`}>
            <h3 id={`grp-${k}`} className={'group-title ' + k}><span className="group-dot" aria-hidden="true" />{t(label)}<span className="group-count">{items.length}</span></h3>
            <div className="result-list">{items.map((r, i) => <ResultCard key={`${r.panel}-${r.name}-${i}`} r={r} />)}</div>
          </section>;
        })}
        <ResultActions results={visible} />
        {yours && <button className="btn-quiet remove-upload" onClick={removeUpload}><Trash2 size={16} />{t('dash.remove')}</button>}
      </section>
      <aside className="sidebar"><DoctorQuestionsCard /><div className="side-note urgent"><AlertTriangle size={18} /><div><b>{t('side.urgent.t')}</b><p>{t('side.urgent.p')}</p></div></div><div className="side-note"><ShieldCheck size={18} /><div><b>{t('side.nodx.title')}</b><p>{t('side.nodx.body')}</p><Link href="/safety">{t('side.nodx.link')} <ArrowRight size={14} /></Link></div></div><div className="side-note neutral"><CircleHelp size={18} /><div><b>{t('side.unclear.title')}</b><p>{yours ? t('side.unclear.yours') : t('side.unclear.sample')}</p></div></div></aside>
    </div>
    <div className="dashboard-end"><ShieldCheck size={17} />{yours ? t('dash.endYours') : t('dash.endSample')}</div>
  </main>;
}

