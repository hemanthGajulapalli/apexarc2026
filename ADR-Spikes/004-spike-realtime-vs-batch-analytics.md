# Timebox

1 day.

# Context

Once we can measure popularity (spike 003), we need to decide how fresh
that data needs to be. Near-real-time analytics adds cost and complexity
(streaming pipeline, always-on connectivity); batch/periodic aggregation
is simpler and cheaper but delays insight.

We need to answer this now because it materially changes the ingestion
and analytics architecture — building a streaming pipeline "just in case"
when daily batch would suffice wastes budget better spent on animal
monitoring or AI features.

Constraints:
- Patchy WiFi makes true real-time delivery unreliable in some zones
  anyway (ties to spike 001).
- Staff deployment decisions are the primary consumer of this data.

Interested parties: operations/staffing team, the Countess (cost vs.
value).

# Options considered

1. **Near-real-time (minutes-level latency)** — streaming pipeline,
   live dashboards for staff to react same-day.
2. **Hourly batch** — aggregated every hour, enough for intra-day staff
   reallocation without full streaming infrastructure.
3. **Daily batch** — end-of-day aggregation, used for next-day staffing
   and longer-term investment decisions only.

# Consequences

- Talk to operations: how quickly do they actually need to react to a
  popularity shift to reallocate staff meaningfully?
- Cost comparison: streaming infrastructure vs. simple scheduled batch
  jobs, at this data volume.
- Does patchy WiFi make "real-time" a false promise in practice, making
  hourly/daily batch the honest choice regardless of ideal preference?
- Could a hybrid work — hourly for known peak periods for popular
  areas/anywhere WiFi is reliable, daily elsewhere?
