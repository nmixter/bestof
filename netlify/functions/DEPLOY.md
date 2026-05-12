# Growing Up in Santa Cruz Best Of Survey Deployment

## Public URLs

Current Netlify site:

- Public survey: `https://frabjous-basbousa-b24691.netlify.app/#survey/best-of-2026`
- Admin dashboard: `https://frabjous-basbousa-b24691.netlify.app/admin.html`
- Builder: `https://frabjous-basbousa-b24691.netlify.app/index.html?admin=1#builder`
- Results: `https://frabjous-basbousa-b24691.netlify.app/index.html?admin=1#dashboard`
- Admin public-survey preview: `https://frabjous-basbousa-b24691.netlify.app/index.html?admin=1&preview=1#survey/best-of-2026`

## Admin Login

Default admin password:

`SantaCruzBest2026!`

Before launching publicly, set a private password in Netlify:

1. Open your Netlify site.
2. Go to **Site configuration**.
3. Open **Environment variables**.
4. Add `SURVEY_ADMIN_PASSWORD` with your chosen password.
5. Add `SURVEY_IP_SALT` with a long random phrase.
6. Redeploy the site.

## Backend Storage

Responses are stored in Netlify Blobs through the Netlify Function at:

`/.netlify/functions/survey`

The public survey can submit responses without the admin password. The dashboard and builder save/read endpoints require the admin password.

The function must be uploaded as:

`netlify/functions/survey.mjs`

It uses Netlify Functions v2 syntax so Netlify Blobs can access the site storage environment automatically.

## Deployment Notes

This project now includes Netlify Functions and the `@netlify/blobs` package, so Netlify must install dependencies during deploy. If drag-and-drop deploy does not build the functions, deploy through Netlify's standard site deploy flow or connect the folder to a GitHub repository.
