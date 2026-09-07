# Timebox

2 days.

# Context

The Customer App wireframe already shows a live "Tour Assistant" chat
and personalized checkout offers ("Customer GenAI"), but UC04 only
names an "in-park AI concierge experience" as a Phase Two possibility
with no architecture behind it. This is a visitor-facing, unsupervised
generative AI surface — no keeper or ops staff sits between a generated
answer and the person who sees it, unlike every other AI feature in
this solution.

We need to answer this now because a wrong or hallucinated answer about
ride safety or animal enclosures, delivered directly to a member of the
public with no human review, is a materially different risk profile
than the internal alerting features that already went through ADR007's
human-in-the-loop treatment.

Constraints:
- Must fit UC04's existing Phase Two gate (ADR008) — not meaningful
  before real ticketing/popularity history exists.
- Must fit the estate's privacy/consent posture (ADR018) for anything
  using visitor history.
- Provider/portability choice (ADR010) applies — prefer open/
  self-hostable models for lower-stakes tasks where possible.

Interested parties: visitors (direct users), marketing/operations
(growth goal owner), engineering (verification burden, the highest of
any feature in this solution given the lack of a human-in-the-loop
moment).

# Options considered

1. **Grounded/retrieval-based assistant + offers, confidence-labeled**
   — restrict responses to a retrieval layer over the estate's own live
   data; label every response with its grounding source and a
   confidence score.
2. **Open-ended general-purpose assistant** — no grounding restriction,
   broader conversational range.
3. **Offers only, no chat** — drop the conversational assistant, keep
   only the checkout personalization surface.

# Consequences

- Draft a golden-set of real visitor-style questions (not synthetic)
  covering both general park info and ride/animal-safety-adjacent
  questions, and check whether confidence scoring reliably separates
  the two in practice.
- What's the actual latency/cost of a grounded retrieval layer at
  expected visitor volumes (up to 15,000/day, per the growth target) —
  does it change the provider choice under ADR010?
- Is there a case for a "connect me to a person" escalation path when
  confidence is low, rather than forcing an answer?
- Does a wrong answer about ride safety carry different legal/
  reputational exposure than a wrong answer about, say, ticket pricing
  — and should the golden-set bar differ accordingly?
