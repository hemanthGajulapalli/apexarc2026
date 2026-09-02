# ADR004 - Real-Time vs. Batch Analytics Pipeline
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use **hourly batch aggregation** as the default popularity-analytics
cadence, with **daily batch** for longer-term investment/trend reporting.
No dedicated streaming/real-time infrastructure is built for this
feature.

## Context
Popularity data (ADR003) feeds staff deployment and investment
decisions. Near-real-time (minutes-level) analytics is possible but adds
streaming infrastructure cost and complexity, and is unreliable anyway
given patchy WiFi in some zones (ADR001). We need to size the pipeline
to the actual decision cadence rather than build for a theoretical
maximum.

## Options Considered

### Option 1 (SELECTED): Hourly batch (staffing) + daily batch (investment)
Gateway-collected entry/BLE data is aggregated hourly for intra-day
staff reallocation, and rolled up daily for longer-term reporting to the
Countess and operations leadership.

#### Consequences
* Adopted because: operations staff realistically need "is this zone
  busier than usual this afternoon" granularity, not second-by-second
  data — hourly is more than sufficient and far cheaper than streaming.
* Adopted because: avoids overbuilding infrastructure that patchy WiFi
  would undermine anyway — a "real-time" dashboard that's actually an
  hour stale in some zones would be misleading.
* Adopted despite: staff can't react to a sudden crowd surge within
  minutes; the estate accepts this trade-off given the added cost of
  true real-time.

### Option 2: Near-real-time (minutes-level) streaming pipeline
Full streaming infrastructure (e.g. message-stream processing) for
live dashboards.

#### Consequences
* Rejected because: significant added infrastructure cost and
  operational complexity not justified by how staff actually use the
  data (see ADR discussion with operations).
* Rejected despite: would provide the freshest possible data and support
  future use cases (e.g. dynamic queue-time displays) if ever needed.

### Option 3: Daily batch only
Single daily aggregation, no intra-day updates at all.

#### Consequences
* Rejected because: too coarse for same-day staff reallocation, one of
  the two named use cases for this data.
* Rejected despite: simplest and cheapest possible pipeline.

## Advice
* Revisit this decision if a future feature (e.g. live queue-time
  displays for visitors) requires genuinely real-time data — that would
  justify the added streaming investment on its own merits. -
  Engineering Lead, Sep 2026

## Supporting Material
* Spike 004: Real-time vs. batch analytics
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR003: Visitor Popularity Tracking Method
