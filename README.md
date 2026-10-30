# AgriRent — Agricultural Equipment Rental and Farm Supplies Platform

## Problem Statement

AgriRent addresses a common challenge for smallholder farmers in Rwanda and across Africa: the high cost of agricultural equipment. Many farmers cannot afford to buy expensive tools such as irrigation pumps, tillers, and sprayers for occasional use. At the same time, farmers and cooperatives often own equipment that sits idle between farming seasons. AgriRent bridges this gap by enabling equipment sharing and helping farmers locate nearby sellers of tools and fertilizers, making farming more affordable and efficient.

## Team Members

- Clarisse Mukayiranga - Team Member
- Solace fadhali Aziza - Team Member
- Justine Neema - Team Member
- Emery Barame - Project Lead

## Team Task Sheet
https://docs.google.com/spreadsheets/d/1tZTdxUlUnP9lVVAZHRMHa1DLS_oNjTHw0IlKVji9c68/edit?usp=sharing

## Project Overview

AgriRent is a web-based agricultural marketplace and linkage platform that connects farmers who need agricultural equipment with farmers and cooperatives that have equipment available for rent. In addition to equipment rentals, the platform includes a farm supplies section to help farmers locate nearby agricultural supply shops offering machinery, fertilizers, and other farm inputs.

The platform simplifies the rental process by allowing farmers to search for tools by location, compare options, send booking requests, and coordinate payment and collection directly with equipment owners. By promoting equipment sharing and improving access to farm supplies, AgriRent helps reduce costs for smallholder farmers while creating income opportunities for equipment owners.

## Value Proposition

- **For Farmers:** Access affordable machinery and farm inputs without the high upfront cost of ownership.
- **For Equipment Owners:** Unlock income from underutilized equipment and create a dependable rental marketplace.
- **For Local Supply Shops:** Increase discoverability among nearby farmers who need inputs, tools, and services.
- **For the Agricultural Ecosystem:** Promote resource sharing, efficiency, and stronger rural value chains.

### Target Users

- **Smallholder Farmers** – Farmers who need access to agricultural equipment for short-term use or want to find nearby seeds and fertilizers.
- **Equipment Owners & Cooperatives** – Farmers, groups, or cooperatives who own agricultural equipment and want to rent it out to generate income.
- **Agricultural Supply Shops** – Local shops that sell seeds, fertilizers, and farm inputs and want to be discoverable to nearby farmers.

### Core Features

- **Equipment Rental Marketplace** – Browse and search for agricultural equipment by type and location with rental prices and availability.
- **Booking Requests** – Farmers can request to rent equipment for specific dates, with owners able to accept or reject requests.
- **Farm Supplies Directory** – Find nearby shops selling seeds, fertilizers, and other farm inputs with location, prices, and contact details.
- **Admin Tool Approval** – Administrators review, approve, or reject equipment submissions before they appear on the public listing.
- **User Roles** – Role-based access for farmers, equipment owners/cooperatives, and administrators.
- **Request & Status Tracking** – Track rental requests and payment status (recorded, not processed in v1).

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: TypeScript, Vite, React, Tailwind CSS
- **Database**: PostgreSQL (NeonDB / local Docker)
- **ORM**: Prisma
- **Authentication**: JWT (Access/Refresh tokens), bcryptjs
- **Validation**: Zod
- **Containerization**: Docker, Docker Compose
- **CI**: GitHub Actions

## Project Structure

```text
DevOps-Assignment/
├── Dockerfile                        # Multi-stage production container build
├── docker-compose.yml                # Orchestrates app + PostgreSQL services
├── .dockerignore                     # Excludes node_modules, dist, .env from build context
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI pipeline: lint, test, build, Docker build
├── README.md
├── LICENSE
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── jest.config.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── server.ts
│       ├── config/
│       │   └── prisma.ts
│       ├── controllers/
│       │   ├── adminEquipmentController.ts
│       │   ├── auth.controller.ts
│       │   └── equipmentController.ts
│       ├── middleware/
│       │   ├── adminAuth.ts
│       │   └── auth.middleware.ts
│       └── routes/
│           ├── adminRoutes.ts
│           ├── auth.routes.ts
│           └── equipmentRoutes.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── tailwind.config.js
    ├── eslint.config.ts
    ├── stylelint.config.mjs
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── api/
        │   └── axios.ts
        ├── components/
        │   ├── AddEquipmentForm.tsx
        │   ├── EquipmentCard.tsx
        │   └── SiteHeader.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── pages/
        │   ├── AdminPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── EquipmentListingPage.tsx
        │   ├── LandingPage.tsx
        │   ├── Login.tsx
        │   ├── ProfilePage.tsx
        │   └── Register.tsx
        ├── routes/
        │   └── ProtectedRoute.tsx
        ├── services/
        │   ├── adminService.ts
        │   ├── equipmentService.ts
        │   └── equipmentService.test.ts
        └── types/
            └── equipment.ts
```

---

## Getting Started

### Prerequisites

- Node.js v18+ or v20+
- npm
- PostgreSQL database (NeonDB connection string, or run locally via Docker Compose)

### Option A — Run with Docker Compose (recommended)

This starts the backend API, frontend static server, and a local PostgreSQL database in one command.

**1. Copy and fill in environment variables**

```bash
cp .env.example .env
```

Open `.env` and set the following:

```env
DATABASE_URL=postgresql://postgres:yourpassword@db:5432/agrirent
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=agrirent
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

**2. Build and start all services**

```bash
docker-compose up --build
```

**3. Run database migrations and seed data (first time only)**

In a second terminal while the containers are running:

```bash
docker-compose exec app sh -c "cd /app/backend && npx prisma migrate deploy && npx prisma db seed"
```

**4. Open the application**

| Service | URL |
|---|---|
| Frontend | http://localhost:4173 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

**5. Stop the services**

```bash
docker-compose down
```

To also remove the database volume:

```bash
docker-compose down -v
```

---

### Option B — Run locally without Docker

**1. Clone the repository**

```bash
git clone https://github.com/yankeedev/DevOps-Assignment.git
cd DevOps-Assignment
```

**2. Backend setup**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

**3. Frontend setup**

```bash
cd frontend
npm install
npm run dev
```

**4. Open the application**

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3002 |

---

## Default Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@agrirent.com | Dev@Seed2024! |
| Farmer | jean.claude@example.com | Dev@Seed2024! |
| Farmer | alice.uwase@example.com | Dev@Seed2024! |

- Log in as **Admin** to access the tool approval page at `/admin`
- Log in as a **Farmer** to browse equipment and submit rental requests

---

## Containerization

### Dockerfile

The `Dockerfile` uses a **three-stage multi-stage build**:

| Stage | Base Image | Purpose |
|---|---|---|
| `frontend-build` | `node:22-bookworm-slim` | Installs frontend dependencies and builds the Vite production bundle |
| `backend-build` | `node:22-bookworm-slim` | Installs backend dependencies, generates Prisma client, compiles TypeScript |
| `production` | `node:22-bookworm-slim` | Copies only compiled artifacts — no source code or dev dependencies in the final image |

Security practices applied:
- Non-root system user (`app`) created and used at runtime
- `--no-install-recommends` keeps the image lean
- Health check on `/health` endpoint using `curl`
- Only production artifacts copied into the final stage

### Docker Compose

`docker-compose.yml` defines two services:

- **app** — builds from the `Dockerfile`, serves the backend on port `5000` and the frontend on port `4173`, depends on `db` being healthy before starting
- **db** — official `postgres:16` image with a named volume (`postgres_data`) for data persistence and a `pg_isready` health check

Both services use `restart: unless-stopped` and environment variables are passed in from the host `.env` file — no secrets are hardcoded.

### .dockerignore

Excludes `node_modules`, `dist`, `build`, `.env` files, `.git`, logs, and editor directories from the Docker build context to keep builds fast and prevent secrets from leaking into the image.

---

## CI Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml`.

### Triggers

| Event | Condition |
|---|---|
| `push` | All branches **except** `main` |
| `pull_request` | Targeting `main` |

### Pipeline Steps

| Step | What it does | Fails pipeline if… |
|---|---|---|
| Checkout code | Checks out the repository | — |
| Set up Node 20 | Installs Node with npm cache for both workspaces | — |
| Install backend dependencies | `npm ci` in `backend/` | Install fails |
| Lint backend | ESLint on `backend/src` | Any lint error |
| Install frontend dependencies | `npm ci` in `frontend/` | Install fails |
| Lint frontend TypeScript & CSS | ESLint + Stylelint on `frontend/src` | Any lint or style error |
| Run frontend tests | `npm test` in `frontend/` | Any test fails |
| Build frontend | `npm run build` in `frontend/` | Build fails |
| Build backend | `npm run build` in `backend/` | Build fails |
| Build Docker image | `docker build -t my-app:ci .` | Docker build fails |

The pipeline enforces that **all steps must pass** before a pull request can be merged into `main`.

---

## Branch Protection Rules & Governance

Branch protection is enforced on the `main` branch.

| Protection Setting | Configuration | Purpose |
| :--- | :--- | :--- |
| Require a pull request before merging | Enabled (1 approval required) | Blocks direct pushes to `main`. All changes must be peer-reviewed. |
| Dismiss stale pull request approvals | Enabled | Invalidates prior reviews when new commits are pushed, ensuring the final merged code is always reviewed. |
| Require status checks to pass before merging | Enabled — CI pipeline required | All CI checks (lint, tests, Docker build) must pass before merging. |
| Require branches to be up to date before merging | Enabled | Ensures feature branches are tested against the latest `main` before merging. |
| Require conversation resolution before merging | Enabled | All review comments must be resolved before a PR can be merged. |

### Why These Rules Matter

1. **Quality Assurance:** The CI pipeline catches broken builds, lint errors, and failing tests before they reach `main`.
2. **Knowledge Sharing:** Peer reviews keep all team members informed about changes and architectural decisions.
3. **Preventing Integration Drift:** Requiring branches to be up to date prevents merge conflicts and integration bugs.

---

## Task Allocation

### Formative 1

| Task | Assigned To | Due Date |
| :-- | :-- | :-- |
| Select project idea and define the problem, target users, and African context | Clarisse Mukayiranga | 19/10/2026 |
| Write the project description and initial README.md | Solace fadhali Aziza | 19/10/2026 |
| Create the GitHub repository and organize the project structure | Justine Neema | 20/10/2026 |
| Create the GitHub Projects Kanban board with at least 8–10 tasks | Emery Barame | 21/10/2026 |
| Develop the initial application and implement one working core feature | Solace fadhali Aziza | 21/10/2026 |
| Create a comprehensive .gitignore file | Clarisse Mukayiranga | 22/10/2026 |
| Configure branch protection rules for the main branch | Emery Barame | 22/10/2026 |
| Add a LICENSE file and configure repository settings | Emery Barame | 22/10/2026 |
| Test the application and document local setup instructions | Justine Neema | 23/10/2026 |

### Formative 2

| Task | Assigned To | Due Date |
| :-- | :-- | :-- |
| Write multi-stage Dockerfile with non-root user and health check | Justine Neema | 29/10/2026 |
| Write docker-compose.yml PostgreSQL services | Solace fadhali Aziza | 30/10/2026 |
| Write docker-compose.yml app services | Clarisse Mukayiranga | 30/10/2026 |
| Create .dockerignore file | Justine Neema | 29/10/2026 |
| Implement GitHub Actions CI pipeline (lint, test, build, Docker build) | Emery Barame | 28/10/2026 |
| Update README with Docker and CI documentation | Clarisse Mukayiranga | 30/10/2026 |

---

## Links

- [GitHub Repository](https://github.com/yankeedev/DevOps-Assignment.git)
- [Project Board](https://github.com/users/yankeedev/projects/2)

## License

This project is licensed under the [MIT License](LICENSE).
