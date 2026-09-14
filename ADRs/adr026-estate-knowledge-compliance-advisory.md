# ADR026 - Estate Knowledge & Compliance Advisory (Grounded SOP/Regulatory RAG, Human-in-Loop)
* Date: Sep 14, 2026
* Status: ACCEPTED

## Decision
Provide staff-facing **AI advisory over the estate's own governing
documents** — SOPs, animal husbandry standards (UC02.b), flora/grounds
maintenance standards, and applicable public-domain regulations — using
the same **grounded/retrieval (RAG) pattern as ADR022's Customer
GenAI**, pointed inward: every advisory answer must cite the specific
SOP/regulation clause it is grounded in, carry a confidence score, and
where the advisory would trigger a **real-world action** (treatment,
closures, regulatory filings, husbandry changes) it is routed through
**ADR007's mandatory human-confirmation guardrail** — the advisory
recommends, an accountable human approves. The document corpus and the
advisory model go through ADR010 provider portability and ADR011
golden-set/drift verification like every other AI feature.

## Context
Extended use cases UC02.b (flora/husbandry standards & logs), UC02.e
(compliance advisory), and part of UC02.d (acting on public-domain
regulatory notices) all reduce to one capability: staff asking "what do
our standards and the regulations say applies here?" and getting a
trustworthy, cited answer. Today that lives in binders, tribal
knowledge, and the vet/ops leads' heads — a scaling risk as the estate
grows 3× and adds flora governance it historically never needed.
The estate is cost-constrained and cannot staff a compliance desk;
this advisory is the substitute, which makes its trustworthiness
guardrails non-negotiable.

## Options Considered

### Option 1 (SELECTED): Grounded RAG over the estate corpus + public regulations, ADR007 human confirmation for action-triggering advice
A curated, versioned document corpus (estate SOPs + applicable
regulations, refreshed on a schedule) feeds a retrieval-grounded
advisory; answers cite clause-level sources; action-triggering advice
requires human approval recorded in the audit trail.

#### Consequences
* Adopted because: clause-level citation makes every answer verifiable
  by the asking staff member — the same "state what it's grounded in"
  discipline ADR022 established for visitors, applied where staff can
  actually check it.
* Adopted because: reuses ADR007's human-confirmation pattern instead
  of inventing a second guardrail; the estate's core principle — AI
  recommends, humans decide — extends unchanged to compliance.
* Adopted because: ADR010 portability means the advisory LLM is
  swappable — important for a feature whose value compounds over years
  as the corpus grows.
* Adopted despite: corpus curation (versioning SOPs, tracking
  regulatory changes — which UC02.d's scanning feeds) is ongoing
  operational work, not a one-time build.
* Adopted despite: RAG over regulations can still surface stale or
  superseded clauses if corpus versioning slips; golden-set must
  specifically include "superseded regulation" cases.

### Option 2: Fine-tuned model on the estate corpus (no retrieval layer)
Bake the standards into model weights via fine-tuning.

#### Consequences
* Rejected because: fine-tuned weights cannot cite clauses, silently
  go stale when SOPs change, and every corpus update is a retraining +
  redeploy cycle through the ADR020 gate — operationally wrong for a
  corpus that changes on regulatory timescales.
* Rejected despite: simpler runtime architecture (no retrieval layer).

### Option 3: No AI — keep compliance lookup manual
Searchable document store, staff self-serve.

#### Consequences
* Rejected because: it does not scale to the 3× visitor growth or the
  new flora/regulatory load, and the estate cannot afford the staff to
  make it work — the exact constraint driving this extended-case
  program.
* Rejected despite: zero AI-verification surface.

## Advice
* Seed the golden-set with the questions the vet and ops leads actually
  fielded in the last year — like ADR022's advice, a compliance
  golden-set only catches what it was built to expect. - Operations
  Lead, Sep 2026
* Corpus versioning is the real deliverable: an advisory that can't
  prove *which version* of an SOP it answered from is worse than
  binders. Make corpus version a first-class field in every citation. -
  Engineering Lead, Sep 2026
* Advisory output touching animal welfare or public safety should be a
  distinct high-bar golden-set category, mirroring ADR022's safety
  category for visitor answers. - Engineering Lead, Sep 2026

## Supporting Material
* UC02.b: Flora & Husbandry Standards, Logs & Predictions (Extended Case)
* UC02.d: Proactive Public-Alert Scanning (Extended Case)
* UC02.e: Compliance Advisory (Extended Case)
* ADR007: Alert Validation & False-Positive Tolerance (human-in-loop)
* ADR010: Model & Provider Portability Strategy
* ADR011: Verification of Non-Deterministic AI Outputs
* ADR022: Visitor Concierge & Personalization Assistant (pattern source)
