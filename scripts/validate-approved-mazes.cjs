"use strict";
const assert=require("node:assert/strict"),crypto=require("node:crypto");
const {generateApprovedMaze,APPROVED_DESIGNS}=require("../approved-mazes.js");
const {MAZE_ROWS,generateMaze}=require("../maze.js");
const W=28,H=31,start=[13,23];
const signatures=new Set();
for(let level=2;level<=10;level++){
 const rows=generateApprovedMaze(level);
 assert.equal(rows.length,H,`Nível ${level}: altura`);
 assert(rows.every(row=>row.length===W),`Nível ${level}: largura`);
 assert.equal(rows[12][13],"-");
 assert.equal(rows[12][14],"-");
 assert.notEqual(rows[23][13],"#");
 assert.equal(rows[16][0]," ");assert.equal(rows[16][27]," ");
 for(const x of [12,13,14,15]){assert.notEqual(rows[0][x],"#");assert.notEqual(rows[30][x],"#");}
 const pass=(x,y)=>x>=0&&x<W&&y>=0&&y<H&&rows[y][x]!=="#"&&rows[y][x]!=="-";
 const key=(x,y)=>x+","+y,visited=new Set([key(...start)]),queue=[start];
 for(let i=0;i<queue.length;i++){
   const [x,y]=queue[i];
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const a=x+dx,b=y+dy,k=key(a,b);
     if(pass(a,b)&&!visited.has(k)){visited.add(k);queue.push([a,b]);}
   }
 }
 let pellets=0,unreachable=0,deadEnds=0,junctions=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const ch=rows[y][x];
   if(ch==="."||ch==="o"){
     pellets++;
     if(!visited.has(key(x,y)))unreachable++;
     const choices=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>pass(x+dx,y+dy)).length;
     if(choices<=1)deadEnds++;
     if(choices>=3)junctions++;
   }
 }
 assert.equal(unreachable,0,`Nível ${level}: pontos inacessíveis`);
 assert(pellets>=250&&pellets<=650,`Nível ${level}: pontos fora do equilíbrio (${pellets})`);
 assert(deadEnds<=pellets*.06,`Nível ${level}: muitos becos sem saída (${deadEnds})`);
 assert(junctions>=35,`Nível ${level}: faltam rotas alternativas (${junctions})`);
 assert.equal(rows.join("").split("o").length-1,4,`Nível ${level}: power pellets`);
 const sig=crypto.createHash("sha256").update(rows.join("\n")).digest("hex");
 assert(!signatures.has(sig),`Nível ${level}: layout duplicado`);
 signatures.add(sig);
 console.log(`PASS ${level} ${APPROVED_DESIGNS[level].name}: pontos=${pellets} cruzamentos=${junctions} becos=${deadEnds} SHA=${sig.slice(0,12)}`);
}
assert.equal(MAZE_ROWS.length,31,"Mapa 1 clássico inalterado");
console.log("APROVADO: 9 layouts distintos, sem pontos inacessíveis.");
