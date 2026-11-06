import { MIRA_SERVICES, type CatalogService } from './servicesCatalog';

export interface ServicePillar {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  badge: string;
  icon: string;
  serviceCodes: string[];
}

export const SERVICE_PILLARS: ServicePillar[] = [
  {
    id: 'industrial',
    title: 'Mantenimiento Industrial y Silos',
    shortTitle: 'Industrial y Silos',
    subtitle: 'Silos, cisternas, tanques de almacenamiento y sanidad técnica de planta',
    badge: 'ESPECIALIDAD CORE',
    icon: '🏗️',
    serviceCodes: ['SILOS_CLEAN', 'CISTERN_CLEAN', 'SANITY_TECH', 'SAFETY_TRAIN'],
  },
  {
    id: 'pisos',
    title: 'Pisos y Recubrimientos Epóxicos',
    shortTitle: 'Pisos Epóxicos',
    subtitle: 'Sistemas de alto desempeño grado alimenticio FDA, antiderrapantes y pintura técnica',
    badge: 'GRADO ALIMENTICIO',
    icon: '🧪',
    serviceCodes: ['EPOXY_COAT', 'PAINTING', 'DRYWALL'],
  },
  {
    id: 'estructuras',
    title: 'Estructuras, Cubiertas y Obra Civil',
    shortTitle: 'Techos y Cubiertas',
    subtitle: 'Mantenimiento de cubiertas, naves industriales, herrería y trámites DRO',
    badge: 'ALTURA Y CUBIERTAS',
    icon: '📐',
    serviceCodes: ['ROOF_MAINT', 'METAL_STRUCT', 'DRO_PLANS', 'ALUM_GLASS', 'CARP_IRON'],
  },
  {
    id: 'sanidad',
    title: 'Sanidad y Control Ambiental',
    shortTitle: 'Control de Plagas',
    subtitle: 'Manejo integrado de plagas, sanitización técnica y certificados para auditorías',
    badge: 'CERTIFICACIÓN SANITARIA',
    icon: '🛡️',
    serviceCodes: ['PEST_CTRL', 'SANITY_TECH'],
  },
  {
    id: 'comercial',
    title: 'Servicios Comerciales y Generales',
    shortTitle: 'Comercial y Hospitalidad',
    subtitle: 'Mantenimiento especializado para hoteles, condominios e inmuebles corporativos',
    badge: 'CORPORATIVO',
    icon: '🏢',
    serviceCodes: ['HOTEL_SERV', 'RESID_SERV'],
  },
];

export function getServicesForPillar(pillarId: string): CatalogService[] {
  const pillar = SERVICE_PILLARS.find((p) => p.id === pillarId);
  if (!pillar) return MIRA_SERVICES;
  return MIRA_SERVICES.filter((s) => pillar.serviceCodes.includes(s.code));
}

export function findPillarForService(serviceCode: string): ServicePillar | undefined {
  return SERVICE_PILLARS.find((p) => p.serviceCodes.includes(serviceCode));
}

export function getServiceNameByCode(code: string): string {
  const s = MIRA_SERVICES.find((srv) => srv.code === code);
  return s ? s.name : code;
}

