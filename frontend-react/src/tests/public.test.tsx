import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { HomePage } from '../pages/public/HomePage';
import { requestsApi } from '../api/requests';

describe('MIRA — Fase 11: Portal Público y Cotizador en React + TypeScript', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  const renderHomePage = () => {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('1. Renderizado general de la página pública con encabezado, logotipo y navegación corporativa', () => {
    renderHomePage();

    // Logotipo institucional
    const brandLogos = screen.getAllByAltText('MIRA');
    expect(brandLogos.length).toBeGreaterThanOrEqual(1);

    // Navegación corporativa
    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    expect(nav).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^inicio$/i })).toHaveAttribute('href', '#inicio');
    expect(within(nav).getByRole('link', { name: /^servicios$/i })).toHaveAttribute('href', '#servicios');
    expect(within(nav).getByRole('link', { name: /^nosotros$/i })).toHaveAttribute('href', '#nosotros');

    // Botón de Seguimiento y Acceso a cuenta
    expect(within(nav).getByRole('button', { name: /seguimiento/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('2. Presencia de las secciones clave con sus IDs de ancla institucionales', () => {
    const { container } = renderHomePage();

    expect(container.querySelector('#inicio')).toBeInTheDocument();
    expect(container.querySelector('#servicios')).toBeInTheDocument();
    expect(container.querySelector('#nosotros')).toBeInTheDocument();
    expect(container.querySelector('#portafolio')).toBeInTheDocument();
    expect(container.querySelector('#contacto')).toBeInTheDocument();
    expect(container.querySelector('#preguntas')).toBeInTheDocument();
    expect(container.querySelector('#donde')).toBeInTheDocument();
    expect(container.querySelector('#cotizar')).toBeInTheDocument();
  });

  it('3. Sección Hero con titular institucional, garantías métricas y botones de llamada a la acción', () => {
    renderHomePage();

    // Título hero
    expect(screen.getByText('Resolvemos lo complejo.')).toBeInTheDocument();
    expect(screen.getByText('Cuidamos cada detalle.')).toBeInTheDocument();

    // Métricas comprobables
    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('AÑOS DE EXPERIENCIA')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('ATENCIÓN A PROYECTOS')).toBeInTheDocument();
    expect(screen.getByText('Nacional')).toBeInTheDocument();
    expect(screen.getByText('COBERTURA EN MÉXICO')).toBeInTheDocument();

    // Botones de acción
    const propuestaBtn = screen.getByRole('link', { name: /recibir propuesta/i });
    expect(propuestaBtn).toHaveAttribute('href', '#cotizar');
    const procesoBtn = screen.getByRole('link', { name: /conocer el proceso/i });
    expect(procesoBtn).toHaveAttribute('href', '#metodo');
  });

  it('4. Muestra del catálogo de servicios con tarjetas interactivas', () => {
    const { container } = renderHomePage();
    const serviciosSec = container.querySelector('#servicios');
    expect(serviciosSec).toBeInTheDocument();

    expect(within(serviciosSec as HTMLElement).getByText('Limpieza y sanitización de silos')).toBeInTheDocument();
    expect(within(serviciosSec as HTMLElement).getByText('Sanidad y limpieza técnica')).toBeInTheDocument();
    expect(within(serviciosSec as HTMLElement).getByText('Estructuras metálicas y naves')).toBeInTheDocument();
    expect(within(serviciosSec as HTMLElement).getByText('Tablaroca y acabados')).toBeInTheDocument();

    // Verificación de tarjetas de servicio
    const serviceCards = screen.getAllByText(/cotizar este servicio →/i);
    expect(serviceCards.length).toBeGreaterThanOrEqual(6);
  });

  it('5. Sección de contacto con dirección oficial de Toluca, teléfono directo 800 505 62 70 y correo prodigy', () => {
    renderHomePage();

    // Dirección oficial de Toluca
    expect(
      screen.getByText(/Colombia No\. 301-A, Col\. Las Américas, C\.P\. 50130, Toluca, Estado de México/i)
    ).toBeInTheDocument();

    // Teléfono 800 505 62 70
    const telLink = screen.getByRole('link', { name: '800 505 62 70' });
    expect(telLink).toHaveAttribute('href', 'tel:8005056270');

    // Correo oficial
    const mailLink = screen.getByRole('link', { name: 'mirasa@prodigy.net.mx' });
    expect(mailLink).toHaveAttribute('href', 'mailto:mirasa@prodigy.net.mx');
  });

  it('6. Cotizador - Paso 1: Selección interactiva de tipo de espacio (Hotel, Residencia, Empresa, Otro)', () => {
    renderHomePage();

    expect(screen.getByText('¿Qué tipo de espacio requiere atención?')).toBeInTheDocument();
    const hotelRadio = screen.getByLabelText(/Hotel \/ Hospedaje/i);
    const empresaRadio = screen.getByLabelText(/Empresa \/ Planta/i);

    expect(hotelRadio).toBeChecked();
    expect(empresaRadio).not.toBeChecked();

    fireEvent.click(empresaRadio);
    expect(empresaRadio).toBeChecked();

    // Botón para continuar
    const nextBtn = screen.getByRole('button', { name: /continuar a servicios/i });
    fireEvent.click(nextBtn);

    // Debe mostrar paso 2
    expect(screen.getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
  });

  it('7. Cotizador - Paso 2: Renderizado del catálogo dinámico de servicios con barra de búsqueda y filtros', async () => {
    renderHomePage();

    // Avanzar a paso 2
    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));

    const searchInput = screen.getByRole('textbox', { name: /buscar servicio/i });
    expect(searchInput).toBeInTheDocument();

    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });

    // Buscar "silos"
    fireEvent.change(searchInput, { target: { value: 'silos' } });

    expect(within(catalog).getByText('Limpieza y sanitización de silos')).toBeInTheDocument();
    expect(within(catalog).queryByText('Servicios residenciales')).not.toBeInTheDocument();

    // Limpiar búsqueda
    const clearBtn = screen.getByRole('button', { name: /limpiar búsqueda/i });
    fireEvent.click(clearBtn);

    expect(within(catalog).getByText('Servicios residenciales')).toBeInTheDocument();
  });

  it('8. Cotizador - Paso 2: Selección múltiple de servicios y actualización del contador visual', () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));

    const counter = screen.getByText('0 seleccionados');
    expect(counter).toBeInTheDocument();

    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });

    // Seleccionar silos
    const silosCard = within(catalog).getByText('Limpieza y sanitización de silos');
    fireEvent.click(silosCard);

    expect(screen.getByText('1 servicio seleccionado')).toBeInTheDocument();

    // Seleccionar pintura
    const pinturaCard = within(catalog).getByText('Pintura profesional y epóxicos');
    fireEvent.click(pinturaCard);

    expect(screen.getByText('2 servicios seleccionados')).toBeInTheDocument();
  });

  it('9. Cotizador - Paso 2: Validación que impide avanzar si no se ha seleccionado al menos un servicio', () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));

    const continueBtn = screen.getByRole('button', { name: /continuar a proyecto/i });
    expect(continueBtn).toBeDisabled();

    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });
    // Seleccionar un servicio para habilitarlo
    fireEvent.click(within(catalog).getByText('Limpieza y sanitización de silos'));
    expect(continueBtn).not.toBeDisabled();
  });

  it('10. Cotizador - Paso 3: Desplegables dependientes de estados y municipios de México', () => {
    renderHomePage();

    // Llegar a paso 3
    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));
    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });
    fireEvent.click(within(catalog).getByText('Limpieza y sanitización de silos'));
    fireEvent.click(screen.getByRole('button', { name: /continuar a proyecto/i }));

    expect(screen.getByText('Ubicación y detalles del trabajo')).toBeInTheDocument();

    const stateSelect = screen.getByLabelText(/Estado en México \*/i) as HTMLSelectElement;
    const muniSelect = screen.getByLabelText(/Municipio o Alcaldía \*/i) as HTMLSelectElement;

    expect(muniSelect).toBeDisabled();

    // Seleccionar Estado de México
    fireEvent.change(stateSelect, { target: { value: 'Estado de México' } });

    expect(muniSelect).not.toBeDisabled();
    expect(screen.getByRole('option', { name: 'Toluca' })).toBeInTheDocument();

    // Seleccionar Toluca
    fireEvent.change(muniSelect, { target: { value: 'Toluca' } });
    expect(muniSelect.value).toBe('Toluca');
  });

  it('11. Cotizador - Paso 3: Validación de campos obligatorios antes de permitir avanzar a Contacto', () => {
    renderHomePage();

    // Llegar a paso 3
    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));
    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });
    fireEvent.click(within(catalog).getByText('Limpieza y sanitización de silos'));
    fireEvent.click(screen.getByRole('button', { name: /continuar a proyecto/i }));

    const nextToContactBtn = screen.getByRole('button', { name: /continuar a contacto/i });

    // Intentar avanzar con campos vacíos
    fireEvent.click(nextToContactBtn);

    // Debe mostrar mensajes de error
    expect(screen.getByText('Selecciona un estado.')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un municipio o alcaldía.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa la dirección o referencias del sitio.')).toBeInTheDocument();
    expect(screen.getByText('Indica la fecha requerida.')).toBeInTheDocument();
    expect(screen.getByText('Describe el proyecto o requerimiento.')).toBeInTheDocument();

    // No debe haber avanzado al paso 4
    expect(screen.queryByText('¿A quién enviamos la propuesta?')).not.toBeInTheDocument();
  });

  it('12. Cotizador - Paso 4: Validación de campos de contacto (nombre, teléfono y correo válido)', () => {
    renderHomePage();

    // Paso 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));
    // Paso 2 -> 3
    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });
    fireEvent.click(within(catalog).getByText('Limpieza y sanitización de silos'));
    fireEvent.click(screen.getByRole('button', { name: /continuar a proyecto/i }));
    // Llenar paso 3
    fireEvent.change(screen.getByLabelText(/Estado en México \*/i), { target: { value: 'Estado de México' } });
    fireEvent.change(screen.getByLabelText(/Municipio o Alcaldía \*/i), { target: { value: 'Toluca' } });
    fireEvent.change(screen.getByLabelText(/Dirección o referencias del sitio \*/i), {
      target: { value: 'Parque Industrial Toluca 2000' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha estimada de atención \*/i), {
      target: { value: '2026-11-15' },
    });
    fireEvent.change(screen.getByLabelText(/Descripción del proyecto o requerimiento técnico \*/i), {
      target: { value: 'Limpieza profunda de 2 silos de acero inoxidable.' },
    });
    // Paso 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /continuar a contacto/i }));

    expect(screen.getByText('¿A quién enviamos la propuesta?')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });

    // Intentar enviar formulario vacío
    fireEvent.click(submitBtn);

    expect(screen.getByText('Ingresa tu nombre completo.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa un número telefónico de contacto.')).toBeInTheDocument();
    expect(screen.getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
  }, 15000);

  it('13. Envío exitoso de la cotización: Simulación de API devolviendo folio y despliegue de pantalla de confirmación', async () => {
    const mockCreateRequest = vi.spyOn(requestsApi, 'createRequest').mockResolvedValue({
      id: 'req-test-999',
      folio: 'MIRA-2026-888999',
      status: 'E',
    });

    renderHomePage();

    // Paso 1 -> 2
    fireEvent.click(screen.getByRole('button', { name: /continuar a servicios/i }));
    // Paso 2 -> 3
    const catalog = screen.getByRole('group', { name: /servicios disponibles/i });
    fireEvent.click(within(catalog).getByText('Limpieza y sanitización de silos'));
    fireEvent.click(screen.getByRole('button', { name: /continuar a proyecto/i }));
    // Llenar paso 3
    fireEvent.change(screen.getByLabelText(/Estado en México \*/i), { target: { value: 'Estado de México' } });
    fireEvent.change(screen.getByLabelText(/Municipio o Alcaldía \*/i), { target: { value: 'Toluca' } });
    fireEvent.change(screen.getByLabelText(/Dirección o referencias del sitio \*/i), {
      target: { value: 'Av. Industria No. 120' },
    });
    fireEvent.change(screen.getByLabelText(/Fecha estimada de atención \*/i), {
      target: { value: '2026-12-01' },
    });
    fireEvent.change(screen.getByLabelText(/Descripción del proyecto o requerimiento técnico \*/i), {
      target: { value: 'Limpieza y aplicación de recubrimiento epóxico.' },
    });
    // Paso 3 -> 4
    fireEvent.click(screen.getByRole('button', { name: /continuar a contacto/i }));

    // Llenar contacto
    fireEvent.change(screen.getByLabelText(/Nombre completo \*/i), { target: { value: 'Ing. Fernando Pérez' } });
    fireEvent.change(screen.getByLabelText(/Teléfono de contacto \*/i), { target: { value: '7221234567' } });
    fireEvent.change(screen.getByLabelText(/Empresa o Razón Social/i), { target: { value: 'Alimentos Toluca SA' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico \*/i), { target: { value: 'fperez@alimentos.mx' } });

    const submitBtn = screen.getByRole('button', { name: /enviar solicitud/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledTimes(1);
    });

    // Confirmación en pantalla
    await waitFor(() => {
      expect(screen.getByText('¡Hemos registrado tu solicitud!')).toBeInTheDocument();
      expect(screen.getByText('MIRA-2026-888999')).toBeInTheDocument();
      expect(screen.getByText('fperez@alimentos.mx')).toBeInTheDocument();
    });

    // Enlaces a registro e inicio de sesión con el folio en querystring
    const registerLink = screen.getByRole('link', { name: /registrar contraseña/i });
    expect(registerLink).toHaveAttribute('href', '/register?folio=MIRA-2026-888999');

    const loginLinks = screen.getAllByRole('link', { name: /iniciar sesión/i });
    const successLoginLink = loginLinks.find((l) => l.getAttribute('href')?.includes('folio=MIRA-2026-888999'));
    expect(successLoginLink).toBeDefined();
    expect(successLoginLink).toHaveAttribute('href', '/login?folio=MIRA-2026-888999');
  }, 15000);

  it('14. Modal de seguimiento por folio: Apertura accesible, envío de consulta y visualización de la tarjeta de demostración con estatus [E] Enviada', async () => {
    renderHomePage();

    const trackingBtn = screen.getByRole('button', { name: /seguimiento/i });
    fireEvent.click(trackingBtn);

    // Modal debe ser visible
    expect(screen.getByRole('dialog', { name: /consulta tu solicitud/i })).toBeInTheDocument();

    const folioInput = screen.getByRole('textbox', { name: /folio mira \*/i });
    const emailInput = screen.getByRole('textbox', { name: /correo registrado \*/i });
    const consultarBtn = screen.getByRole('button', { name: /consultar/i });

    fireEvent.change(folioInput, { target: { value: 'MIRA-2026-123456' } });
    fireEvent.change(emailInput, { target: { value: 'contacto@cliente.com' } });
    fireEvent.click(consultarBtn);

    await waitFor(() => {
      expect(screen.getByText(/Búsqueda de Folio: MIRA-2026-123456/i)).toBeInTheDocument();
      expect(screen.getByText(/Correo asociado: contacto@cliente.com/i)).toBeInTheDocument();
      expect(screen.getByText(/\[E\] Enviada/i)).toBeInTheDocument();
    });

    // Cerrar modal
    const closeBtn = screen.getByRole('button', { name: /cerrar modal de seguimiento/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /consulta tu solicitud/i })).not.toBeInTheDocument();
    });
  });
});
