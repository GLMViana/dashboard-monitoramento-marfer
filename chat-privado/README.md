# Canal privado

Chat de texto, chamada de voz e compartilhamento de tela para um grupo pequeno de amigos.
Feito para ser leve: sem framework no navegador, sem Electron, vídeo só quando precisa.

## O que tem

- Chat de texto por canal, com histórico guardado em arquivo.
- Canais de voz com microfone ligado por padrão e câmera opcional.
- Compartilhamento de tela com presets de 720p até 4K, até 60 fps, e áudio da aba ou do sistema.
- Até 3 transmissões de tela ao mesmo tempo.
- Qualidade adaptativa: se a conexão cair, a transmissão baixa a qualidade sozinha e volta quando melhora.
- Login com senha (scrypt), sessão assinada e limite de tentativas.

## Como funciona

Três partes:

1. **Servidor do app** (`server/`): Node.js. Faz login, emite o token de voz e cuida do chat de texto.
2. **Servidor LiveKit**: roda a voz e a tela. É ele que retransmite o vídeo entre vocês, então o PC de quem compartilha manda uma cópia só.
3. **Cliente** (`client/`): páginas estáticas e JavaScript puro, carregado no navegador de cada pessoa.

## Requisitos

- Node.js 22.9 ou mais novo.
- Docker (para o LiveKit).
- Um domínio ou subdomínio apontando para o servidor, com HTTPS (o Caddy faz isso sozinho). Captura de tela no navegador exige HTTPS.
- Portas: 443 (HTTPS), 7880 e 7881 TCP, 50000 a 60000 UDP no servidor do LiveKit.

## Passo a passo

```bash
cd chat-privado
npm install
cp .env.example .env          # edite e troque todos os valores
```

Gere os segredos:

```bash
openssl rand -hex 32          # use em SESSION_SECRET
openssl rand -hex 32          # use em LIVEKIT_API_SECRET e em livekit.yaml
```

Suba o LiveKit (no VPS ou no PC de casa). Antes, troque a chave e o segredo em `deploy/livekit.yaml`, para serem iguais aos do `.env`:

```bash
cd deploy
docker compose up -d
```

Crie os usuários (um comando por pessoa):

```bash
npm run add-user -- guilherme "uma-senha-com-8-ou-mais"
npm run add-user -- amigo2 "outra-senha-boa"
```

Suba o app:

```bash
npm start
```

Coloque o `Caddyfile` de `deploy/` na frente, trocando os domínios. Depois, cada pessoa abre o endereço no navegador e entra com o nome e a senha.

## Canais

Edite `config/channels.json`. Não precisa reiniciar, o servidor relê o arquivo.

```json
{
  "text": ["geral", "jogos"],
  "voice": ["Voz geral", "Counter-Strike"]
}
```

## Qualidade da tela

Na barra da chamada, escolha o preset antes de compartilhar. Valores de referência em `client/quality.js`:

| Preset | Bitrate máximo |
|---|---|
| 720p 30 fps | 2,5 Mbps |
| 1080p 30 fps (padrão) | 5 Mbps |
| 1080p 60 fps | 8 Mbps |
| 1440p 60 fps | 12 Mbps |
| 4K 30 fps | 15 Mbps |
| 4K 60 fps | 20 Mbps |

O 4K pede upload bom de quem compartilha. Antes de usar, rode um speedtest. Em PC fraco, prefira 1080p 30 fps: codificar 4K ou 60 fps pesa no processador.

## Testes

```bash
npm test
```

Os testes cobrem senha, sessão, token do LiveKit, limites de envio, chat, arquivos estáticos, CSP e a lógica de qualidade.

**O que não é coberto pelos testes:** a conexão real de voz e tela. Ela depende de um servidor LiveKit rodando. Esse passo precisa ser feito no ambiente de vocês, com duas ou três pessoas em redes diferentes.

## Limitações conhecidas

- O limite de 3 telas é verificado no navegador de cada pessoa, com base no estado da sala. Não é uma trava no servidor. Como é um grupo de confiança, isso basta.
- O histórico do chat é lido inteiro do arquivo a cada abertura de canal. Para um grupo pequeno é rápido, mas o arquivo cresce com o tempo.
- O token de voz vale 6 horas. Se a chamada passar disso, a pessoa precisa entrar de novo.
- Não tem atalhos de teclado, notificações nem app instalado ainda. São os próximos passos.

## Próximos passos

- Empacotar como app de desktop (Tauri, que usa o WebView do próprio Windows e pesa muito menos que o Chrome ou o Electron).
- Atalhos de teclado (mutar, entrar e sair da voz, compartilhar).
- Mais opções de qualidade e de áudio.
