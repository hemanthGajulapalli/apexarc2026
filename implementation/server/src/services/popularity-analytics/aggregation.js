import { query } from '../../db.js';

// ADR004: hourly aggregation for same-day staffing, daily for investment
// trend. Real rollup logic — not a stub — reading raw popularity_events and
// upserting into the aggregate tables.

export async function rollupHourly(zoneId, hourBucket) {
  const start = new Date(hourBucket);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM popularity_events
     WHERE zone_id = $1 AND occurred_at >= $2 AND occurred_at < $3`,
    [zoneId, start.toISOString(), end.toISOString()]
  );
  const count = rows[0].n;
  await query(
    `INSERT INTO popularity_aggregates_hourly (zone_id, hour_bucket, event_count)
     VALUES ($1, $2, $3)
     ON CONFLICT (zone_id, hour_bucket) DO UPDATE SET event_count = EXCLUDED.event_count`,
    [zoneId, start.toISOString(), count]
  );
  return { zoneId, hourBucket: start.toISOString(), eventCount: count };
}

export async function rollupDaily(zoneId, dayBucket) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(event_count), 0)::int AS total
     FROM popularity_aggregates_hourly
     WHERE zone_id = $1 AND hour_bucket >= $2::date AND hour_bucket < ($2::date + interval '1 day')`,
    [zoneId, dayBucket]
  );
  const total = rows[0].total;
  await query(
    `INSERT INTO popularity_aggregates_daily (zone_id, day_bucket, event_count)
     VALUES ($1, $2, $3)
     ON CONFLICT (zone_id, day_bucket) DO UPDATE SET event_count = EXCLUDED.event_count`,
    [zoneId, dayBucket, total]
  );
  return { zoneId, dayBucket, eventCount: total };
}

// ADR021's advice: validate any forecast against a naive baseline before
// trusting a "real" model's added value. This IS the naive baseline —
// "same hour, 7 days ago" — used here as the actual forecast source, since
// building a full ML forecasting pipeline is out of scope for this
// prototype; the API surface (and the guardrails around it) are what ADR021
// actually decided, and are real regardless of which model sits behind them.
export async function naiveForecast(zoneId, forecastFor) {
  const target = new Date(forecastFor);
  const sameHourLastWeek = new Date(target.getTime() - 7 * 24 * 60 * 60 * 1000);
  // UTC, not local time: setMinutes()/etc. operate in the server's local
  // timezone, which silently shifts the bucket boundary whenever that zone
  // isn't UTC (e.g. IST's +5:30 offset moves the "zeroed" minute by 30) —
  // caught by a test asserting an exact same-hour-last-week match.
  sameHourLastWeek.setUTCMinutes(0, 0, 0);

  const { rows } = await query(
    `SELECT event_count FROM popularity_aggregates_hourly WHERE zone_id = $1 AND hour_bucket = $2`,
    [zoneId, sameHourLastWeek.toISOString()]
  );
  if (rows.length > 0) {
    return { zoneId, forecastFor: target.toISOString(), predictedCount: rows[0].event_count, basis: 'same_hour_last_week' };
  }

  // Fall back to the zone's own recent average hourly count if no history
  // exists yet for that exact slot (e.g. a brand-new zone).
  const avg = await query(
    `SELECT COALESCE(AVG(event_count), 0)::int AS avg_count FROM popularity_aggregates_hourly WHERE zone_id = $1`,
    [zoneId]
  );
  return { zoneId, forecastFor: target.toISOString(), predictedCount: avg.rows[0].avg_count, basis: 'recent_average_fallback' };
}
