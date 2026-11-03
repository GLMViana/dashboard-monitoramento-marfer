# Site Marfer Transportes (protótipo)

Site institucional com vitrine de seminovos. Funciona offline: basta abrir o `index.html` no navegador, com o `dados.js` e a pasta `img/` ao lado. Sem servidor, sem banco de dados.

## Páginas

Cada item do menu abre uma página própria. O endereço muda junto (`index.html#empresa`, `#seminovos` etc.), então o botão voltar do navegador funciona.

| Página | Endereço | O que tem |
| --- | --- | --- |
| Início | `#inicio` | Frase institucional, números da empresa, resumo da vitrine, os 3 veículos mais novos e atalhos para Empresa, Frota e Procedência |
| Empresa | `#empresa` | Quem somos, ficha da empresa e os três compromissos (compra, operação, venda) |
| Frota | `#frota` | Ciclo do veículo, regra dos 5 anos com a exceção e o contrato com os Correios |
| Seminovos | `#seminovos` | Vitrine com busca, filtro por tipo (vans, 3/4, toco, truck), ordenação e comparação de até 3 veículos |
| Veículo | `#veiculo-mf-0412` | Ficha de cada veículo, com outros veículos sugeridos no fim |
| Procedência | `#procedencia` | Critérios de seleção, o que o comprador leva e como o preço é formado |
| Contato | `#contato` | Como comprar em 4 passos, WhatsApp, Instagram, QR code e formulário que monta a mensagem |

Cada informação aparece num lugar só: a regra dos 5 anos fica em Frota, os critérios e o preço justo em Procedência, o passo a passo em Contato.
| Gestão | `#gestao` | Link no rodapé. Painel para cadastrar, editar, excluir e mudar o status dos veículos |

## Como editar

O arquivo do dia a dia é o **`dados.js`**. Ele tem dois blocos:

**1. `CONFIG`:** número do WhatsApp, Instagram, sede, ano de fundação (2003), início da operação (2009, que gera o "mais de 15 anos" do site), estados atendidos, regra de anos na frota (`cicloPadraoAnos`) e a faixa amarela de protótipo.

**2. `VEICULOS_PADRAO`:** a lista de veículos. Cada veículo é um bloco entre chaves `{ }`. Para adicionar, copie um bloco, cole abaixo e troque os valores. Tipos aceitos: `van`, `leve` (3/4), `toco`, `truck` e `utilitario`.

Os veículos que estão lá hoje são **exemplos** (modelos reais, mas quilometragens e preços ilustrativos). Antes de mostrar como site real, troque pelos dados da frota.

## Veículos com menos de 5 anos

A regra da empresa é vender a partir de 5 anos de operação, e a página Frota explica que existem exceções. Na vitrine, esses veículos aparecem como qualquer outro, e o card e a ficha mostram o tempo de frota (calculado pelo campo `frotaDesde`). Nos exemplos, são três: Atego 2025, Volvo VM 290 2024 e Sprinter 2023.

## Fotos dos veículos

1. Coloque as fotos na pasta `fotos/` (ex.: `fotos/mf-0412-1.jpg`).
2. No veículo, preencha `fotos: ['fotos/mf-0412-1.jpg', 'fotos/mf-0412-2.jpg']`. A primeira é a capa.

Sem foto, o site mostra uma ilustração do tipo de veículo, com a logo da Marfer, e o selo "Foto em breve". Use fotos dos veículos já sem a identidade visual dos Correios.

## Área de gestão

Abre pelo link "Área de gestão" no rodapé. Dá para cadastrar veículo, enviar fotos, mudar status (disponível, reservado, vendido) e excluir.

As alterações feitas ali ficam salvas **só no navegador que você está usando**. Para levar para o site:

1. Clique em **Exportar lista** e depois em **Copiar**.
2. Abra o `dados.js`, apague o bloco que começa em `const VEICULOS_PADRAO = [` e termina em `];`, e cole no lugar.
3. Na gestão, clique em **Restaurar dados do arquivo** para conferir.

Fotos enviadas pela gestão viram texto muito longo no arquivo. Para o site definitivo, prefira salvar as fotos na pasta `fotos/` e usar o caminho.

## Pendências antes de publicar de verdade

| Item | Onde ajustar |
| --- | --- |
| Número de WhatsApp | `CONFIG.whatsapp` no `dados.js` |
| Estados onde opera | `CONFIG.estadosAtendidos` |
| Endereço completo da sede | `CONFIG.enderecoSede` |
| Fotos e dados reais dos veículos | `VEICULOS_PADRAO` e pasta `fotos/` |
| Logo em alta resolução com fundo transparente | substituir `img/logo-cor.png` e `img/logo-branca.png` |
| Domínio (www.marfer.com.br?) | definir na hospedagem |
| Tirar a faixa de protótipo | `CONFIG.mostrarAvisoPrototipo: false` |

## Arquivos

```
site/
  index.html           estrutura, visual e funcionamento do site
  dados.js             configuração e veículos (o arquivo para editar)
  img/logo-cor.png     logo para fundo branco (também usada nos veículos desenhados)
  img/logo-branca.png  logo para o rodapé azul
  img/icone.png        ícone da aba do navegador
  fotos/               fotos dos veículos (vazia por enquanto)
```
