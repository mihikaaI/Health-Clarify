# HealthClarify

A responsive, educational laboratory-report explainer built with Next.js, TypeScript, Tailwind CSS, and accessible React components. The dashboard uses fictional demo data. The experimental `/analyze` flow performs OCR and, after separate consent, sends candidate lab-result lines to the Groq chat model configured for the project. It does not diagnose conditions, classify results, or recommend treatment.

## Run locally

1. Install Node.js 18 or newer.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev` and open `http://localhost:3000`.

In Windows PowerShell, use `npm.cmd` instead of `npm` if the execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

Use `npm run build` and `npm start` for a production build and server.

## Pages

- `/` — scroll-driven introduction (a static page in `public/scroll/`, published from `scrollcraft/builds/healthclarify/` with `node scrollcraft/sync-to-app.mjs`; `next.config.mjs` rewrites `/` to it). It has an English / हिन्दी / मराठी toggle that shares the app's `hc-lang` key. Its strings are built by `node scrollcraft/build-i18n.mjs`, which reuses the app's own `lib/i18n` wording where it exists; the page-specific Hindi and Marathi are drafts pending native-speaker review, and the page shows the app's draft notice when either is on. Run `build-i18n.mjs` then `sync-to-app.mjs` after changing copy.
- `/classic` — the previous introduction, safety cards, and report preview
- `/dashboard` — combined demo, CBC, Lipid Profile, and Thyroid panels
- `/analyze` — experimental OCR and consent-gated text extraction for images and PDFs
- `/safety` — scope and safe-use information
- `/accessibility` — accessibility features and Senior mode

## Technical workflow

1. **Choose a file.** The browser accepts JPEG, PNG, WebP, or PDF files up to 10 MB. The PDF path supports up to 10 pages for local fallback OCR.
2. **Run primary OCR with Datalab.** After a dedicated consent, the browser posts the original file to `/api/ocr/datalab`. The server sends it to Datalab in accurate mode, polls the returned status URL, and returns Markdown OCR text. The app does not save the original report or OCR text to a database.
3. **Use local OCR as a fallback.** If Datalab fails, Tesseract.js runs in the browser. PDF.js renders PDF pages for local OCR. The OCR text can be reviewed and edited before extraction.
4. **Select likely result lines with regex.** `findCandidateLines` splits OCR output into numbered lines and selects lines containing supported lab names or a number with a measurement unit. It is a broad candidate filter, not a parser or clinical rules engine. It keeps at most 150 lines.
5. **Send candidates to Groq after separate consent.** The browser sends only the selected candidate lines to `/api/extract`; the original report is not sent to Groq. The server uses `GROQ_API_KEY` and `GROQ_MODEL` (`qwen/qwen3.8-27b`) with Groq's OpenAI-compatible Chat Completions endpoint and a strict JSON schema. Groq lists this model as supporting strict JSON-schema output. The prompt limits extraction to CBC, lipid, and thyroid results and asks the model to copy visible text rather than infer or interpret it.
6. **Check output and review it manually.** The server maps each extracted row back to its OCR source line. Missing or ungrounded fields and uncertain panels are marked `needsVerification`; this flag is not an accuracy score or model confidence estimate. The user must compare every field against the original report. Results can be downloaded as JSON.

The API keys stay on the server in `.env.local`; do not expose them in client code or commit that file. To configure the app, copy `.env.example` to `.env.local` and add `DATALAB_API_KEY` and `GROQ_API_KEY`. The configured model is `GROQ_MODEL=qwen/qwen3.8-27b`.

## Accuracy status

**Preliminary accuracy check:** Datalab returned OCR text for all four supplied sample images. Groq completed extraction for two before rate limiting (HTTP 429) blocked the other two. On the two completed reports, the model matched all 13 manually checked analyte/value pairs: **100% recall**, with 13 correct pairs among 14 returned rows (**92.9% precision; 96.3% F1**). This score covers analyte and value only; it does not score units, reference intervals, or the two rate-limited reports. OCR character accuracy was not measured. Treat this as a small, partial pilot—not a general accuracy guarantee. See [Groq Qwen 3.8 documentation](https://console.groq.com/docs/model/qwen/qwen3.8-27b) and [structured outputs](https://console.groq.com/docs/structured-outputs).

JSON-schema output ensures the response has the requested shape; it does not ensure that the extracted values are correct. A useful benchmark needs manually verified ground-truth rows and should report exact analyte/value precision, recall, and F1, plus OCR candidate recall, on a larger set of representative reports. A score from the four current sample images alone would be a small-sample result, not a general accuracy guarantee.

## Demo data and safety

The local sample data is in `data/reports.json`. It preserves fictional source labels, units, and reference text. A two-sided, upper-only (`<`) or lower-only (`>`) interval is rendered as provided. Result status is explicitly assigned in the demo fixture; incomplete data should use `needs_verification`. An outside-range result is not an urgent alert, and no urgent markers are inferred.

Use synthetic or de-identified reports when choosing Datalab OCR. Datalab's free tier has a monthly allowance and does not include a BAA/DPA; usage beyond the allowance can be billed if billing is enabled. Provider data policies apply when report files or candidate text are sent to those services.

The extraction feature is experimental and not clinically reviewed. It does not classify values against reference intervals, create urgent alerts, interpret health meaning, or provide medical advice. Do not use it as the basis for care or upload identifiable reports in this demo. Patient-facing examples remain demo-only pending qualified clinical review. Do not add real-report processing, retention, alerts, or clinical claims without the appropriate clinical, legal, and privacy review.
