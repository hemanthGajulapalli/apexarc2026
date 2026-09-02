# Timebox

2 days.

# Context

The Countess wants more returning visitors but isn't sure how to
achieve it. An AI-driven personalization/recommendation feature (e.g. a
concierge suggesting itineraries, tailored offers) is one option, but we
don't know if it would meaningfully move repeat-visit behavior, or
whether more basic, non-technical levers (pricing, loyalty programs,
seasonal events) should be tried first.

We need to answer this now because it's one of the two named growth
levers in the brief (alongside visitor growth to 15,000/day), and
committing engineering effort to a personalization feature is only
worthwhile if it's likely to move the needle.

Constraints:
- No existing visitor data/history to personalize against yet — this
  depends on the ticketing system (spike 009) being in place first.
- Estate needs to reach 15,000 visitors/day within 3 years — growth from
  new visitors may matter more early on than retention.

Interested parties: the Countess, marketing/operations, visitors.

# Options considered

1. **AI-driven personalized itineraries/recommendations** — using
   visitor history and popularity data (spike 003) to suggest
   under-visited attractions or personalized offers.
2. **Simple loyalty/rewards program** — non-AI mechanism (e.g. punch
   card, family pass renewal discount) as a lower-risk first step.
3. **AI concierge/chat assistant** — a conversational assistant helping
   visitors plan their day on-site, indirectly increasing satisfaction
   and likelihood of return.
4. **Do nothing yet — defer** — focus resources on the ticketing/
   analytics/animal monitoring foundations first, revisit retention once
   visitor data exists to personalize against.

# Consequences

- Is there any existing evidence (industry benchmarks, comparable
  attractions) on what actually drives repeat visits at similar-scale
  attractions?
- Does personalization require visitor data we won't have until the
  ticketing system (spike 009) has been running for a season?
- Could a low-cost loyalty mechanism be tested first, with AI
  personalization layered on once data exists?
- What would "success" look like — is repeat-visit rate measurable well
  enough to know if this worked?
