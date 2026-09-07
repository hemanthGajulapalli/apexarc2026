# Module & Service Architecture

## Why one Express process, not seven

ADR012 decided on **five** independently-deployable services (Ingestion, Popularity Analytics, Animal Monitoring, Ticketing Integration, AI Inference) over a shared MQTT bus, explicitly rejecting fine-grained microservices as "over-engineered for the estate's actual scale," and its own advice says: *"keep the number of services deliberately small at launch... only split further if a specific scaling or team-ownership need arises."*

This implementation runs those five services — plus the two added in ADR021 (folded into Popularity Analytics, since forecasting/recommendations are a natural extension of that service's existing data) and ADR022 (folded into Ticketing Integration, since personalization/concierge are visitor-facing and already touch loyalty data) — as **separate Express routers mounted on one process**, backed by one Postgres database.

This is a **modular monolith**, and it is the architecturally consistent choice here, not a shortcut:

- Each service's routes live in their own directory (`src/services/<name>/`) with their own business logic modules (e.g. `popularity-analytics/aggregation.js`, `animal-monitoring/alertTiering.js`), independently unit-testable and, if a real scaling need ever emerges, independently extractable into its own deployable process without touching any other service's code.
- The module boundaries are drawn at exactly the seams ADR012 named — splitting into real separate processes later is a deployment change, not a rewrite.
- Running seven separate Node processes locally for a kata prototype would add real operational overhead (seven ports, seven health checks, seven things that can independently fail to start) for zero benefit at this scale — which is precisely the trade-off ADR012 already reasoned through and rejected.

## Module map

```
implementation/server/src/
├── app.js                          Assembles all routers + static webapp
├── server.js                       Entry point (the only place that calls .listen())
├── db.js                           Postgres connection pool
├── middleware/
│   └── auth.js                     Session + RBAC (ADR016 stand-in — see api-contracts.md)
└── services/
    ├── identity-access/            ADR016
    ├── ticketing-integration/      ADR009, ADR008, ADR018, ADR022 (personalization/concierge)
    ├── ingestion/                  ADR001
    ├── popularity-analytics/       ADR003, ADR004, ADR021 (forecasting/recommendations)
    │   └── aggregation.js          Real hourly/daily rollup + naive-baseline forecast
    ├── animal-monitoring/          ADR002, ADR005, ADR006, ADR007
    │   └── alertTiering.js         Pure severity-tiering logic (unit-tested in isolation)
    └── ai-governance/              ADR011, ADR020
```

## Webapp module map

```
implementation/webapp/
├── shared/
│   ├── design-system.css           One CSS source of truth (was ~200 lines × 4 pages)
│   └── api.js                      fetch wrapper, session storage, UX helpers (toast, skeleton, busy-button guard)
├── index.html                      Sign-in + app launcher, gated by role/kind
├── ops-dashboard.html              Operations/Admin
├── vet-console.html                Keeper
├── ai-governance-console.html      Admin
└── customer-app.html                Visitor
```

Each page is deliberately still plain HTML/CSS/JS (ES modules, no build step) — matching the wireframes it evolved from, and the "Node.js + plain HTML/CSS/JS" stack decision made for this build.

## Data flow, end to end

```
Browser (webapp/*.html)
   │  fetch('/api/...', { Authorization: Bearer <token> })
   ▼
Express app.js → service router → (business logic module, if any) → db.js (pg.Pool)
   │
   ▼
PostgreSQL (implementation/db/schema.sql)
```

No layer is skipped for convenience: the webapp never talks to Postgres directly, and no route handler embeds SQL inline that bypasses the schema's constraints (foreign keys, `NOT NULL`, `UNIQUE` on `models(name, version)`, etc. — see [database-schema.md](database-schema.md)).
