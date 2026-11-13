'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, CircleHelp, Download, FileText, Images, LoaderCircle, MonitorSmartphone, RotateCw, ShieldCheck } from 'lucide-react';
import { ExtractedLabRow, findCandidateLines } from '../lib/report-extraction';
import { prepareImage } from '../lib/image';
import { saveUploaded } from '../lib/results';
import { Stepper } from './analyze/Stepper';
import { LoadingPanel } from './analyze/LoadingPanel';
import { OriginalViewer } from './analyze/OriginalViewer';
import { PickedFiles } from './analyze/PickedFiles';
import { EditKey, ReviewStep } from './analyze/ReviewStep';
import { useT } from '../lib/i18n';
import en, { Key } from '../lib/i18n/en';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 15;
const MAX_IMAGES = 10;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

type Stage = 'upload' | 'reading' | 'check' | 'finding' | 'review';
type Method = 'online' | 'device';
type ApiPayload = { error?: string; code?: string; retryable?: boolean };
type Vars = Record<string, string | number>;
/** A message to show: a dictionary key plus values, translated when it is drawn (so switching language also switches it). */
type Say = { key: Key; vars?: Vars; page?: number };
type Retry = null | 'read' | 'find';

class FriendlyError extends Error {
  say: Say; retryable: boolean;
  constructor(say: Say, retryable: boolean) { super(say.key); this.say = say; this.retryable = retryable; }
}
/** Turns any failed call into plain language; provider names, keys and settings never reach the screen. */
function friendly(cause: unknown, fallback: Key) {
  if (cause instanceof FriendlyError) return cause;
  if (cause instanceof TypeError) return new FriendlyError({ key: 'err.offline' }, true);
  return new FriendlyError({ key: fallback }, true);
}
/** Picks our own translated wording for a server reply, using the code it sends. */
function fromServer(payload: ApiPayload, fallback: Key, page?: number) {
  const key = `err.${payload.code}` as Key;
  return new FriendlyError({ key: payload.code && Object.prototype.hasOwnProperty.call(en, key) ? key : fallback, page }, payload.retryable !== false);
}
const isAbort = (cause: unknown) => cause instanceof DOMException && cause.name === 'AbortError';
const download = (name: string, data: unknown) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = window.document.createElement('a'); link.href = url; link.download = name;
  window.document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const HEADING_KEYS: Record<Stage, { title: Key; lede: Key }> = {
  upload: { title: 'az.h.upload.t', lede: 'az.h.upload.l' }, reading: { title: 'az.h.reading.t', lede: 'az.h.reading.l' }, check: { title: 'az.h.check.t', lede: 'az.h.check.l' },
  finding: { title: 'az.h.finding.t', lede: 'az.h.finding.l' }, review: { title: 'az.h.review.t', lede: 'az.h.review.l' },
};

export function ReportImporter() {
  const router = useRouter();
  const { t, rich } = useT();
  const [stage, setStage] = useState<Stage>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [readFailed, setReadFailed] = useState(false);
  const [method, setMethod] = useState<Method>('online');
  const [agree, setAgree] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [rows, setRows] = useState<ExtractedLabRow[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<Say | null>(null);
  const [retry, setRetry] = useState<Retry>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [detail, setDetail] = useState<Say | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const workerRef = useRef<import('tesseract.js').Worker | null>(null);
  const cancelledRef = useRef(false);
  /** Text already read for each page, so "Try again" continues where it stopped instead of starting over. */
  const pageTextsRef = useRef<string[]>([]);

  const candidates = useMemo(() => findCandidateLines(ocrText), [ocrText]);
  const busy = stage === 'reading' || stage === 'finding';
  const current: 1 | 2 | 3 = stage === 'upload' || stage === 'reading' ? 1 : stage === 'check' || stage === 'finding' ? 2 : 3;

  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);
  useEffect(() => () => { abortRef.current?.abort(); void workerRef.current?.terminate(); }, []);

  /** Adds pages in the order they are chosen. One PDF stands alone; photos are added as pages (up to MAX_IMAGES). */
  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = ''; // lets the same photo be chosen again after removing it
    if (!picked.length) return;
    setError(null); setRetry(null); setReadFailed(false); setRows([]); setChecked({}); setOcrText(''); setAgree(false); setStage('upload'); pageTextsRef.current = [];
    const unsupported = picked.find((f) => !SUPPORTED_TYPES.includes(f.type));
    if (unsupported) { setError({ key: 'err.fileType' }); return; }
    const pdf = picked.find((f) => f.type === 'application/pdf');
    if (pdf) {
      if (picked.length > 1) { setError({ key: 'err.pdfAlone' }); return; }
      if (pdf.size > MAX_FILE_SIZE) { setError({ key: 'err.pdfBig' }); return; }
      setFiles([pdf]); return;
    }
    setPreparing(true);
    try {
      const prepared = await Promise.all(picked.map(prepareImage));
      const tooBig = prepared.find((f) => f.size > MAX_FILE_SIZE);
      if (tooBig) { setError({ key: 'err.photoBig', vars: { name: tooBig.name } }); return; }
      setFiles((prev) => {
        const base = prev.some((f) => f.type === 'application/pdf') ? [] : prev;
        const next = [...base, ...prepared];
        if (next.length > MAX_IMAGES) setError({ key: 'err.maxPages', vars: { max: MAX_IMAGES } });
        return next.slice(0, MAX_IMAGES);
      });
    } finally { setPreparing(false); }
  }

  function removeFile(index: number) {
    setError(null); setRetry(null); setReadFailed(false); setAgree(false); pageTextsRef.current = [];
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function startOver() {
    abortRef.current?.abort(); setStage('upload'); setFiles([]); pageTextsRef.current = []; setOcrText(''); setRows([]); setChecked({}); setError(null); setRetry(null); setAgree(false); setIndex(0);
  }

  function cancel() {
    cancelledRef.current = true; abortRef.current?.abort(); void workerRef.current?.terminate(); workerRef.current = null;
    setError(null); setRetry(null);
    setStage(stage === 'reading' ? 'upload' : 'check');
  }

  async function readOnline() {
    if (!files.length) return;
    const controller = new AbortController(); abortRef.current = controller;
    const total = files.length; const texts = pageTextsRef.current;
    try {
      for (let i = 0; i < total; i += 1) {
        if (texts[i] !== undefined) continue; // already read before a retry
        setDetail(total > 1 ? { key: 'load.page', vars: { n: i + 1, total } } : { key: 'load.sending' });
        if (total > 1) setPercent((i / total) * 100);
        const form = new FormData(); form.append('file', files[i]); form.append('consent', 'true');
        const response = await fetch('/api/ocr/datalab', { method: 'POST', body: form, signal: controller.signal });
        const payload = await response.json().catch(() => ({})) as ApiPayload & { text?: string };
        if (!response.ok) throw fromServer(payload, 'err.readFail', total > 1 ? i + 1 : undefined);
        texts[i] = payload.text?.trim() ?? '';
        if (total === 1 && !texts[i]) throw new FriendlyError({ key: 'err.noTextOne' }, false);
      }
      const all = texts.filter(Boolean).join('\n\n');
      if (!all) throw new FriendlyError({ key: 'err.noTextMany' }, false);
      setOcrText(all); setPercent(null); setStage('check');
    } catch (cause) {
      if (isAbort(cause)) return;
      const problem = friendly(cause, 'err.readUnfinished');
      setError(problem.say); setRetry(problem.retryable ? 'read' : null); setReadFailed(true); setPercent(null); setStage('upload');
    }
  }

  async function readOnDevice() {
    if (!files.length) return;
    const file = files[0];
    cancelledRef.current = false;
    setDetail({ key: 'load.deviceOne' }); setPercent(0);
    try {
      const { createWorker } = await import('tesseract.js');
      let pageShare = { index: 0, total: 1 };
      const worker = await createWorker('eng', 1, {
        workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr/lang', gzip: true, workerBlobURL: false,
        logger: (m) => { if (m.status === 'recognizing text') setPercent(((pageShare.index + m.progress) / pageShare.total) * 100); },
      });
      workerRef.current = worker;
      let text = '';
      try {
        if (file.type === 'application/pdf') {
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
          const doc = await task.promise;
          if (doc.numPages > MAX_PDF_PAGES) throw new FriendlyError({ key: 'err.pdfPages', vars: { max: MAX_PDF_PAGES } }, false);
          for (let n = 1; n <= doc.numPages; n += 1) {
            pageShare = { index: n - 1, total: doc.numPages }; setDetail({ key: 'load.devicePage', vars: { n, total: doc.numPages } });
            const p = await doc.getPage(n);
            const base = p.getViewport({ scale: 1 });
            const viewport = p.getViewport({ scale: Math.min(1.8, 2800 / Math.max(base.width, base.height)) });
            const canvas = window.document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new FriendlyError({ key: 'err.canvas' }, false);
            await p.render({ canvas, canvasContext: ctx, viewport }).promise;
            const result = await worker.recognize(canvas);
            text += `${text ? '\n' : ''}${result.data.text}`;
            canvas.width = 0; canvas.height = 0; p.cleanup();
          }
          await task.destroy();
        } else {
          for (let n = 0; n < files.length; n += 1) {
            pageShare = { index: n, total: files.length };
            setDetail(files.length > 1 ? { key: 'load.devicePage', vars: { n: n + 1, total: files.length } } : { key: 'load.deviceOne' });
            text += `${text ? '\n\n' : ''}${(await worker.recognize(files[n])).data.text}`;
          }
        }
      } finally { await worker.terminate(); workerRef.current = null; }
      if (!text.trim()) throw new FriendlyError({ key: 'err.noTextDevice' }, false);
      setOcrText(text.trim()); setPercent(null); setStage('check');
    } catch (cause) {
      if (cancelledRef.current) return;
      setPercent(null);
      setError(cause instanceof FriendlyError ? cause.say : { key: 'err.readDeviceFail' });
      setRetry(cause instanceof FriendlyError && !cause.retryable ? null : 'read'); setReadFailed(true); setStage('upload');
    }
  }

  function startReading() {
    setError(null); setRetry(null); setReadFailed(false); setRows([]); setChecked({}); setPercent(method === 'device' ? 0 : null); setStage('reading');
    void (method === 'online' ? readOnline() : readOnDevice());
  }

  async function findValues() {
    setError(null); setRetry(null); setPercent(null); setDetail({ key: 'load.finding' }); setStage('finding');
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidates, consent: true }), signal: controller.signal });
      const payload = await response.json().catch(() => ({})) as ApiPayload & { results?: ExtractedLabRow[] };
      if (!response.ok) throw fromServer(payload, 'err.findFail');
      const found = payload.results ?? [];
      if (!found.length) throw new FriendlyError({ key: 'err.noValues' }, false);
      setRows(found); setChecked({}); setIndex(0); setStage('review');
    } catch (cause) {
      if (isAbort(cause)) return;
      const problem = friendly(cause, 'err.findFail');
      setError(problem.say); setRetry(problem.retryable ? 'find' : null); setStage('check');
    }
  }

  function seeResults() {
    saveUploaded(rows.map((row, i) => ({ panel: row.panel, testName: row.testName, valueText: row.valueText, unitText: row.unitText, referenceText: row.referenceText, sourceText: row.sourceText, sourceLineNumber: row.sourceLineNumber, checked: Boolean(checked[i]) })));
    router.push('/dashboard?source=upload');
  }

  const editRow = (i: number, key: EditKey, value: string) => { setRows((prev) => prev.map((r, n) => n === i ? { ...r, [key]: value } : r)); setChecked((prev) => ({ ...prev, [i]: false })); };
  const markRow = (i: number, value: boolean) => setChecked((prev) => ({ ...prev, [i]: value }));
  const exportRows = () => download('healthclarify-extraction.json', { source: 'HealthClarify reading and extraction', note: 'Text extraction only. No result classification is included.', results: rows.map((r, i) => ({ ...r, needsVerification: !checked[i], reviewStatus: checked[i] ? 'user_checked_against_original' : 'needs_verification' })) });
  const exportText = () => download('healthclarify-text-review.json', { note: 'Text is unverified. Candidate lines are pattern matches only and are not classified.', extractedText: ocrText, candidateLines: candidates });
  const onRetry = () => { if (retry === 'find') void findValues(); else startReading(); };

  const head = HEADING_KEYS[stage];
  const errorText = error ? (error.page ? t('err.pageWhere', { n: error.page }) : '') + t(error.key, error.vars) : '';
  const detailText = detail ? t(detail.key, detail.vars) : '';
  return <main className="analyze-page az-page">
    <div className="breadcrumbs"><Link href="/">{t('nav.home')}</Link><span>/</span><span>{t('az.crumb')}</span></div>
    <section className="analyze-heading"><div className="eyebrow">{t('az.eyebrow')}</div><h1>{t(head.title)}</h1><p>{t(head.lede)}</p></section>
    <Stepper current={current} />

    {error && <div className="az-error" role="alert">
      <p><CircleHelp size={18} aria-hidden="true" />{errorText}</p>
      <div className="az-error-actions">
        {retry && <button type="button" className="btn-quiet" onClick={onRetry}><RotateCw size={16} />{t('er.tryAgain')}</button>}
        {stage === 'upload' && method === 'online' && readFailed && files.length > 0 && <button type="button" className="btn-quiet" onClick={() => { setMethod('device'); setAgree(false); setError(null); setRetry(null); }}><MonitorSmartphone size={16} />{t('er.useDevice')}</button>}
      </div>
    </div>}

    {stage === 'upload' && <section className="az-card">
      <div className="privacy-note"><ShieldCheck size={19} /><p><strong>{t('up.experimental')}</strong> {t('up.experimentalBody')}</p></div>
      <div className="az-picker" role="group" aria-label={t('up.add')}>
        <label className="az-tile az-tile-camera" htmlFor="pick-camera"><Camera size={24} aria-hidden="true" /><strong>{files.length ? t('up.cameraMore') : t('up.camera')}</strong><small>{t('up.cameraSub')}</small>
          <input id="pick-camera" type="file" accept="image/*" capture="environment" onChange={addFiles} /></label>
        <label className="az-tile" htmlFor="pick-photos"><Images size={24} aria-hidden="true" /><strong>{files.length ? t('up.galleryMore') : t('up.gallery')}</strong><small>{t('up.gallerySub')}</small>
          <input id="pick-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} /></label>
        <label className="az-tile" htmlFor="report-file"><FileText size={24} aria-hidden="true" /><strong>{t('up.pdf')}</strong><small>{t('up.pdfSub')}</small>
          <input id="report-file" type="file" accept="application/pdf" onChange={addFiles} /></label>
      </div>
      {preparing && <p className="az-preparing" role="status"><LoaderCircle size={16} className="spin" aria-hidden="true" />{t('up.preparing')}</p>}
      <PickedFiles files={files} onRemove={removeFile} />
      {!files.length && <p className="az-tip">{t('up.tip')}</p>}

      {files.length > 0 && <>
        <fieldset className="az-methods">
          <legend>{t('up.howRead')}</legend>
          <label className={'az-method' + (method === 'online' ? ' selected' : '')}><input type="radio" name="method" checked={method === 'online'} onChange={() => { setMethod('online'); setAgree(false); }} /><span><strong>{t('up.online')} <em>{t('up.recommended')}</em></strong><small>{t('up.onlineSub')}</small></span></label>
          <label className={'az-method' + (method === 'device' ? ' selected' : '')}><input type="radio" name="method" checked={method === 'device'} onChange={() => { setMethod('device'); setAgree(false); }} /><span><strong>{t('up.device')}</strong><small>{t('up.deviceSub')}</small></span></label>
        </fieldset>

        <label className="consent-check az-consent"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>{method === 'online' ? t('up.consentOnline') : t('up.consentDevice')}</span></label>
        <details className="az-details"><summary>{t('up.who')}</summary>
          <ul>
            {method === 'online' && <li>{rich('up.who1')}</li>}
            <li>{rich('up.who2')}</li>
            <li>{t('up.who3')}</li>
            <li>{t('up.who4')}</li>
          </ul>
        </details>
        <button type="button" className="button primary az-primary" disabled={!agree} onClick={startReading}><FileText size={18} />{t('up.read')}</button>
      </>}
    </section>}

    {stage === 'reading' && <LoadingPanel title={t('az.h.reading.t')} detail={detailText} percent={percent} elapsed={elapsed} onCancel={cancel} />}

    {stage === 'check' && <div className="az-split">
      <div className="az-split-original"><OriginalViewer files={files} /></div>
      <section className="az-card az-check">
        <label htmlFor="az-text" className="az-label">{t('ck.label')}</label>
        <textarea id="az-text" value={ocrText} onChange={(e) => { setOcrText(e.target.value); setRows([]); setChecked({}); }} rows={12} />
        <p className="az-found">{candidates.length ? rich('ck.found', { n: candidates.length }) : t('ck.none')}</p>
        <div className="az-actions">
          <button type="button" className="button primary" disabled={!candidates.length} onClick={() => void findValues()}>{t('ck.find')} <ArrowRight size={18} /></button>
          <button type="button" className="btn-quiet" onClick={startOver}>{t('ck.startOver')}</button>
        </div>
        <details className="az-advanced"><summary>For evaluators: detected lines and data</summary>
          <pre>{JSON.stringify(candidates, null, 2)}</pre>
          <button type="button" className="btn-quiet" onClick={exportText}><Download size={16} />Save text as JSON</button>
        </details>
      </section>
    </div>}

    {stage === 'finding' && <LoadingPanel title={t('az.h.finding.t')} detail={detailText} percent={null} elapsed={elapsed} onCancel={cancel} />}

    {stage === 'review' && <ReviewStep rows={rows} checked={checked} files={files} index={index} onIndex={setIndex} onMark={markRow} onEdit={editRow} onFinish={seeResults} onDownload={exportRows} />}

    <p className="analyze-footer"><Link href="/dashboard"><ArrowLeft size={15} />{t('az.back')}</Link></p>
  </main>;
}
