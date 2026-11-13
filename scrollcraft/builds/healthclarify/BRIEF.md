# HealthClarify scroll page: BRIEF

**Self-authored under explicit creative delegation.** The user answered three of
the interview questions and said "rest use your judgement". Their words are
quoted verbatim; everything else is an authored decision, labelled as such.

## The eight topics

1. **Vibe.** User: "healthcare app". Authored: calm, literate, unhurried. A
   clinic waiting room with the good lamp on, not a hospital corridor. No
   references named, so none invented. (The product's own look is warm paper,
   deep teal, a little turmeric. Those are the brand's colours and stay.)
2. **Scroll journey.** User: "uploads when needed then next page then scroll".
   Read as: the visitor hits an upload step first, which cuts to the next
   chapter, and from there the page is scrolled. Authored sequence in the score
   below.
3. **Energy curve.** Authored: low, lower, rising, one release, steady, quiet.
   Health pages that shout read as alarm. The loudest thing here is a number
   settling onto a ruler.
4. **Feeling and the one moment.** Authored, see the feeling curve and the peak.
5. **What no site does.** Authored: the printed line of a lab report physically
   becomes its own range ruler (signature move below).
6. **Range from premium-minimal.** Authored: **dense / working surface**, with
   the product's own warmth. App chrome, small honest type, real data. Not
   premium-minimal, not editorial.
7. **One world or distinct scenes.** User: "its separate chapters and cuts".
   Distinct scenes, hard cuts, each on its own ground. No continuous world.
8. **Assets.** User: "website ui". The assets are the product's real UI and real
   data: `data/reports.json` (fictional sample report, 15 results), the app's
   brand tokens (`app/theme.css`) and its wording (`lib/i18n/en.ts`). No
   photography, no footage, no generation, no kie.ai spend.

Product facts used (from README and the app, not invented): educational only, no
diagnosis, no classification beyond the printed range, no treatment advice;
separate consent before sending the file to Datalab and before sending result
lines to Groq; nothing stored server-side; English, Hindi, Marathi; India
emergency number 112. Accuracy numbers are **not** used on the page: the README
calls its pilot too small to claim anything.

## Journey (Step 1)

Authored. One sentence the page must install: **a lab report is a set of
positions on printed ranges, and you can understand it well enough to ask good
questions.** One action, one label everywhere: **Open the analyzer.**

1. Recognition: the report as it arrives, abbreviations and units, no sentences
2. Safety: what leaves your browser, and only if you say so
3. Method: how the numbers are found, and that none of it is interpretation
4. Understanding: every number placed on its own printed range, in plain words
5. Agency: check a value yourself, collect the questions that follow from it
6. Commitment: set your language, then start for real

## Grammar (Step 2)

**Live surface.** The page behaves like the product: real markup running real
logic (a candidate-line filter, range geometry, consent logic, an editable
value that re-computes everything downstream) on the product's own sample data,
labelled as sample on its face.

Why the other seven lost:

- *Filmic one-shot*: needs footage; a health product with generated cinematic
  footage reads as marketing for something that should read as a tool. Burden
  of proof not met.
- *Chaptered editorial*: matches "chapters and cuts", but its close is a
  colophon and its hero has no surface; the user's upload step and "website ui"
  asset need an operable surface.
- *Continuous world*: forbids cuts; user asked for cuts.
- *Typographic poster*: numbers and units must stay small and exact; scale
  contrast is the wrong instrument.
- *Gallery / catalog*: the visitor's question is not "what are the options".
- *Split stage*: closest rival (report vs plain words). Lost because the
  comparison is a transformation over time, not a two-sided argument.
- *Rhythmic cutlist*: energy-brand grammar; wrong register for anxious readers.

Chapters are **hard cuts of the surface** between app states, each on its own
ground, so "separate chapters and cuts" is honoured inside the grammar.

## Feeling curve (written before the score)

| # | Chapter | Feeling | What on screen causes it |
|---|---|---|---|
| 1 | Upload | **Unease, then recognition** | the report as printed, dense and unreadable, behind a plain drop zone; a loupe hovering over one line |
| 2 | Consent | **Trust** | slow, calm, two real switches; a live list of what leaves the browser, which starts at "nothing" |
| 3 | Reading | **Tension** | dark room, report pages crossing a scan line, a tally of lines kept against lines ignored |
| 4 | Plain words | **Relief** (peak) | lights up: each raw line resolves into a ruler, a dot, a sentence |
| 5 | Check & ask | **Agency** | the visitor edits a value and everything re-computes; the question list is theirs |
| 6 | Start | **Readiness** | quiet, small type, one switch and one button, on the page's darkest ground |

Peak is defined by contrast: the dark, tight, quiet reading room (3) gives way to
a bright daylight surface (4).

## The peak

> I scrolled and my lab report turned from a wall of abbreviations into a row of
> dots on rulers, and each one had a sentence.

Lives in **chapter 4**. It gets the largest span on the page (3.2vh after the length cut; was 5.4vh), the best
visual budget, and the silence before it.

## Authored silence

End of chapter 3: the last rail panel is nearly empty. One dim line on the dark
ground: "Fifteen lines kept. None interpreted." No other copy, no motion. This is
authored anticipation, not dead scroll.

## Tell-someone sentence

> It's the site where the printed line of a lab report slides onto a ruler as
> you scroll, and the number finally sits somewhere you can see.

## Signature move

**The line becomes the ruler.** Each result is first a raw OCR-style line
(`HAEMOGLOBIN (Hb)   11.2 g/dL   13.5 - 17.5`). Its three real tokens, the value,
the lower bound and the upper bound, physically travel from their place in the
text run to their place on a ruler under a sweeping focus band as the visitor
scrolls. The dot lands where the geometry says it does, computed from the
numbers. Page-local code (FLIP over measured token positions), engine untouched.

Secondary seasoning (only the one that serves the peak): pointer-driven depth on
the hero's layers on fine pointers. Nothing else reacts to the pointer.

## Score

| Beat | Device | Why |
|---|---|---|
| 1 Upload | layered parallax hero (page-local) + real drop zone | the product's first screen, with depth: far wash, back sheets, report, upload card, loupe |
| 2 Consent | `flow` + `in` | calm; no motion except arrival |
| 3 Reading | `pan` (+ page-local scan line) | lateral travel reads as reading across |
| 4 Plain words | `pin` + page-local FLIP | the frame holds while the report resolves |
| 5 Check & ask | `reveal` + live inputs | a wipe is a change of state; the inputs are agency |
| 6 Start | `flow` with a real form | an input, not a button island |

Five device families, none repeated in adjacent acts. Zero `scrub`. Total length
about 8.6 viewport-heights across 6 acts (first built at 12.4, cut at the user's request: scroll was too long), so it sits outside the 6-7 acts at
13.6-13.8vh band. Grounds hard-cut; no `drift`.

## Fingerprint gate

The registry was empty when this plan was made (first build), so there is no row
to differ from. Row appended after shipping.

## Honesty rules held on the page

- Sample data is labelled "Sample report. Fictional values." wherever data shows.
- Range wording is the app's: "Outside the printed range" / "Within the printed
  range". No "high", "low", "abnormal", "normal", no colour-coded alarm.
- "Outside the printed range" is never presented as urgent.
- No statistic about accuracy, users, speed or reviews.
- Nothing is uploaded by this page. The drop zone checks type and size locally.
- Emergency line (112) present in the final chapter.
- No em dashes, no section counters, no scroll cue, no eyebrow per section.
