// End to end: build the page from a clean checkout and check it is self-contained and safe to publish.
import { test } from 'node:test';
import assert from 'node:assert';
import { build } from '../scripts/build.mjs';
import { BROKERS } from '../src/config.mjs';

const html = await build();

test('page builds with its placeholders filled', () => {
  assert.ok(html.startsWith('<!doctype html>'));
  for (const p of ['__TITLE__', '/*__CSS__*/', '/*__JS__*/']) assert.ok(!html.includes(p), p);
  assert.ok(html.includes('<title>DCA Forecast</title>'));
  assert.ok(!/^\s*(import|export)\s/m.test(html));
});

test('CSP blocks every network request and remote resource', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
  assert.ok(csp.includes("default-src 'none'"));
  assert.ok(!/connect-src|https?:/.test(csp));
});

test('no network calls, remote loads or HTML injection in the page code', () => {
  for (const bad of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource', 'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'localStorage']) {
    assert.ok(!html.includes(bad), bad);
  }
  assert.ok(!/<(script|link|img|iframe)[^>]+(src|href)=/i.test(html), 'remote resource');
});

test('the only URLs in the page are the pinned broker links', () => {
  const urls = new Set(html.match(/https?:\/\/[^\s'"`<>)]+/g) ?? []);
  const allowed = new Set([...BROKERS.map((b) => b.url), 'http://www.w3.org/2000/svg']);
  for (const u of urls) assert.ok(allowed.has(u), u);
});

test('outbound links open safely', () => {
  assert.ok(html.includes("rel: 'noopener noreferrer'"));
  assert.ok(html.includes('<meta name="referrer" content="no-referrer">'));
});
