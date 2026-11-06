import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { HomePage } from '../pages/public/HomePage';
import { requestsApi } from '../api/requests';

describe('MIRA — Fase 11: Portal Público y Nuevo Funnel de Cotización en React + TypeScript', () => {
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

  it('6. Apertura del Funnel Modal y Paso 1 (Espacio): Opciones y avance guiado', async () => {
    renderHomePage();

    // El modal no debe estar visible al inicio
    expect(screen.queryByRole('dialog', { name: /solicitud de cotización mira/i })).not.toBeInTheDocument();

    // Clic en el CTA de la barra banner
    const ctaBanner = screen.getByRole('link', { name: /comenzar cotización/i });
    fireEvent.click(ctaBanner);

    // Debe abrirse el modal accesible
    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('¿Qué tipo de espacio requiere atención?')).toBeInTheDocument();

    // Verificar las cuatro opciones originales de espacio
    expect(within(modal).getByText('Hotel / Hospedaje')).toBeInTheDocument();
    expect(within(modal).getByText('Residencial / Condominio')).toBeInTheDocument();
    expect(within(modal).getByText('Empresa / Planta')).toBeInTheDocument();
    expect(within(modal).getByText('Otro espacio')).toBeInTheDocument();

    // Clic en Empresa / Planta y avanzar a Paso 2 (Servicios)
    const companyCard = within(modal).getByText('Empresa / Planta');
    fireEvent.click(companyCard);

    // Avanzar a Servicios
    const nextBtn = within(modal).getByRole('button', { name: /continuar a servicios/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });
  });

  it('7. Cotizador - Paso 1: Selección interactiva y botón Continuar', async () => {
    renderHomePage();

    // Abrir modal desde CTA hero
    fireEvent.click(screen.getByRole('link', { name: /recibir propuesta/i }));

    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    expect(within(modal).getByText('¿Qué tipo de espacio requiere atención?')).toBeInTheDocument();

    // Seleccionar Hotel / Hospedaje
    const hotelCard = within(modal).getByText('Hotel / Hospedaje');
    fireEvent.click(hotelCard);

    // Botón Continuar a Servicios
    const continueBtn = within(modal).getByRole('button', { name: /continuar a servicios/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });
  });

  it('8. Apertura contextual desde tarjeta de catálogo de servicios preselecciona el servicio', async () => {
    renderHomePage();

    const serviciosSec = document.querySelector('#servicios');
    expect(serviciosSec).toBeInTheDocument();

    // Clic en la tarjeta de Silos en el catálogo público
    const silosCardInCatalog = within(serviciosSec as HTMLElement).getByRole('button', {
      name: /limpieza y sanitización de silos/i,
    });
    fireEvent.click(silosCardInCatalog);

    // Abre el modal con el servicio preseleccionado
    await waitFor(() => {
      const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText(/Cuéntanos sobre tu proyecto/i)).toBeInTheDocument();
    });
  });

  it('9. Cotizador - Paso 2: Sugerencias, selección múltiple y contador', async () => {
    renderHomePage();

    // Abrir modal y avanzar a Servicios
    fireEvent.click(screen.getByRole('link', { name: /comenzar cotización/i }));
    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    fireEvent.click(within(modal).getByText('Empresa / Planta'));
    fireEvent.click(within(modal).getByRole('button', { name: /continuar a servicios/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });

    // Seleccionar servicio de Silos
    const silosOption = within(modal).getByText('Limpieza y sanitización de silos');
    fireEvent.click(silosOption);

    // Verificar contador
    expect(within(modal).getByText(/1 servicio seleccionado/i)).toBeInTheDocument();

    // Botón continuar con 1 servicio
    const continueBtn = within(modal).getByRole('button', { name: /continuar con 1 servicio/i });
    fireEvent.click(continueBtn);

    // Debe llegar a paso 3 (Ubicación y detalles del trabajo)
    await waitFor(() => {
      expect(within(modal).getByText('Ubicación y detalles del trabajo')).toBeInTheDocument();
    });
  });

  it('10. Cotizador - Paso 3: Desplegables dependientes de estados y municipios de México', async () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('link', { name: /comenzar cotización/i }));
    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    fireEvent.click(within(modal).getByText('Empresa / Planta'));
    fireEvent.click(within(modal).getByRole('button', { name: /continuar a servicios/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });

    // Seleccionar Silos
    fireEvent.click(within(modal).getByText('Limpieza y sanitización de silos'));
    await waitFor(() => {
      expect(within(modal).getByText(/1 servicio seleccionado/i)).toBeInTheDocument();
    });
    fireEvent.click(within(modal).getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Ubicación y detalles del trabajo')).toBeInTheDocument();
    });

    const stateSelect = within(modal).getByLabelText(/Estado en México \*/i) as HTMLSelectElement;
    const muniSelect = within(modal).getByLabelText(/Municipio o Alcaldía \*/i) as HTMLSelectElement;

    expect(muniSelect).toBeDisabled();

    // Seleccionar Estado de México
    fireEvent.change(stateSelect, { target: { value: 'Estado de México' } });

    expect(muniSelect).not.toBeDisabled();
    expect(within(muniSelect).getByRole('option', { name: 'Toluca' })).toBeInTheDocument();

    // Seleccionar Toluca
    fireEvent.change(muniSelect, { target: { value: 'Toluca' } });
    expect(muniSelect.value).toBe('Toluca');
  });

  it('11. Cotizador - Paso 3: Validación de campos obligatorios de ubicación antes de avanzar', async () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('link', { name: /comenzar cotización/i }));
    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    fireEvent.click(within(modal).getByText('Empresa / Planta'));
    fireEvent.click(within(modal).getByRole('button', { name: /continuar a servicios/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });

    // Seleccionar Silos
    fireEvent.click(within(modal).getByText('Limpieza y sanitización de silos'));
    await waitFor(() => {
      expect(within(modal).getByText(/1 servicio seleccionado/i)).toBeInTheDocument();
    });
    fireEvent.click(within(modal).getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Ubicación y detalles del trabajo')).toBeInTheDocument();
    });

    const nextToContactBtn = within(modal).getByRole('button', { name: /continuar a contacto/i });

    // Intentar avanzar con campos vacíos
    fireEvent.click(nextToContactBtn);

    // Debe mostrar errores de validación
    expect(within(modal).getByText('Selecciona un estado.')).toBeInTheDocument();

    // No debe haber avanzado al paso 4
    expect(within(modal).queryByText('¿A quién enviamos la propuesta?')).not.toBeInTheDocument();
  });

  it('12. Cotizador - Paso 4: Validación de datos de contacto y resumen ejecutivo', async () => {
    renderHomePage();

    fireEvent.click(screen.getByRole('link', { name: /comenzar cotización/i }));
    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    fireEvent.click(within(modal).getByText('Empresa / Planta'));
    fireEvent.click(within(modal).getByRole('button', { name: /continuar a servicios/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });

    // Seleccionar Silos
    fireEvent.click(within(modal).getByText('Limpieza y sanitización de silos'));
    await waitFor(() => {
      expect(within(modal).getByText(/1 servicio seleccionado/i)).toBeInTheDocument();
    });
    fireEvent.click(within(modal).getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Ubicación y detalles del trabajo')).toBeInTheDocument();
    });

    // Llenar ubicación válida
    fireEvent.change(within(modal).getByLabelText(/Estado en México \*/i), { target: { value: 'Estado de México' } });
    fireEvent.change(within(modal).getByLabelText(/Municipio o Alcaldía \*/i), { target: { value: 'Toluca' } });
    fireEvent.change(within(modal).getByLabelText(/Dirección o referencias/i), { target: { value: 'Parque Toluca 2000' } });
    fireEvent.change(within(modal).getByLabelText(/Fecha estimada/i), { target: { value: '2026-11-20' } });
    fireEvent.change(within(modal).getByLabelText(/Descripción del proyecto/i), { target: { value: 'Limpieza profunda de 2 silos de harina.' } });

    fireEvent.click(within(modal).getByRole('button', { name: /continuar a contacto/i }));

    await waitFor(() => {
      expect(within(modal).getByText('¿A quién enviamos la propuesta?')).toBeInTheDocument();
    });

    // Verificar resumen de solicitud con datos reales
    expect(within(modal).getByText('Resumen de solicitud')).toBeInTheDocument();
    expect(within(modal).getByText('Empresa / Planta')).toBeInTheDocument();
    expect(within(modal).getByText(/Toluca, Estado de México/i)).toBeInTheDocument();

    // Intentar enviar formulario vacío
    const submitBtn = within(modal).getByRole('button', { name: /enviar solicitud/i });
    fireEvent.click(submitBtn);

    expect(within(modal).getByText('Ingresa tu nombre completo.')).toBeInTheDocument();
    expect(within(modal).getByText('Ingresa un número telefónico de contacto.')).toBeInTheDocument();
    expect(within(modal).getByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
  }, 15000);

  it('13. Envío exitoso de la cotización: Simulación de API devolviendo folio y despliegue de confirmación con copiado', async () => {
    const mockCreateRequest = vi.spyOn(requestsApi, 'createRequest').mockResolvedValue({
      id: 'req-test-999',
      folio: 'MIRA-2026-888999',
      status: 'E',
    });

    renderHomePage();

    // Abrir modal y seleccionar Espacio
    fireEvent.click(screen.getByRole('link', { name: /comenzar cotización/i }));
    const modal = screen.getByRole('dialog', { name: /solicitud de cotización mira/i });
    fireEvent.click(within(modal).getByText('Empresa / Planta'));
    fireEvent.click(within(modal).getByRole('button', { name: /continuar a servicios/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Selecciona los servicios que necesitas')).toBeInTheDocument();
    });

    // Seleccionar Silos
    fireEvent.click(within(modal).getByText('Limpieza y sanitización de silos'));
    await waitFor(() => {
      expect(within(modal).getByText(/1 servicio seleccionado/i)).toBeInTheDocument();
    });
    fireEvent.click(within(modal).getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(within(modal).getByText('Ubicación y detalles del trabajo')).toBeInTheDocument();
    });

    // Llenar paso 3
    fireEvent.change(within(modal).getByLabelText(/Estado en México \*/i), { target: { value: 'Estado de México' } });
    fireEvent.change(within(modal).getByLabelText(/Municipio o Alcaldía \*/i), { target: { value: 'Toluca' } });
    fireEvent.change(within(modal).getByLabelText(/Dirección o referencias/i), { target: { value: 'Parque Toluca 2000' } });
    fireEvent.change(within(modal).getByLabelText(/Fecha estimada/i), { target: { value: '2026-11-20' } });
    fireEvent.change(within(modal).getByLabelText(/Descripción del proyecto/i), { target: { value: 'Limpieza profunda de 2 silos de harina.' } });

    fireEvent.click(within(modal).getByRole('button', { name: /continuar a contacto/i }));

    await waitFor(() => {
      expect(within(modal).getByText('¿A quién enviamos la propuesta?')).toBeInTheDocument();
    });

    // Llenar contacto
    fireEvent.change(within(modal).getByLabelText(/Nombre completo/i), {
      target: { value: 'Ing. Fernando Pérez' },
    });
    fireEvent.change(within(modal).getByLabelText(/Teléfono de contacto/i), {
      target: { value: '7221234567' },
    });
    fireEvent.change(within(modal).getByLabelText(/Empresa o Razón Social/i), {
      target: { value: 'Alimentos Toluca SA' },
    });
    fireEvent.change(within(modal).getByLabelText(/Correo electrónico/i), {
      target: { value: 'fperez@alimentos.mx' },
    });

    const submitBtn = within(modal).getByRole('button', { name: /enviar solicitud/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateRequest).toHaveBeenCalledTimes(1);
    });

    // Confirmación en pantalla
    await waitFor(() => {
      expect(within(modal).getByText('¡Hemos registrado tu proyecto!')).toBeInTheDocument();
      expect(within(modal).getByText('MIRA-2026-888999')).toBeInTheDocument();
      expect(within(modal).getByText('fperez@alimentos.mx')).toBeInTheDocument();
    });

    // Botón de copiado de folio
    expect(within(modal).getByRole('button', { name: /copiar folio/i })).toBeInTheDocument();
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
