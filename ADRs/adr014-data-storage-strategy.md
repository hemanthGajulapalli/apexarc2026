# ADR014 - Data Storage Strategy
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use **purpose-fit storage per data type** rather than a single
database for everything: a managed time-series database for sensor
telemetry (feeding, activity, popularity counts), a managed relational
database for structured business data (ticketing records, visitor
accounts, animal/enclosure metadata), and object storage for media
(piranha-count photos/video, any vision-model inputs).

## Context
The solution generates several very different data shapes: high-volume,
append-only sensor readings; structured transactional records (tickets,
accounts); and unstructured media for vision-based features (ADR006).
Forcing all of this into one database type would mean compromising on
either write throughput, query flexibility, or storage cost.

## Options Considered

### Option 1 (SELECTED): Purpose-fit storage per data type
Time-series DB for telemetry, relational DB for transactional/reference
data, object storage for media, all managed services within the chosen
cloud platform (ADR013).

#### Consequences
* Adopted because: each data type is stored in a system optimized for
  its access pattern — time-series data is cheap to write and query by
  time range; relational data supports the transactional integrity
  ticketing needs; object storage is the cheapest option for media.
* Adopted because: managed services (per ADR013) mean the team isn't
  operating three different database technologies by hand.
* Adopted despite: three storage systems to understand and integrate,
  versus one — services that need data from more than one store (e.g.
  Animal Monitoring needing both telemetry and media) must handle that
  complexity.

### Option 2: Single relational database for everything
Store telemetry, transactional data, and media metadata all in one
relational database.

#### Consequences
* Rejected because: relational databases are a poor fit for high-volume
  time-series writes at 100+ device scale — either performance or cost
  degrades as telemetry volume grows.
* Rejected despite: simplest single system to operate and query across.

### Option 3: Single NoSQL/document database for everything
Store all data types in one flexible-schema document database.

#### Consequences
* Rejected because: loses the strong transactional guarantees
  ticketing/payments data benefits from, and is still not optimized for
  time-series query patterns (e.g. "average feeding amount per
  enclosure per week").
* Rejected despite: schema flexibility could simplify early development
  across varied data shapes.

## Advice
* Keep the number of storage technologies to the three named here;
  resist adding a fourth without a clearly demonstrated need — storage
  sprawl is a common source of unnecessary operational cost.
  - Engineering Lead, Sep 2026

## Supporting Material
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR006: Jumping Piranha Population Counting
* ADR013: Cloud Platform Selection
