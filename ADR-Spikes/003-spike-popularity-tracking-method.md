# Timebox

3 days.

# Context

The Countess has no visibility into which parts of the estate are most
popular, which makes it hard to decide where to invest and deploy staff.
We need to pick a method for measuring footfall/popularity across 40
rides and 55 animal enclosures that's accurate enough to be useful,
affordable at this scale, and works with patchy WiFi.

We need to answer this now because it drives hardware selection and
directly shapes the analytics pipeline that several other features
(staffing, investment decisions) depend on.

Constraints:
- 40 rides + 55 enclosures = ~95 locations needing coverage.
- Budget is for MQTT-capable hardware, not unlimited premium sensors.
- Patchy WiFi (ties to spike 001).
- Visitor privacy — any presence-sensing approach needs to be defensible
  to visitors and regulators.

Interested parties: the Countess, operations/staffing team, marketing
(future personalization use), visitors (privacy).

# Options considered

1. **Ticket-gate/turnstile scans per attraction** — visitors scan/tap at
   entry to each ride or enclosure zone.
2. **BLE/WiFi presence sensing** — passive detection of visitor devices
   near each location (aggregate counts, no individual tracking).
3. **Computer vision people-counting** — cameras at each location count
   visitors via a lightweight vision model.
4. **Sampling-based estimation** — instrument a subset of high-traffic
   locations and statistically extrapolate to the rest.

# Consequences

- Cost per location for each option at ~95 locations — does it fit the
  stated hardware budget?
- Which option produces defensible, GDPR/privacy-appropriate data (BLE
  and CV both need anonymization/aggregation safeguards)?
- Which option best tolerates patchy WiFi (ties to spike 001 findings)?
- Does accuracy matter enough to justify computer vision's added cost and
  complexity over simpler gate scans?
- Could ticket-gate data alone (option 1) get us "good enough" popularity
  signal without extra hardware, given ticketing is already required?
