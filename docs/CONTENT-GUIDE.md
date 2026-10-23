# Adding your course material

Keep IDs stable after students have started learning; progress, bookmarks, and attempts use those IDs. `js/data.js` defines the catalog and assessment banks. The supplied full course material is packaged separately in `js/learning-sources.js` and installed by `js/learning-content.js`.

## Preserve supplied material

Import the complete source wording. Do not shorten, summarize, rewrite, or silently omit paragraphs, worked examples, tables, questions, answers, classroom tasks, or assignment briefs. Reorganizing source passages into existing topics and changing their presentation is allowed. Preserve the original files alongside the imported text so students can download them.

Current imports:

| Course | Source | Presentation |
| --- | --- | --- |
| PEA 101, Unit I | `resources/PSCT-Unit-1-source-text.txt` | Six existing topics, all 42,779 source characters, including original practice material |
| PEA 103 | `resources/PEA103-AI-Interaction-Design.pdf` and its `-source-text.txt` extraction | The Complete AI Ecosystem: eight sections, all 43,293 extracted characters and all 50 original page previews |

The original PEA 101 PDF is not in this project; its existing extracted text is the preservation reference. PEA 103 keeps the original PDF, the UTF-8 extraction, and `resources/pea103-pages/page-01.png` through `page-50.png`. Its diagrams and tables appear as original page images, with expandable complete page text for reading and searching. Images load lazily. Neither text extraction nor PDF rendering runs in the student's browser.

The reading companion replaces personal note entry with source search and highlights, larger text, reading spotlight, section navigation, and offline downloads. Existing saved profile notes are retained in storage; adding source content must not erase student progress, attempts, bookmarks, or notes.

## Import and rebuild full-source lessons

1. Save the original file under `resources/`. Extract PDF text explicitly as UTF-8, for example with `pdftotext -enc UTF-8 -layout input.pdf output-source-text.txt`. Check the extraction against original pages, especially tables and symbols.
2. Update `resources/build-learning-content.py` to partition the complete text into stable topic IDs. Segment the source using slices so concatenating all topics reproduces the exact input, including whitespace. Keep every source page; do not substitute a summary for a missing extraction.
3. If page previews are used, render every original PDF page into `resources/pea103-pages/` (the current previews are 1440 × 810 PNGs). Keep source and preview paths consistent with `topicHTML()` in `js/learning-content.js`. A replacement PDF with different dimensions needs matching preview dimensions.
4. Run `python resources/build-learning-content.py` from the `campus-compass` directory, or invoke the script by its absolute path. It uses only the Python standard library and writes `js/learning-sources.js`. Do not edit the generated bundle directly.
5. Update `install()` in `js/learning-content.js` when adding another course or unit. Load `data.js`, then `learning-sources.js`, then `learning-content.js`, and call `UniPulseLearning.install(CAMPUS_DATA)` before rendering lessons. All course text is bundled so learning works from `file://` without a fetch request.
6. Run `node tests/learning.test.cjs`. The test resolves paths from its own directory, checks each source against the imported and rendered text character for character, and checks the PDF page assets. Register any newly imported source files and deliberately update the expected page/topic counts when the source changes.

`UniPulseLearning.records` exposes the original `sourceText`, ordered topic `sections`, and download URL. `hasSource(subjectId, topicId)` selects the source renderer; `topicHTML()` and `companionHTML()` return the reading view and its controls. The renderer escapes source text as text, including anything resembling HTML.

## Subjects and semesters

Each subject has a unique `id`, a `code`, `semester`, `name`, `short` description, `icon`, `color`, and `units` array. A subject's semester is an integer from 1 to 8. Duplicate a subject object with a new ID to add an earlier semester course.

Available colors: mint, lavender, peach, blue, yellow, pink.
Available course icons: brain, math, spark, code, layers, trophy, book.

The catalog always filters by the selected semester. The current semester belongs to each profile. Upcoming semesters are disabled in the UI, and direct subject routes check that the semester is accessible.

## Units and topics

Each unit has:

```js
{
  id: 'u2',
  title: 'Logical Reasoning and Evidence',
  available: false,
  topics: [],
  questions: []
}
```

Turn `available` on only after the real lesson content is ready. Assessed units also need their question bank. A unit with complete source readings but no supplied assessment should use `readingOnly: true` and `questions: []`; do not invent questions to unlock the lessons. PEA 103's `ai-u1` unit uses this mode.

For a conventional lesson, every topic needs the structure below. Full-source topics use `sections: []` here because `learning-content.js` renders their complete source passages instead:

```js
{
  id: 'unique-topic-id',
  title: 'Topic title',
  minutes: 6,
  sections: [
    ['Subheading', 'First paragraph.', 'Optional second paragraph.'],
    ['Another subheading', 'Another paragraph.']
  ],
  example: { title: 'Worked example', text: 'The explanation.' },
  task: 'A practice task from the supplied material.'
}
```

Use plain text, not HTML. Text is escaped during rendering. Use JavaScript string escaping or JSON-style double quotes when your content includes quotes.

## Questions

For an assessed unit, add at least five questions based on supplied material; a larger bank gives more variety. Reading-only units do not need a question bank. Each question needs a globally unique ID across the subject:

```js
{
  id: 'pea101-u2-q1',
  topic: 'unique-topic-id',
  prompt: 'Question text?',
  options: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
  answer: 1,
  explanation: 'Why Choice B is correct, based on the material.'
}
```

`answer` is a zero-based option index: 0 = A, 1 = B, 2 = C, 3 = D.

Question order is randomized and the selection favors distinct topic groups. Options keep their order so “all of the above” remains valid. IDs must be unique because saved answers use question IDs as keys. A grand test samples five questions from every unit and shuffles the combined selection.

## Progress and assessment rules

- For assessed units, each topic is one progress step; passing the unit quiz is one additional step. Unit progress = completed steps / (number of topics + 1).
- For `readingOnly: true` units, progress = completed topics / number of topics. Completing every topic completes the unit; no quiz is displayed or required.
- Subject progress = the average of its units' progress percentages.
- Study progress can reach 100% before the grand test; grand-test performance is recorded separately.
- Passing a later retry never removes an earlier passed status.
- Every preceding assessed unit must be passed before the next unit can be studied. A preceding reading-only unit must have all its topics complete.
- A grand test is offered only when every unit has an available assessment bank of at least five questions and its unit test has been passed. A reading-only course does not get a fabricated grand test.
- Quiz pass mark is 80%; unit quizzes last 5 minutes; grand tests last 20 minutes.
- Failed attempts are saved and can be reviewed. Retrying draws a new selection; some questions may repeat between attempts.
- The timer is based on an absolute timestamp. Leaving the page does not extend it. Expired saved attempts are finalized on the next interaction/open if the page was inactive.

These defaults are implemented in `js/core.js`. Keep the UI descriptions and README consistent if you change them.

## Announcements and official grades

The catalog's `announcements` array holds workspace notices. Faculty tools support local drafts and published notes, content, assignments, tests, and notifications, with file attachments stored in IndexedDB. Published resources are shared between eligible profiles in the same browser. Faculty views can inspect local students' learning progress and reports; sample students and marks are explicitly illustrative.

These local profiles and publications are a demonstration, not authenticated university accounts or official grades. Campus-wide uploads, private course membership, authoritative grading, and sharing between devices require a backend with authorization. Preserve the local/source distinction when adding content so demonstration notices are not mistaken for real faculty announcements.
