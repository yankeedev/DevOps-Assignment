# AgriRent — Agricultural Equipment Rental and Farm Supplies Platform

##  Context

AgriRent addresses a common challenge for smallholder farmers in Rwanda and across Africa: the high cost of agricultural equipment. Many farmers cannot afford to buy expensive tools such as irrigation pumps, tillers, and sprayers for occasional use. At the same time, farmers and cooperatives often own equipment that sits idle between farming seasons. AgriRent bridges this gap by enabling equipment sharing and helping farmers locate nearby sellers of seeds and fertilizers, making farming more affordable and efficient.

## Team Members

- Clarisse Mukayiranga - Team Member
- Solace fadhali Aziza - Team Member
- Justine Neema - Team Member
- Emery Barame - Project Lead

## Project Overview

AgriRent is a web-based agricultural marketplace and linkage platform that connects farmers who need agricultural equipment with farmers and cooperatives that have equipment available for rent. In addition to equipment rentals, the platform includes a farm supplies section to help farmers locate nearby agricultural supply shops offering seeds, fertilizers, and other farm inputs.

The platform simplifies the rental process by allowing farmers to search for tools by location, compare options, send booking requests, and coordinate payment and collection directly with equipment owners. By promoting equipment sharing and improving access to farm supplies, AgriRent helps reduce costs for smallholder farmers while creating income opportunities for equipment owners.

### Target Users

- **Smallholder Farmers** – Farmers who need access to agricultural equipment for short-term use or want to find nearby seeds and fertilizers.
- **Equipment Owners & Cooperatives** – Farmers, groups, or cooperatives who own agricultural equipment and want to rent it out to generate income.
- **Agricultural Supply Shops** – Local shops that sell seeds, fertilizers, and farm inputs and want to be discoverable to nearby farmers.

### Core Features

- **Equipment Rental Marketplace** – Browse and search for agricultural equipment by type and location with rental prices and availability.
- **Booking Requests** – Farmers can request to rent equipment for specific dates, with owners able to accept or reject requests.
- **Farm Supplies Directory** – Find nearby shops selling seeds, fertilizers, and other farm inputs with location, prices, and contact details.
- **User Roles** – Role-based access for farmers, equipment owners/cooperatives, and administrators.
- **Request & Status Tracking** – Track rental requests and payment status (recorded, not processed in v1).

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: TypeScript, JavaScript, Vite, React, Tailwind CSS
- **Database**: PostgreSQL (NeonDB)
- **ORM**: Prisma
- **Authentication**: JWT (Access/Refresh tokens), bcryptjs
- **Validation**: Zod
- **Middleware**: Express middleware for auth, roles, and validation

## Getting Started

### Prerequisites

- Node.js (v18+ or v20+)
- npm
- PostgreSQL database (or NeonDB connection string)

### Installation

1. Clone the repository
`ash
git clone https://github.com/yankeedev/DevOps-Assignment.git
cd DevOps-Assignment
`

2. Backend Setup
`ash
cd backend
npm install
cp .env.example .env
# Update DATABASE_URL in .env
npx prisma generate
npx prisma migrate deploy
npm run dev
`

3. Frontend Setup
`ash
cd frontend
npm install
npm run dev
`

### Usage

1. Open the frontend at http://localhost:5173 or http://localhost:5174
2. Register as a farmer or equipment owner
3. Browse equipment or farm supplies
4. Send rental requests and coordinate with owners directly

## Task Allocation (Formative 1)

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

## Branch Protection Rules & Governance

To maintain code quality, prevent breaking changes, and support seamless team collaboration, branch protection rules are enforced on the `main` branch.

### Configured Protection Rules

| Protection Setting | Configuration | Purpose & Collaboration Value |
| :--- | :--- | :--- |
| Require a pull request before merging | Enabled (1 approval required) | Ensures direct pushes to `main` are blocked. All proposed changes must be reviewed by another team member to catch potential bugs and maintain code standards. |
| Dismiss stale pull request approvals | Enabled | Invalidates prior reviews when new commits are pushed to an open PR. Guarantees that the final merged code has been reviewed in its exact state. |
| Require status checks to pass before merging | Enabled | Enforces that all automated CI pipeline checks (builds, linters, and unit tests) must pass successfully before code can be merged into `main`. |
| Require branches to be up to date before merging | Enabled | Guarantees that code being merged has been tested against the latest version of `main`, preventing integration bugs or merge conflicts. |
| Require conversation resolution before merging | Enabled | Ensures all comments, suggestions, and feedback raised during code review are fully addressed and resolved before merging. |

### Why These Rules Matter for Team Collaboration

1. **Quality Assurance:** Automated CI status checks ensure broken builds or failing unit tests never reach production.
2. **Knowledge Sharing & Code Reviews:** Enforcing peer reviews allows team members to stay updated on project architecture and share domain knowledge.
3. **Preventing Integration Drift:** Requiring branches to be up-to-date before merging reduces merge conflicts and ensures feature branches run cleanly alongside recently merged contributions.

## Links

- [GitHub Repository](https://github.com/yankeedev/DevOps-Assignment.git)
- [Project Board](https://github.com/users/yankeedev/projects/2)

## License

This project is licensed under the [MIT License](LICENSE).
