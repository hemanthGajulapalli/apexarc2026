# Timebox

4 days.

# Context

The Countess needs to track animal health and how much/well animals are
eating across 200+ animals in 55 displays/enclosures. Animal care is
costly, more so if animals get sick, so early detection matters. We need
to know whether off-the-shelf sensors plus a general ML model can cover
this varied a collection, or whether species-specific approaches are
required.

We need to answer this now because it's one of the two named AI use
cases in the brief (alongside popularity), and the answer significantly
affects both hardware selection and how much custom ML work is needed
per species/enclosure type.

Constraints:
- 200+ animals, 55 displays/enclosures, mix of aquatic and land-based —
  high diversity of monitoring needs.
- Budget is for MQTT-capable hardware, not bespoke veterinary equipment.
- Patchy WiFi (ties to spike 001) and edge/cloud inference choice (spike
  002).

Interested parties: animal welfare/keeper staff, the Countess (cost),
visitors (indirect — healthy animals are part of the attraction).

# Options considered

1. **Generic sensor suite + general anomaly-detection model** — weight
   sensors, motion/activity sensors, feeding-station triggers feeding a
   single anomaly-detection model tuned per enclosure baseline.
2. **Species-tiered approach** — a small number of monitoring "profiles"
   (e.g. mammals, reptiles, aquatic) each with tailored sensors and
   models, rather than one-size-fits-all or fully bespoke per species.
3. **Fully bespoke per-species monitoring** — custom sensor/model setup
   for each of the 55 enclosures.
4. **Keeper-reported + AI-assisted triage** — keep humans doing primary
   observation, with AI used to flag patterns in keeper-logged data
   (feeding amounts, behavior notes) rather than raw sensor streams.

# Consequences

- Pilot the generic/tiered approach on a small sample of enclosures
  spanning different species types — does anomaly detection produce
  useful, low-noise alerts?
- What's the false-positive/false-negative rate keepers are willing to
  tolerate before they stop trusting alerts?
- Cost and effort comparison between tiered vs. fully bespoke, at 55
  enclosures.
- Could option 4 (AI-assisted triage on keeper data) be a faster, cheaper
  first step before investing in pervasive sensor hardware?
- How does the chosen approach interact with the jumping piranha
  population-tracking spike (006) — is it a special case or does it fit
  the aquatic tier?
