'use client';
import { LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { useT } from '../../lib/i18n';

type Props = { title: string; detail: string; percent: number | null; elapsed: number; onCancel: () => void };

/** One calm status panel: what is happening, how long it usually takes, and a way out. */
export function LoadingPanel({ title, detail, percent, elapsed, onCancel }: Props) {
  const { t } = useT();
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <section className="az-card az-loading" role="status" aria-live="polite">
      <div className="az-loading-head"><LoaderCircle size={22} className="spin" aria-hidden="true" /><div><h2>{title}</h2><p>{detail}</p></div></div>
      <div className="az-bar" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? undefined}>
        <span className={percent === null ? 'az-bar-fill indeterminate' : 'az-bar-fill'} style={percent === null ? undefined : { width: `${Math.max(4, Math.min(100, percent))}%` }} />
      </div>
      <div className="az-loading-meta"><span>{percent === null ? t('load.usually') : t('load.done', { n: Math.round(percent) })}</span><span>{clock}</span></div>
      <p className="az-reassure"><ShieldCheck size={16} aria-hidden="true" />{t('load.reassure')}</p>
      <button type="button" className="btn-quiet" onClick={onCancel}><X size={16} />{t('load.cancel')}</button>
    </section>
  );
}
