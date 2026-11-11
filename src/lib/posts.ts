import { getCollection } from 'astro:content';
import { classesDoPost, SLUGS_CLASSES, type Classe } from '../classes';

/** Posts publicados, do mais novo para o mais antigo. */
export async function postsPublicados() {
  return (await getCollection('posts', ({ data }) => !data.rascunho))
    .sort((a, b) => b.data.data.valueOf() - a.data.data.valueOf());
}

export function contarPorClasse(posts: Awaited<ReturnType<typeof postsPublicados>>) {
  const contagem = Object.fromEntries(SLUGS_CLASSES.map((c) => [c, 0])) as Record<Classe, number>;
  posts.forEach((p) => classesDoPost(p).forEach((c) => contagem[c]++));
  return contagem;
}
