window.JMAddons = (() => {
  const SEAT_FEE = 500, BAG23 = 1000, BAG32 = 2500, INFANT_FEE = 1150;
  const ICONS = {
    shield: '<path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
    plane: '<path d="m2.5 19.5 19-7.5-19-7.5 1.4 6.1L14 12l-10.1 1.4z"/>',
    fish: '<path d="M3 12c3-4 8-5 13-2l4-3v10l-4-3c-5 3-10 2-13-2z"/><circle cx="8" cy="11" r=".6"/>',
    dive: '<path d="M3 10h7l2 2 2-2h7v5h-7l-2-2-2 2H3z"/><path d="M7 10V8h10v2"/>',
    golf: '<path d="M6 21V3l11 3-5 3 5 3-11 3"/><circle cx="17" cy="19" r="2"/>',
    surf: '<path d="M4 19c3-3 13-3 16 0-4 2-12 2-16 0z"/><path d="M12 16 15 5l3 2"/><path d="M3 22c2-1 4-1 6 0m3 0c2-1 4-1 6 0"/>',
    bike: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="m6 17 4-8 4 8H6l5-5h4l3 5m-8-8h3"/>',
    seat: '<path d="M7 4v8h10l2 5H8a3 3 0 0 1-3-3V4z"/><path d="M8 17v3m10-3v3"/>',
    bag: '<path d="M5 8h14l1 13H4z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    special: '<path d="M4 7h16v13H4z"/><path d="m4 7 8 6 8-6M12 13v7"/>',
    assist: '<circle cx="12" cy="6" r="3"/><path d="M7 21v-4a5 5 0 0 1 10 0v4M4 12h3"/>',
    child: '<circle cx="12" cy="6" r="3"/><path d="M8 21v-4a4 4 0 0 1 8 0v4m-4-9v5"/>',
    vision: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.assist}</svg>`;
  const SPECIAL = [
    ['security', 'Security item', 1800, 'shield'],
    ['small-fishing', 'Small fishing', 1500, 'fish'],
    ['large-fishing', 'Large fishing', 5800, 'fish'],
    ['dive', 'Dive equipment', 1500, 'dive'],
    ['golf', 'Golf bag', 1500, 'golf'],
    ['surf', 'Surfboard', 1500, 'surf'],
    ['bike', 'Bike', 2300, 'bike']
  ];
  const ASSIST = [
    ['pc', 'Mobility assistance', 'assist'],
    ['um', 'Unaccompanied minor', 'child'],
    ['vis', 'Visual or hearing assistance', 'vision']
  ];
  const ROWS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21];
  const TAKEN = { 3: 'ABC', 4: 'ABC', 5: 'C', 6: 'ABC', 7: 'A', 8: 'CD', 9: 'AB', 16: 'AB', 17: 'AB', 18: 'A' };

  function create(ctx) {
    const { S, legs, flyers, pax, payers, price, cur, $, esc, who, longDate, fmtDur, A } = ctx;
    ['seat', 'bags', 'sp', 'assist'].forEach(k => { S.svc[k] = S.svc[k] || {}; });
    delete S.svc.meal;
    const key = (leg, person) => `${leg}|${person}`;
    const smart = i => legs[i].sel && legs[i].sel.fare === 'smart';
    const bagOf = (i, k) => S.svc.bags[key(i, k)] || { b23: smart(i) ? 1 : 0, b32: 0 };
    const selectedSpecial = (i, k) => (S.svc.sp[key(i, k)] || []).map(id => SPECIAL.find(x => x[0] === id)).filter(Boolean);
    const selectedAssist = (i, k) => S.svc.assist[key(i, k)] || [];
    const seatCost = i => smart(i) ? 0 : Object.keys(S.svc.seat).filter(x => x.startsWith(`${i}|`)).length * SEAT_FEE;
    const bagCost = (i, k) => {
      const bag = bagOf(i, k);
      return Math.max(0, bag.b23 - (smart(i) ? 1 : 0)) * BAG23 + bag.b32 * BAG32;
    };
    const specialCost = (i, k) => selectedSpecial(i, k).reduce((s, item) => s + item[2], 0);
    const allCosts = (i, k) => bagCost(i, k) + specialCost(i, k);
    const name = p => String(who(p)).toUpperCase();
    const initials = p => {
      const d = S.people[p.id] || {};
      return `${(d.first || '')[0] || ''}${(d.last || '')[0] || ''}`.toUpperCase() || String(flyers.indexOf(p) + 1);
    };
    const city = code => `${A[code].city}${code === 'NBO' ? ' (JKIA)' : ''}`;
    const total = (fn, i) => flyers.reduce((s, p, k) => s + fn(i, k), 0);
    let panel, state = { kind: '', leg: 0, person: 0 }, before = '';

    function costs() {
      const lines = [];
      let sum = 0;
      const add = (label, amount) => {
        if (amount > 0) lines.push([label, amount]);
        sum += amount;
      };
      legs.forEach((leg, i) => {
        if (!leg.sel) return;
        const tag = `${leg.from} → ${leg.to}`;
        add(`${tag} ${smart(i) ? 'Smart' : 'Basic'} × ${payers}`, leg.sel.price * payers);
        if (pax.inf) add(`${tag} infant fee × ${pax.inf}`, INFANT_FEE * pax.inf);
        add(`${tag} seat selection`, seatCost(i));
        add(`${tag} hold baggage`, total(bagCost, i));
        add(`${tag} special baggage`, total(specialCost, i));
      });
      return { lines, total: sum };
    }

    function serviceCards() {
      const countSeats = Object.keys(S.svc.seat).length;
      const bags = legs.reduce((s, _, i) => s + total(bagCost, i), 0);
      const extras = legs.reduce((s, _, i) => s + total(specialCost, i), 0);
      const assistance = Object.values(S.svc.assist).reduce((s, list) => s + list.length, 0);
      const seatAmount = legs.reduce((s, _, i) => s + seatCost(i), 0);
      const smartFare = legs.some((_, i) => smart(i));
      const cards = [
        ['seat', 'Seat', countSeats > 0 || smartFare, countSeats ? price(seatAmount) : smartFare ? 'Included with Smart' : `From ${price(SEAT_FEE)}`, 'seat'],
        ['bags', 'Add Baggage', bags > 0 || smartFare, bags ? price(bags) : smartFare ? '1 × 23kg included' : `From ${price(BAG23)}`, 'bag'],
        ['sp', 'Special Baggage', extras > 0, extras ? price(extras) : `From ${price(1500)}`, 'special'],
        ['assist', 'Special Assistance', assistance > 0, assistance ? `${assistance} request${assistance === 1 ? '' : 's'} added` : 'Request assistance', 'assist']
      ];
      return `<h2 class="bk-h2">Book add-on services</h2>${smartFare ? '<p class="bk-sub">Your Smart fare includes standard seat selection and one 23kg bag per passenger.</p>' : ''}
        <div class="sv-grid">${cards.map(([id, title, active, amount, iconName]) => `<article class="sv-card${active ? ' on' : ''}">
          <div class="sv-art" aria-hidden="true"><span>${icon(iconName)}</span></div><h3>${title}</h3><p>${amount}</p>
          <button type="button" class="${active ? 'sv-edit' : 'sv-add'}" data-svc="${id}">${active ? 'Edit' : 'Add'}</button>${active ? '<i class="sv-tick" aria-hidden="true">✓</i>' : ''}</article>`).join('')}</div>
        <div class="bk-navrow"><button class="bk-back" data-goto="2">← Back</button><button class="bk-go" data-go>Next</button></div>`;
    }

    function passengerRows(fn, i) {
      return flyers.map((p, k) => `<button type="button" class="sv-pax${state.person === k ? ' active' : ''}" data-addon="pax|${k}">
        <span class="sv-avatar">${esc(initials(p))}</span><span><small>${esc(p.label)}</small><b>${esc(name(p))}</b></span><i>${fn(i, k) || '›'}</i></button>`).join('');
    }

    function seatPage() {
      const i = state.leg;
      const taken = (row, col) => {
        if (i === 0) return (TAKEN[row] || '').includes(col);
        let hash = 5381;
        for (const c of `${legs[i].sel.f.id}${row}${col}`) hash = ((hash << 5) + hash + c.charCodeAt(0)) >>> 0;
        return hash % 6 === 0;
      };
      const selectedFor = k => S.svc.seat[key(i, k)] || '';
      const seat = (row, col) => {
        if ((row === 2 && 'ACD'.includes(col)) || (row === 3 && col === 'D')) return '<span class="sv-empty-seat"></span>';
        const id = `${row}${col}`;
        const owner = flyers.findIndex((_, k) => selectedFor(k) === id);
        const unavailable = taken(row, col) && owner < 0;
        return `<button type="button" class="sv-seat${owner >= 0 ? ' selected' : ''}${unavailable ? ' unavailable' : ''}"
          data-addon="seat|${id}" aria-label="Seat ${id}" ${unavailable || owner >= 0 && owner !== state.person ? 'disabled' : ''}>${owner >= 0 ? esc(initials(flyers[owner])) : unavailable ? '×' : ''}</button>`;
      };
      return `<div class="sv-seat-layout"><aside class="sv-passengers"><h2>Passengers</h2>${passengerRows((leg, k) => selectedFor(k), i)}
        <div class="sv-legend"><h3>Seating options</h3><p><span class="sv-seat example"></span> Standard <b>${smart(i) ? 'Included' : price(SEAT_FEE)}</b></p>
        <p><span class="sv-seat unavailable">×</span> Unavailable</p><p><span class="sv-seat selected"></span> Selected</p></div></aside>
        <div class="sv-plane-wrap"><div class="sv-wing left"></div><div class="sv-wing right"></div><div class="sv-plane">
        <div class="sv-seat-head"><span>A</span><span>B</span><i></i><span>C</span><span>D</span></div>
        ${ROWS.map(row => `<div class="sv-seat-row">${seat(row, 'A')}${seat(row, 'B')}<small>${row}</small>${seat(row, 'C')}${seat(row, 'D')}</div>${row === 12 ? '<div class="sv-row-gap"></div>' : ''}`).join('')}
        </div></div></div>`;
    }

    function sharedPageContent() {
      const kind = state.kind;
      if (kind === 'seat') return seatPage();
      const panels = legs.map((leg, i) => `<section class="sv-leg-panel"><h3>${esc(city(leg.from))} → ${esc(city(leg.to))}</h3>
        ${flyers.map((p, k) => {
          if (kind === 'bags') {
            const bag = bagOf(i, k), included = smart(i) ? 1 : 0;
            return `<div class="sv-person-row"><div class="sv-person-name">${esc(p.label)} · ${esc(name(p))}</div>
              <div class="sv-bag-choice"><span>23kg hold bag ${included ? '<small>1 included</small>' : `<small>${price(BAG23)} each</small>`}</span>
                <div><button data-addon="bag|${i}|${k}|b23|-1" ${bag.b23 <= included ? 'disabled' : ''}>−</button><b>${bag.b23}</b><button data-addon="bag|${i}|${k}|b23|1" ${bag.b23 + bag.b32 >= 2 ? 'disabled' : ''}>+</button></div></div>
              <div class="sv-bag-choice"><span>32kg hold bag <small>${price(BAG32)} each</small></span>
                <div><button data-addon="bag|${i}|${k}|b32|-1" ${bag.b32 <= 0 ? 'disabled' : ''}>−</button><b>${bag.b32}</b><button data-addon="bag|${i}|${k}|b32|1" ${bag.b23 + bag.b32 >= 2 ? 'disabled' : ''}>+</button></div></div></div>`;
          }
          const options = kind === 'sp' ? SPECIAL : ASSIST;
          const selected = kind === 'sp' ? (S.svc.sp[key(i, k)] || []) : selectedAssist(i, k);
          return `<div class="sv-option-grid">${options.map(option => `<button type="button" class="sv-option${selected.includes(option[0]) ? ' selected' : ''}"
              data-addon="${kind}|${i}|${k}|${option[0]}" aria-pressed="${selected.includes(option[0])}">
              <span>${icon(kind === 'sp' ? option[3] : option[2])}</span><b>${option[1]}</b>${kind === 'sp' ? `<small>${price(option[2])}</small>` : ''}
            </button>`).join('')}</div>`;
        }).join('')}</section>`).join('');
      const title = { bags: 'Baggage selection', sp: 'Special baggage', assist: 'Special assistance' }[kind];
      return `<h2 class="sv-heading">${title}</h2>${kind === 'bags' ? '<p class="sv-note">Choose baggage for each passenger and flight. Smart fares include one 23kg bag per passenger.</p>' : ''}
        ${panels}${kind === 'sp' ? '<div class="sv-note"><b>Special baggage guidance</b><p>Sports equipment and other special items are subject to airline handling rules and space availability.</p></div>' : ''}`;
    }

    function open(kind) {
      before = JSON.stringify(S.svc);
      state = { kind, leg: 0, person: 0 };
      panel = panel || document.createElement('section');
      panel.className = 'sv-page';
      panel.setAttribute('aria-label', `${kind} selection`);
      if (!panel.hasAttribute('data-listening')) {
        panel.addEventListener('click', handle);
        panel.setAttribute('data-listening', '');
      }
      document.body.classList.add('sv-lock');
      paint();
      panel.hidden = false;
      panel.scrollTop = 0;
    }

    function close(keep) {
      if (!keep) {
        const previous = JSON.parse(before);
        Object.keys(S.svc).forEach(k => delete S.svc[k]);
        Object.assign(S.svc, previous);
      }
      panel.hidden = true;
      document.body.classList.remove('sv-lock');
      ctx.render();
    }

    function paint() {
      const kind = state.kind, isSeat = kind === 'seat';
      const title = isSeat ? `${city(legs[state.leg].from)} → ${city(legs[state.leg].to)}`
        : { bags: 'Add baggage', sp: 'Special baggage', assist: 'Special assistance' }[kind];
      const legTabs = isSeat && legs.length > 1 ? `<div class="sv-tabs">${legs.map((l, i) => `<button type="button" class="${state.leg === i ? 'active' : ''}" data-addon="leg|${i}">${l.from} → ${l.to}</button>`).join('')}</div>` : '';
      const subtotal = costs().total;
      panel.innerHTML = `<header class="sv-top"><button class="sv-back" data-addon="cancel">‹ Back to services</button>
        <div><b>${title}</b>${legTabs}</div></header>
        <div class="sv-body ${isSeat ? 'seat-body' : ''}">${sharedPageContent()}</div>
        <footer class="sv-footer"><div><b>${isSeat ? 'Selected seats' : 'Trip total'}</b><strong>${price(subtotal)}</strong></div>
          <div class="sv-actions"><button class="sv-cancel" data-addon="cancel">Cancel</button><button class="sv-confirm" data-addon="confirm">Confirm</button></div></footer>`;
      if (!panel.isConnected) document.body.appendChild(panel);
    }

    function paymentPage() {
      const { lines, total: amount } = costs();
      const itinerary = legs.map((leg, i) => `<section class="sv-itinerary"><h3>${icon('plane')} ${esc(city(leg.from))} to ${esc(city(leg.to))}</h3>
        <p>${longDate(leg.date)}</p><div><b>${leg.sel.f.dep}</b><span>${fmtDur(leg.sel.f.dur)} · Non-stop</span><b>${leg.sel.f.arr}</b></div>
        <small>${leg.from} → ${leg.to} · ${leg.sel.fare === 'smart' ? 'Smart' : 'Basic'}</small></section>`).join('');
      const bookingText = `Hello, I would like to book this trip:\n${legs.map((leg, i) => `${i + 1}. ${city(leg.from)} to ${city(leg.to)} on ${longDate(leg.date)} (${leg.sel.fare === 'smart' ? 'Smart' : 'Basic'})`).join('\n')}\nPassengers: ${pax.adt} adult${pax.adt === 1 ? '' : 's'}${pax.chd ? `, ${pax.chd} child${pax.chd === 1 ? '' : 'ren'}` : ''}${pax.inf ? `, ${pax.inf} infant${pax.inf === 1 ? '' : 's'}` : ''}\nEstimated total: ${price(amount)}\nPlease confirm availability and send me a payable payment option.`;
      const paymentMethods = [];
      return `<div class="sv-payment-layout"><section class="sv-payment-main"><h2 class="sv-heading">Payment</h2>
        <div class="sv-promo"><b>Payment contact not configured</b><span>This Buupass preview uses a copied booking flow. Connect the official booking channel before accepting trips or payments.</span></div>
        <p class="sv-demo-note" role="status">This is a demo booking summary. Optional services can be skipped.</p>
        ${paymentMethods.map((method, i) => `<details class="sv-payment-method" name="payment-method" ${i === 0 ? 'open' : ''}><summary>${method[0]}<small>${method[1]}</small></summary>
          <div class="sv-payment-disabled">${i === 0 ? 'Secure card payment will be available when payment processing is connected.' : 'This payment option will be available when payment processing is connected.'}</div></details>`).join('')}
        <button class="sv-pay-disabled" type="button" disabled>Booking contact not configured</button></section>
        <aside class="sv-summary"><h2>Summary</h2>${itinerary}<div class="sv-summary-pax">${pax.adt} Adult${pax.adt === 1 ? '' : 's'}${pax.chd ? ` · ${pax.chd} Child${pax.chd === 1 ? '' : 'ren'}` : ''}${pax.inf ? ` · ${pax.inf} Infant${pax.inf === 1 ? '' : 's'}` : ''}</div>
        <ul>${lines.map(([label, amount]) => `<li><span>${esc(label)}</span><b>${price(amount)}</b></li>`).join('')}</ul>
        <div class="sv-grand-total"><span>Total amount</span><b>${price(amount)}</b></div></aside></div>
        <div class="bk-navrow"><button class="bk-back" data-goto="3">← Back to services</button></div>`;
    }

    function handle(e) {
      const button = e.target.closest('[data-addon]');
      if (!button || button.disabled) return;
      const [action, ...args] = button.dataset.addon.split('|');
      if (action === 'cancel') return close(false);
      if (action === 'confirm') return close(true);
      if (action === 'leg') state.leg = +args[0];
      else if (action === 'pax') state.person = +args[0];
      else if (action === 'seat') {
        const [i, k] = [state.leg, state.person], id = args[0], selected = S.svc.seat[key(i, k)];
        if (selected === id) delete S.svc.seat[key(i, k)];
        else S.svc.seat[key(i, k)] = id;
      } else if (action === 'bag') {
        const [i, k, type, delta] = args, bag = { ...bagOf(+i, +k) };
        bag[type] = Math.max(type === 'b23' && smart(+i) ? 1 : 0, bag[type] + +delta);
        if (bag.b23 + bag.b32 > 2) return;
        S.svc.bags[key(+i, +k)] = bag;
      } else if (action === 'sp' || action === 'assist') {
        const [i, k, id] = args, storage = action === 'sp' ? S.svc.sp : S.svc.assist;
        const selections = new Set(storage[key(+i, +k)] || []);
        selections.has(id) ? selections.delete(id) : selections.add(id);
        storage[key(+i, +k)] = [...selections];
      } else return;
      paint();
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel && !panel.hidden) close(false);
    });

    return { costs, view3: serviceCards, view4: paymentPage, open, handle };
  }

  return { create };
})();
