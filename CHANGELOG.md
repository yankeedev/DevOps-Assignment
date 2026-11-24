# Changelog

All notable changes to AgriRent are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Summative — Complete DevOps Pipeline

### Infrastructure as Code (Terraform)

- Added `terraform/` directory with modular configuration files: `main.tf`, `network.tf`, `security.tf`, `variables.tf`, `outputs.tf`, `providers.tf`
- Provisioned custom VPC (`10.0.0.0/16`) with public and private subnets across two availability zones
- Added Internet Gateway, NAT Gateway, and route tables for public/private subnet routing
- Provisioned Bastion Host EC2 in public subnet as SSH jump box
- Provisioned App EC2 instance in private subnet to run the Docker Compose stack
- Provisioned Application Load Balancer in public subnets forwarding HTTP traffic to App EC2
- Provisioned Amazon RDS PostgreSQL in private subnet with no public accessibility
- Provisioned Amazon ECR private container registry for Docker images
- Added four security groups: `sg-alb`, `sg-bastion`, `sg-app`, `sg-rds` with least-privilege rules
- Added IAM instance role granting App EC2 read access to ECR without hardcoded credentials
- Added `terraform.tfvars.example` with all required variable placeholders documented

### Configuration Management (Ansible)

- Added `ansible/` directory with role-based playbook structure
- `common` role: validates target OS (Amazon Linux 2023), installs baseline packages, starts `firewalld`
- `docker` role: installs Docker Engine and Compose plugin, configures daemon log rotation, adds SSH user to `docker` group
- `security` role: opens firewall ports, applies SSH hardening via drop-in config (disables password auth and root login), installs and configures `fail2ban`
- `app_deploy` role: renders `.env` from Ansible Vault secrets, copies `docker-compose.yml`, runs `docker compose up`, waits for `/health` HTTP 200 before marking deployment successful
- Added `group_vars/all/vars.yml` for non-secret application defaults
- Added `group_vars/all/vault.yml` (Ansible Vault encrypted) for PostgreSQL and JWT secrets
- Added `ansible.cfg` with default inventory, vault password file path, and callback settings
- Added `requirements.yml` for external Ansible collections

### DevSecOps

- Added Trivy container image scan to CI pipeline — scans built Docker image for CRITICAL and HIGH unfixed CVEs, fails the build on any finding
- Added tfsec IaC scan to CI pipeline — scans `terraform/` directory for misconfigurations, fails the build on any finding
- Added `npm audit --audit-level=high` to CI pipeline for both backend and frontend dependency trees
- CD pipeline runs Trivy at CRITICAL severity before pushing to ECR — image is never pushed if a critical CVE is found
- CD pipeline runs tfsec as a separate `iac_scan` job before the build and deploy jobs proceed

### Continuous Deployment Pipeline

- Added `.github/workflows/cd.yml` triggered on pull request merge to `main`
- CD pipeline jobs: `check` (lint + test + build) → `iac_scan` (tfsec) → `build_scan_push` (Docker build + Trivy + ECR push) → `deploy` (Ansible playbook)
- `build_scan_push` job authenticates to AWS using IAM credentials stored as GitHub secrets, logs in to ECR, builds and tags the image with the commit SHA and `latest`, scans with Trivy, then pushes both tags
- `deploy` job installs Ansible, writes SSH private key and vault password from GitHub secrets, connects to App EC2 via Bastion Host, and runs `ansible-playbook site.yml`
- `deploy` job targets the `production` GitHub environment for optional manual approval gate

### Application Features (Summative)

- Added atomic booking conflict prevention: `approveBooking` uses a Prisma `$transaction` to set equipment `UNAVAILABLE` and auto-reject all other PENDING bookings for the same equipment
- `cancelBooking` now accepts APPROVED bookings and restores equipment status to `AVAILABLE`
- Equipment listing now includes `UNAVAILABLE` tools with active booking date ranges so farmers can see when equipment becomes free
- `EquipmentCard` shows an orange "Booked" badge with date range for unavailable equipment
- Added full reviews system: users with APPROVED/ACTIVE/COMPLETED bookings can submit star ratings and written reviews; equipment owners cannot review their own equipment
- Added `SupplyShop` and `SupplyProduct` models with full CRUD — one shop per user, products auto-approved
- Added public `ShopsPage` for browsing and searching supply shops with inline product management for shop owners
- Added admin shop management tab in `AdminPage` with owner dropdown, shop CRUD, and per-shop product management
- Added "My Shop" tab in `MyToolsPage` for shop owners to manage their shop and products
- Added "Shops" navigation link in `SiteHeader`

### Documentation

- Rewrote `README.md` as a full operations manual including architecture diagram, live URL placeholder, IaC quick start, Ansible quick start, CI/CD pipeline tables, DevSecOps scan table, observability section, and updated task allocation table for Formative 3 / Summative
- Added `CHANGELOG.md` documenting the full evolution from F1 through Summative
- Added `terraform/README.md` with full variable reference, deployment steps, and operational notes
- Added `ansible/README.md` with role descriptions, inventory configuration, vault setup, and troubleshooting guide

---

## Formative 3 — Infrastructure as Code & DevSecOps

### Infrastructure as Code (Terraform)

- Created `terraform/` directory with modular file structure: `main.tf`, `network.tf`, `security.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `providers.tf`
- Defined custom VPC with CIDR `10.0.0.0/16` and public/private subnets across two availability zones in `network.tf`
- Added Internet Gateway and NAT Gateway with route tables for public and private subnet routing
- Defined Bastion Host EC2 instance in public subnet for SSH access
- Defined App EC2 instance in private subnet with no public IP
- Defined Application Load Balancer in public subnets with HTTP listener forwarding to App EC2
- Defined Amazon RDS PostgreSQL instance in private subnet with `publicly_accessible = false`
- Defined Amazon ECR private repository for Docker images
- Added `terraform.tfvars.example` documenting all required input variables
- Added `outputs.tf` exposing ALB DNS, Bastion IP, App private IP, RDS endpoint, and ECR URL
- Added `providers.tf` pinning the AWS provider version

### Security Groups (Terraform)

- Defined `sg-alb` allowing inbound HTTP 80 from `0.0.0.0/0`
- Defined `sg-bastion` allowing inbound SSH 22 from admin IP only
- Defined `sg-app` allowing SSH 22 from `sg-bastion` and ports 5000/4173 from `sg-alb`
- Defined `sg-rds` allowing PostgreSQL 5432 from `sg-app` only
- Added IAM instance role and instance profile granting App EC2 ECR read access without hardcoded credentials

### Configuration Management (Ansible)

- Created `ansible/` directory with role-based structure
- Added `site.yml` as the main orchestration playbook running roles in order: `common` → `docker` → `security` → `app_deploy`
- `common` role: validates target OS is Amazon Linux 2023, installs `firewalld` and baseline packages
- `docker` role: installs Docker CE and Compose plugin, writes `/etc/docker/daemon.json` with log rotation, starts and enables Docker service, adds SSH user to `docker` group
- `security` role: opens firewall ports via `firewalld`, writes SSH hardening drop-in config disabling password auth and root login, installs and configures `fail2ban` with jail template
- `app_deploy` role: creates `/opt/agrirent`, renders `.env` from vault secrets via `env.j2` template, copies `docker-compose.yml`, runs `docker compose up -d`, waits for `/health` to return HTTP 200
- Added `group_vars/all/vars.yml` with non-secret application and server defaults
- Added `group_vars/all/vault.yml` encrypted with Ansible Vault storing PostgreSQL and JWT secrets
- Added `ansible.cfg` with default inventory path and vault password file location
- Added `inventory/hosts.ini` defining the App EC2 target host
- Added `requirements.yml` for required Ansible Galaxy collections

### DevSecOps

- Added Trivy container image scan step to CI pipeline after Docker build — scans for CRITICAL and HIGH unfixed CVEs, exits with code 1 on any finding
- Added tfsec IaC scan step to CI pipeline — scans `terraform/` directory for security misconfigurations, fails the build on any finding
- Added `npm audit --audit-level=high` step to CI pipeline for both `backend/` and `frontend/` dependency trees
- Updated CI pipeline trigger to also run on pull requests targeting `dev` branch
- Added concurrency group to CI pipeline to cancel in-progress runs when new commits are pushed

### Documentation

- Added `terraform/README.md` with architecture overview, variable reference, deployment steps, ECR push instructions, and destroy guide
- Added `ansible/README.md` with role descriptions, inventory setup, vault configuration, run commands, and troubleshooting guide
- Updated root `README.md` with Terraform resources table, Ansible roles table, DevSecOps scan table, and Formative 3 task allocation

---

## Formative 2 — Containerization & CI

### Containerization

- Added multi-stage `Dockerfile` with three stages: `frontend-build`, `backend-build`, `production`
- Final production stage copies only compiled artifacts — no source code or dev dependencies
- Non-root system user `app` created and used at runtime
- `--no-install-recommends` flag used throughout to keep the image lean
- Health check added on `/health` endpoint using `curl`
- Added `docker-compose.yml` defining two services: `app` (backend + frontend) and `db` (PostgreSQL 16)
- `db` service uses a named volume `postgres_data` for data persistence and a `pg_isready` health check
- `app` service depends on `db` being healthy before starting, uses `restart: unless-stopped`
- Added `.dockerignore` excluding `node_modules`, `dist`, `build`, `.env` files, `.git`, logs, and editor directories
- Environment variables passed from host `.env` file — no secrets hardcoded in compose or Dockerfile

### CI Pipeline

- Added `.github/workflows/ci.yml` triggered on push to all branches except `main` and `dev`, and on pull requests targeting `main` or `dev`
- Pipeline uses a matrix strategy to run backend and frontend checks in parallel
- Steps: checkout → Node 20 setup → `npm ci` → lint → tests (frontend only) → build → Docker build
- Concurrency group configured to cancel in-progress runs on the same branch when a new push arrives
- All steps must pass before a pull request can be merged into `main`

### Branch Protection

- Enabled "Require a pull request before merging" with 1 required approval
- Enabled "Dismiss stale pull request approvals when new commits are pushed"
- Enabled "Require status checks to pass before merging" with CI pipeline as required check
- Enabled "Require branches to be up to date before merging"
- Enabled "Require conversation resolution before merging"

---

## Formative 1 — Project Foundation

### Repository Setup

- Created GitHub repository at https://github.com/yankeedev/DevOps-Assignment
- Organized monorepo structure with `backend/` and `frontend/` workspaces
- Added MIT `LICENSE` file
- Added comprehensive `.gitignore` covering Node.js, TypeScript build artifacts, environment files, editor directories, and OS files
- Created GitHub Projects Kanban board with initial task breakdown

### Application

- Initialized Node.js + Express.js + TypeScript backend with Prisma ORM
- Initialized React + TypeScript + Vite + Tailwind CSS frontend
- Defined Prisma schema with `User`, `Equipment`, and `Booking` models
- Implemented JWT authentication with access and refresh tokens
- Implemented equipment listing and booking request endpoints
- Implemented role-based access control for `FARMER`, `EQUIPMENT_OWNER`, and `ADMIN` roles
- Added admin equipment approval workflow
- Added database seed script with default admin and farmer accounts
- Added `backend/.env.example` and root `.env.example` with all required variable names documented
- Wrote initial `README.md` with problem statement, project overview, technology stack, and local setup instructions
