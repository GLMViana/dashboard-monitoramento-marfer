# Treino

Diário de treino que funciona sem internet. Cada pessoa usa no próprio celular e os dados ficam só nele (localStorage). Não há servidor, conta nem banco de dados, e a CSP em `index.html` bloqueia qualquer requisição externa.

## Como instalar

- **iPhone:** abrir o link no Safari, tocar em Compartilhar e em "Adicionar à Tela de Início".
- **Android:** abrir no Chrome, menu ⋮ e "Instalar app" (ou "Adicionar à tela inicial").

## Backup

Perfil > Exportar backup gera um `.json`. Trocar de celular ou limpar o navegador apaga os dados, então exporte de vez em quando. Importar permite mesclar com o que já existe ou substituir tudo.

## Arquivos

- `index.html`, `style.css`, `app.js`: o app (sem build, sem dependências)
- `sw.js`: service worker que guarda o app para abrir offline
- `manifest.webmanifest` e `icon-*.png`: instalação na tela inicial

Ao mudar `app.js`, `style.css` ou `index.html`, a versão nova aparece na segunda abertura do app (o service worker atualiza em segundo plano). Para forçar a troca imediata, aumente o número de `CACHE` em `sw.js`.
