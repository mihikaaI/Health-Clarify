import { NOT_PRINTED, type Result } from '../lib/results';
import { useT } from '../lib/i18n';

/** The lab's reference text exactly as printed, one printed line per row, so multi-line references stay readable. */
export function PrintedReference({ r }: { r: Result }) {
  const { t } = useT();
  const lines = r.reference.split(/\n|;/).map((l) => l.trim()).filter(Boolean);
  const multi = lines.length > 1;
  return (
    <div className="printed-ref">
      <span className="printed-ref-label">{t('ref.label')}</span>
      {multi && r.refKind === 'bands' ? (
        <details className="printed-ref-raw"><summary>{t('ref.raw')}</summary>
          <ul className="printed-ref-lines">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {r.unit && <span className="printed-ref-unit">{t('ref.unit', { unit: r.unit })}</span>}
        </details>
      ) : multi ? (
        <>
          <ul className="printed-ref-lines">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {r.unit && <span className="printed-ref-unit">{t('ref.unit', { unit: r.unit })}</span>}
        </>
      ) : <strong className="printed-ref-one">{r.reference === NOT_PRINTED ? t('ref.none') : lines[0]} {r.unit}</strong>}
      {r.sexChosen && <span className="printed-ref-note">{t('ref.sexNote', { sex: t(r.sexChosen === 'male' ? 'sex.male' : 'sex.female') })}</span>}
    </div>
  );
}
