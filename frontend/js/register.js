/**
 * Sistema MIRA - Registro Público de Cuentas CLIENT
 * Maneja la validación de campos, conexión con POST /api/auth/register y preservación de folios.
 */

(function () {
  'use strict';

  // Leer parámetros de URL
  const urlParams = new URLSearchParams(window.location.search);
  const folioParam = urlParams.get("folio");

  const folioNotice = document.getElementById("folioNotice");
  const folioRef = document.getElementById("folioRef");
  const loginLink = document.getElementById("loginLink");
  const successLoginBtn = document.getElementById("successLoginBtn");

  if (folioParam && folioNotice && folioRef) {
    folioRef.textContent = folioParam;
    folioNotice.classList.remove("hidden");

    if (loginLink) {
      loginLink.href = `login.html?folio=${encodeURIComponent(folioParam)}`;
    }
    if (successLoginBtn) {
      successLoginBtn.href = `login.html?folio=${encodeURIComponent(folioParam)}`;
    }
  }

  // Elementos del formulario
  const registerForm = document.getElementById("registerForm");
  const registerSuccess = document.getElementById("registerSuccess");
  const registerError = document.getElementById("registerError");
  const btnSubmitRegister = document.getElementById("btnSubmitRegister");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const companyInput = document.getElementById("company");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Helper para errores visuales
  const setFieldError = function (inputEl, errorId, message) {
    if (!inputEl) return;
    inputEl.classList.add("is-invalid");
    const errSpan = document.getElementById(errorId);
    if (errSpan) {
      errSpan.textContent = message;
      errSpan.classList.add("is-visible");
    }
  };

  const clearFieldError = function (inputEl, errorId) {
    if (!inputEl) return;
    inputEl.classList.remove("is-invalid");
    const errSpan = document.getElementById(errorId);
    if (errSpan) {
      errSpan.textContent = "";
      errSpan.classList.remove("is-visible");
    }
  };

  // Limpiar errores al escribir
  [
    { input: fullNameInput, id: "errorFullName" },
    { input: emailInput, id: "errorEmail" },
    { input: phoneInput, id: "errorPhone" },
    { input: passwordInput, id: "errorPassword" },
    { input: confirmPasswordInput, id: "errorConfirmPassword" }
  ].forEach(function (field) {
    if (field.input) {
      field.input.addEventListener("input", function () {
        clearFieldError(field.input, field.id);
        if (registerError) registerError.classList.add("hidden");
      });
    }
  });

  // Envío del formulario
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (registerError) registerError.classList.add("hidden");

      let isValid = true;
      let firstInvalid = null;

      const fullName = fullNameInput ? fullNameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const company = companyInput ? companyInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

      // Validaciones
      if (!fullName) {
        setFieldError(fullNameInput, "errorFullName", "Ingresa tu nombre completo.");
        if (!firstInvalid) firstInvalid = fullNameInput;
        isValid = false;
      }

      if (!email || !email.includes("@")) {
        setFieldError(emailInput, "errorEmail", "Ingresa un correo electrónico válido.");
        if (!firstInvalid) firstInvalid = emailInput;
        isValid = false;
      }

      if (!phone) {
        setFieldError(phoneInput, "errorPhone", "Ingresa tu teléfono de contacto.");
        if (!firstInvalid) firstInvalid = phoneInput;
        isValid = false;
      }

      if (!password || password.length < 6) {
        setFieldError(passwordInput, "errorPassword", "La contraseña debe tener al menos 6 caracteres.");
        if (!firstInvalid) firstInvalid = passwordInput;
        isValid = false;
      }

      if (password !== confirmPassword) {
        setFieldError(confirmPasswordInput, "errorConfirmPassword", "Las contraseñas no coinciden.");
        if (!firstInvalid) firstInvalid = confirmPasswordInput;
        isValid = false;
      }

      if (!isValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Procesar envío
      try {
        if (btnSubmitRegister) {
          btnSubmitRegister.disabled = true;
          btnSubmitRegister.innerHTML = "<span>Creando cuenta...</span>";
        }

        await api.register({
          fullName: fullName,
          email: email,
          phone: phone,
          company: company,
          password: password
        });

        // Éxito: ocultar formulario y mostrar mensaje de confirmación
        if (registerForm) registerForm.classList.add("hidden");
        if (registerSuccess) registerSuccess.classList.remove("hidden");

      } catch (err) {
        console.error("Error al registrar cliente:", err);
        if (registerError) {
          registerError.textContent = err.message || "No fue posible crear la cuenta en este momento. Intenta nuevamente.";
          registerError.classList.remove("hidden");
        }
      } finally {
        if (btnSubmitRegister) {
          btnSubmitRegister.disabled = false;
          btnSubmitRegister.innerHTML = "<span>Crear mi cuenta</span> →";
        }
      }
    });
  }
})();
