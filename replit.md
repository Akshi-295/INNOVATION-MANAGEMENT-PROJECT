# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Application: Smart Electricity Waste Detection System (VoltWatch)

A real-time energy monitoring and waste detection dashboard for facility managers and energy analysts.

### Features
- **Dashboard** — Key metrics (total consumption, waste kWh, savings, active alerts), 7-day consumption vs. waste chart, top waste producers, active alert feed
- **Devices** — Register, monitor, and manage devices (HVAC, lighting, appliances, EV chargers, industrial)
- **Alerts** — View/resolve/dismiss anomaly alerts (overconsumption, idle waste, off-hours usage, spikes, threshold breaches) by severity and status
- **Readings** — Historical energy readings with waste flag, filterable by device

### Architecture
- Frontend: React + Vite + Tailwind (dark mode), Recharts for charts, Wouter for routing
- Backend: Express 5 with routes for devices, readings, alerts, dashboard
- Database: PostgreSQL with Drizzle ORM (devices, readings, alerts tables)
- API: OpenAPI-first contract in `lib/api-spec/openapi.yaml`

### DB Schema
- `devices` — id, name, location, type, status, power_rating_w, current_watts, created_at
- `readings` — id, device_id, watts_consumed, kwh_consumed, is_wasteful, recorded_at
- `alerts` — id, device_id, type, severity, message, status, estimated_waste_kwh, estimated_cost_usd, created_at, resolved_at

### Waste Detection Logic
- A reading is flagged wasteful if `wattsConsumed > powerRatingW * 1.3` (30% above rated)
- Wasteful readings auto-create alerts with severity based on waste magnitude
- Rate: $0.12/kWh
