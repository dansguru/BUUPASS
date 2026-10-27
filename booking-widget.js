/* BUUPASS-style search widget.
   Flow: From → To → Departure → Return → Passengers → Search (opens booking.html).
   Usage: JMWidget.mount(el, { from, to, dep, ret, adt, chd, inf, trip, onChange(state), onSearch(state, url) }) */
window.JMWidget = (() => {
  const { A, ORIGINS, INTL, NET, MON, iso, parse, today, addDays, hasRoute, dayInfo, bookingUrl } = JM;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fmt = s => s ? s.slice(8) + ' ' + s.slice(5, 7) + ' ' + s.slice(0, 4) : '';
  const nm = c => c ? `${c} ${A[c].city}${c === 'NBO' ? ' (JKIA)' : ''}` : '';

  function mount(el, o = {}) {
    const st = { from: o.from || '', to: o.to || '', to2: o.to2 || '', dep: o.dep || '', ret: o.ret || '', adt: o.adt || 1, chd: o.chd || 0, inf: o.inf || 0,
      trip: o.trip || 'roundtrip', view: null, q: '', month: null };
    el.innerHTML = `
      <div class="bw"><div class="bw-dim" hidden></div>
      <form class="bw-panel" novalidate>
        <div class="bw-trips">
          ${[['oneway', 'One way'], ['roundtrip', 'Round Trip'], ['multi', 'Multi-city']].map(([v, t]) => `<label><input type="radio" name="bw-trip-${el.id}" value="${v}"><span>${t}</span></label>`).join('')}
        </div>
        <div class="bw-row">
          <div class="bw-route">
            <label class="bw-box"><i>●</i><input data-f="from" placeholder="From" autocomplete="off" aria-label="From" readonly></label>
            <button type="button" class="bw-swap" aria-label="Swap origin and destination">⇄</button>
            <label class="bw-box"><input data-f="to" placeholder="To" autocomplete="off" aria-label="To" readonly></label>
          </div>
          <div class="bw-box bw-dates"><button type="button" data-d="dep"><i>▦</i><span></span></button><button type="button" data-d="ret"><span></span></button></div>
          <button type="button" class="bw-box bw-pax" aria-haspopup="dialog"><i><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/></svg></i><span></span><b>⌄</b></button>
          <button type="submit" class="bw-search">SEARCH</button>
        </div>
        <p class="bw-msg" aria-live="polite"></p>
        <div class="bw-loading-screen" role="status" aria-label="Searching flights" aria-live="polite" hidden><span class="bw-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <div class="bw-pop bw-list" data-p="from" hidden></div>
        <div class="bw-pop bw-list" data-p="to" hidden></div>
        <div class="bw-pop bw-list" data-p="to2" hidden></div>
        <div class="bw-pop bw-cal" data-p="date" hidden></div>
        <div class="bw-pop bw-paxpop" data-p="pax" role="dialog" aria-label="Passengers" hidden></div>
      </form></div>`;
    const $ = s => el.querySelector(s), $$ = s => [...el.querySelectorAll(s)];
    const pops = Object.fromEntries($$('.bw-pop').map(p => [p.dataset.p, p]));
    const inp = { from: $('[data-f=from]'), to: $('[data-f=to]') };

    /* ---------- view helpers ---------- */
    function paint() {
      inp.from.value = nm(st.from);
      inp.to.value = nm(st.to) + (st.trip === 'multi' && st.to2 ? ` · ${nm(st.to2)}` : '');
      inp.to.setAttribute('aria-label', st.trip === 'multi' && st.to2 ? `Route via ${A[st.to].city} to ${A[st.to2].city}` : 'To');
      $('.bw-swap').hidden = st.trip === 'multi';
      $('.bw-row').classList.toggle('multicity', st.trip === 'multi');
      inp.to.placeholder = st.trip === 'multi' ? 'First stop' : 'To';
      $('[data-d=dep] span').textContent = fmt(st.dep) || 'Departure';
      $('[data-d=ret] span').textContent = fmt(st.ret) || (st.trip === 'multi' ? 'Second trip' : 'Return');
      $('.bw-pax span').textContent = st.adt + st.chd + st.inf;
      $('.bw-dates').classList.toggle('oneway', st.trip === 'oneway');
      $('.bw-row').classList.toggle('oneway', st.trip === 'oneway');
      $$('.bw-trips label').forEach(l => { const r = l.querySelector('input'); r.checked = r.value === st.trip; l.classList.toggle('on', r.checked); });
    }
    function open(view) {
      st.view = view;
      $('.bw-dates').dataset.active = view === 'dep' || view === 'ret' ? view : '';
      const key = view === 'dep' || view === 'ret' ? 'date' : view;
      Object.entries(pops).forEach(([k, p]) => p.hidden = k !== key);
      $('.bw-dim').hidden = !view;
      if (view === 'from' || view === 'to' || view === 'to2') list(view);
      if (key === 'date') cal();
      if (view === 'pax') paxPop();
      $('.bw-pax').classList.toggle('open', view === 'pax');
    }
    const close = () => { st.q = ''; open(null); paint(); };

    /* ---------- origin / destination lists ---------- */
    function list(kind) {
      const q = st.q.toLowerCase(), match = c => !q || c.toLowerCase().includes(q) || A[c].city.toLowerCase().includes(q);
      let groups;
      if (kind === 'from') groups = [['Operated by BUUPASS', ORIGINS]];
      else if (kind === 'to2' && st.to) groups = [['Operated by BUUPASS', NET[st.to] || []]];
      else if (st.from) groups = [['Operated by BUUPASS', NET[st.from] || []]];
      else groups = [['Operated by BUUPASS', ORIGINS]];
      const html = groups.map(([t, cs]) => {
      const items = cs.filter(c => match(c) && (kind === 'from' || c !== st.from && (kind !== 'to2' || c !== st.to)));
        return items.length ? `<h4>${t}</h4>` + items.map(c => `<button type="button" data-c="${c}"><b>${c}</b> ${A[c].city}${c === 'NBO' ? ' (JKIA)' : ''}</button>`).join('') : '';
      }).join('');
      pops[kind].innerHTML = `<h3>Choose ${kind === 'from' ? 'an Origin' : kind === 'to2' ? 'the next city' : 'a Destination'}</h3>` + (html || '<p class="bw-empty">No routes are available for this selection.</p>');
    }
    ['from', 'to', 'to2'].forEach(k => {
      if (inp[k]) {
        inp[k].addEventListener('click', () => { if (st.view !== k) { st.q = ''; open(k); } });
        inp[k].addEventListener('focus', () => { if (st.view !== k) { st.q = ''; open(k); } });
      }
      pops[k].addEventListener('click', e => {
        const b = e.target.closest('[data-c]'); if (!b) return;
        const c = b.dataset.c; st.q = '';
        if (k === 'from') {
          st.from = c; if (st.to === c || (NET[c] && !NET[c].includes(st.to) && !INTL.includes(st.to))) st.to = '';
          st.to2 = ''; st.dep = ''; st.ret = '';
          paint(); open('to'); inp.to.focus();
        } else if (k === 'to' && st.trip === 'multi') {
          st.to = c; st.to2 = ''; st.dep = ''; st.ret = ''; paint(); open('to2');
        } else if (k === 'to2') { st.to2 = c; st.ret = ''; paint(); open('dep'); }
        else { st.to = c; st.dep = ''; st.ret = ''; paint(); notify(); open('dep'); }
      });
    });
    inp.to.addEventListener('click', () => {
      if (st.trip === 'multi' && st.to && st.to2) { st.q = ''; open('to2'); }
    });
    $('.bw-swap').addEventListener('click', () => {
      [st.from, st.to] = [st.to, st.from]; paint(); if (st.from && st.to) notify();
    });
    const notify = () => { if (st.from && st.to && o.onChange) o.onChange({ ...st }); };

    /* ---------- calendar ---------- */
    function cal() {
      const kind = st.view === 'ret' ? 'ret' : 'dep', t = today();
      const [a, b] = kind === 'ret' ? (st.trip === 'multi' ? [st.to, st.to2] : [st.to, st.from]) : [st.from, st.to], known = a && b && hasRoute(a, b);
      if (!st.month) st.month = (st[kind] || t).slice(0, 7) + '-01';
      const first = parse(st.month), month = (i) => new Date(first.getFullYear(), first.getMonth() + i, 1);
      const grid = d => {
        const y = d.getFullYear(), m = d.getMonth(), n = new Date(y, m + 1, 0).getDate();
        let h = `<div class="bw-month"><h4>${MONTHS[m]} ${y}</h4><div class="bw-wd">${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => `<span>${x}</span>`).join('')}</div><div class="bw-days">`;
        h += '<span></span>'.repeat(d.getDay());
        for (let i = 1; i <= n; i++) {
          const s = iso(new Date(y, m, i));
          const off = s < t || (kind === 'ret' && st.dep && s < st.dep) || (known && !dayInfo(a, b, s).has);
          const cls = [s === st.dep || s === st.ret ? 'sel' : '', st.trip === 'roundtrip' && st.dep && st.ret && s > st.dep && s < st.ret ? 'in' : '', s === t ? 'today' : ''].join(' ');
          h += `<button type="button" class="${cls}" data-s="${s}" ${off ? 'disabled' : ''}>${i}</button>`;
        }
        return h + '</div></div>';
      };
      const curMonth = t.slice(0, 7) + '-01';
      pops.date.innerHTML = `<h3>Choose your ${kind === 'ret' ? (st.trip === 'multi' ? 'SECOND TRIP' : 'RETURN') : 'DEPARTURE'} date</h3>
        <span class="bw-legend">No Flights</span>
        <button type="button" class="bw-nav prev" aria-label="Previous months" ${st.month <= curMonth ? 'disabled' : ''}>‹</button>
        <button type="button" class="bw-nav next" aria-label="Next months">›</button>
        <div class="bw-months">${grid(month(0))}${grid(month(1))}</div>
        <div class="bw-done"><button type="button" class="bw-donebtn">Done</button></div>`;
    }
    pops.date.addEventListener('click', e => {
      if (e.target.closest('.prev')) { st.month = iso(new Date(parse(st.month).getFullYear(), parse(st.month).getMonth() - 1, 1)); return cal(); }
      if (e.target.closest('.next')) { st.month = iso(new Date(parse(st.month).getFullYear(), parse(st.month).getMonth() + 1, 1)); return cal(); }
      if (e.target.closest('.bw-donebtn')) return close();
      const b = e.target.closest('[data-s]'); if (!b) return;
      const s = b.dataset.s;
      if (st.view === 'dep') {
        st.dep = s; if (st.ret && st.ret < s) st.ret = '';
        paint(); if (st.trip === 'roundtrip' || st.trip === 'multi') { st.month = null; open('ret'); } else open('pax');
      } else { st.ret = s; paint(); open('pax'); }
    });
    $$('[data-d]').forEach(b => b.addEventListener('click', () => { st.month = null; open(b.dataset.d); }));

    /* ---------- passengers ---------- */
    function paxPop() {
      const rows = [['adt', 'Adult', '12+ years'], ['chd', 'Children', '2–11 years'], ['inf', 'Infant', '<2 years']];
      pops.pax.innerHTML = `<h3>Passenger(s)</h3>` + rows.map(([k, t, s]) => `
        <div class="bw-prow"><div>${t}<small>(${s})</small></div>
        <button type="button" data-k="${k}" data-n="-1" aria-label="Fewer ${t}">−</button><output>${st[k]}</output><button type="button" data-k="${k}" data-n="1" aria-label="More ${t}">+</button></div>`).join('') +
        `<div class="bw-done"><button type="button" class="bw-donebtn">Done</button></div>`;
    }
    pops.pax.addEventListener('click', e => {
      if (e.target.closest('.bw-donebtn')) return close();
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k, v = st[k] + +b.dataset.n;
      const nxt = { ...st, [k]: v };
      if (nxt.adt < 1 || nxt.chd < 0 || nxt.inf < 0 || nxt.adt + nxt.chd > 9 || nxt.inf > nxt.adt) return;
      st[k] = v; paxPop(); paint();
    });
    $('.bw-pax').addEventListener('click', () => open(st.view === 'pax' ? null : 'pax'));

    /* ---------- misc controls ---------- */
    $$('.bw-trips input').forEach(r => r.addEventListener('change', () => {
      st.trip = r.value; st.ret = '';
      if (st.trip !== 'multi') st.to2 = '';
      $('.bw-msg').textContent = '';
      paint();
    }));
    $('.bw-dim').addEventListener('click', close);
    document.addEventListener('click', e => { if (st.view && !el.contains(e.target)) close(); });
    el.addEventListener('keydown', e => { if (e.key === 'Escape' && st.view) { close(); } });

    $('.bw-panel').addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('.bw-msg'), need = (t, v) => { msg.textContent = t; open(v); };
      if (!st.from) return need('Choose where you are flying from.', 'from');
      if (!st.to) return need('Choose where you are flying to.', 'to');
      if (st.trip === 'multi' && !st.to2) return need('Choose the next city in your trip.', 'to2');
      if (!st.dep) return need('Choose your departure date.', 'dep');
      if ((st.trip === 'roundtrip' || st.trip === 'multi') && !st.ret) return need(st.trip === 'multi' ? 'Choose your second departure date.' : 'Choose your return date.', 'ret');
      msg.textContent = '';
      const url = bookingUrl(st);
      const button = $('.bw-search'), screen = $('.bw-loading-screen');
      button.disabled = true;
      button.classList.add('is-loading');
      button.innerHTML = '<span class="bw-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
      button.setAttribute('aria-label', 'Searching for flights');
      screen.hidden = false;
      let finished = false;
      const finishLoading = () => {
        if (finished) return;
        finished = true;
        clearTimeout(fallbackTimer);
        screen.hidden = true;
        el.removeAttribute('aria-busy');
        button.disabled = false;
        button.classList.remove('is-loading');
        button.textContent = 'SEARCH';
        button.removeAttribute('aria-label');
      };
      const fallbackTimer = setTimeout(finishLoading, 12000);
      window.addEventListener('pagehide', finishLoading, { once: true });
      requestAnimationFrame(() => {
        try {
          if (o.onSearch) {
            const result = o.onSearch({ ...st }, url);
            if (result && typeof result.then === 'function') result.then(finishLoading, finishLoading);
          } else location.href = url;
        } catch (error) {
          finishLoading();
          msg.textContent = 'Search could not be opened. Please try again.';
        }
      });
    });
    paint();
    return { state: st };
  }
  return { mount };
})();
