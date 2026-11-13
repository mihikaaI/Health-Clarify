'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, CircleHelp, Info } from 'lucide-react';
import { NOT_PRINTED, type Result, type Status, type Direction } from '../lib/results';
import { BandedRange } from './BandedRange';
import { PrintedReference } from './PrintedReference';
import { useT } from '../lib/i18n';

export function StatusChip({ status, direction }: { status: Status; direction: Direction }) {
  const { t } = useT();
  const text = status === 'within_range' ? t('status.within')
    : status === 'outside_range' ? (direction === 'below' ? t('status.below') : direction === 'above' ? t('status.above') : t('status.outside'))
    : t('status.verify');
  const Icon = status === 'within_range' ? Check : status === 'outside_range' ? (direction === 'below' ? ArrowDown : ArrowUp) : CircleHelp;
  return <span className={'status-chip ' + status}><Icon size={15} aria-hidden="true" />{text}</span>;
}

export function RangeBar({ r }: { r: Result }) {
  const { t } = useT();
  if (r.status === 'needs_verification' || r.value === null || (r.low === undefined && r.high === undefined)) {
    return <div className="range-note"><CircleHelp size={16} />{t('range.noGraphic')}</div>;
  }
  const start = r.low === undefined ? 0 : 16;
  const end = 84;
  let pct = 55;
  if (r.low !== undefined && r.high !== undefined) pct = 16 + ((r.value - r.low) / (r.high - r.low)) * 68;
  else if (r.high !== undefined) pct = 16 + (r.value / r.high) * 68;
  else if (r.low !== undefined) pct = 16 + ((r.value - r.low) / (r.value * 2)) * 68;
  pct = Math.max(5, Math.min(95, pct));
  const where = t(r.status === 'within_range' ? 'range.within' : r.direction === 'below' ? 'range.below' : 'range.above');
  return (
    <div className="range-wrap">
      <div className="range-labels"><span>{r.low !== undefined ? r.low : t('range.noLower')}</span><span>{r.high !== undefined ? r.high : t('range.noUpper')}</span></div>
      <div className="range-track" role="img" aria-label={t('range.aria', { where, reference: r.reference === NOT_PRINTED ? t('ref.none') : r.reference, unit: r.unit })}>
        <div className="range-fill" style={{ left: `${start}%`, width: `${end - start}%` }} />
        <span className={'range-marker ' + (r.status === 'within_range' ? 'marker-good' : 'marker-out')} style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ResultCard({ r }: { r: Result }) {
  const { t, isDraft } = useT();
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="result-card">
      <div className="result-top">
        <div>
          <div className="test-title">{r.name} {r.abbreviation && r.abbreviation.toLowerCase() !== r.name.toLowerCase() && <span className="abbr">{r.abbreviation}</span>}</div>
          <div className="result-value">{r.displayValue}<span>{r.unit}</span></div>
        </div>
        <StatusChip status={r.status} direction={r.direction} />
      </div>
      <PrintedReference r={r} />
      {r.needsReason && <p className="needs-reason"><CircleHelp size={15} aria-hidden="true" />{t(r.needsReason)}</p>}
      {r.refKind === 'bands' && r.bands ? <BandedRange r={r} /> : <RangeBar r={r} />}
      {r.origin === 'upload' && <p className="verify-note">{t('card.verifyNote')}</p>}
      <button className="expand-button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <span><Info size={17} />{t('card.measures')}</span><ChevronDown size={19} className={expanded ? 'rotate' : ''} />
      </button>
      {expanded && (
        <div className="explanation">
          {r.explanation && isDraft && <p className="english-only" lang="en-IN">{t('card.englishOnly')}</p>}
          <p lang={r.explanation ? 'en' : undefined}>{r.explanation ?? t('card.noExplanation')}</p>
          {r.question && <p className="discussion"><strong>{t('card.discuss')}</strong><br /><span lang="en">“{r.question}”</span></p>}
        </div>
      )}
    </article>
  );
}
