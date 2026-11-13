'use client';
import { useEffect, useState } from 'react';
import { Share2, Volume2, VolumeX } from 'lucide-react';
import type { Result } from '../lib/results';
import { NOT_PRINTED } from '../lib/results';
import { Lang, useT } from '../lib/i18n';
import type { Key } from '../lib/i18n/en';

const SPEECH_LANG: Record<Lang, string> = { en: 'en-in', hi: 'hi-in', mr: 'mr-in' };

/** "Share on WhatsApp" and "Read aloud" for the results currently on screen. Both only act when the person taps them. */
export function ResultActions({ results }: { results: Result[] }) {
  const { t, lang } = useT();
  const [speaking, setSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  const statusText = (r: Result) => t(((): Key => r.status === 'within_range' ? 'status.within'
    : r.status === 'outside_range' ? (r.direction === 'below' ? 'status.below' : r.direction === 'above' ? 'status.above' : 'status.outside')
    : 'status.verify')());

  // A read-aloud button is only offered when this device really has a voice for the chosen language.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) { setCanSpeak(false); return; }
    const synth = window.speechSynthesis;
    const check = () => setCanSpeak(synth.getVoices().some((v) => v.lang.toLowerCase().replace('_', '-').startsWith(SPEECH_LANG[lang].slice(0, 2))));
    check();
    synth.addEventListener?.('voiceschanged', check);
    return () => { synth.removeEventListener?.('voiceschanged', check); synth.cancel(); setSpeaking(false); };
  }, [lang]);
  useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const shareText = () => [t('share.title'), '', ...results.map((r) => t('share.line', { name: r.name, value: r.displayValue, unit: r.unit, reference: r.reference === NOT_PRINTED ? t('ref.none') : r.reference.replace(/\s*\n\s*/g, ' / '), status: statusText(r) })), '', t('share.foot')].join('\n');
  const share = async () => {
    const text = shareText();
    if (typeof navigator !== 'undefined' && 'share' in navigator) { try { await navigator.share({ text }); return; } catch { /* cancelled: fall through to the link */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };
  const listen = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    synth.cancel();
    const lines = results.map((r) => t('listen.item', { name: r.name, value: r.displayValue, unit: r.unit, status: statusText(r) }));
    lines.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line); u.lang = SPEECH_LANG[lang];
      if (i === lines.length - 1) u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      synth.speak(u);
    });
    setSpeaking(true);
  };

  if (!results.length) return null;
  return <div className="result-actions">
    <button type="button" className="btn-quiet" onClick={() => void share()}><Share2 size={16} aria-hidden="true" />{t('share.btn')}</button>
    {canSpeak && <button type="button" className="btn-quiet" onClick={listen} aria-pressed={speaking}>{speaking ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}{speaking ? t('listen.stop') : t('listen.btn')}</button>}
    <small>{t('share.note')}</small>
  </div>;
}
