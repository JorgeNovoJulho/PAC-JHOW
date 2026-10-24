# PAC-JHOW — Móvel Studio Edition

Jogo Pac-Man em HTML, CSS e JavaScript puro, com labirintos gerados, foto do
personagem, música personalizada, faixa oficial **Pac-Jhow** e vários extras de
ação.

## Jogar

### Link online (mais fácil de enviar)

**<https://jorgenovojulho.github.io/PAC-JHOW/>**

Abre no Chrome/Edge e escolhe **Instalar aplicação** (ou, no telemóvel,
**Adicionar ao ecrã principal**). Fica com um ícone próprio e funciona offline
depois da primeira visita.

### Versão instalável (PWA)

Abre um terminal na pasta do projeto e corre:

```bash
npx serve .
```

Depois abre o endereço indicado no Chrome/Edge e usa **Instalar aplicação**.
Também podes alojar a pasta num serviço com HTTPS (GitHub Pages, Netlify, etc.)
e instalar a partir do telemóvel.

### Ficheiro único

Abre **`PAC-JHOW.html`** com duplo clique. É um ficheiro autónomo, com o jogo
completo, que pode ser enviado a outra pessoa e funciona offline.

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
- Faixa oficial **Pac-Jhow** (MP3) como música n.º 1, tocada ao iniciar o jogo,
  seguida das cinco faixas sintetizadas.
- Música personalizada por URL, YouTube ou ficheiro local, persistente, com
  repetição automática até o utilizador escolher as músicas padrão.
- Efeitos sonoros cómicos ativados quando há foto: tiros, bombas, morte, comer
  fantasmas/monstro, frutas, itens, vitaminas e corrida.
- Recordes, jogo guardado, GAME OVER com continuação e ecrã final com a foto
  carregada em destaque.

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

## Foto e música

O painel **Foto do personagem** e **Música personalizada** fica na barra
lateral, por baixo dos comandos. A foto é reduzida para 900 px no lado maior
antes de ser guardada; a música de ficheiro é guardada em IndexedDB e os links
em `localStorage`. Tudo fica no navegador/dispositivo onde foi escolhido.

## Estrutura

- `index.html` — página do jogo e painéis.
- `style.css` — estilo néon/glass.
- `maze.js` — labirintos clássico e procedural, casa dos fantasmas.
- `audio.js` — faixa MP3 n.º 1, música sintetizada e efeitos Web Audio.
- `Pac-Jhow.mp3` — faixa oficial n.º 1, incluída na PWA e no instalador.
- `game.js` — motor do jogo, física, IA, fotos, música e persistência.
- `sw.js` / `manifest.webmanifest` — PWA e modo offline.
- `PAC-JHOW.html` — build de ficheiro único.
- `PAC-JHOW-Instalavel.zip` — pacote com todos os ficheiros da PWA.
- `INSTALAR.txt` — instruções rápidas em português.

## Notas

- O YouTube precisa de internet; links diretos e ficheiros locais funcionam
  offline.
- A versão de ficheiro único leva a foto, os links de música e o MP3 **Pac-Jhow**
  incorporados, por isso pode ser enviada e aberta com duplo clique. As
  restrições de `file://` podem variar entre navegadores. Para a experiência
  completa, usa a versão instalável por HTTP/HTTPS.
- A música personalizada tem prioridade sobre as músicas padrão e só é
  substituída quando o utilizador escolhe explicitamente outra faixa.
