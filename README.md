<p align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/ragina-logo.png" alt="RAGina" width="200"/>
</p>

<h1 align="center">🧠 RAGina – The Mentalist RAG</h1>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="MIT License"></a>
  <a href="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"><img src="https://img.shields.io/badge/CDN-jsDelivr-orange" alt="jsDelivr CDN"></a>
  <a href="#"><img src="https://img.shields.io/badge/API_Keys-None-brightgreen" alt="No API Keys"></a>
  <a href="#"><img src="https://img.shields.io/badge/Size-8KB_minified-blue" alt="8KB Minified"></a>
</p>

<p align="center">
  <i>“She penetrates walls. She reads chaos. She forgets nothing.”</i>
</p>

---

<p align="center">
  <b>One <code>&lt;script&gt;</code> tag. Zero API keys. Zero servers. Zero cost.</b><br>
  Turn any website, repo, or document into an AI‑powered Q&A chatbot in seconds.
</p>

---

## ✨ What She Can Do

| Power | Description |
|-------|-------------|
| 🔮 **Instant RAG** | Upload HTML, paste text, or point her at a URL. She builds a searchable knowledge base in seconds. |
| 💬 **AI‑Powered Chat** | Sassy, grounded answers powered by Groq, OpenRouter, Gemini, and Hugging Face — with automatic fallback. |
| 📝 **Gist Memory** | Save knowledge to a public GitHub Gist. She loads from it instantly next time. No duplicate Gists. |
| 🚀 **Auto PR Bot** | Login with GitHub, scan a repo, she injects the chatbot snippet and opens a Pull Request — all from the browser. |
| 📦 **Standalone Generator** | Upload files or paste text → download a complete `ragina-chatbot.html` ready to host. |
| 🔐 **Zero Keys for You** | The AI backend runs on a free proxy — you never need to provide an API key. |
| 🎨 **Stunning UI** | Dark / Light themes, spinning logo, animated backgrounds, and a smooth chat panel. |

---

## 🚀 One Line – She Appears

Add this single `<script>` tag to any HTML page and a floating chat bubble will show up at the bottom‑right:

'''
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
'''

That’s it. No signup. No keys. No servers.

---

## 📚 Give Her Knowledge

She can read from a URL or from data you embed directly in the page.

### From a URL (recommended for tiny pages)

'''
<script>
  window.RAGINA_CONFIG = {
    indexUrl: 'https://example.com/my-knowledge.json',
    title: 'MyBot',
    placeholder: 'Ask about our docs...',
    theme: { primary: '#6C63FF' }
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
'''

### Embedded Knowledge (zero external files)

'''
<script>
  window.__RAGINA_INDEX__ = {
    "about.html": { "bodyText": "RAGina is awesome..." },
    "faq.html":   { "bodyText": "How to use RAGina? ..." }
  };
  window.RAGINA_CONFIG = { position: 'bottom-left' };
</script>
<script src="https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/ragina.js"></script>
'''

No files. No server. She reads everything from that tiny object.

---

## 🔮 Try the Full App

<p align="center">
  <a href="https://suryasticsai.github.io/RAGina">
    <img src="https://img.shields.io/badge/Try%20the%20App-🔮%20Live%20Demo-blueviolet?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

On the full app you can:

- **Explore & Scrape** – Enter a website or GitHub repo, pick pages, and scrape them.
- **Save to Gist** – Optionally login with GitHub and save the knowledge as a public Gist (get a raw URL).
- **Chat** – Ask questions immediately.
- **Edit the KB** – Modify the knowledge base JSON right inside the app.
- **Raise a PR** – For repos, she can inject the chatbot snippet and open a Pull Request.

---

## 📦 Generate a Standalone Chatbot

Inside the same app, switch to the **Generator** tab:

1. Enter a product name
2. Upload HTML files or paste Q&A pairs
3. Choose accent colour & position
4. Click **Generate** → download a complete `ragina-chatbot.html`

The downloaded file already includes your custom knowledge and the RAGina CDN. Host it anywhere and start chatting.

---

## 🎭 Meet the Mentalist

She has **seven powerful expressions** – each one a different mentalist state. Click any image in the full app to see her transformation.

<p align="center">
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/research.png" width="100" alt="Deep Research"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/doubt.png" width="100" alt="Doubt Detected"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/crosshands.png" width="100" alt="Cross Hands"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/shrug-what.png" width="100" alt="Shrug"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance1.png" width="100" alt="Victory Dance"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance2.png" width="100" alt="Happy Dance"/>
  <img src="https://raw.githubusercontent.com/suryasticsai/RAGina/main/dance3.png" width="100" alt="Celebration"/>
</p>

| Expression | Quote |
|------------|-------|
| 🔍 Deep Research | *“Scanning every document…”* |
| 🤨 Doubt Detected | *“That’s not in the files…”* |
| 💢 Cross Hands | *“Organize better, human!”* |
| 🤷 Shrug | *“Your files are silent on this.”* |
| 💃 Victory Dance | *“Found it, darling!”* |
| 🕺 Happy Dance | *“Piece of cake!”* |
| 🎉 Celebration | *“Knew exactly where that was!”* |

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

MIT – use freely, modify, distribute. Credit is appreciated but not required.

---

**RAGina – She penetrates walls. She reads chaos. She forgets nothing. 🔮**