import { Check } from 'lucide-react';
import { useT } from '../../lib/i18n';

export const STEPS = ['step.1', 'step.2', 'step.3', 'step.4'] as const;

/** `current` is 1-based. Steps before it show a tick. */
export function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const { t } = useT();
  return (
    <ol className="az-stepper" aria-label={t('step.progress')}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'current' : 'todo';
        return (
          <li key={label} className={'az-step ' + state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="az-step-dot" aria-hidden="true">{state === 'done' ? <Check size={14} /> : n}</span>
            <span className="az-step-label">{t(label)}<span className="sr-only">{state === 'done' ? t('step.done') : state === 'current' ? t('step.current') : ''}</span></span>
          </li>
        );
      })}
    </ol>
  );
}
