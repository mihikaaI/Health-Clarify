import type { Result } from '../lib/results';
import { useT } from '../lib/i18n';

/**
 * Shows the bands the lab printed and where the value sits. The colours are neutral on purpose: the lab's own
 * labels are shown as printed, and we do not call any band healthy or unhealthy.
 */
const pretty = (t: string) => t.replace(/>=/g, '≥').replace(/<=/g, '≤');

export function BandedRange({ r }: { r: Result }) {
  const { t, rich } = useT();
  const bands = (r.bands ?? []).map((b, i) => ({ b, i })).sort((x, y) => (x.b.lower ?? -Infinity) - (y.b.lower ?? -Infinity) || (x.b.upper ?? Infinity) - (y.b.upper ?? Infinity));
  const placed = typeof r.bandIndex === 'number' ? r.bandIndex : null;
  const label = placed !== null ? r.bands![placed].label : null;
  return (
    <div className="band-wrap">
      <div className="band-bar" role="img" aria-label={t('band.aria', { bands: bands.map(({ b }) => `${b.label} ${pretty(b.text.replace(b.label, '').trim())}`).join('; '), where: label ? t('band.ariaPlaced', { value: r.displayValue, unit: r.unit, label }) : t('band.ariaNone') })}>
        {bands.map(({ b, i }) => {
          const on = i === placed;
          return (
            <div key={i} className={'band-seg' + (on ? ' on' : '')}>
              <span className="band-name">{b.label}</span>
              <span className="band-limit">{pretty(b.text.replace(b.label, '').replace(/^[\s:\-]+/, '').trim() || b.text)}</span>
              {on && <span className="band-you">{t('band.value', { value: r.displayValue, unit: r.unit })}</span>}
            </div>
          );
        })}
      </div>
      <p className="band-note">
        {placed !== null ? rich('band.placed', { label: label ?? '' }, 'b')
          : r.bandIndex === null ? t('band.gap', { value: r.displayValue, unit: r.unit })
          : t('band.unchecked')}
      </p>
    </div>
  );
}
