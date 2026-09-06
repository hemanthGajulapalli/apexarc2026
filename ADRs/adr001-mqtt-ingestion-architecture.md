# ADR001 - MQTT Ingestion Architecture for Patchy WiFi
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Use **zone-based MQTT gateway devices** with local persistent queuing
(store-and-forward, QoS 1) rather than connecting every sensor directly
to the cloud. Sensors within a physical zone (a ride, an enclosure
cluster) publish to a local gateway; the gateway buffers and forwards
to the cloud broker when backhaul is available.

Following consultation with the estate's IoT/hardware lead (Keerthi R)
on sensor selection and pricing, **LoRaWAN** is the selected radio
technology linking the ~95 zone sensors back to a small number of
LoRaWAN gateway concentrators — currently planned as **3 gateways**
covering the estate — rather than WiFi or cellular. This was chosen
specifically because it collapses the "needs reliable connectivity"
problem from ~95 individual zones down to 3 fixed gateway locations,
which is a stronger answer to the estate's patchy-WiFi constraint than
having each zone gateway depend on local WiFi.

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

### Option 1 (SELECTED): Zone-based gateway with store-and-forward, over LoRaWAN
Cheap, low-power LoRaWAN sensor units at each of the ~95 zones (rides +
enclosures) transmit to a small number of LoRaWAN gateway concentrators
(3, pending RF survey — see Advice) rather than each zone needing its
own WiFi-connected hardware. Only the 3 gateway concentrators need
reliable backhaul to the cloud; sensors just need LoRaWAN range to a
gateway. The gateways retain local persistent queuing and forward to
the cloud broker when backhaul is available.

#### Consequences
* Adopted because: concentrates the expensive "reliable cloud
  connectivity" problem into 3 fixed points instead of ~95 individual
  zones, which is both cheaper and more reliable at this scale than
  giving every zone its own WiFi-dependent gateway.
* Adopted because: LoRaWAN's long range and low power draw fit the
  estate's outdoor, spread-out layout (40 rides + 55 enclosures) better
  than short-range WiFi or per-device cellular, and avoids per-device
  cellular subscription cost entirely.
* Adopted because: local buffering means a backhaul outage at a gateway
  doesn't lose data — it delays it, and the gateway can deduplicate on
  reconnect.
* Adopted despite: introduces a gateway-level single point of failure —
  if one of the 3 gateways fails or a coverage gap exists, the zones
  behind it go dark until resolved. This is why an RF survey ahead of
  procurement matters (see Advice).
* Adopted despite: adds a device class (LoRaWAN sensors + gateway
  concentrators) to manage (firmware updates, provisioning) that a
  fully direct-to-cloud WiFi design wouldn't need.

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
  before rolling out estate-wide — validate real-world dropout
  behavior, not just simulated. - Engineering Lead, Sep 2026
* Keep gateway firmware update mechanism simple; a fleet of LoRaWAN
  sensors this size is still enough to make manual updates painful. -
  Engineering Lead, Sep 2026
* Recommend a **site RF survey before committing to the 3-gateway
  layout**, to validate coverage assumptions ahead of procurement — a
  wrong gateway count/placement is expensive to fix after ~95 sensors
  are already deployed. - IoT/Hardware Lead (Keerthi R), Sep 2026
* Flagged to procurement that **volume pricing (~$325/unit vs.
  $350-462 list)** should be negotiated given the 95-unit deployment
  scale. - IoT/Hardware Lead (Keerthi R), Sep 2026

## Supporting Material
* Spike 001: MQTT ingestion under patchy WiFi
* ADR003: Visitor Popularity Tracking Method (95-location sensor scale)
* ADR015: IoT Device & MQTT Broker Security
