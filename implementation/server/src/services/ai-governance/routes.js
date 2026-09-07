import { Router } from 'express';
import { query, withTransaction } from '../../db.js';
import { requireRole } from '../../middleware/auth.js';

// AI Governance service (ADR011 verification, ADR020 hard CI/CD deploy gate).
// Maps to ai-governance-console-wireframe.html. The core guarantee this
// module exists to enforce in CODE, not just show in a UI: no model reaches
// `production` status without either (a) its latest golden-set run passing,
// or (b) an explicit, justified, attributed override on record.
export const aiGovernanceRouter = Router();

// GET /api/ai-governance/models
aiGovernanceRouter.get('/ai-governance/models', requireRole('admin'), async (_req, res) => {
  const { rows } = await query(`SELECT * FROM models ORDER BY name, version DESC`);
  res.json(rows);
});

// GET /api/ai-governance/models/:id — full detail: latest run + categories + drift + deploy history
aiGovernanceRouter.get('/ai-governance/models/:id', requireRole('admin'), async (req, res) => {
  const model = await query('SELECT * FROM models WHERE id = $1', [req.params.id]);
  if (model.rows.length === 0) return res.status(404).json({ error: 'not_found' });

  const latestRun = await query(
    `SELECT * FROM golden_set_runs WHERE model_id = $1 ORDER BY run_at DESC LIMIT 1`,
    [req.params.id]
  );
  let categories = [];
  if (latestRun.rows.length > 0) {
    categories = (await query(
      `SELECT category, tests_total, tests_passed, score FROM golden_set_category_results WHERE run_id = $1`,
      [latestRun.rows[0].id]
    )).rows;
  }
  const drift = await query(
    `SELECT measured_at, score FROM drift_metrics WHERE model_id = $1 ORDER BY measured_at DESC LIMIT 30`,
    [req.params.id]
  );
  const deployLog = await query(
    `SELECT dl.*, u.display_name AS promoted_by_name FROM deploy_log dl
     LEFT JOIN users u ON u.id = dl.promoted_by
     WHERE dl.model_id = $1 ORDER BY dl.created_at DESC`,
    [req.params.id]
  );
  const overrides = await query(
    `SELECT o.*, u.display_name AS approver_name FROM deploy_overrides o
     JOIN users u ON u.id = o.approver_id
     WHERE o.model_id = $1 ORDER BY o.created_at DESC`,
    [req.params.id]
  );

  res.json({
    model: model.rows[0],
    latestRun: latestRun.rows[0] || null,
    categories,
    drift: drift.rows,
    deployLog: deployLog.rows,
    overrides: overrides.rows,
  });
});

// POST /api/ai-governance/models/:id/golden-set-runs
// { overallScore, passed, categories: [{category, testsTotal, testsPassed, score}] }
// Called by the CI/CD pipeline (ADR020) after a golden-set suite run.
aiGovernanceRouter.post('/ai-governance/models/:id/golden-set-runs', async (req, res) => {
  const { overallScore, passed, categories = [] } = req.body || {};
  if (overallScore === undefined || typeof passed !== 'boolean') {
    return res.status(400).json({ error: 'invalid_request', message: 'overallScore and passed are required.' });
  }
  const model = await query('SELECT * FROM models WHERE id = $1', [req.params.id]);
  if (model.rows.length === 0) return res.status(404).json({ error: 'not_found' });

  const result = await withTransaction(async (client) => {
    const run = await client.query(
      `INSERT INTO golden_set_runs (model_id, overall_score, passed) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, overallScore, passed]
    );
    for (const c of categories) {
      await client.query(
        `INSERT INTO golden_set_category_results (run_id, category, tests_total, tests_passed, score)
         VALUES ($1, $2, $3, $4, $5)`,
        [run.rows[0].id, c.category, c.testsTotal, c.testsPassed, c.score]
      );
    }
    await client.query(`UPDATE models SET golden_set_score = $1, status = $2 WHERE id = $3`, [
      overallScore,
      passed ? 'candidate' : 'blocked',
      req.params.id,
    ]);
    return run.rows[0];
  });

  res.status(201).json(result);
});

// POST /api/ai-governance/models/:id/promote  { note }
// THE GATE (ADR020): rejects with 409 if the latest golden-set run failed.
// This is not advisory — there is no parameter that bypasses it from this
// endpoint. The only way past a failing gate is /override below.
aiGovernanceRouter.post('/ai-governance/models/:id/promote', requireRole('admin'), async (req, res) => {
  const { note } = req.body || {};
  const model = await query('SELECT * FROM models WHERE id = $1', [req.params.id]);
  if (model.rows.length === 0) return res.status(404).json({ error: 'not_found' });

  const latestRun = await query(
    `SELECT * FROM golden_set_runs WHERE model_id = $1 ORDER BY run_at DESC LIMIT 1`,
    [req.params.id]
  );
  if (latestRun.rows.length === 0) {
    return res.status(409).json({ error: 'no_golden_set_run', message: 'No golden-set result on record for this model version.' });
  }
  if (!latestRun.rows[0].passed) {
    return res.status(409).json({
      error: 'golden_set_failed',
      message: 'Latest golden-set run failed — deployment is blocked (ADR020). Use /override with a justification to proceed.',
      score: latestRun.rows[0].overall_score,
    });
  }

  const result = await withTransaction(async (client) => {
    await client.query(
      `UPDATE models SET status = 'retired' WHERE name = $1 AND status = 'production' AND id != $2`,
      [model.rows[0].name, req.params.id]
    );
    await client.query(`UPDATE models SET status = 'production' WHERE id = $1`, [req.params.id]);
    const log = await client.query(
      `INSERT INTO deploy_log (model_id, result, promoted_by, promoted_at) VALUES ($1, 'pass', $2, now()) RETURNING *`,
      [req.params.id, req.user.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, note) VALUES ($1, 'model.promote', 'models', $2, $3)`,
      [req.user.id, req.params.id, note || null]
    );
    return log.rows[0];
  });

  res.json(result);
});

// POST /api/ai-governance/models/:id/override  { justification }
// The ONLY path to production for a model whose latest golden-set run
// failed. Requires a real justification string and is fully attributed and
// logged (ADR020's "explicit, logged override decision", not a silent
// bypass).
aiGovernanceRouter.post('/ai-governance/models/:id/override', requireRole('admin'), async (req, res) => {
  const { justification } = req.body || {};
  if (!justification || !justification.trim()) {
    return res.status(400).json({ error: 'invalid_request', message: 'A justification is required to override a blocked deploy.' });
  }
  const model = await query('SELECT * FROM models WHERE id = $1', [req.params.id]);
  if (model.rows.length === 0) return res.status(404).json({ error: 'not_found' });

  const latestRun = await query(
    `SELECT * FROM golden_set_runs WHERE model_id = $1 ORDER BY run_at DESC LIMIT 1`,
    [req.params.id]
  );
  if (latestRun.rows.length === 0) {
    return res.status(409).json({ error: 'no_golden_set_run', message: 'No golden-set result on record for this model version.' });
  }
  if (latestRun.rows[0].passed) {
    return res.status(409).json({ error: 'not_blocked', message: 'This model version already passes its golden-set — use /promote instead.' });
  }

  const result = await withTransaction(async (client) => {
    const override = await client.query(
      `INSERT INTO deploy_overrides (model_id, approver_id, justification, golden_set_score_at_override)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, justification.trim(), latestRun.rows[0].overall_score]
    );
    await client.query(
      `UPDATE models SET status = 'retired' WHERE name = $1 AND status = 'production' AND id != $2`,
      [model.rows[0].name, req.params.id]
    );
    await client.query(`UPDATE models SET status = 'production' WHERE id = $1`, [req.params.id]);
    await client.query(
      `INSERT INTO deploy_log (model_id, result, promoted_by, promoted_at) VALUES ($1, 'fail', $2, now())`,
      [req.params.id, req.user.id]
    );
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity_table, entity_id, note) VALUES ($1, 'model.override', 'models', $2, $3)`,
      [req.user.id, req.params.id, justification.trim()]
    );
    return override.rows[0];
  });

  res.status(201).json(result);
});
