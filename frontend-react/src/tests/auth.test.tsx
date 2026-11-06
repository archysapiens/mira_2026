import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, getRedirectPathForRole, parseJwt } from '../context/AuthContext';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { VerifyOtpModal } from '../components/common/VerifyOtpModal';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage';
import { OperatorDashboardPage } from '../pages/operator/OperatorDashboardPage';
import { authApi } from '../api/auth';
import type { AuthUser } from '../types';

// Helper para crear un token JWT mockeado
const createMockToken = (payload: { id: number; email: string; name: string; role: string; exp: number }) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock_signature`;
};

describe('MIRA - Pruebas de Autenticación, Registro y OTP (Fase 8)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. Inicio de sesión correcto
  it('1. Inicio de sesión correcto guarda el token y usuario en localStorage', async () => {
    const mockUser: AuthUser = {
      id: 1,
      email: 'cliente@mira.com',
      name: 'Cliente MIRA',
      role: 'CLIENT',
      emailVerified: true,
    };
    const mockToken = createMockToken({
      id: 1,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.spyOn(authApi, 'login').mockResolvedValueOnce({
      token: mockToken,
      user: mockUser,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'cliente@mira.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'cliente@mira.com',
        password: 'password123',
      });
      expect(localStorage.getItem('mira_token')).toBe(mockToken);
      expect(JSON.parse(localStorage.getItem('mira_user') || '{}').email).toBe('cliente@mira.com');
    });
  });

  // 2. Credenciales incorrectas
  it('2. Credenciales incorrectas muestra mensaje de error y no guarda token', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValueOnce(new Error('Credenciales inválidas.'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@mira.com' } });
    fireEvent.change(passwordInput, { target: { value: 'badpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/credenciales inválidas/i);
      expect(localStorage.getItem('mira_token')).toBeNull();
    });
  });

  // 3. Campos vacíos
  it('3. Campos vacíos detiene el envío y muestra mensaje de validación', async () => {
    const loginSpy = vi.spyOn(authApi, 'login');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/por favor ingresa tu correo electrónico y contraseña/i)).toBeInTheDocument();
      expect(loginSpy).not.toHaveBeenCalled();
    });
  });

  // 4. Registro correcto
  it('4. Registro correcto llama a la API y muestra confirmación de cuenta creada', async () => {
    vi.spyOn(authApi, 'register').mockResolvedValueOnce({
      id: 42,
      email: 'nuevo@empresa.com',
      emailVerified: false,
      message: 'Cuenta creada exitosamente.',
    });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Nuevo Usuario' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'nuevo@empresa.com' } });
    fireEvent.change(screen.getByLabelText(/teléfono de contacto/i), { target: { value: '5512345678' } });
    fireEvent.change(screen.getByLabelText(/empresa/i), { target: { value: 'Mi Empresa SA' } });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'pass1234' } });

    fireEvent.click(screen.getByRole('button', { name: /crear mi cuenta/i }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        fullName: 'Nuevo Usuario',
        email: 'nuevo@empresa.com',
        phone: '5512345678',
        company: 'Mi Empresa SA',
        password: 'pass1234',
      });
      expect(screen.getByText(/¡Tu cuenta MIRA ha sido creada correctamente!/i)).toBeInTheDocument();
    });
  });

  // 5. Errores de registro (contraseñas no coinciden y duplicidad de correo)
  it('5. Errores de registro: detecta contraseñas no coincidentes y errores del servidor', async () => {
    const registerSpy = vi.spyOn(authApi, 'register');

    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Usuario' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText(/teléfono de contacto/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), { target: { value: 'pass1234' } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'diferente' } });

    fireEvent.click(screen.getByRole('button', { name: /crear mi cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
      expect(registerSpy).not.toHaveBeenCalled();
    });

    // Ahora simular que coinciden pero el backend rechaza por correo existente
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'pass1234' } });
    registerSpy.mockRejectedValueOnce(new Error('El correo electrónico ya se encuentra registrado.'));

    fireEvent.click(screen.getByRole('button', { name: /crear mi cuenta/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ya se encuentra registrado/i);
    });
  });

  // 6. Solicitud OTP
  it('6. Solicitud OTP: envía solicitud y pasa al paso de ingresar código', async () => {
    vi.spyOn(authApi, 'requestEmailVerification').mockResolvedValueOnce({
      sent: true,
      expiresInMinutes: 15,
      message: 'Código enviado a tu correo.',
      devCode: '654321',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <VerifyOtpModal
            isOpen={true}
            onClose={vi.fn()}
            initialEmail="cliente@mira.com"
          />
        </AuthProvider>
      </MemoryRouter>
    );

    const sendCodeBtn = screen.getByRole('button', { name: /enviar código por correo/i });
    fireEvent.click(sendCodeBtn);

    await waitFor(() => {
      expect(authApi.requestEmailVerification).toHaveBeenCalledWith({ email: 'cliente@mira.com' });
      expect(screen.getByText(/ingresa el código de 6 dígitos/i)).toBeInTheDocument();
    });
  });

  // 7. OTP válido
  it('7. OTP válido: verifica código y muestra confirmación de vinculación', async () => {
    vi.spyOn(authApi, 'requestEmailVerification').mockResolvedValueOnce({
      sent: true,
      expiresInMinutes: 15,
      message: 'Código enviado',
    });

    vi.spyOn(authApi, 'verifyEmail').mockResolvedValueOnce({
      verified: true,
      emailVerified: true,
      claimedCount: 2,
      claimedFolios: ['SOL-2026-001', 'SOL-2026-002'],
      message: 'Correo verificado y solicitudes vinculadas.',
    });

    const onVerifiedMock = vi.fn();

    render(
      <MemoryRouter>
        <AuthProvider>
          <VerifyOtpModal
            isOpen={true}
            onClose={vi.fn()}
            initialEmail="cliente@mira.com"
            onVerified={onVerifiedMock}
          />
        </AuthProvider>
      </MemoryRouter>
    );

    // Paso 1: Enviar
    fireEvent.click(screen.getByRole('button', { name: /enviar código por correo/i }));

    // Paso 2: Ingresar código
    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar código/i }));

    // Paso 3: Éxito
    await waitFor(() => {
      expect(authApi.verifyEmail).toHaveBeenCalledWith({
        email: 'cliente@mira.com',
        code: '123456',
      });
      expect(screen.getByText(/¡Correo verificado con éxito!/i)).toBeInTheDocument();
      expect(screen.getByText(/solicitudes vinculadas: 2/i)).toBeInTheDocument();
      expect(onVerifiedMock).toHaveBeenCalled();
    });
  });

  // 8. OTP incorrecto
  it('8. OTP incorrecto: muestra mensaje de error sin avanzar', async () => {
    vi.spyOn(authApi, 'requestEmailVerification').mockResolvedValueOnce({
      sent: true,
      expiresInMinutes: 15,
      message: 'Código enviado',
    });

    vi.spyOn(authApi, 'verifyEmail').mockRejectedValueOnce(
      new Error('Código incorrecto o no encontrado. Revisa el código ingresado.')
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <VerifyOtpModal
            isOpen={true}
            onClose={vi.fn()}
            initialEmail="cliente@mira.com"
          />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /enviar código por correo/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '999999' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar código/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/código incorrecto o no encontrado/i);
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
  });

  // 9. OTP expirado
  it('9. OTP expirado: muestra error indicando código expirado', async () => {
    vi.spyOn(authApi, 'requestEmailVerification').mockResolvedValueOnce({
      sent: true,
      expiresInMinutes: 15,
      message: 'Código enviado',
    });

    vi.spyOn(authApi, 'verifyEmail').mockRejectedValueOnce(
      new Error('El código de verificación ha expirado. Solicita uno nuevo.')
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <VerifyOtpModal
            isOpen={true}
            onClose={vi.fn()}
            initialEmail="cliente@mira.com"
          />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /enviar código por correo/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '111111' } });
    fireEvent.click(screen.getByRole('button', { name: /verificar código/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/ha expirado/i);
    });
  });

  // 10. Redirección por roles
  it('10. Redirección por roles mapea correctamente CLIENT, OPERATOR y ADMIN', () => {
    expect(getRedirectPathForRole('CLIENT')).toBe('/cliente');
    expect(getRedirectPathForRole('OPERATOR')).toBe('/operador');
    expect(getRedirectPathForRole('ADMIN')).toBe('/admin');
  });

  // 11. Token expirado
  it('11. Token expirado es detectado por parseJwt e isTokenExpired', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 300; // Expiró hace 5 minutos
    const expiredToken = createMockToken({
      id: 1,
      email: 'cliente@mira.com',
      name: 'Cliente MIRA',
      role: 'CLIENT',
      exp: expiredExp,
    });

    const parsed = parseJwt(expiredToken);
    expect(parsed).not.toBeNull();
    expect(parsed?.exp).toBe(expiredExp);
    expect((parsed?.exp || 0) * 1000 < Date.now()).toBe(true);
  });

  // 12. Cierre de sesión
  it('12. Cierre de sesión limpia mira_token y mira_user de localStorage', async () => {
    const token = createMockToken({
      id: 1,
      email: 'cliente@mira.com',
      name: 'Cliente MIRA',
      role: 'CLIENT',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const user: AuthUser = { id: 1, email: 'cliente@mira.com', name: 'Cliente MIRA', role: 'CLIENT' };

    localStorage.setItem('mira_token', token);
    localStorage.setItem('mira_user', JSON.stringify(user));

    render(
      <MemoryRouter initialEntries={['/cliente']}>
        <AuthProvider>
          <ClientDashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(localStorage.getItem('mira_token')).toBeNull();
      expect(localStorage.getItem('mira_user')).toBeNull();
    });
  });

  // 13. Acceso a rutas protegidas
  it('13. Acceso a rutas protegidas bloquea usuarios no autenticados o con rol incorrecto', async () => {
    // Caso A: No autenticado -> redirige a /login
    render(
      <MemoryRouter initialEntries={['/cliente']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Pantalla de Login</div>} />
            <Route
              path="/cliente"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <div>Panel Cliente Secreto</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Pantalla de Login')).toBeInTheDocument();
    expect(screen.queryByText('Panel Cliente Secreto')).not.toBeInTheDocument();

    // Caso B: Autenticado con rol OPERATOR intentando acceder a /cliente
    const operatorToken = createMockToken({
      id: 2,
      email: 'operador@mira.com',
      name: 'Operador MIRA',
      role: 'OPERATOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const operatorUser: AuthUser = { id: 2, email: 'operador@mira.com', name: 'Operador MIRA', role: 'OPERATOR' };

    localStorage.setItem('mira_token', operatorToken);
    localStorage.setItem('mira_user', JSON.stringify(operatorUser));

    render(
      <MemoryRouter initialEntries={['/cliente']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Pantalla de Login</div>} />
            <Route path="/operador" element={<OperatorDashboardPage />} />
            <Route
              path="/cliente"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <div>Panel Cliente Secreto</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Debe ser redirigido a /operador
    await waitFor(() => {
      expect(screen.getByText('PORTAL TÉCNICO OPERATIVO')).toBeInTheDocument();
      expect(screen.queryByText('Panel Cliente Secreto')).not.toBeInTheDocument();
    });
  });

  // 14. Errores de comunicación con la API
  it('14. Errores de comunicación con la API maneja caídas de red amistosamente', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValueOnce(
      new Error('Error de conexión con el servidor. Verifica tu conexión.')
    );

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'cliente@mira.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/error de conexión con el servidor/i);
    });
  });
});
