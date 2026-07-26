(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

  const storedTheme = () => {
    try {
      return localStorage.getItem('sfl-theme');
    } catch {
      return null;
    }
  };

  const syncGiscusTheme = () => {
    const giscusScript = document.querySelector('script[src="https://giscus.app/client.js"]');
    if (giscusScript) giscusScript.dataset.theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    const frame = document.querySelector('iframe.giscus-frame');
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage({
      giscus: { setConfig: { theme: root.dataset.theme === 'dark' ? 'dark' : 'light' } }
    }, 'https://giscus.app');
  };

  const applyTheme = (theme, persist = false) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;
    if (persist) {
      try {
        localStorage.setItem('sfl-theme', nextTheme);
      } catch {
        // The selected theme still applies when storage is unavailable.
      }
    }
    if (themeButton) {
      const nextLabel = nextTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
      themeButton.setAttribute('aria-label', nextLabel);
      themeButton.setAttribute('title', nextLabel);
    }
    syncGiscusTheme();
  };

  applyTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
  themeButton?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  systemTheme.addEventListener('change', (event) => {
    if (!storedTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });

  const giscusWrap = document.querySelector('.giscus-wrap');
  if (giscusWrap) {
    new MutationObserver(syncGiscusTheme).observe(giscusWrap, { childList: true, subtree: true });
    syncGiscusTheme();
  }

  const drawer = document.querySelector('#site-drawer');
  const drawerOpen = document.querySelector('[data-drawer-open]');
  const drawerClose = document.querySelector('[data-drawer-close]');
  const drawerBackdrop = document.querySelector('[data-drawer-backdrop]');
  const mobileViewport = window.matchMedia('(max-width: 979px)');
  let previousFocus = null;

  const drawerFocusable = () => [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary')]
    .filter((element) => !element.hidden && element.getClientRects().length > 0);

  const syncDrawerMode = () => {
    if (!drawer) return;
    document.body.classList.remove('drawer-open');
    drawerOpen?.setAttribute('aria-expanded', 'false');
    drawerBackdrop?.setAttribute('aria-hidden', 'true');
    if (mobileViewport.matches) {
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
    } else {
      drawer.setAttribute('aria-hidden', 'false');
      drawer.removeAttribute('role');
      drawer.removeAttribute('aria-modal');
    }
  };

  const openDrawer = () => {
    if (!drawer || !mobileViewport.matches) return;
    previousFocus = document.activeElement;
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawerOpen?.setAttribute('aria-expanded', 'true');
    drawerBackdrop?.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => drawerClose?.focus());
  };

  const closeDrawer = (restoreFocus = true) => {
    if (!drawer || !mobileViewport.matches) return;
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawerOpen?.setAttribute('aria-expanded', 'false');
    drawerBackdrop?.setAttribute('aria-hidden', 'true');
    if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
  };

  drawerOpen?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', () => closeDrawer());
  drawerBackdrop?.addEventListener('click', () => closeDrawer());
  mobileViewport.addEventListener('change', syncDrawerMode);
  syncDrawerMode();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('drawer-open')) {
      closeDrawer();
      return;
    }
    if (event.key !== 'Tab' || !document.body.classList.contains('drawer-open') || !drawer) return;

    const focusable = drawerFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  drawer?.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', () => closeDrawer(false));
  });

  const normalize = (value) => String(value || '').normalize('NFKC').trim().toLowerCase();
  const navSearch = document.querySelector('[data-nav-search]');
  const navSearchClear = document.querySelector('[data-nav-search-clear]');
  const navGroups = [...document.querySelectorAll('[data-nav-group]')];
  const navEmpty = document.querySelector('[data-nav-empty]');

  const applyNavSearch = () => {
    if (!navSearch) return;
    const query = normalize(navSearch.value);
    let visibleTotal = 0;

    navGroups.forEach((group) => {
      const categoryMatches = query && normalize(group.querySelector('summary')?.textContent).includes(query);
      let visibleInGroup = 0;
      group.querySelectorAll('[data-nav-item]').forEach((item) => {
        const matches = !query || categoryMatches || normalize(item.dataset.searchText).includes(query);
        item.hidden = !matches;
        if (matches) visibleInGroup += 1;
      });
      group.hidden = query ? visibleInGroup === 0 : false;
      if (query && visibleInGroup > 0) group.open = true;
      visibleTotal += visibleInGroup;
    });

    navSearchClear.hidden = !query;
    navEmpty.hidden = !query || visibleTotal > 0;
  };

  navSearch?.addEventListener('input', applyNavSearch);
  navSearch?.addEventListener('search', applyNavSearch);
  navSearch?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !navSearch.value) return;
    event.stopPropagation();
    navSearch.value = '';
    applyNavSearch();
  });
  navSearchClear?.addEventListener('click', () => {
    navSearch.value = '';
    applyNavSearch();
    navSearch.focus();
  });

  const directory = document.querySelector('[data-directory-results]');
  if (!directory) return;

  const search = document.querySelector('[data-directory-search]');
  const searchClear = document.querySelector('[data-directory-search-clear]');
  const categoryButtons = [...document.querySelectorAll('[data-category-filter]')];
  const languageButtons = [...document.querySelectorAll('[data-language-filter]')];
  const communities = [...directory.querySelectorAll('[data-community]')];
  const sections = [...directory.querySelectorAll('[data-category-section]')];
  const resultCount = document.querySelector('[data-result-count]');
  const emptyState = document.querySelector('[data-empty-state]');
  const summaryReset = document.querySelector('.results-summary [data-reset-filters]');
  const resetButtons = [...document.querySelectorAll('[data-reset-filters]')];
  const sidebarCategoryLinks = [...document.querySelectorAll('[data-directory-category-link]')];
  const categoryLabels = new Map(categoryButtons.map((button) => [button.dataset.categoryFilter, button.textContent.trim()]));
  const languageLabels = new Map(languageButtons.map((button) => [button.dataset.languageFilter, button.textContent.trim()]));
  const state = { query: '', category: 'all', language: 'all' };

  const setPressedState = () => {
    categoryButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === state.category));
    });
    languageButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.languageFilter === state.language));
    });
    sidebarCategoryLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.directoryCategoryLink === state.category);
    });
  };

  const updateCategoryHash = () => {
    const suffix = state.category === 'all' ? '' : `#${state.category}`;
    history.replaceState(null, '', `${location.pathname}${location.search}${suffix}`);
  };

  const applyDirectoryFilters = () => {
    const query = normalize(search.value);
    state.query = query;
    let visibleTotal = 0;

    communities.forEach((item) => {
      const matchesQuery = !query || normalize(item.dataset.searchText).includes(query);
      const matchesCategory = state.category === 'all' || item.dataset.category === state.category;
      const itemLanguages = item.dataset.languages.split(/\s+/).filter(Boolean);
      const matchesLanguage = state.language === 'all' || itemLanguages.includes(state.language);
      const visible = matchesQuery && matchesCategory && matchesLanguage;
      item.hidden = !visible;
      if (visible) visibleTotal += 1;
    });

    sections.forEach((section) => {
      const visibleInSection = [...section.querySelectorAll('[data-community]')].filter((item) => !item.hidden).length;
      section.hidden = visibleInSection === 0;
      const sectionCount = section.querySelector('[data-section-count]');
      if (sectionCount) sectionCount.textContent = String(visibleInSection);
    });

    const active = Boolean(query || state.category !== 'all' || state.language !== 'all');
    const context = [];
    if (query) context.push(`关键词“${search.value.trim()}”`);
    if (state.category !== 'all') context.push(categoryLabels.get(state.category));
    if (state.language !== 'all') context.push(languageLabels.get(state.language));
    resultCount.textContent = active
      ? `找到 ${visibleTotal} 个社区${context.length ? ` · ${context.join(' · ')}` : ''}`
      : `显示全部 ${communities.length} 个社区`;
    emptyState.hidden = visibleTotal !== 0;
    directory.hidden = visibleTotal === 0;
    summaryReset.hidden = !active;
    searchClear.hidden = !query;
    setPressedState();
  };

  const resetFilters = () => {
    search.value = '';
    state.category = 'all';
    state.language = 'all';
    applyDirectoryFilters();
    updateCategoryHash();
    search.focus();
  };

  search.addEventListener('input', applyDirectoryFilters);
  search.addEventListener('search', applyDirectoryFilters);
  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !search.value) return;
    search.value = '';
    applyDirectoryFilters();
  });
  searchClear.addEventListener('click', () => {
    search.value = '';
    applyDirectoryFilters();
    search.focus();
  });

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.categoryFilter;
      applyDirectoryFilters();
      updateCategoryHash();
    });
  });

  languageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.language = button.dataset.languageFilter;
      applyDirectoryFilters();
    });
  });

  resetButtons.forEach((button) => button.addEventListener('click', resetFilters));
  sidebarCategoryLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const category = link.dataset.directoryCategoryLink;
      state.category = category;
      search.value = '';
      applyDirectoryFilters();
      updateCategoryHash();
      const target = category === 'all'
        ? document.querySelector('#directory')
        : document.querySelector(`#${CSS.escape(category)}`);
      window.requestAnimationFrame(() => target?.scrollIntoView({ block: 'start' }));
    });
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if (event.key === '/' && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      search.focus();
    }
  });

  const initialHash = decodeURIComponent(location.hash.slice(1));
  if (categoryLabels.has(initialHash)) state.category = initialHash;
  applyDirectoryFilters();
})();
