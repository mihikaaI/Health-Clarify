'use client';
import { useEffect, useState } from 'react';
import { CircleHelp, LoaderCircle, Minus, Plus } from 'lucide-react';
import { useT } from '../../lib/i18n';

/** `n` is the page number; the label is built when drawn so it follows the chosen language. */
type Page = { url: string; n: number | null };
const ZOOMS = [1, 1.5, 2, 3];

/** Shows the user's own file next to the extracted text so they can compare. Everything stays in the browser. */
export function OriginalViewer({ files }: { files: File[] }) {
  const { t } = useT();
  const [pages, setPages] = useState<Page[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    if (!files.length) { setPages([]); return; }
    let cancelled = false;
    const urls: string[] = [];
    setStatus('loading'); setPage(0); setZoom(0);
    (async () => {
      try {
        const out: Page[] = [];
        for (let f = 0; f < files.length && !cancelled; f += 1) {
          const file = files[f];
          if (file.type === 'application/pdf') {
            const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
            pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
            const doc = await task.promise;
            for (let n = 1; n <= doc.numPages && !cancelled; n += 1) {
              const p = await doc.getPage(n);
              const base = p.getViewport({ scale: 1 });
              const viewport = p.getViewport({ scale: Math.min(2, 1600 / Math.max(base.width, 1)) });
              const canvas = window.document.createElement('canvas');
              canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('canvas');
              await p.render({ canvas, canvasContext: ctx, viewport }).promise;
              const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
              if (!blob) throw new Error('blob');
              const url = URL.createObjectURL(blob); urls.push(url);
              out.push({ url, n });
              canvas.width = 0; canvas.height = 0; p.cleanup();
            }
            await task.destroy();
          } else {
            const url = URL.createObjectURL(file); urls.push(url);
            out.push({ url, n: files.length > 1 ? f + 1 : null });
          }
        }
        if (!cancelled) { setPages(out); setStatus('ready'); }
      } catch { if (!cancelled) setStatus('failed'); }
    })();
    return () => { cancelled = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [files]);

  if (!files.length) return null;
  const z = ZOOMS[zoom];
  const labelOf = (p: Page) => p.n === null ? t('ov.yourReport') : t('up.page', { n: p.n });
  return (
    <figure className="az-viewer" aria-label={t('ov.title')}>
      <figcaption className="az-viewer-head">
        <strong>{t('ov.title')}</strong>
        <span className="az-viewer-tools">
          <button type="button" aria-label={t('ov.zoomOut')} disabled={zoom === 0} onClick={() => setZoom((v) => Math.max(0, v - 1))}><Minus size={16} /></button>
          <span aria-live="polite">{Math.round(z * 100)}%</span>
          <button type="button" aria-label={t('ov.zoomIn')} disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((v) => Math.min(ZOOMS.length - 1, v + 1))}><Plus size={16} /></button>
        </span>
      </figcaption>
      {pages.length > 1 && <div className="az-viewer-pages" role="tablist" aria-label={t('ov.pages')}>{pages.map((p, i) => <button key={p.url} role="tab" aria-selected={i === page} className={i === page ? 'active' : ''} onClick={() => setPage(i)}>{labelOf(p)}</button>)}</div>}
      <div className="az-viewer-frame">
        {status === 'loading' && <p className="az-viewer-note"><LoaderCircle size={16} className="spin" />{t('ov.preparing')}</p>}
        {status === 'failed' && <p className="az-viewer-note"><CircleHelp size={16} />{t('ov.failed')}</p>}
        {status === 'ready' && pages[page] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={pages[page].url} alt={t('ov.alt', { label: labelOf(pages[page]) })} style={{ width: `${z * 100}%` }} />}
      </div>
    </figure>
  );
}
