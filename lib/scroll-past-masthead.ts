/** Scroll a hash target so its top sits below the sticky folio masthead. */
export function scrollPastMasthead(target: Element) {
  const header = document.querySelector(".site-masthead");
  const offset =
    (header instanceof HTMLElement ? header.getBoundingClientRect().height : 0) +
    12;
  const top = window.scrollY + target.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function scrollHashPastMasthead() {
  const id = window.location.hash.replace(/^#/, "");
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  if (getComputedStyle(target).display === "none") return false;
  scrollPastMasthead(target);
  return true;
}
