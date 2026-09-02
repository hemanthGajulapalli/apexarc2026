# ADR009 - Ticketing & Family Pass Architecture
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use an **off-the-shelf ticketing SaaS platform** (selected via standard
procurement criteria: cost, API/webhook granularity, family-pass
support) integrated via webhooks into a thin custom layer that feeds
gate-scan events into the popularity-analytics pipeline (ADR003/ADR004).

## Context
The estate needs visitors to be able to buy tickets, including family
passes. This is a well-understood problem space, not the estate's
differentiator, so the goal is to minimize build effort here and reserve
engineering investment for the AI-driven features that are the actual
focus of the brief — while still ensuring the ticketing data integrates
cleanly with popularity analytics.

## Options Considered

### Option 1 (SELECTED): Off-the-shelf SaaS + thin integration layer
Adopt an existing ticketing platform that supports family passes and
provides a webhook/API feed of scan events. Build a small integration
service that consumes those events and publishes them into the same
pipeline used for popularity data (ADR003).

#### Consequences
* Adopted because: avoids spending scarce engineering time
  re-building well-solved ticketing/payment functionality (PCI
  compliance, family-pass logic, refunds) from scratch.
* Adopted because: fastest path to a working, reliable purchase flow —
  lower risk than a custom build for a business-critical, revenue-facing
  system.
* Adopted despite: less control over the exact data shape/timing of
  scan events — the integration layer needs to adapt to whatever the
  chosen platform exposes.
* Adopted despite: ongoing SaaS subscription cost vs. a one-time build,
  though this is expected to be cheaper than build-and-maintain over the
  relevant time horizon.

### Option 2: Custom-built ticketing service
Fully bespoke ticketing system integrated natively with the rest of the
architecture.

#### Consequences
* Rejected because: ticketing/payments is a solved problem elsewhere;
  building it from scratch (including compliance overhead) is a poor
  use of the team's limited time relative to the AI features that are
  the brief's actual focus.
* Rejected despite: would give full control over data shape and could
  integrate most tightly with the analytics pipeline.

## Advice
* Evaluate 2-3 SaaS candidates specifically on webhook granularity (can
  we get a scan event per zone/attraction, not just per ticket
  purchase?) since that directly determines whether Option 1 supports
  ADR003's popularity-tracking design. - Engineering Lead, Sep 2026

## Supporting Material
* Spike 009: Ticketing & family pass architecture
* ADR003: Visitor Popularity Tracking Method
