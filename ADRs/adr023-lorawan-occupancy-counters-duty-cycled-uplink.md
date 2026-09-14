# ADR023 - LoRaWAN Occupancy Counters & Duty-Cycled Periodic Uplink
* Date: Sep 14, 2026
* Status: ACCEPTED

## Decision
Detect zone/area occupancy using **LoRaWAN people/occupancy counters**
(at entry/exit points of each zone) that transmit counts as **periodic
duty-cycled uplinks every 6–7 seconds** over the existing ADR001
gateway → MQTT → cloud path. Occupancy is computed from these readings
as **incremental/rolling counts**, not hourly batch aggregation. This is
recorded as a **bounded, named exception to ADR004's hourly-batch
default**: still no streaming infrastructure (no message-stream
processing platform, no continuous-consumption consumers) — the
"real-time" is achieved by the radio's transmission cadence plus a
lightweight rolling counter, nothing more. The 6–7 s periodic
transmission pattern (a **periodic duty-cycled uplink**, sometimes
called a heartbeat-style report in LoRaWAN practice) is deliberately
chosen to stay within **sub-GHz ISM-band duty-cycle regulations**:
**ETSI EN 300 220** (EU 868 MHz band, typically 1% duty cycle per
sub-band per hour) and **FCC Part 15** rules (US 915 MHz, where dwell-
time/channel-access limits apply instead). Short, infrequent counter
reports — a few bytes per uplink — keep each node's airtime well inside
the legal per-node duty-cycle budget while giving occupancy freshness
that hourly batching cannot.

## Context
The business asked for real-time "which areas are full / where to go"
advisory (extended use case UC01.a). ADR004 deliberately rejected
streaming infrastructure and set hourly batch as the analytics default,
sized to the staffing/investment decision cadence. Two things have
changed since ADR004:

1. **The radio layer changed, not the decision layer.** The estate's
   IoT/hardware lead has deployed LoRaWAN occupancy counters (a natural
   evolution of the ADR001/ADR003 LoRaWAN fan-in decision — same
   gateways, same MQTT path). These devices report every 6–7 s, which
   is sufficient for "is this area full" occupancy detection without
   being a continuous stream in the infrastructure sense.
2. **A visitor-facing freshness need now exists** (advisory of
   full/free areas) that hourly aggregation genuinely cannot serve —
   an hour-stale "full/free" sign would mislead visitors and staff.

LoRaWAN is a shared, regulated spectrum: sub-GHz ISM bands impose
**legal duty-cycle limits** on how long any node may transmit per hour
(ETSI EN 300 220 in the EU 868 MHz band; FCC Part 15 in the US 915 MHz
band). This is a hard legal constraint, not a performance preference —
any transmission design must be proven compliant, and a naive
"transmit on every change" or high-rate continuous design could breach
the per-node duty-cycle budget, especially at 15,000 visitors/day with
counters at every zone boundary.

## Options Considered

### Option 1 (SELECTED): LoRaWAN occupancy counters, 6–7 s periodic duty-cycled uplinks, rolling-count aggregation
Counters uplink compact count payloads on a fixed 6–7 s period through
the existing ADR001 gateways. Cloud side keeps a lightweight rolling/
incremental occupancy state per zone (last reading + in/out deltas)
instead of waiting for hourly batch. ADR004's hourly/daily aggregation
continues unchanged for analytics — this exception covers only the
occupancy indicator surface.

#### Consequences
* Adopted because: 6–7 s periodic uplinks of a few-byte payload are
  **duty-cycle compliant by design** under ETSI EN 300 220 / FCC Part 15
  budgets — fixed periodicity (vs. event-triggered bursts) makes the
  per-node airtime predictable and auditable, which matters legally.
* Adopted because: rides the existing LoRaWAN gateway → MQTT ingestion
  path (ADR001) — no new radios, network, or streaming platform; the
  only new cloud-side component is a rolling counter, which is a plain
  state store, not stream processing.
* Adopted because: 6–7 s freshness is decisively sufficient for
  full/free advisory — visitors and staff act on the order of minutes,
  not seconds.
* Adopted despite: it is a real exception to ADR004 — recorded as
  bounded and named (occupancy indicator only) so the batch default
  does not silently erode; ADR004's own advice ("revisit if a future
  feature requires fresher data") anticipated exactly this.
* Adopted despite: fixed periodic transmission trades battery life and
  spectrum headroom for simplicity/predictability; if counter density
  grows significantly, the cadence or payload must be re-validated
  against the duty-cycle budget.

### Option 2: Event-driven uplink (transmit only on count change)
Nodes transmit only when occupancy changes — fewer messages, same
freshness at low occupancy.

#### Consequences
* Rejected because: unbounded burst behavior (a crowd surge generates
  change-on-every-count) makes worst-case airtime unpredictable and
  risks breaching the ETSI/FCC duty-cycle budgets exactly when the data
  matters most; fixed periodicity was chosen for regulatory
  predictability.
* Rejected despite: lower average channel load and better battery life
  in quiet periods.

### Option 3: Keep hourly batch; present "occupancy" as hourly aggregates
No exception to ADR004 at all; visitors see hour-stale full/free
status.

#### Consequences
* Rejected because: an hour-stale "area full" indicator is actively
  misleading for a visitor-facing surface — worse than no indicator.
* Rejected despite: zero new engineering and perfect ADR004 fidelity.

## Advice
* Document the per-node duty-cycle math (payload bytes × airtime ×
  period vs. the 1% ETSI budget) in the deployment runbook per counter
  model, so a future hardware swap can be re-validated against the
  regulation, not rediscovered. - Engineering Lead, Sep 2026
* If visitor-facing queue-time displays (ADR004's named future feature)
  ever land, revisit whether this exception should widen — but do not
  widen it by accretion. - Engineering Lead, Sep 2026

## Supporting Material
* UC01.a: Real-Time Occupancy & Area Advisory (Extended Case)
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR004: Real-Time vs. Batch Analytics Pipeline (bounded exception)
* ADR003: Visitor Popularity Tracking Method
* ETSI EN 300 220 (EU 868 MHz short-range devices, duty-cycle limits);
  FCC Part 15 (US 915 MHz, dwell-time limits)
