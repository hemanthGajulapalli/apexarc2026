# Glossary

Terms used throughout the ADRs, ADR-Spikes, use cases, and design docs
in this repo.

| Term | Meaning in this solution |
|---|---|
| **ADR** | Architecture Decision Record — one decision, its options, trade-offs, and the option selected. See `/ADRs`. |
| **ADR-Spike** | A time-boxed exploration written *before* an ADR, framing the options and open questions the ADR then resolves. See `/ADR-Spikes`. |
| **LoRaWAN** | Long Range Wide Area Network — the low-power, long-range radio technology selected (ADR001) for sensors to reach a small number of gateway concentrators, instead of depending on the estate's patchy WiFi at every zone. |
| **Gateway concentrator** | A LoRaWAN receiver that aggregates radio traffic from many nearby sensors and forwards it to the cloud over its own backhaul link. The estate plans for 3, covering all ~95 zones (ADR001). |
| **MQTT** | The lightweight publish/subscribe messaging protocol used as the event bus between gateways and cloud services (ADR001, ADR012). |
| **Store-and-forward** | The pattern where a gateway buffers readings locally during a connectivity outage and delivers them once backhaul is restored, so an outage delays data rather than losing it (ADR001). |
| **Species-tiered monitoring** | Grouping the 55 enclosures into a small number of profiles (mammal, reptile/land, aquatic) that share sensor kits and baseline models, rather than building bespoke monitoring per enclosure (ADR005). |
| **Edge inference** | Running simple threshold checks directly on the gateway so the most time-critical alerts work even while a zone is offline, distinct from the richer model that runs in the cloud (ADR002). |
| **Golden-set regression** | A curated, fixed set of test cases every model/provider change must pass before it can deploy — a hard CI/CD gate, not an advisory check (ADR011, ADR020). |
| **Drift monitoring** | Ongoing statistical tracking of a live model's output distribution to catch degradation that doesn't show up as an outright failure (ADR011). |
| **Human-in-the-loop** | The rule that no AI output triggers an automated welfare or business action by itself — a keeper or staff member always confirms first (ADR007). |
| **Model abstraction layer** | A thin, provider-agnostic interface in front of AI model calls, so swapping a provider or model is a configuration change, not a rewrite (ADR010). |
| **RBAC** | Role-Based Access Control — staff access is granted via a small, named set of roles (Keeper, Operations, Admin) rather than per-person permissions (ADR016). |
| **OAuth / OIDC** | The open standard used for visitor and staff authentication on the estate's own cloud platform, chosen instead of delegating visitor identity to the ticketing SaaS vendor (ADR016). |
| **Fitness function** | An automated, repeatable check that a specific architectural characteristic (reliability, cost, auditability, etc.) still holds as the system evolves — see [Fitness Functions](../other_design_docs/fitness-functions.md). |
| **RF survey** | A physical radio-coverage survey of the estate grounds, recommended before committing to the final LoRaWAN gateway count/placement, to validate coverage assumptions ahead of procurement (ADR001). |
| **BLE presence sensing** | Passive, aggregate-only detection of nearby visitor devices, used in a small number of high-value zones to add dwell-time signal beyond simple ticket-gate counts (ADR003). |
