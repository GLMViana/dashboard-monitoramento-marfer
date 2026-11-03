# Site Marfer Transportes (protótipo)

Site institucional com vitrine de seminovos. Funciona offline: basta abrir o `index.html` no navegador (com a pasta `img/` ao lado). Sem servidor, sem banco de dados.

## O que tem no site

| Seção | O que faz |
| --- | --- |
| Início | Frase institucional, texto aprovado e um painel com o resumo da vitrine (calculado a partir da lista de veículos) |
| Empresa | Texto institucional, ficha da empresa e os três pilares (compra, operação, venda) |
| Frota | Ciclo do veículo na Marfer, da entrada na frota até a venda |
| Seminovos | Vitrine com busca, filtro por tipo, ordenação, ficha completa de cada veículo e comparação de até 3 veículos |
| Procedência | Critérios de seleção, o que o comprador leva e como o preço é formado |
| Como comprar | Passo a passo e perguntas frequentes |
| Contato | WhatsApp, Instagram, QR code do perfil e um formulário que monta a mensagem pronta para o WhatsApp |
| Área de gestão | Link no rodapé. Painel para cadastrar, editar, excluir e mudar o status dos veículos |

## Como editar

Tudo o que muda com frequência fica no começo do `<script>`, dentro do `index.html`.

**Bloco 1, `CONFIG`:** número do WhatsApp, Instagram, sede, ano de fundação, estados atendidos, critério mínimo de anos na frota e a faixa amarela de protótipo.

**Bloco 2, `VEICULOS_PADRAO`:** a lista de veículos da vitrine. Cada veículo é um item entre chaves `{ }`. Para adicionar, copie um item, cole abaixo e troque os valores.

Os veículos que estão lá hoje são **exemplos** (modelos, quilometragens e preços ilustrativos). Antes de mostrar como site real, troque pelos dados da frota.

## Fotos dos veículos

1. Coloque as fotos na pasta `fotos/` (ex.: `fotos/mf-0412-1.jpg`).
2. No veículo, preencha `fotos: ['fotos/mf-0412-1.jpg', 'fotos/mf-0412-2.jpg']`. A primeira é a capa.

Sem foto, o site mostra uma ilustração do tipo de veículo com o selo "Foto em breve".

## Área de gestão

Abre pelo link "Área de gestão" no rodapé (ou pelo endereço terminado em `#gestao`). Dá para cadastrar veículo, enviar fotos, mudar status (disponível, reservado, vendido) e excluir.

As alterações feitas ali ficam salvas **só no navegador que você está usando**. Para levar para o arquivo do site:

1. Clique em **Exportar lista** e depois em **Copiar**.
2. Abra o `index.html`, apague o conteúdo entre `const VEICULOS_PADRAO = ` e o `;` final da lista, e cole no lugar.
3. Na gestão, clique em **Restaurar dados do arquivo** para conferir.

Fotos enviadas pela gestão viram texto muito longo no arquivo. Para o site definitivo, prefira salvar as fotos na pasta `fotos/` e usar o caminho.

## Pendências antes de publicar de verdade

| Item | Onde ajustar |
| --- | --- |
| Número de WhatsApp | `CONFIG.whatsapp` |
| Ano exato de fundação | `CONFIG.anoFundacao` |
| Estados onde opera | `CONFIG.estadosAtendidos` |
| Endereço completo da sede | `CONFIG.enderecoSede` |
| Fotos e dados reais dos veículos | `VEICULOS_PADRAO` e pasta `fotos/` |
| Logo em alta resolução com fundo transparente | substituir `img/logo-cor.png` e `img/logo-branca.png` |
| Domínio (www.marfer.com.br?) | definir na hospedagem |
| Tirar a faixa de protótipo | `CONFIG.mostrarAvisoPrototipo: false` |

## Arquivos

```
site/
  index.html        o site inteiro (estrutura, estilo e funcionamento)
  img/logo-cor.png  logo para fundo branco
  img/logo-branca.png  logo para o rodapé azul
  img/icone.png     ícone da aba do navegador
  fotos/            fotos dos veículos (vazia por enquanto)
```
