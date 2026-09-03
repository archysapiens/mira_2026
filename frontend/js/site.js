(function () {
  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  const year = document.getElementById("footerYear");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setMenuOpen = function (open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  };

  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
  }

  if (nav) {
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });
  }

  document.querySelectorAll(".site-faq-item button").forEach(function (button) {
    button.addEventListener("click", function () {
      const expanded = button.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".site-faq-item button").forEach(function (other) {
        other.setAttribute("aria-expanded", "false");
        const panel = document.getElementById(other.getAttribute("aria-controls"));
        if (panel) panel.hidden = true;
      });
      if (!expanded) {
        button.setAttribute("aria-expanded", "true");
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        if (panel) panel.hidden = false;
      }
    });
  });

  const showPreparedNote = function (form, noteId, message) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const note = document.getElementById(noteId);
      if (!note) return;
      note.textContent = message;
      note.classList.remove("hidden");
    });
  };

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    showPreparedNote(
      contactForm,
      "contactFormNote",
      "El formulario está listo. El envío se conectará a la API en una fase posterior; no se ha enviado ningún mensaje."
    );
  }

  const trackingForm = document.getElementById("trackingForm");
  if (trackingForm) {
    showPreparedNote(
      trackingForm,
      "trackingFormNote",
      "La consulta por folio se conectará a la API posteriormente. No se muestran resultados de demostración."
    );
  }
})();
