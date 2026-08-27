# CivilWorks — Antigravity Development Rules

## Product contract

This application is a mobile-first construction operations system for non-technical civil-work users. The UX must remain simpler than the underlying data model.

Locked workflows:
1. Attendance
2. Material Management
3. Expense Management
4. Daily Progress / Work Update
5. Payments
6. Vendor Management

Do not redesign a locked workflow during implementation. Raise ambiguities before changing the user-facing flow.

## UX rules

- Mobile first; optimize for phone use before desktop.
- One screen = one job.
- Large touch targets.
- Smart defaults for project/date/common choices.
- Bulk actions before repetitive individual entry.
- Minimal typing; prefer selection, search, camera and numeric inputs.
- Automatic calculations; do not make users perform accounting/math.
- Immediate confirmation after every write operation.
- Advanced actions belong under More.
- Never expose database/accounting complexity unnecessarily.
- Design for slow networks and temporary offline conditions.

## Technical architecture

- Next.js 16 + TypeScript
- MongoDB + Mongoose
- PM2 for development and production
- Object storage for photos, bills, receipts and documents
- Domain/business logic must be centralized in service modules, not duplicated in React components or route handlers.

## Data rules

All operational transactions must carry `projectId`.

Financial chains:
- Labour: Attendance -> Wages -> Amount Due -> Payment
- Vendor: Vendor -> Bill -> Outstanding -> Payment
- Material: Opening Stock + Inward - Issue +/- Adjustment = Current Stock

Do not create duplicate transactions for the same business event.

## Testing requirement

A module is not complete when the screen works. It is complete only when:
- unit tests cover calculation rules
- API/integration tests cover validation and persistence
- Playwright E2E covers the real user flow
- mobile viewport is tested
- duplicate submission and error states are tested
- offline/online behavior is tested for site-critical workflows

## PM2 rules

Development must run under PM2 watch mode.
Production must run under PM2 using the production build.
Do not use `next dev` or `next start` directly as the standard long-running process.

Development:
`npm run pm2:dev`

Production:
`npm run pm2:prod`

## Delivery discipline

Implement one vertical slice at a time:
Foundation -> Projects -> Attendance -> Material -> Expense -> Daily Progress -> Payments -> Vendors -> Project Overview -> Reports -> Hardening.

After each slice:
1. run typecheck
2. run unit tests
3. run build
4. run E2E tests
5. verify mobile UX
6. document any deliberate deviation from the locked design
