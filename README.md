```markdown
<p align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/smile.png" alt="RAGina Mascot" width="140" style="border-radius: 30px; box-shadow: 0 0 40px rgba(108,99,255,0.3);"/>
</p>

<p align="center">
  <img src="https://ragina-crawler-ragina.vercel.app/ragina-logo.png" alt="RAGina" width="60" style="border-radius: 50%; animation: spin 10s linear infinite;"/>
</p>

<h1 align="center">🧠 RAGina – Your In‑Browser Companion</h1>

<p align="center">
  <i>“Your in‑browser companion. She knows it all. Just ask her – she knows exactly what you're looking for.”</i>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="MIT License"></a>
  <a href="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t5.js"><img src="https://img.shields.io/badge/CDN-jsDelivr-orange" alt="jsDelivr CDN"></a>
  <a href="#"><img src="https://img.shields.io/badge/API_Keys-None-brightgreen" alt="No API Keys"></a>
  <a href="#"><img src="https://img.shields.io/badge/T5_v5.4.0-21_Tools-6C63FF" alt="T5"></a>
  <a href="#"><img src="https://img.shields.io/badge/Versions-T1_·_T2_·_T3_·_T4_·_T5_·_Pro_·_Voice-FF6584" alt="Versions"></a>
</p>

---

> 💡 **One `<script>` tag. Zero API keys. Zero servers. Zero cost.**  
> Turn any website, repo, or document into an AI‑powered Q&A chatbot in seconds.  
> **And now she hears you. She talks back. She remembers everything. She files forms. She plans in steps.**

---

## 📚 The RAGina Family — 7 Editions, One Lineage

RAGina grew up over five major iterations. Each one added a layer of power. **You don't need the latest — pick the one that fits your page.**

<div align="center">

| Edition | Version | Tagline | Size | Best for |
|---------|---------|---------|------|----------|
| **`ragina.js`** | latest | **Standard** — minimal RAG chatbot | small | Quick chat widget |
| **`ragina-t1.js`** | 4.0.0 | **Core** — ReAct agent foundation | ~30KB | First agentic loop |
| **`ragina-t2.js`** | 4.0.1 | **Advanced** — streaming + hybrid RAG | ~60KB | Multi-format docs |
| **`ragina-t3.js`** | 3.1.0 | **Vision** — face & hand detection | ~80KB | Gesture/expression AI |
| **`ragina-t4.js`** | 4.0.0 | **XENO** — OS integration, local AI | ~120KB | Full device control |
| **`ragina-t5.js`** | 5.4.0 | **Flagship** — standalone agent with forms + multi-step | ~65KB | **Recommended** |
| **`ragina-pro.js`** | 2.3.5 | **Pro** — voice + music + memory | ~40KB | Full-featured chat |
| **`ragina-voice.js`** | 2.4.0 | **Voice** — VAD + barge-in | ~45KB | Real-time voice UI |

</div>

---

## 🚀 Quick Start — Pick Your Edition

### 🟣 Standard — minimal chatbot
```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
```

🔥 Pro — voice, music, memory

```html
<script>
  window.RAGINA_CONFIG = {
    apiBaseUrl: 'https://your-worker.com',
    indexUrl: 'https://your-knowledge.json'
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-pro.js"></script>
```

🎙️ Voice — with VAD and barge-in

```html
<script src="vad-web.js"></script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-voice.js"></script>
```

🚀 T5 — the flagship ⭐

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t5.js"></script>
<script>
(async () => {
  await R5.init({ voiceId: 'rachel' });
  R5.registerAll();  // 21 tools

  await R5.loadData({
    'handbook.txt': 'Vacation policy: 20 days per year...'
  });

  const r = await R5.query('How many vacation days do I get?');
  console.log(r.answer);
})();
</script>
```

---

🧬 The Lineage — What Each Edition Added

🧠 T1 — The Foundation (v4.0.0)

The original agentic loop. Everything after this builds on its skeleton.

· ReAct loop — the TOOL_CALL → execute → observe → ANSWER cycle that powers every subsequent version
· Multi-endpoint fallback — if the primary backend fails, retries the next; never dead-ends
· Smart caching — identical queries within 60 seconds return instantly
· TF-IDF retrieval — the first RAG pipeline: chunk documents, score by term frequency, retrieve top chunks
· Headless mode — works without a DOM (Node.js, workers, tests)
· 6 tools: webSearch, scheduleEvent, draftEmail, getTime, calculate, openUrl
· Chat widget — the first draggable orb

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t1.js"></script>
```

Backend: ragina-crawler-ragina.vercel.app/api/ask
Best for: Learning the ReAct pattern, minimal embedding.

---

⚡ T2 — Advanced Retrieval (v4.0.1)

T1 + real hybrid RAG + streaming + 18 tools.

New over T1:

· Hybrid RAG — TF-IDF + semantic embeddings (128-dim hash vectors), weighted fusion
· Query expansion — synonyms added before retrieval (price → cost, value, worth)
· Real-time streaming — SSE token-by-token rendering from /api/ask/stream
· Multi-format parsers — PDF, DOCX, TXT, CSV, JSON, MD, HTML
· 12 new tools: codeRunner, generateFile, extractFromUrl, translate, summarizeDoc, compareDocs, remember, recall, weather, stockPrice, analyzeCSV, createChart
· Persistent sessions — chat history in localStorage, resumable
· Long-term memory — remember/recall tools backed by localStorage
· Markdown renderer — proper code blocks with copy buttons
· Plugin system — on('event', fn) event bus
· Resizable panel — CSS resize: both
· Drag-drop uploads

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t2.js"></script>
```

Backend: same as T1, plus /api/ask/stream
Best for: Document Q&A, code-aware agents, real streaming UX.

---

👁️ T3 — The All-Seeing Desi Agent (v3.1.0)

T2 + vision + multilingual personality.

New over T2:

· Face & hand vision — MediaPipe FaceMesh + Hands
  · Expression detection: happy, sad, surprised, angry, sleepy, neutral
  · Gesture detection: thumbs up/down, peace, pointing, fist, OK, call me, rock on
  · Gaze tracking: left, right, up, down, center
· Hinglish / Tenglish / Slang language engine — auto-detects the user's mix and replies in kind. Full word lists for Hindi-English, Telugu-English, and Gen-Z slang
· 5 vision tools: readGesture, readExpression, describeScene, countPeople, checkAttention
· Camera preview — live video + landmark overlay in the panel
· 23 total tools
· Reactive phrases — when a gesture is detected, she comments on it in your chosen language

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t3.js"></script>
```

Backend: api.openai.com/v1/chat/completions (requires your own key — set apiKey in config)
Best for: Accessibility agents, multilingual chat, gesture-driven UI experiments.

⚠️ Note: T3 requires an OpenAI API key. If you want to avoid that, use T2 (backed by the free Vercel proxy) or T5.

---

🌐 T4 — XENO Edition (v4.0.0)

T3 + OS integration + local AI + native bridge. The most ambitious version.

New over T3:

· OSBridge — deep browser API access:
  · File System Access API — open folders, read/write files directly on disk
  · Web Bluetooth — pair with BLE devices
  · Web Serial — connect to Arduino, Raspberry Pi, embedded devices
  · Screen capture & recording — full OS screenshot, video recording
  · Notifications — native push
  · Wake Lock — prevent screen sleep
  · Geolocation — GPS coords
  · Battery, network, GPU info — full device telemetry
  · Clipboard (text + images)
  · Web Share — native share sheet
  · MIDI, Gamepad, NFC, Idle detection — full sensor suite
· LocalInferenceEngine — run LLMs entirely offline via Transformers.js + WebGPU
  · Embeddings: all-MiniLM-L6-v2
  · Chat: Qwen2.5-0.5B-Instruct (q4 quantized, ~300MB)
· VectorStore — persistent IndexedDB vector storage for unlimited documents
· NativeBridge — optional companion app (Electron/Tauri) at localhost:7777 unlocks:
  · runShell — execute shell commands
  · openApp — launch any installed app
  · typeTextOS — OS-level keyboard injection
  · screenshotFullOS — screenshot other monitors
  · volumeControl, mediaControl — system media
· ~38 tools total including 15+ OS-specific tools
· Vision (same as T3)
· Language engine (same as T3)

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t4.js"></script>
```

Backend: ragina-crawler-ragina.vercel.app/api/ask (falls back to local AI if offline)
Best for: Desktop-app replacements, kiosks, IoT control, offline-first agents.

💡 T5 pairs with T4. Load both, and T5's tools auto-register into T4's engine. You get T5's form/multi-step/guide tools plus T4's OS/vision superpowers.

---

🚀 T5 — The Flagship (v5.4.0) ⭐

Standalone, production-grade, zero-dependency. Start here unless you need T4's OS tools.

What's new:

· 21 tools — every tool the agent needs, cleanly scoped
· Schema validation — every argument checked before execution. Bad args become observations, not crashes
· Hybrid RAG with auto-retrieval — every R5.query() retrieves top-5 chunks automatically
· Speech pipeline — the fix for TTS on long lists:
  · Strips markdown, emojis, URLs before synthesis
  · Policy detection: FULL / SUMMARY_ONLY / SILENT
  · Auto-chunks at sentence boundaries (1500 chars)
  · Server TTS with native fallback
· Form automation with confirmation — submitForm never submits alone; returns pendingConfirmation that only the UI can resolve
· Multi-step orchestrator — planAndExecute decomposes a goal → runs each step → synthesizes the answer
· Downloadable guides — generateGuide produces Markdown/HTML files on demand
· Device tier detection — FULL_GPU / MOBILE_GPU / WASM_MULTITHREADED / WASM_SINGLE_THREAD, and the agent gates features accordingly
· IndexedDB persistence — RAG index survives page reloads
· Fully standalone — no T4 required (but pairs with it)
· Zero API keys — uses the free Vercel proxy

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t5.js"></script>
<script>
(async () => {
  await R5.init({ voiceId: 'rachel' });
  R5.registerAll();
})();
</script>
```

Backend: ragina-crawler-ragina.vercel.app/api/ask + sensycilva.suryasticsai.workers.dev/api/tts
Best for: Production websites, form automation, mobile-first agents, anything you plan to ship.

The 21 T5 tools

Category Tools
Voice speak, stopSpeaking, setMuted
Music playSong, pauseMusic, stopMusic
Forms readForms, fillForm, submitForm, fetchAPI
RAG indexUrl, indexText, searchKnowledge, listKnowledge, clearKnowledge
Meta describeCapabilities, generateGuide
Orchestration planAndExecute
Utilities webSearch, calculate, getTime

---

💎 Pro (v2.3.5)

The all-in-one production UI. Voice + music + persistent memory, delivered as a beautiful floating orb.

Features:

· 🎤 Speech Recognition — click the mic, talk, she transcribes and answers
· 🔊 Text-to-Speech — reads responses aloud in the "Rachel" voice via /api/tts
· 🎵 YouTube music — search and play songs with full controls (pause, skip, progress bar)
· 🧠 Persistent memory — every conversation saved to IndexedDB
· 📝 Selected-text awareness — highlight text on the page, ask "what does this mean?"
· 🖱️ Draggable orb — move her anywhere, minimize with a click
· 💾 Export / import chat — JSON download/upload
· Auto-saved conversations — status indicator in the toolbar

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-pro.js"></script>
```

Best for: Ready-made chat widget for a real product.

---

🎙️ Voice (v2.4.0)

Pro with real-time voice activity detection and barge-in — she stops talking the moment you start.

Unique to this edition:

· Continuous VAD — mic stays on, she listens automatically
· Barge-in — interrupt her at any moment; both TTS and the LLM call are aborted
· Zero-beep listening — no sound effects, no jarring transitions
· No push-to-talk needed — conversational flow

```html
<script src="vad-web.js"></script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-voice.js"></script>
```

Requires: vad-web.js (Silero VAD)
Best for: Voice-first experiences, accessibility agents, hands-free kiosks.

---

📊 Feature Matrix — Side by Side

<div align="center">

Feature T1 T2 T3 T4 T5 Pro Voice
ReAct agentic loop ✅ ✅ ✅ ✅ ✅ — —
TF-IDF / hybrid RAG TF-IDF Hybrid Hybrid Hybrid Hybrid ✅ ✅
Streaming responses ❌ ✅ ❌ ❌ ❌ ❌ ❌
Voice output (TTS) ❌ ❌ ✅ ✅ ✅ ✅ ✅
Voice input (STT) ❌ ❌ ✅ ✅ ❌ ✅ ✅
VAD + barge-in ❌ ❌ ❌ ❌ ❌ ❌ ✅
Music (YouTube) ❌ ❌ ❌ ❌ ✅ ✅ ✅
Form automation ❌ ❌ ❌ ❌ ✅ ❌ ❌
Multi-step planning ❌ ❌ ❌ ❌ ✅ ❌ ❌
Downloadable guides ❌ ❌ ❌ ❌ ✅ ❌ ❌
Schema validation ❌ ❌ ❌ ❌ ✅ ❌ ❌
Device tier detection ❌ ❌ ❌ ❌ ✅ ❌ ❌
Vision (face/hands) ❌ ❌ ✅ ✅ ❌ ❌ ❌
Multilingual (Hinglish/Tenglish) ❌ ❌ ✅ ✅ ❌ ❌ ❌
OS bridge ❌ ❌ ❌ ✅ ❌ ❌ ❌
Local AI (offline) ❌ ❌ ❌ ✅ ❌ ❌ ❌
Native bridge (Electron) ❌ ❌ ❌ ✅ ❌ ❌ ❌
Multi-format docs (PDF/DOCX) ❌ ✅ ✅ ✅ ✅ ❌ ❌
Persistent index ❌ ✅ ✅ ✅ ✅ ✅ ✅
Zero API keys ✅ ✅ ❌ ✅ ✅ ✅ ✅
Standalone file ✅ ✅ ✅ ✅ ✅ ✅ ✅
Tool count 6 18 23 38 21 — —

</div>

---

🎯 Which Edition Should I Use?

<div align="center">

Your need Use this
"I just want a chat widget that works" ragina-pro.js
"I want the most feature-rich agent" ragina-t5.js ⭐
"I need form automation" ragina-t5.js
"I need multi-step task planning" ragina-t5.js
"I want vision — face/gesture detection" ragina-t3.js or ragina-t4.js
"I want full OS integration — files, bluetooth, serial" ragina-t4.js
"I want offline local LLM inference" ragina-t4.js
"I want real-time voice with barge-in" ragina-voice.js
"I want to learn how agents work" ragina-t1.js (read the source)
"I want streaming + PDF parsing" ragina-t2.js

</div>

---

⚡ T5 Deep Dive — The Flagship

🧠 Hybrid RAG with Auto-Retrieval

Every R5.query() automatically retrieves the top-5 relevant chunks before calling the LLM:

```js
await R5.loadData({
  'handbook.txt': 'Vacation policy: 20 days per year...',
  'faq.md': 'Q: Reset password? A: Click "Forgot password"...'
});

const r = await R5.query('How many vacation days do I get?');
// → chunks retrieved automatically → LLM answers with context
```

Zero downloads. The embedding engine is pure JavaScript — 128-dim hash vectors computed in microseconds. Works on WASM_SINGLE_THREAD phones. Persists to IndexedDB.

🔊 Speech Pipeline — Reads What's Readable

```js
toSpeakable("Here are 5 hotels:\n- Grand\n- Inn\n- Suites\n- Lodge\n- View");
// → { policy: 'SUMMARY_ONLY',
//     chunks: ["Here are 5 hotels. The details are on your screen — please follow the context there."] }
```

· Detects lists, code, long text → switches to SUMMARY_ONLY
· Strips markdown/emoji/URLs before synthesis
· Chunks at sentence boundaries for clean playback
· Server TTS → native fallback if server fails

📝 Form Automation — Confirmation Gate

```js
fillForm('signupForm', { name: 'Priya', email: 'priya@example.com' });
// → { filled: [{key:'name',...}, ...] }

submitForm('signupForm');
// → { pendingConfirmation: true, actionId: '...', summary: {...} }

resolveSubmit(actionId, true);  // user clicked "Approve"
```

The agent cannot submit a form without your approval. Enforced at the tool layer — no prompt injection can bypass it.

🪄 Multi-Step Orchestration

```js
await R5.planAndExecute('Search my notes for Q3 revenue and draft a summary email');
// → { plan: ['Search KB...', 'Extract figures...', 'Draft email...'],
//     results: [...],
//     answer: 'Q3 revenue was $4.2M, up 18%...',
//     traceSummary: { total: 3, tools: [...], duration: 8420 } }
```

Each sub-step calls the full agent with accumulated context. Failures don't crash — they're traced and the orchestrator continues.

📱 Device Tier Detection

Tier What runs
FULL_GPU Everything
MOBILE_GPU Vision gated
WASM_MULTITHREADED CPU fallback
WASM_SINGLE_THREAD Voice-first, light tools

The agent can report this honestly: "On this device I can read documents and speak answers, but heavy vision needs a GPU I can't see."

📄 Downloadable Guides

```js
const g = R5.guide.build({
  title: 'How to book a flight',
  markdown: '1. Enter origin\n2. Enter destination\n3. Pick a date...'
});
R5.guide.download(g.urlHTML, 'flight-guide.html');
```

---

🔌 T5 + T4 Together (Optional)

If you load both files, T5's 21 tools auto-register into T4's engine. You get T4's vision + OS tools and T5's forms + multi-step + guides.

```html
<script src="ragina-t4.js"></script>
<script src="ragina-t5.js"></script>
<script>
(async () => {
  await R5.init({ voiceId: 'rachel' });
  R5.registerAll();
  // T4 now sees ~54 tools (T4's ~38 + T5's 21, minus overlap)
  console.log(RAGina.listTools().length);
})();
</script>
```

When both are loaded, R5.query() delegates to T4's runAgent — you get T4's vision/OS capabilities for free. When T5 runs alone, it uses its own self-contained ReAct loop.

---

🔮 Try the Full App

<p align="center">
  <a href="https://suryasticsai.github.io/RAGina">
    <img src="https://img.shields.io/badge/Try%20the%20App-🔮%20Live%20Demo-blueviolet?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

· Explore & Scrape — enter a website or GitHub repo, pick pages, scrape them
· Save to Gist — login with GitHub, save knowledge as a public Gist
· Chat — ask questions immediately
· Edit the KB — modify knowledge base JSON in the app
· Raise a PR — for repos, she can inject the chatbot snippet and open a Pull Request

---

🎭 Meet the Mentalist — 7 Expressive Moods

<div align="center">

<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/research.png" width="80" alt="Deep Research"/>
<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/doubt.png" width="80" alt="Doubt Detected"/>
<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/crosshands.png" width="80" alt="Cross Hands"/>
<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/shrug-what.png" width="80" alt="Shrug"/>
<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance1.png" width="80" alt="Victory Dance"/>
<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance2.png" width="80" alt="Happy Dance"/>
<img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance3.png" width="80" alt="Celebration"/>

</div>

<div align="center">

Expression Quote
🔍 Deep Research “Scanning every document…”
🤨 Doubt Detected “That’s not in the files…”
💢 Cross Hands “Organize better, human!”
🤷 Shrug “Your files are silent on this.”
💃 Victory Dance “Found it, darling!”
🕺 Happy Dance “Piece of cake!”
🎉 Celebration “Knew exactly where that was!”

</div>

---

🌟 Built with RAGina

RAGina's powers don't stop here. She's the engine behind SensyCilva — an autonomous Anime Visual Radio Station that streams visuals and answers questions using the same mentalist magic.
Check it out: github.com/suryasticsai/sensycilva

---

🛠️ Backend Endpoints

RAGina's free backends — no key needed:

Endpoint Used by Purpose
ragina-crawler-ragina.vercel.app/api/ask T1, T2, T4, T5 LLM inference
ragina-crawler-ragina.vercel.app/api/ask/stream T2 SSE streaming
sensycilva.suryasticsai.workers.dev/api/tts Pro, Voice, T5 Text-to-speech
sensycilva.suryasticsai.workers.dev/api/youtube/search Pro, Voice, T5 YouTube search

T3 uses api.openai.com and requires your own key.

To self-host, override the config:

```js
window.RAGINA_CONFIG = {
  apiBaseUrl: 'https://your-worker.com',
  ttsUrl: 'https://your-worker.com/api/tts'
};
```

---

👤 Creator

Sai Varakala (Surya)

· GitHub: @suryasticsai
· Email: suryasticsai@gmail.com

---

📜 License

MIT — use freely, modify, distribute. Credit is appreciated.

---

🔮 RAGina — Your in-browser companion. She knows it all. Just ask her — she knows exactly what you're looking for.
She speaks. She listens. She remembers. She files forms. She plans in steps. The future of AI is here.
Five iterations. One mentalist. Pick your edition and go.

```