export const TIPOS = {
  build:   { nome: 'Builds',   singular: 'Build',   icone: '⚔' },
  combo:   { nome: 'Combos',   singular: 'Combo',   icone: '✦' },
  talento: { nome: 'Talentos', singular: 'Talento', icone: '❖' },
  dica:    { nome: 'Dicas',    singular: 'Dica',    icone: '☾' },
} as const;

export type Tipo = keyof typeof TIPOS;

export const url = (caminho = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${caminho.replace(/^\//, '')}`;

export const formatarData = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
