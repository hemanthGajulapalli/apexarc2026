import 'express-async-errors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachUser } from './middleware/auth.js';
import { identityAccessRouter } from './services/identity-access/routes.js';
import { ticketingRouter } from './services/ticketing-integration/routes.js';
import { ingestionRouter } from './services/ingestion/routes.js';
import { popularityRouter } from './services/popularity-analytics/routes.js';
import { animalMonitoringRouter } from './services/animal-monitoring/routes.js';
import { aiGovernanceRouter } from './services/ai-governance/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(attachUser);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Each of ADR012's five services, plus ADR021/ADR022, mounted as its own
  // router under one Express app (a modular monolith — see
  // implementation/docs/module-service-map.md for why that's the right call
  // here, not a deviation from the architecture).
  app.use('/api', identityAccessRouter);
  app.use('/api', ticketingRouter);
  app.use('/api', ingestionRouter);
  app.use('/api', popularityRouter);
  app.use('/api', animalMonitoringRouter);
  app.use('/api', aiGovernanceRouter);

  // The integrated webapp — evolved from wireframes/, now fetching from the
  // APIs above instead of showing static content.
  app.use(express.static(path.join(__dirname, '..', '..', 'webapp')));

  // Centralized error handler — every route above can just `throw` or let a
  // rejected promise surface; nothing leaks a raw stack trace to the client.
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error', message: 'Something went wrong.' });
  });

  return app;
}
