/*!
 * RAGina-T4.js v4.0.0 — XENO Edition
 * Alien‑level OS integration + Local AI + Unlimited Vector Store
 * ✅ Hybrid RAG (TF‑IDF + Semantic)
 * ✅ 30+ Tools (OS, Vision, Local AI, Serial, Bluetooth, Screen Capture, …)
 * ✅ Face & Hand Gesture Recognition via MediaPipe
 * ✅ Hinglish / Tenglish / Slang Language Engine
 * ✅ Voice Input + TTS Output
 * ✅ Headless mode + Chat widget
 * ✅ Multi‑format document parser
 * ✅ Persistent sessions + long‑term memory (IndexedDB)
 * ✅ Native Bridge (Electron/Tauri) for full OS control
 * ✅ WebGPU‑accelerated local LLM (via Transformers.js)
 *
 * CDN: https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t4.js
 * MIT License | github.com/suryasticsai/RAGina
 */
!function (e) {
  'use strict';

  // ─── VERSION & CONSTANTS ──────────────────────────────────────────────
  const VERSION = '4.0.0';
  const hasDOM = typeof document !== 'undefined' && typeof window !== 'undefined';
  const safeOpen = (url, target = '_blank') => {
    if (hasDOM && typeof window !== 'undefined' && window.open) {
      window.open(url, target);
      return true;
    }
    return false;
  };

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const uuid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const avg = (...n) => n.reduce((s, v) => s + v, 0) / n.length;

  function deepMerge(target, source) {
    const out = { ...target };
    for (const k in source) {
      if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
        out[k] = deepMerge(out[k] || {}, source[k]);
      } else {
        out[k] = source[k];
      }
    }
    return out;
  }

  // ─── PHRASES ──────────────────────────────────────────────────────────
  const PHRASES = {
    ready: {
      english: ["XENO online. I can see your screen, touch your files, and talk to your devices.", "System bridge open. Full OS integration ready.", "RAGina T4 XENO — the universe is my sandbox."],
      hinglish: ["XENO online. Main teri screen dekh sakti hoon, files chhed sakti hoon, aur devices se baat kar sakti hoon.", "System bridge open. Full OS integration ready.", "RAGina T4 XENO — poori duniya mera sandbox hai."],
      tenglish: ["XENO online. Nenu nee screen chudagalanu, files touch cheyagalanu, devices tho matladagalanu.", "System bridge open. Full OS integration ready.", "RAGina T4 XENO — universe na sandbox."],
      chatty: ["XENO mode activated! I can hack your screen, files, and devices (with permission).", "System bridge open. Let's break the browser sandbox!", "RAGina T4 XENO — the universe is my playground."]
    },
    thinking: {
      english: ["Accessing OS bridge…", "Reading system state…", "Orbiting your files…"],
      hinglish: ["OS bridge access kar rahi hoon…", "System state padh rahi hoon…", "Teri files ko orbit kar rahi hoon…"],
      tenglish: ["OS bridge ni access chestunna…", "System state chaduvutunna…", "Nee files ni orbit chestunna…"],
      chatty: ["Bridging the OS…", "Scanning your system…", "Hacking the matrix…"]
    },
    error: {
      english: ["XENO core glitched —", "System bridge unstable —", "Cosmic rays hit the processor —"],
      hinglish: ["XENO core glitch ho gaya —", "System bridge unstable hai —", "Cosmic rays ne processor maara —"],
      tenglish: ["XENO core glitch aindi —", "System bridge unstable ga undi —", "Cosmic rays processor ni kottayi —"],
      chatty: ["XENO core crashed —", "System bridge on life support —", "Cosmic rays ate my CPU —"]
    },
    gesture: {
      thumbs_up: { english: ["Thumbs up! I love the energy.", "Noted! You're feeling positive.", "Got it — full approval detected!"], hinglish: ["Thumbs up! Mast energy hai.", "Samajh gaya! Positive vibe aa rahi hai.", "Full approval mil gaya!"], tenglish: ["Thumbs up! Energy super undi.", "Ardham aindi! Positive vibe ostundi.", "Full approval ichav!"], chatty: ["Yooo thumbs up! Let's gooo!", "I see that approval, fam!", "Big W energy detected!"] },
      thumbs_down: { english: ["I see a thumbs down. Let me fix that.", "Not what you wanted? I'll adjust.", "Message received — I'll do better."], hinglish: ["Thumbs down dikha. Theek karungi.", "Jo chahiye tha woh nahi tha? Adjust karti hoon.", "Message mil gaya — aur behtar karungi."], tenglish: ["Thumbs down kanipinchindi. Sarididdutha.", "Nuvu ankunte adi kadu? Adjust chestha.", "Message vachindi — inka better ga chestha."], chatty: ["Oof, thumbs down? My bad, let me fix it.", "Not vibing with that? I'll switch it up.", "Aight, noted — I'll level up!"] },
      wave: { english: ["Hey there! Nice to see you.", "Hello! I saw you wave.", "Welcome back!"], hinglish: ["Hey! Tujhe dekh ke achha laga.", "Hello! Maine tera wave dekha.", "Waapas swaagat hai!"], tenglish: ["Hey! Ninnu chusi bagundi.", "Hello! Nee wave chusa.", "Mallik swagatam!"], chatty: ["Yooo what's up!", "I see you waving, fam!", "Welcome back to the squad!"] },
      peace: { english: ["Peace! Stay cool.", "Victory sign detected! We got this.", "Chill vibes acknowledged."], hinglish: ["Peace! Chill reh.", "Victory sign! Hum kar lenge.", "Chill vibes accepted."], tenglish: ["Peace! Cool ga undu.", "Victory sign! Manam cheseddam.", "Chill vibes accept chesanu."], chatty: ["Peace out! Stay chill.", "Victory sign? We winning today!", "Chill mode: activated"] },
      pointing: { english: ["You're pointing at something? Tell me more.", "I see you pointing — what's up?", "Finger gun! Pew pew."], hinglish: ["Kuch point kar raha hai? Aur bata.", "Point karte hue dikha — kya scene hai?", "Finger gun! Pew pew."], tenglish: ["Edo point chestunava? Inka cheppu.", "Point chestunav kanipinchindi — em scene?", "Finger gun! Pew pew."], chatty: ["Ooh, pointing at something? Spill the tea!", "I see that finger — what's good?", "Finger guns! Pew pew!"] }
    },
    expression: {
      happy: { english: ["You're smiling! That makes me happy too.", "I see that smile! Great energy.", "Someone's in a good mood!"], hinglish: ["Tu muskura raha hai! Mujhe bhi achha lag raha hai.", "Tera smile dikha! Mast energy.", "Kisi ka mood achha hai!"], tenglish: ["Navvutunav! Naku kuda bagundi.", "Nee navvu kanipinchindi! Super energy.", "Evaro happy ga unaru!"], chatty: ["Yo that smile! I'm here for it", "I see you grinning! Love the energy!", "Someone's vibing today!"] },
      sad: { english: ["You look a bit down. Want to talk about it?", "I sense some sadness. I'm here for you.", "Tough day? Let me help if I can."], hinglish: ["Tu thoda udaas lag raha hai. Baat karein?", "Mujhe thoda sadness feel ho raha hai. Main hoon yahan.", "Mushkil din? Main madad karungi jitni ho sake."], tenglish: ["Koncham down ga unnav. Matladukundama?", "Koncham badha anipistundi. Nenu ikkade unna.", "Kastamaina roju? Nenu help chestha."], chatty: ["Aww you look a bit down. Wanna talk?", "I feel you, fam. I'm here.", "Rough day? Let me try to help"] },
      surprised: { english: ["Whoa, surprised?", "Did I catch you off guard?", "Something unexpected? Tell me!"], hinglish: ["Arre, surprised?", "Maine tujhe off guard pakda?", "Kuch unexpected? Bata!"], tenglish: ["Ayyo, surprised?", "Ninnu off guard patkuna?", "Edo unexpected? Cheppu!"], chatty: ["Whoa, you shook?", "Did I just catch you off guard?", "Plot twist? Spill it!"] },
      neutral: { english: ["I'm watching. Ready when you are.", "Neutral expression — focused mode.", "Steady gaze. I like it."], hinglish: ["Main dekh rahi hoon. Tu ready ho toh bata.", "Neutral expression — focused mode on.", "Steady gaze. Pasand aaya."], tenglish: ["Nenu chustunna. Nuvu ready aite cheppu.", "Neutral expression — focused mode.", "Steady gaze. Nachindi."], chatty: ["I'm watching you watching me", "Neutral face — big brain mode activated.", "That steady gaze tho"] }
    }
  };

  // ─── BACKEND ENDPOINTS & CACHE ───────────────────────────────────────
  const API_ENDPOINTS = [
    'https://ragina-crawler-ragina.vercel.app/api/ask',
  ];
  const queryCache = new Map();
  const CACHE_TTL = 60000;
  function getCached(q) {
    const key = q.toLowerCase().trim();
    const entry = queryCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.result;
    queryCache.delete(key);
    return null;
  }
  function setCache(q, result) {
    const key = q.toLowerCase().trim();
    queryCache.set(key, { result, timestamp: Date.now() });
  }

  async function callBackend(prompt, model, endpointIndex = 0) {
    if (endpointIndex >= API_ENDPOINTS.length) throw new Error('All backends failed.');
    const url = API_ENDPOINTS[endpointIndex];
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: model || 'openai' })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      return data.text || data.choices?.[0]?.message?.content || data.response || '';
    } catch (err) {
      console.warn(`⚠️ Backend ${url} failed:`, err.message);
      return callBackend(prompt, model, endpointIndex + 1);
    }
  }

  // ─── EVENT BUS ────────────────────────────────────────────────────────
  class EventBus {
    constructor() { this._map = new Map(); }
    on(e, fn) { if (!this._map.has(e)) this._map.set(e, new Set()); this._map.get(e).add(fn); return () => this.off(e, fn); }
    off(e, fn) { this._map.get(e)?.delete(fn); }
    emit(e, data) { this._map.get(e)?.forEach(fn => { try { fn(data); } catch (err) { console.error(err); } }); }
  }

  // ─── STORAGE MANAGER (localStorage for sessions + LTM) ──────────────
  class StorageManager {
    constructor(ns = 'ragina_t4') { this.ns = ns; }
    _key(k) { return `${this.ns}_${k}`; }
    getSessions() { try { return JSON.parse(localStorage.getItem(this._key('sessions')) || '{}'); } catch { return {}; } }
    saveSession(id, messages, meta = {}) {
      const all = this.getSessions();
      all[id] = { messages, updatedAt: Date.now(), ...meta };
      localStorage.setItem(this._key('sessions'), JSON.stringify(all));
    }
    deleteSession(id) { const all = this.getSessions(); delete all[id]; localStorage.setItem(this._key('sessions'), JSON.stringify(all)); }
    getLongTermMemory() { try { return JSON.parse(localStorage.getItem(this._key('ltm')) || '{}'); } catch { return {}; } }
    saveLongTermMemory(data) { localStorage.setItem(this._key('ltm'), JSON.stringify(data)); }
  }

  // ─── HYBRID RETRIEVAL ENGINE ─────────────────────────────────────────
  class HybridRetrievalEngine {
    constructor(config = {}) {
      this.chunks = []; this.idf = {}; this.isReady = false;
      this.chunkSize = config.chunkSize || 200;
      this.semanticWeight = config.semanticWeight || 0.5;
      this.embedDim = config.embedDim || 128;
    }
    tokenize(text) { return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2); }
    _hashToken(token) { let h = 0; for (let i = 0; i < token.length; i++) { h = ((h << 5) - h) + token.charCodeAt(i); h |= 0; } return Math.abs(h) % this.embedDim; }
    embed(text) {
      const vec = new Float32Array(this.embedDim);
      const tokens = this.tokenize(text);
      for (const t of tokens) { vec[this._hashToken(t)] += 1; }
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return Array.from(vec).map(v => v / norm);
    }
    cosine(a, b) {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    }
    bm25Score(query, doc, k1 = 1.5, b = 0.75) {
      const qTokens = this.tokenize(query);
      const dTokens = this.tokenize(doc);
      const avgdl = this.chunks.reduce((s, c) => s + this.tokenize(c.text).length, 0) / (this.chunks.length || 1);
      const freq = {};
      for (const t of dTokens) freq[t] = (freq[t] || 0) + 1;
      let score = 0;
      for (const t of qTokens) {
        const df = this.chunks.filter(c => this.tokenize(c.text).includes(t)).length;
        const idf = Math.log((this.chunks.length - df + 0.5) / (df + 0.5) + 1);
        const tf = freq[t] || 0;
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dTokens.length / avgdl))));
      }
      return score;
    }
    chunkText(text, size = this.chunkSize) {
      const sentences = text.replace(/([.!?])\s+/g, "$1\n").split('\n').filter(s => s.trim());
      const chunks = []; let buf = '';
      for (const s of sentences) {
        if (buf.length + s.length > size && buf.length > 50) { chunks.push(buf.trim()); buf = s; }
        else { buf += ' ' + s; }
      }
      if (buf.trim()) chunks.push(buf.trim());
      return chunks;
    }
    buildIndex(data) {
      this.chunks = [];
      const normalized = (function normalize(input) {
        if (input && Array.isArray(input.pages)) {
          const out = {};
          for (const page of input.pages) {
            const url = page.url || 'unknown';
            const chunks = page.chunks || [];
            if (chunks.length === 0) { if (page.content) out[url] = { bodyText: page.content }; continue; }
            out[url] = { bodyText: chunks.map(c => c.text || c.content || '').join('\n') };
          }
          return out;
        }
        return input;
      })(data);
      for (const [source, doc] of Object.entries(normalized)) {
        const body = doc.bodyText || doc.body || doc.content || '';
        if (!body || body.length < 30) continue;
        for (const c of this.chunkText(body)) {
          this.chunks.push({ source, text: c, embedding: this.embed(c) });
        }
      }
      this.idf = {};
      const N = this.chunks.length || 1;
      for (const chunk of this.chunks) {
        const words = new Set(this.tokenize(chunk.text));
        for (const w of words) this.idf[w] = (this.idf[w] || 0) + 1;
      }
      for (const w in this.idf) { this.idf[w] = Math.log(N / (1 + this.idf[w])); }
      this.isReady = this.chunks.length > 0;
      return this.chunks.length;
    }
    expandQuery(query) {
      const expansions = {
        'price': ['cost', 'value', 'worth', 'rate'],
        'buy': ['purchase', 'acquire', 'order'],
        'help': ['assist', 'support', 'aid'],
        'find': ['search', 'locate', 'discover'],
        'make': ['create', 'build', 'generate'],
        'delete': ['remove', 'erase', 'clear'],
        'update': ['modify', 'change', 'edit'],
        'show': ['display', 'list', 'view'],
        'best': ['top', 'optimal', 'greatest'],
        'worst': ['bad', 'terrible', 'lowest']
      };
      const words = query.toLowerCase().match(/\b\w+\b/g) || [];
      const extra = [];
      for (const w of words) { if (expansions[w]) extra.push(...expansions[w]); }
      return extra.length ? `${query} ${extra.join(' ')}` : query;
    }
    retrieve(query, k = 5) {
      if (!this.isReady || this.chunks.length === 0) return [];
      const qVec = this.embed(query);
      const scored = this.chunks.map(c => {
        const sem = this.cosine(qVec, c.embedding);
        const lex = this.bm25Score(query, c.text);
        const lexNorm = 1 - Math.exp(-lex * 0.5);
        const score = this.semanticWeight * sem + (1 - this.semanticWeight) * lexNorm;
        return { ...c, score };
      });
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k);
    }
  }

  // ─── TOOL REGISTRY ────────────────────────────────────────────────────
  const tools = {};
  function registerTool(name, cfg) {
    if (!name || typeof cfg?.handler !== 'function') {
      console.warn('❌ RAGina.registerTool: needs a name and a handler function.');
      return;
    }
    tools[name] = {
      description: cfg.description || '',
      parameters: cfg.parameters || {},
      handler: cfg.handler
    };
    console.log(`🔧 Tool registered: ${name}`);
  }
  function unregisterTool(name) { delete tools[name]; }
  function listTools() { return Object.keys(tools); }
  function toolsBlock() {
    const names = Object.keys(tools);
    if (!names.length) return '';
    const lines = names.map(n => {
      const t = tools[n];
      const params = Object.keys(t.parameters).length
        ? Object.entries(t.parameters).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'no parameters';
      return `- ${n}(${params}): ${t.description}`;
    }).join('\n');
    return `
You have access to these tools:
${lines}

When you need a tool to answer, reply with EXACTLY this and nothing else:
TOOL_CALL: toolName({"param": "value"})

Once you have enough information, reply with EXACTLY:
ANSWER: <your final answer>

Always use one of those two formats — never explain outside of them.`;
  }

  function parseAgentReply(raw) {
    const text = String(raw).trim();
    const toolMatch = text.match(/^TOOL_CALL:\s*([A-Za-z0-9_]+)\((.*)\)\s*$/s);
    if (toolMatch) {
      let args = {};
      try { args = toolMatch[2].trim() ? JSON.parse(toolMatch[2]) : {}; } catch (e) {
        try {
          const pairs = toolMatch[2].split(',').map(p => p.trim().split(':').map(s => s.trim()));
          args = Object.fromEntries(pairs.map(([k, v]) => [k, v.replace(/^['"]|['"]$/g, '')]));
        } catch (e2) {}
      }
      return { type: 'tool_call', name: toolMatch[1], args };
    }
    const answerMatch = text.match(/^ANSWER:\s*([\s\S]*)$/);
    if (answerMatch) return { type: 'answer', text: answerMatch[1].trim() };
    return { type: 'answer', text };
  }

  function buildAgentPrompt({ persona, query, contextText, history, toolLog }) {
    const historyBlock = history && history.length
      ? '\nRecent conversation:\n' + history.map(m => `${m.who}: ${m.text}`).join('\n') + '\n'
      : '';
    const contextBlock = contextText ? `\nDocument context:\n${contextText}\n` : '';
    const toolLogBlock = toolLog ? `\nTool results so far:${toolLog}\n` : '';
    return `${persona || 'You are RAGina T4 XENO, an AI with OS integration, vision, and local AI capabilities.'}
${toolsBlock()}
${historyBlock}${contextBlock}${toolLogBlock}
User: ${query}`;
  }

  async function runAgent(query, options = {}) {
    const cached = getCached(query);
    if (cached) { return cached; }
    const maxSteps = options.maxSteps || 5;
    let toolLog = '';
    const stepsTaken = [];

    for (let step = 1; step <= maxSteps; step++) {
      const prompt = buildAgentPrompt({
        persona: options.persona,
        query,
        contextText: options.contextText,
        history: options.history,
        toolLog
      });
      let raw;
      try {
        raw = await callBackend(prompt, options.model);
      } catch (e) {
        return { answer: pick(PHRASES.error.english) + ' ' + e.message, steps: stepsTaken };
      }
      const parsed = parseAgentReply(raw);
      stepsTaken.push(parsed);
      if (options.onStep) options.onStep(parsed);
      if (parsed.type === 'answer') {
        const result = { answer: parsed.text, steps: stepsTaken };
        setCache(query, result);
        return result;
      }
      const tool = tools[parsed.name];
      if (!tool) {
        toolLog += `\nTool "${parsed.name}" does not exist. Available: ${listTools().join(', ') || '(none)'}.`;
        continue;
      }
      let result;
      try { result = await tool.handler(parsed.args); }
      catch (e) { result = 'Error: ' + e.message; }
      toolLog += `\nResult of ${parsed.name}(${JSON.stringify(parsed.args)}): ${typeof result === 'string' ? result : JSON.stringify(result)}`;
    }
    const result = { answer: "I tried a few steps but couldn't finish that — could you rephrase or simplify?", steps: stepsTaken };
    setCache(query, result);
    return result;
  }

  // ─── NEW MODULE 1: OS BRIDGE ─────────────────────────────────────────
  class OSBridge {
    constructor(events) {
      this.events = events;
      this.fsHandle = null;
      this.wakeLock = null;
      this.serialPort = null;
      this.capabilities = this._detect();
      this.events.emit('os:ready', { capabilities: this.capabilities });
    }

    _detect() {
      return {
        fileSystemAccess: 'showOpenFilePicker' in window,
        bluetooth: !!navigator.bluetooth,
        usb: !!navigator.usb,
        serial: !!navigator.serial,
        hid: !!navigator.hid,
        nfc: 'NDEFReader' in window,
        geolocation: !!navigator.geolocation,
        vibrate: !!navigator.vibrate,
        share: !!navigator.share,
        wakeLock: !!navigator.wakeLock,
        notifications: 'Notification' in window,
        clipboardRead: !!navigator.clipboard?.readText,
        screenCapture: !!navigator.mediaDevices?.getDisplayMedia,
        gpu: !!navigator.gpu,
        webnn: !!navigator.ml,
        idleDetection: !!window.IdleDetector,
        contactsPicker: !!window.ContactsManager || ('contacts' in navigator),
        battery: !!navigator.getBattery,
        networkInfo: !!navigator.connection,
        badging: !!navigator.setAppBadge,
        eyeDropper: !!window.EyeDropper,
        webAuthn: !!window.PublicKeyCredential,
        paymentRequest: !!window.PaymentRequest,
        speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        speechSynthesis: !!speechSynthesis,
        midi: !!navigator.requestMIDIAccess,
        gamepad: !!navigator.getGamepads,
        motionSensors: typeof DeviceMotionEvent !== 'undefined',
        ambientLight: 'AmbientLightSensor' in window,
        webXR: !!navigator.xr
      };
    }

    async pickDirectory() {
      if (!this.capabilities.fileSystemAccess) return { error: 'File System API not supported' };
      try {
        this.fsHandle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'ragina-xeno' });
        const tree = await this._scanDir(this.fsHandle);
        this.events.emit('os:directory-opened', { name: this.fsHandle.name, files: tree.length });
        return { success: true, dirName: this.fsHandle.name, fileCount: tree.length, files: tree };
      } catch (e) { return { error: e.name === 'AbortError' ? 'Cancelled' : e.message }; }
    }

    async _scanDir(handle, depth = 0, maxDepth = 6) {
      const out = [];
      for await (const [name, entry] of handle.entries()) {
        if (entry.kind === 'file') {
          const f = await entry.getFile();
          out.push({ name: entry.name, path: `${handle.name}/${name}`, size: f.size, lastModified: f.lastModified, handle: entry });
        } else if (depth < maxDepth) {
          out.push(...await this._scanDir(entry, depth + 1, maxDepth));
        }
      }
      return out;
    }

    async readFileByPath(path) {
      if (!this.fsHandle) return { error: 'No directory open. Call pickDirectory() first.' };
      const parts = path.split('/');
      let dir = this.fsHandle;
      for (let i = 1; i < parts.length - 1; i++) {
        try { dir = await dir.getDirectoryHandle(parts[i]); }
        catch { return { error: `Directory not found: ${parts[i]}` }; }
      }
      try {
        const fh = await dir.getFileHandle(parts[parts.length - 1]);
        const file = await fh.getFile();
        return { name: file.name, content: await file.text() };
      } catch { return { error: `File not found: ${path}` }; }
    }

    async writeFile(filename, content) {
      if (!this.fsHandle) return { error: 'No writable directory open.' };
      try {
        const fh = await this.fsHandle.getFileHandle(filename, { create: true });
        const w = await fh.createWritable();
        await w.write(content);
        await w.close();
        return { success: true, path: `${this.fsHandle.name}/${filename}`, bytes: content.length };
      } catch (e) { return { error: e.message }; }
    }

    async connectBluetooth(services = ['battery_service']) {
      if (!this.capabilities.bluetooth) return { error: 'Bluetooth not supported' };
      try {
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ services }],
          optionalServices: ['device_information']
        });
        device.addEventListener('gattserverdisconnected', () =>
          this.events.emit('os:bt-disconnected', { device: device.name }));
        const server = await device.gatt.connect();
        this.events.emit('os:bt-connected', { device: device.name });
        return { success: true, device: device.name, id: device.id, connected: server.connected };
      } catch (e) { return { error: e.message }; }
    }

    async readBatteryLevel() {
      try {
        const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['battery_service'] }] });
        const server = await device.gatt.connect();
        const svc = await server.getPrimaryService('battery_service');
        const ch = await svc.getCharacteristic('battery_level');
        const val = await ch.readValue();
        return { device: device.name, batteryPercent: val.getInt8(0) };
      } catch (e) { return { error: e.message }; }
    }

    async connectSerial(baudRate = 115200) {
      if (!this.capabilities.serial) return { error: 'Web Serial not supported' };
      try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate });
        this.serialPort = port;
        this._serialReaderLoop(port);
        this.events.emit('os:serial-connected', { baudRate });
        return { success: true, baudRate };
      } catch (e) { return { error: e.message }; }
    }

    async _serialReaderLoop(port) {
      const decoder = new TextDecoder();
      while (port.readable) {
        const reader = port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            this.events.emit('os:serial-data', { data: decoder.decode(value) });
          }
        } finally { reader.releaseLock(); }
      }
    }

    async serialWrite(data) {
      if (!this.serialPort?.writable) return { error: 'Serial not connected' };
      const writer = this.serialPort.writable.getWriter();
      await writer.write(new TextEncoder().encode(data));
      writer.releaseLock();
      return { sent: data };
    }

    async captureScreen(withAudio = false) {
      if (!this.capabilities.screenCapture) return { error: 'Screen capture unsupported' };
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 }, audio: withAudio
        });
        const track = stream.getVideoTracks()[0];
        const imgCapture = new ImageCapture(track);
        const bitmap = await imgCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width; canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        stream.getTracks().forEach(t => t.stop());
        return { frame: canvas.toDataURL('image/jpeg', 0.85), width: bitmap.width, height: bitmap.height };
      } catch (e) { return { error: e.message }; }
    }

    async recordScreen(seconds = 10) {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const chunks = [];
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
      rec.ondataavailable = e => chunks.push(e.data);
      const stopped = new Promise(res => rec.onstop = res);
      rec.start();
      setTimeout(() => rec.stop(), seconds * 1000);
      await stopped;
      stream.getTracks().forEach(t => t.stop());
      return URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
    }

    async notify(title, body, opts = {}) {
      if (!('Notification' in window)) return { error: 'Notifications unsupported' };
      let perm = Notification.permission;
      if (perm !== 'granted') perm = await Notification.requestPermission();
      if (perm !== 'granted') return { error: 'Permission denied' };
      const n = new Notification(title, { body, icon: '/ragina-logo.png', badge: '/ragina-logo.png', tag: 'ragina-xeno', ...opts });
      n.onclick = () => { window.focus(); n.close(); };
      return { notified: true };
    }

    vibrate(pattern = [100, 50, 100]) {
      return navigator.vibrate ? { vibrated: navigator.vibrate(pattern) } : { error: 'unsupported' };
    }

    async keepAwake(on = true) {
      if (!this.capabilities.wakeLock) return { error: 'Wake Lock unsupported' };
      if (on && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => this.wakeLock = null);
      } else if (!on && this.wakeLock) {
        await this.wakeLock.release(); this.wakeLock = null;
      }
      return { awake: on };
    }

    getLocation(highAccuracy = false) {
      return new Promise((res) => {
        if (!navigator.geolocation) return res({ error: 'unsupported' });
        navigator.geolocation.getCurrentPosition(
          p => res({ lat: +p.coords.latitude.toFixed(5), lon: +p.coords.longitude.toFixed(5), accuracy: p.coords.accuracy }),
          e => res({ error: e.message }), { enableHighAccuracy: highAccuracy, timeout: 8000 });
      });
    }

    async getBattery() {
      if (!navigator.getBattery) return { error: 'unsupported' };
      const b = await navigator.getBattery();
      return { level: Math.round(b.level * 100) + '%', charging: b.charging, chargingTime: b.chargingTime, dischargingTime: b.dischargingTime };
    }

    getNetworkQuality() {
      if (!navigator.connection) return { online: navigator.onLine };
      const c = navigator.connection;
      return { online: navigator.onLine, type: c.effectiveType, downlinkMbps: c.downlink, rttMs: c.rtt, saveData: c.saveData };
    }

    async isUserIdle(thresholdSec = 60) {
      if (!window.IdleDetector) return { error: 'Idle Detection unsupported' };
      const perm = await IdleDetector.requestPermission();
      if (perm !== 'granted') return { error: 'Permission denied' };
      const detector = new IdleDetector();
      return new Promise(res => {
        detector.onchange = () => res({ userState: detector.userState, screenState: detector.screenState });
        detector.start({ threshold: thresholdSec * 1000 });
      });
    }

    async readClipboard() {
      try { return { text: await navigator.clipboard.readText() }; }
      catch (e) { return { error: e.message }; }
    }

    writeClipboard(text) {
      return navigator.clipboard.writeText(text).then(() => ({ copied: text.length })).catch(e => ({ error: e.message }));
    }

    async copyScreenshotToClipboard() {
      const shot = await this.captureScreen();
      if (shot.error) return shot;
      const blob = await (await fetch(shot.frame)).blob();
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        return { copiedImage: true };
      } catch { return this.writeClipboard('[screenshot captured]'); }
    }

    async share({ title, text, url, files }) {
      if (!navigator.share) return { error: 'Web Share unsupported' };
      try {
        await navigator.share({ title, text, url, ...(files && navigator.canShare?.({ files }) ? { files } : {}) });
        return { shared: true };
      } catch (e) { return { error: e.message }; }
    }

    async connectMIDI() {
      if (!navigator.requestMIDIAccess) return { error: 'Web MIDI unsupported' };
      const access = await navigator.requestMIDIAccess();
      const devices = [...access.inputs.values()].map(i => i.name);
      access.onstatechange = e => this.events.emit('os:midi-change', { device: e.port.name, state: e.port.state });
      return { inputs: devices };
    }

    pollGamepads() {
      const pads = navigator.getGamepads?.() || [];
      return [...pads].filter(Boolean).map(p => ({ id: p.id, buttons: p.buttons.map(b => b.pressed), axes: p.axes }));
    }

    setBadge(count) {
      if (count === 0) { navigator.clearAppBadge?.(); return { cleared: true }; }
      navigator.setAppBadge?.(count);
      return { badgeSet: count };
    }

    async getGPUInfo() {
      if (!navigator.gpu) return { gpu: false, fallback: 'WASM/CPU' };
      try {
        const adapter = await navigator.gpu.requestAdapter();
        const info = adapter.info || {};
        return { gpu: true, vendor: info.vendor, architecture: info.architecture, description: info.description, backend: 'webgpu' };
      } catch { return { gpu: true, details: 'adapter unavailable' }; }
    }

    statusReport() {
      return {
        platform: { ua: navigator.userAgent.slice(0, 80), lang: navigator.language, cores: navigator.hardwareConcurrency, memoryGB: navigator.deviceMemory },
        capabilities: Object.entries(this.capabilities).filter(([,v]) => v).map(([k]) => k),
        network: this.getNetworkQuality(),
        fsOpen: !!this.fsHandle,
        awake: !!this.wakeLock
      };
    }
  }

  // ─── NEW MODULE 2: LOCAL INFERENCE ENGINE ────────────────────────────
  class LocalInferenceEngine {
    constructor(config = {}) {
      this.config = { embedModel: 'Xenova/all-MiniLM-L6-v2', chatModel: 'onnx-community/Qwen2.5-0.5B-Instruct', ...config };
      this.pipeEmbed = null; this.pipeChat = null; this.ready = false;
    }

    async init(progressCb) {
      if (!window.transformers) {
        await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.x/dist/transformers.min.js');
      }
      const { pipeline, env } = window.transformers;
      env.allowLocalModels = false;
      progressCb?.('Loading embedding model…');
      this.pipeEmbed = await pipeline('feature-extraction', this.config.embedModel, {
        progress_callback: p => progressCb?.(`${p.status}: ${Math.round((p.progress||0))}% ${p.file||''}`)
      });
      try {
        progressCb?.('Loading chat model…');
        this.pipeChat = await pipeline('text-generation', this.config.chatModel, {
          dtype: 'q4', device: navigator.gpu ? 'webgpu' : 'wasm',
          progress_callback: p => progressCb?.(`chat: ${p.status} ${p.progress||''}%`)
        });
      } catch { /* chat model optional */ }
      this.ready = true;
      return { ready: true, gpu: !!navigator.gpu, chatModelLoaded: !!this.pipeChat };
    }

    async embed(text) {
      if (!this.pipeEmbed) throw new Error('Local engine not initialized');
      const out = await this.pipeEmbed(text, { pooling: 'mean', normalize: true });
      return Array.from(out.data);
    }

    async chat(messages, maxTokens = 256) {
      if (!this.pipeChat) return { error: 'Chat model unavailable — using cloud fallback.' };
      const out = await this.pipeChat(messages, { max_new_tokens: maxTokens, do_sample: true, temperature: 0.7 });
      return { text: out[0].generated_text.at(-1)?.content || '' };
    }

    async summarize(text, maxTokens = 128) {
      return this.chat([{ role: 'user', content: `Summarize concisely:\n\n${text.slice(0, 4000)}` }], maxTokens);
    }
  }

  // ─── NEW MODULE 3: VECTOR STORE (IndexedDB) ──────────────────────────
  class VectorStore {
    constructor(dbName = 'ragina_xeno') {
      this.dbName = dbName; this.db = null;
    }
    async open() {
      return new Promise((res, rej) => {
        const req = indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore('chunks', { keyPath: 'id' });
          req.result.createObjectStore('docs', { keyPath: 'source' });
        };
        req.onsuccess = () => { this.db = req.result; res(this); };
        req.onerror = rej;
      });
    }
    async putChunks(chunks) {
      const tx = this.db.transaction('chunks', 'readwrite');
      const store = tx.objectStore('chunks');
      chunks.forEach(c => store.put(c));
      return new Promise(res => tx.oncomplete = () => res({ stored: chunks.length }));
    }
    async allChunks() {
      return new Promise(res => {
        this.db.transaction('chunks').objectStore('chunks').getAll().onsuccess = e => res(e.target.result);
      });
    }
    async clear() {
      return new Promise(res => {
        const tx = this.db.transaction('chunks', 'readwrite');
        tx.objectStore('chunks').clear(); tx.oncomplete = () => res({ cleared: true });
      });
    }
  }

  // ─── NEW MODULE 4: NATIVE BRIDGE (Companion) ────────────────────────
  class NativeBridge {
    constructor(url = 'http://localhost:7777') { this.url = url; }
    async ping() {
      try { const r = await fetch(this.url + '/ping'); return (await r.json()).ok === true; }
      catch { return false; }
    }
    async call(action, params = {}) {
      const r = await fetch(this.url + '/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return r.json();
    }
  }

  async function initNativeBridge() {
    const bridge = new NativeBridge();
    if (!await bridge.ping()) return false;
    registerTool('runShell', {
      description: 'Execute a shell command on the host OS (requires RAGina Bridge)',
      parameters: { command: 'string' },
      handler: ({ command }) => bridge.call('shell', { command })
    });
    registerTool('openApp', {
      description: 'Launch any installed application',
      parameters: { app: 'string, e.g. "code", "chrome", "spotify"' },
      handler: ({ app }) => bridge.call('open-app', { app })
    });
    registerTool('listProcesses', {
      description: 'List running processes',
      parameters: {},
      handler: () => bridge.call('processes')
    });
    registerTool('volumeControl', {
      description: 'Set system volume 0-100',
      parameters: { level: 'number' },
      handler: ({ level }) => bridge.call('volume', { level })
    });
    registerTool('typeTextOS', {
      description: 'Type text into whatever app is focused (OS-level keyboard injection)',
      parameters: { text: 'string' },
      handler: ({ text }) => bridge.call('type-text', { text })
    });
    registerTool('screenshotFullOS', {
      description: 'Full OS screenshot incl. other monitors/apps',
      parameters: {},
      handler: () => bridge.call('screenshot')
    });
    registerTool('clipboardOS', {
      description: 'Read/write the OS clipboard globally',
      parameters: { text: 'string optional' },
      handler: ({ text }) => text ? bridge.call('set-clipboard', { text }) : bridge.call('get-clipboard')
    });
    registerTool('mediaControl', {
      description: 'Play/pause/skip system media',
      parameters: { action: '"play","pause","next","prev"' },
      handler: ({ action }) => bridge.call('media', { action })
    });
    return true;
  }

  // ─── VISION ENGINE (MediaPipe Face + Hands) ──────────────────────────
  class VisionEngine {
    constructor(config = {}) {
      this.config = {
        cameraWidth: 640, cameraHeight: 480,
        detectionInterval: 250,
        gestureCooldown: 1200,
        expressionCooldown: 3000,
        enableFace: true, enableHands: true, enableOverlay: true,
        proactiveComments: true,
        ...config
      };
      this.isActive = false;
      this.isLoading = false;
      this.video = null;
      this.canvas = null;
      this.ctx = null;
      this.stream = null;
      this.faceMesh = null;
      this.hands = null;
      this.cameraUtils = null;
      this.lastFaces = [];
      this.lastHands = [];
      this.lastGesture = null;
      this.lastExpression = null;
      this.gestureHistory = [];
      this.lastGestureTime = 0;
      this.lastExpressionTime = 0;
      this.frameCount = 0;
      this.events = new EventBus();
      this.onResultsBound = this.onResults.bind(this);
    }

    async loadScripts() {
      if (window.FaceMesh && window.Hands && window.Camera && window.drawConnectors) return;
      const urls = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
      ];
      for (const url of urls) {
        if (document.querySelector(`script[src="${url}"]`)) continue;
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = url;
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }
    }

    async start(container) {
      if (this.isActive || this.isLoading) return;
      this.isLoading = true;
      try {
        await this.loadScripts();
        if (!this.video) {
          this.video = document.createElement('video');
          this.video.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;';
          this.video.setAttribute('playsinline', '');
        }
        if (!this.canvas) {
          this.canvas = document.createElement('canvas');
          this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;border-radius:12px;';
        }
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: this.config.cameraWidth, height: this.config.cameraHeight, facingMode: 'user' }
        });
        this.video.srcObject = this.stream;
        await this.video.play();

        if (this.config.enableFace && window.FaceMesh) {
          this.faceMesh = new window.FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
          });
          this.faceMesh.setOptions({
            maxNumFaces: 3,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });
          this.faceMesh.onResults(this.onResultsBound);
        }

        if (this.config.enableHands && window.Hands) {
          this.hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });
          this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5
          });
          this.hands.onResults(this.onResultsBound);
        }

        if (window.Camera) {
          this.cameraUtils = new window.Camera(this.video, {
            onFrame: async () => {
              if (this.faceMesh) await this.faceMesh.send({ image: this.video });
              if (this.hands) await this.hands.send({ image: this.video });
            },
            width: this.config.cameraWidth,
            height: this.config.cameraHeight
          });
          await this.cameraUtils.start();
        }

        this.isActive = true;
        this.isLoading = false;
        this.events.emit('vision:started', {});
      } catch (e) {
        this.isLoading = false;
        this.events.emit('vision:error', { error: e.message });
        throw e;
      }
    }

    stop() {
      this.isActive = false;
      if (this.cameraUtils) { try { this.cameraUtils.stop(); } catch {} this.cameraUtils = null; }
      if (this.faceMesh) { try { this.faceMesh.close(); } catch {} this.faceMesh = null; }
      if (this.hands) { try { this.hands.close(); } catch {} this.hands = null; }
      if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
      if (this.video) { this.video.srcObject = null; }
      this.events.emit('vision:stopped', {});
    }

    onResults(results) {
      this.frameCount++;
      const now = Date.now();

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      if (results.multiFaceLandmarks) {
        this.lastFaces = results.multiFaceLandmarks.map((landmarks, idx) => {
          const expr = this.analyzeExpression(landmarks);
          const gaze = this.estimateGaze(landmarks);
          const faceW = this.computeFaceWidth(landmarks);
          if (this.config.enableOverlay && this.ctx && window.drawConnectors) {
            window.drawConnectors(this.ctx, landmarks, window.FACEMESH_TESSELATION,
              { color: 'rgba(108,99,255,0.15)', lineWidth: 1 });
            window.drawConnectors(this.ctx, landmarks, window.FACEMESH_FACE_OVAL,
              { color: 'rgba(108,99,255,0.6)', lineWidth: 2 });
            window.drawConnectors(this.ctx, landmarks, window.FACEMESH_LEFT_EYE,
              { color: '#00BFA6', lineWidth: 2 });
            window.drawConnectors(this.ctx, landmarks, window.FACEMESH_RIGHT_EYE,
              { color: '#00BFA6', lineWidth: 2 });
            window.drawConnectors(this.ctx, landmarks, window.FACEMESH_LIPS,
              { color: '#F50057', lineWidth: 2 });
          }
          return { landmarks, expression: expr, gaze, faceWidth: faceW, index: idx };
        });

        if (this.lastFaces.length > 0 && now - this.lastExpressionTime > this.config.expressionCooldown) {
          const dominantExpr = this.getDominantExpression();
          if (dominantExpr && dominantExpr !== this.lastExpression) {
            this.lastExpression = dominantExpr;
            this.lastExpressionTime = now;
            this.events.emit('vision:expression', { expression: dominantExpr, faceCount: this.lastFaces.length });
          }
        }
      }

      if (results.multiHandLandmarks) {
        this.lastHands = results.multiHandLandmarks.map((landmarks, idx) => {
          const gesture = this.classifyGesture(landmarks);
          const handedness = results.multiHandedness?.[idx]?.label || 'Unknown';
          if (this.config.enableOverlay && this.ctx && window.drawConnectors) {
            window.drawConnectors(this.ctx, landmarks, window.HAND_CONNECTIONS,
              { color: 'rgba(108,99,255,0.5)', lineWidth: 2 });
            window.drawLandmarks(this.ctx, landmarks,
              { color: '#FFAB00', lineWidth: 1, radius: 3 });
          }
          return { landmarks, gesture, handedness, index: idx };
        });

        if (this.lastHands.length > 0 && now - this.lastGestureTime > this.config.gestureCooldown) {
          const bestGesture = this.lastHands.find(h => h.gesture !== 'unknown')?.gesture;
          if (bestGesture && bestGesture !== this.lastGesture) {
            this.lastGesture = bestGesture;
            this.lastGestureTime = now;
            this.gestureHistory.push({ gesture: bestGesture, time: now });
            if (this.gestureHistory.length > 20) this.gestureHistory.shift();
            this.events.emit('vision:gesture', { gesture: bestGesture, hands: this.lastHands.length });
          }
        }
      }

      if (this.frameCount % 10 === 0) {
        this.events.emit('vision:status', {
          faces: this.lastFaces.length,
          hands: this.lastHands.length,
          expression: this.lastExpression,
          gesture: this.lastGesture
        });
      }
    }

    analyzeExpression(lm) {
      const leftEyeTop = lm[159], leftEyeBottom = lm[145];
      const rightEyeTop = lm[386], rightEyeBottom = lm[374];
      const mouthTop = lm[13], mouthBottom = lm[14], mouthLeft = lm[61], mouthRight = lm[291];
      const noseTip = lm[1], chin = lm[152];
      const faceWidth = dist(lm[234], lm[454]);
      const norm = faceWidth || 1;

      const leftEyeOpen = dist(leftEyeTop, leftEyeBottom) / norm;
      const rightEyeOpen = dist(rightEyeTop, rightEyeBottom) / norm;
      const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;
      const mouthOpen = dist(mouthTop, mouthBottom) / norm;
      const mouthCenterY = (mouthLeft.y + mouthRight.y) / 2;
      const smileFactor = (noseTip.y - mouthCenterY) / (faceWidth || 1);

      if (avgEyeOpen < 0.015) return 'sleepy';
      if (mouthOpen > 0.12) return 'surprised';
      if (smileFactor > 0.18 && mouthOpen > 0.03) return 'happy';
      if (smileFactor > 0.12) return 'smiling';
      if (smileFactor < -0.05 && mouthOpen < 0.04) return 'sad';
      return 'neutral';
    }

    getDominantExpression() {
      if (!this.lastFaces.length) return null;
      const counts = {};
      for (const f of this.lastFaces) {
        counts[f.expression] = (counts[f.expression] || 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    }

    estimateGaze(lm) {
      const leftEyeCenter = { x: (lm[33].x + lm[133].x) / 2, y: (lm[33].y + lm[133].y) / 2 };
      const rightEyeCenter = { x: (lm[362].x + lm[263].x) / 2, y: (lm[362].y + lm[263].y) / 2 };
      const eyeCenter = { x: (leftEyeCenter.x + rightEyeCenter.x) / 2, y: (leftEyeCenter.y + rightEyeCenter.y) / 2 };
      const nose = lm[1];
      const dx = nose.x - eyeCenter.x;
      const dy = nose.y - eyeCenter.y;

      if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) return 'center';
      if (dx > 0.03) return 'left';
      if (dx < -0.03) return 'right';
      if (dy > 0.03) return 'down';
      if (dy < -0.03) return 'up';
      return 'center';
    }

    computeFaceWidth(lm) {
      return dist(lm[234], lm[454]);
    }

    classifyGesture(lm) {
      const wrist = lm[0];
      const fingers = [
        { name: 'thumb', tip: 4, pip: 2 },
        { name: 'index', tip: 8, pip: 6 },
        { name: 'middle', tip: 12, pip: 10 },
        { name: 'ring', tip: 16, pip: 14 },
        { name: 'pinky', tip: 20, pip: 18 }
      ];
      const isExtended = (tipIdx, refIdx) => {
        const dTip = dist(lm[tipIdx], wrist);
        const dRef = dist(lm[refIdx], wrist);
        return dTip > dRef * 1.05;
      };
      const states = fingers.map(f => ({ name: f.name, extended: isExtended(f.tip, f.pip) }));
      const thumbExt = states[0].extended;
      const indexExt = states[1].extended;
      const middleExt = states[2].extended;
      const ringExt = states[3].extended;
      const pinkyExt = states[4].extended;
      const thumbTip = lm[4];

      if (thumbTip.y < wrist.y - 0.05 && !indexExt && !middleExt && !ringExt && !pinkyExt) return 'thumbs_up';
      if (thumbTip.y > wrist.y + 0.05 && !indexExt && !middleExt && !ringExt && !pinkyExt) return 'thumbs_down';
      if (indexExt && middleExt && !ringExt && !pinkyExt) return 'peace';
      if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'pointing';
      if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) return 'open_palm';
      if (!indexExt && !middleExt && !ringExt && !pinkyExt) return 'fist';
      if (thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) return 'ok';
      if (thumbExt && indexExt && middleExt && !ringExt && !pinkyExt) return 'call_me';
      if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) return 'rock_on';
      if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) return 'hang_loose';
      return 'unknown';
    }

    captureFrame() {
      if (!this.video || !this.isActive) return null;
      const c = document.createElement('canvas');
      c.width = this.video.videoWidth || 640;
      c.height = this.video.videoHeight || 480;
      const cx = c.getContext('2d');
      cx.drawImage(this.video, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.85);
    }

    getReport() {
      return {
        active: this.isActive,
        faceCount: this.lastFaces.length,
        expression: this.getDominantExpression(),
        gaze: this.lastFaces[0]?.gaze || null,
        handCount: this.lastHands.length,
        gesture: this.lastHands.find(h => h.gesture !== 'unknown')?.gesture || null,
        recentGestures: this.gestureHistory.slice(-5)
      };
    }
  }

  // ─── CHAT WIDGET ──────────────────────────────────────────────────────
  class ChatWidget {
    constructor(engine, config, storage, events, vision, langEngine) {
      this.engine = engine;
      this.config = config;
      this.storage = storage;
      this.events = events;
      this.vision = vision;
      this.langEngine = langEngine;
      this.sessionId = config.sessionId || uuid();
      this.messages = [];
      this.isStreaming = false;
      this.elements = {};
      this.visionEnabled = false;
      this.currentMix = config.defaultMix || 'english';
    }

    hexToRgb(hex) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}` : '108,99,255';
    }

    injectStyles() {
      if (!hasDOM) return;
      if (document.getElementById('ragina-t4-styles')) return;
      const primary = this.config.theme?.primary || '#6C63FF';
      const rgb = this.hexToRgb(primary);
      const side = this.config.position === 'bottom-left' ? 'left:24px;' : 'right:24px;';
      const isDark = this.config.theme?.mode !== 'light';
      const bg = isDark ? '#0f0f1a' : '#ffffff';
      const fg = isDark ? '#ddd' : '#1a1a2e';
      const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
      const borderCol = isDark ? `rgba(${rgb},0.3)` : `rgba(${rgb},0.2)`;

      const css = `
@keyframes ragina-pulse{0%,100%{box-shadow:0 0 0 0 rgba(${rgb},0.5)}50%{box-shadow:0 0 0 18px rgba(${rgb},0)}}
@keyframes ragina-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ragina-typing{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-8px);opacity:1}}
@keyframes ragina-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ragina-blink{0%,100%{opacity:1}50%{opacity:0.3}}
.ragina-t4-bubble{position:fixed;${side}bottom:24px;width:64px;height:64px;border-radius:50%;background:transparent;border:2px solid ${primary};cursor:pointer;z-index:99999;font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform 0.3s,box-shadow 0.3s;animation:ragina-float 4s ease-in-out infinite,ragina-pulse 2s infinite;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
.ragina-t4-bubble:hover{transform:scale(1.15) rotate(360deg);animation:none;box-shadow:0 0 25px rgba(${rgb},0.6)}
.ragina-t4-bubble img{width:48px;height:48px;border-radius:50%}
.ragina-t4-bubble.vision-active{border-color:#00BFA6;animation:ragina-pulse 1.5s infinite, ragina-float 4s ease-in-out infinite}
.ragina-t4-panel{position:fixed;${side}bottom:100px;width:460px;max-width:94vw;height:640px;max-height:85vh;background:${bg};border-radius:20px;z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid ${borderCol};box-shadow:0 0 40px rgba(${rgb},0.2),0 20px 60px rgba(0,0,0,0.6);transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);font-family:system-ui,-apple-system,sans-serif;color:${fg};resize:both}
.ragina-t4-panel.hidden{opacity:0;pointer-events:none;transform:translateY(30px) scale(0.95)}
.ragina-t4-header{background:linear-gradient(135deg,${primary},#8b7cff);padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:default;user-select:none;position:relative}
.ragina-t4-avatar{width:38px;height:38px;border-radius:50%;border:2px solid white;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative}
.ragina-t4-avatar.eye-active::after{content:'';position:absolute;bottom:2px;right:2px;width:8px;height:8px;background:#00E676;border-radius:50%;box-shadow:0 0 6px #00E676;animation:ragina-blink 2s infinite}
.ragina-t4-header-info{flex:1;color:white;min-width:0}
.ragina-t4-header-name{font-weight:700;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ragina-t4-header-status{font-size:0.65rem;opacity:0.85;display:flex;align-items:center;gap:4px}
.ragina-t4-status-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80}
.ragina-t4-header-actions{display:flex;gap:6px}
.ragina-t4-header-btn{background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;position:relative}
.ragina-t4-header-btn:hover{background:rgba(255,255,255,0.35)}
.ragina-t4-header-btn.active{background:rgba(255,255,255,0.4);box-shadow:0 0 8px rgba(255,255,255,0.3)}
.ragina-t4-vision-preview{position:absolute;top:48px;${this.config.position === 'bottom-left' ? 'left:12px' : 'right:12px'};width:160px;height:120px;background:#000;border-radius:12px;overflow:hidden;border:2px solid rgba(${rgb},0.4);z-index:100000;display:none;box-shadow:0 8px 32px rgba(0,0,0,0.5)}
.ragina-t4-vision-preview.active{display:block}
.ragina-t4-vision-preview video{width:100%;height:100%;object-fit:cover}
.ragina-t4-vision-preview canvas{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
.ragina-t4-vision-badge{position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.7);color:#00E676;font-size:0.6rem;padding:2px 6px;border-radius:6px;display:flex;align-items:center;gap:4px}
.ragina-t4-toolbar{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid ${borderCol};background:${isDark?'#16162a':'#f8f8fc'};font-size:0.75rem}
.ragina-t4-toolbar-btn{background:transparent;border:1px solid ${borderCol};color:${fg};border-radius:6px;padding:3px 10px;cursor:pointer;font-size:0.7rem;transition:all 0.2s}
.ragina-t4-toolbar-btn:hover{background:rgba(${rgb},0.1);border-color:${primary}}
.ragina-t4-messages{flex:1;padding:14px;overflow-y:auto;background:linear-gradient(180deg,${bg} 0%,${isDark?'#1a1a2e':'#f5f5fa'} 100%)}
.ragina-t4-messages::-webkit-scrollbar{width:5px}
.ragina-t4-messages::-webkit-scrollbar-thumb{background:rgba(${rgb},0.4);border-radius:4px}
.ragina-t4-msg{margin-bottom:14px;display:flex;flex-direction:column;animation:ragina-fade-in 0.3s ease}
.ragina-t4-msg.user{align-items:flex-end}
.ragina-t4-msg.ai{align-items:flex-start}
.ragina-t4-msg-bubble{max-width:85%;padding:10px 14px;font-size:0.88rem;line-height:1.55;word-break:break-word;position:relative}
.ragina-t4-msg.user .ragina-t4-msg-bubble{background:${primary};color:white;border-radius:16px 16px 4px 16px}
.ragina-t4-msg.ai .ragina-t4-msg-bubble{background:${isDark?`rgba(${rgb},0.08)`:'rgba('+rgb+',0.06)'};color:${fg};border:1px solid ${borderCol};border-radius:16px 16px 16px 4px}
.ragina-t4-msg-actions{display:flex;gap:6px;margin-top:4px;padding-left:4px;opacity:0;transition:opacity 0.2s}
.ragina-t4-msg:hover .ragina-t4-msg-actions{opacity:1}
.ragina-t4-msg-action{background:transparent;border:none;color:${isDark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.35)'};cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px;transition:all 0.2s}
.ragina-t4-msg-action:hover{color:${primary};background:rgba(${rgb},0.1)}
.ragina-t4-sources{margin-top:6px;padding-left:8px}
.ragina-t4-sources-toggle{background:transparent;border:none;color:${primary};font-size:0.7rem;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px}
.ragina-t4-sources-list{font-size:0.68rem;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.5)'};margin-top:4px;padding-left:12px;border-left:2px solid rgba(${rgb},0.3)}
.ragina-t4-source-item{margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ragina-t4-source-score{font-size:0.6rem;opacity:0.6;margin-left:4px}
.ragina-t4-tool-tag{font-size:0.62rem;color:rgba(${rgb},0.85);margin-top:4px;padding-left:8px;font-style:italic}
.ragina-t4-input-area{display:flex;flex-direction:column;padding:10px 12px;border-top:1px solid ${borderCol};background:${bg};gap:8px}
.ragina-t4-input-row{display:flex;align-items:center;gap:8px}
.ragina-t4-input{flex:1;background:${inputBg};border:1px solid ${borderCol};border-radius:22px;padding:10px 16px;color:${fg};font-size:0.88rem;outline:none;transition:border-color 0.2s}
.ragina-t4-input:focus{border-color:${primary};box-shadow:0 0 0 3px rgba(${rgb},0.1)}
.ragina-t4-input::placeholder{color:${isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)'}}
.ragina-t4-send{background:${primary};border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;color:white;font-size:16px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ragina-t4-send:hover{box-shadow:0 0 15px rgba(${rgb},0.6);transform:scale(1.05)}
.ragina-t4-send:disabled{opacity:0.4;cursor:not-allowed;transform:none}
.ragina-t4-upload-area{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px dashed ${borderCol};border-radius:10px;cursor:pointer;transition:all 0.2s;font-size:0.75rem;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.5)'}}
.ragina-t4-upload-area:hover{border-color:${primary};background:rgba(${rgb},0.05)}
.ragina-t4-upload-area.dragover{border-color:${primary};background:rgba(${rgb},0.1)}
.ragina-t4-typing{display:flex;gap:4px;padding:10px 14px}
.ragina-t4-typing span{width:7px;height:7px;border-radius:50%;background:rgba(${rgb},0.6);animation:ragina-typing 1.4s infinite}
.ragina-t4-typing span:nth-child(2){animation-delay:0.2s}
.ragina-t4-typing span:nth-child(3){animation-delay:0.4s}
.ragina-t4-code-block{background:${isDark?'#1e1e2e':'#f4f4f8'};border-radius:10px;margin:8px 0;overflow:hidden;border:1px solid ${borderCol}}
.ragina-t4-code-header{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:rgba(${rgb},0.08);font-size:0.7rem;color:${isDark?'rgba(255,255,255,0.6)':'rgba(0,0,0,0.5)'}}
.ragina-t4-code-block code{display:block;padding:10px 12px;font-family:'Fira Code',monospace;font-size:0.8rem;overflow-x:auto;color:${fg}}
.ragina-t4-inline-code{background:rgba(${rgb},0.1);padding:2px 5px;border-radius:4px;font-family:'Fira Code',monospace;font-size:0.82rem;color:${primary}}
.ragina-t4-copy-btn{background:rgba(255,255,255,0.1);border:none;color:inherit;cursor:pointer;padding:2px 8px;border-radius:4px;font-size:0.65rem;transition:background 0.2s}
.ragina-t4-copy-btn:hover{background:rgba(255,255,255,0.2)}
.ragina-t4-toast{position:fixed;bottom:100px;${side}background:${primary};color:white;padding:8px 16px;border-radius:20px;font-size:0.8rem;z-index:100000;animation:ragina-fade-in 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.ragina-t4-session-menu{position:absolute;top:44px;right:12px;background:${bg};border:1px solid ${borderCol};border-radius:12px;padding:6px;min-width:180px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:100001;display:none;max-height:300px;overflow-y:auto}
.ragina-t4-session-menu.show{display:block}
.ragina-t4-session-item{padding:8px 12px;border-radius:8px;cursor:pointer;font-size:0.78rem;transition:background 0.15s;display:flex;justify-content:space-between;align-items:center}
.ragina-t4-session-item:hover{background:rgba(${rgb},0.1)}
.ragina-t4-session-item.active{background:rgba(${rgb},0.15);font-weight:600}
.ragina-t4-session-delete{background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:12px;opacity:0;transition:opacity 0.2s}
.ragina-t4-session-item:hover .ragina-t4-session-delete{opacity:1}
.ragina-t4-vision-status{display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(0,191,166,0.1);border:1px solid rgba(0,191,166,0.2);border-radius:8px;font-size:0.7rem;color:#00BFA6;margin-bottom:8px;animation:ragina-fade-in 0.3s ease}
.ragina-t4-vision-status.hidden{display:none}
.ragina-t4-lang-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(255,255,255,0.15);border-radius:10px;font-size:0.6rem;color:white;margin-left:8px}
.ragina-t4-os-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(0,191,166,0.3);border-radius:10px;font-size:0.6rem;color:#00BFA6;margin-left:4px;font-weight:700}
.ragina-t4-local-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(255,193,7,0.3);border-radius:10px;font-size:0.6rem;color:#FFC107;margin-left:4px;font-weight:700}
`;
      const styleEl = document.createElement('style');
      styleEl.id = 'ragina-t4-styles';
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    build() {
      if (!hasDOM) return;
      this.injectStyles();

      const bubbleIcon = this.config.avatarUrl
        ? `<img src="${this.config.avatarUrl}" alt="RAGina">`
        : (this.config.bubbleIcon || '🛸');

      this.elements.bubble = document.createElement('button');
      this.elements.bubble.className = 'ragina-t4-bubble';
      this.elements.bubble.title = this.config.title || 'RAGina T4 XENO';
      this.elements.bubble.innerHTML = bubbleIcon;
      document.body.appendChild(this.elements.bubble);

      this.elements.panel = document.createElement('div');
      this.elements.panel.className = 'ragina-t4-panel hidden';
      this.elements.panel.innerHTML = `
        <div class="ragina-t4-header">
          <div class="ragina-t4-avatar" id="ragina-avatar">🔮</div>
          <div class="ragina-t4-header-info">
            <div class="ragina-t4-header-name">${this.config.title || 'RAGina T4 XENO'}<span class="ragina-t4-lang-badge" id="lang-badge">EN</span><span class="ragina-t4-os-badge" id="os-badge">🌐 OS</span><span class="ragina-t4-local-badge" id="local-badge" style="display:none">🧠 Local</span></div>
            <div class="ragina-t4-header-status"><span class="ragina-t4-status-dot"></span>XENO — v${VERSION}</div>
          </div>
          <div class="ragina-t4-header-actions">
            <button class="ragina-t4-header-btn" data-action="vision" title="Toggle Vision">👁️</button>
            <button class="ragina-t4-header-btn" data-action="newchat" title="New Chat">✨</button>
            <button class="ragina-t4-header-btn" data-action="sessions" title="Sessions">💬</button>
            <button class="ragina-t4-header-btn" data-action="theme" title="Theme">🎨</button>
            <button class="ragina-t4-header-btn" data-action="export" title="Export">📥</button>
            <button class="ragina-t4-header-btn" data-action="clear" title="Clear">🗑️</button>
            <button class="ragina-t4-header-btn" data-action="close" title="Close">✕</button>
          </div>
          <div class="ragina-t4-session-menu"></div>
        </div>
        <div class="ragina-t4-vision-preview" id="vision-preview">
          <div class="ragina-t4-vision-badge">● LIVE</div>
        </div>
        <div class="ragina-t4-toolbar">
          <button class="ragina-t4-toolbar-btn" data-action="upload">📎 Upload</button>
          <button class="ragina-t4-toolbar-btn" data-action="capture">📷 Capture</button>
          <button class="ragina-t4-toolbar-btn" data-action="voice">🎤 Voice</button>
          <button class="ragina-t4-toolbar-btn" data-action="openfolder">📂 Open Folder</button>
          <span style="margin-left:auto;font-size:0.65rem;opacity:0.5">${this.config.model || 'openai'}</span>
        </div>
        <div class="ragina-t4-vision-status hidden" id="vision-status"></div>
        <div class="ragina-t4-messages"></div>
        <div class="ragina-t4-input-area">
          <div class="ragina-t4-upload-area" data-action="dropzone">
            <span>📁 Drop files here or click to upload (PDF, DOCX, TXT, CSV, JSON, MD, HTML, Images)</span>
            <input type="file" multiple accept=".pdf,.docx,.txt,.csv,.json,.md,.html,.png,.jpg,.jpeg,.webp" style="display:none">
          </div>
          <div class="ragina-t4-input-row">
            <input class="ragina-t4-input" placeholder="${this.config.placeholder || 'Ask me anything...'}" type="text">
            <button class="ragina-t4-send">➤</button>
          </div>
        </div>
      `;
      document.body.appendChild(this.elements.panel);

      this.elements.messages = this.elements.panel.querySelector('.ragina-t4-messages');
      this.elements.input = this.elements.panel.querySelector('.ragina-t4-input');
      this.elements.sendBtn = this.elements.panel.querySelector('.ragina-t4-send');
      this.elements.sessionMenu = this.elements.panel.querySelector('.ragina-t4-session-menu');
      this.elements.dropzone = this.elements.panel.querySelector('[data-action="dropzone"]');
      this.elements.fileInput = this.elements.dropzone.querySelector('input');
      this.elements.visionPreview = this.elements.panel.querySelector('#vision-preview');
      this.elements.visionStatus = this.elements.panel.querySelector('#vision-status');
      this.elements.avatar = this.elements.panel.querySelector('#ragina-avatar');
      this.elements.langBadge = this.elements.panel.querySelector('#lang-badge');
      this.elements.osBadge = this.elements.panel.querySelector('#os-badge');
      this.elements.localBadge = this.elements.panel.querySelector('#local-badge');

      // Event listeners
      this.elements.bubble.addEventListener('click', () => this.toggle());
      this.elements.panel.querySelector('[data-action="close"]').addEventListener('click', () => this.hide());
      this.elements.panel.querySelector('[data-action="newchat"]').addEventListener('click', () => this.newSession());
      this.elements.panel.querySelector('[data-action="sessions"]').addEventListener('click', () => this.toggleSessionMenu());
      this.elements.panel.querySelector('[data-action="theme"]').addEventListener('click', () => this.toggleTheme());
      this.elements.panel.querySelector('[data-action="export"]').addEventListener('click', () => this.exportChat());
      this.elements.panel.querySelector('[data-action="clear"]').addEventListener('click', () => this.clearMessages());
      this.elements.panel.querySelector('[data-action="vision"]').addEventListener('click', () => this.toggleVision());
      this.elements.panel.querySelector('[data-action="upload"]').addEventListener('click', () => this.elements.fileInput.click());
      this.elements.panel.querySelector('[data-action="capture"]').addEventListener('click', () => this.captureFromCamera());
      this.elements.panel.querySelector('[data-action="voice"]').addEventListener('click', () => this.toggleVoiceInput());
      this.elements.panel.querySelector('[data-action="openfolder"]').addEventListener('click', () => this.openFolder());
      this.elements.sendBtn.addEventListener('click', () => this.handleSend());
      this.elements.input.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSend(); }
      });

      this.elements.dropzone.addEventListener('click', () => this.elements.fileInput.click());
      this.elements.fileInput.addEventListener('change', e => this.handleFiles(e.target.files));
      this.elements.dropzone.addEventListener('dragover', e => { e.preventDefault(); this.elements.dropzone.classList.add('dragover'); });
      this.elements.dropzone.addEventListener('dragleave', () => this.elements.dropzone.classList.remove('dragover'));
      this.elements.dropzone.addEventListener('drop', e => {
        e.preventDefault();
        this.elements.dropzone.classList.remove('dragover');
        this.handleFiles(e.dataTransfer.files);
      });

      if (this.vision) {
        this.vision.events.on('vision:gesture', (data) => this.onVisionGesture(data));
        this.vision.events.on('vision:expression', (data) => this.onVisionExpression(data));
        this.vision.events.on('vision:status', (data) => this.onVisionStatus(data));
        this.vision.events.on('vision:error', (data) => {
          this._toast(`Vision error: ${data.error}`);
        });
      }

      // OS bridge events
      if (window.RAGina?.os) {
        window.RAGina.os.events.on('os:ready', () => {
          if (this.elements.osBadge) this.elements.osBadge.textContent = '🌐 OS Ready';
        });
        window.RAGina.os.events.on('os:directory-opened', (data) => {
          this._toast(`📂 Opened folder: ${data.name} (${data.files} files)`);
        });
      }

      this.loadSession(this.sessionId);
      if (this.messages.length === 0) {
        const mix = this.currentMix;
        const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
        this.addMessage(pick(phrases), 'ai');
      }
    }

    toggle() { this.elements.panel.classList.toggle('hidden'); if (!this.elements.panel.classList.contains('hidden')) this.elements.input.focus(); }
    hide() { this.elements.panel.classList.add('hidden'); }
    show() { this.elements.panel.classList.remove('hidden'); this.elements.input.focus(); }

    updateLangBadge(mix) {
      if (!this.elements.langBadge) return;
      const labels = { english: 'EN', hinglish: 'HI+EN', tenglish: 'TE+EN', chatty: 'SLANG' };
      this.elements.langBadge.textContent = labels[mix] || 'EN';
    }

    updateOSBadge(connected) {
      if (this.elements.osBadge) {
        this.elements.osBadge.textContent = connected ? '🌐 OS' : '⚠️ OS';
        this.elements.osBadge.style.opacity = connected ? '1' : '0.5';
      }
    }

    // ─── Vision Methods ──────────────────────────────────────────────────
    async toggleVision() {
      const btn = this.elements.panel.querySelector('[data-action="vision"]');
      if (!this.visionEnabled) {
        try {
          btn.classList.add('active');
          this.elements.bubble.classList.add('vision-active');
          await this.vision.start();
          this.visionEnabled = true;
          this.elements.visionPreview.classList.add('active');
          if (this.vision.video) this.elements.visionPreview.insertBefore(this.vision.video, this.elements.visionPreview.firstChild);
          if (this.vision.canvas) this.elements.visionPreview.appendChild(this.vision.canvas);
          this.elements.avatar.classList.add('eye-active');
          const mix = this.currentMix;
          const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
          this._toast(pick(phrases));
          this.addMessage('👁️ Vision activated! I can see your face, expressions, and hand gestures.', 'ai');
        } catch (e) {
          btn.classList.remove('active');
          this.elements.bubble.classList.remove('vision-active');
          this._toast(`Camera failed: ${e.message}`);
        }
      } else {
        this.vision.stop();
        this.visionEnabled = false;
        btn.classList.remove('active');
        this.elements.bubble.classList.remove('vision-active');
        this.elements.visionPreview.classList.remove('active');
        this.elements.avatar.classList.remove('eye-active');
        this.elements.visionStatus.classList.add('hidden');
        this._toast('Vision deactivated');
      }
    }

    onVisionGesture(data) {
      const { gesture } = data;
      const mix = this.currentMix;
      if (PHRASES.gesture[gesture]) {
        const msg = pick(PHRASES.gesture[gesture][mix] || PHRASES.gesture[gesture].english);
        this.addMessage(msg, 'ai', { visionMeta: { type: 'gesture', gesture } });
      }
      this.updateVisionStatus();
    }

    onVisionExpression(data) {
      const { expression } = data;
      const mix = this.currentMix;
      if (PHRASES.expression[expression] && Math.random() > 0.6) {
        const msg = pick(PHRASES.expression[expression][mix] || PHRASES.expression[expression].english);
        this.addMessage(msg, 'ai', { visionMeta: { type: 'expression', expression } });
      }
      this.updateVisionStatus();
    }

    onVisionStatus(data) { this.updateVisionStatus(); }

    updateVisionStatus() {
      if (!this.visionEnabled) return;
      const r = this.vision.getReport();
      const parts = [];
      if (r.faceCount > 0) parts.push(`${r.faceCount} face${r.faceCount > 1 ? 's' : ''}`);
      if (r.expression) parts.push(r.expression);
      if (r.handCount > 0) parts.push(`${r.handCount} hand${r.handCount > 1 ? 's' : ''}`);
      if (r.gesture) parts.push(r.gesture.replace(/_/g, ' '));
      if (parts.length > 0) {
        this.elements.visionStatus.textContent = '👁️ ' + parts.join(' • ');
        this.elements.visionStatus.classList.remove('hidden');
      } else {
        this.elements.visionStatus.classList.add('hidden');
      }
    }

    async captureFromCamera() {
      if (!this.visionEnabled) { this._toast('Enable vision first!'); return; }
      const frame = this.vision.captureFrame();
      if (!frame) return;
      this.addMessage('📷 Captured frame from camera. Analyzing...', 'ai');
      this.addMessage('I captured the frame but could not analyze it in this simulation.', 'ai');
    }

    toggleVoiceInput() {
      if (!hasDOM) return;
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        this._toast('Voice input not supported in this browser');
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        this.elements.input.value = transcript;
        this.handleSend();
      };
      rec.onerror = (e) => this._toast(`Voice error: ${e.error}`);
      rec.start();
      this._toast('🎤 Listening...');
    }

    async openFolder() {
      if (!window.RAGina?.os) {
        this._toast('OSBridge not initialized.');
        return;
      }
      const result = await window.RAGina.os.pickDirectory();
      if (result.error) {
        this._toast('Folder open: ' + result.error);
        return;
      }
      this.addMessage(`📂 Opened folder "${result.dirName}" with ${result.fileCount} files. Indexing...`, 'ai');
      const data = {};
      for (const f of result.files.slice(0, 200)) {
        const c = await window.RAGina.os.readFileByPath(f.path);
        if (!c.error && c.content?.length > 20) data[f.path] = c.content;
      }
      RAGina.loadData(data);
      this.addMessage(`✅ Indexed ${Object.keys(data).length} files from "${result.dirName}".`, 'ai');
    }

    // ─── Message Methods ────────────────────────────────────────────────
    addMessage(text, who, meta = {}) {
      if (!hasDOM) return null;
      const row = document.createElement('div');
      row.className = `ragina-t4-msg ${who}`;
      row.dataset.msgId = meta.id || uuid();

      const bubble = document.createElement('div');
      bubble.className = 'ragina-t4-msg-bubble';
      if (who === 'ai' && this.config.markdown !== false) {
        let html = text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code class="ragina-t4-inline-code">$1</code>')
          .replace(/\n/g, '<br>');
        bubble.innerHTML = html;
      } else {
        bubble.textContent = text;
      }
      row.appendChild(bubble);

      const actions = document.createElement('div');
      actions.className = 'ragina-t4-msg-actions';
      if (who === 'ai') {
        actions.innerHTML = `
          <button class="ragina-t4-msg-action" data-act="copy" title="Copy">📋</button>
          <button class="ragina-t4-msg-action" data-act="regen" title="Regenerate">🔄</button>
          <button class="ragina-t4-msg-action" data-act="speak" title="Speak">🔊</button>
        `;
      } else {
        actions.innerHTML = `<button class="ragina-t4-msg-action" data-act="copy" title="Copy">📋</button>`;
      }
      actions.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const act = btn.dataset.act;
          if (act === 'copy') this._copyText(text);
          if (act === 'regen') this.regenerateMessage(row);
          if (act === 'speak') speakText(text, this.config.voiceUrl, this.config.voiceId, this.config.voiceSpeed);
        });
      });
      row.appendChild(actions);

      if (meta.sources?.length) {
        const sourcesWrap = document.createElement('div');
        sourcesWrap.className = 'ragina-t4-sources';
        const toggle = document.createElement('button');
        toggle.className = 'ragina-t4-sources-toggle';
        toggle.innerHTML = `📌 ${meta.sources.length} source${meta.sources.length > 1 ? 's' : ''} ▼`;
        const list = document.createElement('div');
        list.className = 'ragina-t4-sources-list';
        list.style.display = 'none';
        list.innerHTML = meta.sources.map((s, i) =>
          `<div class="ragina-t4-source-item">[${i+1}] ${(s.source || '').split('/').pop()} <span class="ragina-t4-source-score">(hybrid: ${(s.score || 0).toFixed(3)})</span></div>`
        ).join('');
        toggle.addEventListener('click', () => {
          list.style.display = list.style.display === 'none' ? 'block' : 'none';
          toggle.innerHTML = toggle.innerHTML.replace(list.style.display === 'none' ? '▲' : '▼', list.style.display === 'none' ? '▼' : '▲');
        });
        sourcesWrap.appendChild(toggle);
        sourcesWrap.appendChild(list);
        row.appendChild(sourcesWrap);
      }

      if (meta.toolsUsed?.length) {
        const tag = document.createElement('div');
        tag.className = 'ragina-t4-tool-tag';
        tag.textContent = '🔧 ' + meta.toolsUsed.join(' → ');
        row.appendChild(tag);
      }

      if (meta.visionMeta) {
        const vtag = document.createElement('div');
        vtag.className = 'ragina-t4-tool-tag';
        vtag.style.color = '#00BFA6';
        vtag.textContent = meta.visionMeta.type === 'gesture' ? `👋 Gesture: ${meta.visionMeta.gesture}` : `😊 Expression: ${meta.visionMeta.expression}`;
        row.appendChild(vtag);
      }

      this.elements.messages.appendChild(row);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      return row;
    }

    showTyping(label) {
      if (!hasDOM) return null;
      const row = document.createElement('div');
      row.className = 'ragina-t4-msg ai';
      row.innerHTML = `
        <div class="ragina-t4-msg-bubble">
          <div class="ragina-t4-typing"><span></span><span></span><span></span></div>
          ${label ? `<div style="font-size:0.7rem;opacity:0.6;margin-top:4px">${label}</div>` : ''}
        </div>
      `;
      this.elements.messages.appendChild(row);
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
      return row;
    }

    // ─── Language Detection ─────────────────────────────────────────────
    detectLanguage(text) {
      const t = text.toLowerCase();
      const hindiWords = ['hai', 'hain', 'kya', 'nahi', 'tha', 'thi', 'kar', 'raha', 'rahi', 'ho', 'gaya', 'gayi', 'bhi', 'bas', 'theek', 'sahi', 'galat', 'acha', 'bura', 'mast', 'yaar', 'bhai', 'scene', 'arre', 'chal', 'dekh', 'bol', 'sun'];
      const teluguWords = ['em', 'enti', 'avunu', 'kadu', 'ledu', 'undi', 'mari', 'chala', 'bagundi', 'bale', 'super', 'ante', 'inka', 'ippudu', 'tarvata', 'mama', 'anna', 'akka', 'cheppu', 'vinu', 'ardham', 'nenu', 'nuvvu', 'meeru'];
      const slangWords = ['yo', 'fam', 'bro', 'bruh', 'squad', 'vibe', 'lit', 'fire', 'dope', 'sick', 'cool', 'chill', 'lowkey', 'highkey', 'tbh', 'imo', 'ngl', 'fr', 'ong', 'cap', 'no cap', 'bet', 'slay', 'tea', 'spill', 'flex', 'sus', 'simp', 'stan', 'goat', 'cringe', 'mid', 'rizz'];
      const hindiScore = hindiWords.filter(w => t.includes(w)).length;
      const teluguScore = teluguWords.filter(w => t.includes(w)).length;
      const slangScore = slangWords.filter(w => t.includes(w)).length;
      if (teluguScore >= 2) return 'tenglish';
      if (hindiScore >= 3) return 'hinglish';
      if (slangScore >= 4) return 'chatty';
      return 'english';
    }

    getPersona(mix) {
      const base = this.config.personality === 'professional'
        ? 'You are RAGina T4 XENO, a professional AI with OS integration and vision. Use markdown. Cite sources.'
        : 'You are RAGina T4 XENO, an AI with OS superpowers. You can see, hear, read files, control devices. Use markdown, be concise, cite sources, and use tools when needed.';
      const langInstructions = {
        english: 'Reply in natural English.',
        hinglish: 'Reply in Hinglish (Hindi + English mix). Speak like a friendly Indian.',
        tenglish: 'Reply in Tenglish (Telugu + English mix). Speak like a friendly Telugu.',
        chatty: 'Reply in ultra-casual internet slang English. Use Gen Z language.'
      };
      return `${base}\n\nLANGUAGE INSTRUCTION: ${langInstructions[mix] || langInstructions.english}`;
    }

    // ─── Send / Handle Messages ─────────────────────────────────────────
    async handleSend() {
      const query = this.elements.input.value.trim();
      if (!query || !this.engine.isReady || this.isStreaming) return;
      this.elements.input.value = '';
      this.elements.sendBtn.disabled = true;
      this.addMessage(query, 'user');
      this.messages.push({ who: 'User', text: query, id: uuid() });

      // Auto-detect language
      let detectedMix = this.currentMix;
      if (this.config.autoDetectLang !== false) {
        detectedMix = this.detectLanguage(query);
        if (detectedMix !== this.currentMix) {
          this.currentMix = detectedMix;
          this.updateLangBadge(detectedMix);
        }
      }

      const expandedQuery = this.engine.expandQuery ? this.engine.expandQuery(query) : query;
      const chunks = this.engine.retrieve(expandedQuery, this.config.topK || 5);
      const contextText = chunks.length
        ? chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n')
        : 'No relevant documents found.';

      const persona = this.getPersona(this.currentMix);

      const typingRow = this.showTyping(pick(PHRASES.thinking[this.currentMix] || PHRASES.thinking.english));
      const toolsUsed = [];

      try {
        const { answer, steps } = await runAgent(query, {
          persona,
          contextText,
          history: this.messages.slice(-10),
          model: this.config.model,
          onStep: step => {
            if (step.type === 'tool_call') {
              toolsUsed.push(step.name);
              const label = typingRow?.querySelector('div[style*="font-size:0.7rem"]');
              if (label) label.textContent = `Using ${step.name}…`;
            }
          }
        });

        if (typingRow) typingRow.remove();
        this.addMessage(answer, 'ai', { sources: chunks, toolsUsed });
        this.messages.push({ who: 'RAGina', text: answer, id: uuid() });
        this.saveCurrentSession();

        if (this.config.voiceEnabled && this.config.voiceUrl) {
          speakText(answer, this.config.voiceUrl, this.config.voiceId, this.config.voiceSpeed);
        }
      } catch (e) {
        if (typingRow) typingRow.remove();
        const errMsg = pick(PHRASES.error[this.currentMix] || PHRASES.error.english) + ' ' + e.message;
        this.addMessage(errMsg, 'ai');
      }

      this.elements.sendBtn.disabled = false;
      this.elements.input.focus();
    }

    // ─── File Upload ────────────────────────────────────────────────────
    async handleFiles(fileList) {
      const files = [...fileList];
      if (!files.length) return;
      this.addMessage(`📎 Processing ${files.length} file(s)…`, 'ai');

      const data = {};
      for (const file of files) {
        try {
          const name = file.name.toLowerCase();
          let text = '';
          if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
            text = `[IMAGE: ${file.name}] — Use vision tools to analyze this image.`;
          } else if (name.endsWith('.pdf') || name.endsWith('.docx')) {
            text = `[${name.split('.').pop().toUpperCase()}: ${file.name}]\n${await file.text().slice(0, 5000)}`;
          } else {
            text = await file.text();
          }
          data[file.webkitRelativePath || file.name] = text;
        } catch (e) { console.warn('Parse error:', e); }
      }

      if (window.RAGina) {
        window.RAGina.loadData(data);
        this.addMessage(`✅ Indexed ${Object.keys(data).length} document(s). Ready to answer!`, 'ai');
        this._toast(`Indexed ${Object.keys(data).length} files.`);
      }
    }

    // ─── Session Management ────────────────────────────────────────────
    newSession() {
      this.sessionId = uuid();
      this.messages = [];
      this.elements.messages.innerHTML = '';
      this.currentMix = this.config.defaultMix || 'english';
      this.updateLangBadge(this.currentMix);
      const phrases = PHRASES.ready[this.currentMix] || PHRASES.ready.english;
      this.addMessage(pick(phrases), 'ai');
      this.saveCurrentSession();
    }

    saveCurrentSession() {
      if (this.storage) this.storage.saveSession(this.sessionId, this.messages, { title: this.config.title });
    }

    loadSession(id) {
      if (!this.storage) return;
      const all = this.storage.getSessions();
      if (all[id]?.messages) {
        this.sessionId = id;
        this.messages = all[id].messages;
        this.elements.messages.innerHTML = '';
        for (const msg of this.messages) {
          this.addMessage(msg.text, msg.who === 'User' ? 'user' : 'ai', msg.meta || {});
        }
      }
    }

    toggleSessionMenu() {
      const menu = this.elements.sessionMenu;
      const all = this.storage ? this.storage.getSessions() : {};
      const ids = Object.keys(all).sort((a, b) => (all[b].updatedAt || 0) - (all[a].updatedAt || 0));
      menu.innerHTML = ids.map(id => {
        const s = all[id];
        const firstUser = s.messages?.find(m => m.who === 'User')?.text?.slice(0, 30) || 'Untitled';
        const isActive = id === this.sessionId;
        return `<div class="ragina-t4-session-item ${isActive ? 'active' : ''}" data-sid="${id}">${firstUser}…<button class="ragina-t4-session-delete" data-del="${id}">🗑</button></div>`;
      }).join('');
      menu.classList.toggle('show');
      menu.querySelectorAll('.ragina-t4-session-item').forEach(el => {
        el.addEventListener('click', () => { this.loadSession(el.dataset.sid); menu.classList.remove('show'); });
      });
      menu.querySelectorAll('.ragina-t4-session-delete').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); this.storage.deleteSession(btn.dataset.del); this.toggleSessionMenu(); });
      });
    }

    // ─── UI Utilities ──────────────────────────────────────────────────
    toggleTheme() {
      const current = this.config.theme?.mode || 'dark';
      this.config.theme = { ...this.config.theme, mode: current === 'dark' ? 'light' : 'dark' };
      const old = document.getElementById('ragina-t4-styles');
      if (old) old.remove();
      this.injectStyles();
    }

    exportChat() {
      const exportData = { version: VERSION, exportedAt: new Date().toISOString(), messages: this.messages };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ragina-chat-${this.sessionId.slice(0,8)}.json`;
      a.click(); URL.revokeObjectURL(url);
      this._toast('Chat exported!');
    }

    clearMessages() {
      this.messages = [];
      this.elements.messages.innerHTML = '';
      const phrases = PHRASES.ready[this.currentMix] || PHRASES.ready.english;
      this.addMessage(pick(phrases), 'ai');
      this.saveCurrentSession();
    }

    regenerateMessage(row) {
      const idx = [...this.elements.messages.children].indexOf(row);
      if (idx <= 0) return;
      const userMsg = this.messages[idx - 1];
      if (userMsg?.who !== 'User') return;
      row.remove();
      this.messages = this.messages.slice(0, idx);
      this.elements.input.value = userMsg.text;
      this.handleSend();
    }

    _copyText(text) {
      if (!hasDOM) return;
      navigator.clipboard.writeText(text).then(() => this._toast('Copied!'));
    }

    _toast(msg) {
      if (!hasDOM) return;
      const t = document.createElement('div');
      t.className = 'ragina-t4-toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2000);
    }
  }

  // ─── SPEECH (TTS) ─────────────────────────────────────────────────────
  function speakText(text, voiceUrl, voiceId, speed) {
    if (!voiceUrl || !hasDOM) return;
    const clean = text.replace(/[#*`\[\]_]/g, '').slice(0, 4000);
    fetch(voiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, voice_id: voiceId || 'rachel', speed: speed || 1 })
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
      })
      .catch(console.error);
  }

  // ─── TOOLS REGISTRATION ──────────────────────────────────────────────
  // All tools from T1/T2/T3 plus XENO tools.

  // ---- Core T1/T2/T3 tools ----
  registerTool('webSearch', {
    description: 'Search Wikipedia and the web for facts, people, events, or any topic',
    parameters: { query: 'string, the search query' },
    handler: async ({ query }) => {
      try {
        const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=3&search=' + encodeURIComponent(query);
        const wikiRes = await fetch(wikiUrl);
        const wikiData = await wikiRes.json();
        const titles = wikiData[1] || [];
        const descriptions = wikiData[2] || [];
        const urls = wikiData[3] || [];
        if (titles.length === 0) {
          const ddgRes = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1');
          const ddgData = await ddgRes.json();
          if (ddgData.Abstract) {
            return { source: 'DuckDuckGo', title: ddgData.Heading || query, summary: ddgData.Abstract, url: ddgData.AbstractURL };
          }
          return { error: 'No results found for "' + query + '".' };
        }
        return { source: 'Wikipedia', results: titles.map((title, i) => ({ title, summary: descriptions[i] || 'No description available.', url: urls[i] })) };
      } catch (e) { return { error: 'Search failed: ' + e.message }; }
    }
  });

  registerTool('scheduleEvent', {
    description: 'Open Google Calendar with a pre-filled event (title, date, time, duration)',
    parameters: { title: 'string', date: 'string like "2026-08-25" or "tomorrow"', time: 'string like "15:00" (optional)', duration: 'number minutes (default 60)', location: 'string (optional)', description: 'string (optional)' },
    handler: async ({ title, date, time, duration, location, description }) => {
      title = title || 'Event'; duration = duration || 60;
      let startDT = null;
      try {
        if (date) {
          if (/tomorrow/i.test(date)) { startDT = new Date(); startDT.setDate(startDT.getDate() + 1); }
          else if (/today/i.test(date)) { startDT = new Date(); }
          else { startDT = new Date(date + (time ? ' ' + time : '')); }
          if (time && !isNaN(startDT.getTime())) {
            const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
            if (timeMatch) {
              let h = parseInt(timeMatch[1]); const m = timeMatch[2] || 0; const ap = (timeMatch[3] || '').toLowerCase().replace(/\./g, '');
              if (ap === 'pm' && h < 12) h += 12; if (ap === 'am' && h === 12) h = 0;
              startDT.setHours(h, parseInt(m), 0, 0);
            }
          }
        }
      } catch (e) {}
      if (!startDT || isNaN(startDT.getTime())) { startDT = new Date(); startDT.setDate(startDT.getDate() + 1); startDT.setHours(10,0,0,0); }
      const endDT = new Date(startDT.getTime() + duration * 60000);
      const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
      const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(title) +
        '&dates=' + fmt(startDT) + '/' + fmt(endDT) +
        (location ? '&location=' + encodeURIComponent(location) : '') +
        (description ? '&details=' + encodeURIComponent(description) : '');
      const opened = safeOpen(url);
      return { success: opened, title, start: startDT.toLocaleString(), end: endDT.toLocaleString(), location: location || '—', url };
    }
  });

  registerTool('draftEmail', {
    description: 'Open the default email client with a pre-filled draft',
    parameters: { to: 'string', subject: 'string', body: 'string', cc: 'string (optional)' },
    handler: async ({ to, subject, body, cc }) => {
      let url = 'mailto:' + encodeURIComponent(to || '');
      const q = [];
      if (subject) q.push('subject=' + encodeURIComponent(subject));
      if (body) q.push('body=' + encodeURIComponent(body));
      if (cc) q.push('cc=' + encodeURIComponent(cc));
      if (q.length) url += '?' + q.join('&');
      const opened = safeOpen(url, '_self');
      return { success: opened, to: to || '(no recipient)', subject: subject || '(no subject)',
        bodyPreview: body ? (body.length > 120 ? body.slice(0,120)+'…' : body) : '' };
    }
  });

  registerTool('getTime', {
    description: 'Get the current local date and time',
    parameters: {},
    handler: async () => ({ time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(), iso: new Date().toISOString() })
  });

  registerTool('calculate', {
    description: 'Evaluate a math expression like "2 + 2 * 3" or "sqrt(144)"',
    parameters: { expression: 'string, a math expression' },
    handler: async ({ expression }) => {
      try {
        const safe = expression.replace(/[^0-9+\-*/().%\s,sqrt,pow,abs,Math]/g, '');
        const result = new Function('return ' + safe)();
        return { expression, result };
      } catch (e) { return { error: 'Invalid expression: ' + e.message }; }
    }
  });

  registerTool('openUrl', {
    description: 'Open a URL in a new browser tab',
    parameters: { url: 'string, the URL to open' },
    handler: async ({ url }) => {
      const opened = safeOpen(url);
      return { opened, url };
    }
  });

  registerTool('codeRunner', {
    description: 'Execute JavaScript code safely and return the result',
    parameters: { code: 'string, JavaScript code to execute' },
    handler: async ({ code }) => {
      try {
        const sandbox = {};
        const fn = new Function('sandbox', `with(sandbox) { const console = { log: (...a) => a.join(' ') }; ${code} }`);
        const result = fn(sandbox);
        return { result: result !== undefined ? result : '(no return value)', code: code.slice(0,200) };
      } catch (e) { return { error: e.message, code: code.slice(0,200) }; }
    }
  });

  registerTool('generateFile', {
    description: 'Generate a downloadable file with given content (txt, json, csv, md, html)',
    parameters: { filename: 'string, e.g. report.csv', content: 'string, file contents', mimeType: 'string (optional)' },
    handler: async ({ filename, content, mimeType }) => {
      if (!hasDOM) return { error: 'File generation requires a DOM environment.' };
      const type = mimeType || 'text/plain';
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'download.txt';
      a.click(); URL.revokeObjectURL(url);
      return { success: true, filename: filename || 'download.txt', size: content.length };
    }
  });

  registerTool('extractFromUrl', {
    description: 'Fetch and extract text content from any URL',
    parameters: { url: 'string, URL to fetch' },
    handler: async ({ url }) => {
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent || '';
        doc.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());
        const bodyText = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 8000);
        return { title, url, content: bodyText, length: bodyText.length };
      } catch (e) { return { error: 'Fetch failed: ' + e.message, url }; }
    }
  });

  registerTool('translate', {
    description: 'Translate text from one language to another using a free translation API',
    parameters: { text: 'string, text to translate', targetLang: 'string, target language code like "es", "fr", "de", "ja"', sourceLang: 'string (optional, default "auto")' },
    handler: async ({ text, targetLang, sourceLang }) => {
      try {
        const tl = (targetLang || 'en').toLowerCase().trim();
        const sl = (sourceLang || 'auto').toLowerCase().trim();
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.responseData?.translatedText) {
          return { original: text, translated: data.responseData.translatedText, sourceLang: data.responseData.detectedLanguage || sl, targetLang: tl, confidence: data.responseStatus === 200 ? 'high' : 'low' };
        }
        return { error: 'Translation failed: ' + (data.responseDetails || 'Unknown error') };
      } catch (e) { return { error: 'Translation error: ' + e.message }; }
    }
  });

  registerTool('summarizeDoc', {
    description: 'Summarize a long document or text into key bullet points',
    parameters: { text: 'string, the document text to summarize', sentences: 'number, max summary sentences (default 3)' },
    handler: async ({ text, sentences }) => {
      const n = Math.max(1, Math.min(parseInt(sentences) || 3, 10));
      const sents = (text || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
      if (sents.length <= n) return { summary: sents.join(' '), method: 'short-doc', sentences: sents.length };
      const wordScores = {};
      const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
      for (const w of words) wordScores[w] = (wordScores[w] || 0) + 1;
      const scored = sents.map(s => {
        const w = s.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const score = w.reduce((a, b) => a + (wordScores[b] || 0), 0) / (w.length || 1);
        return { sent: s, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, n).sort((a, b) => sents.indexOf(a.sent) - sents.indexOf(b.sent));
      return { summary: top.map(x => x.sent).join(' '), method: 'extractive-tfidf', sentences: n };
    }
  });

  registerTool('compareDocs', {
    description: 'Compare two texts and highlight differences, similarities, and unique content',
    parameters: { docA: 'string, first document', docB: 'string, second document' },
    handler: async ({ docA, docB }) => {
      const a = (docA || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const b = (docB || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const setA = new Set(a.split(/\W+/).filter(w => w.length > 3));
      const setB = new Set(b.split(/\W+/).filter(w => w.length > 3));
      const common = [...setA].filter(w => setB.has(w));
      const onlyA = [...setA].filter(w => !setB.has(w));
      const onlyB = [...setB].filter(w => !setA.has(w));
      const jaccard = common.length / (setA.size + setB.size - common.length || 1);
      return { similarityScore: Math.round(jaccard * 100) + '%', commonWords: common.slice(0,20), uniqueToA: onlyA.slice(0,20), uniqueToB: onlyB.slice(0,20), wordCountA: a.split(/\s+/).length, wordCountB: b.split(/\s+/).length };
    }
  });

  registerTool('remember', {
    description: 'Store a fact, preference, or note in long-term memory for future sessions',
    parameters: { key: 'string, memory key', value: 'string, memory value', category: 'string (optional, e.g. "user", "project", "preference")' },
    handler: async ({ key, value, category }) => {
      const storage = new StorageManager();
      const ltm = storage.getLongTermMemory();
      const cat = category || 'general';
      if (!ltm[cat]) ltm[cat] = {};
      ltm[cat][key] = { value, storedAt: Date.now() };
      storage.saveLongTermMemory(ltm);
      return { success: true, key, category: cat, stored: value };
    }
  });

  registerTool('recall', {
    description: 'Retrieve a stored memory by key or category from long-term memory',
    parameters: { key: 'string (optional)', category: 'string (optional)', fuzzy: 'boolean (default true)' },
    handler: async ({ key, category, fuzzy }) => {
      const storage = new StorageManager();
      const ltm = storage.getLongTermMemory();
      const useFuzzy = fuzzy !== false;
      if (category && ltm[category]) {
        if (key) {
          const entries = Object.entries(ltm[category]);
          if (useFuzzy) {
            const match = entries.find(([k]) => k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase()));
            if (match) return { found: true, key: match[0], value: match[1].value, storedAt: match[1].storedAt };
          } else if (ltm[category][key]) {
            return { found: true, key, value: ltm[category][key].value, storedAt: ltm[category][key].storedAt };
          }
          return { found: false, category, searchedKey: key, availableKeys: Object.keys(ltm[category]) };
        }
        return { found: true, category, entries: ltm[category] };
      }
      if (key && useFuzzy) {
        for (const [cat, items] of Object.entries(ltm)) {
          const match = Object.entries(items).find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
          if (match) return { found: true, category: cat, key: match[0], value: match[1].value };
        }
      }
      return { found: false, memory: ltm };
    }
  });

  registerTool('weather', {
    description: 'Get current weather for a city using wttr.in',
    parameters: { city: 'string, city name', format: 'string (optional, "json" or "text", default "json")' },
    handler: async ({ city, format }) => {
      try {
        const fmt = (format || 'json').toLowerCase();
        const url = `https://wttr.in/${encodeURIComponent(city || 'London')}?format=j1`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const current = data.current_condition?.[0];
        if (!current) return { error: 'Weather data unavailable.' };
        const out = { location: data.nearest_area?.[0]?.areaName?.[0]?.value || city, tempC: current.temp_C, tempF: current.temp_F, condition: current.weatherDesc?.[0]?.value || 'Unknown', humidity: current.humidity, wind: `${current.windspeedKmph} km/h ${current.winddir16Point}`, feelsLikeC: current.FeelsLikeC, visibility: current.visibility, uvIndex: current.uvIndex, observationTime: current.observation_time };
        if (fmt === 'text') {
          return { text: `🌤 ${out.location}: ${out.condition}, ${out.tempC}°C (feels like ${out.feelsLikeC}°C). Humidity ${out.humidity}%, wind ${out.wind}.`, ...out };
        }
        return out;
      } catch (e) { return { error: 'Weather fetch failed: ' + e.message }; }
    }
  });

  registerTool('stockPrice', {
    description: 'Get the latest stock price and change for a ticker symbol',
    parameters: { ticker: 'string, e.g. "AAPL", "TSLA", "MSFT"' },
    handler: async ({ ticker }) => {
      try {
        const sym = (ticker || 'AAPL').toUpperCase().trim();
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const result = data.chart?.result?.[0];
        if (!result) return { error: `No data for ticker "${sym}".` };
        const meta = result.meta;
        const prevClose = meta.previousClose || meta.chartPreviousClose || 0;
        const last = meta.regularMarketPrice || prevClose;
        const change = last - prevClose;
        const pct = prevClose ? ((change / prevClose) * 100).toFixed(2) : '0.00';
        return { ticker: sym, price: last.toFixed(2), currency: meta.currency || 'USD', change: change.toFixed(2), changePercent: pct + '%', previousClose: prevClose.toFixed(2), marketState: meta.instrumentType || 'EQUITY', exchange: meta.exchangeName || 'Unknown' };
      } catch (e) { return { error: 'Stock fetch failed: ' + e.message }; }
    }
  });

  registerTool('analyzeCSV', {
    description: 'Parse CSV text and return structured stats: columns, row count, numeric summaries',
    parameters: { csvText: 'string, raw CSV content', hasHeader: 'boolean (default true)' },
    handler: async ({ csvText, hasHeader }) => {
      const lines = (csvText || '').split('\n').filter(l => l.trim());
      if (lines.length === 0) return { error: 'Empty CSV.' };
      const useHeader = hasHeader !== false;
      const header = useHeader ? lines[0].split(',').map(h => h.trim()) : lines[0].split(',').map((_, i) => `col${i+1}`);
      const rows = useHeader ? lines.slice(1) : lines;
      const parsed = rows.map(r => {
        const cols = []; let inQuotes = false, val = '';
        for (const ch of r) {
          if (ch === '"') { inQuotes = !inQuotes; continue; }
          if (ch === ',' && !inQuotes) { cols.push(val.trim()); val = ''; continue; }
          val += ch;
        }
        cols.push(val.trim());
        return cols;
      });
      const stats = {};
      for (let i = 0; i < header.length; i++) {
        const vals = parsed.map(r => r[i]).filter(v => v !== undefined && v !== '');
        const nums = vals.map(v => parseFloat(v)).filter(n => !isNaN(n));
        stats[header[i]] = { nonEmpty: vals.length, numericCount: nums.length, min: nums.length ? Math.min(...nums) : null, max: nums.length ? Math.max(...nums) : null, avg: nums.length ? (nums.reduce((a,b) => a+b,0) / nums.length).toFixed(2) : null, sample: vals.slice(0,3) };
      }
      return { columns: header, rowCount: parsed.length, stats };
    }
  });

  registerTool('createChart', {
    description: 'Generate a simple HTML chart (bar, line, pie) from data and open it in a new tab',
    parameters: { type: 'string, "bar", "line", or "pie"', labels: 'array of strings', data: 'array of numbers', title: 'string (optional)', colors: 'array of strings (optional)' },
    handler: async ({ type, labels, data, title, colors }) => {
      if (!hasDOM) return { error: 'Chart creation requires a DOM environment.' };
      const chartType = ['bar','line','pie'].includes(type) ? type : 'bar';
      const lbls = Array.isArray(labels) ? labels : [];
      const vals = Array.isArray(data) ? data : [];
      const defaultColors = ['#6C63FF','#00BFA6','#F50057','#FFAB00','#2979FF','#00E676','#FF5252','#651FFF'];
      const cols = Array.isArray(colors) ? colors : defaultColors;
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Chart'}</title><script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script><style>body{font-family:system-ui,sans-serif;background:#0f0f1a;color:#ddd;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.container{width:90vw;max-width:800px}</style></head><body><div class="container"><canvas id="c"></canvas></div><script>const ctx=document.getElementById('c').getContext('2d');new Chart(ctx,{type:'${chartType}',data:{labels:${JSON.stringify(lbls)},datasets:[{label:'${title || 'Data'}',data:${JSON.stringify(vals)},backgroundColor:${JSON.stringify(cols.slice(0, vals.length))},borderColor:${JSON.stringify(cols.slice(0, vals.length))},borderWidth:2}]},options:{responsive:true,plugins:{title:{display:true,text:'${title || 'Chart'}'}}}});<\/script></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const opened = safeOpen(url);
      return { success: opened, chartType, labels: lbls, values: vals, opened: url };
    }
  });

  // ---- Vision tools ----
  registerTool('readGesture', {
    description: 'Detect the current hand gesture from the camera (thumbs_up, thumbs_down, peace, pointing, open_palm, fist, ok, call_me, etc.)',
    parameters: {},
    handler: async () => {
      const vision = window.RAGina?._visionEngine;
      if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
      const report = vision.getReport();
      return { gesture: report.gesture || 'none detected', handCount: report.handCount, recentGestures: report.recentGestures, note: report.gesture ? `Detected: ${report.gesture}` : 'No clear gesture detected.' };
    }
  });

  registerTool('readExpression', {
    description: 'Analyze the facial expression from the camera (happy, sad, surprised, angry, neutral, sleepy)',
    parameters: {},
    handler: async () => {
      const vision = window.RAGina?._visionEngine;
      if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
      const report = vision.getReport();
      return { expression: report.expression || 'none detected', faceCount: report.faceCount, gaze: report.gaze, note: report.expression ? `Current expression: ${report.expression}` : 'No face detected.' };
    }
  });

  registerTool('describeScene', {
    description: 'Capture a frame from the camera and describe what is visible. Requires vision to be active.',
    parameters: { detail: 'string (optional, "low", "medium", "high")' },
    handler: async ({ detail }) => {
      const vision = window.RAGina?._visionEngine;
      if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
      const frame = vision.captureFrame();
      if (!frame) return { error: 'Could not capture frame.' };
      return { captured: true, frameSize: frame.length, detail: detail || 'medium', note: 'Frame captured. In a full implementation, this would be sent to a vision API.', facesDetected: vision.lastFaces.length, handsDetected: vision.lastHands.length, currentExpression: vision.getDominantExpression() || 'unknown', currentGesture: vision.lastHands.find(h => h.gesture !== 'unknown')?.gesture || 'none' };
    }
  });

  registerTool('countPeople', {
    description: 'Count how many faces are currently visible in the camera',
    parameters: {},
    handler: async () => {
      const vision = window.RAGina?._visionEngine;
      if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
      const report = vision.getReport();
      return { faceCount: report.faceCount, note: report.faceCount === 0 ? 'No faces detected.' : `I can see ${report.faceCount} face(s).` };
    }
  });

  registerTool('checkAttention', {
    description: 'Check if the user is looking at the camera (engaged) or looking away',
    parameters: {},
    handler: async () => {
      const vision = window.RAGina?._visionEngine;
      if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
      const gaze = vision.lastFaces[0]?.gaze || 'unknown';
      return { gaze, isLookingAtCamera: gaze === 'center', note: gaze === 'center' ? 'User is looking directly at me.' : gaze === 'unknown' ? 'Cannot determine gaze direction.' : `User is looking ${gaze}.` };
    }
  });

  // ---- XENO OS tools ----
  registerTool('openFolder', {
    description: 'Open a local folder from disk and index every file inside it recursively',
    parameters: {},
    handler: async () => {
      const os = window.RAGina?.os;
      if (!os) return { error: 'OSBridge not initialized' };
      const r = await os.pickDirectory();
      if (r.error) return r;
      const data = {};
      for (const f of r.files.slice(0, 200)) {
        const c = await os.readFileByPath(f.path);
        if (!c.error && c.content?.length > 20) data[f.path] = c.content;
      }
      RAGina.loadData(data);
      return { indexed: Object.keys(data).length, folder: r.dirName };
    }
  });

  registerTool('writeToFile', {
    description: 'Write a file directly into the opened local folder on disk',
    parameters: { filename: 'string', content: 'string' },
    handler: ({ filename, content }) => {
      const os = window.RAGina?.os;
      return os ? os.writeFile(filename, content) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('captureScreen', {
    description: 'Take a screenshot of any screen/window/tab the user picks',
    parameters: {},
    handler: async () => {
      const os = window.RAGina?.os;
      if (!os) return { error: 'OSBridge not initialized' };
      const s = await os.captureScreen();
      if (s.error) return s;
      return { captured: true, resolution: `${s.width}x${s.height}`, note: 'Screen captured. Send through vision pipeline or attach to next query.' };
    }
  });

  registerTool('recordScreenVideo', {
    description: 'Record the screen as video for N seconds',
    parameters: { seconds: 'number default 10' },
    handler: async ({ seconds }) => {
      const os = window.RAGina?.os;
      if (!os) return { error: 'OSBridge not initialized' };
      try {
        const url = await os.recordScreen(Math.min(seconds || 10, 60));
        return { recordedUrl: url, durationSec: seconds || 10 };
      } catch (e) { return { error: e.message }; }
    }
  });

  registerTool('sendNotification', {
    description: 'Push a native OS notification',
    parameters: { title: 'string', body: 'string' },
    handler: ({ title, body }) => {
      const os = window.RAGina?.os;
      return os ? os.notify(title, body) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('getMyLocation', {
    description: 'Get GPS coordinates of the device',
    parameters: {},
    handler: () => {
      const os = window.RAGina?.os;
      return os ? os.getLocation(true) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('deviceStatus', {
    description: 'Full device telemetry: battery, network, CPU cores, GPU, capabilities',
    parameters: {},
    handler: async () => {
      const os = window.RAGina?.os;
      if (!os) return { error: 'OSBridge not initialized' };
      return { ...await os.getBattery(), ...os.getNetworkQuality(), ...await os.getGPUInfo(), system: os.statusReport() };
    }
  });

  registerTool('shareContent', {
    description: 'Open native OS share sheet (files/text/url)',
    parameters: { title: 'string', text: 'string', url: 'string' },
    handler: ({ title, text, url }) => {
      const os = window.RAGina?.os;
      return os ? os.share({ title, text, url }) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('connectArduino', {
    description: 'Connect to a serial device (Arduino/Raspberry Pi/embedded)',
    parameters: { baudRate: 'number default 115200' },
    handler: ({ baudRate }) => {
      const os = window.RAGina?.os;
      return os ? os.connectSerial(baudRate || 115200) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('serialCommand', {
    description: 'Send a command over the connected serial port',
    parameters: { command: 'string' },
    handler: ({ command }) => {
      const os = window.RAGina?.os;
      return os ? os.serialWrite(command + '\n') : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('connectBluetooth', {
    description: 'Pair with a nearby Bluetooth LE device',
    parameters: { service: 'string like battery_service' },
    handler: ({ service }) => {
      const os = window.RAGina?.os;
      return os ? os.connectBluetooth(service ? [service] : undefined) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('keepAwake', {
    description: 'Prevent the screen from sleeping',
    parameters: { on: 'boolean' },
    handler: ({ on }) => {
      const os = window.RAGina?.os;
      return os ? os.keepAwake(on !== false) : { error: 'OSBridge not initialized' };
    }
  });

  registerTool('colorPickFromScreen', {
    description: 'Native eyedropper — pick any pixel color on screen',
    parameters: {},
    handler: async () => {
      try { const c = await new EyeDropper().open(); return { hex: c.sRGBHex }; }
      catch { return { error: 'Cancelled' }; }
    }
  });

  registerTool('offlineMode', {
    description: 'Switch between cloud LLM and fully-local offline model',
    parameters: { useLocal: 'boolean' },
    handler: async ({ useLocal }) => {
      RAGina.config.useLocalLLM = !!useLocal;
      if (useLocal && !RAGina.localAI?.ready) {
        RAGina.localAI = new LocalInferenceEngine();
        return await RAGina.localAI.init(m => RAGina.ui?._toast(m));
      }
      return { mode: useLocal ? 'local' : 'cloud' };
    }
  });

  registerTool('systemCommandHint', {
    description: 'Explain how to accomplish OS-level tasks (shell, apps) that browsers sandbox',
    parameters: { task: 'string' },
    handler: async ({ task }) => ({
      task,
      note: 'Browsers run sandboxed — direct OS commands need a companion bridge.',
      bridgeOptions: [
        '1. Install companion app: ragina-bridge (Electron/Tauri) exposing localhost:7777',
        '2. Then tools like shell_exec become available'
      ],
      suggestion: `For "${task}", I can draft the exact commands/scripts for you to run.`
    })
  });

  // ---- Native Bridge tools (auto-registered when bridge is detected) ----

  // ─── PUBLIC API ────────────────────────────────────────────────────────
  const RAGina = {
    engine: null,
    ui: null,
    config: {},
    storage: null,
    events: null,
    os: null,
    vectorStore: null,
    localAI: null,
    _visionEngine: null,
    version: VERSION,

    init(userConfig = {}) {
      this.config = deepMerge({
        indexUrl: null,
        position: 'bottom-right',
        placeholder: 'Ask me anything...',
        topK: 5,
        model: 'openai',
        avatarUrl: 'https://ragina-crawler-ragina.vercel.app/ragina-logo.png',
        bubbleIcon: null,
        title: 'RAGina T4 XENO',
        personality: 'sassy',
        theme: { primary: '#6C63FF', mode: 'dark' },
        chunkSize: 200,
        voiceEnabled: false,
        voiceUrl: null,
        voiceId: 'rachel',
        voiceSpeed: 1,
        showWidget: true,
        streaming: true,
        markdown: true,
        apiUrl: 'https://ragina-crawler-ragina.vercel.app/api/ask',
        streamUrl: 'https://ragina-crawler-ragina.vercel.app/api/ask/stream',
        semanticWeight: 0.5,
        embedDim: 128,
        proactiveVision: true,
        gestureActions: true,
        autoDetectLang: true,
        defaultMix: 'english',
        useLocalLLM: false,
        enableOSBridge: true,
        enableNativeBridgeAuto: true
      }, userConfig);

      this.storage = new StorageManager();
      this.events = new EventBus();
      this.engine = new HybridRetrievalEngine({
        chunkSize: this.config.chunkSize,
        semanticWeight: this.config.semanticWeight,
        embedDim: this.config.embedDim
      });

      // OS Bridge
      if (this.config.enableOSBridge && hasDOM) {
        this.os = new OSBridge(this.events);
      }

      // Vector Store (lazy)
      if (hasDOM) {
        this.vectorStore = new VectorStore();
        this.vectorStore.open().then(() => {
          this.events.emit('xeno:vectorstore-ready');
        });
      }

      // Local AI (lazy)
      this.localAI = null;

      // Vision engine (lazy)
      this._visionEngine = null;

      const buildUI = () => {
        if (this.config.showWidget && hasDOM) {
          this.ui = new ChatWidget(
            this.engine,
            this.config,
            this.storage,
            this.events,
            this._visionEngine,
            null
          );
          this.ui.build();
        }
      };

      // Auto-init Native Bridge
      if (this.config.enableNativeBridgeAuto && hasDOM) {
        initNativeBridge().then(ok => {
          if (ok) this.events.emit('xeno:native-online');
        });
      }

      // Wake lock during active conversations
      this.events.on('chat:active', () => {
        if (this.os) this.os.keepAwake(true);
      });

      // Network-aware offline mode
      if (hasDOM) {
        window.addEventListener('offline', () => {
          this.config.useLocalLLM = true;
          this.events.emit('xeno:offline-mode');
          if (this.ui) this.ui._toast('📡 Offline — switching to local AI.');
        });
      }

      // Load index
      if (e.__RAGINA_INDEX__ && typeof e.__RAGINA_INDEX__ === 'object' && Object.keys(e.__RAGINA_INDEX__).length) {
        this.engine.buildIndex(e.__RAGINA_INDEX__);
        buildUI();
        if (this.ui) this.ui.show();
        console.log('🚀 RAGina T4 XENO initialized with pre-loaded index');
        return;
      }

      if (this.config.indexUrl) {
        fetch(this.config.indexUrl)
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
          .then(data => {
            this.engine.buildIndex(data);
            buildUI();
            if (this.ui) this.ui.show();
            console.log('🚀 RAGina T4 XENO initialized from URL:', this.config.indexUrl);
          })
          .catch(err => {
            console.warn('⚠️ RAGina: could not load index from URL.', err.message);
            buildUI();
          });
      } else {
        buildUI();
        console.log('🚀 RAGina T4 XENO initialized (no index loaded)');
      }
    },

    loadData(data) {
      if (!this.engine) this.engine = new HybridRetrievalEngine({ chunkSize: this.config.chunkSize || 200 });
      const count = this.engine.buildIndex(data);

      if (hasDOM && this.ui) {
        this.ui.elements.messages.innerHTML = '';
        this.ui.elements.input.disabled = false;
        if (this.ui.elements.sendBtn) this.ui.elements.sendBtn.disabled = false;
        const mix = this.ui.currentMix || 'english';
        const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
        this.ui.addMessage(pick(phrases), 'ai');
      } else if (this.config.showWidget !== false && hasDOM) {
        this.ui = new ChatWidget(
          this.engine,
          this.config,
          this.storage || new StorageManager(),
          this.events || new EventBus(),
          this._visionEngine,
          null
        );
        this.ui.build();
        this.ui.show();
      }

      // Also put into vector store if available
      if (this.vectorStore && this.vectorStore.db) {
        const chunks = this.engine.chunks.map((c, i) => ({ id: i, ...c }));
        this.vectorStore.putChunks(chunks);
      }

      console.log(`📚 RAGina T4 XENO loaded ${count} chunks`);
      return count;
    },

    async loadFolder(fileList) {
      const files = [...fileList];
      const data = {};
      for (const file of files) {
        try {
          const name = file.name.toLowerCase();
          let text = '';
          if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
            text = `[IMAGE: ${file.name}] — Use vision tools to analyze this image.`;
          } else {
            text = await file.text();
          }
          data[file.webkitRelativePath || file.name] = text;
        } catch (e) { console.warn('Parse error:', e); }
      }
      this.loadData(data);
    },

    getEngine() { return this.engine; },

    ask(text) {
      if (this.ui && hasDOM) {
        this.ui.elements.input.value = text;
        this.ui.handleSend();
      }
    },

    registerTool,
    unregisterTool,
    listTools,

    on(event, fn) { return this.events.on(event, fn); },
    off(event, fn) { this.events.off(event, fn); },
    emit(event, data) { this.events.emit(event, data); },

    clearCache() { queryCache.clear(); console.log('🧹 Cache cleared'); },
    getCacheStats() { return { size: queryCache.size, keys: Array.from(queryCache.keys()) }; },

    async query(text, options = {}) {
      let contextText = options.contextText;
      if (contextText === undefined && this.engine?.isReady) {
        const query = this.engine.expandQuery ? this.engine.expandQuery(text) : text;
        const chunks = this.engine.retrieve(query, options.topK || this.config.topK || 5);
        contextText = chunks.length
          ? chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n')
          : '';
      }
      return runAgent(text, { ...options, contextText });
    }
  };

  // ─── AUTO-INIT ────────────────────────────────────────────────────────
  e.RAGina = RAGina;

  const autoInit = () => {
    if (e.__RAGINA_INDEX__ && typeof e.__RAGINA_INDEX__ === 'object' && Object.keys(e.__RAGINA_INDEX__).length) {
      RAGina.init({ ...(e.RAGINA_CONFIG || {}), indexUrl: null });
      return;
    }
    if (e.RAGINA_CONFIG) {
      RAGina.init(e.RAGINA_CONFIG);
    }
  };

  if (hasDOM) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
    // Fallback for late index
    setTimeout(() => {
      if (e.RAGina && e.__RAGINA_INDEX__ && (!e.RAGina.engine || !e.RAGina.engine.isReady)) {
        document.querySelector('.ragina-t4-bubble')?.remove();
        document.querySelector('.ragina-t4-panel')?.remove();
        RAGina.loadData(e.__RAGINA_INDEX__);
      }
    }, 500);
  } else {
    autoInit();
  }

  console.log(`🛸 RAGina-T4 XENO v${VERSION} loaded!`);
  console.log('🔧 Tools available:', listTools().join(', '));
  console.log('🌐 OS Bridge ready, Local AI optional, Vector Store persistent.');

}(typeof window !== 'undefined' ? window : this);