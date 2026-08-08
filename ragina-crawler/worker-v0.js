// ─── WORKER.JS ──────────────────────────────────────────────────
// Environment: SMALLEST_API_KEY, YOUTUBE_API_KEY

const CORS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
};

// Multiple named voices per language — each one can power its own "channel".
// All IDs verified against Smallest.ai's Lightning v3.1 catalog.
const VOICE_CATALOG = {
      'en-US': {
            langCode: 'en',
            voices: [
                  { id: 'rachel', gender: 'female', label: 'Rachel — Energetic', model: 'lightning_v3.1', backup: 'lauren' },
                  { id: 'lauren', gender: 'female', label: 'Lauren — Warm', model: 'lightning_v3.1', backup: 'rachel' },
                  { id: 'magnus', gender: 'male', label: 'Magnus — Chill', model: 'lightning_v3.1', backup: 'jordan' },
                  { id: 'jordan', gender: 'male', label: 'Jordan — Bold', model: 'lightning_v3.1', backup: 'magnus' }
            ]
      },
      'hi-IN': {
            langCode: 'hi',
            voices: [
                  { id: 'sunidhi', gender: 'female', label: 'Sunidhi', model: 'lightning_v3.1', backup: 'chinmayi' },
                  { id: 'chinmayi', gender: 'female', label: 'Chinmayi', model: 'lightning_v3.1', backup: 'sunidhi' },
                  { id: 'devansh', gender: 'male', label: 'Devansh', model: 'lightning_v3.1', backup: 'wasim' },
                  { id: 'wasim', gender: 'male', label: 'Wasim', model: 'lightning_v3.1', backup: 'devansh' }
            ]
      },
      'te-IN': {
            langCode: 'te',
            voices: [
                  { id: 'padmaja', gender: 'female', label: 'Padmaja', model: 'lightning_v3.1', backup: 'sravani' },
                  { id: 'sravani', gender: 'female', label: 'Sravani (Pro)', model: 'lightning_v3.1_pro', backup: 'padmaja' },
                  { id: 'srihari', gender: 'male', label: 'Srihari', model: 'lightning_v3.1', backup: 'naveen' },
                  { id: 'naveen', gender: 'male', label: 'Naveen (Pro)', model: 'lightning_v3.1_pro', backup: 'srihari' }
            ]
      }
};

function findVoice(langEntry, voiceId) {
      return langEntry.voices.find(v => v.id === voiceId) || null;
}
function findVoiceById(langEntry, id) {
      const v = langEntry.voices.find(v => v.id === id);
      return v || null;
}

async function trySmallestTTS(candidates, langCode, text, speed, apiKey) {
      let lastError = null;
      for (const c of candidates) {
            try {
                  const payload = {
                        text,
                        voice_id: c.voice_id,
                        model: c.model,
                        language: langCode,
                        output_format: 'mp3',
                        sample_rate: 24000,
                        speed
                  };
                  const response = await fetch('https://api.smallest.ai/waves/v1/tts', {
                        method: 'POST',
                        headers: {
                              'Authorization': `Bearer ${apiKey}`,
                              'Content-Type': 'application/json',
                              'Accept': 'audio/mpeg'
                        },
                        body: JSON.stringify(payload)
                  });
                  if (response.ok) {
                        const audioBuffer = await response.arrayBuffer();
                        return { ok: true, audioBuffer };
                  }
                  const errorBody = await response.text();
                  lastError = `Voice ${c.voice_id} (${c.model}) failed (${response.status}): ${errorBody || '(empty body)'}`;
                  console.warn(lastError);
            } catch (err) {
                  lastError = `Voice ${c.voice_id} error: ${err.message}`;
            }
      }
      return { ok: false, error: lastError || 'All voices failed' };
}

function cacheKeyFor(text, language, voiceId, speed) {
      const hash = [...text].reduce((h, ch) => ((h * 31 + ch.charCodeAt(0)) >>> 0), 7);
      return new Request(
            `https://tts-cache.internal/v2?lang=${encodeURIComponent(language)}&voice=${encodeURIComponent(voiceId)}&speed=${speed}&len=${text.length}&h=${hash}`
      );
}

export default {
      async fetch(request, env, ctx) {
            if (request.method === 'OPTIONS') {
                  return new Response(null, { headers: CORS });
            }

            const url = new URL(request.url);
            const path = url.pathname;

            // ─── LIST VOICES FOR A LANGUAGE ─────────────────────────────
            if (path === '/api/voices' && request.method === 'GET') {
                  const language = url.searchParams.get('language');
                  const entry = VOICE_CATALOG[language];
                  if (!entry) return jsonError(`Unsupported language: ${language}`, 400);
                  return new Response(JSON.stringify({
                        success: true,
                        voices: entry.voices.map(v => ({ id: v.id, gender: v.gender, label: v.label }))
                  }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } });
            }

            // ─── TTS ENDPOINT ──────────────────────────────────────────
            if (path === '/api/tts' && request.method === 'POST') {
                  try {
                        const body = await request.json();
                        const text = body.text;
                        const language = body.language;
                        let speed = parseFloat(body.speed);
                        if (!Number.isFinite(speed) || speed < 0.5 || speed > 2.0) speed = 1.0;

                        if (!text || !language) {
                              return new Response(JSON.stringify({ error: 'Missing text or language' }), {
                                    status: 400,
                                    headers: { 'Content-Type': 'application/json', ...CORS }
                              });
                        }
                        if (text.length > 2000) {
                              return new Response(JSON.stringify({ error: 'Text too long (max 2000 chars)' }), {
                                    status: 400,
                                    headers: { 'Content-Type': 'application/json', ...CORS }
                              });
                        }

                        const apiKey = env.SMALLEST_API_KEY;
                        if (!apiKey) {
                              return new Response(JSON.stringify({ error: 'SMALLEST_API_KEY not set' }), {
                                    status: 500,
                                    headers: { 'Content-Type': 'application/json', ...CORS }
                              });
                        }

                        const langEntry = VOICE_CATALOG[language];
                        if (!langEntry) {
                              return new Response(JSON.stringify({ error: `Unsupported language: ${language}` }), {
                                    status: 400,
                                    headers: { 'Content-Type': 'application/json', ...CORS }
                              });
                        }

                        // Accept either an explicit voice_id (preferred, powers channels)
                        // or a gender (backward compatible — picks first matching voice).
                        let chosen = null;
                        if (body.voice_id) {
                              chosen = findVoiceById(langEntry, body.voice_id);
                        }
                        if (!chosen) {
                              const gender = body.gender === 'male' ? 'male' : 'female';
                              chosen = langEntry.voices.find(v => v.gender === gender) || langEntry.voices[0];
                        }

                        const candidates = [
                              { voice_id: chosen.id, model: chosen.model }
                        ];
                        const backupVoice = findVoiceById(langEntry, chosen.backup);
                        if (backupVoice) candidates.push({ voice_id: backupVoice.id, model: backupVoice.model });

                        const cache = caches.default;
                        const cacheKey = cacheKeyFor(text, language, chosen.id, speed);
                        const cached = await cache.match(cacheKey);
                        if (cached) {
                              const cachedBuffer = await cached.arrayBuffer();
                              return new Response(cachedBuffer, {
                                    status: 200,
                                    headers: {
                                          'Content-Type': 'audio/mpeg', ...CORS,
                                          'Content-Length': cachedBuffer.byteLength, 'X-Cache': 'HIT'
                                    }
                              });
                        }

                        const result = await trySmallestTTS(candidates, langEntry.langCode, text, speed, apiKey);

                        if (result.ok) {
                              const cacheResponse = new Response(result.audioBuffer, {
                                    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=604800' }
                              });
                              ctx.waitUntil(cache.put(cacheKey, cacheResponse.clone()));
                              return new Response(result.audioBuffer, {
                                    status: 200,
                                    headers: {
                                          'Content-Type': 'audio/mpeg', ...CORS,
                                          'Content-Length': result.audioBuffer.byteLength, 'X-Cache': 'MISS'
                                    }
                              });
                        } else {
                              return new Response(JSON.stringify({ error: result.error }), {
                                    status: 500,
                                    headers: { 'Content-Type': 'application/json', ...CORS }
                              });
                        }

                  } catch (error) {
                        return new Response(JSON.stringify({ error: 'Worker error: ' + error.message }), {
                              status: 500,
                              headers: { 'Content-Type': 'application/json', ...CORS }
                        });
                  }
            }

            // ─── YOUTUBE SEARCH ────────────────────────────────────────
            if (path === '/api/youtube/search' && request.method === 'GET') {
                  const query = url.searchParams.get('q');
                  if (!query) return jsonError('Missing "q"', 400);
                  const key = env.YOUTUBE_API_KEY;
                  if (!key) return jsonError('YOUTUBE_API_KEY not set', 500);
                  const ytUrl = new URL('https://www.googleapis.com/youtube/v3/search');
                  ytUrl.searchParams.set('part', 'snippet');
                  ytUrl.searchParams.set('type', 'video');
                  ytUrl.searchParams.set('videoCategoryId', '10');
                  ytUrl.searchParams.set('maxResults', '5');
                  ytUrl.searchParams.set('q', query);
                  ytUrl.searchParams.set('key', key);
                  try {
                        const resp = await fetch(ytUrl);
                        const data = await resp.json();
                        if (data.error) return jsonError(data.error.message, resp.status);
                        const items = (data.items || []).map(item => ({
                              id: item.id.videoId,
                              title: item.snippet.title,
                              channel: item.snippet.channelTitle,
                              thumb: item.snippet.thumbnails?.default?.url || null
                        }));
                        return new Response(JSON.stringify({ success: true, items }), {
                              status: 200,
                              headers: { 'Content-Type': 'application/json', ...CORS }
                        });
                  } catch (e) {
                        return jsonError('YouTube proxy error: ' + e.message, 500);
                  }
            }

            // ─── RSS NEWS ──────────────────────────────────────────────
            if (path === '/api/news' && request.method === 'GET') {
                  const feeds = {
                        news: 'https://news.google.com/rss/search?q=india+news&hl=en',
                        anime: 'https://www.animenewsnetwork.com/news/feed.xml',
                        entertainment: 'https://news.google.com/rss/search?q=bollywood+gossip&hl=en',
                        tech: 'https://news.google.com/rss/search?q=technology+india&hl=en'
                  };
                  const category = url.searchParams.get('category') || 'news';
                  const feedUrl = feeds[category];
                  if (!feedUrl) return jsonError('Invalid category', 400);
                  try {
                        const resp = await fetch(feedUrl);
                        const xml = await resp.text();
                        const items = [];
                        const re = /<item>([\s\S]*?)<\/item>/g;
                        let match;
                        while ((match = re.exec(xml)) !== null) {
                              const content = match[1];
                              const title = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
                              const link = (content.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
                              items.push({
                                    title: title.replace(/<[^>]*>/g, '').trim(),
                                    link: link.trim()
                              });
                        }
                        return new Response(JSON.stringify({ success: true, items: items.slice(0, 5) }), {
                              status: 200,
                              headers: { 'Content-Type': 'application/json', ...CORS }
                        });
                  } catch (e) {
                        return jsonError('News fetch error: ' + e.message, 500);
                  }
            }

            return new Response('Not Found', { status: 404 });
      }
};

function jsonError(msg, status = 500) {
      return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { 'Content-Type': 'application/json', ...CORS }
      });
}
