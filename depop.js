(function () {
  var bar = document.querySelector(".progress");
  var reduce = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function paint() {
    if (!bar) return;
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? Math.min(1, scrollY / h) : 0;
    bar.style.transform = "scaleX(" + p + ")";
  }
  paint();
  addEventListener("scroll", paint, { passive: true });

  document.querySelectorAll("[data-switch]").forEach(function (root) {
    var buttons = [].slice.call(root.querySelectorAll("[role='tab']"));
    var panels = [].slice.call(root.querySelectorAll("[data-panel]"));
    function show(id) {
      buttons.forEach(function (b) {
        var on = b.getAttribute("aria-controls") === id;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.hidden = p.id !== id; });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () { show(b.getAttribute("aria-controls")); });
      b.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var n = buttons[(i + (e.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
        n.focus();
        show(n.getAttribute("aria-controls"));
      });
    });
  });
  if (reduce && bar) bar.style.transition = "none";
})();
