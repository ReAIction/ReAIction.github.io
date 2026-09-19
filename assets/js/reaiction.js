/* ============================================================================
   ReAIction — behaviour.
   Deliberately small and dependency-free. Three jobs:
     1. Language (EN / 中文)  2. Navigation  3. Scroll reveal + form validation
   No appearance switch: light and dark follow the system, per color.md and
   dark-mode.md ("no app-specific appearance switch").
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORE = 'reaiction.lang';

  /* ---- 1. Language ------------------------------------------------------ */
  // Every translatable node carries data-en / data-zh. Nodes needing inline
  // markup carry data-en-html / data-zh-html instead.
  function applyLang(lang) {
    var isZh = lang === 'zh';
    root.lang = isZh ? 'zh-Hans' : 'en';
    root.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-en]').forEach(function (el) {
      var v = isZh ? el.getAttribute('data-zh') : el.getAttribute('data-en');
      if (v !== null) el.textContent = v;
    });
    document.querySelectorAll('[data-en-html]').forEach(function (el) {
      var v = isZh ? el.getAttribute('data-zh-html') : el.getAttribute('data-en-html');
      if (v !== null) el.innerHTML = v;
    });
    // Attributes: data-en-<attr> / data-zh-<attr>, e.g. data-en-aria-label
    ['aria-label', 'placeholder', 'title', 'content', 'alt'].forEach(function (attr) {
      document.querySelectorAll('[data-en-' + attr + ']').forEach(function (el) {
        var v = el.getAttribute((isZh ? 'data-zh-' : 'data-en-') + attr);
        if (v !== null) el.setAttribute(attr, v);
      });
    });

    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    try { localStorage.setItem(STORE, lang); } catch (e) {}
  }

  // ?lang=zh wins, so a localized page can be linked to directly; otherwise the
  // visitor's last choice; otherwise English.
  var chosen = null;
  try { chosen = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (chosen !== 'zh' && chosen !== 'en') {
    try { chosen = localStorage.getItem(STORE); } catch (e) { chosen = null; }
  }
  applyLang(chosen === 'zh' ? 'zh' : 'en');

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.dataset.lang); });
  });

  /* ---- 2. Navigation ---------------------------------------------------- */
  var burger = document.querySelector('.burger');
  var sheet  = document.getElementById('menu');

  var behind = [document.querySelector('main'), document.querySelector('.footer')];

  function setMenu(open) {
    if (!burger || !sheet) return;
    burger.setAttribute('aria-expanded', String(open));
    sheet.setAttribute('data-open', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    // The sheet covers the page, so what is behind it must leave the tab order
    // and the accessibility tree — otherwise a keyboard user tabs into content
    // they cannot see.
    behind.forEach(function (el) {
      if (!el) return;
      if ('inert' in el) el.inert = open;
      else el.setAttribute('aria-hidden', String(open));
    });
    if (open) { var first = sheet.querySelector('a'); if (first) first.focus(); }
  }
  if (burger && sheet) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    // A way out that isn't the same control — modality.md
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setMenu(false); burger.focus();
      }
    });
    sheet.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    // Leaving the compact width should never strand the sheet open.
    // Safari <= 13 has only addListener; calling addEventListener there throws,
    // and anything that throws here would stop the reveal wiring below.
    var wide = matchMedia('(min-width: 900px)');
    var onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  // Mark the current page in both navs
  var here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .sheet a').forEach(function (a) {
    if ((a.getAttribute('href') || '').split('/').pop() === here) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---- 2b. Adaptive glass bar ------------------------------------------- */
  // Measured: 13px labels composite to 2.64:1 when --bg-inverse sits under the
  // 72% bar. The system flips Liquid Glass by sampling luminance; the web has
  // no such API, so we sample geometry instead.
  var header = document.querySelector('.header');
  var inverses = document.querySelectorAll('.section--inverse');
  if (header && inverses.length) {
    var ticking = false;
    var syncBar = function () {
      var barBottom = header.getBoundingClientRect().bottom;
      var over = false;
      for (var i = 0; i < inverses.length; i++) {
        var r = inverses[i].getBoundingClientRect();
        if (r.top < barBottom && r.bottom > 0) { over = true; break; }
      }
      header.setAttribute('data-under', over ? 'inverse' : 'content');
      ticking = false;
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncBar);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    syncBar();
  }

  /* ---- 3. Scroll reveal ------------------------------------------------- */
  // Only now, immediately before the reveal is wired up, do we tell the
  // stylesheet to hide it. Anything that throws above this line leaves the
  // page fully visible instead of blank.
  root.classList.add('js');

  var reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal, .rule');

  function revealAll() { targets.forEach(function (el) { el.classList.add('is-revealed'); }); }

  if (reduce || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-revealed');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.02 });
    targets.forEach(function (el) { io.observe(el); });

    // Safety net: anything near the fold is shown once the page has loaded,
    // even if the observer never delivers. Content is never left hidden.
    addEventListener('load', function () {
      setTimeout(function () {
        targets.forEach(function (el) {
          if (el.getBoundingClientRect().top < innerHeight * 1.5) {
            el.classList.add('is-revealed');
          }
        });
      }, 200);
    });
  }

  /* ---- 4. Contact form -------------------------------------------------- */
  // Validates on blur and on submit, in the interface rather than an alert
  // (feedback.md: "Feedback lives in the interface, not in alerts").
  var form = document.getElementById('contact-form');
  if (form) {
    var zh = function () { return root.getAttribute('data-lang') === 'zh'; };

    function validate(input) {
      var field = input.closest('.field');
      var err   = field.querySelector('.field__error');
      var msg   = '';
      if (input.required && !input.value.trim()) {
        // Say how to fix it, not just that it is wrong. Per-field text lives on
        // the input so the copy sits with the markup it belongs to.
        msg = (zh() ? input.getAttribute('data-zh-required')
                    : input.getAttribute('data-en-required'))
              || (zh() ? '请填写此项。' : 'This field is required.');
      } else if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        msg = zh() ? '请输入完整的邮箱地址，例如 name@company.com。'
                   : 'Enter a full email address, like name@company.com.';
      }
      field.setAttribute('data-invalid', msg ? 'true' : 'false');
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    }

    form.querySelectorAll('input, textarea').forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (input.closest('.field').getAttribute('data-invalid') === 'true') validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      form.querySelectorAll('input, textarea').forEach(function (input) {
        if (!validate(input)) { ok = false; first = first || input; }
      });
      if (!ok) { first.focus(); return; }

      // No backend is wired up. Say so plainly rather than faking a success.
      // DEV NOTE: wire this form to a CRM or mail endpoint, then delete this
      // branch. The message below is written for the visitor, not for us.
      var status = document.getElementById('form-status');
      status.hidden = false;
      status.setAttribute('role', 'alert');
      status.textContent = zh()
        ? '表单尚未接通，内容没有发送出去。请把同样的内容发到 hello@reaiction.ai，我们会在两个工作日内回复。'
        : "This form isn't connected yet — nothing was sent. Email the same text to hello@reaiction.ai and we'll reply within two business days.";
      status.focus();
    });
  }
})();

/* ============================================================================
   v2 — motion (page).
   Staggered entrances, the drifting light behind a section, and the bar's
   scrolled state. All optional: the page is complete without any of it.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Siblings inside one section arrive in reading order, 70ms apart, capped so
     a long section never leaves the reader waiting on an animation. */
  document.querySelectorAll('section').forEach(function (sec) {
    var items = sec.querySelectorAll('.reveal');
    for (var i = 0; i < items.length; i++) {
      items[i].style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
    }
  });

  /* The glow drifts against the scroll at a fraction of its speed, as a custom
     property the stylesheet decides what to do with. */
  var glows  = [].slice.call(document.querySelectorAll('.glow'));
  var header = document.querySelector('.header');
  var frame  = false;

  function onFrame() {
    frame = false;
    if (header) header.setAttribute('data-scrolled', String(scrollY > 8));
    if (reduce) return;
    var h = innerHeight;
    glows.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > h + 200) return;
      el.style.setProperty('--py', Math.round((r.top - h * 0.5) * -0.075));
    });
  }
  function onScroll() { if (!frame) { frame = true; requestAnimationFrame(onFrame); } }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onFrame();
})();

/* ============================================================================
   v3 — the cover.
     1. The field: nodes, the bonds between them, and a signal crossing one.
     2. Line reveals: headlines broken into lines and raised out of a mask.
     3. The intro: one sequence, once, after the type is measurable.
   ========================================================================== */
(function () {
  'use strict';

  var root   = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Registered before anything that could throw: whatever happens below, the
  // cover is visible within two and a half seconds.
  setTimeout(function () { root.classList.add('is-ready'); }, 2500);

  /* ---- 1. The field ----------------------------------------------------- */
  // Canvas rather than SVG: a few thousand line segments a second is cheap on
  // a canvas and expensive as DOM. Sized to the element, capped at 2x DPR, and
  // stopped entirely whenever the cover is off screen.
  function field(canvas) {
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    var w = 0, h = 0, dpr = 1, nodes = [], pulses = [], raf = 0, running = false;
    var LINK = 176;                      // px at which two nodes are bonded

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.max(26, Math.min(72, Math.round(w * h / 18000)));
      while (nodes.length > want) nodes.pop();
      while (nodes.length < want) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
          r: Math.random() * 1.1 + .9
        });
      }
      for (var i = 0; i < nodes.length; i++) {           // keep them in frame
        nodes[i].x = Math.min(nodes[i].x, w); nodes[i].y = Math.min(nodes[i].y, h);
      }
    }

    // The field carries the same left-to-right handoff the loop diagram does:
    // computation at one edge, the bench at the other. Both ends, and the
    // overall strength, come from CSS so the appearance switch moves them.
    var A = [14, 116, 144], B = [109, 40, 217], MUL = .62;
    function readInk() {
      var cs = getComputedStyle(canvas.parentElement || canvas);
      var pa = (cs.getPropertyValue('--field-a') || '').trim().split(/[\s,]+/).map(Number);
      var pb = (cs.getPropertyValue('--field-b') || '').trim().split(/[\s,]+/).map(Number);
      var m  = parseFloat(cs.getPropertyValue('--field-ink'));
      if (pa.length === 3 && !pa.some(isNaN)) A = pa;
      if (pb.length === 3 && !pb.some(isNaN)) B = pb;
      if (!isNaN(m)) MUL = m;
    }
    function ink(x, a) {
      var t = Math.max(0, Math.min(1, x / (w || 1)));
      return 'rgba(' + Math.round(A[0] + t * (B[0] - A[0])) + ','
                     + Math.round(A[1] + t * (B[1] - A[1])) + ','
                     + Math.round(A[2] + t * (B[2] - A[2])) + ','
                     + (a * MUL).toFixed(3) + ')';
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d;

      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d > LINK) continue;
          ctx.strokeStyle = ink((a.x + b.x) / 2, (1 - d / LINK) * .30);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.fillStyle = ink(a.x, .62);
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
      }

      // A signal every second or so, travelling one bond end to end.
      if (pulses.length < 5 && Math.random() < .014 && nodes.length > 2) {
        var s = nodes[(Math.random() * nodes.length) | 0];
        var e = nodes[(Math.random() * nodes.length) | 0];
        if (s !== e) pulses.push({ s: s, e: e, t: 0 });
      }
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += .006;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        var px = p.s.x + (p.e.x - p.s.x) * p.t;
        var py = p.s.y + (p.e.y - p.s.y) * p.t;
        var fade = Math.sin(p.t * Math.PI);
        ctx.fillStyle = ink(px, .9 * fade);
        ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 6.2832); ctx.fill();
        ctx.fillStyle = ink(px, .16 * fade);
        ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.2832); ctx.fill();
      }

      raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(step); } }
    function stop()  { running = false; cancelAnimationFrame(raf); }

    readInk();
    resize();
    matchMedia('(prefers-color-scheme: dark)').addEventListener
      && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readInk(); if (reduce) step0(); });
    addEventListener('resize', function () { resize(); if (!running) step0(); }, { passive: true });
    function step0() { var keep = running; running = true; step(); running = keep; cancelAnimationFrame(raf); }

    if (reduce) { step0(); return; }               // one frame, then nothing moves
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(canvas);
    } else start();
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
  }

  document.querySelectorAll('.cover__field').forEach(field);

  /* ---- 2. Line reveals -------------------------------------------------- */
  // A headline is broken into words, the browser is asked where it put them,
  // and the words that share a top are rebuilt as one masked line. Measuring
  // has to happen after the webfont loads, or the lines are grouped for the
  // fallback face and regroup visibly when the real one arrives.
  function lines(el) {
    var raw = el.getAttribute('data-raw');
    if (raw === null) { raw = (el.textContent || '').trim(); el.setAttribute('data-raw', raw); }
    if (!raw) return;

    // Chinese has no word spaces: splitting it per character would let a line
    // start on a comma, so it is raised as a single block instead.
    var words = raw.indexOf(' ') > -1 ? raw.split(/\s+/) : null;
    var groups;

    if (words) {
      el.textContent = '';
      var probes = words.map(function (word, i) {
        var s = document.createElement('span');
        s.style.display = 'inline-block';
        s.textContent = word;
        el.appendChild(s);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        return s;
      });
      groups = []; var top = null, cur = null;
      probes.forEach(function (s) {
        var t = Math.round(s.offsetTop);
        if (t !== top) { top = t; cur = []; groups.push(cur); }
        cur.push(s.textContent);
      });
      groups = groups.map(function (g) { return g.join(' '); });
    } else {
      groups = [raw];
    }

    el.textContent = '';
    groups.forEach(function (text, i) {
      var ln = document.createElement('span');
      ln.className = 'ln';
      ln.style.setProperty('--i', i);
      var inner = document.createElement('span');
      inner.className = 'ln__i';
      inner.textContent = text;
      ln.appendChild(inner);
      el.appendChild(ln);
      // .ln is display:block so this space never renders, but without it the
      // element's textContent runs the lines together — "The model
      // proposesit." — which is what a screen reader announces and what a
      // copy-paste produces.
      if (i < groups.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.remove('reveal');     // the lines move; the block does not
  }

  var io = (!reduce && 'IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-revealed');
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 })
    : null;

  function splitAll() {
    document.querySelectorAll('.split').forEach(function (el) {
      lines(el);
      if (el.closest('.cover')) el.classList.add('is-revealed');
      else if (io) io.observe(el); else el.classList.add('is-revealed');
    });
    document.querySelectorAll('.hero__rule').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('is-revealed');
    });
  }

  // Re-measure on a width change: the same headline breaks into different
  // lines at a different width, and stale groups would wrap twice.
  var rw = innerWidth, t;
  addEventListener('resize', function () {
    if (innerWidth === rw) return;                 // ignore mobile URL-bar resizes
    rw = innerWidth;
    clearTimeout(t);
    t = setTimeout(function () {
      document.querySelectorAll('.split').forEach(function (el) {
        lines(el); el.classList.add('is-revealed');
      });
    }, 180);
  }, { passive: true });

  // A language switch rewrites textContent, which wipes the lines.
  new MutationObserver(function () {
    document.querySelectorAll('.split').forEach(function (el) {
      el.removeAttribute('data-raw');
      lines(el);
      el.classList.add('is-revealed');
    });
  }).observe(root, { attributes: true, attributeFilter: ['data-lang'] });

  /* ---- 3. The intro ----------------------------------------------------- */
  // is-ready is what starts the sequence. It waits for the display face so the
  // first thing the visitor sees is not the fallback reflowing, but never for
  // longer than 1.2s — a slow font must not hold the page hostage.
  var started = false;
  function ready() {
    if (started) return; started = true;
    splitAll();
    requestAnimationFrame(function () { root.classList.add('is-ready'); });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ready);
    setTimeout(ready, 1200);
  } else {
    ready();
  }
})();

/* ============================================================================
   v5 — 浏览手感
     1. The field is lit before the type is measured.
     2. One light for the whole page, drifting against the scroll.
     3. Inertial wheel scrolling, with the guards that make it defensible.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Light the cover now ------------------------------------------- */
  // The headline still waits for the webfont (is-ready); the field does not.
  requestAnimationFrame(function () { root.classList.add('is-lit'); });

  /* ---- 2. The page light drifts ----------------------------------------- */
  var drift = false;
  function onDrift() {
    drift = false;
    var h = Math.max(1, document.body.scrollHeight - innerHeight);
    // A sixth of a viewport of travel across the whole page: felt, not seen.
    root.style.setProperty('--drift', Math.round((scrollY / h) * (innerHeight / 6)));
  }
  if (!reduce) {
    addEventListener('scroll', function () {
      if (!drift) { drift = true; requestAnimationFrame(onDrift); }
    }, { passive: true });
    onDrift();
  }

  /* ---- 3. Inertial scrolling --------------------------------------------
     Wheel only. Touch keeps the platform's own physics, keyboard and anchor
     jumps keep the browser's, and anything that moves the page some other way
     simply re-seeds the target. Off entirely under Reduce Motion, on coarse
     pointers, and on anything without a fine pointer to aim with. */
  var fine = matchMedia('(pointer: fine)').matches;
  var canLerp = fine && !reduce && !matchMedia('(hover: none)').matches;
  if (!canLerp) return;

  var target = scrollY, current = scrollY, running = false;

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - innerHeight);
  }

  function frame() {
    var d = target - current;
    // 0.14 is the line between "has weight" and "feels like mud".
    current += d * 0.14;
    if (Math.abs(d) < 0.5) {
      current = target;
      running = false;
      root.classList.remove('is-lerping');
    }
    scrollTo(0, current);
    if (running) requestAnimationFrame(frame);
  }

  function onWheel(e) {
    // Never fight a real scroller under the cursor, or the open mobile sheet.
    if (e.ctrlKey || document.body.style.overflow === 'hidden') return;
    var el = e.target;
    while (el && el !== document.body) {
      if (el.scrollHeight > el.clientHeight + 2) {
        var st = getComputedStyle(el).overflowY;
        if (st === 'auto' || st === 'scroll') return;
      }
      el = el.parentElement;
    }
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;          // lines
    else if (e.deltaMode === 2) dy *= innerHeight;
    e.preventDefault();
    // Clamp how far ahead the target may run, so a flick cannot throw the
    // page two screens past where the reader meant to stop.
    var lo = Math.max(0, current - innerHeight * 2.5);
    var hi = Math.min(maxScroll(), current + innerHeight * 2.5);
    target = Math.min(hi, Math.max(lo, target + dy));
    if (!running) {
      running = true;
      root.classList.add('is-lerping');
      requestAnimationFrame(frame);
    }
  }

  // Anything that was not us — a key, a scrollbar drag, an anchor — wins.
  // A scroll event arrives a frame after the scrollTo that caused it, so a
  // synchronous "this one is mine" flag is always already false by then:
  // the position itself is what tells us whose it was.
  addEventListener('scroll', function () {
    if (running && Math.abs(scrollY - current) < 2) return;
    current = target = scrollY;
    running = false;
    root.classList.remove('is-lerping');
  }, { passive: true });

  addEventListener('resize', function () { current = target = scrollY; }, { passive: true });
  addEventListener('wheel', onWheel, { passive: false });
})();

/* ============================================================================
   v9 — pointer parallax on the cover object.
   A few pixels against the cursor is enough to read as "this thing is in
   space". Fine pointers only: on touch there is no cursor to parallax
   against, and the loop already carries the motion there.
   ========================================================================== */
(function () {
  'use strict';
  var mol = document.querySelector('.cover__mol');
  if (!mol) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;

  var cover = mol.closest('.cover');
  var frame = false, mx = 0, my = 0;

  function apply() {
    frame = false;
    mol.style.setProperty('--mx', mx.toFixed(1));
    mol.style.setProperty('--my', my.toFixed(1));
  }
  addEventListener('pointermove', function (e) {
    var r = cover.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    // -1..1 from the centre, then 14 px of travel. Against the cursor, so the
    // object sits behind the glass of the page rather than on top of it.
    mx = -((e.clientX / innerWidth) - 0.5) * 2 * 14;
    my = -((e.clientY / innerHeight) - 0.5) * 2 * 9;
    if (!frame) { frame = true; requestAnimationFrame(apply); }
  }, { passive: true });
})();
