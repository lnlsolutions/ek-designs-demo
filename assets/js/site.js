/* EK Designs — site behaviours: nav, AI assistant, quote funnel, lead store */
(function () {
  'use strict';
  const KEY = 'ek_leads_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

  const seed = [
    { id: 'L-1041', name: 'Melissa Tran', phone: '(480) 555-0142', email: 'melissa@example.com', zip: '85234',
      project: 'Kitchen countertops', material: 'Quartz', timeline: 'Within 30 days', source: 'AI assistant',
      note: 'Island 9ft + perimeter, wants white with soft veining', status: 'Quote sent', createdAt: '2026-11-10' },
    { id: 'L-1040', name: 'Dave Romero', phone: '(623) 555-0188', email: 'dromero@example.com', zip: '85323',
      project: 'Outdoor kitchen', material: 'Granite', timeline: '1 to 3 months', source: 'Google Ads',
      note: 'BBQ island, Arizona heat, wants dark speckle', status: 'Measure booked', createdAt: '2026-11-09' },
    { id: 'L-1039', name: 'Sandra Kim', phone: '(602) 555-0119', email: 'skim@example.com', zip: '85253',
      project: 'Fireplace surround', material: 'Marble', timeline: 'Within 30 days', source: 'Organic search',
      note: 'Bookmatched wall, 12ft ceiling', status: 'New', createdAt: '2026-11-08' }
  ];
  function ensure() {
    const cur = read();
    if (!cur.length) { write(seed); return seed; }
    return cur;
  }
  function addLead(o) {
    const all = ensure();
    const lead = Object.assign({ id: 'L-' + (1042 + all.length), createdAt: new Date().toISOString().slice(0, 10),
      status: 'New', source: 'Website' }, o);
    all.unshift(lead); write(all);
    return lead;
  }
  window.EK = { read: ensure, add: addLead };

  /* ── nav ── */
  const burger = document.getElementById('burger'), links = document.getElementById('navlinks');
  if (burger && links) burger.addEventListener('click', () => links.classList.toggle('open'));

  /* ── assistant ── */
  const chat = document.getElementById('ekChat');
  if (chat) {
    const body = chat.querySelector('.ekb'), fab = document.getElementById('ekFab');
    const input = chat.querySelector('.ekf input'), send = chat.querySelector('.ekf button');
    let opened = false, state = { step: 0 }, lead = {};

    const say = (txt, who) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (who || 'bot');
      d.textContent = txt;
      body.appendChild(d); body.scrollTop = body.scrollHeight;
      return d;
    };
    const quick = (items) => {
      const row = document.createElement('div');
      row.className = 'quick';
      items.forEach(([label, fn]) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.addEventListener('click', () => { row.remove(); say(label, 'me'); fn(); });
        row.appendChild(b);
      });
      body.appendChild(row); body.scrollTop = body.scrollHeight;
    };

    function start() {
      body.innerHTML = '';
      lead = {}; state.step = 0;
      say('Hi, this is the EK Designs assistant. Are you planning a countertop project, or do you have a question about stone?');
      quick([
        ['I need a quote', () => askProject()],
        ['Book a free measure', () => askProject('measure')],
        ['Just have a question', () => askQuestion()]
      ]);
    }
    function askProject(intent) {
      lead.intent = intent || 'quote';
      say(intent === 'measure' ? 'Happy to get you on the schedule. What are we measuring?' : 'Great. What are you working on?');
      quick([['Kitchen countertops', () => askMaterial('Kitchen countertops')],
             ['Bathroom vanity', () => askMaterial('Bathroom vanity')],
             ['Fireplace or wall', () => askMaterial('Fireplace or wall')],
             ['Outdoor kitchen', () => askMaterial('Outdoor kitchen')]]);
    }
    function askMaterial(project) {
      lead.project = project;
      say('Got it. Do you already have a stone in mind?');
      quick([['Quartz', () => askWhen('Quartz')], ['Granite', () => askWhen('Granite')],
             ['Marble or quartzite', () => askWhen('Marble')], ['Not sure yet', () => askWhen('Undecided')]]);
    }
    function askWhen(material) {
      lead.material = material;
      say('Helpful. When are you hoping to have it installed?');
      quick([['As soon as possible', () => askName('Within 30 days')],
             ['1 to 3 months', () => askName('1 to 3 months')],
             ['Just planning', () => askName('Planning ahead')]]);
    }
    function askName(timeline) {
      lead.timeline = timeline;
      say('Last thing and I will get this to the team: what is your name?');
      state.step = 1;
    }
    function askPhone() {
      say('Thanks ' + (lead.name || '') + '. What is the best phone number to reach you?');
      state.step = 2;
    }
    function finish() {
      addLead({ name: lead.name, phone: lead.phone, project: lead.project, material: lead.material || '',
        timeline: lead.timeline || '', note: lead.note || 'Captured by AI assistant', source: 'AI assistant',
        status: lead.intent === 'measure' ? 'Measure requested' : 'New' });
      say('Perfect. I have your details' + (lead.phone ? ' at ' + lead.phone : '') +
          '. The team will reach out shortly to confirm your free in-home measure. If you have photos of the space, you can text them to (480) 525-4623 and it speeds up the quote.');
      quick([['See my project options', () => { location.href = 'gallery.html'; }],
             ['What happens next', () => { location.href = 'process.html'; }]]);
      state.step = 9;
    }
    function askQuestion() {
      lead.intent = 'question';
      say('Ask away. If it helps, I can also get you a free in-home measure with an exact price, no guessing.');
      state.step = 5;
    }

    function handleText(txt) {
      if (state.step === 1) { lead.name = txt; askPhone(); return; }
      if (state.step === 2) {
        const digits = txt.replace(/[^0-9]/g, '');
        if (digits.length < 10) { say('That number looks short. Can you send a full 10 digit number?'); return; }
        lead.phone = txt; finish(); return;
      }
      if (state.step === 5) {
        addLead({ name: lead.name || 'Website visitor', phone: lead.phone || '', project: 'Question',
          note: txt, source: 'AI assistant', status: 'New' });
        say('Got it, I have passed that to the team and someone will reply today. Want me to get you a free measure quote as well?');
        quick([['Yes, get me a quote', () => askProject()], ['No thanks', () => { state.step = 9; }]]);
        return;
      }
      say('Thanks. Tap one of the options above, or call the shop at (480) 525-4623 and we can talk it through.');
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter' && input.value.trim()) { say(input.value.trim(), 'me'); handleText(input.value.trim()); input.value = ''; } });
    send.addEventListener('click', () => { if (input.value.trim()) { say(input.value.trim(), 'me'); handleText(input.value.trim()); input.value = ''; } });
    chat.querySelector('.ekh button').addEventListener('click', () => { chat.classList.remove('open'); fab.classList.remove('hide'); });

    function openChat() {
      if (opened) return;
      opened = true; chat.classList.add('open'); fab.classList.add('hide');
      if (!body.children.length) start();
    }
    fab.addEventListener('click', openChat);
    window.EKopenChat = openChat;

    /* fires 4 seconds after arrival, once per visitor */
    const cfg = (function () {
      let c = null;
      try { c = JSON.parse(localStorage.getItem('ek_popup_v1')); } catch (e) {}
      return Object.assign({ enabled: true, delay: 4 }, c || {});
    })();
    const seen = sessionStorage.getItem('ek_chat_seen') === '1';
    if (cfg.enabled && !seen) {
      setTimeout(() => { if (!chat.classList.contains('open')) { openChat(); sessionStorage.setItem('ek_chat_seen', '1'); } }, cfg.delay * 1000);
    }
  }

  /* ── funnel ── */
  const f = document.getElementById('funnel');
  if (f) {
    let step = 1, data = {};
    const steps = f.querySelectorAll('.fstep'), bar = f.querySelector('.fbar i');
    const show = n => {
      step = n;
      steps.forEach(s => s.classList.toggle('on', Number(s.dataset.step) === n));
      bar.style.width = Math.min(100, (n / 4) * 100) + '%';
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    f.querySelectorAll('.opt').forEach(o => o.addEventListener('click', () => {
      const group = o.dataset.group;
      f.querySelectorAll('.opt[data-group="' + group + '"]').forEach(x => x.classList.remove('sel'));
      o.classList.add('sel');
      data[group] = o.dataset.value;
    }));
    f.querySelectorAll('[data-next]').forEach(b => b.addEventListener('click', () => show(step + 1)));
    f.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => show(step - 1)));

    const submit = document.getElementById('fSubmit');
    if (submit) submit.addEventListener('click', () => {
      const g = id => (document.getElementById(id) || {}).value || '';
      if (!g('fName') || g('fPhone').replace(/[^0-9]/g, '').length < 10) {
        document.getElementById('fErr').textContent = 'Please add your name and a 10 digit phone number.';
        return;
      }
      addLead({ name: g('fName'), phone: g('fPhone'), email: g('fEmail'), zip: g('fZip'),
        project: data.project || 'Not specified', material: data.material || '', timeline: data.when || '',
        note: g('fNotes') || '', source: 'Website funnel', status: 'New' });
      show(5);
      document.getElementById('fNameOut').textContent = g('fName').split(' ')[0] || 'there';
    });
  }

  /* ── admin ── */
  const rows = document.getElementById('leadRows');
  if (rows) {
    ensure();
    const draw = () => {
      const all = read();
      const k = id => (document.getElementById(id) || {}).textContent;
      const counts = all.reduce((m, l) => { m.total++; if (/Measure/.test(l.status)) m.m++; if (/Quote/.test(l.status)) m.q++; return m; }, { total: 0, m: 0, q: 0 });
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('kTotal', counts.total); set('kMeasure', counts.m); set('kQuote', counts.q);
      set('kRate', counts.total ? Math.round((counts.q + counts.m) / counts.total * 100) + '%' : '0%');
      rows.innerHTML = all.map(l => `<tr>
        <td><b>${l.name || '—'}</b><br><span style="font-size:12px;color:#6F6558">${l.phone || ''}</span></td>
        <td>${l.project || '—'}${l.material ? '<br><span style="font-size:12px;color:#6F6558">' + l.material + '</span>' : ''}</td>
        <td>${l.timeline || '—'}</td>
        <td>${l.source || '—'}</td>
        <td><span class="tag ${/Measure/.test(l.status) ? 'c' : /Quote/.test(l.status) ? 'q' : 'n'}">${l.status || 'New'}</span></td>
        <td style="color:#6F6558;font-size:12.5px">${l.createdAt || ''}</td>
      </tr>`).join('');
    };
    draw();
  }

  /* ── gallery filter ── */
  const gal = document.getElementById('gal');
  if (gal) {
    gal.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
      gal.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('btn--gold'));
      btn.classList.add('btn--gold');
      const want = btn.dataset.filter;
      gal.querySelectorAll('figure').forEach(fg => {
        fg.style.display = (want === 'all' || fg.dataset.cat === want) ? '' : 'none';
      });
    }));
  }
})();
