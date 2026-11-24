// The broker tab is the one place this page points people elsewhere, so every link is pinned: https only, an exact
// allowlisted host, no credentials, query string or fragment. A typo-squatted or swapped link fails CI.
import { test } from 'node:test';
import assert from 'node:assert';
import { BROKERS, BROKER_HOSTS } from '../src/config.mjs';

test('every broker link is a clean https link to an allowlisted host', () => {
  assert.ok(BROKERS.length >= 5);
  for (const b of BROKERS) {
    const u = new URL(b.url);
    assert.equal(u.protocol, 'https:', b.id);
    assert.ok(BROKER_HOSTS.includes(u.hostname), `${b.id}: ${u.hostname} not allowlisted`);
    assert.equal(u.username + u.password, '', b.id);
    assert.equal(u.search, '', b.id);
    assert.equal(u.hash, '', b.id);
    assert.equal(u.port, '', b.id);
  }
});

test('ids and hosts are unique, and every allowlisted host is used', () => {
  assert.equal(new Set(BROKERS.map((b) => b.id)).size, BROKERS.length);
  const used = new Set(BROKERS.map((b) => new URL(b.url).hostname));
  assert.deepEqual([...used].sort(), [...BROKER_HOSTS].sort());
});
