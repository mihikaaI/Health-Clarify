export const runtime = 'nodejs';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_POLLS = 45;
const POLL_INTERVAL_MS = 2000;

type DatalabResponse = {
  request_check_url?: string;
  status?: string;
  markdown?: string;
  error?: string;
};

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.DATALAB_API_KEY;
  if (!apiKey) { console.error('OCR unavailable: DATALAB_API_KEY is not set.'); return Response.json({ error: 'Reading your report online isn’t available right now. You can read it on this device instead.', code: 'ocr_unavailable', retryable: false }, { status: 503 }); }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'The Datalab OCR request was not valid.' }, { status: 400 });
  }

  if (form.get('consent') !== 'true') return Response.json({ error: 'Consent is required before sending the original file to Datalab.' }, { status: 400 });
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Choose a report file first.' }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: 'Choose a JPG, PNG, WebP, or PDF report.' }, { status: 415 });
  if (file.size === 0 || file.size > MAX_FILE_SIZE) return Response.json({ error: 'The file must be between 1 byte and 10 MB.' }, { status: 413 });

  try {
    const upstreamForm = new FormData();
    upstreamForm.append('file', file, file.name);
    upstreamForm.append('output_format', 'markdown');
    upstreamForm.append('mode', 'accurate');
    upstreamForm.append('paginate', 'true');

    const submitted = await fetchWithTimeout('https://www.datalab.to/api/v1/convert', {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: upstreamForm,
    });
    if (!submitted.ok) return Response.json({ error: submitted.status === 429 ? 'Lots of people are using HealthClarify right now. Please wait a minute and try again.' : 'We couldn’t read this file. Please try again, or read it on this device instead.', code: submitted.status === 429 ? 'busy' : 'unreadable', retryable: true }, { status: 502 });
    const initial = await submitted.json() as DatalabResponse;
    if (!initial.request_check_url) return Response.json({ error: 'We couldn’t read this file. Please try again, or read it on this device instead.', code: 'unreadable', retryable: true }, { status: 502 });

    const checkUrl = new URL(initial.request_check_url);
    if (checkUrl.protocol !== 'https:' || checkUrl.hostname !== 'www.datalab.to') {
      return Response.json({ error: 'We couldn’t read this file. Please try again, or read it on this device instead.', code: 'unreadable', retryable: true }, { status: 502 });
    }

    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const checked = await fetchWithTimeout(checkUrl.toString(), { headers: { 'X-API-Key': apiKey } });
      if (!checked.ok) return Response.json({ error: 'Reading is taking longer than expected. Please try again, or read it on this device instead.', code: 'slow', retryable: true }, { status: 502 });
      const result = await checked.json() as DatalabResponse;
      if (result.status === 'complete') {
        if (typeof result.markdown !== 'string' || result.markdown.length === 0) return Response.json({ error: 'We couldn’t find any text in this file. Try a sharper photo or a text-based PDF.', code: 'no_text', retryable: false }, { status: 502 });
        return Response.json({ text: result.markdown });
      }
      if (result.status === 'failed' || result.status === 'error') return Response.json({ error: 'We couldn’t read this file. Try a sharper photo or a text-based PDF, or read it on this device instead.', code: 'failed', retryable: false }, { status: 502 });
    }

    return Response.json({ error: 'Reading is taking too long. Please try again, or read it on this device instead.', code: 'slow', retryable: true }, { status: 504 });
  } catch (error) {
    console.error('Datalab OCR request failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Reading didn’t finish. Please try again, or read it on this device instead.', code: 'incomplete', retryable: true }, { status: 502 });
  }
}
