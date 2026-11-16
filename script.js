(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var floatCall = document.querySelector('.float-call');
  var heroMedia = document.getElementById('heroMedia');
  var heroInner = document.getElementById('heroInner');
  var pan = document.getElementById('pan');
  var panTrack = document.getElementById('panTrack');
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* mobile menu */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('is-solid', open || window.scrollY > 40);
  }
  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* commercial horizontal pan, desktop only */
  var panOn = false;
  function setupPan() {
    var want = !reduce && window.innerWidth >= 900;
    if (!want) {
      pan.classList.remove('is-pinned');
      panTrack.style.transform = '';
      panOn = false;
      return;
    }
    pan.classList.add('is-pinned');
    var last = panTrack.lastElementChild;
    var gutter = parseFloat(getComputedStyle(panTrack).paddingLeft) || 0;
    var dist = Math.max(0, last.offsetLeft + last.offsetWidth + gutter - window.innerWidth);
    pan.style.setProperty('--pan-h', (window.innerHeight + dist * 1.15) + 'px');
    pan.dataset.dist = dist;
    panOn = true;
  }

  /* scroll-linked updates */
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    if (menu.hidden) nav.classList.toggle('is-solid', y > 40);
    if (floatCall) floatCall.classList.toggle('show', y > vh * 0.75);

    if (!reduce && y < vh * 1.2) {
      var p = Math.min(1, y / vh);
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.32) + 'px,0) scale(' + (1 + p * 0.08) + ')';
      heroInner.style.transform = 'translate3d(0,' + (y * -0.12) + 'px,0)';
      heroInner.style.opacity = String(1 - Math.min(1, p * 1.35));
    }

    if (panOn) {
      var r = pan.getBoundingClientRect();
      var total = pan.offsetHeight - vh;
      var t = Math.min(1, Math.max(0, -r.top / total));
      panTrack.style.transform = 'translate3d(' + (-t * Number(pan.dataset.dist)) + 'px,0,0)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', function () { setupPan(); onScroll(); });
  window.addEventListener('load', function () { setupPan(); onScroll(); });
  setupPan();
  onScroll();

  /* color swatches: squeegee wipe between real jobs */
  var stage = document.getElementById('stage');
  var cap = document.getElementById('stageCap');
  var bar = stage.querySelector('.stage-bar');
  var busy = false;
  var swatches = Array.prototype.slice.call(document.querySelectorAll('.sw'));
  var preload = {};
  function warm(sw) {
    var k = sw.dataset.img;
    if (preload[k]) return;
    var im = new Image();
    im.src = 'assets/' + (window.innerWidth < 900 ? k + '-sm' : k) + '.webp';
    preload[k] = im;
  }
  swatches.forEach(function (sw) {
    sw.addEventListener('pointerenter', function () { warm(sw); });
    sw.addEventListener('focus', function () { warm(sw); });
    sw.addEventListener('click', function () { choose(sw); });
  });
  stage.addEventListener('pointerenter', function () { swatches.forEach(warm); }, { once: true });

  function choose(sw) {
    if (busy || sw.classList.contains('is-on')) return;
    swatches.forEach(function (s) {
      var on = s === sw;
      s.classList.toggle('is-on', on);
      s.setAttribute('aria-checked', String(on));
    });
    var k = sw.dataset.img;
    var fig = document.createElement('figure');
    fig.className = 'stage-fig is-in';
    var img = document.createElement('img');
    img.src = 'assets/' + k + '.webp';
    img.srcset = 'assets/' + k + '-sm.webp 820w, assets/' + k + '.webp 1800w';
    img.sizes = '(min-width: 1000px) 62vw, 100vw';
    img.alt = sw.dataset.alt;
    fig.appendChild(img);
    stage.insertBefore(fig, bar);
    cap.innerHTML = '<strong>' + sw.dataset.name + '</strong> ' + sw.dataset.car;

    function run() {
      var old = stage.querySelectorAll('.stage-fig.is-on');
      if (reduce) {
        fig.classList.remove('is-in');
        fig.classList.add('is-on');
        old.forEach(function (o) { o.remove(); });
        return;
      }
      busy = true;
      bar.style.setProperty('--to', stage.clientWidth + 'px');
      bar.classList.remove('go');
      void bar.offsetWidth;
      fig.classList.add('go');
      bar.classList.add('go');
      setTimeout(function () {
        fig.classList.remove('is-in', 'go');
        fig.classList.add('is-on');
        old.forEach(function (o) { o.remove(); });
        bar.classList.remove('go');
        busy = false;
      }, 900);
    }
    if (img.decode) img.decode().then(run, run); else img.onload = run;
  }

  /* reversible reveals */
  if (!reduce && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll('.colors-head, .stage, .svc, .services-intro, .reviews-head, .q, .quote-copy, .form, .visit-grid > *, .faq');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('in', en.isIntersecting); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }

  /* open now, shop time (America/Denver) */
  var openNow = document.getElementById('openNow');
  try {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    var mins = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
    var row = document.querySelector('.hours tr[data-d="' + day + '"]');
    if (row) row.classList.add('today');
    var openDay = day >= 2 && day <= 5;
    var isOpen = openDay && mins >= 480 && mins < 1080;
    openNow.hidden = false;
    openNow.textContent = isOpen ? 'Open now until 6 PM' : 'Closed right now. Call or text and we\'ll get back to you.';
    openNow.style.setProperty('--dot', isOpen ? '#c9ef3c' : '#a7a49d');
  } catch (e) { /* leave hidden */ }
})();
