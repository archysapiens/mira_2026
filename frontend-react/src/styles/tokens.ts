/**
 * Design Tokens Corporativos del Sistema MIRA
 * Recuperados desde frontend/css/styles.css
 */

export const MIRA_COLORS = {
  navy: {
    primary: '#062D3A',
    dark: '#041E27',
    light: '#0D3E4F',
    surface: '#103440',
  },
  green: {
    official: '#7AC143',
    bright: '#8CC63F',
    dark: '#66A334',
    tint: '#EEF7E6',
    border: '#C8E6B2',
  },
  neutral: {
    bg: '#F4F6F4',
    warm: '#F5F3EB',
    card: '#FFFFFF',
    subtle: '#F7F9F7',
    line: '#DCE2DD',
    lineSubtle: '#E8ECE8',
  },
  text: {
    primary: '#062D3A',
    secondary: '#56696D',
    muted: '#8E9FA2',
    light: '#B0C4C8',
  },
  status: {
    sent: { label: 'Enviada', color: '#0D3E4F', bg: '#EAF3F7' },
    attended: { label: 'En atención', color: '#B45309', bg: '#FEF3C7' },
    completed: { label: 'Terminada', color: '#2D6619', bg: '#EEF7E6' },
    canceled: { label: 'Cancelada', color: '#B91C1C', bg: '#FEE2E2' },
  }
} as const;
