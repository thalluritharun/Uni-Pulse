# Uni Pulse verification

Verification record for the integrated learning, focus, campus, and faculty update, 23 October 2026.

## Automated checks completed

From the `campus-compass` folder:

```sh
node tests/core.test.cjs
node tests/focus.test.cjs
node tests/learning.test.cjs
```

**34 core/integration checks passed.** Coverage includes:

- Catalogue and question-bank integrity, independent student profiles, sequential unit locks, random topic coverage, quiz scoring, and grand-test eligibility.
- Credit-weighted GPA, zero grade points, excluded assignment marks, streaks, and week boundaries.
- Main routes and lessons, escaped names, direct-route semester guards, and malformed-storage handling.
- Lesson completion, quiz persistence without deadline extensions, answer review, and expiry on reopening.
- Personal event/result saves, isolation between profiles, invalid marks, duplicate final results, and preservation/escaping of existing saved notes.
- Dedicated faculty routes and fictional sample reports with current marks and previous final results.
- Faculty draft saving, exact body retention, student draft privacy, and safe display of published content.
- Separation of sample marks from personal records, previous-semester GPA, and the My records toggle.
- Reading-only PEA 103 completion reaching 100% without a quiz.
- Salted local password verifiers, rejection of incorrect passwords, and successful local sign-in.

The rendering/event harness loads all current application modules and supports multiple event listeners. It reproduces hidden inputs named `id` shadowing a form's `id` property. Event, result, and faculty-post forms use the ID attribute explicitly, preventing that browser-specific submit failure.

**6 focus checks passed.** Controlled-clock coverage includes custom duration/task settings, pause/resume, exact deadline completion, restoration after refresh, retained history, break selection, prevention of accidental mode changes during a session, and isolation across logout/profile switching. Timer completion does not mark learning topics complete.

**Learning source checks passed.** For both PEA 101 and PEA 103, every source character survives topic segmentation and HTML rendering. Checks also confirm source-download files, all 50 valid PNG page previews, the six existing PEA 101 topic IDs and question bank, and the eight PEA 103 reading topics with no invented assessment.

These suites use Node.js built-ins, synthetic profiles, and small browser-API stubs. They do not replace real-browser checks for layout, file storage/downloads, or audio output.

## Real-browser integration checks completed

**27 checks passed in Chrome with Playwright**, at desktop width 1440px and mobile width 390px. No JavaScript page exceptions were recorded. Results are saved in the workspace's [workspace-results.json](../../.qa/workspace-results.json); the temporary browser runner is [workspace-check.cjs](../../.qa/workspace-check.cjs). These QA files are outside the distributable `campus-compass` application folder.

The browser run covered:

- A single welcome heading; short-break selection; timer pause, restoration after refresh, and completed-session history.
- Replacement of the notes textarea with the source companion, exact original-text rendering, lesson search/highlights, and eight PEA 103 sections.
- All six CLA 2 events, current sample CLA/assignment marks, previous-semester final GPA, isolation from personal results, and notification read state.
- Faculty notes, assignments, notifications, private drafts, populated sample student reports, and student access to published material only.
- Actual attachment upload and download, with downloaded bytes compared against the original fixture; full faculty body-text preservation.
- Faculty assignment dates appearing in the student schedule and faculty notifications appearing in the student feed.
- Mobile home, report, schedule, learning, and focus-dialog layouts fitting horizontally. Mobile overflow found during review was corrected in `css/campus.css`.

An additional **13 mobile learning checks passed** at widths 390px and 320px for both supplied subjects. They covered original page/transcript rendering, source tables, larger text, reading spotlight, and dark mode, with visual review and no JavaScript exceptions. Results are in [learning-mobile-results.json](../../.qa/learning-mobile-results.json).

Optional completion sound is implemented, but audible playback was not independently confirmed by these automated browser checks. Cross-browser/platform behaviour remains outside these Chrome runs.

## Source and data boundaries

PEA 101 renders its full available extracted source text across the existing six lessons; the original PDF is absent, so the site does not claim to reproduce its original page layout. PEA 103 includes the supplied 50-page PDF, original page renders, extracted transcripts, and eight reading topics. Remaining subjects/units with no supplied source remain pending.

Sample timetable events, notifications, semester results, and faculty student previews are explicitly labelled. They remain separate from personal events/results and actual local profiles. No institutional timetable, official grades, shared backend, or external publishing is implied.

Faculty attachment metadata is kept in the local database, and file bytes are kept in IndexedDB. Profile JSON exports are not a backup of these shared publications/files. Publishing and downloads operate only within the same browser and origin. No backend or cross-device deployment was tested or connected.

Use the local-server instructions in README for a stable browser origin. Test accounts and uploaded files should be disposable local fixtures.
