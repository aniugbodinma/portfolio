(function () {
  const hasGsap = window.gsap && window.ScrollTrigger;
  const mobile = () => window.matchMedia('(max-width: 820px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Placeholder gradients on the strip slots (match the inline images)
  document.querySelectorAll('.slot').forEach((s, i) => s.classList.add('g' + (i + 1)));

  // In-page links. The logo returns to the hero. Other hashes settle the intro first.
  let finishHero = function () {};
  let showHero = function () {};
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && !document.querySelector(id)) return;
    e.preventDefault();
    const behavior = reduce ? 'auto' : 'smooth';
    if (id.length <= 1 || id === '#top') { showHero(); window.scrollTo({ top: 0, behavior }); return; }
    finishHero();
    document.querySelector(id).scrollIntoView({ behavior, block: 'start' });
  }));

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

  // Company name under the hero. Pointer hover and keyboard focus only, so a tap does not change the mobile page.
  const companyLabel = document.querySelector('.hero-company');
  if (companyLabel && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let active = null;
    const showName = el => {
      const img = el.querySelector('img');
      const name = img && img.alt;
      if (!name) return;
      companyLabel.textContent = name;
      companyLabel.classList.add('is-on');
      active = el;
    };
    const hideName = el => {
      if (active && el && active !== el) return;
      companyLabel.classList.remove('is-on');
      active = null;
    };
    document.querySelectorAll('.fly.logo').forEach(el => {
      el.tabIndex = 0;
      el.addEventListener('mouseenter', () => showName(el));
      el.addEventListener('mouseleave', () => hideName(el));
      el.addEventListener('focus', () => { if (el.matches(':focus-visible')) showName(el); });
      el.addEventListener('blur', () => hideName(el));
    });
  }

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'power3.out';

  // First scroll plays the same timed flight, straight from the hero into the work section.
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const flyers = [...document.querySelectorAll('.fly')];
  const logos = ['.fly.c-monday', '.fly.c-depop', '.fly.c-shopify'].map(sel => document.querySelector(sel)).filter(Boolean);
  const tabs = ['monday', 'depop', 'shopify'].map(name => document.querySelector('[data-dock="' + name + '"]'));
  let tl = null;
  let gate = 0;
  const scrollEase = gsap.parseEase('power2.out');
  const flyEase = gsap.parseEase('power2.inOut');

  function clearFlights() {
    document.querySelectorAll('.logo-flight').forEach(n => n.remove());
    logos.forEach(el => { el.style.opacity = ''; });
    const sec = document.querySelector('.projects');
    if (sec) sec.classList.remove('is-docked', 'is-flight');
  }
  function workTop() {
    const work = document.querySelector('#work');
    if (!work) return 0;
    return Math.max(0, Math.round(work.getBoundingClientRect().top + (window.scrollY || 0)));
  }
  function placeFlights(t, sources, targets, clones) {
    const sec = document.querySelector('.projects');
    window.scrollTo(0, gate * scrollEase(Math.min(1, Math.max(0, t))));
    let flying = false;
    clones.forEach((clone, i) => {
      const delay = 0.05 + i * 0.03;
      let lp = flyEase(Math.max(0, Math.min(1, (t - delay) / 0.9)));
      const s = sources[i], tgt = targets[i];
      const x = s.x + (tgt.x - s.x) * lp;
      const y = s.y + (tgt.y - s.y) * lp;
      const w = s.w + (tgt.w - s.w) * lp;
      clone.style.width = w + 'px';
      clone.style.height = w + 'px';
      clone.style.left = (x - w / 2) + 'px';
      clone.style.top = (y - w / 2) + 'px';
      clone.hidden = lp > 0.94;
      if (!clone.hidden) flying = true;
    });
    if (sec) {
      sec.classList.toggle('is-flight', flying);
      sec.classList.toggle('is-docked', t > 0.98);
    }
  }

  function build() {
    clearFlights();
    if (tl) { tl.kill(); tl = null; }
    gsap.set(flyers, { clearProps: 'transform' });
    stage.classList.remove('done');
    const m = mobile();
    document.documentElement.classList.toggle('anim-m', m && !reduce);
    if (reduce) { stage.classList.add('done'); return; }
    const was = window.scrollY || 0;
    if (heroState === 'idle') window.scrollTo(0, 0);
    gate = workTop();
    const sources = logos.map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
    });
    const targets = tabs.map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + (window.scrollY || 0) + r.height / 2 - gate, w: r.width };
    });
    const clones = logos.map(el => {
      const img = el.querySelector('img');
      const clone = document.createElement('img');
      clone.className = 'logo-flight';
      clone.alt = '';
      clone.hidden = true;
      clone.setAttribute('aria-hidden', 'true');
      if (img) clone.src = img.currentSrc || img.src;
      document.body.appendChild(clone);
      return clone;
    });
    const driver = { t: 0 };
    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' },
      onComplete: () => { stage.classList.add('done'); heroState = 'done'; },
      onReverseComplete: () => { stage.classList.remove('done'); heroState = 'idle'; clearFlights(); gsap.set('.hero-sub', { clearProps: 'opacity' }); } });
    tl.to('.hero-sub', { opacity: 0, duration: 0.2 }, 0);
    tl.to(driver, { t: 1, duration: 1, ease: 'none',
      onStart: () => logos.forEach(el => { el.style.opacity = '0'; }),
      onUpdate: () => {
        const t = driver.t;
        if (t <= 0) {
          window.scrollTo(0, 0);
          clones.forEach(c => { c.hidden = true; });
          const sec = document.querySelector('.projects');
          if (sec) sec.classList.remove('is-docked', 'is-flight');
          return;
        }
        placeFlights(t, sources, targets, clones);
      }
    }, 0);
    if (heroState !== 'idle' || was > 8) {
      if (heroState === 'done' && was > gate + 24) {
        stage.classList.add('done');
        logos.forEach(el => { el.style.opacity = '0'; });
        const sec = document.querySelector('.projects');
        if (sec) sec.classList.add('is-docked');
        window.scrollTo(0, was);
      } else {
        tl.progress(1);
        stage.classList.add('done');
        heroState = 'done';
      }
    }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  let heroState = 'idle'; // idle | playing | done | reversing
  const atTop = () => (window.scrollY || 0) < 4;
  const atGate = () => (window.scrollY || 0) <= gate + 2;
  showHero = function () {
    if (tl) { tl.pause(); tl.progress(0, true); }
    heroState = 'idle';
    stage.classList.remove('done');
    clearFlights();
    gsap.set('.hero-sub', { clearProps: 'opacity' });
    window.scrollTo(0, 0);
  };
  finishHero = function () {
    if (!tl || reduce || heroState === 'done') return;
    tl.progress(1);
    stage.classList.add('done');
    heroState = 'done';
  };
  let touchY = 0;
  const intent = (dy, e) => {
    if (!tl || reduce) return;
    if (e.target && e.target.closest && e.target.closest('.work-tabs, input, textarea, select')) return;
    if (heroState === 'playing' || heroState === 'reversing') { e.cancelable && e.preventDefault(); return; }
    if (heroState === 'idle' && dy > 0 && atTop()) {
      e.cancelable && e.preventDefault(); heroState = 'playing';
      tl.timeScale(mobile() ? 1 / 3.5 : 0.5).play();
    } else if (heroState === 'done' && dy < 0 && atGate()) {
      e.cancelable && e.preventDefault(); rev();
    }
  };
  // Desktop return matches the intro. Mobile return stays at 2s, shorter than the 3.5s intro.
  const rev = () => {
    if (heroState !== 'done') return;
    heroState = 'reversing';
    tl.timeScale(mobile() ? 1 / 2 : 0.5).reverse();
  };
  let lastY = window.scrollY || 0;
  window.addEventListener('scroll', () => { const y = window.scrollY || 0;
    if (tl && !reduce && heroState === 'idle' && y > 8) finishHero();
    if (tl && !reduce && heroState === 'done' && y <= gate + 2 && lastY > y) rev();
    lastY = y; }, { passive: true });
  window.addEventListener('wheel', e => intent(e.deltaY, e), { passive: false });
  window.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', e => intent(touchY - e.touches[0].clientY, e), { passive: false });
  window.addEventListener('keydown', e => { if (['ArrowDown','PageDown',' '].includes(e.key)) intent(1, e); if (['ArrowUp','PageUp'].includes(e.key)) intent(-1, e); });

  document.querySelectorAll('.blur-reveal').forEach(h => {
    gsap.fromTo(h, { opacity: 0, filter: 'blur(14px)', scaleX: 1.08, x: -40, transformOrigin: 'left center' },
      { opacity: 1, filter: 'blur(0px)', scaleX: 1, x: 0, duration: 1.2, ease,
        scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  const hl = document.querySelector('.hl-bg');
  if (hl) gsap.fromTo(hl, { x: -14, y: 6 }, { x: 14, y: -6, ease: 'none',
    scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.card, .steps > div, .cols3 > div').forEach(el => {
    gsap.from(el, { opacity: 0, y: 40, duration: 1, ease, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  window.addEventListener('load', () => setTimeout(() => { window.__pageReady = true; }, 300));
  const init = () => { build(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else addEventListener('load', init);
  let rt, lw = innerWidth; addEventListener('resize', () => { if (mobile() && innerWidth === lw) return; lw = innerWidth; clearTimeout(rt); rt = setTimeout(init, 250); });
})();
