# ADR016 - Visitor & Staff Authentication and Access Control
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Delegate **visitor identity/payment authentication to the ticketing
SaaS platform** (ADR009) rather than building a custom visitor account
system. For internal staff/keeper access (alert review per ADR007,
operations dashboards), use the cloud platform's **managed identity
service with role-based access control** (roles: Keeper, Operations,
Admin), rather than a custom-built auth system.

## Context
The solution has two distinct user populations with very different
needs: visitors (buying tickets, possibly a future loyalty account) and
internal staff (reviewing animal alerts, viewing popularity dashboards).
Building custom authentication for either is unnecessary engineering
effort given mature, off-the-shelf options exist for both.

## Options Considered

### Option 1 (SELECTED): SaaS-delegated visitor auth + managed identity for staff
Visitor login/payment identity lives entirely within the ticketing
platform (ADR009); our services never store visitor passwords or
payment details directly. Staff access uses the cloud platform's
managed identity/IAM service with a small number of roles matching real
job functions (Keeper, Operations, Admin).

#### Consequences
* Adopted because: avoids taking on PCI-DSS/payment-security scope and
  password-storage liability for visitor accounts — the ticketing
  platform already carries that responsibility.
* Adopted because: managed identity/RBAC for staff is far cheaper to
  stand up and keep secure than a custom auth system, and integrates
  with the same cloud platform (ADR013).
* Adopted despite: ties visitor identity data to the ticketing vendor —
  if that vendor is ever changed, visitor accounts/history would need a
  migration plan (distinct from the AI-provider portability question in
  ADR010, but a similar category of vendor dependency).

### Option 2: Custom-built authentication for both visitors and staff
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

## Supporting Material
* ADR009: Ticketing & Family Pass Architecture
* ADR013: Cloud Platform Selection
