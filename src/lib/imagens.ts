import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { url } from '../tipos';

const EXTENSOES = ['webp', 'png', 'jpg', 'jpeg', 'svg'];

/**
 * Procura public/<pasta>/<slug>.<ext> na hora do build.
 * Devolve a URL pronta, ou undefined se a imagem ainda não foi colocada lá.
 */
export function acharImagem(pasta: string, slug: string): string | undefined {
  for (const ext of EXTENSOES) {
    const relativo = `${pasta}/${slug}.${ext}`;
    if (existsSync(join(process.cwd(), 'public', relativo))) return url(relativo);
  }
  return undefined;
}

/** Emblema oficial da classe (public/icones/classes/<classe>.png). */
export const emblema = (classe: string) => acharImagem('icones/classes', classe);

/** Retrato do jogo (public/retratos/<nome>.png). */
export const retrato = (nome?: string) => (nome ? acharImagem('retratos', nome) : undefined);
