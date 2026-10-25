"use strict";
window.PAC_DIALOGUES=Object.freeze({
 intro:["Bora pro labirinto!","Hoje o recorde cai!","Fantasma que lute!"],
 levelStart:["Fase nova, confusão nova!","Agora o negócio ficou sério!","Segura essa!"],
 powerUp:["Agora ficou injusto!","É minha vez!","Corre, fantasminha!"],
 danger:["Opa, apertou!","Quase me pegaram!","Sai da frente!"],
 death:["Essa doeu...","Calma que eu volto!","Ainda não acabou!"],
 victory:["Mais uma no bolso!","Passei bonito!","Próxima fase!"],
 ranking:["Subindo no ranking!","Agora me respeita!","Quero o topo do mundo!"],
 ghost:["Buu! Você não me pega!","Vem pro corredor, Jhow!","Hoje o labirinto é nosso!"],
 bomb:["Pá! Foi mal, fantasminha!","Kabum! Todo mundo pra longe!"]
});
window.PAC_PERSONALITIES=Object.freeze({
 pac:{name:"JHOW",tone:"engraçado e confiante",expression:"😎"},
 red:{name:"FANTASMA VERMELHO",tone:"provocador",expression:"😈"},
 pink:{name:"FANTASMA ROSA",tone:"brincalhão",expression:"😜"},
 blue:{name:"FANTASMA AZUL",tone:"estrategista",expression:"🧠"},
 orange:{name:"FANTASMA LARANJA",tone:"atrapalhado",expression:"😵"}
});
window.PAC_SAY_EVENT=function(category,duration,personality="pac"){
 const lines=window.PAC_DIALOGUES[category];
 if(!lines?.length || typeof window.PAC_SAY!=="function")return;
 const key="pac-dialogue-"+category+"-"+personality;
 let cursor=0;try{cursor=Number(sessionStorage.getItem(key)||0);sessionStorage.setItem(key,String(cursor+1));}catch(_){}
 const text=lines[cursor%lines.length];
 const who=window.PAC_PERSONALITIES[personality]||window.PAC_PERSONALITIES.pac;
 window.PAC_SAY(who.expression+" "+who.name+": "+text,duration||3.3);
};
