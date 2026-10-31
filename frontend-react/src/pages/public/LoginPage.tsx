import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authApi } from '../../api/auth';
import { useAuth, getRedirectPathForRole } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folioParam = searchParams.get('folio');

  const { isAuthenticated, role, login } = useAuth();

  const [email, setEmail] = useState('cliente@mira.com');
  const [password, setPassword] = useState('123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Si ya existe sesión activa, redirigir automáticamente según el rol del JWT
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(getRedirectPathForRole(role), { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await authApi.login({ email: cleanEmail, password: cleanPassword });

      if (!data || !data.token || !data.user) {
        throw new Error('Respuesta del servidor incompleta.');
      }

      // Guardar sesión y sincronizar contexto
      login(data.token, data.user);

      // Redirección inmediata según el rol asignado por el backend
      const targetPath = getRedirectPathForRole(data.user.role);
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setErrorMessage(msg || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_20px_rgba(6,45,58,0.06)] border border-[#DCE2DD] p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img
              src="/assets/mir.svg"
              alt="MIRA"
              width={96}
              height={71}
              className="w-20 h-auto"
            />
          </div>
          <h1 className="text-2xl font-black text-[#062D3A] tracking-tight">Portal MIRA</h1>
          <p className="text-xs text-[#56696D]">Ingresa con tu correo electrónico y contraseña.</p>
        </div>

        {/* Notificación si proviene de un folio */}
        {folioParam && (
          <div className="p-3 bg-[#EEF7E6] border border-[#C8E6B2] text-[#2D6619] rounded-lg text-xs flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Folio pendiente de seguimiento: <strong>{folioParam}</strong></span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="mt-2"
          >
            Iniciar sesión →
          </Button>

          <div className="text-center pt-2">
            <span className="text-xs text-[#56696D]">¿No tienes una cuenta de cliente? </span>
            <Link
              to={folioParam ? `/register?folio=${encodeURIComponent(folioParam)}` : '/register'}
              className="text-xs font-bold text-[#7AC143] hover:text-[#66A334] underline"
            >
              Crear cuenta aquí →
            </Link>
          </div>
        </form>

        {/* Cuentas de Demostración */}
        <div className="pt-4 border-t border-[#DCE2DD] space-y-2.5">
          <span className="text-xs font-bold text-[#062D3A] block text-center">
            Cuentas de demostración rápida
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoAccount('cliente@mira.com')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg border border-[#DCE2DD] hover:bg-[#F4F6F4] text-[#062D3A] transition-colors flex justify-between items-center cursor-pointer"
            >
              <span className="font-semibold">Cliente</span>
              <span className="text-[#56696D] font-mono">cliente@mira.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccount('operador@mira.com')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg border border-[#DCE2DD] hover:bg-[#F4F6F4] text-[#062D3A] transition-colors flex justify-between items-center cursor-pointer"
            >
              <span className="font-semibold">Operador</span>
              <span className="text-[#56696D] font-mono">operador@mira.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoAccount('admin@mira.com')}
              className="w-full text-left px-3 py-2 text-xs rounded-lg border border-[#DCE2DD] hover:bg-[#F4F6F4] text-[#062D3A] transition-colors flex justify-between items-center cursor-pointer"
            >
              <span className="font-semibold">Administrador</span>
              <span className="text-[#56696D] font-mono">admin@mira.com</span>
            </button>
          </div>
          <p className="text-[11px] text-[#8E9FA2] text-center">Contraseña predeterminada: 123</p>
        </div>
      </main>
    </div>
  );
};
