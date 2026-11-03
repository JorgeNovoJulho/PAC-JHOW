/* PAC-JHOW — Labirintos fixos 2–20 adaptados à grade jogável 28 × 31.
 * A arte aprovada é uma referência visual; estas receitas são layouts em tiles,
 * respeitando spawn, casa de fantasmas, túneis e conectividade do motor existente.
 * Nível 1 permanece inalterado. Layouts 2–10 preservados integralmente.
 */
"use strict";

const APPROVED_DESIGNS=Object.freeze({
  2:{name:"Clássico expandido", vertical:[1,6,13,14,21,26],horizontal:[1,5,9,19,23,27,29],loops:2},
  3:{name:"Anéis e rotas múltiplas",vertical:[1,4,9,13,14,18,23,26],horizontal:[1,5,9,19,23,27,29],loops:3},
  4:{name:"Cruz central e circuitos laterais",vertical:[1,6,11,13,14,16,21,26],horizontal:[1,6,9,19,23,26,29],loops:4},
  5:{name:"Circuitos concêntricos",vertical:[1,4,8,13,14,19,23,26],horizontal:[1,4,8,19,23,27,29],loops:5},
  6:{name:"Espiral amigável",vertical:[1,5,9,13,14,18,22,26],horizontal:[1,5,9,19,23,27,29],loops:6},
  7:{name:"Bulevares e retornos",vertical:[1,6,10,13,14,17,21,26],horizontal:[1,5,9,19,23,27,29],loops:7},
  8:{name:"Quatro quadrantes abertos",vertical:[1,5,9,13,14,18,22,26],horizontal:[1,6,9,19,23,26,29],loops:8},
  9:{name:"Rotas cruzadas",vertical:[1,5,10,13,14,17,22,26],horizontal:[1,5,9,19,23,27,29],loops:9},
  10:{name:"Canais em zigue-zague",vertical:[1,5,9,13,14,18,22,26],horizontal:[1,5,9,19,23,27,29],loops:10},
  11:{name:"Rotas cruzadas avançadas",vertical:[1,6,12,15,21,26],horizontal:[1,5,9,19,23,29],loops:11},
  12:{name:"Anéis laterais",vertical:[1,5,11,16,22,26],horizontal:[1,6,10,20,26,29],loops:12},
  13:{name:"Dobradiças e retornos",vertical:[1,5,10,13,14,18,23,26],horizontal:[1,5,10,20,25,29],loops:13},
  14:{name:"Hexágonos suaves",vertical:[1,5,9,13,14,18,22,26],horizontal:[1,6,11,19,24,29],loops:14},
  15:{name:"Pontes centrais",vertical:[1,5,10,13,14,17,22,26],horizontal:[1,5,9,19,25,29],loops:15},
  16:{name:"Turbilhão controlado",vertical:[1,5,9,13,14,18,23,26],horizontal:[1,6,10,20,25,29],loops:16},
  17:{name:"Caminhos orbitais",vertical:[1,4,9,13,14,18,23,26],horizontal:[1,5,10,20,25,29],loops:17},
  18:{name:"Tripla espiral",vertical:[1,5,10,13,14,17,22,26],horizontal:[1,6,10,20,25,29],loops:18},
  19:{name:"Circuito mestre",vertical:[1,5,9,13,14,18,22,26],horizontal:[1,5,10,20,25,29],loops:19},
  20:{name:"Grande final equilibrada",vertical:[1,5,10,13,14,17,22,26],horizontal:[1,6,10,20,25,29],loops:20}
});
function generateApprovedMaze(level){
  const cfg=APPROVED_DESIGNS[level];
  if(!cfg)throw Error("Nível sem mapa aprovado: "+level);
  const W=28,H=31, g=Array.from({length:H},()=>Array(W).fill("#"));
  const house=(x,y)=>x>=10&&x<=17&&y>=12&&y<=16;
  function carve(x,y){
    if(x<1||x>26||y<1||y>29||house(x,y))return;
    g[y][x]=" ";
  }
  function line(x1,y1,x2,y2){
    if(x1!==x2&&y1!==y2)throw Error("Traço diagonal inválido");
    if(x1===x2){for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)carve(x1,y);}
    else {for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)carve(x,y1);}
  }
  // Rede de caminhos largos em termos de alternativas: base contínua de loops
  // e cruzamentos. Diferente de uma DFS, evita cadeias de becos sem saída.
  for(const y of cfg.horizontal)line(1,y,26,y);
  for(const x of cfg.vertical)line(x,1,x,29);
  // Linhas externas e corredores centrais que conectam os quatro quadrantes.
  for(const y of level<=10?[3,11,17,25]:(level<=15?[3,11,17,25]:[11,17,25]))line(1,y,26,y);
  for(const x of level<=17?[3,24]:[3,24])line(x,1,x,29);
  // Casa preservada e anel de circulação aberto em volta.
  for(let x=9;x<=18;x++){carve(x,11);carve(x,17);}
  for(let y=10;y<=18;y++){carve(9,y);carve(18,y);}
  // Desenhos característicos por nível, sem isolamento dos quadrantes.
  if(level===2){for(const y of [7,21,28])line(3,y,24,y);}
  if(level===3){for(const x of [7,20])line(x,3,x,27);for(const y of [7,21])line(3,y,24,y);}
  if(level===4){for(const y of [7,21])line(1,y,26,y);for(const x of [7,20])line(x,3,x,27);}
  if(level===5){for(const x of [7,20])line(x,5,x,25);for(const y of [7,21])line(5,y,22,y);}
  if(level===6){for(const y of [7,21])line(3,y,24,y);for(const x of [7,20])line(x,5,x,25);}
  if(level===7){for(const y of [7,21,28])line(1,y,26,y);for(const x of [7,20])line(x,3,x,27);}
  if(level===8){for(const x of [7,20])line(x,3,x,27);for(const y of [7,21])line(3,y,24,y);}
  if(level===9){for(const x of [7,20])line(x,3,x,27);for(const y of [7,21,28])line(1,y,26,y);}
  if(level===10){for(const y of [7,21,28])line(3,y,24,y);for(const x of [7,20])line(x,3,x,27);}
  // Níveis 11–20: formas inspiradas nas novas pranchas. Mais decisões de
  // percurso, porém corredores conectados e alternativas de fuga garantidas.
  function ring(left,top,right,bottom){
    line(left,top,right,top);line(left,bottom,right,bottom);
    line(left,top,left,bottom);line(right,top,right,bottom);
  }
  if(level===11){line(7,3,7,27);line(20,3,20,27);line(3,7,24,7);}
  if(level===12){ring(4,4,9,10);ring(18,4,23,10);ring(4,20,9,27);ring(18,20,23,27);}
  if(level===13){ring(4,5,9,10);ring(18,20,23,26);line(7,7,20,7);line(7,23,20,23);}
  if(level===14){ring(4,4,9,9);ring(18,4,23,9);ring(4,21,9,27);ring(18,21,23,27);line(6,7,21,7);}
  if(level===15){line(5,7,22,7);line(5,22,22,22);line(7,5,7,25);line(20,5,20,25);}
  if(level===16){ring(4,4,10,10);ring(17,4,23,10);ring(4,20,10,27);ring(17,20,23,27);}
  if(level===17){ring(4,3,23,27);ring(7,6,20,24);line(7,7,20,7);}
  if(level===18){ring(4,4,10,10);ring(17,4,23,10);ring(4,20,10,27);ring(17,20,23,27);line(7,7,20,7);}
  if(level===19){ring(4,3,23,27);ring(7,6,20,24);line(3,7,24,7);line(3,22,24,22);}
  if(level===20){ring(4,3,23,27);ring(7,6,20,24);line(3,8,24,8);line(3,22,24,22);line(7,7,7,25);line(20,7,20,25);}
  // Alternância decorativa de estruturas: pilares curtos ao longo de faixas
  // livres, sempre sem tocar os principais cruzamentos.
  for(let k=0;k<cfg.loops;k++){
    const yy=(k%2===0?3:25),xx=4+(k*3)%19;
    if(g[yy][xx]===" "&&g[yy][xx-1]===" "&&g[yy][xx+1]===" "&&g[yy-1][xx]===" "&&g[yy+1][xx]===" ")
      g[yy][xx]="#";
  }
  // Um túnel nas laterais, conectado aos corredores externos.
  g[16][0]=" ";g[16][1]=" ";g[16][26]=" ";g[16][27]=" ";
  g[15][1]=" ";g[17][1]=" ";g[15][26]=" ";g[17][26]=" ";
  // Teletransporte vertical original do motor.
  for(let x=12;x<=15;x++){g[0][x]=" ";g[30][x]=" ";g[1][x]=" ";g[29][x]=" ";}
  // Casa e porta são invariantes obrigatórios do jogo.
  for(let y=12;y<=16;y++)for(let x=10;x<=17;x++)g[y][x]="#";
  for(let y=13;y<=15;y++)for(let x=11;x<=16;x++)g[y][x]=" ";
  g[12][13]="-";g[12][14]="-";
  g[11][13]=" ";g[11][14]=" ";
  g[23][13]=" ";g[23][14]=" ";
  // Energizers distribuídos nos quatro quadrantes, todos em área acessível.
  const energies=[[1,1],[26,1],[1,29],[26,29]];
  for(const [x,y] of energies)g[y][x]="o";
  // Pontos em todo corredor comum, exceto spawn, túneis e casa dos fantasmas.
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(g[y][x]!==" ")continue;
    if((x>=11&&x<=16&&y>=13&&y<=15)||(x===13&&y===23))continue;
    if(y===0||y===30||(y===16&&(x===0||x===27)))continue;
    g[y][x]=".";
  }
  return g.map(row=>row.join(""));
}
if(typeof window!=="undefined"){window.generateApprovedMaze=generateApprovedMaze;window.APPROVED_DESIGNS=APPROVED_DESIGNS;}
if(typeof module!=="undefined"&&module.exports)module.exports={generateApprovedMaze,APPROVED_DESIGNS};
