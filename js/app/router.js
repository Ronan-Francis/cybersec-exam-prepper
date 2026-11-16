/**
 * Switches between the three modes. Each mode is { name, enter(params), leave() }.
 * The active mode is kept in the page hash (#quiz, #infinite, #study) so it can be bookmarked.
 */

export function createRouter({ modes, tabs, defaultMode }) {
  const modesByName = new Map(modes.map(mode => [mode.name, mode]));
  let current = null;

  function go(name, params = {}) {
    const mode = modesByName.get(name) || modesByName.get(defaultMode);
    current?.leave();
    current = mode;
    document.body.dataset.mode = mode.name;
    tabs.forEach(tab => tab.setAttribute("aria-pressed", String(tab.dataset.mode === mode.name)));
    updateHash(mode.name);
    mode.enter(params);
    window.scrollTo(0, 0);
  }

  function updateHash(name) {
    const hashIsDefault = !location.hash && name === defaultMode;
    if (location.hash.slice(1) !== name && !hashIsDefault) location.hash = name;
  }

  tabs.forEach(tab => tab.addEventListener("click", () => go(tab.dataset.mode)));
  window.addEventListener("hashchange", () => {
    const name = location.hash.slice(1);
    if (modesByName.has(name) && name !== current?.name) go(name);
  });

  return {
    go,
    start: () => go(location.hash.slice(1) || defaultMode)
  };
}

/**
 * Buttons that jump between modes from anywhere on the page:
 *   data-study="conceptId"     opens that concept in Study mode (data-study="" opens the overview)
 *   data-practise="conceptId"  starts an Infinite session focused on it
 */
export function bindCrossModeLinks(router) {
  document.addEventListener("click", event => {
    const button = event.target.closest("button[data-study], button[data-practise]");
    if (!button) return;
    if (button.dataset.study !== undefined) router.go("study", { concept: button.dataset.study || null });
    else router.go("infinite", { focus: button.dataset.practise });
  });
}
