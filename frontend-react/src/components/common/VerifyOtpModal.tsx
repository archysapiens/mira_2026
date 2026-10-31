import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export interface VerifyOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (claimedCount: number) => void;
  onVerified?: () => void;
  userEmail?: string;
  initialEmail?: string;
}

export const VerifyOtpModal: React.FC<VerifyOtpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onVerified,
  userEmail,
  initialEmail,
}) => {
  const { session, updateEmailVerified } = useAuth();
  const targetEmail = userEmail || initialEmail || session?.email || '';

  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ message: string; claimedCount: number }>({
    message: '',
    claimedCount: 0,
  });

  const handleRequestOtp = async () => {
    if (!targetEmail) {
      setErrorMessage('No se encontró un correo electrónico asociado a la sesión.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.requestEmailVerification({ email: targetEmail });
      if (res && res.sent) {
        setStep('verify');
        setCode('');
      } else {
        throw new Error(res.message || 'No fue posible generar el código. Intenta nuevamente.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al solicitar código OTP';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setErrorMessage('');

    try {
      const res = await authApi.requestEmailVerification({ email: targetEmail });
      if (res && res.sent) {
        setCode('');
      } else {
        throw new Error(res.message || 'No fue posible reenviar el código.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reenviar código';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMessage('Introduce un código numérico válido de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authApi.verifyEmail({ email: targetEmail, code: cleanCode });
      if (res && (res.verified || res.emailVerified)) {
        updateEmailVerified(true);
        const claimed = res.claimedCount || 0;
        setSuccessInfo({
          message: res.message || 'Correo electrónico verificado exitosamente.',
          claimedCount: claimed,
        });
        setStep('success');
        if (onVerified) {
          onVerified();
        }
        if (onSuccess) {
          onSuccess(claimed);
        }
      } else {
        throw new Error(res.message || 'El código ingresado es incorrecto o ha expirado.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al verificar código OTP';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setCode('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verificación de Correo Electrónico"
      subtitle={
        step === 'verify'
          ? `Ingresa el código enviado a ${targetEmail}`
          : 'Valida tu cuenta para proteger y vincular tus solicitudes'
      }
      size="md"
    >
      {/* Paso 1: Solicitar Código */}
      {step === 'request' && (
        <div className="space-y-5 py-2">
          <p className="text-sm text-[#56696D] leading-relaxed">
            Para garantizar la seguridad de tus servicios y habilitar la vinculación automática de solicitudes públicas anteriores, enviaremos un código temporal de 6 dígitos (OTP) a:
          </p>

          <div className="p-3.5 bg-[#F4F6F4] rounded-lg border border-[#DCE2DD] font-medium text-[#062D3A] text-center">
            {targetEmail || 'correo@ejemplo.com'}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="cta-green"
              onClick={handleRequestOtp}
              isLoading={isLoading}
            >
              Enviar código por correo →
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2: Ingresar y Validar Código */}
      {step === 'verify' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5 py-2">
          <div className="text-xs text-[#56696D]">
            <p>Ingresa el código de 6 dígitos enviado a tu correo.</p>
            <p className="mt-1 text-[#8E9FA2]">Validez: 15 minutos.</p>
          </div>

          <div>
            <Input
              label="Código de Verificación (6 dígitos)"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                if (errorMessage) setErrorMessage('');
              }}
              className="text-center text-2xl font-mono tracking-widest font-bold"
              autoFocus
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending || isLoading}
              className="text-xs font-bold text-[#0D3E4F] hover:text-[#7AC143] disabled:opacity-50 cursor-pointer underline"
            >
              {isResending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="cta-green"
                size="sm"
                isLoading={isLoading}
              >
                Verificar código
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Paso 3: Confirmación Exitosa */}
      {step === 'success' && (
        <div className="space-y-4 py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EEF7E6] text-[#2D6619] border border-[#C8E6B2] flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <div>
            <h4 className="text-base font-bold text-[#062D3A]">¡Correo verificado con éxito!</h4>
            <p className="text-xs text-[#56696D] mt-1">
              Tu cuenta ha sido validada.{' '}
              {successInfo.claimedCount > 0 && (
                <strong className="text-[#2D6619]">
                  Solicitudes vinculadas: {successInfo.claimedCount}
                </strong>
              )}
            </p>
          </div>
          <div className="pt-2">
            <Button variant="cta-green" fullWidth onClick={handleClose}>
              Continuar al Portal
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
