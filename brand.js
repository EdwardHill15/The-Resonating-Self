/* Language switch for a single-render bilingual Quarto site.
   Dutch pages live at /, English pages at /en/. This script
   1) injects an NL | EN toggle into the navbar, pointing at the counterpart page
   2) translates the navbar labels + hrefs when the visitor is inside /en/ */

(function () {
  var EN_LABEL = {
    "Home": "Home", "RTC": "RTC", "Therapie": "Therapy", "Suite": "Suite", "Blog": "Blog",
    "Afspraak": "Booking",
    "MBMR — bewegingstherapie": "MBMR — movement therapy",
    "STM — hersynchroniserende methode": "STM — re-synchronising method",
    "Onderzoek": "Research", "Publicaties": "Publications",
    "Over": "About", "Contact": "Contact"
  };

  function base() {
    // path of the site root, with trailing slash
    var link = document.querySelector('link[rel="canonical"]');
    return "/";
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  // Nederlandse bestandsnaam -> Engelse tegenhanger (waar die verschilt)
  var PAGE_MAP = { "afspraak": "booking", "betaling-gelukt": "payment-received", "bedankt": "thanks" };
  var PAGE_MAP_BACK = {};
  for (var k in PAGE_MAP) PAGE_MAP_BACK[PAGE_MAP[k]] = k;

  function swapName(p, map) {
    return p.replace(/([^\/]+?)(\.html)?$/, function (m, base, ext) {
      return (map[base] || base) + (ext || "");
    });
  }

  ready(function () {
    var path = window.location.pathname;
    var isEn = /(^|\/)en\//.test(path) || /\/en$/.test(path);

    // counterpart URL
    var nlPath, enPath;
    if (isEn) {
      nlPath = swapName(path.replace(/(^|\/)en\//, "$1").replace(/\/en$/, "/"), PAGE_MAP_BACK);
      enPath = path;
    } else {
      nlPath = path;
      enPath = swapName(path.replace(/^\//, "/en/"), PAGE_MAP);
      if (enPath === "/en/") enPath = "/en/index.html";
    }

    var nav = document.querySelector(".navbar-nav.navbar-nav-scroll.ms-auto") ||
              document.querySelector(".navbar .navbar-nav:last-of-type") ||
              document.querySelector(".navbar-nav");
    if (nav) {
      var box = document.createElement("div");
      box.className = "lang-switch";
      box.innerHTML =
        '<a href="' + nlPath + '"' + (isEn ? "" : ' aria-current="true"') + '>NL</a>' +
        '<a href="' + enPath + '"' + (isEn ? ' aria-current="true"' : "") + '>EN</a>';
      nav.parentNode.insertBefore(box, nav.nextSibling);
    }

    if (!isEn) return;

    // inside /en/: relabel the navbar and repoint it at the English pages
    document.querySelectorAll(".navbar .nav-link, .navbar .dropdown-item").forEach(function (a) {
      var txt = a.textContent.trim();
      if (EN_LABEL[txt]) a.textContent = EN_LABEL[txt];
      var href = a.getAttribute("href");
      if (href && !/^https?:/.test(href) && !/(^|\/)en\//.test(href)) {
        a.setAttribute("href", href.replace(/^(\.\/)?/, "").replace(/^\//, ""));
      }
    });
    document.documentElement.setAttribute("lang", "en");
  });
})();
