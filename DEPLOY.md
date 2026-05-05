# Growing Up in Santa Cruz Best Of Survey Deployment

## Public URLs

After deploying to Netlify, replace `YOUR-SITE.netlify.app` with your live site URL.

- Public survey: `https://YOUR-SITE.netlify.app/#survey/best-of-2026`
- Admin dashboard: `https://YOUR-SITE.netlify.app/admin.html`
- Builder: `https://YOUR-SITE.netlify.app/#builder`
- Results: `https://YOUR-SITE.netlify.app/#dashboard`

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

## Deployment Notes

This project now includes Netlify Functions and the `@netlify/blobs` package, so Netlify must install dependencies during deploy. If drag-and-drop deploy does not build the functions, deploy through Netlify's standard site deploy flow or connect the folder to a GitHub repository.
