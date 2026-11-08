(function () {
  const hasGsap = window.gsap && window.ScrollTrigger;
  const mobile = () => window.matchMedia('(max-width: 820px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Placeholder gradients on the strip slots (match the inline images)
  document.querySelectorAll('.slot').forEach((s, i) => s.classList.add('g' + (i + 1)));

  // Lenis smooth scroll
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4) });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1) { e.preventDefault(); lenis.scrollTo(id, { offset: -40 }); }
      else { e.preventDefault(); lenis.scrollTo(0); }
    }));
  }

  // Custom cursor
  const cur = document.querySelector('.cursor');
  if (cur && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', () => cur.classList.remove('on'));
    const loop = () => { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', e => { cur.classList.toggle('view', !!e.target.closest('a,button,.card,.slot')); });
  }

  function initWorkTabs() {
    const root = document.querySelector('.projects');
    if (!root || root.dataset.ready) return;
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const panels = [...root.querySelectorAll('[role="tabpanel"]')];
    if (!tabs.length) return;
    root.dataset.ready = '1';
    root.classList.add('work-ready');
    if (!reduce) root.classList.add('is-motion');
    let current = Math.max(0, tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'));
    const pip = root.querySelector('.work-pip');
    const list = root.querySelector('.work-tabs');
    const frame = root.querySelector('.work-panels');
    function fit(animate) {
      const panel = panels[current];
      if (!frame || !panel) return;
      if (!animate) frame.style.transition = 'none';
      frame.style.height = panel.offsetHeight + 'px';
      if (!animate) requestAnimationFrame(() => { frame.style.transition = ''; });
    }
    function placePip(animate) {
      const tab = tabs[current];
      if (!pip || !tab || !list) return;
      const hr = list.getBoundingClientRect();
      const tr = tab.getBoundingClientRect();
      const x = tr.left - hr.left + tr.width / 2 - pip.offsetWidth / 2;
      const y = tr.top - hr.top + tr.height / 2 - pip.offsetHeight / 2;
      if (!animate) pip.style.transition = 'none';
      pip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      pip.style.background = tab.dataset.color || '#eceae4';
      if (!animate) requestAnimationFrame(() => { pip.style.transition = ''; });
    }
    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((tab, j) => {
        const on = j === current;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (focus && on) tab.focus();
      });
      panels.forEach((panel, j) => {
        const on = j === current;
        panel.classList.toggle('is-on', on);
        panel.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      placePip(true);
      fit(true);
    }
    tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i, false)));
    if (list) list.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); select(current + 1, true); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); select(current - 1, true); }
      else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
    root.querySelectorAll('.work-arrow').forEach(btn => {
      btn.addEventListener('click', () => select(current + Number(btn.dataset.dir), false));
    });
    select(current, false);
    fit(false);
    window.addEventListener('resize', () => { placePip(false); fit(false); });
    window.addEventListener('load', () => { placePip(false); fit(false); });
    root.querySelectorAll('img').forEach(img => {
      if (!img.complete) img.addEventListener('load', () => fit(false), { once: true });
    });
  }
  initWorkTabs();
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'power3.out';

  // Signature: hero images fly into the dark strip
  const stage = document.querySelector('.stage');
  const strip = document.querySelector('.strip');
  const flyers = [...document.querySelectorAll('.fly')];
  const slots = [...document.querySelectorAll('.slot')];
  let tl = null;

  function build() {
    if (typeof dockST !== 'undefined' && dockST) { dockST.kill(); dockST = null; }
    if (typeof resetLogoDock === 'function') resetLogoDock();
    if (tl) { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); tl = null; }
    gsap.set(flyers, { clearProps: 'transform' });
    gsap.set(slots, { clearProps: 'background' });
    stage.classList.remove('done');
    const m = mobile();
    document.documentElement.classList.toggle('anim-m', m && !reduce);
    if (m && !reduce) slots.forEach(s => { s.querySelectorAll('img').forEach(im => im.remove()); s.style.background = ''; });
    if (reduce) { gsap.set(strip, { clearProps: 'transform' }); slots.forEach((s,i)=>{ s.classList.add('g'+(i+1)); if (mobile() && flyers[i] && !s.querySelector('img')) { const im = flyers[i].querySelector('img'); if (im) { s.appendChild(im.cloneNode()); s.style.background = 'transparent'; } } }); stage.classList.add('done'); return; }
    // measure slots at final strip position
    const endY = m ? 0 : 50, startY = m ? 130 : 250;
    gsap.set(strip, { yPercent: endY, y: 0 });
    const targets = slots.map(s => s.getBoundingClientRect());
    const peek = m ? strip.offsetHeight + 16 - 56 : 0;
    gsap.set(strip, m ? { yPercent: 0, y: peek } : { yPercent: startY });
    const sources = flyers.map(f => f.getBoundingClientRect());
    slots.forEach(s => s.style.background = 'transparent');

    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' },
      onComplete: () => stage.classList.add('done'),
      onReverseComplete: () => stage.classList.remove('done') });
    tl.to(strip, { yPercent: endY, y: 0, duration: 1, ease: 'power2.out' }, 0);
    // hero text stays solid; the dark strip covers it
    tl.to('.hero-sub', { opacity: 0, duration: 0.2 }, 0);
    flyers.forEach((f, i) => {
      const s = sources[i], t = targets[i];
      if (!t) return;
      tl.to(f, {
        x: (t.left + t.width / 2) - (s.left + s.width / 2),
        y: (t.top + t.height / 2) - (s.top + s.height / 2),
        scale: t.width / s.width,
        borderRadius: '50%',
        duration: 0.9, ease: 'power2.inOut'
      }, 0.05 + i * 0.03);
    });
    // a rebuild (fonts finishing loading, window resize) must not drop the card back off-screen once the intro has played
    if (heroState !== 'idle') { tl.progress(1); stage.classList.add('done'); heroState = 'done'; armLogoDock(); freeAfterGesture(); }
  }

  // Hero intro plays on its own (time-based), scroll is held while it runs
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  let heroState = 'idle'; // idle | playing | done | reversing
  const atTop = () => (window.scrollY || 0) < 4;
  const hold = () => { if (lenis) lenis.stop(); document.documentElement.style.overflow = 'hidden'; };
  const freeAfterGesture = () => { let q, done = false; const go = () => { if (done) return; done = true; clearTimeout(q); clearTimeout(cap);
      ['wheel','touchmove'].forEach(e => window.removeEventListener(e, wait));
      document.documentElement.style.overflow = ''; document.documentElement.classList.remove('lenis-stopped');
      if (lenis) { lenis.start(); lenis.resize && lenis.resize(); } ScrollTrigger.refresh(); };
    const wait = () => { clearTimeout(q); q = setTimeout(go, 250); };
    const cap = setTimeout(go, 700); // never stay locked, even with trackpad momentum
    ['wheel','touchmove'].forEach(e => window.addEventListener(e, wait, { passive: true })); wait(); };
  let touchY = 0;
  const intent = (dy, e) => {
    if (!tl || reduce) return;
    if (heroState === 'playing' || heroState === 'reversing') { e.cancelable && e.preventDefault(); return; }
    if (heroState === 'idle' && dy > 0 && atTop()) {
      e.cancelable && e.preventDefault(); heroState = 'playing'; hold();
      tl.eventCallback('onComplete', () => { stage.classList.add('done'); heroState = 'done'; armLogoDock(); freeAfterGesture(); }); tl.timeScale(mobile() ? 1/3.5 : 0.5).play();
    } else if (heroState === 'done' && dy < 0 && atTop()) {
      e.cancelable && e.preventDefault(); rev();
    }
  };
  // reverse at the same speed as the intro on mobile so scrolling up mirrors scrolling down
  const rev = () => { resetLogoDock(); heroState = 'reversing'; hold();
    tl.eventCallback('onReverseComplete', () => { stage.classList.remove('done'); heroState = 'idle'; freeAfterGesture(); }); tl.timeScale(mobile() ? 1/2 : 0.6).reverse(); };
  // mobile: touch momentum carries the page to the top after the finger lifts, so start the reverse when the top is reached
  let lastY = window.scrollY || 0;
  window.addEventListener('scroll', () => { const y = window.scrollY || 0;
    if (tl && !reduce && mobile() && heroState === 'done' && y < 4 && lastY > y) rev();
    lastY = y; }, { passive: true });
  window.addEventListener('wheel', e => intent(e.deltaY, e), { passive: false });
  window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', e => intent(touchY - e.touches[0].clientY, e), { passive: false });
  window.addEventListener('keydown', e => { if (['ArrowDown','PageDown',' '].includes(e.key)) intent(1, e); if (['ArrowUp','PageUp'].includes(e.key)) intent(-1, e); });

  // Blur reveal headings
  document.querySelectorAll('.blur-reveal').forEach(h => {
    gsap.fromTo(h, { opacity: 0, filter: 'blur(14px)', scaleX: 1.08, x: -40, transformOrigin: 'left center' },
      { opacity: 1, filter: 'blur(0px)', scaleX: 1, x: 0, duration: 1.2, ease,
        scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  // Parallax highlight
  const hl = document.querySelector('.hl-bg');
  if (hl) gsap.fromTo(hl, { x: -14, y: 6 }, { x: 14, y: -6, ease: 'none',
    scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'bottom top', scrub: true } });
  // Card stagger
  gsap.utils.toArray('.card, .steps > div, .cols3 > div').forEach(el => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1, ease, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // Logos leave the about card and settle on the work tabs. Scroll-scrubbed, so it reverses.
  let dockST = null, dockHomes = null;
  const dockPairs = () => [
    [document.querySelector('.fly.c-monday'), document.querySelector('[data-dock="monday"]')],
    [document.querySelector('.fly.c-shopify'), document.querySelector('[data-dock="shopify"]')],
    [document.querySelector('.fly.c-depop'), document.querySelector('[data-dock="depop"]')]
  ].filter(pair => pair[0] && pair[1]);
  function clearLogoClones() {
    document.querySelectorAll('.logo-flight').forEach(n => n.remove());
  }
  function resetLogoDock() {
    clearLogoClones();
    if (dockHomes) dockHomes.forEach(item => { item.clone = null; });
    document.querySelectorAll('.fly.logo').forEach(el => { el.style.opacity = ''; });
    const sec = document.querySelector('.projects');
    if (sec) sec.classList.remove('is-docked');
  }
  function logoDocPoint(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY, w: r.width };
  }
  function captureDockHomes() {
    return dockPairs().map(([fly, tab]) => {
      const home = logoDocPoint(fly);
      return { fly, tab, home, clone: null };
    });
  }
  function applyLogoDock(p) {
    const sec = document.querySelector('.projects');
    if (reduce || heroState !== 'done' || !dockHomes) { resetLogoDock(); return; }
    if (p <= 0.001) { resetLogoDock(); return; }
    if (sec) sec.classList.toggle('is-docked', p > 0.94);
    dockHomes.forEach(item => {
      item.fly.style.opacity = '0';
      const target = logoDocPoint(item.tab);
      const x = item.home.x + (target.x - item.home.x) * p;
      const y = item.home.y + (target.y - item.home.y) * p;
      const w = item.home.w + (target.w - item.home.w) * p;
      if (!item.clone) {
        const img = item.fly.querySelector('img');
        const clone = document.createElement('img');
        clone.className = 'logo-flight';
        clone.alt = '';
        clone.setAttribute('aria-hidden', 'true');
        if (img) clone.src = img.currentSrc || img.src;
        document.body.appendChild(clone);
        item.clone = clone;
      }
      item.clone.hidden = p > 0.94;
      item.clone.style.width = w + 'px';
      item.clone.style.height = w + 'px';
      item.clone.style.left = (x - window.scrollX - w / 2) + 'px';
      item.clone.style.top = (y - window.scrollY - w / 2) + 'px';
    });
  }
  function armLogoDock() {
    if (reduce || !document.querySelector('.work-tabs')) return;
    resetLogoDock();
    dockHomes = captureDockHomes();
    if (dockST) dockST.kill();
    dockST = ScrollTrigger.create({
      trigger: '.projects',
      start: 'top 92%',
      end: 'top 48%',
      scrub: true,
      invalidateOnRefresh: false,
      onUpdate: self => applyLogoDock(self.progress)
    });
    applyLogoDock(dockST.progress);
  }

  window.addEventListener('load', () => setTimeout(() => { window.__pageReady = true; }, 300));
  const init = () => { build(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else addEventListener('load', init);
  let rt, lw = innerWidth; addEventListener('resize', () => { if (mobile() && innerWidth === lw) return; lw = innerWidth; clearTimeout(rt); rt = setTimeout(init, 250); });
})();
