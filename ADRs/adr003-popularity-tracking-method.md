# ADR003 - Visitor Popularity Tracking Method
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use **ticket-gate/checkpoint scans** at each ride and enclosure zone
entry as the primary popularity signal, since ticketing (ADR009) already
requires visitor scanning infrastructure. Supplement with **BLE presence
sensing** only in a small number of high-value zones (e.g. the most
expensive rides, flagship animal displays) where dwell-time data adds
real decision-making value beyond simple entry counts.

## Context
The Countess has no visibility into which parts of the estate are most
popular, making staffing and investment decisions difficult. We need a
method that's accurate enough to be useful across ~95 locations (40
rides + 55 enclosures), affordable, privacy-defensible, and tolerant of
patchy WiFi.

## Options Considered

### Option 1 (SELECTED): Ticket-gate scans + targeted BLE in key zones
Every ride/enclosure has a simple scan point (reusing ticketing
infrastructure) giving entry counts. A small number of strategically
chosen zones get BLE presence sensors added, giving dwell-time and
re-visit-within-day signal where it's most valuable.

#### Consequences
* Adopted because: entry counts are essentially "free" once ticketing
  (ADR009) exists — no extra hardware needed for the baseline signal
  across all 95 locations.
* Adopted because: targeting BLE at a handful of high-value zones keeps
  the added cost and privacy surface small while still getting richer
  data where it matters most.
* Adopted despite: entry counts alone don't capture dwell time or
  whether visitors actually enjoyed/used the attraction, only that they
  entered.
* Adopted despite: BLE zones need explicit privacy handling (aggregate
  counts only, no persistent device tracking) to stay defensible.

### Option 2: Computer vision people-counting at every location
Cameras at all 95 locations count visitors via a vision model.

#### Consequences
* Rejected because: highest cost and complexity option, and adds
  significant privacy/consent overhead across areas where it isn't
  clearly justified by the value gained.
* Rejected despite: most accurate and richest option, and would capture
  dwell time and flow patterns everywhere.

### Option 3: BLE/WiFi presence sensing everywhere
Passive presence sensing deployed at all 95 locations.

#### Consequences
* Rejected because: unnecessary cost across the whole estate when
  ticket-gate data already provides a "good enough" signal for most
  locations' staffing decisions.
* Rejected despite: better than ticket scans alone at capturing
  dwell-time everywhere, not just in selected zones.

## Advice
* Choose the initial BLE-equipped zones based on where staffing/
  investment decisions are currently hardest to make with gut feel
  alone — revisit the zone list after the first season's ticket-gate
  data is in. - Operations Lead, Sep 2026

## Supporting Material
* Spike 003: Popularity tracking method
* ADR009: Ticketing & Family Pass Architecture
