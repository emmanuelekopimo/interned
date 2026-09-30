# Internly

**Find Your Next Opportunity.** Internly is an internship and early-career platform for students and young professionals. Students discover verified internships and SIWES placements, companies post opportunities and manage applicants, and admins moderate everything.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style components (Radix UI) · PostgreSQL · Drizzle ORM**.

## Features

**Public site**
- Home page (hero search, latest opportunities, alert sign-up, stats, how it works, fields, top companies, resources)
- Opportunities listing & search with filters (location, field, type, work mode, duration, stipend), facet counts, sorting and pagination
- Opportunity details (tabs, key facts, safety notice, sharing, similar opportunities, save, apply)
- Companies directory and company profiles, Explore by Field
- Career resources (articles in Markdown), About, Contact, FAQ, Privacy, Terms, Report an opportunity, Post an opportunity

**Students** (`/dashboard`)
- 3-step application flow (personal info → documents with CV/cover-letter upload → review) with save-and-continue drafts
- External/email applications can be tracked too
- Dashboard with recommendations, profile-completion score and activity
- Saved opportunities, application tracking with status timeline, withdraw
- Opportunity alerts (instant / daily / weekly), notifications, full profile (skills, experience, projects, links, CV), account settings

**Companies** (`/company`)
- Dashboard stats, post/edit opportunities (3-step form, drafts), close/reopen/delete
- Applicant pipeline: review profile & documents, move through Under Review → Shortlisted → Interview → Accepted/Rejected with a message (student is notified in-app and by email)
- Company profile (logo, cover, description, socials), settings
- Verified companies publish instantly; others go to admin review

**Admin** (`/admin`)
- Overview with stats, 14-day application chart, review queue
- Opportunities: create/edit for any company, approve/reject (with reason), publish/close, verify, feature, delete
- Companies (verify, suspend, assign owner), users (roles, suspend, reset password), all applications, reports moderation
- Content: resources, fields, FAQs, About/Privacy/Terms pages
- Contact messages inbox, alert subscribers (CSV export), site settings (hero text & image, stats, contact info, socials, announcement bar)

## Getting started

Requirements: Node.js 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL and AUTH_SECRET
npm run db:migrate            # create tables
npm run db:seed               # admin account + demo data
npm run dev                   # http://localhost:3000
```

Demo accounts created by the seed script:

| Role    | Email                    | Password      |
|---------|--------------------------|---------------|
| Admin   | admin@internly.ng        | Admin@12345 (or `SEED_ADMIN_*`) |
| Student | student@internly.ng      | Password123   |
| Company | hr@xyztechnologies.com   | Password123   |

`npm run db:seed -- --reset` wipes the database and reseeds it.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run db:generate` | Generate a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database |
| `npm run db:seed` | Seed data |

## Configuration

See `.env.example`. Notable settings:

- **Uploads** (CVs, logos, images) are stored as binary blobs in PostgreSQL (`files` table) and served from `/api/files/...` (with fallback to local disk for legacy files).
- **Email**: set `SMTP_*` to send real email; otherwise emails are printed to the server log.
- **Alert digests**: call `GET /api/cron/alerts` with `Authorization: Bearer $CRON_SECRET` on a schedule (e.g. hourly). Instant alerts are sent when an opportunity is first published.

## Project structure

```
src/
  app/
    (site)/        public pages          (auth)/   login, signup, password reset
    dashboard/     student area          company/  employer area       admin/  admin panel
    actions/       server actions (auth, student, company, admin, public)
    api/           file serving, cron, CSV export
  components/      ui/ (design system), forms/, opportunity/, dashboard/, admin/, …
  db/              Drizzle schema + client
  lib/             auth/session, queries, alerts, mail, uploads, settings, utils
scripts/seed.ts
drizzle/           SQL migrations
```
