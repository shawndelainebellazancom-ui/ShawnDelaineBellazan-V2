/**
 * PMCR-O SITE CORE (Vanilla JS)
 * Purpose: Site-wide UX consistency, accessibility hooks, and theme control.
 * Design: BIP logic (self-verifying). Safe no-ops if elements are missing.
 *
 * Features:
 * - Dark/Light theme toggle with persistence
 * - Mobile nav menu toggle with focus trap + escape close
 * - Navbar "scrolled" state
 * - Lightweight accessibility audit logging (non-blocking)
 */
(function () {
  'use strict';

  if (window.__pmcroSiteInitialized) return;
  window.__pmcroSiteInitialized = true;

  const THEME_STORAGE_KEY = 'pmcro-theme';

  function safeGetLocalStorage(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSetLocalStorage(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* noop */ }
  }

  function getPreferredTheme() {
    const saved = safeGetLocalStorage(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  function ensureNavActions(container) {
    if (!container || !container.querySelector) return null;
    let actions = container.querySelector('.nav-actions');
    if (actions) return actions;

    // Only auto-create nav-actions inside the top nav container
    const isTopNavContainer = container.matches && container.matches('nav .container');
    if (!isTopNavContainer) return null;

    actions = document.createElement('div');
    actions.className = 'nav-actions';
    actions.setAttribute('aria-label', 'Display and menu controls');
    container.appendChild(actions);
    return actions;
  }

  function ensureThemeToggle() {
    const existing = document.querySelector('.theme-toggle');
    if (existing) return existing;

    // Primary placement: top nav
    let container = document.querySelector('nav .container') || document.querySelector('nav');
    // Fallback placement: documentation sidebars (e.g., codex)
    if (!container) container = document.querySelector('.sidebar-header');
    // Last-resort placement: body (avoid failing silently)
    if (!container) container = document.body;
    if (!container) return null;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.setAttribute('aria-pressed', 'false');
    btn.title = 'Toggle theme';
    btn.innerHTML = '<span class="theme-icon" aria-hidden="true">☾</span><span class="sr-only">Toggle dark/light mode</span>';

    // Prefer a dedicated action container if present; otherwise append near the end of the container
    const actions = ensureNavActions(container) || (container.querySelector && container.querySelector('.nav-actions'));
    if (actions) actions.prepend(btn);
    else container.appendChild(btn);

    return btn;
  }

  function setTheme(theme, { persist = true } = {}) {
    const resolved = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', resolved);

    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      const icon = toggle.querySelector('.theme-icon');
      const isLight = resolved === 'light';
      toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      toggle.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
      if (icon) icon.textContent = isLight ? '☀' : '☾';
    }

    if (persist) safeSetLocalStorage(THEME_STORAGE_KEY, resolved);
  }

  function initTheme() {
    const toggle = ensureThemeToggle();
    setTheme(getPreferredTheme(), { persist: false });

    if (toggle && !toggle.__pmcroBound) {
      toggle.__pmcroBound = true;
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(current === 'light' ? 'dark' : 'light', { persist: true });
      });
    }

    const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
    if (mql && typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', () => {
        const hasSaved = !!safeGetLocalStorage(THEME_STORAGE_KEY);
        if (!hasSaved) setTheme(getPreferredTheme(), { persist: false });
      });
    }
  }

  function ensureMobileMenuToggle() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return { mobileToggle: null, navMenu: null };

    let mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navContainer = document.querySelector('nav .container') || document.querySelector('nav');
    const actions = ensureNavActions(navContainer) || (navContainer && navContainer.querySelector && navContainer.querySelector('.nav-actions'));

    if (!mobileToggle) {
      if (!navContainer) return { mobileToggle: null, navMenu };

      mobileToggle = document.createElement('button');
      mobileToggle.className = 'mobile-menu-toggle';
      mobileToggle.type = 'button';
      mobileToggle.setAttribute('aria-label', 'Open menu');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.innerHTML = '<span></span><span></span><span></span>';

      if (actions) actions.appendChild(mobileToggle);
      else navContainer.appendChild(mobileToggle);
    } else {
      // If it exists but isn't in nav-actions, move it there for consistent layout.
      if (actions && mobileToggle.parentElement !== actions) {
        actions.appendChild(mobileToggle);
      }
    }

    if (!navMenu.id) navMenu.id = 'mainNavMenu';
    mobileToggle.setAttribute('aria-controls', navMenu.id);

    return { mobileToggle, navMenu };
  }

  function initMobileMenu() {
    const { mobileToggle, navMenu } = ensureMobileMenuToggle();
    if (!mobileToggle || !navMenu) return;
    if (mobileToggle.__pmcroBound) return;
    mobileToggle.__pmcroBound = true;

    function closeMenu({ returnFocus = false } = {}) {
      navMenu.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
      if (returnFocus) mobileToggle.focus();
    }

    function openMenu() {
      navMenu.classList.add('active');
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileToggle.setAttribute('aria-label', 'Close menu');
      document.body.style.overflow = 'hidden';
    }

    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      isExpanded ? closeMenu({ returnFocus: true }) : openMenu();
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenu());
    });

    document.addEventListener('click', (e) => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      if (!isExpanded) return;
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      if (!isExpanded) return;
      if (e.key === 'Escape') closeMenu({ returnFocus: true });
    });

    // Focus trap when menu is open (WCAG-friendly)
    document.addEventListener('keydown', (e) => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      if (!isExpanded || e.key !== 'Tab') return;
      const focusable = navMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function normalizeHref(href) {
    try {
      const url = new URL(href, window.location.href);
      // Normalize to pathname + hash for comparing internal links
      return `${url.pathname.replace(/\/+$/, '')}${url.hash || ''}`.toLowerCase();
    } catch (e) {
      return String(href || '').trim().toLowerCase();
    }
  }

  function isIndexPage() {
    const path = (window.location.pathname || '').toLowerCase();
    return path.endsWith('/') || path.endsWith('/index.html') || path === '' || path === '/index';
  }

  // Ensure core site navigation links exist on every page (without duplicates).
  function ensurePrimaryNavLinks() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    const onIndex = isIndexPage();
    const links = [
      { href: onIndex ? '#home' : 'index.html#home', label: 'Home' },
      { href: onIndex ? '#work' : 'index.html#work', label: 'Work' },
      { href: 'pmcro-codex.html', label: 'Docs' },
      { href: 'pmcro-prompt-library.html', label: 'Agents' },
      { href: onIndex ? '#articles' : 'index.html#articles', label: 'Articles' },
      { href: onIndex ? '#contact' : 'index.html#contact', label: 'Contact' }
    ];

    const existing = new Set(Array.from(navMenu.querySelectorAll('a')).map(a => normalizeHref(a.getAttribute('href'))));

    links.forEach((item) => {
      if (existing.has(normalizeHref(item.href))) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      li.appendChild(a);
      navMenu.appendChild(li);
    });
  }

  // Keep top nav from wrapping (which makes it look "thick") by moving low-priority links into a More dropdown.
  function ensureMoreDropdown() {
    const navMenu = document.querySelector('.nav-menu');
    const navContainer = document.querySelector('nav .container');
    if (!navMenu || !navContainer) return;

    // Only on desktop layouts (mobile already becomes an overlay menu)
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;

    // Create More container once
    let moreLi = navMenu.querySelector('.nav-more');
    if (!moreLi) {
      moreLi = document.createElement('li');
      moreLi.className = 'nav-more';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-more-toggle';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'More navigation');
      btn.innerHTML = 'More <span aria-hidden="true">▾</span>';

      const menu = document.createElement('ul');
      menu.className = 'nav-more-menu';
      menu.setAttribute('role', 'menu');

      moreLi.appendChild(btn);
      moreLi.appendChild(menu);
      navMenu.appendChild(moreLi);

      btn.addEventListener('click', () => {
        const isOpen = moreLi.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      document.addEventListener('click', (e) => {
        if (!moreLi.classList.contains('open')) return;
        if (!moreLi.contains(e.target)) {
          moreLi.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && moreLi.classList.contains('open')) {
          moreLi.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    }

    const menu = moreLi.querySelector('.nav-more-menu');
    const btn = moreLi.querySelector('.nav-more-toggle');
    if (!menu || !btn) return;

    // Move low-priority links into More first (so we don't hide core links)
    const lowPriority = new Set(['skills', 'philosophy', 'achievements']);
    const anchors = Array.from(navMenu.querySelectorAll(':scope > li > a'));
    anchors.forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const isLow = Array.from(lowPriority).some(key => href.includes(`#${key}`));
      if (!isLow) return;
      const li = a.closest('li');
      if (li && li.parentElement === navMenu && !li.classList.contains('nav-more')) {
        menu.appendChild(li);
      }
    });

    // If nav still wraps, progressively move trailing items into More (except core links)
    function isWrapped() {
      // If menu items exceed available space, scrollWidth will exceed clientWidth
      return navMenu.scrollWidth > navMenu.clientWidth + 5;
    }

    const coreKeep = ['#home', '#work', 'pmcro-codex.html', 'pmcro-prompt-library.html', '#articles', '#contact'];
    let safety = 30;
    while (isWrapped() && safety-- > 0) {
      const topLis = Array.from(navMenu.children).filter(li => !li.classList.contains('nav-more'));
      const last = topLis[topLis.length - 1];
      if (!last) break;
      const a = last.querySelector('a');
      const href = a ? (a.getAttribute('href') || '').toLowerCase() : '';
      const isCore = coreKeep.some(k => href.includes(k));
      if (isCore) break; // stop before we hide core nav
      menu.appendChild(last);
    }

    // Hide "More" completely if it's empty
    const hasItems = menu.children.length > 0;
    moreLi.style.display = hasItems ? '' : 'none';
    if (!hasItems) {
      moreLi.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function initNavbarScrollState() {
    const navbar = document.querySelector('nav');
    if (!navbar) return;

    function onScroll() {
      if (window.scrollY > 100) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ==================== ACCESSIBILITY LOGGING (LIGHTWEIGHT AUDIT) ====================
  function logA11yIssue(type, message, element) {
    const entry = {
      type,
      message,
      selector: element && element.tagName
        ? `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${String(element.className).trim().split(/\s+/).join('.')}` : ''}`
        : null,
      ts: new Date().toISOString()
    };
    window.__pmcroA11yLog = window.__pmcroA11yLog || [];
    window.__pmcroA11yLog.push(entry);
    console.warn('[PMCR-O A11Y]', entry);
  }

  function runA11yAudit() {
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) logA11yIssue('missing_alt', 'Image missing alt attribute', img);
    });

    document.querySelectorAll('button').forEach((btn) => {
      const hasLabel = ((btn.getAttribute('aria-label') || '').trim().length > 0);
      const hasText = ((btn.textContent || '').trim().length > 0);
      if (!hasLabel && !hasText) logA11yIssue('button_no_name', 'Button missing accessible name (aria-label or text)', btn);
    });

    document.querySelectorAll('[role="navigation"]').forEach((nav) => {
      const label = (nav.getAttribute('aria-label') || '').trim();
      if (!label) logA11yIssue('nav_no_label', 'role="navigation" missing aria-label', nav);
    });
  }

  function initKeyboardNavDetection() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') document.body.classList.add('keyboard-nav');
    });
    window.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }

  function init() {
    initTheme();
    initMobileMenu();
    ensurePrimaryNavLinks();
    ensureMoreDropdown();
    initNavbarScrollState();
    initKeyboardNavDetection();
    runA11yAudit();
  }

  // Re-check nav density on resize (desktop only)
  window.addEventListener('resize', () => {
    ensureMoreDropdown();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


