'use client';
import { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { useT } from '../../lib/i18n';

const size = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** The pages the person has chosen so far, in reading order, each removable. Thumbnails stay in the browser. */
export function PickedFiles({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  const { t } = useT();
  const [urls, setUrls] = useState<(string | null)[]>([]);
  useEffect(() => {
    const made = files.map((f) => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setUrls(made);
    return () => made.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);
  if (!files.length) return null;
  const pages = files.length > 1 && files.every((f) => f.type.startsWith('image/'));
  return (
    <ol className="az-picked" aria-label={t('up.chosen')}>
      {files.map((f, i) => (
        <li key={`${f.name}-${f.size}-${i}`}>
          <span className="az-thumb">{urls[i] /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={urls[i]!} alt="" /> : <FileText size={22} aria-hidden="true" />}</span>
          <span className="az-picked-text"><strong>{pages ? t('up.page', { n: i + 1 }) : f.name}</strong><small>{pages ? `${f.name} · ` : ''}{size(f.size)}</small></span>
          <button type="button" className="btn-quiet az-remove" onClick={() => onRemove(i)} aria-label={pages ? t('up.removePage', { n: i + 1 }) : t('up.removeFile', { name: f.name })}><X size={16} aria-hidden="true" />{t('up.remove')}</button>
        </li>
      ))}
    </ol>
  );
}
