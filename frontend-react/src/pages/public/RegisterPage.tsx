import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { authApi } from '../../api/auth';

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const folioParam = searchParams.get('folio');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const clearFieldError = (fieldName: keyof FieldErrors) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanFullName) {
      errors.fullName = 'Ingresa tu nombre completo.';
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      errors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!cleanPhone) {
      errors.phone = 'Ingresa tu teléfono de contacto.';
    }

    if (!password || password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        password: password,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la cuenta.';
      setServerError(msg || 'No fue posible crear la cuenta en este momento. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginUrl = folioParam ? `/login?folio=${encodeURIComponent(folioParam)}` : '/login';

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-lg bg-white rounded-2xl shadow-[0_4px_20px_rgba(6,45,58,0.06)] border border-[#DCE2DD] p-8 space-y-6">
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
          <h1 className="text-2xl font-black text-[#062D3A] tracking-tight">Crea tu cuenta MIRA</h1>
          <p className="text-xs text-[#56696D]">
            Monitorea tus solicitudes, cotizaciones y órdenes de servicio desde un solo lugar.
          </p>
        </div>

        {/* Notificación si proviene de un folio */}
        {folioParam && (
          <div className="p-3 bg-[#EEF7E6] border border-[#C8E6B2] text-[#2D6619] rounded-lg text-xs flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Folio de referencia: <strong>{folioParam}</strong></span>
          </div>
        )}

        {/* Mensaje de éxito tras registrarse */}
        {isSuccess ? (
          <div className="p-6 bg-[#F9FBF8] border border-[#C8E6B2] rounded-xl text-center space-y-4">
            <div className="w-12 h-12 bg-[#7AC143]/20 text-[#7AC143] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#062D3A]">
                ¡Tu cuenta MIRA ha sido creada correctamente!
              </h3>
              <p className="text-xs text-[#56696D]">
                Ya puedes iniciar sesión con tu correo electrónico y contraseña para dar seguimiento a tus servicios.
              </p>
            </div>
            <Link
              to={loginUrl}
              className="inline-flex justify-center items-center w-full py-3 px-4 rounded-xl bg-[#7AC143] hover:bg-[#66A334] text-white font-bold text-sm shadow-md transition-colors"
            >
              Iniciar sesión →
            </Link>
          </div>
        ) : (
          /* Formulario de Registro CLIENT */
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold" role="alert">
                {serverError}
              </div>
            )}

            <Input
              label="Nombre completo *"
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError('fullName');
              }}
              error={fieldErrors.fullName}
              placeholder="Tu nombre y apellido"
              required
              autoComplete="name"
            />

            <Input
              label="Correo electrónico *"
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              error={fieldErrors.email}
              placeholder="correo@empresa.com"
              required
              autoComplete="email"
            />

            <Input
              label="Teléfono de contacto *"
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError('phone');
              }}
              error={fieldErrors.phone}
              placeholder="(00) 0000-0000"
              required
              autoComplete="tel"
            />

            <Input
              label="Empresa / Razón Social"
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nombre de tu empresa (opcional)"
              autoComplete="organization"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contraseña *"
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                error={fieldErrors.password}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirmar contraseña *"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                error={fieldErrors.confirmPassword}
                placeholder="Repite tu contraseña"
                required
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2"
            >
              Crear mi cuenta →
            </Button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#56696D]">¿Ya tienes una cuenta? </span>
              <Link
                to={loginUrl}
                className="text-xs font-bold text-[#7AC143] hover:text-[#66A334] underline"
              >
                Iniciar sesión →
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};
