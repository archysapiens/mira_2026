// Si ya existe sesión activa válida, redirigir a su portal correspondiente
(function checkExistingSession() {
  if (window.getAuthSession) {
    const session = window.getAuthSession();
    if (session) {
      const target = window.getRedirectUrlForRole(session.role);
      if (target && target !== 'login.html') {
        window.location.href = target;
      }
    }
  }
})();

// Asigna el evento click a los botones con atributo data-email
document.querySelectorAll('[data-email]').forEach(b => {
  b.onclick = () => email.value = b.dataset.email;
});

// Manejo del formulario de inicio de sesión
login.onsubmit = async (e) => {
  e.preventDefault();
  error.classList.add('hidden');

  try {
    const data = await api.login(email.value, password.value);
    
    if (!data || !data.token || !data.user) {
      throw new Error("Respuesta del servidor incompleta.");
    }

    localStorage.setItem('mira_token', data.token);
    localStorage.setItem('mira_user', JSON.stringify(data.user));
    
    // Obtener rol del backend/JWT
    const role = (data.user.role || data.user.RoleCode || '').toUpperCase();

    if (role === "CLIENT") {
      window.location.href = "cliente.html";
    } else if (role === "OPERATOR") {
      window.location.href = "operador.html";
    } else if (role === "ADMIN") {
      window.location.href = "admin.html";
    } else {
      localStorage.removeItem('mira_token');
      localStorage.removeItem('mira_user');
      throw new Error(`Rol "${role || 'DESCONOCIDO'}" no autorizado en el sistema.`);
    }
  } catch (x) {
    error.textContent = x.message || "Error al iniciar sesión";
    error.classList.remove('hidden');
  }
};