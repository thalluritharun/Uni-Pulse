# Uni Pulse 🎓

**A student and faculty workspace that brings learning, planning, focus, and academic progress together.**

Uni Pulse is a responsive web application designed to help students organise their academic lives and give faculty a workspace for preparing learning resources, assignments, tests, and announcements.

The frontend is built with **HTML, CSS, and vanilla JavaScript**, without a build step. Students enter immediately without registration or personal details. Faculty entry uses a small **Node.js authorization server** and administrator-approved accounts. Learning records, publications, and attachments still use local browser storage.

## Start Uni Pulse

From the folder containing `index.html`, run:

```sh
node server.cjs
```

Open **http://127.0.0.1:8000**. Choose **Enter as a student** for immediate access, or **Enter as a faculty** to authorize an approved faculty account. No npm installation is required.

To explore without a faculty account, choose **Enter as a faculty → Explore faculty demo**. The demo includes fictional students, sample posts, and practice publishing with attachments. Demo changes reset on exit or refresh and never overwrite the normal workspace. The demo also works on static hosting.

Student access works on static hosting too. Faculty authorization requires the Node server and will not work on GitHub Pages or VS Code Live Server alone.

Faculty accounts must be provisioned by an institution administrator after checking approval:

```sh
node scripts/approve-faculty.cjs
```

No faculty accounts or passwords are included. Institutional SSO is not connected. See [Faculty access and setup](docs/FACULTY-ACCESS.md) for approval, revocation, and deployment limits.

## Project Goal

Students often manage learning materials, deadlines, study sessions, and results across several disconnected tools. Uni Pulse brings these activities into one interface.

For students, the goal is to make it easier to:

- Find and read subject materials.
- Track learning progress and practise with quizzes.
- Plan assignments, tests, and personal study activities.
- Build consistent study habits with a focus timer.
- Record marks and understand academic performance.

For faculty, the goal is to provide a workspace to:

- Prepare and organise academic resources.
- Create assignments, tests, and announcements.
- Publish materials for eligible local student profiles.
- Review learning progress and recorded academic results.

## Features

### Student Learning Workspace

- A subject catalogue with semester-based organisation.
- Lesson reading with progress tracking.
- Search and highlighting within the current lesson.
- Adjustable text size, a reading spotlight, and section navigation.
- Access to saved notes and bookmarks.
- Downloads for available source materials.

The current content includes PEA 101 Unit 1 lessons and quizzes, along with a PEA 103 AI Interaction Design reading collection. Other subjects and units include outlines or await additional learning material.

### Quizzes and Progress

- Chapter quizzes for all six existing PEA 101 Unit 1 chapters, using the unchanged question bank. Each quiz selects up to five questions from that chapter; the decomposition chapter has four.
- Separate chapter attempt history, answer explanations, retry, and saved timers. Passing chapter practice does not pass the unit quiz or unlock the next unit.
- Five-question practice attempts for the available PEA 101 Unit 1 question bank.
- A five-minute timer and an 80% passing requirement.
- Answer review after an attempt.
- Saved answers and deadlines that survive a page refresh.
- Reading completion tracking for PEA 103.

Quiz availability follows the supplied content. Subjects without question banks do not display invented assessments.

### Original Course Handbooks

Each subject now links to its original handbook in the supplied Google Drive folder. These links open Drive's reader. The owner currently restricts PDF downloads to owners and editors, so these six files have not been bundled, summarized, or converted into new question banks. Existing PEA 101 and PEA 103 lesson content and source downloads remain unchanged. See [handbook import status](docs/HANDBOOK-IMPORT.md).

### Focus Studio

- Preset focus, short-break, and long-break timers.
- Custom sessions from 1 to 120 minutes.
- A task intention for each session.
- Start, pause, resume, and reset controls.
- Optional completion sound.
- Recent session history and daily/weekly study totals.
- Timer recovery after refresh or signing back in.

### Calendar and Planning

- The supplied Monday–Saturday class timetable, with 32 weekly classes in NAB 204.
- Exact period times, including the 16:00–17:30 session, plus subject descriptions, L-T-P-C values, and faculty details.
- Current-week classes in the event list and weekly recurring classes in calendar export.
- Personal events for study activities and deadlines.
- Event editing, completion, and deletion.
- Faculty-published assignment and test dates.
- Clearly labelled sample campus activities.
- Calendar export with reminder information.

### Academic Reports

- Separate views for sample marks and personal records.
- Assignment and test score recording.
- Semester results with grade points and credits.
- Credit-weighted GPA calculation.
- CSV export and printable reports.

GPA is calculated using:

**GPA = Σ(grade point × course credits) ÷ Σ(course credits)**

Assignment and quiz scores are tracked separately from semester GPA.

### Faculty Workspace

- Create notes, slides, learning content, assignments, tests, and notices.
- Save private drafts before publishing.
- Edit or delete existing posts.
- Add subject details, full text, optional due dates, and attachments.
- Attach PDF, PPT, PPTX, TXT, DOC, and DOCX files up to 20 MB.
- Make published resources available to eligible local student profiles.
- Review local learning progress, quiz averages, and recorded results.
- Explore reports using clearly labelled fictional student examples.

### Notifications

- An in-app feed for campus updates and faculty notices.
- Read and unread controls.
- Sample notifications for demonstrating the interface.

### Interface and Accessibility

- Responsive layouts for desktop and mobile screens.
- Light and dark themes.
- Indigo and mint visual styling.
- Bundled DM Sans and Plus Jakarta Sans fonts.
- Reduced-motion support.
- Reading controls that help users adjust the learning experience.

## Technologies Used

| Technology | Purpose |
| --- | --- |
| HTML5 | Page structure and application content |
| CSS3 | Responsive layouts, themes, typography, and visual styling |
| Vanilla JavaScript | Navigation, user interactions, quizzes, timers, reports, and application logic |
| localStorage | Local profiles, preferences, progress, and academic records |
| sessionStorage | The active browser session |
| IndexedDB | Storage for uploaded attachment files |
| Node.js HTTP and Crypto APIs | Server-side faculty approval checks, salted scrypt password hashes, and HttpOnly sessions |
| Git and GitHub | Version control and project hosting |

The application does not require a frontend framework, package installation, or compilation.

## How It Was Implemented

Uni Pulse uses a browser-based frontend organised into separate files for application behaviour, academic data, learning content, and focus tools.

- **Direct student entry** opens a persistent browser workspace without a login form.
- **Server-verified faculty entry** accepts administrator-approved accounts and rechecks sessions before faculty changes. Browser-local role fields do not establish institutional approval.
- **Subject data and learning content** provide the catalogue, lesson material, and available question banks.
- **Browser storage** preserves local profiles, progress, preferences, and records between visits.
- **IndexedDB** stores attachment bytes for locally published faculty resources.
- **Deadline-based timers** allow quiz and focus sessions to recover their remaining time after a refresh.
- **Role and semester checks** control which resources appear in the local interface.
- **Export and print features** let users take academic records and calendar information outside the application.

The project keeps its main functionality available without external services.

## Project Structure

```text
Uni Pulse/
├── index.html
├── css/
├── js/
│   ├── app.js
│   ├── core.js
│   ├── data.js
│   ├── learning-sources.js
│   ├── learning-content.js
│   └── focus.js
├── assets/
├── resources/
├── docs/
├── tests/
├── .gitignore
└── README.md
