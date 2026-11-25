# AgriRent — Agricultural Equipment Rental and Farm Supplies Platform

## Live Application

| Service | URL |
| :-- | :-- |
| Live Application | http://AgriRent-dev-alb-1676444296.eu-north-1.elb.amazonaws.com |
| GitHub Repository | https://github.com/yankeedev/DevOps-Assignment |
| Project Board | https://github.com/users/yankeedev/projects/2 |

---

## Problem Statement

AgriRent addresses a common challenge for smallholder farmers in Rwanda and across Africa: the high cost of agricultural equipment. Many farmers cannot afford to buy expensive tools such as irrigation pumps, tillers, and sprayers for occasional use. At the same time, farmers and cooperatives often own equipment that sits idle between farming seasons. AgriRent bridges this gap by enabling equipment sharing and helping farmers locate nearby sellers of tools and fertilizers, making farming more affordable and efficient.

---

## Team Members

| Name | Role |
| :-- | :-- |
| Emery Barame | Project Lead |
| Clarisse Mukayiranga | Team Member |
| Solace Fadhali Aziza | Team Member |
| Justine Neema | Team Member |

---

## Task Sheets

| Formative | Link |
| :-- | :-- |
| Formative 1 | https://docs.google.com/spreadsheets/d/1tZTdxUlUnP9lVVAZHRMHa1DLS_oNjTHw0IlKVji9c68/edit?usp=sharing |
| Formative 2 | https://docs.google.com/spreadsheets/d/11gEWFBl_mSycFvmIgQEmXsUkldVZskkwJhc8Rxrn1Go/edit?usp=sharing |
| Formative 3 | https://docs.google.com/spreadsheets/d/1UcO-PbGTsY3aXsKOiB3KMgWDYDFoRL5UgZkWCIFWEeU/edit?usp=sharing |
| Summative | https://docs.google.com/spreadsheets/d/1Ul7SbRmYRxBScVwKs4Nn3pSwAj8iswq5HlnM9nXLD5w/edit?usp=sharing |

---

## Project Overview

AgriRent is a web-based agricultural marketplace that connects farmers who need agricultural equipment with farmers and cooperatives that have equipment available for rent. The platform also includes a farm supplies directory to help farmers locate nearby shops offering seeds, fertilizers, and other farm inputs.

### Value Proposition

- **For Farmers:** Access affordable machinery and farm inputs without the high upfront cost of ownership.
- **For Equipment Owners:** Unlock income from underutilized equipment and create a dependable rental marketplace.
- **For Local Supply Shops:** Increase discoverability among nearby farmers who need inputs, tools, and services.
- **For the Agricultural Ecosystem:** Promote resource sharing, efficiency, and stronger rural value chains.

### Target Users

- **Smallholder Farmers** — Need access to agricultural equipment for short-term use or want to find nearby seeds and fertilizers.
- **Equipment Owners & Cooperatives** — Own agricultural equipment and want to rent it out to generate income.
- **Agricultural Supply Shops** — Sell seeds, fertilizers, and farm inputs and want to be discoverable to nearby farmers.

### Core Features

- **Equipment Rental Marketplace** — Browse and search for agricultural equipment by type and location with rental prices and availability.
- **Booking Requests** — Farmers can request to rent equipment for specific dates, with atomic conflict prevention ensuring no double-bookings.
- **Reviews** — Users with completed bookings can leave star ratings and written reviews on equipment.
- **Farm Supplies Directory** — Find nearby shops selling seeds, fertilizers, and other farm inputs with location, prices, and contact details.
- **Admin Tool Approval** — Administrators review, approve, or reject equipment submissions before they appear on the public listing.
- **User Roles** — Role-based access for farmers, equipment owners/cooperatives, shop owners, and administrators.
- **Request & Status Tracking** — Track rental requests and payment status.

---

## Technology Stack

| Layer | Technology |
| :-- | :-- |
| Backend | Node.js, Express.js, TypeScript |
| Frontend | TypeScript, Vite, React, Tailwind CSS |
| Database | PostgreSQL (NeonDB / local Docker / AWS RDS) |
| ORM | Prisma |
| Authentication | JWT (Access/Refresh tokens), bcryptjs |
| Validation | Zod |
| Containerization | Docker, Docker Compose |
| Container Registry | Amazon ECR |
| CI/CD | GitHub Actions |
| Infrastructure | Terraform (AWS) |
| Configuration Management | Ansible |
| Security Scanning | Trivy (container), tfsec (IaC), npm audit |

---

## Architecture Diagram

![AgriRent AWS Architecture](https://drive.google.com/file/d/1ZJbtwCyrAnSma8UnE-mE9hMgp8xEQ7Lo/view?usp=sharing)

### Architecture Overview

The production environment runs entirely on AWS inside a custom VPC (`10.0.0.0/16`) split across two availability zones.

**Public subnets** contain:
- Application Load Balancer — receives all public HTTP traffic on port 80
- Bastion Host EC2 — SSH jump box, accepts port 22 from the admin IP only
- NAT Gateway — allows private subnet resources to reach the internet for outbound calls

**Private subnets** contain:
- App EC2 instance — runs the Docker Compose stack (backend on port 6000, frontend on port 4174), not directly reachable from the internet
- Amazon RDS PostgreSQL — database, only accepts port 5432 from the App EC2 security group

**Amazon ECR** stores the Docker image. The App EC2 instance pulls images using an IAM instance role — no credentials are hardcoded.

**Security Groups:**

| Security Group | Inbound Rules |
| :-- | :-- |
| `sg-alb` | HTTP 80 from `0.0.0.0/0` |
| `sg-bastion` | SSH 22 from admin IP only |
| `sg-app` | SSH 22 from `sg-bastion`, ports 5000+4173 from `sg-alb` |
| `sg-rds` | PostgreSQL 5432 from `sg-app` only |

**CI/CD flow:** GitHub Actions runs on every PR (lint → test → security scan → Docker build). On merge to `main`, the CD pipeline builds and pushes the image to ECR, then runs the Ansible playbook via the Bastion Host to deploy the new image on the App EC2 instance.

---

## Project Structure

```text
DevOps-Assignment/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: lint, test, security scan, Docker build
│       └── cd.yml          # CD: build, push to ECR, deploy via Ansible
├── ansible/
│   ├── ansible.cfg
│   ├── site.yml            # Main orchestration playbook
│   ├── requirements.yml
│   ├── inventory/
│   │   └── hosts.ini
│   ├── group_vars/
│   │   └── all/
│   │       ├── vars.yml    # Non-secret defaults
│   │       └── vault.yml   # Encrypted secrets (Ansible Vault)
│   └── roles/
│       ├── common/         # OS validation, baseline packages
│       ├── docker/         # Docker Engine + Compose plugin
│       ├── security/       # firewalld, SSH hardening, fail2ban
│       └── app_deploy/     # .env render, docker-compose up, health check
├── terraform/
│   ├── main.tf             # EC2 instances, RDS, ECR, IAM
│   ├── network.tf          # VPC, subnets, IGW, NAT Gateway, ALB
│   ├── security.tf         # Security Groups
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   └── terraform.tfvars.example
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       └── routes/
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── types/
├── .dockerignore
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+ or v20+
- npm
- PostgreSQL database (NeonDB connection string, or run locally via Docker Compose)

### Option A — Run with Docker Compose (recommended)

**1. Copy and fill in environment variables**

```bash
cp .env.example .env
```

Open `.env` and set:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/agrirent
APP_IMAGE=agrirent:local
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

**2. Build and start all services**

```bash
docker build -t agrirent:local .
APP_IMAGE=agrirent:local docker compose up -d
```

**3. Run database migrations and seed data (first time only)**

```bash
# Ensure DATABASE_URL points to your local or external PostgreSQL instance.
docker compose exec app sh -c "cd /app/backend && npx prisma db push && npx prisma db seed"
```

**4. Open the application**

| Service | URL |
| :-- | :-- |
| Frontend | http://localhost:4173 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

**5. Stop the services**

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
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
| :-- | :-- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |

---

## Default Accounts (after seeding)

| Role | Email | Password |
| :-- | :-- | :-- |
| Admin | admin@agrirent.com | Dev@Seed2024! |
| Farmer | jean.claude@example.com | Dev@Seed2024! |
| Farmer | alice.uwase@example.com | Dev@Seed2024! |

- Log in as **Admin** to access the tool approval page at `/admin`
- Log in as a **Farmer** to browse equipment and submit rental requests

---

## Containerization

### Dockerfile

The `Dockerfile` uses a three-stage multi-stage build:

| Stage | Base Image | Purpose |
| :-- | :-- | :-- |
| `frontend-build` | `node:22-bookworm-slim` | Installs frontend dependencies and builds the Vite production bundle |
| `backend-build` | `node:22-bookworm-slim` | Installs backend dependencies, generates Prisma client, compiles TypeScript |
| `production` | `node:22-bookworm-slim` | Copies only compiled artifacts — no source code or dev dependencies in the final image |

Security practices applied:
- Non-root system user (`app`) created and used at runtime
- `--no-install-recommends` keeps the image lean
- Health check on `/health` endpoint using `curl`
- Only production artifacts copied into the final stage

### Docker Compose

`docker-compose.yml` defines an `app` service plus Prometheus, Grafana, and node-exporter services:

- **app** — builds from or pulls the Docker image, serves the backend on port `6000` and the frontend on port `4174`
- **prometheus** — scrapes application, Prometheus, and node-exporter metrics
- **grafana** — provides the monitoring dashboard on port `3000`
- **node-exporter** — exposes host metrics for Prometheus

Docker Compose persists Grafana and Prometheus data in named volumes. Application configuration is supplied through environment variables rather than secrets committed to the repository.

### .dockerignore

Excludes `node_modules`, `dist`, `build`, `.env` files, `.git`, logs, and editor directories from the Docker build context to keep builds fast and prevent secrets from leaking into the image.

---

## CI Pipeline

The CI pipeline is defined in `.github/workflows/ci.yml`.

### Triggers

| Event | Condition |
| :-- | :-- |
| `push` | All branches except `main` and `dev` |
| `pull_request` | Targeting `main` or `dev` |

### Pipeline Steps

| Step | What it does | Fails pipeline if… |
| :-- | :-- | :-- |
| Checkout code | Checks out the repository | — |
| Set up Node 20 | Installs Node with npm cache | — |
| Install dependencies | `npm ci` in each workspace | Install fails |
| Dependency audit | `npm audit --audit-level=high` | High or critical vulnerability found |
| Lint backend | ESLint on `backend/src` | Any lint error |
| Lint frontend | ESLint + Stylelint on `frontend/src` | Any lint or style error |
| Run frontend tests | `npm test` in `frontend/` | Any test fails |
| Build frontend | `npm run build` in `frontend/` | Build fails |
| Build backend | `npm run build` in `backend/` | Build fails |
| Build Docker image | `docker build -t my-app:ci .` | Docker build fails |
| Trivy container scan | Scans built image for CRITICAL/HIGH CVEs | Any unfixed critical/high CVE found |
| tfsec IaC scan | Scans `terraform/` for misconfigurations | Any tfsec finding |

---

## CD Pipeline

The CD pipeline is defined in `.github/workflows/cd.yml`.

### Trigger

Runs only when a pull request is **merged** into `main`.

### Pipeline Jobs

| Job | What it does |
| :-- | :-- |
| `check` | Re-runs lint, audit, tests, and build for both workspaces |
| `iac_scan` | Runs tfsec against the `terraform/` directory |
| `build_scan_push` | Builds Docker image, runs Trivy scan (CRITICAL only, exits on finding), pushes image and `latest` tag to Amazon ECR |
| `deploy` | Installs Ansible, configures SSH via Bastion Host, writes vault password, runs `ansible-playbook site.yml` to deploy the new image on the App EC2 instance |

The `deploy` job targets the `production` GitHub environment, which can be configured with required reviewers for an additional manual gate before production deployment.

---

## Infrastructure as Code (Terraform)

Terraform configuration lives in `terraform/`. It provisions the full AWS environment.

### Resources Provisioned

| Resource | Description |
| :-- | :-- |
| VPC | Custom VPC with CIDR `10.0.0.0/16` |
| Public Subnets | Two subnets across two AZs for ALB, Bastion, NAT Gateway |
| Private Subnets | Two subnets across two AZs for App EC2 and RDS |
| Internet Gateway | Enables public subnet internet access |
| NAT Gateway | Enables private subnet outbound internet access |
| Bastion Host EC2 | SSH jump box in public subnet |
| App EC2 Instance | Runs Docker Compose stack in private subnet |
| Application Load Balancer | Receives public HTTP traffic, forwards to App EC2 |
| Amazon RDS PostgreSQL | Managed database in private subnet, not publicly accessible |
| Amazon ECR | Private container registry for Docker images |
| Security Groups | `sg-alb`, `sg-bastion`, `sg-app`, `sg-rds` |
| IAM Instance Role | Grants App EC2 read access to ECR without hardcoded credentials |

### Quick Start

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

See `terraform/README.md` for full variable reference and operational notes.

---

## Configuration Management (Ansible)

Ansible configuration lives in `ansible/`. The playbook configures the App EC2 instance and deploys the application.

### Playbook Roles

| Role | What it does |
| :-- | :-- |
| `common` | Validates target OS, installs baseline packages, starts `firewalld` |
| `docker` | Installs Docker Engine and Compose plugin, configures log rotation, adds user to `docker` group |
| `security` | Opens firewall ports, applies SSH hardening (disables password auth and root login), installs `fail2ban` |
| `app_deploy` | Renders `.env` from vault secrets, copies `docker-compose.yml`, runs `docker compose up`, waits for `/health` to return HTTP 200 |

### Run the Playbook

```bash
cd ansible
ansible-galaxy install -r requirements.yml
ansible-playbook site.yml
```

Secrets are stored in `group_vars/all/vault.yml` encrypted with Ansible Vault. The vault password file is expected at `~/.ansible_vault_pass`.

See `ansible/README.md` for full operational reference.

---

## DevSecOps

Security scanning is integrated into both the CI and CD pipelines and fails the build on findings.

| Scan | Tool | Scope | Fails on |
| :-- | :-- | :-- | :-- |
| Container image scan | Trivy | Built Docker image | CRITICAL or HIGH unfixed CVEs (CI), CRITICAL only (CD) |
| IaC scan | tfsec | `terraform/` directory | Any tfsec finding |
| Dependency audit | npm audit | `backend/` and `frontend/` | High or critical severity |

---

## Branch Protection Rules & Governance

Branch protection is enforced on the `main` branch.

| Protection Setting | Configuration | Purpose |
| :-- | :-- | :-- |
| Require a pull request before merging | Enabled (1 approval required) | Blocks direct pushes to `main`. All changes must be peer-reviewed. |
| Dismiss stale pull request approvals | Enabled | Invalidates prior reviews when new commits are pushed. |
| Require status checks to pass before merging | Enabled — CI pipeline required | All CI checks must pass before merging. |
| Require branches to be up to date before merging | Enabled | Ensures feature branches are tested against the latest `main`. |
| Require conversation resolution before merging | Enabled | All review comments must be resolved before a PR can be merged. |

---

## Observability

The backend exposes a health check endpoint at `GET /health` that returns HTTP 200 when the server is running. This endpoint is used by:

- Docker Compose `healthcheck` — restarts the container if the endpoint stops responding
- Ansible `app_deploy` role — waits for HTTP 200 before marking a deployment successful
- AWS ALB target group health check — removes the instance from rotation if the check fails

To check application health manually:

```bash
curl http://localhost:5000/health
```

To inspect container logs on the production server:

```bash
ssh -i ~/.ssh/AgriRent-key.pem ec2-user@<bastion-ip>
ssh ec2-user@<app-private-ip>
cd /opt/agrirent && docker compose logs --tail=200
```

---

## Task Allocation

### Formative 1

| Task | Assigned To | Due Date |
| :-- | :-- | :-- |
| Select project idea and define the problem, target users, and African context | Clarisse Mukayiranga | 19/10/2026 |
| Write the project description and initial README.md | Solace Fadhali Aziza | 19/10/2026 |
| Create the GitHub repository and organize the project structure | Justine Neema | 20/10/2026 |
| Create the GitHub Projects Kanban board with at least 8–10 tasks | Emery Barame | 21/10/2026 |
| Develop the initial application and implement one working core feature | Solace Fadhali Aziza | 21/10/2026 |
| Create a comprehensive .gitignore file | Clarisse Mukayiranga | 22/10/2026 |
| Configure branch protection rules for the main branch | Emery Barame | 22/10/2026 |
| Add a LICENSE file and configure repository settings | Emery Barame | 22/10/2026 |
| Test the application and document local setup instructions | Justine Neema | 23/10/2026 |

### Formative 2

| Task | Assigned To | Due Date |
| :-- | :-- | :-- |
| Write multi-stage Dockerfile with non-root user and health check | Justine Neema | 29/10/2026 |
| Write docker-compose.yml PostgreSQL services | Solace Fadhali Aziza | 30/10/2026 |
| Write docker-compose.yml app services | Clarisse Mukayiranga | 30/10/2026 |
| Create .dockerignore file | Justine Neema | 29/10/2026 |
| Implement GitHub Actions CI pipeline (lint, test, build, Docker build) | Emery Barame | 28/10/2026 |
| Update README with Docker and CI documentation | Clarisse Mukayiranga | 30/10/2026 |

### Formative 3 / Summative

| Task | Assigned To | Due Date |
| :-- | :-- | :-- |
| Write Terraform VPC, subnets, IGW, NAT Gateway, ALB (network.tf) | Justine Neema | 05/11/2026 |
| Write Terraform EC2 instances, RDS, ECR, IAM (main.tf) | Emery Barame | 05/11/2026 |
| Write Terraform security groups (security.tf) | Clarisse Mukayiranga | 05/11/2026 |
| Write Terraform variables, outputs, providers | Solace Fadhali Aziza | 05/11/2026 |
| Write Ansible common and docker roles | Justine Neema | 06/11/2026 |
| Write Ansible security role (firewalld, SSH hardening, fail2ban) | Clarisse Mukayiranga | 06/11/2026 |
| Write Ansible app_deploy role (env render, docker compose, health check) | Emery Barame | 06/11/2026 |
| Add Trivy container scan and tfsec IaC scan to CI pipeline | Emery Barame | 07/11/2026 |
| Write CD pipeline (cd.yml) with ECR push and Ansible deploy | Emery Barame | 07/11/2026 |
| Update README with architecture diagram, IaC, Ansible, and CD documentation | Clarisse Mukayiranga | 08/11/2026 |
| Write CHANGELOG.md documenting F1, F2, and Summative evolution | Solace Fadhali Aziza | 08/11/2026 |

---

## Current Deployment Status

| Component | Current value |
| :-- | :-- |
| AWS region | `eu-north-1` |
| Application Load Balancer | `http://AgriRent-dev-alb-1676444296.eu-north-1.elb.amazonaws.com` |
| Bastion public IP | `16.16.56.175` |
| Application private IP | `10.0.11.164` |
| ECR repository | `867133439555.dkr.ecr.eu-north-1.amazonaws.com/agrirent-app` |
| ECR tag currently deployed | `v1` |
| Backend container port | `6000` |
| Frontend container port | `4174` |
| PostgreSQL port | `5432` via Amazon RDS |
| Prometheus port | `9090` on the Compose host network |
| Grafana port | `3000` |

The backend and frontend are served by the same application container. Prometheus, Grafana, and node-exporter run alongside the application through Docker Compose.

---

## License

This project is licensed under the [MIT License](LICENSE).
