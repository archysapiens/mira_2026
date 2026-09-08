/**
 * Sistema MIRA - Controlador del Portal Operativo (operador.js)
 * Rediseño SaaS con alta fidelidad visual al mockup aprobado.
 * Exclusivo para usuarios autenticados con rol OPERATOR.
 */

(function (window) {
  'use strict';

  // 1. Proteger acceso: Solo rol OPERATOR
  const session = window.protectPage("OPERATOR");
  if (!session) return;

  // Estado local
  let allRequests = [];
  let filteredRequests = [];
  let selectedRequestId = null;

  // Utilidad para escapar HTML y prevenir XSS
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Utilidad para formatear fechas
  function formatDate(isoStr) {
    if (!isoStr) return "Fecha no especificada";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return isoStr;
    }
  }

  // Extraer fecha requerida de la descripción si existe
  function extractRequestedDate(desc) {
    if (!desc) return null;
    const match = desc.match(/Fecha requerida:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  }

  // 2. Inicializar identidad en Header y Perfil
  function initHeaderIdentity() {
    const rawName = session.name || session.fullName || "Operador";
    const firstName = rawName.split(" ")[0];
    const initials = PortalCommon.getInitials(rawName);

    // Header
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");
    const greetingName = document.getElementById("operatorGreetingName");

    if (userAvatar) userAvatar.textContent = initials;
    if (userName) userName.textContent = rawName;
    if (greetingName) greetingName.textContent = firstName;

    // Perfil
    const profileBigAvatar = document.getElementById("profileBigAvatar");
    const profileFullName = document.getElementById("profileFullName");
    const profileRowName = document.getElementById("profileRowName");
    const profileRowEmail = document.getElementById("profileRowEmail");

    if (profileBigAvatar) profileBigAvatar.textContent = initials;
    if (profileFullName) profileFullName.textContent = rawName;
    if (profileRowName) profileRowName.textContent = rawName;
    if (profileRowEmail) profileRowEmail.textContent = session.email || "operador@mira.com";

    // Botón Logout
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        auth.logout();
      });
    }

    // Fecha actual en la card "Mi jornada de hoy"
    const todayLabel = document.getElementById("todayDateLabel");
    if (todayLabel) {
      const today = new Date();
      const options = { day: "2-digit", month: "long", year: "numeric" };
      todayLabel.textContent = today.toLocaleDateString("es-MX", options);
    }
  }

  // 3. Menú Drawer Móvil
  function initMobileDrawer() {
    const toggleBtn = document.getElementById("btnToggleDrawer");
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    if (!toggleBtn || !sidebar || !backdrop) return;

    function openDrawer() {
      sidebar.classList.add("open");
      backdrop.classList.add("active");
    }

    function closeDrawer() {
      sidebar.classList.remove("open");
      backdrop.classList.remove("active");
    }

    toggleBtn.addEventListener("click", openDrawer);
    backdrop.addEventListener("click", closeDrawer);

    // Cerrar al navegar en móvil
    sidebar.querySelectorAll(".sidebar-link").forEach(btn => {
      btn.addEventListener("click", () => {
        if (window.innerWidth <= 900) closeDrawer();
      });
    });
  }

  // 4. Navegación por vistas SPA (summary, requests, profile)
  function initViewNavigation() {
    window.switchView = function (viewName) {
      const views = ["summary", "requests", "profile"];
      if (!views.includes(viewName)) return;

      views.forEach(name => {
        const panel = document.getElementById(name);
        if (panel) {
          panel.classList.toggle("hidden", name !== viewName);
        }
      });

      // Actualizar botón activo en sidebar
      document.querySelectorAll(".sidebar-link[data-view]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === viewName);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Vincular data-view
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        window.switchView(btn.dataset.view);
      });
    });

    const viewAllBtn = document.getElementById("viewAllRequestsBtn");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        window.switchView("requests");
      });
    }
  }

  // Acceso rápido a registrar nota
  window.goToNotes = function () {
    window.switchView("requests");
    setTimeout(() => {
      const textarea = document.getElementById("operatorNoteInput");
      if (textarea) {
        textarea.scrollIntoView({ behavior: "smooth", block: "center" });
        textarea.focus();
      }
    }, 250);
  };

  // 5. Carga de datos operativos reales
  async function loadOperatorData() {
    try {
      const [dashboardData, requestsData] = await Promise.all([
        api.dashboard().catch(() => ({ counts: {} })),
        api.requests().catch(() => [])
      ]);

      allRequests = Array.isArray(requestsData) ? requestsData : [];

      // Renderizar métricas
      renderOperatorMetrics(dashboardData.counts || {});

      // Renderizar tabla de servicios recientes
      renderRecentRequests(allRequests);

      // Renderizar card "Servicio en curso"
      renderCurrentService(allRequests);

      // Renderizar agenda del día
      renderTodaySchedule(allRequests);

      // Aplicar filtros en Mis Servicios
      applyFiltersAndSearch();

      // Mantener seleccionado el servicio actual o el primero
      if (allRequests.length > 0) {
        const found = allRequests.find(r => r.RequestId === selectedRequestId);
        if (found) {
          renderOperatorRequestDetail(found);
        } else {
          selectRequestById(allRequests[0].RequestId);
        }
      } else {
        renderOperatorRequestDetail(null);
      }

    } catch (error) {
      console.error("Error al cargar datos operativos:", error);
      PortalCommon.showNotification("Error al cargar datos operativos: " + error.message, "error");
    }
  }

  // 6. Métricas Operativas
  function renderOperatorMetrics(counts) {
    const c = counts || {};
    const countE = Number(c.E || 0);
    const countA = Number(c.A || 0);
    const countT = Number(c.T || 0);
    const countC = Number(c.C || 0);
    const total = countE + countA + countT + countC;

    const mTotal = document.getElementById("mTotal");
    const mE = document.getElementById("mE");
    const mA = document.getElementById("mA");
    const mT = document.getElementById("mT");

    if (mTotal) mTotal.textContent = total;
    if (mE) mE.textContent = countE;
    if (mA) mA.textContent = countA;
    if (mT) mT.textContent = countT;
  }

  // Diccionario de clases CSS para pills
  const statusPillClass = {
    A: "pill-a",
    E: "pill-e",
    T: "pill-t",
    C: "pill-c"
  };

  // 7. Tabla de Servicios Asignados Recientes (Inicio 70%)
  function renderRecentRequests(requests) {
    const tbody = document.getElementById("recentRequestsBody");
    if (!tbody) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: var(--mira-text-muted);">
            No tienes servicios asignados actualmente en el sistema.
          </td>
        </tr>
      `;
      return;
    }

    const top5 = requests.slice(0, 5);
    tbody.innerHTML = top5.map(req => {
      const statusInfo = PortalCommon.STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado" };
      const folio = escapeHtml(req.Folio || "Sin folio");
      const client = escapeHtml(req.Company ? `${req.Company}` : (req.ContactName || "Cliente"));
      const need = escapeHtml(req.Need || "Servicio técnico MIRA");
      const dateText = formatDate(req.CreatedAt);
      const pillClass = statusPillClass[req.Status] || "pill-a";

      return `
        <tr>
          <td><span class="folio-saas-chip">${folio}</span></td>
          <td><strong>${client}</strong></td>
          <td><span style="color: var(--mira-navy); font-weight: 600;">${need}</span></td>
          <td><span class="status-pill ${pillClass}">${statusInfo.label}</span></td>
          <td style="color: var(--mira-text-secondary);">${dateText}</td>
          <td style="text-align: right;">
            <button class="btn-detail-small" onclick="window.goToRequestDetailById('${req.RequestId}')">
              Ver detalle
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 8. Card "Servicio en curso" (Destacado en Inicio)
  function renderCurrentService(requests) {
    const container = document.getElementById("activeServiceDualContainer");
    if (!container) return;

    // Buscar el servicio en atención (Status 'A') o el más reciente
    const activeReq = requests.find(r => r.Status === "A") || requests[0];

    if (!activeReq) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--mira-text-muted);">
          No hay servicios activos en atención asignados actualmente.
        </div>
      `;
      return;
    }

    const statusInfo = PortalCommon.STATUS_CONFIG[activeReq.Status] || { label: activeReq.Status || "En atención" };
    const folio = escapeHtml(activeReq.Folio || "SOLICITUD");
    const client = escapeHtml(activeReq.Company ? `${activeReq.Company} (${activeReq.ContactName || ''})` : (activeReq.ContactName || "-"));
    const need = escapeHtml(activeReq.Need || "Servicio técnico MIRA");
    const location = escapeHtml(activeReq.Location || "Ubicación nacional no especificada");
    const createdDate = formatDate(activeReq.CreatedAt);
    const pillClass = statusPillClass[activeReq.Status] || "pill-a";

    container.innerHTML = `
      <div class="active-service-left">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span class="folio-saas-chip" style="font-size: 13px;">${folio}</span>
          <span class="status-pill ${pillClass}">${statusInfo.label}</span>
        </div>
        <div class="active-service-row">
          <span class="active-service-key">Cliente:</span>
          <span class="active-service-val">${client}</span>
        </div>
        <div class="active-service-row">
          <span class="active-service-key">Servicio:</span>
          <span class="active-service-val">${need}</span>
        </div>
        <div class="active-service-row">
          <span class="active-service-key">Ubicación:</span>
          <span class="active-service-val">${location}</span>
        </div>
        <div class="active-service-row">
          <span class="active-service-key">Inicio:</span>
          <span class="active-service-val">${createdDate}</span>
        </div>
        <button type="button" class="btn-active-service-detail" onclick="window.goToRequestDetailById('${activeReq.RequestId}')">
          <span>Ver detalle</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div class="active-service-right">
        <div class="active-service-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
        </div>
        <div class="active-service-msg">
          Realiza tus actividades, registra tu avance y mantén al cliente informado en todo momento.
        </div>
      </div>
    `;
  }

  // 9. Card "Mi jornada de hoy" (Columna derecha 30%)
  function renderTodaySchedule(requests) {
    const container = document.getElementById("todayTimelineContainer");
    if (!container) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--mira-text-muted); font-size: 12.5px;">
          No tienes actividades programadas para hoy.
        </div>
      `;
      return;
    }

    // Horarios de cuadrilla asignados dinámicamente
    const slotTimes = ["09:00", "11:30", "15:00", "17:00"];
    const topSlots = requests.slice(0, 3);

    container.innerHTML = topSlots.map((req, idx) => {
      const time = slotTimes[idx] || "09:00";
      const need = escapeHtml(req.Need || "Servicio programado");
      const clientLocation = escapeHtml(req.Company ? `${req.Company} · ${req.Location || 'Nacional'}` : (req.Location || "Sitio del cliente"));
      const isGreen = idx === 0;

      return `
        <div class="timeline-item">
          <div class="timeline-time">${time}</div>
          <div class="timeline-dot-track">
            <span class="timeline-dot ${isGreen ? '' : 'blue'}"></span>
          </div>
          <div class="timeline-body">
            <div class="timeline-task-title">${need}</div>
            <div class="timeline-task-location">${clientLocation}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  // 10. Vista Mis Servicios: Búsqueda y Filtro Combinado
  function applyFiltersAndSearch() {
    const searchInput = document.getElementById("requestSearchInput");
    const filterSelect = document.getElementById("statusFilterSelect");

    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedStatus = filterSelect ? filterSelect.value : "ALL";

    filteredRequests = allRequests.filter(r => {
      const folio = (r.Folio || "").toLowerCase();
      const need = (r.Need || "").toLowerCase();
      const contact = (r.ContactName || "").toLowerCase();
      const company = (r.Company || "").toLowerCase();
      const location = (r.Location || "").toLowerCase();

      const matchesSearch = !term || 
        folio.includes(term) || 
        need.includes(term) || 
        contact.includes(term) || 
        company.includes(term) || 
        location.includes(term);

      const matchesStatus = (selectedStatus === "ALL") || (r.Status === selectedStatus);

      return matchesSearch && matchesStatus;
    });

    const countLabel = document.getElementById("requestsCountLabel");
    if (countLabel) {
      countLabel.textContent = `${filteredRequests.length} servicio${filteredRequests.length === 1 ? '' : 's'} asignado${filteredRequests.length === 1 ? '' : 's'}`;
    }

    renderRequestsList(filteredRequests);
  }

  function renderRequestsList(requests) {
    const listEl = document.getElementById("requestList");
    if (!listEl) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 36px 20px; text-align: center; color: var(--mira-text-muted); font-size: 13px;">
          No se encontraron servicios asignados con los filtros aplicados.
        </div>
      `;
      return;
    }

    listEl.innerHTML = requests.map(req => {
      const statusInfo = PortalCommon.STATUS_CONFIG[req.Status] || { label: req.Status || "-", class: "badge-sent" };
      const folio = escapeHtml(req.Folio || "Sin folio");
      const need = escapeHtml(req.Need || "Servicio técnico");
      const dateText = formatDate(req.CreatedAt);
      const isSelected = req.RequestId === selectedRequestId;
      const pillClass = statusPillClass[req.Status] || "pill-a";

      return `
        <button class="request-list-card request-card-btn ${isSelected ? 'active' : ''}" data-id="${req.RequestId}" onclick="window.selectRequestById('${req.RequestId}')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="folio-saas-chip">${folio}</span>
            <span class="status-pill ${pillClass}">${statusInfo.label}</span>
          </div>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--mira-navy); margin-top: 4px; line-height: 1.3;">${need}</div>
          <div style="display: flex; gap: 12px; font-size: 11.5px; color: var(--mira-text-muted); margin-top: 2px;">
            <span>📅 ${dateText}</span>
            <span>📍 ${escapeHtml(req.Location || "Nacional")}</span>
          </div>
        </button>
      `;
    }).join("");
  }

  // 11. Selección y Detalle de Servicio para Operador
  window.selectRequestById = function (requestId) {
    selectedRequestId = requestId;
    const req = allRequests.find(r => r.RequestId === requestId);

    document.querySelectorAll(".request-list-card, .request-card-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.id === requestId);
    });

    renderOperatorRequestDetail(req);
  };

  window.goToRequestDetailById = function (requestId) {
    window.switchView("requests");
    window.selectRequestById(requestId);
  };

  function renderOperatorRequestDetail(req) {
    const detailEl = document.getElementById("requestDetail");
    if (!detailEl) return;

    if (!req) {
      detailEl.innerHTML = `
        <div style="text-align: center; padding: 70px 20px; color: var(--mira-text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7AC143" stroke-width="1.5" style="margin-bottom: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--mira-navy); margin-bottom: 6px;">Selecciona un servicio asignado</h3>
          <p style="font-size: 13.5px;">Haz clic en cualquier servicio de la lista izquierda para consultar los detalles técnicos y bitácora.</p>
        </div>
      `;
      return;
    }

    const statusInfo = PortalCommon.STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado" };
    const folio = escapeHtml(req.Folio || "SOLICITUD");
    const createdDate = formatDate(req.CreatedAt);
    const requestedDate = extractRequestedDate(req.Description);
    const need = escapeHtml(req.Need || "Servicio general MIRA");
    const location = escapeHtml(req.Location || "Ubicación nacional no especificada");
    const company = escapeHtml(req.Company ? `${req.Company} (${req.ContactName || 'Titular'})` : (req.ContactName || "-"));
    const operator = escapeHtml(req.OperatorName || session.name || "Carlos Mendoza");
    const description = escapeHtml(req.Description || "Sin descripción técnica adicional proporcionada.");

    const isAttendedDone = (req.Status === "A" || req.Status === "T");
    const isCompletedDone = (req.Status === "T");
    const isCanceled = (req.Status === "C");

    const pillClass = statusPillClass[req.Status] || "pill-a";

    let progressHtml = "";
    if (isCanceled) {
      progressHtml = `
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-sm); padding: 14px 18px; margin: 18px 0; color: #991B1B; font-weight: 700; font-size: 13px;">
          ⚠️ Este servicio fue cancelado por coordinación.
        </div>
      `;
    } else {
      progressHtml = `
        <div class="saas-tracker-card">
          <div class="saas-tracker-step done">
            <span class="tracker-dot">✓</span>
            <span>1. Solicitud Recibida</span>
          </div>
          <div class="saas-tracker-step ${isAttendedDone ? 'done' : (req.Status === 'E' ? 'current' : '')}">
            <span class="tracker-dot">${isAttendedDone ? '✓' : '2'}</span>
            <span>2. En Atención</span>
          </div>
          <div class="saas-tracker-step ${isCompletedDone ? 'done' : ''}">
            <span class="tracker-dot">${isCompletedDone ? '✓' : '3'}</span>
            <span>3. Concluida</span>
          </div>
        </div>
      `;
    }

    detailEl.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid var(--mira-border); flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: var(--mira-green-dark); letter-spacing: 0.1em; text-transform: uppercase;">SERVICIO ASIGNADO A TI</span>
            <h2 class="detail-folio-number" style="font-size: 26px; font-weight: 800; color: var(--mira-navy); margin-top: 2px;">${folio}</h2>
          </div>
          <span class="status-pill ${pillClass}" style="font-size: 13px; padding: 6px 14px;">
            ${statusInfo.label}
          </span>
        </div>

        ${progressHtml}

        <div class="detail-grid-saas">
          <div class="prop-card-saas">
            <div class="prop-label-saas">Fecha de Registro</div>
            <div class="prop-val-saas">${createdDate}</div>
          </div>

          <div class="prop-card-saas">
            <div class="prop-label-saas">Fecha Requerida</div>
            <div class="prop-val-saas">${requestedDate || createdDate}</div>
          </div>

          <div class="prop-card-saas">
            <div class="prop-label-saas">Ubicación del Servicio</div>
            <div class="prop-val-saas">${location}</div>
          </div>

          <div class="prop-card-saas">
            <div class="prop-label-saas">Cliente / Empresa</div>
            <div class="prop-val-saas">${company}</div>
          </div>

          <div class="prop-card-saas">
            <div class="prop-label-saas">Servicio / Necesidad Reportada</div>
            <div class="prop-val-saas" style="color: var(--mira-navy);">${need}</div>
          </div>

          <div class="prop-card-saas">
            <div class="prop-label-saas">Especialista MIRA Asignado</div>
            <div class="prop-val-saas">🛠️ ${operator}</div>
          </div>

          <div class="prop-card-saas full-width">
            <div class="prop-label-saas">Descripción Técnica Proporcionada</div>
            <div style="font-size: 13.5px; color: var(--mira-text-main); margin-top: 4px; white-space: pre-line; line-height: 1.5;">${description}</div>
          </div>
        </div>

        <!-- SECCIÓN: BITÁCORA DE TRABAJO -->
        <div class="worknotes-section-card">
          <div class="worknotes-heading">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00875A" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Bitácora de trabajo</span>
          </div>

          <!-- Historial de notas -->
          <div class="worknotes-items-list" id="workNotesList">
            <div style="padding: 16px; text-align: center; color: var(--mira-text-muted); font-size: 12.5px;">
              Cargando notas de la bitácora...
            </div>
          </div>

          <!-- Formulario Agregar Nota -->
          <div class="add-note-form-box">
            <label for="operatorNoteInput" style="font-size: 12.5px; font-weight: 700; color: var(--mira-navy); display: block; margin-bottom: 6px;">
              Registrar avance en bitácora
            </label>
            <textarea 
              id="operatorNoteInput" 
              class="operator-note-textarea" 
              placeholder="Describe los avances, materiales utilizados o diagnóstico técnico en sitio..."
            ></textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 11.5px; color: var(--mira-text-muted);">Quedará registrado con tu usuario y fecha actual.</span>
              <button type="button" class="btn-save-note" id="btnSaveNote" onclick="window.handleSaveNote('${req.RequestId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                <span>Guardar nota en bitácora</span>
              </button>
            </div>
            <div id="noteFeedbackMsg" class="note-feedback-msg hidden"></div>
          </div>
        </div>

      </div>
    `;

    // Cargar historial de notas para esta solicitud
    loadWorkNotesForRequest(req.RequestId);
  }

  // 12. Cargar y registrar notas técnicas
  async function loadWorkNotesForRequest(requestId) {
    const listEl = document.getElementById("workNotesList");
    if (!listEl) return;

    try {
      const notes = await api.notes(requestId);

      if (!Array.isArray(notes) || notes.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 16px; text-align: center; color: var(--mira-text-muted); font-size: 12.5px; font-style: italic; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px dashed var(--mira-border);">
            No existen notas de trabajo registradas para este servicio aún.
          </div>
        `;
        return;
      }

      listEl.innerHTML = notes.map(n => {
        const author = escapeHtml(n.Author || "Especialista MIRA");
        const dateStr = n.CreatedAt ? new Date(n.CreatedAt).toLocaleString("es-MX") : "Fecha no disponible";
        const noteText = escapeHtml(n.Note || "");

        return `
          <div class="worknote-entry-box">
            <div class="worknote-meta-row">
              <span class="worknote-author">🛠️ ${author}</span>
              <span class="worknote-date">${dateStr}</span>
            </div>
            <div class="worknote-text">${noteText}</div>
          </div>
        `;
      }).join("");

    } catch (error) {
      listEl.innerHTML = `
        <div style="padding: 12px; color: #991B1B; background: #FEE2E2; border-radius: var(--radius-sm); font-size: 12.5px;">
          No fue posible cargar las notas técnicas: ${escapeHtml(error.message)}
        </div>
      `;
    }
  }

  window.handleSaveNote = async function (requestId) {
    const textarea = document.getElementById("operatorNoteInput");
    const saveBtn = document.getElementById("btnSaveNote");
    const feedback = document.getElementById("noteFeedbackMsg");

    if (!textarea || !saveBtn) return;

    const noteText = textarea.value.trim();

    if (!noteText) {
      if (feedback) {
        feedback.className = "note-feedback-msg error";
        feedback.textContent = "Escribe el contenido de la nota antes de guardar.";
        feedback.classList.remove("hidden");
      }
      textarea.focus();
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>Guardando...</span>`;

      await api.addNote(requestId, noteText);

      textarea.value = "";
      if (feedback) {
        feedback.className = "note-feedback-msg success";
        feedback.textContent = "✓ Nota registrada exitosamente en la bitácora.";
        feedback.classList.remove("hidden");
        setTimeout(() => feedback.classList.add("hidden"), 4000);
      }

      PortalCommon.showNotification("Nota guardada exitosamente.", "success");
      await loadWorkNotesForRequest(requestId);

    } catch (error) {
      if (feedback) {
        feedback.className = "note-feedback-msg error";
        feedback.textContent = "Error al guardar nota: " + error.message;
        feedback.classList.remove("hidden");
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>Guardar nota en bitácora</span>
      `;
    }
  };

  // 13. Inicializar Filtros y Búsqueda
  function initFilters() {
    const searchInput = document.getElementById("requestSearchInput");
    const statusFilter = document.getElementById("statusFilterSelect");

    if (searchInput) {
      searchInput.addEventListener("input", applyFiltersAndSearch);
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", applyFiltersAndSearch);
    }

    const refreshBtn = document.getElementById("refreshRequestsBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.disabled = true;
        await loadOperatorData();
        refreshBtn.disabled = false;
        PortalCommon.showNotification("Servicios asignados actualizados correctamente.", "success");
      });
    }
  }

  // 14. Inicialización General
  initHeaderIdentity();
  initMobileDrawer();
  initViewNavigation();
  initFilters();

  // Cargar datos
  loadOperatorData();

})(window);
