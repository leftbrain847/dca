// Browser UI. scripts/build.mjs inlines config.mjs, forecast.mjs and this file into one script, so FORECAST,
// BROKERS, COPY and the forecast functions are in scope here. All text goes in as textContent, never HTML.
(() => {
  const $ = (id) => document.getElementById(id);
  const svgNs = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, text) => {
    const node = tag.startsWith('svg:') ? document.createElementNS(svgNs, tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const R = FORECAST.ranges;
  const state = { ...FORECAST.defaults };

  // ---- inputs -------------------------------------------------------------------------------------------------
  const inputs = {
    start: $('in-start'),
    contribution: $('in-contribution'),
    frequency: $('in-frequency'),
    annual_rate: $('in-rate'),
    years: $('in-years'),
    real_dollars: $('in-real'),
  };

  for (const [key, f] of Object.entries(FORECAST.frequencies)) inputs.frequency.append(el('option', { value: key }, `every ${f.label}`));
  for (const key of ['start', 'contribution', 'annual_rate', 'years']) {
    const range = R[key];
    Object.assign(inputs[key], { min: range.min, max: range.max, step: range.step });
  }
  const presetBox = $('rate-presets');
  for (const r of FORECAST.rate_presets) {
    const b = el('button', { type: 'button', class: 'chip', 'data-rate': r }, formatPct(r));
    b.addEventListener('click', () => {
      state.annual_rate = r;
      syncInputs();
      render();
    });
    presetBox.append(b);
  }

  function syncInputs() {
    inputs.start.value = state.start;
    inputs.contribution.value = state.contribution;
    inputs.frequency.value = state.frequency;
    inputs.annual_rate.value = state.annual_rate;
    inputs.years.value = state.years;
    inputs.real_dollars.checked = state.real_dollars;
  }

  const read = {
    start: () => (state.start = clamp(inputs.start.value, R.start)),
    contribution: () => (state.contribution = clamp(inputs.contribution.value, R.contribution)),
    frequency: () => (state.frequency = FORECAST.frequencies[inputs.frequency.value] ? inputs.frequency.value : FORECAST.defaults.frequency),
    annual_rate: () => (state.annual_rate = clamp(inputs.annual_rate.value, R.annual_rate)),
    years: () => (state.years = Math.round(clamp(inputs.years.value, R.years))),
    real_dollars: () => (state.real_dollars = inputs.real_dollars.checked),
  };
  for (const [key, input] of Object.entries(inputs)) {
    input.addEventListener('input', () => {
      read[key]();
      render();
    });
  }

  // ---- output -------------------------------------------------------------------------------------------------
  function render() {
    const freq = FORECAST.frequencies[state.frequency];
    const rows = forecast({
      start: state.start,
      contribution: state.contribution,
      perYear: freq.per_year,
      annualRate: state.annual_rate,
      years: state.years,
      inflation: FORECAST.defaults.inflation,
      realDollars: state.real_dollars,
    });
    const s = summarize(rows);

    $('out-rate').textContent = formatPct(state.annual_rate);
    $('out-years').textContent = `${state.years} yr`;
    for (const b of presetBox.children) b.classList.toggle('on', Number(b.dataset.rate) === state.annual_rate);

    $('out-balance').textContent = formatMoney(s.balance);
    $('out-sentence').textContent =
      `${formatMoney(state.start)} to start + ${formatMoney(state.contribution)} every ${freq.label}, ` +
      `growing ${formatPct(state.annual_rate)} a year, for ${state.years} years` +
      (state.real_dollars ? `, in today’s dollars (${formatPct(FORECAST.defaults.inflation)} inflation).` : '.');
    $('out-contributed').textContent = formatMoney(s.contributed);
    $('out-growth').textContent = formatMoney(s.growth);
    $('out-habit').textContent = formatMoney(s.from_habit);
    $('out-crossover').textContent = s.crossover
      ? `Year ${s.crossover}: your money starts earning more each year than you put in.`
      : 'Within this horizon, what you put in each year still outpaces growth. Try more years.';

    drawChart(rows);
    drawTable(rows);
  }

  function drawChart(rows) {
    const svg = $('chart');
    svg.replaceChildren();
    const W = 360;
    const H = 180;
    const pad = { l: 4, r: 4, t: 8, b: 18 };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const max = Math.max(1, ...rows.map((r) => Math.max(r.balance, r.contributed)));
    const bw = (W - pad.l - pad.r) / rows.length;
    const y = (v) => H - pad.b - (Math.max(0, v) / max) * (H - pad.t - pad.b);
    rows.forEach((r, i) => {
      const x = pad.l + i * bw;
      const w = Math.max(1, bw - (bw > 4 ? 1.5 : 0.5));
      const put = Math.min(r.contributed, r.balance);
      svg.append(el('svg:rect', { x, y: y(put), width: w, height: H - pad.b - y(put), class: 'bar-in' }));
      if (r.balance > put) svg.append(el('svg:rect', { x, y: y(r.balance), width: w, height: y(put) - y(r.balance), class: 'bar-growth' }));
    });
    const ticks = [1, Math.ceil(rows.length / 2), rows.length].filter((v, i, a) => a.indexOf(v) === i);
    for (const t of ticks) {
      const x = pad.l + (t - 0.5) * bw;
      svg.append(el('svg:text', { x, y: H - 4, class: 'tick', 'text-anchor': 'middle' }, `yr ${t}`));
    }
  }

  function drawTable(rows) {
    const body = $('table-body');
    body.replaceChildren();
    for (const r of rows) {
      const tr = el('tr');
      tr.append(el('td', {}, String(r.year)), el('td', {}, formatMoney(r.contributed)), el('td', {}, formatMoney(r.growth)), el('td', { class: 'strong' }, formatMoney(r.balance)));
      body.append(tr);
    }
  }

  // ---- brokers ------------------------------------------------------------------------------------------------
  $('broker-hint').textContent = COPY.broker_hint;
  $('auto-hint').textContent = COPY.auto_invest_hint;
  $('disclaimer').textContent = COPY.disclaimer;
  const list = $('broker-list');
  for (const b of BROKERS) {
    const url = new URL(b.url);
    const a = el('a', { href: url.href, target: '_blank', rel: 'noopener noreferrer', class: 'broker', 'data-broker': b.id });
    a.append(el('span', { class: 'broker-name' }, b.name), el('span', { class: 'broker-host' }, url.hostname), el('span', { class: 'broker-go' }, 'Open ›'));
    list.append(a);
  }

  // ---- tabs ---------------------------------------------------------------------------------------------------
  const tabs = document.querySelectorAll('[data-tab]');
  for (const t of tabs) {
    t.addEventListener('click', () => {
      for (const u of tabs) {
        const on = u === t;
        u.setAttribute('aria-selected', String(on));
        $(u.dataset.tab).hidden = !on;
      }
    });
  }

  syncInputs();
  render();
})();
