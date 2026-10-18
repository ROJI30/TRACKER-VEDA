# TRACKER VEDA

A responsive, GitHub Pages-ready starter web app for meeting, contact, and follow-up tracking.

## Included in this starter

- Responsive interface for phone, tablet, and desktop
- Fixed bottom navigation on **all** screen sizes (no sidebar)
- Emerald green, mint, teal, and blue colour system
- Light mode and dark mode toggle; preference is saved in the browser
- Dashboard with contact, due-today, pending, and completed counts
- Add, edit, search, filter, and delete contacts
- Contact types: Prospect, Suspect, New List, Client
- Automatic 3-day and 7-day follow-up dates based on the date met
- Mark each call completed or pending
- Follow-up filters: All, Today, Upcoming, Overdue, Completed
- Monthly calendar view
- Task checklist
- Basic reports and CSV export
- Local browser storage

## Run locally

1. Extract the ZIP.
2. Open `index.html` in a modern browser.

No build tools or package installation are required.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under build and deployment, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish your site.

## Important limitations of this first version

- Data is stored in local browser storage on the current device/browser. It is **not** shared between the client's phone, tablet, and computer yet.
- This is a front-end starter, not a secure multi-user system. Do not store sensitive client information until authentication, a database, access controls, and backups are implemented.
- Follow-up dates are calculated from the date met. Reminders are shown in the app; this version does not send push notifications, SMS, WhatsApp, or email.
- The Agents page is a placeholder for a later team-management phase.
- Google Fonts are loaded online; system fallback fonts are provided if offline.

## Suggested future roadmap

1. **Core and usability:** confirm fields, follow-up flow, and branding with the client.
2. **Secure accounts and cloud sync:** manager/agent login, database, backups, and device-to-device sync.
3. **Team management:** assign prospects to agents, role-based access, team activity.
4. **Automation:** in-app notifications, email/SMS/WhatsApp integrations, recurring reminders.
5. **Pipeline and analytics:** lead stages, conversion tracking, custom tags, exportable reports.
6. **Mobile polish:** PWA installability, optional push notifications, offline sync.

## Project files

- `index.html` — app structure and screens
- `styles.css` — responsive styling, colour themes, bottom navigation
- `app.js` — contacts, reminders, tasks, calendar, reports, local storage
- `README.md` — setup and roadmap
