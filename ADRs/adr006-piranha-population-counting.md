# ADR006 - Jumping Piranha Population Counting
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use **periodic manual sampling with AI-assisted photo counting**, rather
than continuous computer-vision monitoring. Keepers take scheduled
photos/short video during routine checks; a vision model assists by
counting individuals in that footage and flags any significant drop
versus the prior count for keeper review.

## Context
The brief specifically requires checking population levels in the
jumping piranha collection. Continuous underwater computer vision is the
most direct approach but is complicated by water clarity, camera
fouling/maintenance, and occlusion from fast-moving fish, all of which
push cost and reliability risk up for a single enclosure relative to the
value gained.

## Options Considered

### Option 1 (SELECTED): Periodic sampling + AI-assisted counting
Keepers capture photo/video during scheduled checks (e.g. weekly, or
alongside feeding). A vision model counts visible individuals from the
captured media and compares against the running history, surfacing a
flag if the count drops meaningfully.

#### Consequences
* Adopted because: avoids the cost and maintenance burden of a
  permanently installed underwater camera system for a single
  enclosure type.
* Adopted because: population changes in a contained enclosure happen on
  a timescale (days/weeks) that periodic sampling adequately covers —
  continuous monitoring isn't needed to catch a real decline in time to
  act.
* Adopted despite: lower temporal resolution than continuous monitoring
  — a rapid population event between samples could be missed until the
  next check.
* Adopted despite: counting accuracy from photos/video is still
  imperfect due to occlusion; the model's count is a decision aid for
  keepers, not a fully automated headcount.

### Option 2: Continuous computer vision counting
A fixed underwater/overhead camera feeding continuous footage to a
counting model.

#### Consequences
* Rejected because: underwater camera fouling, maintenance, and glare
  make continuous reliability costly to guarantee for one enclosure,
  disproportionate to the value over periodic sampling.
* Rejected despite: would catch population changes fastest and require
  no keeper time to capture footage.

### Option 3: RFID/tagging-based counting
Tag individuals and estimate population via tag reads.

#### Consequences
* Rejected because: impractical and potentially inhumane to tag a large,
  fast-breeding fish population at this scale.
* Rejected despite: would give precise, individual-level tracking if
  feasible.

### Option 4: Proxy indicators (feeding consumption trends)
Infer population trend from how much food is consumed rather than
direct counting.

#### Consequences
* Rejected as sole method because: too indirect to distinguish
  population decline from reduced appetite or other causes.
* Rejected despite: cheap to implement and complements the selected
  option as an additional early-warning signal, worth capturing anyway
  as part of ADR005's feeding data.

## Advice
* Validate the vision model's counting accuracy against a keeper's
  manual count over several sampling cycles before trusting it to flag
  declines unsupervised. - Animal Welfare Lead, Sep 2026

## Supporting Material
* Spike 006: Jumping piranha population counting
* ADR005: Animal Health & Feeding Monitoring Approach
