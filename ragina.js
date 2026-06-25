/*!
 * RAGina.js v1.1.0
 * Mentalist RAG - She reads everything, forgets nothing.
 * MIT License | github.com/suryasticsai/RAGina
 */
(function (global) {
  'use strict';

  const QUOTES = {
    ready: [
      "Alright darling, I've read every file in this place. Ask away.",
      "Mind palace is set. These documents have no secrets from me now.",
      "I've penetrated every folder. What do you want to know?",
    ],
    thinking: [
      "Scanning the memory palace… hold tight.",
      "I can see the answer forming in the chaos…",
      "Give me a second, I'm reading through walls here.",
    ],
    found: [
      "Found it. It was hiding in plain sight.",
      "Knew exactly where that was. I'm a mentalist, remember?",
      "Piece of cake. Your files can't hide from me.",
    ],
    confused: [
      "Even I can't find that in your mess. Organize better, human.",
      "Your files are silent on this one. And I hear everything.",
      "Nothing. Zip. Your documents don't know either.",
    ],
    error: [
      "Something broke. Not my fault — I blame the network.",
      "The mind palace glitched. Give me a moment.",
    ],
  };

  const randomQuote = (arr) => arr[Math.floor(Math.random() * arr.length)];

  class RAGEngine {
    constructor() {
      this.chunks = [];
      this.idf = {};
      this.isReady = false;
    }

    buildIndex(data, chunkSize = 200) {
      this.chunks = [];
      for (const [label, doc] of Object.entries(data)) {
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
        const words = new Set((ch.text.toLowerCase().match(/\b\w+\b/g) || []));
        for (const w of words) this.idf[w] = (this.idf[w] || 0) + 1;
      }
      for (const w in this.idf) {
        this.idf[w] = Math.log(total / (1 + this.idf[w]));
      }
      this.isReady = true;
    }

    retrieve(query, topK = 3) {
      if (!this.isReady || this.chunks.length === 0) return [];
      const qWords = (query.toLowerCase().match(/\b\w+\b/g) || []);
      const qTF = {};
      for (const w of qWords) qTF[w] = (qTF[w] || 0) + 1;

      const scores = this.chunks.map((ch, idx) => {
        const cWords = (ch.text.toLowerCase().match(/\b\w+\b/g) || []);
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

  async function askLLM(prompt, model) {
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LLM error: ${res.status}`);
    return await res.text();
  }

  class RAGinaUI {
    constructor(engine, config) {
      this.engine = engine;
      this.config = config;
      this.bubble = null;
      this.panel = null;
      this.messages = null;
      this.input = null;
      this.sendBtn = null;
    }

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1],16)}, ${parseInt(result[2],16)}, ${parseInt(result[3],16)}` : '108,99,255';
    }

    injectStyles() {
      if (document.getElementById('ragina-styles')) return;
      const primary = this.config.theme?.primary || '#6C63FF';
      const rgb = this.hexToRgb(primary);
      const css = `
@keyframes ragina-pulse{0%,100%{box-shadow:0 0 0 0 rgba(${rgb},0.5)}50%{box-shadow:0 0 0 18px rgba(${rgb},0)}}
@keyframes ragina-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.ragina-bubble{position:fixed;${this.config.position==='bottom-left'?'left:24px;':'right:24px;'}bottom:24px;width:60px;height:60px;border-radius:50%;background:${primary};border:none;cursor:pointer;z-index:99999;font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform 0.3s;animation:ragina-float 4s ease-in-out infinite,ragina-pulse 2s infinite;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
.ragina-bubble:hover{transform:scale(1.15);animation:none}
.ragina-bubble img{width:44px;height:44px;border-radius:50%}
.ragina-panel{position:fixed;${this.config.position==='bottom-left'?'left:24px;':'right:24px;'}bottom:100px;width:380px;max-width:92vw;height:520px;max-height:70vh;background:#0f0f1a;border-radius:20px;z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(${rgb},0.4);box-shadow:0 0 40px rgba(${rgb},0.2),0 20px 60px rgba(0,0,0,0.6);transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);font-family:system-ui,sans-serif}
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
@keyframes ragina-typing{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-8px);opacity:1}}
`;
      const style = document.createElement('style');
      style.id = 'ragina-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    build() {
      this.injectStyles();

      const avatarContent = this.config.avatarUrl 
        ? `<img class="ragina-avatar" src="${this.config.avatarUrl}" alt="RAGina" style="object-fit:cover;">` 
        : `<div class="ragina-avatar">🔮</div>`;

      // Bubble
      this.bubble = document.createElement('button');
      this.bubble.className = 'ragina-bubble';
      this.bubble.title = this.config.title || 'RAGina – Your Mentalist RAG';
      this.bubble.innerHTML = this.config.bubbleIcon || '🔮';
      document.body.appendChild(this.bubble);

      // Panel
      this.panel = document.createElement('div');
      this.panel.className = 'ragina-panel hidden';
      this.panel.innerHTML = `
        <div class="ragina-header">
          ${avatarContent}
          <div class="ragina-header-info">
            <div class="ragina-header-name">${this.config.title || 'RAGina'}</div>
            <div class="ragina-header-status">🧠 Mentalist Online</div>
          </div>
          <button class="ragina-close">✕</button>
        </div>
        <div class="ragina-messages"></div>
        <div class="ragina-input-area">
          <input type="text" class="ragina-input" placeholder="${this.config.placeholder || 'Ask me anything...'}" ${this.engine.isReady ? '' : 'disabled'}>
          <button class="ragina-send" ${this.engine.isReady ? '' : 'disabled'}>➤</button>
        </div>
      `;
      document.body.appendChild(this.panel);

      this.messages = this.panel.querySelector('.ragina-messages');
      this.input = this.panel.querySelector('.ragina-input');
      this.sendBtn = this.panel.querySelector('.ragina-send');

      // Events
      this.bubble.addEventListener('click', () => this.toggle());
      this.panel.querySelector('.ragina-close').addEventListener('click', () => this.hide());
      this.sendBtn.addEventListener('click', () => this.handleSend());
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSend();
      });

      if (this.engine.isReady) {
        this.addMessage(randomQuote(QUOTES.ready), 'ai');
      } else {
        this.addMessage("I'm ready! Upload some files or load an index to get started.", 'ai');
      }
    }

    toggle() { this.panel.classList.toggle('hidden'); if (!this.panel.classList.contains('hidden')) this.input.focus(); }
    hide() { this.panel.classList.add('hidden'); }
    show() { this.panel.classList.remove('hidden'); this.input.focus(); }

    addMessage(text, sender, sources = []) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ragina-msg ${sender}`;
      const bubble = document.createElement('div');
      bubble.className = 'ragina-bubble-text';
      bubble.textContent = text;
      msgDiv.appendChild(bubble);
      if (sources.length > 0) {
        const src = document.createElement('div');
        src.className = 'ragina-sources';
        src.textContent = '📌 ' + sources.map(s => (s.source || '').split('/').pop() + '…').join(' · ');
        msgDiv.appendChild(src);
      }
      this.messages.appendChild(msgDiv);
      this.messages.scrollTop = this.messages.scrollHeight;
      return msgDiv;
    }

    showTyping() {
      const div = document.createElement('div');
      div.className = 'ragina-msg ai';
      div.innerHTML = '<div class="ragina-typing"><span></span><span></span><span></span></div>';
      this.messages.appendChild(div);
      this.messages.scrollTop = this.messages.scrollHeight;
      return div;
    }

    async handleSend() {
      const question = this.input.value.trim();
      if (!question || !this.engine.isReady) return;
      this.input.value = '';
      this.sendBtn.disabled = true;

      this.addMessage(question, 'user');
      const typingDiv = this.showTyping();

      const topChunks = this.engine.retrieve(question, this.config.topK || 3);
      
      const context = topChunks.length > 0 
        ? topChunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n')
        : 'No relevant documents found.';

      const personality = this.config.personality || 'sassy';
      const prompt = personality === 'professional'
        ? `Answer the question using ONLY the context below. If the answer cannot be found, say "I don't have enough information to answer that."

Context:
${context}

Question: ${question}
Answer:`
        : `You are RAGina, a sassy mentalist who can read any document. Answer using ONLY the context below. If the answer isn't there, respond with attitude that the info isn't in the files.

Context:
${context}

Question: ${question}
Answer (as RAGina, with sass):`;

      try {
        const answer = await askLLM(prompt, this.config.model);
        typingDiv.remove();
        this.addMessage(answer, 'ai', topChunks);
      } catch (err) {
        typingDiv.remove();
        this.addMessage(randomQuote(QUOTES.error) + ' ' + err.message, 'ai');
      }
      this.sendBtn.disabled = false;
      this.input.focus();
    }
  }

  // ==================== Public API ====================
  const RAGina = {
    engine: null,
    ui: null,
    config: {},

    init(config = {}) {
      const defaultConfig = {
        indexUrl: null,
        position: 'bottom-right',
        placeholder: 'Ask me anything...',
        topK: 3,
        model: 'openai',
        avatarUrl: null,
        bubbleIcon: '🔮',
        title: 'RAGina',
        personality: 'sassy',
        theme: { primary: '#6C63FF' },
        chunkSize: 200,
      };
      this.config = { ...defaultConfig, ...config };
      this.engine = new RAGEngine();

      const finishInit = () => {
        this.ui = new RAGinaUI(this.engine, this.config);
        this.ui.build();
      };

      // Check for embedded index first
      if (window.__RAGINA_INDEX__ && typeof window.__RAGINA_INDEX__ === 'object') {
        this.engine.buildIndex(window.__RAGINA_INDEX__, this.config.chunkSize);
        finishInit();
        this.ui.show();
        return;
      }

      // Try fetching from URL
      if (this.config.indexUrl) {
        fetch(this.config.indexUrl)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            this.engine.buildIndex(data, this.config.chunkSize);
            finishInit();
            this.ui.show();
          })
          .catch(err => {
            console.warn('RAGina: Could not load index from URL.', err.message);
            finishInit();
          });
      } else {
        finishInit();
      }
    },

    loadData(data) {
      if (!this.engine) this.engine = new RAGEngine();
      this.engine.buildIndex(data, this.config.chunkSize);
      if (this.ui) {
        this.ui.messages.innerHTML = '';
        this.ui.input.disabled = false;
        if (this.ui.sendBtn) this.ui.sendBtn.disabled = false;
        this.ui.addMessage(randomQuote(QUOTES.ready), 'ai');
      } else {
        this.ui = new RAGinaUI(this.engine, this.config);
        this.ui.build();
        this.ui.show();
      }
    },

    async loadFolder(fileList) {
      const files = [...fileList].filter(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
      const data = {};
      for (const file of files) {
        const text = await file.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        data[file.webkitRelativePath || file.name] = {
          bodyText: (doc.body?.textContent || '').trim()
        };
      }
      this.loadData(data);
    },

    getEngine() { return this.engine; },

    ask(question) {
      if (!this.ui) return;
      this.ui.input.value = question;
      this.ui.handleSend();
    }
  };

  global.RAGina = RAGina;

  // Auto-init if config exists
  if (global.RAGINA_CONFIG) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => RAGina.init(global.RAGINA_CONFIG));
    } else {
      RAGina.init(global.RAGINA_CONFIG);
    }
  }

})(typeof window !== 'undefined' ? window : this);