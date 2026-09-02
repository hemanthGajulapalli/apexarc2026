# ADR020 - CI/CD & Model Deployment Pipeline
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use a **single shared CI/CD pipeline** for all services (ADR012), with a
**distinct, additional gate for AI model changes**: any model or
provider change (ADR010) must pass the golden-set regression suite
(ADR011) before deployment, in addition to normal code review and
service tests. Application code and models are deployed independently
of each other (a model update doesn't require redeploying the service
code that calls it, and vice versa).

## Context
The solution has both regular application code (ingestion, ticketing
integration, dashboards) and AI models (anomaly detection, vision
counting) that change on different cadences and carry different risks.
Application code changes are well-served by standard CI/CD practice;
model changes need the additional verification described in ADR011
before going live, and shouldn't be gated by unrelated code changes or
vice versa.

## Options Considered

### Option 1 (SELECTED): Shared pipeline, independent deploy paths, extra gate for models
One CI/CD system serves the whole solution for consistency and lower
operational overhead, but model artifacts are versioned, tested (golden
-set per ADR011), and deployed independently from application code
releases, via a separate deployment path within the same pipeline
tooling.

#### Consequences
* Adopted because: keeps a single set of pipeline tooling and practices
  for the team to learn and maintain, rather than a wholly separate
  MLOps system.
* Adopted because: decoupling model deploys from application deploys
  means a model rollback (if drift/regression is detected per ADR011)
  doesn't require rolling back unrelated application code, and vice
  versa.
* Adopted despite: requires the team to build the golden-set gate as
  custom pipeline tooling rather than relying on off-the-shelf CI
  patterns alone.

### Option 2: Fully separate MLOps platform for model deployment
Adopt a dedicated third-party MLOps product for all model versioning
and deployment, distinct from the application CI/CD system.

#### Consequences
* Rejected because: adds a second vendor relationship/tool to learn and
  maintain for a solution with a modest number of models — not
  justified at this scale.
* Rejected despite: purpose-built MLOps tooling may offer richer model-
  specific features than a general CI/CD system extended for this
  purpose.

### Option 3: No distinction between code and model deploys
Treat model files as just another artifact deployed alongside
application code changes, with no separate gate.

#### Consequences
* Rejected because: skips the golden-set verification step (ADR011)
  that's specifically meant to catch model regressions before
  production — bundling deploys together makes it easy to accidentally
  skip or dilute that check.
* Rejected despite: simplest possible pipeline, fewer deployment
  concepts to manage.

## Advice
* Treat the golden-set gate as a hard blocker, not an advisory check —
  a model change that fails it should not be deployable without an
  explicit, logged override decision. - Engineering Lead, Sep 2026

## Supporting Material
* ADR010: Model & Provider Portability Strategy
* ADR011: Verification of Non-Deterministic AI Outputs
* ADR012: Overall System Architecture Style
