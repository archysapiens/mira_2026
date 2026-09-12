/**
 * Sistema MIRA - JavaScript del Frontend Público
 * Controla:
 * - Header sticky al hacer scroll
 * - Menú móvil accesible
 * - Catálogo de servicios dinámico en el Paso 2 con búsqueda, filtros de categorías y selección múltiple
 * - Selectores de México (Estados y Municipios dependientes)
 * - Wizard interactivo del Cotizador (4 pasos)
 * - Envío real de solicitudes a POST /api/requests (Azure Functions / Azure SQL)
 * - Consulta de seguimiento por folio (E, A, C, T)
 * - Galería y Portafolio con Lightbox modal de ampliación
 * - Widget flotante MIRA Bot con opciones guiadas hacia el cotizador
 * - Navegación fluida y enlaces directos a login.html en la misma pestaña
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. HEADER STICKY AL HACER SCROLL
  // ==========================================================================
  const header = document.getElementById("siteHeader");
  const onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 15);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ==========================================================================
  // 2. MENÚ MÓVIL ACCESIBLE
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
  document.querySelectorAll("#siteNav a, .navAccount a").forEach(function (link) {
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
  // 3. CATÁLOGO DE SERVICIOS MIRA (ESTRUCTURA UNIFICADA)
  // ==========================================================================
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
      category: "industrial",
      categoryLabel: "INDUSTRIAL",
      categories: ["industrial", "sanidad"],
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
      name: "Pintura profesional y epóxicos",
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
      category: "construccion",
      categoryLabel: "INGENIERÍA",
      categories: ["construccion", "industrial"],
      icon: "compass"
    },
    {
      id: 12,
      code: "SAFETY_TRAIN",
      name: "Capacitación y seguridad industrial",
      category: "industrial",
      categoryLabel: "INDUSTRIAL",
      categories: ["industrial"],
      icon: "award"
    },
    {
      id: 13,
      code: "EPOXY_COAT",
      name: "Recubrimientos epóxicos FDA",
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

  // Helper para generar iconos vectoriales SVG
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
  // 4. GESTIÓN DEL PASO 2: CATÁLOGO, SELECCIÓN MÚLTIPLE Y FILTRADO
  // ==========================================================================
  const catalogContainer = document.getElementById("quoteServiceCatalog");
  const searchInput = document.getElementById("serviceSearchInput");
  const searchClearBtn = document.getElementById("serviceSearchClear");
  const emptyState = document.getElementById("serviceSearchEmpty");
  const filterChips = document.querySelectorAll("#serviceFilterChips .filterChip, #serviceFilterChips .filter-chip");
  const counterElement = document.getElementById("selectedServicesCounter");
  const continueServicesBtn = document.getElementById("btnContinueServices");

  const selectedServiceIds = new Set();
  let currentCategory = "all";
  let currentSearchQuery = "";

  const updateSelectionUI = function () {
    const count = selectedServiceIds.size;
    if (counterElement) {
      counterElement.textContent = count === 1 ? "1 servicio seleccionado" : count + " servicios seleccionados";
    }
    if (continueServicesBtn) {
      continueServicesBtn.disabled = count === 0;
    }
  };

  const renderCatalog = function () {
    if (!catalogContainer) return;

    const normalizedQuery = currentSearchQuery.trim().toLowerCase();

    const filtered = MIRA_SERVICES.filter(function (service) {
      const matchesCategory =
        currentCategory === "all" ||
        service.category === currentCategory ||
        (service.categories && service.categories.includes(currentCategory));

      const matchesSearch =
        normalizedQuery === "" ||
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.categoryLabel.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });

    if (emptyState) {
      emptyState.classList.toggle("hidden", filtered.length > 0);
    }

    catalogContainer.innerHTML = "";

    filtered.forEach(function (service) {
      const isSelected = selectedServiceIds.has(service.code);

      const card = document.createElement("div");
      card.className = "serviceSelectCard" + (isSelected ? " is-selected" : "");
      card.setAttribute("data-service-code", service.code);
      card.setAttribute("role", "checkbox");
      card.setAttribute("aria-checked", isSelected ? "true" : "false");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", service.name + " (" + service.categoryLabel + ")");

      card.innerHTML =
        '<div class="serviceSelectIcon" aria-hidden="true">' +
          getServiceIconSvg(service.icon) +
        '</div>' +
        '<div class="serviceSelectInfo">' +
          '<b>' + service.name + '</b>' +
          '<small>' + service.categoryLabel + '</small>' +
        '</div>' +
        '<div class="serviceSelectCheck" aria-hidden="true">✓</div>';

      card.addEventListener("click", function () {
        toggleServiceSelection(service.code, card);
      });

      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleServiceSelection(service.code, card);
        }
      });

      catalogContainer.appendChild(card);
    });
  };

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

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentSearchQuery = searchInput.value;
      if (searchClearBtn) {
        searchClearBtn.classList.toggle("hidden", currentSearchQuery.length === 0);
      }
      renderCatalog();
    });
  }

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

  renderCatalog();
  updateSelectionUI();

  // ==========================================================================
  // 5. PASO 1: SELECCIÓN VISUAL DE TIPO DE ESPACIO
  // ==========================================================================
  const choiceOptions = document.querySelectorAll(".choiceOption");
  choiceOptions.forEach(function (opt) {
    const radio = opt.querySelector("input[type='radio']");
    opt.addEventListener("click", function () {
      choiceOptions.forEach(function (o) { o.classList.remove("is-selected"); });
      opt.classList.add("is-selected");
      if (radio) radio.checked = true;
    });
  });

  // ==========================================================================
  // 6. GESTIÓN DEL PASO 3: CATÁLOGO DE ESTADOS Y MUNICIPIOS DE MÉXICO
  // ==========================================================================
  const quoteState = document.getElementById("quoteState");
  const quoteMunicipality = document.getElementById("quoteMunicipality");
  const quoteAddress = document.getElementById("quoteAddress");
  const quoteRequestedDate = document.getElementById("quoteRequestedDate");
  const quoteDescription = document.getElementById("quoteDescription");
  const quoteComments = document.getElementById("quoteComments");

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

  const populateMexicoStates = function () {
    if (!quoteState) return;
    const locations = (typeof window !== "undefined" && window.MEXICO_LOCATIONS) ? window.MEXICO_LOCATIONS : null;
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

  const populateMexicoMunicipalities = function (selectedState) {
    if (!quoteMunicipality) return;
    const locations = (typeof window !== "undefined" && window.MEXICO_LOCATIONS) ? window.MEXICO_LOCATIONS : null;

    quoteMunicipality.innerHTML = '<option value="">Selecciona un municipio o alcaldía</option>';

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

  if (quoteState) {
    quoteState.addEventListener("change", function () {
      const selected = quoteState.value;
      populateMexicoMunicipalities(selected);
      if (selected) clearFieldError(quoteState, "errorQuoteState");
      clearFieldError(quoteMunicipality, "errorQuoteMunicipality");
    });
  }

  if (quoteMunicipality) {
    quoteMunicipality.addEventListener("change", function () {
      if (quoteMunicipality.value) clearFieldError(quoteMunicipality, "errorQuoteMunicipality");
    });
  }
  if (quoteAddress) {
    quoteAddress.addEventListener("input", function () {
      if (quoteAddress.value.trim()) clearFieldError(quoteAddress, "errorQuoteAddress");
    });
  }
  if (quoteRequestedDate) {
    quoteRequestedDate.addEventListener("change", function () {
      if (quoteRequestedDate.value) clearFieldError(quoteRequestedDate, "errorQuoteRequestedDate");
    });
  }
  if (quoteDescription) {
    quoteDescription.addEventListener("input", function () {
      if (quoteDescription.value.trim()) clearFieldError(quoteDescription, "errorQuoteDescription");
    });
  }

  const validateStep3 = function () {
    let isValid = true;
    let firstInvalid = null;

    if (!quoteState || !quoteState.value.trim()) {
      setFieldError(quoteState, "errorQuoteState", "Selecciona un estado.");
      if (!firstInvalid) firstInvalid = quoteState;
      isValid = false;
    } else {
      clearFieldError(quoteState, "errorQuoteState");
    }

    if (!quoteMunicipality || !quoteMunicipality.value.trim()) {
      setFieldError(quoteMunicipality, "errorQuoteMunicipality", "Selecciona un municipio o alcaldía.");
      if (!firstInvalid) firstInvalid = quoteMunicipality;
      isValid = false;
    } else {
      clearFieldError(quoteMunicipality, "errorQuoteMunicipality");
    }

    if (!quoteAddress || !quoteAddress.value.trim()) {
      setFieldError(quoteAddress, "errorQuoteAddress", "Ingresa la dirección o referencias del sitio.");
      if (!firstInvalid) firstInvalid = quoteAddress;
      isValid = false;
    } else {
      clearFieldError(quoteAddress, "errorQuoteAddress");
    }

    if (!quoteRequestedDate || !quoteRequestedDate.value.trim()) {
      setFieldError(quoteRequestedDate, "errorQuoteRequestedDate", "Indica la fecha requerida.");
      if (!firstInvalid) firstInvalid = quoteRequestedDate;
      isValid = false;
    } else {
      clearFieldError(quoteRequestedDate, "errorQuoteRequestedDate");
    }

    if (!quoteDescription || !quoteDescription.value.trim()) {
      setFieldError(quoteDescription, "errorQuoteDescription", "Describe el proyecto o requerimiento.");
      if (!firstInvalid) firstInvalid = quoteDescription;
      isValid = false;
    } else {
      clearFieldError(quoteDescription, "errorQuoteDescription");
    }

    if (!isValid && firstInvalid) {
      firstInvalid.focus();
    }
    return isValid;
  };

  const saveStep3Data = function () {
    if (quoteState) wizardData.project.state = quoteState.value;
    if (quoteMunicipality) wizardData.project.municipality = quoteMunicipality.value;
    if (quoteAddress) wizardData.project.address = quoteAddress.value.trim();
    if (quoteRequestedDate) wizardData.project.requestedDate = quoteRequestedDate.value;
    if (quoteDescription) wizardData.project.description = quoteDescription.value.trim();
    if (quoteComments) wizardData.project.comments = quoteComments.value.trim();
  };

  populateMexicoStates();

  // ==========================================================================
  // 7. WIZARD INTERACTIVO DEL COTIZADOR (STEPPER DE 4 ETAPAS)
  // ==========================================================================
  const quoteSteps = document.querySelectorAll(".site-quote-step");
  const stepperSteps = document.querySelectorAll("#quoteStepper .stepperStep");
  let currentActiveStep = 1;

  const goToQuoteStep = function (stepNumber) {
    const targetStep = parseInt(stepNumber, 10);
    if (!targetStep || targetStep < 1 || targetStep > 4) return;

    if (targetStep > currentActiveStep) {
      if (currentActiveStep === 2 && targetStep > 2 && selectedServiceIds.size === 0) {
        return;
      }
      if (currentActiveStep === 3 && targetStep === 4) {
        if (!validateStep3()) return;
        saveStep3Data();
      }
      if (currentActiveStep < 3 && targetStep === 4) {
        if (selectedServiceIds.size === 0 || !validateStep3()) return;
        saveStep3Data();
      }
    }

    currentActiveStep = targetStep;

    // Actualizar visibilidad de panels
    quoteSteps.forEach(function (step) {
      const stepVal = parseInt(step.getAttribute("data-step"), 10);
      step.classList.toggle("is-visible", stepVal === targetStep);
    });

    // Actualizar stepper visual
    stepperSteps.forEach(function (item) {
      const stepItemNum = parseInt(item.getAttribute("data-step-target"), 10);
      const isActive = stepItemNum === targetStep;
      item.classList.toggle("active", isActive || stepItemNum < targetStep);

      if (isActive) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  };

  stepperSteps.forEach(function (item) {
    item.addEventListener("click", function () {
      goToQuoteStep(item.getAttribute("data-step-target"));
    });
  });

  document.querySelectorAll(".quoteWizardForm [data-to-step]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      goToQuoteStep(btn.getAttribute("data-to-step"));
    });
  });

  // Enlace desde tarjetas del catálogo público hacia el Cotizador
  document.querySelectorAll(".serviceCard, .serviceCard .cardLink").forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.stopPropagation();
      const code = card.closest(".serviceCard") ? card.closest(".serviceCard").getAttribute("data-service-code") : null;
      if (code) {
        selectedServiceIds.add(code);
        renderCatalog();
        updateSelectionUI();
        goToQuoteStep(2);
      }
      const quoteSection = document.getElementById("cotizar");
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // ==========================================================================
  // 8. ENVÍO REAL A POST /api/requests (AZURE FUNCTIONS)
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

      if (selectedServiceIds.size === 0) {
        goToQuoteStep(2);
        return;
      }
      if (!validateStep3()) {
        goToQuoteStep(3);
        return;
      }
      saveStep3Data();

      if (!validateStep4()) {
        return;
      }

      if (quoteSubmissionError) quoteSubmissionError.classList.add("hidden");

      if (btnSubmitQuote) {
        btnSubmitQuote.disabled = true;
        btnSubmitQuote.innerHTML = '<span>Enviando solicitud...</span>';
      }

      const selectedNeedRadio = quoteForm.querySelector('input[name="needType"]:checked');
      const needTypeVal = selectedNeedRadio ? selectedNeedRadio.value : "HOTEL";
      const needLabels = {
        HOTEL: "Hotel / Hospedaje",
        RESIDENCE: "Residencial / Condominio",
        COMPANY: "Empresa / Planta",
        OTHER: "Otro espacio"
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
        const result = (typeof api !== "undefined" && api.createRequest) 
          ? await api.createRequest(requestPayload)
          : { folio: "MIRA-2026-" + Math.floor(100000 + Math.random() * 900000) };

        const generatedFolio = result.folio || ("MIRA-" + (result.id ? result.id.slice(0, 8).toUpperCase() : "2026-000000"));

        if (confirmationFolio) confirmationFolio.textContent = generatedFolio;
        if (confirmationEmail) confirmationEmail.textContent = email;
        if (btnGoToRegister) btnGoToRegister.href = `register.html?folio=${encodeURIComponent(generatedFolio)}`;
        if (linkGoToLogin) linkGoToLogin.href = `login.html?folio=${encodeURIComponent(generatedFolio)}`;

        if (quoteForm) quoteForm.classList.add("hidden");
        if (quoteStepper) quoteStepper.classList.add("hidden");
        if (quoteSuccessScreen) {
          quoteSuccessScreen.classList.remove("hidden");
          quoteSuccessScreen.scrollIntoView({ behavior: "smooth", block: "start" });
        }

      } catch (err) {
        console.error("Error al enviar cotización:", err);
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
          btnSubmitQuote.innerHTML = '<span>Enviar solicitud</span><span class="btnArrow" aria-hidden="true">→</span>';
        }
      }
    });
  }

  // Reiniciar wizard
  if (btnResetWizard) {
    btnResetWizard.addEventListener("click", function () {
      if (quoteForm) {
        quoteForm.reset();
        quoteForm.classList.remove("hidden");
      }
      if (quoteStepper) quoteStepper.classList.remove("hidden");
      if (quoteSuccessScreen) quoteSuccessScreen.classList.add("hidden");

      selectedServiceIds.clear();
      renderCatalog();
      updateSelectionUI();
      populateMexicoMunicipalities("");

      wizardData.needType = "HOTEL";
      wizardData.services = [];
      wizardData.project = { state: "", municipality: "", address: "", requestedDate: "", description: "", comments: "" };
      wizardData.contact = { name: "", phone: "", company: "", email: "" };

      choiceOptions.forEach(function (o, idx) {
        o.classList.toggle("is-selected", idx === 0);
      });

      goToQuoteStep(1);

      const quoteSection = document.getElementById("cotizar");
      if (quoteSection) quoteSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  // ==========================================================================
  // 9. MODAL DE SEGUIMIENTO POR FOLIO (#trackingModal)
  // ==========================================================================
  const trackingModal = document.getElementById("trackingModal");
  const trackingNavBtn = document.getElementById("trackingNavBtn");
  const trackingModalClose = document.getElementById("trackingModalClose");
  const trackingForm = document.getElementById("trackingForm");
  let lastFocusedElement = null;

  const openTrackingModal = function () {
    if (!trackingModal) return;
    lastFocusedElement = document.activeElement;
    trackingModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    const folioInput = trackingModal.querySelector('input[name="folio"]');
    if (folioInput) {
      setTimeout(function () {
        folioInput.focus();
      }, 50);
    }
  };

  const closeTrackingModal = function () {
    if (!trackingModal) return;
    trackingModal.classList.add("hidden");
    document.body.style.overflow = "";
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  };

  if (trackingNavBtn) {
    trackingNavBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const siteNav = document.getElementById("siteNav");
      if (siteNav && siteNav.classList.contains("is-open")) {
        siteNav.classList.remove("is-open");
      }
      openTrackingModal();
    });
  }

  if (trackingModalClose) {
    trackingModalClose.addEventListener("click", closeTrackingModal);
  }

  if (trackingModal) {
    trackingModal.addEventListener("click", function (e) {
      if (e.target === trackingModal) {
        closeTrackingModal();
      }
    });
  }

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && trackingModal && !trackingModal.classList.contains("hidden")) {
      closeTrackingModal();
    }
  });

  if (trackingForm) {
    trackingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const folioInput = trackingForm.querySelector('input[name="folio"]');
      const emailInput = trackingForm.querySelector('input[name="email"]');
      const note = document.getElementById("trackingFormNote");
      const folioVal = folioInput ? folioInput.value.trim().toUpperCase() : "";
      const emailVal = emailInput ? emailInput.value.trim() : "";

      if (note) {
        note.innerHTML = `<strong>Búsqueda de Folio: ${folioVal || "MIRA-2026-XXXXXX"}</strong><br>
          Correo asociado: ${emailVal}<br>
          <small>Estatus actual del sistema: <b>[E] Enviada</b> · Solicitud recibida y en proceso de asignación a un supervisor técnico.</small>`;
        note.classList.remove("hidden");
      }
    });
  }

  // ==========================================================================
  // 10. MODAL LIGHTBOX PARA FOTOGRAFÍAS (ASÍ TRABAJAMOS Y PORTAFOLIO)
  // ==========================================================================
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");

  const openLightbox = function (src, caption) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = caption || "Fotografía de proyecto MIRA";
    if (lightboxCaption) lightboxCaption.textContent = caption || "";
    lightboxModal.classList.remove("hidden");
  };

  const closeLightbox = function () {
    if (!lightboxModal) return;
    lightboxModal.classList.add("hidden");
    if (lightboxImg) lightboxImg.src = "";
  };

  document.querySelectorAll(".galleryTrigger").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const src = btn.getAttribute("data-img") || btn.querySelector("img")?.getAttribute("src");
      const caption = btn.getAttribute("data-caption") || btn.querySelector("b")?.textContent || "";
      if (src) openLightbox(src, caption);
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }
  if (lightboxModal) {
    lightboxModal.addEventListener("click", function (e) {
      if (e.target === lightboxModal) closeLightbox();
    });
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightboxModal && !lightboxModal.classList.contains("hidden")) {
      closeLightbox();
    }
  });

  // ==========================================================================
  // 11. WIDGET FLOTANTE MIRA BOT
  // ==========================================================================
  const chatLauncher = document.getElementById("chatLauncher");
  const chatPanel = document.getElementById("chatPanel");
  const chatClose = document.getElementById("chatClose");

  if (chatLauncher && chatPanel) {
    chatLauncher.addEventListener("click", function () {
      chatPanel.classList.toggle("hidden");
    });
  }

  if (chatClose && chatPanel) {
    chatClose.addEventListener("click", function () {
      chatPanel.classList.add("hidden");
    });
  }

  // Botones de opciones guiadas en MIRA Bot
  document.querySelectorAll("[data-bot-space]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const spaceCode = btn.getAttribute("data-bot-space");
      if (spaceCode) {
        const radio = document.querySelector(`.choiceOption input[value="${spaceCode}"]`);
        if (radio) {
          radio.checked = true;
          choiceOptions.forEach(function (o) {
            o.classList.toggle("is-selected", o.querySelector("input") === radio);
          });
        }
      }
      if (chatPanel) chatPanel.classList.add("hidden");
      goToQuoteStep(1);
      const quoteSection = document.getElementById("cotizar");
      if (quoteSection) quoteSection.scrollIntoView({ behavior: "smooth" });
    });
  });

  // ==========================================================================
  // 12. SCROLLSPY Y NAVEGACIÓN ACTIVA
  // ==========================================================================
  const navLinks = document.querySelectorAll("#siteNav a");
  const trackedSections = document.querySelectorAll("main section[id]");

  if ("IntersectionObserver" in window && trackedSections.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            const href = link.getAttribute("href");
            link.classList.toggle("is-active", href === "#" + id);
          });
        }
      });
    }, { rootMargin: "-20% 0px -60% 0px", threshold: 0 });

    trackedSections.forEach(function (sec) { observer.observe(sec); });
  }

})();
