import creditos from '../data/gravuras.json';
import { url } from '../tipos';
import { acharImagem } from './imagens';

export type Credito = { title: string; creator: string; date: string; license: string; page: string; via: string };
export const CREDITOS = creditos as Record<string, Credito>;

/** URL da gravura (public/gravuras/<nome>.webp): uma por classe, mais "party". */
export const gravura = (nome: string) => url(`gravuras/${nome}.webp`);

/** "Melencolia I, Albrecht Dürer, 1514" */
export const legenda = (nome: string) => {
  const c = CREDITOS[nome];
  return c ? `${c.title.split(',')[0]}, ${c.creator}, ${c.date}` : '';
};

/** Emblema oficial da classe (public/icones/classes/), ou a gravura enquanto não houver. */
export const emblema = (classe: string) => acharImagem('icones/classes', classe) ?? gravura(classe);
