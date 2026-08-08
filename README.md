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
  <a href="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"><img src="https://img.shields.io/badge/CDN-jsDelivr-orange" alt="jsDelivr CDN"></a>
  <a href="#"><img src="https://img.shields.io/badge/API_Keys-None-brightgreen" alt="No API Keys"></a>
  <a href="#"><img src="https://img.shields.io/badge/Size-8KB_minified-blue" alt="8KB Minified"></a>
</p>

---

> 💡 **One `<script>` tag. Zero API keys. Zero servers. Zero cost.**  
> Turn any website, repo, or document into an AI‑powered Q&A chatbot in seconds.  
> **And now she hears you. She talks back. She remembers everything.**

---

## ⚡ Lightning Start

Choose your version and drop the script into any HTML page.

| | Standard | Pro |
|-|----------|-----|
| **Script** | `ragina.js` | `ragina-pro.js` |
| **Voice** | ❌ | 🎤 |
| **Music** | ❌ | 🎵 |
| **Memory** | ❌ | 🧠 |

### 🟣 Standard
```html
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
```

### 🔥 Pro (Full AI Brain)
```
<script>
  window.RAGINA_CONFIG = {
    apiBaseUrl: 'https://your-worker.com',  // optional
    indexUrl: 'https://your-knowledge.json' // optional
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina-pro.js"></script>
```

---

## 📦 Two Flavours – Side by Side

<div align="center">

| Feature | Standard (`ragina.js`) | Pro (`ragina-pro.js`) |
|---------|:----------------------:|:----------------------:|
| **Instant RAG** – upload HTML, text, URL | ✅ | ✅ |
| **AI‑Powered Chat** (multiple LLM backends) | ✅ | ✅ |
| **Gist Memory** – save knowledge to GitHub Gist | ✅ | ✅ |
| **Auto PR Bot** – inject chatbot and open PR | ✅ | ✅ |
| **Standalone Generator** – download a full HTML | ✅ | ✅ |
| **Zero API Keys** (free proxy included) | ✅ | ✅ |
| **Dark / Light theme** | ✅ | ✅ |
| **Speech Recognition** (voice input) | ❌ | ✅ |
| **Text‑to‑Speech** (voice output) | ❌ | ✅ |
| **Background Music** (YouTube integration) | ❌ | ✅ |
| **Persistent Memory** (IndexedDB, chat history) | ❌ | ✅ |
| **Draggable / Minimizable orb** | ❌ | ✅ |
| **Selected‑Text Awareness** | ❌ | ✅ |
| **Export / Import chat history** | ❌ | ✅ |

</div>

---

## 🎯 Give Her Knowledge (Both Versions)

She can read from a URL or from data you embed directly in the page.

### 🌐 From a URL (recommended)

```html
<script>
  window.RAGINA_CONFIG = {
    indexUrl: 'https://example.com/my-knowledge.json',
    title: 'MyBot',
    placeholder: 'Ask about our docs...',
    theme: { primary: '#6C63FF' }
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
```

### 📦 Embedded Knowledge (zero external files)

```html
<script>
  window.__RAGINA_INDEX__ = {
    "about.html": { "bodyText": "RAGina is awesome..." },
    "faq.html":   { "bodyText": "How to use RAGina? ..." }
  };
  window.RAGINA_CONFIG = { position: 'bottom-left' };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
```

> ✨ No files. No server. She reads everything from that tiny object.

---

## ✨ Core Powers – Both Editions

<div align="center">

| Power | Description |
|-------|-------------|
| 🔮 **Instant RAG** | Upload HTML, paste text, or point her at a URL. She builds a searchable knowledge base in seconds. |
| 💬 **AI‑Powered Chat** | Sassy, grounded answers powered by Groq, OpenRouter, Gemini, and Hugging Face — with automatic fallback. |
| 📝 **Gist Memory** | Save knowledge to a public GitHub Gist. She loads from it instantly next time. No duplicate Gists. |
| 🚀 **Auto PR Bot** | Login with GitHub, scan a repo, she injects the chatbot snippet and opens a Pull Request — all from the browser. |
| 📦 **Standalone Generator** | Upload files or paste text → download a complete `ragina-chatbot.html` ready to host. |
| 🔐 **Zero Keys for You** | The AI backend runs on a free proxy — you never need to provide an API key. |
| 🎨 **Stunning UI** | Dark / Light themes, spinning logo, animated backgrounds, and a smooth chat panel. |

</div>

---

## 🧠 Pro Extra Powers – The Full Mentalist

<div align="center">

| Feature | Description |
|---------|-------------|
| 🎤 **Speech Recognition** | Click the microphone and talk to her; she transcribes and answers. |
| 🔊 **Text‑to‑Speech** | She reads her responses aloud in a natural voice. |
| 🎵 **YouTube Music** | Say “play Shape of You” and she plays it with full controls (pause, skip, volume, progress bar). |
| 🧠 **Persistent Memory** | Every conversation is saved to IndexedDB and survives page reloads. |
| 🖱️ **Draggable Orb** | Move her anywhere on the screen. Minimise or expand with a click. |
| 📝 **Selected‑Text Awareness** | Highlight text on the page and ask “What does this mean?” – she reads the selection and answers intelligently. |
| 💾 **Export / Import** | Download your entire chat history as a JSON file and load it back anytime. |

</div>

---

## 🔮 Try the Full App

<p align="center">
  <a href="https://suryasticsai.github.io/RAGina">
    <img src="https://img.shields.io/badge/Try%20the%20App-🔮%20Live%20Demo-blueviolet?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

On the full app you can:

- **Explore & Scrape** – Enter a website or GitHub repo, pick pages, and scrape them.
- **Save to Gist** – Login with GitHub and save the knowledge as a public Gist.
- **Chat** – Ask questions immediately.
- **Edit the KB** – Modify the knowledge base JSON right inside the app.
- **Raise a PR** – For repos, she can inject the chatbot snippet and open a Pull Request.

---

## 🎭 Meet the Mentalist – 7 Expressive Moods

She has **seven powerful expressions** – each one a different mentalist state. Click any image in the full app to see her transformation.

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

| Expression | Quote |
|------------|-------|
| 🔍 Deep Research | *“Scanning every document…”* |
| 🤨 Doubt Detected | *“That’s not in the files…”* |
| 💢 Cross Hands | *“Organize better, human!”* |
| 🤷 Shrug | *“Your files are silent on this.”* |
| 💃 Victory Dance | *“Found it, darling!”* |
| 🕺 Happy Dance | *“Piece of cake!”* |
| 🎉 Celebration | *“Knew exactly where that was!”* |

</div>

---

## 🌟 Built with RAGina

RAGina’s powers don’t stop here. She’s the engine behind **SensyCilva** – an autonomous Anime Visual Radio Station that streams visuals and answers questions using the same mentalist magic.  
Check it out: [github.com/suryasticsai/sensycilva](https://github.com/suryasticsai/sensycilva)

---

## 👤 Creator

**Sai Varakala (Surya)**  
- GitHub: [@suryasticsai](https://github.com/suryasticsai)  
- Email: [suryasticsai@gmail.com](mailto:suryasticsai@gmail.com)

---

## 📜 License

MIT – use freely, modify, distribute. Credit is appreciated.

---

> 🔮 **RAGina – Your in‑browser companion. She knows it all. Just ask her – she knows exactly what you're looking for.**  
> **Now she speaks, she listens, and she remembers everything. The future of AI is here.**
