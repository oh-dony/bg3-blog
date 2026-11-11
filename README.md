# Grimório — anotações de Baldur's Gate 3

## Usar
    npm run dev                                  # abre em http://localhost:4321/bg3-blog/
    npm run novo -- build "Nome da build"        # cria um post (também: combo, party, talento, dica)

Os posts ficam em `src/content/posts/`. Um post novo começa com `rascunho: true`;
mude para `false` para ele aparecer no site.

## Ícones e retratos do jogo
Coloque as imagens em `public/` com o nome em minúsculo e hífen, sem acento:

    public/icones/magias/bola-de-fogo.webp      (também: talentos/, itens/, classes/, condicoes/)
    public/retratos/shadowheart.webp

E use dentro de posts `.mdx`, sem import:

    <Icone magia="bola-de-fogo" />
    <Icone magia="chamar-relampago" nome="Chamar Relâmpago" dica="Concentração. Um raio por turno." />
    <Retrato npc="shadowheart" nome="Shadowheart" />

Sem a imagem, aparece um marcador com as iniciais, e o post funciona igual.
Quando o nome tem acento, passe `nome="..."` (o slug não tem).

## Parties
`npm run novo -- party "Nome"` cria um post com a lista `membros` no topo
(nome, classe, papel e `retrato`). Eles viram os cartões da formação acima do texto.

## Publicar
Repositório no GitHub chamado `bg3-blog` → Settings → Pages → Source: GitHub Actions.
Cada push na `main` atualiza o site.

## Rodar com Docker
    docker compose up -d --build   # --build quando mudar dependência; site em http://localhost:4321/bg3-blog/
    docker compose down       # desliga
A pasta é montada no container: salvou o .md, a página atualiza sozinha.
