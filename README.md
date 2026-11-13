# Grimório — anotações de Baldur's Gate 3

## Usar
    npm run dev                                  # abre em http://localhost:4321/bg3-blog/
    npm run novo -- build "Nome da build"        # cria um post (também: combo, party, talento, dica)

Os posts ficam em `src/content/posts/`. Um post novo começa com `rascunho: true`;
mude para `false` para ele aparecer no site.

## Classes
Cada post aparece na página das classes para as quais serve (`/classe/paladino/` etc.).
- Builds e parties já são detectadas pelo campo `classe` e pelos `membros`.
- Talentos, combos e dicas: coloque `classes: [paladino, guerreiro]` no topo do post.

Nomes válidos: barbaro, bardo, bruxo, clerigo, druida, feiticeiro, guerreiro,
ladino, mago, monge, paladino, patrulheiro. Ícone da classe: `public/icones/classes/<nome>.webp`.

## Ícones e retratos do jogo
Coloque as imagens em `public/` com o nome em minúsculo e hífen, sem acento:

    public/icones/magias/bola-de-fogo.webp      (também: talentos/, itens/, classes/, condicoes/)
    public/retratos/shadowheart.webp

E use dentro de posts `.mdx`, sem import:

    <Icone magia="bola-de-fogo" />
    <Icone magia="chamar-relampago" nome="Chamar Relâmpago" dica="Concentração. Um raio por turno." />
    <Retrato npc="shadowheart" nome="Shadowheart" />

Sem a imagem, aparece um marcador com as iniciais, e o post funciona igual.

### Baixar as imagens automaticamente
    npm run icones                 # baixa da bg3.wiki tudo o que os posts usam e ainda falta
    npm run icones -- --simular    # só mostra o que baixaria

O script lê os `<Icone>`, `<Retrato>` e `retrato:` das parties, pula o que já existe
em `public/` e procura na bg3.wiki pelo nome em inglês, que ele tira de:
1. `en="..."` no próprio componente: `<Icone magia="bola-de-fogo" en="Fireball" />`
2. `scripts/nomes-en.json` (classes e companheiros já estão lá)
3. a primeira frase da `dica` (`dica="Call Lightning. Concentração..."`)

O que ele não achar aparece no fim, com o nome do post. Ponha o `en=` e rode de novo.
Para trocar uma imagem, apague o arquivo e rode de novo.
Quando o nome tem acento, passe `nome="..."` (o slug não tem).

## Base de referência (bg3.wiki)
    npm run wiki        # baixa magias e talentos para src/data/wiki/*.json (leva ~30s)

Dados de consulta para escrever os posts certos: nível, dano, salvaguarda, concentração,
quais classes e subclasses aprendem e em que nível, o que cada talento faz e o link da página.
Os nomes ficam em inglês, como na wiki. Rode de novo depois de um patch do jogo.
O conteúdo é da bg3.wiki (CC BY-SA 4.0): consulte, mas escreva o post com as suas palavras.

## Parties
`npm run novo -- party "Nome"` cria um post com a lista `membros` no topo
(nome, classe, papel e `retrato`). Eles viram os cartões da formação acima do texto.

## Publicar
Repositório no GitHub chamado `bg3-blog` → Settings → Pages → Source: GitHub Actions.
Cada push na `main` atualiza o site.

## Rodar com Docker
    docker compose up -d      # site em http://localhost:4321/bg3-blog/
    docker compose down       # desliga
A pasta é montada no container: salvou o arquivo, a página atualiza sozinha.
Dependência nova (package-lock.json mudou) é instalada sozinha, sem --build.
