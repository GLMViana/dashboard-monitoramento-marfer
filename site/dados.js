/* =====================================================================
   DADOS DO SITE MARFER TRANSPORTES
   Este é o arquivo de editar no dia a dia: configuração geral e veículos.
   Depois de salvar, é só recarregar o index.html no navegador.
   ===================================================================== */

/* ---------- 1. CONFIGURAÇÃO GERAL ---------- */
const CONFIG = {
  empresa: 'Marfer Transportes LTDA',

  // WhatsApp oficial: só números, com 55 + DDD. Ex.: '5555999990000'.
  // Enquanto estiver vazio, os botões abrem o WhatsApp para a pessoa escolher o contato.
  whatsapp: '',

  instagram: 'marfertransportes',
  cidadeSede: 'Santa Maria/RS',
  enderecoSede: '',            // endereço completo, quando confirmado
  anoFundacao: null,           // ex.: 1993. Vazio = "há mais de 30 anos"
  anosDeEstrada: 30,           // usado enquanto o ano de fundação não for confirmado
  estadosAtendidos: [],        // ex.: ['RS', 'SC', 'PR']. Vazio = "múltiplos estados"
  cicloPadraoAnos: 5,          // tempo de uso mais comum antes da venda
  mostrarAvisoPrototipo: true  // faixa amarela no topo avisando que os dados são de exemplo
};

/* ---------- 2. VEÍCULOS DA VITRINE ----------
   Dados de EXEMPLO para o protótipo. Troque pelos veículos reais.

   tipo:   'van' | 'leve' (3/4 e VUC) | 'toco' | 'truck' | 'utilitario'
   status: 'disponivel' | 'reservado' | 'vendido'
   preco:  número sem pontos (169900). Use null para "Sob consulta".
   fipe:   valor FIPE de referência do mês (opcional). Quando preenchido, a ficha mostra a diferença.
   fotos:  caminhos das imagens na pasta fotos/. Ex.: ['fotos/mf-0412-1.jpg', 'fotos/mf-0412-2.jpg'].
           A primeira é a capa. Lista vazia = ilustração do tipo de veículo.

   Para adicionar um veículo: copie um bloco { ... }, cole abaixo e troque os valores.
   A ordem aqui não importa: a vitrine ordena sozinha.

   Venda antecipada: todo veículo com menos de CONFIG.cicloPadraoAnos na frota
   (contando a partir de frotaDesde) ganha a etiqueta automaticamente. */
const VEICULOS_PADRAO = [
  { codigo: 'MF-0561', tipo: 'toco', marca: 'Mercedes-Benz', modelo: 'Atego', versao: '1719 Baú',
    anoFab: 2025, anoModelo: 2025, km: 41200, preco: 529900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2025, local: 'Santa Maria/RS',
    destaques: ['Histórico de manutenção completo'], fotos: [] },

  { codigo: 'MF-0552', tipo: 'truck', marca: 'Volvo', modelo: 'VM 290', versao: '6x2 Baú',
    anoFab: 2024, anoModelo: 2024, km: 87900, preco: 689900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Automatizado', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2024, local: 'Santa Maria/RS',
    destaques: ['Histórico de manutenção completo'], fotos: [] },

  { codigo: 'MF-0547', tipo: 'van', marca: 'Renault', modelo: 'Master', versao: '2.3 dCi L3H2 Furgão',
    anoFab: 2021, anoModelo: 2022, km: 218400, preco: 169900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Furgão', cor: 'Branca', frotaDesde: 2021, local: 'Santa Maria/RS',
    destaques: [], fotos: [] },

  { codigo: 'MF-0518', tipo: 'van', marca: 'Mercedes-Benz', modelo: 'Sprinter', versao: '417 Furgão Teto Alto',
    anoFab: 2023, anoModelo: 2024, km: 96300, preco: 289900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Furgão', cor: 'Branca', frotaDesde: 2023, local: 'Santa Maria/RS',
    destaques: ['Histórico de manutenção completo'], fotos: [] },

  { codigo: 'MF-0526', tipo: 'leve', marca: 'Volkswagen', modelo: 'Delivery', versao: '11.180 Baú',
    anoFab: 2021, anoModelo: 2021, km: 236900, preco: 259900, fipe: null, status: 'reservado',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2021, local: 'Santa Maria/RS',
    destaques: [], fotos: [] },

  { codigo: 'MF-0533', tipo: 'toco', marca: 'Mercedes-Benz', modelo: 'Atego', versao: '1719 Baú',
    anoFab: 2021, anoModelo: 2022, km: 198600, preco: 389900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2021, local: 'Santa Maria/RS',
    destaques: ['Histórico de manutenção completo'], fotos: [] },

  { codigo: 'MF-0464', tipo: 'truck', marca: 'Volvo', modelo: 'VM 290', versao: '6x2 Baú',
    anoFab: 2020, anoModelo: 2020, km: 412800, preco: 469900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Automatizado', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2020, local: 'Santa Maria/RS',
    destaques: [], fotos: [] },

  { codigo: 'MF-0421', tipo: 'leve', marca: 'Volkswagen', modelo: 'Delivery Express', versao: 'Prime Baú',
    anoFab: 2020, anoModelo: 2020, km: 238500, preco: 174900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2020, local: 'Santa Maria/RS',
    destaques: [], fotos: [] },

  { codigo: 'MF-0388', tipo: 'van', marca: 'Renault', modelo: 'Master', versao: '2.3 dCi L3H2 Furgão',
    anoFab: 2020, anoModelo: 2020, km: 264150, preco: 139900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Furgão', cor: 'Branca', frotaDesde: 2020, local: 'Santa Maria/RS',
    destaques: ['Histórico de manutenção completo'], fotos: [] },

  { codigo: 'MF-0412', tipo: 'van', marca: 'Mercedes-Benz', modelo: 'Sprinter', versao: '416 CDI Furgão Teto Alto',
    anoFab: 2019, anoModelo: 2019, km: 298400, preco: 169900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Furgão', cor: 'Branca', frotaDesde: 2019, local: 'Santa Maria/RS',
    destaques: ['Histórico de manutenção completo', 'Documentação regularizada'], fotos: [] },

  { codigo: 'MF-0305', tipo: 'leve', marca: 'Mercedes-Benz', modelo: 'Accelo', versao: '1016 Baú',
    anoFab: 2019, anoModelo: 2019, km: 356700, preco: 219900, fipe: null, status: 'disponivel',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Baú', cor: 'Branca', frotaDesde: 2019, local: 'Santa Maria/RS',
    destaques: [], fotos: [] },

  { codigo: 'MF-0247', tipo: 'van', marca: 'Renault', modelo: 'Master', versao: '2.3 dCi L2H2 Furgão',
    anoFab: 2018, anoModelo: 2018, km: 372800, preco: 109900, fipe: null, status: 'vendido',
    combustivel: 'Diesel', cambio: 'Manual', carroceria: 'Furgão', cor: 'Branca', frotaDesde: 2018, local: 'Santa Maria/RS',
    destaques: [], fotos: [] }
];
