/* ReplatformPro landing page scripts */

/* 1. Paste your Formspree form address here, e.g. "https://formspree.io/f/abcd1234".
      Until it's set, the form opens a pre-filled email instead. */
var FORMSPREE_ENDPOINT = "https://formspree.io/f/mdeeykba";

(function () {
  /* ---------- Card stack: auto-advance on phones and tablets ---------- */
  var fan = document.getElementById("fan");
  if (fan) {
    var pausedUntil = 0, visible = false;
    var pause = function () { pausedUntil = Date.now() + 8000; };
    ["pointerdown", "touchstart", "wheel"].forEach(function (ev) {
      fan.addEventListener(ev, pause, { passive: true });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.5 }).observe(fan);
    } else { visible = true; }
    setInterval(function () {
      if (!visible || Date.now() < pausedUntil) return;
      if (!window.matchMedia("(max-width: 1100px)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var cards = Array.prototype.slice.call(fan.children);
      if (!cards.length) return;
      var center = fan.scrollLeft + fan.clientWidth / 2, idx = 0, best = Infinity;
      cards.forEach(function (c, k) {
        var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (d < best) { best = d; idx = k; }
      });
      var next = cards[(idx + 1) % cards.length];
      fan.scrollTo({ left: next.offsetLeft - (fan.clientWidth - next.offsetWidth) / 2, behavior: "smooth" });
    }, 3500);
  }

  /* ---------- Plan request popup ---------- */
  var modal = document.getElementById("plan-modal");
  if (!modal) return;
  var form = document.getElementById("plan-form");
  var formView = document.getElementById("plan-form-view");
  var doneView = document.getElementById("plan-done-view");
  var errorBox = document.getElementById("pf-error");
  var submitBtn = document.getElementById("pf-submit");
  var lastTrigger = null;

  function openModal(trigger) {
    lastTrigger = trigger || null;
    formView.hidden = false; doneView.hidden = true; errorBox.hidden = true;
    modal.hidden = false;
    document.body.classList.add("rp-lock");
    setTimeout(function () { document.getElementById("pf-url").focus(); }, 30);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("rp-lock");
    if (lastTrigger) lastTrigger.focus();
  }
  document.querySelectorAll("[data-plan]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); openModal(a); });
  });
  modal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });
  document.addEventListener("keydown", function (e) {
    if (modal.hidden) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") { /* keep focus inside the popup */
      var f = modal.querySelectorAll("button:not([disabled]), input:not([tabindex='-1']), textarea, a[href]");
      var vis = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!vis.length) return;
      var first = vis[0], last = vis[vis.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  if (location.hash === "#get-plan") openModal();

  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
  function cleanUrl(u) { return u.replace(/^https?:\/\//i, "").replace(/\/+$/, ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    var url = form.store_url.value.trim(), name = form.name.value.trim(), email = form.email.value.trim();
    if (!url) { showError("Add your store URL so we know which store to plan for."); form.store_url.focus(); return; }
    if (!name) { showError("Add your name."); form.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("Add an email address we can send your plan to."); form.email.focus(); return; }
    if (form._gotcha.value) return; /* likely a bot */

    var store = cleanUrl(url);
    var showDone = function () {
      document.getElementById("pd-name").textContent = name.split(" ")[0] + ".";
      document.getElementById("pd-text").textContent = "I'll be in touch within one business day if I have any questions. Your plan for " + store + " arrives within 5 business days.";
      formView.hidden = true; doneView.hidden = false;
      document.getElementById("plan-done-title").focus();
      form.reset();
    };

    if (!FORMSPREE_ENDPOINT) { /* fallback until Formspree is connected */
      var body = "Hi Jill,\n\nI'd like a free migration plan.\n\nStore URL: " + url + "\nName: " + name + "\nEmail: " + email +
        "\n\nAnything custom about how my store works: " + form.custom_features.value + "\n\nSystems connected to my store: " + form.connected_systems.value +
        "\n\nHow I picture the new store: " + ((form.querySelector("input[name=design_direction]:checked") || {}).value || "") + "\n";
      window.location.href = "mailto:jill@replatformpro.com?subject=" + encodeURIComponent("Plan request: " + store) + "&body=" + encodeURIComponent(body);
      return;
    }

    var data = new FormData(form);
    data.append("_subject", "Plan request: " + store);
    data.append("_replyto", email);
    submitBtn.disabled = true; submitBtn.textContent = "Sending…";
    fetch(FORMSPREE_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); showDone(); })
      .catch(function () { showError("That didn't go through. Please email jill@replatformpro.com with your store URL instead."); })
      .then(function () { submitBtn.disabled = false; submitBtn.textContent = "Send my request"; });
  });
})();
