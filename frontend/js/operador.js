/**
 * Sistema MIRA - Controlador del Portal Operativo (operador.js)
 * Exclusivo para usuarios autenticados con rol OPERATOR.
 */

(function () {
  'use strict';

  // 1. Proteger acceso: Solo rol OPERATOR
  const session = window.protectPage("OPERATOR");

  // Estado local
  let allRequests = [];
  let selectedRequestIndex = null;

  // 2. Inicializar cabecera e identidad
  PortalCommon.setupHeaderIdentity(session);

  // 3. Configurar selector de vistas (summary, requests, notes)
  PortalCommon.setupViewSwitcher(["summary", "requests", "notes"]);

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

    // Sección de acceso rápido a bitácora para el operador
    const operatorActionHtml = `
      <div style="border-top: 1px solid var(--mira-line); padding-top: 20px; margin-top: 20px; display: flex; justify-content: flex-end;">
        <button class="btn-cta-green" onclick="window.openNotesForRequest('${req.RequestId}')">
          <span>Abrir bitácora de notas</span> →
        </button>
      </div>
    `;

    PortalCommon.renderRequestDetail(req, { extraHtml: operatorActionHtml });
  };

  window.openNotesForRequest = function (requestId) {
    window.switchView("notes");
    const select = document.getElementById("notesRequestSelect");
    if (select) {
      select.value = requestId;
      loadNotesForRequest(requestId);
    }
  };

  // 5. Carga de datos operativos
  async function loadOperatorData() {
    try {
      const [dashboardData, requestsData] = await Promise.all([
        api.dashboard().catch(() => ({ counts: {} })),
        api.requests().catch(() => [])
      ]);

      // Renderizar métricas operativas
      PortalCommon.renderMetrics(dashboardData.counts || {});

      // Guardar y renderizar solicitudes asignadas
      allRequests = Array.isArray(requestsData) ? requestsData : [];
      PortalCommon.renderRecentRequestsTable(allRequests);
      PortalCommon.renderRequestsList(allRequests, selectedRequestIndex);

      if (allRequests.length > 0 && selectedRequestIndex === null) {
        window.selectRequest(0);
      }

      // Poblar selector de notas
      populateNotesRequestSelector(allRequests);

    } catch (error) {
      console.error("Error al cargar portal operador:", error);
      PortalCommon.showNotification("Error al cargar datos operativos: " + error.message, "error");
    }
  }

  // 6. Módulo Notas de Trabajo
  const notesRequestSelectEl = document.getElementById("notesRequestSelect");
  const notesContainerEl = document.getElementById("notesContainer");
  const addNoteFormContainerEl = document.getElementById("addNoteFormContainer");
  const newNoteTextEl = document.getElementById("newNoteText");
  const saveNoteBtn = document.getElementById("saveNoteBtn");

  function populateNotesRequestSelector(requests) {
    if (!notesRequestSelectEl) return;
    notesRequestSelectEl.innerHTML = '<option value="">-- Elige una solicitud asignada --</option>' +
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

  // 7. Buscador de solicitudes
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

  // 8. Botón refrescar
  const refreshBtn = document.getElementById("refreshRequestsBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      await loadOperatorData();
      refreshBtn.disabled = false;
      PortalCommon.showNotification("Solicitudes operativas actualizadas.", "success");
    });
  }

  // Carga inicial
  loadOperatorData();

})();
