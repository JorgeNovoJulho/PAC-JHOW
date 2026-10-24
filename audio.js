/* =========================================================================
 * Pac-Man (Móvel Studio) — Áudio (realista / ambiente, sem 8-bit)
 * -------------------------------------------------------------------------
 * Música sintetizada com sons mais "reais": pads suaves, plucks com brilho,
 * baixo quente, bateria subtil e efeitos de espaço (eco/reaverb).
 *   - 6 músicas: a faixa oficial Pac-Jhow (MP3) + 5 sintetizadas
 *   - troca manual (⏮/⏭, teclas 1-6), botão ouvir/parar
 *   - a música NÃO para quando o personagem morre
 * =========================================================================
 */
"use strict";

const AudioSys = (function () {
  let ctx = null;
  let master = null, musicBus = null, musicLP = null, sfxGain = null;
  let delayA = null, fbA = null, delayB = null, fbB = null;
  let enabled = true;
  let currentTrack = 0;
  let musicVol = 0.7;   // volume da música (0..1)
  let sfxVol = 0.95;    // volume dos efeitos sonoros (0..1)

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  /* ------------------------------------------------------------------ */
  const NOTE = {
    "C2": 65.41, "D2": 73.42, "E2": 82.41, "F2": 87.31, "G2": 98.00,
    "A2": 110.00, "B2": 123.47,
    "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.00,
    "A3": 220.00, "B3": 246.94,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
    "A4": 440.00, "B4": 493.88,
    "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99,
    "A5": 880.00, "B5": 987.77, "C6": 1046.50,
    "F#3": 185.00, "Bb2": 116.54, "Eb2": 77.78, "Ab2": 103.83,
    "Bb3": 233.08, "Eb3": 155.56, "Ab3": 207.65, "Db3": 138.59, "Gb3": 185.00,
    "Db4": 277.18, "Eb4": 311.13, "Ab4": 415.30
  };
  const FRQ = {};
  for (const k in NOTE) FRQ[k] = NOTE[k];
  function f(n) { return n ? (FRQ[n] || 440) : 0; }

  function fill(n, c) { const a = []; for (let i = 0; i < c; i++) a.push(n); return a; }
  // baixo de um compasso: raiz com oitava a cada 4º passo
  function bassBar(r, oct) {
    const a = [];
    for (let i = 0; i < 16; i++) a.push(i % 4 === 3 ? oct : r);
    return a;
  }

  /* ----------------------- As músicas do jogo --------------------------- */
  const DEFAULT_TRACK_FILE = "Pac-Jhow.mp3";
  const TRACKS = [
    {
      // Faixa 1: música enviada pelo autor, tocada no arranque do jogo.
      name: "Pac-Jhow", file: DEFAULT_TRACK_FILE, tempo: 120, drums: "none", padVol: 0,
      chords: [], lead: [], counter: [], bass: []
    },
    {
      name: "Neon Rush", tempo: 134, drums: "bright", padVol: 0.12,
      chords: [["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["F3", "A3", "C4"], ["C3", "E3", "G3"]],
      lead: [
        "A4", "F4", "D4", "F4", "A4", "C5", "D5", null, "E5", "D5", "C5", "A4", "F4", "D4", null, "F4",
        "A4", null, "F4", "D4", "F4", "A4", "Bb4", "C5", "D5", "C5", "Bb4", "A4", "F4", "D4", null, null,
        "C5", "A4", "F4", "A4", "C5", "F5", "E5", "D5", "C5", "A4", "F4", "A4", "C5", "F5", null, "E5",
        "G4", "E4", "C4", "E4", "G4", "B4", "C5", "D5", "E5", "C5", "G4", "E4", "C4", null, null, "D5"
      ],
      counter: [
        "D4", null, "A3", null, "D4", null, "F4", null, "A4", null, "F4", null, "D4", null, "A3", null,
        "Bb3", null, "F3", null, "Bb3", null, "D4", null, "F4", null, "C4", null, "A3", null, "F3", null,
        "A3", null, "F3", null, "A3", null, "C4", null, "F4", null, "A4", null, "F4", null, "C4", null,
        "C4", null, "G3", null, "C4", null, "E4", null, "G4", null, "E4", null, "C4", null, "G3", null
      ],
      bass: [].concat(bassBar("D2", "D3"), bassBar("Bb1", "Bb2"), bassBar("F2", "F3"), bassBar("C2", "C3"))
    },
    {
      name: "Cyber Drive", tempo: 140, drums: "pulse", padVol: 0.12,
      chords: [["A2", "C3", "E3"], ["F2", "A2", "C3"], ["C3", "E3", "G3"], ["G2", "B2", "D3"]],
      lead: [
        "A3", "C4", "E4", "A4", "E4", "C4", "A3", "C4", "B3", "C4", "E4", "G4", "E4", "C4", "B3", null,
        "F3", "A3", "C4", "F4", "C4", "A3", "F3", "A3", "G3", "A3", "C4", "E4", "C4", "A3", "G3", null,
        "E4", "G4", "A4", "C5", "A4", "G4", "E4", "G4", "F4", "E4", "C4", "A3", "C4", "E4", null, "G4",
        "D4", "B3", "G3", "B3", "D4", "F4", "G4", "B4", "A4", "G4", "D4", "B3", "G3", null, null, "B4"
      ],
      counter: [
        "A3", null, "C4", null, "A3", null, "C4", null, "G3", null, "B3", null, "G3", null, "B3", null,
        "F3", null, "A3", null, "F3", null, "A3", null, "E3", null, "G3", null, "E3", null, "G3", null,
        "C4", null, "E4", null, "C4", null, "E4", null, "A3", null, "C4", null, "A3", null, "C4", null,
        "G3", null, "B3", null, "G3", null, "B3", null, "D4", null, "B3", null, "G3", null, "B3", null
      ],
      bass: [].concat(bassBar("A1", "A2"), bassBar("F1", "F2"), bassBar("C2", "C3"), bassBar("G1", "G2"))
    },
    {
      name: "Solar Storm", tempo: 148, drums: "bright", padVol: 0.13,
      chords: [["C3", "E3", "G3"], ["G2", "B2", "D3"], ["A2", "C3", "E3"], ["F2", "A2", "C3"]],
      lead: [
        "E5", "C5", "G4", "E4", "G4", "C5", "E5", "G5", "F5", "E5", "D5", "C5", "G4", "E4", null, "G4",
        "D5", "B4", "G4", "D4", "G4", "B4", "D5", "F5", "E5", "D5", "C5", "B4", "G4", "D4", null, null,
        "C5", "A4", "E4", "C4", "E4", "A4", "C5", "E5", "D5", "C5", "A4", "G4", "E4", "C4", null, "A4",
        "F4", "A4", "C5", "F5", "E5", "D5", "C5", "A4", "G4", "B4", "D5", "G5", "G4", "B4", null, null
      ],
      counter: [
        "C4", null, "G3", null, "C4", null, "E4", null, "G4", null, "E4", null, "C4", null, "G3", null,
        "G3", null, "D3", null, "G3", null, "B3", null, "D4", null, "B3", null, "G3", null, "D3", null,
        "A3", null, "E3", null, "A3", null, "C4", null, "E4", null, "C4", null, "A3", null, "E3", null,
        "F3", null, "C3", null, "F3", null, "A3", null, "C4", null, "A3", null, "F3", null, "C3", null
      ],
      bass: [].concat(bassBar("C2", "C3"), bassBar("G1", "G2"), bassBar("A1", "A2"), bassBar("F1", "F2"))
    },
    {
      name: "Midnight Pulse", tempo: 124, drums: "pulse", padVol: 0.13,
      chords: [["E2", "G2", "B2"], ["C2", "E2", "G2"], ["A2", "C3", "E3"], ["B2", "D3", "F#3"]],
      lead: [
        "E4", "G4", "B4", "E5", "D5", "B4", "G4", "B4", "C5", "B4", "G4", "E4", "G4", "B4", null, "D5",
        "C5", "G4", "E4", "C4", "E4", "G4", "C5", "E5", "D5", "C5", "G4", "E4", "C4", null, null, null,
        "A4", "C5", "E5", "A5", "G5", "E5", "C5", "E5", "D5", "C5", "A4", "E4", "A4", "C5", null, "E5",
        "B4", "D5", "F#5", "B5", "A5", "F#5", "D5", "F#5", "E5", "D5", "B4", "F#4", "B4", "D5", null, null
      ],
      counter: [
        "B3", null, null, "G3", null, "B3", null, "E4", null, "G4", null, "E4", null, "B3", null, null,
        "C4", null, null, "G3", null, "C4", null, "E4", null, "G4", null, "E4", null, "C4", null, null,
        "A3", null, null, "E4", null, "A3", null, "C4", null, "E4", null, "C4", null, "A3", null, null,
        "B3", null, null, "D4", null, "B3", null, "F#4", null, "A4", null, "F#4", null, "B3", null, null
      ],
      bass: [].concat(fill("E1", 16), fill("C2", 16), fill("A1", 16), fill("B1", 16))
    },
    {
      name: "Urban Beat", tempo: 132, drums: "bright", padVol: 0.12,
      chords: [["F2", "Ab2", "C3"], ["Bb2", "D3", "F3"], ["Eb3", "G3", "Bb3"], ["C3", "E3", "G3"]],
      lead: [
        "F4", "Ab4", "C5", "Ab4", "F4", "Ab4", "C5", "Eb5", "D5", "C5", "Bb4", "Ab4", "F4", "G4", "Ab4", null,
        "Bb3", "D4", "F4", "D4", "Bb3", "D4", "F4", "Ab4", "G4", "F4", "Eb4", "D4", "Bb3", "C4", "D4", null,
        "Eb4", "G4", "Bb4", "G4", "Eb4", "G4", "Bb4", "D5", "C5", "Bb4", "Ab4", "G4", "Eb4", "F4", "G4", null,
        "C4", "E4", "G4", "E4", "C4", "E4", "G4", "B4", "C5", "B4", "A4", "G4", "E4", "D4", "C4", null
      ],
      counter: [
        "C4", null, "F3", null, "C4", null, "Ab3", null, "F4", null, "Ab3", null, "C4", null, "F3", null,
        "F3", null, "Bb2", null, "F3", null, "D3", null, "Bb3", null, "D3", null, "F3", null, "Bb2", null,
        "Bb3", null, "Eb3", null, "Bb3", null, "G3", null, "Eb4", null, "G3", null, "Bb3", null, "Eb3", null,
        "G3", null, "C3", null, "G3", null, "E3", null, "C4", null, "E3", null, "G3", null, "C3", null
      ],
      bass: [
        "F1", "F1", "F1", "C2", "F1", "F1", "F1", "C2", "F1", "F1", "Ab1", "C2", "F1", "F1", "Ab2", "F1",
        "Bb1", "Bb1", "Bb1", "F2", "Bb1", "Bb1", "Bb1", "F2", "Bb1", "Bb1", "D2", "F2", "Bb1", "Bb1", "Bb1", "Ab1",
        "Eb2", "Eb2", "Eb2", "Bb2", "Eb2", "Eb2", "Eb2", "Bb2", "Eb2", "Eb2", "G2", "Bb2", "Eb2", "Eb2", "Eb2", "D2",
        "C2", "C2", "C2", "G2", "C2", "C2", "C2", "G2", "C2", "C2", "E2", "G2", "C2", "C2", "C2", "G2"
      ]
    }
  ];

  /* --------------------------- Motor / espaço --------------------------- */
  let musicTimer = null, musicOn = false, nextStepTime = 0, stepIndex = 0;

  // Faixa 1 é um ficheiro MP3 real (pode ser substituído no build autónomo
  // por um data URI). As restantes continuam a ser sintetizadas.
  const assetAudio = new Audio();
  assetAudio.preload = "auto";
  assetAudio.loop = true;
  assetAudio.volume = musicVol;
  assetAudio.addEventListener("error", () => {
    // Se o MP3 não estiver disponível, usa a primeira faixa sintetizada.
    if (musicOn) { currentTrack = 1; stopMusic(); startCurrent(); }
  });

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();

      master = ctx.createGain(); master.gain.value = 1.0; master.connect(ctx.destination);

      musicBus = ctx.createGain(); musicBus.gain.value = 0.8 * musicVol;
      musicLP = ctx.createBiquadFilter(); musicLP.type = "lowpass"; musicLP.frequency.value = 3400; musicLP.Q.value = 0.5;
      musicBus.connect(musicLP); musicLP.connect(master);

      // eco + reverb suaves para dar espaço
      delayA = ctx.createDelay(1.0); delayA.delayTime.value = 0.22;
      delayB = ctx.createDelay(1.2); delayB.delayTime.value = 0.47;
      fbA = ctx.createGain(); fbA.gain.value = 0.30;
      fbB = ctx.createGain(); fbB.gain.value = 0.20;
      const rvbLP = ctx.createBiquadFilter(); rvbLP.type = "lowpass"; rvbLP.frequency.value = 1800;
      delayA.connect(fbA); fbA.connect(delayA);
      delayA.connect(delayB);
      delayB.connect(fbB); fbB.connect(delayB);
      delayB.connect(rvbLP); rvbLP.connect(musicLP);
      musicBus.connect(delayA);
      musicBus.connect(delayB);

      sfxGain = ctx.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(master);
      return true;
    } catch (e) { ctx = null; return false; }
  }
  function resume() {
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (musicOn) startCurrent();
  }
  function lock() {
    if (!ensure()) return;
    if (ctx.state === "suspended") ctx.resume();
    // O browser pode bloquear o MP3 no arranque; tenta de novo no 1.º gesto.
    if (musicOn && enabled && TRACKS[currentTrack].file && assetAudio.paused) startAsset();
  }

  /* --------------------------- Instrumentos ---------------------------- */
  function oscGain(type, freq, when, dur, vol, lpCut) {
    if (!ctx || !freq) return;
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.012);
    g.gain.setValueAtTime(vol, when + Math.max(0.02, dur * 0.45));
    g.gain.linearRampToValueAtTime(0.0001, when + dur + 0.05);
    if (lpCut) {
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = lpCut;
      o.connect(lp); lp.connect(g);
    } else o.connect(g);
    g.connect(musicBus);
    o.start(when); o.stop(when + dur + 0.2);
  }

  /* "lead": supersaw moderno (eletrónico, não piano) */
  function leadSynth(freq, when, dur, vol) {
    oscGain("sawtooth", freq, when, dur, vol + 0.04, freq * 4.2);
    oscGain("sawtooth", freq * 1.007, when, dur, vol, freq * 4.2);
    oscGain("sawtooth", freq * 0.993, when, dur, vol * 0.85, freq * 4.2);
    oscGain("square", freq * 1.5, when, dur * 0.5, vol * 0.3, freq * 7);
  }
  // "arp": arpejo eletrónico (2.ª voz)
  function arp(freq, when, dur, vol) {
    oscGain("sawtooth", freq, when, dur, vol, freq * 5);
    oscGain("square", freq * 2.0, when, dur * 0.55, vol * 0.45, freq * 7);
  }
  // "pad": acorde com saws dessintonizados (sintetizador, não órgão)
  function pad(freqs, when, dur, vol) {
    if (!ctx) return;
    for (const fq of freqs) {
      const base = f(fq);
      oscGain("sawtooth", base, when, dur, vol, base * 2.4);
      oscGain("sawtooth", base * 1.009, when, dur, vol, base * 2.4);
    }
  }
  // baixo synth (saw + sub)
  function bass(freq, when, dur, vol) {
    oscGain("sawtooth", freq, when, dur * 0.95, vol, freq * 3.2);
    oscGain("sine", freq * 0.5, when, dur, vol * 0.6, 320);
  }

  function noiseBurst(when, dur, vol, ftype, fq) {
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type = ftype || "bandpass"; flt.frequency.value = fq || 2000; flt.Q.value = 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(flt); flt.connect(g); g.connect(musicBus);
    src.start(when);
  }

  function kick(when) {
    oscGain("sine", 130, when, 0.16, 0.5);
    oscGain("sine", 60, when, 0.13, 0.4, 220);
  }
  function snare(when) { noiseBurst(when, 0.09, 0.10, "bandpass", 2000); }
  function hat(when) { noiseBurst(when, 0.03, 0.04, "highpass", 6500); }
  function hatLong(when) { noiseBurst(when, 0.12, 0.05, "highpass", 6000); }

  /* ------------------------------ Scheduler ----------------------------- */
  function stepDur() { return 60 / TRACKS[currentTrack].tempo / 2; }

  function schedulerTick() {
    if (!ctx || !musicOn || !enabled) return;
    const tr = TRACKS[currentTrack];
    const st = stepDur();
    if (nextStepTime < ctx.currentTime) nextStepTime = ctx.currentTime + 0.05;
    while (nextStepTime < ctx.currentTime + 0.15) {
      const i = stepIndex % 64;
      const when = nextStepTime;
      const bar = (i / 16) | 0;
      const s = i % 16;

      if (s === 0) pad(tr.chords[bar], when, st * 15.5, tr.padVol);
      const n = tr.lead[i];
      if (n) leadSynth(f(n), when, st * 2.2, 0.2);
      const cn = tr.counter[i];
      if (cn) arp(f(cn), when, st * 1.6, 0.11);
      const b = tr.bass[i];
      if (b) bass(f(b), when, st * 0.9, 0.22);

      if (tr.drums === "bright") {
        if (s === 0 || s === 4 || s === 8 || s === 12) kick(when);
        if (s === 4 || s === 12) snare(when);
        if (s === 2 || s === 6 || s === 10 || s === 14) hat(when);
        if (s === 8) hatLong(when);
      } else if (tr.drums === "pulse") {
        if (s === 0 || s === 8) kick(when);
        if (s === 4 || s === 12) snare(when);
        if (s % 2 === 1) hat(when);
        if (s === 0 && bar % 2 === 0) hatLong(when);
      } else {
        if (s === 0) kick(when);
        if (s === 4 || s === 12) hat(when);
      }
      nextStepTime += st;
      stepIndex++;
    }
  }

  function stopSynth() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function startAsset() {
    const tr = TRACKS[currentTrack];
    if (!enabled || !tr || !tr.file) return;
    musicOn = true;
    stopSynth();
    try {
      if (assetAudio.getAttribute("src") !== tr.file) assetAudio.src = tr.file;
      assetAudio.volume = musicVol;
      const p = assetAudio.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function stopMusic() {
    musicOn = false;
    stopSynth();
    try { assetAudio.pause(); } catch (e) {}
  }

  function startCurrent() {
    if (!enabled) return;
    const tr = TRACKS[currentTrack];
    if (!tr) return;
    if (tr.file) { startAsset(); return; }
    if (!ensure()) return;
    if (musicOn) return;                 // já toca — continua (não reinicia)
    musicOn = true;
    stopSynth();
    try { assetAudio.pause(); } catch (e) {}
    stepIndex = 0;
    nextStepTime = ctx.currentTime + 0.05;
    if (ctx.state === "suspended") ctx.resume();
    musicTimer = setInterval(schedulerTick, 40);
  }

  function playTrack(i) {
    const next = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    const changed = next !== currentTrack;
    currentTrack = next;
    if (!enabled) { stopMusic(); return; }
    if (changed) {
      stopMusic();                       // troca de faixa: começa do início
      try { assetAudio.currentTime = 0; } catch (e) {}
      startCurrent();
      return;
    }
    if (!musicOn) { startCurrent(); return; }
    const tr = TRACKS[currentTrack];
    if (tr.file && assetAudio.paused) startAsset();
  }
  function nextTrack() { playTrack(currentTrack + 1); }
  function prevTrack() { playTrack(currentTrack - 1); }
  function setEnabled(b) { enabled = !!b; if (enabled) startCurrent(); else stopMusic(); }
  function isEnabled() { return enabled; }
  function getTrackName() { return TRACKS[currentTrack].name; }
  function getTrackIndex() { return currentTrack; }
  function trackCount() { return TRACKS.length; }

  /* ------------------------- Volumes ----------------------------------- */
  function setMusicVolume(v) {
    musicVol = clamp01(v);
    if (musicBus) musicBus.gain.value = 0.8 * musicVol;
    try { assetAudio.volume = musicVol; } catch (e) {}
  }
  function getMusicVolume() { return musicVol; }
  function setSfxVolume(v) {
    sfxVol = clamp01(v);
    if (sfxGain) sfxGain.gain.value = sfxVol;
  }
  function getSfxVolume() { return sfxVol; }

  /* ------------------------------ Efeitos ------------------------------- */
  function tone(freq, dur, vol, type, slideTo, delay) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.setValueAtTime(vol, t0 + dur * 0.6);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(sfxGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  function noiseFx(dur, vol, delay, filterFreq, filterType) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = filterType || "bandpass";
    flt.frequency.value = filterFreq || 2000;
    flt.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(sfxGain);
    src.start(t0);
  }

  const sfx = {
    waka(wakaPhase) { tone(wakaPhase ? 400 : 310, 0.06, 0.30, "sine", wakaPhase ? 480 : 390); },
    powerUp() { tone(200, 0.14, 0.5, "sine", 380); tone(380, 0.14, 0.5, "sine", 720, 0.1); },
    eatGhost(idx) {
      const base = 200 * Math.pow(1.4, Math.min(idx, 4));
      [0, 1, 2, 3].forEach((k) => tone(base * (1 + k * 0.2), 0.1, 0.42, "sine", base * (1.5 + k * 0.2), k * 0.07));
    },
    eatFruit() {
      [523, 659, 880, 1174].forEach((fq, i) => tone(fq, 0.16, 0.44, "sine", 0, i * 0.09));
    },
    death() {
      for (let i = 0; i < 12; i++) tone(520 - i * 32, 0.14, 0.42, "sine", 160, i * 0.12);
      noiseFx(0.7, 0.22, 0, 900, "lowpass");
    },
    extraLife() {
      [523, 659, 784, 1046, 1318].forEach((fq, i) => tone(fq, 0.2, 0.44, "sine", 0, i * 0.11));
    },
    levelStart() {
      [392, 494, 587, 784].forEach((fq, i) => tone(fq, 0.2, 0.44, "sine", 0, i * 0.1));
    },
    gameOver() {
      [600, 540, 480, 420, 360, 300, 220].forEach((fq, i) => tone(fq, 0.3, 0.4, "sine", 0, i * 0.22));
    },
    win() {
      [523, 659, 784, 1046, 1318, 1568, 2093].forEach((fq, i) => tone(fq, 0.22, 0.46, "triangle", 0, i * 0.13));
      [262, 330, 392, 523].forEach((fq, i) => tone(fq, 0.5, 0.3, "sine", 0, 0.15 + i * 0.26));
      noiseFx(0.3, 0.18, 0, 5000, "highpass");
    },
    pause() { tone(500, 0.09, 0.26, "sine", 720); },
    resume() { tone(720, 0.09, 0.26, "sine", 500); },
    click() { tone(660, 0.05, 0.22, "sine", 980); },
    highscore() { [880, 1108, 1318, 1760, 2093].forEach((fq, i) => tone(fq, 0.16, 0.42, "sine", 0, i * 0.09)); },
    continue() { [523, 659, 784, 1046].forEach((fq, i) => tone(fq, 0.16, 0.44, "sine", 0, i * 0.1)); },
    shoot() { tone(700, 0.1, 0.42, "sine", 240); noiseFx(0.07, 0.2, 0, 3500, "highpass"); },
    hit() { tone(900, 0.1, 0.48, "sine", 300); noiseFx(0.12, 0.28, 0, 2600); },
    fruitTick() { tone(660, 0.06, 0.16, "sine", 780); },
    place() { tone(220, 0.12, 0.3, "sine", 120); noiseFx(0.08, 0.2, 0, 900, "lowpass"); },
    bomb() { tone(300, 0.35, 0.4, "sine", 40); noiseFx(0.5, 0.3, 0, 700, "lowpass"); noiseFx(0.14, 0.24, 0, 3400, "highpass"); },
    itemGold() { [880, 1108, 1318].forEach((fq, i) => tone(fq, 0.2, 0.4, "sine", 0, i * 0.08)); },
    itemRuby() { [660, 784, 988, 1318].forEach((fq, i) => tone(fq, 0.16, 0.42, "sine", 0, i * 0.06)); },
    itemShots() { [500, 640, 800, 1000, 1260].forEach((fq, i) => tone(fq, 0.1, 0.4, "sine", 0, i * 0.05)); },
    itemBombs() { [400, 300, 200].forEach((fq, i) => tone(fq, 0.16, 0.4, "sine", 0, i * 0.09)); },
    itemLife() { [523, 659, 784, 1046, 1318, 1568].forEach((fq, i) => tone(fq, 0.22, 0.42, "sine", 0, i * 0.1)); },
    sprint() { [500, 680, 880, 1150].forEach((fq, i) => tone(fq, 0.09, 0.3, "sawtooth", fq * 1.4, i * 0.05)); noiseFx(0.16, 0.2, 0, 3000, "bandpass"); },
    missile() { [880, 1108, 1318, 1760].forEach((fq, i) => tone(fq, 0.09, 0.3, "sawtooth", fq * 1.3, i * 0.045)); },
    missileBoom() { tone(200, 0.4, 0.45, "sawtooth", 40); noiseFx(0.5, 0.3, 0, 900, "lowpass"); noiseFx(0.14, 0.2, 0, 3600, "highpass"); },
    monster() { tone(95, 0.6, 0.4, "sawtooth", 45); tone(120, 0.6, 0.3, "sawtooth", 55, 0.05); },
    monsterKilled() { [500, 400, 300, 200, 120].forEach((fq, i) => tone(fq, 0.13, 0.4, "sawtooth", 0, i * 0.06)); noiseFx(0.3, 0.25, 0, 1500, "bandpass"); },
    monsterBite() { tone(300, 0.3, 0.42, "sawtooth", 60); noiseFx(0.3, 0.25, 0, 800, "lowpass"); },
    /* ---- Versões engraçadas (quando o personagem tem foto) ---- */
    fny_pic() { [400, 600, 800, 1000, 1250].forEach((fq, i) => tone(fq, 0.11, 0.32, "square", fq * 1.25, i * 0.09)); },
    fny_shoot() { tone(1200, 0.07, 0.28, "square", 900); tone(1700, 0.06, 0.22, "square", 1300, 0.04); },
    fny_place() { tone(220, 0.12, 0.3, "sawtooth", 90); noiseFx(0.08, 0.2, 0, 700, "lowpass"); },
    fny_death() { tone(520, 0.7, 0.36, "sawtooth", 90); tone(640, 0.7, 0.28, "sawtooth", 130, 0.06); noiseFx(0.6, 0.22, 0, 800, "lowpass"); },
    fny_eatGhost() { tone(300, 0.16, 0.34, "sine", 700); tone(700, 0.18, 0.3, "sine", 150, 0.12); },
    fny_monsterKilled() { tone(400, 0.1, 0.35, "sawtooth", 900); tone(800, 0.2, 0.3, "square", 250, 0.08); },
    fny_eatFruit() { tone(700, 0.1, 0.3, "sine", 1050); tone(1050, 0.16, 0.28, "sine", 1400, 0.08); },
    fny_itemGold() { [700, 900, 1200, 1600, 2100].forEach((fq, i) => tone(fq, 0.12, 0.3, "square", fq * 1.2, i * 0.07)); },
    fny_itemRuby() { [660, 880, 1174, 1568, 2093].forEach((fq, i) => tone(fq, 0.1, 0.3, "square", fq * 1.3, i * 0.06)); },
    fny_itemShots() { [800, 1000, 1250, 1500].forEach((fq, i) => tone(fq, 0.08, 0.3, "square", fq * 1.5, i * 0.05)); },
    fny_itemBombs() { [500, 400, 300, 200].forEach((fq, i) => tone(fq, 0.1, 0.3, "square", 0, i * 0.07)); },
    fny_itemLife() { [600, 750, 950, 1200, 1500].forEach((fq, i) => tone(fq, 0.14, 0.3, "sine", fq * 1.1, i * 0.08)); },
    fny_powerUp() { tone(400, 0.15, 0.34, "sine", 1000); tone(900, 0.15, 0.28, "sine", 1500, 0.1); },
    fny_sprint() { noiseFx(0.35, 0.24, 0, 3000, "highpass"); tone(500, 0.3, 0.24, "sawtooth", 1500); },
    fny_missile() { [600, 800, 1000, 1300, 1600, 2000].forEach((fq, i) => tone(fq, 0.06, 0.26, "square", 0, i * 0.04)); },
    fny_missileBoom() { tone(180, 0.4, 0.42, "sawtooth", 40); noiseFx(0.45, 0.3, 0, 900, "lowpass"); noiseFx(0.12, 0.22, 0, 4000, "highpass"); },
    fny_bomb() { tone(180, 0.4, 0.4, "sawtooth", 40); noiseFx(0.45, 0.28, 0, 900, "lowpass"); noiseFx(0.1, 0.2, 0, 4200, "highpass"); },
    fny_monsterBite() { tone(250, 0.35, 0.4, "sawtooth", 60); noiseFx(0.3, 0.26, 0, 700, "lowpass"); }
  };

  return {
    lock, resume, ensure, playTrack, nextTrack, prevTrack,
    setEnabled, isEnabled, getTrackName, getTrackIndex, trackCount, stopMusic,
    setMusicVolume, getMusicVolume, setSfxVolume, getSfxVolume, sfx
  };
})();
