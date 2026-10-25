## 📱 PAC-JHOW Android — versão 1.1.1 Beta (atual)

**[⬇️ BAIXAR APK ANDROID 1.1.1](https://github.com/JorgeNovoJulho/PAC-JHOW/releases/download/v1.1.1-android-beta/PAC-JHOW-Android-1.1.1-beta.apk)**

[Instruções para instalar no Android](INSTALAR-PAC-JHOW-ANDROID.txt). A nova versão consulta atualizações no GitHub quando o jogo abre e disponibiliza o download; a instalação exige confirmação do Android. APK beta com assinatura de desenvolvimento: atualizar sobre uma instalação anterior pode falhar devido à diferença de assinatura, e desinstalar pode apagar dados locais.

---

# PAC-JHOW — Móvel Studio Edition

Jogo Pac-Man para **Windows**, com 20 níveis, foto do personagem, música
personalizada, duas faixas oficiais **Pac-Jhow** e extras de ação. A aplicação é
instalada como um programa normal: **não é preciso abrir o navegador**.

## Instalar no Windows

1. Instala o **`PAC-JHOW-Setup-1.0.4.exe`** (pasta `dist` ou a versão publicada
   nas Releases do GitHub).
2. Se o Windows mostrar **“O Windows protegeu o seu PC”**, clica em
   **Mais informações → Executar mesmo assim**. O instalador ainda não tem
   assinatura digital paga; o código-fonte é público e verificável.
3. Segue o instalador. No fim, abre pelo atalho **PAC-JHOW** no Ambiente de
   Trabalho ou no menu Iniciar.

O instalador é **por utilizador** (não precisa de administrador) e mantém a
foto, a música e o jogo guardado ao desinstalar. Esses dados ficam em
`%APPDATA%\PAC-JHOW\`.

## Atualizações

Abre **⚙️ Opções** no canto superior direito. Podes escolher:

- **GitHub Releases (público)** — predefinido; usa a última Release de
  `JorgeNovoJulho/PAC-JHOW`.
- **Servidor próprio / local** — um servidor HTTPS (ou
  `http://127.0.0.1:8787/` para testes no teu PC).

A aplicação verifica automaticamente atualizações ao iniciar, baixa novas versões em segundo plano e instala ao fechar o jogo normalmente. A instalação não interrompe partidas. Também é possível verificar manualmente em ⚙️ Opções.

Para testar o servidor local, consulta **[ATUALIZACOES.md](ATUALIZACOES.md)** e
usa o `INICIAR-SERVIDOR-ATUALIZACOES.bat`.

## Ranking mundial

A versão 1.0.4 mostra um ranking global consultado no GitHub, atualizado aproximadamente a cada cinco minutos. Os recordes locais permanecem offline. **O envio automático de pontuações ainda não está habilitado**: requer serviço HTTPS seguro de submissão e validação, conforme [RANKING-GLOBAL.md](RANKING-GLOBAL.md).

## Funcionalidades

- 20 níveis: o nível 1 é o labirinto clássico e os restantes são gerados.
- 3 vidas por nível, fantasmas, frutas, itens especiais e monstro.
- Míssil que mata fantasmas e o monstro que encontrar no caminho.
- Bombas, tiros, corrida e pílulas de energia.
- Casa dos fantasmas sempre centrada, com quatro paredes e saída normal.
- Olhos dos fantasmas mortos voltam pelo labirinto até à casinha.
- Durante a vitamina, fantasmas mortos ficam dentro da casa até o efeito acabar.
- Balões de fala cómicos para as ações do jogo.
- Foto do personagem persistente, emoldurada na casinha e com flash vermelho
  de 2 segundos quando o personagem morre.
- Faixa oficial **Pac-Jhow** (MP3) como música n.º 1, tocada ao iniciar o jogo.
- Nova faixa oficial **Pac-Jhow 2** (MP3) como música n.º 2, acessível pela tecla **2** e pelo seletor de músicas.
- Quatro faixas sintetizadas nas posições 3 a 6.
- Música personalizada por URL, YouTube ou ficheiro local, persistente, com
  repetição automática até o utilizador escolher as músicas padrão.
- Efeitos sonoros cómicos ativados quando há foto: tiros, bombas, morte, comer
  fantasmas/monstro, frutas, itens, vitaminas e corrida.
- Recordes, jogo guardado, GAME OVER com continuação e ecrã final com a foto
  carregada em destaque.
- Correção do fluxo de morte: o jogo retoma sempre a vida seguinte, sem
  congelar nem deixar o ecrã num estado inválido.

## Controlos

| Ação | Teclas |
| --- | --- |
| Mover | Setas ou WASD |
| Corrida | C ou botões esquerdo + direito do rato |
| Bomba | Botão esquerdo do rato ou B |
| Tiro | Botão direito do rato ou Espaço |
| Escolher música | 1 a 6 |
| Pausa | P ou Esc |
| Ouvir / parar música | M |
| Opções | ⚙️ ou Ctrl+, |

## Foto e música

O painel **Foto do personagem** e **Música personalizada** fica na barra
lateral, por baixo dos comandos. A foto é reduzida para 900 px no lado maior
antes de ser guardada; a música de ficheiro é guardada em IndexedDB e os links
em `localStorage`. Tudo fica no dispositivo onde foi escolhido e sobrevive a
mortes, novas vidas, fechar e reabrir a aplicação.

## Para programadores

Requisitos: Node.js 24+ e Windows x64.

```powershell
npm install
npm start          # abrir em modo de desenvolvimento
npm run dist       # criar o instalador em dist\
npm run update-server
```

O código é público e aceita melhorias por **Pull Request**. Uma alteração só
chega aos jogadores depois de revista, integrada na `main` e publicada como
Release com uma tag `vX.Y.Z`; o workflow do GitHub compila o instalador e os
metadados de atualização. Isto evita que código de terceiros não revisto seja
executado automaticamente nos PCs dos jogadores.

### Estrutura

- `electron/main.js` — janela, opções, updater e menu.
- `electron/preload.js` — ponte segura para a interface.
- `index.html` / `style.css` — interface do jogo e opções.
- `maze.js` — labirintos clássico e procedural, casa dos fantasmas.
- `audio.js` — faixa MP3 n.º 1, música sintetizada e efeitos Web Audio.
- `Pac-Jhow.mp3` — faixa oficial n.º 1.
- `Pac-Jhow-2.mp3` — faixa oficial n.º 2 (deve ser adicionada antes da próxima publicação).
- `game.js` — motor do jogo, física, IA, fotos, música e persistência.
- `settings.js` — área ⚙️ Opções e atualizações.
- `update-server/server.js` — servidor local de atualizações.
- `ATUALIZACOES.md` — testar atualizações, servidor real e Releases.
- `.github/workflows/build-release.yml` — build e Release automáticos.

## Notas

- O YouTube precisa de internet; links diretos e ficheiros locais funcionam
  offline.
- A foto e a música personalizada ficam apenas no dispositivo onde foram
  escolhidas.
- A aplicação é Electron; a interface usa HTML/JS, mas o jogo é executado como
  programa instalado, sem barra de navegador.
- O instalador não está assinado digitalmente. Para distribuição pública sem
  aviso do SmartScreen é necessário um certificado de assinatura de código.
