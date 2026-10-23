# AgriRent - Agricultural Marketplace & Linkage Platform

## Project Overview

AgriRent is a web-based agricultural marketplace and product linkage platform designed for the African context. It connects farmers, buyers, and stakeholders to facilitate the sale and distribution of agricultural products through a middleware-driven system.

## Project Structure

`
DevOps-Assignment/
├── backend/           # Express.js + TypeScript backend (API, middleware logic)
│   ├── src/           # Source code
│   ├── prisma/        # Prisma schema & migrations (if present)
│   ├── dist/          # Compiled output (ignored)
│   └── package.json
├── frontend/          # Vite + React + TypeScript frontend
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── package.json
├── .gitignore
├── README.md
├── COLOR.md
└── LICENSE
`

## Setup Process

### Prerequisites

- Node.js (v18+ or v20+)
- npm
- PostgreSQL/Neon DB (connection string provided in assignment)

### 1) Clone the Repository

`ash
git clone <your-repo-url>
cd DevOps-Assignment
`

### 2) Backend Setup

`ash
cd backend
npm install
# Create .env file with your database URL (already configured locally)
# If using Prisma, generate client
npx prisma generate
# Run migrations if any exist
npx prisma migrate deploy
# Start development server
npm run dev
`

Backend runs on: http://localhost:5000 (or as configured in source)

### 3) Frontend Setup

`ash
cd frontend
npm install
npm run dev
`

Frontend runs on: http://localhost:5173 (Vite may use 5174 if 5173 is occupied)

### 4) Running Both Together

Run backend and frontend in separate terminal windows as shown above.

## Tech Stack

- **Backend**: Express.js, TypeScript, Prisma, Zod, JWT, bcryptjs, cors, cookie-parser
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Axios
-
## Notes
- .env files are not committed (see .gitignore)
- This project is for educational/DevOps assignment purposes only
- UI implementation details are not included in initial setup
