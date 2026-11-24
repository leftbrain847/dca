// Pure DCA math: no DOM, so tests run it directly and the page inlines the same code.
//
// Model: growth compounds once per contribution period at the periodic rate equivalent to the annual rate,
// (1 + r)^(1/n) - 1, and each contribution lands at the end of its period. Optional inflation deflates every
// dollar figure to today's dollars.

export function periodicRate(annualRate, perYear) {
  return Math.pow(1 + annualRate, 1 / perYear) - 1;
}

// Closed form, used as a cross-check in tests.
export function futureValue({ start, contribution, annualRate, perYear, years }) {
  const n = Math.round(perYear * years);
  const rp = periodicRate(annualRate, perYear);
  const g = Math.pow(1 + rp, n);
  return start * g + (rp === 0 ? contribution * n : (contribution * (g - 1)) / rp);
}

// One row per year: what you put in, what it's worth, and how much of it is growth.
export function forecast({ start, contribution, perYear, annualRate, years, inflation = 0, realDollars = false }) {
  const rp = periodicRate(annualRate, perYear);
  const rows = [];
  let balance = start;
  let contributed = start;
  let startOnly = start;
  for (let year = 1; year <= years; year += 1) {
    const before = balance;
    for (let p = 0; p < perYear; p += 1) {
      balance = balance * (1 + rp) + contribution;
      contributed += contribution;
    }
    startOnly *= 1 + annualRate;
    const deflator = realDollars ? Math.pow(1 + inflation, year) : 1;
    const yearGrowth = balance - before - contribution * perYear;
    rows.push({
      year,
      contributed: contributed / deflator,
      balance: balance / deflator,
      growth: (balance - contributed) / deflator,
      start_only: startOnly / deflator,
      year_growth: yearGrowth / deflator,
      year_contribution: (contribution * perYear) / deflator,
    });
  }
  return rows;
}

// First year in which the portfolio's own growth beats what you added that year; null if it never does.
export function crossoverYear(rows) {
  const hit = rows.find((r) => r.year_contribution > 0 && r.year_growth > r.year_contribution);
  return hit ? hit.year : null;
}

export function summarize(rows) {
  const last = rows[rows.length - 1];
  return {
    balance: last.balance,
    contributed: last.contributed,
    growth: last.growth,
    // What the habit itself added on top of leaving the starting balance alone.
    from_habit: last.balance - last.start_only,
    crossover: crossoverYear(rows),
  };
}

export function clamp(value, { min, max }) {
  const v = Number(value);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function formatMoney(x) {
  const sign = x < 0 ? '-' : '';
  const a = Math.abs(x);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  return `${sign}$${Math.round(a).toLocaleString('en-US')}`;
}

export function formatPct(r) {
  return `${(r * 100).toFixed(1).replace(/\.0$/, '')}%`;
}
