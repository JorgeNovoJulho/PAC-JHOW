"use strict";
window.PAC_DIALOGUES = Object.freeze({
 intro:["Bora pro labirinto!","Hoje o recorde cai!","Fantasma que lute!"],
 levelStart:["Fase nova, confusão nova!","Agora o negócio ficou sério!","Segura essa!"],
 powerUp:["Agora ficou injusto!","É minha vez!","Corre, fantasminha!"],
 danger:["Opa, apertou!","Quase me pegaram!","Sai da frente!"],
 death:["Essa doeu...","Calma que eu volto!","Ainda não acabou!"],
 victory:["Mais uma no bolso!","Passei bonito!","Próxima fase!"],
 ranking:["Subindo no ranking!","Agora me respeita!","Quero o topo do mundo!"]
});
window.PAC_SAY_EVENT = function(category, duration) {
 const lines=window.PAC_DIALOGUES[category];
 if(!lines?.length || typeof window.PAC_SAY !== "function") return;
 const key="pac-dialogue-"+category;
 const cursor=Number(sessionStorage.getItem(key)||"0");
 sessionStorage.setItem(key,String(cursor+1));
 window.PAC_SAY(lines[cursor%lines.length],duration||2.8);
};
