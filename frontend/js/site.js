/**
 * Sistema MIRA - JavaScript del Frontend Público (Landing Page One Page)
 * Controla: Scroll suave, header sticky, menú móvil accesible, acordeón FAQ,
 * catálogo de servicios en Paso 2 con búsqueda, filtros de categorías y selección múltiple,
 * navegación interactiva del funnel de cotización y año dinámico en footer.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. AÑO DINÁMICO EN EL FOOTER
  // ==========================================================================
  const footerYear = document.getElementById("footerYear");
  if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
  }

  // ==========================================================================
  // 2. HEADER STICKY AL HACER SCROLL
  // ==========================================================================
  const header = document.getElementById("siteHeader");
  const onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ==========================================================================
  // 3. MENÚ MÓVIL ACCESIBLE
  // ==========================================================================
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");

  const setMenuOpen = function (open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  };

  if (toggle) {
    toggle.addEventListener("click", function () {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isExpanded);
    });
  }

  // Cerrar menú móvil al hacer clic en cualquier enlace
  document.querySelectorAll(".site-nav a, .site-header-actions a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenuOpen(false);
    });
  });

  // Cerrar menú con tecla Escape
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && toggle && toggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  // ==========================================================================
  // 4. ACORDEÓN ACCESIBLE DE FAQ'S
  // ==========================================================================
  const faqButtons = document.querySelectorAll(".site-faq-item button");
  faqButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const targetPanelId = button.getAttribute("aria-controls");
      const targetPanel = document.getElementById(targetPanelId);

      // Colapsar otros items
      faqButtons.forEach(function (otherBtn) {
        if (otherBtn !== button) {
          otherBtn.setAttribute("aria-expanded", "false");
          const otherPanel = document.getElementById(otherBtn.getAttribute("aria-controls"));
          if (otherPanel) otherPanel.hidden = true;
        }
      });

      // Alternar item actual
      button.setAttribute("aria-expanded", isExpanded ? "false" : "true");
      if (targetPanel) {
        targetPanel.hidden = isExpanded;
      }
    });
  });

  // ==========================================================================
  // 5. CATÁLOGO DE SERVICIOS MIRA (ESTRUCTURA DE DATOS MODULAR)
  // ==========================================================================
  /**
   * Catálogo unificado de servicios MIRA.
   * En una fase posterior se sincronizará con GET /api/services.
   */
  const MIRA_SERVICES = [
    {
      id: 1,
      code: "SILOS_CLEAN",
      name: "Limpieza y sanitización de silos",
      category: "industrial",
      categoryLabel: "INDUSTRIAL",
      categories: ["industrial", "sanidad"],
      icon: "silo"
    },
    {
      id: 2,
      code: "SANITY_TECH",
      name: "Sanidad y limpieza técnica",
      category: "sanidad",
      categoryLabel: "SANIDAD",
      categories: ["sanidad", "industrial"],
      icon: "sparkles"
    },
    {
      id: 3,
      code: "METAL_STRUCT",
      name: "Estructuras metálicas y naves",
      category: "construccion",
      categoryLabel: "CONSTRUCCIÓN",
      categories: ["construccion", "industrial"],
      icon: "warehouse"
    },
    {
      id: 4,
      code: "HOTEL_SERV",
      name: "Servicios para hoteles",
      category: "comercial",
      categoryLabel: "COMERCIAL",
      categories: ["comercial", "mantenimiento"],
      icon: "building"
    },
    {
      id: 5,
      code: "RESID_SERV",
      name: "Servicios residenciales",
      category: "residencial",
      categoryLabel: "RESIDENCIAL",
      categories: ["residencial", "mantenimiento"],
      icon: "home"
    },
    {
      id: 6,
      code: "DRYWALL",
      name: "Tablaroca y acabados",
      category: "construccion",
      categoryLabel: "CONSTRUCCIÓN",
      categories: ["construccion", "comercial", "residencial"],
      icon: "layers"
    },
    {
      id: 7,
      code: "PAINTING",
      name: "Pintura profesional",
      category: "construccion",
      categoryLabel: "CONSTRUCCIÓN",
      categories: ["construccion", "industrial", "comercial", "residencial"],
      icon: "brush"
    },
    {
      id: 8,
      code: "ALUM_GLASS",
      name: "Aluminio y cristales",
      category: "construccion",
      categoryLabel: "CONSTRUCCIÓN",
      categories: ["construccion", "comercial", "residencial"],
      icon: "grid"
    },
    {
      id: 9,
      code: "CARP_IRON",
      name: "Carpintería y herrería",
      category: "construccion",
      categoryLabel: "CONSTRUCCIÓN",
      categories: ["construccion", "industrial", "comercial"],
      icon: "tool"
    },
    {
      id: 10,
      code: "PEST_CTRL",
      name: "Fumigación y control de plagas",
      category: "sanidad",
      categoryLabel: "SANIDAD",
      categories: ["sanidad", "comercial", "industrial", "residencial"],
      icon: "shield"
    },
    {
      id: 11,
      code: "DRO_PLANS",
      name: "Planos, cálculo y trámites DRO",
      category: "ingenieria",
      categoryLabel: "INGENIERÍA",
      categories: ["ingenieria", "construccion"],
      icon: "compass"
    },
    {
      id: 12,
      code: "SAFETY_TRAIN",
      name: "Capacitación y seguridad industrial",
      category: "industrial",
      categoryLabel: "INDUSTRIAL",
      categories: ["industrial", "ingenieria"],
      icon: "award"
    },
    {
      id: 13,
      code: "EPOXY_COAT",
      name: "Recubrimientos epóxicos",
      category: "industrial",
      categoryLabel: "INDUSTRIAL",
      categories: ["industrial", "construccion", "sanidad"],
      icon: "shield-check"
    },
    {
      id: 14,
      code: "ROOF_MAINT",
      name: "Mantenimiento de techos y cubiertas",
      category: "industrial",
      categoryLabel: "INDUSTRIAL",
      categories: ["industrial", "construccion"],
      icon: "umbrella"
    },
    {
      id: 15,
      code: "CISTERN_CLEAN",
      name: "Limpieza de cisternas y tanques",
      category: "sanidad",
      categoryLabel: "SANIDAD",
      categories: ["sanidad", "industrial", "comercial", "residencial"],
      icon: "droplet"
    }
  ];

  // Helper para generar iconos vectoriales SVG limpios
  const getServiceIconSvg = function (iconName) {
    switch (iconName) {
      case "silo":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M6 9h12"/><path d="M6 15h12"/><path d="M12 3v18"/></svg>';
      case "sparkles":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>';
      case "warehouse":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z"/><path d="M6 18h12v4H6z"/></svg>';
      case "building":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>';
      case "home":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
      case "layers":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
      case "brush":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c.5-3 1-5 4-7"/></svg>';
      case "grid":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
      case "tool":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
      case "shield":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
      case "compass":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>';
      case "award":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>';
      case "shield-check":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>';
      case "umbrella":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/></svg>';
      case "droplet":
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>';
      default:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';
    }
  };

  // ==========================================================================
  // 6. GESTIÓN DEL PASO 2: CATÁLOGO, SELECCIÓN MÚLTIPLE Y FILTRADO
  // ==========================================================================
  const catalogContainer = document.getElementById("quoteServiceCatalog");
  const searchInput = document.getElementById("serviceSearchInput");
  const searchClearBtn = document.getElementById("serviceSearchClear");
  const emptyState = document.getElementById("serviceSearchEmpty");
  const filterChips = document.querySelectorAll("#serviceFilterChips .filter-chip");
  const counterElement = document.getElementById("selectedServicesCounter");
  const continueServicesBtn = document.getElementById("btnContinueServices");

  // Conjunto de IDs seleccionados
  const selectedServiceIds = new Set();
  let currentCategory = "all";
  let currentSearchQuery = "";

  // Actualizar contador y estado del botón Continuar
  const updateSelectionUI = function () {
    const count = selectedServiceIds.size;
    if (counterElement) {
      counterElement.textContent = count === 1 ? "1 seleccionado" : count + " seleccionados";
    }
    if (continueServicesBtn) {
      continueServicesBtn.disabled = count === 0;
    }
  };

  // Renderizar tarjetas del catálogo
  const renderCatalog = function () {
    if (!catalogContainer) return;

    // Filtrar servicios
    const normalizedQuery = currentSearchQuery.trim().toLowerCase();

    const filtered = MIRA_SERVICES.filter(function (service) {
      // Filtro por categoría
      const matchesCategory =
        currentCategory === "all" ||
        service.category === currentCategory ||
        (service.categories && service.categories.includes(currentCategory));

      // Filtro por texto
      const matchesSearch =
        normalizedQuery === "" ||
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.categoryLabel.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });

    // Control del estado vacío
    if (emptyState) {
      emptyState.classList.toggle("hidden", filtered.length > 0);
    }

    // Generar HTML del catálogo
    catalogContainer.innerHTML = "";

    filtered.forEach(function (service) {
      const isSelected = selectedServiceIds.has(service.code);

      const card = document.createElement("div");
      card.className = "site-service-card" + (isSelected ? " is-selected" : "");
      card.setAttribute("data-service-code", service.code);
      card.setAttribute("role", "checkbox");
      card.setAttribute("aria-checked", isSelected ? "true" : "false");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", service.name + " (" + service.categoryLabel + ")");

      card.innerHTML =
        '<div class="site-service-card-left">' +
          '<div class="site-service-icon-wrap" aria-hidden="true">' +
            getServiceIconSvg(service.icon) +
          '</div>' +
          '<div class="site-service-info">' +
            '<span class="site-service-name" title="' + service.name + '">' + service.name + '</span>' +
            '<span class="site-service-tag">' + service.categoryLabel + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="site-service-check-indicator" aria-hidden="true">' +
          '<span class="icon-plus">+</span>' +
          '<svg class="icon-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' +
        '</div>';

      // Toggle al hacer clic
      card.addEventListener("click", function () {
        toggleServiceSelection(service.code, card);
      });

      // Accesibilidad por teclado (Enter / Espacio)
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleServiceSelection(service.code, card);
        }
      });

      catalogContainer.appendChild(card);
    });
  };

  // Alternar selección de un servicio
  const toggleServiceSelection = function (serviceCode, cardElement) {
    if (selectedServiceIds.has(serviceCode)) {
      selectedServiceIds.delete(serviceCode);
      if (cardElement) {
        cardElement.classList.remove("is-selected");
        cardElement.setAttribute("aria-checked", "false");
      }
    } else {
      selectedServiceIds.add(serviceCode);
      if (cardElement) {
        cardElement.classList.add("is-selected");
        cardElement.setAttribute("aria-checked", "true");
      }
    }
    updateSelectionUI();
  };

  // Listener del buscador
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentSearchQuery = searchInput.value;
      if (searchClearBtn) {
        searchClearBtn.classList.toggle("hidden", currentSearchQuery.length === 0);
      }
      renderCatalog();
    });
  }

  // Limpiar buscador
  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", function () {
      if (searchInput) {
        searchInput.value = "";
        currentSearchQuery = "";
        searchClearBtn.classList.add("hidden");
        renderCatalog();
        searchInput.focus();
      }
    });
  }

  // Listeners de los chips de categoría
  filterChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      filterChips.forEach(function (c) {
        c.classList.remove("is-active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      currentCategory = chip.getAttribute("data-category") || "all";
      renderCatalog();
    });
  });

  // Inicializar catálogo y UI
  renderCatalog();
  updateSelectionUI();

  // ==========================================================================
  // 7. GESTIÓN DEL PASO 3: CATÁLOGO DE ESTADOS Y MUNICIPIOS DE MÉXICO
  // ==========================================================================
  const quoteState = document.getElementById("quoteState");
  const quoteMunicipality = document.getElementById("quoteMunicipality");
  const quoteAddress = document.getElementById("quoteAddress");
  const quoteRequestedDate = document.getElementById("quoteRequestedDate");
  const quoteDescription = document.getElementById("quoteDescription");
  const quoteComments = document.getElementById("quoteComments");

  // Estructura en memoria para conservar los datos del wizard preparados para la API
  const wizardData = {
    needType: "HOTEL",
    services: [],
    project: {
      state: "",
      municipality: "",
      address: "",
      requestedDate: "",
      description: "",
      comments: ""
    },
    contact: {
      name: "",
      phone: "",
      company: "",
      email: ""
    }
  };

  // Helper para errores visuales de campos
  const setFieldError = function (inputEl, errorElId, message) {
    if (!inputEl) return;
    inputEl.classList.add("is-invalid");
    const errSpan = document.getElementById(errorElId);
    if (errSpan) {
      errSpan.textContent = message;
      errSpan.classList.add("is-visible");
    }
  };

  const clearFieldError = function (inputEl, errorElId) {
    if (!inputEl) return;
    inputEl.classList.remove("is-invalid");
    const errSpan = document.getElementById(errorElId);
    if (errSpan) {
      errSpan.textContent = "";
      errSpan.classList.remove("is-visible");
    }
  };

  // Poblar estados de México
  const populateMexicoStates = function () {
    if (!quoteState) return;
    const locations = (typeof window !== "undefined" && window.MEXICO_LOCATIONS) ? window.MEXICO_LOCATIONS : (typeof MEXICO_LOCATIONS !== "undefined" ? MEXICO_LOCATIONS : null);
    if (!locations) return;

    quoteState.innerHTML = '<option value="">Selecciona un estado</option>';
    const stateNames = Object.keys(locations).sort(function (a, b) {
      return a.localeCompare(b, "es", { sensitivity: "base" });
    });

    stateNames.forEach(function (state) {
      const opt = document.createElement("option");
      opt.value = state;
      opt.textContent = state;
      quoteState.appendChild(opt);
    });
  };

  // Poblar municipios dependientes
  const populateMexicoMunicipalities = function (selectedState) {
    if (!quoteMunicipality) return;
    const locations = (typeof window !== "undefined" && window.MEXICO_LOCATIONS) ? window.MEXICO_LOCATIONS : (typeof MEXICO_LOCATIONS !== "undefined" ? MEXICO_LOCATIONS : null);

    quoteMunicipality.innerHTML = '<option value="">Selecciona un municipio</option>';

    if (selectedState && locations && locations[selectedState]) {
      quoteMunicipality.disabled = false;
      const munis = locations[selectedState].slice().sort(function (a, b) {
        return a.localeCompare(b, "es", { sensitivity: "base" });
      });

      munis.forEach(function (muni) {
        const opt = document.createElement("option");
        opt.value = muni;
        opt.textContent = muni;
        quoteMunicipality.appendChild(opt);
      });
    } else {
      quoteMunicipality.disabled = true;
      quoteMunicipality.value = "";
    }
  };

  // Event Listeners para cambios en Paso 3
  if (quoteState) {
    quoteState.addEventListener("change", function () {
      const selected = quoteState.value;
      populateMexicoMunicipalities(selected);
      if (selected) {
        clearFieldError(quoteState, "errorQuoteState");
      }
      clearFieldError(quoteMunicipality, "errorQuoteMunicipality");
    });
  }

  if (quoteMunicipality) {
    quoteMunicipality.addEventListener("change", function () {
      if (quoteMunicipality.value) {
        clearFieldError(quoteMunicipality, "errorQuoteMunicipality");
      }
    });
  }

  if (quoteAddress) {
    quoteAddress.addEventListener("input", function () {
      if (quoteAddress.value.trim()) {
        clearFieldError(quoteAddress, "errorQuoteAddress");
      }
    });
  }

  if (quoteRequestedDate) {
    quoteRequestedDate.addEventListener("change", function () {
      if (quoteRequestedDate.value) {
        clearFieldError(quoteRequestedDate, "errorQuoteRequestedDate");
      }
    });
  }

  if (quoteDescription) {
    quoteDescription.addEventListener("input", function () {
      if (quoteDescription.value.trim()) {
        clearFieldError(quoteDescription, "errorQuoteDescription");
      }
    });
  }

  // Validación completa del Paso 3
  const validateStep3 = function () {
    let isValid = true;
    let firstInvalidElement = null;

    if (!quoteState || !quoteState.value.trim()) {
      setFieldError(quoteState, "errorQuoteState", "Selecciona un estado de la lista.");
      if (!firstInvalidElement) firstInvalidElement = quoteState;
      isValid = false;
    } else {
      clearFieldError(quoteState, "errorQuoteState");
    }

    if (!quoteMunicipality || !quoteMunicipality.value.trim()) {
      setFieldError(quoteMunicipality, "errorQuoteMunicipality", "Selecciona un municipio o alcaldía.");
      if (!firstInvalidElement) firstInvalidElement = quoteMunicipality;
      isValid = false;
    } else {
      clearFieldError(quoteMunicipality, "errorQuoteMunicipality");
    }

    if (!quoteAddress || !quoteAddress.value.trim()) {
      setFieldError(quoteAddress, "errorQuoteAddress", "Ingresa la dirección o referencias de acceso.");
      if (!firstInvalidElement) firstInvalidElement = quoteAddress;
      isValid = false;
    } else {
      clearFieldError(quoteAddress, "errorQuoteAddress");
    }

    if (!quoteRequestedDate || !quoteRequestedDate.value.trim()) {
      setFieldError(quoteRequestedDate, "errorQuoteRequestedDate", "Indica la fecha estimada requerida.");
      if (!firstInvalidElement) firstInvalidElement = quoteRequestedDate;
      isValid = false;
    } else {
      clearFieldError(quoteRequestedDate, "errorQuoteRequestedDate");
    }

    if (!quoteDescription || !quoteDescription.value.trim()) {
      setFieldError(quoteDescription, "errorQuoteDescription", "Describe detalladamente la necesidad.");
      if (!firstInvalidElement) firstInvalidElement = quoteDescription;
      isValid = false;
    } else {
      clearFieldError(quoteDescription, "errorQuoteDescription");
    }

    if (!isValid && firstInvalidElement) {
      firstInvalidElement.focus();
    }

    return isValid;
  };

  // Guardar datos del Paso 3 en la estructura en memoria
  const saveStep3Data = function () {
    if (quoteState) wizardData.project.state = quoteState.value;
    if (quoteMunicipality) wizardData.project.municipality = quoteMunicipality.value;
    if (quoteAddress) wizardData.project.address = quoteAddress.value.trim();
    if (quoteRequestedDate) wizardData.project.requestedDate = quoteRequestedDate.value;
    if (quoteDescription) wizardData.project.description = quoteDescription.value.trim();
    if (quoteComments) wizardData.project.comments = quoteComments.value.trim();
  };

  // Inicializar selectores de ubicación
  populateMexicoStates();

  // ==========================================================================
  // 8. WIZARD INTERACTIVO DEL COTIZADOR (STEPPER DE 4 ETAPAS)
  // ==========================================================================
  const quoteSteps = document.querySelectorAll(".site-quote-step");
  const stepperItems = document.querySelectorAll(".site-stepper-item");
  const stepperLines = document.querySelectorAll(".site-stepper-line");
  let currentActiveStep = 1;

  const goToQuoteStep = function (stepNumber) {
    const targetStep = parseInt(stepNumber, 10);
    if (!targetStep || targetStep < 1 || targetStep > 4) return;

    // Validaciones al intentar avanzar
    if (targetStep > currentActiveStep) {
      // De Paso 1 o 2 hacia adelante: verificar selección de servicios
      if (currentActiveStep === 2 && targetStep > 2 && selectedServiceIds.size === 0) {
        return;
      }
      // De Paso 3 hacia Paso 4: validar obligatoriedad de campos
      if (currentActiveStep === 3 && targetStep === 4) {
        if (!validateStep3()) {
          return;
        }
        saveStep3Data();
      }
      // Si intentan saltar directo a Paso 4 desde Paso 1 o 2: validar paso 2 y paso 3
      if (currentActiveStep < 3 && targetStep === 4) {
        if (selectedServiceIds.size === 0 || !validateStep3()) {
          return;
        }
        saveStep3Data();
      }
    }

    currentActiveStep = targetStep;

    // 1. Actualizar visibilidad de fieldsets
    quoteSteps.forEach(function (step) {
      const currentStep = parseInt(step.getAttribute("data-step"), 10);
      step.classList.toggle("is-visible", currentStep === targetStep);
    });

    // 2. Actualizar estados del stepper
    stepperItems.forEach(function (item) {
      const stepItemNum = parseInt(item.getAttribute("data-step-target"), 10);
      const isCompleted = stepItemNum < targetStep;
      const isActive = stepItemNum === targetStep;

      item.classList.toggle("is-completed", isCompleted);
      item.classList.toggle("is-active", isActive);

      if (isActive) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    // 3. Actualizar líneas conectoras del stepper
    stepperLines.forEach(function (line, index) {
      const isLineActive = index < targetStep - 1;
      line.classList.toggle("is-active", isLineActive);
    });
  };

  // Clic en los items del stepper
  stepperItems.forEach(function (item) {
    item.addEventListener("click", function () {
      goToQuoteStep(item.getAttribute("data-step-target"));
    });

    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToQuoteStep(item.getAttribute("data-step-target"));
      }
    });
  });

  // Clic en botones "Continuar" / "Atrás"
  document.querySelectorAll(".site-wizard-form [data-to-step]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      goToQuoteStep(btn.getAttribute("data-to-step"));
    });
  });

  // Enlace desde tarjetas de Servicios de la Landing hacia el Cotizador
  document.querySelectorAll(".site-card .site-card-cta, .site-services-grid .site-card").forEach(function (el) {
    el.addEventListener("click", function () {
      const quoteSection = document.getElementById("cotizar");
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // ==========================================================================
  // 9. MANEJO DE FORMULARIOS Y ENVÍO A POST /api/requests
  // ==========================================================================
  const quoteForm = document.getElementById("quoteForm");
  const quoteContactName = document.getElementById("quoteContactName");
  const quoteContactPhone = document.getElementById("quoteContactPhone");
  const quoteContactCompany = document.getElementById("quoteContactCompany");
  const quoteContactEmail = document.getElementById("quoteContactEmail");
  const btnSubmitQuote = document.getElementById("btnSubmitQuote");
  const quoteSubmissionError = document.getElementById("quoteSubmissionError");
  const quoteSubmissionErrorMsg = document.getElementById("quoteSubmissionErrorMsg");
  const quoteSuccessScreen = document.getElementById("quoteSuccessScreen");
  const quoteStepper = document.getElementById("quoteStepper");
  const confirmationFolio = document.getElementById("confirmationFolio");
  const confirmationEmail = document.getElementById("confirmationEmail");
  const btnGoToRegister = document.getElementById("btnGoToRegister");
  const linkGoToLogin = document.getElementById("linkGoToLogin");
  const btnResetWizard = document.getElementById("btnResetWizard");

  // Limpiar errores inline de contacto al escribir
  if (quoteContactName) {
    quoteContactName.addEventListener("input", function () {
      if (quoteContactName.value.trim()) clearFieldError(quoteContactName, "errorContactName");
      if (quoteSubmissionError) quoteSubmissionError.classList.add("hidden");
    });
  }
  if (quoteContactPhone) {
    quoteContactPhone.addEventListener("input", function () {
      if (quoteContactPhone.value.trim()) clearFieldError(quoteContactPhone, "errorContactPhone");
      if (quoteSubmissionError) quoteSubmissionError.classList.add("hidden");
    });
  }
  if (quoteContactEmail) {
    quoteContactEmail.addEventListener("input", function () {
      if (quoteContactEmail.value.trim()) clearFieldError(quoteContactEmail, "errorContactEmail");
      if (quoteSubmissionError) quoteSubmissionError.classList.add("hidden");
    });
  }

  // Validación de Paso 4
  const validateStep4 = function () {
    let isValid = true;
    let firstInvalid = null;

    const nameVal = quoteContactName ? quoteContactName.value.trim() : "";
    const phoneVal = quoteContactPhone ? quoteContactPhone.value.trim() : "";
    const emailVal = quoteContactEmail ? quoteContactEmail.value.trim() : "";

    if (!nameVal) {
      setFieldError(quoteContactName, "errorContactName", "Ingresa tu nombre completo.");
      if (!firstInvalid) firstInvalid = quoteContactName;
      isValid = false;
    } else {
      clearFieldError(quoteContactName, "errorContactName");
    }

    if (!phoneVal) {
      setFieldError(quoteContactPhone, "errorContactPhone", "Ingresa un número telefónico de contacto.");
      if (!firstInvalid) firstInvalid = quoteContactPhone;
      isValid = false;
    } else {
      clearFieldError(quoteContactPhone, "errorContactPhone");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      setFieldError(quoteContactEmail, "errorContactEmail", "Ingresa un correo electrónico válido.");
      if (!firstInvalid) firstInvalid = quoteContactEmail;
      isValid = false;
    } else {
      clearFieldError(quoteContactEmail, "errorContactEmail");
    }

    if (!isValid && firstInvalid) {
      firstInvalid.focus();
    }

    return isValid;
  };

  if (quoteForm) {
    quoteForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Validar pasos previos si no se han completado
      if (selectedServiceIds.size === 0) {
        goToQuoteStep(2);
        return;
      }
      if (!validateStep3()) {
        goToQuoteStep(3);
        return;
      }
      saveStep3Data();

      // Validar paso 4
      if (!validateStep4()) {
        return;
      }

      if (quoteSubmissionError) quoteSubmissionError.classList.add("hidden");

      // Bloquear botón contra doble envío y mostrar estado de carga
      if (btnSubmitQuote) {
        btnSubmitQuote.disabled = true;
        btnSubmitQuote.innerHTML = '<span>Enviando solicitud...</span><svg class="site-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"/></svg>';
      }

      const selectedNeedRadio = quoteForm.querySelector('input[name="needType"]:checked');
      const needTypeVal = selectedNeedRadio ? selectedNeedRadio.value : "HOTEL";
      const needLabels = {
        HOTEL: "Servicios para Hoteles",
        INDUSTRIA: "Mantenimiento Industrial",
        COMERCIO: "Comercial / Corporativo",
        RESIDENCIA: "Servicios Residenciales"
      };

      const stateVal = wizardData.project.state || (quoteState ? quoteState.value : "");
      const muniVal = wizardData.project.municipality || (quoteMunicipality ? quoteMunicipality.value : "");
      const addressVal = wizardData.project.address || (quoteAddress ? quoteAddress.value.trim() : "");
      const locParts = [stateVal, muniVal, addressVal].filter(Boolean);
      const locationStr = locParts.length > 0 ? locParts.join(" - ") : "No especificada";

      const contactName = quoteContactName ? quoteContactName.value.trim() : "";
      const email = quoteContactEmail ? quoteContactEmail.value.trim() : "";
      const phone = quoteContactPhone ? quoteContactPhone.value.trim() : "";
      const company = quoteContactCompany ? quoteContactCompany.value.trim() : "";
      const requestedDate = wizardData.project.requestedDate || (quoteRequestedDate ? quoteRequestedDate.value : "");
      const description = wizardData.project.description || (quoteDescription ? quoteDescription.value.trim() : "");
      const comments = wizardData.project.comments || (quoteComments ? quoteComments.value.trim() : "");

      const requestPayload = {
        contactName: contactName,
        email: email,
        phone: phone,
        company: company,
        needType: needTypeVal,
        need: needLabels[needTypeVal] || needTypeVal,
        serviceIds: Array.from(selectedServiceIds),
        state: stateVal,
        municipality: muniVal,
        address: addressVal,
        location: locationStr,
        requestedDate: requestedDate,
        description: description,
        comments: comments,
        source: "WEB"
      };

      try {
        const result = await api.createRequest(requestPayload);
        const generatedFolio = result.folio || ("MIRA-" + (result.id ? result.id.slice(0, 8).toUpperCase() : "2026-000000"));

        if (confirmationFolio) {
          confirmationFolio.textContent = generatedFolio;
        }
        if (confirmationEmail) {
          confirmationEmail.textContent = email;
        }
        if (btnGoToRegister) {
          btnGoToRegister.href = `register.html?folio=${encodeURIComponent(generatedFolio)}`;
        }
        if (linkGoToLogin) {
          linkGoToLogin.href = `login.html?folio=${encodeURIComponent(generatedFolio)}`;
        }

        // Ocultar formulario y stepper, mostrar pantalla de confirmación
        if (quoteForm) quoteForm.classList.add("hidden");
        if (quoteStepper) quoteStepper.classList.add("hidden");
        if (quoteSuccessScreen) {
          quoteSuccessScreen.classList.remove("hidden");
          quoteSuccessScreen.scrollIntoView({ behavior: "smooth", block: "start" });
        }

      } catch (err) {
        console.error("Error al enviar solicitud:", err);
        if (quoteSubmissionError) {
          if (quoteSubmissionErrorMsg) {
            quoteSubmissionErrorMsg.textContent = err.message || "Tus datos permanecen en el formulario. Intenta nuevamente.";
          }
          quoteSubmissionError.classList.remove("hidden");
          quoteSubmissionError.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } finally {
        if (btnSubmitQuote) {
          btnSubmitQuote.disabled = false;
          btnSubmitQuote.innerHTML = '<span>Enviar solicitud</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
        }
      }
    });
  }

  // Botón "Volver al inicio" en pantalla de éxito
  if (btnResetWizard) {
    btnResetWizard.addEventListener("click", function () {
      if (quoteForm) {
        quoteForm.reset();
        quoteForm.classList.remove("hidden");
      }
      if (quoteStepper) {
        quoteStepper.classList.remove("hidden");
      }
      if (quoteSuccessScreen) {
        quoteSuccessScreen.classList.add("hidden");
      }

      selectedServiceIds.clear();
      renderCatalog();
      updateSelectionUI();
      populateMexicoMunicipalities("");

      wizardData.needType = "HOTEL";
      wizardData.services = [];
      wizardData.project = { state: "", municipality: "", address: "", requestedDate: "", description: "", comments: "" };
      wizardData.contact = { name: "", phone: "", company: "", email: "" };

      goToQuoteStep(1);

      const quoteSection = document.getElementById("cotizar");
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const note = document.getElementById("contactFormNote");
      if (note) {
        note.textContent = "Mensaje preparado. El formulario está listo para enlazarse a la API de contacto; ningún dato ha sido enviado al servidor.";
        note.classList.remove("hidden");
      }
    });
  }

  const trackingForm = document.getElementById("trackingForm");
  if (trackingForm) {
    trackingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const note = document.getElementById("trackingFormNote");
      if (note) {
        note.textContent = "Consulta registrada en interfaz. La búsqueda en vivo de folios se conectará al endpoint correspondiente sin simular datos ficticios.";
        note.classList.remove("hidden");
      }
    });
  }

  // ==========================================================================
  // 10. SCROLLSPY PARA MENÚ DE NAVEGACIÓN
  // ==========================================================================
  const navLinks = document.querySelectorAll(".site-nav-link");
  const sections = document.querySelectorAll("main section[id]");

  if ("IntersectionObserver" in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            const href = link.getAttribute("href");
            if (href === "#" + currentId) {
              link.classList.add("is-active");
            } else {
              link.classList.remove("is-active");
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(function (sec) {
      sectionObserver.observe(sec);
    });
  }
})();
