# Faculty access

Students enter immediately with **Enter as a student**. No name, ID, email,
password, or semester is requested. Their workspace is saved in this browser.
**Switch workspace** returns to the entry choices. Returning students resume
the same browser workspace. Existing local profiles are retained.

Faculty choose **Enter as a faculty** and supply an approved email and a
separate Uni Pulse password. There is no faculty self-registration. Old
browser-local faculty passwords do not grant approval.

## Faculty demo

Choose **Enter as a faculty**, then **Explore faculty demo** below the sign-in
form. No credentials or Node server are required for this demo, including on
static hosting. It opens a clearly labelled sample workspace with sample
posts, a draft, and fictional student reports.

You can practise posting, editing, deleting, and attaching/downloading files.
Demo profiles, posts, and uploads stay in memory. They never overwrite the
normal student/faculty database or attachment store. **Exit demo** or refresh
to discard the practice session. Real faculty authorization remains separate.

## Start the local server

Install Node.js if it is not already installed. From the folder containing
`index.html` and `server.cjs`, run:

```sh
node server.cjs
```

Open `http://127.0.0.1:8000`. No npm installation or build is required.
Student access also works on static hosting. Faculty authorization requires
this server; GitHub Pages and VS Code Live Server cannot run the auth API.

## Provision an approved account

Only an institution administrator should run this command, after checking the
person's identity and institutional approval through the institution's process:

```sh
node scripts/approve-faculty.cjs
```

The prompts request the approved email, display name, explicit approval
confirmation, and a new password of 12–128 characters. Password entry is hidden.
Use a separate Uni Pulse password, not an institutional SSO password.
The script creates or updates the account; updating an account retains its ID.
No real faculty accounts are supplied with this repository.

The private server-side file is `.private/faculty-accounts.json`. It contains
salted scrypt password hashes, not plaintext passwords. `.private/` is ignored
by Git and cannot be served by `server.cjs`. Keep it and backups private.
`UNIPULSE_FACULTY_FILE` can point to a private account file outside the checkout.

To revoke access, set the account's `approved` field to `false` in that private
file. The next session check rejects it. Login and session checks consult the
server file, not localStorage. Login attempts are limited and sessions expire
after eight hours. Sessions are held in memory and end when the server restarts.
Faculty sessions are checked again on reload, returning to the browser tab,
and before publishing or changing faculty posts.

## Deployment and scope

This is an administrator-managed approval mechanism, not a connected
institutional directory. The institution and its SSO service have not been
provided, so no Microsoft, Google, or campus identity integration is claimed.
Until an administrator provisions an approved account, real faculty entry stays
closed. The isolated sample demo is available without approval.

The server binds to `127.0.0.1` for local use. A real campus deployment requires
a managed host, HTTPS, institutional identity/approval integration, and a
server database with authorization for publications, uploads, and student
records. When placed behind an HTTPS reverse proxy, set `UNIPULSE_ORIGIN` to
the exact public origin so origin checks and Secure cookies work correctly.

Learning records, faculty publications, and attachments still live in browser
storage. These can be inspected or modified by someone controlling that
browser. This change verifies faculty entry; it does not turn browser-local
records into a secure campus-wide system.

## Weekly timetable

`js/timetable.js` transcribes the supplied screenshot. Schedule shows the
Monday–Saturday grid, original empty periods, all 32 classes, room NAB 204,
subject descriptions, L-T-P-C values, and the listed faculty member.
Blank periods are shown as “No class”; lunch or other activities are not assumed.

The event list and home overview include classes for the current week without
copying them into personal events. Calendar export includes weekly recurrence
with the actual 50-minute or 90-minute slot lengths. Since the screenshot has
no term dates, exported classes start in the export week and repeat until
removed in the calendar application. Times use that calendar's local clock.
