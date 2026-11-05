"use strict";
/* Persistent local MP3 playlist: IndexedDB owns blobs, localStorage owns order.
 * The files never leave this device and are not uploaded to the leaderboard.
 */
window.PAC_MUSIC_LIBRARY = (() => {
  const KEY="pac-jhow-mp3-playlist-v1";
  const MAX_SIZE=40*1024*1024;
  let records=[], urls=new Map(), inFlight=null, ready=false;
  function status(message) {
    const el=document.getElementById("music-status");
    if(el)el.textContent=message;
  }
  function readManifest(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v.filter(x=>typeof x.id==="string"&&typeof x.name==="string").slice(0,200):[];}
    catch(_){return [];}
  }
  function storeManifest(items){
    localStorage.setItem(KEY,JSON.stringify(items));
  }
  function db(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error("IndexedDB indisponível"));return;}
      const req=indexedDB.open("pac-jhow-media",1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("files"))req.result.createObjectStore("files");};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("Erro ao abrir biblioteca"));
    });
  }
  async function transaction(type,mode,run){
    const database=await db();
    return new Promise((resolve,reject)=>{
      const tx=database.transaction("files",mode),store=tx.objectStore("files");
      let value;
      try{value=run(store);}catch(e){tx.abort();reject(e);return;}
      let result;
      if(value&&"onsuccess" in value)value.onsuccess=()=>{result=value.result;};
      tx.oncomplete=()=>{database.close();resolve(result);};
      tx.onerror=()=>{database.close();reject(tx.error||new Error("Falha ao gravar MP3"));};
      tx.onabort=()=>{database.close();reject(tx.error||new Error("Gravação cancelada"));};
    });
  }
  const get=key=>transaction("files","readonly",s=>s.get(key));
  const put=(key,file)=>transaction("files","readwrite",s=>s.put(file,key));
  const del=key=>transaction("files","readwrite",s=>s.delete(key));
  function render(){
    const list=document.getElementById("pac-library-list");
    if(!list)return;
    list.replaceChildren();
    if(!records.length){const p=document.createElement("p");p.className="hint";p.textContent="Nenhum MP3 salvo. Escolha um arquivo para adicioná-lo à sequência de músicas.";list.appendChild(p);return;}
    for(const entry of records){
      const row=document.createElement("div");row.className="pac-library-row";
      const name=document.createElement("span");name.textContent="🎵 "+entry.name;name.title=entry.name;
      const play=document.createElement("button");play.type="button";play.textContent="▶";play.title="Tocar "+entry.name;
      play.addEventListener("click",()=>{AudioSys.lock();AudioSys.selectLibraryTrack(entry.id);window.PAC_SYNC_MUSIC_UI?.();});
      const remove=document.createElement("button");remove.type="button";remove.textContent="✕";remove.title="Remover "+entry.name;
      remove.addEventListener("click",()=>removeTrack(entry.id).catch(e=>status(e.message)));
      row.append(name,play,remove);list.appendChild(row);
    }
  }
  function refresh(){
    AudioSys.setLibraryTracks(records.map(e=>({...e,url:urls.get(e.id)})).filter(e=>e.url));
    render();window.PAC_SYNC_MUSIC_UI?.();
  }
  async function load(){
    if(inFlight)return inFlight;
    inFlight=(async()=>{
      const saved=readManifest(),good=[];
      for(const entry of saved){
        try{
          const blob=await get("playlist:"+entry.id);
          if(blob instanceof Blob&&blob.size>0){urls.set(entry.id,URL.createObjectURL(blob));good.push(entry);}
        }catch(e){status("A biblioteca local não pôde ser lida.");}
      }
      records=good;
      // Migrate a single-file installation from earlier PAC-JHOW versions.
      try{
        const old=JSON.parse(localStorage.getItem("pac-jhow-custom-music")||"null");
        if(old?.kind==="file"){
          const blob=await get("music");
          if(blob instanceof Blob&&blob.size && !records.some(r=>r.name===old.name&&r.size===blob.size)){
            await add(blob,old.name||"Música antiga.mp3",{start:false});
          }
          if(blob instanceof Blob&&blob.size){
            localStorage.removeItem("pac-jhow-custom-music");
          }
        }
      }catch(_){}
      refresh();ready=true;
      if(records.length)status(records.length+" música(s) do dispositivo salvas na playlist.");
      return records.length;
    })();
    try{return await inFlight;}finally{inFlight=null;}
  }
  async function add(file,name=file.name,options={}){
    const fileName=String(name||"música.mp3");
    if(!(file instanceof Blob)||!file.size||file.size>MAX_SIZE||(!/\.mp3$/i.test(fileName)&&file.type!=="audio/mpeg")){
      throw new Error("Selecione um MP3 válido de até 40 MB.");
    }
    const id=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
    const entry={id,name:fileName.slice(0,100),size:file.size};
    await put("playlist:"+id,file);
    try{storeManifest([...records,entry]);}
    catch(e){await del("playlist:"+id).catch(()=>{});throw new Error("Não foi possível salvar a música: espaço insuficiente.");}
    records.push(entry);
    urls.set(id,URL.createObjectURL(file));
    refresh();
    status("✅ "+entry.name+" salva e adicionada à fila.");
    if(options.start!==false){
      AudioSys.lock();AudioSys.setEnabled(true);AudioSys.selectLibraryTrack(id);
      window.PAC_SYNC_MUSIC_UI?.();
    }
    return id;
  }
  async function removeTrack(id){
    const entry=records.find(x=>x.id===id);if(!entry)return;
    const revised=records.filter(x=>x.id!==id);
    storeManifest(revised);
    records=revised;refresh();
    await del("playlist:"+id);
    const url=urls.get(id);if(url)URL.revokeObjectURL(url);urls.delete(id);
    refresh();status("Música removida: "+entry.name);
  }
  function list(){return records.map(x=>({...x}));}
  window.addEventListener("load",()=>{setTimeout(()=>load().catch(e=>status("Falha ao abrir biblioteca: "+e.message)),0);});
  return {add,load,removeTrack,list,get ready(){return ready;}};
})();