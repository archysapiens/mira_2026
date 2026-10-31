/**
 * Sistema MIRA - Catálogo Oficial de Servicios
 * 15 especialidades técnicas con códigos, nombres, categorías e iconos.
 */

export interface CatalogService {
  id: number;
  code: string;
  name: string;
  category: 'industrial' | 'construccion' | 'comercial' | 'residencial' | 'sanidad';
  categoryLabel: string;
  categories: string[];
  icon: string;
}

export const MIRA_SERVICES: CatalogService[] = [
  {
    id: 1,
    code: "SILOS_CLEAN",
    name: "Limpieza y sanitización de silos",
    category: "industrial",
    categoryLabel: "INDUSTRIAL",
    categories: ["industrial", "sanidad"],
    icon: "silo"
  },
  {
    id: 2,
    code: "SANITY_TECH",
    name: "Sanidad y limpieza técnica",
    category: "industrial",
    categoryLabel: "INDUSTRIAL",
    categories: ["industrial", "sanidad"],
    icon: "sparkles"
  },
  {
    id: 3,
    code: "METAL_STRUCT",
    name: "Estructuras metálicas y naves",
    category: "construccion",
    categoryLabel: "CONSTRUCCIÓN",
    categories: ["construccion", "industrial"],
    icon: "warehouse"
  },
  {
    id: 4,
    code: "HOTEL_SERV",
    name: "Servicios para hoteles",
    category: "comercial",
    categoryLabel: "COMERCIAL",
    categories: ["comercial", "mantenimiento"],
    icon: "building"
  },
  {
    id: 5,
    code: "RESID_SERV",
    name: "Servicios residenciales",
    category: "residencial",
    categoryLabel: "RESIDENCIAL",
    categories: ["residencial", "mantenimiento"],
    icon: "home"
  },
  {
    id: 6,
    code: "DRYWALL",
    name: "Tablaroca y acabados",
    category: "construccion",
    categoryLabel: "CONSTRUCCIÓN",
    categories: ["construccion", "comercial", "residencial"],
    icon: "layers"
  },
  {
    id: 7,
    code: "PAINTING",
    name: "Pintura profesional y epóxicos",
    category: "construccion",
    categoryLabel: "CONSTRUCCIÓN",
    categories: ["construccion", "industrial", "comercial", "residencial"],
    icon: "brush"
  },
  {
    id: 8,
    code: "ALUM_GLASS",
    name: "Aluminio y cristales",
    category: "construccion",
    categoryLabel: "CONSTRUCCIÓN",
    categories: ["construccion", "comercial", "residencial"],
    icon: "grid"
  },
  {
    id: 9,
    code: "CARP_IRON",
    name: "Carpintería y herrería",
    category: "construccion",
    categoryLabel: "CONSTRUCCIÓN",
    categories: ["construccion", "industrial", "comercial"],
    icon: "tool"
  },
  {
    id: 10,
    code: "PEST_CTRL",
    name: "Fumigación y control de plagas",
    category: "sanidad",
    categoryLabel: "SANIDAD",
    categories: ["sanidad", "comercial", "industrial", "residencial"],
    icon: "shield"
  },
  {
    id: 11,
    code: "DRO_PLANS",
    name: "Planos, cálculo y trámites DRO",
    category: "construccion",
    categoryLabel: "INGENIERÍA",
    categories: ["construccion", "industrial"],
    icon: "compass"
  },
  {
    id: 12,
    code: "SAFETY_TRAIN",
    name: "Capacitación y seguridad industrial",
    category: "industrial",
    categoryLabel: "INDUSTRIAL",
    categories: ["industrial"],
    icon: "award"
  },
  {
    id: 13,
    code: "EPOXY_COAT",
    name: "Recubrimientos epóxicos FDA",
    category: "industrial",
    categoryLabel: "INDUSTRIAL",
    categories: ["industrial", "construccion", "sanidad"],
    icon: "shield-check"
  },
  {
    id: 14,
    code: "ROOF_MAINT",
    name: "Mantenimiento de techos y cubiertas",
    category: "industrial",
    categoryLabel: "INDUSTRIAL",
    categories: ["industrial", "construccion"],
    icon: "umbrella"
  },
  {
    id: 15,
    code: "CISTERN_CLEAN",
    name: "Limpieza de cisternas y tanques",
    category: "sanidad",
    categoryLabel: "SANIDAD",
    categories: ["sanidad", "industrial", "comercial", "residencial"],
    icon: "droplet"
  }
];

