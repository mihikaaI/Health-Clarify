import type { Key } from './i18n/en';
/** Reason keys (all start with "reason."). */
export type ReasonKey = Extract<Key, `reason.${string}`>;
/** Stand-in shown when the report prints no reference; screens translate it. */
export const NOT_PRINTED = 'Not printed';
import reports from '../data/reports.json';
import type { ExtractedLabRow } from './report-extraction';

export type Status = 'within_range' | 'outside_range' | 'needs_verification';
export type Direction = 'below' | 'above' | null;

export type Range = { display: string; lower?: number; upper?: number; confirmed: boolean };

/** A result as the UI shows it. `status` and `direction` are always computed here, never typed by hand. */
export type Result = {
  panel: string;
  name: string;
  abbreviation: string;
  value: number | null;
  displayValue: string;
  unit: string;
  reference: string;
  low?: number;
  high?: number;
  status: Status;
  direction: Direction;
  explanation?: string;
  question?: string;
  origin: 'sample' | 'upload';
  /** Plain-language reason shown when status is needs_verification. */
  /** Key into the i18n dictionary (the screen translates it). */
  needsReason?: ReasonKey;
  /** What kind of reference the lab printed: one interval, bands, separate ranges by sex, or something we do not read. */
  refKind: ReferenceDetail['kind'] | 'none';
  /** Bands exactly as printed; bandIndex is the one band containing the value (null when it sits in a gap). */
  bands?: Band[];
  bandIndex?: number | null;
  /** Which printed sex-specific ranges exist, and which one the person chose. */
  sexOptions?: SexKey[];
  sexChosen?: SexKey | null;
};

/** Blueprint rule (info.md §12.4): small, deterministic, supports one- and two-sided intervals. */
export function classifyResult(value: number | null, unit: string | null, range: Range | null): Status {
  if (value === null || !unit || !range?.confirmed || (range.lower === undefined && range.upper === undefined)) return 'needs_verification';
  if (range.lower !== undefined && value < range.lower) return 'outside_range';
  if (range.upper !== undefined && value > range.upper) return 'outside_range';
  return 'within_range';
}

/** Which side of the printed interval the value falls on. Only meaningful for outside_range. */
export function directionOf(value: number | null, range: Range | null): Direction {
  if (value === null || !range) return null;
  if (range.lower !== undefined && value < range.lower) return 'below';
  if (range.upper !== undefined && value > range.upper) return 'above';
  return null;
}

/* ---------- parsing printed text (value and reference) ---------- */

const NUM = '(\\d+(?:\\.\\d+)?)';
const stripThousands = (s: string) => s.replace(/(\d),(?=\d{3}\b)/g, '$1');
const UNIT_TAIL = /^\s*(?:[A-Za-zµμ%/^][A-Za-zµμ%/^\d.\s*]*)?$/;
const BAND_WORDS = /(male|female|men|women|adult|child|infant|desirable|borderline|optimal|risk|normal|high|low|near|very|pregnan|age|year|day|month|trimester)/i;

/** Plain numbers only (optionally followed by an H/L flag). Censored values such as ">8.00" or "<0.03" return null. */
export function parseValue(text: string): number | null {
  const m = stripThousands(text.trim()).match(new RegExp(`^${NUM}\\s*(?:[HL]{1,2}|\\*)?$`));
  return m ? Number(m[1]) : null;
}

/**
 * Reads ONE clean interval exactly as printed: "13.0-17.0", "4 to 10", "<150", "> 40".
 * Anything with bands, sexes, ages or several intervals returns null, which keeps the row at needs_verification.
 */
export function parseReference(text: string): { lower?: number; upper?: number } | null {
  const t = stripThousands(text.replace(/[–—−]/g, '-').trim());
  if (!t || /\n/.test(t) || BAND_WORDS.test(t)) return null;
  let m = t.match(new RegExp(`^${NUM}\\s*(?:-|to)\\s*${NUM}`, 'i'));
  if (m) {
    const lower = Number(m[1]); const upper = Number(m[2]);
    if (!(lower < upper) || !UNIT_TAIL.test(t.slice(m[0].length))) return null;
    return { lower, upper };
  }
  m = t.match(new RegExp(`^[<≤]\\s*=?\\s*${NUM}`));
  if (m && UNIT_TAIL.test(t.slice(m[0].length))) return { upper: Number(m[1]) };
  m = t.match(new RegExp(`^[>≥]\\s*=?\\s*${NUM}`));
  if (m && UNIT_TAIL.test(t.slice(m[0].length))) return { lower: Number(m[1]) };
  return null;
}

/* ---------- bands and sex-specific references ----------
 * These readers only turn the lab's own printed text into numbers. They never pick a range for the person:
 * bands are shown as printed (we mark where the value sits, we do not judge it), and a sex-specific range is
 * used only after the person chooses which printed range to compare with. Anything else stays unread. */

export type Band = { label: string; text: string; lower?: number; upper?: number; lowerInclusive: boolean; upperInclusive: boolean };
export type SexKey = 'male' | 'female';
export type SexRanges = Partial<Record<SexKey, { lower?: number; upper?: number }>>;
export type ReferenceDetail =
  | { kind: 'interval'; lower?: number; upper?: number }
  | { kind: 'bands'; bands: Band[] }
  | { kind: 'sex'; ranges: SexRanges }
  | { kind: 'other' };

const KNOWN_UNITS = /(?:\b(?:mg|g|µg|μg|ng|pg|mmol|µmol|μmol|mIU|µIU|μIU|uIU|IU|U|mEq|cells|10\^\d|x10\^\d)\s*\/\s*(?:dL|mL|L|µL|μL|cumm|mm3|hpf|lpf)\b|\b(?:fL|pg|g\/L)\b|\/\s*(?:cumm|µL|μL|mm3)\b)/gi;
const AGE_OR_STATE = /\b(?:years?|yrs?|months?|days?|weeks?|age|child(?:ren)?|infants?|neonat\w*|newborns?|pregnan\w*|trimester|postmenopaus\w*|premenopaus\w*|luteal|follicular|ovulat\w*)\b/i;
const SEX_WORDS = /\b(?:females?|males?|women|men|woman|man)\b/i;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function cleanReference(text: string, unit: string): string {
  let t = stripThousands(text.replace(/[–—−]/g, '-').replace(/≥/g, '>=').replace(/≤/g, '<='));
  if (unit.trim()) t = t.replace(new RegExp(escapeRe(unit.trim()), 'gi'), ' ');
  return t.replace(KNOWN_UNITS, ' ').replace(/\s+/g, ' ').trim();
}

/** "Desirable <200  Borderline high 200-239  High >=240" → three labelled bands. Needs at least two, each with a label and a clear limit. */
function parseBands(text: string, unit: string): Band[] | null {
  const t = cleanReference(text, unit);
  if (!t || SEX_WORDS.test(t) || AGE_OR_STATE.test(t)) return null;
  const re = /([A-Za-z][A-Za-z/()' ]*?)\s*[:\-]?\s*(<=|<|>=|>)?\s*(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?/g;
  const bands: Band[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const label = m[1].replace(/[:\-\s]+$/, '').trim();
    if (!label || /^(?:to|and|or|ratio|range|level|risk)$/i.test(label)) return null;
    const op = m[2]; const a = Number(m[3]); const b = m[4] === undefined ? undefined : Number(m[4]);
    let band: Band;
    if (b !== undefined) {
      if (op || !(a < b)) return null;
      band = { label, text: m[0].trim(), lower: a, upper: b, lowerInclusive: true, upperInclusive: true };
    } else if (op === '<' || op === '<=') band = { label, text: m[0].trim(), upper: a, lowerInclusive: false, upperInclusive: op === '<=' };
    else if (op === '>' || op === '>=') band = { label, text: m[0].trim(), lower: a, lowerInclusive: op === '>=', upperInclusive: false };
    else return null; // a bare number with no limit sign is ambiguous
    bands.push(band);
  }
  return bands.length >= 2 ? bands : null;
}

/** The band whose printed limits contain the value, or null when the value sits in a gap or in two bands at once. */
export function placeInBand(value: number, bands: Band[]): number | null {
  const hits = bands.flatMap((b, i) => {
    const aboveLower = b.lower === undefined || (b.lowerInclusive ? value >= b.lower : value > b.lower);
    const belowUpper = b.upper === undefined || (b.upperInclusive ? value <= b.upper : value < b.upper);
    return aboveLower && belowUpper ? [i] : [];
  });
  return hits.length === 1 ? hits[0] : null;
}

/** "Male: 13.0-17.0  Female: 12.0-15.0" or "13.0-17.0 (Male) 12.0-15.0 (Female)". Ages, pregnancy or anything unclear → null. */
function parseSexRanges(text: string, unit: string): SexRanges | null {
  const t = cleanReference(text, unit);
  if (!t || AGE_OR_STATE.test(t)) return null;
  const re = /(?:adult\s+)?(?:\b(females?|males?|women|men)\b|\b([MF])(?=\s*:))/gi;
  const marks: { sex: SexKey; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const word = (m[1] ?? m[2]).toLowerCase();
    marks.push({ sex: word.startsWith('f') || word === 'women' ? 'female' : 'male', start: m.index, end: m.index + m[0].length });
  }
  if (!marks.length) return null;
  const valueFirst = /\d/.test(t.slice(0, marks[0].start));
  const ranges: SexRanges = {};
  for (let i = 0; i < marks.length; i++) {
    const seg = valueFirst ? t.slice(i === 0 ? 0 : marks[i - 1].end, marks[i].start) : t.slice(marks[i].end, i + 1 < marks.length ? marks[i + 1].start : t.length);
    const parsed = parseReference(seg.replace(/[()]/g, ' ').replace(/^[\s:;,\-]+/, '').replace(/[\s:;,\-]+$/, ''));
    if (!parsed || ranges[marks[i].sex]) return null;
    ranges[marks[i].sex] = parsed;
  }
  return ranges;
}

/** One reader for everything the lab might print. Order matters: a single clean interval, then sexes, then bands. */
export function parseReferenceDetail(text: string, unit = ''): ReferenceDetail {
  const single = parseReference(text);
  if (single) return { kind: 'interval', ...single };
  const sexes = parseSexRanges(text, unit);
  if (sexes) return { kind: 'sex', ranges: sexes };
  const bands = parseBands(text, unit);
  if (bands) return { kind: 'bands', bands };
  return { kind: 'other' };
}

/* ---------- plain-language content (demo-only until clinician reviewed) ---------- */

type Demo = (typeof reports.combined)[number];
const ALIASES: Record<string, string[]> = {
  Hemoglobin: ['hemoglobin', 'haemoglobin', 'hb'],
  'Total leukocyte count': ['totalleukocytecount', 'totalleucocytecount', 'tlc', 'wbc', 'whitebloodcellcount'],
  'Platelet count': ['plateletcount', 'platelets', 'plt'],
  Triglycerides: ['triglycerides', 'triglycerideslevel', 'tg'],
  'Total cholesterol': ['totalcholesterol', 'cholesteroltotal'],
  'HDL cholesterol': ['hdlcholesterol', 'hdl', 'hdlc'],
  'Thyroid stimulating hormone': ['tsh', 'thyroidstimulatinghormone', 'tshultrasensitive'],
  'Free thyroxine': ['freethyroxine', 'freet4', 'ft4'],
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Name matching is used only to attach the general "what this test measures" text, never to pick a range. */
function demoFor(testName: string): Demo | undefined {
  const key = norm(testName);
  const hit = Object.entries(ALIASES).find(([, list]) => list.some((a) => a === key || (a === 'tsh' && key.startsWith('tsh'))));
  return hit ? reports.combined.find((r) => r.name === hit[0]) : undefined;
}

/* ---------- builders ---------- */

function finish(base: Omit<Result, 'status' | 'direction'>, range: Range | null): Result {
  const status = base.needsReason ? 'needs_verification' : classifyResult(base.value, base.unit, range);
  return { ...base, status, direction: status === 'outside_range' ? directionOf(base.value, range) : null };
}

export const sampleResults: Result[] = reports.combined.map((r: Demo) => {
  const range: Range = { display: r.reference, lower: (r as { low?: number }).low, upper: (r as { high?: number }).high, confirmed: true };
  return finish({
    panel: r.panel, name: r.name, abbreviation: r.abbreviation, value: r.value, displayValue: r.displayValue, unit: r.unit,
    reference: r.reference, low: range.lower, high: range.upper, explanation: r.explanation, question: r.question, origin: 'sample', refKind: 'interval',
  }, range);
});

export type StoredRow = Pick<ExtractedLabRow, 'panel' | 'testName' | 'valueText' | 'unitText' | 'referenceText' | 'sourceText' | 'sourceLineNumber'> & { checked: boolean };

/**
 * Builds a dashboard result from an extracted row. Only user-checked rows can be compared:
 * a clean interval is compared directly, a sex-specific range only once the person picked one, and printed bands
 * are shown with the value's position but never judged.
 */
export function resultFromExtraction(row: StoredRow, sex: SexKey | null = null): Result {
  const value = parseValue(row.valueText);
  const detail: ReferenceDetail | null = row.referenceText.trim() ? parseReferenceDetail(row.referenceText, row.unitText) : null;
  const supported = row.panel === 'CBC' || row.panel === 'Lipid Profile' || row.panel === 'Thyroid';
  const sexOptions = detail?.kind === 'sex' ? (['male', 'female'] as SexKey[]).filter((k) => detail.ranges[k]) : undefined;
  const chosen = detail?.kind === 'sex' && sex && detail.ranges[sex] ? sex : null;
  const parsed = detail?.kind === 'interval' ? detail : chosen && detail?.kind === 'sex' ? detail.ranges[chosen]! : null;
  const range: Range | null = parsed ? { display: row.referenceText, lower: parsed.lower, upper: parsed.upper, confirmed: row.checked } : null;
  const bands = detail?.kind === 'bands' ? detail.bands : undefined;
  const bandIndex = bands && row.checked && value !== null ? placeInBand(value, bands) : undefined;

  let needsReason: ReasonKey | undefined;
  if (!supported) needsReason = bands ? 'reason.unsupportedBands' : 'reason.unsupported';
  else if (!row.checked) needsReason = 'reason.unchecked';
  else if (value === null) needsReason = 'reason.nonNumeric';
  else if (!row.unitText.trim()) needsReason = 'reason.noUnit';
  else if (!row.referenceText.trim()) needsReason = 'reason.noReference';
  else if (detail?.kind === 'sex' && !chosen) needsReason = sex && sexOptions && !sexOptions.includes(sex) ? 'reason.sexOther' : 'reason.sexChoose';
  else if (detail?.kind === 'bands') needsReason = 'reason.bands';
  else if (detail?.kind === 'other') needsReason = 'reason.other';

  const demo = demoFor(row.testName);
  return finish({
    panel: supported ? row.panel : 'Other', name: row.testName || 'Unnamed test', abbreviation: demo?.abbreviation ?? '',
    value, displayValue: row.valueText, unit: row.unitText, reference: row.referenceText || NOT_PRINTED,
    low: parsed?.lower, high: parsed?.upper, explanation: demo?.explanation, question: demo?.question, origin: 'upload', needsReason,
    refKind: detail ? detail.kind : 'none', bands, bandIndex, sexOptions, sexChosen: chosen,
  }, range);
}

/** True when any uploaded row prints separate ranges for men and women. */
export function hasSexRanges(rows: StoredRow[]): boolean {
  return rows.some((r) => r.referenceText.trim() && parseReferenceDetail(r.referenceText, r.unitText).kind === 'sex');
}

/* ---------- session-only hand-off from /analyze to /dashboard (nothing is sent anywhere) ---------- */

const KEY = 'healthclarify-uploaded-rows';
export function saveUploaded(rows: StoredRow[]) { try { window.sessionStorage.setItem(KEY, JSON.stringify(rows)); } catch { /* storage unavailable */ } }
export function loadUploaded(): StoredRow[] {
  try { const raw = window.sessionStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
export function clearUploaded() { try { window.sessionStorage.removeItem(KEY); window.sessionStorage.removeItem(SEX_KEY); } catch { /* storage unavailable */ } }

const SEX_KEY = 'healthclarify-sex-range';
export function saveSexChoice(sex: SexKey | null) { try { if (sex) window.sessionStorage.setItem(SEX_KEY, sex); else window.sessionStorage.removeItem(SEX_KEY); } catch { /* storage unavailable */ } }
export function loadSexChoice(): SexKey | null { try { const v = window.sessionStorage.getItem(SEX_KEY); return v === 'male' || v === 'female' ? v : null; } catch { return null; } }
