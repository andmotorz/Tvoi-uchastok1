(function () {
'use strict';
const C = window.CFG || {}, $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Аналитика ---- */
const YM = C.YM_ID, GT = C.GTAG_IDS || [];
if (YM) { (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a) })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  ym(YM, 'init', {clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true}); }
if (GT.length) { const g = document.createElement('script'); g.async = 1; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GT[0]; document.head.appendChild(g);
  window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments) }; gtag('js', new Date()); GT.forEach(id => gtag('config', id)); }
function track(goal) {
  try { if (YM) ym(YM, 'reachGoal', goal); } catch (_) {}
  try { if (window.gtag) { gtag('event', goal); if (goal === 'lead') { gtag('event', 'generate_lead'); if (C.ADS_LEAD) gtag('event', 'conversion', {send_to: C.ADS_LEAD}); } } } catch (_) {}
}
document.addEventListener('click', e => { const a = e.target.closest('[data-goal]'); if (a) track(a.dataset.goal); });

const q0 = new URLSearchParams(location.search);
const SRC = (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'yclid', 'gclid'].filter(k => q0.get(k)).map(k => k + '=' + q0.get(k)).join(' ') || ('реферер: ' + (document.referrer || 'прямой заход'))) + ' | ' + location.pathname;

/* ---- Меню, прогресс, шапка ---- */
const nav = $('nav'), bg = $('bg'), hdr = document.querySelector('header'), prog = $('prog');
bg.onclick = () => { const o = nav.classList.toggle('open'); bg.setAttribute('aria-expanded', o); };
nav.querySelectorAll('a').forEach(a => a.onclick = () => { nav.classList.remove('open'); bg.setAttribute('aria-expanded', false); });
let tick = false;
addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => {
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%'; hdr.classList.toggle('sm', scrollY > 40); tick = false; }); }, {passive: true});

/* ---- Заявка: выбранное передаётся в форму ---- */
let note = '';
function setNote(t) { note = t; $('chip').hidden = !t; $('chipt').textContent = t; }
$('chipx').onclick = () => setNote('');
function go(t, goal) { setNote(t); track(goal); $('contact').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}); setTimeout(() => $('nm').focus({preventScroll: true}), 700); }

/* ---- Калькулятор ---- */
let calcNote = '', shown = 0;
const fmt = n => n.toLocaleString('ru-RU');
function setPrice(v) {
  const o = $('out');
  if (v == null) { o.textContent = 'Цена — после заявки'; shown = 0; return; }
  const from = shown, t0 = performance.now(); shown = v;
  if (reduce) { o.textContent = 'от ' + fmt(v) + ' BYN'; return; }
  (function f(t) { const p = Math.min((t - t0) / 500, 1); o.textContent = 'от ' + fmt(Math.round(from + (v - from) * p)) + ' BYN'; if (p < 1) requestAnimationFrame(f); })(t0);
}
function calc() {
  $('lenv').textContent = $('len').value;
  const n = $('type').value, d = $('deep').value, p = (C.PRICE_FROM || {})[n];
  setPrice(p == null ? null : p);
  $('cn').textContent = 'Цена зависит от глубины, трубы и грунта. Точную стоимость быстро посчитаем после отправки заявки.';
  calcNote = [n === '1' ? '1 колодец' : n + ' колодца', d + ' кол. в глубину', $('res').value, 'труба ' + $('len').value + ' м',
    $('dig').checked ? 'нужны земляные работы' : 'без земляных работ', $('gw').checked ? 'высокие грунтовые воды' : ''].filter(Boolean).join(', ');
}
['type', 'deep', 'res', 'len', 'dig', 'gw'].forEach(id => $(id).addEventListener('input', calc));
calc();
$('ord').onclick = e => { e.preventDefault(); go('Расчёт: ' + calcNote, 'calc_request'); };
document.querySelectorAll('.pr[data-p]').forEach(el => { const p = (C.PRICE_FROM || {})[el.dataset.p]; el.textContent = p == null ? 'Цена — после заявки' : 'от ' + fmt(p) + ' BYN'; });

/* ---- Каталог колец ---- */
const qty = {};
document.querySelectorAll('[data-price]').forEach(el => { const p = (C.RING_PRICES || {})[el.dataset.price]; if (p) el.textContent = p + ' BYN'; });
function sumUp() { const l = Object.entries(qty).filter(e => e[1] > 0).map(e => e[0] + ' × ' + e[1]).join(', '); $('sumt').textContent = l || 'Выберите позиции и количество'; $('sumb').disabled = !l; return l; }
const cat = $('catalog');
cat.addEventListener('click', e => { const b = e.target.closest('button[data-d]'); if (!b) return; const q = b.parentNode, i = q.querySelector('input'); i.value = Math.max(0, Math.min(99, +i.value + +b.dataset.d)); qty[q.dataset.k] = +i.value; sumUp(); });
cat.addEventListener('input', e => { const q = e.target.parentNode; qty[q.dataset.k] = Math.max(0, Math.min(99, +e.target.value || 0)); sumUp(); });
$('sumb').onclick = () => go('Кольца и плиты: ' + sumUp(), 'rings_request');

/* ---- Форма ---- */
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  if ($('hp').value) return;
  const name = $('nm').value.trim(), phone = $('ph').value.trim(), err = $('err'); err.textContent = '';
  if (name.length < 2) return err.textContent = 'Введите ваше имя.';
  if (phone.replace(/\D/g, '').length < 9) return err.textContent = 'Введите телефон полностью, например +375 29 123-45-67.';
  const btn = e.submitter; btn && (btn.disabled = true);
  try {
    if (!C.FORM_ENDPOINT) throw new Error('no endpoint');
    const r = await fetch(C.FORM_ENDPOINT, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name, phone, note, source: SRC, website: ''})});
    if (!r.ok) throw new Error('bad');
    $('msg').classList.add('show'); $('form').reset(); setNote(''); track('lead');
  } catch (_) { err.textContent = 'Не удалось отправить заявку. Позвоните нам: +375 29 113-69-21.'; }
  btn && (btn.disabled = false);
});

/* ---- Анимации при скролле ---- */
document.querySelectorAll('h2').forEach(h => h.classList.add('rv-on', 'hl'));
document.querySelectorAll('.rv-on').forEach(el => { const s = [...el.parentNode.children].filter(c => c.classList.contains('rv-on')); el.style.transitionDelay = (s.indexOf(el) * 90) + 'ms'; });
const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; el.classList.add('in'); io.unobserve(el); setTimeout(() => el.style.transitionDelay = '0ms', 1400); }), {threshold: .12});
document.querySelectorAll('.rv-on').forEach(el => io.observe(el));
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target, n = +el.dataset.n; cio.unobserve(el);
  if (reduce || n === 0) return el.textContent = n;
  let t0; const step = t => { t0 = t0 || t; const p = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
}), {threshold: .6});
document.querySelectorAll('[data-n]').forEach(el => cio.observe(el));
})();
