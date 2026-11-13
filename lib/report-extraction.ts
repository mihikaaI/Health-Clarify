export type CandidateLine = {
  lineNumber: number;
  text: string;
};

export type ExtractedLabRow = {
  panel: 'CBC' | 'Lipid Profile' | 'Thyroid' | 'Unclear' | 'Unsupported';
  testName: string;
  valueText: string;
  unitText: string;
  referenceText: string;
  sourceLineNumber: number;
  sourceText: string;
  needsVerification: boolean;
};

const supportedTestName = /\b(?:cbc|complete blood count|hemoglobin|haemoglobin|\bhb\b|red blood cell|\brbc\b|white blood cell|\bwbc\b|total leukocyte|\btlc\b|platelet|\bplt\b|hematocrit|haematocrit|\bpcv\b|\bmcv\b|\bmchc?\b|\brdw\b|neutrophil|lymphocyte|eosinophil|monocyte|basophil|esr|lipid profile|triglyceride|cholesterol|\bhdl\b|\bldl\b|\bvldl\b|\btsh\b|thyroid|thyroxine|\bt3\b|\bt4\b|\bft3\b|\bft4\b)\b/i;
const measurementUnit = /\b(?:mg|mcg|µg|ug|ng|pg|g|mmol|pmol|miu|uiu|u|iu|%)\s*\/?\s*(?:dl|l|ml|ul|µl|iu|ml|mmol|l)?\b|\b(?:10\s*\^?\s*\d+|mmhg)\b/i;
const numericOrRange = /(?:\d+(?:[.,]\d+)?|[<>≤≥]\s*\d)/;

/** Regex is used only to nominate likely result lines; it never decides a clinical status. */
export function findCandidateLines(ocrText: string): CandidateLine[] {
  const lines = ocrText.split(/\r?\n/).map((text, index) => ({ lineNumber: index + 1, text: text.trim() })).filter((line) => line.text.length > 0);
  return lines.filter(({ text }) => {
    if (supportedTestName.test(text)) return true;
    return numericOrRange.test(text) && measurementUnit.test(text);
  }).slice(0, 150);
}

export function normalizedForMatch(text: string): string {
  return text.toLocaleLowerCase().replace(/[\s,;]/g, '').replace(/[–—]/g, '-');
}
