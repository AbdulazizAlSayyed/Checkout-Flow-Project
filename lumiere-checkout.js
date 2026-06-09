// ─── State ────────────────────────────────────────────────────────────────
let cur = 1;
let promoApplied = false;
let discPct = 0;
const BASE = 278.00, TAX = 0.05;

// ─── Navigation ───────────────────────────────────────────────────────────
function goTo(n, back = false) {
  document.querySelectorAll('.step-panel').forEach(p => {
    p.classList.remove('active', 'back');
  });
  const el = document.getElementById(`step${n}`);
  if (!el) return;
  if (back) el.classList.add('back');
  el.classList.add('active');
  cur = (typeof n === 'number') ? n : cur;
  updateProg(cur);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showFinal(which) { // 'Success' | 'Failure'
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active', 'back'));
  document.getElementById('step' + which).classList.add('active');
  document.getElementById('progressBar').style.opacity = '0';
  document.getElementById('progressBar').style.pointerEvents = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProg(n) {
  for (let i = 1; i <= 5; i++) {
    const ps = document.getElementById(`ps${i}`);
    const pd = document.getElementById(`pd${i}`);
    if (!ps || !pd) continue;
    ps.classList.remove('done', 'curr');
    pd.textContent = i;
    if (i < n) { ps.classList.add('done'); pd.textContent = ''; }
    else if (i === n) ps.classList.add('curr');
    const pl = document.getElementById(`pl${i}`);
    if (pl) pl.classList.toggle('done', i < n);
  }
}

// ─── Validators ───────────────────────────────────────────────────────────
const V = {
  firstName: v => v.trim().length >= 2,
  lastName:  v => v.trim().length >= 2,
  email:     v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  phone:     v => v.replace(/\D/g, '').length >= 7,
  address1:  v => v.trim().length >= 4,
  city:      v => v.trim().length >= 2,
  state:     v => v.trim().length >= 2,
  zip:       v => v.trim().length >= 3,
  country:   v => v !== '',
  cardName:  v => v.trim().length >= 3 && /[a-zA-Z]/.test(v),
  cardNumber: v => luhn(v.replace(/\s/g, '')),
  cardExpiry: v => {
    const m = v.replace(/\s/g, '');
    const [mo, yr] = m.split('/');
    if (!mo || !yr || yr.length < 2) return false;
    const now = new Date();
    const exp = new Date(2000 + parseInt(yr), parseInt(mo) - 1, 1);
    return parseInt(mo) >= 1 && parseInt(mo) <= 12 && exp > now;
  },
  cardCvv: v => /^\d{3,4}$/.test(v),
};

const EM = {
  firstName:  'Please enter your first name (min 2 chars)',
  lastName:   'Please enter your last name (min 2 chars)',
  email:      'Please enter a valid email (e.g. you@example.com)',
  phone:      'Please enter a valid phone number (min 7 digits)',
  address1:   'Please enter your street address',
  city:       'Please enter your city',
  state:      'Please enter your state or region',
  zip:        'Please enter a valid postal code',
  country:    'Please select your country',
  cardName:   'Please enter the name as shown on the card',
  cardNumber: 'Please enter a valid card number',
  cardExpiry: 'Please enter a valid future expiry (MM/YY)',
  cardCvv:    'CVV must be 3–4 digits',
};

function lv(input, field) {
  const val = input.value;
  const valid = V[field] ? V[field](val) : true;
  const touched = val.length > 0;
  input.classList.toggle('err', !valid && touched);
  input.classList.toggle('ok',  valid && touched);
  const em = document.getElementById(`e-${field}`);
  if (em) {
    em.textContent = EM[field] || em.textContent;
    em.classList.toggle('show', !valid && touched);
  }
  return valid;
}

function validateSet(fields) {
  let ok = true;
  for (const f of fields) {
    const el = document.getElementById(f);
    if (!el) continue;
    const valid = V[f](el.value);
    el.classList.toggle('err', !valid);
    el.classList.toggle('ok',  valid && el.value.length > 0);
    const em = document.getElementById(`e-${f}`);
    if (em) {
      em.textContent = EM[f] || em.textContent;
      em.classList.toggle('show', !valid);
    }
    if (!valid && ok) { el.focus(); ok = false; }
  }
  return ok;
}

function luhn(n) {
  if (!/^\d+$/.test(n) || n.length < 13) return false;
  let s = 0, alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    s += d; alt = !alt;
  }
  return s % 10 === 0;
}

// ─── Step submissions ──────────────────────────────────────────────────────
function s2Submit() {
  if (validateSet(['firstName', 'lastName', 'email', 'phone'])) goTo(3);
}
function s3Submit() {
  if (validateSet(['address1', 'city', 'state', 'zip', 'country'])) goTo(4);
}
function s4Submit() {
  if (validateSet(['cardName', 'cardNumber', 'cardExpiry', 'cardCvv'])) {
    populateReview(); goTo(5);
  }
}

// ─── Promo codes ──────────────────────────────────────────────────────────
const PROMOS = { 'SAVE10': 10, 'LUMIERE20': 20, 'WELCOME15': 15 };

function applyPromo() {
  const code = document.getElementById('promoInput').value.trim().toUpperCase();
  const msg  = document.getElementById('promoMsg');
  msg.classList.remove('hidden');
  if (promoApplied) {
    msg.className = 'text-sm p-3 rounded-lg mb-4 bg-amber-50 text-amber-700';
    msg.textContent = '✓ A promo code is already applied to your order.';
  } else if (PROMOS[code]) {
    discPct = PROMOS[code];
    promoApplied = true;
    msg.className = 'text-sm p-3 rounded-lg mb-4 bg-green-50 text-green-700';
    msg.textContent = `🎉 "${code}" applied — ${discPct}% off your order!`;
    recalc();
  } else {
    msg.className = 'text-sm p-3 rounded-lg mb-4 bg-red-50 text-red-700';
    msg.textContent = `Invalid code. Try: SAVE10, LUMIERE20, or WELCOME15`;
  }
}

function recalc() {
  const disc  = BASE * discPct / 100;
  const after = BASE - disc;
  const tax   = after * TAX;
  const tot   = after + tax;
  document.getElementById('sb-tax').textContent   = `$${tax.toFixed(2)}`;
  document.getElementById('sb-total').textContent = `$${tot.toFixed(2)}`;
  document.getElementById('placeTotalInBtn').textContent = `$${tot.toFixed(2)}`;
  if (discPct > 0) {
    document.getElementById('sb-discRow').classList.remove('hidden');
    document.getElementById('sb-pct').textContent  = `${discPct}%`;
    document.getElementById('sb-disc').textContent = `–$${disc.toFixed(2)}`;
  }
}

// ─── Card input formatting ─────────────────────────────────────────────────
function fmtCardNum(el) {
  let v = el.value.replace(/\D/g, '').slice(0, 16);
  const isAmex = /^3[47]/.test(v);
  if (isAmex) {
    v = v.replace(/^(\d{4})(\d{0,6})(\d{0,5})$/, '$1 $2 $3').trim();
  } else {
    v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  el.value = v;
  const raw = v.replace(/\s/g, '');
  const shown = (raw.slice(0, 12).replace(/./g, '•') + raw.slice(12)).padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
  document.getElementById('cNum').textContent = shown;

  const iV = /^4/.test(raw), iM = /^5[1-5]|^2[2-7]/.test(raw), iA = /^3[47]/.test(raw);
  document.getElementById('iVisa').setAttribute('opacity',  !raw || iV ? '1' : '.2');
  document.getElementById('iMC').setAttribute('opacity',    !raw || iM ? '1' : '.2');
  document.getElementById('iAmex').setAttribute('opacity',  !raw || iA ? '1' : '.2');
  document.getElementById('cNet').textContent = iV ? 'VISA' : iM ? 'MC' : iA ? 'AMEX' : '';
}

function fmtExp(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2, 4);
  el.value = v;
  document.getElementById('cExp').textContent = v || 'MM / YY';
}

function fmtPhone(el) {
  el.value = el.value.replace(/[^\d\s\-\+\(\)]/g, '');
}

function syncName(v) {
  document.getElementById('cName').textContent = v.toUpperCase() || 'FULL NAME';
}
function syncCvv(v) {
  document.getElementById('cCvv').textContent = v ? '•'.repeat(v.length) : '•••';
}
function flipCard(flip) {
  document.getElementById('card3d').classList.toggle('flip', flip);
}

// ─── Populate review step ──────────────────────────────────────────────────
function populateReview() {
  const g = id => document.getElementById(id).value;
  const fn   = g('firstName'), ln = g('lastName');
  const dial = g('dialCode'),  ph = g('phone');
  const a1   = g('address1'),  a2 = g('address2');
  const city = g('city'), st = g('state'), zp = g('zip');
  const ctryEl = document.getElementById('country');
  const ctry   = ctryEl.options[ctryEl.selectedIndex]?.text || '';
  const cardNum = g('cardNumber');
  const last4   = cardNum.replace(/\s/g, '').slice(-4);

  document.getElementById('rv-name').textContent  = `${fn} ${ln}`;
  document.getElementById('rv-email').textContent = g('email');
  document.getElementById('rv-phone').textContent = `${dial} ${ph}`;
  document.getElementById('rv-addr').textContent  =
    [a1, a2, city, [st, zp].filter(Boolean).join(' '), ctry].filter(Boolean).join(', ');
  document.getElementById('rv-card').textContent  = `•••• •••• •••• ${last4}`;
}

// ─── Custom checkboxes ────────────────────────────────────────────────────
function toggleBillingCheck(cb) {
  const v = document.getElementById('bsVis');
  if (cb.checked) {
    v.className = 'w-5 h-5 rounded border-2 border-prime-500 bg-prime-500 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all';
    v.innerHTML = `<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
  } else {
    v.className = 'w-5 h-5 rounded border-2 border-ink-300 bg-white flex items-center justify-center flex-shrink-0 mt-0.5 transition-all';
    v.innerHTML = '';
  }
}

function toggleTermsCheck(cb) {
  const v   = document.getElementById('tVis');
  const chk = document.getElementById('tCheck');
  if (cb.checked) {
    v.className = 'w-5 h-5 rounded border-2 border-prime-500 bg-prime-500 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all';
    chk.classList.remove('hidden');
    document.getElementById('e-terms').classList.remove('show');
  } else {
    v.className = 'w-5 h-5 rounded border-2 border-ink-300 bg-white flex items-center justify-center flex-shrink-0 mt-0.5 transition-all';
    chk.classList.add('hidden');
  }
}

// ─── Place order ──────────────────────────────────────────────────────────
function placeOrder() {
  if (!document.getElementById('agreeTerms').checked) {
    document.getElementById('e-terms').classList.add('show');
    return;
  }
  const btn = document.getElementById('placeBtn');
  const txt = document.getElementById('placeTxt');
  const spn = document.getElementById('placeSpinner');
  const arr = document.getElementById('placeArrow');
  btn.disabled = true;
  txt.style.display = 'none';
  arr.style.display = 'none';
  spn.style.display = 'block';

  setTimeout(() => {
    btn.disabled = false;
    txt.style.display = '';
    arr.style.display = '';
    spn.style.display = 'none';

    if (Math.random() > 0.35) {
      const ord = '#LUM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      document.getElementById('sOrderNum').textContent = ord;
      document.getElementById('sEmail').textContent =
        document.getElementById('email').value || 'your email';
      showFinal('Success');
    } else {
      document.getElementById('fTime').textContent = new Date().toLocaleTimeString();
      showFinal('Failure');
    }
  }, 2600);
}

// ─── Reset ────────────────────────────────────────────────────────────────
function resetAll() {
  document.querySelectorAll('.fi').forEach(i => {
    i.value = '';
    i.classList.remove('err', 'ok');
  });
  document.querySelectorAll('.em').forEach(e => e.classList.remove('show'));
  document.getElementById('cNum').textContent  = '•••• •••• •••• ••••';
  document.getElementById('cName').textContent = 'FULL NAME';
  document.getElementById('cExp').textContent  = 'MM / YY';
  document.getElementById('cCvv').textContent  = '•••';
  document.getElementById('cNet').textContent  = '';
  document.getElementById('progressBar').style.opacity = '1';
  document.getElementById('progressBar').style.pointerEvents = '';
  document.getElementById('agreeTerms').checked = false;
  toggleTermsCheck(document.getElementById('agreeTerms'));
  document.getElementById('promoMsg').classList.add('hidden');
  document.getElementById('promoInput').value = '';
  promoApplied = false;
  discPct = 0;

  document.getElementById('sb-tax').textContent   = '$13.90';
  document.getElementById('sb-total').textContent = '$291.90';
  document.getElementById('placeTotalInBtn').textContent = '$291.90';
  document.getElementById('sb-discRow').classList.add('hidden');
  goTo(1);
}

// ─── Init ─────────────────────────────────────────────────────────────────
recalc();
updateProg(1);