import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { tierSeverity, initialStatusForSeverity } from '../src/services/animal-monitoring/alertTiering.js';

// Pure unit tests — no DB, no HTTP, no process boot. Fast, isolated,
// exercising ADR007's tiering rule directly.

describe('tierSeverity (ADR007)', () => {
  test('confidence >= 0.9 is critical', () => {
    assert.equal(tierSeverity(0.95), 'critical');
    assert.equal(tierSeverity(0.9), 'critical');
  });

  test('confidence between 0.7 and 0.9 is warn', () => {
    assert.equal(tierSeverity(0.89), 'warn');
    assert.equal(tierSeverity(0.7), 'warn');
  });

  test('confidence below 0.7 is info', () => {
    assert.equal(tierSeverity(0.69), 'info');
    assert.equal(tierSeverity(0), 'info');
  });
});

describe('initialStatusForSeverity (ADR007)', () => {
  test('critical and warn notify staff', () => {
    assert.equal(initialStatusForSeverity('critical'), 'notified');
    assert.equal(initialStatusForSeverity('warn'), 'notified');
  });

  test('info is logged only, not notified — avoids alert fatigue', () => {
    assert.equal(initialStatusForSeverity('info'), 'logged');
  });
});
