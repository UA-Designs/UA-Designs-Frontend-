# UA Designs PMS Frontend

A modern React-based Project Management System frontend built with TypeScript, Vite, and Ant Design. Implements PMBOK knowledge areas with role-based access control, real-time analytics, and a dark-themed UI.

## Quick Start

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Backend API** running at `http://localhost:5000` (see [Backend Setup](#backend-api))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/UA-Designs/UA-Designs-Frontend-.git
cd UA-Designs-Frontend-

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Start dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Environment Variables

Configure via `.env` file in the project root. All variables are prefixed with `VITE_`:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_APP_NAME` | `UA Designs PMS` | Application display name |
| `VITE_APP_VERSION` | `1.0.0` | Application version |
| `VITE_PUSHER_KEY` | *(empty)* | Pusher key for real-time features |
| `VITE_PUSHER_CLUSTER` | `us2` | Pusher cluster region |

Vite loads env files in this priority order:
1. `.env.local` (highest — git-ignored)
2. `.env.development.local`
3. `.env.development`
4. `.env` (lowest)

### Backend API

The dev server proxies `/api` requests to `http://localhost:5000`. Make sure the backend is running before using the app. Contact the backend team for API access and credentials.

## Available Scripts

```bash
# Development
npm run dev             # Start Vite dev server on port 5173
npm start               # Alias for dev

# Building
npm run build           # Production build (output: dist/)
npm run build:check     # TypeScript check + production build
npm run preview         # Preview the production build locally

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier format
npm run format:check    # Prettier check
npm run type-check      # TypeScript type checking (no emit)
npm run check-all       # Run type-check + lint + format:check
```

## Project Structure

```
src/
├── components/
│   ├── Charts/            # CostVarianceChart, ProjectGanttChart, RiskMatrix
│   ├── common/            # ProjectCreationModal, ProjectSelector
│   ├── Dashboard/         # QuickActions, RecentActivities
│   ├── Layout/            # App shell with sidebar navigation
│   ├── Logo/              # Branding component
│   ├── rbac/              # <Can> permission gate component
│   ├── Schedule/          # GanttChart
│   └── ui/                # TierBadge, shared UI primitives
├── contexts/
│   ├── AuthContext.tsx     # Auth state, login/logout, token management
│   ├── NotificationContext.tsx
│   └── ProjectContext.tsx  # Active project selection & data
├── hooks/
│   └── usePermissions.ts  # RBAC permission hook
├── lib/
│   └── rbac.ts            # Role/permission definitions
├── pages/
│   ├── Analytics/         # Overview + per-project analytics with KPIs
│   ├── AuditLog/          # System audit trail
│   ├── Auth/              # Login, Register, ForgotPassword
│   ├── Dashboard/         # Main dashboard
│   ├── PMBOK/
│   │   ├── Cost/          # Budget & expense tracking
│   │   ├── Resources/     # Team & resource allocation
│   │   ├── Risk/          # Risk register & matrix
│   │   ├── Schedule/      # Gantt chart & milestones
│   │   └── Stakeholders/  # Stakeholder management
│   ├── Profile/           # User profile
│   ├── Projects/          # Project listing & CRUD
│   ├── Reports/           # Export & reporting
│   ├── Settings/          # App settings
│   └── Users/             # User management (admin)
├── services/              # Axios API service layer
│   ├── api.ts             # Base Axios instance & interceptors
│   ├── analyticsService.ts
│   ├── auditService.ts
│   ├── authService.ts
│   ├── costService.ts
│   ├── dashboardService.ts
│   ├── projectService.ts
│   ├── resourceService.ts
│   ├── riskService.ts
│   ├── scheduleService.ts
│   └── stakeholderService.ts
├── styles/
│   ├── global.css         # Global styles
│   └── theme.ts           # Ant Design theme config
├── types/
│   ├── index.ts           # Core type definitions
│   └── analytics.ts       # Analytics-specific types
└── utils/
    └── formatCurrency.ts  # Currency formatting helpers
```

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| UI Library | Ant Design 5 |
| State Management | React Context API |
| Routing | React Router DOM 6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Date Handling | Day.js |
| Export | FileSaver + SheetJS (xlsx) |
| Code Quality | ESLint + Prettier + TypeScript strict |

## Architecture

### State Management

The app uses **React Context** for global state:

- **AuthContext** — user session, JWT token management, login/logout
- **ProjectContext** — active project selection, project data
- **NotificationContext** — toast notifications

### API Layer

All API calls go through the Axios instance in `services/api.ts`, which handles:
- Base URL configuration from env
- JWT token injection via request interceptors
- 401 response handling (auto-logout on token expiry)

Individual service files (`authService`, `projectService`, etc.) provide typed methods for each API domain.

### RBAC

Role-based access control is implemented with:
- `lib/rbac.ts` — role and permission definitions
- `hooks/usePermissions.ts` — hook to check permissions
- `components/rbac/Can.tsx` — declarative permission gate component
- `ProtectedRoute` — route-level access control with admin-only support

### Routing

All authenticated routes are wrapped in `<ProtectedRoute>` inside the `<Layout>` shell. Public routes (login, register, forgot-password) render outside the layout. Admin routes (users, audit log) require elevated access.

## Features

- **Dashboard** — project overview, KPIs, recent activity, quick actions
- **Project Management** — create, edit, and track projects
- **PMBOK Areas** — schedule (Gantt), cost/budget, resources, risk matrix, stakeholders
- **Analytics** — per-project and global analytics with charts and KPI grids
- **Audit Log** — system-wide activity tracking
- **User Management** — admin user CRUD with role assignment
- **Reports & Export** — data export to Excel/CSV
- **Authentication** — JWT-based login/register with forgot password flow
- **RBAC** — granular role-based access control
- **Dark Theme** — custom dark UI with neon green accents

## Deployment

```bash
# Build for production
npm run build

# Preview locally
npm run preview
```

The build outputs to `dist/` with optimized JS bundles, minified CSS, and source maps. Deploy to any static hosting provider (Netlify, Vercel, AWS S3 + CloudFront, Nginx, etc.).

For production, set `VITE_API_BASE_URL` to your production API endpoint.

## Troubleshooting

| Problem | Solution |
|---|---|
| Build fails with TS errors | Run `npm run build` (skips type-check) or fix with `npm run type-check` |
| Lint errors | `npm run lint:fix` |
| Formatting issues | `npm run format` |
| Dependency issues | `rm -rf node_modules package-lock.json && npm install` |
| Port 5173 in use | `npx kill-port 5173` or change port in `vite.config.ts` |
| API connection refused | Ensure backend is running on `http://localhost:5000` |

## Contributing

1. Create a feature branch from `main`
2. Make changes following existing code patterns
3. Run `npm run check-all` before committing
4. Commit with descriptive messages
5. Open a pull request

## License

Proprietary — UA Designs. All rights reserved.
