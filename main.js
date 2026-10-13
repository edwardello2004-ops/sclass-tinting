/* S Class Auto Tinting: transform-only parallax, reveal-on-scroll, tint guide. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Live open/closed status from shop hours: daily 9 a.m. to 8 p.m., Brampton (Toronto time). */
  var status = document.querySelectorAll("[data-open-status]");
  if (status.length) {
    var setStatus = function () {
      var t;
      try {
        var parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
        var h = 0, m = 0;
        parts.forEach(function (p) { if (p.type === "hour") h = +p.value; if (p.type === "minute") m = +p.value; });
        var mins = h * 60 + m;
        if (mins >= 540 && mins < 1200) t = "Open now \u00b7 until 8 p.m.";
        else t = "Closed \u00b7 opens " + (mins < 540 ? "" : "tomorrow ") + "at 9 a.m.";
      } catch (e) { return; }
      Array.prototype.forEach.call(status, function (el) {
        el.textContent = t;
        var chip = el.closest(".hero-chip");
        if (chip) chip.classList.toggle("is-closed", t.indexOf("Closed") === 0);
      });
    };
    setStatus();
    setInterval(setStatus, 60000);
  }

  /* Parallax: each [data-depth] moves by (host centre - viewport centre) x depth. */
  var items = [], raf = 0, running = false;
  var collect = function () {
    items = Array.prototype.map.call(document.querySelectorAll("[data-depth]"), function (el) {
      return { el: el, depth: parseFloat(el.dataset.depth || "0"), host: el.closest("[data-parallax-host]") || el };
    });
  };
  var frame = function () {
    raf = 0;
    var vh = window.innerHeight, scale = window.innerWidth < 720 ? 0.55 : 1;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], r = it.host.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
      var off = (r.top + r.height / 2 - vh / 2) * it.depth * scale;
      it.el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
    }
  };
  var onScroll = function () { if (!raf) raf = requestAnimationFrame(frame); };
  var start = function () {
    if (running) return;
    running = true; collect(); frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  };
  var stop = function () {
    running = false;
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    items.forEach(function (it) { it.el.style.transform = ""; });
  };
  var sync = function () { reduce.matches ? stop() : start(); };
  sync();
  reduce.addEventListener("change", sync);

  /* Reveal: content is only hidden once the observer is attached. */
  if (!reduce.matches && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add("will-reveal");
      io.observe(el);
    });
  }

  /* Nav turns solid once the page scrolls; floating call button shows after the hero. */
  var nav = document.getElementById("nav");
  var hero = document.querySelector(".hero");
  var fab = document.getElementById("float-call");
  var onChrome = function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("is-solid", y > 40);
    if (fab && hero) fab.classList.toggle("is-on", y > hero.offsetHeight * 0.8);
  };
  onChrome();
  window.addEventListener("scroll", onChrome, { passive: true });

  /* Tint guide: overlay opacity follows 1 - VLT^0.6, a perceptual stand-in for
     how much darker the view gets through each shade. */
  var SHADES = {
    70: ["Light", "Barely there. Takes the edge off glare and heat while the glass stays close to factory clear.", "Low", 0.19],
    50: ["Medium light", "A soft smoke. A cooler look with an easy, clear view out, day or night.", "Moderate", 0.34],
    35: ["Medium", "A balanced shade. Clearly darker from outside and still comfortable to see through.", "Good", 0.47],
    20: ["Dark", "Strong privacy from outside. The view out stays clear in daylight; night driving takes more care.", "High", 0.62],
    5: ["Limo", "Near black from outside. Usually reserved for rear glass where the rules allow it.", "Maximum", 0.83]
  };
  var opts = Array.prototype.slice.call(document.querySelectorAll(".tint-opt"));
  var $ = function (id) { return document.getElementById(id); };
  var pick = function (btn, focus) {
    var v = btn.getAttribute("data-vlt"), d = SHADES[v];
    opts.forEach(function (o) {
      var on = o === btn;
      o.setAttribute("aria-checked", on ? "true" : "false");
      o.tabIndex = on ? 0 : -1;
    });
    $("tint-film").style.opacity = d[3];
    $("tint-pct").textContent = v + "%";
    $("tint-badge-n").textContent = v + "%";
    $("tint-name").textContent = d[0];
    $("tint-desc").textContent = d[1];
    $("tint-m1v").textContent = v + "%";
    $("tint-m1").style.width = v + "%";
    $("tint-m2v").textContent = d[2];
    $("tint-m2").style.width = (100 - v) + "%";
    if (focus) btn.focus();
  };
  opts.forEach(function (o, i) {
    o.addEventListener("click", function () { pick(o); });
    o.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight" || k === "ArrowDown") n = opts[(i + 1) % opts.length];
      if (k === "ArrowLeft" || k === "ArrowUp") n = opts[(i - 1 + opts.length) % opts.length];
      if (n) { e.preventDefault(); pick(n, true); }
    });
  });
  var cur = document.querySelector('.tint-opt[aria-checked="true"]');
  if (cur) pick(cur);

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
