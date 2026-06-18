# VakilDesk — Legal Office Management System

A multi-tenant SaaS platform for law firms and advocates to manage cases, clients, counsel, appointments, tasks, attendance, expenses, and physical file storage — all from one dashboard.

Each firm registers its own account (a "tenant") and gets a fully isolated workspace. Built with React + TypeScript on the frontend and Supabase (PostgreSQL) on the backend.

---

## Table of Contents

1. [What's Inside](#whats-inside)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Subscription Plans](#subscription-plans)
5. [Project Structure](#project-structure)
6. [Setup — Step by Step](#setup--step-by-step)
7. [Database Files & Run Order](#database-files--run-order)
8. [Running the App](#running-the-app)
9. [How Login Works](#how-login-works)
10. [Available Scripts](#available-scripts)

---

## What's Inside

VakilDesk is a complete, production-ready legal practice management app:

- **Multi-tenant** — every firm has its own isolated data, scoped by `tenant_id`
- **Custom auth** — username + password login backed by the `authenticate_user` database function
- **Role-based access** — `admin`, `manager`, and `user` roles
- **Subscription system** — 4 pricing tiers plus reminder add-ons
- **White-label branding** — Custom-plan firms can show their own name and brand color
- **Email reminders** — control panel for hearing-date reminders (Gmail backend in `email-backend/`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend / DB | Supabase (PostgreSQL + RPC functions) |
| Auth | Custom username/password via Supabase RPC |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| PDF / Export | jsPDF, html2canvas |
| Email backend | Python (see `email-backend/`) |

---

## Features

### Core
- **Dashboard** — live stats: total/active/pending cases, upcoming hearings, counsel, pending tasks
- **Cases** — full lifecycle: stages (consultation → disposed), status, interim relief, circulation status, hearing dates, fees
- **Case details tabs** — payments, timeline, file attachments
- **Clients** — auto-derived from cases
- **Counsel** — manage external counsel and link them to cases
- **Appointments** — calendar with date-based events
- **Tasks** — assign to staff, set deadlines, mark complete
- **Attendance** — daily present/absent tracking per staff member
- **Expenses** — monthly expense logging

### Office Management
- **Library** — track books, files, and documents by named locations (L1, L2, Shelf-A...)
- **Storage** — track physical files/folders/boxes by location (S1, S2, Rack-A...) with item types
- **Reminders** — Gmail reminder control panel: upcoming hearings, send-now, email logs, settings

### Admin
- **Admin Panel** — manage staff users (create, change role, activate/deactivate, delete)
- **Subscription** — view/choose plans, manage add-ons, white-label branding
- **Settings** — app preferences, light/dark theme

---

## Subscription Plans

| Plan | Price (monthly) | Staff | Cases | Storage | Gmail Reminders | WhatsApp |
|---|---|---|---|---|---|---|
| **Basic** | ₹999 | 3 | 500 | 10 GB | — | Add-on |
| **Pro** | ₹2,499 | 8 | 1,000 | 25 GB | — | Add-on |
| **Advanced** | ₹4,999 | 15 | Unlimited | 100 GB | ✅ Included | Add-on |
| **Custom** | ₹9,999 | Unlimited | Unlimited | Unlimited | ✅ Included | ✅ Included |

**Add-ons:** WhatsApp Reminders (₹499/mo), Telegram Reminders (₹299/mo).
**White-label branding** is exclusive to the Custom plan.
New firms start on a **14-day free trial**.

---

## Project Structure

```
VakilDesk/
├── LEGALFLOW_FINAL.sql      # Main database setup (run first)
├── PLAN_UPDATE.sql          # Pricing + extra tables (run second)
├── index.html
├── package.json
├── .env                     # Your Supabase credentials (not committed)
├── .env.example
├── email-backend/           # Python service for sending reminder emails
├── public/
└── src/
    ├── App.tsx              # Routes + provider tree
    ├── components/          # Sidebar, layout, forms, route guards, etc.
    ├── contexts/
    │   ├── AuthContext.tsx      # Login/logout, current user
    │   ├── TenantContext.tsx    # Firm info, plan, branding, add-ons
    │   ├── DataContext.tsx      # All CRUD for cases, counsel, tasks...
    │   └── ThemeContext.tsx     # Light/dark mode
    ├── lib/
    │   ├── supabase.ts          # Supabase client + DB helpers
    │   ├── userManagement.ts    # Auth + user RPC calls
    │   └── fileStorage.ts       # File upload (tenant-isolated paths)
    ├── pages/               # Dashboard, Cases, Reminders, Subscription...
    ├── types/index.ts       # All TypeScript types
    └── utils/               # Date formatting, PDF, export helpers
```

---

## Setup — Step by Step

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in **Supabase Dashboard → Settings → API**.

### 3. Set up the database

See the next section for the exact order.

### 4. Turn OFF email confirmations

In **Supabase → Authentication → Settings**, turn **"Enable email confirmations" OFF**.
(VakilDesk uses its own username/password system, so this prevents conflicts.)

---

## Database Files & Run Order

There are **two** SQL files. Run them **in this order** in the Supabase SQL Editor.

> ⚠️ **If you've already run `LEGALFLOW_FINAL.sql` and your app works, do NOT run it again** — it drops and rebuilds the whole schema and would wipe your data. Just run `PLAN_UPDATE.sql` once.

| Order | File | What it does | Re-runnable? |
|---|---|---|---|
| 1 | `LEGALFLOW_FINAL.sql` | Creates all 20 tables, 10 RPC functions, RLS policies, and seed data (courts, case types, districts). **Wipes & rebuilds `public` schema.** | ❌ Run once on a clean project only |
| 2 | `PLAN_UPDATE.sql` | Updates plan names to basic/pro/advanced/custom, adds `email_settings`, `email_logs`, `library_locations`, `storage_locations`, and location columns. | ✅ Safe to run multiple times |

**Steps:**
1. Supabase → **SQL Editor** → **+ New query**
2. (Free tier only) Run `SELECT NOW();` first to wake the project
3. Paste all of `LEGALFLOW_FINAL.sql` → **Run** *(skip if already done)*
4. New query → paste all of `PLAN_UPDATE.sql` → **Run**
5. Confirm zero errors

---

## Running the App

```bash
npm run dev -- --port 4000
```

Open **http://localhost:4000**

To build for production:

```bash
npm run build
```

The optimized output goes to the `dist/` folder. Deployment config for Netlify is in `netlify.toml`.

---

## How Login Works

1. **Register Firm** — fill firm details, choose a username + password. This creates rows in `tenants`, `user_accounts`, `profiles`, and `tenant_branding`. The first user is the firm **admin**.
2. **Sign In** — username + password are checked by the `authenticate_user` database function. On success the user and their `tenant_id` are cached in `localStorage` for instant reloads.
3. **Staff users** — admins create additional staff (with their own usernames) from the **Admin Panel**. Each is scoped to the same firm.

All data is isolated per firm via the `tenant_id` column on every table.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (add `-- --port 4000` for port 4000) |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run tests (Vitest) |

---

## Email Reminders (optional)

The **Reminders** page is the in-app control panel. To actually send emails, run the Python service in `email-backend/` — see `email-backend/README.md` for setup. The app logs reminders to the `email_logs` table and reads config from `email_settings`.

---

## License

Private — All rights reserved.
