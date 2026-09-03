// ==========================================================================
// SISTEMA MIRA - PORTAL Y DASHBOARD PRINCIPAL DE OPERACIÓN
// JavaScript Vanilla puro sin frameworks
// ==========================================================================

// 1. Validar autenticación y recuperar sesión
const rawUser = localStorage.getItem("mira_user");
const token = localStorage.getItem("mira_token");

if (!rawUser || !token) {
  window.location.href = "login.html";
}

let user = null;
try {
  user = JSON.parse(rawUser);
} catch (e) {
  localStorage.removeItem("mira_user");
  localStorage.removeItem("mira_token");
  window.location.href = "login.html";
}

if (!user) {
  window.location.href = "login.html";
}

// 2. Definición del rol
const userRole = (user.role || user.RoleCode || "CLIENT").toUpperCase();
const userName = user.name || user.FullName || user.email || "Usuario";
const userEmail = user.email || user.Email || "";

// Diccionario de etiquetas de estatus
const STATUS_CONFIG = {
  E: { label: "Enviada", class: "badge-sent" },
  A: { label: "Atendida", class: "badge-attended" },
  T: { label: "Terminada", class: "badge-completed" },
  C: { label: "Cancelada", class: "badge-canceled" }
};

// 3. Referencias del DOM explícitas (sin usar variables automáticas de ventana)
const userAvatarEl = document.getElementById("userAvatar");
const userNameEl = document.getElementById("userName");
const userRoleBadgeEl = document.getElementById("userRoleBadge");
const welcomeMessageEl = document.getElementById("welcomeMessage");
const requestsNavTextEl = document.getElementById("requestsNavText");
const logoutBtn = document.getElementById("logout");
const globalNotificationEl = document.getElementById("globalNotification");

// Métricas
const mTotalEl = document.getElementById("mTotal");
const mEEl = document.getElementById("mE");
const mAEl = document.getElementById("mA");
const mTEl = document.getElementById("mT");

// Solicitudes Recientes
const recentRequestsBodyEl = document.getElementById("recentRequestsBody");
const viewAllRequestsBtn = document.getElementById("viewAllRequestsBtn");

// Módulo Solicitudes
const refreshRequestsBtn = document.getElementById("refreshRequestsBtn");
const requestSearchInputEl = document.getElementById("requestSearchInput");
const requestListEl = document.getElementById("requestList");
const requestDetailEl = document.getElementById("requestDetail");
const requestsViewTitleEl = document.getElementById("requestsViewTitle");

// Módulo Notas
const notesRequestSelectEl = document.getElementById("notesRequestSelect");
const notesContainerEl = document.getElementById("notesContainer");
const addNoteFormContainerEl = document.getElementById("addNoteFormContainer");
const newNoteTextEl = document.getElementById("newNoteText");
const saveNoteBtn = document.getElementById("saveNoteBtn");

// Módulo Usuarios
const refreshUsersBtn = document.getElementById("refreshUsersBtn");
const userListBodyEl = document.getElementById("userListBody");

// Estado en memoria
let allRequests = [];
let allUsers = [];
let selectedRequestIndex = null;
let currentView = "summary";

// ==========================================================================
// INICIALIZACIÓN DE IDENTIDAD Y ROLES
// ==========================================================================

function getInitials(name) {
  if (!name) return "M";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getRoleLabel(code) {
  switch (code) {
    case "ADMIN": return "Administrador";
    case "OPERATOR": return "Operador";
    case "CLIENT": return "Cliente";
    default: return code;
  }
}

function setupIdentity() {
  const initials = getInitials(userName);
  const roleLabel = getRoleLabel(userRole);

  if (userAvatarEl) userAvatarEl.textContent = initials;
  if (userNameEl) userNameEl.textContent = userName;
  if (userRoleBadgeEl) userRoleBadgeEl.textContent = roleLabel;

  if (welcomeMessageEl) {
    welcomeMessageEl.textContent = `Bienvenido, ${userName} (${roleLabel}). Consulta el estado actual de las solicitudes y servicios de MIRA con métricas en tiempo real.`;
  }

  // Personalización según Rol
  if (userRole === "CLIENT") {
    if (requestsNavTextEl) requestsNavTextEl.textContent = "Mis solicitudes";
    if (requestsViewTitleEl) requestsViewTitleEl.textContent = "Mis Solicitudes";
    document.querySelectorAll(".client-only").forEach(el => el.classList.remove("hidden"));
    document.querySelectorAll(".client-admin-only").forEach(el => el.classList.remove("hidden"));
  } else if (userRole === "OPERATOR") {
    document.querySelectorAll(".staff").forEach(el => el.classList.remove("hidden"));
  } else if (userRole === "ADMIN") {
    document.querySelectorAll(".staff").forEach(el => el.classList.remove("hidden"));
    document.querySelectorAll(".admin").forEach(el => el.classList.remove("hidden"));
    document.querySelectorAll(".client-admin-only").forEach(el => el.classList.remove("hidden"));
  }
}

// ==========================================================================
// NOTIFICACIONES EN INTERFAZ
// ==========================================================================

function showNotification(message, type = "error") {
  if (!globalNotificationEl) return;
  globalNotificationEl.textContent = message;
  globalNotificationEl.style.display = "block";
  globalNotificationEl.style.padding = "12px 18px";
  globalNotificationEl.style.borderRadius = "4px";
  globalNotificationEl.style.fontSize = "13.5px";
  globalNotificationEl.style.fontWeight = "600";

  if (type === "error") {
    globalNotificationEl.style.background = "#FDF0ED";
    globalNotificationEl.style.color = "#9B2C1D";
    globalNotificationEl.style.border = "1px solid #F6C8BE";
  } else {
    globalNotificationEl.style.background = "#EEF7E6";
    globalNotificationEl.style.color = "#2D6619";
    globalNotificationEl.style.border = "1px solid #C8E6B2";
  }

  globalNotificationEl.classList.remove("hidden");

  setTimeout(() => {
    globalNotificationEl.classList.add("hidden");
  }, 5000);
}

// ==========================================================================
// NAVEGACIÓN Y VISTAS
// ==========================================================================

window.switchView = function(viewName) {
  currentView = viewName;

  // Actualizar botones del menú
  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  // Ocultar / Mostrar paneles
  const viewPanels = ["summary", "requests", "notes", "users"];
  viewPanels.forEach(panelId => {
    const el = document.getElementById(panelId);
    if (el) {
      el.classList.toggle("hidden", panelId !== viewName);
    }
  });

  // Scroll suave al área de contenido si no es summary
  const opContainer = document.getElementById("dashboard-operations");
  if (opContainer && viewName !== "summary") {
    opContainer.scrollIntoView({ behavior: "smooth" });
  }

  // Cargas específicas bajo demanda
  if (viewName === "users" && userRole === "ADMIN") {
    loadUsers();
  }
};

// Configurar eventos de navegación
document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    window.switchView(button.dataset.view);
  });
});

if (viewAllRequestsBtn) {
  viewAllRequestsBtn.addEventListener("click", () => {
    window.switchView("requests");
  });
}

// ==========================================================================
// CARGA DE DATOS: DASHBOARD Y SOLICITUDES
// ==========================================================================

async function loadDashboardAndRequests() {
  try {
    const [dashboardData, requestsData] = await Promise.all([
      api.dashboard().catch(err => ({ counts: {} })),
      api.requests().catch(err => [])
    ]);

    // 1. Renderizar Métricas
    const counts = dashboardData.counts || {};
    const countE = Number(counts.E || 0);
    const countA = Number(counts.A || 0);
    const countT = Number(counts.T || 0);
    const countC = Number(counts.C || 0);
    const totalCount = countE + countA + countT + countC;

    if (mTotalEl) mTotalEl.textContent = totalCount;
    if (mEEl) mEEl.textContent = countE;
    if (mAEl) mAEl.textContent = countA;
    if (mTEl) mTEl.textContent = countT;

    // 2. Guardar solicitudes
    allRequests = Array.isArray(requestsData) ? requestsData : [];

    // 3. Renderizar Solicitudes Recientes en Dashboard
    renderRecentRequestsTable(allRequests);

    // 4. Renderizar Lista en Módulo Solicitudes
    renderRequestsList(allRequests);

    // 5. Poblar selector de notas
    populateNotesRequestSelector(allRequests);

  } catch (error) {
    console.error("Error al cargar portal:", error);
    showNotification("Error al cargar datos del sistema: " + error.message, "error");
  }
}

// Renderizar tabla de solicitudes recientes (Top 5)
function renderRecentRequestsTable(requests) {
  if (!recentRequestsBodyEl) return;

  if (requests.length === 0) {
    recentRequestsBodyEl.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 36px; color: #56696D;">No hay solicitudes registradas en este momento.</td>
      </tr>
    `;
    return;
  }

  const top5 = requests.slice(0, 5);

  recentRequestsBodyEl.innerHTML = top5.map((req, index) => {
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
          <button class="btn-view-all" onclick="goToRequestDetail(${index})" style="padding: 5px 12px; font-size: 12px;">
            Ver detalle →
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.goToRequestDetail = function(index) {
  window.switchView("requests");
  selectRequest(index);
};

// ==========================================================================
// MÓDULO SOLICITUDES: LISTA Y DETALLE
// ==========================================================================

function renderRequestsList(requests) {
  if (!requestListEl) return;

  if (requests.length === 0) {
    requestListEl.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #56696D;">No se encontraron solicitudes.</div>
    `;
    return;
  }

  requestListEl.innerHTML = requests.map((req, index) => {
    const statusInfo = STATUS_CONFIG[req.Status] || { label: req.Status || "-", class: "badge-sent" };
    const folio = req.Folio || "Sin folio";
    const contact = req.ContactName || "Sin nombre";
    const need = req.Need || "Servicio MIRA";
    const isSelected = index === selectedRequestIndex;

    return `
      <button class="request-item-btn ${isSelected ? 'active' : ''}" data-index="${index}" onclick="selectRequest(${index})">
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

window.selectRequest = async function(index) {
  selectedRequestIndex = index;
  const req = allRequests[index];

  document.querySelectorAll(".request-item-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });

  if (!req || !requestDetailEl) return;

  const statusInfo = STATUS_CONFIG[req.Status] || { label: req.Status || "Sin estado", class: "badge-sent" };
  const folio = req.Folio || "SOLICITUD";
  const contact = req.ContactName || "-";
  const company = req.Company ? ` (${req.Company})` : "";
  const location = req.Location || "No especificada";
  const operator = req.OperatorName || "Sin asignar";
  const urgency = req.Urgency || "Normal";
  const need = req.Need || "Servicio general MIRA";

  let adminAssignSection = "";
  if (userRole === "ADMIN") {
    adminAssignSection = `
      <div style="border-top: 1px solid var(--mira-line); padding-top: 20px; margin-top: 20px;">
        <span class="detail-prop-label">Asignar Especialista a esta Solicitud</span>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <select id="operatorAssignSelect" class="mira-input-search" style="background: #FFF;">
            <option value="">-- Seleccionar operador --</option>
          </select>
          <button class="btn-cta-green" onclick="assignSelectedOperator('${req.RequestId}')">Asignar</button>
        </div>
      </div>
    `;
  }

  requestDetailEl.innerHTML = `
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

      ${adminAssignSection}
    </div>
  `;

  if (userRole === "ADMIN") {
    populateOperatorAssignSelect();
  }
};

if (requestSearchInputEl) {
  requestSearchInputEl.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderRequestsList(allRequests);
      return;
    }

    const filtered = allRequests.filter(r => {
      const folio = (r.Folio || "").toLowerCase();
      const contact = (r.ContactName || "").toLowerCase();
      const need = (r.Need || "").toLowerCase();
      return folio.includes(term) || contact.includes(term) || need.includes(term);
    });

    renderRequestsList(filtered);
  });
}

if (refreshRequestsBtn) {
  refreshRequestsBtn.addEventListener("click", async () => {
    refreshRequestsBtn.disabled = true;
    await loadDashboardAndRequests();
    refreshRequestsBtn.disabled = false;
    showNotification("Solicitudes actualizadas con éxito.", "success");
  });
}

// ==========================================================================
// ASIGNACIÓN DE OPERADOR (ADMIN)
// ==========================================================================

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

window.assignSelectedOperator = async function(requestId) {
  const select = document.getElementById("operatorAssignSelect");
  if (!select || !select.value) {
    showNotification("Por favor selecciona un operador para asignar.", "error");
    return;
  }

  try {
    await api.assign(requestId, select.value);
    showNotification("Operador asignado correctamente.", "success");
    await loadDashboardAndRequests();
    if (selectedRequestIndex !== null) {
      selectRequest(selectedRequestIndex);
    }
  } catch (error) {
    showNotification("Error al asignar operador: " + error.message, "error");
  }
};

// ==========================================================================
// MÓDULO NOTAS DE TRABAJO (STAFF / OPERATOR / ADMIN)
// ==========================================================================

function populateNotesRequestSelector(requests) {
  if (!notesRequestSelectEl) return;

  notesRequestSelectEl.innerHTML = '<option value="">-- Elige una solicitud --</option>' + 
    requests.map(req => `
      <option value="${req.RequestId}">${req.Folio || "Sin folio"} · ${req.ContactName || "Contacto"} (${req.Need || "Servicio"})</option>
    `).join("");
}

if (notesRequestSelectEl) {
  notesRequestSelectEl.addEventListener("change", async () => {
    const requestId = notesRequestSelectEl.value;
    if (!requestId) {
      notesContainerEl.innerHTML = `<div style="text-align: center; padding: 30px; color: #56696D; font-style: italic;">Selecciona una solicitud arriba para consultar las notas técnicas.</div>`;
      if (addNoteFormContainerEl) addNoteFormContainerEl.classList.add("hidden");
      return;
    }

    await loadNotesForRequest(requestId);
  });
}

async function loadNotesForRequest(requestId) {
  if (!notesContainerEl) return;
  notesContainerEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #56696D;">Cargando bitácora de notas...</div>`;

  try {
    const notes = await api.notes(requestId);
    if (addNoteFormContainerEl && userRole !== "CLIENT") {
      addNoteFormContainerEl.classList.remove("hidden");
    }

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
      showNotification("Selecciona una solicitud primero.", "error");
      return;
    }

    if (!noteText) {
      showNotification("Escribe el contenido de la nota antes de guardar.", "error");
      return;
    }

    try {
      saveNoteBtn.disabled = true;
      await api.addNote(requestId, noteText);
      newNoteTextEl.value = "";
      showNotification("Nota guardada en bitácora exitosamente.", "success");
      await loadNotesForRequest(requestId);
    } catch (error) {
      showNotification("Error al guardar nota: " + error.message, "error");
    } finally {
      saveNoteBtn.disabled = false;
    }
  });
}

// ==========================================================================
// MÓDULO GESTIÓN DE USUARIOS (ADMIN)
// ==========================================================================

async function loadUsers() {
  if (userRole !== "ADMIN" || !userListBodyEl) return;

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

// ==========================================================================
// CERRAR SESIÓN
// ==========================================================================

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("mira_token");
    localStorage.removeItem("mira_user");
    window.location.href = "login.html";
  });
}

// ==========================================================================
// INICIO AUTOMÁTICO
// ==========================================================================

setupIdentity();
loadDashboardAndRequests();