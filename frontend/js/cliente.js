/**
 * Sistema MIRA - Controlador del Portal de Clientes (cliente.js)
 * Exclusivo para usuarios autenticados con rol CLIENT.
 * Adaptado a la arquitectura SaaS con Sidebar, Top Header y Grid 70/30.
 */

(function (window) {
  'use strict';

  // 1. Proteger acceso: Solo rol CLIENT mediante la lógica central de auth.js
  const session = window.protectPage("CLIENT");

  // Estado local
  let allRequests = [];
  let filteredRequests = [];
  let selectedRequestId = null;
  let isRequestingOtp = false;
  let isVerifyingOtp = false;

  // 2. Formateador de fechas para México
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  }

  // Extraer fecha solicitada si viene en el texto de descripción
  function extractRequestedDate(desc) {
    if (!desc) return null;
    const match = desc.match(/fecha\s*(?:requerida|solicitada)?\s*:\s*([^\n\r,]+)/i);
    return match ? match[1].trim() : null;
  }

  // 3. Inicializar identidad y cabecera
  function initHeaderIdentity() {
    PortalCommon.setupHeaderIdentity(session);

    // Saludo en el hero del dashboard
    const greetingEl = document.getElementById("clientGreetingName");
    if (greetingEl) {
      // Extraer primer nombre para un trato más cálido como en el mockup ("Hola, Elizabeth 👋")
      const firstName = (session.name || "Cliente").trim().split(" ")[0];
      greetingEl.textContent = firstName;
    }

    // Botón de logout
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.stopPropagation();
        window.logout();
      };
    }

    // Toggle para menú móvil / drawer
    const toggleBtn = document.getElementById("btnToggleDrawer");
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.onclick = () => {
        sidebar.classList.toggle("open");
        backdrop.classList.toggle("active");
      };

      backdrop.onclick = () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("active");
      };
    }
  }

  // 4. Configurar selector de vistas (Inicio, Mis solicitudes, Documentos, Mi perfil)
  function initViewNavigation() {
    const views = ["summary", "requests", "documents", "profile"];
    
    window.switchView = function (viewName) {
      // Actualizar botones de navegación en el sidebar y enlaces
      document.querySelectorAll("[data-view]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === viewName);
      });

      // Mostrar/ocultar paneles principales
      views.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.toggle("hidden", panelId !== viewName);
        }
      });

      // Si se navega a perfil, renderizar datos actualizados
      if (viewName === "profile") {
        renderProfileView();
      }

      // Cerrar drawer en móvil si estaba abierto
      const sidebar = document.getElementById("appSidebar");
      const backdrop = document.getElementById("sidebarBackdrop");
      if (sidebar) sidebar.classList.remove("open");
      if (backdrop) backdrop.classList.remove("active");

      // Desplazar suavemente a la cabecera si es necesario
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Vincular clics en todos los elementos con atributo data-view
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        window.switchView(btn.dataset.view);
      });
    });

    // Botón "Ver todas" desde la tabla de recientes
    const viewAllBtn = document.getElementById("viewAllRequestsBtn");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", () => {
        window.switchView("requests");
      });
    }
  }

  // 5. Flujo de Verificación de Correo (Tarjeta Lateral SaaS)
  function updateVerificationUI() {
    const verifiedCard = document.getElementById("emailVerifiedCard");
    const banner = document.getElementById("emailVerificationBanner");

    const isVerified = Boolean(session.emailVerified);

    if (isVerified) {
      if (banner) banner.classList.add("hidden");
      if (verifiedCard) verifiedCard.classList.remove("hidden");
    } else {
      if (banner) banner.classList.remove("hidden");
      if (verifiedCard) verifiedCard.classList.add("hidden");

      const step1 = document.getElementById("otpStep1");
      const step2 = document.getElementById("otpStep2");
      const feedback = document.getElementById("otpFeedback");

      if (step1) step1.classList.remove("hidden");
      if (step2) step2.classList.add("hidden");
      if (feedback) {
        feedback.className = "otp-side-feedback hidden";
        feedback.textContent = "";
      }
    }
  }

  function showOtpFeedback(message, type = "info") {
    const feedback = document.getElementById("otpFeedback");
    if (!feedback) return;
    
    let colorStyle = "color: #2563EB;";
    if (type === "error") colorStyle = "color: #B91C1C;";
    if (type === "success") colorStyle = "color: #047857;";

    feedback.className = "otp-side-feedback";
    feedback.style = colorStyle;
    feedback.textContent = message;
    feedback.classList.remove("hidden");
  }

  function initEmailVerificationFlow() {
    updateVerificationUI();

    const btnRequestOtp = document.getElementById("btnRequestOtp");
    const btnResendOtp = document.getElementById("btnResendOtp");
    const btnVerifyOtp = document.getElementById("btnVerifyOtp");
    const otpCodeInput = document.getElementById("otpCodeInput");
    const step1 = document.getElementById("otpStep1");
    const step2 = document.getElementById("otpStep2");

    // Solicitar código OTP (Paso 1 o reenvío)
    async function handleRequestOtp() {
      if (isRequestingOtp) return;
      isRequestingOtp = true;

      if (btnRequestOtp) {
        btnRequestOtp.disabled = true;
        btnRequestOtp.textContent = "Enviando...";
      }
      if (btnResendOtp) {
        btnResendOtp.disabled = true;
        btnResendOtp.textContent = "Reenviando...";
      }

      showOtpFeedback("Enviando código de verificación a tu correo...", "info");

      try {
        const res = await api.requestEmailVerification(session.email);
        if (res && res.sent) {
          if (step1) step1.classList.add("hidden");
          if (step2) step2.classList.remove("hidden");
          
          showOtpFeedback(`Código de 6 dígitos enviado a tu correo.`, "info");
          
          if (otpCodeInput) {
            otpCodeInput.value = "";
            setTimeout(() => otpCodeInput.focus(), 100);
          }
        } else {
          throw new Error(res.error || "No fue posible generar el código. Intenta nuevamente.");
        }
      } catch (err) {
        console.error("Error al solicitar código OTP:", err);
        showOtpFeedback(err.message || "Error al solicitar código.", "error");
      } finally {
        isRequestingOtp = false;
        if (btnRequestOtp) {
          btnRequestOtp.disabled = false;
          btnRequestOtp.innerHTML = `<span>Enviar código</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        }
        if (btnResendOtp) {
          btnResendOtp.disabled = false;
          btnResendOtp.textContent = "Reenviar";
        }
      }
    }

    // Verificar código OTP (Paso 2)
    async function handleVerifyOtp() {
      if (isVerifyingOtp) return;
      const code = (otpCodeInput ? otpCodeInput.value : "").trim();

      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        showOtpFeedback("Introduce un código numérico de 6 dígitos.", "error");
        if (otpCodeInput) otpCodeInput.focus();
        return;
      }

      isVerifyingOtp = true;
      if (btnVerifyOtp) {
        btnVerifyOtp.disabled = true;
        btnVerifyOtp.textContent = "Verificando...";
      }

      try {
        const res = await api.verifyEmail(session.email, code);
        
        if (res && (res.verified || res.emailVerified)) {
          // 1. Actualizar estado local de sesión
          session.emailVerified = true;
          try {
            const rawUser = localStorage.getItem("mira_user");
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.emailVerified = true;
              localStorage.setItem("mira_user", JSON.stringify(u));
            }
          } catch (e) {
            console.warn("No se pudo actualizar localStorage mira_user:", e);
          }

          // 2. Ejecutar reclamo de solicitudes huérfanas
          let claimedCount = res.claimedCount || 0;
          try {
            const claimRes = await api.claimRequests();
            if (claimRes && claimRes.claimedCount) {
              claimedCount = claimRes.claimedCount;
            }
          } catch (claimErr) {
            console.debug("Claim check post-verify:", claimErr.message);
          }

          // 3. Feedback visual
          const claimMsg = claimedCount > 0 
            ? ` ¡Se vincularon ${claimedCount} solicitud(es) anteriores!`
            : "";
          showOtpFeedback(`¡Correo verificado con éxito!${claimMsg}`, "success");
          PortalCommon.showNotification(`¡Correo verificado exitosamente!${claimMsg}`, "success");

          // 4. Cambiar tarjeta al estado verificado verde
          updateVerificationUI();

          // 5. Recargar datos del dashboard y solicitudes
          await loadClientData();
          renderProfileView();

        } else {
          throw new Error(res.error || "El código ingresado es incorrecto o ha expirado.");
        }
      } catch (err) {
        console.error("Error al verificar código OTP:", err);
        showOtpFeedback(err.message || "Código inválido.", "error");
        if (otpCodeInput) otpCodeInput.focus();
      } finally {
        isVerifyingOtp = false;
        if (btnVerifyOtp) {
          btnVerifyOtp.disabled = false;
          btnVerifyOtp.textContent = "Verificar correo";
        }
      }
    }

    if (btnRequestOtp) btnRequestOtp.addEventListener("click", handleRequestOtp);
    if (btnResendOtp) btnResendOtp.addEventListener("click", handleRequestOtp);
    if (btnVerifyOtp) btnVerifyOtp.addEventListener("click", handleVerifyOtp);

    if (otpCodeInput) {
      otpCodeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleVerifyOtp();
        }
      });
    }
  }

  // 6. Carga de datos reales desde backend
  async function loadClientData() {
    try {
      if (session.emailVerified) {
        try {
          await api.claimRequests();
        } catch (e) {
          console.debug("ClaimRequests:", e.message);
        }
      }

      const [dashboardData, requestsData] = await Promise.all([
        api.dashboard().catch(() => ({ counts: {} })),
        api.requests().catch(() => [])
      ]);

      // Renderizar métricas reales
      renderClientMetrics(dashboardData.counts || {});

      // Guardar solicitudes y renderizar
      allRequests = Array.isArray(requestsData) ? requestsData : [];
      
      renderRecentRequests(allRequests);
      applyFiltersAndSearch();

      // Mantener seleccionada la solicitud actual o seleccionar la primera
      if (allRequests.length > 0) {
        const found = allRequests.find(r => r.RequestId === selectedRequestId);
        if (found) {
          renderClientRequestDetail(found);
        } else {
          selectRequestById(allRequests[0].RequestId);
        }
      } else {
        renderClientRequestDetail(null);
      }

    } catch (error) {
      console.error("Error al cargar portal cliente:", error);
      PortalCommon.showNotification("Error al cargar tus solicitudes: " + error.message, "error");
    }
  }

  // 7. Renderizar métricas del dashboard
  function renderClientMetrics(counts) {
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

  // 8. Renderizar tabla de solicitudes recientes (máximo 5) en estética SaaS
  function renderRecentRequests(requests) {
    const tbody = document.getElementById("recentRequestsBody");
    if (!tbody) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px; color: var(--mira-text-muted);">
            Aún no tienes solicitudes registradas. <a href="index.html#inicio" style="color: var(--mira-green-dark); font-weight: 700; text-decoration: underline;">Haz clic aquí para cotizar un servicio</a>.
          </td>
        </tr>
      `;
      return;
    }

    const statusPillClass = {
      E: "pill-e",
      A: "pill-a",
      T: "pill-t",
      C: "pill-c"
    };

    const top5 = requests.slice(0, 5);
    tbody.innerHTML = top5.map(req => {
      const statusInfo = PortalCommon.STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado", class: "badge-sent" };
      const folio = req.Folio || "Sin folio";
      const need = req.Need || "Servicio MIRA";
      const dateText = formatDate(req.CreatedAt);
      const pillClass = statusPillClass[req.Status] || "pill-e";

      return `
        <tr>
          <td><span class="folio-saas-chip">${folio}</span></td>
          <td><strong style="color: var(--mira-navy);">${need}</strong></td>
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

  // 9. Mis Solicitudes: Búsqueda y Filtro Combinado
  function applyFiltersAndSearch() {
    const searchInput = document.getElementById("requestSearchInput");
    const filterSelect = document.getElementById("statusFilterSelect");

    const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedStatus = filterSelect ? filterSelect.value : "ALL";

    filteredRequests = allRequests.filter(r => {
      const folio = (r.Folio || "").toLowerCase();
      const need = (r.Need || "").toLowerCase();
      const matchesSearch = !term || folio.includes(term) || need.includes(term);
      const matchesStatus = (selectedStatus === "ALL") || (r.Status === selectedStatus);
      return matchesSearch && matchesStatus;
    });

    const countLabel = document.getElementById("requestsCountLabel");
    if (countLabel) {
      countLabel.textContent = `${filteredRequests.length} solicitud${filteredRequests.length === 1 ? '' : 'es'}`;
    }

    renderRequestsList(filteredRequests);
  }

  function renderRequestsList(requests) {
    const listEl = document.getElementById("requestList");
    if (!listEl) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      listEl.innerHTML = `<div style="padding: 36px 20px; text-align: center; color: var(--mira-text-muted); font-size: 13px;">No se encontraron solicitudes con los filtros aplicados.</div>`;
      return;
    }

    const statusPillClass = {
      E: "pill-e",
      A: "pill-a",
      T: "pill-t",
      C: "pill-c"
    };

    listEl.innerHTML = requests.map(req => {
      const statusInfo = PortalCommon.STATUS_CONFIG[req.Status] || { label: req.Status || "-", class: "badge-sent" };
      const folio = req.Folio || "Sin folio";
      const need = req.Need || "Servicio general MIRA";
      const dateText = formatDate(req.CreatedAt);
      const isSelected = req.RequestId === selectedRequestId;
      const pillClass = statusPillClass[req.Status] || "pill-e";

      return `
        <button class="request-list-card request-card-btn ${isSelected ? 'active' : ''}" data-id="${req.RequestId}" onclick="window.selectRequestById('${req.RequestId}')">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="folio-saas-chip">${folio}</span>
            <span class="status-pill ${pillClass}">${statusInfo.label}</span>
          </div>
          <div style="font-size: 13.5px; font-weight: 700; color: var(--mira-navy); margin-top: 4px; line-height: 1.3;">${need}</div>
          <div style="display: flex; gap: 12px; font-size: 11.5px; color: var(--mira-text-muted); margin-top: 2px;">
            <span>📅 ${dateText}</span>
            <span>📍 ${req.Location || "Nacional"}</span>
          </div>
        </button>
      `;
    }).join("");
  }

  // 10. Detalle de Solicitud Seguro para CLIENTE (Sin notas internas ni admin)
  window.selectRequestById = function (requestId) {
    selectedRequestId = requestId;
    const req = allRequests.find(r => r.RequestId === requestId);

    document.querySelectorAll(".request-list-card, .request-card-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.id === requestId);
    });

    renderClientRequestDetail(req);
  };

  window.goToRequestDetailById = function (requestId) {
    window.switchView("requests");
    window.selectRequestById(requestId);
  };

  function renderClientRequestDetail(req) {
    const detailEl = document.getElementById("requestDetail");
    if (!detailEl) return;

    if (!req) {
      detailEl.innerHTML = `
        <div style="text-align: center; padding: 70px 20px; color: var(--mira-text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7AC143" stroke-width="1.5" style="margin-bottom: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--mira-navy); margin-bottom: 6px;">Selecciona una solicitud</h3>
          <p style="font-size: 13.5px;">Haz clic en cualquier solicitud de la lista para consultar su detalle técnico y seguimiento.</p>
        </div>
      `;
      return;
    }

    const statusInfo = PortalCommon.STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado", class: "badge-sent" };
    const folio = req.Folio || "SOLICITUD";
    const createdDate = formatDate(req.CreatedAt);
    const requestedDate = extractRequestedDate(req.Description);
    const need = req.Need || "Servicio general MIRA";
    const location = req.Location || "Ubicación nacional no especificada";
    const company = req.Company ? `${req.Company} (${req.ContactName || 'Titular'})` : (req.ContactName || "-");
    const operator = req.OperatorName 
      ? `🛠️ ${req.OperatorName}` 
      : "En asignación por mesa de servicio MIRA";
    const description = req.Description || "Sin descripción adicional proporcionada.";

    const isAttendedDone = (req.Status === "A" || req.Status === "T");
    const isCompletedDone = (req.Status === "T");
    const isCanceled = (req.Status === "C");

    const statusPillClass = {
      E: "pill-e",
      A: "pill-a",
      T: "pill-t",
      C: "pill-c"
    };
    const pillClass = statusPillClass[req.Status] || "pill-e";

    let progressHtml = "";
    if (isCanceled) {
      progressHtml = `
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-sm); padding: 14px 18px; margin: 18px 0; color: #991B1B; font-weight: 700; font-size: 13px;">
          ⚠️ Esta solicitud fue cancelada. Si necesitas reactivarla, por favor genera una nueva cotización.
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
            <span style="font-size: 11px; font-weight: 800; color: var(--mira-green-dark); letter-spacing: 0.1em; text-transform: uppercase;">SEGUIMIENTO DE SERVICIO</span>
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
            <div class="prop-label-saas">Especialista MIRA Asignado</div>
            <div class="prop-val-saas">${operator}</div>
          </div>

          <div class="prop-card-saas full-width">
            <div class="prop-label-saas">Empresa / Titular</div>
            <div class="prop-val-saas">${company}</div>
          </div>

          <div class="prop-card-saas full-width">
            <div class="prop-label-saas">Servicio / Necesidad Reportada</div>
            <div class="prop-val-saas" style="color: var(--mira-navy); font-size: 15px;">${need}</div>
          </div>

          <div class="prop-card-saas full-width">
            <div class="prop-label-saas">Descripción Técnica Proporcionada</div>
            <div style="font-size: 13.5px; color: var(--mira-text-main); line-height: 1.6; white-space: pre-line; margin-top: 6px;">${description}</div>
          </div>
        </div>

        <div style="background: #F8FAFC; border-radius: var(--radius-sm); padding: 14px 18px; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <span style="font-size: 13px; color: var(--mira-text-secondary);">¿Requieres ampliar los alcances de este servicio?</span>
          <a href="index.html#inicio" class="btn-detail-small">Solicitar cotización complementaria</a>
        </div>
      </div>
    `;
  }

  // 11. Renderizar Vista Mi Perfil
  function renderProfileView() {
    const fullNameEl = document.getElementById("profileFullName");
    const rowNameEl = document.getElementById("profileRowName");
    const rowEmailEl = document.getElementById("profileRowEmail");
    const avatarBig = document.getElementById("profileBigAvatar");
    const statusWrap = document.getElementById("profileVerificationStatus");

    const name = session.name || "Cliente";
    const email = session.email || "-";
    const isVerified = Boolean(session.emailVerified);

    if (fullNameEl) fullNameEl.textContent = name;
    if (rowNameEl) rowNameEl.textContent = name;
    if (rowEmailEl) rowEmailEl.textContent = email;
    if (avatarBig) avatarBig.textContent = PortalCommon.getInitials(name);

    if (statusWrap) {
      if (isVerified) {
        statusWrap.innerHTML = `<span class="status-pill pill-t">✓ Correo verificado</span>`;
      } else {
        statusWrap.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="status-pill pill-c">Pendiente</span>
            <button type="button" class="btn-detail-small" id="profileVerifyActionBtn" style="padding: 4px 10px; font-size: 11.5px;">
              Verificar ahora
            </button>
          </div>
        `;
        const actionBtn = document.getElementById("profileVerifyActionBtn");
        if (actionBtn) {
          actionBtn.addEventListener("click", () => {
            window.switchView("summary");
            const banner = document.getElementById("emailVerificationBanner");
            if (banner) {
              banner.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
        }
      }
    }
  }

  // 12. Listeners de búsqueda, filtros y actualización
  function initFilters() {
    const searchInput = document.getElementById("requestSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        applyFiltersAndSearch();
      });
    }

    const filterSelect = document.getElementById("statusFilterSelect");
    if (filterSelect) {
      filterSelect.addEventListener("change", () => {
        applyFiltersAndSearch();
      });
    }

    const refreshBtn = document.getElementById("refreshRequestsBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        refreshBtn.disabled = true;
        await loadClientData();
        refreshBtn.disabled = false;
        PortalCommon.showNotification("Solicitudes actualizadas correctamente.", "success");
      });
    }
  }

  // 13. Inicialización General
  initHeaderIdentity();
  initViewNavigation();
  initEmailVerificationFlow();
  initFilters();

  // Cargar datos
  loadClientData();

})(window);
