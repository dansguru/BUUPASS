window.JM = (() => {
  const A = {
    NBO: { city: 'Nairobi', label: 'Nairobi (JKIA)', name: 'Jomo Kenyatta International Airport', short: 'JKIA', country: 'Kenya' },
    EBB: { city: 'Entebbe', label: 'Entebbe', name: 'Entebbe International Airport', short: 'EBB', country: 'Uganda' },
    KIS: { city: 'Kisumu', label: 'Kisumu', name: 'Kisumu International Airport', short: 'KIS', country: 'Kenya' },
    MBA: { city: 'Mombasa', label: 'Mombasa', name: 'Moi International Airport', short: 'MBA', country: 'Kenya' },
    UKA: { city: 'Diani', label: 'Diani', name: 'Ukunda Airstrip', short: 'UKA', country: 'Kenya' },
    EDL: { city: 'Eldoret', label: 'Eldoret', name: 'Eldoret International Airport', short: 'EDL', country: 'Kenya' },
    LAU: { city: 'Lamu', label: 'Lamu', name: 'Lamu (Manda Airport)', short: 'LAU', country: 'Kenya' },
    MYD: { city: 'Malindi', label: 'Malindi', name: 'Malindi Airport', short: 'MYD', country: 'Kenya' },
    SHJ: { city: 'Sharjah', label: 'Sharjah', name: 'Sharjah International Airport', short: 'SHJ', country: 'UAE' }
  };
  const ORIGINS = ['UKA', 'EDL', 'EBB', 'KIS', 'MBA', 'LAU', 'MYD', 'NBO'];
  const INTL = ['SHJ'];
  const NET = Object.fromEntries(ORIGINS.map(code => [code, []]));
  const connect = (a, b) => {
    NET[a].push(b);
    NET[b].push(a);
  };
  [
    ['NBO', 'MBA'], ['NBO', 'EDL'], ['NBO', 'KIS'], ['NBO', 'UKA'],
    ['NBO', 'LAU'], ['NBO', 'MYD'], ['NBO', 'EBB'],
    ['MBA', 'KIS'], ['MBA', 'EDL'], ['EDL', 'KIS']
  ].forEach(([a, b]) => connect(a, b));
  const ROUTE_INFO = {
    'NBO-MBA': { fareKES: 8300, durationMinutes: 75, frequency: 'Up to 10 daily flights' },
    'NBO-EDL': { fareKES: 8300, durationMinutes: 60, frequency: 'Up to 6 daily flights' },
    'NBO-KIS': { fareKES: 8300, durationMinutes: 50, frequency: 'Up to 5 daily flights' },
    'NBO-UKA': { fareKES: 9200, durationMinutes: 75, frequency: '3 daily flights' },
    'NBO-LAU': { fareKES: 9500, durationMinutes: 80, frequency: '1 daily flight' },
    'NBO-MYD': { fareKES: 9200, durationMinutes: 75, frequency: '4 daily flights' },
    'NBO-EBB': { fareKES: 22950, durationMinutes: 90, frequency: '1 daily flight' },
    'MBA-KIS': { fareKES: 9500, durationMinutes: 105, frequency: '1 daily flight' },
    'MBA-EDL': { fareKES: 9500, durationMinutes: 105, frequency: '1 daily flight' },
    'EDL-KIS': { fareKES: 8300, durationMinutes: 40, frequency: '1 daily flight' }
  };
  const DUR = { UKA: 75, EDL: 60, EBB: 90, KIS: 50, MBA: 75, LAU: 80, MYD: 75 };
  const FIXED = {
    'UKA-NBO': ['08:50', '10:45', '16:20'],
    'NBO-UKA': ['09:00', '14:20', '15:30'],
    'NBO-EBB': ['09:30'],
    'EBB-NBO': ['11:40']
  };
  const FARES = {
    'UKA-NBO': {
      '2026-10-23': null,
      '2026-10-24': { minimum: 20000, prices: [20000, 20000, 20000], soldOut: [true, true, true] },
      '2026-10-25': null,
      '2026-10-26': { minimum: 7000, prices: [7000, 7000, 7000] },
      '2026-10-27': { minimum: 8800, prices: [8800, 8800, 8800] },
      '2026-10-28': { minimum: 8800, prices: [8800, 8800, 8800] },
      '2026-10-29': { minimum: 10800, prices: [10800, 10800, 10800] }
    },
    'NBO-UKA': {
      '2026-10-21': null,
      '2026-10-22': null,
      '2026-10-23': { minimum: 10800, prices: [10800, 10800, 10800] },
      '2026-10-24': { minimum: 7000, prices: [20000, 7000, 7000] },
      '2026-10-25': { minimum: 7000, prices: [7000, 7000, 7000] },
      '2026-10-26': { minimum: 7000, prices: [7000, 7000, 7000] },
      '2026-10-27': { minimum: 8800, prices: [8800, 8800, 8800] }
    }
  };
  const OBSERVED_DAY_FARES = {
    'UKA-NBO': {
      '2026-10-24': 0, '2026-10-25': 0, '2026-10-26': 0,
      '2026-10-27': 8800, '2026-10-28': 7000, '2026-10-29': 8800, '2026-10-30': 8800,
      '2026-10-31': 16000, '2026-11-01': 15000, '2026-11-02': 7000, '2026-11-03': 8800
    },
    'NBO-UKA': {
      '2026-11-04': 9800, '2026-11-05': 9800, '2026-11-06': 15000, '2026-11-07': 10800,
      '2026-11-08': 10800, '2026-11-09': 10800, '2026-11-10': 10800, '2026-11-11': 10800,
      '2026-11-12': 11300, '2026-11-13': 12300, '2026-11-14': 10800, '2026-11-15': 10800,
      '2026-11-16': 10800
    }
  };
  const OBSERVED_FLIGHTS = {
    'UKA-NBO': {
      '2026-10-27': [['08:50', '10:05', 'departed', null, null], ['10:45', '12:00', 'departed', null, null], ['14:45', '16:00', 'soldout', null, null], ['16:20', '17:35', 'open', 8800, null]],
      '2026-10-28': [['08:50', '10:05', 'open', 7000, null], ['10:45', '12:00', 'open', 7000, null], ['14:45', '16:00', 'open', 8800, null], ['16:20', '17:35', 'open', 8800, 2]],
      '2026-10-29': [['10:45', '12:00', 'open', 8800, null], ['14:45', '16:00', 'open', 11300, 5], ['16:05', '17:20', 'open', 13300, 5]],
      '2026-10-30': [['08:50', '10:05', 'open', 8800, null], ['10:45', '12:00', 'open', 17000, 4], ['16:20', '17:35', 'soldout', null, null]],
      '2026-10-31': [['10:45', '12:00', 'open', 19000, 1], ['14:45', '16:00', 'soldout', null, null], ['16:05', '17:20', 'open', 17000, 3], ['17:15', '18:30', 'open', 16000, 1]]
    },
    'NBO-UKA': {
      '2026-11-07': [['09:00', '10:15', 'open', 12300, 1], ['13:00', '14:15', 'open', 10800, null], ['14:20', '15:35', 'open', 10800, null], ['15:30', '16:45', 'open', 10800, null]],
      '2026-11-08': [['07:05', '08:20', 'open', 10800, null], ['09:00', '10:15', 'open', 10800, null], ['13:00', '14:15', 'open', 10800, 8], ['14:35', '15:50', 'open', 10800, 6]],
      '2026-11-09': [['07:05', '08:20', 'open', 10800, null], ['09:00', '10:15', 'open', 15000, 2], ['13:00', '14:15', 'open', 11300, 4], ['14:35', '15:50', 'open', 11800, 5]],
      '2026-11-11': [['07:05', '08:20', 'open', 10800, null], ['09:00', '10:15', 'open', 11300, 2], ['13:00', '14:15', 'open', 10800, null], ['14:35', '15:50', 'open', 10800, null]],
      '2026-11-13': [['07:05', '08:20', 'open', 12300, 1], ['09:00', '10:15', 'open', 20000, null], ['14:35', '15:50', 'open', 18000, 2]]
    }
  };
  const USD_RATE = 135;

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(s + 'T00:00:00');
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const hm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmtDay = s => { const d = parse(s); return `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`; };
  const fmtLong = s => { const d = parse(s); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtDur = m => `${Math.floor(m / 60)}h ${pad(m % 60)}m`.replace(' 00m', '');
  const money = (n, cur = 'KES') => cur === 'USD' ? '$' + Math.round(n / USD_RATE).toLocaleString('en-US') : 'KES ' + n.toLocaleString('en-US');

  const hasRoute = (a, b) => !!(NET[a] && NET[a].includes(b));
  const routeInfo = (a, b) => ROUTE_INFO[a + '-' + b] || ROUTE_INFO[b + '-' + a] || null;
  const hash = s => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const frequencyCount = info => {
    const match = info && info.frequency.match(/(\d+)\s*daily/);
    return match ? +match[1] : 1;
  };
  function generatedTimes(a, b) {
    const count = frequencyCount(routeInfo(a, b));
    if (count === 1) return ['11:00'];
    const start = 6 * 60 + 30 + hash(a + b) % 25;
    const end = 19 * 60 - hash(b + a) % 25;
    const step = (end - start) / (count - 1);
    return Array.from({ length: count }, (_, i) => hm(Math.round((start + step * i) / 5) * 5));
  }
  function schedule(a, b) {
    if (!hasRoute(a, b)) return null;
    return FIXED[a + '-' + b] || generatedTimes(a, b);
  }
  function generatedFare(a, b, date, times) {
    const info = routeInfo(a, b), key = a + '-' + b, base = info && info.fareKES || 8300;
    const observed = OBSERVED_DAY_FARES[key] && OBSERVED_DAY_FARES[key][date];
    if (observed === 0) return null;
    const day = parse(date).getDay();
    const minimum = observed !== undefined
      ? observed
      : base + (hash(key + date) % 5) * 400 + ([0, 5, 6].includes(day) ? 600 : 0);
    const prices = times.map((_, i) => minimum + (observed !== undefined ? 0 : (hash(date + key + i) % 4) * 500));
    return { minimum: Math.min(...prices), prices };
  }
  function dayInfo(a, b, date) {
    const k = a + '-' + b, times = schedule(a, b);
    if (!times) return { has: false, flights: [], minPrice: 0, status: 'unavailable' };
    const fare = FARES[k] && FARES[k][date];
    if (fare === null) return { has: false, flights: [], minPrice: 0, status: 'none' };
    const observed = OBSERVED_FLIGHTS[k] && OBSERVED_FLIGHTS[k][date];
    const generated = generatedFare(a, b, date, observed ? observed.map(f => f[0]) : times);
    if (!generated) return { has: false, flights: [], minPrice: 0, status: 'none' };
    const selectedFare = fare || generated;
    const activeTimes = observed ? observed.map(f => f[0]) : times;
    const info = routeInfo(a, b);
    const spoke = a === 'NBO' ? b : a, dm = info && info.durationMinutes || DUR[spoke] || 75;
    const flights = activeTimes.map((t, i) => {
      const observedFlight = observed && observed[i];
      const sold = observedFlight ? observedFlight[2] === 'soldout' : !!(fare && fare.soldOut && fare.soldOut[i]);
      const departed = observedFlight ? observedFlight[2] === 'departed'
        : date === today() && toMin(t) <= new Date().getHours() * 60 + new Date().getMinutes();
      const seatsLeft = sold ? 0
        : observedFlight && observedFlight[4] !== null ? observedFlight[4]
          : 10 + hash(k + date + t) % 25;
      return {
        id: k + date + t, no: '', dep: t,
        arr: observedFlight ? observedFlight[1] : hm((toMin(t) + dm) % 1440),
        dur: dm, price: observedFlight && observedFlight[3] || selectedFare.prices[i],
        soldOut: sold, departed, seatsLeft,
        aircraft: 'Dash 8 Q400', seats: 78
      };
    });
    return { has: true, flights, minPrice: selectedFare.minimum, status: 'available' };
  }
  const bookingUrl = s => {
    const q = new URLSearchParams({ origin1: s.from, destination1: s.to, departure1: s.dep, adt1: s.adt, chd1: s.chd, inf1: s.inf });
    if ((s.trip === 'roundtrip' || s.trip === 'multi') && s.ret) Object.entries({ origin2: s.to, destination2: s.trip === 'multi' ? s.to2 : s.from, departure2: s.ret, adt2: s.adt, chd2: s.chd, inf2: s.inf }).forEach(([k, v]) => q.set(k, v));
    q.set('currency', 'KES');
    const dataScript = document.querySelector('script[src$="jm-data.js"]');
    const appBase = new URL('.', dataScript ? dataScript.src : location.href);
    return new URL('booking.html?' + q.toString(), appBase).href;
  };
  return { A, ORIGINS, INTL, NET, ROUTE_INFO, MON, iso, parse, today, addDays, fmtDay, fmtLong, fmtDur, money, hasRoute, routeInfo, dayInfo, bookingUrl };
})();
