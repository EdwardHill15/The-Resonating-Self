/* Afspraakwidget: type kiezen, vorm kiezen, Cal.com-agenda tonen, en bij een
   betaalde afspraak doorsturen naar iDEAL via de Netlify-functie.

   De agenda is de boekingspagina van Cal.com in een iframe; die kent de vrije
   momenten en zet de afspraak in de gekoppelde Google- of Outlook-agenda. Bij
   beeldbellen voegt Cal.com de Google Meet- of Zoom-link toe aan de uitnodiging.

   CAL_USER is je Cal.com-gebruikersnaam; de slugs hieronder moeten exact
   overeenkomen met de event types die je in Cal.com hebt aangemaakt.         */

(function () {
  var CAL_USER = "edward-hillenaar-pjpiso";
  var TYPES = {
    intro:    { slug: "kennismaking-20",  pay: false },
    intake:   { slug: "intake-60",        pay: true  },
    session:  { slug: "sessie-60",        pay: true  },
    callback: { slug: "terugbelverzoek",  pay: false }
  };

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var root = document.getElementById("booking");
    if (!root) return;

    var chosen = null;
    var mode = "";
    var calBox = root.querySelector("[data-cal-box]");
    var payBox = root.querySelector("[data-pay-box]");
    var modeBox = root.querySelector("[data-mode-box]");
    var steps = root.querySelectorAll("[data-step]");
    var freeNotes = root.querySelectorAll("[data-free-note]");

    function show(el, on) { if (el) el.style.display = on ? "" : "none"; }

    // alleen stap 1 zichtbaar tot er een type gekozen is
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].getAttribute("data-step") !== "1") show(steps[i], false);
    }

    function mountCal(slug) {
      if (!calBox) return;
      calBox.innerHTML = "";

      var url = "https://cal.com/" + CAL_USER + "/" + slug +
                "?embed=true&layout=month_view&theme=light";

      var frame = document.createElement("iframe");
      frame.src = url;
      frame.title = "Agenda";
      frame.loading = "lazy";
      frame.setAttribute("allow", "camera; microphone; clipboard-write");
      frame.style.width = "100%";
      frame.style.minHeight = "660px";
      frame.style.border = "0";
      frame.style.display = "block";
      calBox.appendChild(frame);

      var alt = document.createElement("p");
      alt.className = "bk-note";
      alt.innerHTML = 'Agenda niet zichtbaar? <a href="https://cal.com/' +
        CAL_USER + "/" + slug + '" target="_blank" rel="noopener">' +
        'Open de agenda in een nieuw tabblad</a>.';
      calBox.appendChild(alt);
    }

    var typeBtns = root.querySelectorAll("[data-type]");
    for (var j = 0; j < typeBtns.length; j++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          for (var k = 0; k < typeBtns.length; k++) typeBtns[k].classList.remove("chosen");
          btn.classList.add("chosen");
          chosen = btn.getAttribute("data-type");
          var cfg = TYPES[chosen];
          if (!cfg) return;
          mode = "";

          if (modeBox) {
            modeBox.innerHTML = "";
            var modes = (btn.getAttribute("data-modes") || "").split("|");
            for (var m = 0; m < modes.length; m++) {
              if (!modes[m]) continue;
              (function (label, first) {
                var b = document.createElement("button");
                b.type = "button";
                b.className = "mode-btn" + (first ? " chosen" : "");
                b.textContent = label;
                b.addEventListener("click", function () {
                  var all = modeBox.querySelectorAll(".mode-btn");
                  for (var x = 0; x < all.length; x++) all[x].classList.remove("chosen");
                  b.classList.add("chosen");
                  mode = label;
                });
                modeBox.appendChild(b);
                if (first) mode = label;
              })(modes[m], m === 0);
            }
          }

          for (var s = 0; s < steps.length; s++) show(steps[s], true);
          show(payBox, cfg.pay);
          for (var n = 0; n < freeNotes.length; n++) show(freeNotes[n], !cfg.pay);

          mountCal(cfg.slug);
        });
      })(typeBtns[j]);
    }

    var payBtn = root.querySelector("[data-pay-btn]");
    if (payBtn) {
      payBtn.addEventListener("click", function () {
        if (!chosen || !TYPES[chosen] || !TYPES[chosen].pay) return;
        var q = function (sel) { var e = root.querySelector(sel); return e ? e.value : ""; };
        var name = q("[name='bk-name']"), email = q("[name='bk-email']");
        var status = root.querySelector("[data-pay-status]");

        if (!name.trim() || !/.+@.+\..+/.test(email)) {
          if (status) status.textContent = "Vul je naam en een geldig e-mailadres in.";
          return;
        }
        payBtn.disabled = true;
        if (status) status.textContent = "Betaling wordt aangemaakt…";

        fetch("/.netlify/functions/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: chosen, name: name, email: email,
            phone: q("[name='bk-phone']"), note: q("[name='bk-note']"), mode: mode
          })
        }).then(function (r) { return r.json(); }).then(function (data) {
          if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
          if (status) {
            status.textContent = data.error === "MOLLIE_API_KEY ontbreekt"
              ? "De betaalkoppeling is nog niet ingesteld. Neem contact op, dan sturen we een factuur."
              : "Er ging iets mis bij het aanmaken van de betaling. Probeer het opnieuw of neem contact op.";
          }
          payBtn.disabled = false;
        }).catch(function () {
          if (status) status.textContent = "Geen verbinding met de betaaldienst. Probeer het later opnieuw.";
          payBtn.disabled = false;
        });
      });
    }
  });
})();
