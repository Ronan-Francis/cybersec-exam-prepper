/**
 * Switches between the three modes. Each mode is { name, enter(params), leave() }, plus an optional
 * confirmLeave() that returns false to stay put (Quiz asks before abandoning an attempt).
 * The active mode is kept in the page hash (#quiz, #infinite, #study) so it can be bookmarked,
 * and Back and Forward move between modes. Entering a mode starts it afresh (a new quiz, a new
 * Infinite session), so the tab of the mode already showing is disabled rather than restarting it.
 *
 * win is the browser window; tests pass a stand-in.
 */

/** The mode a hash names, or the default mode for an empty or unknown hash. */
export function modeFromHash(hash, modeNames, defaultMode) {
  const name = hash.replace(/^#/, "");
  return modeNames.includes(name) ? name : defaultMode;
}

export function createRouter({ modes, tabs, defaultMode, win = window }) {
  const modesByName = new Map(modes.map(mode => [mode.name, mode]));
  const modeNames = [...modesByName.keys()];
  let current = null;

  /** Switches to a mode. Returns false if the current mode's confirmLeave() said to stay. */
  function go(name, params = {}) {
    const mode = modesByName.get(name) || modesByName.get(defaultMode);
    if (current?.confirmLeave && !current.confirmLeave()) return false;
    current?.leave();
    current = mode;
    win.document.body.dataset.mode = mode.name;
    tabs.forEach(tab => markTab(tab, tab.dataset.mode === mode.name));
    updateHash(mode.name);
    mode.enter(params);
    win.scrollTo(0, 0);
    return true;
  }

  function markTab(tab, isCurrent) {
    tab.disabled = isCurrent;
    if (isCurrent) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  }

  function updateHash(name) {
    const hash = win.location.hash;
    if (hash.slice(1) === name || (!hash && name === defaultMode)) return;
    win.location.hash = name;
  }

  tabs.forEach(tab => tab.addEventListener("click", () => {
    if (tab.dataset.mode !== current?.name) go(tab.dataset.mode);
  }));
  win.addEventListener("hashchange", () => {
    const name = modeFromHash(win.location.hash, modeNames, defaultMode);
    if (name === current?.name) return;
    // Back or Forward has already changed the address; if the user chose to stay, put it back without a new history entry.
    if (!go(name)) win.history.replaceState(null, "", `#${current.name}`);
  });

  return {
    go,
    current: () => current?.name ?? null,
    start: () => go(modeFromHash(win.location.hash, modeNames, defaultMode))
  };
}

/**
 * Buttons that jump between modes from anywhere on the page:
 *   data-study="conceptId"     opens that concept in Study mode (data-study="" opens the overview)
 *   data-practise="conceptId"  starts an Infinite session focused on it
 */
export function bindCrossModeLinks(router, doc = document) {
  doc.addEventListener("click", event => {
    const button = event.target.closest("button[data-study], button[data-practise]");
    if (!button) return;
    if (button.dataset.study !== undefined) router.go("study", { concept: button.dataset.study || null });
    else router.go("infinite", { focus: button.dataset.practise });
  });
}
