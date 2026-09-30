/** Scroll a hash target so its top sits below the sticky folio masthead. */
export function scrollPastMasthead(target: Element) {
  const header = document.querySelector(".site-masthead");
  const offset =
    (header instanceof HTMLElement ? header.getBoundingClientRect().height : 0) +
    12;
  const top = window.scrollY + target.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
}

export function scrollHashPastMasthead() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  if (getComputedStyle(target).display === "none") return false;
  // First paint can leave a late section with a 0×0 box at the top of the
  // page. Scrolling then would "succeed" and leave the hash under the fold.
  if (target.getBoundingClientRect().height < 1) return false;
  scrollPastMasthead(target);
  return true;
}

/** Retry until the hash target is displayed (tab panels hydrate closed). */
export function scheduleScrollHashPastMasthead() {
  if (typeof window === "undefined" || !window.location.hash) {
    return () => {};
  }
  let attempts = 0;
  let frame = 0;
  function go() {
    if (scrollHashPastMasthead()) return;
    if (attempts++ < 90) frame = requestAnimationFrame(go);
  }
  frame = requestAnimationFrame(go);
  return () => cancelAnimationFrame(frame);
}
