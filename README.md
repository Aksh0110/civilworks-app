# CivilWorks Manager

Mobile-first civil construction management application.

## Product rules

The UI is intentionally designed for non-technical construction users. The locked workflows are:

1. Attendance
2. Material Management
3. Expense Management
4. Daily Progress
5. Payments
6. Vendor Management

## Stack

- Next.js 16.3.3
- React 19
- TypeScript
- MongoDB + Mongoose 9
- PM2 in development and production

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- MongoDB 8+/MongoDB Atlas
- PM2 (provided as a local project dependency)

## Setup

```bash
cp .env.example .env.development.local
npm install
npm run typecheck
npm test
npm run dev
```

## PM2 development

```bash
npm run pm2:dev
pm2 status
pm2 logs civilworks-dev
```

PM2 watch mode is enabled for development and ignores `node_modules`, `.next`, `.git`, and logs.

## Production

```bash
cp .env.example .env.production.local
# update MONGODB_URI
npm run pm2:prod
pm2 save
```

For server boot persistence, use `pm2 startup` once on the host and then `pm2 save`.

## Health check

`GET /api/health`

## Current vertical slice

Project → Workers → Attendance → MongoDB persistence → attendance summary.

This is the foundation for the remaining workflows.
