/**
 * =====================================================================
 * Kovra - Creative Agency & Portfolio HTML Template
 * main.js - v1.0.0
 * ---------------------------------------------------------------------
 * Vanilla JS, no jQuery. Depends on (all optional, loaded before this
 * file): Bootstrap 5 bundle, GSAP + ScrollTrigger, Lenis.
 * If GSAP is missing or the visitor prefers reduced motion, every
 * animation is skipped and all content is shown immediately.
 *
 * MODULES (each is a small object with an init() method)
 *   01. Utils .............. helpers & feature detection
 *   02. ThemeToggle ........ dark / light color mode (saved in localStorage)
 *   03. SmoothScroll ....... Lenis smooth scrolling + anchor links
 *   04. Header ............. sticky / hide-on-scroll header, dropdown menus
 *   05. MobileMenu ......... offcanvas menu integration
 *   06. Preloader .......... counter + curtain intro (short on repeat visits)
 *   07. Cursor ............. custom cursor with hover / text states
 *   08. Magnetic ........... magnetic buttons  [data-magnetic]
 *   09. TextReveal ......... word-by-word heading reveal  [data-split]
 *   10. ScrollAnimations ... fade-up, image reveal, parallax, counters,
 *                            skill bars, scroll-highlighted text
 *   11. HorizontalScroll ... pinned horizontal gallery  [data-horizontal]
 *   12. MarqueeVelocity .... marquees speed up with scroll velocity
 *   13. HoverReveal ........ floating image on list hover  [data-reveal-img]
 *   14. PortfolioFilter .... category filter  [data-filter-bar]
 *   15. Slider ............. lightweight scroll-snap slider  [data-slider]
 *   16. PricingToggle ...... one-off / retainer price switch  [data-billing]
 *   17. FormValidation ..... accessible front-end validation  [data-validate]
 *   18. Countdown .......... coming-soon countdown  [data-countdown]
 *   19. BackToTop .......... scroll progress ring + back to top button
 *   20. App ................ boots everything in the right order
 * =====================================================================
 */
(function () {
  'use strict';

  /* ===================================================================
   * 01. Utils
   * ================================================================= */
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduceMotion; // master switch for motion

  if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  /** Public namespace so buyers can reach modules from the console / their own scripts. */
  const Kovra = (window.Kovra = window.Kovra || {});

  /* ===================================================================
   * 02. ThemeToggle - dark (default) / light
   * ================================================================= */
  const ThemeToggle = {
    storageKey: 'kovra-theme',
    init() {
      this.buttons = $$('[data-theme-toggle]');
      this.buttons.forEach((btn) => btn.addEventListener('click', () => this.toggle()));
      this.sync();
    },
    toggle() {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      root.setAttribute('data-bs-theme', next);
      try { localStorage.setItem(this.storageKey, next); } catch (e) { /* storage blocked */ }
      this.sync();
    },
    sync() {
      const isLight = root.getAttribute('data-theme') === 'light';
      this.buttons.forEach((btn) => btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode'));
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isLight ? '#f4f2ee' : '#0c0c0d');
    },
  };

  /* ===================================================================
   * 03. SmoothScroll - Lenis, synced with GSAP's ticker & ScrollTrigger
   * ================================================================= */
  const SmoothScroll = {
    lenis: null,
    init() {
      if (animate && typeof window.Lenis !== 'undefined') {
        this.lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
        this.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => this.lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        Kovra.lenis = this.lenis;
      }
      this.bindAnchors();
    },
    /** Scroll to a number (px) or element. */
    scrollTo(target, opts = {}) {
      if (this.lenis) {
        this.lenis.scrollTo(target, { offset: opts.offset || 0, immediate: !!opts.immediate });
        return;
      }
      const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + (opts.offset || 0);
      window.scrollTo({ top, behavior: reduceMotion || opts.immediate ? 'auto' : 'smooth' });
    },
    stop() { if (this.lenis) this.lenis.stop(); },
    start() { if (this.lenis) this.lenis.start(); },
    bindAnchors() {
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link || link.hasAttribute('data-bs-toggle')) return;
        const id = link.getAttribute('href');
        if (id.length < 2) return; // plain "#" placeholder links
        const target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        this.scrollTo(target, { offset: -90 });
        // Move keyboard focus to the target for accessibility
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    },
  };

  /* ===================================================================
   * 04. Header - scrolled state, hide on scroll down, dropdown menus
   * ================================================================= */
  const Header = {
    init() {
      this.el = $('#site-header');
      if (!this.el) return;
      let lastY = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        this.el.classList.toggle('is-scrolled', y > 40);
        const goingDown = y > lastY && y > 320;
        this.el.classList.toggle('is-hidden', goingDown && !this.el.contains(document.activeElement));
        if (goingDown) this.closeAll();
        lastY = y;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      this.el.addEventListener('focusin', () => this.el.classList.remove('is-hidden'));
      this.initDropdowns();
    },
    initDropdowns() {
      this.items = $$('.main-nav .nav-item').filter((item) => $('.submenu', item));
      this.items.forEach((item) => {
        const btn = $('button.nav-link-kv', item);
        btn.addEventListener('click', () => {
          const open = !item.classList.contains('is-open');
          this.closeAll();
          this.setOpen(item, open);
        });
        // Close when keyboard focus leaves the item
        item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) this.setOpen(item, false); });
        // Keep aria-expanded in sync with mouse hover
        item.addEventListener('mouseenter', () => btn.setAttribute('aria-expanded', 'true'));
        item.addEventListener('mouseleave', () => { if (!item.classList.contains('is-open')) btn.setAttribute('aria-expanded', 'false'); });
      });
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const open = this.items.find((i) => i.classList.contains('is-open'));
        if (open) { this.setOpen(open, false); $('button', open).focus(); }
      });
      document.addEventListener('click', (e) => { if (!e.target.closest('.main-nav')) this.closeAll(); });
    },
    setOpen(item, open) {
      item.classList.toggle('is-open', open);
      $('button.nav-link-kv', item).setAttribute('aria-expanded', String(open));
    },
    closeAll() { (this.items || []).forEach((i) => this.setOpen(i, false)); },
  };

  /* ===================================================================
   * 05. MobileMenu - pause smooth scroll while the offcanvas is open
   * ================================================================= */
  const MobileMenu = {
    init() {
      const menu = $('#mobile-menu');
      if (!menu) return;
      menu.addEventListener('show.bs.offcanvas', () => { SmoothScroll.stop(); document.body.classList.add('menu-open'); });
      menu.addEventListener('hidden.bs.offcanvas', () => { SmoothScroll.start(); document.body.classList.remove('menu-open'); });
      // Close the menu when the viewport grows to desktop size
      window.matchMedia('(min-width: 1200px)').addEventListener('change', (mq) => {
        if (mq.matches && window.bootstrap) window.bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
      });
    },
  };

  /* ===================================================================
   * 06. Preloader - full intro on first visit, quick fade afterwards
   * ================================================================= */
  const Preloader = {
    run(onDone) {
      const el = $('.preloader');
      const finish = () => {
        if (el) el.classList.add('is-done');
        SmoothScroll.start();
        onDone();
      };
      if (!el || !animate) { finish(); return; }

      let visited = false;
      try { visited = sessionStorage.getItem('kovra-visited') === '1'; sessionStorage.setItem('kovra-visited', '1'); } catch (e) { /* ignore */ }

      SmoothScroll.stop();
      const count = $('.preloader__count', el);
      const bar = $('.preloader__bar', el);
      const tl = gsap.timeline({ onComplete: finish });

      if (visited) {
        count.textContent = '100';
        tl.to(el, { autoAlpha: 0, duration: 0.45, ease: 'power2.out', delay: 0.1 });
        return;
      }
      const counter = { v: 0 };
      tl.from('.preloader__brand > span', { yPercent: 100, duration: 0.8, ease: 'power4.out' })
        .to(counter, { v: 100, duration: 1.5, ease: 'power3.inOut', onUpdate: () => { count.textContent = Math.round(counter.v); } }, 0)
        .to(bar, { scaleX: 1, duration: 1.5, ease: 'power3.inOut' }, 0)
        .to(el, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '+=0.15');
    },
  };

  /* ===================================================================
   * 07. Cursor - dot + ring; [data-cursor-text] shows a label
   * ================================================================= */
  const Cursor = {
    init() {
      const el = $('.cursor');
      if (!el || !finePointer || !animate) return;
      root.classList.add('has-cursor');
      const ring = $('.cursor__ring', el);
      const dot = $('.cursor__dot', el);
      const text = $('.cursor__text', el);
      gsap.set([ring, dot], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
      const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
      const dotX = gsap.quickTo(dot, 'x', { duration: 0.08 });
      const dotY = gsap.quickTo(dot, 'y', { duration: 0.08 });

      window.addEventListener('pointermove', (e) => {
        ringX(e.clientX); ringY(e.clientY); dotX(e.clientX); dotY(e.clientY);
        el.classList.remove('is-hidden');
      }, { passive: true });
      document.addEventListener('mouseleave', () => el.classList.add('is-hidden'));

      // Delegated hover states
      document.addEventListener('pointerover', (e) => {
        const labelled = e.target.closest('[data-cursor-text]');
        const interactive = e.target.closest('a, button, label, select, input, textarea, [data-magnetic]');
        el.classList.toggle('has-text', !!labelled);
        el.classList.toggle('is-hover', !!interactive && !labelled);
        if (labelled) text.textContent = labelled.getAttribute('data-cursor-text');
      });
    },
  };

  /* ===================================================================
   * 08. Magnetic - elements gently follow the pointer
   *     Optional strength: data-magnetic="0.5" (default 0.3)
   * ================================================================= */
  const Magnetic = {
    init() {
      if (!finePointer || !animate) return;
      $$('[data-magnetic]').forEach((el) => {
        const strength = parseFloat(el.getAttribute('data-magnetic')) || 0.3;
        const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        });
        el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    },
  };

  /* ===================================================================
   * 09. TextReveal - wraps words in masks and slides them up
   *     [data-split]        reveal when scrolled into view
   *     [data-split="hero"] reveal right after the preloader
   * ================================================================= */
  const TextReveal = {
    /** Split the text nodes of an element into words (keeps inner tags). */
    split(el) {
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              const word = document.createElement('span');
              const inner = document.createElement('span');
              word.className = 'split-word';
              inner.className = 'split-word__inner';
              inner.textContent = part;
              word.appendChild(inner);
              frag.appendChild(word);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
            walk(child);
          }
        });
      };
      walk(el);
      return $$('.split-word__inner', el);
    },
    prepare() {
      if (!animate) return;
      this.items = $$('[data-split]').map((el) => {
        const words = this.split(el);
        gsap.set(words, { yPercent: 110 });
        return { el, words, hero: el.getAttribute('data-split') === 'hero' };
      });
    },
    play() {
      if (!animate) return;
      this.items.forEach(({ el, words, hero }) => {
        const vars = { yPercent: 0, duration: hero ? 1.2 : 1, stagger: hero ? 0.07 : 0.035, ease: 'power4.out' };
        if (!hero) vars.scrollTrigger = { trigger: el, start: 'top 88%', once: true };
        gsap.to(words, vars);
      });
    },
  };

  /* ===================================================================
   * 10. ScrollAnimations - generic, attribute-driven effects
   * ================================================================= */
  const ScrollAnimations = {
    prepare() {
      if (!animate) {
        $$('[data-highlight]').forEach((el) => el.classList.add('is-static'));
        return;
      }
      const fades = $$('[data-anim="fade-up"]');
      if (fades.length) gsap.set(fades, { y: 40 });
      $$('[data-reveal="image"]').forEach((el) => {
        if (el.closest('.h-scroll')) return; // pinned gallery handles its own motion
        gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
      });
      $$('[data-count]').forEach((el) => { el.textContent = '0'; });
      const skills = $$('[data-skill]');
      if (skills.length) gsap.set(skills, { scaleX: 0 });
      // Split highlight paragraphs into words
      $$('[data-highlight]').forEach((el) => {
        el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="hl-word">${w}</span>`).join(' ');
      });
    },
    create() {
      if (!animate) return;

      // Fade-up (batched so siblings stagger nicely)
      ScrollTrigger.batch('[data-anim="fade-up"]', {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out', overwrite: true }),
      });
      ScrollTrigger.batch('[data-anim="fade"]', { start: 'top 92%', once: true, onEnter: (b) => gsap.to(b, { autoAlpha: 1, duration: 1 }) });

      // Image reveal: clip-path wipe + subtle zoom-out of the image
      $$('[data-reveal="image"]').forEach((el) => {
        if (el.closest('.h-scroll')) return;
        const image = $('img', el);
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
        tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', clearProps: 'clipPath' });
        if (image && !image.hasAttribute('data-speed')) tl.from(image, { scale: 1.3, duration: 1.6, ease: 'power3.out', clearProps: 'scale' }, 0);
      });

      // Parallax: data-speed="0.1" (image must sit in an overflow-hidden wrapper)
      $$('[data-speed]').forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
        gsap.fromTo(el, { yPercent: -speed * 60 }, {
          yPercent: speed * 60, ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      // Counters
      $$('[data-count]').forEach((el) => {
        const end = parseFloat(el.getAttribute('data-count'));
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end, duration: 2, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: () => { el.textContent = Math.round(obj.v); },
        });
      });

      // Skill bars
      $$('[data-skill]').forEach((el) => {
        gsap.to(el, { scaleX: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
      });

      // Scroll-scrubbed highlight text
      $$('[data-highlight]').forEach((el) => {
        gsap.to($$('.hl-word', el), {
          opacity: 1, stagger: 0.1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
        });
      });
    },
  };

  /* ===================================================================
   * 11. HorizontalScroll - pinned section that scrolls sideways (>= 992px)
   * ================================================================= */
  const HorizontalScroll = {
    init() {
      const section = $('[data-horizontal]');
      if (!section || !animate) return;
      const track = $('.h-scroll__track', section);
      const mm = gsap.matchMedia();
      mm.add('(min-width: 992px)', () => {
        section.classList.add('is-pinned');
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        // Keyboard users: bring focused cards into view
        const onFocus = (e) => {
          const card = e.target.closest('.h-scroll__item, .h-scroll__intro');
          if (!card) return;
          const st = tween.scrollTrigger;
          const progress = Math.min(1, Math.max(0, (card.offsetLeft - window.innerWidth * 0.15) / distance()));
          SmoothScroll.scrollTo(st.start + (st.end - st.start) * progress, { immediate: true });
        };
        track.addEventListener('focusin', onFocus);
        return () => { track.removeEventListener('focusin', onFocus); section.classList.remove('is-pinned'); };
      });
    },
  };

  /* ===================================================================
   * 12. MarqueeVelocity - CSS marquees speed up while scrolling
   * ================================================================= */
  const MarqueeVelocity = {
    init() {
      const tracks = $$('.marquee__track');
      if (!tracks.length || !SmoothScroll.lenis || typeof tracks[0].getAnimations !== 'function') return;
      let rate = 1;
      gsap.ticker.add(() => {
        const target = 1 + Math.min(Math.abs(SmoothScroll.lenis.velocity) * 0.08, 3);
        rate += (target - rate) * 0.08;
        tracks.forEach((t) => t.getAnimations().forEach((a) => { a.playbackRate = rate; }));
      });
    },
  };

  /* ===================================================================
   * 13. HoverReveal - floating image that follows the pointer
   * ================================================================= */
  const HoverReveal = {
    init() {
      const links = $$('[data-reveal-img]');
      if (!links.length || !finePointer || !animate) return;
      const box = document.createElement('div');
      box.className = 'hover-reveal';
      box.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.alt = '';
      box.appendChild(image);
      document.body.appendChild(box);
      gsap.set(box, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(box, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(box, 'y', { duration: 0.6, ease: 'power3' });
      const rTo = gsap.quickTo(box, 'rotation', { duration: 0.8, ease: 'power3' });
      let lastX = 0;

      links.forEach((link) => {
        new Image().src = link.getAttribute('data-reveal-img'); // preload
        link.addEventListener('pointerenter', (e) => {
          image.src = link.getAttribute('data-reveal-img');
          gsap.set(box, { x: e.clientX, y: e.clientY });
          gsap.to(box, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        });
        link.addEventListener('pointerleave', () => gsap.to(box, { autoAlpha: 0, scale: 0.6, duration: 0.4, ease: 'power3.in', overwrite: 'auto' }));
        link.addEventListener('pointermove', (e) => {
          xTo(e.clientX); yTo(e.clientY);
          rTo(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.6)));
          lastX = e.clientX;
        });
      });
    },
  };

  /* ===================================================================
   * 14. PortfolioFilter - show / hide .filter-item by data-category
   * ================================================================= */
  const PortfolioFilter = {
    init() {
      $$('[data-filter-bar]').forEach((bar) => {
        const scope = bar.closest('section') || document;
        const items = $$('.filter-item', scope);
        const status = $('[data-filter-status]', scope);
        bar.addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-filter]');
          if (!btn) return;
          const filter = btn.getAttribute('data-filter');
          $$('button[data-filter]', bar).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
          const shown = items.filter((item) => {
            const match = filter === 'all' || item.getAttribute('data-category') === filter;
            item.classList.toggle('is-hidden', !match);
            return match;
          });
          if (status) status.textContent = `${shown.length} project${shown.length === 1 ? '' : 's'} shown`;
          if (animate) {
            gsap.fromTo(shown, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' });
            ScrollTrigger.refresh();
          }
        });
      });
    },
  };

  /* ===================================================================
   * 15. Slider - native scroll-snap with previous / next buttons
   * ================================================================= */
  const Slider = {
    init() {
      $$('[data-slider]').forEach((slider) => {
        const id = slider.getAttribute('data-slider');
        const track = $('.slider__track', slider);
        const step = () => {
          const first = track.firstElementChild;
          const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
          return first ? first.getBoundingClientRect().width + gap : track.clientWidth;
        };
        const go = (dir) => track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
        $$(`[data-slider-prev="${id}"]`).forEach((b) => b.addEventListener('click', () => go(-1)));
        $$(`[data-slider-next="${id}"]`).forEach((b) => b.addEventListener('click', () => go(1)));
        track.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
        });
      });
    },
  };

  /* ===================================================================
   * 16. PricingToggle - swaps prices from data attributes
   * ================================================================= */
  const PricingToggle = {
    init() {
      const wrap = $('[data-billing]');
      if (!wrap) return;
      const sw = $('.switch', wrap);
      sw.addEventListener('click', () => {
        const yearly = sw.getAttribute('aria-checked') !== 'true';
        sw.setAttribute('aria-checked', String(yearly));
        $$('[data-price-monthly]').forEach((el) => {
          el.textContent = el.getAttribute(yearly ? 'data-price-yearly' : 'data-price-monthly');
          if (animate) gsap.from(el, { yPercent: 40, autoAlpha: 0, duration: 0.5, ease: 'power3.out' });
        });
        $$('[data-price-period]').forEach((el) => { el.textContent = yearly ? '/ month' : '/ project'; });
      });
    },
  };

  /* ===================================================================
   * 17. FormValidation - forms with [data-validate] (and novalidate)
   *     - Uses the browser's Constraint Validation API (required, type,
   *       minlength, pattern) with friendly, accessible messages.
   *     - Add data-endpoint="https://..." to POST the form with fetch().
   *       Without it the form shows a demo success message.
   * ================================================================= */
  const FormValidation = {
    emailRe: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    message(field) {
      const v = field.validity;
      if (v.valueMissing) {
        if (field.type === 'checkbox') return 'Please tick this box to continue.';
        if (field.tagName === 'SELECT') return 'Please select an option.';
        return 'This field is required.';
      }
      if (v.typeMismatch) return field.type === 'email' ? 'Please enter a valid email address.' : 'Please enter a valid value.';
      if (v.tooShort) return `Please enter at least ${field.minLength} characters (you entered ${field.value.length}).`;
      if (v.patternMismatch) return 'Please use a valid format.';
      if (!v.valid) return field.validationMessage;
      if (field.type === 'email' && field.value && !this.emailRe.test(field.value)) return 'Please enter a valid email address.';
      return '';
    },
    check(form, field) {
      const msg = this.message(field);
      const error = field.id ? $(`[data-error-for="${field.id}"]`, form) : null;
      field.classList.toggle('is-invalid', !!msg);
      field.classList.toggle('is-valid', !msg && field.value !== '' && field.type !== 'checkbox');
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (error) { error.textContent = msg; error.style.display = msg ? 'block' : ''; }
      return !msg;
    },
    init() {
      $$('form[data-validate]').forEach((form) => {
        const fields = $$('input, textarea, select', form).filter((f) => f.willValidate && !['submit', 'button', 'hidden'].includes(f.type));
        const status = $('.form-status', form);

        fields.forEach((f) => {
          f.addEventListener('blur', () => { if (form.dataset.touched) this.check(form, f); });
          f.addEventListener('input', () => { if (f.classList.contains('is-invalid')) this.check(form, f); });
          f.addEventListener('change', () => { if (form.dataset.touched) this.check(form, f); });
        });

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          form.dataset.touched = '1';
          const invalid = fields.filter((f) => !this.check(form, f));
          if (invalid.length) {
            invalid[0].focus();
            if (status) { status.textContent = invalid.length === 1 ? 'Please fix the highlighted field.' : `Please fix the ${invalid.length} highlighted fields.`; status.className = 'form-status is-error'; }
            return;
          }
          const submit = $('[type="submit"]', form);
          if (submit) submit.disabled = true;
          try {
            const endpoint = form.getAttribute('data-endpoint');
            if (endpoint) {
              const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } else {
              await new Promise((r) => setTimeout(r, 600)); // demo mode
            }
            form.reset();
            fields.forEach((f) => { f.classList.remove('is-valid', 'is-invalid'); f.removeAttribute('aria-invalid'); });
            delete form.dataset.touched;
            if (status) { status.textContent = form.getAttribute('data-success') || 'Thank you! Your message has been sent.'; status.className = 'form-status is-success'; }
          } catch (err) {
            if (status) { status.textContent = 'Sorry, something went wrong. Please try again later.'; status.className = 'form-status is-error'; }
          } finally {
            if (submit) submit.disabled = false;
          }
        });
      });
    },
  };

  /* ===================================================================
   * 18. Countdown - data-date="2026-12-31T09:00:00" or data-days="30"
   * ================================================================= */
  const Countdown = {
    init() {
      const el = $('[data-countdown]');
      if (!el) return;
      const date = el.getAttribute('data-date');
      const target = date ? new Date(date).getTime() : Date.now() + (parseFloat(el.getAttribute('data-days')) || 30) * 864e5;
      const parts = { days: 864e5, hours: 36e5, minutes: 6e4, seconds: 1e3 };
      const pad = (n) => String(n).padStart(2, '0');
      const tick = () => {
        let diff = Math.max(0, target - Date.now());
        Object.keys(parts).forEach((key) => {
          const value = Math.floor(diff / parts[key]);
          diff -= value * parts[key];
          const node = $(`[data-cd="${key}"]`, el);
          if (node) node.textContent = pad(value);
        });
      };
      tick();
      setInterval(tick, 1000);
    },
  };

  /* ===================================================================
   * 19. BackToTop - progress ring + smooth return to the top
   * ================================================================= */
  const BackToTop = {
    init() {
      const btn = $('[data-back-to-top]');
      if (!btn) return;
      const circle = $('circle', btn);
      const length = 2 * Math.PI * 24;
      circle.style.strokeDasharray = `${length}`;
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        circle.style.strokeDashoffset = `${length * (1 - progress)}`;
        btn.classList.toggle('is-visible', window.scrollY > 600);
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
      btn.addEventListener('click', () => {
        SmoothScroll.scrollTo(0);
        const skip = $('.skip-link');
        if (skip) skip.focus({ preventScroll: true });
      });
    },
  };

  /* ===================================================================
   * 20. App - boot order matters (split text before triggers, etc.)
   * ================================================================= */
  const App = {
    init() {
      if (!hasGSAP) {
        // Without GSAP show everything immediately.
        root.classList.remove('js');
        root.classList.add('no-js');
      }
      $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

      ThemeToggle.init();
      SmoothScroll.init();
      Header.init();
      MobileMenu.init();
      Cursor.init();
      Magnetic.init();
      TextReveal.prepare();
      ScrollAnimations.prepare();
      HoverReveal.init();
      PortfolioFilter.init();
      Slider.init();
      PricingToggle.init();
      FormValidation.init();
      Countdown.init();
      BackToTop.init();
      MarqueeVelocity.init();

      Preloader.run(() => {
        HorizontalScroll.init(); // create pinned sections first (they add spacing)
        TextReveal.play();
        ScrollAnimations.create();
        if (hasGSAP) ScrollTrigger.refresh();
        document.dispatchEvent(new CustomEvent('kovra:ready'));
      });

      if (hasGSAP) window.addEventListener('load', () => ScrollTrigger.refresh());
    },
  };

  Object.assign(Kovra, { ThemeToggle, SmoothScroll, Header, Preloader, TextReveal, ScrollAnimations, FormValidation });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.init());
  else App.init();
})();
