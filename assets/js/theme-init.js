/**
 * Kovra - theme-init.js
 * Loaded in <head> (blocking, < 1 KB) so the saved color mode is applied
 * before the first paint and the page never flashes the wrong theme.
 * Also swaps the "no-js" class for "js" so JS-only styles can apply.
 */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  try {
    var saved = localStorage.getItem('kovra-theme');
    if (saved === 'light' || saved === 'dark') {
      root.setAttribute('data-theme', saved);
      root.setAttribute('data-bs-theme', saved);
    }
  } catch (e) { /* localStorage unavailable (private mode) - keep default */ }
})();
