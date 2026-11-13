// Uso: npm run wiki        baixa da bg3.wiki a base de referência (magias e talentos)
//
// Grava em src/data/wiki/*.json. Os nomes ficam em inglês, como na wiki.
// O conteúdo vem da bg3.wiki (CC BY-SA 4.0): é material de consulta, não texto para colar nos posts.
import { writeFileSync, mkdirSync } from 'node:fs';

const API = 'https://bg3.wiki/w/api.php';
const AGENTE = 'grimorio-bg3-fan-blog/1.0 (base de referencia; poucas requisicoes, com pausa)';
const PAUSA_MS = 1500;
const DESTINO = 'src/data/wiki';
const FONTE = { site: 'https://bg3.wiki', licenca: 'CC BY-SA 4.0', baixado: new Date().toISOString().slice(0, 10) };

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params, tentativa = 1) {
  await esperar(PAUSA_MS);
  const q = new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const r = await fetch(`${API}?${q}`, { headers: { 'User-Agent': AGENTE } });
  if (r.status === 429 && tentativa <= 4) {
    const espera = 10_000 * tentativa;
    console.log(`  a wiki pediu calma (429), esperando ${espera / 1000}s...`);
    await esperar(espera);
    return api(params, tentativa + 1);
  }
  if (!r.ok) throw new Error(`bg3.wiki respondeu ${r.status}`);
  const json = await r.json();
  if (json.error) throw new Error(`bg3.wiki: ${json.error.info}`);
  return json;
}

// Todas as páginas de uma categoria, com o wikitext, 50 por vez.
async function paginasDaCategoria(categoria) {
  const paginas = [];
  let cont = {};
  do {
    const r = await api({
      action: 'query', generator: 'categorymembers', gcmtitle: categoria, gcmtype: 'page',
      gcmnamespace: '0', gcmlimit: '50', prop: 'revisions', rvprop: 'content', rvslots: 'main', ...cont,
    });
    for (const p of r.query?.pages ?? []) {
      const texto = p.revisions?.[0]?.slots?.main?.content;
      if (texto) paginas.push({ titulo: p.title, texto });
    }
    process.stdout.write(`  ${paginas.length} páginas\r`);
    cont = r.continue ?? null;
  } while (cont);
  console.log();
  return paginas;
}

async function wikitext(pagina) {
  const r = await api({ action: 'parse', page: pagina, prop: 'wikitext' });
  return r.parse.wikitext;
}

// ---------- Ler wikitext ----------

// Conteúdo do primeiro {{Nome ...}} do texto, respeitando chaves aninhadas.
function blocos(texto, nome) {
  const achados = [];
  const re = new RegExp(`\\{\\{\\s*${nome}\\s*\\|`, 'gi');
  let m;
  while ((m = re.exec(texto))) {
    let prof = 2, i = m.index + 2;
    for (; i < texto.length && prof > 0; i++) {
      if (texto.startsWith('{{', i)) { prof += 2; i++; }
      else if (texto.startsWith('}}', i)) { prof -= 2; i++; }
    }
    achados.push(texto.slice(m.index + m[0].length, i - 2));
    re.lastIndex = i;
  }
  return achados;
}

// "a = 1 | b = {{x|y}}" -> { a: "1", b: "{{x|y}}" } (só as barras do nível de fora)
function parametros(corpo) {
  const partes = [];
  let prof = 0, inicio = 0;
  for (let i = 0; i < corpo.length; i++) {
    const dois = corpo.slice(i, i + 2);
    if (dois === '{{' || dois === '[[') { prof++; i++; }
    else if (dois === '}}' || dois === ']]') { prof--; i++; }
    else if (corpo[i] === '|' && prof === 0) { partes.push(corpo.slice(inicio, i)); inicio = i + 1; }
  }
  partes.push(corpo.slice(inicio));
  const obj = {};
  for (const p of partes) {
    const eq = p.indexOf('=');
    if (eq > 0) obj[p.slice(0, eq).trim().toLowerCase()] = p.slice(eq + 1).trim();
  }
  return obj;
}

// Wikitext -> texto simples. {{DamageText|8d6|Fire}} -> "8d6 Fire", [[Abilities|ability score]] -> "ability score".
function limpar(t) {
  if (!t) return undefined;
  let s = t.replace(/<!--[\s\S]*?-->/g, '').replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, '');
  let antes;
  do {
    antes = s;
    s = s.replace(/\{\{([^{}]*)\}\}/g, (_, dentro) => {
      const [nome, ...args] = dentro.split('|').map((x) => x.trim());
      const posicionais = args.filter((a) => !/^[\w ]+=/.test(a));
      if (/^(hatnote|pageseo|cite|ref)/i.test(nome)) return '';
      return posicionais.length ? posicionais.join(' ') : nome;
    });
  } while (s !== antes);
  s = s
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\S+ ([^\]]*)\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/^[:*]\s*/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return s || undefined;
}

const lista = (t) => (limpar(t) ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const sim = (t) => /^(yes|true|1)$/i.test((t ?? '').trim());
const numero = (t) => (t && !isNaN(parseFloat(t)) ? parseFloat(t) : undefined);
const url = (titulo) => `https://bg3.wiki/wiki/${encodeURIComponent(titulo.replace(/ /g, '_'))}`;
const semVazios = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) =>
  v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)));

// ---------- Magias ----------
async function magias() {
  console.log('Magias (Category:Spells)');
  const saida = [];
  const lidas = [];
  for (const { titulo, texto } of await paginasDaCategoria('Category:Spells')) {
    const bloco = blocos(texto, 'Feature page')[0];
    if (!bloco) continue;
    const p = parametros(bloco);
    if (p.type && !/spell/i.test(p.type)) continue;

    // "class learns at level 5 = Light Domain:Domain Spell, Sorcerer" -> { 5: ["Light Domain", "Sorcerer"] }
    const aprende = {};
    for (const [k, v] of Object.entries(p)) {
      const m = k.match(/^class learns at level (\d+)$/);
      if (m) aprende[m[1]] = lista(v.replace(/:[^,]*/g, ''));
    }
    lidas.push({ titulo, p, aprende, variante: limpar(p['variant of']) });
  }

  // Variantes (Criar Água é variante de Create or Destroy Water) herdam as classes da principal.
  const porNome = new Map(lidas.map((l) => [l.titulo, l]));
  for (const { titulo, p, aprende: proprias, variante } of lidas) {
    const mae = variante && porNome.get(variante);
    const classes = lista(p.classes).length ? lista(p.classes) : mae ? lista(mae.p.classes) : [];
    const aprende = Object.keys(proprias).length ? proprias : mae?.aprende ?? {};
    // Fica só o que um personagem jogável consegue aprender; magia de item e de NPC sai.
    if (!classes.length && !Object.keys(aprende).length) continue;

    const nivel = /cantrip/i.test(p.level ?? '') ? 0 : numero(p.level);
    saida.push(semVazios({
      nome: titulo,
      nivel,
      escola: limpar(p.school),
      resumo: limpar(p.summary),
      descricao: limpar(p.description),
      dano: limpar(p.damage),
      tipo_dano: limpar(p['damage type']),
      custo: lista(p.cost),
      salvaguarda: limpar(p.save),
      ao_resistir: limpar(p['on save']),
      alcance_m: numero(p['range m']) ?? limpar(p.range),
      area: p.aoe ? semVazios({ forma: limpar(p.aoe), metros: numero(p['aoe m']) }) : undefined,
      concentracao: sim(p.concentration) || undefined,
      ritual: sim(p.ritual) || undefined,
      duracao: limpar(p.duration),
      niveis_superiores: limpar(p['higher levels']),
      classes,
      aprende_no_nivel: aprende,
      variante_de: mae ? variante : undefined,
      wiki: url(titulo),
    }));
  }
  saida.sort((a, b) => (a.nivel ?? 99) - (b.nivel ?? 99) || a.nome.localeCompare(b.nome));
  return saida;
}

// ---------- Talentos ----------
async function talentos() {
  console.log('Talentos (página Feats)');
  const texto = await wikitext('Feats');
  return blocos(texto, 'table feat').map((corpo) => {
    const p = parametros(corpo);
    const efeitos = [];
    for (let i = 1; p[`feature${i}`] !== undefined || p[`description${i}`] !== undefined; i++)
      efeitos.push(semVazios({ nome: limpar(p[`feature${i}`]), descricao: limpar(p[`description${i}`]) }));
    const nome = limpar(p.name);
    return semVazios({ nome, descricao: limpar(p.description), efeitos, wiki: url(nome) });
  });
}

// ---------- Gravar ----------
mkdirSync(DESTINO, { recursive: true });
for (const [arquivo, pegar] of [['talentos', talentos], ['magias', magias]]) {
  const itens = await pegar();
  writeFileSync(`${DESTINO}/${arquivo}.json`, JSON.stringify({ fonte: FONTE, itens }, null, 1) + '\n');
  console.log(`  ${itens.length} gravados em ${DESTINO}/${arquivo}.json\n`);
}
