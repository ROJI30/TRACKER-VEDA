# TRACKER VEDA — Local-only edition

A responsive prospect and follow-up tracker designed for GitHub Pages. This edition deliberately removes Supabase, cloud authentication, external databases, and all cloud-sync code.

## Features
- Dashboard with prospect and follow-up summaries
- Add, edit, search, filter, and delete prospects
- Free-text agent assignment labels (labels only; no accounts or team sharing)
- Automatic 3-day and 7-day follow-up dates and completion tracking
- Follow-up list, calendar, task list, and reports
- CSV export and full JSON backup/restore
- Light/dark mode and responsive bottom navigation
- Browser reminders while the app is open (permission required)
- Basic PWA/service-worker support when hosted over HTTPS
- Browser `localStorage` persistence; no cloud account or external database required

## Run it
Open `index.html` in a modern browser, or upload the files to a GitHub repository and enable GitHub Pages. Some browser features, including service workers and notifications, generally require HTTPS or localhost. The app uses Google Fonts if internet is available, but no cloud database or authentication service.

## Data storage and limitations
- Records are saved in the current browser profile on the current device. Clearing browser site data can erase them.
- Data does **not** automatically sync between devices or share with agents. Assignment labels are plain text, not user accounts.
- Use **Settings → Export backup** to download a JSON backup, then **Import backup** on another device to transfer records manually. Export CSV for spreadsheet analysis.
- Browser notifications work only while the app is open; reminders after the app is closed require a separate push-notification service.
- GitHub Pages hosts static files and does not provide a private database. Do not treat this local-only app as a multi-user shared CRM.

## Files
- `index.html` — app interface
- `styles.css` — styling and responsive layout
- `app.js` — app behavior and local storage
- `manifest.webmanifest`, `service-worker.js` — basic PWA support
- `DEPLOY_CHECKLIST.txt` — deployment and testing checklist
