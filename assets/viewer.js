// Edge AI 101: shows one slide at a time, scales it to the window, draws the
// deck's connectors and icons, and starts each slide's animations from the beginning
// whenever that slide comes on screen.
(() => {
  const W = 1920, H = 1080;
  const SVG = 'http://www.w3.org/2000/svg';
  const stage = document.querySelector('.stage');
  const slides = [...document.querySelectorAll('.deck > section')];
  const total = slides.length;
  const $ = (id) => document.getElementById(id);
  const prevBtn = $('prev'), nextBtn = $('next'), count = $('count'), part = $('part'), full = $('full'), replayBtn = $('replay');
  const siteTitle = document.title;
  let cur = -1;

  // ---- Per-slide setup: accessible name ----
  slides.forEach((s, i) => {
    const h = s.querySelector('h1, h2');
    s.dataset.title = h ? h.textContent.trim().replace(/\s+/g, ' ') : '';
    s.setAttribute('role', 'group');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `Slide ${i + 1} of ${total}: ${s.dataset.title}`);
  });

  // ---- <x-connector>: a line with an arrow head, drawn in its parent's pixel coordinates ----
  // x1 y1 x2 y2 give the ends; without them the line runs corner to corner of the element's own box.
  // route = straight | hv | vh | elbow, head = end | both | none.
  // The stroke comes from the element's CSS: color, border-width, and border-style: dashed.
  const svgEl = (tag, attrs) => {
    const e = document.createElementNS(SVG, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  function routeOf(c) {
    if (!c.hasAttribute('x1')) return [[0, 0], [c.offsetWidth, c.offsetHeight]];
    const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((k) => parseFloat(c.getAttribute(k)));
    const r = c.getAttribute('route');
    if (r === 'hv') return [[x1, y1], [x2, y1], [x2, y2]];
    if (r === 'vh') return [[x1, y1], [x1, y2], [x2, y2]];
    if (r === 'elbow') {
      if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) { const m = (x1 + x2) / 2; return [[x1, y1], [m, y1], [m, y2], [x2, y2]]; }
      const m = (y1 + y2) / 2; return [[x1, y1], [x1, m], [x2, m], [x2, y2]];
    }
    return [[x1, y1], [x2, y2]];
  }

  function drawConnector(c) {
    const cs = getComputedStyle(c);
    const dashed = cs.borderTopStyle === 'dashed';
    c.style.borderStyle = 'solid'; // a border width only computes while the border has a style
    const w = parseFloat(cs.borderTopWidth) || 2;
    c.style.border = '0'; // the line below stands in for the border
    const pts = routeOf(c);
    const line = pts.map((p) => p.slice());
    const svg = svgEl('svg', { 'aria-hidden': 'true' });
    const len = 4.5 * w, half = 2.2 * w;
    // A filled head with its tip at a, pointing away from b; returns where the line should stop
    const head = (a, b) => {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
      const ux = (a[0] - b[0]) / d, uy = (a[1] - b[1]) / d;
      const bx = a[0] - len * ux, by = a[1] - len * uy;
      svg.appendChild(svgEl('polygon', {
        points: `${a[0]},${a[1]} ${bx - half * uy},${by + half * ux} ${bx + half * uy},${by - half * ux}`,
        fill: 'currentColor',
      }));
      const back = Math.min(0.8 * len, d / 2);
      return [a[0] - back * ux, a[1] - back * uy];
    };
    const heads = c.getAttribute('head') || 'end';
    const n = pts.length;
    if (heads !== 'none') line[n - 1] = head(pts[n - 1], pts[n - 2]);
    if (heads === 'both') line[0] = head(pts[0], pts[1]);
    const stroke = {
      points: line.map((p) => p.join(',')).join(' '),
      fill: 'none', stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round',
    };
    if (dashed) stroke['stroke-dasharray'] = `${3.3 * w} ${2.7 * w}`;
    else stroke['stroke-linecap'] = 'round';
    svg.prepend(svgEl('polyline', stroke));
    c.replaceChildren(svg);
  }

  // ---- <x-icon name>: a line glyph in the element's colour, on a 24 x 24 grid ----
  const ICONS = {
    Activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    Chart: '<path d="M4 4v16h16"/><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6"/>',
    CheckCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    Clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    Cloud: '<path d="M7.5 19a4.5 4.5 0 0 1-.6-8.96 5.5 5.5 0 0 1 10.7 1.2A3.9 3.9 0 0 1 17 19z"/>',
    Database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
    Lightning: '<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5z"/>',
    Wrench: '<path transform="rotate(45 12 12)" d="M10 2.38V7.5h4V2.38a5.5 5.5 0 0 1 0 10.24V20.5a2 2 0 0 1-4 0v-7.88a5.5 5.5 0 0 1 0-10.24z"/>',
  };
  function drawIcon(x) {
    const glyph = ICONS[x.getAttribute('name')];
    if (glyph) x.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${glyph}</svg>`;
  }

  // Runs once per slide, the first time it is on screen (a hidden element has no size to measure)
  function prepare(s) {
    if (s.dataset.ready) return;
    s.dataset.ready = '1';
    // Pinned children written before the slide's text are its backdrop: keep them behind the text
    for (const c of s.children) {
      if (getComputedStyle(c).position !== 'absolute') break;
      c.style.zIndex = -1;
    }
    s.querySelectorAll('x-connector').forEach(drawConnector);
    s.querySelectorAll('x-icon').forEach(drawIcon);
  }

  function fit() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${(innerWidth - W * s) / 2}px, ${(innerHeight - H * s) / 2}px) scale(${s})`;
  }

  // The moving parts inside the drawings are SMIL animations: rewind them so every visit starts at the beginning
  const rewind = (s) => s.querySelectorAll('svg').forEach((v) => { try { v.setCurrentTime(0); } catch (e) { /* not animated */ } });

  function show(i) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === cur) return;
    if (cur >= 0) slides[cur].classList.remove('active');
    cur = i;
    const s = slides[i];
    s.classList.add('active'); // rendering the slide starts its entrance animations
    prepare(s);
    rewind(s);
    count.textContent = `${i + 1} / ${total}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
    let p = 0;
    [...part.options].forEach((o, k) => { if (+o.value <= i + 1) p = k; });
    part.selectedIndex = p;
    document.title = i ? `${i + 1} · ${s.dataset.title} · ${siteTitle}` : siteTitle;
    const hash = `#slide-${i + 1}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  // Play the current slide's animations again
  function replay() {
    const s = slides[cur];
    s.classList.remove('active');
    void s.offsetWidth; // let the browser drop the slide before it is shown again
    s.classList.add('active');
    rewind(s);
  }

  const fromHash = () => { const m = /^#slide-(\d+)$/.exec(location.hash); return m ? +m[1] - 1 : 0; };

  // ---- Controls ----
  prevBtn.addEventListener('click', () => show(cur - 1));
  nextBtn.addEventListener('click', () => show(cur + 1));
  replayBtn.addEventListener('click', replay);
  part.addEventListener('change', () => { show(+part.value - 1); part.blur(); });
  if (document.documentElement.requestFullscreen) {
    full.addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()));
  } else full.hidden = true;

  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('select, button, a') && (e.key === ' ' || e.key === 'Enter' || e.target.tagName === 'SELECT')) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') show(cur + 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') show(cur - 1);
    else if (k === 'Home') show(0);
    else if (k === 'End') show(total - 1);
    else if (k === 'r' || k === 'R') replay();
    else if (k === 'f' || k === 'F') full.click();
    else return;
    e.preventDefault();
  });

  let tx = 0, ty = 0;
  addEventListener('touchstart', (e) => { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
  addEventListener('touchend', (e) => {
    if (e.target.closest && e.target.closest('.toolbar')) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // The toolbar fades out when the pointer rests
  let idle;
  const wake = () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add('idle'), 2800); };
  ['mousemove', 'mousedown', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, wake, { passive: true }));

  addEventListener('resize', fit);
  addEventListener('hashchange', () => show(fromHash()));
  fit();
  show(fromHash());
  wake();
})();
