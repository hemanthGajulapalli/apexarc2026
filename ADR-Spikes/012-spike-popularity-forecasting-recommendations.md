# Timebox

2 days.

# Context

The Ops Dashboard wireframe already shows same-day demand forecasting
and staff/investment recommendations ("Ops AI v7.2") running live, but
ADR004 explicitly scoped popularity analytics as non-predictive, and no
ADR covers a forecasting or recommendation model. We need to decide
whether to formalize this capability (and how) or scale the wireframe
back to match the approved architecture.

We need to answer this now because the AI Governance Console
(ADR011/ADR020) was found to be silently missing this model from
golden-set/drift tracking — an AI feature shouldn't keep running in a
product surface without an architectural decision and a verification
story behind it.

Constraints:
- Must not require the streaming infrastructure ADR004 already rejected
  on cost/reliability grounds.
- Patchy WiFi (ADR001) still applies — any input pipeline this model
  uses inherits that constraint.
- Operations staff are the primary consumer; the Countess is the
  secondary consumer for investment recommendations specifically.

Interested parties: operations/staffing team, the Countess (investment
decisions + cost), engineering (verification burden).

# Options considered

1. **Batch-derived short-horizon forecast + recommendation model,
   human-approved** — reuse ADR004's existing hourly/daily aggregates
   as the only input, add a lightweight recommendation layer, gate
   every suggestion behind human approval.
2. **Descriptive analytics only** — revert to ADR004's original
   non-predictive scope; scale the wireframe back.
3. **Full real-time streaming forecast pipeline** — build the streaming
   infrastructure ADR004 rejected, for materially better forecast
   accuracy.

# Consequences

- Compare forecast MAPE achievable from batch-derived hourly data vs.
  what a naive baseline ("same hour last week") already achieves — is
  the added model worth its own verification overhead?
- Talk to operations: does same-day (few-hours-ahead) forecast
  freshness actually change staffing decisions, or is "current + trend"
  (already in ADR004) enough?
- What does golden-set/drift monitoring look like for a forecast model
  specifically (numeric regression) vs. the classification-style
  golden-sets used elsewhere (ADR011)?
- Should staffing recommendations (reversible, same-day) and investment
  recommendations (sunk capital) have different approval weight, or is
  one "Pending approval" pattern sufficient at launch?
