# Antigravity Handoff — CivilWorks

## Mission
Implement the CivilWorks construction management application exactly from the locked product workflows and UX principles. Keep the UI simple enough for a non-technical site supervisor to operate from a phone.

## Current repository status
The foundation is scaffolded and includes:
- Next.js + TypeScript
- MongoDB + Mongoose
- PM2 development/production ecosystem
- mobile-first shell/navigation
- Project API
- Worker API
- Attendance API
- Attendance mobile screen
- basic Mongo models and indexes
- seed script
- health endpoint
- test scaffold

## First implementation milestone
Complete the Attendance vertical slice end-to-end before starting the next workflow:

1. Project selection with smart default.
2. Worker list loaded from MongoDB.
3. Mark all present.
4. Adjust Present / Half Day / Absent exceptions.
5. Save attendance with upsert semantics.
6. Show immediate summary.
7. Attendance history.
8. Attendance report.
9. Wage calculation service fed from attendance.
10. Unit/API/E2E tests.

## Required acceptance test

Given a project with 5 active workers:
- open Attendance
- default date is today
- workers load
- tap Mark All Present
- change one to Half Day and one to Absent
- save
- refresh page
- states persist
- summary shows 3 Present / 1 Half Day / 1 Absent
- wage basis reflects 3 full days + 1 half day
- audit entry exists for the save operation

## UX non-negotiables
- phone-first layout
- large touch targets
- no unnecessary fields
- date/project prefilled
- bulk actions before repetitive work
- minimal typing
- numeric keyboard for amounts/quantities
- immediate success confirmation
- errors must be human-readable
- do not expose accounting concepts unless needed
- advanced functionality under More

## Data integrity non-negotiables
- all operational records use projectId
- server is source of truth for calculations
- attendance records are unique per project + worker + date
- payment operations must be idempotent
- audit important mutations
- never double-count material or expense transactions

## PM2 non-negotiables
Development:
`npm run pm2:dev`

Production:
`npm run pm2:prod`

Do not use direct long-running `next dev` / `next start` in normal workflow.
