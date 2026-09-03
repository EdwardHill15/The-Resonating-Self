/* Afspraakwidget: type kiezen, vorm kiezen, Cal.com-agenda tonen, en bij een
   betaalde afspraak doorsturen naar iDEAL via de Netlify-functie.

   De agenda zelf is de embed van Cal.com; die kent de vrije momenten en zet de
   afspraak in de gekoppelde Google- of Outlook-agenda. Bij beeldbellen voegt
   Cal.com de Google Meet- of Zoom-link toe aan de uitnodiging.

   Vul CAL_USER met je Cal.com-gebruikersnaam en de event-slugs met de
   afspraaktypen die je daar aanmaakt.                                        */

(function () {
  var CAL_USER = "edward-hillenaar-pjpiso";   // <- je Cal.com-gebruikersnaam
  var TYPES = {
    intro:    { slug: "kennismaking-20",  cents: 0,     pay: false },
    intake:   { slug: "intake-60",        cents: 10000, pay: true  },
    session:  { slug: "sessie-60",        cents: 10000, pay: true  },
    callback: { slug: "terugbelverzoek",  cents: 0,     pay: false }
  };

  function loadCal() {
    if (window.Cal) return;
    var s = document.createElement("script");
    s.src = "https://app.cal.com/embed/embed.js";
    s.async = true;
    document.head.appendChild(s);
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; cal.loaded = true; }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          api.q = api.q || [];
          cal.ns[ar[1]] = api; p(api, ar); return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var root = document.getElementById("booking");
    if (!root) return;
    loadCal();

    var chosen = null;
    var mode = "";
    var calBox = root.querySelector("[data-cal-box]");
    var payBox = root.querySelector("[data-pay-box]");
    var modeBox = root.querySelector("[data-mode-box]");
    var steps = root.querySelectorAll("[data-step]");

    function show(el, on) { if (el) el.style.display = on ? "" : "none"; }

    steps.forEach(function (s) { if (s.dataset.step !== "1") show(s, false); });

    root.querySelectorAll("[data-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        root.querySelectorAll("[data-type]").forEach(function (b) { b.classList.remove("chosen"); });
        btn.classList.add("chosen");
        chosen = btn.dataset.type;
        var cfg = TYPES[chosen];
        mode = "";

        // vormen die bij dit type horen
        if (modeBox) {
          modeBox.innerHTML = "";
          (btn.dataset.modes || "").split("|").filter(Boolean).forEach(function (m, i) {
            var b = document.createElement("button");
            b.type = "button"; b.className = "mode-btn" + (i === 0 ? " chosen" : "");
            b.textContent = m;
            b.addEventListener("click", function () {
              modeBox.querySelectorAll(".mode-btn").forEach(function (x) { x.classList.remove("chosen"); });
              b.classList.add("chosen"); mode = m;
            });
            modeBox.appendChild(b);
            if (i === 0) mode = m;
          });
        }

        steps.forEach(function (s) { show(s, true); });
        show(payBox, cfg.pay);
        root.querySelectorAll("[data-free-note]").forEach(function (n) { show(n, !cfg.pay); });

        // Cal.com-agenda voor dit type
        if (calBox) {
          calBox.innerHTML = "";
          var holder = document.createElement("div");
          holder.style.minHeight = "620px";
          calBox.appendChild(holder);
          if (window.Cal) {
            window.Cal("init", { origin: "https://app.cal.com" });
            window.Cal("inline", {
              elementOrSelector: holder,
              calLink: CAL_USER + "/" + cfg.slug,
              config: { layout: "month_view", theme: "light" }
            });
            window.Cal("ui", {
              theme: "light",
              styles: { branding: { brandColor: "#00549C" } },
              hideEventTypeDetails: false
            });
          } else {
            holder.innerHTML = '<p style="color:#5d7280">De agenda wordt geladen…</p>';
          }
        }
        var next = root.querySelector("[data-step='2']");
        if (next) next.scrollIntoView ? null : null;
      });
    });

    var payBtn = root.querySelector("[data-pay-btn]");
    if (payBtn) {
      payBtn.addEventListener("click", async function () {
        if (!chosen || !TYPES[chosen].pay) return;
        var name = (root.querySelector("[name='bk-name']") || {}).value || "";
        var email = (root.querySelector("[name='bk-email']") || {}).value || "";
        var phone = (root.querySelector("[name='bk-phone']") || {}).value || "";
        var note = (root.querySelector("[name='bk-note']") || {}).value || "";
        var status = root.querySelector("[data-pay-status]");

        if (!name.trim() || !/.+@.+\..+/.test(email)) {
          if (status) status.textContent = "Vul je naam en een geldig e-mailadres in.";
          return;
        }
        payBtn.disabled = true;
        if (status) status.textContent = "Betaling wordt aangemaakt…";
        try {
          var res = await fetch("/.netlify/functions/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: chosen, name: name, email: email, phone: phone, note: note, mode: mode })
          });
          var data = await res.json();
          if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
          if (status) status.textContent = data.error === "MOLLIE_API_KEY ontbreekt"
            ? "De betaalkoppeling is nog niet ingesteld. Neem contact op, dan sturen we een factuur."
            : "Er ging iets mis bij het aanmaken van de betaling. Probeer het opnieuw of neem contact op.";
        } catch (e) {
          if (status) status.textContent = "Geen verbinding met de betaaldienst. Probeer het later opnieuw.";
        }
        payBtn.disabled = false;
      });
    }
  });
})();
