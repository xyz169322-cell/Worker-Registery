# Workers Welfare Board — Industrial Worker Registry System
## Master Build Prompt for Claude Code / Cursor

> **How to use this:** Paste the entire contents of any section below as your
> first message in Claude Code or Cursor. Start with PHASE 1 and complete each
> phase before moving to the next. Each phase prompt is self-contained.

---

## PROJECT OVERVIEW (Read before any phase)

You are building a **government prototype system** for the Workers Welfare Board,
Punjab, Pakistan. This is a full-stack web + mobile application that serves as a
central registry for industrial workers and their employers across Punjab.

### What the system does
- Employers register their businesses using NTN (National Tax Number)
- Workers register with CNIC and employment details
- 8 government departments verify records (Labour Dept, Police, EOBI, Social
  Security, FBR, Excise & Taxation, Civil Defense, District Administration)
- Workers Welfare Board administers the entire system

### Prototype rules
- All external APIs (NADRA, FBR, EOBI) are **mocked** — real APIs will be
  integrated after government approval
- Mock responses must be swappable to real APIs by changing ONE environment
  variable (`USE_MOCK_APIS=true`)
- Include 500 realistic dummy records for demo purposes

---

## TECH STACK (Fixed — do not change)

| Layer | Technology |
|---|---|
| Web admin portal | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Mobile app | React Native with Expo |
| Backend API | Node.js + Express.js |
| Database | PostgreSQL |
| Cache / sessions | Redis |
| Authentication | JWT (access token 15min, refresh 7 days) |
| OTP / SMS | Twilio (test mode for prototype) |
| Hosting | Azure (prototype environment) |
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## DESIGN SYSTEM (Apply to every screen)

### Color palette — "Punjab Authority"
```
--color-navy:      #003366   /* Headers, sidebar, primary buttons */
--color-royal:     #004080   /* Navigation bar */
--color-gold:      #C8A951   /* Accents, badges, highlights */
--color-page-bg:   #F0F4F8   /* Page background */
--color-white:     #FFFFFF   /* Cards, form backgrounds */
--color-verified:  #1D9E75   /* Verified status */
--color-pending:   #E6A817   /* Pending status */
--color-flagged:   #C8202F   /* Flagged / error */
--color-text:      #2C3E50   /* Body text */
--color-muted:     #6B7A8D   /* Labels, captions */
```

### Typography
- **English:** Inter (Google Fonts)
- **Urdu:** Noto Nastaliq Urdu (Google Fonts)
- Page title: 24px / 500 weight
- Section heading: 18px / 500
- Card title: 15px / 500
- Body: 14px / 400
- Table data: 13px / 400
- Labels: 11px / 500 / uppercase / letter-spacing 0.06em

### UI Rules
- Government logo + "Workers Welfare Board — Punjab" in every header
- Light theme by default (no dark mode — government standard)
- Sentence case on all labels and buttons
- CNIC always formatted as: `00000-0000000-0`
- Minimum 44px tap targets on mobile
- Bilingual toggle: English / Urdu on every screen
- When Urdu is active: full RTL layout (`dir="rtl"`)
- Status badges always show icon + text (never color alone)
- No animations on data tables
- Session timeout warning at 25 min, auto-logout at 30 min

### Status badge components
```
Verified  → green background #EAF3DE, text #27500A, checkmark icon
Pending   → amber background #FAEEDA, text #633806, clock icon
Flagged   → red background   #FCEBEB, text #791F1F, alert icon
Mock API  → purple background #EEEDFE, text #3C3489, test-pipe icon
```

---

## DATABASE SCHEMA

```sql
-- businesses
CREATE TABLE businesses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ntn                 VARCHAR(15) UNIQUE NOT NULL,
  business_name       VARCHAR(255) NOT NULL,
  industry_type       VARCHAR(100),
  address             TEXT,
  district            VARCHAR(100),
  contact_person      VARCHAR(255),
  contact_phone       VARCHAR(20),
  verification_status VARCHAR(20) DEFAULT 'pending'
                      CHECK (verification_status IN ('pending','verified','flagged')),
  registered_by       UUID REFERENCES users(id),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- workers
CREATE TABLE workers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnic                VARCHAR(15) UNIQUE NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  employer_id         UUID REFERENCES businesses(id),
  job_title           VARCHAR(150),
  designation         VARCHAR(150),
  date_of_joining     DATE,
  pay_scale           DECIMAL(12,2),
  payment_mode        VARCHAR(10) CHECK (payment_mode IN ('bank','cash')),
  bank_account        VARCHAR(30),
  bank_name           VARCHAR(100),
  eobi_number         VARCHAR(30),
  social_security_no  VARCHAR(30),
  address             TEXT,
  district            VARCHAR(100),
  phone               VARCHAR(20),
  verification_status VARCHAR(20) DEFAULT 'pending'
                      CHECK (verification_status IN ('pending','verified','flagged')),
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- users (portal accounts — department officers + admins)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(30) NOT NULL
                CHECK (role IN ('super_admin','wwb_admin','dept_officer','employer')),
  department    VARCHAR(100),
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- verifications (audit trail of every dept verification action)
CREATE TABLE verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   VARCHAR(20) CHECK (entity_type IN ('worker','business')),
  entity_id     UUID NOT NULL,
  department    VARCHAR(100) NOT NULL,
  verified_by   UUID REFERENCES users(id),
  status        VARCHAR(20) CHECK (status IN ('approved','rejected','pending')),
  remarks       TEXT,
  verified_at   TIMESTAMP DEFAULT NOW()
);

-- audit_logs (immutable log of every system action)
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  ip_address  VARCHAR(45),
  details     JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- refresh_tokens
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ROLE-BASED ACCESS CONTROL

```
super_admin     → Full access to everything
wwb_admin       → Full access to all workers, employers, reports
dept_officer    → Access filtered by their department (see below)
employer        → Can only see and edit their own workers
```

### Department data access matrix
```
Labour Dept     → All worker fields EXCEPT pay_scale. Can verify + flag.
Police          → name, cnic, employer_id, address, phone only. Read-only.
EOBI            → eobi_number, employer, pay_scale, date_of_joining. Can verify EOBI.
Social Security → social_security_no, employer, district, province. Can verify SS.
FBR             → businesses table only (NTN, name, industry). Can verify NTN.
Excise & Tax    → businesses table, registration data. Read-only.
Civil Defense   → Aggregated reports only. No individual records.
District Admin  → Aggregated reports + analytics. No individual records.
```

---

## MOCK API ADAPTER PATTERN

Every external API must use this adapter pattern:

```javascript
// src/adapters/nadra.adapter.js
const USE_MOCK = process.env.USE_MOCK_APIS === 'true';

export const verifyNADRA = async (cnic) => {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    // Deterministic mock: last digit even = verified, odd = pending
    const lastDigit = parseInt(cnic.replace(/-/g, '').slice(-1));
    if (lastDigit % 2 === 0) return { status: 'verified', mock: true };
    if (lastDigit === 1) return { status: 'not_found', mock: true };
    return { status: 'pending', mock: true };
  }
  // REAL API — will be implemented when NADRA MOU is signed
  return await nadraRealAPI(cnic);
};
```

Create identical adapters for: `fbr.adapter.js`, `eobi.adapter.js`,
`social_security.adapter.js`, `sms.adapter.js`

---

---

# PHASE 1 PROMPT — Project Setup + Database + Auth API

Paste this entire block as your first message to Claude Code / Cursor.

---

```
I am building a government worker registry system for the Workers Welfare Board, Punjab, Pakistan. 

Set up the complete project foundation:

## 1. Folder structure to create

wwb-system/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, redis.js, env validation
│   │   ├── middleware/       # auth.js, rbac.js, audit.js, rateLimiter.js
│   │   ├── routes/           # auth.routes.js (to start)
│   │   ├── controllers/      # auth.controller.js
│   │   ├── services/         # auth.service.js
│   │   ├── adapters/         # nadra.adapter.js, fbr.adapter.js, eobi.adapter.js, sms.adapter.js
│   │   ├── models/           # db query helpers (no ORM — raw pg queries)
│   │   └── utils/            # cnic.utils.js (formatter/validator), logger.js
│   ├── migrations/           # SQL migration files numbered 001, 002...
│   ├── seeds/                # seed.js for 500 dummy records
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── frontend/                 # Next.js 14 — set up but leave empty for Phase 2
├── mobile/                   # React Native Expo — set up but leave empty for Phase 3
├── docker-compose.yml        # postgres + redis + backend
└── README.md

## 2. Backend: implement these fully

### Database
- PostgreSQL with this exact schema: [paste the full SQL schema from above]
- Use the `pg` npm package (no ORM)
- Connection pool in src/config/db.js
- Run migrations on startup

### Authentication API endpoints
POST /api/auth/login
- Accept email + password
- Return { accessToken, refreshToken, user: { id, name, role, department } }
- Access token expires in 15 minutes
- Refresh token expires in 7 days, stored hashed in refresh_tokens table

POST /api/auth/refresh
- Accept refreshToken
- Return new accessToken

POST /api/auth/logout
- Invalidate refresh token

GET /api/auth/me
- Return current user (requires valid access token)

### Middleware
- auth.middleware.js: verify JWT, attach user to req.user
- rbac.middleware.js: checkRole(...roles) and checkDepartment(...depts) functions
- audit.middleware.js: log every state-changing request to audit_logs table
- rateLimiter.middleware.js: 100 requests/min per IP using Redis

### Mock API adapters
Create all 4 adapters with USE_MOCK_APIS=true behavior:
- nadra.adapter.js → verifyNADRA(cnic)
- fbr.adapter.js → verifyNTN(ntn)
- eobi.adapter.js → verifyEOBI(eobiNumber)
- sms.adapter.js → sendOTP(phone, otp)

### CNIC utility
- Validate format: 00000-0000000-0 (13 digits with dashes)
- Format raw 13-digit string to dashed format
- Extract province code from first 5 digits

### Seed file
Create 500 realistic Pakistani worker records with:
- Pakistani names (mix of male/female)
- Valid CNIC format numbers
- Distributed across Punjab districts (Lahore, Faisalabad, Gujranwala, Rawalpindi, Multan, Sialkot)
- Linked to 30 fictional employers with real-sounding Punjab industry names
- Mix of verified/pending/flagged statuses
- Realistic pay scales PKR 18,000–85,000

### Docker Compose
- postgres:15 with persistent volume
- redis:7-alpine
- backend service with hot reload in dev
- Environment variables via .env file

### .env.example
DATABASE_URL=postgresql://user:pass@localhost:5432/wwb_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
USE_MOCK_APIS=true
TWILIO_ACCOUNT_SID=test
TWILIO_AUTH_TOKEN=test
PORT=3001

## 3. Design system constants file
Create backend/src/config/departments.js with:
- Array of all 8 departments with their names, allowed data fields, and permission levels
- ROLE_PERMISSIONS object mapping each role to their allowed routes

## Constraints
- No ORM — use raw pg queries with parameterised inputs (SQL injection prevention)
- All passwords hashed with bcrypt (12 rounds)
- Never log CNIC or pay_scale to console
- All endpoints return { success, data, message } structure
- Validation on every input field (express-validator)

When done, run the seed file and confirm: "Phase 1 complete — 500 workers seeded, auth endpoints working."
```

---

---

# PHASE 2 PROMPT — Next.js Admin Portal (Web Frontend)

Paste this after Phase 1 is complete and working.

---

```
Phase 1 backend is complete. Now build the Next.js 14 admin portal for the Workers Welfare Board.

## Design system — apply to every component

Colors (add to tailwind.config.js as custom colors):
  navy: '#003366'
  royal: '#004080'
  gold: '#C8A951'
  page-bg: '#F0F4F8'
  verified: '#1D9E75'
  pending: '#E6A817'
  flagged: '#C8202F'
  text-dark: '#2C3E50'
  text-muted: '#6B7A8D'

Fonts (add to layout.tsx via next/font/google):
  Inter (English), Noto Nastaliq Urdu (Urdu — load conditionally)

Global rules:
- Light theme only
- Government header on every page showing WWB logo + "Workers Welfare Board — Punjab" + "Government of Punjab"
- Bilingual toggle (EN / اردو) in header — when Urdu active, add dir="rtl" to html element
- Sentence case on all labels
- CNIC always formatted as 00000-0000000-0
- Session timeout warning modal at 25 min, auto-logout at 30 min

## Pages and components to build

### Layout (app/layout.tsx)
- GovHeader component: navy background, WWB logo circle (white circle with navy inner + gold border), title text, department officer name + avatar, language toggle
- GovNav component: royal blue background, nav items, active item has gold bottom border
- Sidebar for section navigation

### 1. Login page (app/login/page.tsx)
- Full government header at top (same navy style)
- Centered login card with WWB seal/logo
- Email + password fields
- "Government of Punjab — Authorised Access Only" disclaimer text
- Error handling for wrong credentials
- Connects to POST /api/auth/login

### 2. Dashboard (app/dashboard/page.tsx)
Stats row (4 cards):
  - Total Workers (blue number)
  - Verified (green number)  
  - Pending Review (amber number)
  - Flagged Records (red number)

Recent activity table showing last 20 worker registrations

Verification queue — list of pending verifications for the logged-in department

### 3. Workers list (app/workers/page.tsx)
- Search by name or CNIC (with debounce)
- Filter by: status, employer, district, department verification status
- Data table columns: Worker Name, CNIC, Employer, Job Title, EOBI No., Social Security, Status, Actions
- Pagination (25 per page)
- Export button (CSV download)
- RBAC: Police sees fewer columns than WWB admin (enforce via role from JWT)

### 4. Worker detail (app/workers/[id]/page.tsx)
- Full profile card with all 9 registration fields
- Department verification status grid (8 departments, each showing approved/pending/rejected)
- Verification action panel (for dept officers — approve/reject with remarks)
- Audit trail timeline at bottom
- Mock API status badges (shows when NADRA/EOBI was mock-verified)

### 5. Worker registration form (app/workers/new/page.tsx)
All 9 required fields:
  1. CNIC (with real-time format validation 00000-0000000-0)
  2. Full Name
  3. Job Title / Designation
  4. Date of Joining (date picker)
  5. Employer (searchable dropdown from businesses table)
  6. Pay Scale (PKR amount)
  7. Address (text area)
  8. Mode of Payment (radio: Bank / Cash) — if Bank, show bank name + account fields
  9. EOBI Number
  10. Social Security Number

CNIC field: on blur, call mock NADRA adapter and show verification badge inline.
NTN field on employer selection: auto-verify via mock FBR adapter.
Form validation: all fields required except bank fields (conditional).

### 6. Employers list (app/employers/page.tsx)
- List of all registered businesses
- Search by business name or NTN
- Columns: Business Name, NTN, Industry, District, Workers Count, Status
- Add new employer button

### 7. Employer registration (app/employers/new/page.tsx)
Fields: NTN, Business Name, Industry Type, Address, District, Contact Person, Contact Phone
NTN field: on blur, verify via mock FBR adapter

### 8. Verification queue (app/verification/page.tsx)
- Shows only records pending verification for the logged-in department
- Quick approve/reject with remarks
- Bulk action: approve selected
- Filter by entity type (worker/employer)

### 9. Reports page (app/reports/page.tsx)
- Workers by district (bar chart using recharts)
- Workers by industry sector (pie chart)
- Verification status breakdown per department (stacked bar)
- Monthly registration trend (line chart)
- Export reports as PDF (use window.print with print stylesheet)

## API integration
Create lib/api.ts with typed fetch wrapper:
- Auto-attach Authorization: Bearer header
- Auto-refresh token on 401
- Handle session expiry → redirect to login

## Components to create in components/
- GovHeader.tsx
- GovNav.tsx  
- StatusBadge.tsx (verified/pending/flagged/mock variants)
- WorkerCard.tsx
- DataTable.tsx (reusable with sorting + pagination)
- CnicInput.tsx (formatted input with NADRA mock verification)
- VerificationPanel.tsx
- AuditTimeline.tsx
- LanguageToggle.tsx (EN/UR with RTL support)
- SessionTimeoutModal.tsx

## RBAC enforcement
Every page checks the user's role from the JWT and:
- Hides columns the department cannot see
- Disables action buttons for read-only roles
- Redirects to /unauthorized if they navigate to a forbidden page
- The RBAC logic should come from the departments.js config (not hardcoded)

## Constraints
- Use shadcn/ui for base components (Button, Input, Select, Dialog, Table)
- Tailwind for all custom styling
- No inline styles
- All forms use react-hook-form + zod validation
- Loading skeletons on all data-fetching pages (not spinners)
- Empty state components on all list pages
- Error boundary on every page

When done, confirm: "Phase 2 complete — all 9 pages working with RBAC."
```

---

---

# PHASE 3 PROMPT — React Native Mobile App (Worker-Facing)

Paste after Phase 2 is complete.

---

```
Phases 1 and 2 are complete. Now build the React Native (Expo) mobile app for workers.

This app is for WORKERS only — to register themselves and view their own profile.
It is not for department officers (they use the web portal).

## Setup
- Expo SDK latest
- expo-router for navigation (file-based like Next.js)
- NativeWind for Tailwind-style styling
- React Query for data fetching + offline caching
- expo-sqlite for offline storage
- expo-secure-store for token storage (not AsyncStorage — security requirement)

## Screens

### (auth) group — unauthenticated
- login.tsx: Phone number input → OTP sent via SMS → OTP verification → logged in
  - Phone number must match CNIC registered phone
  - OTP is 6 digits, expires in 5 minutes
  - "Register instead?" link

- register.tsx: 
  Step 1: Enter CNIC → mock NADRA check → show name from NADRA (mocked)
  Step 2: Fill employment details (employer, job title, joining date, pay scale, payment mode, EOBI, SS number, address)
  Step 3: Phone number + OTP verification
  Step 4: Confirmation screen

### (app) group — authenticated
- index.tsx (Home/Dashboard):
  - Worker profile card at top (name, CNIC, employer)
  - Verification status row — 8 small department badges showing each dept's status
  - Quick stats: how many departments have verified

- profile.tsx:
  - Full profile with all 9 registration fields
  - Edit button (only allowed fields — address, phone, payment mode)
  - Government-style card design

- verification.tsx:
  - List of all 8 departments
  - Each shows: Verified / Pending / Rejected + date + remarks if rejected
  - Explanation of what each department does (in plain Urdu + English)

- documents.tsx:
  - Worker's digital "registration card"  
  - Shows: CNIC, Name, Employer, EOBI no., SS no., Joining date, WWB registration number
  - Print/share button (generates image)

### Language
- Default: Urdu (most workers are Urdu speakers)
- Toggle to English in settings
- All strings in a translations file: strings/ur.ts and strings/en.ts
- RTL layout when Urdu is active

## Offline support
- Cache worker's own profile in expo-sqlite on first load
- Show "last synced" timestamp
- Queue form submissions when offline, sync on reconnect
- Show offline banner when no internet

## Design
Apply the same Punjab Authority color system:
- Navy #003366 for headers/primary buttons
- Gold #C8A951 for accents
- Status colors for verification badges
- Card-based layout (not list)
- Large tap targets (min 48px height)
- Font: use system font (San Francisco on iOS, Roboto on Android)
- Urdu text: Noto Nastaliq Urdu loaded via expo-font

## API connection
- Connect to the same backend from Phase 1
- Base URL in .env: EXPO_PUBLIC_API_URL=http://localhost:3001
- Use React Query with 5-minute stale time
- Retry failed requests 3 times with exponential backoff

When done, confirm: "Phase 3 complete — mobile app running on Expo Go."
```

---

---

# PHASE 4 PROMPT — Mock API Integrations + Verification Workflows

Paste after Phase 3 is complete.

---

```
Phases 1-3 are complete. Now implement the full verification workflow and polish the mock API integrations.

## 1. Complete verification workflow (backend)

Create a verification service with this business logic:

- A worker is "fully verified" when ALL 8 departments have approved
- A worker is "partially verified" when 1-7 departments have approved
- A worker is "pending" when no department has acted
- A worker is "flagged" when ANY department has rejected

Auto-notification rules (mock SMS via sms.adapter):
- When a worker's record is approved by a department → SMS to worker
- When a worker's record is flagged by any department → SMS to worker + email to WWB admin
- When a new worker registers → SMS to their employer contact

New API endpoints:
POST /api/verifications/:entityType/:entityId
  Body: { department, status, remarks }
  Auth: dept_officer or wwb_admin only
  Action: Creates verification record, updates worker status, logs to audit_logs, triggers SMS

GET /api/verifications/:entityType/:entityId
  Returns all verification records for a worker/employer (with department names + officer names)

POST /api/workers/:id/nadra-check
  Runs mock NADRA CNIC verification
  Stores result in verifications table with department='NADRA_MOCK'
  Returns { status, mock: true, checkedAt }

POST /api/employers/:id/fbr-check
  Same for FBR NTN check

## 2. Polish mock adapters
Make mock responses more realistic:

nadra.adapter.js:
  - Return mock: { status, cnic, fullName (random Pakistani name), dob, district }
  - Add realistic 800ms delay

fbr.adapter.js:
  - Return: { ntn, businessName, registrationDate, activeStatus, taxCategory }

eobi.adapter.js:
  - Return: { eobiNumber, employeeName, employerId, contributionStatus, lastContributionDate }

sms.adapter.js (USE_MOCK=true):
  - Log to console: [SMS MOCK] To: +92XXX, Message: "..."
  - Return { sent: true, mock: true, messageId: 'mock_' + Date.now() }

## 3. Dashboard analytics endpoint
GET /api/analytics/summary
Returns:
{
  totalWorkers: number,
  totalEmployers: number,
  verificationStats: { verified, pending, flagged },
  byDistrict: [{ district, count }],
  byIndustry: [{ industry, count }],
  byDepartment: [{ department, verified, pending, rejected }],
  monthlyRegistrations: [{ month, count }] // last 12 months
}

## 4. Demo data enhancements
Update seed file to create:
- 8 department officer accounts (one per department) with passwords: Dept@123
- 1 WWB admin account: admin@wwb.punjab.gov.pk / Admin@123456
- 3 employer accounts
- Realistic distribution: 60% verified, 25% pending, 15% flagged
- Stagger created_at dates over last 12 months (for chart data)

## 5. Export features (backend)
GET /api/workers/export/csv
  - Query params: same filters as list endpoint
  - Returns CSV with all allowed fields for the requesting user's role
  - Excludes pay_scale for Police role

GET /api/reports/export/pdf-data
  - Returns structured JSON for frontend to render as PDF

When done, confirm: "Phase 4 complete — verification workflow and mock APIs working end-to-end."
```

---

---

# PHASE 5 PROMPT — Reports, Analytics + Demo Polish

Paste after Phase 4 is complete.

---

```
Final phase. Polish the system for government prototype demonstration.

## 1. Reports & analytics dashboard (frontend)

Update app/reports/page.tsx with full charts using recharts:

Chart 1 — Registration trend (line chart):
  Monthly worker registrations over last 12 months
  X-axis: month names, Y-axis: count, color: #003366

Chart 2 — Workers by district (horizontal bar chart):
  Show top 10 Punjab districts by worker count
  Color bars by verification rate (green high, amber medium, red low)

Chart 3 — Verification status by department (grouped bar):
  8 departments on X-axis
  3 bars per dept: Verified (green), Pending (amber), Rejected (red)

Chart 4 — Industry breakdown (pie chart):
  Top 8 industries, use distinct colors, show percentages

All charts:
  - Responsive (recharts ResponsiveContainer)
  - No animations (government style)
  - Legend below chart
  - Tooltip on hover showing exact numbers

## 2. Print-ready reports
Add print stylesheet (globals.css @media print):
  - Hide nav, sidebar, action buttons
  - Show full data table
  - Add "Government of Punjab — Confidential" header
  - Add print date footer
  - Break pages between sections

## 3. Worker digital ID card
In the mobile app documents.tsx screen:
  Generate a styled "registration card" as a View that can be captured with expo-view-shot:
  - WWB logo + "Government of Punjab" header (navy)
  - Worker photo placeholder (grey silhouette)
  - Name, CNIC, Employer, Job Title
  - EOBI number, Social Security number
  - WWB Registration number (WWB-YYYY-XXXXX format)
  - Verification status (number of departments verified)
  - Gold accent border
  - QR code (expo-qrcode-generator) encoding the worker's ID URL

## 4. Demo accounts page (admin only)
Create /admin/demo-accounts page showing:
  Table of all demo login credentials (email, password, role, department)
  Visible only to super_admin role
  "Reset demo data" button that re-runs the seed

## 5. Deployment setup

docker-compose.prod.yml:
  - Backend with NODE_ENV=production
  - Nginx reverse proxy serving Next.js + proxying /api to backend
  - Postgres with backups every 6 hours
  - Redis with persistence

GitHub Actions .github/workflows/deploy.yml:
  - On push to main: run tests, build Docker images, push to Azure Container Registry
  - Environment secrets for all env vars

## 6. Final polish checklist — implement all of these

[ ] Loading skeleton on every data-fetching page
[ ] Empty state illustration + text on all list pages  
[ ] Error boundary with "Something went wrong — contact IT support" message
[ ] 404 page with government styling
[ ] Unauthorized page (403) with department contact info
[ ] Session timeout modal (25 min warning, 30 min logout)
[ ] "Last updated" timestamp on all data cards
[ ] Breadcrumb navigation on all inner pages
[ ] Print button on Worker detail page
[ ] Success toast on every form submission
[ ] Confirmation dialog before any delete/flag action
[ ] Input field for search shows "Searching..." with debounce indicator
[ ] Mobile app: splash screen with WWB logo on navy background
[ ] Mobile app: offline banner when no internet

## 7. README.md (complete)
Write a complete README covering:
  - Project overview (what it is, who uses it)
  - Prerequisites
  - Local development setup (step by step)
  - Running with Docker
  - Demo accounts table
  - Mock API note (explain USE_MOCK_APIS)
  - Folder structure explanation
  - How to add a new department
  - Deployment guide

When done, run the full system and confirm: 
"Phase 5 complete — system ready for government prototype demonstration."
```

---

---

## QUICK REFERENCE: Prompt tips for Claude Code / Cursor

### Starting a new session mid-project
If you start a new Claude Code session and it doesn't have context, begin with:
```
I am continuing development of the Workers Welfare Board registry system.
The tech stack is: Next.js 14, Node.js/Express, PostgreSQL, React Native/Expo.
The backend is at /backend, frontend at /frontend, mobile at /mobile.
[Describe what was last completed and what you need next.]
```

### When Claude Code makes a mistake
```
That's not right. The government design system requires navy #003366 headers,
not dark gray. Also CNIC must always be formatted as 00000-0000000-0.
Please fix [specific component] to match the design spec.
```

### Requesting a specific screen
```
Build the [screen name] page. It must:
- Follow the Punjab Authority color theme (navy + gold)
- Show the GovHeader component at top
- Use the StatusBadge component for verification status
- Fetch data from GET /api/[endpoint]
- Handle loading (skeleton), empty state, and error states
- Enforce RBAC: [role] can see [columns], [role] cannot see [columns]
```

### When you need a specific component
```
Create a reusable <WorkerSearchBar /> component that:
- Searches by name or CNIC with 300ms debounce
- Shows a dropdown of matching workers (max 5)
- Formats CNIC in 00000-0000000-0 style
- Calls GET /api/workers/search?q=[query]
- Follows the government design system
```

---

## ESTIMATED TIMELINE

| Phase | Content | Time |
|---|---|---|
| Phase 1 | Backend + DB + Auth | 3–5 days |
| Phase 2 | Web admin portal | 5–7 days |
| Phase 3 | Mobile app | 4–5 days |
| Phase 4 | Verification + mock APIs | 2–3 days |
| Phase 5 | Reports + demo polish | 2–3 days |
| **Total** | **Full prototype** | **~3–4 weeks** |

---

*Workers Welfare Board — Industrial Worker Registry System*
*Punjab Government Prototype · Prepared for Govt of Punjab Approval Process*
