---
name: von-digitalis-kata
description: Reference brief for the "Architectural Katas 2026 - AI-Assisted Software Architecture" problem (Von Digitalis Estates). Use this whenever working on the architecture proposal, diagrams, or ADRs for this kata, so the problem statement, required outcomes, and constraints don't need to be re-derived from the source PDF each time.
---

# Von Digitalis Estates — Kata Brief

## Problem Statement

The 72nd Countess Von Digitalis has unexpectedly inherited a large, sprawling
estate. The family's previous revenue source (explosive garden gnomes) is no
longer viable, and she needs digital solutions to make the estate profitable.

The estate has three monetizable assets:
- A historically important collection of **40 eighteenth-century amusement
  park rides**, recently cleared to re-open after safety remediation.
- A previously private **exotic and poisonous animal collection** — 200+
  animals across 55 displays/enclosures, a mix of aquatic and land-based
  species (including a jumping piranha population) — now opening to the
  public.
- The estate grounds themselves as a visitor attraction.

Current traffic is ~5,000 visitors/day. The estate needs to grow this to at
least 15,000/day within three years, or the family will be forced to sell
off other holdings.

The task: propose a comprehensive, modern architecture for the estate,
with particular emphasis on where and how AI tooling can enhance the
solution for both the business and its visitors.

## Expected Outcomes

**Functional requirements:**
- Ticket purchasing, including family passes, for estate access.
- Visibility into how popular different areas of the park are, to guide
  investment and staff deployment decisions.
- Monitoring for the exotic animal collection: animal health, feeding
  amount/quality, and population tracking (notably the jumping piranha
  enclosure).
- A mechanism to grow visitor numbers *and* increase profitability.

**Business problems the solution must address:**
- No current visibility into which parts of the estate are most popular —
  makes investment/staffing decisions difficult.
- Animal care is costly, more so if animals become sick — solution should
  support healthy, happy animals.
- Low visitor return rate — solution should help increase repeat visits.

**Submission deliverables:**
- A short narrative overview of how the team used AI to solve the
  estate's problems.
- Diagrams (comprehensive and targeted) for each use of AI in the solution.
- ADRs for each AI-related architectural decision, including trade-off
  analysis.
- (Optional) pertinent implementation details.
- (Semi-finalist teams only) a five-minute video walkthrough of the
  approach.

**Evaluation criteria the solution will be judged against:**
- Innovative use of AI in the solution(s).
- Suitability of the solution given the stated constraints.
- Appropriate level of detail in the communication/diagrams.
- How well the solution deals with uncertainty in AI technology.
- Whether the architectural characteristics of the AI additions match the
  existing architecture.
- Validation and verification approach for AI-produced results.

## Constraints

**Technical:**
- WiFi coverage across the park is patchy.
- Cloud services may be used, but the solution needs an explicit mechanism
  for getting data from the estate up to the cloud.
- Budget exists for MQTT-capable hardware devices, which can be deployed
  throughout the park.

**Business/domain scale:**
- 40 rides in the amusement park area.
- 200+ animals across 55 displays/enclosures in the exotic animal
  collection.
- ~5,000 visitors/day currently, targeting 15,000/day within 3 years.

## Reference Material

For judge bios, their books/links, and other resources cited in the kata
deck, see the companion judges-and-resources.md file.
