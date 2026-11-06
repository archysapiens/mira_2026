/**
 * Sistema MIRA — Definición de Preguntas Contextuales por Especialidad Técnica
 * Permite adaptar dinámicamente las preguntas del Step 2 según el servicio seleccionado.
 */

export interface ContextOption {
  id: string;
  label: string;
  description?: string;
}

export interface ContextQuestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'text';
  options?: ContextOption[];
  placeholder?: string;
}

export interface ServiceContextFlow {
  serviceCode: string;
  serviceName: string;
  questions: ContextQuestion[];
}

export const CONTEXT_QUESTIONS_BY_SERVICE: Record<string, ContextQuestion[]> = {
  // 1. Limpieza y sanitización de silos
  SILOS_CLEAN: [
    {
      id: 'siloMaterial',
      title: '¿Qué tipo de material almacena el silo?',
      subtitle: 'Permite seleccionar los protocolos químicos y de inocuidad adecuados.',
      type: 'single',
      options: [
        { id: 'granos', label: 'Granos, semillas o harinas', description: 'Protocolo de grado alimenticio' },
        { id: 'cemento', label: 'Cemento, cal o polvos secos', description: 'Remoción de adherencias y desincrustación' },
        { id: 'quimicos', label: 'Químicos, resinas o polímeros', description: 'Neutralización y lavado técnico' },
        { id: 'otro', label: 'Otro material o desconozco', description: 'Requerirá validación con especialista' },
      ],
    },
    {
      id: 'siloCount',
      title: '¿Cuántos silos requieren atención y qué altura aproximada tienen?',
      subtitle: 'Para calcular equipo de maniobra y cuadrillas.',
      type: 'single',
      options: [
        { id: '1-2_silos', label: '1 a 2 silos', description: 'Intervención puntual o express' },
        { id: '3-5_silos', label: '3 a 5 silos', description: 'Batería estándar' },
        { id: 'mas_de_5', label: 'Batería mayor a 5 silos', description: 'Proyecto de escala industrial' },
        { id: 'asesoria', label: 'No conozco las dimensiones / Necesito asesoría', description: 'Visita técnica recomendada' },
      ],
    },
    {
      id: 'siloNeed',
      title: '¿Cuál es la necesidad principal del servicio?',
      type: 'single',
      options: [
        { id: 'preventivo', label: 'Mantenimiento preventivo programado' },
        { id: 'incrustaciones', label: 'Remoción de costras o contaminación interna' },
        { id: 'auditoria', label: 'Sanitización previa a auditoría de inocuidad' },
        { id: 'urgencia', label: 'Atención urgente por paro de línea' },
      ],
    },
  ],

  // 2. Recubrimientos epóxicos FDA y pintura industrial
  EPOXY_COAT: [
    {
      id: 'epoxyArea',
      title: '¿Qué tipo de instalación requiere el recubrimiento epóxico?',
      subtitle: 'Para determinar resistencia química, acabado sanitario o antiderrapante.',
      type: 'single',
      options: [
        { id: 'fda_alimentos', label: 'Planta de alimentos o bebidas (Grado FDA)', description: 'Acabado sanitario antibacteriano' },
        { id: 'almacen_trafico', label: 'Almacén o CEDIS con tráfico pesado de montacargas', description: 'Alta resistencia mecánica' },
        { id: 'farmaceutica', label: 'Laboratorio o farmacéutica', description: 'Resistencia a químicos y solventes' },
        { id: 'taller_comercial', label: 'Taller, estacionamiento o área comercial', description: 'Estética y protección antipolvo' },
      ],
    },
    {
      id: 'epoxyM2',
      title: '¿Cuál es la superficie estimada a intervenir?',
      type: 'single',
      options: [
        { id: 'hasta_200', label: 'Hasta 200 m²', description: 'Área compacta o pasillos específicos' },
        { id: '200_500', label: 'De 200 a 500 m²', description: 'Nave o departamento mediano' },
        { id: '500_1500', label: 'De 500 a 1,500 m²', description: 'Área de manufactura completa' },
        { id: 'mas_1500', label: 'Más de 1,500 m²', description: 'Complejo industrial' },
        { id: 'desconozco', label: 'No conozco el metraje / Requiere levantamiento' },
      ],
    },
    {
      id: 'epoxyCondition',
      title: '¿En qué condición se encuentra el piso actualmente?',
      type: 'single',
      options: [
        { id: 'nuevo', label: 'Concreto nuevo sin recubrir', description: 'Listo para desbaste y anclaje' },
        { id: 'danado', label: 'Concreto con grietas, oquedades o fisuras', description: 'Requiere bacheo y sellado previo' },
        { id: 'recubrimiento_anterior', label: 'Tiene epóxico o pintura anterior deteriorada', description: 'Requiere retiro mecánico' },
        { id: 'asesoria', label: 'No estoy seguro / Necesito diagnóstico' },
      ],
    },
  ],

  // 3. Pintura profesional y epóxicos
  PAINTING: [
    {
      id: 'paintSurface',
      title: '¿Qué tipo de superficie se va a pintar?',
      type: 'single',
      options: [
        { id: 'muros_naves', label: 'Muros interiores o exteriores de nave industrial' },
        { id: 'estructura_acero', label: 'Estructura metálica, trabes y columnas' },
        { id: 'demarcacion', label: 'Pisos, pasillos y demarcación de seguridad' },
        { id: 'oficinas_comercial', label: 'Oficinas, fachadas o espacios comerciales' },
      ],
    },
    {
      id: 'paintScope',
      title: '¿Cuál es la escala del proyecto?',
      type: 'single',
      options: [
        { id: 'puntual', label: 'Área puntual o retoque específico' },
        { id: 'mediana', label: 'Nave o área mediana (hasta 1,000 m²)' },
        { id: 'grande', label: 'Planta completa (más de 1,000 m²)' },
        { id: 'asesoria', label: 'Necesito visita para cuantificar' },
      ],
    },
  ],

  // 4. Mantenimiento de techos y cubiertas
  ROOF_MAINT: [
    {
      id: 'roofType',
      title: '¿Qué tipo de cubierta o techo tiene el inmueble?',
      type: 'single',
      options: [
        { id: 'kr18', label: 'Lámina engargolada o acanalada (KR-18, R-101)' },
        { id: 'multypanel', label: 'Panel aislado tipo Multypanel o Isopanel' },
        { id: 'concreto', label: 'Losa de concreto / azotea plana' },
        { id: 'tragaluces', label: 'Cubierta con domos o policarbonato' },
      ],
    },
    {
      id: 'roofProblem',
      title: '¿Cuál es el problema principal que presenta?',
      type: 'single',
      options: [
        { id: 'goteras', label: 'Filtraciones de agua y goteras activas' },
        { id: 'oxido', label: 'Oxidación, tornillería floja o pijas botadas' },
        { id: 'preventivo', label: 'Mantenimiento preventivo y limpieza de canalones' },
        { id: 'sustitucion', label: 'Sustitución de láminas dañadas o traslúcidas' },
      ],
    },
    {
      id: 'roofScope',
      title: '¿Cuál es el alcance estimado de la intervención?',
      type: 'single',
      options: [
        { id: 'reparacion_puntual', label: 'Reparación puntual en puntos críticos de goteras' },
        { id: 'nave_completa', label: 'Impermeabilización o sellado de nave completa' },
        { id: 'desconozco', label: 'Desconozco el alcance / Requiere inspección con dron o visita' },
      ],
    },
  ],

  // 5. Estructuras metálicas y naves
  METAL_STRUCT: [
    {
      id: 'structNeed',
      title: '¿Qué tipo de trabajo estructural requieres?',
      type: 'single',
      options: [
        { id: 'fabricacion', label: 'Fabricación y montaje de nave o estructura nueva' },
        { id: 'refuerzo', label: 'Refuerzo, ampliación o techumbre' },
        { id: 'mantenimiento', label: 'Mantenimiento, pintura anticorrosiva o soldadura' },
        { id: 'dictamen', label: 'Dictamen estructural o revisión de seguridad' },
      ],
    },
  ],

  // 6. Fumigación y control de plagas
  PEST_CTRL: [
    {
      id: 'pestFacility',
      title: '¿En qué tipo de instalación se requiere el servicio?',
      type: 'single',
      options: [
        { id: 'alimentos', label: 'Industria alimentaria o agropecuaria' },
        { id: 'logistica', label: 'Almacén, bodega o centro de distribución' },
        { id: 'hospital_hotel', label: 'Clínica, hospital, hotel o restaurante' },
        { id: 'residencial', label: 'Condominio o residencial' },
      ],
    },
    {
      id: 'pestTarget',
      title: '¿Qué plaga prioritaria deseas controlar o prevenir?',
      type: 'single',
      options: [
        { id: 'roedores', label: 'Control de roedores (ratas / ratones)' },
        { id: 'rastreros', label: 'Insectos rastreros (cucarachas, hormigas, chinches)' },
        { id: 'voladores', label: 'Insectos voladores (moscas, zancudos) o aves' },
        { id: 'integral', label: 'Manejo integrado general de plagas' },
      ],
    },
    {
      id: 'pestFrequency',
      title: '¿Cuál es la frecuencia deseada del servicio?',
      type: 'single',
      options: [
        { id: 'servicio_unico', label: 'Servicio correctivo único' },
        { id: 'poliza_mensual', label: 'Póliza periódica con certificado oficial para auditorías' },
        { id: 'asesoria', label: 'Requiero diagnóstico previo' },
      ],
    },
  ],

  // 7. Limpieza de cisternas y tanques
  CISTERN_CLEAN: [
    {
      id: 'cisternType',
      title: '¿Qué tipo de depósito requiere limpieza?',
      type: 'single',
      options: [
        { id: 'cisterna_concreto', label: 'Cisterna subterránea de concreto' },
        { id: 'tanque_elevado', label: 'Tanque elevado o tinacos industriales' },
        { id: 'tanque_acero', label: 'Tanque de acero inoxidable o almacenamiento de proceso' },
        { id: 'otro', label: 'Otro tipo de depósito' },
      ],
    },
    {
      id: 'cisternCapacity',
      title: '¿Capacidad aproximada del depósito?',
      type: 'single',
      options: [
        { id: 'chica', label: 'Hasta 10,000 litros (10 m³)' },
        { id: 'mediana', label: 'De 10,000 a 50,000 litros' },
        { id: 'grande', label: 'Más de 50,000 litros (industrial)' },
        { id: 'desconozco', label: 'Desconozco la capacidad exacta' },
      ],
    },
  ],
};

/**
 * Preguntas genéricas cuando el servicio no cuenta con flujo específico
 */
export const DEFAULT_CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: 'generalScale',
    title: '¿Cuál es la escala o dimensión estimada del proyecto?',
    type: 'single',
    options: [
      { id: 'puntual', label: 'Intervención puntual o área específica' },
      { id: 'mediana', label: 'Instalación mediana o proyecto departamental' },
      { id: 'complejo', label: 'Planta, complejo completo o corporativo' },
      { id: 'asesoria', label: 'No conozco la escala / Necesito asesoría' },
    ],
  },
  {
    id: 'generalPriority',
    title: '¿Cuál es el objetivo prioritario?',
    type: 'single',
    options: [
      { id: 'preventivo', label: 'Mantenimiento preventivo programado' },
      { id: 'correctivo_urgente', label: 'Atención correctiva urgente' },
      { id: 'cumplimiento', label: 'Cumplimiento normativo o auditoría' },
      { id: 'presupuesto', label: 'Cotización para presupuesto anual' },
    ],
  },
];

/**
 * Helper para obtener las preguntas contextuales correspondientes a un servicio
 */
export function getQuestionsForService(serviceCode?: string): ContextQuestion[] {
  if (!serviceCode) return DEFAULT_CONTEXT_QUESTIONS;
  return CONTEXT_QUESTIONS_BY_SERVICE[serviceCode] || DEFAULT_CONTEXT_QUESTIONS;
}

