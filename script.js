(function () {
  var GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
  var STORAGE_KEY = "hawkoy_cookie_consent_v1";
  var analyticsLoaded = false;

  function initNavigation() {
    var toggle = document.getElementById("nav-toggle");
    var menu = document.querySelector(".mobile-menu");
    if (!toggle || !menu) return;

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) toggle.checked = false;
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") toggle.checked = false;
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) toggle.checked = false;
    });
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;

    function formatValue(value, suffix) {
      return value.toLocaleString("fi-FI") + (suffix || "");
    }

    function animateCounter(el) {
      if (el.dataset.done === "1") return;
      el.dataset.done = "1";

      var target = Number(el.dataset.target || 0);
      var suffix = el.dataset.suffix || "";
      var duration = 1500;
      var start = performance.now();

      function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);

        el.textContent = formatValue(value, suffix);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function initPortfolioModal() {
    var modal = document.getElementById("portfolio-modal");
    var modalImage = document.getElementById("portfolio-modal-image");
    var modalTitle = document.getElementById("portfolio-modal-title");
    var items = document.querySelectorAll(".portfolio-item");
    if (!modal || !modalImage || !modalTitle || !items.length) return;

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var full = item.getAttribute("data-full");
        var title = item.getAttribute("data-title") || "";
        var description = item.getAttribute("data-description") || title;
        if (!full) return;
        modalImage.src = full;
        modalImage.alt = title;
        modalTitle.textContent = description;
        modal.showModal();
      });
    });

    modal.addEventListener("click", function (event) {
      var rect = modal.getBoundingClientRect();
      var isInside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInside) modal.close();
    });
  }

  function getStoredConsent() {
    try {
      var value = localStorage.getItem(STORAGE_KEY);
      if (value === "accepted" || value === "rejected") return value;
    } catch (error) {
      return null;
    }
    return null;
  }

  function setStoredConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      return;
    }
  }

  function ensureGtagBase() {
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        dataLayer.push(arguments);
      };
    }
  }

  function loadGoogleAnalytics() {
    if (analyticsLoaded) return;
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") return;

    ensureGtagBase();
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 500
    });

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      anonymize_ip: true
    });

    analyticsLoaded = true;
  }

  function setAnalyticsConsent(granted) {
    if (granted) {
      loadGoogleAnalytics();
    }
    if (!window.gtag) return;

    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied"
    });
  }

  function clearAnalyticsCookies() {
    var names = document.cookie
      .split(";")
      .map(function (part) {
        return part.trim().split("=")[0];
      })
      .filter(function (name) {
        return name && name.indexOf("_ga") === 0;
      });

    if (!names.length) return;

    var host = window.location.hostname;
    var hostParts = host.split(".");
    var domains = [host, "." + host];

    if (hostParts.length > 2) {
      domains.push("." + hostParts.slice(hostParts.length - 2).join("."));
    }

    names.forEach(function (name) {
      domains.forEach(function (domain) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + domain + "; SameSite=Lax";
      });
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
    });
  }

  function createConsentUi() {
    var banner = document.createElement("section");
    banner.className = "cookie-consent";
    banner.setAttribute("aria-label", "Evästeasetukset");
    banner.hidden = true;
    banner.innerHTML =
      '<p>Käytämme vain analytiikkaevästeitä (Google Analytics) sivuston kehittämiseen. Lue lisää <a href="evasteet.html">evästekäytännöstä</a> ja <a href="tietosuoja.html">tietosuojaselosteesta</a>.</p>' +
      '<div class="cookie-consent-actions">' +
      '<button type="button" class="cookie-btn cookie-btn-accept" data-cookie-action="accept">Hyväksy analytiikkaevästeet</button>' +
      '<button type="button" class="cookie-btn" data-cookie-action="reject">Hylkää</button>' +
      '<button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="settings">Asetukset</button>' +
      "</div>";

    var dialog = document.createElement("dialog");
    dialog.className = "cookie-settings";
    dialog.setAttribute("aria-label", "Evästeasetukset");
    dialog.innerHTML =
      '<form method="dialog" class="cookie-settings-close-wrap">' +
      '<button type="submit" class="cookie-settings-close">Sulje</button>' +
      "</form>" +
      '<h2>Evästeasetukset</h2>' +
      '<p>Käytämme sivustolla vain Google Analytics -analytiikkaevästeitä. Voit hyväksyä tai perua suostumuksen milloin tahansa.</p>' +
      '<p class="cookie-consent-status" data-cookie-status></p>' +
      '<div class="cookie-consent-actions">' +
      '<button type="button" class="cookie-btn cookie-btn-accept" data-cookie-action="accept">Hyväksy</button>' +
      '<button type="button" class="cookie-btn" data-cookie-action="reject">Hylkää / Peru suostumus</button>' +
      "</div>";

    document.body.appendChild(banner);
    document.body.appendChild(dialog);

    return { banner: banner, dialog: dialog };
  }

  function updateStatusText(statusEl, consent) {
    if (!statusEl) return;

    if (consent === "accepted") {
      statusEl.textContent = "Nykyinen tila: analytiikkaevästeet hyväksytty.";
      return;
    }

    if (consent === "rejected") {
      statusEl.textContent = "Nykyinen tila: analytiikkaevästeet hylätty.";
      return;
    }

    statusEl.textContent = "Nykyinen tila: valintaa ei ole vielä tehty.";
  }

  function initCookieConsent() {
    var ui = createConsentUi();
    var banner = ui.banner;
    var dialog = ui.dialog;
    var statusEl = dialog.querySelector("[data-cookie-status]");

    function applyConsent(value) {
      setStoredConsent(value);
      updateStatusText(statusEl, value);
      banner.hidden = true;

      if (value === "accepted") {
        setAnalyticsConsent(true);
      } else {
        setAnalyticsConsent(false);
        clearAnalyticsCookies();
      }
    }

    function openSettings() {
      var consent = getStoredConsent();
      updateStatusText(statusEl, consent);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "open");
      }
    }

    document.addEventListener("click", function (event) {
      var settingsTrigger = event.target.closest("[data-open-cookie-settings]");
      if (settingsTrigger) {
        event.preventDefault();
        openSettings();
        return;
      }

      var actionTarget = event.target.closest("[data-cookie-action]");
      if (!actionTarget) return;

      var action = actionTarget.getAttribute("data-cookie-action");
      if (action === "accept") {
        applyConsent("accepted");
        if (dialog.open) dialog.close();
      } else if (action === "reject") {
        applyConsent("rejected");
        if (dialog.open) dialog.close();
      } else if (action === "settings") {
        openSettings();
      }
    });

    var consent = getStoredConsent();

    if (consent === "accepted") {
      updateStatusText(statusEl, consent);
      setAnalyticsConsent(true);
    } else if (consent === "rejected") {
      updateStatusText(statusEl, consent);
      setAnalyticsConsent(false);
      clearAnalyticsCookies();
    } else {
      banner.hidden = false;
      updateStatusText(statusEl, consent);
    }
  }

  function init() {
    initNavigation();
    initCounters();
    initPortfolioModal();
    initCookieConsent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
