/*! 
 * Ragina-t1.js v3.0.1 — Tier 1 Agentic Build
 * Mentalist RAG + Real tool-calling + Web Search, Calendar, Email tools
 * Created by suryasticsai@gmail.com | github.com/suryasticsai
 * MIT License
 * CDN: https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t1.js
 *
 * TIER 1 TOOLS INCLUDED:
 *   - webSearch(query) → Wikipedia + DuckDuckGo fallback
 *   - scheduleEvent({...}) → Opens Google Calendar with pre-filled event
 *   - draftEmail({...}) → Opens mail client with draft
 *   - getTime() → Current local time (demo tool)
 *
 * ADD YOUR OWN:
 *   RAGina.registerTool('myTool', {
 *     description: '...',
 *     parameters: { arg: 'type' },
 *     handler: async ({arg}) => { ... }
 *   });
 */

(function (global) {
  'use strict';

  // ===== Utilities =====
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

  const API_URL = 'https://ragina-crawler-ragina.vercel.app/api/ask';

  // ===== Retrieval engine (TF‑IDF) =====
  class RetrievalEngine {
    constructor() {
      this.chunks = [];
      this.idf = {};
      this.isReady = false;
    }

    buildIndex(data, chunkSize = 200) {
      this.chunks = [];

      // Normalise input: either { pages: [...] } or flat { url: { bodyText: ... } }
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
            out[url] = {
              bodyText: chunks.map(c => c.text || c.content || '').join('\n')
            };
          }
          return out;
        }
        return input;
      })(data);

      // Chunk each document
      for (const [source, doc] of Object.entries(normalized)) {
        const body = doc.bodyText || doc.body || doc.content || '';
        if (!body || body.length < 30) continue;

        const sentences = body.split(/\n+|(?<=[.!?])\s+/);
        let buf = '';
        for (const s of sentences) {
          if ((buf + s).length > chunkSize && buf.length > 0) {
            this.chunks.push({ text: buf.trim(), source });
            buf = '';
          }
          buf += s + ' ';
        }
        if (buf.trim()) this.chunks.push({ text: buf.trim(), source });
      }

      // Compute IDF
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
        for (const [w, f] of Object.entries(qFreq)) {
          if (this.idf[w]) {
            score += f * this.idf[w] * (cFreq[w] || 0) / cWords.length;
          }
        }
        return { chunk, score, idx };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k).map(item => ({
        text: item.chunk.text,
        source: item.chunk.source,
        score: item.score
      }));
    }
  }

  // ===== Backend caller =====
  async function callBackend(prompt, model = 'openai') {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model })
    });
    if (!resp.ok) throw new Error(`Backend error: ${resp.status}`);
    const data = await resp.json();
    if (!data.answer) throw new Error('No answer from backend');
    return data.answer;
  }

  // ===== Agentic loop helpers =====
  function parseAgentOutput(raw) {
    const toolMatch = raw.match(/TOOL_CALL\s*:\s*(\w+)\(([^)]*)\)/i);
    if (toolMatch) {
      const name = toolMatch[1];
      const argsStr = toolMatch[2].trim();
      let args = {};
      try {
        if (argsStr) args = JSON.parse('{' + argsStr + '}');
      } catch (_) {
        args = { raw: argsStr };
      }
      return { type: 'tool_call', name, args };
    }

    const answerMatch = raw.match(/ANSWER\s*:\s*([\s\S]*)/i);
    if (answerMatch) {
      return { type: 'answer', text: answerMatch[1].trim() };
    }

    return { type: 'answer', text: raw.trim() };
  }

  function buildAgentPrompt({ persona, query, contextText, history, toolLog }) {
    const historyBlock = history && history.length
      ? '\nRecent conversation:\n' + history.map(m => `${m.who}: ${m.text}`).join('\n') + '\n'
      : '';

    const contextBlock = contextText
      ? '\nDocuments:\n' + contextText + '\n'
      : '';

    const toolLogBlock = toolLog
      ? '\nTool results so far:\n' + toolLog + '\n'
      : '';

    const toolsList = RAGina.listTools
      ? RAGina.listTools().map(t => `- ${t.name}: ${t.description}`).join('\n')
      : '';

    const toolPrompt = toolsList ? '\nAvailable tools:\n' + toolsList + '\n' : '';

    return `${persona}${toolPrompt}
You must reply with either:
- TOOL_CALL: toolName({ "arg": "value" })
- ANSWER: your final answer

${historyBlock}${contextBlock}${toolLogBlock}User: ${query}`;
  }

  async function runAgent(query, options = {}) {
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
        return {
          answer: pick(PHRASES.error) + ' ' + e.message,
          steps: stepsTaken
        };
      }

      const parsed = parseAgentOutput(raw);

      if (parsed.type === 'answer') {
        return { answer: parsed.text, steps: stepsTaken };
      }

      if (parsed.type === 'tool_call') {
        stepsTaken.push({ type: 'tool_call', name: parsed.name, args: parsed.args });
        if (options.onStep) options.onStep({ type: 'tool_call', name: parsed.name, args: parsed.args });

        let result;
        try {
          const tool = RAGina._tools && RAGina._tools[parsed.name];
          if (tool) {
            result = await tool.handler(parsed.args);
          } else {
            result = 'Tool "' + parsed.name + '" not found.';
          }
        } catch (e) {
          result = 'Error running tool: ' + e.message;
        }

        toolLog += `\nResult of ${parsed.name}(${JSON.stringify(parsed.args)}): ${typeof result === 'string' ? result : JSON.stringify(result)}`;
      }
    }

    return {
      answer: "I tried a few steps but couldn't finish that — could you rephrase or simplify?",
      steps: stepsTaken
    };
  }

  // ===== Chat widget UI =====
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
        @keyframes ragina-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(${rgb},0.5); }
          50% { box-shadow: 0 0 0 18px rgba(${rgb},0); }
        }
        @keyframes ragina-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .ragina-bubble {
          position: fixed; ${side} bottom:24px; width:60px; height:60px;
          border-radius:50%; background:transparent; border:2px solid ${primary};
          cursor:pointer; z-index:99999; font-size:28px;
          display:flex; align-items:center; justify-content:center;
          transition: transform 0.3s, box-shadow 0.3s;
          animation: ragina-float 4s ease-in-out infinite, ragina-pulse 2s infinite;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .ragina-bubble:hover {
          transform: scale(1.15) rotate(360deg);
          animation: none;
          box-shadow: 0 0 25px rgba(${rgb},0.6);
        }
        .ragina-bubble img { width:44px; height:44px; border-radius:50%; }
        .ragina-panel {
          position: fixed; ${side} bottom:100px; width:380px; max-width:92vw;
          height:520px; max-height:70vh; background:#0f0f1a;
          border-radius:20px; z-index:99999;
          display:flex; flex-direction:column; overflow:hidden;
          border:1px solid rgba(${rgb},0.4);
          box-shadow: 0 0 40px rgba(${rgb},0.2), 0 20px 60px rgba(0,0,0,0.6);
          transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
          font-family: system-ui, sans-serif;
        }
        .ragina-panel.hidden {
          opacity:0; pointer-events:none;
          transform: translateY(30px) scale(0.95);
        }
        .ragina-header {
          background: linear-gradient(135deg, ${primary}, #8b7cff);
          padding:14px 18px; display:flex; align-items:center; gap:12px;
        }
        .ragina-avatar {
          width:40px; height:40px; border-radius:50%;
          border:2px solid white; background:rgba(255,255,255,0.2);
          display:flex; align-items:center; justify-content:center; font-size:20px;
        }
        .ragina-header-info { flex:1; color:white; }
        .ragina-header-name { font-weight:700; font-size:1.1rem; }
        .ragina-header-status { font-size:0.7rem; opacity:0.8; }
        .ragina-close {
          background:rgba(255,255,255,0.2); border:none; color:white;
          width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:16px;
        }
        .ragina-messages {
          flex:1; padding:16px; overflow-y:auto;
          background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
        }
        .ragina-messages::-webkit-scrollbar { width:4px; }
        .ragina-messages::-webkit-scrollbar-thumb { background:rgba(${rgb},0.4); border-radius:4px; }
        .ragina-msg { margin-bottom:14px; display:flex; flex-direction:column; }
        .ragina-msg.user { align-items:flex-end; }
        .ragina-msg.user .ragina-bubble-text {
          background:${primary}; color:white;
          border-radius:18px 18px 4px 18px;
        }
        .ragina-msg.ai .ragina-bubble-text {
          background:rgba(${rgb},0.1); color:#ddd;
          border:1px solid rgba(${rgb},0.3);
          border-radius:18px 18px 18px 4px;
        }
        .ragina-bubble-text {
          max-width:82%; padding:10px 16px;
          font-size:0.9rem; line-height:1.5; word-break:break-word;
        }
        .ragina-tool-tag {
          font-size:0.62rem; color:rgba(${rgb},0.85);
          margin-top:4px; padding-left:8px; font-style:italic;
        }
        .ragina-sources {
          font-size:0.65rem; color:rgba(${rgb},0.7);
          margin-top:4px; padding-left:8px; font-style:italic;
        }
        .ragina-input-area {
          display:flex; padding:10px;
          border-top:1px solid rgba(${rgb},0.2);
          background:#0f0f1a;
        }
        .ragina-input {
          flex:1; background:rgba(255,255,255,0.05);
          border:1px solid rgba(${rgb},0.3);
          border-radius:24px; padding:10px 16px;
          color:white; font-size:0.9rem; outline:none;
        }
        .ragina-input::placeholder { color:rgba(255,255,255,0.3); }
        .ragina-send {
          background:${primary}; border:none;
          border-radius:50%; width:40px; height:40px;
          margin-left:8px; cursor:pointer; color:white; font-size:16px;
          transition: all 0.2s;
          display:flex; align-items:center; justify-content:center;
        }
        .ragina-send:hover { box-shadow: 0 0 15px rgba(${rgb},0.6); }
        .ragina-send:disabled { opacity:0.4; cursor:not-allowed; }
        .ragina-typing { display:flex; gap:4px; padding:10px 16px; }
        .ragina-typing span {
          width:8px; height:8px; border-radius:50%;
          background:rgba(${rgb},0.6);
          animation: ragina-typing 1.4s infinite;
        }
        .ragina-typing span:nth-child(2) { animation-delay:0.2s; }
        .ragina-typing span:nth-child(3) { animation-delay:0.4s; }
        @keyframes ragina-typing {
          0%,60%,100% { transform:translateY(0); opacity:0.4; }
          30% { transform:translateY(-8px); opacity:1; }
        }
      `;

      const styleEl = document.createElement('style');
      styleEl.id = 'ragina-styles';
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }

    build() {
      this.injectStyles();

      const bubbleIcon = this.config.avatarUrl ? `<img src="${this.config.avatarUrl}" alt="RAGina">` : (this.config.bubbleIcon || '🔮');
      this.bubble = document.createElement('button');
      this.bubble.className = 'ragina-bubble';
      this.bubble.title = this.config.title || 'RAGina – Your Mentalist RAG';
      this.bubble.innerHTML = bubbleIcon;
      document.body.appendChild(this.bubble);

      this.panel = document.createElement('div');
      this.panel.className = 'ragina-panel hidden';
      this.panel.innerHTML = `
        <div class="ragina-header">
          <div class="ragina-avatar">${this.config.avatarUrl ? `<img src="${this.config.avatarUrl}" alt="RAGina" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : '🔮'}</div>
          <div class="ragina-header-info">
            <div class="ragina-header-name">${this.config.title || 'RAGina'}</div>
            <div class="ragina-header-status">Mentalist Online</div>
          </div>
          <button class="ragina-close">✕</button>
        </div>
        <div class="ragina-messages"></div>
        <div class="ragina-input-area">
          <input class="ragina-input" placeholder="${this.config.placeholder || 'Ask me anything...'}" />
          <button class="ragina-send">➤</button>
        </div>
      `;
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
        this.engine.isReady ? pick(PHRASES.ready) : "I'm ready! Upload some files or load an index to get started.",
        'ai'
      );
    }

    toggle() {
      this.panel.classList.toggle('hidden');
      if (!this.panel.classList.contains('hidden')) this.input.focus();
    }

    hide() { this.panel.classList.add('hidden'); }
    show() { this.panel.classList.remove('hidden'); this.input.focus(); }

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
        src.textContent = ' ' + meta.sources.map(s => (s.source || '').split('/').pop() + '…').join(' · ');
        row.appendChild(src);
      }

      if (meta?.toolsUsed?.length) {
        const tag = document.createElement('div');
        tag.className = 'ragina-tool-tag';
        tag.textContent = ' used: ' + meta.toolsUsed.join(', ');
        row.appendChild(tag);
      }

      this.messages.appendChild(row);
      this.messages.scrollTop = this.messages.scrollHeight;
      return row;
    }

    showTyping(label) {
      // ===== FIX: return null if widget not built =====
      if (!this.messages) return null;

      const row = document.createElement('div');
      row.className = 'ragina-msg ai';
      row.innerHTML = `
        <div class="ragina-bubble-text">
          <div class="ragina-typing">
            <span></span><span></span><span></span>
          </div>
          ${label ? `<div style="font-size:0.7rem;color:#888;margin-top:4px;">${label}</div>` : ''}
        </div>
      `;
      this.messages.appendChild(row);
      this.messages.scrollTop = this.messages.scrollHeight;
      return row;
    }

    async handleSend() {
      // ===== FIX: exit early if widget not built =====
      if (!this.messages) {
        this.sendBtn.disabled = false;
        this.input.focus();
        return;
      }

      const query = this.input.value.trim();
      if (!query || !this.engine.isReady) return;

      this.input.value = '';
      this.sendBtn.disabled = true;
      this.addMessage(query, 'user');
      this.history.push({ who: 'User', text: query });

      const typingRow = this.showTyping();
      // ===== FIX: if showTyping returned null, abort =====
      if (!typingRow) {
        this.sendBtn.disabled = false;
        this.input.focus();
        return;
      }

      const chunks = this.engine.retrieve(query, this.config.topK || 3);
      const contextText = chunks.length
        ? chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n')
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
              // remove any existing tool tag
              typingRow.querySelector('.ragina-tool-tag')?.remove();
              const tag = document.createElement('div');
              tag.className = 'ragina-tool-tag';
              tag.textContent = ' using ' + step.name + '…';
              typingRow.appendChild(tag);
            }
          }
        });

        // ===== FIX: use optional chaining =====
        typingRow?.remove();

        this.addMessage(answer, 'ai', { sources: chunks, toolsUsed });
        this.history.push({ who: 'RAGina', text: answer });
        if (this.history.length > 16) this.history = this.history.slice(-16);

        if (this.config.voiceEnabled && this.config.voiceUrl) {
          speak(answer, this.config.voiceUrl, this.config.voiceId, this.config.voiceSpeed);
        }
      } catch (e) {
        typingRow?.remove();
        this.addMessage(pick(PHRASES.error) + ' ' + e.message, 'ai');
      }

      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }

  // ===== Public API =====
  const RAGina = {
    engine: null,
    ui: null,
    config: {},
    _tools: {},

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

      // If index was pre-injected via __RAGINA_INDEX__
      if (global.__RAGINA_INDEX__ && typeof global.__RAGINA_INDEX__ === 'object' && Object.keys(global.__RAGINA_INDEX__).length) {
        this.engine.buildIndex(global.__RAGINA_INDEX__, this.config.chunkSize);
        buildUI();
        if (this.ui) this.ui.show();
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
          })
          .catch(err => {
            console.warn('RAGina: could not load index from URL.', err.message);
            buildUI();
          });
      } else {
        buildUI();
      }
    },

    loadData(data) {
      if (!this.engine) this.engine = new RetrievalEngine();
      this.engine.buildIndex(data, this.config.chunkSize);
      if (!this.ui && this.config.showWidget) {
        this.ui = new ChatWidget(this.engine, this.config);
        this.ui.build();
        this.ui.show();
      }
    },

    async loadFolder(fileList) {
      const htmlFiles = [...fileList].filter(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
      const data = {};
      for (const file of htmlFiles) {
        const text = await file.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        data[file.webkitRelativePath || file.name] = {
          bodyText: (doc.body?.textContent || '').trim()
        };
      }
      this.loadData(data);
    },

    getEngine() { return this.engine; },

    ask(text) {
      if (this.ui) {
        this.ui.input.value = text;
        this.ui.handleSend();
      }
    },

    registerTool(name, def) {
      this._tools[name] = def;
    },

    unregisterTool(name) {
      delete this._tools[name];
    },

    listTools() {
      return Object.keys(this._tools).map(name => ({
        name,
        description: this._tools[name].description
      }));
    },

    async query(text, options = {}) {
      let contextText = options.contextText;
      if (contextText === undefined && this.engine?.isReady) {
        const chunks = this.engine.retrieve(text, options.topK || this.config.topK || 3);
        contextText = chunks.length
          ? chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n')
          : '';
      }
      return runAgent(text, { ...options, contextText });
    }
  };

  // =================================================================
  //  TIER 1 AGENTIC TOOLS — Registered automatically
  // =================================================================

  // ─── Tool 1: Web Search (Wikipedia + DuckDuckGo) ────────────────
  registerTool('webSearch', {
    description: 'Search Wikipedia and the web for facts, people, events, or any topic',
    parameters: { query: 'string, the search query' },
    handler: async ({ query }) => {
      try {
        // Primary: Wikipedia OpenSearch
        const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=3&search=' + encodeURIComponent(query);
        const wikiRes = await fetch(wikiUrl);
        const wikiData = await wikiRes.json();
        const titles = wikiData[1] || [];
        const descriptions = wikiData[2] || [];
        const urls = wikiData[3] || [];

        if (titles.length === 0) {
          // Fallback: DuckDuckGo Instant Answer
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

  // ─── Tool 2: Schedule Calendar Event ──────────────────────────────
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
            startDT = new Date(date);
          }
          if (isNaN(startDT)) startDT = new Date();
        } else {
          startDT = new Date();
        }

        if (time) {
          const parts = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
          if (parts) {
            let h = parseInt(parts[1]);
            const m = parts[2] ? parseInt(parts[2]) : 0;
            const ampm = parts[3] ? parts[3].toLowerCase() : null;
            if (ampm === 'pm' && h < 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            startDT.setHours(h, m, 0, 0);
          }
        }

        const endDT = new Date(startDT);
        endDT.setMinutes(endDT.getMinutes() + duration);

        const format = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
        const params = new URLSearchParams({
          action: 'TEMPLATE',
          text: title,
          dates: format(startDT) + '/' + format(endDT)
        });
        if (location) params.append('location', location);
        if (description) params.append('details', description);

        const url = 'https://calendar.google.com/calendar/render?' + params.toString();
        window.open(url, '_blank');

        return {
          opened: url,
          event: {
            title,
            start: startDT.toISOString(),
            end: endDT.toISOString(),
            location,
            description
          }
        };
      } catch (e) {
        return { error: 'Failed to create event: ' + e.message };
      }
    }
  });

  // ─── Tool 3: Draft Email ──────────────────────────────────────────
  registerTool('draftEmail', {
    description: 'Open email client with a draft message',
    parameters: {
      to: 'string, recipient email',
      subject: 'string, email subject',
      body: 'string, email body'
    },
    handler: async ({ to, subject, body }) => {
      const url = 'mailto:' + encodeURIComponent(to || '') +
        '?subject=' + encodeURIComponent(subject || '') +
        '&body=' + encodeURIComponent(body || '');
      window.open(url, '_blank');
      return { opened: url };
    }
  });

  // ─── Tool 4: Get Current Time ──────────────────────────────────────
  registerTool('getTime', {
    description: 'Get the current local date and time',
    parameters: {},
    handler: async () => {
      const now = new Date();
      return {
        datetime: now.toLocaleString(),
        iso: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  });

  // ─── Tool 5: Calculate ─────────────────────────────────────────────
  registerTool('calculate', {
    description: 'Evaluate a mathematical expression',
    parameters: { expression: 'string, the math expression to evaluate' },
    handler: async ({ expression }) => {
      try {
        const result = Function('"use strict"; return (' + expression + ')')();
        return { expression, result };
      } catch (e) {
        return { error: 'Invalid expression: ' + e.message };
      }
    }
  });

  // ─── Tool 6: Open URL ──────────────────────────────────────────────
  registerTool('openUrl', {
    description: 'Open a URL in a new browser tab',
    parameters: { url: 'string, the URL to open' },
    handler: async ({ url }) => {
      window.open(url, '_blank');
      return { opened: url };
    }
  });

  // =================================================================

  // Expose RAGina globally
  global.RAGina = RAGina;

  // Auto‑initialise if index was pre‑injected or config present
  const autoInit = () => {
    if (global.__RAGINA_INDEX__ && typeof global.__RAGINA_INDEX__ === 'object' && Object.keys(global.__RAGINA_INDEX__).length) {
      RAGina.init({ ...(global.RAGINA_CONFIG || {}), indexUrl: null });
      return;
    }
    if (global.RAGINA_CONFIG) RAGina.init(global.RAGINA_CONFIG);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Safety fallback: if index was set after load, reload it
  setTimeout(() => {
    if (global.RAGina && global.__RAGINA_INDEX__ && (!global.RAGina.engine || !global.RAGina.engine.isReady)) {
      document.querySelector('.ragina-bubble')?.remove();
      document.querySelector('.ragina-panel')?.remove();
      RAGina.loadData(global.__RAGINA_INDEX__);
    }
  }, 500);

})(typeof window !== 'undefined' ? window : this);