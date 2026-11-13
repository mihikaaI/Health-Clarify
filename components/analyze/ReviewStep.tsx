'use client';
import { TouchEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleHelp, Download, Pencil, Undo2 } from 'lucide-react';
import type { ExtractedLabRow } from '../../lib/report-extraction';
import { OriginalViewer } from './OriginalViewer';
import { useT } from '../../lib/i18n';
import type { Key } from '../../lib/i18n/en';

export type EditKey = 'testName' | 'valueText' | 'unitText' | 'referenceText';
const FIELDS: { key: EditKey; label: Key }[] = [
  { key: 'testName', label: 'rv.f.name' }, { key: 'valueText', label: 'rv.f.value' },
  { key: 'unitText', label: 'rv.f.unit' }, { key: 'referenceText', label: 'rv.f.ref' },
];

type Props = {
  rows: ExtractedLabRow[]; checked: Record<number, boolean>; files: File[]; index: number;
  onIndex: (i: number) => void; onMark: (i: number, value: boolean) => void;
  onEdit: (i: number, key: EditKey, value: string) => void; onFinish: () => void; onDownload: () => void;
};

/** One extracted row at a time, next to the original. Each row is confirmed individually. */
export function ReviewStep({ rows, checked, files, index, onIndex, onMark, onEdit, onFinish, onDownload }: Props) {
  const { t, rich } = useT();
  const [editing, setEditing] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const row = rows[index];
  const done = rows.filter((_, i) => checked[i]).length;
  useEffect(() => { setEditing(false); }, [index]);
  if (!row) return null;

  const go = (i: number) => onIndex(Math.max(0, Math.min(rows.length - 1, i)));
  const markRight = () => { onMark(index, true); setEditing(false); if (index < rows.length - 1) go(index + 1); };
  const onTouchStart = (e: TouchEvent) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current; touch.current = null;
    if (!start || editing) return;
    const dx = e.changedTouches[0].clientX - start.x; const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="az-review">
      <div className="az-review-original"><OriginalViewer files={files} /></div>
      <div className="az-review-main">
        <div className="az-progress" aria-label={t('rv.rows')}>
          <p>{rich('rv.rowOf', { i: index + 1, n: rows.length, d: done })}</p>
          <div className="az-dots">{rows.map((r, i) => <button key={i} type="button" className={(checked[i] ? 'done ' : '') + (i === index ? 'current' : '')} aria-label={t('rv.dot', { i: i + 1, name: r.testName || t('rv.unnamed'), state: checked[i] ? t('rv.checked') : t('rv.notChecked') })} aria-current={i === index ? 'true' : undefined} onClick={() => go(i)} />)}</div>
        </div>

        <article className="az-row" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
          <div className="az-row-head">
            <span className="panel-tag">{row.panel === 'Unclear' || row.panel === 'Unsupported' ? t('rv.other') : t(`panel.${row.panel}` as Key)}</span>
            {checked[index] ? <span className="reviewed-label"><Check size={14} />{t('rv.byYou')}</span> : <span className="review-label"><CircleHelp size={14} />{t('rv.needs')}</span>}
          </div>
          {row.needsVerification && <p className="az-warn"><CircleHelp size={15} aria-hidden="true" />{t('rv.warn')}</p>}

          {editing ? (
            <div className="az-fields editing">
              {FIELDS.map((f) => <label key={f.key}><span>{t(f.label)}</span><input value={row[f.key]} onChange={(e) => onEdit(index, f.key, e.target.value)} /></label>)}
            </div>
          ) : (
            <dl className="az-fields">
              {FIELDS.map((f) => <div key={f.key} className={f.key === 'valueText' ? 'big' : ''}><dt>{t(f.label)}</dt><dd>{row[f.key] || <em>{t('rv.notFound')}</em>}</dd></div>)}
            </dl>
          )}
          <blockquote className="az-source"><span>{t('rv.source', { n: row.sourceLineNumber })}</span>{row.sourceText}</blockquote>

          <p className="az-ask">{t('rv.ask')}</p>
          <div className="az-actions">
            {editing
              ? <button type="button" className="button primary" onClick={markRight}><Check size={18} />{t('rv.save')}</button>
              : checked[index]
                ? <button type="button" className="btn-quiet" onClick={() => onMark(index, false)}><Undo2 size={16} />{t('rv.undo')}</button>
                : <button type="button" className="button primary" onClick={markRight}><Check size={18} />{t('rv.right')}</button>}
            {!editing && <button type="button" className="btn-quiet az-fix" onClick={() => setEditing(true)}><Pencil size={16} />{t('rv.fix')}</button>}
          </div>
        </article>

        <div className="az-nav">
          <button type="button" className="btn-quiet" disabled={index === 0} onClick={() => go(index - 1)}><ArrowLeft size={16} />{t('rv.prev')}</button>
          <button type="button" className="btn-quiet" disabled={index === rows.length - 1} onClick={() => go(index + 1)}>{t('rv.next')}<ArrowRight size={16} /></button>
        </div>

        <div className="az-finish">
          <p>{rich('rv.finish', { d: done, n: rows.length })}</p>
          <button type="button" className="button primary" onClick={onFinish}>{t('rv.see')} <ArrowRight size={18} /></button>
        </div>
        <details className="az-advanced"><summary>For evaluators: export extracted data</summary><button type="button" className="btn-quiet" onClick={onDownload}><Download size={16} />Download JSON</button></details>
      </div>
    </div>
  );
}
