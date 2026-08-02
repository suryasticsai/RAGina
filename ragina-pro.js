/**
 * RAGina Pro – Full Application + Retrieval Engine
 * Version 2.2.0
 * 
 * Includes:
 *   - TF‑IDF index loader (window.RAGina.getEngine)
 *   - Chat, music, voice, persistence, drag/minimize, etc.
 */
(function() {
    'use strict';

    // ─── 1. RETRIEVAL ENGINE (TF‑IDF) ──────────────────────────────────────
    const CONFIG = window.RAGINA_CONFIG || {};
    const INDEX_URL = CONFIG.indexUrl || 'https://cdn.jsdelivr.net/gh/suryasticsai/RAGina@main/demo-index.json';

    let chunks = [];
    let vocabulary = {};
    let docTermMatrix = [];
    let idfCache = {};
    let isRetrievalReady = false;
    let retrievalLoading = null;

    function tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 1);
    }

    function computeTF(terms) {
        const tf = {};
        terms.forEach(term => tf[term] = (tf[term] || 0) + 1);
        const maxFreq = Math.max(...Object.values(tf));
        for (let term in tf) {
            tf[term] = tf[term] / maxFreq;
        }
        return tf;
    }

    function computeIDF(term, docCount) {
        if (idfCache[term] !== undefined) return idfCache[term];
        const docFreq = docTermMatrix.filter(doc => doc.terms.includes(term)).length;
        const idf = docFreq === 0 ? 0 : Math.log((docCount + 1) / (docFreq + 1)) + 1;
        idfCache[term] = idf;
        return idf;
    }

    function cosineSimilarity(vecA, vecB) {
        let dot = 0,
            normA = 0,
            normB = 0;
        for (let term in vecA) {
            if (vecB[term]) {
                dot += vecA[term] * vecB[term];
            }
            normA += vecA[term] * vecA[term];
        }
        for (let term in vecB) {
            normB += vecB[term] * vecB[term];
        }
        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        if (normA === 0 || normB === 0) return 0;
        return dot / (normA * normB);
    }

    function buildIndex(data) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Index must be a non‑empty array of text chunks.');
        }
        chunks = data.map(item => (typeof item === 'string' ? item : item.text || ''));
        docTermMatrix = chunks.map(text => {
            const terms = tokenize(text);
            const tf = computeTF(terms);
            return { text, terms, tf };
        });
        vocabulary = {};
        docTermMatrix.forEach(doc => {
            doc.terms.forEach(term => vocabulary[term] = true);
        });
        vocabulary = Object.keys(vocabulary);
        idfCache = {};
        const docCount = docTermMatrix.length;
        vocabulary.forEach(term => {
            computeIDF(term, docCount);
        });
        isRetrievalReady = true;
    }

    async function loadIndex() {
        if (retrievalLoading) return retrievalLoading;
        retrievalLoading = (async () => {
            try {
                const response = await fetch(INDEX_URL);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                buildIndex(data);
                console.log(`✅ RAGina retrieval engine loaded ${chunks.length} chunks.`);
            } catch (err) {
                console.error('❌ Failed to load index:', err);
                buildIndex(['No index loaded. Please check the network.']);
                throw err;
            } finally {
                retrievalLoading = null;
            }
        })();
        return retrievalLoading;
    }

    function retrieve(query, topK = 5) {
        if (!isRetrievalReady) {
            console.warn('Index not ready, returning empty.');
            return [];
        }
        if (!query || query.trim().length === 0) return [];

        const queryTerms = tokenize(query);
        if (queryTerms.length === 0) return [];

        const queryTf = computeTF(queryTerms);
        const docCount = docTermMatrix.length;
        const queryVector = {};
        for (let term in queryTf) {
            const idf = computeIDF(term, docCount);
            queryVector[term] = queryTf[term] * idf;
        }

        const scores = docTermMatrix.map((doc, idx) => {
            const docVector = {};
            for (let term in doc.tf) {
                const idf = computeIDF(term, docCount);
                docVector[term] = doc.tf[term] * idf;
            }
            const sim = cosineSimilarity(queryVector, docVector);
            return { index: idx, text: doc.text, score: sim };
        });

        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, topK).map(item => ({
            text: item.text,
            score: item.score
        }));
    }

    const retrievalEngine = {
        retrieve,
        getStatus: () => ({ isReady: isRetrievalReady, chunkCount: chunks.length })
    };

    window.RAGina = window.RAGina || {};
    window.RAGina.getEngine = function() {
        if (!isRetrievalReady && !retrievalLoading) {
            loadIndex().catch(() => {});
        }
        return retrievalEngine;
    };

    // Auto‑load index on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadIndex().catch(() => {});
        });
    } else {
        loadIndex().catch(() => {});
    }

    // ─── 2. APPLICATION LOGIC ──────────────────────────────────────────────
    const APP_CONFIG = window.RAGINA_CONFIG || {};
    const NAME_KEY = 'ragina_user_name';
    const AI_ENDPOINT = 'https://ragina-crawler-ragina.vercel.app/api/ask';
    const YT_SEARCH_URL = 'https://sensycilva.suryasticsai.workers.dev/api/youtube/search?q=';
    const VOICE_URL = APP_CONFIG.voiceUrl || 'https://sensycilva.suryasticsai.workers.dev/api/tts';
    const VOICE_ID = APP_CONFIG.voiceId || 'rachel';
    const VOICE_SPEED = APP_CONFIG.voiceSpeed || 1.0;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // ─── DOM refs ────────────────────────────────────────────────────────────
    const app = document.getElementById('raginaApp');
    const header = document.getElementById('raginaHeader');
    const logo = document.getElementById('raginaLogo');
    const liveTranscript = document.getElementById('liveTranscript');
    const messages = document.getElementById('raginaMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const micOrb = document.getElementById('micOrb');
    const voiceToggleBtn = document.getElementById('voiceToggleBtn');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const closeBtn = document.getElementById('closeBtn');
    const musicController = document.getElementById('musicController');
    const songLabel = document.getElementById('songLabel');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnStop = document.getElementById('btnStop');
    const progressFill = document.getElementById('progressFill');
    const timeCurrent = document.getElementById('timeCurrent');
    const timeDuration = document.getElementById('timeDuration');
    const progressBar = document.getElementById('progressBar');
    const playerContainer = document.getElementById('youtubePlayerContainer');
    const chatStatus = document.getElementById('chatStatus');
    const saveChatBtn = document.getElementById('saveChatBtn');
    const loadChatBtn = document.getElementById('loadChatBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const fileInput = document.getElementById('fileInput');

    // ─── State ────────────────────────────────────────────────────────────────
    let engine = retrievalEngine; // use the retrieval engine
    let voiceActive = true;
    let currentAudio = null;
    let conversationActive = false;
    let recognition = null;
    let userName = null;
    let awaitingName = false;
    let history = [];
    let isMinimized = true;
    let musicPlaying = false;
    let currentVideoId = null;
    let currentSongTitle = '';
    let musicProgressInterval = null;
    let musicDuration = 0;
    let musicCurrentTime = 0;
    let wasPlayingBeforeMic = false;
    let ttsLoading = false;
    let youtubePlayer = null;
    let playerReady = false;
    let messageHistory = [];
    let introDone = false;

    // ─── IndexedDB ──────────────────────────────────────────────────────────
    const DB_NAME = 'RAGinaChatDB';
    const STORE_NAME = 'chatHistory';
    const DB_VERSION = 1;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveToIndexedDB(data) {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put({ id: 'history', data });
            await tx.done;
            chatStatus.textContent = 'Auto‑saved ✓';
            chatStatus.style.color = '#6C63FF';
        } catch (e) {
            console.warn('IndexedDB save error:', e);
            chatStatus.textContent = 'Save failed';
            chatStatus.style.color = '#FF6584';
        }
    }

    async function loadFromIndexedDB() {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('history');
            return new Promise((resolve) => {
                request.onsuccess = () => resolve(request.result ? request.result.data : null);
                request.onerror = () => resolve(null);
            });
        } catch (e) {
            return null;
        }
    }

    async function clearIndexedDB() {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete('history');
            await tx.done;
        } catch (e) {}
    }

    // ─── Render / Add messages ─────────────────────────────────────────────
    function renderMessages(msgs) {
        messages.innerHTML = '';
        msgs.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'msg ' + (msg.role || 'system');
            div.innerHTML = msg.text || msg.html || '';
            messages.appendChild(div);
        });
        messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(role, text, extraHtml = '') {
        const fullText = text + extraHtml;
        const entry = { role, text: fullText };
        messageHistory.push(entry);
        const div = document.createElement('div');
        div.className = 'msg ' + role;
        div.innerHTML = fullText;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        saveToIndexedDB(messageHistory);
        return div;
    }

    async function restoreChat() {
        const saved = await loadFromIndexedDB();
        if (saved && saved.length > 0) {
            messageHistory = saved;
            renderMessages(saved);
            const nameMsg = saved.find(m => m.role === 'system' && m.text.includes('Welcome back'));
            if (nameMsg) {
                const match = nameMsg.text.match(/Welcome back, ([^!]+)/);
                if (match) userName = match[1];
            }
            introDone = true;
            conversationActive = true;
            if (userName) {
                try { localStorage.setItem(NAME_KEY, userName); } catch (e) {}
            }
            chatStatus.textContent = `Loaded ${saved.length} messages`;
            chatStatus.style.color = '#6C63FF';
            return true;
        }
        return false;
    }

    // ─── YouTube Player ────────────────────────────────────────────────────
    function onYouTubeIframeAPIReady() {
        youtubePlayer = new YT.Player('youtubePlayerContainer', {
            height: '0',
            width: '0',
            videoId: '',
            playerVars: {
                autoplay: 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });
    }

    function onPlayerReady(event) {
        playerReady = true;
        if (currentVideoId) {
            youtubePlayer.loadVideoById(currentVideoId);
            if (musicPlaying) {
                youtubePlayer.playVideo();
            }
        }
    }

    function onPlayerStateChange(event) {
        const state = event.data;
        if (state === YT.PlayerState.PLAYING) {
            musicPlaying = true;
            updatePlayPauseBtn(true);
            if (!musicProgressInterval) {
                musicProgressInterval = setInterval(updateProgressFromPlayer, 500);
            }
        } else if (state === YT.PlayerState.PAUSED) {
            musicPlaying = false;
            updatePlayPauseBtn(false);
        } else if (state === YT.PlayerState.ENDED) {
            stopSong();
            addMessage('bot', 'Song finished!');
            if (voiceActive && conversationActive && !currentAudio && !ttsLoading) {
                setTimeout(startListening, 500);
            }
        }
    }

    function onPlayerError(event) {
        console.warn('YouTube player error:', event.data);
        stopSong();
        addMessage('bot', 'Sorry, there was an error playing that song.');
    }

    function updateProgressFromPlayer() {
        if (!youtubePlayer || !playerReady) return;
        try {
            const current = youtubePlayer.getCurrentTime();
            const duration = youtubePlayer.getDuration();
            if (duration && duration > 0) {
                musicDuration = duration;
                musicCurrentTime = current;
                updateProgressUI();
            }
        } catch (e) {}
    }

    function loadVideo(videoId, title) {
        currentVideoId = videoId;
        currentSongTitle = title;
        if (youtubePlayer && playerReady) {
            youtubePlayer.loadVideoById(videoId);
            youtubePlayer.playVideo();
        }
        musicPlaying = true;
        musicDuration = 0;
        musicCurrentTime = 0;
        updatePlayPauseBtn(true);
        showMusicController();
        songLabel.textContent = '🎵 ' + title;
        updateProgressUI();
        if (musicProgressInterval) clearInterval(musicProgressInterval);
        musicProgressInterval = setInterval(updateProgressFromPlayer, 500);
    }

    function pauseSong() {
        if (youtubePlayer && playerReady) {
            youtubePlayer.pauseVideo();
        }
        musicPlaying = false;
        updatePlayPauseBtn(false);
    }

    function resumeSong() {
        if (youtubePlayer && playerReady) {
            youtubePlayer.playVideo();
        }
        musicPlaying = true;
        updatePlayPauseBtn(true);
    }

    function stopSong() {
        if (youtubePlayer && playerReady) {
            youtubePlayer.stopVideo();
        }
        musicPlaying = false;
        currentVideoId = null;
        currentSongTitle = '';
        updatePlayPauseBtn(false);
        hideMusicController();
        if (musicProgressInterval) {
            clearInterval(musicProgressInterval);
            musicProgressInterval = null;
        }
        musicCurrentTime = 0;
        musicDuration = 0;
        updateProgressUI();
    }

    function showMusicController() { musicController.style.display = 'flex'; }

    function hideMusicController() { musicController.style.display = 'none'; }

    function updatePlayPauseBtn(playing) {
        if (playing) {
            btnPlayPause.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        } else {
            btnPlayPause.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
        }
    }

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function updateProgressUI() {
        const pct = (musicDuration > 0) ? (musicCurrentTime / musicDuration) * 100 : 0;
        progressFill.style.width = pct + '%';
        timeCurrent.textContent = formatTime(musicCurrentTime);
        timeDuration.textContent = formatTime(musicDuration);
    }

    // ─── Music command execution ──────────────────────────────────────────
    function executeMusicAction(action, song) {
        switch (action) {
            case 'play':
                if (song) {
                    searchAndPlay(song);
                } else {
                    addMessage('bot', "What song would you like to play?");
                }
                break;
            case 'pause':
                if (musicPlaying) {
                    pauseSong();
                    addMessage('bot', '⏸️ Music paused.');
                } else {
                    addMessage('bot', 'No song is playing right now.');
                }
                break;
            case 'resume':
                if (currentVideoId && !musicPlaying) {
                    resumeSong();
                    addMessage('bot', '▶️ Resuming music.');
                } else if (musicPlaying) {
                    addMessage('bot', 'Music is already playing.');
                } else {
                    addMessage('bot', 'No song is paused or stopped.');
                }
                break;
            case 'stop':
                stopSong();
                addMessage('bot', '⏹️ Music stopped.');
                break;
            case 'change':
                if (currentVideoId) {
                    stopSong();
                    addMessage('bot', "⏭️ Song changed. What would you like to hear next?");
                } else {
                    addMessage('bot', "No song is currently playing. Just tell me what you'd like to hear!");
                }
                break;
            default:
                return false;
        }
        return true;
    }

    function handleMusicCommandFast(text) {
        const lower = text.toLowerCase().trim();

        if (/\b(?:not\s+this|some\s+other|different)\s+(?:song|music|track)\b/i.test(lower) ||
            /\b(?:change|skip|next)\s+(?:this|the)?\s*(?:song|music|track)\b/i.test(lower) ||
            lower === 'skip' || lower === 'next' || lower === 'change') {
            executeMusicAction('change');
            return true;
        }

        let playMatch = lower.match(/^(?:play|play me|can you play|put on)\s+(.+)/i);
        if (playMatch) {
            const query = playMatch[1].trim();
            const fillerWords = ['not this', 'some other', 'different', 'another', 'something else'];
            if (query.length <= 2 || fillerWords.some(w => query.includes(w))) {
                executeMusicAction('change');
                return true;
            }
            searchAndPlay(query);
            return true;
        }

        let songMatch = lower.match(/^(.+)\s+(?:song|music|track)$/i);
        if (songMatch) {
            const query = songMatch[1].trim();
            const fillerWords = ['not this', 'some other', 'different', 'another', 'something else'];
            if (query.length <= 2 || fillerWords.some(w => query.includes(w))) {
                executeMusicAction('change');
                return true;
            }
            searchAndPlay(query);
            return true;
        }

        if (/\b(?:pause|hold)\s+(?:the\s+)?(?:song|music|track)\b/i.test(lower) || lower === 'pause') {
            executeMusicAction('pause');
            return true;
        }
        if (/\b(?:resume|continue|unpause)\s+(?:the\s+)?(?:song|music|track)\b/i.test(lower) || lower === 'resume') {
            executeMusicAction('resume');
            return true;
        }
        if (/\b(?:stop|end|finish)\s+(?:the\s+)?(?:song|music|track)\b/i.test(lower) || lower === 'stop') {
            executeMusicAction('stop');
            return true;
        }

        return false;
    }

    async function parseMusicCommandWithAI(text) {
        const prompt = `You are a music command parser. Given the user's message, determine if they want to control music playback. If yes, respond with a JSON object containing "action" and optionally "song". Actions: "play", "pause", "resume", "stop", "change". If not a music command, respond with {"action": "none"}.

        Important: Only set action to "play" if the user specifically asks for a song by name or artist. If they say things like "not this song", "some other song", "different song", "change", "skip", "next", then action should be "change". If they are just chatting, action should be "none".

        User: "${text}"
        Response:`;

        try {
            const res = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!res.ok) throw new Error(`AI ${res.status}`);
            const data = await res.json();
            const jsonMatch = data.text.match(/\{.*\}/s);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.action === 'play') {
                    const song = (parsed.song || '').trim();
                    const filler = ['not this', 'some other', 'different', 'another', 'something else', 'change', 'skip'];
                    if (!song || song.length <= 2 || filler.some(w => song.toLowerCase().includes(w))) {
                        return { action: 'change' };
                    }
                }
                return parsed;
            }
            return { action: 'none' };
        } catch (e) {
            return { action: 'none' };
        }
    }

    async function searchAndPlay(query) {
        if (!query || query.length < 2) {
            addMessage('bot', "Could you be more specific? What song would you like?");
            return;
        }
        try {
            const res = await fetch(YT_SEARCH_URL + encodeURIComponent(query));
            if (!res.ok) throw new Error(`Worker ${res.status}`);
            const data = await res.json();
            if (!data.success || !data.items || data.items.length === 0) {
                addMessage('bot', `Sorry, I couldn't find any song for "${query}".`);
                return;
            }
            const song = data.items[0];
            loadVideo(song.id, song.title);
            addMessage('bot', `🎵 Playing: <strong>${escapeHTML(song.title)}</strong>`);
            if (voiceActive && !musicPlaying) await speakText(`Playing ${song.title}.`);
        } catch (err) {
            addMessage('bot', `Oops, I couldn't play that right now.`);
        }
    }

    function escapeHTML(str) { const d = document.createElement('div');
        d.textContent = str; return d.innerHTML; }

    // ─── Button controls (music) ──────────────────────────────────────────
    btnPlayPause.addEventListener('click', () => {
        if (musicPlaying) {
            pauseSong();
            addMessage('bot', '⏸️ Paused.');
        } else if (currentVideoId) {
            resumeSong();
            addMessage('bot', '▶️ Resumed.');
        } else {
            addMessage('bot', 'No song loaded. Tell me what to play!');
        }
    });

    btnStop.addEventListener('click', () => {
        stopSong();
        addMessage('bot', '⏹️ Stopped.');
    });

    progressBar.addEventListener('click', (e) => {
        if (!youtubePlayer || !playerReady || !currentVideoId) return;
        const rect = progressBar.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const duration = youtubePlayer.getDuration();
        if (duration && duration > 0) {
            const seekTo = x * duration;
            youtubePlayer.seekTo(seekTo, true);
            updateProgressFromPlayer();
        }
    });

    // ─── Drag / Click ──────────────────────────────────────────────────────
    let dragActive = false;
    let dragStartX = 0,
        dragStartY = 0;
    let pointerDownX = 0,
        pointerDownY = 0;
    let startLeft = 0,
        startTop = 0;
    let isClick = false;

    function onPointerDown(e) {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.btn-icon')) {
            return;
        }
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        pointerDownX = clientX;
        pointerDownY = clientY;
        dragStartX = clientX;
        dragStartY = clientY;
        dragActive = true;
        isClick = true;
        const rect = app.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        app.style.transition = 'none';
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!dragActive) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isClick = false;
        }
        app.style.left = (startLeft + dx) + 'px';
        app.style.top = (startTop + dy) + 'px';
        app.style.right = 'auto';
        app.style.bottom = 'auto';
    }

    function onPointerUp(e) {
        if (!dragActive) return;
        dragActive = false;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.btn-icon')) {
            return;
        }
        const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
        const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
        const dx = clientX - pointerDownX;
        const dy = clientY - pointerDownY;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && isClick) {
            handleClick(e);
        }
        isClick = false;
    }

    function handleClick(e) {
        if (isMinimized) {
            setMinimized(false);
            if (!introDone) introduce();
        } else {
            const target = e.target;
            if (target.closest && target.closest('.logo')) {
                if (!introDone) introduce();
                e.stopPropagation();
            }
        }
    }

    header.addEventListener('mousedown', onPointerDown);
    header.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);

    logo.addEventListener('click', (e) => {
        if (isMinimized) {
            setMinimized(false);
            if (!introDone) introduce();
        } else if (!introDone) {
            introduce();
        }
        e.stopPropagation();
    });

    // ─── Minimize / Close ──────────────────────────────────────────────────
    function setMinimized(min) {
        isMinimized = min;
        app.classList.toggle('minimized', min);
        if (min) {
            minimizeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>`;
        } else {
            minimizeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>`;
        }
        if (!min && !musicPlaying) {
            chatInput.focus();
        }
    }

    minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMinimized(!isMinimized);
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMinimized(true);
    });

    // ─── Intro & name ──────────────────────────────────────────────────────
    async function introduce() {
        if (introDone) return;
        introDone = true;
        const introText =
            "Hey there! I'm RAGina, your personal mentalist. I can chat, answer questions, and even play music. What's your name?";
        addMessage('bot', introText);
        awaitingName = true;
        conversationActive = true;
        if (voiceActive) await speakText(introText);
    }

    // ─── AI helpers ────────────────────────────────────────────────────────
    async function loadName() { try { return localStorage.getItem(NAME_KEY); } catch (e) { return null; } }
    async function saveName(name) { try { localStorage.setItem(NAME_KEY, name); } catch (e) {} }

    function extractName(raw) {
        const text = raw.trim();
        const m = text.match(/(?:my name is|i am|i'm|im|call me|it's|its)\s+([a-z][a-z '-]{0,24})/i);
        const word = m && m[1] ? m[1].trim().split(/\s+/)[0] : (text.split(/\s+/)[0] || text);
        const clean = word.replace(/[^a-zA-Z'-]/g, '');
        return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : 'friend';
    }

    function getSelectedText() {
        const sel = window.getSelection();
        return sel ? sel.toString().trim() : '';
    }

    // ─── AI answer ──────────────────────────────────────────────────────────
    async function getAIAnswer(question, selectedText) {
        let context = '';
        if (selectedText) {
            context = `The user has selected the following text on the page: "${selectedText}".\n\n`;
        }
        if (engine && typeof engine.retrieve === 'function') {
            try {
                const chunks = engine.retrieve(question, 5) || [];
                const ragContext = chunks.map((c, i) => `[${i+1}] ${c.text}`).join('\n\n');
                if (ragContext) {
                    context += 'Relevant context from knowledge base:\n' + ragContext + '\n\n';
                }
            } catch (e) {}
        }
        const recentHistory = history.slice(-8)
            .map(h => `${h.role === 'user' ? (userName || 'User') : 'RAGina'}: ${h.text}`)
            .join('\n');
        const prompt =
            `You are RAGina — witty, warm, sharp-tongued AI with access to YouTube music. Talk like a real friend. You can play songs. If the user asks for music, say you'll play it. Only use context below if relevant. You're talking to ${userName || 'someone new'}.

${context ? 'User provided selected text context:\n' + context : ''}

Recent:
${recentHistory}

${userName || 'User'}: ${question}
RAGina:`;

        try {
            const res = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }) });
            if (!res.ok) throw new Error(`AI ${res.status}`);
            const data = await res.json();
            if (data.error || !data.text?.trim()) throw new Error('empty');
            return data.text.trim();
        } catch (e) {
            return "Ugh, brain fog — my server's not answering. Give me a sec?";
        }
    }

    // ─── Core sendMessage ──────────────────────────────────────────────────
    async function sendMessage(rawText) {
        const text = (rawText || '').trim();
        if (!text) return;
        chatInput.value = '';

        const selected = getSelectedText();

        if (awaitingName) {
            awaitingName = false;
            userName = extractName(text);
            await saveName(userName);
            addMessage('user', text);
            const greet = `Nice to meet you, ${userName}! What can I help you with today?`;
            history.push({ role: 'user', text }, { role: 'bot', text: greet });
            addMessage('bot', greet);
            if (voiceActive) await speakText(greet);
            if (!musicPlaying && !currentAudio && !ttsLoading) {
                setTimeout(startListening, 500);
            }
            return;
        }

        if (selected) {
            addMessage('system', `📝 Selected: "${selected}"`);
        }

        if (handleMusicCommandFast(text)) {
            addMessage('user', text);
            return;
        }

        const aiCommand = await parseMusicCommandWithAI(text);
        if (aiCommand.action && aiCommand.action !== 'none') {
            const executed = executeMusicAction(aiCommand.action, aiCommand.song);
            if (executed) {
                addMessage('user', text);
                return;
            }
        }

        addMessage('user', text);
        history.push({ role: 'user', text });
        if (history.length > 16) history = history.slice(-16);

        showTyping();
        if (voiceActive) setLiveTranscript('Thinking…');
        const answer = await getAIAnswer(text, selected);
        hideTyping();
        setLiveTranscript('');
        addMessage('bot', answer);
        history.push({ role: 'bot', text: answer });
        if (voiceActive && !musicPlaying) {
            await speakText(answer);
        } else {
            if (conversationActive && !musicPlaying) {
                setTimeout(startListening, 500);
            }
        }
    }

    // ─── TTS ────────────────────────────────────────────────────────────────
    async function speakText(text) {
        if (!voiceActive) return;
        stopAudio();
        ttsLoading = true;
        try {
            const res = await fetch(VOICE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language: 'en-US', voice_id: VOICE_ID, speed: VOICE_SPEED })
            });
            if (!res.ok) throw new Error(`TTS ${res.status}`);
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            currentAudio = new Audio(audioUrl);
            currentAudio.addEventListener('ended', () => {
                const wasPlaying = !!currentAudio;
                currentAudio = null;
                ttsLoading = false;
                if (wasPlaying && conversationActive && !musicPlaying) {
                    startListening();
                }
            });
            currentAudio.addEventListener('error', () => {
                currentAudio = null;
                ttsLoading = false;
                if (conversationActive && !musicPlaying) {
                    setTimeout(startListening, 500);
                }
            });
            currentAudio.play();
        } catch (e) {
            console.warn('Voice failed:', e.message);
            ttsLoading = false;
            if (conversationActive && !musicPlaying) {
                setTimeout(startListening, 500);
            }
        }
    }

    function stopAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio.onended = null;
            currentAudio.onerror = null;
            currentAudio = null;
        }
        ttsLoading = false;
    }

    // ─── Mic ────────────────────────────────────────────────────────────────
    function startListening() {
        if (!voiceActive || !SpeechRecognition) return;
        if (currentAudio) return;
        if (ttsLoading) return;
        if (musicPlaying) return;
        if (isMinimized) return;

        if (recognition) {
            try { recognition.stop(); } catch (e) {}
            recognition = null;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.addEventListener('result', (e) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const r = e.results[i];
                if (r.isFinal) {
                    finalTranscript += r[0].transcript;
                } else {
                    interim += r[0].transcript;
                }
            }
            chatInput.value = finalTranscript + interim;
            setLiveTranscript(interim || finalTranscript, !!interim);
        });

        recognition.addEventListener('end', () => {
            micOrb.classList.remove('listening');
            const text = finalTranscript.trim();
            finalTranscript = '';
            recognition = null;
            setLiveTranscript('');

            if (text) {
                chatInput.value = text;
                sendMessage(text);
            } else {
                if (wasPlayingBeforeMic && currentVideoId) {
                    wasPlayingBeforeMic = false;
                    resumeSong();
                }
            }
        });

        recognition.addEventListener('error', (e) => {
            micOrb.classList.remove('listening');
            setLiveTranscript('');
            recognition = null;
            if (e.error === 'not-allowed') {
                setLiveTranscript('Mic denied');
                setTimeout(() => setLiveTranscript(''), 4000);
            }
            if (wasPlayingBeforeMic && currentVideoId) {
                wasPlayingBeforeMic = false;
                resumeSong();
            }
        });

        try {
            recognition.start();
            micOrb.classList.add('listening');
            setLiveTranscript('🎤 Listening…', true);
        } catch (e) {
            recognition = null;
        }
    }

    function stopListening() {
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
            recognition = null;
        }
        micOrb.classList.remove('listening');
        setLiveTranscript('');
        if (wasPlayingBeforeMic && currentVideoId) {
            wasPlayingBeforeMic = false;
            resumeSong();
        }
    }

    micOrb.addEventListener('click', () => {
        if (!voiceActive) return;

        if (currentAudio) {
            stopAudio();
            if (musicPlaying) {
                wasPlayingBeforeMic = true;
                pauseSong();
            }
            if (!conversationActive) conversationActive = true;
            setTimeout(startListening, 100);
            return;
        }

        if (micOrb.classList.contains('listening')) {
            stopListening();
            return;
        }

        if (musicPlaying) {
            wasPlayingBeforeMic = true;
            pauseSong();
        }

        if (!conversationActive) conversationActive = true;
        startListening();
    });

    voiceToggleBtn.addEventListener('click', () => {
        voiceActive = !voiceActive;
        if (voiceActive) {
            voiceToggleBtn.innerHTML =
                `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
            voiceToggleBtn.classList.remove('voice-off');
        } else {
            voiceToggleBtn.innerHTML =
                `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
            voiceToggleBtn.classList.add('voice-off');
            stopListening();
            stopSong();
            stopAudio();
        }
    });

    sendBtn.addEventListener('click', () => sendMessage(chatInput.value));
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage(chatInput.value);
    });

    // ─── Export / Import / Clear ──────────────────────────────────────────
    saveChatBtn.addEventListener('click', () => {
        const data = JSON.stringify(messageHistory, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ragina-chat-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        chatStatus.textContent = 'Exported ✓';
        chatStatus.style.color = '#6C63FF';
        setTimeout(() => {
            chatStatus.textContent = 'Auto‑saved';
            chatStatus.style.color = '#666';
        }, 3000);
    });

    loadChatBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (Array.isArray(data)) {
                    messageHistory = data;
                    renderMessages(data);
                    saveToIndexedDB(data);
                    chatStatus.textContent = `Loaded ${data.length} messages`;
                    chatStatus.style.color = '#6C63FF';
                    const nameMsg = data.find(m => m.role === 'system' && m.text.includes('Welcome back'));
                    if (nameMsg) {
                        const match = nameMsg.text.match(/Welcome back, ([^!]+)/);
                        if (match) {
                            userName = match[1];
                            try { localStorage.setItem(NAME_KEY, userName); } catch (e) {}
                        }
                    }
                    history = data.filter(m => m.role === 'user' || m.role === 'bot')
                        .map(m => ({ role: m.role, text: m.text }));
                    introDone = true;
                    conversationActive = true;
                    if (userName) {
                        setTimeout(() => {
                            if (voiceActive && !musicPlaying && !currentAudio && !ttsLoading) {
                                startListening();
                            }
                        }, 1000);
                    }
                } else {
                    throw new Error('Invalid format');
                }
            } catch (err) {
                alert('Failed to load chat file. Make sure it\'s a valid JSON export.');
                console.error(err);
            }
        };
        reader.readAsText(file);
        fileInput.value = '';
    });

    clearChatBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all chat history?')) {
            messageHistory = [];
            messages.innerHTML = '';
            history = [];
            userName = null;
            introDone = false;
            conversationActive = false;
            awaitingName = false;
            try { localStorage.removeItem(NAME_KEY); } catch (e) {}
            await clearIndexedDB();
            chatStatus.textContent = 'Cleared';
            chatStatus.style.color = '#FF6584';
            setTimeout(() => {
                chatStatus.textContent = 'Auto‑saved';
                chatStatus.style.color = '#666';
            }, 3000);
        }
    });

    // ─── Typing / transcript ──────────────────────────────────────────────
    function setLiveTranscript(text, interim = false) {
        liveTranscript.textContent = text || '';
        liveTranscript.classList.toggle('interim', interim);
    }

    let typingEl = null;

    function showTyping() {
        typingEl = document.createElement('div');
        typingEl.className = 'typing-dots';
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(typingEl);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        if (typingEl) { typingEl.remove();
            typingEl = null; }
    }

    // ─── Boot ──────────────────────────────────────────────────────────────
    (async function init() {
        // Restore chat history
        const hasHistory = await restoreChat();

        if (!hasHistory) {
            // No history – show only the orb (user clicks to start)
        } else {
            if (userName) {
                conversationActive = true;
            }
        }
        // Start minimized
        setMinimized(true);
    })();

    // Expose YouTube callback globally
    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

})();