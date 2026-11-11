# Imagem só com o Node. O código e as dependências não entram na imagem:
# o código vem montado da sua pasta e o node_modules fica num volume,
# instalado pelo docker/dev.sh. Por isso não precisa de --build ao mudar nada.
FROM node:22-alpine
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
EXPOSE 4321
CMD ["sh", "docker/dev.sh"]
