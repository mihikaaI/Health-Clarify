'use client';
import { useEffect, useState } from 'react';
import { Contrast } from 'lucide-react';
import { useT } from '../lib/i18n';

const KEY = 'hc-contrast';
/** High-contrast switch. The saved choice is applied before first paint by a small script in layout.tsx. */
export function ContrastToggle() {
  const { t } = useT();
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(document.documentElement.dataset.contrast === 'high'); }, []);
  const flip = () => {
    const next = !on; setOn(next);
    document.documentElement.dataset.contrast = next ? 'high' : 'normal';
    try { window.localStorage.setItem(KEY, next ? 'high' : 'normal'); } catch { /* storage unavailable */ }
  };
  return <div className="contrast-row"><button type="button" className={'senior-toggle ' + (on ? 'selected' : '')} role="switch" aria-checked={on} onClick={flip}><Contrast size={18} aria-hidden="true" /><span>{t('contrast.label')}</span><span className="toggle-dot" aria-hidden="true" /></button><p>{t('contrast.help')}</p></div>;
}
