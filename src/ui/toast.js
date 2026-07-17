// Transient status message shown at the bottom of the screen.
export function toast(msg) {
  const e = document.getElementById('toast');
  e.textContent = msg;
  e.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.remove('show'), 1900);
}
