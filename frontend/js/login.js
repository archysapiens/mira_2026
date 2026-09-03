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
    
    localStorage.setItem('mira_token', data.token);
    localStorage.setItem('mira_user', JSON.stringify(data.user));
    
    location.href = 'portal.html';
  } catch (x) {
    error.textContent = x.message;
    error.classList.remove('hidden');
  }
};