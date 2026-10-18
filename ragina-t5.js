/*! RAGina-T5 v5.4.0 — Standalone with RAG
 *  Voice · Music · Web Forms · Guides · Multi-Step · RAG · 21 tools
 *  No T4 required. No API keys. No model downloads.
 */
(function (global) {
'use strict';

const hasDOM = typeof document !== 'undefined';
const WORKER = 'https://sensycilva.suryasticsai.workers.dev';
const TTS_URL = WORKER + '/api/tts';
const YT_SEARCH = WORKER + '/api/youtube/search?q=';
const ASK_URL = 'https://ragina-crawler-ragina.vercel.app/api/ask';

/* ═══ 1. SCHEMA ═══════════════════════════════════════════════════ */
const S = {
  string:(o={})=>({t:'string',...o}), number:(o={})=>({t:'number',...o}),
  boolean:(o={})=>({t:'boolean',...o}), object:(shape,o={})=>({t:'object',shape,...o}),
  optional:(s)=>({...s,optional:true}), array:(item,o={})=>({t:'array',item,...o}),
  enum:(values,o={})=>({t:'enum',values,...o}),
};
function validate(schema, v, path='$') {
  if (v===undefined||v===null) {
    if (schema.optional) return {ok:true, value:undefined};
    if ('default' in schema) return {ok:true, value:schema.default};
    return {ok:false, error:`${path}: required`};
  }
  switch (schema.t) {
    case 'string':
      if (schema.coerce) v=String(v);
      if (typeof v!=='string') return {ok:false, error:`${path}: expected string`};
      if (schema.min!=null && v.length<schema.min) return {ok:false, error:`${path}: min ${schema.min}`};
      if (schema.max!=null && v.length>schema.max) return {ok:false, error:`${path}: max ${schema.max}`};
      return {ok:true, value:v};
    case 'number':
      if (schema.coerce) v=Number(v);
      if (typeof v!=='number'||isNaN(v)) return {ok:false, error:`${path}: expected number`};
      if (schema.min!=null && v<schema.min) return {ok:false, error:`${path}: min ${schema.min}`};
      if (schema.max!=null && v>schema.max) return {ok:false, error:`${path}: max ${schema.max}`};
      return {ok:true, value:v};
    case 'boolean':
      if (schema.coerce && typeof v==='string') v=v==='true';
      if (typeof v!=='boolean') return {ok:false, error:`${path}: expected boolean`};
      return {ok:true, value:v};
    case 'enum':
      if (!schema.values.includes(v)) return {ok:false, error:`${path}: one of [${schema.values.join(',')}]`};
      return {ok:true, value:v};
    case 'object': {
      if (typeof v!=='object'||Array.isArray(v)) return {ok:false, error:`${path}: expected object`};
      const out={};
      for (const [k,sub] of Object.entries(schema.shape)) {
        const r=validate(sub, v[k], `${path}.${k}`);
        if (!r.ok) return r;
        if (r.value!==undefined) out[k]=r.value;
      }
      return {ok:true, value:out};
    }
    case 'array': {
      if (!Array.isArray(v)) return {ok:false, error:`${path}: expected array`};
      const out=[];
      for (let i=0;i<v.length;i++) {
        const r=validate(schema.item, v[i], `${path}[${i}]`);
        if (!r.ok) return r;
        out.push(r.value);
      }
      return {ok:true, value:out};
    }
    default: return {ok:false, error:`${path}: unknown type`};
  }
}
function toParameters(schema) {
  if (!schema||schema.t!=='object') return {};
  const out={};
  for (const [k,v] of Object.entries(schema.shape)) {
    const t = v.t==='enum' ? `one of [${v.values.join(',')}]` : v.t;
    out[k] = t + (v.optional?' (optional)':'');
  }
  return out;
}

/* ═══ 2. SPEECH PIPELINE ══════════════════════════════════════════ */
const SPEECH = {maxChunk:1500, maxSpeak:800, listThreshold:3, fallback:'The details are on your screen — please follow the context there.'};
function stripMd(text) {
  if (!text) return '';
  return String(text)
    .replace(/```[\s\S]*?```/g,' [code block] ').replace(/`([^`]+)`/g,'$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
    .replace(/https?:\/\/\S+/g,'').replace(/^#{1,6}\s+/gm,'')
    .replace(/^\s*[-*+]\s+/gm,'').replace(/^\s*\d+\.\s+/gm,'')
    .replace(/[*_~>|]/g,'').replace(/<[^>]+>/g,'')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'')
    .replace(/[ \t]+/g,' ').replace(/\n{2,}/g,'\n\n').trim();
}
function splitSents(text) { return (text.match(/[^.!?\n]+[!?]*[.!?]*\n?/g)||[text]).map(s=>s.trim()).filter(Boolean); }
function chunk(text, max=SPEECH.maxChunk) {
  const clean=stripMd(text);
  if (clean.length<=max) return [clean];
  const paras=clean.split(/\n\s*\n/); const out=[]; let buf='';
  const flush=()=>{if(buf.trim())out.push(buf.trim());buf='';};
  for (const p of paras) {
    if (p.length>max) { flush(); let l='';
      for (const s of splitSents(p)) {
        if ((l+' '+s).length>max) { if(l)out.push(l.trim()); l=s; }
        else l = l ? l+' '+s : s;
      }
      if (l.trim()) out.push(l.trim());
    } else if ((buf+'\n\n'+p).length>max) { flush(); buf=p; }
    else buf = buf ? buf+'\n\n'+p : p;
  }
  flush(); return out;
}
function pickPolicy(text) {
  const clean=stripMd(text);
  const bullet=(String(text).match(/^\s*[-*+]\s+/gm)||[]).length;
  const numbered=(String(text).match(/^\s*\d+\.\s+/gm)||[]).length;
  if (/```/.test(text)||/<\/?[a-z][\s\S]*>/i.test(text)) return {policy:'SUMMARY_ONLY',reason:'code'};
  if (Math.max(bullet,numbered)>=SPEECH.listThreshold) return {policy:'SUMMARY_ONLY',reason:'list'};
  if (clean.length>SPEECH.maxSpeak) return {policy:'SUMMARY_ONLY',reason:'long'};
  if (!clean.trim()) return {policy:'SILENT',reason:'empty'};
  return {policy:'FULL',reason:'ok'};
}
function summarize(text) {
  const clean=stripMd(text);
  if (!clean) return SPEECH.fallback;
  const sents=splitSents(clean).slice(0,2);
  let out=sents.join(' ').trim();
  if (!out) return SPEECH.fallback;
  if (!/[.!?]$/.test(out)) out+='.';
  return out;
}
function toSpeakable(text) {
  const {policy,reason}=pickPolicy(text);
  if (policy==='SILENT') return {chunks:[],policy,reason};
  if (policy==='SUMMARY_ONLY') return {chunks:[summarize(text)+' '+SPEECH.fallback],policy,reason};
  return {chunks:chunk(text),policy,reason};
}

/* ═══ 3. CAPABILITY TIER ═════════════════════════════════════════ */
async function detectTier() {
  let gpu=false;
  if ('gpu' in navigator) { try { gpu=!!(await navigator.gpu.requestAdapter({featureLevel:'compatibility'})); } catch {} }
  const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const coi=global.crossOriginIsolated===true;
  let tier;
  if (gpu && !mobile) tier='FULL_GPU';
  else if (gpu && mobile) tier='MOBILE_GPU';
  else if (coi) tier='WASM_MULTITHREADED';
  else tier='WASM_SINGLE_THREAD';
  return {tier,gpu,mobile,coi,nativeTTS:'speechSynthesis' in global};
}

/* ═══ 4. AUDIO ═══════════════════════════════════════════════════ */
class NativeTTS {
  constructor(){this.synth=global.speechSynthesis;}
  speak(text){return new Promise((res,rej)=>{this.stop();const u=new SpeechSynthesisUtterance(text);u.onend=()=>res({via:'native'});u.onerror=e=>rej(new Error('native:'+e.error));this.synth.speak(u);});}
  stop(){if(this.synth)this.synth.cancel();}
}
class ServerTTS {
  constructor({url=TTS_URL,voiceId='rachel',speed=1.0,timeout=10000}={}){this.url=url;this.voiceId=voiceId;this.speed=speed;this.timeout=timeout;this._abort=null;this._audio=null;}
  async speak(text){
    this.stop(); this._abort=new AbortController();
    const t=setTimeout(()=>this._abort.abort(),this.timeout);
    try {
      const r=await fetch(this.url,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text,language:'en-US',voice_id:this.voiceId,speed:this.speed}),signal:this._abort.signal});
      if(!r.ok)throw new Error('tts-'+r.status);
      const blob=await r.blob(); const url=URL.createObjectURL(blob);
      const audio=new Audio(url); this._audio=audio;
      await new Promise((res,rej)=>{audio.onended=()=>{URL.revokeObjectURL(url);res();};audio.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('audio-error'));};audio.play().catch(rej);});
      return {via:'server'};
    } finally { clearTimeout(t); }
  }
  stop(){if(this._abort){try{this._abort.abort();}catch{}this._abort=null;}if(this._audio){try{this._audio.pause();}catch{}this._audio=null;}}
}
class VoiceProvider {
  constructor({server,native}){this.server=server;this.native=native;}
  async speak(text){if(this.server){try{return await this.server.speak(text);}catch(e){console.warn('[T5] server TTS failed:',e.message);}}return this.native.speak(text);}
  stop(){if(this.server)this.server.stop();this.native.stop();}
}
class YTPlayer {
  constructor(){this.player=null;this.ready=false;this.videoId=null;this.playing=false;this.volume=1;this._loadPromise=null;}
  async _init(){
    if(this._loadPromise)return this._loadPromise;
    this._loadPromise=new Promise((resolve,reject)=>{
      if(global.YT&&global.YT.Player){this._create();resolve();return;}
      if(!document.querySelector('script[src*="youtube.com/iframe_api"]')){
        const s=document.createElement('script');
        s.src='https://www.youtube.com/iframe_api';
        s.onerror=()=>reject(new Error('YouTube API load failed'));
        document.head.appendChild(s);
      }
      let attempts=0;
      const check=()=>{attempts++;if(global.YT&&global.YT.Player){this._create();resolve();return;}if(attempts>50){reject(new Error('YouTube API timeout'));return;}setTimeout(check,200);};
      check();
    });
    return this._loadPromise;
  }
  _create(){
    const el=document.createElement('div'); el.id='r5-yt-player';
    el.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(el);
    this.player=new global.YT.Player('r5-yt-player',{height:'0',width:'0',videoId:'',
      playerVars:{autoplay:0,controls:0,modestbranding:1,rel:0,iv_load_policy:3},
      events:{onReady:()=>{this.ready=true;},
        onStateChange:(e)=>{const st=global.YT.PlayerState;if(e.data===st.PLAYING)this.playing=true;else if(e.data===st.PAUSED||e.data===st.ENDED)this.playing=false;}}});
  }
  async play(query){
    const r=await fetch(YT_SEARCH+encodeURIComponent(query));
    if(!r.ok)throw new Error('search-'+r.status);
    const data=await r.json();
    if(!data.success||!data.items?.length)throw new Error('no-results');
    const song=data.items[0];
    await this._init();
    if(!this.ready)await new Promise(res=>{const t=setInterval(()=>{if(this.ready){clearInterval(t);res();}},200);setTimeout(()=>{clearInterval(t);res();},5000);});
    if(this.player&&typeof this.player.loadVideoById==='function'){
      this.player.loadVideoById(song.id); this.player.playVideo();
      this.videoId=song.id; this.playing=true;
      return {title:song.title,id:song.id};
    }
    throw new Error('player-not-ready');
  }
  pause(){if(this.player?.pauseVideo)this.player.pauseVideo();this.playing=false;}
  resume(){if(this.player?.playVideo)this.player.playVideo();this.playing=true;}
  stop(){if(this.player?.stopVideo)this.player.stopVideo();this.playing=false;this.videoId=null;}
  isPlaying(){return this.playing;}
  duck(v){if(this.player?.setVolume){this.volume=v;this.player.setVolume(Math.round(v*100));}}
  unduck(){if(this.player?.setVolume)this.player.setVolume(Math.round(this.volume*100));}
}
class AudioSession {
  constructor({voice,music}){
    this.voice=voice;this.music=music;this.speaking=false;
    this.muted=JSON.parse(localStorage.getItem('r5.muted')||'false');
    this._wasDucked=false;
    if(hasDOM)document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stopSpeaking();});
  }
  async speak(text){
    if(this.muted)return {ok:false,reason:'muted'};
    this.stopSpeaking();
    const norm=toSpeakable(text);
    if(!norm.chunks.length)return {ok:false,reason:'nothing-to-say',policy:norm.policy};
    this.speaking=true; this._duck();
    try {
      for(const c of norm.chunks){if(!this.speaking)break;await this.voice.speak(c);}
      return {ok:true,policy:norm.policy,chunks:norm.chunks.length};
    } catch(e){return {ok:false,error:String(e?.message||e)};}
    finally {this.speaking=false;this._unduck();}
  }
  stopSpeaking(){if(!this.speaking)return;this.voice.stop();this.speaking=false;this._unduck();}
  async playSong(q){return await this.music.play(q);}
  pauseMusic(){this.music.pause();return {ok:true};}
  stopMusic(){this.music.stop();return {ok:true};}
  _duck(){if(this.music.isPlaying()){this._wasDucked=true;this.music.duck(0.2);}}
  _unduck(){if(this._wasDucked){this.music.unduck();this._wasDucked=false;}}
  setMuted(flag,byAgent=false){
    if(byAgent&&!flag)return {ok:false,reason:'agent-cannot-unmute'};
    this.muted=!!flag; localStorage.setItem('r5.muted',JSON.stringify(this.muted));
    if(this.muted){this.stopSpeaking();this.music.pause();}
    return {ok:true,muted:this.muted};
  }
  isMuted(){return this.muted;}
}

/* ═══ 5. WEB FORMS ═══════════════════════════════════════════════ */
const pending=new Map();
function nativeSet(el,val){
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(setter)setter.call(el,val);else el.value=val;
}
function fire(el,type){el.dispatchEvent(new Event(type,{bubbles:true}));}
function labelOf(el){
  const id=el.id;
  const lbl=id?document.querySelector(`label[for="${CSS.escape(id)}"]`):null;
  return el.getAttribute('aria-label')||lbl?.textContent?.trim()||el.getAttribute('placeholder')||el.name||el.id||el.tagName.toLowerCase();
}
function readForms(){
  const forms=[...document.querySelectorAll('form')];
  if(!forms.length)return {ok:true,forms:[]};
  return {ok:true,forms:forms.map((f,i)=>{
    const id=f.id||`form_${i}`;
    if(!f.dataset.r5Id)f.dataset.r5Id=id;
    const fields=[...f.querySelectorAll('input,textarea,select')]
      .filter(el=>!['hidden','submit','button','reset'].includes(el.type))
      .map(el=>({label:labelOf(el),type:el.tagName==='SELECT'?'select':(el.type||el.tagName.toLowerCase()),required:el.required,value:el.type==='password'?(el.value?'••••':''):el.value}));
    return {formId:id,action:f.getAttribute('action')||'',method:(f.getAttribute('method')||'GET').toUpperCase(),fields,submitLabel:f.querySelector('[type="submit"]')?.textContent?.trim()||'Submit'};
  })};
}
function fillForm(formId,values){
  const f=document.querySelector(`[data-r5-id="${CSS.escape(formId)}"]`)||document.getElementById(formId);
  if(!f)return {ok:false,error:`form "${formId}" not found`};
  const filled=[],missing=[];
  for(const [k,v] of Object.entries(values||{})){
    const el=[...f.querySelectorAll('input,textarea,select')].find(e=>e.name===k||e.id===k||labelOf(e).toLowerCase()===String(k).toLowerCase());
    if(!el){missing.push(k);continue;}
    if(el.tagName==='SELECT'){el.value=String(v);fire(el,'change');}
    else if(el.type==='checkbox'){el.checked=!!v;fire(el,'change');}
    else if(el.type==='radio'){el.checked=!!v;fire(el,'change');}
    else{nativeSet(el,String(v));fire(el,'input');fire(el,'change');}
    filled.push({key:k,label:labelOf(el)});
  }
  return {ok:true,filled,missing};
}
function requestSubmit(formId){
  const f=document.querySelector(`[data-r5-id="${CSS.escape(formId)}"]`)||document.getElementById(formId);
  if(!f)return {ok:false,error:`form "${formId}" not found`};
  const btn=f.querySelector('[type="submit"]')||f.querySelector('button');
  const actionId=crypto.randomUUID();
  pending.set(actionId,{form:f,btn});
  setTimeout(()=>pending.delete(actionId),60000);
  return {pendingConfirmation:true,actionId,summary:{
    formId,submitLabel:btn?.textContent?.trim()||'Submit',
    fields:[...f.querySelectorAll('input,textarea,select')].filter(el=>!['hidden','submit','button'].includes(el.type)&&el.value)
      .map(el=>({label:labelOf(el),value:el.type==='password'?'••••':el.value})),
  }};
}
function resolveSubmit(actionId,approved){
  const p=pending.get(actionId);
  if(!p)return {ok:false,error:'expired'};
  pending.delete(actionId);
  if(!approved)return {ok:true,cancelled:true};
  if(p.btn)p.btn.click();else p.form.submit?.();
  return {ok:true,submitted:true};
}
async function fetchTable(url,{headers={}}={}){
  let r;
  try{r=await fetch(url,{method:'GET',headers,credentials:'include'});}catch(e){return {ok:false,error:'network:'+e.message};}
  if(!r.ok)return {ok:false,error:'HTTP '+r.status};
  let data;
  try{data=await r.json();}catch{return {ok:false,error:'not-json'};}
  const arr=Array.isArray(data)?data:Array.isArray(data?.data)?data.data:Array.isArray(data?.items)?data.items:Array.isArray(data?.results)?data.results:null;
  if(!arr)return {ok:false,error:'no-array-in-response'};
  const cols=[];for(const row of arr.slice(0,20))if(row&&typeof row==='object')for(const k of Object.keys(row))if(!cols.includes(k)&&cols.length<8)cols.push(k);
  const cell=v=>v==null?'':typeof v==='object'?JSON.stringify(v).slice(0,60):String(v);
  const rows=arr.slice(0,50).map(row=>cols.map(c=>cell(row?.[c])));
  const md=['| '+cols.join(' | ')+' |','|'+cols.map(()=>'---').join('|')+'|',...rows.map(r=>'| '+r.join(' | ')+' |')].join('\n');
  return {ok:true,columns:cols,rows,total:arr.length,markdown:md};
}

/* ═══ 6. GUIDE ═══════════════════════════════════════════════════ */
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mdToHtml(md){
  return String(md).replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^## (.*)$/gm,'<h2>$1</h2>')
    .replace(/^# (.*)$/gm,'<h1>$1</h1>').replace(/^- (.*)$/gm,'<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\n{2,}/g,'</p><p>');
}
function buildGuide({title,markdown}){
  const md=String(markdown);
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:system-ui;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.6}h1{border-bottom:2px solid #eee;padding-bottom:.5rem}code{background:#f4f4f4;padding:2px 6px;border-radius:3px}</style></head><body><h1>${esc(title)}</h1><p><small>Generated ${new Date().toLocaleString()}</small></p><p>${mdToHtml(md)}</p></body></html>`;
  return {title,urlMD:URL.createObjectURL(new Blob([md],{type:'text/markdown'})),urlHTML:URL.createObjectURL(new Blob([html],{type:'text/html'}))};
}
function downloadFile(url,filename){
  const a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
}

/* ═══ 7. TRACE ═══════════════════════════════════════════════════ */
const trace={
  steps:[],active:false,_t0:0,
  start(){this.steps=[];this.active=true;this._t0=Date.now();},
  record(s){if(this.active)this.steps.push({...s,ts:Date.now()});},
  end(){this.active=false;return {steps:this.steps,duration:Date.now()-this._t0};},
  summary(){return {total:this.steps.length,tools:this.steps.filter(s=>s.type==='tool_call').map(s=>s.name),duration:this._t0?Date.now()-this._t0:0};},
};

/* ═══ 8. RAG ENGINE ══════════════════════════════════════════════ */
class EmbeddingEngine {
  constructor(dim = 128) { this.dim = dim; this.cache = new Map(); }
  _hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i); return Math.abs(h); }
  _vec(word) {
    if (this.cache.has(word)) return this.cache.get(word);
    const seed = this._hash(word.toLowerCase());
    const v = new Float32Array(this.dim);
    let x = seed;
    for (let i = 0; i < this.dim; i++) { x = (x * 16807) % 2147483647; v[i] = (x / 2147483647) * 2 - 1; }
    let n = 0; for (let i = 0; i < this.dim; i++) n += v[i] * v[i];
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < this.dim; i++) v[i] /= n;
    this.cache.set(word, v);
    return v;
  }
  embed(text) {
    const words = (text.toLowerCase().match(/\b\w+\b/g) || []);
    if (!words.length) return new Float32Array(this.dim);
    const sum = new Float32Array(this.dim);
    for (const w of words) { const v = this._vec(w); for (let i = 0; i < this.dim; i++) sum[i] += v[i]; }
    let n = 0; for (let i = 0; i < this.dim; i++) n += sum[i] * sum[i];
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < this.dim; i++) sum[i] /= n;
    return sum;
  }
  cosine(a, b) { let d = 0; for (let i = 0; i < this.dim; i++) d += a[i] * b[i]; return d; }
}

class DocParser {
  static async parse(file) {
    const name = file.name.toLowerCase();
    const text = await file.text();
    if (name.endsWith('.json')) { try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; } }
    if (name.endsWith('.html') || name.endsWith('.htm')) {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      doc.querySelectorAll('script,style,nav,footer,header,aside').forEach(el => el.remove());
      return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
    }
    return text;
  }
}

class HybridRAG {
  constructor({ semanticWeight = 0.5, chunkSize = 250 } = {}) {
    this.semanticWeight = semanticWeight;
    this.chunkSize = chunkSize;
    this.embedder = new EmbeddingEngine(128);
    this.chunks = [];
    this.idf = {};
    this.docs = {};
    this.isReady = false;
  }
  _tokenize(t) { return String(t).toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2); }
  _chunk(text) {
    const paras = text.split(/\n\s*\n/).filter(p => p.trim());
    const out = []; let buf = '';
    for (const p of paras) {
      const sents = p.split(/(?<=[.!?])\s+/);
      for (const s of sents) {
        if ((buf + ' ' + s).length > this.chunkSize && buf.length > 50) { out.push(buf.trim()); buf = s; }
        else buf = buf ? buf + ' ' + s : s;
      }
      if (buf.length > this.chunkSize * 2) { out.push(buf.trim()); buf = ''; }
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }
  _bm25(query, doc, k1 = 1.5, b = 0.75) {
    const q = this._tokenize(query);
    const d = this._tokenize(doc);
    const avgdl = this.chunks.reduce((s, c) => s + this._tokenize(c.text).length, 0) / (this.chunks.length || 1);
    const freq = {};
    for (const t of d) freq[t] = (freq[t] || 0) + 1;
    let score = 0;
    for (const t of q) {
      const df = this.chunks.filter(c => this._tokenize(c.text).includes(t)).length;
      const idf = Math.log((this.chunks.length - df + 0.5) / (df + 0.5) + 1);
      const tf = freq[t] || 0;
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (d.length / avgdl))));
    }
    return score;
  }
  _expand(q) {
    const syn = { price: ['cost', 'value'], buy: ['purchase', 'acquire'], fix: ['repair', 'solve'], find: ['search', 'locate'], make: ['create', 'build'], help: ['assist', 'support'], show: ['display', 'view'], best: ['top', 'optimal'] };
    const words = this._tokenize(q);
    const extra = [];
    for (const w of words) if (syn[w]) extra.push(...syn[w]);
    return extra.length ? q + ' ' + extra.join(' ') : q;
  }
  addDocument(source, text) {
    if (!text || text.length < 30) return 0;
    const chunks = this._chunk(text);
    for (const c of chunks) this.chunks.push({ source, text: c, embedding: this.embedder.embed(c) });
    this.docs[source] = text;
    this._rebuildIdf();
    this.isReady = this.chunks.length > 0;
    return chunks.length;
  }
  _rebuildIdf() {
    this.idf = {};
    const N = this.chunks.length || 1;
    for (const chunk of this.chunks) {
      const words = new Set(this._tokenize(chunk.text));
      for (const w of words) this.idf[w] = (this.idf[w] || 0) + 1;
    }
    for (const w in this.idf) this.idf[w] = Math.log(N / (1 + this.idf[w]));
  }
  retrieve(query, k = 5) {
    if (!this.isReady) return [];
    const eq = this._expand(query);
    const qVec = this.embedder.embed(eq);
    const scored = this.chunks.map(c => {
      const sem = this.embedder.cosine(qVec, c.embedding);
      const lex = this._bm25(eq, c.text);
      const lexNorm = 1 - Math.exp(-lex * 0.5);
      const score = this.semanticWeight * sem + (1 - this.semanticWeight) * lexNorm;
      return { ...c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
  listDocs() { return Object.keys(this.docs); }
  clear() { this.chunks = []; this.docs = {}; this.idf = {}; this.isReady = false; }
  stats() { return { docs: Object.keys(this.docs).length, chunks: this.chunks.length, isReady: this.isReady }; }
}

class RAGStore {
  constructor(ns = 'r5_rag') { this.ns = ns; this.db = null; }
  async open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(this.ns, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('docs', { keyPath: 'source' }); };
      req.onsuccess = () => { this.db = req.result; res(this); };
      req.onerror = () => rej(req.error);
    });
  }
  async save(source, text) {
    if (!this.db) return;
    return new Promise(res => {
      const tx = this.db.transaction('docs', 'readwrite');
      tx.objectStore('docs').put({ source, text, ts: Date.now() });
      tx.oncomplete = () => res();
    });
  }
  async loadAll() {
    if (!this.db) return [];
    return new Promise(res => {
      this.db.transaction('docs').objectStore('docs').getAll().onsuccess = e => res(e.target.result || []);
    });
  }
  async clear() {
    if (!this.db) return;
    return new Promise(res => {
      const tx = this.db.transaction('docs', 'readwrite');
      tx.objectStore('docs').clear();
      tx.oncomplete = () => res();
    });
  }
}

const rag = new HybridRAG();
const ragStore = new RAGStore();

async function loadData(data) {
  let total = 0, count = 0;
  for (const [source, doc] of Object.entries(data || {})) {
    const text = typeof doc === 'string' ? doc : (doc.bodyText || doc.body || doc.content || '');
    if (!text || text.length < 30) continue;
    total += rag.addDocument(source, text);
    await ragStore.save(source, text);
    count++;
  }
  return { ok: true, docs: count, chunks: total, stats: rag.stats() };
}
async function loadFile(file) {
  const text = await DocParser.parse(file);
  return await loadData({ [file.name]: text });
}
async function loadFolder(files) {
  const data = {};
  for (const f of files) {
    try { data[f.name] = await DocParser.parse(f); } catch (e) { console.warn('[T5] parse failed:', f.name, e.message); }
  }
  return await loadData(data);
}

/* ═══ 9. LOCAL TOOL REGISTRY ═════════════════════════════════════ */
const tools = {};
function registerTool(name, cfg) {
  if (!name || typeof cfg?.handler !== 'function') {
    console.warn('[T5] registerTool: needs name + handler');
    return;
  }
  tools[name] = {
    description: cfg.description || '',
    parameters: cfg.parameters || {},
    handler: cfg.handler,
  };
  if (global.RAGina && global.RAGina !== global.R5 && typeof global.RAGina.registerTool === 'function') {
    try { global.RAGina.registerTool(name, cfg); } catch {}
  }
}
function unregisterTool(name) { delete tools[name]; }
function listTools() { return Object.keys(tools); }

/* ═══ 10. LLM ════════════════════════════════════════════════════ */
async function callLLM(prompt, {timeout=60000}={}) {
  const ctrl=new AbortController();
  const t=setTimeout(()=>ctrl.abort(),timeout);
  try {
    const r=await fetch(ASK_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prompt,model:'openai'}),signal:ctrl.signal});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const data=await r.json();
    if(data.error)throw new Error(data.error);
    return data.text||data.choices?.[0]?.message?.content||data.response||'';
  } finally { clearTimeout(t); }
}

/* ═══ 11. REACT LOOP ═════════════════════════════════════════════ */
function toolsBlock() {
  const names=Object.keys(tools);
  if (!names.length) return '';
  const lines=names.map(n=>{
    const t=tools[n];
    const params=Object.keys(t.parameters).length
      ? Object.entries(t.parameters).map(([k,v])=>`${k}: ${v}`).join(', ')
      : 'no parameters';
    return `- ${n}(${params}): ${t.description}`;
  }).join('\n');
  return `\nYou have access to these tools:\n${lines}\n\nWhen you need a tool, reply EXACTLY:\nTOOL_CALL: toolName({"param": "value"})\n\nWhen done, reply EXACTLY:\nANSWER: <your final answer>\n\nNever explain outside those two formats.`;
}

function buildAgentPrompt({persona, query, contextText, history, toolLog}) {
  const historyBlock = history && history.length
    ? '\nRecent conversation:\n' + history.map(m => `${m.who||m.role}: ${m.text}`).join('\n') + '\n'
    : '';
  const contextBlock = contextText ? `\nContext:\n${contextText}\n` : '';
  const toolLogBlock = toolLog ? `\nTool results so far:${toolLog}\n` : '';
  return `${persona || 'You are RAGina, an AI agent with tools. Use them when helpful.'}
${toolsBlock()}
${historyBlock}${contextBlock}${toolLogBlock}
User: ${query}`;
}

function parseAgentReply(raw) {
  const text=String(raw).trim();
  const m=text.match(/^TOOL_CALL:\s*([A-Za-z0-9_]+)\((.*)\)\s*$/s);
  if (m) {
    let args={};
    try { args = m[2].trim() ? JSON.parse(m[2]) : {}; } catch {}
    return {type:'tool_call', name:m[1], args};
  }
  const a=text.match(/^ANSWER:\s*([\s\S]*)$/);
  if (a) return {type:'answer', text:a[1].trim()};
  return {type:'answer', text};
}

async function runAgent(userQuery, opts = {}) {
  let { maxSteps = 4, persona, contextText, history, onStep } = opts;

  // Auto-RAG: if no explicit context and index is ready, retrieve
  if (!contextText && rag.isReady) {
    const chunks = rag.retrieve(userQuery, 5);
    if (chunks.length) {
      contextText = chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n');
    }
  }

  let toolLog = '';
  const steps = [];
  for (let step = 1; step <= maxSteps; step++) {
    const prompt = buildAgentPrompt({ persona, query: userQuery, contextText, history, toolLog });
    let raw;
    try { raw = await callLLM(prompt); }
    catch (e) { return { answer: 'LLM error: ' + e.message, steps }; }
    const parsed = parseAgentReply(raw);
    steps.push(parsed);
    if (onStep) onStep(parsed);
    if (parsed.type === 'answer') return { answer: parsed.text, steps };
    const tool = tools[parsed.name];
    if (!tool) { toolLog += `\nTool "${parsed.name}" not found. Available: ${listTools().join(', ')}`; continue; }
    let result;
    try { result = await tool.handler(parsed.args); }
    catch (e) { result = 'Error: ' + e.message; }
    toolLog += `\nResult of ${parsed.name}(${JSON.stringify(parsed.args)}): ${typeof result === 'string' ? result : JSON.stringify(result)}`;
  }
  return { answer: 'Step limit reached — try rephrasing or splitting the task.', steps };
}

/* ═══ 12. UNIFIED QUERY ══════════════════════════════════════════ */
async function query(text, opts={}) {
  if (global.RAGina && global.RAGina !== global.R5 && typeof global.RAGina.query === 'function') {
    return await global.RAGina.query(text, opts);
  }
  return await runAgent(text, opts);
}

/* ═══ 13. MULTI-STEP ORCHESTRATOR ════════════════════════════════ */
function parsePlan(raw) {
  if (!raw || typeof raw !== 'string') return {steps:[]};
  try { const j=JSON.parse(raw); if (j.steps && Array.isArray(j.steps)) return j; } catch {}
  const fence=raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fence) { try { const j=JSON.parse(fence[1]); if (j.steps) return j; } catch {} }
  const m=raw.match(/\{[\s\S]*?"steps"[\s\S]*?\}/);
  if (m) { try { const j=JSON.parse(m[0]); if (j.steps) return j; } catch {} }
  return {steps:[]};
}

async function planGoal(goal, {maxSteps=5}={}) {
  const prompt=`You are a task planner. Decompose this goal into 2-${maxSteps} concrete, sequential, independently-executable steps. Reply ONLY with valid JSON, no markdown:
{"steps": ["first step", "second step", "third step"]}

Goal: "${goal}"`;
  const raw=await callLLM(prompt);
  const plan=parsePlan(raw);
  if (!plan.steps.length) return {steps:[goal], fallback:true, raw:raw.slice(0,200)};
  return {steps: plan.steps.slice(0, maxSteps)};
}

function truncate(s,n=200){s=String(s||'');return s.length>n?s.slice(0,n)+'…':s;}

async function executePlan(steps, {maxSteps=3}={}) {
  trace.start();
  const results=[];
  let accumulated='';
  for (let i=0;i<steps.length;i++) {
    const step=steps[i];
    trace.record({type:'plan_step',index:i,step,phase:'start'});
    const stepQuery = accumulated
      ? `Prior completed steps:\n${accumulated}\n\nCurrent step: ${step}`
      : step;
    try {
      const r = await query(stepQuery, {maxSteps});
      const answer = r?.answer || String(r || '');
      results.push({step, answer, ok:true});
      accumulated += `${i+1}. ${step}\n   → ${truncate(answer, 300)}\n`;
      trace.record({type:'plan_step',index:i,step,answer,phase:'done'});
    } catch(e) {
      results.push({step, error:e?.message||String(e), ok:false});
      accumulated += `${i+1}. ${step}\n   → ERROR: ${e?.message||e}\n`;
      trace.record({type:'plan_step',index:i,step,error:e?.message,phase:'error'});
    }
  }
  const t=trace.end();
  return {results, trace:t};
}

async function synthesize(goal, results) {
  const stepSummary = results.map((r,i)=>`Step ${i+1}: ${r.step}\n${r.ok ? r.answer : 'ERROR: '+r.error}`).join('\n\n');
  const prompt = `Synthesize into one coherent final answer.

Goal: "${goal}"

${stepSummary}

Final answer (concise, markdown allowed):`;
  try { return await callLLM(prompt); }
  catch { return `Completed ${results.filter(r=>r.ok).length}/${results.length} steps. ${results.filter(r=>r.ok).map(r=>r.answer).join(' ')}`; }
}

async function planAndExecute(goal, {maxSteps=5, stepLimit=3}={}) {
  try {
    const plan = await planGoal(goal, {maxSteps});
    if (!plan.steps.length) throw new Error('Could not decompose goal');
    const {results, trace:t} = await executePlan(plan.steps, {maxSteps: stepLimit});
    const answer = await synthesize(goal, results);
    return {ok:true, goal, plan:plan.steps, results, answer, traceSummary: trace.summary(), fallbackUsed: !!plan.fallback};
  } catch(e) {
    return {ok:false, error:'Multi-step failed: '+(e?.message||e), goal};
  }
}

/* ═══ 14. STATE ══════════════════════════════════════════════════ */
const R5 = {
  version:'5.4.0',
  state:{tier:null, signals:null, audio:null, ready:false},
  meta:new Map(),
  S, validate, toSpeakable, trace,
  planAndExecute, planGoal, executePlan, query, runAgent,
  tools, registerTool, unregisterTool, listTools,
  rag, loadData, loadFile, loadFolder,
  retrieve: (q,k) => rag.retrieve(q,k),
  ragStats: () => rag.stats(),
  listDocs: () => rag.listDocs(),
  clearRAG: async () => { rag.clear(); await ragStore.clear(); return {ok:true}; },
  web:{readForms, fillForm, requestSubmit, resolveSubmit, fetchTable},
  guide:{build:buildGuide, download:downloadFile},
  speech:{stripMd, toSpeakable, pickPolicy, summarize},
};

/* ═══ 15. INIT ═══════════════════════════════════════════════════ */
async function init(opts={}) {
  const cap = await detectTier();
  R5.state.tier = cap.tier;
  R5.state.signals = cap;
  const voice = new VoiceProvider({
    server: new ServerTTS({url:opts.ttsUrl||TTS_URL, voiceId:opts.voiceId||'rachel', speed:opts.voiceSpeed||1.0}),
    native: new NativeTTS(),
  });
  const music = new YTPlayer();
  R5.state.audio = new AudioSession({voice, music});

  // Restore persisted RAG index
  if (opts.restoreRAG !== false) {
    try {
      await ragStore.open();
      const stored = await ragStore.loadAll();
      if (stored.length) {
        for (const { source, text } of stored) rag.addDocument(source, text);
        console.log('[T5] Restored RAG index:', rag.stats());
      }
    } catch (e) { console.warn('[T5] RAG restore failed:', e.message); }
  }

  R5.state.ready = true;
  global.dispatchEvent(new CustomEvent('r5:ready',{detail:R5.state}));
  return R5.state;
}

/* ═══ 16. TOOL WRAPPER + REGISTRATION ════════════════════════════ */
function regT5(def) {
  const params = toParameters(def.schema);
  const wrapped = async (args) => {
    const v = validate(def.schema, args||{});
    if (!v.ok) return `Argument validation failed: ${v.error}. Retry with correct arguments.`;
    try { return await def.handler(v.value); }
    catch (e) { return `Tool error: ${e?.message||e}. You may retry.`; }
  };
  registerTool(def.name, {description:def.description, parameters:params, handler:wrapped});
  R5.meta.set(def.name, def);
}

function registerAll() {
  // ─── VOICE (3) ───
  regT5({name:'speak', description:'Read text aloud. Lists and code auto-summarized.',
    schema:S.object({text:S.string({min:1,max:20000})}),
    handler:({text})=>R5.state.audio.speak(text)});
  regT5({name:'stopSpeaking', description:'Stop current speech.',
    schema:S.object({}), handler:()=>{R5.state.audio.stopSpeaking();return {ok:true};}});
  regT5({name:'setMuted', description:'Mute audio. Agent can mute itself but cannot unmute the user.',
    schema:S.object({muted:S.boolean({coerce:true})}),
    handler:({muted})=>R5.state.audio.setMuted(muted, true)});

  // ─── MUSIC (3) ───
  regT5({name:'playSong', description:'Play a song by searching YouTube. Only on explicit user request.',
    schema:S.object({query:S.string({min:1,max:200})}),
    handler:async({query})=>{const r=await R5.state.audio.playSong(query);return {ok:true,title:r.title,id:r.id};}});
  regT5({name:'pauseMusic', description:'Pause current music.',
    schema:S.object({}), handler:()=>R5.state.audio.pauseMusic()});
  regT5({name:'stopMusic', description:'Stop music and reset.',
    schema:S.object({}), handler:()=>R5.state.audio.stopMusic()});

  // ─── WEB FORMS (4) ───
  regT5({name:'readForms', description:'List forms and their fields on the current page.',
    schema:S.object({}), handler:()=>readForms()});
  regT5({name:'fillForm', description:'Fill form fields by label or name.',
    schema:S.object({formId:S.string({min:1}),values:S.object({})}),
    handler:({formId,values})=>fillForm(formId,values)});
  regT5({name:'submitForm', description:'Request to submit a form. Returns pendingConfirmation — user must approve.',
    schema:S.object({formId:S.string({min:1})}),
    handler:({formId})=>requestSubmit(formId)});
  regT5({name:'fetchAPI', description:'GET a JSON API and return rows as a table.',
    schema:S.object({url:S.string({min:1}),headers:S.optional(S.object({}))}),
    handler:({url,headers})=>fetchTable(url,{headers})});

  // ─── META (2) ───
  regT5({name:'describeCapabilities', description:'Report what tools are available and the current device tier.',
    schema:S.object({category:S.optional(S.string())}),
    handler:({category})=>{
      const caps=[...R5.meta.values()].map(d=>({id:d.name, description:d.description}));
      return {ok:true, tier:R5.state.tier, count:caps.length, capabilities:category?caps.filter(c=>c.id.includes(category)):caps};
    }});
  regT5({name:'generateGuide', description:'Generate a downloadable Markdown/HTML guide.',
    schema:S.object({title:S.string({min:1,max:120}),markdown:S.string({min:1,max:20000})}),
    handler:({title,markdown})=>{const g=buildGuide({title,markdown});return {ok:true,title,urlMD:g.urlMD,urlHTML:g.urlHTML};}});

  // ─── ORCHESTRATION (1) ───
  regT5({
    name:'planAndExecute', description:'Decompose a complex goal into sequential sub-steps, execute each with the full agent, then synthesize. Use ONLY for genuinely multi-step tasks (2+ distinct actions). For simple queries, use tools directly.',
    schema:S.object({
      goal:S.string({min:5,max:500}),
      maxSteps:S.optional(S.number({coerce:true,min:2,max:8,default:5})),
    }),
    handler:async({goal,maxSteps})=>await planAndExecute(goal,{maxSteps:maxSteps||5}),
  });

  // ─── BONUS STANDALONE (3) ───
  regT5({
    name:'webSearch', description:'Search Wikipedia/DuckDuckGo for facts, people, or topics.',
    schema:S.object({query:S.string({min:1,max:200})}),
    handler:async({query})=>{
      try {
        const wikiUrl='https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=3&search='+encodeURIComponent(query);
        const res=await fetch(wikiUrl);
        const data=await res.json();
        const titles=data[1]||[]; const descriptions=data[2]||[]; const urls=data[3]||[];
        if (!titles.length) {
          const ddg=await fetch('https://api.duckduckgo.com/?q='+encodeURIComponent(query)+'&format=json&no_html=1&skip_disambig=1');
          const ddgData=await ddg.json();
          if (ddgData.Abstract) return {source:'DuckDuckGo', title:ddgData.Heading||query, summary:ddgData.Abstract, url:ddgData.AbstractURL};
          return {error:'No results for "'+query+'"'};
        }
        return {source:'Wikipedia', results:titles.map((t,i)=>({title:t, summary:descriptions[i]||'', url:urls[i]}))};
      } catch(e) { return {error:e.message}; }
    }
  });
  regT5({
    name:'calculate', description:'Evaluate a math expression like "2 + 2 * 3".',
    schema:S.object({expression:S.string({min:1,max:500})}),
    handler:async({expression})=>{
      try {
        const safe=expression.replace(/[^0-9+\-*/().%\s]/g,'');
        const result=new Function('return '+safe)();
        return {expression, result};
      } catch(e) { return {error:'Invalid: '+e.message}; }
    }
  });
  regT5({
    name:'getTime', description:'Get current local date and time.',
    schema:S.object({}),
    handler:async()=>({time:new Date().toLocaleTimeString(), date:new Date().toLocaleDateString(), iso:new Date().toISOString()}),
  });

  // ─── RAG (5) ───
  regT5({
    name:'indexUrl', description:'Fetch a URL and add its content to the knowledge base. Use when the user shares a link or asks about a web page.',
    schema:S.object({url:S.string({min:1}), sourceName:S.optional(S.string())}),
    handler:async({url, sourceName})=>{
      try {
        const proxy='https://api.allorigins.win/raw?url='+encodeURIComponent(url);
        const r=await fetch(proxy);
        if(!r.ok)throw new Error('HTTP '+r.status);
        const html=await r.text();
        const doc=new DOMParser().parseFromString(html,'text/html');
        doc.querySelectorAll('script,style,nav,footer,header,aside').forEach(el=>el.remove());
        const text=(doc.body?.textContent||'').replace(/\s+/g,' ').trim();
        if(text.length<30)return {error:'no content extracted'};
        const source=sourceName||url;
        const chunks=rag.addDocument(source,text);
        await ragStore.save(source,text);
        return {ok:true,source,chunks,stats:rag.stats()};
      } catch(e) { return {error:e.message}; }
    },
  });
  regT5({
    name:'indexText', description:'Add raw text (notes, pasted content, snippets) to the knowledge base.',
    schema:S.object({text:S.string({min:30}), sourceName:S.string({min:1})}),
    handler:async({text, sourceName})=>{
      const chunks=rag.addDocument(sourceName,text);
      await ragStore.save(sourceName,text);
      return {ok:true,source:sourceName,chunks,stats:rag.stats()};
    },
  });
  regT5({
    name:'searchKnowledge', description:'Search the knowledge base for relevant chunks. Use before answering questions that might be covered by indexed documents.',
    schema:S.object({query:S.string({min:1}), topK:S.optional(S.number({coerce:true,min:1,max:20,default:5}))}),
    handler:({query, topK})=>{
      const chunks=rag.retrieve(query, topK||5);
      return {ok:true,count:chunks.length,chunks:chunks.map(c=>({source:c.source,text:c.text.slice(0,300),score:Number(c.score.toFixed(3))}))};
    },
  });
  regT5({
    name:'listKnowledge', description:'List all documents currently indexed in the knowledge base.',
    schema:S.object({}),
    handler:()=>({ok:true,docs:rag.listDocs(),stats:rag.stats()}),
  });
  regT5({
    name:'clearKnowledge', description:'Clear the entire knowledge base (docs and index).',
    schema:S.object({}),
    handler:async()=>{rag.clear();await ragStore.clear();return {ok:true};},
  });

  console.log('[T5] Registered '+R5.meta.size+' T5 tools. Local registry total: '+listTools().length);
  return [...R5.meta.keys()];
}

/* ═══ 17. DEBUG + EXPOSE ═════════════════════════════════════════ */
R5.getInfo = () => ({
  version: R5.version,
  tier: R5.state.tier,
  localTools: Object.keys(tools),
  t4Present: !!(global.RAGina && global.RAGina !== global.R5),
  audioReady: !!R5.state.audio,
  muted: R5.state.audio?.isMuted() ?? null,
  rag: rag.stats(),
});

R5.init = init;
R5.registerAll = registerAll;
R5.resolveSubmit = resolveSubmit;
global.R5 = R5;

console.log('🧠 RAGina-T5 v5.4.0 loaded (standalone + RAG). Call R5.init() then R5.registerAll()');
})(window);