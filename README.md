# Surgery Care Foundation — Backend API

A Node.js + TypeScript backend for a medical crowdfunding platform that connects patients in need of surgery with donors.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (access + refresh tokens) with bcrypt
- **Payments:** Razorpay integration
- **Jobs:** pg-boss (PostgreSQL-backed job queue)
- **Validation:** Zod
- **Logging:** Pino
- **Docs:** Swagger / OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT secrets, etc.

# Run database migrations
npx prisma migrate dev --name init

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

The API runs at `http://localhost:8080`.

### Test Accounts (after seeding)

| Email | Role | Password |
|-------|------|----------|
| admin@surgerycare.org | Super Admin | Password123! |
| moderator@surgerycare.org | Moderator | Password123! |
| finance@surgerycare.org | Finance Manager | Password123! |
| creator@example.com | Campaign Creator | Password123! |
| donor@example.com | Donor | Password123! |

## API Endpoints

- **Health:** `GET /health`
- **Docs:** `GET /docs` (Swagger UI)
- **Auth:** `/api/v1/auth/*`
- **Users:** `/api/v1/users/*`
- **Campaigns:** `/api/v1/campaigns/*`
- **Public Campaigns:** `/api/v1/public/campaigns`
- **Donations:** `/api/v1/donations/*`
- **Payments:** `/api/v1/payments/*`
- **Withdrawals:** `/api/v1/withdrawals/*`
- **Admin:** `/api/v1/admin/*`
- **Analytics:** `/api/v1/analytics/*`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run worker` | Start background job worker |
| `npm run db:seed` | Seed test data |

## Production Deployment

```bash
# Using Docker Compose
docker compose up -d --build
```

## License

Private — Surgery Care Foundation
