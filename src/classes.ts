import type { CollectionEntry } from 'astro:content';

/** As 12 classes do BG3. A ordem aqui é a ordem em que aparecem no site. */
export const CLASSES = {
  barbaro:     { nome: 'Bárbaro',     papel: 'Fúria, muita vida e dano corpo a corpo', atributo: 'FOR' },
  bardo:       { nome: 'Bardo',       papel: 'Inspiração, controle e perícias',        atributo: 'CAR' },
  bruxo:       { nome: 'Bruxo',       papel: 'Rajada Mística e invocações',            atributo: 'CAR' },
  clerigo:     { nome: 'Clérigo',     papel: 'Cura, suporte e armadura pesada',        atributo: 'SAB' },
  druida:      { nome: 'Druida',      papel: 'Forma Selvagem e magia da natureza',     atributo: 'SAB' },
  feiticeiro:  { nome: 'Feiticeiro',  papel: 'Metamagia e magia inata',                atributo: 'CAR' },
  guerreiro:   { nome: 'Guerreiro',   papel: 'Mais ataques e Surto de Ação',           atributo: 'FOR / DES' },
  ladino:      { nome: 'Ladino',      papel: 'Ataque Furtivo e ação bônus de sobra',   atributo: 'DES' },
  mago:        { nome: 'Mago',        papel: 'O maior grimório de magias do jogo',     atributo: 'INT' },
  monge:       { nome: 'Monge',       papel: 'Golpes rápidos, Ki e mobilidade',        atributo: 'DES / SAB' },
  paladino:    { nome: 'Paladino',    papel: 'Punição Divina e aura para o grupo',     atributo: 'FOR / CAR' },
  patrulheiro: { nome: 'Patrulheiro', papel: 'Arco, companheiro animal e exploração',  atributo: 'DES / SAB' },
} as const;

export type Classe = keyof typeof CLASSES;
export const SLUGS_CLASSES = Object.keys(CLASSES) as [Classe, ...Classe[]];

// Reconhece o nome da classe no texto livre, inclusive no feminino ("Clériga 12 (Tempestade)").
const PADROES: Record<Classe, RegExp> = {
  barbaro: /\bbarbar[oa]\b/, bardo: /\bbard[oa]\b/, bruxo: /\bbrux[oa]\b/, clerigo: /\bclerig[oa]\b/,
  druida: /\bdruida\b/, feiticeiro: /\bfeiticeir[oa]\b/, guerreiro: /\bguerreir[oa]\b/, ladino: /\bladin[oa]\b/,
  mago: /\bmag[oa]\b/, monge: /\bmonge\b|\bmonja\b/, paladino: /\bpaladin[oa]\b/, patrulheiro: /\bpatrulheir[oa]\b/,
};
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Classes que aparecem num texto como "Paladino 6 / Feiticeiro 6". */
export function classesNoTexto(texto: string): Classe[] {
  const t = normalizar(texto);
  return SLUGS_CLASSES.filter((c) => PADROES[c].test(t));
}

/**
 * Para quais classes um post serve: a lista `classes` do frontmatter
 * + o que estiver escrito em `classe` (builds) + as classes dos `membros` (parties).
 */
export function classesDoPost(post: CollectionEntry<'posts'>): Classe[] {
  const d = post.data;
  const achadas = new Set<Classe>(d.classes);
  if (d.classe) classesNoTexto(d.classe).forEach((c) => achadas.add(c));
  d.membros?.forEach((m) => classesNoTexto(m.classe).forEach((c) => achadas.add(c)));
  return SLUGS_CLASSES.filter((c) => achadas.has(c));
}
