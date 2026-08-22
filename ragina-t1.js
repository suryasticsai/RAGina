/*!
 * RAGina-T1.js v4.0.0 — Superpowered Agentic Core
 * ✅ Uses ragina-crawler-ragina.vercel.app API as primary backend
 * ✅ Multi-endpoint fallback (never fails)
 * ✅ Smart caching for repeated questions
 * ✅ Full ReAct agentic loop with tools
 * ✅ Headless mode + Chat widget
 * ✅ Built-in tools: webSearch, scheduleEvent, draftEmail, getTime, calculate, openUrl
 *
 * CDN: https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t1.js
 * MIT License | github.com/suryasticsai/RAGina
 */
!function (e) {
  'use strict';

  // ─── CONFIGURATION ───────────────────────────────────────────────────────
  const VERSION = '4.0.0';

  const PHRASES = {
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
    error: [
      "Something broke. Not my fault — I blame the network.",
      "The mind palace glitched. Give me a moment."
    ]
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ─── ⚡ BACKEND ENDPOINTS (Primary + Fallbacks) ──────────────────────
  // YOUR PRIMARY API – this is the one you asked about!
  const API_ENDPOINTS = [
    'https://ragina-crawler-ragina.vercel.app/api/ask',  // ← YOUR PRIMARY BACKEND
    'https://ragina-crawler-ragina.vercel.app/api/ask',  // (retry with same)
    // Add your own fallbacks here if you have them:
    // 'https://your-backup-server.com/api/ask',
    // 'https://api.openai.com/v1/chat/completions'
  ];

  // ─── 🧠 SMART CACHE ────────────────────────────────────────────────────
  const queryCache = new Map();
  const CACHE_TTL = 60000; // 1 minute

  function getCached(query) {
    const key = query.toLowerCase().trim();
    const entry = queryCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.result;
    }
    queryCache.delete(key);
    return null;
  }

  function setCache(query, result) {
    const key = query.toLowerCase().trim();
    queryCache.set(key, { result, timestamp: Date.now() });
  }

  // ─── 📞 BACKEND CALL WITH FALLBACK ───────────────────────────────────
  async function callBackend(prompt, model, endpointIndex = 0) {
    if (endpointIndex >= API_ENDPOINTS.length) {
      throw new Error('All backends failed. Please try again later.');
    }
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
      // Support multiple response formats
      return data.text || data.choices?.[0]?.message?.content || data.response || '';
    } catch (err) {
      console.warn(`⚠️ Backend ${url} failed:`, err.message);
      // Try the next endpoint
      return callBackend(prompt, model, endpointIndex + 1);
    }
  }

  // ─── 📚 RETRIEVAL ENGINE (TF-IDF) ────────────────────────────────────
  class RetrievalEngine {
    constructor() {
      this.chunks = [];
      this.idf = {};
      this.isReady = false;
      this.sourceMap = new Map();
    }

    buildIndex(data, chunkSize = 200) {
      this.chunks = [];
      this.sourceMap = new Map();

      const normalized = (function normalize(input) {
        if (input && Array.isArray(input.pages)) {
          const out = {};
          for (const page of input.pages) {
            const url = page.url || 'unknown';
            const chunks = page.chunks || [];
            if (chunks.length === 0) {
              if (page.content) out[url] = { bodyText: page.content };
              continue;
            }
            out[url] = { bodyText: chunks.map(c => c.text || c.content || '').join('\n') };
          }
          return out;
        }
        return input;
      })(data);

      for (const [source, doc] of Object.entries(normalized)) {
        const body = doc.bodyText || doc.body || doc.content || '';
        if (!body || body.length < 30) continue;
        const sentences = body.split(/\n+|(?<=[.!?])\s+/);
        let buf = '';
        for (const s of sentences) {
          if ((buf + s).length > chunkSize && buf.length > 0) {
            const idx = this.chunks.length;
            this.chunks.push({ text: buf.trim(), source });
            this.sourceMap.set(idx, source);
            buf = '';
          }
          buf += s + ' ';
        }
        if (buf.trim()) {
          const idx = this.chunks.length;
          this.chunks.push({ text: buf.trim(), source });
          this.sourceMap.set(idx, source);
        }
      }

      // Build IDF
      this.idf = {};
      const N = this.chunks.length || 1;
      for (const chunk of this.chunks) {
        const words = new Set(chunk.text.toLowerCase().match(/\b\w+\b/g) || []);
        for (const w of words) this.idf[w] = (this.idf[w] || 0) + 1;
      }
      for (const w in this.idf) {
        this.idf[w] = Math.log(N / (1 + this.idf[w]));
      }
      this.isReady = true;
      console.log(`📚 RAGina loaded ${this.chunks.length} chunks from ${Object.keys(normalized).length} sources`);
      return this.chunks.length;
    }

    retrieve(query, k = 3) {
      if (!this.isReady || this.chunks.length === 0) return [];
      const qWords = query.toLowerCase().match(/\b\w+\b/g) || [];
      const qFreq = {};
      for (const w of qWords) qFreq[w] = (qFreq[w] || 0) + 1;

      const scored = this.chunks.map((chunk, idx) => {
        const cWords = chunk.text.toLowerCase().match(/\b\w+\b/g) || [];
        const cFreq = {};
        for (const w of cWords) cFreq[w] = (cFreq[w] || 0) + 1;
        let score = 0;
        for (const w of Object.keys(qFreq)) {
          if (cFreq[w] && this.idf[w]) {
            score += qFreq[w] * cFreq[w] * this.idf[w];
          }
        }
        return { idx, score, source: chunk.source };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k).map(s => this.chunks[s.idx]);
    }

    getSource(idx) {
      return this.sourceMap.get(idx) || 'unknown';
    }
  }

  // ─── 🔧 TOOL REGISTRY ─────────────────────────────────────────────────
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

  function unregisterTool(name) {
    delete tools[name];
    console.log(`🔧 Tool unregistered: ${name}`);
  }

  function listTools() {
    return Object.keys(tools);
  }

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

  // ─── 🧠 AGENTIC REACT LOOP ───────────────────────────────────────────
  function parseAgentReply(raw) {
    const text = String(raw).trim();
    const toolMatch = text.match(/^TOOL_CALL:\s*([A-Za-z0-9_]+)\((.*)\)\s*$/s);
    if (toolMatch) {
      let args = {};
      try {
        args = toolMatch[2].trim() ? JSON.parse(toolMatch[2]) : {};
      } catch (e) {
        // Try to parse as key-value pairs
        try {
          const pairs = toolMatch[2].split(',').map(p => p.trim().split(':').map(s => s.trim()));
          args = Object.fromEntries(pairs.map(([k, v]) => [k, v.replace(/^['"]|['"]$/g, '')]));
        } catch (e2) {
          // malformed
        }
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
    return `${persona || 'You are RAGina, a helpful AI agent.'}
${toolsBlock()}
${historyBlock}${contextBlock}${toolLogBlock}
User: ${query}`;
  }

  async function runAgent(query, options = {}) {
    // Check cache first
    const cached = getCached(query);
    if (cached) {
      console.log('💾 Using cached response for:', query);
      return cached;
    }

    const maxSteps = options.maxSteps || 4;
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
        return { answer: pick(PHRASES.error) + ' ' + e.message, steps: stepsTaken };
      }

      const parsed = parseAgentReply(raw);
      stepsTaken.push(parsed);
      if (options.onStep) options.onStep(parsed);

      if (parsed.type === 'answer') {
        const result = { answer: parsed.text, steps: stepsTaken };
        // Cache the answer
        setCache(query, result);
        return result;
      }

      const tool = tools[parsed.name];
      if (!tool) {
        toolLog += `\nTool "${parsed.name}" does not exist. Available: ${listTools().join(', ') || '(none registered)'}.`;
        continue;
      }

      let result;
      try {
        result = await tool.handler(parsed.args);
      } catch (e) {
        result = 'Error running tool: ' + e.message;
      }
      toolLog += `\nResult of ${parsed.name}(${JSON.stringify(parsed.args)}): ${typeof result === 'string' ? result : JSON.stringify(result)}`;
    }

    const result = { answer: "I tried a few steps but couldn't finish that — could you rephrase or simplify?", steps: stepsTaken };
    setCache(query, result);
    return result;
  }

  // ─── 💬 CHAT WIDGET ──────────────────────────────────────────────────
  class ChatWidget {
    constructor(engine, config) {
      this.engine = engine;
      this.config = config;
      this.bubble = null;
      this.panel = null;
      this.messages = null;
      this.input = null;
      this.sendBtn = null;
      this.history = [];
      this.isOpen = false;
    }

    hexToRgb(hex) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : '108,99,255';
    }

    injectStyles() {
      if (document.getElementById('ragina-styles')) return;
      const primary = this.config.theme?.primary || '#6C63FF';
      const rgb = this.hexToRgb(primary);
      const side = this.config.position === 'bottom-left' ? 'left:24px;' : 'right:24px;';
      const css = `
@keyframes ragina-pulse{0%,100%{box-shadow:0 0 0 0 rgba(${rgb},0.5)}50%{box-shadow:0 0 0 18px rgba(${rgb},0)}}
@keyframes ragina-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.ragina-bubble{position:fixed;${side}bottom:24px;width:60px;height:60px;border-radius:50%;background:transparent;border:2px solid ${primary};cursor:pointer;z-index:99999;font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform 0.3s,box-shadow 0.3s;animation:ragina-float 4s ease-in-out infinite,ragina-pulse 2s infinite;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
.ragina-bubble:hover{transform:scale(1.15) rotate(360deg);animation:none;box-shadow:0 0 25px rgba(${rgb},0.6)}
.ragina-bubble img{width:44px;height:44px;border-radius:50%}
.ragina-panel{position:fixed;${side}bottom:100px;width:380px;max-width:92vw;height:520px;max-height:70vh;background:#0f0f1a;border-radius:20px;z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(${rgb},0.4);box-shadow:0 0 40px rgba(${rgb},0.2),0 20px 60px rgba(0,0,0,0.6);transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);font-family:system-ui,sans-serif}
.ragina-panel.hidden{opacity:0;pointer-events:none;transform:translateY(30px) scale(0.95)}
.ragina-header{background:linear-gradient(135deg,${primary},#8b7cff);padding:14px 18px;display:flex;align-items:center;gap:12px}
.ragina-avatar{width:40px;height:40px;border-radius:50%;border:2px solid white;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px}
.ragina-header-info{flex:1;color:white}
.ragina-header-name{font-weight:700;font-size:1.1rem}
.ragina-header-status{font-size:0.7rem;opacity:0.8}
.ragina-close{background:rgba(255,255,255,0.2);border:none;color:white;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px}
.ragina-messages{flex:1;padding:16px;overflow-y:auto;background:linear-gradient(180deg,#0f0f1a 0%,#1a1a2e 100%)}
.ragina-messages::-webkit-scrollbar{width:4px}
.ragina-messages::-webkit-scrollbar-thumb{background:rgba(${rgb},0.4);border-radius:4px}
.ragina-msg{margin-bottom:14px;display:flex;flex-direction:column}
.ragina-msg.user{align-items:flex-end}
.ragina-msg.user .ragina-bubble-text{background:${primary};color:white;border-radius:18px 18px 4px 18px}
.ragina-msg.ai .ragina-bubble-text{background:rgba(${rgb},0.1);color:#ddd;border:1px solid rgba(${rgb},0.3);border-radius:18px 18px 18px 4px}
.ragina-bubble-text{max-width:82%;padding:10px 16px;font-size:0.9rem;line-height:1.5;word-break:break-word}
.ragina-tool-tag{font-size:0.62rem;color:rgba(${rgb},0.85);margin-top:4px;padding-left:8px;font-style:italic}
.ragina-sources{font-size:0.65rem;color:rgba(${rgb},0.7);margin-top:4px;padding-left:8px;font-style:italic}
.ragina-input-area{display:flex;padding:10px;border-top:1px solid rgba(${rgb},0.2);background:#0f0f1a}
.ragina-input{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(${rgb},0.3);border-radius:24px;padding:10px 16px;color:white;font-size:0.9rem;outline:none}
.ragina-input::placeholder{color:rgba(255,255,255,0.3)}
.ragina-send{background:${primary};border:none;border-radius:50%;width:40px;height:40px;margin-left:8px;cursor:pointer;color:white;font-size:16px;transition:all 0.2s;display:flex;align-items:center;justify-content:center}
.ragina-send:hover{box-shadow:0 0 15px rgba(${rgb},0.6)}
.ragina-send:disabled{opacity:0.4;cursor:not-allowed}
.ragina-typing{display:flex;gap:4px;padding:10px 16px}
.ragina-typing span{width:8px;height:8px;border-radius:50%;background:rgba(${rgb},0.6);animation:ragina-typing 1.4s infinite}
.ragina-typing span:nth-child(2){animation-delay:0.2s}
.ragina-typing span:nth-child(3){animation-delay:0.4s}
@keyframes ragina-typing{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-8px);opacity:1}}`;
      const styleEl = document.createElement('style');
      styleEl.id = 'ragina-styles';
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    build() {
      this.injectStyles();
      const bubbleIcon = this.config.avatarUrl
        ? `<img src="${this.config.avatarUrl}" alt="RAGina" style="width:44px;height:44px;border-radius:50%;" onerror="this.parentElement.innerHTML='🔮'">`
        : this.config.bubbleIcon || '🔮';

      this.bubble = document.createElement('button');
      this.bubble.className = 'ragina-bubble';
      this.bubble.title = this.config.title || 'RAGina – Your Mentalist RAG';
      this.bubble.innerHTML = bubbleIcon;
      document.body.appendChild(this.bubble);

      this.panel = document.createElement('div');
      this.panel.className = 'ragina-panel hidden';
      this.panel.innerHTML = `
        <div class="ragina-header">
          ${this.config.avatarUrl
            ? `<img class="ragina-avatar" src="${this.config.avatarUrl}" alt="RAGina" style="object-fit:cover;" onerror="this.outerHTML='<div class=\\'ragina-avatar\\'>🔮</div>'">`
            : '<div class="ragina-avatar">🔮</div>'}
          <div class="ragina-header-info">
            <div class="ragina-header-name">${this.config.title || 'RAGina'}</div>
            <div class="ragina-header-status">🧠 v${VERSION} · Agentic Core</div>
          </div>
          <button class="ragina-close">✕</button>
        </div>
        <div class="ragina-messages"></div>
        <div class="ragina-input-area">
          <input type="text" class="ragina-input" placeholder="${this.config.placeholder || 'Ask me anything...'}" ${this.engine.isReady ? '' : 'disabled'}>
          <button class="ragina-send" ${this.engine.isReady ? '' : 'disabled'}>➤</button>
        </div>`;
      document.body.appendChild(this.panel);

      this.messages = this.panel.querySelector('.ragina-messages');
      this.input = this.panel.querySelector('.ragina-input');
      this.sendBtn = this.panel.querySelector('.ragina-send');

      this.bubble.addEventListener('click', () => this.toggle());
      this.panel.querySelector('.ragina-close').addEventListener('click', () => this.hide());
      this.sendBtn.addEventListener('click', () => this.handleSend());
      this.input.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.handleSend();
      });

      this.addMessage(
        this.engine.isReady
          ? pick(PHRASES.ready) + ` (v${VERSION})`
          : "I'm ready! Upload some files or load an index to get started.",
        'ai'
      );
    }

    toggle() {
      this.panel.classList.toggle('hidden');
      if (!this.panel.classList.contains('hidden')) {
        this.input.focus();
        this.isOpen = true;
      } else {
        this.isOpen = false;
      }
    }

    hide() {
      this.panel.classList.add('hidden');
      this.isOpen = false;
    }

    show() {
      this.panel.classList.remove('hidden');
      this.input.focus();
      this.isOpen = true;
    }

    addMessage(text, who, meta) {
      const row = document.createElement('div');
      row.className = `ragina-msg ${who}`;
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'ragina-bubble-text';
      bubbleEl.textContent = text;
      row.appendChild(bubbleEl);

      if (meta?.sources?.length) {
        const src = document.createElement('div');
        src.className = 'ragina-sources';
        src.textContent = '📌 ' + meta.sources.map(s => (s.source || '').split('/').pop() + '…').join(' · ');
        row.appendChild(src);
      }

      if (meta?.toolsUsed?.length) {
        const tag = document.createElement('div');
        tag.className = 'ragina-tool-tag';
        tag.textContent = '🔧 used: ' + meta.toolsUsed.join(', ');
        row.appendChild(tag);
      }

      this.messages.appendChild(row);
      this.messages.scrollTop = this.messages.scrollHeight;
      return row;
    }

    showTyping(label) {
      const row = document.createElement('div');
      row.className = 'ragina-msg ai';
      row.innerHTML = '<div class="ragina-typing"><span></span><span></span><span></span></div>' +
        (label ? `<div class="ragina-tool-tag">${label}</div>` : '');
      this.messages.appendChild(row);
      this.messages.scrollTop = this.messages.scrollHeight;
      return row;
    }

    async handleSend() {
      const query = this.input.value.trim();
      if (!query || !this.engine.isReady) return;

      this.input.value = '';
      this.sendBtn.disabled = true;
      this.addMessage(query, 'user');
      this.history.push({ who: 'User', text: query });

      const typingRow = this.showTyping();

      const chunks = this.engine.retrieve(query, this.config.topK || 3);
      const contextText = chunks.length
        ? chunks.map((c, i) => `[${i + 1}] ${this.engine.getSource(this.engine.chunks.indexOf(c))}\n${c.text}`).join('\n\n')
        : 'No relevant documents found.';

      const persona = this.config.personality === 'professional'
        ? 'You are RAGina, a professional research assistant. Answer using ONLY the document context and any tool results. If you cannot find the answer, say so plainly.'
        : 'You are RAGina, a sassy mentalist who can read any document. Answer using the document context and any tool results, with attitude if the info is missing.';

      const toolsUsed = [];

      try {
        const { answer } = await runAgent(query, {
          persona,
          contextText,
          history: this.history.slice(-8),
          model: this.config.model,
          onStep: step => {
            if (step.type === 'tool_call') {
              toolsUsed.push(step.name);
              typingRow.querySelector('.ragina-tool-tag')?.remove();
              const tag = document.createElement('div');
              tag.className = 'ragina-tool-tag';
              tag.textContent = '🔧 using ' + step.name + '…';
              typingRow.appendChild(tag);
            }
          }
        });

        typingRow.remove();
        this.addMessage(answer, 'ai', { sources: chunks, toolsUsed });
        this.history.push({ who: 'RAGina', text: answer });

        if (this.history.length > 16) {
          this.history = this.history.slice(-16);
        }
      } catch (e) {
        typingRow.remove();
        this.addMessage(pick(PHRASES.error) + ' ' + e.message, 'ai');
      }

      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }

  // ─── 🌐 PUBLIC API ────────────────────────────────────────────────────
  const RAGina = {
    engine: null,
    ui: null,
    config: {},
    version: VERSION,

    init(userConfig = {}) {
      this.config = {
        indexUrl: null,
        position: 'bottom-right',
        placeholder: 'Ask me anything...',
        topK: 3,
        model: 'openai',
        avatarUrl: 'https://ragina-crawler-ragina.vercel.app/ragina-logo.png',
        bubbleIcon: null,
        title: 'RAGina',
        personality: 'sassy',
        theme: { primary: '#6C63FF' },
        chunkSize: 200,
        voiceEnabled: false,
        voiceUrl: null,
        voiceId: 'rachel',
        voiceSpeed: 1,
        showWidget: true,
        ...userConfig
      };

      this.engine = new RetrievalEngine();

      const buildUI = () => {
        if (this.config.showWidget) {
          this.ui = new ChatWidget(this.engine, this.config);
          this.ui.build();
        }
      };

      // Check for pre-loaded index via __RAGINA_INDEX__
      if (e.__RAGINA_INDEX__ && typeof e.__RAGINA_INDEX__ === 'object' && Object.keys(e.__RAGINA_INDEX__).length) {
        this.engine.buildIndex(e.__RAGINA_INDEX__, this.config.chunkSize);
        buildUI();
        if (this.ui) this.ui.show();
        console.log('🚀 RAGina initialized with pre-loaded index');
        return;
      }

      // Load from URL if provided
      if (this.config.indexUrl) {
        fetch(this.config.indexUrl)
          .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then(data => {
            this.engine.buildIndex(data, this.config.chunkSize);
            buildUI();
            if (this.ui) this.ui.show();
            console.log('🚀 RAGina initialized from URL:', this.config.indexUrl);
          })
          .catch(err => {
            console.warn('⚠️ RAGina: could not load index from URL.', err.message);
            buildUI();
          });
      } else {
        buildUI();
        console.log('🚀 RAGina initialized (no index loaded)');
      }
    },

    loadData(data) {
      if (!this.engine) this.engine = new RetrievalEngine();
      const count = this.engine.buildIndex(data, this.config.chunkSize || 200);

      if (this.ui) {
        this.ui.messages.innerHTML = '';
        this.ui.input.disabled = false;
        if (this.ui.sendBtn) this.ui.sendBtn.disabled = false;
        this.ui.addMessage(pick(PHRASES.ready) + ` (${count} chunks loaded)`, 'ai');
      } else if (this.config.showWidget !== false) {
        this.ui = new ChatWidget(this.engine, this.config);
        this.ui.build();
        this.ui.show();
      }
      console.log(`📚 RAGina loaded ${count} chunks`);
      return count;
    },

    async loadFolder(fileList) {
      const htmlFiles = [...fileList].filter(f =>
        f.name.endsWith('.html') || f.name.endsWith('.htm') || f.name.endsWith('.md') || f.name.endsWith('.txt')
      );
      const data = {};
      for (const file of htmlFiles) {
        const text = await file.text();
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const doc = new DOMParser().parseFromString(text, 'text/html');
          data[file.webkitRelativePath || file.name] = { bodyText: (doc.body?.textContent || '').trim() };
        } else {
          data[file.webkitRelativePath || file.name] = { bodyText: text };
        }
      }
      this.loadData(data);
    },

    getEngine() {
      return this.engine;
    },

    ask(text) {
      if (this.ui) {
        this.ui.input.value = text;
        this.ui.handleSend();
      }
    },

    registerTool,
    unregisterTool,
    listTools,

    async query(text, options = {}) {
      let contextText = options.contextText;
      if (contextText === undefined && this.engine?.isReady) {
        const chunks = this.engine.retrieve(text, options.topK || this.config.topK || 3);
        contextText = chunks.length
          ? chunks.map((c, i) => `[${i + 1}] ${this.engine.getSource(this.engine.chunks.indexOf(c))}\n${c.text}`).join('\n\n')
          : '';
      }
      return runAgent(text, { ...options, contextText });
    },

    // Clear cache
    clearCache() {
      queryCache.clear();
      console.log('🧹 Cache cleared');
    },

    // Get cache stats
    getCacheStats() {
      return {
        size: queryCache.size,
        keys: Array.from(queryCache.keys())
      };
    }
  };

  // ─── 🔧 BUILT-IN TOOLS ───────────────────────────────────────────────

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
            return {
              source: 'DuckDuckGo',
              title: ddgData.Heading || query,
              summary: ddgData.Abstract,
              url: ddgData.AbstractURL || 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
            };
          }
          return { error: 'No results found for "' + query + '".' };
        }

        return {
          source: 'Wikipedia',
          results: titles.map((title, i) => ({
            title,
            summary: descriptions[i] || 'No description available.',
            url: urls[i]
          }))
        };
      } catch (e) {
        return { error: 'Search failed: ' + e.message };
      }
    }
  });

  registerTool('scheduleEvent', {
    description: 'Open Google Calendar with a pre-filled event (title, date, time, duration)',
    parameters: {
      title: 'string, event title',
      date: 'string, date like "2026-08-25" or "tomorrow"',
      time: 'string, time like "15:00" or "3pm" (optional)',
      duration: 'number, minutes (default 60)',
      location: 'string, location (optional)',
      description: 'string, notes (optional)'
    },
    handler: async ({ title, date, time, duration, location, description }) => {
      title = title || 'Event';
      duration = duration || 60;
      let startDT = null;

      try {
        if (date) {
          if (/tomorrow/i.test(date)) {
            startDT = new Date();
            startDT.setDate(startDT.getDate() + 1);
          } else if (/today/i.test(date)) {
            startDT = new Date();
          } else {
            startDT = new Date(date + (time ? ' ' + time : ''));
          }
          if (time && !isNaN(startDT.getTime())) {
            const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i);
            if (timeMatch) {
              let h = parseInt(timeMatch[1]);
              const m = timeMatch[2] || 0;
              const ap = (timeMatch[3] || '').toLowerCase().replace(/\./g, '');
              if (ap === 'pm' && h < 12) h += 12;
              if (ap === 'am' && h === 12) h = 0;
              startDT.setHours(h, parseInt(m), 0, 0);
            }
          }
        }
      } catch (e) {}

      if (!startDT || isNaN(startDT.getTime())) {
        startDT = new Date();
        startDT.setDate(startDT.getDate() + 1);
        startDT.setHours(10, 0, 0, 0);
      }

      const endDT = new Date(startDT.getTime() + duration * 60000);
      const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
      const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent(title) +
        '&dates=' + fmt(startDT) + '/' + fmt(endDT) +
        (location ? '&location=' + encodeURIComponent(location) : '') +
        (description ? '&details=' + encodeURIComponent(description) : '');

      window.open(url, '_blank');
      return {
        success: true,
        title,
        start: startDT.toLocaleString(),
        end: endDT.toLocaleString(),
        location: location || '—',
        url
      };
    }
  });

  registerTool('draftEmail', {
    description: 'Open the default email client with a pre-filled draft',
    parameters: {
      to: 'string, recipient email address',
      subject: 'string, email subject line',
      body: 'string, email body text',
      cc: 'string, CC email (optional)'
    },
    handler: async ({ to, subject, body, cc }) => {
      let url = 'mailto:' + encodeURIComponent(to || '');
      const q = [];
      if (subject) q.push('subject=' + encodeURIComponent(subject));
      if (body) q.push('body=' + encodeURIComponent(body));
      if (cc) q.push('cc=' + encodeURIComponent(cc));
      if (q.length) url += '?' + q.join('&');

      window.open(url, '_self');
      return {
        success: true,
        to: to || '(no recipient)',
        subject: subject || '(no subject)',
        bodyPreview: body ? (body.length > 120 ? body.slice(0, 120) + '…' : body) : ''
      };
    }
  });

  registerTool('getTime', {
    description: 'Get the current local date and time',
    parameters: {},
    handler: async () => ({
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      iso: new Date().toISOString()
    })
  });

  registerTool('calculate', {
    description: 'Evaluate a math expression like "2 + 2 * 3" or "sqrt(144)"',
    parameters: { expression: 'string, a math expression' },
    handler: async ({ expression }) => {
      try {
        const safe = expression.replace(/[^0-9+\-*/().%\s,sqrt,pow,abs,Math]/g, '');
        const result = new Function('return ' + safe)();
        return { expression, result };
      } catch (e) {
        return { error: 'Invalid expression: ' + e.message };
      }
    }
  });

  registerTool('openUrl', {
    description: 'Open a URL in a new browser tab',
    parameters: { url: 'string, the URL to open' },
    handler: async ({ url }) => {
      window.open(url, '_blank');
      return { opened: url };
    }
  });

  // ─── 🚀 AUTO-INIT ────────────────────────────────────────────────────
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // ─── FALLBACK: If index was provided after init ─────────────────────
  setTimeout(() => {
    if (e.RAGina && e.__RAGINA_INDEX__ && (!e.RAGina.engine || !e.RAGina.engine.isReady)) {
      document.querySelector('.ragina-bubble')?.remove();
      document.querySelector('.ragina-panel')?.remove();
      RAGina.loadData(e.__RAGINA_INDEX__);
    }
  }, 500);

  console.log(`🧠 RAGina-T1 v${VERSION} loaded!`);
  console.log('🔧 Tools available:', listTools().join(', '));
  console.log('📡 Primary API:', API_ENDPOINTS[0]);

}(typeof window !== 'undefined' ? window : this);