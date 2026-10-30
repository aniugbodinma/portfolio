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
      tl.eventCallback('onComplete', () => { stage.classList.add('done'); heroState = 'done'; freeAfterGesture(); }); tl.timeScale(0.25).play();
    } else if (heroState === 'done' && dy < 0 && atTop()) {
      e.cancelable && e.preventDefault(); heroState = 'reversing'; hold();
      tl.eventCallback('onReverseComplete', () => { stage.classList.remove('done'); heroState = 'idle'; freeAfterGesture(); }); tl.timeScale(0.6).reverse();
    }
  };
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

  // Projects: pinned card, one project per scroll step
  const pcard = document.querySelector('.pcard');
  if (pcard && !mobile() && !reduce) {
    const medias = gsap.utils.toArray('.pmedia'), names = gsap.utils.toArray('.pname'), infos = gsap.utils.toArray('.pinfo');
    gsap.set(medias.slice(1), { yPercent: 100 });
    const n = medias.length; let cur = 0;
    const sec = document.querySelector('.projects'); const moods = ['#F8F8F8','#f5f3ef','#f3f3f5','#f4f5f1']; sec.style.background = moods[0];
    const setActive = i => { if (i === cur) return; cur = i; sec.style.background = moods[i] || '';
      names.forEach((e, j) => e.classList.toggle('on', j === i)); infos.forEach((e, j) => e.classList.toggle('on', j === i)); };
    const ptl = gsap.timeline({ scrollTrigger: { trigger: '.projects', start: 'top top', end: '+=' + (n - 1) * 100 + '%', pin: true, scrub: 0.6,
      onUpdate: self => setActive(Math.round(self.progress * (n - 1))) } });
    medias.slice(1).forEach((m, i) => {
      ptl.to(m, { yPercent: 0, ease: 'power2.inOut', duration: 1 }, i);
      ptl.to(medias[i], { yPercent: -20, scale: .96, ease: 'power2.inOut', duration: 1 }, i);
    });
  }

  window.addEventListener('load', () => setTimeout(() => { window.__pageReady = true; }, 300));
  const init = () => { build(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else addEventListener('load', init);
  let rt, lw = innerWidth; addEventListener('resize', () => { if (mobile() && innerWidth === lw) return; lw = innerWidth; clearTimeout(rt); rt = setTimeout(init, 250); });
})();
