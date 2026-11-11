// Uso: npm run icones              baixa da bg3.wiki os ícones e retratos que faltam
//      npm run icones -- --simular  só mostra o que baixaria
//
// Junta tudo o que os posts usam (<Icone>, <Retrato>, `retrato:` das parties) e as 12 classes,
// pula o que já está em public/ e procura o resto na bg3.wiki pelo nome em inglês.
// O nome em inglês vem de: atributo en="..." → scripts/nomes-en.json → primeira frase da dica.
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://bg3.wiki/w/api.php';
const AGENTE = 'grimorio-bg3-fan-blog/1.0 (script de icones; baixa uma imagem por vez)';
const PAUSA_MS = 400;
const EXTENSOES = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
const SIMULAR = process.argv.includes('--simular');

const PASTAS = { magia: 'magias', talento: 'talentos', item: 'itens', classe: 'classes', condicao: 'condicoes' };
const CLASSES = ['barbaro', 'bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro',
  'guerreiro', 'ladino', 'mago', 'monge', 'paladino', 'patrulheiro'];

const nomesEn = JSON.parse(readFileSync(new URL('./nomes-en.json', import.meta.url), 'utf8'));

// ---------- 1. O que os posts usam ----------
const pedidos = new Map(); // "magias/relampago" -> { pasta, slug, nomes: Set, onde: Set }
function pedir(pasta, slug, nomes, onde) {
  if (!slug) return;
  const chave = `${pasta}/${slug}`;
  const p = pedidos.get(chave) ?? { pasta, slug, nomes: [], onde: new Set() };
  for (const n of nomes) if (n && !p.nomes.includes(n)) p.nomes.push(n);
  p.onde.add(onde);
  pedidos.set(chave, p);
}

const atributos = (texto) =>
  Object.fromEntries([...texto.matchAll(/(\w+)(?:\s*=\s*"([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]));

// "Destructive Wrath (Canalizar Divindade). O dano..." -> "Destructive Wrath"
const nomeDaDica = (dica) => {
  const n = typeof dica === 'string' ? dica.split(/[.(:;]/)[0].trim() : '';
  return n && n.split(/\s+/).length <= 6 ? n : undefined;
};

const DIR_POSTS = 'src/content/posts';
for (const arquivo of readdirSync(DIR_POSTS).filter((a) => /\.mdx?$/.test(a))) {
  const texto = readFileSync(join(DIR_POSTS, arquivo), 'utf8');

  for (const [, attrs] of texto.matchAll(/<Icone\b([^>]*?)\/?>/g)) {
    const a = atributos(attrs);
    const tipo = Object.keys(PASTAS).find((t) => typeof a[t] === 'string');
    if (!tipo) continue;
    const pasta = PASTAS[tipo];
    pedir(pasta, a[tipo], [a.en, nomesEn[`${pasta}/${a[tipo]}`], nomeDaDica(a.dica)], arquivo);
  }

  for (const [, attrs] of texto.matchAll(/<Retrato\b([^>]*?)\/?>/g)) {
    const a = atributos(attrs);
    if (typeof a.npc === 'string') pedir('retratos', a.npc, [a.en, nomesEn[`retratos/${a.npc}`], a.nome], arquivo);
  }

  // membros das parties: { nome: "Lae'zel", ..., retrato: "laezel" }
  for (const [linha] of texto.matchAll(/^.*\bretrato:\s*"[^"]+".*$/gm)) {
    const slug = linha.match(/\bretrato:\s*"([^"]+)"/)[1];
    const nome = linha.match(/\bnome:\s*"([^"]+)"/)?.[1];
    pedir('retratos', slug, [nomesEn[`retratos/${slug}`], nome], arquivo);
  }
}
for (const c of CLASSES) pedir('classes', c, [nomesEn[`classes/${c}`]], 'página das classes');

// ---------- 2. Só o que falta em public/ ----------
const jaTem = (pasta, slug) => {
  const dir = pasta === 'retratos' ? 'public/retratos' : `public/icones/${pasta}`;
  return EXTENSOES.some((ext) => existsSync(join(dir, `${slug}.${ext}`)));
};
const faltando = [...pedidos.values()].filter((p) => !jaTem(p.pasta, p.slug));

if (!faltando.length) {
  console.log(`Nada faltando: as ${pedidos.size} imagens usadas já estão em public/.`);
  process.exit(0);
}
console.log(`${pedidos.size} imagens usadas, ${faltando.length} faltando.${SIMULAR ? ' (simulação)' : ''}\n`);

// ---------- 3. Procurar na bg3.wiki ----------
const ARQUIVOS = {
  magias: (n) => [`${n} Icon.webp`, `${n} Icon.png`],
  talentos: (n) => [`${n} Icon.webp`, `${n} Icon.png`],
  itens: (n) => [`${n} Icon.webp`, `${n} Icon.png`, `${n} Unfaded Icon.png`, `${n} Unfaded Icon.webp`],
  condicoes: (n) => [`${n} Condition Icon.webp`, `${n} Condition Icon.png`, `${n} Icon.webp`, `${n} Icon.png`],
  classes: (n) => [`${n} Class Icon.png`, `${n} Class Icon.webp`, `${n} Icon.png`],
  // "Portrait X" é quadrado, combina com o retrato redondo; "X Portrait" é mais alto que largo.
  retratos: (n) => [`Portrait ${n}.png`, `Portrait ${n}.webp`, `${n} Portrait.png`, `${n} Portrait.webp`],
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(params) {
  await esperar(PAUSA_MS);
  const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', redirects: '1', ...params });
  const r = await fetch(`${API}?${q}`, { headers: { 'User-Agent': AGENTE } });
  if (!r.ok) throw new Error(`bg3.wiki respondeu ${r.status}`);
  return (await r.json()).query ?? {};
}

// Devolve { url, arquivo } do primeiro candidato que existe, na ordem dada.
async function procurarArquivo(candidatos) {
  const titulos = candidatos.map((c) => `File:${c}`);
  const q = await api({ prop: 'imageinfo', iiprop: 'url|size', titles: titulos.join('|') });
  const final = new Map(titulos.map((t) => [t, t]));
  for (const { from, to } of [...(q.normalized ?? []), ...(q.redirects ?? [])])
    for (const [t, atual] of final) if (atual === from) final.set(t, to);
  const paginas = new Map((q.pages ?? []).map((p) => [p.title, p]));
  for (const t of titulos) {
    const info = paginas.get(final.get(t))?.imageinfo?.[0];
    if (info) return { url: info.url, arquivo: final.get(t) };
  }
}

// Plano B para ícones: a imagem principal da página do verbete, se for pequena e quadrada.
async function procurarNaPagina(nome) {
  const q = await api({ prop: 'pageimages', piprop: 'original', titles: nome });
  const img = q.pages?.[0]?.original;
  if (img && img.width <= 400 && Math.abs(img.width - img.height) <= 4)
    return { url: img.source, arquivo: `imagem da página "${q.pages[0].title}"` };
}

async function baixar(url, destino) {
  await esperar(PAUSA_MS);
  const r = await fetch(url, { headers: { 'User-Agent': AGENTE } });
  const tipo = r.headers.get('content-type') ?? '';
  if (!r.ok || !tipo.startsWith('image/')) throw new Error(`download falhou (${r.status} ${tipo})`);
  writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

const naoAchados = [];
let baixados = 0;
for (const p of faltando) {
  const rotulo = `${p.pasta}/${p.slug}`;
  if (!p.nomes.length) { naoAchados.push({ p, motivo: 'sem nome em inglês' }); console.log(`  ?  ${rotulo}`); continue; }

  try {
    let achado;
    for (const nome of p.nomes) {
      achado = await procurarArquivo(ARQUIVOS[p.pasta](nome));
      if (!achado && p.pasta !== 'retratos' && p.pasta !== 'classes') achado = await procurarNaPagina(nome);
      if (achado) break;
    }
    if (!achado) { naoAchados.push({ p, motivo: `tentei "${p.nomes.join('", "')}"` }); console.log(`  ?  ${rotulo}`); continue; }

    const ext = achado.url.split('?')[0].split('.').pop().toLowerCase();
    const dir = p.pasta === 'retratos' ? 'public/retratos' : `public/icones/${p.pasta}`;
    const destino = join(dir, `${p.slug}.${ext}`);
    if (!SIMULAR) { mkdirSync(dir, { recursive: true }); await baixar(achado.url, destino); }
    baixados++;
    console.log(`  ✓  ${destino}  ←  ${achado.arquivo}`);
  } catch (e) {
    naoAchados.push({ p, motivo: e.message });
    console.log(`  ✗  ${rotulo}  (${e.message})`);
  }
}

console.log(`\n${SIMULAR ? 'Baixaria' : 'Baixados'}: ${baixados}. Não achados: ${naoAchados.length}.`);
if (naoAchados.length) {
  console.log('\nPara estes, ponha o nome em inglês da bg3.wiki no post (<Icone ... en="Fireball" />)');
  console.log('ou em scripts/nomes-en.json ("magias/bola-de-fogo": "Fireball") e rode de novo:');
  for (const { p, motivo } of naoAchados) console.log(`  - ${p.pasta}/${p.slug}  (${motivo}; usado em ${[...p.onde].join(', ')})`);
}
