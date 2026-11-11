// Uso: npm run novo -- <build|combo|talento|dica> "Título do post"
import { writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const TIPOS = ['build', 'combo', 'talento', 'dica'];
const [tipo, ...resto] = process.argv.slice(2);
const titulo = resto.join(' ').trim();

if (!TIPOS.includes(tipo) || !titulo) {
  console.log('Uso: npm run novo -- <build|combo|talento|dica> "Título do post"');
  process.exit(1);
}

const slug = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const arquivo = `src/content/posts/${slug}.md`;
if (existsSync(arquivo)) { console.log(`Já existe: ${arquivo}`); process.exit(1); }

const hoje = new Date().toISOString().slice(0, 10);
const extrasBuild = tipo === 'build' ? `classe: "Classe 12"
raca: ""
atributos: { FOR: 10, DES: 10, CON: 10, INT: 10, SAB: 10, CAR: 10 }
talentos: []
` : '';

writeFileSync(arquivo, `---
titulo: "${titulo.replace(/"/g, '\\"')}"
tipo: ${tipo}
data: ${hoje}
resumo: ""
${extrasBuild}tags: []
rascunho: true   # mude para false quando quiser que apareça no site
---

## Ideia

Escreva aqui.
`);
console.log(`Criado: ${arquivo}`);

