import { test } from 'node:test';
import assert from 'node:assert';
import { clamp, crossoverYear, forecast, formatMoney, futureValue, periodicRate, summarize } from '../src/forecast.mjs';
import { FORECAST } from '../src/config.mjs';

const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('periodic rate compounds back to the annual rate', () => {
  close(Math.pow(1 + periodicRate(0.07, 52), 52) - 1, 0.07);
  assert.equal(periodicRate(0, 12), 0);
});

test('year-by-year loop matches the closed-form future value', () => {
  for (const [key, f] of Object.entries(FORECAST.frequencies)) {
    const args = { start: 1000, contribution: 50, annualRate: 0.07, perYear: f.per_year, years: 30 };
    const rows = forecast(args);
    close(rows.at(-1).balance, futureValue(args));
    assert.equal(rows.length, 30, key);
  }
});

test('zero growth: balance equals what you put in', () => {
  const rows = forecast({ start: 500, contribution: 100, perYear: 12, annualRate: 0, years: 10 });
  close(rows.at(-1).balance, 500 + 100 * 120);
  close(rows.at(-1).growth, 0);
});

test('known value: $100/month at 6% for 10 years from $0', () => {
  // Monthly-equivalent of 6% effective annual, contributions at period end.
  const rp = Math.pow(1.06, 1 / 12) - 1;
  const expected = (100 * (Math.pow(1 + rp, 120) - 1)) / rp;
  close(forecast({ start: 0, contribution: 100, perYear: 12, annualRate: 0.06, years: 10 }).at(-1).balance, expected);
  assert.ok(expected > 16_200 && expected < 16_300);
});

test("today's dollars deflate every figure by inflation", () => {
  const args = { start: 1000, contribution: 50, perYear: 52, annualRate: 0.07, years: 20, inflation: 0.025 };
  const nominal = forecast(args).at(-1);
  const real = forecast({ ...args, realDollars: true }).at(-1);
  close(real.balance, nominal.balance / Math.pow(1.025, 20));
});

test('crossover: the first year growth beats that year’s contributions', () => {
  const rows = forecast({ start: 0, contribution: 100, perYear: 12, annualRate: 0.07, years: 40 });
  const y = crossoverYear(rows);
  assert.ok(y > 1 && y < 40);
  assert.ok(rows[y - 1].year_growth > rows[y - 1].year_contribution);
  assert.ok(rows[y - 2].year_growth <= rows[y - 2].year_contribution);
  assert.equal(crossoverYear(forecast({ start: 0, contribution: 100, perYear: 12, annualRate: 0.07, years: 3 })), null);
});

test('summary splits the balance into contributions and growth', () => {
  const s = summarize(forecast({ start: 1000, contribution: 50, perYear: 52, annualRate: 0.07, years: 30 }));
  close(s.contributed + s.growth, s.balance);
  close(s.contributed, 1000 + 50 * 52 * 30);
  close(s.from_habit, s.balance - 1000 * Math.pow(1.07, 30));
});

test('inputs are clamped to the configured ranges', () => {
  assert.equal(clamp('-5', FORECAST.ranges.start), 0);
  assert.equal(clamp('abc', FORECAST.ranges.years), FORECAST.ranges.years.min);
  assert.equal(clamp(999, FORECAST.ranges.years), FORECAST.ranges.years.max);
});

test('money formatting', () => {
  assert.equal(formatMoney(1234.4), '$1,234');
  assert.equal(formatMoney(2_500_000), '$2.50M');
});

test('defaults sit inside their ranges', () => {
  for (const [k, range] of Object.entries(FORECAST.ranges)) {
    const v = FORECAST.defaults[k];
    assert.ok(v >= range.min && v <= range.max, k);
  }
  assert.ok(FORECAST.frequencies[FORECAST.defaults.frequency]);
});
