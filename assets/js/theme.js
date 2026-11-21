/* Applies the stored colour/mode before first paint to avoid a flash. */
(function () {
  try {
    var accent = localStorage.getItem('chem.accent');
    var mode = localStorage.getItem('chem.mode');
    var allowed = ['burgundy', 'forest', 'indigo', 'plum'];
    var root = document.documentElement;
    if (allowed.indexOf(accent) !== -1) root.setAttribute('data-accent', accent);
    if (mode === 'light' || mode === 'dark') root.setAttribute('data-mode', mode);
  } catch (e) {
    /* storage blocked: fall back to the defaults in the markup */
  }
})();
