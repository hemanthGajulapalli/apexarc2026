# Timebox

3 days.

# Context

The brief specifically calls out needing to check population levels in
the jumping piranha collection. Counting fish in water is a harder
problem than land-animal monitoring — visibility, occlusion, and
movement make simple sensor-based counting unreliable. We need to know
whether computer-vision-based counting is feasible at acceptable
accuracy, or whether a different technique is needed.

We need to answer this now because it's explicitly named in the brief as
a requirement, and getting it wrong (or not addressing it at all) is a
visible gap against the stated requirements.

Constraints:
- Underwater/aquatic environment — camera fouling, water clarity, and
  glare are real issues.
- Budget for hardware is shared across all 55 enclosures, not just this
  one.
- Patchy WiFi if inference or footage needs to leave the enclosure.

Interested parties: animal welfare/keeper staff, the Countess.

# Options considered

1. **Computer vision counting from a fixed underwater/overhead camera** —
   a vision model estimates population from footage.
2. **Periodic manual sampling + AI-assisted estimation** — keepers do
   periodic manual counts/photos, and a model assists with counting from
   those images rather than continuous monitoring.
3. **RFID/tagging-based counting** — tag a sample or all individuals and
   estimate population via tag reads (may not be practical/humane for
   this species/volume).
4. **Proxy indicators** — infer population trends from feeding
   consumption patterns rather than direct counting.

# Consequences

- Test a vision model against sample footage (or similar public
  datasets) for fish-counting accuracy — is it good enough to trust for
  a "population is dropping" alert?
- Is continuous monitoring actually necessary, or would periodic
  sampling (option 2) meet the real business need at much lower cost and
  complexity?
- Does the enclosure's water conditions make cameras impractical
  (maintenance burden, fouling)?
- If accuracy isn't reliable enough, is a proxy/manual approach an
  acceptable stand-in, with vision counting as a later enhancement?
