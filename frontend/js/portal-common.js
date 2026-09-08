/**
 * Sistema MIRA - Utilidades Comunes de Interfaz de Portales (portal-common.js)
 * Componentes reutilizables para vistas de métricas, listas y detalle de solicitudes.
 */

(function (window) {
  'use strict';

  const STATUS_CONFIG = {
    E: { label: "Enviada", class: "badge-sent" },
    A: { label: "En atención", class: "badge-attended" },
    T: { label: "Terminada", class: "badge-completed" },
    C: { label: "Cancelada", class: "badge-canceled" }
  };

  function getInitials(name) {
    if (!name) return "M";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function getRoleLabel(code) {
    switch ((code || "").toUpperCase()) {
      case "ADMIN": return "Administrador";
      case "OPERATOR": return "Operador";
      case "CLIENT": return "Cliente";
      default: return code || "Usuario";
    }
  }

  function setupHeaderIdentity(session) {
    const avatarEl = document.getElementById("userAvatar");
    const nameEl = document.getElementById("userName");
    const roleBadgeEl = document.getElementById("userRoleBadge");
    const welcomeEl = document.getElementById("welcomeMessage");

    if (avatarEl) avatarEl.textContent = getInitials(session.name);
    if (nameEl) nameEl.textContent = session.name;
    if (roleBadgeEl) roleBadgeEl.textContent = getRoleLabel(session.role);

    if (welcomeEl) {
      welcomeEl.textContent = `Bienvenido, ${session.name} (${getRoleLabel(session.role)}). Consulta el estado actual del servicio con métricas en tiempo real.`;
    }

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (window.MiraAuth) window.MiraAuth.logout();
        else window.logout();
      });
    }
  }

  function showNotification(message, type = "error") {
    const el = document.getElementById("globalNotification");
    if (!el) return;

    el.textContent = message;
    el.style.display = "block";
    el.style.padding = "12px 18px";
    el.style.borderRadius = "4px";
    el.style.fontSize = "13.5px";
    el.style.fontWeight = "600";

    if (type === "error") {
      el.style.background = "#FDF0ED";
      el.style.color = "#9B2C1D";
      el.style.border = "1px solid #F6C8BE";
    } else {
      el.style.background = "#EEF7E6";
      el.style.color = "#2D6619";
      el.style.border = "1px solid #C8E6B2";
    }

    el.classList.remove("hidden");

    setTimeout(() => {
      el.classList.add("hidden");
    }, 5000);
  }

  function switchView(viewName, availableViews = ["summary", "requests", "notes", "users"], onSwitchCallback = null) {
    // Botones del menú
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    // Paneles
    availableViews.forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.toggle("hidden", panelId !== viewName);
      }
    });

    const opContainer = document.getElementById("dashboard-operations");
    if (opContainer && viewName !== "summary") {
      opContainer.scrollIntoView({ behavior: "smooth" });
    }

    if (typeof onSwitchCallback === "function") {
      onSwitchCallback(viewName);
    }
  }

  function setupViewSwitcher(availableViews, onSwitchCallback) {
    window.switchView = (viewName) => switchView(viewName, availableViews, onSwitchCallback);

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

  function renderMetrics(counts) {
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

  function renderRecentRequestsTable(requests, onSelectCallback) {
    const tbody = document.getElementById("recentRequestsBody");
    if (!tbody) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: #56696D;">No hay solicitudes registradas en este momento.</td>
        </tr>
      `;
      return;
    }

    const top5 = requests.slice(0, 5);
    tbody.innerHTML = top5.map((req, index) => {
      const statusInfo = STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado", class: "badge-sent" };
      const folio = req.Folio || `REQ-${index + 1}`;
      const contact = req.ContactName || "Contacto";
      const company = req.Company ? `<span style="display: block; font-size: 11.5px; color: #8E9FA2;">${req.Company}</span>` : "";
      const need = req.Need || "Servicio general MIRA";
      const operator = req.OperatorName 
        ? `<span style="color: #062D3A; font-weight: 600;">🛠️ ${req.OperatorName}</span>` 
        : `<span style="color: #8E9FA2; font-style: italic;">Sin asignar</span>`;

      return `
        <tr>
          <td><span class="folio-tag">${folio}</span></td>
          <td><strong style="color: #062D3A;">${contact}</strong>${company}</td>
          <td><span style="max-width: 260px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${need}">${need}</span></td>
          <td>${operator}</td>
          <td><span class="status-badge ${statusInfo.class}">${statusInfo.label}</span></td>
          <td style="text-align: right;">
            <button class="btn-view-all" onclick="window.goToRequestDetail(${index})" style="padding: 5px 12px; font-size: 12px;">
              Ver detalle →
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderRequestsList(requests, selectedIndex) {
    const listEl = document.getElementById("requestList");
    if (!listEl) return;

    if (!Array.isArray(requests) || requests.length === 0) {
      listEl.innerHTML = `<div style="padding: 30px; text-align: center; color: #56696D;">No se encontraron solicitudes.</div>`;
      return;
    }

    listEl.innerHTML = requests.map((req, index) => {
      const statusInfo = STATUS_CONFIG[req.Status] || { label: req.Status || "-", class: "badge-sent" };
      const folio = req.Folio || "Sin folio";
      const contact = req.ContactName || "Sin nombre";
      const need = req.Need || "Servicio MIRA";
      const isSelected = index === selectedIndex;

      return `
        <button class="request-item-btn ${isSelected ? 'active' : ''}" data-index="${index}" onclick="window.selectRequest(${index})">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="folio-tag">${folio}</span>
            <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
          </div>
          <div style="font-size: 13.5px; font-weight: 700; color: #062D3A; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${need}
          </div>
          <div style="display: flex; gap: 12px; font-size: 12px; color: #56696D; margin-top: 2px;">
            <span>👤 ${contact}</span>
            <span>📍 ${req.Location || "Nacional"}</span>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderRequestDetail(req, options = {}) {
    const detailEl = document.getElementById("requestDetail");
    if (!detailEl) return;

    if (!req) {
      detailEl.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #56696D;">
          <h3 style="font-family: var(--font-serif); font-size: 22px; color: var(--mira-navy); margin-bottom: 6px;">Selecciona una solicitud</h3>
          <p>Haz clic en cualquier solicitud de la lista izquierda para visualizar los datos técnicos y responsable.</p>
        </div>
      `;
      return;
    }

    const statusInfo = STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado", class: "badge-sent" };
    const folio = req.Folio || "SOLICITUD";
    const contact = req.ContactName || "-";
    const company = req.Company ? ` (${req.Company})` : "";
    const location = req.Location || "No especificada";
    const operator = req.OperatorName || "Sin asignar";
    const urgency = req.Urgency || "Normal";
    const need = req.Need || "Servicio general MIRA";

    const extraSectionHtml = options.extraHtml || "";

    detailEl.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid var(--mira-line);">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: var(--mira-green-dark); letter-spacing: 0.1em; text-transform: uppercase;">DETALLE DE SOLICITUD</span>
            <h2 style="font-family: var(--font-serif); font-size: 28px; font-weight: 700; color: var(--mira-navy); margin-top: 2px;">${folio}</h2>
          </div>
          <span class="status-badge ${statusInfo.class}" style="font-size: 13px; padding: 6px 14px;">
            ${statusInfo.label}
          </span>
        </div>

        <div class="detail-prop-grid">
          <div class="detail-prop-box">
            <div class="detail-prop-label">Cliente / Contacto</div>
            <div class="detail-prop-value">${contact}${company}</div>
          </div>

          <div class="detail-prop-box">
            <div class="detail-prop-label">Ubicación de Proyecto</div>
            <div class="detail-prop-value">${location}</div>
          </div>

          <div class="detail-prop-box">
            <div class="detail-prop-label">Especialista Responsable</div>
            <div class="detail-prop-value">${operator}</div>
          </div>

          <div class="detail-prop-box">
            <div class="detail-prop-label">Nivel de Urgencia</div>
            <div class="detail-prop-value">${urgency}</div>
          </div>

          <div class="detail-prop-box detail-full-box">
            <div class="detail-prop-label">Servicio / Necesidad Requerida</div>
            <p style="font-size: 14.5px; color: var(--mira-text-primary); margin-top: 6px; line-height: 1.6;">${need}</p>
          </div>
        </div>

        ${extraSectionHtml}
      </div>
    `;
  }

  window.PortalCommon = {
    STATUS_CONFIG,
    getInitials,
    getRoleLabel,
    setupHeaderIdentity,
    showNotification,
    switchView,
    setupViewSwitcher,
    renderMetrics,
    renderRecentRequestsTable,
    renderRequestsList,
    renderRequestDetail
  };

})(window);
