# ADR015 - IoT Device & MQTT Broker Security
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Require **per-device (or per-gateway) TLS client certificates** for MQTT
broker authentication, with **topic-level access control** so each
gateway can only publish to its own zone's topics. No shared/global MQTT
credentials are used anywhere in the fleet.

## Context
The estate is deploying ~100 devices/gateways (ADR001) across publicly
accessible park areas, connecting to a managed cloud MQTT broker
(ADR013). A compromised or physically tampered device is a realistic
risk in a public park setting; a shared credential scheme would mean one
compromised device could impersonate or disrupt data from any other
zone.

## Options Considered

### Option 1 (SELECTED): Per-device TLS certificates + topic-level ACLs
Every gateway is provisioned with its own TLS client certificate at
setup. The broker enforces that each certificate may only publish to
that gateway's designated topic namespace (e.g. its own zone), and
certificates can be individually revoked if a device is lost, stolen, or
suspected compromised.

#### Consequences
* Adopted because: limits the blast radius of any single compromised
  device to its own zone's data — it can't spoof or flood other zones.
* Adopted because: individual revocation means a lost/stolen device
  (realistic in a public park) can be cut off without affecting the
  rest of the fleet.
* Adopted despite: certificate provisioning and rotation adds
  operational process (needs a device-onboarding workflow) beyond just
  shipping devices with a shared password.
* Adopted despite: slightly higher per-device setup cost/time than a
  shared-credential approach.

### Option 2: Shared credentials across the fleet
All devices authenticate with the same username/password or API key.

#### Consequences
* Rejected because: a single compromised or physically accessed device
  in a public park would expose credentials usable to impersonate or
  disrupt the entire fleet — unacceptable given devices are in
  visitor-accessible areas.
* Rejected despite: simplest possible provisioning — flash the same
  credential to every device.

### Option 3: Network-level security only (VPN/private network, no per-device auth)
Rely on a private network/VPN for device connectivity without
individual device authentication.

#### Consequences
* Rejected because: doesn't address the physical-tampering risk — a
  device physically removed from the park still has valid network
  access unless individually revocable.
* Rejected despite: could reduce broker-level authentication complexity
  if paired with strong network segmentation.

## Advice
* Build the certificate provisioning step into whatever device
  deployment/installation process the operations team already uses, so
  it doesn't become a manual bottleneck at 100+ device scale.
  - Engineering Lead, Sep 2026

## Supporting Material
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR013: Cloud Platform Selection
