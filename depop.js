(function () {
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (!reduce) document.documentElement.classList.add("js");

  var nodes = document.querySelectorAll(".reveal");
  function show(el) { el.classList.add("in"); }
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    nodes.forEach(function (el) { io.observe(el); });
    window.setTimeout(function () {
      nodes.forEach(show);
    }, 4000);
  }

  var links = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = links.map(function (a) {
    return document.querySelector(a.getAttribute("href"));
  }).filter(Boolean);

  function setCurrent() {
    var mark = window.scrollY + 96;
    var current = sections[0] ? sections[0].id : "";
    sections.forEach(function (sec) {
      if (sec.offsetTop <= mark) current = sec.id;
    });
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }

  var top = document.querySelector(".top");
  function onScroll() {
    if (!top) return;
    if (window.scrollY > 8) top.classList.add("is-stuck");
    else top.classList.remove("is-stuck");
    setCurrent();
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();
