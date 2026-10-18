<p align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/smile.png" alt="RAGina Mascot" width="140"/>
</p>

<p align="center">
  <img src="https://ragina-crawler-ragina.vercel.app/ragina-logo.png" alt="RAGina" width="60"/>
</p>

<h1 align="center">🧠 RAGina – Your In-Browser Companion</h1>

<p align="center"><i>“Your in-browser companion. She knows it all. Just ask her – she knows exactly what you're looking for.”</i></p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="MIT License"></a>
  <a href="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t5.js"><img src="https://img.shields.io/badge/CDN-jsDelivr-orange" alt="jsDelivr CDN"></a>
  <img src="https://img.shields.io/badge/API_Keys-None-brightgreen" alt="No API Keys">
  <img src="https://img.shields.io/badge/T5_v5.4.0-21_Tools-6C63FF" alt="T5">
  <img src="https://img.shields.io/badge/Editions-8-FF6584" alt="Editions">
</p>

---

> 💡 **One `<script>` tag. Zero API keys for supported editions. No backend deployment required to get started.**  
> Turn websites, repositories, and documents into AI-powered Q&A experiences.  
> **She listens. She speaks. She remembers. She fills forms. She plans in steps.**

## 📚 The RAGina Family — 8 Editions, One Lineage

RAGina evolved through five major agentic iterations alongside Standard, Pro, and Voice editions. Choose the edition that fits your application.

| Edition | Version | Identity | Approx. size | Best for |
|---|---|---|---|---|
| `ragina.js` | Latest | Standard — minimal RAG chatbot | Small | Quick chat widget |
| `ragina-t1.js` | 4.0.0 | Core — ReAct foundation | ~30 KB | Learning agentic loops |
| `ragina-t2.js` | 4.0.1 | Advanced — streaming + hybrid RAG | ~60 KB | Multi-format documents |
| `ragina-t3.js` | 3.1.0 | Vision — face and hand detection | ~80 KB | Gesture-aware AI |
| `ragina-t4.js` | 4.0.0 | XENO — OS integration + local AI | ~120 KB | Device-aware agents |
| **`ragina-t5.js`** | **5.4.0** | **Flagship — standalone agent** | **~65 KB** | **Forms + multi-step workflows** |
| `ragina-pro.js` | 2.3.5 | Pro — voice, music, memory | ~40 KB | Conversational UI |
| `ragina-voice.js` | 2.4.0 | Voice — VAD + barge-in | ~45 KB | Hands-free assistants |

## 🚀 Quick Start — Pick Your Edition

### 🟣 Standard — Minimal Chatbot

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
```

### 💎 Pro — Voice, Music, Memory

```html
<script>
  window.RAGINA_CONFIG = {
    apiBaseUrl: 'https://your-worker.com',
    indexUrl: 'https://your-knowledge.json'
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-pro.js"></script>
```

### 🎙️ Voice — VAD and Barge-in

```html
<script src="vad-web.js"></script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-voice.js"></script>
```

Requires Silero VAD (`vad-web.js`).

### 🚀 T5 — Flagship ⭐

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t5.js"></script>
<script>
(async () => {
  await R5.init({ voiceId: 'rachel' });
  R5.registerAll();

  await R5.loadData({
    'handbook.txt': 'Vacation policy: 20 days per year...'
  });

  const result = await R5.query('How many vacation days do I get?');
  console.log(result.answer);
})();
</script>
```

---

## 🧬 The Lineage — What Each Edition Added

### 🧠 T1 — The Foundation (v4.0.0)

The original ReAct agent loop. Later editions build on its architecture.

- **ReAct loop:** `TOOL_CALL → execute → observe → ANSWER`.
- **Multi-endpoint fallback:** retries alternate inference endpoints.
- **Smart caching:** identical queries within 60 seconds return cached results.
- **TF-IDF retrieval:** chunks documents, scores terms, and retrieves relevant passages.
- **Headless mode:** supports Node.js, workers, and tests without a DOM.
- **Chat widget:** draggable floating orb.
- **6 tools:** `webSearch`, `scheduleEvent`, `draftEmail`, `getTime`, `calculate`, `openUrl`.

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t1.js"></script>
```

**Backend:** `https://ragina-crawler-ragina.vercel.app/api/ask`  
**Best for:** Learning ReAct and embedding a minimal agent.

### ⚡ T2 — Advanced Retrieval (v4.0.1)

T1 plus hybrid retrieval, streaming, and 18 tools.

- **Hybrid RAG:** TF-IDF plus 128-dimensional hash-vector semantic approximation, with weighted fusion.
- **Query expansion:** enriches queries with related terms.
- **Streaming:** server-sent events through `/api/ask/stream`.
- **Multi-format parsing:** PDF, DOCX, TXT, CSV, JSON, Markdown, HTML.
- **12 additional tools:** `codeRunner`, `generateFile`, `extractFromUrl`, `translate`, `summarizeDoc`, `compareDocs`, `remember`, `recall`, `weather`, `stockPrice`, `analyzeCSV`, `createChart`.
- **Persistence:** resumable localStorage chat sessions and memory.
- **UI:** Markdown/code rendering, copy controls, resizable panel, drag-and-drop uploads.
- **Events:** plugin-style `on('event', fn)` subscriptions.

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t2.js"></script>
```

**Backend:** `/api/ask` and `/api/ask/stream`  
**Best for:** Document Q&A, streaming responses, and code-aware agents.

### 👁️ T3 — The All-Seeing Desi Agent (v3.1.0)

T2 plus computer vision and multilingual personality.

- **MediaPipe FaceMesh + Hands:** face and hand landmark detection.
- **Expressions:** happy, sad, surprised, angry, sleepy, neutral.
- **Gestures:** thumbs up/down, peace, pointing, fist, OK, call me, rock on.
- **Gaze:** left, right, up, down, center.
- **Language engine:** Hinglish, Tenglish, and slang recognition.
- **Vision tools:** `readGesture`, `readExpression`, `describeScene`, `countPeople`, `checkAttention`.
- **Camera UI:** live preview and landmark overlay.
- **23 tools total**, with reactive multilingual phrases.

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t3.js"></script>
```

**Backend:** OpenAI Chat Completions API.  
**Important:** T3 requires your own OpenAI API key. Avoid exposing secret API keys in public client-side code; use a trusted proxy for deployed apps.  
**Best for:** Vision experiments, accessibility, and gesture-driven interfaces.

### 🌐 T4 — XENO Edition (v4.0.0)

T3 plus device integration, offline inference, and an optional native bridge.

**OSBridge browser capabilities:**

- File System Access API for permitted file/folder access.
- Web Bluetooth and Web Serial for compatible hardware.
- Screen capture and recording with user permission.
- Notifications, Wake Lock, and geolocation.
- Battery, network, and GPU information where supported.
- Clipboard and Web Share.
- MIDI, Gamepad, NFC, and idle detection where supported.

**LocalInferenceEngine:**

- Transformers.js and WebGPU where available.
- Embeddings: `all-MiniLM-L6-v2`.
- Chat model: `Qwen2.5-0.5B-Instruct` (quantized, approximately 300 MB).
- IndexedDB-backed `VectorStore` for persistent local document retrieval.

**Optional NativeBridge:** A companion Electron/Tauri application at `localhost:7777` can expose supported native actions:

- `runShell`, `openApp`, `typeTextOS`.
- `screenshotFullOS`.
- `volumeControl`, `mediaControl`.

Also includes T3 vision and multilingual features, with approximately 38 tools overall.

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t4.js"></script>
```

**Backend:** `https://ragina-crawler-ragina.vercel.app/api/ask`, with local inference fallback when configured and model assets are available.  
**Best for:** Kiosks, IoT interfaces, offline-first agents, and desktop integration.

> Browser capabilities depend on device support, permissions, secure contexts, and user gestures. Native OS operations require the companion bridge and should be strictly permission-controlled.

### 🚀 T5 — The Flagship (v5.4.0) ⭐

A standalone agent with 21 registered tools and an integrated retrieval pipeline.

- **Schema validation:** validates tool arguments before execution.
- **Hybrid RAG:** automatically retrieves the top five matching chunks for queries.
- **Speech pipeline:** removes Markdown, emojis, and URLs; selects `FULL`, `SUMMARY_ONLY`, or `SILENT` policy; chunks speech at sentence boundaries.
- **TTS fallback:** server speech synthesis with native browser fallback.
- **Form automation:** confirmation required before submitting forms.
- **Multi-step orchestration:** breaks goals into steps, runs them, and synthesizes results.
- **Guide generation:** produces downloadable Markdown and HTML guides.
- **Device tiers:** `FULL_GPU`, `MOBILE_GPU`, `WASM_MULTITHREADED`, `WASM_SINGLE_THREAD`.
- **Persistence:** IndexedDB-based knowledge index.
- **Standalone:** does not require T4, but can be paired with it.

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-t5.js"></script>
<script>
(async () => {
  await R5.init({ voiceId: 'rachel' });
  R5.registerAll();
})();
</script>
```

**Backend:** `https://ragina-crawler-ragina.vercel.app/api/ask`  
**TTS:** `https://sensycilva.suryasticsai.workers.dev/api/tts`  
**Best for:** Agentic websites, mobile-first assistants, form workflows, and production-oriented integrations.

#### 🧰 The 21 T5 Tools

| Category | Tools |
|---|---|
| Voice | `speak`, `stopSpeaking`, `setMuted` |
| Music | `playSong`, `pauseMusic`, `stopMusic` |
| Forms | `readForms`, `fillForm`, `submitForm`, `fetchAPI` |
| RAG | `indexUrl`, `indexText`, `searchKnowledge`, `listKnowledge`, `clearKnowledge` |
| Meta | `describeCapabilities`, `generateGuide` |
| Orchestration | `planAndExecute` |
| Utilities | `webSearch`, `calculate`, `getTime` |

### 💎 Pro (v2.3.5)

A ready-made floating assistant focused on voice, music, and memory.

- **Speech recognition:** microphone-based transcription and chat.
- **Text-to-speech:** Rachel voice via `/api/tts`.
- **YouTube music:** search, playback, pause, skip, and progress controls.
- **Persistent memory:** IndexedDB-backed conversation history.
- **Selected-text awareness:** ask questions about highlighted page text.
- **Draggable orb:** reposition and minimize the chat widget.
- **Chat export/import:** JSON-based backups.
- **Autosave:** conversations saved automatically.

```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-pro.js"></script>
```

**Best for:** Full-featured chat widgets with conversational UI.

### 🎙️ Voice (v2.4.0)

Pro with continuous voice activity detection and interruption support.

- **Continuous VAD:** detects user speech automatically.
- **Barge-in:** interrupts speech output and aborts an active model request.
- **Zero-beep listening:** no disruptive sound effects.
- **Hands-free flow:** does not require push-to-talk after setup.

```html
<script src="vad-web.js"></script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-voice.js"></script>
```

**Dependency:** Silero VAD.  
**Best for:** Accessibility, hands-free experiences, and voice-first kiosks.

---

## 📊 Feature Matrix

| Feature | T1 | T2 | T3 | T4 | T5 | Pro | Voice |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ReAct agentic loop | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Retrieval | TF-IDF | Hybrid | Hybrid | Hybrid | Hybrid | ✅ | ✅ |
| Streaming responses | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voice output (TTS) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice input (STT) | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| VAD + barge-in | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| YouTube music | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Form automation | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Multi-step planning | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Downloadable guides | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Schema validation | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Device tier detection | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Face/hand vision | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Hinglish/Tenglish | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| OS bridge | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Local AI inference | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Native bridge | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Multi-format documents | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Persistent index | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| No personal API key | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Standalone script | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tool count | 6 | 18 | 23 | ~38 | 21 | — | — |

*Capabilities above reflect the edition descriptions; availability may depend on browser permissions, network services, and runtime configuration.*

---

## 🎯 Which Edition Should I Use?

| Your Need | Recommended Edition |
|---|---|
| Simple chat widget | `ragina-pro.js` |
| Most feature-rich standalone agent | **`ragina-t5.js` ⭐** |
| Form automation | `ragina-t5.js` |
| Multi-step task planning | `ragina-t5.js` |
| Face and gesture detection | `ragina-t3.js` or `ragina-t4.js` |
| Browser OS/device APIs | `ragina-t4.js` |
| Offline local LLM | `ragina-t4.js` |
| Real-time voice with barge-in | `ragina-voice.js` |
| Learn ReAct architecture | `ragina-t1.js` |
| Streaming and PDF parsing | `ragina-t2.js` |

---

## ⚡ T5 Deep Dive

### 🧠 Hybrid RAG with Automatic Retrieval

Every `R5.query()` automatically retrieves up to five relevant chunks before inference.

```js
await R5.loadData({
  'handbook.txt': 'Vacation policy: 20 days per year...',
  'faq.md': 'Q: Reset password? A: Click "Forgot password"...'
});

const result = await R5.query('How many vacation days do I get?');
console.log(result.answer);
```

The retrieval implementation uses lightweight JavaScript hash vectors and stores the index in IndexedDB. No separate embedding model download is required for this implementation.

### 🔊 Speech Pipeline — Reads What's Readable

```js
toSpeakable('Here are 5 hotels:\n- Grand\n- Inn\n- Suites\n- Lodge\n- View');
// Example result:
// {
//   policy: 'SUMMARY_ONLY',
//   chunks: [
//     'Here are 5 hotels. The details are on your screen — please follow the context there.'
//   ]
// }
```

- Detects long lists, code, and unsuitable spoken content.
- Switches between `FULL`, `SUMMARY_ONLY`, and `SILENT`.
- Removes Markdown formatting, emojis, and URLs.
- Splits long text at sentence boundaries (approximately 1,500 characters).
- Falls back to browser-native speech synthesis when server TTS is unavailable.

### 📝 Form Automation — Confirmation Gate

```js
fillForm('signupForm', {
  name: 'Priya',
  email: 'priya@example.com'
});

// Example: { filled: [{ key: 'name', ... }, ...] }

submitForm('signupForm');

// Example:
// {
//   pendingConfirmation: true,
//   actionId: '...',
//   summary: { ... }
// }

// Called after explicit user approval:
resolveSubmit(actionId, true);
```

The form submission workflow is designed to require explicit user confirmation. Applications should also enforce authorization and validation on the server for sensitive operations.

### 🪄 Multi-Step Orchestration

```js
const result = await R5.planAndExecute(
  'Search my notes for Q3 revenue and draft a summary email'
);

// Example result:
// {
//   plan: [
//     'Search KB...',
//     'Extract figures...',
//     'Draft email...'
//   ],
//   results: [...],
//   answer: 'Q3 revenue was $4.2M, up 18%...',
//   traceSummary: {
//     total: 3,
//     tools: [...],
//     duration: 8420
//   }
// }
```

Each step uses accumulated context, and failures are recorded in execution traces for diagnosis.

### 📱 Device Tier Detection

| Tier | Intended Behavior |
|---|---|
| `FULL_GPU` | Full supported capabilities |
| `MOBILE_GPU` | Mobile-oriented processing with heavier vision gated |
| `WASM_MULTITHREADED` | CPU/WASM fallback |
| `WASM_SINGLE_THREAD` | Lightweight tools and voice-first behavior |

Device detection helps the agent adapt its available features to browser capabilities.

### 📄 Downloadable Guides

```js
const guide = R5.guide.build({
  title: 'How to book a flight',
  markdown: '1. Enter origin\n2. Enter destination\n3. Pick a date...'
});

R5.guide.download(guide.urlHTML, 'flight-guide.html');
```

Supports guide creation in Markdown and HTML formats.

---

## 🔌 T5 + T4 Together (Optional)

Combine T4's OS/vision integration with T5's forms, orchestration, and guide-generation tools.

```html
<script src="ragina-t4.js"></script>
<script src="ragina-t5.js"></script>
<script>
(async () => {
  await R5.init({ voiceId: 'rachel' });
  R5.registerAll();

  // Inspect the merged tool registry.
  console.log(RAGina.listTools().length);
})();
</script>
```

The combined setup is described as exposing approximately 54 tools after accounting for overlaps. When both editions are present, T5 can delegate agent execution to T4's engine.

> Use this combination when you need device APIs, vision, and advanced task orchestration in one application. Verify tool names and permission boundaries in your installed versions.

---

## 🔮 Try the Full App

<p align="center">
  <a href="https://suryasticsai.github.io/RAGina">
    <img src="https://img.shields.io/badge/Try_the_App-Live_Demo-blueviolet?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

**Live app:** https://suryasticsai.github.io/RAGina

### What You Can Do

- **Explore & Scrape:** Enter a website or GitHub repository, select pages, and collect knowledge.
- **Save to Gist:** Authenticate with GitHub and store the knowledge base as a public Gist.
- **Chat:** Ask questions about the indexed content.
- **Edit the KB:** Modify knowledge-base JSON in the app.
- **Raise a PR:** Prepare chatbot integration changes for a repository and open a pull request.

---

## 🎭 Meet the Mentalist — 7 Expressive Moods

<p align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/research.png" width="80" alt="Deep Research"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/doubt.png" width="80" alt="Doubt Detected"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/crosshands.png" width="80" alt="Cross Hands"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/shrug-what.png" width="80" alt="Shrug"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance1.png" width="80" alt="Victory Dance"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance2.png" width="80" alt="Happy Dance"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance3.png" width="80" alt="Celebration"/>
</p>

| Expression | Quote |
|---|---|
| 🔍 Deep Research | “Scanning every document…” |
| 🤨 Doubt Detected | “That’s not in the files…” |
| 💢 Cross Hands | “Organize better, human!” |
| 🤷 Shrug | “Your files are silent on this.” |
| 💃 Victory Dance | “Found it, darling!” |
| 🕺 Happy Dance | “Piece of cake!” |
| 🎉 Celebration | “Knew exactly where that was!” |

---

## 🌟 Built with RAGina

### SensyCilva — Autonomous Anime Visual Radio Station

RAGina also powers parts of **SensyCilva**, an anime-inspired visual radio experience that combines visual playback with interactive question answering.

**Repository:** https://github.com/suryasticsai/sensycilva

---

## 🛠️ Backend Endpoints

RAGina provides hosted endpoints for editions that require inference, streaming, speech synthesis, or music search.

| Endpoint | Editions | Purpose |
|---|---|---|
| `https://ragina-crawler-ragina.vercel.app/api/ask` | T1, T2, T4, T5 | LLM inference |
| `https://ragina-crawler-ragina.vercel.app/api/ask/stream` | T2 | SSE streaming |
| `https://sensycilva.suryasticsai.workers.dev/api/tts` | Pro, Voice, T5 | Text-to-speech |
| `https://sensycilva.suryasticsai.workers.dev/api/youtube/search` | Pro, Voice, T5 | YouTube search |

**T3** uses `https://api.openai.com/v1/chat/completions` and requires your own API key.

### Self-Hosting Configuration

```html
<script>
window.RAGINA_CONFIG = {
  apiBaseUrl: 'https://your-worker.com',
  ttsUrl: 'https://your-worker.com/api/tts'
};
</script>
```

> **Deployment note:** No API key required does not mean no backend is involved. Most hosted editions use shared remote inference services. Service availability, rate limits, data handling, and costs can change. For sensitive information, use an appropriately secured backend or supported local inference mode.

---

## 👤 Creator

**Sai Varakala (Surya)**

- **GitHub:** [@suryasticsai](https://github.com/suryasticsai)
- **Email:** [suryasticsai@gmail.com](mailto:suryasticsai@gmail.com)
- **RAGina Repository:** https://github.com/suryasticsai/RAGina
- **Live Demo:** https://suryasticsai.github.io/RAGina

---

## 📜 License

**MIT License** — use, modify, and distribute in accordance with the license terms. Credit is appreciated.

---

<p align="center">
  <strong>🔮 RAGina — Your In-Browser Companion</strong>
</p>

<p align="center">
  <i>She speaks. She listens. She remembers. She fills forms. She plans in steps.</i>
</p>

<p align="center">
  <strong>Five agentic iterations. Eight editions. One mentalist.</strong>
</p>

<p align="center">
  <a href="https://github.com/suryasticsai/RAGina">Explore the Source</a> ·
  <a href="https://suryasticsai.github.io/RAGina">Try RAGina</a>
</p>
