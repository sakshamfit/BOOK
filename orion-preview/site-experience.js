/* Progressive motion and mobile navigation for every standalone Orion page. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactNavigation = window.matchMedia('(max-width: 1024px)');

  function setupNavigation() {
    const header = document.querySelector('.header');
    const toggle = header?.querySelector('.menu-toggle');
    const nav = header?.querySelector('#nav');
    if (!header || !toggle || !nav) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    document.body.append(backdrop);
    let open = false;
    const inertBefore = new Map();
    const lockBackground = (locked) => {
      if (locked) {
        document.querySelectorAll('main, #orion-footer-root').forEach(node => {
          if (!inertBefore.has(node)) inertBefore.set(node, node.inert);
          node.inert = true;
        });
      } else {
        inertBefore.forEach((value, node) => { node.inert = value; });
        inertBefore.clear();
      }
    };
    const sizePanel = () => nav.style.setProperty('--site-nav-offset', `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    const setOpen = (next, returnFocus = false) => {
      open = Boolean(next && compactNavigation.matches);
      if (open) { sizePanel(); nav.scrollTop = 0; }
      nav.classList.toggle('open', open);
      nav.inert = compactNavigation.matches && !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      backdrop.hidden = !open;
      root.classList.toggle('is-menu-open', open);
      document.body.classList.toggle('is-menu-open', open);
      lockBackground(open);
      if (returnFocus) toggle.focus({ preventScroll: true });
      if (open) requestAnimationFrame(() => { if (open) nav.querySelector('a[href]')?.focus({ preventScroll: true }); });
    };
    [...nav.querySelectorAll('a')].forEach((link, i) => link.style.setProperty('--nav-index', i));
    toggle.addEventListener('click', () => setOpen(!open));
    backdrop.addEventListener('click', () => setOpen(false, true));
    nav.addEventListener('click', event => { if (event.target.closest('a[href]')) setOpen(false); });
    document.addEventListener('keydown', event => {
      if (!open) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false, true); }
      if (event.key !== 'Tab') return;
      const controls = [toggle, ...nav.querySelectorAll('a[href], button:not([disabled])')].filter(node => node.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !header.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !header.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    });
    compactNavigation.addEventListener('change', () => setOpen(false));
    window.addEventListener('resize', () => { if (open) sizePanel(); }, { passive: true });
    window.addEventListener('pagehide', () => setOpen(false));
    setOpen(false);
    root.classList.add('nav-ready');
  }

  function setupReveals() {
    if (!('IntersectionObserver' in window)) return; // Default HTML/CSS is visible.
    const selector = [
      '.hero-content > .eyebrow', '.hero-content > h1', '.hero-content > p', '.hero-actions',
      '.sub-hero-content > *', '.movie-hero-copy > *', '.intro-text',
      '.orion-exclusive-image', '.orion-exclusive-copy', '.pour-copy', '.pour-controls',
      '.section-top', '.experience-card', '.brands-heading', '.fashion-heading', '.fashion-carousel',
      '.cinema-copy', '.service-directory-inner > h2', '.service-directory-card',
      '.service-details-heading', '.service-detail-card', '.service-contact',
      '.movie-details-heading', '.movie-stats > div', '.movie-listing-heading', '.movie-film',
      '.sub-heading', '.sub-grid > .sub-card', '.export-title', '.export-content > h2',
      '.export-featured', '.store-listing', '.event-photo-grid',
      '.orion-footer-top', '.orion-footer-cta', '.orion-footer-bottom'
    ].join(',');
    // These widgets own their transforms, visibility, and pointer geometry.
    const excluded = '[data-orion-rail], #clothing-rail-root, #brand-wheel-root, .pour-stage, dialog, [role="dialog"], [data-no-site-motion]';
    const registered = new WeakSet();
    const pending = new Set();
    let observer = null;
    const finish = node => {
      pending.delete(node);
      node.removeAttribute('data-site-reveal');
      node.style.removeProperty('--reveal-delay');
    };
    const show = (node, immediate = false) => {
      observer?.unobserve(node);
      if (immediate) node.classList.add('reveal-immediate');
      node.classList.add('is-revealed');
      // Remove entrance-only styles so hover transitions have no stagger/delay.
      if (immediate) finish(node);
      else window.setTimeout(() => finish(node), 1200);
    };
    const register = scope => {
      if (!observer || reducedMotion.matches) return;
      if (scope instanceof Element && scope.closest(excluded)) return;
      const candidates = [...(scope instanceof Element && scope.matches(selector) ? [scope] : []), ...scope.querySelectorAll(selector)];
      candidates.forEach(node => {
        if (registered.has(node) || node.closest(excluded) || node.parentElement?.closest('[data-site-reveal]')) return;
        registered.add(node);
        if (node.getBoundingClientRect().bottom < 0) { node.classList.add('is-revealed'); return; }
        const parent = node.parentElement;
        const stagger = parent?.matches('.cards, .sub-grid, .service-directory-grid, .service-details-grid, .movie-stats, .clothing-folder-directory, .hero-content, .sub-hero-content, .movie-hero-copy');
        const index = stagger ? [...parent.children].indexOf(node) : 0;
        node.style.setProperty('--reveal-delay', `${Math.min(index, 4) * (compactNavigation.matches ? 50 : 75)}ms`);
        node.dataset.siteReveal = node.matches('.orion-exclusive-image, .export-featured, .movie-film') ? 'media' : 'up';
        pending.add(node);
        observer.observe(node);
      });
    };
    const sync = () => {
      if (reducedMotion.matches) {
        root.classList.remove('site-motion');
        [...pending].forEach(node => show(node, true));
        observer?.disconnect(); observer = null;
      } else {
        observer ??= new IntersectionObserver(entries => {
          entries.forEach(entry => { if (entry.isIntersecting) show(entry.target); });
        }, { threshold: 0.04, rootMargin: '0px 0px -24px 0px' });
        root.classList.add('site-motion');
        register(document);
      }
    };
    sync();
    reducedMotion.addEventListener('change', sync);
    document.addEventListener('focusin', event => {
      let node = event.target.closest('[data-site-reveal]');
      while (node) { show(node, true); node = node.parentElement?.closest('[data-site-reveal]'); }
    });
    // Footer and directory cards mount after the static document. Observe only
    // inserted DOM, never animation styles, attributes, or per-frame transforms.
    const mutation = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => { if (node instanceof Element) register(node); }));
    });
    mutation.observe(document.body, { childList: true, subtree: true });
  }

  function setupScrollTools() {
    const header = document.querySelector('.header');
    const progress = document.createElement('div');
    progress.className = 'site-progress';
    progress.setAttribute('aria-hidden', 'true');
    const top = document.createElement('button');
    top.type = 'button';
    top.className = 'back-to-top';
    top.setAttribute('aria-label', 'Back to top');
    top.tabIndex = -1;
    top.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12 6-6 6 6M12 6v13"/></svg>';
    document.body.append(progress, top);
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const available = y > Math.max(500, window.innerHeight * .7);
      progress.style.transform = `scaleX(${range > 0 ? Math.min(1, y / range) : 0})`;
      header?.classList.toggle('is-scrolled', y > 24);
      top.classList.toggle('is-available', available);
      top.tabIndex = available ? 0 : -1;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
    top.addEventListener('click', () => {
      document.querySelector('.header .logo')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    });
    update();
  }

  function setupHeroVideo() {
    const background = document.getElementById('hero-video-background');
    const actions = document.querySelector('.hero-bottom');
    if (!background || !actions) return;
    const wide = window.matchMedia('(min-width: 1025px)');
    const connection = navigator.connection;
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'hero-motion-toggle'; toggle.hidden = true;
    actions.append(toggle);
    let paused = false, iframe = null;
    const sync = () => {
      const allowed = wide.matches && !reducedMotion.matches && !connection?.saveData;
      toggle.hidden = !allowed;
      toggle.textContent = paused ? 'Play background video' : 'Pause background video';
      if (allowed && !paused && !iframe) {
        iframe = document.createElement('iframe');
        const params = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', playlist: 'EaEdZmbsStI', controls: '0', playsinline: '1', rel: '0', origin: window.location.origin });
        iframe.src = 'https://www.youtube-nocookie.com/embed/EaEdZmbsStI?' + params.toString();
        iframe.title = 'Orion Mall background video';
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.tabIndex = -1;
        iframe.setAttribute('aria-hidden', 'true');
        background.append(iframe);
      } else if ((!allowed || paused) && iframe) { iframe.remove(); iframe = null; }
    };
    toggle.addEventListener('click', () => { paused = !paused; sync(); });
    wide.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);
    connection?.addEventListener('change', sync);
    sync();
  }

  setupNavigation();
  setupReveals();
  setupScrollTools();
  setupHeroVideo();
  root.dataset.siteEnhanced = 'true';
})();
