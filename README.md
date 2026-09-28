# MumWell

Perinatal mental health support for every mother, wherever she lives: EPDS screening, an AI companion
chat, voice consultations with AI specialists, a personalised 90-day wellbeing programme,
mood/activity tracking, relaxation exercises and daily reminder emails — in **English,
Swedish, German, French and Spanish**, built around the GDPR.

```
.
├── client/            React 19 + Vite + Tailwind CSS 4 (JavaScript)
├── server/            Node.js + Express 5 API (JavaScript, ES modules)
├── package.json       Convenience scripts that run both
└── _legacy_nextjs/    Backup of the original Next.js app (safe to delete once you're happy)
```

## Quick start

Requirements: Node.js 20+ (tested on 26).

```bash
npm run install:all          # installs root, server and client dependencies
cp server/.env.example server/.env   # skip if server/.env already exists
cp client/.env.example client/.env   # skip if client/.env already exists
# fill in the values — see "Configuration" below
npm run dev                  # API on http://localhost:5100, app on http://localhost:3000
```

In development the client proxies `/api` to the server, so no CORS setup is needed.

| Command               | What it does                                   |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Server (auto-restart) and client (hot reload)  |
| `npm test`            | Server test suite (in-memory databases, no API keys needed) |
| `npm run lint`        | ESLint for the client                          |
| `npm run build`       | Production build of the client into `client/dist` |
| `npm start`           | Start the server in production mode            |

## Configuration

### `server/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Accounts, login sessions, AI chat, mood, EPDS results, activities |
| `JWT_SECRET` | yes | Signs login tokens. At least 32 random characters in production |
| `DATABASE_URL` | for program features | Neon Postgres: 90-day program, wellness check-ins, voice consultations, reminder settings. Those endpoints return 503 without it |
| `GEMINI_API_KEY` **or** `OPENROUTER_API_KEY` | for AI features | Therapist chat, program generation, specialist suggestions, consultation reports. Set `LLM_PROVIDER` to choose when both are set |
| `GEMINI_MODEL` / `OPENROUTER_MODEL` | no | Defaults: `gemini-2.5-flash` / `google/gemini-2.5-flash` |
| `CLIENT_URL` | production | Front-end origin(s) allowed by CORS, comma-separated. The first one is used in password-reset links |
| `SMTP_HOST`, `SMTP_PORT`, `MAIL_USER`, `MAIL_PASS` | for email | Password reset and reminder emails |
| `ENABLE_REMINDER_CRON` | no | `true` runs the reminder scheduler inside the server (use on a single always-on instance) |
| `CRON_SECRET` | no | Lets an external scheduler call `POST /api/notifications/run` with header `x-cron-secret` |
| `CHAT_SESSION_TTL_HOURS` | no | AI chats are deleted this many hours after the last message (default 24; `0` keeps them) |
| `SERVE_CLIENT` | no | `true` makes the server also serve `client/dist` (single-host deployment) |

### `client/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL when the API is on a different domain (e.g. `https://api.mumwell.org`). Leave empty in development and when the server serves the client |
| `VITE_VAPI_PUBLIC_KEY` | Vapi public key for voice consultations |

## Languages

Everything a user sees or hears follows their language: the interface, AI chat replies, the
90-day programme, specialist suggestions and consultation summaries, voice consultations
(native Azure voices and Deepgram speech recognition via Vapi), emails and server errors.

- The language is picked at signup, in the header (globe icon) or under **Account & privacy**,
  and stored on the account (`preferredLanguage`). Guests get their browser language.
- Client strings live in `client/src/i18n/locales/<lang>/*.json` (English is the source).
  Run `node client/scripts/check-translations.mjs` after editing — it fails if any language
  is missing keys, list items or `{{placeholders}}`.
- Server messages and emails: `server/src/i18n/messages.js` (a test checks all five languages).
- AI instructions are appended with "reply in <language>" per request.

**Before launch, have native speakers review the translations** — especially the EPDS
questions (see below), crisis wording and legal pages.

> **EPDS translations.** The EPDS has published, validated translations for each of these
> languages. The versions in `test.json` are careful translations but have not been checked
> against the validated wording. Replace them with the validated versions (with the
> appropriate permissions) before using the scores clinically.

## GDPR & privacy

- **Consent:** three separate, un-ticked consents at signup (terms/privacy, explicit consent
  to health-data processing under Art. 9(2)(a), 18+). Each is stored with a timestamp and
  version (`CONSENT_VERSION` in `authController.js`). Accounts without them see a consent
  screen before using the app.
- **Rights:** Account & privacy lets users update details, change their password, download
  all their data as JSON (Art. 15/20) and permanently delete their account from both
  databases (Art. 17).
- **Retention:** chats auto-delete after 24 h; sessions and reset links expire; everything
  else is kept until the account is deleted.
- **No tracking:** no analytics or advertising cookies; fonts are bundled (no Google Fonts
  requests); only `localStorage` for the login token, language and theme.
- **AI transparency:** chat and voice screens tell users they are talking to an AI (EU AI Act, Art. 50).
- **Legal pages:** `/privacy` and `/terms` are drafts — fill in the `[bracketed]` items
  (controller, address, email provider, transfer mechanisms, governing law) and have them
  reviewed by a data-protection lawyer.
- **Hosting:** MongoDB Atlas is in EU West (Ireland). **Neon Postgres is currently in
  us-east-1 (USA)** — move it to an EU region (e.g. Frankfurt) or document the transfer
  safeguards in the privacy policy.
- Crisis helplines for 10 countries are in `client/src/data/helplines.js` — verify them
  periodically.

## Brand

"Calm clinical": navy `#1E3A5F`, coral `#E8735A`, sage `#5F9884` on off-white, with Plus
Jakarta Sans (headings) and Inter (body). Tokens are in `client/src/index.css`; the logo is a
React component (`components/brand/Logo.jsx`) with PNG/SVG exports in `client/public`
(favicon, apple-touch icon, `email-logo.png` for emails). The EU flag/emblem is deliberately
not used, as it implies official EU endorsement.

**Photos** come from Pexels via `client/scripts/fetch-photos.mjs` (see the comments at the
top). Credits are written to `src/data/photoCredits.json` and shown in the footer.

## Architecture

**Two databases.** The original app stored data in both MongoDB and Neon Postgres, and this
version keeps that split so existing data works without a migration. The two are linked by the
user's email address.

- MongoDB: `users`, `sessions`, `chatsessions`, `moods`, `tests`, `activities`
- Postgres: `users` (wellness profile, program, reminders) and `sessionChatTable` (voice consultations)

The Postgres schema lives in `server/src/db/schema.js` and matches the existing tables exactly.
`npm run db:push --prefix server` applies schema changes with drizzle-kit.

**AI calls** all go through `server/src/services/llm.js`, which works with either provider.
The therapist chat makes one model call per message (reply and risk analysis together), and
the 90-day program is generated in six parallel batches of 15 days.

**Safety.** Chat messages are checked both by the model's risk score and a keyword backstop for
self-harm or harm to the baby. When triggered, the reply is flagged and the app shows crisis
resources. The EPDS test shows the same support whenever question 10 (self-harm) is answered
above zero. Crisis helplines are listed on the Contact page (`/contact#crisis`).

**Voice consultations** run in the browser through Vapi. The server stores each session and
generates the written report from the transcript when the call ends.

### API overview (`/api`)

| Area | Endpoints |
| --- | --- |
| Account | `PATCH /account` · `POST /account/consents` · `PUT /account/password` · `GET /account/export` · `DELETE /account` |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password` |
| AI chat | `POST /chat/sessions` · `GET /chat/sessions` · `GET /chat/sessions/:id` · `GET /chat/sessions/:id/history` · `POST /chat/sessions/:id/messages` |
| Tracking | `POST/GET /mood` · `GET /mood/history` · `POST/GET /test` · `GET /test/history` · `POST/GET /activity` |
| Program | `GET/POST /program` · `PUT /program/day` · `GET/POST /wellness` |
| Consultations | `GET /consultations/doctors` · `POST /consultations/suggest` · `GET/POST /consultations` · `GET /consultations/:id` · `POST /consultations/:id/report` |
| Reminders | `GET/PUT /notifications` · `POST /notifications/run` (cron secret) |
| Health | `GET /health` |

Everything except health, register, login and password reset requires
`Authorization: Bearer <token>`. Users can only read their own data.

## Deployment

**One host:** build the client, then run the server with `SERVE_CLIENT=true`:

```bash
npm run install:all && npm run build
NODE_ENV=production SERVE_CLIENT=true npm start
```

**Separate hosts:** deploy `client/dist` to any static host with a fallback to `index.html`,
set `VITE_API_URL` at build time, and set `CLIENT_URL` on the server to the client's origin.

For reminder emails, either set `ENABLE_REMINDER_CRON=true` on exactly one server instance, or
call `POST /api/notifications/run` every minute from an external scheduler with the
`x-cron-secret` header.

## Tests

`npm test` runs 41 server tests against an in-memory MongoDB and an in-memory Postgres
(PGlite) with a stubbed AI provider, so they need no credentials and never touch real data.
They cover authentication and session revocation, consent enforcement, users being unable to
access each other's data, crisis detection in all five languages, translated errors and AI
replies, data export and account deletion, programme generation, legacy data formats, time
zones and reminder scheduling.
