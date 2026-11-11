# Grimório — anotações de Baldur's Gate 3

## Usar
    npm run dev                                  # abre em http://localhost:4321/bg3-blog/
    npm run novo -- build "Nome da build"        # cria um post (também: combo, talento, dica)

Os posts ficam em `src/content/posts/`. Um post novo começa com `rascunho: true`;
mude para `false` para ele aparecer no site.

## Publicar
Repositório no GitHub chamado `bg3-blog` → Settings → Pages → Source: GitHub Actions.
Cada push na `main` atualiza o site.

## Rodar com Docker
    docker compose up -d      # site em http://localhost:4321/bg3-blog/
    docker compose down       # desliga
A pasta é montada no container: salvou o .md, a página atualiza sozinha.
