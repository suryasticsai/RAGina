/*!
 * RAGina.js v1.0.0
 * Mentalist RAG - She reads everything, forgets nothing.
 * MIT License - Use freely, credit appreciated.
 * 
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/ragina/ragina.min.js"></script>
 *   <script>
 *     RAGina.init({
 *       indexUrl: './index.json',
 *       position: 'bottom-right',
 *       personality: 'sassy',
 *       theme: { primary: '#6C63FF' }
 *     });
 *   </script>
 */
(function (global) {
  'use strict';

  // ==================== RAGina Mentalist Quotes ====================
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

  // ==================== TF-IDF Engine ====================
  class RAGEngine {
    constructor() {
      this.chunks = [];
      this.idf = {};
      this.isReady = false;
    }

    buildIndex(data, chunkSize = 200) {
      this.chunks = [];
      for (const [label, doc] of Object.entries(data)) {
        const bodyText = doc.bodyText || doc.body || '';
        if (bodyText.length < 50) continue;

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
      const total = this.chunks.length;
      for (const ch of this.chunks) {
        const words = new Set(ch.text.toLowerCase().match(/\b\w+\b/g));
        for (const w of words) this.idf[w] = (this.idf[w] || 0) + 1;
      }
      for (const w in this.idf) {
        this.idf[w] = Math.log(total / (1 + this.idf[w]));
      }
      this.isReady = true;
    }

    retrieve(query, topK = 3) {
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

  // ==================== LLM Call ====================
  async function askLLM(prompt, model = 'openai') {
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LLM error: ${res.status}`);
    return await res.text();
  }

  // ==================== UI Builder ====================
  class RAGinaUI {
    constructor(engine, config) {
      this.engine = engine;
      this.config = config;
      this.container = null;
      this.bubble = null;
      this.panel = null;
      this.messages = null;
      this.input = null;
    }

    injectStyles() {
      if (document.getElementById('ragina-styles')) return;
      const css = `
        @keyframes ragina-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(${this.hexToRgb(this.config.theme.primary)}, 0.5); }
          50% { box-shadow: 0 0 0 18px rgba(${this.hexToRgb(this.config.theme.primary)}, 0); }
        }
        @keyframes ragina-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ragina-glow {
          0%, 100% { filter: drop-shadow(0 0 6px ${this.config.theme.primary}); }
          50% { filter: drop-shadow(0 0 16px ${this.config.theme.primary}); }
        }
        .ragina-bubble {
          position: fixed; ${this.config.position === 'bottom-left' ? 'left:24px;' : 'right:24px;'}
          bottom: 24px; width: 60px; height: 60px; border-radius: 50%;
          background: ${this.config.theme.primary}; border: none; cursor: pointer;
          z-index: 99999; font-size: 28px; display: flex; align-items: center;
          justify-content: center; transition: transform 0.3s, box-shadow 0.3s;
          animation: ragina-float 4s ease-in-out infinite, ragina-pulse 2s infinite;
        }
        .ragina-bubble:hover { transform: scale(1.15); animation: none; }
        .ragina-bubble img { width: 44px; height: 44px; border-radius: 50%; }
        .ragina-panel {
          position: fixed; ${this.config.position === 'bottom-left' ? 'left:24px;' : 'right:24px;'}
          bottom: 100px; width: 380px; max-width: 92vw; height: 520px; max-height: 70vh;
          background: #0f0f1a; border-radius: 20px; z-index: 99999;
          display: flex; flex-direction: column; overflow: hidden;
          border: 1px solid rgba(108,99,255,0.4);
          box-shadow: 0 0 40px rgba(108,99,255,0.2), 0 20px 60px rgba(0,0,0,0.6);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: system-ui, sans-serif;
        }
        .ragina-panel.hidden {
          opacity: 0; pointer-events: none;
          transform: translateY(30px) scale(0.95);
        }
        .ragina-header {
          background: linear-gradient(135deg, ${this.config.theme.primary}, #8b7cff);
          padding: 14px 18px; display: flex; align-items: center; gap: 12px;
        }
        .ragina-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid white; }
        .ragina-header-info { flex: 1; color: white; }
        .ragina-header-name { font-weight: 700; font-size: 1.1rem; }
        .ragina-header-status { font-size: 0.7rem; opacity: 0.8; }
        .ragina-close {
          background: rgba(255,255,255,0.2); border: none; color: white;
          width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;
        }
        .ragina-messages {
          flex: 1; padding: 16px; overflow-y: auto;
          background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
        }
        .ragina-messages::-webkit-scrollbar { width: 4px; }
        .ragina-messages::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.4); border-radius: 4px; }
        .ragina-msg { margin-bottom: 14px; display: flex; flex-direction: column; }
        .ragina-msg.user { align-items: flex-end; }
        .ragina-msg.user .ragina-bubble-text {
          background: ${this.config.theme.primary}; color: white;
          border-radius: 18px 18px 4px 18px;
        }
        .ragina-msg.ai .ragina-bubble-text {
          background: rgba(108,99,255,0.1); color: #ddd;
          border: 1px solid rgba(108,99,255,0.3);
          border-radius: 18px 18px 18px 4px;
        }
        .ragina-bubble-text {
          max-width: 82%; padding: 10px 16px; font-size: 0.9rem; line-height: 1.5;
        }
        .ragina-sources {
          font-size: 0.65rem; color: rgba(108,99,255,0.7); margin-top: 4px;
          padding-left: 8px; font-style: italic;
        }
        .ragina-input-area { display: flex; padding: 10px; border-top: 1px solid rgba(108,99,255,0.2); background: #0f0f1a; }
        .ragina-input {
          flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(108,99,255,0.3);
          border-radius: 24px; padding: 10px 16px; color: white; font-size: 0.9rem; outline: none;
        }
        .ragina-input::placeholder { color: rgba(255,255,255,0.3); }
        .ragina-send {
          background: ${this.config.theme.primary}; border: none; border-radius: 50%;
          width: 40px; height: 40px; margin-left: 8px; cursor: pointer; color: white;
          font-size: 16px; transition: all 0.2s;
        }
        .ragina-send:hover { box-shadow: 0 0 15px rgba(108,99,255,0.6); }
        .ragina-send:disabled { opacity: 0.4; }
      `;
      const style = document.createElement('style');
      style.id = 'ragina-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1],16)}, ${parseInt(result[2],16)}, ${parseInt(result[3],16)}` : '108,99,255';
    }

    build() {
      this.injectStyles();

      // Bubble
      this.bubble = document.createElement('button');
      this.bubble.className = 'ragina-bubble';
      this.bubble.title = 'RAGina – Your Mentalist RAG';
      if (this.config.avatarUrl) {
        const img = document.createElement('img');
        img.src = this.config.avatarUrl;
        img.alt = 'RAGina';
        this.bubble.appendChild(img);
      } else {
        this.bubble.textContent = '🔮';
      }
      document.body.appendChild(this.bubble);

      // Panel
      this.panel = document.createElement('div');
      this.panel.className = 'ragina-panel hidden';
      this.panel.innerHTML = `
        <div class="ragina-header">
          <img class="ragina-avatar" src="${this.config.avatarUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%236C63FF%22/><text x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22>🔮</text></svg>'}" alt="RAGina">
          <div class="ragina-header-info">
            <div class="ragina-header-name">RAGina</div>
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
      const sendBtn = this.panel.querySelector('.ragina-send');
      const closeBtn = this.panel.querySelector('.ragina-close');

      // Events
      this.bubble.addEventListener('click', () => this.toggle());
      closeBtn.addEventListener('click', () => this.hide());
      sendBtn.addEventListener('click', () => this.handleSend());
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSend();
      });

      if (this.engine.isReady) {
        this.addMessage(randomQuote(QUOTES.ready), 'ai');
      }
    }

    toggle() { this.panel.classList.toggle('hidden'); }
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
        src.textContent = '📌 ' + sources.map(s => s.source.split('/').pop() + '…').join(' · ');
        msgDiv.appendChild(src);
      }
      this.messages.appendChild(msgDiv);
      this.messages.scrollTop = this.messages.scrollHeight;
    }

    async handleSend() {
      const question = this.input.value.trim();
      if (!question || !this.engine.isReady) return;
      this.input.value = '';

      this.addMessage(question, 'user');
      this.addMessage(randomQuote(QUOTES.thinking), 'ai');

      const topChunks = this.engine.retrieve(question, this.config.topK || 3);
      const context = topChunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n');

      const prompt = `You are RAGina, a sassy mentalist who can read any document. Answer using ONLY the context below. If the answer isn't there, respond with attitude that the info isn't in the files.

Context:
${context}

Question: ${question}
Answer (as RAGina, with sass):`;

      try {
        const answer = await askLLM(prompt, this.config.model);
        this.messages.lastChild.remove(); // remove thinking
        this.addMessage(answer, 'ai', topChunks);
      } catch (err) {
        this.messages.lastChild.remove();
        this.addMessage(randomQuote(QUOTES.error) + ' ' + err.message, 'ai');
      }
    }
  }

  // ==================== Public API ====================
  const RAGina = {
    engine: null,
    ui: null,

    init(config = {}) {
      const defaultConfig = {
        indexUrl: './index.json',
        position: 'bottom-right',
        placeholder: 'Ask me anything…',
        topK: 3,
        model: 'openai',
        avatarUrl: null,
        theme: { primary: '#6C63FF' },
      };
      this.config = { ...defaultConfig, ...config };
      this.engine = new RAGEngine();

      // Load index
      fetch(this.config.indexUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          this.engine.buildIndex(data, this.config.chunkSize);
          this.ui = new RAGinaUI(this.engine, this.config);
          this.ui.build();
          this.ui.show();
        })
        .catch(err => {
          console.warn('RAGina: Could not load index. Running in manual mode.', err.message);
          this.ui = new RAGinaUI(this.engine, this.config);
          this.ui.build();
        });
    },

    /** Load custom data programmatically */
    loadData(data) {
      this.engine.buildIndex(data);
      if (this.ui) {
        this.ui.messages.innerHTML = '';
        this.ui.input.disabled = false;
        this.ui.panel.querySelector('.ragina-send').disabled = false;
        this.ui.addMessage(randomQuote(QUOTES.ready), 'ai');
      }
    },

    /** Load a folder of HTML files */
    async loadFolder(fileList) {
      const files = [...fileList].filter(f => f.name.endsWith('.html'));
      const data = {};
      for (const file of files) {
        const text = await file.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');
        data[file.webkitRelativePath || file.name] = {
          bodyText: doc.body?.textContent?.trim() || ''
        };
      }
      this.loadData(data);
    },

    /** Get engine instance for direct use */
    getEngine() { return this.engine; }
  };

  // Expose globally
  global.RAGina = RAGina;

})(typeof window !== 'undefined' ? window : this);