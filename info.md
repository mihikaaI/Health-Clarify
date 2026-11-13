HealthClarify Website Product and UI Blueprint

1. Product in one sentence

HealthClarify is an educational website that turns a patient’s laboratory report into a readable, accessible dashboard - helping the patient understand the reported numbers and test names before speaking with a doctor, without diagnosing a condition or suggesting treatment.

2. The problem it solves

Laboratory reports are designed chiefly for clinical use. A patient may see abbreviations, values and reference intervals without context, then search individual values online and become unnecessarily worried.

HealthClarify gives the patient a calmer first view:

1. Upload a report or open a demo report.
2. Confirm the extracted values and the laboratory’s own reference ranges.
3. See each result in a simple card and range visual.
4. Read a short, educational explanation of what the test measures.
5. Take the report to a qualified doctor for interpretation, diagnosis and treatment.

3. The core promise and safety boundary

What the website does

• Extracts test name, value, unit and reference interval from a report.
• Shows whether a value is within or outside the reference interval printed by that laboratory.
• Explains what a test generally measures in plain language.
• Makes it easier to prepare questions for a clinician.
• Supports larger text, high contrast and screen-reader-friendly navigation.

What the website must never do

• Diagnose a disease or state that the user has a condition.
• Recommend medicine, dosage, diet plans, supplements or treatment.
• Change or invent a laboratory reference interval.
• Infer a result when the unit, value, demographic qualifier or range is unclear.
• Claim that a result is clinically “critical” unless that alert comes from the laboratory report itself and has been reviewed by an appropriate clinician.
• Replace urgent medical care. The interface must direct a person to emergency services or a doctor when the laboratory report itself carries an urgent or critical instruction.

Recommended language

Use: “Outside this laboratory’s reference range”, “Please discuss this result with your doctor”, “We could not verify this item from the uploaded report.”

Avoid: “You have…”, “This confirms…”, “You are healthy”, “Take…”, “This is dangerous.”

4. MVP scope - build this first

The first public demonstration should use sample data only. It should look complete and feel interactive, but it should not process real medical reports yet.

|Included in version 1                           |Deferred until later                            |
|------------------------------------------------|------------------------------------------------|
|Responsive website                              |Native mobile application                       |
|Demo CBC, lipid profile and thyroid report      |Full support for every lab panel                |
|Dashboard with visual result cards              |Live report OCR                                 |
|Deterministic comparison against supplied ranges|AI-generated personalised medical interpretation|
|Clinician-reviewed explanatory templates        |Account creation and long-term patient records  |
|Senior Mode and high contrast option            |Doctor portal and sharing                       |
|Downloadable sample summary view                |AWS production deployment                       |

This order lets the team demonstrate the useful product experience first and avoids the two riskiest early problems: OCR mistakes and handling real personal health information.

5. Primary users

Patient or family member

Needs to understand an unfamiliar report without becoming overwhelmed. They may use a phone, be older, have limited health literacy, or be helping a parent.

Doctor or reviewer

Needs confidence that the website does not diagnose, exaggerate a result or hide the original reported information.

Project evaluator

Needs to see a polished upload-to-dashboard story, clear responsible-AI design and a sensible route to real deployment.

6. User journey

Home
  -> choose “Try demo report” or “Upload report”
  -> report-processing screen
  -> confirmation of extracted values
  -> summary dashboard
  -> panel detail and explanations
  -> question checklist for doctor
  -> optional delete / start over

For the MVP, “Try demo report” should be the most prominent action. “Upload report” can remain visible but marked Coming soon - privacy-tested release until the extraction and protection workflow is ready.

7. Website structure

|Route                              |Purpose                                               |Main action       |
|-----------------------------------|------------------------------------------------------|------------------|
|`/`                                |Explains the service and safety boundary              |Try a demo report |
|`/demo`                            |Lets a user select a sample report                    |Open dashboard    |
|`/results/:reportId`               |Summary of a report                                   |Review a panel    |
|`/results/:reportId/panel/:panelId`|Detailed panel view                                   |Read each result  |
|`/about-safety`                    |Explains limitations, privacy direction and validation|Return to home    |
|`/accessibility`                   |Explains Senior Mode and accessibility options        |Enable Senior Mode|

8. Screen-by-screen UI plan

A. Home page

Goal: Make the value and safety boundaries clear within a few seconds.

Layout:

1. Top bar: HealthClarify logo, “How it works”, “Safety”, “Accessibility”, Senior Mode toggle.
2. Hero message: “Understand your lab report before your doctor visit.”
3. Supporting line: “Clear explanations of reported values. No diagnosis. No prescriptions.”
4. Two buttons:
  • Primary: Try a demo report
  • Secondary: How it works
5. A visual preview of three result cards: Within range, Outside range, Needs verification.
6. Four short reassurance icons: Educational only, No diagnosis, Accessible design, You remain in control.
7. Footer: privacy, accessibility, contact, disclaimer.

Design choice: Do not show an alarming red dashboard in the hero. Use a calm neutral preview and let the user see sample results after they choose a demo.

B. Demo report chooser

Goal: Let evaluators quickly open an example without uploading a file.

Three cards:

• CBC sample - 12 results
• Lipid profile sample - 5 results
• Thyroid sample - 3 results

Each card shows a short description, number of items and Open demo button. Offer a fourth option, “Combined sample report”, for the final presentation.

C. Report review / confirmation screen

Goal: Make the source data visible before any dashboard statement is displayed.

Display a compact table:

|Test|Reported value|Unit|Lab reference range|Status|
|----|-------------:|----|-------------------|------|

If any data is missing, show it in an amber “Needs review” block and prevent a confident classification. For the future upload flow, allow the user to correct fields, but label the change as User-confirmed value - never silently overwrite the OCR result.

D. Results dashboard

Goal: Give a calm high-level overview first, then let the user inspect details.

Top area:

• “Your report summary”
• Report type, sample date and source label (e.g., “Demo report - not a medical record”)
• A status count: 8 within range, 3 outside range, 1 needs verification
• A persistent safety note: “This page explains your reported values. A doctor interprets them in your personal clinical context.”

Panel navigation:

• Overview
• Complete Blood Count
• Lipid Profile
• Thyroid Function

Results should be cards, not a wall of tables. Each card contains:

• Plain-language test name, with common abbreviation beneath it.
• Reported value and unit in large type.
• Laboratory reference interval.
• Status chip with both colour and text/icon.
• A horizontal position marker on a range bar.
• “What does this test measure?” accordion.
• “Questions you may discuss with your doctor” accordion.

E. Detailed result card

Example visual hierarchy:

Hemoglobin (Hb)                         Outside lab range
11.2 g/dL

Laboratory reference range: 13.5 - 17.5 g/dL
[------------------|---- normal interval ----|----------]

What does this measure?
Hemoglobin is a protein in red blood cells that carries oxygen around the body.

What next?
Results outside a reference range can have many causes. A qualified clinician can interpret this together with your symptoms, history and other tests.

The range marker must never be the only signal. The status chip, text and shape should communicate the result even without colour.

F. Doctor-visit question list

Goal: Turn anxiety into a constructive consultation.

Give users a neutral list they can copy or print:

• “Which findings in this report matter most for me?”
• “Do any results need a repeat test or follow-up?”
• “Can you explain how these results relate to my symptoms or medical history?”
• “Are there any report values that require prompt attention?”

Do not generate user-specific medical questions based on a result in version 1.

9. Accessibility and inclusive design

Senior Mode

Senior Mode should be a persistent, one-tap toggle. It changes the entire experience:

• Base text to at least 18 px, headings to 28-36 px.
• Larger cards and buttons with comfortable touch spacing.
• Increased contrast and less visual clutter.
• One-column layout even on tablets.
• Explanations shown by default rather than hidden in accordions.

Colour and visual system

Use the following status system:

|Status                                     |Colour family|Non-colour indicator  |Copy                                          |
|-------------------------------------------|-------------|----------------------|----------------------------------------------|
|Within lab range                           |Teal/green   |Check icon            |Within lab range                              |
|Outside lab range                          |Amber        |Triangle or alert icon|Outside lab range                             |
|Lab-marked urgent / clinician-reviewed only|Red          |Double alert icon     |Follow the laboratory or clinician instruction|
|Needs verification                         |Slate/blue   |Question mark icon    |Needs verification                            |

Never rely on red, yellow and green alone. Every status uses icon, wording and placement.

Other essential UI rules

• Use plain language and short sentences.
• Avoid acronyms without expansion.
• Support keyboard navigation and visible focus rings.
• Use semantic headings, labelled inputs and descriptive buttons.
• Do not auto-play audio.
• Make every chart understandable without seeing the chart.
• Offer text-to-speech later, after the core dashboard works.

10. Design system

Personality

Calm, respectful, clear and non-alarming. It should feel like a well-designed patient-information portal, not an emergency monitor or a fitness tracker.

Suggested visual direction

• Background: soft off-white or very pale blue-grey.
• Primary colour: deep teal or indigo for trust and clarity.
• Cards: white with a thin border, gentle corner radius and minimal shadow.
• Typography: Inter, Manrope or a similarly highly legible sans-serif.
• Icons: simple outline icons with consistent stroke weight.
• Charts: range bars and status chips before complex gauges.

Components to build once and reuse

• Header
• SafetyBanner
• ReportPanelTabs
• ResultCard
• RangeBar
• StatusChip
• ExplanationAccordion
• DoctorQuestionsCard
• SeniorModeToggle
• EmptyState
• Footer

11. Demo data design

Use non-identifying fictional data. Store it locally in the project as JSON.

{
  "reportId": "demo-combined-001",
  "source": "Demo report - fictional data",
  "panels": [
    {
      "id": "cbc",
      "name": "Complete Blood Count",
      "results": [
        {
          "reportedName": "Haemoglobin",
          "canonicalCode": "hemoglobin",
          "name": "Hemoglobin",
          "abbreviation": "Hb",
          "value": 11.2,
          "unit": "g/dL",
          "reference": {
            "display": "13.5 - 17.5",
            "lower": 13.5,
            "upper": 17.5,
            "source": "printed_on_report",
            "confirmed": true
          },
          "explanation": "Hemoglobin is a protein in red blood cells that carries oxygen around the body."
        }
      ]
    }
  ]
}

The status must be calculated by code, not stored manually. Start with only these outputs:

• within_range
• outside_range
• needs_verification

For version 1, do not attempt age-, sex-, pregnancy- or condition-specific range selection. Show the exact range provided in the demo record. In the future real-report flow, if required qualifiers are unavailable, return needs_verification.

12. Indian lab format handling and deterministic rules

12.1 Support strategy

Start narrowly. The first real-upload pilot supports only CBC, Lipid Profile and Thyroid Function Test reports from SRL, Thyrocare, Metropolis and Dr Lal PathLabs, one verified layout version at a time. It must not claim universal support for all reports issued by those laboratories.

Each supported layout gets a small lab adapter. The adapter reads the lab header and table layout, then returns the original row text plus structured fields. It does not make a medical decision.

|Field             |Store exactly as printed                |Normalised value used by the app                          |
|------------------|----------------------------------------|----------------------------------------------------------|
|Laboratory        |`Dr Lal PathLabs`, `SRL`, etc.          |`labVendor` and `layoutVersion`                           |
|Test name         |`Hb`, `Haemoglobin`, `TSH (3rd Gen)`    |`canonicalCode` for grouping only                         |
|Result            |raw value text, e.g. `11.2`, `210 H`    |numeric value only after validation                       |
|Unit              |e.g. `g/dL`, `mg/dL`, `µIU/mL`          |approved unit form, while retaining raw text              |
|Reference interval|e.g. `13.5 - 17.5`, `<150`, `0.4 to 4.0`|lower and/or upper bound plus display text                |
|Lab flag          |e.g. `H`, `L`, `Critical`, footnote     |source evidence only; not a replacement for the range rule|

LOINC-style codes may help reconcile aliases such as Hb, Hemoglobin and Haemoglobin. They must never provide, replace or override a laboratory’s reference interval.

12.2 Extraction and confirmation contract

For every uploaded row, retain these six fields: reportedName, reportedValueText, parsedValue, reportedUnit, reportedReferenceText and sourceImageLocation.

1. Read the reported value, unit and reference interval from the same table row.
2. Calculate a field-level confidence score; never treat an entire page as confidently extracted merely because one word is clear.
3. Present a confirmation screen showing the exact source text beside the structured result.
4. Classify a result only after the user confirms it or the extraction meets a clinician-approved high-confidence standard.
5. When multiple sex- or age-specific reference rows are printed, do not choose one automatically. Ask for a user-confirmed applicable row or return needs_verification.
6. If the format is unknown, or the table is ambiguous, stop and show: “We could not safely read this item. Please use the original report and discuss it with your clinician.”

12.3 Status definitions

The patient-facing status set remains deliberately small:

• within_range - the confirmed numeric value is within the confirmed laboratory reference interval.
• outside_range - the confirmed numeric value is below or above the confirmed laboratory reference interval.
• needs_verification - any input required for the comparison is unclear, unsupported or unconfirmed.
• lab_marked_urgent - an additional banner, shown only when the source report itself contains an explicit urgent instruction/critical marker or a separately approved, lab-specific rule applies. This is not inferred merely because the value is outside range.

For lab_marked_urgent, show only: “This report contains a laboratory urgent marker. Follow the instructions printed on the report and contact an appropriate clinical service.” Do not invent an emergency warning from a general out-of-range result.

12.4 Rule engine - simple, testable and auditable

IF parsed value is missing OR unit is missing OR reference interval is missing OR user confirmation is required
  THEN status = needs_verification
ELSE IF lower bound exists AND value < lower bound
  THEN status = outside_range
ELSE IF upper bound exists AND value > upper bound
  THEN status = outside_range
ELSE
  THEN status = within_range

IF source report carries an explicit urgent marker OR a separately approved lab-specific urgent rule matches
  THEN add lab_marked_urgent banner

The rule supports two-sided and one-sided ranges. For example, 13.5 - 17.5 has two bounds, while <150 has only an upper bound. A reference interval is always displayed exactly as printed on the report.

export type Range = {
  display: string;
  lower?: number;
  upper?: number;
  confirmed: boolean;
};

export type ResultStatus = "within_range" | "outside_range" | "needs_verification";

export function classifyResult(
  value: number | null,
  unit: string | null,
  range: Range | null,
): ResultStatus {
  if (
    value === null ||
    !unit ||
    !range?.confirmed ||
    (range.lower === undefined && range.upper === undefined)
  ) return "needs_verification";

  if (range.lower !== undefined && value < range.lower) return "outside_range";
  if (range.upper !== undefined && value > range.upper) return "outside_range";
  return "within_range";
}

Keep the rule output separate from the explanation text. The explanatory text must not alter, reinterpret or override the rule output.

13. Content policy for explanations

Each result needs clinician-reviewed template content with these three fields:

1. What it measures: neutral definition.
2. Why it may be reviewed: non-exhaustive, non-diagnostic context.
3. Safe next step: speak to a qualified clinician who can consider the complete picture.

Example template:

> Hemoglobin is a protein in red blood cells that carries oxygen around the body. Results outside a laboratory reference range can have different causes and need to be interpreted along with your health history and other results. A qualified clinician can explain what this means for you.

Before real users see any content, have an appropriate medical professional review the templates and record the template version, reviewer name, specialty, registration/affiliation, approval date, expiry or next-review date, and the exact wording approved. Until then, content is demo-only.

14. Privacy, security and trust requirements for the real-upload phase

These are implementation requirements, not optional visual features. The website-first MVP uses fictional data only: it has no real upload, account, patient record or database.

• Obtain a clear, specific consent step before a real report upload.
• Publish a documented retention schedule before the pilot: what is collected, purpose, location, retention period, deletion method, backups/logging treatment and user contact route.
• Encrypt data in transit and at rest.
• Apply least-privilege access; users should only access their own reports.
• Keep an audit trail for extraction, manual corrections, rules version and displayed content version.
• Offer deletion, communicate the effect of deletion, and avoid retaining an uploaded report longer than necessary for the stated purpose.
• Do not use real report content to train a model without explicit, valid governance and consent.
• Carry out a legal, privacy and medical-device/regulatory review before launching with real patient data or making clinical claims.

15. Recommended technology for the website-first MVP

|Layer     |Recommendation                           |Why                                  |
|----------|-----------------------------------------|-------------------------------------|
|Website   |Next.js with TypeScript                  |Fast, modern, easy to deploy         |
|Styling   |Tailwind CSS                             |Consistent responsive UI             |
|Components|shadcn/ui or custom accessible components|Good starting accessibility and speed|
|Charts    |Recharts or custom CSS range bars        |Simple readable visuals              |
|Demo state|Local JSON + React state                 |No database or patient data          |
|Deployment|Vercel / Netlify for the prototype       |Simple shareable demonstration       |
|Testing   |Vitest + Playwright later                |Rule and UI checks                   |

Do not connect to Amazon Textract, Bedrock, Cognito, S3 or DynamoDB in the first build. The demo needs to prove the user experience and safety design before adding cloud complexity and cost.

16. Later architecture - only after the MVP is approved

Browser
  -> authenticated upload
  -> secure file storage
  -> extraction service
  -> user confirmation of extracted data
  -> deterministic range comparison service
  -> approved educational content library
  -> results dashboard

If an LLM is introduced later, supply it only with structured, already-classified result data and require it to select or simplify approved educational content. Do not give it authority to determine status, urgency or treatment.

17. Build order

Sprint 1 - polished visual demo

1. Create the home page.
2. Build the combined demo report dashboard.
3. Add three sample panels.
4. Implement status chips and range bars.
5. Implement Senior Mode.
6. Add safety and accessibility pages.

Definition of done: A project evaluator can open the site, choose a demo, understand every visible result and see the clinical-safety boundary without explanation from the team.

Sprint 2 - robust prototype

1. Add report chooser and individual panel pages.
2. Add extracted-data review screen using simulated OCR output.
3. Write and test deterministic status rules.
4. Add doctor-question checklist and printable view.
5. Conduct a clinician content review.

Sprint 3 - real-upload feasibility proof

1. Use anonymised or synthetic Indian-format reports only.
2. Add one verified lab adapter and an explicit correction screen.
3. Measure extraction accuracy by field: laboratory, test name, value, unit, reference interval and lab flag.
4. Test two-sided, upper-only and lower-only reference intervals separately.
5. Never show an unconfirmed extracted item as a confident result.

18. Acceptance checklist for version 1

☐ The site works on mobile, tablet and desktop.
☐ Every screen states that HealthClarify is educational and not diagnostic.
☐ The user can open a demo report in two clicks or fewer.
☐ Every result shows value, unit and laboratory reference range.
☐ Every status is understandable without colour.
☐ The status is calculated using a small, testable rule function that supports two-sided and one-sided laboratory reference intervals.
☐ The original laboratory label, value, unit and reference interval remain visible after normalisation.
☐ LOINC-style mapping is used only for test-name grouping, never to choose a reference interval.
☐ An uncertain OCR row stays needs_verification and is not automatically classified.
☐ The site has no login, database, real-report upload or patient data.
☐ Senior Mode visibly changes font sizes, spacing and contrast.
☐ Explanations are neutral and do not diagnose or prescribe.
☐ An evaluator can clearly distinguish current functionality from planned features.

19. Copy-paste prompt for a vibe-coding builder

Build a responsive website called HealthClarify. It is an educational laboratory-report explainer, not a medical diagnosis or treatment app.