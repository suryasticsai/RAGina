/**
 * RAGina Ultra v2.1 – The Ultimate Mentalist
 * All-in-one: RAG, chat, music, voice, selected-text, drag, minimise,
 * persistence, folder upload, export/import, sassy personality.
 *
 * CDN: https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-ultra.js
 */
(function(global) {
  'use strict';

  // ─── CONFIGURATION ──────────────────────────────────────────────────────────
  const DEFAULT_CONFIG = {
    indexUrl: null,
    indexData: null,
    position: 'bottom-right',
    placeholder: 'Ask me anything…',
    topK: 3,
    model: 'openai',
    personality: 'sassy',
    avatarUrl: 'https://ragina-crawler-ragina.vercel.app/ragina-logo.png',
    bubbleIcon: null,
    title: 'RAGina',
    theme: { primary: '#6C63FF' },
    chunkSize: 200,
    apiBaseUrl: 'https://sensycilva.suryasticsai.workers.dev',
    voiceId: 'rachel',
    voiceSpeed: 1.0
  };

  let CONFIG = { ...DEFAULT_CONFIG };
  if (global.RAGINA_CONFIG) {
    CONFIG = { ...CONFIG, ...global.RAGINA_CONFIG };
  }

  // ─── SASSY QUOTES ────────────────────────────────────────────────────────────
  const QUOTES = {
    ready: [
      "Alright darling, I've read every file in this place. Ask away.",
      "Mind palace is set. These documents have no secrets from me now.",
      "I've penetrated every folder. What do you want to know?"
    ],
    thinking: [
      "Scanning the memory palace… hold tight.",
      "I can see the answer forming in the chaos…",
      "Give me a second, I'm reading through walls here."
    ],
    found: [
      "Found it. It was hiding in plain sight.",
      "Knew exactly where that was. I'm a mentalist, remember?",
      "Piece of cake. Your files can't hide from me."
    ],
    confused: [
      "Even I can't find that in your mess. Organize better, human.",
      "Your files are silent on this one. And I hear everything.",
      "Nothing. Zip. Your documents don't know either."
    ],
    error: [
      "Something broke. Not my fault — I blame the network.",
      "The mind palace glitched. Give me a moment."
    ]
  };
  const randomQuote = arr => arr[Math.floor(Math.random() * arr.length)];

  // ─── TF‑IDF RETRIEVAL ENGINE ─────────────────────────────────────────────────
  class RAGEngine {
    constructor() {
      this.chunks = [];
      this.idf = {};
      this.isReady = false;
    }

    buildIndex(data, chunkSize = 200) {
      this.chunks = [];
      const flatData = this._convertToFlat(data);
      for (const [label, doc] of Object.entries(flatData)) {
        const bodyText = doc.bodyText || doc.body || doc.content || '';
        if (!bodyText || bodyText.length < 30) continue;
        const sentences = bodyText.split(/\n+|(?<=[.!?])\s+/);
        let current = '';
        for (const s of sentences) {
          if ((current + s).length > chunkSize && current.length > 0) {
            this.chunks.push({ text: current.trim(), source: label });
            current = '';
          }
          current += s + ' ';
        }
        if (current.trim()) this.chunks.push({ text: current.trim(), source: label });
      }
      this.idf = {};
      const total = this.chunks.length || 1;
      for (const ch of this.chunks) {
        const words = new Set(ch.text.toLowerCase().match(/\b\w+\b/g) || []);
        for (const w of words) this.idf[w] = (this.idf[w] || 0) + 1;
      }
      for (const w in this.idf) {
        this.idf[w] = Math.log(total / (1 + this.idf[w]));
      }
      this.isReady = true;
    }

    _convertToFlat(data) {
      if (data && Array.isArray(data.pages)) {
        const flat = {};
        for (const page of data.pages) {
          const url = page.url || 'unknown';
          const chunks = page.chunks || [];
          if (chunks.length === 0) {
            if (page.content) flat[url] = { bodyText: page.content };
            continue;
          }
          const combined = chunks.map(c => c.text || c.content || '').join('\n');
          flat[url] = { bodyText: combined };
        }
        return flat;
      }
      return data;
    }

    retrieve(query, topK = 3) {
      if (!this.isReady || this.chunks.length === 0) return [];
      const qWords = query.toLowerCase().match(/\b\w+\b/g) || [];
      const qTF = {};
      for (const w of qWords) qTF[w] = (qTF[w] || 0) + 1;

      const scores = this.chunks.map((ch, idx) => {
        const cWords = ch.text.toLowerCase().match(/\b\w+\b/g) || [];
        const cTF = {};
        for (const w of cWords) cTF[w] = (cTF[w] || 0) + 1;
        let score = 0;
        for (const w of Object.keys(qTF)) {
          if (cTF[w] && this.idf[w]) score += qTF[w] * cTF[w] * this.idf[w];
        }
        return { idx, score };
      });
      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, topK).map(s => this.chunks[s.idx]);
    }
  }

  // ─── AI PROXY ─────────────────────────────────────────────────────────────────
  async function askLLM(prompt) {
    const url = CONFIG.apiBaseUrl + '/api/ask';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error(`LLM error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  }

  // ─── SVG ICONS ──────────────────────────────────────────────────────────────
  const ICONS = {
    mic: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 3.91c-2.84-.48-5-2.94-5-5.91h-2c0 3.83 2.82 6.93 6.5 7.48V21h3v-3.52c3.68-.55 6.5-3.65 6.5-7.48h-2c0 2.97-2.16 5.43-5 5.91z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
    play: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    stop: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    minimize: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 13H5v-2h14v2z"/></svg>`
  };

  // ─── STYLES ──────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ragina-ultra-styles')) return;
    const primary = CONFIG.theme.primary || '#6C63FF';
    const rgb = hexToRgb(primary);
    const css = `
      @keyframes ragina-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes ragina-pulse{0%,100%{box-shadow:0 0 0 0 rgba(${rgb},0.5)}50%{box-shadow:0 0 0 18px rgba(${rgb},0)}}
      @keyframes ragina-typing{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-8px);opacity:1}}
      @keyframes pulse-mic{0%,100%{box-shadow:0 0 0 0 rgba(0,214,143,0.4)}50%{box-shadow:0 0 0 14px rgba(0,214,143,0)}}
      .ragina-bubble{position:fixed;${CONFIG.position==='bottom-left'?'left:24px;':'right:24px;'}bottom:24px;width:60px;height:60px;border-radius:50%;background:transparent;border:2px solid ${primary};cursor:grab;z-index:99999;font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform 0.3s,box-shadow 0.3s;animation:ragina-float 4s ease-in-out infinite,ragina-pulse 2s infinite;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
      .ragina-bubble:hover{transform:scale(1.15) rotate(360deg);animation:none;border-color:${primary};box-shadow:0 0 25px rgba(${rgb},0.6)}
      .ragina-bubble:active{cursor:grabbing}
      .ragina-bubble img{width:44px;height:44px;border-radius:50%}
      .ragina-panel{position:fixed;${CONFIG.position==='bottom-left'?'left:24px;':'right:24px;'}bottom:100px;width:380px;max-width:92vw;height:520px;max-height:70vh;background:#0f0f1a;border-radius:20px;z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(${rgb},0.4);box-shadow:0 0 40px rgba(${rgb},0.2),0 20px 60px rgba(0,0,0,0.6);transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);font-family:system-ui,sans-serif}
      .ragina-panel.hidden{opacity:0;pointer-events:none;transform:translateY(30px) scale(0.95)}
      .ragina-header{background:linear-gradient(135deg,${primary},#8b7cff);padding:14px 18px;display:flex;align-items:center;gap:12px}
      .ragina-avatar{width:40px;height:40px;border-radius:50%;border:2px solid white;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px}
      .ragina-header-info{flex:1;color:white}
      .ragina-header-name{font-weight:700;font-size:1.1rem}
      .ragina-header-status{font-size:0.7rem;opacity:0.8}
      .ragina-close{background:rgba(255,255,255,0.2);border:none;color:white;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
      .ragina-close:hover{background:rgba(255,255,255,0.4)}
      .ragina-messages{flex:1;padding:16px;overflow-y:auto;background:linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 100%)}
      .ragina-messages::-webkit-scrollbar{width:4px}
      .ragina-messages::-webkit-scrollbar-thumb{background:rgba(${rgb},0.4);border-radius:4px}
      .ragina-msg{margin-bottom:14px;display:flex;flex-direction:column}
      .ragina-msg.user{align-items:flex-end}
      .ragina-msg.user .ragina-bubble-text{background:${primary};color:white;border-radius:18px 18px 4px 18px}
      .ragina-msg.ai .ragina-bubble-text{background:rgba(${rgb},0.1);color:#ddd;border:1px solid rgba(${rgb},0.3);border-radius:18px 18px 18px 4px}
      .ragina-msg.system .ragina-bubble-text{background:rgba(255,255,255,0.05);color:#888;font-size:0.8rem;font-style:italic;border:1px dashed rgba(255,255,255,0.1);border-radius:12px}
      .ragina-bubble-text{max-width:82%;padding:10px 16px;font-size:0.9rem;line-height:1.5;word-break:break-word}
      .ragina-sources{font-size:0.65rem;color:rgba(${rgb},0.7);margin-top:4px;padding-left:8px;font-style:italic}
      .ragina-input-area{display:flex;padding:10px;border-top:1px solid rgba(${rgb},0.2);background:#0f0f1a;gap:8px;flex-wrap:wrap}
      .ragina-input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(${rgb},0.3);border-radius:24px;padding:10px 16px;color:white;font-size:0.9rem;outline:none}
      .ragina-input::placeholder{color:rgba(255,255,255,0.3)}
      .ragina-input:disabled{opacity:0.4;cursor:not-allowed}
      .ragina-send{background:${primary};border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;color:white;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
      .ragina-send:hover{box-shadow:0 0 15px rgba(${rgb},0.6)}
      .ragina-send:disabled{opacity:0.4;cursor:not-allowed}
      .ragina-send svg{width:20px;height:20px;fill:currentColor}
      .ragina-typing{display:flex;gap:4px;padding:10px 16px}
      .ragina-typing span{width:8px;height:8px;border-radius:50%;background:rgba(${rgb},0.6);animation:ragina-typing 1.4s infinite}
      .ragina-typing span:nth-child(2){animation-delay:0.2s}
      .ragina-typing span:nth-child(3){animation-delay:0.4s}
      .ragina-toolbar{display:flex;gap:6px;padding:6px 14px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(${rgb},0.15);flex-wrap:wrap;align-items:center}
      .ragina-toolbar button{background:rgba(${rgb},0.2);border:none;color:#ccc;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;transition:0.2s;display:flex;align-items:center;gap:4px}
      .ragina-toolbar button:hover{background:rgba(${rgb},0.4);color:#fff}
      .ragina-toolbar button svg{width:14px;height:14px;fill:currentColor}
      .ragina-toolbar .status{flex:1;text-align:right;font-size:10px;color:#666}
      .ragina-mic{background:transparent;border:2px solid rgba(${rgb},0.4);border-radius:50%;width:38px;height:38px;color:${primary};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:0.2s}
      .ragina-mic:hover{background:rgba(${rgb},0.1)}
      .ragina-mic.listening{background:#00d68f;border-color:#00d68f;color:#fff;animation:pulse-mic 1s infinite}
      .ragina-mic svg{width:20px;height:20px;fill:currentColor}
      .ragina-music{background:rgba(${rgb},0.15);border:1px solid rgba(${rgb},0.35);border-radius:12px;padding:6px 10px;margin:0 14px 8px;display:none;flex-direction:column;gap:4px}
      .ragina-music-row{display:flex;align-items:center;gap:6px}
      .ragina-music-label{flex:1;font-size:11px;color:#ccc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ragina-music-btn{background:rgba(255,255,255,0.1);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:0.2s}
      .ragina-music-btn:hover{background:rgba(255,255,255,0.25)}
      .ragina-music-btn svg{width:16px;height:16px;fill:currentColor}
      .ragina-progress-row{display:flex;align-items:center;gap:6px}
      .ragina-progress-bar{flex:1;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;cursor:pointer}
      .ragina-progress-fill{height:100%;width:0%;background:${primary};border-radius:2px;transition:width 0.1s linear}
      .ragina-time-label{font-size:9px;color:#888;min-width:28px;text-align:center}
      #ragina-fileInput{display:none}
      @media(max-width:480px){.ragina-panel{right:8px;left:8px;bottom:80px;width:auto;height:60vh}}
    `;
    const style = document.createElement('style');
    style.id = 'ragina-ultra-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1],16)}, ${parseInt(result[2],16)}, ${parseInt(result[3],16)}` : '108,99,255';
  }

  // ─── UI CLASS ──────────────────────────────────────────────────────────────────
  class RAGinaUltraUI {
    constructor(engine) {
      this.engine = engine;
      this.bubble = null;
      this.panel = null;
      this.messages = null;
      this.input = null;
      this.sendBtn = null;
      this.micBtn = null;
      this.statusEl = null;
      this.musicContainer = null;
      this.songLabel = null;
      this.playPauseBtn = null;
      this.stopBtn = null;
      this.progressFill = null;
      this.timeCurrent = null;
      this.timeDuration = null;
      this.progressBar = null;
      this.fileInput = null;
      this.isReady = false;
      this.isListening = false;
      this.recognition = null;
      this.currentAudio = null;
      this.isMinimized = true;
      this.musicPlaying = false;
      this.currentVideoId = null;
      this.musicInterval = null;
      this.musicDuration = 0;
      this.musicCurrentTime = 0;
      this.youtubePlayer = null;
      this.playerReady = false;
      this.playerReadyResolve = null;
      this.playerReadyPromise = new Promise(r => this.playerReadyResolve = r);
      this.messageHistory = [];
      this.userName = null;
      this.awaitingName = false;
      this.introDone = false;
      this.history = [];
      this.wasPlayingBeforeMic = false;
    }

    // ─── OPENDB (FIXED) ─────────────────────────────────────────────────────
    async openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('RAGinaChatDB', 2);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('chat')) {
            db.createObjectStore('chat', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    // ─── INJECT HTML ────────────────────────────────────────────────────────
    injectHTML() {
      const primary = CONFIG.theme.primary || '#6C63FF';
      const bubbleContent = CONFIG.avatarUrl
        ? `<img src="${CONFIG.avatarUrl}" alt="RAGina" style="width:44px;height:44px;border-radius:50%;" onerror="this.parentElement.innerHTML='🔮'">`
        : (CONFIG.bubbleIcon || '🔮');

      this.bubble = document.createElement('button');
      this.bubble.className = 'ragina-bubble';
      this.bubble.title = CONFIG.title || 'RAGina – Your Mentalist RAG';
      this.bubble.innerHTML = bubbleContent;
      document.body.appendChild(this.bubble);

      // ─── DRAG ON BUBBLE (FIXED: drag even when minimized) ──────────────
      this._makeDraggable(this.bubble);

      this.panel = document.createElement('div');
      this.panel.className = 'ragina-panel hidden';
      this.panel.innerHTML = `
        <div class="ragina-header">
          ${CONFIG.avatarUrl ? `<img class="ragina-avatar" src="${CONFIG.avatarUrl}" alt="RAGina" style="object-fit:cover;" onerror="this.outerHTML='<div class=\\'ragina-avatar\\'>🔮</div>'">` : '<div class="ragina-avatar">🔮</div>'}
          <div class="ragina-header-info">
            <div class="ragina-header-name">${CONFIG.title || 'RAGina'}</div>
            <div class="ragina-header-status" id="raginaStatus">🧠 Mentalist Online</div>
          </div>
          <button class="ragina-close" id="raginaClose">${ICONS.close}</button>
        </div>
        <div class="ragina-toolbar">
          <button id="raginaSaveChat">💾 Save</button>
          <button id="raginaLoadChat">📂 Load</button>
          <button id="raginaClearChat">🗑️ Clear</button>
          <button id="raginaUploadFolder">📁 Upload</button>
          <span class="status" id="raginaChatStatus">Auto‑saved</span>
        </div>
        <input type="file" id="raginaFileInput" webkitdirectory directory multiple accept=".html,.htm" />
        <div class="ragina-messages" id="raginaMessages"></div>
        <div class="ragina-music" id="raginaMusic">
          <div class="ragina-music-row">
            <span class="ragina-music-label" id="raginaSongLabel">🎵</span>
            <button class="ragina-music-btn" id="raginaPlayPause">${ICONS.play}</button>
            <button class="ragina-music-btn" id="raginaStop">${ICONS.stop}</button>
          </div>
          <div class="ragina-progress-row">
            <span class="ragina-time-label" id="raginaTimeCurrent">0:00</span>
            <div class="ragina-progress-bar" id="raginaProgressBar"><div class="ragina-progress-fill" id="raginaProgressFill"></div></div>
            <span class="ragina-time-label" id="raginaTimeDuration">0:00</span>
          </div>
        </div>
        <div class="ragina-input-area">
          <button class="ragina-mic" id="raginaMic" title="Click to speak">${ICONS.mic}</button>
          <input type="text" class="ragina-input" id="raginaInput" placeholder="${CONFIG.placeholder || 'Ask me anything…'}" autocomplete="off">
          <button class="ragina-send" id="raginaSend">${ICONS.send}</button>
        </div>
      `;
      document.body.appendChild(this.panel);

      // DOM refs
      this.messages = document.getElementById('raginaMessages');
      this.input = document.getElementById('raginaInput');
      this.sendBtn = document.getElementById('raginaSend');
      this.micBtn = document.getElementById('raginaMic');
      this.statusEl = document.getElementById('raginaStatus');
      this.musicContainer = document.getElementById('raginaMusic');
      this.songLabel = document.getElementById('raginaSongLabel');
      this.playPauseBtn = document.getElementById('raginaPlayPause');
      this.stopBtn = document.getElementById('raginaStop');
      this.progressFill = document.getElementById('raginaProgressFill');
      this.timeCurrent = document.getElementById('raginaTimeCurrent');
      this.timeDuration = document.getElementById('raginaTimeDuration');
      this.progressBar = document.getElementById('raginaProgressBar');
      this.fileInput = document.getElementById('raginaFileInput');
      this.chatStatus = document.getElementById('raginaChatStatus');

      // ─── DRAG ON PANEL HEADER ────────────────────────────────────────────
      const header = this.panel.querySelector('.ragina-header');
      this._makeDraggable(this.panel, header);

      // Events
      this.bubble.addEventListener('click', () => this.toggle());
      document.getElementById('raginaClose').addEventListener('click', () => this.minimize());
      this.sendBtn.addEventListener('click', () => this.handleSend());
      this.input.addEventListener('keypress', e => { if (e.key === 'Enter') this.handleSend(); });
      this.micBtn.addEventListener('click', () => this.toggleMic());
      this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
      this.stopBtn.addEventListener('click', () => this.stopMusic());
      this.progressBar.addEventListener('click', e => this.seekMusic(e));

      document.getElementById('raginaSaveChat').addEventListener('click', () => this.exportChat());
      document.getElementById('raginaLoadChat').addEventListener('click', () => this.importChat());
      document.getElementById('raginaClearChat').addEventListener('click', () => this.clearChat());
      document.getElementById('raginaUploadFolder').addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', e => this.handleFolderUpload(e));
    }

    // ─── DRAGGABLE HELPER ──────────────────────────────────────────────────
    _makeDraggable(element, handle = element) {
      let dragActive = false, startX, startY, startLeft, startTop;
      const onStart = (e) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        const rect = element.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        startX = clientX; startY = clientY;
        dragActive = true;
        element.style.transition = 'none';
        element.style.position = 'fixed';
        element.style.left = startLeft + 'px';
        element.style.top = startTop + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        e.preventDefault();
      };
      const onMove = (e) => {
        if (!dragActive) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const dx = clientX - startX;
        const dy = clientY - startY;
        element.style.left = (startLeft + dx) + 'px';
        element.style.top = (startTop + dy) + 'px';
        element.style.right = 'auto';
        element.style.bottom = 'auto';
      };
      const onEnd = () => { dragActive = false; };
      handle.addEventListener('mousedown', onStart);
      handle.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);
    }

    // ─── TOGGLE / MINIMIZE ─────────────────────────────────────────────────
    toggle() {
      this.panel.classList.toggle('hidden');
      if (!this.panel.classList.contains('hidden')) {
        this.input.focus();
        this.isMinimized = false;
        if (!this.introDone && !this.userName) this.introduce();
      } else {
        this.isMinimized = true;
      }
    }

    minimize() {
      this.panel.classList.add('hidden');
      this.isMinimized = true;
    }

    setReady(ready) {
      this.isReady = ready;
      this.input.disabled = false; // always enabled
      this.sendBtn.disabled = false;
      if (ready) {
        this.statusEl.textContent = '🧠 Mentalist Online';
      } else {
        this.statusEl.textContent = '📁 Upload a folder to give me knowledge';
      }
    }

    // ─── MESSAGES ───────────────────────────────────────────────────────────
    addMessage(text, sender, sources = []) {
      const div = document.createElement('div');
      div.className = `ragina-msg ${sender}`;
      const bubble = document.createElement('div');
      bubble.className = 'ragina-bubble-text';
      bubble.textContent = text;
      div.appendChild(bubble);
      if (sources.length > 0) {
        const src = document.createElement('div');
        src.className = 'ragina-sources';
        src.textContent = '📌 ' + sources.map(s => (s.source || '').split('/').pop() + '…').join(' · ');
        div.appendChild(src);
      }
      this.messages.appendChild(div);
      this.messages.scrollTop = this.messages.scrollHeight;
      this.messageHistory.push({ role: sender, text, sources });
      this.saveChatHistory();
      return div;
    }

    showTyping() {
      const div = document.createElement('div');
      div.className = 'ragina-msg ai';
      div.innerHTML = '<div class="ragina-typing"><span></span><span></span><span></span></div>';
      this.messages.appendChild(div);
      this.messages.scrollTop = this.messages.scrollHeight;
      return div;
    }

    // ─── SEND MESSAGE ──────────────────────────────────────────────────────
    async handleSend(question) {
      const q = question || this.input.value.trim();
      if (!q) return;
      this.input.value = '';
      this.sendBtn.disabled = true;

      if (this.awaitingName) {
        this.awaitingName = false;
        this.userName = q.split(' ')[0];
        this.addMessage(q, 'user');
        const greet = `Nice to meet you, ${this.userName}! What can I help you with?`;
        this.addMessage(greet, 'ai');
        await this.speakText(greet);
        this.sendBtn.disabled = false;
        this.input.focus();
        return;
      }

      const selected = this.getSelectedText();
      if (selected) {
        this.addMessage(`📝 Selected: "${selected}"`, 'system');
      }

      if (this.handleMusicCommand(q)) {
        this.addMessage(q, 'user');
        this.sendBtn.disabled = false;
        return;
      }

      this.addMessage(q, 'user');
      const typing = this.showTyping();

      const topChunks = this.engine.isReady ? this.engine.retrieve(q, CONFIG.topK || 3) : [];
      const context = topChunks.length > 0
        ? topChunks.map((c, i) => `[${i+1}] ${c.source}\n${c.text}`).join('\n\n')
        : 'No relevant documents found.';

      const personality = CONFIG.personality || 'sassy';
      const prompt = personality === 'professional'
        ? `Answer the question using ONLY the context below. If the answer cannot be found, say "I don't have enough information to answer that."\n\nContext:\n${context}\n\nQuestion: ${q}\nAnswer:`
        : `You are RAGina, a sassy mentalist who can read any document. Answer using ONLY the context below. If the answer isn't there, respond with attitude that the info isn't in the files.\n\nContext:\n${context}\n\nQuestion: ${q}\nAnswer (as RAGina, with sass):`;

      try {
        const answer = await askLLM(prompt);
        typing.remove();
        this.addMessage(answer, 'ai', topChunks);
        this.history.push({ role: 'user', text: q }, { role: 'bot', text: answer });
        if (CONFIG.voiceEnabled !== false) await this.speakText(answer);
      } catch (err) {
        typing.remove();
        this.addMessage(randomQuote(QUOTES.error) + ' ' + err.message, 'ai');
      }
      this.sendBtn.disabled = false;
      this.input.focus();
    }

    // ─── SELECTED TEXT ────────────────────────────────────────────────────
    getSelectedText() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return '';
      const text = sel.toString().trim();
      console.log('📌 Selected text:', text);
      return text;
    }

    // ─── VOICE ────────────────────────────────────────────────────────────
    toggleMic() {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        alert('Speech recognition not supported in this browser.');
        return;
      }
      if (this.isListening) {
        if (this.recognition) this.recognition.stop();
        return;
      }
      if (this.musicPlaying) {
        this.wasPlayingBeforeMic = true;
        this.pauseMusic();
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
      this.recognition.continuous = false;
      let final = '';

      this.recognition.addEventListener('result', (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        this.input.value = final + interim;
      });

      this.recognition.addEventListener('end', () => {
        this.isListening = false;
        this.micBtn.classList.remove('listening');
        if (final.trim()) {
          this.input.value = final.trim();
          this.handleSend(final.trim());
        }
        if (this.wasPlayingBeforeMic && this.currentVideoId) {
          this.wasPlayingBeforeMic = false;
          this.resumeMusic();
        }
      });

      this.recognition.start();
      this.isListening = true;
      this.micBtn.classList.add('listening');
    }

    async speakText(text) {
      if (CONFIG.voiceEnabled === false) return;
      try {
        const url = CONFIG.apiBaseUrl + '/api/tts';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language: 'en-US', voice_id: CONFIG.voiceId || 'rachel', speed: CONFIG.voiceSpeed || 1.0 })
        });
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.play();
        return new Promise(resolve => {
          this.currentAudio.onended = resolve;
        });
      } catch (e) {
        console.warn('TTS failed:', e);
      }
    }

    // ─── MUSIC ────────────────────────────────────────────────────────────
    handleMusicCommand(text) {
      const lower = text.toLowerCase().trim();
      if (/\b(?:pause|hold)\s+(?:the\s+)?(?:song|music)\b/i.test(lower) || lower === 'pause') {
        if (this.musicPlaying) { this.pauseMusic(); this.addMessage('⏸️ Paused.', 'system'); } else this.addMessage('No song playing.', 'system');
        return true;
      }
      if (/\b(?:resume|continue)\s+(?:the\s+)?(?:song|music)\b/i.test(lower) || lower === 'resume') {
        if (this.currentVideoId && !this.musicPlaying) { this.resumeMusic(); this.addMessage('▶️ Resumed.', 'system'); } else this.addMessage('No paused song.', 'system');
        return true;
      }
      if (/\b(?:stop|end)\s+(?:the\s+)?(?:song|music)\b/i.test(lower) || lower === 'stop') {
        this.stopMusic();
        this.addMessage('⏹️ Stopped.', 'system');
        return true;
      }
      const playMatch = lower.match(/^(?:play|play me|can you play|put on)\s+(.+)/i) || lower.match(/^(.+)\s+(?:song|music|track)$/i);
      if (playMatch) {
        const query = playMatch[1].trim();
        if (query && query.length > 2) {
          this.searchAndPlay(query);
          return true;
        }
      }
      return false;
    }

    async searchAndPlay(query) {
      try {
        const url = CONFIG.apiBaseUrl + '/api/youtube/search?q=' + encodeURIComponent(query);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        if (!data.success || !data.items || data.items.length === 0) {
          this.addMessage(`Couldn't find "${query}".`, 'system');
          return;
        }
        const song = data.items[0];
        await this.loadVideo(song.id, song.title);
        this.addMessage(`🎵 Playing: ${song.title}`, 'system');
      } catch (e) {
        this.addMessage(`Couldn't play "${query}".`, 'system');
      }
    }

    async loadVideo(videoId, title) {
      if (!this.youtubePlayer) {
        await this.playerReadyPromise;
      }
      if (!this.youtubePlayer) {
        console.error('YouTube player not available');
        return;
      }
      this.currentVideoId = videoId;
      this.songLabel.textContent = '🎵 ' + title;
      this.musicContainer.style.display = 'flex';
      try {
        this.youtubePlayer.loadVideoById(videoId);
        this.youtubePlayer.playVideo();
        this.musicPlaying = true;
        this.playPauseBtn.innerHTML = ICONS.pause;
        if (this.musicInterval) clearInterval(this.musicInterval);
        this.musicInterval = setInterval(() => this.updateProgress(), 500);
      } catch (e) {
        console.warn('loadVideo error:', e);
      }
    }

    pauseMusic() {
      if (this.youtubePlayer && this.playerReady) this.youtubePlayer.pauseVideo();
      this.musicPlaying = false;
      this.playPauseBtn.innerHTML = ICONS.play;
    }

    resumeMusic() {
      if (this.youtubePlayer && this.playerReady) this.youtubePlayer.playVideo();
      this.musicPlaying = true;
      this.playPauseBtn.innerHTML = ICONS.pause;
    }

    stopMusic() {
      if (this.youtubePlayer && this.playerReady) this.youtubePlayer.stopVideo();
      this.musicPlaying = false;
      this.currentVideoId = null;
      this.playPauseBtn.innerHTML = ICONS.play;
      this.musicContainer.style.display = 'none';
      if (this.musicInterval) clearInterval(this.musicInterval);
      this.musicDuration = 0;
      this.musicCurrentTime = 0;
      this.progressFill.style.width = '0%';
      this.timeCurrent.textContent = '0:00';
      this.timeDuration.textContent = '0:00';
    }

    togglePlayPause() {
      if (this.musicPlaying) this.pauseMusic();
      else if (this.currentVideoId) this.resumeMusic();
    }

    seekMusic(e) {
      if (!this.youtubePlayer || !this.playerReady || !this.currentVideoId) return;
      const rect = this.progressBar.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const duration = this.youtubePlayer.getDuration();
      if (duration && duration > 0) {
        this.youtubePlayer.seekTo(x * duration, true);
      }
    }

    updateProgress() {
      if (!this.youtubePlayer || !this.playerReady) return;
      try {
        const current = this.youtubePlayer.getCurrentTime();
        const duration = this.youtubePlayer.getDuration();
        if (duration && duration > 0) {
          this.musicDuration = duration;
          this.musicCurrentTime = current;
          const pct = (current / duration) * 100;
          this.progressFill.style.width = pct + '%';
          this.timeCurrent.textContent = this.formatTime(current);
          this.timeDuration.textContent = this.formatTime(duration);
        }
      } catch (e) {}
    }

    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ─── INTRO ────────────────────────────────────────────────────────────
    async introduce() {
      if (this.introDone) return;
      this.introDone = true;
      const intro = "Hey there! I'm RAGina, your personal mentalist. I can chat, answer questions, and even play music. What's your name?";
      this.addMessage(intro, 'ai');
      this.awaitingName = true;
      await this.speakText(intro);
    }

    // ─── PERSISTENCE (IndexedDB) ─────────────────────────────────────────
    async saveChatHistory() {
      try {
        const db = await this.openDB();
        const tx = db.transaction('chat', 'readwrite');
        const store = tx.objectStore('chat');
        store.put({ id: 'history', data: this.messageHistory });
        await tx.done;
        this.chatStatus.textContent = 'Auto‑saved ✓';
        this.chatStatus.style.color = '#6C63FF';
      } catch (e) {
        console.warn('Save error:', e);
      }
    }

    async loadChatHistory() {
      try {
        const db = await this.openDB();
        const tx = db.transaction('chat', 'readonly');
        const store = tx.objectStore('chat');
        const request = store.get('history');
        return new Promise(resolve => {
          request.onsuccess = () => resolve(request.result ? request.result.data : null);
          request.onerror = () => resolve(null);
        });
      } catch (e) {
        return null;
      }
    }

    async clearChatHistory() {
      try {
        const db = await this.openDB();
        const tx = db.transaction('chat', 'readwrite');
        const store = tx.objectStore('chat');
        store.delete('history');
        await tx.done;
      } catch (e) {}
    }

    async restoreChat() {
      const saved = await this.loadChatHistory();
      if (saved && saved.length > 0) {
        this.messageHistory = saved;
        this.messages.innerHTML = '';
        saved.forEach(msg => {
          const div = document.createElement('div');
          div.className = 'ragina-msg ' + msg.role;
          const bubble = document.createElement('div');
          bubble.className = 'ragina-bubble-text';
          bubble.textContent = msg.text;
          div.appendChild(bubble);
          if (msg.sources && msg.sources.length) {
            const src = document.createElement('div');
            src.className = 'ragina-sources';
            src.textContent = '📌 ' + msg.sources.map(s => (s.source || '').split('/').pop() + '…').join(' · ');
            div.appendChild(src);
          }
          this.messages.appendChild(div);
        });
        this.messages.scrollTop = this.messages.scrollHeight;
        this.chatStatus.textContent = 'Loaded ' + saved.length + ' messages';
        this.chatStatus.style.color = '#6C63FF';
        return true;
      }
      return false;
    }

    exportChat() {
      const data = JSON.stringify(this.messageHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ragina-chat-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.chatStatus.textContent = 'Exported ✓';
      setTimeout(() => { this.chatStatus.textContent = 'Auto‑saved'; }, 3000);
    }

    importChat() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) {
              this.messageHistory = data;
              this.messages.innerHTML = '';
              data.forEach(msg => {
                const div = document.createElement('div');
                div.className = 'ragina-msg ' + msg.role;
                const bubble = document.createElement('div');
                bubble.className = 'ragina-bubble-text';
                bubble.textContent = msg.text;
                div.appendChild(bubble);
                if (msg.sources && msg.sources.length) {
                  const src = document.createElement('div');
                  src.className = 'ragina-sources';
                  src.textContent = '📌 ' + msg.sources.map(s => (s.source || '').split('/').pop() + '…').join(' · ');
                  div.appendChild(src);
                }
                this.messages.appendChild(div);
              });
              this.messages.scrollTop = this.messages.scrollHeight;
              this.saveChatHistory();
              this.chatStatus.textContent = 'Loaded ' + data.length + ' messages';
              this.chatStatus.style.color = '#6C63FF';
            }
          } catch (err) {
            alert('Invalid file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    }

    async clearChat() {
      if (!confirm('Clear all chat history?')) return;
      this.messageHistory = [];
      this.messages.innerHTML = '';
      await this.clearChatHistory();
      this.chatStatus.textContent = 'Cleared';
      this.chatStatus.style.color = '#FF6584';
      setTimeout(() => { this.chatStatus.textContent = 'Auto‑saved'; }, 3000);
      this.userName = null;
      this.awaitingName = false;
      this.introDone = false;
      if (!this.panel.classList.contains('hidden')) this.introduce();
    }

    // ─── FOLDER UPLOAD ────────────────────────────────────────────────────
    async handleFolderUpload(e) {
      const files = e.target.files;
      if (!files.length) return;
      const htmlFiles = [...files].filter(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
      if (!htmlFiles.length) {
        this.addMessage('No HTML files found in the folder.', 'system');
        return;
      }
      const data = {};
      for (const file of htmlFiles) {
        const text = await file.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        const bodyText = (doc.body?.textContent || '').trim();
        data[file.webkitRelativePath || file.name] = { bodyText };
      }
      this.engine.buildIndex(data, CONFIG.chunkSize || 200);
      this.setReady(true);
      this.messages.innerHTML = '';
      this.messageHistory = [];
      this.addMessage(randomQuote(QUOTES.ready), 'ai');
      this.saveChatHistory();
      this.chatStatus.textContent = 'Loaded ' + htmlFiles.length + ' files';
    }

    // ─── YOUTUBE PLAYER INIT ─────────────────────────────────────────────
    initYouTubePlayer() {
      if (window.YT && window.YT.Player) {
        this.youtubePlayer = new YT.Player(document.createElement('div'), {
          height: '0',
          width: '0',
          videoId: '',
          playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3 },
          events: {
            onReady: () => {
              this.playerReady = true;
              if (this.playerReadyResolve) this.playerReadyResolve();
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) {
                this.musicPlaying = true;
                this.playPauseBtn.innerHTML = ICONS.pause;
                if (this.musicInterval) clearInterval(this.musicInterval);
                this.musicInterval = setInterval(() => this.updateProgress(), 500);
              } else if (e.data === YT.PlayerState.PAUSED) {
                this.musicPlaying = false;
                this.playPauseBtn.innerHTML = ICONS.play;
              } else if (e.data === YT.PlayerState.ENDED) {
                this.stopMusic();
                this.addMessage('Song finished!', 'system');
              }
            },
            onError: () => { this.stopMusic(); this.addMessage('Error playing song.', 'system'); }
          }
        });
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        container.appendChild(this.youtubePlayer.getIframe());
      } else {
        setTimeout(() => this.initYouTubePlayer(), 500);
      }
    }
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────
  const RAGinaUltra = {
    engine: null,
    ui: null,

    init(config) {
      if (config) CONFIG = { ...CONFIG, ...config };
      injectStyles();
      this.engine = new RAGEngine();
      this.ui = new RAGinaUltraUI(this.engine);
      this.ui.injectHTML();

      if (!window.YT || !window.YT.Player) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
        window.onYouTubeIframeAPIReady = () => {
          this.ui.initYouTubePlayer();
        };
      } else {
        this.ui.initYouTubePlayer();
      }

      setTimeout(async () => {
        const has = await this.ui.restoreChat();
        if (!has) {
          if (this.engine.isReady) {
            this.ui.addMessage(randomQuote(QUOTES.ready), 'ai');
          } else {
            this.ui.addMessage("I'm ready! Upload some files or load an index to get started.", 'ai');
          }
        } else {
          if (this.engine.isReady) this.ui.setReady(true);
        }
        this.ui.setReady(this.engine.isReady);
        this.ui.minimize();
      }, 100);

      this._loadIndex();
    },

    _loadIndex() {
      if (window.__RAGINA_INDEX__ && Object.keys(window.__RAGINA_INDEX__).length > 0) {
        this.engine.buildIndex(window.__RAGINA_INDEX__, CONFIG.chunkSize || 200);
        this.ui.setReady(true);
        return;
      }
      if (CONFIG.indexUrl) {
        fetch(CONFIG.indexUrl)
          .then(res => res.json())
          .then(data => {
            this.engine.buildIndex(data, CONFIG.chunkSize || 200);
            this.ui.setReady(true);
            if (this.ui.messages.children.length === 0) {
              this.ui.addMessage(randomQuote(QUOTES.ready), 'ai');
            }
          })
          .catch(err => {
            console.warn('Index load failed:', err);
            this.ui.addMessage("Couldn't load index. I'm still here, but I have no knowledge.", 'ai');
          });
      }
    },

    loadData(data) {
      this.engine.buildIndex(data, CONFIG.chunkSize || 200);
      this.ui.setReady(true);
      this.ui.messages.innerHTML = '';
      this.ui.messageHistory = [];
      this.ui.addMessage(randomQuote(QUOTES.ready), 'ai');
    },

    async loadFolder(fileList) {
      await this.ui.handleFolderUpload({ target: { files: fileList } });
    },

    getEngine() { return this.engine; },

    ask(question) {
      if (this.ui) this.ui.handleSend(question);
    }
  };

  // ─── AUTO‑INIT ──────────────────────────────────────────────────────────
  const autoStart = () => {
    if (global.RAGINA_CONFIG) {
      RAGinaUltra.init(global.RAGINA_CONFIG);
    } else if (global.__RAGINA_INDEX__) {
      RAGinaUltra.init({ indexData: global.__RAGINA_INDEX__ });
    } else {
      RAGinaUltra.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStart);
  } else {
    autoStart();
  }

  global.RAGina = RAGinaUltra;

})(typeof window !== 'undefined' ? window : this);