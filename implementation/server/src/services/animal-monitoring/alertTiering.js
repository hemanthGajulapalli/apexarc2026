// ADR007: tiered alert severity — high-confidence anomalies notify staff,
// low-confidence ones are logged only (to avoid alert fatigue). Pure,
// directly unit-testable business logic, kept separate from the HTTP layer.

export function tierSeverity(confidence) {
  if (confidence >= 0.9) return 'critical';
  if (confidence >= 0.7) return 'warn';
  return 'info';
}

export function initialStatusForSeverity(severity) {
  // Only critical/warn actually page a keeper; info-tier stays logged-only.
  return severity === 'info' ? 'logged' : 'notified';
}
