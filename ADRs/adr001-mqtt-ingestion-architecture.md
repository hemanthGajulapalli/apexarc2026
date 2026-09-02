# ADR001 - MQTT Ingestion Architecture for Patchy WiFi
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use **zone-based MQTT gateway devices** with local persistent queuing
(store-and-forward, QoS 1) rather than connecting every sensor directly
to the cloud. Sensors within a physical zone (a ride, an enclosure
cluster) publish to a local gateway over short-range radio/wired
connection; the gateway buffers and forwards to the cloud broker when
WiFi is available.

## Context
The estate's WiFi coverage is patchy across 40 rides, 55 animal
enclosures, and ticket gates. Nearly every downstream feature —
popularity analytics, animal health monitoring, ticketing — depends on
data actually arriving. Connecting ~100+ individual devices directly to
WiFi means each one independently has to handle its own outage/retry
logic, which is expensive to build and hard to make reliably
idempotent at that scale. Budget exists for MQTT-capable hardware but is
not unlimited, so the design needs to minimize the number of expensive,
directly cloud-connected devices.

## Options Considered

### Option 1 (SELECTED): Zone-based gateway with store-and-forward
A small number of hardier gateway devices per zone (roughly one per ride
or enclosure cluster) aggregate readings from cheaper local sensors and
handle the buffering/retry/deduplication logic centrally. Only gateways
need to reliably reach WiFi; sensors just need to reach their gateway.

#### Consequences
* Adopted because: concentrates the expensive "reliable cloud
  connectivity" problem into a small number of devices instead of every
  sensor, which is significantly cheaper at ~100+ endpoint scale.
* Adopted because: local buffering means a WiFi outage in one zone
  doesn't lose data — it delays it, and the gateway can deduplicate on
  reconnect.
* Adopted despite: introduces a zone-level single point of failure — if
  a gateway itself fails, the whole zone goes dark until replaced.
* Adopted despite: adds an extra hop and a device class to manage
  (firmware updates, provisioning) that a fully direct-to-cloud design
  wouldn't need.

### Option 2: Direct-to-cloud MQTT per device
Every sensor connects directly to the cloud MQTT broker with its own
local buffer.

#### Consequences
* Rejected because: at ~100+ devices, per-device reliable-delivery logic
  and direct WiFi hardware requirements are materially more expensive
  than a shared gateway.
* Rejected despite: simpler architecture with no gateway layer to design
  or maintain.

### Option 3: Batch/offline sync only (no near-real-time path)
Devices store data locally and sync only on a scheduled basis (e.g. via
a technician's rounds or scheduled uploads), with no attempt at
near-real-time delivery anywhere.

#### Consequences
* Rejected because: too coarse for animal-health alerting, where delay
  has real welfare cost (see ADR005/ADR007).
* Rejected despite: cheapest and simplest option, and may still be
  appropriate as a fallback for the lowest-priority sensors.

## Advice
* Pilot the gateway approach in one ride zone and one enclosure cluster
  before rolling out estate-wide — validate real-world WiFi dropout
  behavior, not just simulated. - Engineering Lead, Sep 2026
* Keep gateway firmware update mechanism simple; a fleet of ~40-55
  gateways is still enough to make manual updates painful. - Engineering
  Lead, Sep 2026

## Supporting Material
* Spike 001: MQTT ingestion under patchy WiFi
