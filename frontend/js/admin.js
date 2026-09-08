/**
 * Sistema MIRA - Controlador del Portal de Administración (admin.js)
 * Exclusivo para usuarios autenticados con rol ADMIN.
 */

(function () {
  'use strict';

  // 1. Proteger acceso: Solo rol ADMIN
  const session = window.protectPage("ADMIN");

  // Estado local
  let allRequests = [];
  let allUsers = [];
  let selectedRequestIndex = null;

  // 2. Inicializar cabecera e identidad
  PortalCommon.setupHeaderIdentity(session);

  // 3. Configurar selector de vistas (summary, requests, notes, users)
  PortalCommon.setupViewSwitcher(["summary", "requests", "notes", "users"], (viewName) => {
    if (viewName === "users") {
      loadUsers();
    }
  });

  // 4. Implementar selección y navegación de detalle
  window.goToRequestDetail = function (index) {
    window.switchView("requests");
    window.selectRequest(index);
  };

  window.selectRequest = function (index) {
    selectedRequestIndex = index;
    const req = allRequests[index];

    // Actualizar clase activa en la lista
    document.querySelectorAll(".request-item-btn").forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });

    if (!req) return;

    // Sección exclusiva de asignación de operadores para ADMIN
    const adminAssignHtml = `
      <div style="border-top: 1px solid var(--mira-line); padding-top: 20px; margin-top: 20px;">
        <span class="detail-prop-label">Asignar Especialista a esta Solicitud</span>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <select id="operatorAssignSelect" class="mira-input-search" style="background: #FFF;">
            <option value="">-- Seleccionar operador --</option>
          </select>
          <button class="btn-cta-green" onclick="window.assignSelectedOperator('${req.RequestId}')">Asignar</button>
        </div>
      </div>
    `;

    PortalCommon.renderRequestDetail(req, { extraHtml: adminAssignHtml });
    populateOperatorAssignSelect();
  };

  // 5. Asignación de operadores
  async function populateOperatorAssignSelect() {
    const select = document.getElementById("operatorAssignSelect");
    if (!select) return;

    try {
      if (allUsers.length === 0) {
        allUsers = await api.users();
      }
      const operators = allUsers.filter(u => (u.RoleCode || "").toUpperCase() === "OPERATOR");
      select.innerHTML = '<option value="">-- Seleccionar operador --</option>' + 
        operators.map(op => `<option value="${op.UserId}">${op.FullName} (${op.Email})</option>`).join("");
    } catch (e) {
      console.error("Error al poblar operadores:", e);
    }
  }

  window.assignSelectedOperator = async function (requestId) {
    const select = document.getElementById("operatorAssignSelect");
    if (!select || !select.value) {
      PortalCommon.showNotification("Por favor selecciona un operador para asignar.", "error");
      return;
    }

    try {
      await api.assign(requestId, select.value);
      PortalCommon.showNotification("Operador asignado correctamente.", "success");
      await loadAdminData();
      if (selectedRequestIndex !== null) {
        window.selectRequest(selectedRequestIndex);
      }
    } catch (error) {
      PortalCommon.showNotification("Error al asignar operador: " + error.message, "error");
    }
  };

  // 6. Carga de datos administrativos
  async function loadAdminData() {
    try {
      const [dashboardData, requestsData] = await Promise.all([
        api.dashboard().catch(() => ({ counts: {} })),
        api.requests().catch(() => [])
      ]);

      // Renderizar métricas globales
      PortalCommon.renderMetrics(dashboardData.counts || {});

      // Guardar y renderizar solicitudes
      allRequests = Array.isArray(requestsData) ? requestsData : [];
      PortalCommon.renderRecentRequestsTable(allRequests);
      PortalCommon.renderRequestsList(allRequests, selectedRequestIndex);

      if (allRequests.length > 0 && selectedRequestIndex === null) {
        window.selectRequest(0);
      }

      // Poblar selector de notas
      populateNotesRequestSelector(allRequests);

    } catch (error) {
      console.error("Error al cargar portal admin:", error);
      PortalCommon.showNotification("Error al cargar datos de administración: " + error.message, "error");
    }
  }

  // 7. Módulo Notas de Trabajo
  const notesRequestSelectEl = document.getElementById("notesRequestSelect");
  const notesContainerEl = document.getElementById("notesContainer");
  const addNoteFormContainerEl = document.getElementById("addNoteFormContainer");
  const newNoteTextEl = document.getElementById("newNoteText");
  const saveNoteBtn = document.getElementById("saveNoteBtn");

  function populateNotesRequestSelector(requests) {
    if (!notesRequestSelectEl) return;
    notesRequestSelectEl.innerHTML = '<option value="">-- Elige una solicitud --</option>' + 
      requests.map(req => `
        <option value="${req.RequestId}">${req.Folio || "Sin folio"} · ${req.ContactName || "Contacto"} (${req.Need || "Servicio"})</option>
      `).join("");
  }

  if (notesRequestSelectEl) {
    notesRequestSelectEl.addEventListener("change", () => {
      const requestId = notesRequestSelectEl.value;
      if (!requestId) {
        if (notesContainerEl) {
          notesContainerEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #56696D; font-style: italic;">Selecciona una solicitud arriba para consultar las notas técnicas.</div>`;
        }
        if (addNoteFormContainerEl) addNoteFormContainerEl.classList.add("hidden");
        return;
      }
      loadNotesForRequest(requestId);
    });
  }

  async function loadNotesForRequest(requestId) {
    if (!notesContainerEl) return;
    notesContainerEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #56696D;">Cargando bitácora de notas...</div>`;

    try {
      const notes = await api.notes(requestId);
      if (addNoteFormContainerEl) addNoteFormContainerEl.classList.remove("hidden");

      if (!Array.isArray(notes) || notes.length === 0) {
        notesContainerEl.innerHTML = `<div style="text-align: center; padding: 24px; color: #56696D; font-style: italic;">No existen notas de trabajo registradas para esta solicitud aún.</div>`;
        return;
      }

      notesContainerEl.innerHTML = notes.map(n => {
        const dateStr = n.CreatedAt ? new Date(n.CreatedAt).toLocaleString("es-MX") : "Fecha no disponible";
        return `
          <div style="background: var(--mira-bg-subtle); border: 1px solid var(--mira-line); border-radius: 4px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
              <strong style="color: var(--mira-navy);">🛠️ ${n.Author || "Especialista"}</strong>
              <span style="color: var(--mira-text-muted);">${dateStr}</span>
            </div>
            <div style="font-size: 13.5px; color: var(--mira-text-primary); line-height: 1.5;">${n.Note || ""}</div>
          </div>
        `;
      }).join("");

    } catch (error) {
      notesContainerEl.innerHTML = `<div style="background: #FDF0ED; color: #9B2C1D; padding: 12px;">No fue posible cargar las notas: ${error.message}</div>`;
    }
  }

  if (saveNoteBtn) {
    saveNoteBtn.addEventListener("click", async () => {
      const requestId = notesRequestSelectEl.value;
      const noteText = newNoteTextEl.value.trim();

      if (!requestId) {
        PortalCommon.showNotification("Selecciona una solicitud primero.", "error");
        return;
      }

      if (!noteText) {
        PortalCommon.showNotification("Escribe el contenido de la nota antes de guardar.", "error");
        return;
      }

      try {
        saveNoteBtn.disabled = true;
        await api.addNote(requestId, noteText);
        newNoteTextEl.value = "";
        PortalCommon.showNotification("Nota guardada en bitácora exitosamente.", "success");
        await loadNotesForRequest(requestId);
      } catch (error) {
        PortalCommon.showNotification("Error al guardar nota: " + error.message, "error");
      } finally {
        saveNoteBtn.disabled = false;
      }
    });
  }

  // 8. Módulo Usuarios (Admin)
  const userListBodyEl = document.getElementById("userListBody");
  const refreshUsersBtn = document.getElementById("refreshUsersBtn");

  async function loadUsers() {
    if (!userListBodyEl) return;

    userListBodyEl.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 30px; color: #56696D;">Cargando usuarios del sistema...</td>
      </tr>
    `;

    try {
      allUsers = await api.users();

      if (!Array.isArray(allUsers) || allUsers.length === 0) {
        userListBodyEl.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 30px; color: #56696D;">No hay usuarios registrados.</td>
          </tr>
        `;
        return;
      }

      userListBodyEl.innerHTML = allUsers.map(u => {
        const roleCode = (u.RoleCode || "").toUpperCase();
        let roleClass = "badge-sent";
        let roleLabel = "Cliente";

        if (roleCode === "ADMIN") {
          roleClass = "badge-canceled";
          roleLabel = "Administrador";
        } else if (roleCode === "OPERATOR") {
          roleClass = "badge-attended";
          roleLabel = "Operador";
        }

        const isActive = u.IsActive !== false;

        return `
          <tr>
            <td><strong style="color: var(--mira-navy);">${u.FullName || "-"}</strong></td>
            <td>${u.Email || "-"}</td>
            <td><span class="status-badge ${roleClass}">${roleLabel}</span></td>
            <td>
              <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: ${isActive ? '#2D6619' : '#9B2C1D'};">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isActive ? '#7AC143' : '#9B2C1D'};"></span>
                ${isActive ? 'Activo' : 'Inactivo'}
              </span>
            </td>
          </tr>
        `;
      }).join("");

    } catch (error) {
      userListBodyEl.innerHTML = `
        <tr>
          <td colspan="4" style="color: #9B2C1D; padding: 20px;">Error al cargar usuarios: ${error.message}</td>
        </tr>
      `;
    }
  }

  if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener("click", async () => {
      refreshUsersBtn.disabled = true;
      await loadUsers();
      refreshUsersBtn.disabled = false;
    });
  }

  // 9. Buscador de solicitudes
  const searchInput = document.getElementById("requestSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        PortalCommon.renderRequestsList(allRequests, selectedRequestIndex);
        return;
      }
      const filtered = allRequests.filter(r => {
        const folio = (r.Folio || "").toLowerCase();
        const contact = (r.ContactName || "").toLowerCase();
        const need = (r.Need || "").toLowerCase();
        return folio.includes(term) || contact.includes(term) || need.includes(term);
      });
      PortalCommon.renderRequestsList(filtered, null);
    });
  }

  // 10. Botón refrescar
  const refreshBtn = document.getElementById("refreshRequestsBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      await loadAdminData();
      refreshBtn.disabled = false;
      PortalCommon.showNotification("Solicitudes actualizadas con éxito.", "success");
    });
  }

  // Carga inicial
  loadAdminData();

})();
