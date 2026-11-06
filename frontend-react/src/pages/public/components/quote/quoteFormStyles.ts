/**
 * Tokens y clases tipográficas unificadas para los campos del Funnel de Cotización MIRA.
 * 
 * Jerarquía visual compacta y equilibrada (.mira-quote-label y .mira-quote-field):
 * - Encabezados / labels de campo: 11px, font-weight 600, line-height 1.35, letter-spacing 0.02em (.mira-quote-label)
 * - Texto dentro de inputs, selectores y textareas: 10px, font-weight 400 (.mira-quote-field)
 * - Placeholders: 10px (.mira-quote-field::placeholder)
 * - Opciones de selectores: 10px (.mira-quote-option)
 * - Mensajes de error: 10.5px (text-[10.5px] font-semibold text-red-600 mt-0.5)
 * - Altura de controles: 38px en escritorio (h-[38px]) con padding horizontal de 12px (px-3 py-1.5)
 */

export const funnelFormStyles = {
  // Encabezados / labels del campo: 11px font-weight 600 (.mira-quote-label)
  label: 'mira-quote-label',

  // Controles de entrada (inputs) de altura 38px y tipografía 10px (.mira-quote-field)
  inputBase:
    'mira-quote-field w-full h-[38px] px-3 py-1.5 bg-white border rounded-md focus:outline-none focus:border-[#79BD43] transition-all',
  inputNormal: 'border-[#CED7D4]',
  inputError: 'border-red-500 bg-red-50/20',

  // Selectores desplegables de altura 38px y tipografía 10px (.mira-quote-field)
  selectBase:
    'mira-quote-field w-full h-[38px] px-3 py-1.5 bg-white border rounded-md focus:outline-none focus:border-[#79BD43] transition-all cursor-pointer',
  selectOption: 'mira-quote-option',

  // Área de texto (textarea) para descripción con tipografía 10px (.mira-quote-field)
  textareaBase:
    'mira-quote-field w-full min-h-[58px] max-h-[110px] px-3 py-2 bg-white border rounded-md focus:outline-none focus:border-[#79BD43] transition-all leading-relaxed',

  // Mensaje de validación de error en 10.5px
  errorMessage: 'text-[10.5px] font-semibold text-red-600 mt-0.5 block',
};

