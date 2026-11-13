'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en, { Dict, Key } from './en';

export type Lang = 'en' | 'hi' | 'mr';
/** Names are written in their own language so people can find theirs even if the page is in another one. */
export const LANGUAGES: { code: Lang; label: string; draft: boolean }[] = [
  { code: 'en', label: 'English', draft: false },
  { code: 'hi', label: 'हिन्दी', draft: true },
  { code: 'mr', label: 'मराठी', draft: true },
];
export const LANG_KEY = 'hc-lang';

const loaders: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Dict }>> = {
  hi: () => import('./hi'),
  mr: () => import('./mr'),
};
const isLang = (v: unknown): v is Lang => LANGUAGES.some((l) => l.code === v);

type Vars = Record<string, string | number>;
const fill = (text: string, vars?: Vars) => vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;

type I18n = {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** Plain text. */
  t: (key: Key, vars?: Vars) => string;
  /** Text where *this part* becomes emphasised (default <strong>). Values in `vars` are never treated as markup. */
  rich: (key: Key, vars?: Vars, Tag?: 'strong' | 'em' | 'b') => ReactNode;
  isDraft: boolean;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [dict, setDict] = useState<Dict>(en);

  const load = useCallback(async (next: Lang) => {
    if (next === 'en') { setDict(en); setLangState('en'); return; }
    try {
      const mod = await loaders[next]();
      setDict({ ...en, ...mod.default }); // anything missing falls back to English
      setLangState(next);
    } catch { setDict(en); setLangState('en'); }
  }, []);

  // First paint is English (same as the server); the saved language is applied as soon as its file arrives.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(LANG_KEY); } catch { /* storage unavailable */ }
    const done = () => document.documentElement.removeAttribute('data-i18n-pending');
    if (isLang(saved) && saved !== 'en') void load(saved).finally(done); else done();
  }, [load]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((next: Lang) => {
    try { window.localStorage.setItem(LANG_KEY, next); } catch { /* storage unavailable */ }
    void load(next);
  }, [load]);

  const value = useMemo<I18n>(() => {
    const t = (key: Key, vars?: Vars) => fill(dict[key] ?? en[key] ?? key, vars);
    const rich = (key: Key, vars?: Vars, Tag: 'strong' | 'em' | 'b' = 'strong') =>
      (dict[key] ?? en[key] ?? key).split(/\*(.+?)\*/g).map((part, i) => i % 2 ? <Tag key={i}>{fill(part, vars)}</Tag> : fill(part, vars));
    return { lang, setLang, t, rich, isDraft: lang !== 'en' };
  }, [dict, lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
}
