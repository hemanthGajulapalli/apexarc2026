# ADR015 - IoT Device & MQTT Broker Security
* Date: Sep 2, 2026
* Status: ACCEPTED

## Decision
Since ADR001 selected LoRaWAN, security is enforced at **two tiers**:
LoRaWAN sensor units authenticate to the network using **LoRaWAN's
native per-device session keys** (NwkSKey/AppSKey, established via
OTAA), while the **3 LoRaWAN gateway concentrators** that bridge to the
cloud MQTT broker each hold their own **TLS client certificate**, with
**topic-level access control** so a gateway can only publish to its own
zone group's topics. No shared/global credentials are used at either
tier.

## Context
The estate is deploying ~95 LoRaWAN sensor units behind 3 gateway
concentrators (ADR001) across publicly accessible park areas, with the
gateways connecting to a managed cloud MQTT broker (ADR013). A
compromised or physically tampered device is a realistic risk in a
public park setting; a shared credential scheme would mean one
compromised device or gateway could impersonate or disrupt data from
any other zone.

## Options Considered

### Option 1 (SELECTED): Per-device LoRaWAN session keys + per-gateway TLS certificates + topic-level ACLs
Each LoRaWAN sensor is provisioned with its own network/application
session keys at join time, individually revocable at the network/join
server if a sensor is lost, stolen, or suspected compromised. Each of
the 3 gateway concentrators is separately provisioned with its own TLS
client certificate for MQTT broker authentication; the broker enforces
that each certificate may only publish to that gateway's designated
topic namespace, and certificates can be individually revoked.

#### Consequences
* Adopted because: limits the blast radius of any single compromised
  sensor or gateway to its own zone's data — it can't spoof or flood
  other zones.
* Adopted because: individual revocation at either tier means a
  lost/stolen sensor (realistic in a public park) or a compromised
  gateway can be cut off without affecting the rest of the fleet.
* Adopted because: collapsing to 3 gateways (ADR001) means only 3 TLS
  certificates need provisioning/rotation at the cloud-facing tier,
  materially lighter than the ~100-certificate operational burden the
  original per-zone-gateway design implied.
* Adopted despite: LoRaWAN session-key provisioning and TLS certificate
  rotation are two separate processes to manage (needs a device- and
  gateway-onboarding workflow) beyond just shipping devices with a
  shared password.
* Adopted despite: slightly higher per-unit setup cost/time than a
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
* Build both the LoRaWAN session-key provisioning step and the
  (now much smaller, 3-gateway) TLS certificate provisioning step into
  whatever device deployment/installation process the operations team
  already uses, so neither becomes a manual bottleneck at ~95-sensor
  scale. - Engineering Lead, Sep 2026

## Supporting Material
* ADR001: MQTT Ingestion Architecture for Patchy WiFi
* ADR013: Cloud Platform Selection
