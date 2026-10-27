(() => {
  const { A, today, addDays, parse, fmtDay, fmtDur, money, dayInfo, hasRoute } = JM;
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const cur = q.get('currency') === 'USD' ? 'USD' : 'KES';
  const n = (k, d) => { const v = parseInt(q.get(k), 10); return Number.isFinite(v) ? v : d; };
  const pax = { adt: Math.max(1, n('adt1', 1)), chd: Math.max(0, n('chd1', 0)), inf: Math.max(0, n('inf1', 0)) };
  const payers = pax.adt + pax.chd;
  const place = c => (A[c] && A[c].label) || c;
  const price = v => money(v, cur);
  const WDF = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const longDate = s => { const d = parse(s); return `${WDF[d.getDay()]} ${d.getDate()}, ${MONF[d.getMonth()]} ${d.getFullYear()}`; };
  const mins = t => +t.slice(0, 2) * 60 + +t.slice(3);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icons = {
    cart: '<svg class="bk-icon bk-cart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 9H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
    plane: '<svg class="bk-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m2.5 19.5 19-7.5-19-7.5 1.4 6.1L14 12l-10.1 1.4z"/></svg>',
    person: '<svg class="bk-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/></svg>'
  };

  const SMART_UP = 2100, TURNAROUND = 60;
  const PERKS = {
    basic: ['10kg cabin luggage'],
    smart: ['10kg cabin luggage', '23kg hold luggage', 'Free standard seat selection', 'One free change on the first flight if made 40+ minutes before departure (fare difference applies)']
  };
  const NAT = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Ethiopia', 'Somalia', 'DR Congo', 'United Kingdom', 'United States', 'India', 'United Arab Emirates', 'Other'];
  const PREFIX = ['+254', '+256', '+255', '+250', '+257', '+971', '+44', '+1', '+91'];

  const legs = [1, 2].filter(i => i === 1 || q.get('origin' + i)).map(i => ({
    from: A[q.get('origin' + i)] ? q.get('origin' + i) : (i === 1 ? 'NBO' : 'EBB'),
    to: A[q.get('destination' + i)] ? q.get('destination' + i) : (i === 1 ? 'EBB' : 'NBO'),
    date: q.get('departure' + i) || addDays(today(), i === 1 ? 1 : 28),
    sel: null, open: null, editing: false, start: '', more: new Set()
  }));
  legs.forEach(l => {
    l.start = addDays(l.date, -3);
    if (l.start < today()) l.start = today();
    const firstAvailable = dayInfo(l.from, l.to, l.date).flights.find(f => !f.soldOut && !f.departed);
    if (firstAvailable) l.open = firstAvailable.id;
  });
  const S = { step: 1, terms: false, people: {}, contact: { prefix: '+254', title: 'Mr' }, svc: { seat: {}, bags: {}, sp: {}, assist: {} } };

  const people = [];
  for (let i = 1; i <= pax.adt; i++) people.push({ id: 'adt' + i, type: 'adt', label: 'Adult ' + i });
  for (let i = 1; i <= pax.inf; i++) people.push({ id: 'inf' + i, type: 'inf', label: 'Infant ' + i });
  for (let i = 1; i <= pax.chd; i++) people.push({ id: 'chd' + i, type: 'chd', label: 'Child ' + i });
  const flyers = people.filter(p => p.type !== 'inf').sort((a, b) => (a.type === 'adt' ? 0 : 1) - (b.type === 'adt' ? 0 : 1) || a.id.localeCompare(b.id));
  const who = p => { const d = S.people[p.id] || {}; return d.first ? `${d.first} ${d.last || ''}`.trim() : p.label; };
  const paxText = () => [pax.adt && `${pax.adt} Adult${pax.adt > 1 ? 's' : ''}`, pax.chd && `${pax.chd} Child${pax.chd > 1 ? 'ren' : ''}`, pax.inf && `${pax.inf} Infant${pax.inf > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  let addons;

  function costs() {
    return addons.costs();
  }
  const allSel = () => legs.every(l => l.sel);
  const incompat = (i, f) => { const p = legs[i - 1]; if (!p || !p.sel) return false; const l = legs[i];
    return l.date < p.date || (l.date === p.date && mins(f.dep) < mins(p.sel.f.arr) + TURNAROUND); };
  const revalidate = () => legs.forEach((l, i) => { if (i && l.sel && incompat(i, l.sel.f)) l.sel = null; });

  function header() {
    $('title').textContent = `${A[legs[0].from].city} To ${place(legs[0].to)}`;
    $('edit').hidden = S.step > 1;
    if (S.step > 1) {
      $('editwrap').hidden = true;
      $('edit').setAttribute('aria-expanded', 'false');
    }
    $('dates').innerHTML = `${legs.map(l => longShort(l.date)).join(' - ')} <i>●</i> ${paxText()}`;
    const c = costs();
    $('cart').innerHTML = `${icons.cart}<span id="count">${c.total ? `<small>${cur === 'USD' ? '$' : 'KES'}</small> ${price(c.total).replace(/^KES |^\$/, '')}` : '0'}</span><small>⌄</small>`;
    const ready = S.step === 1 ? allSel() && S.terms : S.step < 4;
    $('next').disabled = !ready; $('next').classList.toggle('go', ready);
    $('next').hidden = S.step >= 4;
    $('cartpop').innerHTML = `<h3>Trip cost</h3>` + (c.lines.length ? `<dl>${c.lines.map(([t, a]) => `<dt>${esc(t)}</dt><dd>${price(a)}</dd>`).join('')}<dt class="tot">Total</dt><dd class="tot">${price(c.total)}</dd></dl>` : '<p>Select a flight to see the cost of your trip.</p>');
    $('steps').innerHTML = ['Select Flight', 'Passengers', 'Services', 'Payment'].map((t, i) =>
      `<li class="${i + 1 === S.step ? 'on' : ''}${i + 1 < S.step ? ' past' : ''}"><button ${i + 1 < S.step && S.step < 5 ? `data-goto="${i + 1}"` : 'disabled'}><b>${i + 1}</b>${t}</button></li>`).join('');
  }
  const longShort = s => { const d = parse(s); return `${d.getDate()} ${JM.MON[d.getMonth()]} ${d.getFullYear()}`; };

  function fareCards(i, f) {
    return `<div class="bk-fares"><p>Select your preferred fare</p><div class="bk-fgrid">${['basic', 'smart'].map(k =>
      `<button class="bk-fare ${k}" data-fare="${i}|${f.id}|${k}"><header>${k.toUpperCase()}</header><ul>${PERKS[k].map(x => `<li>${x}</li>`).join('')}</ul>
        <footer><i></i><span>${price(f.price + (k === 'smart' ? SMART_UP : 0))}</span></footer></button>`).join('')}</div></div>`;
  }
  function legFull(l, i) {
    const prev = legs[i - 1], min = prev ? (prev.date > today() ? prev.date : today()) : today();
    if (l.start < min && !l.sel) l.start = min;
    const strip = [...Array(7)].map((_, k) => addDays(l.start, k)).map(d => {
      const di = dayInfo(l.from, l.to, d), off = !di.has || d < min;
      return `<button class="bk-day${d === l.date ? ' on' : ''}${off ? ' none' : ''}" data-leg="${i}" data-date="${d}" ${off ? 'disabled' : ''}><span>${fmtDay(d)}</span>${off ? '<em>No Flights</em>' : `<b><small>${cur === 'USD' ? '$' : 'KES'}</small> ${price(di.minPrice).replace(/^KES |^\$/, '')}</b>`}</button>`;
    }).join('');
    const di = dayInfo(l.from, l.to, l.date);
    const cards = di.flights.map(f => {
      const short = !f.soldOut && f.seatsLeft < payers;
      const bad = !f.soldOut && !f.departed && !short && incompat(i, f);
      const dead = f.soldOut || f.departed || short || bad;
      const open = l.open === f.id, low = f.seatsLeft < 10, used = Math.round((f.seats - f.seatsLeft) / f.seats * 100), more = l.more.has(f.id);
      const note = f.soldOut ? 'Sold Out' : f.departed ? 'Departed' : short ? `Only ${f.seatsLeft} seats left` : bad ? 'Departure and return times are incompatible.' : '';
      return `<article class="bk-flight${dead ? ' sold' : ''}${open ? ' open' : ''}${l.sel && l.sel.f.id === f.id ? ' picked' : ''}">
        <div class="bk-t"><b>${f.dep}</b><span>${place(l.from)} (${l.from})</span></div>
        <div class="bk-line"><i></i><u aria-hidden="true">◔</u><i></i><small>${fmtDur(f.dur)} <button class="bk-link" data-more="${i}|${f.id}" aria-expanded="${more}">Non-stop</button></small>${bad ? `<em class="bk-warn">${note}</em>` : ''}</div>
        <div class="bk-t r"><b>${f.arr}</b><span>${place(l.to)} (${l.to})</span></div>
        <div class="bk-act">${dead ? (bad ? '' : `<span>${note}</span>`) : `<button class="bk-from${open ? ' close' : ''}" data-open="${i}|${open ? '' : f.id}">${open ? 'CLOSE' : `From ${price(f.price)} <b>›</b>${low ? `<small>Only ${f.seatsLeft} seat(s) left</small>` : ''}`}</button>`}</div>
        ${open ? fareCards(i, f) : ''}
        <div class="bk-more" ${more ? '' : 'hidden'}>
          <div><h5>AIRCRAFT</h5>${icons.plane} ${f.aircraft}<br>${f.seats} seats, economy</div>
          <div><h5>FLIGHT</h5>${f.no ? `${f.no}<br>` : ''}${A[l.from].name} to ${A[l.to].name}</div>
          <div><h5>AVAILABILITY</h5><div class="bk-meter${low ? ' low' : ''}" role="img" aria-label="${f.soldOut ? 'Sold out' : 'Available'}"><i style="width:${used}%"></i></div>${f.soldOut ? 'Sold out' : 'Available'}</div>
        </div></article>`;
    }).join('');
    const empty = `<div class="bk-empty">${!hasRoute(l.from, l.to) ? `BUUPASS doesn't sell ${A[l.from].city} to ${A[l.to].city} online. <a href="explore.html?route=flights-nairobi-to-entebbe">See routes we fly</a>.` : di.status === 'unavailable' ? 'No flights are listed for this route.' : 'No flights on this date. Choose another date.'}</div>`;
    return `<h2 class="bk-legtitle"><span aria-hidden="true">${icons.plane}</span>${A[l.from].city} - ${place(l.to)}</h2>
      <div class="bk-strip"><button class="bk-arrow" data-shift="${i}|-7" aria-label="Earlier dates" ${l.start <= min ? 'disabled' : ''}>‹</button><div class="bk-days">${strip}</div><button class="bk-arrow" data-shift="${i}|7" aria-label="Later dates">›</button></div>
      <div class="bk-flights">${di.has ? cards : empty}</div>`;
  }
  function legDone(l, i) {
    const s = l.sel;
    return `<section class="bk-done"><div class="bk-check" aria-hidden="true">✓</div><div class="bk-donebody">
      <h2>${A[l.from].city} - ${place(l.to)}</h2><p>${longDate(l.date)}</p>
      <div class="bk-donerow"><div class="bk-t"><b>${s.f.dep}</b><span>${place(l.from)} (${l.from})</span></div>
        <div class="bk-line"><i></i><u aria-hidden="true">◔</u><i></i><small>${fmtDur(s.f.dur)} Non-stop</small></div>
        <div class="bk-t r"><b>${s.f.arr}</b><span>${place(l.to)} (${l.to})</span></div>
        <strong class="bk-fname">${s.fare === 'smart' ? 'Smart' : 'Basic'}</strong><span class="bk-dprice">${price(s.price)}${s.f.seatsLeft < 10 ? `<em class="bk-left">Only ${s.f.seatsLeft} seat(s) left</em>` : ''}</span></div></div>
      <button class="bk-editbtn" data-edit="${i}">Edit</button></section>`;
  }
  function view1() {
    const nextRow = allSel() ? `<label class="bk-terms"><input type="checkbox" id="terms" ${S.terms ? 'checked' : ''}><span>I have read and accept the airline's <a href="#">Privacy Policy</a>, <a href="#">Fare Rules</a>, <a href="#">Terms and Conditions</a> and <a href="#">Baggage rules</a>. I acknowledge that personal information relating to my booking may be accessible to government authorities, selected airlines and the agents to whom the airline grants system access.</span></label>
      <div class="bk-navrow"><button class="bk-go" data-go ${S.terms ? '' : 'disabled'}>Next</button></div>` : '';
    return legs.map((l, i) => l.sel && !l.editing ? legDone(l, i) : legFull(l, i)).join('') + nextRow;
  }

  const FIELDS = {
    adt: [['title', 'Title', 'sel', ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr']], ['first', 'First Name (Given)*'], ['mid', 'Middle Name'], ['last', 'Last Name (Surname)*'], ['dob', 'Date of Birth (DD/MM/YYYY)*', 'dob'], ['nat', 'Nationality*', 'sel', NAT], ['doct', 'Document Type', 'sel', ['Passport', 'National ID', 'Alien ID']], ['docn', 'Document Number']],
    chd: [['first', 'First Name (Given)*'], ['mid', 'Middle Name'], ['last', 'Last Name (Surname)*'], ['dob', 'Date of Birth (DD/MM/YYYY)*', 'dob'], ['nat', 'Nationality*', 'sel', NAT], ['doct', 'Document Type', 'sel', ['Passport', 'National ID', 'Birth certificate']], ['docn', 'Document Number']],
    inf: [['first', 'First Name (Given)*'], ['mid', 'Middle Name'], ['last', 'Last Name (Surname)*'], ['dob', 'Date of Birth (DD/MM/YYYY)*', 'dob'], ['nat', 'Nationality*', 'sel', NAT]]
  };
  const AGE = { adt: [12, 200, '12+ years'], chd: [2, 11, '2–11 years'], inf: [0, 1, 'under 2 years'] };
  const field = (id, [k, label, kind, opts], val = '') => {
    const ph = label.replace('*', ''), req = label.includes('*') ? 'required' : '';
    return kind === 'sel'
      ? `<select data-p="${id}" data-k="${k}" aria-label="${esc(ph)}" ${req}><option value="">${esc(label)}</option>${opts.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>`
      : `<input data-p="${id}" data-k="${k}" ${kind === 'dob' ? 'inputmode="numeric" maxlength="10"' : ''} placeholder="${esc(label)}" aria-label="${esc(ph)}" value="${esc(val)}" ${req}>`;
  };
  function view2() {
    const cards = people.map(p => {
      const d = S.people[p.id] || {};
      return `<section class="bk-card"><h3><i aria-hidden="true">${icons.person}</i>${p.label}:</h3><div class="bk-fields">${FIELDS[p.type].map(f => field(p.id, f, d[f[0]] ?? (f[0] === 'title' ? 'Mr' : ''))).join('')}</div>
        ${p.type !== 'inf' ? `<p class="bk-loy">Add your loyalty Member number in order to earn points on this flight and get exclusive benefits</p><div class="bk-fields"><input data-p="${p.id}" data-k="loy" placeholder="Loyalty Member Number" aria-label="Loyalty Member Number" value="${esc(d.loy || '')}"></div>` : ''}</section>`;
    }).join('');
    const c = S.contact;
    const ci = (k, ph, type = 'text') => `<input data-c="${k}" type="${type}" placeholder="${ph}" aria-label="${ph.replace('*', '')}" value="${esc(c[k] || '')}">`;
    return `<h2 class="bk-h2">Passenger data</h2><p class="bk-sub">Please enter your passenger details and ensure that the name on your booking matches the name on your passport or ID. <span>* Mandatory fields</span></p>
      <p class="bk-errsum" id="errsum" role="alert" hidden></p>${cards}
      <h2 class="bk-h2">Contact details</h2><section class="bk-card"><label class="bk-copy"><input type="checkbox" id="copy"> Copy details of passenger 1</label>
      <div class="bk-fields"><select data-c="title" aria-label="Title"><option value="">Title</option>${['Mr', 'Mrs', 'Ms', 'Miss', 'Dr'].map(o => `<option ${c.title === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
        ${ci('first', 'First Name (Given)*')}${ci('last', 'Last Name (Surname)*')}
        <div class="bk-phone"><select data-c="prefix" aria-label="Phone prefix">${PREFIX.map(o => `<option ${c.prefix === o ? 'selected' : ''}>${o}</option>`).join('')}</select>${ci('phone', 'Phone*', 'tel')}</div>
        ${ci('email', 'E-mail*', 'email')}${ci('email2', 'Confirm Email Address*', 'email')}${ci('addr', 'Address*')}
        <select data-c="country" aria-label="Country or region"><option value="">Country/Region*</option>${NAT.filter(x => x !== 'Other').map(o => `<option ${c.country === o ? 'selected' : ''}>${o}</option>`).join('')}</select>${ci('city', 'Town or City*')}</div></section>
      <div class="bk-navrow"><button class="bk-back" data-goto="1">← Back</button><button class="bk-go" data-go>Next</button></div>`;
  }
  function parseDob(s) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ''); if (!m) return null; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 && d.getFullYear() === +m[3] ? d : null; }
  function validate() {
    const bad = []; const flag = (el, msg) => { el.classList.add('err'); bad.push([el, msg]); };
    document.querySelectorAll('.err').forEach(e => e.classList.remove('err'));
    const trip = parse(legs[legs.length - 1].date);
    document.querySelectorAll('[data-p]').forEach(el => {
      const p = people.find(x => x.id === el.dataset.p), v = (S.people[p.id] || {})[el.dataset.k] || '';
      if (el.required && !v.trim()) return flag(el, 'required');
      if (el.dataset.k === 'dob' && v) {
        const d = parseDob(v); if (!d) return flag(el, `${p.label}: use the format DD/MM/YYYY`);
        let age = trip.getFullYear() - d.getFullYear(); if (trip < new Date(trip.getFullYear(), d.getMonth(), d.getDate())) age--;
        const [lo, hi, txt] = AGE[p.type];
        if (d > new Date() || age < lo || age > hi) flag(el, `${p.label}: date of birth doesn't match ${p.type === 'adt' ? 'an adult' : p.type === 'chd' ? 'a child' : 'an infant'} (${txt}) on the travel date`);
      }
    });
    document.querySelectorAll('[data-c]').forEach(el => {
      const k = el.dataset.c, v = (S.contact[k] || '').trim(), need = ['first', 'last', 'phone', 'email', 'email2', 'addr', 'country', 'city'].includes(k);
      if (need && !v) flag(el, 'required');
      else if (k === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) flag(el, 'Enter a valid email address');
      else if (k === 'email2' && v && v !== (S.contact.email || '').trim()) flag(el, 'The email addresses do not match');
      else if (k === 'phone' && v && v.replace(/\D/g, '').length < 7) flag(el, 'Enter a valid phone number');
    });
    const sum = $('errsum');
    sum.hidden = !bad.length;
    if (bad.length) { const msgs = [...new Set(bad.map(b => b[1]).filter(m => m !== 'required'))]; sum.textContent = `Please complete ${bad.filter(b => b[1] === 'required').length || 'the highlighted'} required field(s).` + (msgs.length ? ' ' + msgs.join('. ') + '.' : ''); bad[0][0].scrollIntoView({ behavior: 'smooth', block: 'center' }); bad[0][0].focus(); }
    return !bad.length;
  }

  function view3() { return addons.view3(); }
  function view4() {
    return addons.view4();
  }

  function render() { $('view').innerHTML = [view1, view2, view3, view4][S.step - 1](); header(); }
  addons = JMAddons.create({ S, legs, flyers, pax, payers, price, cur, $, esc, who, longDate, fmtDur, A, render });
  function go() {
    if (S.step === 1 && allSel() && S.terms) S.step = 2;
    else if (S.step === 2) { if (!validate()) return; S.step = 3; }
    else if (S.step === 3) S.step = 4;
    else return;
    render(); scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('next').addEventListener('click', go);
  $('cart').addEventListener('click', () => { const p = $('cartpop'); p.hidden = !p.hidden; $('cart').setAttribute('aria-expanded', String(!p.hidden)); });
  document.addEventListener('click', e => { if (!e.target.closest('.bk-cart, #cartpop')) $('cartpop').hidden = true; });

  $('steps').addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) { S.step = +b.dataset.goto; render(); } });
  $('view').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.dataset;
    if (d.go !== undefined) return go();
    if (d.goto) { if (S.step === 2) syncInputs(); S.step = +d.goto; return render(); }
    if (d.date) { const l = legs[+d.leg]; l.date = d.date; l.open = null; if (l.sel && l.sel.f.id.indexOf(d.date) < 0) l.sel = null; revalidate(); S.terms = false; }
    else if (d.shift) { const [i, s] = d.shift.split('|'); legs[+i].start = addDays(legs[+i].start, +s); }
    else if (d.open !== undefined) { const [i, id] = d.open.split('|'); legs[+i].open = id || null; }
    else if (d.fare) {
      const [i, id, k] = d.fare.split('|'), l = legs[+i], f = dayInfo(l.from, l.to, l.date).flights.find(x => x.id === id);
      l.sel = { f, fare: k, price: f.price + (k === 'smart' ? SMART_UP : 0) }; l.open = null; l.editing = false; S.terms = false; revalidate();
    }
    else if (d.edit) { legs[+d.edit].editing = true; S.terms = false; }
    else if (d.more) { const [i, id] = d.more.split('|'), s = legs[+i].more; s.has(id) ? s.delete(id) : s.add(id); }
    else if (d.svc) return addons.open(d.svc);
    else return;
    render();
  });
  $('view').addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'terms') { S.terms = el.checked; header(); const b = document.querySelector('.bk-go[data-go]'); if (b) b.disabled = !S.terms; }
    else if (el.id === 'copy') { const a = S.people.adt1 || {}; Object.assign(S.contact, { title: a.title || 'Mr', first: a.first, last: a.last }); if (!el.checked) Object.assign(S.contact, { title: 'Mr', first: '', last: '' }); const keep = el.checked; render(); $('copy').checked = keep; }
    else if (el.dataset.c) S.contact[el.dataset.c] = el.value;
    else if (el.dataset.p) (S.people[el.dataset.p] = S.people[el.dataset.p] || {})[el.dataset.k] = el.value;
  });
  $('view').addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.k === 'dob') { let v = el.value.replace(/\D/g, '').slice(0, 8); if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4); else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); el.value = v; }
    if (el.dataset.p) (S.people[el.dataset.p] = S.people[el.dataset.p] || {})[el.dataset.k] = el.value;
    else if (el.dataset.c) S.contact[el.dataset.c] = el.value;
    el.classList.remove('err');
  });
  const syncInputs = () => document.querySelectorAll('[data-p]').forEach(el => (S.people[el.dataset.p] = S.people[el.dataset.p] || {})[el.dataset.k] = el.value);

  let widget;
  $('edit').addEventListener('click', () => {
    const w = $('editwrap'); w.hidden = !w.hidden; $('edit').setAttribute('aria-expanded', String(!w.hidden));
    if (!w.hidden && !widget) widget = JMWidget.mount($('bw-edit'), { from: legs[0].from, to: legs[0].to, dep: legs[0].date, ret: legs[1] ? legs[1].date : '', adt: pax.adt, chd: pax.chd, inf: pax.inf, trip: legs[1] ? 'roundtrip' : 'oneway' });
  });
  render();
})();
