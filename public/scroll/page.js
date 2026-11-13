/* ============================================================================
   HealthClarify scroll page. Page-local behaviour. The engine drives the pinned
   acts and the pan rail; everything here is this page's own logic:

     - the real candidate-line filter used in the reading chapter
     - range geometry (where a value sits on its printed range)
     - THE SIGNATURE MOVE: the raw printed line becomes its ruler. The three real
       tokens (value, lower bound, upper bound) travel from their place in the
       text run to their place on the ruler as a focus band sweeps the report.
     - consent logic, the drop zone check, the editable value and the question
       list that follows it
   Data is data.js, generated from the app's own fictional sample report.
   ========================================================================== */
(function () {
  'use strict';

  var R = window.HC_SAMPLE || [];
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (rm) doc.body.classList.add('rm');
  doc.body.classList.remove('no-js');

  /* ----------------------------------------------------------- helpers ---- */
  function clamp(x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); }
  function sm(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function fmt(v) { return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(2))); }

  /* ---- language. Same storage key as the app, so the choice follows the visitor
         into the analyzer. Hindi and Marathi are drafts (see build-i18n.mjs). ---- */
  var I18N = window.HC_I18N || { en: {} };
  var LANG_KEY = 'hc-lang';
  var lang = 'en';
  try { var savedLang = window.localStorage.getItem(LANG_KEY); if (savedLang === 'hi' || savedLang === 'mr') lang = savedLang; } catch (e) {}
  function t(k, v) {
    var s = (I18N[lang] && I18N[lang][k] !== undefined) ? I18N[lang][k] : I18N.en[k];
    if (s === undefined) return k;
    return v ? s.replace(/\{(\w+)\}/g, function (m, n) { return n in v ? v[n] : m; }) : s;
  }
  function tp(panel) { var s = t('panel.' + panel); return s === 'panel.' + panel ? panel : s; }

  /* ------------------------------------------------- range geometry ------- */
  function parseRef(ref) {
    var m;
    if ((m = ref.match(/^\s*([\d.]+)\s*-\s*([\d.]+)\s*$/))) return { kind: 'both', sym: '-', loT: m[1], hiT: m[2], lo: +m[1], hi: +m[2] };
    if ((m = ref.match(/^\s*<\s*([\d.]+)/))) return { kind: 'high', sym: '<', hiT: m[1], hi: +m[1] };
    if ((m = ref.match(/^\s*>\s*([\d.]+)/))) return { kind: 'low', sym: '>', loT: m[1], lo: +m[1] };
    return { kind: 'none', sym: '' };
  }
  function isOutside(p, v) {
    if (p.kind === 'both') return v < p.lo || v > p.hi;
    if (p.kind === 'high') return v >= p.hi;
    if (p.kind === 'low') return v <= p.lo;
    return false;
  }
  function domain(p, v) {
    var lo, hi;
    if (p.kind === 'both') { var s = p.hi - p.lo; lo = Math.max(0, p.lo - s); hi = p.hi + s; }
    else if (p.kind === 'high') { lo = 0; hi = p.hi * 1.9; }
    else { lo = 0; hi = p.lo * 2.4; }
    var span = hi - lo;
    lo = Math.min(lo, v - span * 0.08);
    hi = Math.max(hi, v + span * 0.08);
    return [lo, hi];
  }

  R.forEach(function (r, i) { r.id = i; r.p = parseRef(r.reference); });
  var values = R.map(function (r) { return r.value; });
  function out(i) { return isOutside(R[i].p, values[i]); }
  function statusText(o) { return t(o ? 'status.out' : 'status.in'); }
  function outsideCount() { var n = 0; for (var i = 0; i < R.length; i++) if (out(i)) n++; return n; }

  /* ---- the raw printed line, as an OCR pass would hand it over ---- */
  function rawLine(r) {
    var nm = (r.name + (r.abbreviation ? ' (' + r.abbreviation + ')' : '')).toUpperCase();
    if (nm.length > 30) nm = r.name.toUpperCase();
    return pad(nm, 30) + pad(r.displayValue, 7) + pad(r.unit, 8) + r.reference;
  }
  var HEADER = pad('TEST', 30) + pad('RESULT', 7) + pad('UNIT', 8) + 'REFERENCE';

  /* ---- THE FILTER. Real: a line is kept when it carries a test name, or a
         number with a unit. Same rule the app's candidate step describes. ---- */
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var nameRes = [];
  R.forEach(function (r) {
    nameRes.push(new RegExp('(^|[^a-z0-9])' + escRe(r.name) + '([^a-z0-9]|$)', 'i'));
    if (r.abbreviation) nameRes.push(new RegExp('(^|[^a-z0-9])' + escRe(r.abbreviation) + '([^a-z0-9]|$)', 'i'));
  });
  var unitRe = /\d[\d.,]*\s*(g\/dL|mg\/dL|U\/L|ng\/mL|ng\/dL|pg\/mL|µIU\/mL|10³\/µL|%)/i;
  function isCandidate(line) {
    return unitRe.test(line) || nameRes.some(function (re) { return re.test(line); });
  }

  /* ---- the sample report, three pages ---- */
  function rows(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(rawLine(R[i])); return o; }
  var PAGES = [
    ['Report ID     DEMO-0001', 'Collected     12/10/2026 08:10', 'Sample        Venous blood, fasting', '',
      'COMPLETE BLOOD COUNT', HEADER].concat(rows(0, 2), ['', 'LIPID PROFILE'], rows(3, 5), ['', 'Method: automated analyser']),
    ['THYROID PROFILE', HEADER].concat(rows(6, 7), ['', 'DIABETES MARKERS'], rows(8, 9), ['', 'VITAMINS'], rows(10, 11), ['', 'Reference ranges are lab specific.']),
    ['LIVER FUNCTION', HEADER].concat(rows(12, 13), ['', 'KIDNEY FUNCTION'], rows(14, 14), ['', 'Please correlate clinically.', '*** End of report ***', 'Authorised signatory (fictional)'])
  ];

  /* ===================================================== the Track ======== */
  /* One ruler. Used by every row of the peak chapter and by the editable ruler
     in the check chapter. Tokens: value, lower bound, upper bound, and the
     separator glyph that only exists in the raw run. q runs 0 (raw text) to 1
     (ruler). */
  var CW = 0;                                           /* width of one mono character, measured */
  function measureChar() {
    var m = doc.createElement('span');
    m.className = 'tk'; m.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden';
    m.textContent = '0000000000';
    doc.body.appendChild(m); CW = m.offsetWidth / 10; doc.body.removeChild(m);
  }

  function Track(host, r) {
    this.host = host; this.r = r; this.q = 0;
    var p = r.p;
    host.innerHTML =
      '<i class="t-line"></i><i class="t-band"></i>' +
      (p.lo !== undefined ? '<i class="t-tick t-tlo"></i>' : '') +
      (p.hi !== undefined ? '<i class="t-tick t-thi"></i>' : '') +
      '<i class="t-dot"></i>' +
      '<span class="tk tk-val"></span><span class="tk tk-sep"></span>' +
      (p.lo !== undefined ? '<span class="tk tk-lo"></span>' : '') +
      (p.hi !== undefined ? '<span class="tk tk-hi"></span>' : '');
    var e = this.e = {
      line: $('.t-line', host), band: $('.t-band', host), tlo: $('.t-tlo', host), thi: $('.t-thi', host),
      dot: $('.t-dot', host), val: $('.tk-val', host), sep: $('.tk-sep', host), lo: $('.tk-lo', host), hi: $('.tk-hi', host)
    };
    e.sep.textContent = p.sym;
    if (e.lo) e.lo.textContent = p.loT;
    if (e.hi) e.hi.textContent = p.hiT;
  }
  Track.prototype.setValue = function (v, display) {
    this.v = v;
    this.e.val.textContent = display + ' ' + this.r.unit;
    this.e.dot.classList.toggle('is-out', isOutside(this.r.p, v));
    this.measure();
  };
  Track.prototype.measure = function () {
    var e = this.e, p = this.r.p, W = this.host.clientWidth, H = this.host.clientHeight;
    if (!W) return;
    if (!CW) measureChar();
    this.W = W; this.H = H;
    var d = domain(p, this.v), X = function (x) { return (x - d[0]) / (d[1] - d[0]) * W; };
    var wVal = e.val.offsetWidth, wLo = e.lo ? e.lo.offsetWidth : 0, wHi = e.hi ? e.hi.offsetWidth : 0;
    var g = this.g = {};
    g.xDot = X(this.v);
    g.xVal = clamp(g.xDot - wVal / 2, 0, Math.max(0, W - wVal));
    if (e.lo) { g.xTlo = X(p.lo); g.xLo = clamp(g.xTlo - wLo / 2, 0, W - wLo); }
    if (e.hi) { g.xThi = X(p.hi); g.xHi = clamp(g.xThi - wHi / 2, 0, W - wHi); }
    g.bandL = p.kind === 'low' ? X(p.lo) : 0;
    g.bandR = p.kind === 'high' ? X(p.hi) : p.kind === 'low' ? W : X(p.hi);
    /* where each token sits in the raw text run, so the move starts from real text */
    var n = {}; n.val = 0;
    var x = wVal + 3 * CW;
    if (p.kind === 'both') { n.lo = x; n.sep = x + wLo + CW; n.hi = x + wLo + 3 * CW; }
    else if (p.kind === 'high') { n.sep = x; n.hi = x + 2 * CW; }
    else { n.sep = x; n.lo = x + 2 * CW; }
    this.nat = n;
    this.draw(this.q, true);
  };
  Track.prototype.draw = function (q, force) {
    if (!this.g) return;
    if (!force && Math.abs(q - this.q) < 0.002) return;
    this.q = q;
    var e = this.e, g = this.g, n = this.nat, W = this.W;
    var tq = sm(q / 0.75), dq = sm((q - 0.3) / 0.7), pq = clamp((q - 0.65) / 0.35);
    var lineY = (0.58 - 0.5) * this.H;
    var yVal = (lineY - 22) * tq, yEnd = (lineY + 20) * tq;
    e.val.style.transform = 'translate3d(' + (n.val + (g.xVal - n.val) * tq).toFixed(1) + 'px,' + yVal.toFixed(1) + 'px,0)';
    e.sep.style.transform = 'translate3d(' + n.sep.toFixed(1) + 'px,0,0)';
    e.sep.style.opacity = (1 - clamp(q / 0.3)).toFixed(3);
    if (e.lo) e.lo.style.transform = 'translate3d(' + (n.lo + (g.xLo - n.lo) * tq).toFixed(1) + 'px,' + yEnd.toFixed(1) + 'px,0)';
    if (e.hi) e.hi.style.transform = 'translate3d(' + (n.hi + (g.xHi - n.hi) * tq).toFixed(1) + 'px,' + yEnd.toFixed(1) + 'px,0)';
    e.line.style.transform = 'scaleX(' + dq.toFixed(3) + ')';
    e.band.style.transform = 'translateX(' + g.bandL.toFixed(1) + 'px) scaleX(' + (Math.max(0, g.bandR - g.bandL) / W * dq).toFixed(4) + ')';
    e.band.style.opacity = dq.toFixed(3);
    if (e.tlo) { e.tlo.style.transform = 'translateX(' + g.xTlo.toFixed(1) + 'px)'; e.tlo.style.opacity = dq.toFixed(3); }
    if (e.thi) { e.thi.style.transform = 'translateX(' + g.xThi.toFixed(1) + 'px)'; e.thi.style.opacity = dq.toFixed(3); }
    e.dot.style.transform = 'translateX(' + g.xDot.toFixed(1) + 'px) scale(' + (0.4 + 0.6 * pq).toFixed(3) + ')';
    e.dot.style.opacity = pq.toFixed(3);
  };

  /* ================================================ 1 · UPLOAD ============ */
  var heroLines = $('#heroLines');
  if (heroLines) heroLines.textContent = [HEADER].concat(R.slice(0, 11).map(rawLine)).join('\n');

  var chip = $('#fileChip'), fileName = $('#fileName'), fileMeta = $('#fileMeta');
  var state = { loaded: false, own: false, file: { kind: 'none' } };
  function renderChip() {
    var f = state.file;
    chip.dataset.state = f.kind === 'none' ? 'empty' : 'loaded';
    if (f.kind === 'none') { fileName.textContent = t('file.none'); fileMeta.textContent = t('file.none2'); }
    else if (f.kind === 'sample') { fileName.textContent = t('file.sample'); fileMeta.textContent = t('file.sampleMeta'); }
    else { fileName.textContent = f.name; fileMeta.textContent = t('file.own'); }
  }
  function setLoaded(kind, name) { state.loaded = true; state.file = { kind: kind, name: name }; renderChip(); }
  var readHint = $('#readHint');
  function renderHint() { readHint.textContent = t(state.own ? 'read.hint.own' : 'read.hint.sample'); }

  /* a hard cut: cover, jump, uncover */
  var cutEl = $('#cut');
  function cutTo(sel) {
    var t = $(sel); if (!t) return;
    var y = t.getBoundingClientRect().top + window.scrollY;
    function go() {
      window.scrollTo({ top: y, behavior: 'instant' });
      var h = $('h1, h2', t);
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    if (rm) { go(); return; }
    cutEl.classList.add('is-on');
    setTimeout(function () { go(); requestAnimationFrame(function () { cutEl.classList.remove('is-on'); }); }, 110);
  }

  $('#useSample').addEventListener('click', function () {
    state.own = false;
    setLoaded('sample');
    renderHint();
    cutTo('#ch-consent');
  });

  var drop = $('#drop'), input = $('#fileInput'), dropMsg = $('#dropMsg');
  var TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  function size(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  var dropState = null;
  function renderDrop() {
    dropMsg.classList.toggle('is-error', !!dropState && dropState.k !== 'ok');
    dropMsg.textContent = dropState ? t('drop.' + dropState.k, { name: dropState.name, size: dropState.size }) : '';
  }
  function takeFile(f) {
    if (!f) return;
    if (TYPES.indexOf(f.type) === -1) { dropState = { k: 'badType' }; renderDrop(); return; }
    if (f.size > 10 * 1048576) { dropState = { k: 'big' }; renderDrop(); return; }
    state.own = true;
    dropState = { k: 'ok', name: f.name, size: size(f.size) }; renderDrop();
    setLoaded('own', f.name);
    renderHint();
    setTimeout(function () { cutTo('#ch-consent'); }, rm ? 0 : 900);
  }
  input.addEventListener('change', function () { takeFile(input.files && input.files[0]); });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { takeFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });

  /* ================================================ 2 · CONSENT =========== */
  var cOcr = $('#cOcr'), cAi = $('#cAi'), leaves = $('#leaves');
  function renderLeaves() {
    var items = [];
    if (!cOcr.checked && !cAi.checked) {
      items.push([t('leaves.none'), false]);
    } else {
      items.push([cOcr.checked ? t('leaves.file') : t('leaves.local'), cOcr.checked]);
      if (cAi.checked) items.push([t('leaves.lines'), true]);
    }
    items.push([t('leaves.saved'), false]);
    leaves.innerHTML = items.map(function (it) { return '<li' + (it[1] ? ' class="is-send"' : '') + '>' + esc(it[0]) + '</li>'; }).join('');
  }
  cOcr.addEventListener('change', renderLeaves);
  cAi.addEventListener('change', renderLeaves);
  renderLeaves();
  $('#readBtn').addEventListener('click', function () {
    if (!state.loaded) { setLoaded('sample'); }
    cutTo('#ch-read');
  });

  /* ================================================ 3 · READING =========== */
  var rail3 = $('#rail3');
  var pageEls = [];
  (function buildPages() {
    var html = '<div class="rail3__lead" aria-hidden="true"></div>';
    PAGES.forEach(function (lines, pi) {
      html += '<article class="page2" data-n="' + (pi + 1) + '"><div class="page2__h"><span>SAMPLE DIAGNOSTICS</span><span>PAGE ' + (pi + 1) + ' OF 3</span></div>';
      lines.forEach(function (ln) { html += '<span class="ln">' + (ln ? esc(ln) : ' ') + '</span>'; });
      html += '</article>';
    });
    html += '<div class="rail3__end"><p id="railEnd"></p></div>';
    rail3.innerHTML = html;
    $$('.page2', rail3).forEach(function (el, pi) {
      var ls = $$('.ln', el), items = [];
      ls.forEach(function (l, i) { var t = PAGES[pi][i]; if (t) items.push({ el: l, kept: isCandidate(t), state: 0 }); });
      pageEls.push({ el: el, items: items });
    });
  })();
  function renderReadingText() {
    $('#railEnd').textContent = t('read.end', { n: R.length });
    $$('.page2', rail3).forEach(function (el) { el.setAttribute('aria-label', t('page.aria', { n: el.getAttribute('data-n') })); });
  }
  var totalKept = pageEls.reduce(function (a, p) { return a + p.items.filter(function (i) { return i.kept; }).length; }, 0);
  var tRead = $('#tRead'), tKept = $('#tKept'), scanline = $('.scanline');
  var lastRead = -1, lastKept = -1;
  function scanFrame() {
    if (!scanline) return;
    var sx = scanline.getBoundingClientRect().left, read = 0, kept = 0;
    pageEls.forEach(function (pg) {
      var rc = pg.el.getBoundingClientRect();
      var f = rm ? 1 : clamp((sx - rc.left) / Math.max(1, rc.width));
      var n = Math.round(f * pg.items.length);
      pg.items.forEach(function (it, i) {
        var s = i < n ? (it.kept ? 2 : 1) : 0;
        if (s !== it.state) { it.state = s; it.el.classList.toggle('is-kept', s === 2); it.el.classList.toggle('is-ignored', s === 1); }
        if (s) { read++; if (s === 2) kept++; }
      });
    });
    if (read !== lastRead) { tRead.textContent = read; lastRead = read; }
    if (kept !== lastKept) { tKept.textContent = kept; lastKept = kept; }
  }

  /* ================================================ 4 · PLAIN WORDS ======= */
  var feed = $('#feed'), plain = $('#ch-plain'), feedwrap = $('.feedwrap'), focusEl = $('.focus');
  var plainRows = [];
  R.forEach(function (r, i) {
    var li = doc.createElement('li'); li.className = 'row';
    li.innerHTML =
      '<div class="row__name" aria-hidden="true"><b>' + esc(r.name) + '</b><small></small><span class="row__tag"></span></div>' +
      '<div class="trk" aria-hidden="true"></div><p class="sr-only"></p><p class="row__sent" aria-hidden="true">' + esc(r.explanation || '') + '</p>';
    feed.appendChild(li);
    var tr = new Track($('.trk', li), r);
    plainRows.push({ li: li, tr: tr, tag: $('.row__tag', li), sr: $('.sr-only', li), small: $('.row__name small', li), q: -1 });
  });
  var sumLi = doc.createElement('li'); sumLi.className = 'feed__sum'; feed.appendChild(sumLi);

  function refreshRow(i) {
    var pr = plainRows[i], r = R[i], o = out(i);
    pr.tr.setValue(values[i], fmt(values[i]));
    pr.small.textContent = tp(r.panel) + (r.abbreviation ? ' · ' + r.abbreviation : '');
    pr.tag.textContent = statusText(o); pr.tag.classList.toggle('is-out', o);
    pr.sr.textContent = r.name + ', ' + fmt(values[i]) + ' ' + r.unit + '. ' + t('plain.printed') + ' ' + r.reference + '. ' + statusText(o) + '. ' + (r.explanation || '');
  }
  function refreshSummary() {
    var n = outsideCount();
    sumLi.innerHTML = '<p><b>' + esc(t('plain.sum1', { n: R.length })) + '</b> ' + esc(t('plain.sum2', { o: n, w: R.length - n })) + '</p>';
  }

  var rName = $('#rName'), rAbbr = $('#rAbbr'), rPanel = $('#rPanel'), rSentence = $('#rSentence'), rRange = $('#rRange'), rSum = $('#rSum'), reader = $('.reader');
  var shown = -2;
  function showReader(idx, dim) {
    if (idx !== shown) {
      shown = idx;
      if (idx >= R.length) {
        var n = outsideCount();
        rPanel.textContent = t('plain.placed');
        rName.textContent = t('plain.results', { n: R.length }); rAbbr.textContent = '';
        rSentence.textContent = t('plain.split', { o: n, w: R.length - n });
        rRange.textContent = t('plain.ranges');
        rSum.textContent = t('plain.notAlert');
      } else {
        var r = R[idx], o = out(idx);
        rPanel.textContent = tp(r.panel);
        rName.textContent = r.name; rAbbr.textContent = r.abbreviation || '';
        rSentence.textContent = r.explanation || '';
        rRange.textContent = t('plain.printed') + ' ' + r.reference + ' ' + r.unit + '\n' + t('plain.onReport') + ': ' + fmt(values[idx]) + ' ' + r.unit + '. ' + statusText(o) + '.';
        rRange.style.whiteSpace = 'pre-line';
        rSum.textContent = t('plain.sample') + (lang === 'en' ? '' : ' ' + t('eng.only'));
      }
      reader.classList.remove('is-swap'); void reader.offsetWidth; reader.classList.add('is-swap');
    }
    reader.classList.toggle('is-dim', !!dim);
  }

  var plainTop = 0, plainH = 0, rowH = 92;
  function layoutPlain() {
    var r = plain.getBoundingClientRect();
    plainTop = r.top + window.scrollY; plainH = plain.offsetHeight;
    rowH = plainRows.length ? plainRows[0].li.offsetHeight : 92;
    plainRows.forEach(function (pr) { pr.tr.measure(); });
    refreshSummary();
    if (rm) plainRows.forEach(function (pr, i) { pr.tr.draw(1, true); pr.tag.style.opacity = 1; });
    lastP = -1;
  }
  var lastP = -1;
  function plainFrame(y) {
    if (rm) return;
    var vh = window.innerHeight;
    if (y < plainTop - vh * 1.2 || y > plainTop + plainH + vh * 0.2) return;
    var p = clamp((y - plainTop) / Math.max(1, plainH - vh));
    if (Math.abs(p - lastP) < 0.0002) return;
    lastP = p;
    var N = R.length, wrapH = feedwrap.clientHeight;
    var t = clamp((p - 0.02) / 0.92);
    var a = lerp(-0.8, N - 1 + 1.2, t);                        /* the (fractional) row under the focus band */
    var f = 0.30 + 0.20 * sm(p), focusY = f * wrapH;
    var feedY = focusY - (a + 0.5) * rowH;
    feed.style.transform = 'translate3d(0,' + feedY.toFixed(1) + 'px,0)';
    focusEl.style.transform = 'translate3d(0,' + (focusY - rowH / 2).toFixed(1) + 'px,0)';
    focusEl.style.opacity = (1 - clamp((a - (N - 1) - 0.1) / 0.5)).toFixed(2);   /* the band lets go once the last line is placed */
    for (var i = 0; i < N; i++) {
      var q = sm((1.35 - (i - a)) / 1.7);
      var pr = plainRows[i];
      if (pr.q !== q) { pr.q = q; pr.tr.draw(q); pr.tag.style.opacity = clamp((q - 0.8) / 0.2).toFixed(2); }
    }
    var idx = Math.round(a);
    if (a > N - 1 + 0.22) showReader(N, false);
    else { idx = clamp(idx, 0, N - 1); showReader(idx, plainRows[idx].q < 0.6); }
  }

  /* ================================================ 5 · CHECK AND ASK ===== */
  var pick = $('#pickTest'), pickVal = $('#pickVal'), pickUnit = $('#pickUnit'), origLine = $('#origLine'), verdict = $('#origVerdict');
  var solo = null, sel = 0;
  pick.innerHTML = R.map(function (r, i) { return '<option value="' + i + '">' + esc(r.name) + '</option>'; }).join('');
  function renderSolo() {
    var r = R[sel], v = values[sel];
    origLine.textContent = HEADER + '\n' + rawLine(r);
    pickUnit.textContent = r.unit;
    solo = new Track($('#soloRuler'), r);
    solo.q = 1;
    solo.setValue(v, fmt(v));
    renderVerdict();
  }
  function renderVerdict() {
    var r = R[sel], v = values[sel], o = out(sel);
    var st = statusText(o), changed = v !== r.value ? ' ' + t('check.printsAs', { v: r.displayValue }) : '';
    verdict.textContent = t('check.verdict', { v: fmt(v), u: r.unit, status: st, statusl: lang === 'en' ? st.charAt(0).toLowerCase() + st.slice(1) : st, ref: r.reference }) + changed;
  }
  var checked = {};
  var askList = $('#askList'), askLead = $('#askLead'), askMsg = $('#askMsg');
  function renderAsk() {
    var idxs = [];
    for (var i = 0; i < R.length; i++) if (out(i)) idxs.push(i);
    askLead.textContent = (idxs.length ? t('ask.lead.n', { n: idxs.length, total: R.length }) : t('ask.lead.0')) + (lang === 'en' ? '' : ' ' + t('eng.only'));
    askList.innerHTML = idxs.map(function (i) {
      var on = checked[i] !== false;
      return '<li><label><input type="checkbox" data-i="' + i + '"' + (on ? ' checked' : '') + '><span><b>' + esc(R[i].name) + '</b>' + esc(R[i].question || '') + '</span></label></li>';
    }).join('');
  }
  askList.addEventListener('change', function (e) { var i = e.target.getAttribute('data-i'); if (i !== null) checked[i] = e.target.checked; });
  function afterEdit() {
    renderVerdict(); renderAsk();
    solo.setValue(values[sel], fmt(values[sel]));
    refreshRow(sel); refreshSummary(); shown = -2;
  }
  pick.addEventListener('change', function () { sel = +pick.value; pickVal.value = fmt(values[sel]); renderSolo(); });
  pickVal.addEventListener('input', function () {
    var v = parseFloat(pickVal.value);
    if (!isFinite(v)) { verdict.textContent = t('check.enter'); return; }
    values[sel] = v; afterEdit();
  });
  $('#copyAsk').addEventListener('click', function () {
    var lines = [];
    $$('input:checked', askList).forEach(function (c) { var i = +c.getAttribute('data-i'); lines.push('- ' + R[i].name + ': ' + R[i].question); });
    if (!lines.length) { askMsg.textContent = t('ask.none'); return; }
    var text = t('ask.head') + '\n' + lines.join('\n');
    function done(ok) { askMsg.textContent = ok ? t(lines.length > 1 ? 'ask.copiedN' : 'ask.copied1', { n: lines.length }) : t('ask.fail'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else { var ta = doc.createElement('textarea'); ta.value = text; doc.body.appendChild(ta); ta.select(); var ok = false; try { ok = doc.execCommand('copy'); } catch (e) {} doc.body.removeChild(ta); done(ok); }
  });

  /* ================================================ 6 · START ============= */
  var ack = $('#ackBox'), startBtn = $('#startBtn'), startHint = $('#startHint'), form = $('#startForm');
  ack.addEventListener('change', function () {
    startBtn.disabled = !ack.checked; startBtn.setAttribute('aria-disabled', String(!ack.checked));
    renderStartHint();
  });
  function renderStartHint() { startHint.textContent = t(ack.checked ? 'start.hintOn' : 'start.hintOff'); }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!ack.checked) return;
    var lang = (form.elements.lang && form.elements.lang.value) || 'en';
    try { if (lang === 'en') localStorage.removeItem('hc-lang'); else localStorage.setItem('hc-lang', lang); } catch (err) {}
    window.location.href = form.getAttribute('action') || '/analyze';
  });

  /* ================================================ chrome + parallax ===== */
  var chapters = $$('.ch'), stepLinks = $$('.steps a'), lastStep = -1;
  function stepsFrame() {
    var vh = window.innerHeight, cur = 0;
    for (var i = 0; i < chapters.length; i++) if (chapters[i].getBoundingClientRect().top <= vh * 0.5) cur = i;
    if (cur === lastStep) return;
    lastStep = cur;
    /* past the consent step the page is showing the sample, so the chrome says so */
    if (cur >= 2 && !state.loaded) setLoaded('sample');
    stepLinks.forEach(function (a, i) {
      a.classList.toggle('is-done', i < cur);
      if (i === cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
    });
  }

  var layers = $$('.pl'), hero = $('#ch-upload');
  var mx = 0, my = 0, tx = 0, ty = 0;
  if (fine && !rm) {
    window.addEventListener('pointermove', function (e) { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; schedule(); }, { passive: true });
  }
  function heroFrame(y) {
    if (rm || y > window.innerHeight * 1.3) return;
    mx = lerp(mx, tx, 0.1); my = lerp(my, ty, 0.1);
    layers.forEach(function (l) {
      var d = parseFloat(l.dataset.depth) || 0, ax = parseFloat(l.dataset.mx) || 0, ay = parseFloat(l.dataset.my) || 0;
      l.style.setProperty('--ty', (y * d).toFixed(1) + 'px');
      l.style.setProperty('--px', (mx * ax).toFixed(1) + 'px');
      l.style.setProperty('--py', (my * ay).toFixed(1) + 'px');
    });
  }

  var ticking = false;
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function frame() {
    ticking = false;
    var y = window.scrollY;
    heroFrame(y); stepsFrame(); scanFrame(); plainFrame(y);
    if (fine && !rm && (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) && y < window.innerHeight * 1.3) schedule();
  }

  /* ------------------------------------------------------------- boot ---- */
  /* Reduced motion: the peak is a plain, fully resolved list, not a pinned act. */
  if (rm) {
    plain.setAttribute('data-sc-act', 'flow'); plain.removeAttribute('data-sc-span');
    var readAct = $('#ch-read'); readAct.setAttribute('data-sc-act', 'flow'); readAct.removeAttribute('data-sc-span');
    $('.rail3', readAct).removeAttribute('data-sc-pan');
  }

  /* apply a language: static strings by attribute, dynamic strings by their renderers */
  var langButtons = $$('.langbar button'), langRadios = $$('input[name="lang"]');
  function applyStatic() {
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':'); el.setAttribute(pair.slice(0, i), t(pair.slice(i + 1)));
      });
    });
  }
  function renderAll() {
    renderChip(); renderHint(); renderDrop(); renderLeaves(); renderReadingText(); renderStartHint();
    R.forEach(function (r, i) { refreshRow(i); });
    refreshSummary(); shown = -2; lastP = -1;
    renderVerdict(); renderAsk(); askMsg.textContent = '';
    doc.title = t('title');
    if (rm) plainRows.forEach(function (pr) { pr.tr.draw(1, true); pr.tag.style.opacity = 1; });
  }
  function setLang(code, persist) {
    if (!I18N[code]) code = 'en';
    lang = code; doc.documentElement.lang = code;
    if (persist) { try { window.localStorage.setItem(LANG_KEY, code); } catch (e) {} }
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === code)); });
    langRadios.forEach(function (r) { r.checked = r.value === code; });
    applyStatic(); renderAll(); schedule();
  }
  langButtons.forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); }); });
  langRadios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) setLang(r.value, true); }); });

  pickVal.value = fmt(values[0]);
  renderSolo();
  setLang(lang, false);

  var api = window.ScrollCraft.mount(doc.body);
  function layoutAll() { if (api && api.layout) api.layout(); layoutPlain(); renderSolo(); schedule(); }
  layoutPlain();
  window.addEventListener('scroll', schedule, { passive: true });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layoutAll, 140); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { CW = 0; layoutAll(); });
  window.addEventListener('load', function () { layoutAll(); });
  schedule();

  /* exposed for the verification pass */
  window.__hc = { kept: totalKept, lines: PAGES.reduce(function (a, p) { return a + p.filter(Boolean).length; }, 0), outside: outsideCount, plainState: function () { return { top: plainTop, h: plainH, rowH: rowH }; } };
})();
