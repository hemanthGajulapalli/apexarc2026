import { Router } from 'express';
import { query, withTransaction } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';

// Ticketing Integration service (ADR009 — payment/issuance only, off-the-shelf
// SaaS in production; this is the thin integration layer around it) plus
// ADR008's Phase One loyalty mechanism. Maps to visitor-hub-wireframe.html's
// screen-options / screen-checkout / screen-account.
export const ticketingRouter = Router();

// POST /api/ticketing/purchase  { visitDate, adults, children, addOns, promoCode }
ticketingRouter.post('/ticketing/purchase', requireAuth, async (req, res) => {
  const { visitDate, adults = 0, children = 0, addOns = [], promoCode } = req.body || {};
  if (!visitDate || (adults + children) < 1) {
    return res.status(400).json({ error: 'invalid_request', message: 'visitDate and at least one adult/child are required.' });
  }

  const ADULT_PRICE = 29;
  const CHILD_PRICE = 15;
  const ADDON_PRICES = { parking: 8, skip_the_line: 12 };
  let total = adults * ADULT_PRICE + children * CHILD_PRICE;
  for (const a of addOns) total += ADDON_PRICES[a] || 0;
  if (promoCode === 'RETURN10') total *= 0.9;

  const ticket = await withTransaction(async (client) => {
    const inserted = await client.query(
      `INSERT INTO tickets (visitor_id, visit_date, adults, children, add_ons, promo_code, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, visitDate, adults, children, addOns, promoCode || null, total.toFixed(2)]
    );
    await client.query(
      `INSERT INTO loyalty_accounts (visitor_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [req.user.id]
    );
    return inserted.rows[0];
  });

  res.status(201).json(ticket);
});

// GET /api/ticketing/loyalty  — the signed-in visitor's own loyalty card
ticketingRouter.get('/ticketing/loyalty', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT * FROM loyalty_accounts WHERE visitor_id = $1', [req.user.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
});

// PATCH /api/ticketing/loyalty/consent  { optIn: boolean }  — ADR018 opt-out
ticketingRouter.patch('/ticketing/loyalty/consent', requireAuth, async (req, res) => {
  const { optIn } = req.body || {};
  if (typeof optIn !== 'boolean') {
    return res.status(400).json({ error: 'invalid_request', message: 'optIn must be boolean.' });
  }
  const { rows } = await query(
    `UPDATE loyalty_accounts SET personalization_opt_in = $1 WHERE visitor_id = $2 RETURNING *`,
    [optIn, req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
});

// -----------------------------------------------------------------------------
// Personalization & Concierge (ADR022, "Customer GenAI") — gated by ADR018's
// opt-out and ADR008's Phase Two data-maturity trigger. Both endpoints are
// GROUNDED: they answer only from real rows in this database, never from
// open-ended generation, per ADR022's decision.
// -----------------------------------------------------------------------------

const OPS_AI_MODEL_NAME = 'Customer GenAI';

// GET /api/personalization/offers
ticketingRouter.get('/personalization/offers', requireAuth, async (req, res) => {
  const loyalty = await query('SELECT personalization_opt_in FROM loyalty_accounts WHERE visitor_id = $1', [req.user.id]);
  if (loyalty.rows.length === 0 || !loyalty.rows[0].personalization_opt_in) {
    return res.status(403).json({
      error: 'personalization_opted_out',
      message: 'Personalization is off for this visitor — falls back to the Phase One loyalty benefit only (ADR018).',
    });
  }

  const model = await query(`SELECT id FROM models WHERE name = $1 AND status = 'production' LIMIT 1`, [OPS_AI_MODEL_NAME]);
  if (model.rows.length === 0) {
    return res.status(503).json({ error: 'model_unavailable', message: 'No production Customer GenAI model on record.' });
  }

  // Grounded recommendation: the visitor's least-visited-but-currently-quiet
  // zone, from their own real ticket-entry history and current popularity.
  const grounded = await query(
    `SELECT z.id, z.name, COALESCE(latest.event_count, 0) AS current_count
     FROM ticket_entries te
     JOIN zones z ON z.id = te.zone_id
     JOIN tickets t ON t.id = te.ticket_id
     LEFT JOIN LATERAL (
       SELECT event_count FROM popularity_aggregates_hourly WHERE zone_id = z.id ORDER BY hour_bucket DESC LIMIT 1
     ) latest ON true
     WHERE t.visitor_id = $1
     ORDER BY current_count ASC
     LIMIT 1`,
    [req.user.id]
  );

  if (grounded.rows.length === 0) {
    return res.json({ offers: [], reason: 'no_visit_history' });
  }

  const zone = grounded.rows[0];
  const offerText = `You haven't spent much time at ${zone.name} — it's quiet there right now, here's 20% off your next entry.`;
  const inserted = await query(
    `INSERT INTO personalized_offers (visitor_id, model_id, offer_text, grounding, confidence)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, model.rows[0].id, offerText, `visit history + live popularity for ${zone.name}`, 0.88]
  );
  res.json({ offers: [inserted.rows[0]] });
});

// POST /api/personalization/offers/:id/engage  — click-through feedback (ADR022/ADR011)
ticketingRouter.post('/personalization/offers/:id/engage', requireAuth, async (req, res) => {
  const { rows } = await query(
    `UPDATE personalized_offers SET engaged = true, engaged_at = now() WHERE id = $1 AND visitor_id = $2 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
});

// POST /api/concierge/ask  { question }  — grounded Q&A, "Tour Assistant"
ticketingRouter.post('/concierge/ask', async (req, res) => {
  const { question } = req.body || {};
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'question is required.' });
  }
  const model = await query(`SELECT id FROM models WHERE name = $1 AND status = 'production' LIMIT 1`, [OPS_AI_MODEL_NAME]);
  if (model.rows.length === 0) {
    return res.status(503).json({ error: 'model_unavailable' });
  }

  const q = question.toLowerCase();
  const zoneMatch = await query(
    `SELECT z.id, z.name, COALESCE(latest.event_count, 0) AS current_count
     FROM zones z
     LEFT JOIN LATERAL (
       SELECT event_count FROM popularity_aggregates_hourly WHERE zone_id = z.id ORDER BY hour_bucket DESC LIMIT 1
     ) latest ON true
     WHERE z.zone_type = 'ride' AND lower(z.name) LIKE '%' || split_part($1, ' ', 1) || '%'
     LIMIT 1`,
    [q]
  );

  let answer, grounding, confidence;
  if (zoneMatch.rows.length > 0) {
    const z = zoneMatch.rows[0];
    answer = `${z.name} is open today. Current live count is ${z.current_count} for the last hour.`;
    grounding = `live popularity for ${z.name}`;
    confidence = 0.88;
  } else {
    answer = "I can answer questions about a specific ride or enclosure by name — try asking about one directly.";
    grounding = 'no matching zone found';
    confidence = 0.4;
  }

  const inserted = await query(
    `INSERT INTO concierge_queries (visitor_id, model_id, question, answer, grounding, confidence)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user?.id || null, model.rows[0].id, question, answer, grounding, confidence]
  );
  res.json(inserted.rows[0]);
});
