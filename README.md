# Workers Welfare Board — Industrial Worker Registry System

<div align="center">

![WWB Logo](https://img.shields.io/badge/Government%20of%20Punjab-Workers%20Welfare%20Board-003366?style=for-the-badge)

**A full-stack digital registry system for industrial workers in Punjab, Pakistan.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-brightgreen)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-blue)](https://expo.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

</div>

---

## 📋 Overview

The WWB Industrial Worker Registry System is a government-grade prototype for the **Workers Welfare Board, Government of Punjab**. It enables employers to register industrial workers digitally, allows multiple government departments to verify those registrations, and provides real-time analytics to administrators.

### Key Features

| Feature | Description |
|---|---|
| 🏢 **Employer Portal** | Web-based self-registration for employers and workers |
| 🔒 **Multi-Dept Verification** | 8 integrated departments (Labour, EOBI, Police, FBR, etc.) |
| 📊 **Analytics Dashboard** | Live charts: registration trends, districts, industries |
| 📱 **Worker Mobile App** | Expo React Native app with digital ID card + QR code |
| 🧾 **CSV/Print Export** | Role-based data export with field masking |
| 🔄 **Demo Reset** | One-click seed reset for presentations |

---

## 🗂 Project Structure

```
.
├── apps/
│   ├── api/                  # Express.js + TypeScript REST API
│   │   ├── src/
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── routes/       # Express routers
│   │   │   ├── middleware/   # Auth (JWT), RBAC
│   │   │   ├── adapters/     # NADRA, FBR, EOBI mock adapters
│   │   │   └── config/       # Kysely DB config
│   │   ├── seeds/            # Database seeder
│   │   └── migrations/       # SQL schema migrations
│   │
│   ├── web/                  # Next.js 15 Admin Portal
│   │   └── src/app/
│   │       ├── (dashboard)/  # Protected pages
│   │       │   ├── dashboard/        # Stats overview
│   │       │   ├── workers/          # Worker registry
│   │       │   ├── employers/        # Employer registry
│   │       │   ├── verification/     # Dept verification queue
│   │       │   ├── reports/          # Recharts analytics
│   │       │   └── admin/demo-accounts/ # Super admin only
│   │       └── login/        # Auth page
│   │
│   └── wwb-mobile/           # Expo React Native (iOS/Android/Web)
│       └── app/
│           ├── (auth)/       # Login screen
│           └── (app)/        # Worker dashboard, profile, ID card
│
├── nginx/                    # Nginx reverse proxy config
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production deployment
└── .github/workflows/        # CI/CD pipeline
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ (v22 LTS recommended)
- **Docker Desktop** (for the database)
- **Expo Go** app on your phone (for mobile testing)

### 1. Clone & Install

```bash
git clone <repo-url>
cd "Workers Welfare Board — Industrial Worker Registry System"
npm install
```

### 2. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port **15432** with `wwb_user` / `wwb_password`.

### 3. Configure Environment

Copy the example env file:
```bash
cp .env.example .env
```

Default `.env` values work out-of-box for local dev. Key variables:

```env
DATABASE_URL=postgresql://wwb_user:wwb_password@localhost:15432/wwb_db
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
NODE_ENV=development
DEMO_MODE=true
```

### 4. Run Migrations & Seed

```bash
cd apps/api

# Run migrations
npx ts-node migrations/001_initial.ts

# Seed 500 demo workers + all department accounts
npx ts-node seeds/seed.ts
```

### 5. Start All Apps

Open **3 terminal tabs**:

```bash
# Tab 1 — API (port 3001)
cd apps/api && npm run dev

# Tab 2 — Web Admin Portal (port 3000)
cd apps/web && npm run dev

# Tab 3 — Mobile App
cd apps/wwb-mobile && npx expo start --clear
```

---

## 🔑 Demo Credentials

After seeding, use these accounts:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@wwb.punjab.gov.pk` | `Admin@123456` |
| WWB Admin | `wwb.admin@wwb.punjab.gov.pk` | `Admin@123456` |
| Labour Dept Officer | `labourdept@wwb.punjab.gov.pk` | `Dept@123` |
| EOBI Officer | `eobi@wwb.punjab.gov.pk` | `Dept@123` |
| Police Officer | `police@wwb.punjab.gov.pk` | `Dept@123` |
| FBR Officer | `fbr@wwb.punjab.gov.pk` | `Dept@123` |
| Employer | `employer1@test.com` | `Dept@123` |

> All accounts and full credential list are also viewable at `/admin/demo-accounts` (Super Admin only).

---

## 🏗 API Reference

Base URL: `http://localhost:3001/api`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns `accessToken` + `refreshToken` |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Get current user |

### Workers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/workers` | List workers (paginated, searchable) |
| POST | `/workers/:id/nadra-check` | Trigger mock NADRA identity check |

### Verifications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/verifications/worker/:id` | Record dept approval/rejection |
| GET | `/verifications/worker/:id` | Get all verifications for a worker |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/summary` | Full dashboard stats |
| GET | `/workers/export/csv` | Download CSV (RBAC field masking) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/reset-seed` | Reset DB + re-seed (super_admin, DEMO_MODE only) |

---

## 🔐 Role-Based Access Control

| Role | Access Level |
|---|---|
| `super_admin` | Full access + demo reset |
| `wwb_admin` | Registry management, analytics, verification |
| `dept_officer` | Verification queue for their own department |
| `employer` | Register/view own workers |

**Field Masking**: The `Police` department's officer cannot view `pay_scale` in exports.

---

## 📱 Mobile App

The Expo mobile app is designed for **registered workers** to:
- View their registration status and department-by-department progress
- See their Digital ID Card with a scannable QR code
- Share/save their ID card as an image
- Switch UI language between English and Urdu (RTL)

---

## 🐳 Production Deployment

```bash
# Copy and configure production env
cp .env.example .env
# Set JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV=production

# Build and launch all services
docker-compose -f docker-compose.prod.yml up -d --build
```

Services exposed:
- Port `80` → Nginx (routes `/api/*` to Express, `/*` to Next.js)

---

## 🧪 Architecture Decisions

- **Kysely** for type-safe SQL — avoids ORM overhead while keeping queries readable.
- **Mock adapters** for NADRA, FBR, EOBI — simulate 600–800ms network delay with realistic payloads for live demos.
- **`display_status` computed dynamically** — the DB only stores `pending`, `verified`, `flagged`; `partially_verified` is computed from the `verifications` table on every API response.
- **JWT + Refresh Token** rotation with DB invalidation on logout.

---

## 📄 License

This is a prototype system developed for the Workers Welfare Board, Government of Punjab. All rights reserved.

---

<div align="center">
Built with ❤️ for the workers of Punjab, Pakistan.
</div>
