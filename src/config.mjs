// Every tunable setting for the DCA page lives here. The page and the tests read these objects; no magic numbers
// elsewhere. Rates are decimals (0.07 = 7%).

export const FORECAST = {
  defaults: {
    start: 1000,
    contribution: 50,
    frequency: 'weekly',
    annual_rate: 0.07,
    years: 30,
    inflation: 0.025,
    real_dollars: false,
  },
  ranges: {
    start: { min: 0, max: 10_000_000, step: 100 },
    contribution: { min: 0, max: 1_000_000, step: 5 },
    annual_rate: { min: -0.05, max: 0.15, step: 0.005 },
    years: { min: 1, max: 50, step: 1 },
    inflation: { min: 0, max: 0.1, step: 0.005 },
  },
  // per_year = how many contributions land in a year; growth compounds at the same cadence.
  frequencies: {
    weekly: { label: 'week', per_year: 52 },
    biweekly: { label: '2 weeks', per_year: 26 },
    monthly: { label: 'month', per_year: 12 },
    quarterly: { label: 'quarter', per_year: 4 },
    yearly: { label: 'year', per_year: 1 },
  },
  rate_presets: [0.04, 0.07, 0.1],
};

// Broker links: plain https addresses to each broker's own site, hard-coded and checked by tests/brokers.test.mjs
// (https only, exact allowlisted host, no query, fragment or credentials). On a phone, an https link opens the
// broker's app when the app claims that domain (iOS universal links / Android app links); otherwise the website.
export const BROKERS = [
  { id: 'fidelity', name: 'Fidelity', url: 'https://www.fidelity.com/' },
  { id: 'schwab', name: 'Charles Schwab', url: 'https://www.schwab.com/' },
  { id: 'vanguard', name: 'Vanguard', url: 'https://investor.vanguard.com/' },
  { id: 'robinhood', name: 'Robinhood', url: 'https://robinhood.com/' },
  { id: 'etrade', name: 'E*TRADE', url: 'https://us.etrade.com/' },
  { id: 'ibkr', name: 'Interactive Brokers', url: 'https://www.interactivebrokers.com/' },
  { id: 'webull', name: 'Webull', url: 'https://www.webull.com/' },
  { id: 'public', name: 'Public', url: 'https://public.com/' },
  { id: 'merrill', name: 'Merrill Edge', url: 'https://www.merrilledge.com/' },
  { id: 'sofi', name: 'SoFi Invest', url: 'https://www.sofi.com/invest/' },
];

export const BROKER_HOSTS = [
  'www.fidelity.com',
  'www.schwab.com',
  'investor.vanguard.com',
  'robinhood.com',
  'us.etrade.com',
  'www.interactivebrokers.com',
  'www.webull.com',
  'public.com',
  'www.merrilledge.com',
  'www.sofi.com',
];

export const COPY = {
  title: 'DCA Forecast',
  disclaimer:
    'Educational illustration, not investment advice. Returns are not guaranteed and real markets do not grow at a steady rate. Fees and taxes are not included.',
  broker_hint:
    'On a phone, each link opens the broker’s app if you have it installed (and the broker supports it); otherwise its website.',
  auto_invest_hint:
    'Once you’re in, look for “recurring investment” or “automatic investing” and set an amount and a schedule. That one setting is the whole strategy.',
};
