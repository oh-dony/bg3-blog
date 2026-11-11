export const TIPOS = {
  build:   { nome: 'Builds',   singular: 'Build',   icone: '⚔' },
  combo:   { nome: 'Combos',   singular: 'Combo',   icone: '✦' },
  party:   { nome: 'Parties',  singular: 'Party',   icone: '⚑' },
  talento: { nome: 'Talentos', singular: 'Talento', icone: '❖' },
  dica:    { nome: 'Dicas',    singular: 'Dica',    icone: '☾' },
} as const;

export type Tipo = keyof typeof TIPOS;

export const url = (caminho = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${caminho.replace(/^\//, '')}`;

export const formatarData = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "bola-de-fogo" → "Bola de Fogo" (nome padrão quando o post não passa um). */
export const nomeDoSlug = (slug: string) =>
  slug.split('-').map((p, i) =>
    i > 0 && ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o'].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)
  ).join(' ');

/** Iniciais para o marcador quando ainda não há imagem: "Bola de Fogo" → "BF". */
export const iniciais = (nome: string) =>
  nome.split(/\s+/).filter((p) => p.length > 2 || /^[A-ZÀ-Ú]/.test(p)).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
