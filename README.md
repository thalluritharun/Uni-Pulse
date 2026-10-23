# Uni Pulse

A small HTML, CSS, and JavaScript student and faculty workspace. It runs without a build step or external services. Indigo and mint colours, bundled DM Sans and Plus Jakarta Sans fonts, dark mode, responsive layouts, and reduced-motion support are included.

## Run locally

Keep the project files together. From the `campus-compass` folder, run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`, then choose **Explore student demo** or switch to **Faculty** and explore its demo. You can also create separate local practice profiles. Stop the server with Ctrl+C.

The site can be opened from `index.html`, but localhost is recommended for consistent storage and password hashing. No internet connection, API key, package installation, or Node.js is needed to use it. Use the same address and port each time: each origin has separate browser storage.

## Learning and focus

- **PEA 101:** the full available Unit 1 source text is arranged across its existing six lessons, including its original examples, questions, and activities. The old shortened lesson copy is no longer shown. The original PEA 101 PDF is unavailable in this project; the preserved extracted text is the source of truth here.
- **PEA 103 - AI Interaction Design:** all 50 pages of the supplied PDF are organised into eight reading topics. Original page images preserve diagrams and layout; expandable transcripts provide the extracted text. Download the original PDF or enlarge individual pages.
- **Reading companion:** search and highlight words in the current lesson, jump to sections, enlarge text, use a reading spotlight, and download the source. This replaces the lesson's **Add your notes** area. Existing saved notes and bookmarks remain available in Saved lessons.
- **Progress and quizzes:** PEA 101 retains its 30-question Unit 1 bank, five-question attempts, five-minute timer, 80% pass requirement, and answer review. Quiz answers and absolute deadlines survive refresh. PEA 103 is a reading collection: completing its eight topics reaches 100% without an invented quiz.
- **Focus studio:** choose 25-minute focus, five-minute short break, or 15-minute long break; set a custom duration of 1-120 minutes and a task intention. Start, pause, resume, reset, and optionally play a completion sound. The timer, task, preferences, and latest 100 completed sessions belong to the local profile. Today/week totals and recent history are shown. Refresh or sign-out does not reset a saved deadline; completion is reconciled when the profile is reopened. Sound requires an open tab, and focus sessions do not award lesson completion.

PEA 101 Units 2-5 retain their syllabus outlines; their full learning material and question banks are still pending. PEA 102, 104, 105, and 106 also await supplied content. The grand test remains unavailable until every required unit has material and has been passed. The six catalogue subjects currently belong to Semester 1; change their `semester` fields in `js/data.js` when the actual course allocation is available.

## Schedule, reports, and notifications

The calendar includes clearly labelled sample guest lectures, assignment deadlines, and this requested CLA 2 sequence:

| Date in 2026 | Papers |
| --- | --- |
| Thursday, 29 October | 2 subjects |
| Saturday, 31 October | 1 subject |
| Tuesday, 3 November | 2 subjects |
| Wednesday, 4 November | 1 subject |

Subject order, start times, guest sessions, and assignment details are placeholders. Students can add, edit, complete, and delete their own events. Faculty-published assignment/test dates also appear in their schedule. Calendar export includes one-hour event durations and 30-minute reminders for calendar apps that support them.

Report cards offer **Explore sample marks** and **My records**. For a Semester 2 profile, sample CLA and assignment marks appear in Semester 2, and previous final results with GPA appear in Semester 1. Samples never become personal results, actual student profiles, or personal calendar entries. They reuse catalogue subject names for demonstration, rather than defining an official semester curriculum.

Personal report entries support assignment/test scores and end-semester grade points with credits. GPA is credit-weighted: `sum(points x credits) / sum(credits)`. Assignment and quiz marks do not affect GPA. Values remain partial until all applicable final results are entered. CSV export and print layouts are included; these records are not official transcripts.

The notification feed combines sample campus updates and faculty-published notices, with read/unread controls. Notifications are shown inside the open website; there are no push or email notifications while it is closed.

## Faculty workspace

Faculty can create notes, slides, learning content, assignments, tests, and notifications. Posts support a subject, full text, optional due date, and attachment. Save a private draft, publish it, edit it, or delete it. Published resources appear in eligible local students' learning libraries; students can read full content and download the original attachment. Drafts remain hidden from students.

Attachments accept PDF, PPT, PPTX, TXT, DOC, and DOCX files up to 20 MB. File bytes are stored in IndexedDB, while publication metadata is saved with the local database. A student in an earlier semester cannot access a later-semester subject's post. These browser checks are demonstration behaviour, not server-enforced access control.

Faculty can inspect local student learning progress, quiz averages, and recorded results. Three explicitly fictional sample students also provide populated reports with current marks and previous final results. Their GPA is calculated from the displayed records; sample students are not written into the actual profile database.

**Sharing is limited to profiles using the same browser and origin. No backend is connected.** Publishing does not send content to other devices, browsers, or real campus accounts.

## Storage and account scope

Local profiles use salted PBKDF2 password verifiers. Use a practice password: people with access to browser storage can inspect or modify local profiles, roles, and data. There is no institutional authentication, password recovery, cross-device sync, shared server, or secure exam scoring. Quiz answers are delivered to the browser.

Profiles and metadata use localStorage; the selected session uses sessionStorage; uploaded files use IndexedDB. Clearing site data removes them. The legacy storage key is retained so existing profiles survive the Uni Pulse rebrand at the same address. Profile JSON exports exclude password verifiers and do not include shared publications or attachment bytes. Keep separate original copies of faculty files; there is no backup-import interface.

## File guide

| File or folder | Purpose |
| --- | --- |
| `index.html` | Application entry and local script/style loading |
| `js/app.js`, `js/core.js` | Navigation, accounts, local records, progress, quiz and GPA rules |
| `js/data.js` | Subject catalogue, outlines, and original question bank |
| `js/learning-sources.js`, `js/learning-content.js` | Preserved source records, reading layout, and companion controls |
| `js/focus.js` | Persistent timer, break modes, history, and completion sound |
| `js/faculty.js` | Publications, IndexedDB attachments, resource access, and student reports |
| `js/campus.js` | Separate sample schedule, report rows, and notifications |
| `css/` | Base styles and separate fonts, focus, faculty, learning, and campus styles |
| `assets/` | Pulse brand mark and locally bundled font files/licences |
| `resources/PSCT-Unit-1-source-text.txt` | Available full PEA 101 Unit 1 extracted text |
| `resources/PEA103-AI-Interaction-Design.pdf` | Original 50-page PEA 103 PDF |
| `resources/PEA103-AI-Interaction-Design-source-text.txt`, `resources/pea103-pages/` | Extracted PEA 103 text and original page renders |
| `resources/build-learning-content.py` | Regenerates structured source records from the local sources |
| `tests/`, `docs/VERIFICATION.md` | Automated checks and current verification record |

## Run checks

With Node.js available, run from the project folder:

```sh
node tests/core.test.cjs
node tests/focus.test.cjs
node tests/learning.test.cjs
```

The application itself does not require Node.js. The 34 core checks, six focus checks, source-fidelity suite, 27 Chrome integration checks, and 13 additional mobile learning checks pass. See `docs/VERIFICATION.md` for coverage and practical limits.

To move beyond this local edition, connect authenticated student/faculty roles, shared database records and file storage, and server-enforced ownership and enrolment rules. Confirm real course allocations, timetable details, and grading policies before using institutional data.
