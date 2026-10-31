import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { QuoteWizard } from './components/quote/QuoteWizard';
import { DEMO_USERS, createMockJwt } from '../../data/mockDemoData';
import { useAuth } from '../../context/AuthContext';
import { setDemoMode } from '../../utils/demoMode';

export const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'quote' | 'portals' | 'components' | 'architecture'>('portals');

  const handleLaunchPortal = (role: 'CLIENT' | 'OPERATOR' | 'ADMIN') => {
    setDemoMode(true);
    const targetUser = DEMO_USERS[role];
    const mockToken = createMockJwt(targetUser);
    login(mockToken, targetUser);

    if (role === 'CLIENT') navigate('/cliente');
    else if (role === 'OPERATOR') navigate('/operador');
    else if (role === 'ADMIN') navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F4] flex flex-col font-sans">
      {/* Header Institucional de Demostración */}
      <header className="h-[74px] bg-white border-b border-[#DCE2DD] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/assets/mir.svg"
            alt="MIRA"
            className="w-16 h-auto object-contain shrink-0"
            width={96}
            height={71}
          />
          <div>
            <span className="text-base font-extrabold text-[#062D3A] tracking-tight block leading-tight">
              MIRA<span className="text-[#7AC143]">.</span>
            </span>
            <span className="text-xs text-[#56696D] hidden sm:block">
              Centro de Demostración Privada de Cliente
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#7AC143]/20 text-[#2D6619] border border-[#7AC143]/30">
            🟢 Entorno Ficticio Aislado
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-[#062D3A] text-white text-xs font-bold rounded-lg hover:bg-[#0C3E4F] transition-colors cursor-pointer"
          >
            Ver Sitio Público
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Hero Banner */}
        <div className="bg-[#062D3A] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-[#0D3E4F]">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7AC143]/20 text-[#8CC63F] text-xs font-bold border border-[#7AC143]/30">
              <span className="w-2 h-2 rounded-full bg-[#7AC143]" />
              Demostración Privada para Presentación de Avance
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Sistema MIRA — <span className="text-[#7AC143]">Navegación Interactiva</span>
            </h1>
            <p className="text-[#B0C4C8] text-xs md:text-sm leading-relaxed">
              Esta versión demostrativa permite explorar el cotizador de cuatro pasos y los tres portales de rol
              (Cliente, Operador y Administrador) con datos y folios simulados. Toda la interacción opera 100% en el
              navegador con aislamiento garantizado.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-[#7AC143]/10 pointer-events-none blur-2xl" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE2DD] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('portals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'portals'
                ? 'bg-[#062D3A] text-white shadow-xs'
                : 'bg-white text-[#56696D] hover:bg-[#E8ECEF]'
            }`}
          >
            🏢 Portales por Rol (3 Vistas)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quote')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quote'
                ? 'bg-[#062D3A] text-white shadow-xs'
                : 'bg-white text-[#56696D] hover:bg-[#E8ECEF]'
            }`}
          >
            📝 Cotizador de 4 Pasos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('components')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'components'
                ? 'bg-[#062D3A] text-white shadow-xs'
                : 'bg-white text-[#56696D] hover:bg-[#E8ECEF]'
            }`}
          >
            🎨 Componentes y Design Tokens
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-[#062D3A] text-white shadow-xs'
                : 'bg-white text-[#56696D] hover:bg-[#E8ECEF]'
            }`}
          >
            🛡️ Aislamiento y Seguridad
          </button>
        </div>

        {/* Tab 1: Portales por Rol */}
        {activeTab === 'portals' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#062D3A]">Acceso Directo a los Portales de Rol</h2>
              <p className="text-xs text-[#56696D]">
                Selecciona cualquiera de las tres experiencias de usuario para ingresar inmediatamente con datos simulados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Cliente */}
              <Card padding="lg" className="flex flex-col justify-between border-t-4 border-t-[#7AC143] space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EEF7E6] text-[#2D6619] flex items-center justify-center text-2xl font-bold">
                    👤
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#062D3A]">Portal Cliente</h3>
                    <span className="text-xs text-[#7AC143] font-semibold">Dra. Elena Soto Cliente</span>
                  </div>
                  <p className="text-xs text-[#56696D] leading-relaxed">
                    Consulta de solicitudes, folios de seguimiento, bitácora de avances, estado de servicios (Enviada, En Atención, Terminada) y vinculación automática de solicitudes huérfanas.
                  </p>
                </div>
                <Button
                  variant="cta-green"
                  className="w-full justify-center"
                  onClick={() => handleLaunchPortal('CLIENT')}
                >
                  Entrar como Cliente →
                </Button>
              </Card>

              {/* Card 2: Operador */}
              <Card padding="lg" className="flex flex-col justify-between border-t-4 border-t-sky-500 space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center text-2xl font-bold">
                    🔧
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#062D3A]">Portal Operador</h3>
                    <span className="text-xs text-sky-600 font-semibold">Carlos Mendoza Técnico</span>
                  </div>
                  <p className="text-xs text-[#56696D] leading-relaxed">
                    Revisión de órdenes técnicas asignadas, bitácora de servicio en campo, registro de notas técnicas de avance y actualización interactiva de estados de servicio.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="w-full justify-center bg-sky-600 hover:bg-sky-700"
                  onClick={() => handleLaunchPortal('OPERATOR')}
                >
                  Entrar como Operador →
                </Button>
              </Card>

              {/* Card 3: Administrador */}
              <Card padding="lg" className="flex flex-col justify-between border-t-4 border-t-purple-600 space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-2xl font-bold">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#062D3A]">Consola Administrador</h3>
                    <span className="text-xs text-purple-600 font-semibold">Ing. Mariana Valdés Admin</span>
                  </div>
                  <p className="text-xs text-[#56696D] leading-relaxed">
                    Supervisión global de plataforma, métricas en tiempo real, asignación de especialistas operativos a solicitudes y gestión de directorio de usuarios corporativos.
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="w-full justify-center bg-[#062D3A] hover:bg-[#0C3E4F]"
                  onClick={() => handleLaunchPortal('ADMIN')}
                >
                  Entrar como Admin →
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Cotizador de 4 Pasos */}
        {activeTab === 'quote' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#062D3A]">Cotizador Interactivo de 4 Pasos</h2>
              <p className="text-xs text-[#56696D]">
                Prueba el flujo completo del cotizador público con catálogo dinámico, selección de estados de México y generación de folio simulado.
              </p>
            </div>

            <Card padding="lg" className="bg-white">
              <QuoteWizard />
            </Card>
          </div>
        )}

        {/* Tab 3: Componentes y Design Tokens */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#062D3A]">Tokens de Diseño e Identidad Oficial MIRA</h2>
              <p className="text-xs text-[#56696D]">
                Paleta corporativa, tipografía Plus Jakarta Sans y componentes modulares React 19.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#062D3A] text-white">
                <span className="font-bold text-sm block">Azul Petróleo</span>
                <span className="text-xs opacity-80 block">#062D3A (Primary)</span>
              </div>
              <div className="p-4 rounded-xl bg-[#7AC143] text-[#062D3A]">
                <span className="font-bold text-sm block">Verde MIRA</span>
                <span className="text-xs opacity-90 block">#7AC143 (CTA Accent)</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F4F6F4] text-[#062D3A] border border-[#DCE2DD]">
                <span className="font-bold text-sm block">Gris Claro Fondo</span>
                <span className="text-xs text-[#56696D] block">#F4F6F4 (Surface)</span>
              </div>
              <div className="p-4 rounded-xl bg-white text-[#062D3A] border border-[#DCE2DD]">
                <span className="font-bold text-sm block">Borde Neutro</span>
                <span className="text-xs text-[#56696D] block">#DCE2DD (Border)</span>
              </div>
            </div>

            <Card padding="md" className="space-y-3">
              <h3 className="font-bold text-sm text-[#062D3A]">Estatus del Sistema</h3>
              <div className="flex flex-wrap gap-2">
                <Badge status="E" />
                <Badge status="A" />
                <Badge status="T" />
                <Badge status="C" />
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Aislamiento y Seguridad */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#062D3A]">Aislamiento Criptográfico y Operativo</h2>
              <p className="text-xs text-[#56696D]">
                Garantías implementadas en el Sistema MIRA para la entrega demostrativa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card padding="md" className="space-y-2">
                <div className="flex items-center gap-2 text-[#2D6619] font-bold text-sm">
                  <span>✓</span> Aislamiento de Base de Datos
                </div>
                <p className="text-xs text-[#56696D] leading-relaxed">
                  Cero conexiones hacia Azure SQL Database de producción. La versión estática no realiza peticiones HTTP a servidores de base de datos; opera en memoria.
                </p>
              </Card>

              <Card padding="md" className="space-y-2">
                <div className="flex items-center gap-2 text-[#2D6619] font-bold text-sm">
                  <span>✓</span> Ausencia de Secretos y Llaves
                </div>
                <p className="text-xs text-[#56696D] leading-relaxed">
                  El paquete compilado de distribución no contiene llaves criptográficas privadas, contraseñas ni cadenas de conexión ODBC.
                </p>
              </Card>

              <Card padding="md" className="space-y-2">
                <div className="flex items-center gap-2 text-[#2D6619] font-bold text-sm">
                  <span>✓</span> Política noindex / nofollow
                </div>
                <p className="text-xs text-[#56696D] leading-relaxed">
                  Cabeceras X-Robots-Tag y meta-etiquetas configuradas para evitar que motores de búsqueda indexen o almacenen en caché la demo.
                </p>
              </Card>

              <Card padding="md" className="space-y-2">
                <div className="flex items-center gap-2 text-[#2D6619] font-bold text-sm">
                  <span>✓</span> Control de Acceso Cloudflare
                </div>
                <p className="text-xs text-[#56696D] leading-relaxed">
                  Preparada para integrarse con Cloudflare Access (Zero Trust) para restringir el acceso exclusivamente a correos electrónicos autorizados del cliente.
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
