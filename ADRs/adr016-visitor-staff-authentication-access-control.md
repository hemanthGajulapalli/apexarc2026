# ADR016 - Visitor & Staff Authentication and Access Control
* Date: Sep 2, 2026 (decision revised Sep 6, 2026)
* Status: ACCEPTED

## Decision
Use a standards-based **OAuth 2.0 / OIDC authentication** approach for
**both visitor and staff identity**, built on the cloud platform's
managed identity service (ADR013) — **not delegated to the ticketing
SaaS platform** (ADR009). Visitors authenticate via OAuth (supporting
third-party identity providers, e.g. Google/Apple sign-in, alongside an
estate-managed account for visitors without one); this identity is
decoupled from ticket purchasing. The ticketing platform (ADR009)
continues to handle payment/ticket issuance only, linked to the
visitor's OAuth identity by account ID rather than owning that identity
itself. Staff continue to use the same managed identity service with
**role-based access control** (roles: Keeper, Operations, Admin).

## Context
The solution has two distinct user populations with very different
needs: visitors (buying tickets, possibly a future loyalty account) and
internal staff (reviewing animal alerts, viewing popularity dashboards).
The original decision delegated visitor identity entirely to the
ticketing SaaS platform to avoid building custom auth. On review, that
approach ties visitor identity — not just payment data — to a vendor
whose core business is payments, not identity: if the ticketing vendor
is ever changed (a real possibility ADR009's own advice already
anticipates by recommending evaluation of 2-3 SaaS candidates), visitor
accounts and login would need a disruptive migration on top of the
payment migration. Keeping identity on infrastructure the estate
already controls and pays for (the cloud platform selected in ADR013)
avoids compounding that vendor-dependency risk, without taking on the
engineering/security liability of building credential storage from
scratch.

## Options Considered

### Option 1: SaaS-delegated visitor auth + managed identity for staff (ORIGINAL DECISION, SUPERSEDED)
Visitor login/payment identity lived entirely within the ticketing
platform (ADR009); staff access used the cloud platform's managed
identity/IAM service.

#### Consequences
* Adopted (originally) because: avoids taking on PCI-DSS/payment-
  security scope and password-storage liability for visitor accounts —
  the ticketing platform already carries that responsibility.
* Superseded because: ties visitor identity data to the ticketing
  vendor specifically, not just payment data — a future ticketing
  vendor change would force a visitor identity migration in addition to
  a payment migration, doubling the vendor-lock-in surface the
  ticketing decision itself already accepts.

### Option 2 (SELECTED): OAuth/OIDC via the cloud platform's managed identity service, for both visitors and staff
Visitors authenticate via OAuth 2.0/OIDC — through supported
third-party identity providers or an estate-managed account — using the
same managed identity service (ADR013) that already serves staff.
Ticket purchase and payment remain with the ticketing SaaS (ADR009),
linked to the visitor's OAuth identity by account ID. Staff continue
exactly as before: managed identity + RBAC (Keeper, Operations, Admin).

#### Consequences
* Adopted because: keeps visitor identity on infrastructure the estate
  already controls and pays for (ADR013), rather than adding a second
  vendor dependency on top of the payment one.
* Adopted because: OAuth/OIDC is a mature, standard protocol — this
  still avoids building credential storage or password handling from
  scratch, preserving most of the original decision's engineering-
  effort savings.
* Adopted because: unifies visitor and staff identity onto one managed
  identity service, simplifying the access-control model to one system
  instead of two.
* Adopted despite: requires building an account-linking layer between
  the OAuth identity and the ticketing platform's purchase records,
  which Option 1 didn't need — a small, one-time integration cost.
* Adopted despite: the estate remains dependent on the cloud platform's
  managed identity service (ADR013) rather than being fully
  independent — accepted as the same infrastructure dependency ADR013
  already established for everything else.

### Option 3: Custom-built authentication for both visitors and staff
Build and operate our own auth system end-to-end.

#### Consequences
* Rejected because: takes on unnecessary security liability
  (credential storage, payment handling) and engineering effort for a
  well-solved problem, diverting resources from the AI features that
  are the brief's actual focus.
* Rejected despite: full control over the user experience and data
  model.

## Advice
* Keep the staff role list minimal at launch (the three named roles)
  and only add finer-grained roles if a real operational need for
  narrower permissions emerges. - Engineering Lead, Sep 2026
* Build and test the OAuth account-linking layer to the ticketing
  platform against real purchase flows before launch — this is the one
  new integration point this revision introduces over the original
  SaaS-delegated design. - Engineering Lead, Sep 6, 2026

## Supporting Material
* ADR009: Ticketing & Family Pass Architecture
* ADR013: Cloud Platform Selection
