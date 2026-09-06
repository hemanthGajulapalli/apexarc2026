# Timebox

3 days.

# Context

The estate's WiFi coverage is patchy, but the architecture depends on
MQTT-capable hardware devices (ticket gates, ride sensors, enclosure
sensors) streaming data to the cloud for analytics, animal monitoring, and
AI features. If devices lose connectivity mid-session, we risk losing
readings or double-counting them once connectivity returns.

We need to answer this now because it's a foundational decision — nearly
every other AI feature (popularity analytics, animal health monitoring)
depends on data actually arriving reliably. Getting this wrong means
rebuilding the ingestion layer later.

Constraints:
- Patchy WiFi across the park; some zones may be offline for extended
  periods.
- Budget for MQTT-capable hardware exists, but is not unlimited — the
  solution shouldn't require premium/cellular-backup hardware everywhere.
- 40 rides + 55 enclosures + ticket gates is a lot of concurrent devices.

Interested parties: the Countess (cost/profitability), estate operations
staff (need reliable data to act on), animal welfare team (can't afford
gaps in health data).

# Options considered

1. **MQTT with local persistent queue (e.g. broker-side QoS 1/2 + on-device
   store-and-forward)** — devices buffer locally when offline and flush
   when reconnected.
2. **Store-and-forward via gateway devices** — cluster sensors behind a
   small number of hardier gateway nodes (with local storage) per zone,
   reducing the number of directly cloud-connected devices.
3. **Batch/offline sync only** — accept that some zones will only sync
   periodically (e.g. via a walking technician's device or scheduled
   uploads) rather than aiming for near-real-time everywhere.
4. **Mesh networking between devices** — devices relay data to each other
   toward the nearest connected node, reducing dependency on any single
   WiFi access point.
5. **LoRaWAN long-range radio to a small number of gateway
   concentrators** — sensors use low-power, long-range LoRaWAN instead
   of WiFi/cellular, transmitting to a handful of gateway concentrators
   with their own backhaul, rather than every zone depending on local
   WiFi.

# Consequences

- Test each option against a simulated WiFi dropout (e.g. kill
  connectivity for 10, 30, 60 minutes) and measure data loss/duplication.
- Does the option handle duplicate delivery gracefully (idempotent
  ingestion) once a device reconnects and flushes its buffer?
- What's the cost delta between options at 40+55+gate device scale?
- Does the chosen approach change per zone (e.g. gateway clustering in the
  animal enclosures, direct MQTT at ticket gates near the entrance)?
- How does this decision affect the near-real-time vs. batch analytics
  question (spike 004)?

# Outcome

Option 2 (store-and-forward via gateway devices) was selected in ADR001,
refined with option 5's radio technology: after consulting the estate's
IoT/hardware lead (Keerthi R) on sensor selection and pricing, **LoRaWAN
was chosen over WiFi/cellular alternatives** for the sensor-to-gateway
link. This reduces the "needs reliable connectivity" problem to a small
number (currently 3) of gateway concentrators rather than ~95
individually WiFi-dependent zones.

Open follow-ups before procurement:
- A **site RF survey** is recommended to validate coverage assumptions
  ahead of committing to the 3-gateway layout.
- **Volume pricing** (~$325/unit vs. $350-462 list) was flagged to
  procurement as worth negotiating given the 95-unit deployment scale.
