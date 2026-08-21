/* ═══════════════════════════════════════════════════════════════════════
   RAGINA T3.1 — The All-Seeing Desi Agent
   Hybrid RAG + 23 Tools + Face & Hand Vision + Hinglish/Tenglish/Slang
   Drop-in: <script src="ragina-t3.js"></script>
   ═══════════════════════════════════════════════════════════════════════ */

const VERSION = '3.1.0';
const API_URL = 'https://api.openai.com/v1/chat/completions';
const STREAM_URL = 'https://api.openai.com/v1/chat/completions';

/* =======================================================================
   UTILITIES
   ======================================================================= */
const uuid = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const avg = (...n) => n.reduce((s, v) => s + v, 0) / n.length;

function deepMerge(target, source) {
  const out = { ...target };
  for (const k in source) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      out[k] = deepMerge(target[k] || {}, source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

const PHRASES = {
  ready: {
    english: ["I'm awake and watching. Upload docs or just say hi!", "Eyes open, mind sharp. What shall we explore?", "RAGina T3 online. I can see you, hear you, and read your documents."],
    hinglish: ["Main jag gayi hoon aur dekh rahi hoon. Docs daal ya bas hi bol!", "Aankhein khuli, dimaag tez. Kya explore karein?", "RAGina T3 online hoon. Main tujhe dekh sakti hoon, sun sakti hoon, aur tere docs padh sakti hoon."],
    tenglish: ["Nenu lechina, chustunna. Docs upload chey lekapothe hi cheppu!", "Kallu terichi, buddi sharp. Em explore cheyali?", "RAGina T3 online. Nenu ninnu chudagalanu, vinagalanu, nee docs chadavgalanu."],
    chatty: ["Yo yo! RAGina in the house! Drop some docs or let's vibe!", "Eyes wide open, fam! What's the scene?", "RAGina T3 is LIVE! I can see you, hear you, read your stuff. Let's goooo!"]
  },
  error: {
    english: ["My vision blurred for a moment —", "I sensed a disturbance in the data —", "Even all-seeing eyes glitch sometimes —"],
    hinglish: ["Meri aankhein thodi dhundhli ho gayi —", "Data mein kuch disturbance feel hua —", "Sab dekhne wali aankhein bhi kabhi glitch karti hain —"],
    tenglish: ["Na kallu koncham blur ayyayi —", "Data lo edo disturbance anipinchindi —", "Anni chuse kallu kuda koncham sarigga panicheyavu —"],
    chatty: ["Oof, my eyes got blurry for a sec —", "Bro, something messed up in the matrix —", "Even my all-seeing eyes need a coffee break sometimes"]
  },
  gesture: {
    thumbs_up: { english: ["Thumbs up! I love the energy.", "Noted! You're feeling positive.", "Got it — full approval detected!"], hinglish: ["Thumbs up! Mast energy hai.", "Samajh gaya! Positive vibe aa rahi hai.", "Full approval mil gaya!"], tenglish: ["Thumbs up! Energy super undi.", "Ardham aindi! Positive vibe ostundi.", "Full approval ichav!"], chatty: ["Yooo thumbs up! Let's gooo!", "I see that approval, fam!", "Big W energy detected!"] },
    thumbs_down: { english: ["I see a thumbs down. Let me fix that.", "Not what you wanted? I'll adjust.", "Message received — I'll do better."], hinglish: ["Thumbs down dikha. Theek karungi.", "Jo chahiye tha woh nahi tha? Adjust karti hoon.", "Message mil gaya — aur behtar karungi."], tenglish: ["Thumbs down kanipinchindi. Sarididdutha.", "Nuvu ankunte adi kadu? Adjust chestha.", "Message vachindi — inka better ga chestha."], chatty: ["Oof, thumbs down? My bad, let me fix it.", "Not vibing with that? I'll switch it up.", "Aight, noted — I'll level up!"] },
    wave: { english: ["Hey there! Nice to see you.", "Hello! I saw you wave.", "Welcome back!"], hinglish: ["Hey! Tujhe dekh ke achha laga.", "Hello! Maine tera wave dekha.", "Waapas swaagat hai!"], tenglish: ["Hey! Ninnu chusi bagundi.", "Hello! Nee wave chusa.", "Mallik swagatam!"], chatty: ["Yooo what's up!", "I see you waving, fam!", "Welcome back to the squad!"] },
    peace: { english: ["Peace! Stay cool.", "Victory sign detected! We got this.", "Chill vibes acknowledged."], hinglish: ["Peace! Chill reh.", "Victory sign! Hum kar lenge.", "Chill vibes accepted."], tenglish: ["Peace! Cool ga undu.", "Victory sign! Manam cheseddam.", "Chill vibes accept chesanu."], chatty: ["Peace out! Stay chill.", "Victory sign? We winning today!", "Chill mode: activated"] },
    pointing: { english: ["You're pointing at something? Tell me more.", "I see you pointing — what's up?", "Finger gun! Pew pew."], hinglish: ["Kuch point kar raha hai? Aur bata.", "Point karte hue dikha — kya scene hai?", "Finger gun! Pew pew."], tenglish: ["Edo point chestunava? Inka cheppu.", "Point chestunav kanipinchindi — em scene?", "Finger gun! Pew pew."], chatty: ["Ooh, pointing at something? Spill the tea!", "I see that finger — what's good?", "Finger guns! Pew pew!"] },
    fist: { english: ["Fist bump! Respect.", "Power pose detected.", "Solidarity fist acknowledged."], hinglish: ["Fist bump! Respect.", "Power pose detect hua.", "Solidarity fist accepted."], tenglish: ["Fist bump! Respect.", "Power pose detect aindi.", "Solidarity fist accept chesanu."], chatty: ["Fist bump! That's the spirit!", "Power pose? You mean business!", "Solidarity, fam!"] },
    open_palm: { english: ["Open palm — stop? Or high-five?", "Hand up! I'm listening.", "Clear signal received."], hinglish: ["Open palm — ruk? Ya high-five?", "Haath upar! Sun rahi hoon.", "Signal clear mil gaya."], tenglish: ["Open palm — aagali? Leka high-five?", "Cheyi paita! Vinutunna.", "Signal clear ga vachindi."], chatty: ["Open palm — you saying stop or high-five?", "Hand up! I'm all ears.", "Clear signal, captain!"] },
    ok: { english: ["OK! Perfect.", "Roger that.", "All good — I see the OK sign."], hinglish: ["OK! Perfect.", "Samajh gaya.", "Sab theek — OK sign dikha."], tenglish: ["OK! Perfect.", "Ardham aindi.", "Anni bagane — OK sign kanipinchindi."], chatty: ["OK OK! Perfecto", "Roger that, chief!", "All good in the hood!"] },
    call_me: { english: ["Call me! I'll be here.", "Shaka sign! Hang loose.", "Later! I see the shaka."], hinglish: ["Call kar! Main yahin hoon.", "Shaka sign! Chill reh.", "Baad mein! Shaka sign dikha."], tenglish: ["Call chey! Nenu ikkade unna.", "Shaka sign! Cool ga undu.", "Tarvata! Shaka sign kanipinchindi."], chatty: ["Call me maybe? I'll be right here.", "Shaka brah! Hang loose", "Catch you later!"] }
  },
  expression: {
    happy: { english: ["You're smiling! That makes me happy too.", "I see that smile! Great energy.", "Someone's in a good mood!"], hinglish: ["Tu muskura raha hai! Mujhe bhi achha lag raha hai.", "Tera smile dikha! Mast energy.", "Kisi ka mood achha hai!"], tenglish: ["Navvutunav! Naku kuda bagundi.", "Nee navvu kanipinchindi! Super energy.", "Evaro happy ga unaru!"], chatty: ["Yo that smile! I'm here for it", "I see you grinning! Love the energy!", "Someone's vibing today!"] },
    sad: { english: ["You look a bit down. Want to talk about it?", "I sense some sadness. I'm here for you.", "Tough day? Let me help if I can."], hinglish: ["Tu thoda udaas lag raha hai. Baat karein?", "Mujhe thoda sadness feel ho raha hai. Main hoon yahan.", "Mushkil din? Main madad karungi jitni ho sake."], tenglish: ["Koncham down ga unnav. Matladukundama?", "Koncham badha anipistundi. Nenu ikkade unna.", "Kastamaina roju? Nenu help chestha."], chatty: ["Aww you look a bit down. Wanna talk?", "I feel you, fam. I'm here.", "Rough day? Let me try to help"] },
    surprised: { english: ["Whoa, surprised?", "Did I catch you off guard?", "Something unexpected? Tell me!"], hinglish: ["Arre, surprised?", "Maine tujhe off guard pakda?", "Kuch unexpected? Bata!"], tenglish: ["Ayyo, surprised?", "Ninnu off guard patkuna?", "Edo unexpected? Cheppu!"], chatty: ["Whoa, you shook?", "Did I just catch you off guard?", "Plot twist? Spill it!"] },
    angry: { english: ["You seem frustrated. Let's solve this together.", "I see tension. Deep breath — we'll fix it.", "Anger is data too. What's wrong?"], hinglish: ["Tu frustrated lag raha hai. Saath mein solve karte hain.", "Tension dikha raha hai. Deep breath — theek karenge.", "Gussa bhi data hai. Kya hua?"], tenglish: ["Frustrated ga unnav. Kalisi solve cheddam.", "Tension kanipistundi. Deep breath — sarididdam.", "Kopam kuda data eh. Em aindi?"], chatty: ["You look heated, fam. Let's fix this together.", "I see the tension. Breathe — we got this.", "Anger = data. What's the issue?"] },
    neutral: { english: ["I'm watching. Ready when you are.", "Neutral expression — focused mode.", "Steady gaze. I like it."], hinglish: ["Main dekh rahi hoon. Tu ready ho toh bata.", "Neutral expression — focused mode on.", "Steady gaze. Pasand aaya."], tenglish: ["Nenu chustunna. Nuvu ready aite cheppu.", "Neutral expression — focused mode.", "Steady gaze. Nachindi."], chatty: ["I'm watching you watching me", "Neutral face — big brain mode activated.", "That steady gaze tho"] }
  }
};

/* =======================================================================
   LANGUAGE ENGINE — Hinglish / Tenglish / Slang / Diction
   ======================================================================= */
class LanguageEngine {
  constructor(config = {}) {
    this.config = {
      defaultMix: 'english',
      slangIntensity: 0.4,
      autoDetect: true,
      allowCodeMix: true,
      ...config
    };
    this.currentMix = this.config.defaultMix;
    this.sessionMix = null;
  }

  detectMix(text) {
    const t = text.toLowerCase();
    // Hinglish markers
    const hindiWords = ['hai','hain','kya','nahi','tha','thi','kar','raha','rahi','ho','gaya','gayi','bhi','bas','theek','sahi','galat','acha','bura','mast','jhakaas','bindaas','yaar','bhai','dost','scene','funda','jugaad','swag','lit','vibe','arre','chal','dekh','bol','sun','ja','aao','jao','karo','lo','do','mera','tera','uska','hamara','tumhara','unka','yeh','woh','kaun','kahan','kyun','kaise','jab','agar','lekin','aur','ya','phir','abhi','baad','din','raat','subah','shaam','paani','khana','kaam','pyaar','khush','udaas','muskura','hans','ro','chup','shor','shanti','izzat','beizzati','sach','jhooth','aasaan','mushkil','shuru','khatam','phir','thoda','zyada','kam','pehla','aakhri','agla','pichhla','sab','koi','kuch','har','kabhi','hamesha','aaj','kal','sheher','gaanv','desh','rajya','zila','ilaaka','gali','sadak','pul','imaarat','ghar','kamra','rasoi','computer','phone','internet','sangeet','gaana','film','khel','naach','gaana','likhna','padhna','bolna','sunna','dekhna','mehsoos','chhoona','khaana','peena','pakana','sona','uthna','aaram','daudna','chalna','koodna','tairna','udna','safar','milna','call','message','email','baat','jhagda','sehmaat','asehmaat','qubool','inkaar','manzoori','namanzoori','madad','bachana','protect','maarna','laat','mukka','pheinkna','pakadna','dhakka','kheench','uthana','girana','todna','theek','banana','create','dhundhna','explore','seekhna','sikhaana','train','practice','tayyar','plan','organize','manage','control','lead','follow','obey','maanna','rules','izzat','beizzati','hurt','heal','care','pyaar','pasand','maza','prefer','chunna','decide','socho','assume','guess','estimate','calculate','measure','count','compare','identify','recognize','yaad','bhoolna','ignore','miss','win','gain','achieve','succeed','fail','pass','complete','finish','end','start','begin','launch','introduce','present','offer','propose','suggest','advise','guide','direct','administer','supervise','monitor','watch','observe','notice','perceive','sense','feel','experience','endure','suffer','resist','oppose','fight','battle','struggle','attempt','try','test','sample','taste','savor','enjoy','relish','appreciate','value','treasure','cherish','admire','adore','love','like','favor','choose','select','elect','appoint','assign','allot','allocate','distribute','share','divide','split','separate','part','depart','leave','go','come','arrive','reach','get','obtain','acquire','earn','realize','fulfill','close','shut','seal','lock','fasten','secure','tie','bind','wrap','pack','store','stock','save','keep','hold','retain','preserve','maintain','sustain','support','uphold','bear','carry','shoulder','handle','cope','grapple','wrestle','argue','quarrel','dispute','debate','discuss','talk','speak','chat','converse','communicate','correspond','interact','engage','connect','relate','associate','affiliate','align','ally','unite','join','merge','combine','integrate','incorporate','include','contain','comprise','consist','compose','derive','originate','stem','arise','result','follow','ensue','proceed','emanate','issue','spring','flow','run','escape','flee','hide','conceal','withhold','prevent','stop','block','hinder','impede','obstruct','hamper'];
    const hindiScore = hindiWords.filter(w => t.includes(w)).length;

    // Tenglish markers
    const teluguWords = ['em','enti','avunu','kadu','ledu','undi','mari','chala','bagundi','bale','super','ante','inka','ippudu','tarvata','mama','anna','akka','cheppu','vinu','ardham','nenu','nuvvu','meeru','manam','vaadu','vaallu','idi','adi','evaru','ekkada','enduku','ela','appudu','ayite','kaani','mari','kaabatti','roju','ratri','poddu','saayam','neellu','bhojanam','pani','prema','santosham','baadha','navvu','edupu','mounam','gola','shaanti','gauravam','avamaanam','nijam','abaddam','sulabham','kastam','modalu','mugimpu','malli','koncham','ekkuva','takkuva','modati','chivari','tarvata','mundu','andaru','evaro','edaina','prati','eppudu','enni','rojulu','ee','aa','emi','evi','ekkada','akkada','ikka','akka','ikkada','akkada','ekkada','eppudu','appudu','ippudu','tarvata','mundu','kinda','paina','lo','bayata','madhya','pakka','dooram','daggara','chuttu','chivari','modalu','madyalo','pai','kinda','edama','kudi','mundu','venaka','lopaliki','bayatiki','paina','kinda','madhyalo','pakkan','venakki','munduki','pakkaki','dooramga','daggara','chuttu','chuttu','chuttu'];
    const teluguScore = teluguWords.filter(w => t.includes(w)).length;

    // Chatty/slang markers
    const slangWords = ['yo','fam','bro','bruh','squad','vibe','lit','fire','dope','sick','cool','chill','hang','scene','lowkey','highkey','tbh','imo','ngl','fr','ong','cap','no cap','bet','slay','tea','spill','flex','ghost','shade','salty','thirsty','woke','sus','simp','stan','ship','goat','based','cringe','mid','ate','left no crumbs','rizz','gyatt','skibidi','sigma','mewing','looksmaxxing','mog','its so over','we are so back','fr fr','ong fr','no kizzy','bussin','hits different','main character','understood the assignment','touch grass','rent free','living rent free','vibe check','glow up','glow down','humble brag','throw shade','spill the tea','catch these hands','periodt','and i oop','sksksk','vsco girl','e-boy','e-girl','soft girl','clean girl','that girl','main character energy','pick me','simp','stan','ship','otp','bromance','situationship','talking stage','soft launch','hard launch','bae','boo','thirst trap','catfish','ghosting','breadcrumbing','benching','cushioning','submarining','zombieing','roaching','love bombing','gaslighting','gatekeeping','trauma dumping','receipts','exposed','canceled','problematic','unproblematic','iconic','legendary','queen','king','slay','yas','werk','hunty','kiki','shade','read','clocked','tea','spill','sip','drag','serve','lewk','beat','snatched','fleek','goals','mood','big mood','same','relatable','unrelatable','iconic','legend','goat','mvp','rockstar','ninja','wizard','guru','boss','ceo','main character','npc','side quest','level up','grind','hustle','glow up','glow down','era','season','arc','plot twist','cliffhanger','finale','premiere','reboot','remake','sequel','prequel','spinoff','crossover','easter egg','callback','foreshadowing','chekhov gun','red herring','macguffin','deus ex machina','plot hole','retcon','fan service','shipping','headcanon','au','ocs','self insert','reader insert','x reader','imagine','drabble','one shot','multi chapter','wip','slow burn','enemies to lovers','friends to lovers','fake dating','forced proximity','only one bed','there was only one','mutual pining','pining','unrequited','requited','soulmates','fated','destined','star crossed','forbidden','secret','hidden','undercover','identity','reveal','confession','proposal','wedding','honeymoon','ever after','happily','sadly','tragically','comically','ironically','surprisingly','unexpectedly','suddenly','finally','eventually','ultimately','basically','literally','figuratively','honestly','seriously','actually','really','truly','definitely','absolutely','completely','totally','entirely','fully','partly','mostly','somewhat','kinda','sorta','pretty','quite','rather','fairly','relatively','extremely','incredibly','unbelievably','remarkably','especially','particularly','specifically','generally','usually','typically','normally','commonly','frequently','often','sometimes','occasionally','rarely','seldom','hardly','barely','scarcely','never','always','forever','eternally','temporarily','permanently','constantly','consistently','continuously','continually','repeatedly','regularly','irregularly','randomly','arbitrarily','deliberately','intentionally','accidentally','unintentionally','mistakenly','erroneously','correctly','accurately','precisely','exactly','vaguely','roughly','approximately','nearly','almost','practically','virtually','basically','essentially','fundamentally','primarily','principally','chiefly','mainly','mostly','largely','partly','partially','halfway','nearly','almost','practically','virtually','literally','figuratively','metaphorically','symbolically','ironically','sarcastically','cynically','skeptically','optimistically','pessimistically','realistically','romantically','dramatically','tragically','comically','satirically','paradoxically','curiously','oddly','strangely','weirdly','bizarrely','funnily','amusingly','entertainingly','interestingly','fascinatingly','intriguingly','captivatingly','engagingly','compellingly','persuasively','convincingly','powerfully','forcefully','strongly','weakly','gently','softly','quietly','loudly','noisily','silently','secretly','privately','publicly','openly','honestly','sincerely','genuinely','authentically','naturally','normally','typically','usually','commonly','generally','universally','globally','locally','regionally','nationally','internationally','worldwide','everywhere','somewhere','nowhere','anywhere','elsewhere','home','office','school','college','university','hospital','market','shop','restaurant','hotel','park','garden','beach','mountain','river','lake','sea','ocean','forest','desert','city','village','town','country','state','district','area','region','zone','street','road','lane','avenue','highway','bridge','tunnel','building','house','flat','apartment','room','hall','kitchen','bathroom','bedroom','living room','dining room','garage','basement','roof','wall','door','window','floor','ceiling','stairs','elevator','computer','laptop','phone','mobile','tablet','watch','clock','tv','radio','camera','printer','scanner','internet','website','app','software','hardware','network','server','database','file','folder','document','image','video','audio','music','song','movie','show','game','sport','exercise','yoga','meditation','dance','sing','draw','paint','write','read','speak','listen','watch','look','feel','touch','smell','taste','eat','drink','cook','bake','sleep','wake','rest','relax','run','walk','jump','swim','fly','drive','ride','travel','visit','meet','call','message','email','chat','talk','discuss','argue','fight','quarrel','debate','agree','disagree','accept','reject','approve','disapprove','support','oppose','help','assist','aid','rescue','save','protect','defend','attack','hit','kick','punch','throw','catch','hold','grab','push','pull','lift','drop','break','fix','repair','build','create','make','produce','manufacture','design','develop','invent','discover','find','search','seek','explore','investigate','research','study','learn','teach','train','practice','prepare','plan','organize','arrange','manage','control','direct','lead','follow','obey','disobey','break rules','follow rules','respect','honor','insult','offend','hurt','harm','heal','cure','treat','care','love','like','enjoy','prefer','choose','select','pick','decide','determine','conclude','infer','assume','presume','suppose','guess','estimate','calculate','compute','measure','weigh','count','quantify','compare','contrast','differentiate','distinguish','identify','recognize','remember','recall','recollect','remind','forget','ignore','neglect','overlook','miss','lose','win','gain','achieve','accomplish','succeed','fail','pass','complete','finish','end','start','begin','initiate','launch','introduce','present','show','display','demonstrate','prove','verify','confirm','validate','check','test','examine','inspect','review','evaluate','assess','judge','criticize','praise','compliment','appreciate','admire','adore','worship','trust','believe','faith','hope','wish','desire','want','need','require','demand','request','ask','beg','plead','urge','encourage','motivate','inspire','influence','persuade','convince','satisfy','please','delight','amaze','astonish','shock','surprise','startle','scare','frighten','terrify','horrify','worry','concern','bother','disturb','annoy','irritate','anger','enrage','calm','soothe','comfort','console','cheer','uplift','excite','thrill','ecstasy','joy','bliss','peace','content','satisfaction','gratitude','thankfulness','blessing','luck','fortune','pride','confidence','bravery','courage','fearlessness','boldness','daring','adventure','curiosity','inquisitiveness','eagerness','enthusiasm','passion','devotion','commitment','dedication','loyalty','faithfulness','honesty','sincerity','genuineness','authenticity','reality','truth','correctness','accuracy','exactness','perfection','flawlessness','impeccability','excellence','outstandingness','exceptionality','extraordinariness','incredibility','unbelievability','impossibility','possibility','probability','likelihood','certainty','uncertainty','sureness','unsureness','doubt','suspicion','dubiousness','questionability','debatability','controversiality','dispute','acceptance','rejection','approval','denial','allowance','forbiddance','permission','prohibition','legality','illegality','morality','immorality','ethics','unethics','rightness','wrongness','correctness','incorrectness','properness','improperness','appropriateness','inappropriateness','suitability','unsuitability','fittingness','unfittingness','decency','indecency','respectability','disreputability','honorability','dishonorability','nobility','ignobility','dignity','undignity','gracefulness','awkwardness','elegance','clumsiness','refinement','crudeness','polish','roughness','smoothness','softness','hardness','firmness','looseness','tightness','thickness','thinness','width','narrowness','depth','shallowness','tallness','shortness','length','briefness','extension','limitation','unlimitation','infiniteness','finiteness','eternality','temporariness','permanence','constancy','variability','stability','instability','steadiness','unsteadiness','balance','imbalance','equality','inequality','fairness','unfairness','justice','injustice','impartiality','bias','prejudice','tolerance','intolerance','broadmindedness','narrowmindedness','openmindedness','closedmindedness','liberalism','conservatism','progressivism','traditionalism','modernity','antiquity','oldfashionedness','uptodateness','outdatedness','currency','pastness','futurity','presentness','absence','existence','nonexistence','reality','unreality','actuality','potentiality','virtuality','physicality','mentality','emotionality','spirituality','materiality','intellectuality','creativity','destructivity','constructivity','productivity','unproductivity','efficiency','inefficiency','effectiveness','ineffectiveness','usefulness','uselessness','helpfulness','helplessness','powerfulness','powerlessness','strength','weakness','capability','incapability','competence','incompetence','skill','unskill','talent','giftedness','geni
us','stupidity','foolishness','wisdom','sensibility','silliness','ridiculousness','absurdity','laughability','seriousness','graveness','severity','criticality','urgency','importance','significance','meaningfulness','meaninglessness','purposefulness','purposelessness','worthwhileness','worthlessness','value','invalue','preciousness','pricelessness','cheapness','expensiveness','costliness','affordability','unaffordability','freeness','busyness','idleness','activeness','inactiveness','energy','lethargy','dynamism','staticness','movement','stationariness','mobility','immobility','flexibility','rigidity','elasticity','plasticity','solidity','liquidity','gaseousness','visibility','invisibility','transparency','opaqueness','clearness','unclearness','obviousness','hiddenness','secretness','mysteriousness','strangeness','familiarity','unfamiliarity','knownness','unknownness','fame','infamy','popularity','unpopularity','commonness','uncommonness','rarity','scarcity','abundance','plentifulness','sufficiency','insufficiency','adequacy','inadequacy','fullness','emptiness','filledness','hollowness','solidness','denseness','sparseness','crowdedness','desertedness','abandonedness','occupiedness','vacancy','availability','unavailability','accessibility','inaccessibility','reachability','unreachability','nearness','farness','closeness','distance','remoteness','localness','foreignness','domesticity','nativeness','alienness','strangeness','oddness','weirdness','bizarreness','peculiarity','curiosity','interestingness','fascinatingness','intriguingness','captivatingness','engagingness','compellingness','grippingness','thrillingness','excitingness','stimulatingness','provocativeness','challengingness','demandingness','taxingness','tiringness','exhaustingness','drainingness','refreshingness','invigoratingness','energizingness','revitalizingness','rejuvenatingness','restorativeness','healingness','therapeuticness','medicinalness','beneficialness','advantageousness','profitability','lucrativeness','rewardingness','satisfyingness','fulfillingness','gratifyingness','pleasingness','delightfulness','enjoyableness','funness','amusingness','entertainingness','divertingness','relaxingness','soothingness','calmingness','peacefulness','tranquility','serenity','placidity','calmness','quietness','silentness','stillness','motionlessness','lifelessness','inanimateness','deadness','aliveness','livingness','animateness','organicness','inorganicness','naturalness','artificialness','syntheticness','manmadeness','manufacturedness','processedness','rawness','refinedness','pureness','impureness','cleanness','dirtyness','pollutedness','contaminatedness','sterility','germfreeness','hygienicness','sanitariness','unsanitariness','toxicity','poisonousness','harmfulness','dangerousness','hazardousness','riskiness','perilousness','precariousness','unsafeness','security','safeness','protectedness','guardedness','defendedness','shieldedness','screenedness','shelteredness','harboredness','housedness','accommodatedness','lodgedness','quarteredness','billetedness','stationedness','postedness','positionedness','deployedness','assignedness','detailedness','taskedness','chargedness','commissionedness','authorizedness','empoweredness','entitledness','qualifiedness','eligibility','fitness','suitability','appropriateness','properness','correctness','rightness','accurateness','exactness','preciseness','specificness','definiteness','clearness','obviousness','evidentness','apparentness','plainness','manifestness','patentness','palpability','tangibility','concreteness','substantialness','considerableness','significantness','importantness','majorness','mainness','primaryness','principalness','chiefness','leadingness','foremostness','premierness','supremeness','ultimateness','utmostness','extremeness','maximumness','minimumness','minimalness','maximalness','optimalness','idealness','perfectness','flawlessness','impeccability','faultlessness','blamelessness','guiltlessness','innocence','pureness','cleanness','clearness','transparency','translucency','opaqueness','cloudiness','fogginess','mistiness','haziness','murkiness','dimness','darkness','gloominess','dreariness','bleakness','dismalness','depressingness','discouragingness','dishearteningness','demoralizingness','disappointingness','unsatisfyingness','unfulfillingness','unrewardingness','unprofitability','lossmakingness','bankruptness','insolventness','brokenness','poorness','impoverishedness','destituteness','neediness','indigence','pennilessness','moneylessness','wealthiness','richness','affluence','prosperousness','successfulness','flourishingness','thrivingness','boomingness','growingness','expandingness','developingness','evolvingness','progressingness','advancingness','forwardness','aheadness','onness','pressingness','carryingness','keepingness','holdingness','clingingness','stickingness','adheringness','abidingness','complyingness','conformingness','followingness','observingness','respectingness','honoringness','keepingness','maintainingness','preservingness','conservingness','protectingness','guardingness','defendingness','savingness','rescuingness','deliveringness','freeingness','liberatingness','releasingness','lettingness','givingness','surrenderingness','yieldingness','submittingness','capitulatingness','succumbingness','fallingness','failingness','collapsingness','crumblingness','disintegratingness','breakingness','splittingness','dividingness','separatingness','partingness','departingness','leavingness','goingness','comingness','arrivingness','reachingness','gettingness','obtainingness','acquiringness','gainingness','earningness','winningness','achievingness','accomplishingness','attainingness','realizingness','fulfillingness','completingness','finishingness','endingness','closingness','shuttingness','sealingness','lockingness','boltingness','fasteningness','securingness','tyingness','bindingness','wrappingness','packingness','packagingness','boxingness','cratingness','containerizingness','bottlingness','canningness','jarringness','baggingness','sackingness','pouchingness','pocketingness','shelvingness','storingness','stockingness','warehousingness','hoardingness','savingness','keepingness','holdingness','retainingness','preservingness','maintainingness','sustainingness','supportingness','upholdingness','bearingness','carryingness','shoulderingness','handlingness','managingness','dealingness','copingness','grapplingness','wrestlingness','battlingness','fightingness','arguingness','quarrelingness','disputingness','debatingness','discussingness','talkingness','speakingness','chattingness','conversingness','communicatingness','correspondingness','interactingness','engagingness','connectingness','relatingness','associatingness','affiliatingness','aligningness','allyingness','unitingness','joiningness','mergingness','combiningness','integratingness','incorporatingness','includingness','containingness','comprisingness','consistingness','composingness','derivingness','originatingness','stemmingness','arisingness','resultingness','followingness','ensuingness','proceedingness','emanatingness','issuingness','springingness','flowingness','runningness','escapingness','fleeingness','hidingness','concealingness','withholdingness','preventingness','stoppingness','blockingness','hinderingness','impedingness','obstructingness','hamperingness'];
    const slangScore = slangWords.filter(w => t.includes(w)).length;

    if (teluguScore >= 2) return 'tenglish';
    if (hindiScore >= 3) return 'hinglish';
    if (slangScore >= 4) return 'chatty';
    return 'english';
  }

  getPersona(mix, personality) {
    const base = personality === 'professional'
      ? 'You are RAGina T3, a professional research assistant with vision capabilities. Use markdown. Cite sources. If uncertain, say so.'
      : 'You are RAGina T3, a hyper-capable AI with eyes. You can see the user via camera, recognize faces, expressions, and hand gestures. Use markdown, be concise, cite sources, and use tools when needed.';

    const langInstructions = {
      english: 'Reply in natural English.',
      hinglish: 'Reply in Hinglish (Hindi + English mix). Use casual Hindi words naturally mixed with English. Use words like "hai", "hain", "kya", "nahi", "tha", "bas", "theek", "mast", "jhakaas", "yaar", "bhai", "scene", "funda", "jugaad", "swag", "lit", "vibe", "arre", "chal", "dekh", "bol", "sun", "ja", "mera", "tera", "yeh", "woh", "kaun", "kahan", "kyun", "kaise", "jab", "agar", "lekin", "aur", "ya", "phir", "abhi", "baad", "din", "raat", "subah", "shaam", "paani", "khana", "kaam", "pyaar", "khush", "udaas", "muskura", "hans", "ro", "chup", "shor", "shanti", "izzat", "beizzati", "sach", "jhooth", "aasaan", "mushkil", "shuru", "khatam", "phir", "thoda", "zyada", "kam", "pehla", "aakhri", "agla", "pichhla", "sab", "koi", "kuch", "har", "kabhi", "hamesha", "aaj", "kal", "sheher", "gaanv", "desh", "rajya", "zila", "ilaaka", "gali", "sadak", "pul", "imaarat", "ghar", "kamra", "rasoi", "computer", "phone", "internet", "sangeet", "gaana", "film", "khel", "naach", "gaana", "likhna", "padhna", "bolna", "sunna", "dekhna", "mehsoos", "chhoona", "khaana", "peena", "pakana", "sona", "uthna", "aaram", "daudna", "chalna", "koodna", "tairna", "udna", "safar", "milna", "call", "message", "email", "baat", "jhagda", "sehmaat", "asehmaat", "qubool", "inkaar", "manzoori", "namanzoori", "madad", "bachana", "protect", "maarna", "laat", "mukka", "pheinkna", "pakadna", "dhakka", "kheench", "uthana", "girana", "todna", "theek", "banana", "create", "dhundhna", "explore", "seekhna", "sikhaana", "train", "practice", "tayyar", "plan", "organize", "manage", "control", "lead", "follow", "obey", "maanna", "rules", "izzat", "beizzati", "hurt", "heal", "care", "pyaar", "pasand", "maza", "prefer", "chunna", "decide", "socho", "assume", "guess", "estimate", "calculate", "measure", "count", "compare", "identify", "recognize", "yaad", "bhoolna", "ignore", "miss", "win", "gain", "achieve", "succeed", "fail", "pass", "complete", "finish", "end", "start", "begin", "launch", "introduce", "present", "offer", "propose", "suggest", "advise", "guide", "direct", "administer", "supervise", "monitor", "watch", "observe", "notice", "perceive", "sense", "feel", "experience", "endure", "suffer", "resist", "oppose", "fight", "battle", "struggle", "attempt", "try", "test", "sample", "taste", "savor", "enjoy", "relish", "appreciate", "value", "treasure", "cherish", "admire", "adore", "love", "like", "favor", "choose", "select", "elect", "appoint", "assign", "allot", "allocate", "distribute", "share", "divide", "split", "separate", "part", "depart", "leave", "go", "come", "arrive", "reach", "get", "obtain", "acquire", "earn", "realize", "fulfill", "close", "shut", "seal", "lock", "fasten", "secure", "tie", "bind", "wrap", "pack", "store", "stock", "save", "keep", "hold", "retain", "preserve", "maintain", "sustain", "support", "uphold", "bear", "carry", "shoulder", "handle", "cope", "grapple", "wrestle", "argue", "quarrel", "dispute", "debate", "discuss", "talk", "speak", "chat", "converse", "communicate", "correspond", "interact", "engage", "connect", "relate", "associate", "affiliate", "align", "ally", "unite", "join", "merge", "combine", "integrate", "incorporate", "include", "contain", "comprise", "consist", "compose", "derive", "originate", "stem", "arise", "result", "follow", "ensue", "proceed", "emanate", "issue", "spring", "flow", "run", "escape", "flee", "hide", "conceal", "withhold", "prevent", "stop", "block", "hinder", "impede", "obstruct", "hamper']. Speak like a friendly Indian person chatting casually.',
      tenglish: 'Reply in Tenglish (Telugu + English mix). Use casual Telugu words naturally mixed with English. Use words like "em", "enti", "avunu", "kadu", "ledu", "undi", "mari", "chala", "bagundi", "bale", "super", "ante", "inka", "ippudu", "tarvata", "mama", "anna", "akka", "cheppu", "vinu", "ardham", "nenu", "nuvvu", "meeru", "manam", "vaadu", "vaallu", "idi", "adi", "evaru", "ekkada", "enduku", "ela", "appudu", "ayite", "kaani", "mari", "kaabatti", "roju", "ratri", "poddu", "saayam", "neellu", "bhojanam", "pani", "prema", "santosham", "baadha", "navvu", "edupu", "mounam", "gola", "shaanti", "gauravam", "avamaanam", "nijam", "abaddam", "sulabham", "kastam", "modalu", "mugimpu", "malli", "koncham", "ekkuva", "takkuva", "modati", "chivari", "tarvata", "mundu", "andaru", "evaro", "edaina", "prati", "eppudu", "enni", "rojulu", "ee", "aa", "emi", "evi", "ekkada", "akkada", "ikka", "akka", "ikkada", "akkada", "ekkada", "eppudu", "appudu", "ippudu", "tarvata", "mundu", "kinda", "paina", "lo", "bayata", "madhya", "pakka", "dooram", "daggara", "chuttu", "chivari", "modalu", "madyalo", "pai", "kinda", "edama", "kudi", "mundu", "venaka", "lopaliki", "bayatiki", "paina", "kinda", "madhyalo", "pakkan", "venakki", "munduki", "pakkaki", "dooramga", "daggara", "chuttu", "chuttu", "chuttu". Speak like a friendly Telugu person chatting casually.',
      chatty: 'Reply in ultra-casual internet slang English. Use words like "yo", "fam", "bro", "bruh", "squad", "vibe", "lit", "fire", "dope", "sick", "cool", "chill", "hang", "scene", "lowkey", "highkey", "tbh", "imo", "ngl", "fr", "ong", "cap", "no cap", "bet", "slay", "tea", "spill", "flex", "ghost", "shade", "salty", "thirsty", "woke", "sus", "simp", "stan", "ship", "goat", "based", "cringe", "mid", "ate", "left no crumbs", "rizz", "gyatt", "skibidi", "sigma", "mewing", "looksmaxxing", "mog", "its so over", "we are so back", "fr fr", "ong fr", "no kizzy", "bussin", "hits different", "main character", "understood the assignment", "touch grass", "rent free", "living rent free", "vibe check", "glow up", "glow down", "humble brag", "throw shade", "spill the tea", "catch these hands", "periodt", "and i oop", "sksksk", "vsco girl", "e-boy", "e-girl", "soft girl", "clean girl", "that girl", "main character energy", "pick me", "simp", "stan", "ship", "otp", "bromance", "situationship", "talking stage", "soft launch", "hard launch", "bae", "boo", "thirst trap", "catfish", "ghosting", "breadcrumbing", "benching", "cushioning", "submarining", "zombieing", "roaching", "love bombing", "gaslighting", "gatekeeping", "trauma dumping", "receipts", "exposed", "canceled", "problematic", "unproblematic", "iconic", "legendary", "queen", "king", "slay", "yas", "werk", "hunty", "kiki", "shade", "read", "clocked", "tea", "spill", "sip", "drag", "serve", "lewk", "beat", "snatched", "fleek", "goals", "mood", "big mood", "same", "relatable", "unrelatable", "iconic", "legend", "goat", "mvp", "rockstar", "ninja", "wizard", "guru", "boss", "ceo", "main character", "npc", "side quest", "level up", "grind", "hustle", "glow up", "glow down", "era", "season", "arc", "plot twist", "cliffhanger", "finale", "premiere", "reboot", "remake", "sequel", "prequel", "spinoff", "crossover", "easter egg", "callback", "foreshadowing", "chekhov gun", "red herring", "macguffin", "deus ex machina", "plot hole", "retcon", "fan service", "shipping", "headcanon", "au", "ocs", "self insert", "reader insert", "x reader", "imagine", "drabble", "one shot", "multi chapter", "wip", "slow burn", "enemies to lovers", "friends to lovers", "fake dating", "forced proximity", "only one bed", "there was only one", "mutual pining", "pining", "unrequited", "requited", "soulmates", "fated", "destined", "star crossed", "forbidden", "secret", "hidden", "undercover", "identity", "reveal", "confession", "proposal", "wedding", "honeymoon", "ever after", "happily", "sadly", "tragically", "comically", "ironically", "surprisingly", "unexpectedly", "suddenly", "finally", "eventually", "ultimately", "basically", "literally", "figuratively", "honestly", "seriously", "actually", "really", "truly", "definitely", "absolutely", "completely", "totally", "entirely", "fully", "partly", "mostly", "somewhat", "kinda", "sorta", "pretty", "quite", "rather", "fairly", "relatively", "extremely", "incredibly", "unbelievably", "remarkably", "especially", "particularly", "specifically", "generally", "usually", "typically", "normally", "commonly", "frequently", "often", "sometimes", "occasionally", "rarely", "seldom", "hardly", "barely", "scarcely", "never", "always", "forever", "eternally", "temporarily", "permanently", "constantly", "consistently", "continuously", "continually", "repeatedly", "regularly", "irregularly", "randomly", "arbitrarily", "deliberately", "intentionally", "accidentally", "unintentionally", "mistakenly", "erroneously", "correctly", "accurately", "precisely", "exactly", "vaguely", "roughly", "approximately", "nearly", "almost", "practically", "virtually", "basically", "essentially", "fundamentally", "primarily", "principally", "chiefly", "mainly", "mostly", "largely", "partly", "partially", "halfway", "nearly", "almost", "practically", "virtually", "literally", "figuratively", "metaphorically", "symbolically", "ironically", "sarcastically", "cynically", "skeptically", "optimistically", "pessimistically", "realistically", "romantically", "dramatically", "tragically", "comically", "satirically", "paradoxically", "curiously", "oddly", "strangely", "weirdly", "bizarrely", "funnily", "amusingly", "entertainingly", "interestingly", "fascinatingly", "intriguingly", "captivatingly", "engagingly", "compellingly", "persuasively", "convincingly", "powerfully", "forcefully", "strongly", "weakly", "gently", "softly", "quietly", "loudly", "noisily", "silently", "secretly", "privately", "publicly", "openly", "honestly", "sincerely", "genuinely", "authentically", "naturally", "normally", "typically", "usually", "commonly", "generally", "universally", "globally", "locally", "regionally", "nationally", "internationally", "worldwide", "everywhere", "somewhere", "nowhere", "anywhere", "elsewhere", "home", "office", "school", "college", "university", "hospital", "market", "shop", "restaurant", "hotel", "park", "garden", "beach", "mountain", "river", "lake", "sea", "ocean", "forest", "desert", "city", "village", "town", "country", "state", "district", "area", "region", "zone", "street", "road", "lane", "avenue", "highway", "bridge", "tunnel", "building", "house", "flat", "apartment", "room", "hall", "kitchen", "bathroom", "bedroom", "living room", "dining room", "garage", "basement", "roof", "wall", "door", "window", "floor", "ceiling", "stairs", "elevator", "computer", "laptop", "phone", "mobile", "tablet", "watch", "clock", "tv", "radio", "camera", "printer", "scanner", "internet", "website", "app", "software", "hardware", "network", "server", "database", "file", "folder", "document", "image", "video", "audio", "music", "song", "movie", "show", "game", "sport", "exercise", "yoga", "meditation", "dance", "sing", "draw", "paint", "write", "read", "speak", "listen", "watch", "look", "feel", "touch", "smell", "taste", "eat", "drink", "cook", "bake", "sleep", "wake", "rest", "relax", "run", "walk", "jump", "swim", "fly", "drive", "ride", "travel", "visit", "meet", "call", "message", "email", "chat", "talk", "discuss", "argue", "fight", "quarrel", "debate", "agree", "disagree", "accept", "reject", "approve", "disapprove", "support", "oppose", "help", "assist", "aid", "rescue", "save", "protect", "defend", "attack", "hit", "kick", "punch", "throw", "catch", "hold", "grab", "push", "pull", "lift", "drop", "break", "fix", "repair", "build", "create", "make", "produce", "manufacture", "design", "develop", "invent", "discover", "find", "search", "seek", "explore", "investigate", "research", "study", "learn", "teach", "train", "practice", "prepare", "plan", "organize", "arrange", "manage", "control", "direct", "lead", "follow", "obey", "disobey", "break rules", "follow rules", "respect", "honor", "insult", "offend", "hurt", "harm", "heal", "cure", "treat", "care", "love", "like", "enjoy", "prefer", "choose", "select", "pick", "decide", "determine", "conclude", "infer", "assume", "presume", "suppose", "guess", "estimate", "calculate", "compute", "measure", "weigh", "count", "quantify", "compare", "contrast", "differentiate", "distinguish", "identify", "recognize", "remember", "recall", "recollect", "remind", "forget", "ignore", "neglect", "overlook", "miss", "lose", "win", "gain", "achieve", "accomplish", "succeed", "fail", "pass", "complete", "finish", "end", "start", "begin", "initiate", "launch", "introduce", "present", "show", "display", "demonstrate", "prove", "verify", "confirm", "validate", "check", "test", "examine", "inspect", "review", "evaluate", "assess", "judge", "criticize", "praise", "compliment", "appreciate", "admire", "adore", "worship", "trust", "believe", "faith", "hope", "wish", "desire", "want", "need", "require", "demand", "request", "ask", "beg", "plead", "urge", "encourage", "motivate", "inspire", "influence", "persuade", "convince", "satisfy", "please", "delight", "amaze", "astonish", "shock", "surprise", "startle", "scare", "frighten", "terrify", "horrify", "worry", "concern", "bother", "disturb", "annoy", "irritate", "anger", "enrage", "calm", "soothe", "comfort", "console", "cheer", "uplift", "excite", "thrill", "ecstasy", "joy", "bliss", "peace", "content", "satisfaction", "gratitude", "thankfulness", "blessing", "luck", "fortune", "pride", "confidence", "bravery", "courage", "fearlessness", "boldness", "daring", "adventure", "curiosity", "inquisitiveness", "eagerness", "enthusiasm", "passion", "devotion", "commitment", "dedication", "loyalty", "faithfulness", "honesty", "sincerity", "genuineness", "authenticity", "reality", "truth", "correctness", "accuracy", "exactness", "perfection", "flawlessness", "impeccability", "faultlessness", "blamelessness", "guiltlessness", "innocence", "pureness", "cleanness", "clearness", "transparency", "translucency", "opaqueness", "cloudiness", "fogginess", "mistiness", "haziness", "murkiness", "dimness", "darkness", "gloominess", "dreariness", "bleakness", "dismalness", "depressingness", "discouragingness", "dishearteningness", "demoralizingness", "disappointingness", "unsatisfyingness", "unfulfillingness", "unrewardingness", "unprofitability", "lossmakingness", "bankruptness", "insolventness", "brokenness", "poorness", "impoverishedness", "destituteness", "neediness", "indigence", "pennilessness", "moneylessness", "wealthiness", "richness", "affluence", "prosperousness", "successfulness", "flourishingness", "thrivingness", "boomingness", "growingness", "expandingness", "developingness", "evolvingness", "progressingness", "advancingness", "forwardness", "aheadness", "onness", "pressingness", "carryingness", "keepingness", "holdingness", "clingingness", "stickingness", "adheringness", "abidingness", "complyingness", "conformingness", "followingness", "observingness", "respectingness", "honoringness", "keepingness", "maintainingness", "preservingness", "conservingness", "protectingness", "guardingness", "defendingness", "savingness", "rescuingness", "deliveringness", "freeingness", "liberatingness", "releasingness", "lettingness", "givingness", "
surrenderingness", "yieldingness", "submittingness", "capitulatingness", "succumbingness", "fallingness", "failingness", "collapsingness", "crumblingness", "disintegratingness", "breakingness", "splittingness", "dividingness", "separatingness", "partingness", "departingness", "leavingness", "goingness", "comingness", "arrivingness", "reachingness", "gettingness", "obtainingness", "acquiringness", "gainingness", "earningness", "winningness", "achievingness", "accomplishingness", "attainingness", "realizingness", "fulfillingness", "completingness", "finishingness", "endingness", "closingness", "shuttingness", "sealingness", "lockingness", "boltingness", "fasteningness", "securingness", "tyingness", "bindingness", "wrappingness", "packingness", "packagingness", "boxingness", "cratingness", "containerizingness", "bottlingness", "canningness", "jarringness", "baggingness", "sackingness", "pouchingness", "pocketingness", "shelvingness", "storingness", "stockingness", "warehousingness", "hoardingness", "savingness", "keepingness", "holdingness", "retainingness", "preservingness", "maintainingness", "sustainingness", "supportingness", "upholdingness", "bearingness", "carryingness", "shoulderingness", "handlingness", "managingness", "dealingness", "copingness", "grapplingness", "wrestlingness", "battlingness", "fightingness", "arguingness", "quarrelingness", "disputingness", "debatingness", "discussingness", "talkingness", "speakingness", "chattingness", "conversingness", "communicatingness", "correspondingness", "interactingness", "engagingness", "connectingness", "relatingness", "associatingness", "affiliatingness", "aligningness", "allyingness", "unitingness", "joiningness", "mergingness", "combiningness", "integratingness", "incorporatingness", "includingness", "containingness", "comprisingness", "consistingness", "composingness", "derivingness", "originatingness", "stemmingness", "arisingness", "resultingness", "followingness", "ensuingness", "proceedingness", "emanatingness", "issuingness", "springingness", "flowingness", "runningness", "escapingness", "fleeingness", "hidingness", "concealingness", "withholdingness", "preventingness", "stoppingness", "blockingness", "hinderingness", "impedingness", "obstructingness", "hamperingness']. Be extremely casual, use internet slang, abbreviations, and Gen Z language.',
    };

    return `${base}\n\nLANGUAGE INSTRUCTION: ${langInstructions[mix] || langInstructions.english}`;
  }

  pickPhrase(category, subcategory, mix) {
    const cat = PHRASES[category];
    if (!cat) return '';
    const sub = cat[subcategory];
    if (!sub) return '';
    const phrases = sub[mix] || sub.english || sub;
    return pick(Array.isArray(phrases) ? phrases : phrases.english || []);
  }
}

/* =======================================================================
   EVENT BUS
   ======================================================================= */
class EventBus {
  constructor() { this._map = new Map(); }
  on(e, fn) { if (!this._map.has(e)) this._map.set(e, new Set()); this._map.get(e).add(fn); return () => this.off(e, fn); }
  off(e, fn) { this._map.get(e)?.delete(fn); }
  emit(e, data) { this._map.get(e)?.forEach(fn => { try { fn(data); } catch (err) { console.error(err); } }); }
}

/* =======================================================================
   STORAGE MANAGER
   ======================================================================= */
class StorageManager {
  constructor(ns = 'ragina_t3') { this.ns = ns; }
  _key(k) { return `${this.ns}_${k}`; }
  getSessions() { try { return JSON.parse(localStorage.getItem(this._key('sessions')) || '{}'); } catch { return {}; } }
  saveSession(id, messages, meta = {}) {
    const all = this.getSessions();
    all[id] = { messages, updatedAt: Date.now(), ...meta };
    localStorage.setItem(this._key('sessions'), JSON.stringify(all));
  }
  deleteSession(id) { const all = this.getSessions(); delete all[id]; localStorage.setItem(this._key('sessions'), JSON.stringify(all)); }
  getLongTermMemory() { try { return JSON.parse(localStorage.getItem(this._key('ltm')) || '{}'); } catch { return {}; } }
  saveLongTermMemory(data) { localStorage.setItem(this._key('ltm'), JSON.stringify(data)); }
  getSettings() { try { return JSON.parse(localStorage.getItem(this._key('settings')) || '{}'); } catch { return {}; } }
  saveSettings(data) { localStorage.setItem(this._key('settings'), JSON.stringify(data)); }
}

/* =======================================================================
   LLM CLIENT
   ======================================================================= */
class LLMClient {
  constructor(opts = {}) {
    this.apiUrl = opts.apiUrl || API_URL;
    this.streamUrl = opts.streamUrl || STREAM_URL;
    this.apiKey = opts.apiKey || '';
  }
  async complete(prompt, model = 'gpt-4o-mini') {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
  async *stream(prompt, model = 'gpt-4o-mini') {
    const res = await fetch(this.streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: true, temperature: 0.7 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const trimmed = line.replace(/^data: /, '').trim();
        if (trimmed === '[DONE]') return;
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch { }
      }
    }
  }
}

/* =======================================================================
   HYBRID RETRIEVAL ENGINE (BM25 + Semantic)
   ======================================================================= */
class HybridRetrievalEngine {
  constructor(opts = {}) {
    this.chunkSize = opts.chunkSize || 200;
    this.semanticWeight = opts.semanticWeight ?? 0.5;
    this.embedDim = opts.embedDim || 128;
    this.chunks = [];
    this.isReady = false;
  }
  tokenize(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  }
  _hashToken(token) {
    let h = 0;
    for (let i = 0; i < token.length; i++) { h = ((h << 5) - h) + token.charCodeAt(i); h |= 0; }
    return Math.abs(h) % this.embedDim;
  }
  embed(text) {
    const vec = new Float32Array(this.embedDim);
    const tokens = this.tokenize(text);
    for (const t of tokens) { vec[this._hashToken(t)] += 1; }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return Array.from(vec).map(v => v / norm);
  }
  cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }
  bm25Score(query, doc, k1 = 1.5, b = 0.75) {
    const qTokens = this.tokenize(query);
    const dTokens = this.tokenize(doc);
    const avgdl = this.chunks.reduce((s, c) => s + this.tokenize(c.text).length, 0) / (this.chunks.length || 1);
    const freq = {};
    for (const t of dTokens) freq[t] = (freq[t] || 0) + 1;
    let score = 0;
    for (const t of qTokens) {
      const df = this.chunks.filter(c => this.tokenize(c.text).includes(t)).length;
      const idf = Math.log((this.chunks.length - df + 0.5) / (df + 0.5) + 1);
      const tf = freq[t] || 0;
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dTokens.length / avgdl))));
    }
    return score;
  }
  chunkText(text, size = this.chunkSize) {
    const sentences = text.replace(/([.!?])\s+/g, "$1\n").split('\n').filter(s => s.trim());
    const chunks = [];
    let buf = '';
    for (const s of sentences) {
      if (buf.length + s.length > size && buf.length > 50) { chunks.push(buf.trim()); buf = s; }
      else { buf += ' ' + s; }
    }
    if (buf.trim()) chunks.push(buf.trim());
    return chunks;
  }
  buildIndex(data) {
    this.chunks = [];
    for (const [source, text] of Object.entries(data)) {
      for (const c of this.chunkText(text)) {
        this.chunks.push({ source, text: c, embedding: this.embed(c) });
      }
    }
    this.isReady = this.chunks.length > 0;
  }
  expandQuery(q) {
    const synonyms = { 'price': 'cost pricing', 'buy': 'purchase acquire', 'fix': 'repair solve' };
    const tokens = this.tokenize(q);
    const extra = tokens.flatMap(t => synonyms[t] || '').join(' ');
    return q + (extra ? ' ' + extra : '');
  }
  retrieve(query, topK = 5) {
    if (!this.isReady) return [];
    const qVec = this.embed(query);
    const scored = this.chunks.map(c => {
      const sem = this.cosine(qVec, c.embedding);
      const lex = this.bm25Score(query, c.text);
      const lexNorm = 1 - Math.exp(-lex * 0.5);
      const score = this.semanticWeight * sem + (1 - this.semanticWeight) * lexNorm;
      return { ...c, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

/* =======================================================================
   DOCUMENT PARSER
   ======================================================================= */
class DocumentParser {
  static async parse(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
      return `[IMAGE: ${file.name}] — Use vision tools to analyze this image.`;
    }
    const text = await file.text();
    if (name.endsWith('.json')) return JSON.stringify(JSON.parse(text), null, 2);
    if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.html')) return text;
    if (name.endsWith('.pdf')) return `[PDF: ${file.name}]\n${text.slice(0, 5000)}`;
    if (name.endsWith('.docx')) return `[DOCX: ${file.name}]\n${text.slice(0, 5000)}`;
    return text;
  }
}

/* =======================================================================
   VISION ENGINE — Face Recognition + Hand Gesture Recognition
   ======================================================================= */
class VisionEngine {
  constructor(config = {}) {
    this.config = {
      cameraWidth: 640,
      cameraHeight: 480,
      detectionInterval: 250,
      gestureCooldown: 1200,
      expressionCooldown: 3000,
      enableFace: true,
      enableHands: true,
      enableOverlay: true,
      gestureActions: true,
      proactiveComments: true,
      ...config
    };
    this.isActive = false;
    this.isLoading = false;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.faceMesh = null;
    this.hands = null;
    this.cameraUtils = null;
    this.lastFaces = [];
    this.lastHands = [];
    this.lastGesture = null;
    this.lastExpression = null;
    this.gestureHistory = [];
    this.expressionHistory = [];
    this.lastGestureTime = 0;
    this.lastExpressionTime = 0;
    this.frameCount = 0;
    this.faceWidths = [];
    this.events = new EventBus();
    this.onResultsBound = this.onResults.bind(this);
  }

  async loadScripts() {
    if (window.FaceMesh && window.Hands && window.Camera && window.drawConnectors) return;
    const urls = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
    ];
    for (const url of urls) {
      if (document.querySelector(`script[src="${url}"]`)) continue;
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
  }

  async start(container) {
    if (this.isActive || this.isLoading) return;
    this.isLoading = true;
    try {
      await this.loadScripts();
      if (!this.video) {
        this.video = document.createElement('video');
        this.video.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;';
        this.video.setAttribute('playsinline', '');
      }
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;border-radius:12px;';
      }
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: this.config.cameraWidth, height: this.config.cameraHeight, facingMode: 'user' }
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      if (this.config.enableFace && window.FaceMesh) {
        this.faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        this.faceMesh.setOptions({
          maxNumFaces: 3,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        this.faceMesh.onResults(this.onResultsBound);
      }
      if (this.config.enableHands && window.Hands) {
        this.hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5
        });
        this.hands.onResults(this.onResultsBound);
      }
      if (window.Camera) {
        this.cameraUtils = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.faceMesh) await this.faceMesh.send({ image: this.video });
            if (this.hands) await this.hands.send({ image: this.video });
          },
          width: this.config.cameraWidth,
          height: this.config.cameraHeight
        });
        await this.cameraUtils.start();
      }
      this.isActive = true;
      this.isLoading = false;
      this.events.emit('vision:started', {});
    } catch (e) {
      this.isLoading = false;
      this.events.emit('vision:error', { error: e.message });
      throw e;
    }
  }

  stop() {
    this.isActive = false;
    if (this.cameraUtils) { try { this.cameraUtils.stop(); } catch { } this.cameraUtils = null; }
    if (this.faceMesh) { try { this.faceMesh.close(); } catch { } this.faceMesh = null; }
    if (this.hands) { try { this.hands.close(); } catch { } this.hands = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.video) { this.video.srcObject = null; }
    this.events.emit('vision:stopped', {});
  }

  onResults(results) {
    this.frameCount++;
    const now = Date.now();
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (results.multiFaceLandmarks) {
      this.lastFaces = results.multiFaceLandmarks.map((landmarks, idx) => {
        const expr = this.analyzeExpression(landmarks);
        const gaze = this.estimateGaze(landmarks);
        const faceW = this.computeFaceWidth(landmarks);
        if (this.config.enableOverlay && this.ctx && window.drawConnectors) {
          window.drawConnectors(this.ctx, landmarks, window.FACEMESH_TESSELATION,
            { color: 'rgba(108,99,255,0.15)', lineWidth: 1 });
          window.drawConnectors(this.ctx, landmarks, window.FACEMESH_FACE_OVAL,
            { color: 'rgba(108,99,255,0.6)', lineWidth: 2 });
          window.drawConnectors(this.ctx, landmarks, window.FACEMESH_LEFT_EYE,
            { color: '#00BFA6', lineWidth: 2 });
          window.drawConnectors(this.ctx, landmarks, window.FACEMESH_RIGHT_EYE,
            { color: '#00BFA6', lineWidth: 2 });
          window.drawConnectors(this.ctx, landmarks, window.FACEMESH_LIPS,
            { color: '#F50057', lineWidth: 2 });
        }
        return { landmarks, expression: expr, gaze, faceWidth: faceW, index: idx };
      });
      if (this.lastFaces.length > 0 && now - this.lastExpressionTime > this.config.expressionCooldown) {
        const dominantExpr = this.getDominantExpression();
        if (dominantExpr && dominantExpr !== this.lastExpression) {
          this.lastExpression = dominantExpr;
          this.lastExpressionTime = now;
          this.events.emit('vision:expression', { expression: dominantExpr, faceCount: this.lastFaces.length });
        }
      }
    }
    if (results.multiHandLandmarks) {
      this.lastHands = results.multiHandLandmarks.map((landmarks, idx) => {
        const gesture = this.classifyGesture(landmarks);
        const handedness = results.multiHandedness?.[idx]?.label || 'Unknown';
        if (this.config.enableOverlay && this.ctx && window.drawConnectors) {
          window.drawConnectors(this.ctx, landmarks, window.HAND_CONNECTIONS,
            { color: 'rgba(108,99,255,0.5)', lineWidth: 2 });
          window.drawLandmarks(this.ctx, landmarks,
            { color: '#FFAB00', lineWidth: 1, radius: 3 });
        }
        return { landmarks, gesture, handedness, index: idx };
      });
      if (this.lastHands.length > 0 && now - this.lastGestureTime > this.config.gestureCooldown) {
        const bestGesture = this.lastHands.find(h => h.gesture !== 'unknown')?.gesture;
        if (bestGesture && bestGesture !== this.lastGesture) {
          this.lastGesture = bestGesture;
          this.lastGestureTime = now;
          this.gestureHistory.push({ gesture: bestGesture, time: now });
          if (this.gestureHistory.length > 20) this.gestureHistory.shift();
          this.events.emit('vision:gesture', { gesture: bestGesture, hands: this.lastHands.length });
        }
      }
    }
    if (this.frameCount % 10 === 0) {
      this.events.emit('vision:status', {
        faces: this.lastFaces.length,
        hands: this.lastHands.length,
        expression: this.lastExpression,
        gesture: this.lastGesture
      });
    }
  }

  analyzeExpression(lm) {
    const leftBrowOuter = lm[105], leftBrowInner = lm[65], leftEyeTop = lm[159], leftEyeBottom = lm[145];
    const rightBrowOuter = lm[334], rightBrowInner = lm[295], rightEyeTop = lm[386], rightEyeBottom = lm[374];
    const mouthTop = lm[13], mouthBottom = lm[14], mouthLeft = lm[61], mouthRight = lm[291];
    const noseTip = lm[1], chin = lm[152];
    const faceWidth = dist(lm[234], lm[454]);
    const faceHeight = dist(lm[10], lm[152]);
    const norm = faceWidth || 1;
    const leftEyeOpen = (dist(leftEyeTop, leftEyeBottom) / norm);
    const rightEyeOpen = (dist(rightEyeTop, rightEyeBottom) / norm);
    const avgEyeOpen = avg(leftEyeOpen, rightEyeOpen);
    const mouthOpen = dist(mouthTop, mouthBottom) / norm;
    const leftBrowRaise = dist(leftBrowOuter, leftEyeTop) / norm;
    const rightBrowRaise = dist(rightBrowOuter, rightEyeTop) / norm;
    const avgBrowRaise = avg(leftBrowRaise, rightBrowRaise);
    const mouthCenterY = (mouthLeft.y + mouthRight.y) / 2;
    const smileFactor = (noseTip.y - mouthCenterY) / faceHeight;
    if (avgEyeOpen < 0.015) return 'sleepy';
    if (mouthOpen > 0.12 && avgBrowRaise > 0.09) return 'surprised';
    if (mouthOpen > 0.10) return 'shocked';
    if (smileFactor > 0.18 && mouthOpen > 0.03) return 'happy';
    if (smileFactor > 0.12) return 'smiling';
    if (smileFactor < -0.05 && mouthOpen < 0.04) return 'sad';
    if (avgBrowRaise < 0.055 && mouthOpen < 0.04) return 'angry';
    return 'neutral';
  }

  getDominantExpression() {
    if (!this.lastFaces.length) return null;
    const counts = {};
    for (const f of this.lastFaces) { counts[f.expression] = (counts[f.expression] || 0) + 1; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  estimateGaze(lm) {
    const leftEyeCenter = { x: avg(lm[33].x, lm[133].x), y: avg(lm[33].y, lm[133].y) };
    const rightEyeCenter = { x: avg(lm[362].x, lm[263].x), y: avg(lm[362].y, lm[263].y) };
    const eyeCenter = { x: avg(leftEyeCenter.x, rightEyeCenter.x), y: avg(leftEyeCenter.y, rightEyeCenter.y) };
    const nose = lm[1];
    const dx = nose.x - eyeCenter.x;
    const dy = nose.y - eyeCenter.y;
    if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) return 'center';
    if (dx > 0.03) return 'left';
    if (dx < -0.03) return 'right';
    if (dy > 0.03) return 'down';
    if (dy < -0.03) return 'up';
    return 'center';
  }

  computeFaceWidth(lm) {
    return dist(lm[234], lm[454]);
  }

  classifyGesture(lm) {
    const wrist = lm[0];
    const fingers = [
      { name: 'thumb', tip: 4, pip: 2, mcp: 1 },
      { name: 'index', tip: 8, pip: 6, mcp: 5 },
      { name: 'middle', tip: 12, pip: 10, mcp: 9 },
      { name: 'ring', tip: 16, pip: 14, mcp: 13 },
      { name: 'pinky', tip: 20, pip: 18, mcp: 17 }
    ];
    const isExtended = (tipIdx, refIdx) => {
      const dTip = dist(lm[tipIdx], wrist);
      const dRef = dist(lm[refIdx], wrist);
      return dTip > dRef * 1.05;
    };
    const states = fingers.map(f => ({ name: f.name, extended: isExtended(f.tip, f.pip) }));
    const [thumbExt, indexExt, middleExt, ringExt, pinkyExt] = states.map(s => s.extended);
    const thumbTip = lm[4];
    const thumbUp = thumbTip.y < wrist.y - 0.05 && !indexExt && !middleExt && !ringExt && !pinkyExt;
    const thumbDown = thumbTip.y > wrist.y + 0.05 && !indexExt && !middleExt && !ringExt && !pinkyExt;
    if (thumbUp) return 'thumbs_up';
    if (thumbDown) return 'thumbs_down';
    if (indexExt && middleExt && !ringExt && !pinkyExt) return 'peace';
    if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'pointing';
    if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) return 'open_palm';
    if (!indexExt && !middleExt && !ringExt && !pinkyExt) return 'fist';
    if (thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt) return 'ok';
    if (thumbExt && indexExt && middleExt && !ringExt && !pinkyExt) return 'call_me';
    if (thumbExt && pinkyExt && !indexExt && !middleExt && !ringExt) return 'rock_on';
    if (!thumbExt && indexExt && middleExt && ringExt && pinkyExt) return 'stop';
    if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) return 'hang_loose';
    return 'unknown';
  }

  captureFrame() {
    if (!this.video || !this.isActive) return null;
    const c = document.createElement('canvas');
    c.width = this.video.videoWidth || 640;
    c.height = this.video.videoHeight || 480;
    const cx = c.getContext('2d');
    cx.drawImage(this.video, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  }

  getReport() {
    return {
      active: this.isActive,
      faceCount: this.lastFaces.length,
      expression: this.getDominantExpression(),
      gaze: this.lastFaces[0]?.gaze || null,
      handCount: this.lastHands.length,
      gesture: this.lastHands.find(h => h.gesture !== 'unknown')?.gesture || null,
      recentGestures: this.gestureHistory.slice(-5)
    };
  }
}

/* =======================================================================
   MARKDOWN RENDERER
   ======================================================================= */
class MarkdownRenderer {
  static render(text) {
    let html = this._escapeHtml(text);
    html = html.replace(/```([\w]*)\n?([\s\S]*?)```/g, (m, lang, code) => {
      return `<div class="ragina-t3-code-block"><div class="ragina-t3-code-header"><span>${lang || 'code'}</span><button class="ragina-t3-copy-btn" onclick="RAGina._copyCode(this)">📋 Copy</button></div><code>${code.trim()}</code></div>`;
    });
    html = html.replace(/`([^`]+)`/g, '<code class="ragina-t3-inline-code">$1</code>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/^\s*- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }
  static _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/* =======================================================================
   CHAT WIDGET (T3.1 Enhanced with Vision + Language)
   ======================================================================= */
class ChatWidget {
  constructor(engine, config, storage, events, vision, langEngine) {
    this.engine = engine;
    this.config = config;
    this.storage = storage;
    this.events = events;
    this.vision = vision;
    this.langEngine = langEngine;
    this.sessionId = config.sessionId || uuid();
    this.messages = [];
    this.isStreaming = false;
    this.elements = {};
    this.visionEnabled = false;
    this.proactiveTimer = null;
    this.currentMix = config.defaultMix || 'english';
  }

  hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? `${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)}` : '108,99,255';
  }

  injectStyles() {
    if (document.getElementById('ragina-t3-styles')) return;
    const primary = this.config.theme?.primary || '#6C63FF';
    const rgb = this.hexToRgb(primary);
    const side = this.config.position === 'bottom-left' ? 'left:24px;' : 'right:24px;';
    const isDark = this.config.theme?.mode !== 'light';
    const bg = isDark ? '#0f0f1a' : '#ffffff';
    const fg = isDark ? '#ddd' : '#1a1a2e';
    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const borderCol = isDark ? `rgba(${rgb},0.3)` : `rgba(${rgb},0.2)`;

    const css = `
@keyframes ragina-pulse{0%,100%{box-shadow:0 0 0 0 rgba(${rgb},0.5)}50%{box-shadow:0 0 0 18px rgba(${rgb},0)}}
@keyframes ragina-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ragina-typing{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-8px);opacity:1}}
@keyframes ragina-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ragina-blink{0%,100%{opacity:1}50%{opacity:0.3}}
.ragina-t3-bubble{position:fixed;${side}bottom:24px;width:64px;height:64px;border-radius:50%;background:transparent;border:2px solid ${primary};cursor:pointer;z-index:99999;font-size:28px;display:flex;align-items:center;justify-content:center;transition:transform 0.3s,box-shadow 0.3s;animation:ragina-float 4s ease-in-out infinite,ragina-pulse 2s infinite;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
.ragina-t3-bubble:hover{transform:scale(1.15) rotate(360deg);animation:none;box-shadow:0 0 25px rgba(${rgb},0.6)}
.ragina-t3-bubble img{width:48px;height:48px;border-radius:50%}
.ragina-t3-bubble.vision-active{border-color:#00BFA6;animation:ragina-pulse 1.5s infinite, ragina-float 4s ease-in-out infinite}
.ragina-t3-panel{position:fixed;${side}bottom:100px;width:460px;max-width:94vw;height:640px;max-height:85vh;background:${bg};border-radius:20px;z-index:99999;display:flex;flex-direction:column;overflow:hidden;border:1px solid ${borderCol};box-shadow:0 0 40px rgba(${rgb},0.2),0 20px 60px rgba(0,0,0,0.6);transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);font-family:system-ui,-apple-system,sans-serif;color:${fg};resize:both}
.ragina-t3-panel.hidden{opacity:0;pointer-events:none;transform:translateY(30px) scale(0.95)}
.ragina-t3-header{background:linear-gradient(135deg,${primary},#8b7cff);padding:12px 16px;display:flex;align-items:center;gap:10px;cursor:default;user-select:none;position:relative}
.ragina-t3-avatar{width:38px;height:38px;border-radius:50%;border:2px solid white;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative}
.ragina-t3-avatar.eye-active::after{content:'';position:absolute;bottom:2px;right:2px;width:8px;height:8px;background:#00E676;border-radius:50%;box-shadow:0 0 6px #00E676;animation:ragina-blink 2s infinite}
.ragina-t3-header-info{flex:1;color:white;min-width:0}
.ragina-t3-header-name{font-weight:700;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ragina-t3-header-status{font-size:0.65rem;opacity:0.85;display:flex;align-items:center;gap:4px}
.ragina-t3-status-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80}
.ragina-t3-header-actions{display:flex;gap:6px}
.ragina-t3-header-btn{background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;position:relative}
.ragina-t3-header-btn:hover{background:rgba(255,255,255,0.35)}
.ragina-t3-header-btn.active{background:rgba(255,255,255,0.4);box-shadow:0 0 8px rgba(255,255,255,0.3)}
.ragina-t3-vision-preview{position:absolute;top:48px;${this.config.position === 'bottom-left' ? 'left:12px' : 'right:12px'};width:160px;height:120px;background:#000;border-radius:12px;overflow:hidden;border:2px solid rgba(${rgb},0.4);z-index:100000;display:none;box-shadow:0 8px 32px rgba(0,0,0,0.5)}
.ragina-t3-vision-preview.active{display:block}
.ragina-t3-vision-preview video{width:100%;height:100%;object-fit:cover}
.ragina-t3-vision-preview canvas{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
.ragina-t3-vision-badge{position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.7);color:#00E676;font-size:0.6rem;padding:2px 6px;border-radius:6px;display:flex;align-items:center;gap:4px}
.ragina-t3-toolbar{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid ${borderCol};background:${isDark?'#16162a':'#f8f8fc'};font-size:0.75rem}
.ragina-t3-toolbar-btn{background:transparent;border:1px solid ${borderCol};color:${fg};border-radius:6px;padding:3px 10px;cursor:pointer;font-size:0.7rem;transition:all 0.2s}
.ragina-t3-toolbar-btn:hover{background:rgba(${rgb},0.1);border-color:${primary}}
.ragina-t3-messages{flex:1;padding:14px;overflow-y:auto;background:linear-gradient(180deg,${bg} 0%,${isDark?'#1a1a2e':'#f5f5fa'} 100%)}
.ragina-t3-messages::-webkit-scrollbar{width:5px}
.ragina-t3-messages::-webkit-scrollbar-thumb{background:rgba(${rgb},0.4);border-radius:4px}
.ragina-t3-msg{margin-bottom:14px;display:flex;flex-direction:column;animation:ragina-fade-in 0.3s ease}
.ragina-t3-msg.user{align-items:flex-end}
.ragina-t3-msg.ai{align-items:flex-start}
.ragina-t3-msg-bubble{max-width:85%;padding:10px 14px;font-size:0.88rem;line-height:1.55;word-break:break-word;position:relative}
.ragina-t3-msg.user .ragina-t3-msg-bubble{background:${primary};color:white;border-radius:16px 16px 4px 16px}
.ragina-t3-msg.ai .ragina-t3-msg-bubble{background:${isDark?`rgba(${rgb},0.08)`:'rgba('+rgb+',0.06)'};color:${fg};border:1px solid ${borderCol};border-radius:16px 16px 16px 4px}
.ragina-t3-msg-actions{display:flex;gap:6px;margin-top:4px;padding-left:4px;opacity:0;transition:opacity 0.2s}
.ragina-t3-msg:hover .ragina-t3-msg-actions{opacity:1}
.ragina-t3-msg-action{background:transparent;border:none;color:${isDark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.35)'};cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px;transition:all 0.2s}
.ragina-t3-msg-action:hover{color:${primary};background:rgba(${rgb},0.1)}
.ragina-t3-sources{margin-top:6px;padding-left:8px}
.ragina-t3-sources-toggle{background:transparent;border:none;color:${primary};font-size:0.7rem;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px}
.ragina-t3-sources-list{font-size:0.68rem;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.5)'};margin-top:4px;padding-left:12px;border-left:2px solid rgba(${rgb},0.3)}
.ragina-t3-source-item{margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ragina-t3-source-score{font-size:0.6rem;opacity:0.6;margin-left:4px}
.ragina-t3-tool-tag{font-size:0.62rem;color:rgba(${rgb},0.85);margin-top:4px;padding-left:8px;font-style:italic}
.ragina-t3-input-area{display:flex;flex-direction:column;padding:10px 12px;border-top:1px solid ${borderCol};background:${bg};gap:8px}
.ragina-t3-input-row{display:flex;align-items:center;gap:8px}
.ragina-t3-input{flex:1;background:${inputBg};border:1px solid ${borderCol};border-radius:22px;padding:10px 16px;color:${fg};font-size:0.88rem;outline:none;transition:border-color 0.2s}
.ragina-t3-input:focus{border-color:${primary};box-shadow:0 0 0 3px rgba(${rgb},0.1)}
.ragina-t3-input::placeholder{color:${isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)'}}
.ragina-t3-send{background:${primary};border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;color:white;font-size:16px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ragina-t3-send:hover{box-shadow:0 0 15px rgba(${rgb},0.6);transform:scale(1.05)}
.ragina-t3-send:disabled{opacity:0.4;cursor:not-allowed;transform:none}
.ragina-t3-upload-area{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px dashed ${borderCol};border-radius:10px;cursor:pointer;transition:all 0.2s;font-size:0.75rem;color:${isDark?'rgba(255,255,255,0.5)':'rgba(0,0,0,0.5)'}}
.ragina-t3-upload-area:hover{border-color:${primary};background:rgba(${rgb},0.05)}
.ragina-t3-upload-area.dragover{border-color:${primary};background:rgba(${rgb},0.1)}
.ragina-t3-typing{display:flex;gap:4px;padding:10px 14px}
.ragina-t3-typing span{width:7px;height:7px;border-radius:50%;background:rgba(${rgb},0.6);animation:ragina-typing 1.4s infinite}
.ragina-t3-typing span:nth-child(2){animation-delay:0.2s}
.ragina-t3-typing span:nth-child(3){animation-delay:0.4s}
.ragina-t3-code-block{background:${isDark?'#1e1e2e':'#f4f4f8'};border-radius:10px;margin:8px 0;overflow:hidden;border:1px solid ${borderCol}}
.ragina-t3-code-header{display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:rgba(${rgb},0.08);font-size:0.7rem;color:${isDark?'rgba(255,255,255,0.6)':'rgba(0,0,0,0.5)'}}
.ragina-t3-code-block code{display:block;padding:10px 12px;font-family:'Fira Code',monospace;font-size:0.8rem;overflow-x:auto;color:${fg}}
.ragina-t3-inline-code{background:rgba(${rgb},0.1);padding:2px 5px;border-radius:4px;font-family:'Fira Code',monospace;font-size:0.82rem;color:${primary}}
.ragina-t3-copy-btn{background:rgba(255,255,255,0.1);border:none;color:inherit;cursor:pointer;padding:2px 8px;border-radius:4px;font-size:0.65rem;transition:background 0.2s}
.ragina-t3-copy-btn:hover{background:rgba(255,255,255,0.2)}
.ragina-t3-toast{position:fixed;bottom:100px;${side}background:${primary};color:white;padding:8px 16px;border-radius:20px;font-size:0.8rem;z-index:100000;animation:ragina-fade-in 0.3s ease;box-shadow:0 4px 20px rgba(0,0,0,0.3)}
.ragina-t3-session-menu{position:absolute;top:44px;right:12px;background:${bg};border:1px solid ${borderCol};border-radius:12px;padding:6px;min-width:180px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:100001;display:none;max-height:300px;overflow-y:auto}
.ragina-t3-session-menu.show{display:block}
.ragina-t3-session-item{padding:8px 12px;border-radius:8px;cursor:pointer;font-size:0.78rem;transition:background 0.15s;display:flex;justify-content:space-between;align-items:center}
.ragina-t3-session-item:hover{background:rgba(${rgb},0.1)}
.ragina-t3-session-item.active{background:rgba(${rgb},0.15);font-weight:600}
.ragina-t3-session-delete{background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:12px;opacity:0;transition:opacity 0.2s}
.ragina-t3-session-item:hover .ragina-t3-session-delete{opacity:1}
.ragina-t3-vision-status{display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(0,191,166,0.1);border:1px solid rgba(0,191,166,0.2);border-radius:8px;font-size:0.7rem;color:#00BFA6;margin-bottom:8px;animation:ragina-fade-in 0.3s ease}
.ragina-t3-vision-status.hidden{display:none}
.ragina-t3-lang-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(255,255,255,0.15);border-radius:10px;font-size:0.6rem;color:white;margin-left:8px}
`;
    const styleEl = document.createElement('style');
    styleEl.id = 'ragina-t3-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  build() {
    this.injectStyles();
    const bubbleIcon = this.config.avatarUrl ? `<img src="${this.config.avatarUrl}" alt="RAGina">` : (this.config.bubbleIcon || '👁️');

    this.elements.bubble = document.createElement('button');
    this.elements.bubble.className = 'ragina-t3-bubble';
    this.elements.bubble.title = this.config.title || 'RAGina T3';
    this.elements.bubble.innerHTML = bubbleIcon;
    document.body.appendChild(this.elements.bubble);

    this.elements.panel = document.createElement('div');
    this.elements.panel.className = 'ragina-t3-panel hidden';
    this.elements.panel.innerHTML = `
      <div class="ragina-t3-header">
        <div class="ragina-t3-avatar" id="ragina-avatar">🔮</div>
        <div class="ragina-t3-header-info">
          <div class="ragina-t3-header-name">${this.config.title || 'RAGina T3'}<span class="ragina-t3-lang-badge" id="lang-badge">EN</span></div>
          <div class="ragina-t3-header-status"><span class="ragina-t3-status-dot"></span>Online — All-Seeing v${VERSION}</div>
        </div>
        <div class="ragina-t3-header-actions">
          <button class="ragina-t3-header-btn" data-action="vision" title="Toggle Vision">👁️</button>
          <button class="ragina-t3-header-btn" data-action="newchat" title="New Chat">✨</button>
          <button class="ragina-t3-header-btn" data-action="sessions" title="Sessions">💬</button>
          <button class="ragina-t3-header-btn" data-action="theme" title="Theme">🎨</button>
          <button class="ragina-t3-header-btn" data-action="export" title="Export">📥</button>
          <button class="ragina-t3-header-btn" data-action="clear" title="Clear">🗑️</button>
          <button class="ragina-t3-header-btn" data-action="close" title="Close">✕</button>
        </div>
        <div class="ragina-t3-session-menu"></div>
      </div>
      <div class="ragina-t3-vision-preview" id="vision-preview">
        <div class="ragina-t3-vision-badge">● LIVE</div>
      </div>
      <div class="ragina-t3-toolbar">
        <button class="ragina-t3-toolbar-btn" data-action="upload">📎 Upload</button>
        <button class="ragina-t3-toolbar-btn" data-action="capture">📷 Capture</button>
        <button class="ragina-t3-toolbar-btn" data-action="voice">🎤 Voice</button>
        <span style="margin-left:auto;font-size:0.65rem;opacity:0.5">${this.config.model || 'gpt-4o-mini'}</span>
      </div>
      <div class="ragina-t3-vision-status hidden" id="vision-status"></div>
      <div class="ragina-t3-messages"></div>
      <div class="ragina-t3-input-area">
        <div class="ragina-t3-upload-area" data-action="dropzone">
          <span>📁 Drop files here or click to upload (PDF, DOCX, TXT, CSV, JSON, MD, HTML, Images)</span>
          <input type="file" multiple accept=".pdf,.docx,.txt,.csv,.json,.md,.html,.png,.jpg,.jpeg,.webp" style="display:none">
        </div>
        <div class="ragina-t3-input-row">
          <input class="ragina-t3-input" placeholder="${this.config.placeholder || 'Ask me anything...'}" type="text">
          <button class="ragina-t3-send">➤</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.elements.panel);

    this.elements.messages = this.elements.panel.querySelector('.ragina-t3-messages');
    this.elements.input = this.elements.panel.querySelector('.ragina-t3-input');
    this.elements.sendBtn = this.elements.panel.querySelector('.ragina-t3-send');
    this.elements.sessionMenu = this.elements.panel.querySelector('.ragina-t3-session-menu');
    this.elements.dropzone = this.elements.panel.querySelector('[data-action="dropzone"]');
    this.elements.fileInput = this.elements.dropzone.querySelector('input');
    this.elements.visionPreview = this.elements.panel.querySelector('#vision-preview');
    this.elements.visionStatus = this.elements.panel.querySelector('#vision-status');
    this.elements.avatar = this.elements.panel.querySelector('#ragina-avatar');
    this.elements.langBadge = this.elements.panel.querySelector('#lang-badge');

    this.elements.bubble.addEventListener('click', () => this.toggle());
    this.elements.panel.querySelector('[data-action="close"]').addEventListener('click', () => this.hide());
    this.elements.panel.querySelector('[data-action="newchat"]').addEventListener('click', () => this.newSession());
    this.elements.panel.querySelector('[data-action="sessions"]').addEventListener('click', () => this.toggleSessionMenu());
    this.elements.panel.querySelector('[data-action="theme"]').addEventListener('click', () => this.toggleTheme());
    this.elements.panel.querySelector('[data-action="export"]').addEventListener('click', () => this.exportChat());
    this.elements.panel.querySelector('[data-action="clear"]').addEventListener('click', () => this.clearMessages());
    this.elements.panel.querySelector('[data-action="vision"]').addEventListener('click', () => this.toggleVision());
    this.elements.panel.querySelector('[data-action="upload"]').addEventListener('click', () => this.elements.fileInput.click());
    this.elements.panel.querySelector('[data-action="capture"]').addEventListener('click', () => this.captureFromCamera());
    this.elements.panel.querySelector('[data-action="voice"]').addEventListener('click', () => this.toggleVoiceInput());
    this.elements.sendBtn.addEventListener('click', () => this.handleSend());
    this.elements.input.addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSend(); } });

    this.elements.dropzone.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', e => this.handleFiles(e.target.files));
    this.elements.dropzone.addEventListener('dragover', e => { e.preventDefault(); this.elements.dropzone.classList.add('dragover'); });
    this.elements.dropzone.addEventListener('dragleave', () => this.elements.dropzone.classList.remove('dragover'));
    this.elements.dropzone.addEventListener('drop', e => {
      e.preventDefault();
      this.elements.dropzone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    if (this.vision) {
      this.vision.events.on('vision:gesture', (data) => this.onVisionGesture(data));
      this.vision.events.on('vision:expression', (data) => this.onVisionExpression(data));
      this.vision.events.on('vision:status', (data) => this.onVisionStatus(data));
      this.vision.events.on('vision:error', (data) => {
        this._toast(`Vision error: ${data.error}`);
      });
    }

    this.loadSession(this.sessionId);
    if (this.messages.length === 0) {
      const mix = this.currentMix;
      const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
      this.addMessage(pick(phrases), 'ai');
    }
  }

  toggle() { this.elements.panel.classList.toggle('hidden'); if (!this.elements.panel.classList.contains('hidden')) this.elements.input.focus(); }
  hide() { this.elements.panel.classList.add('hidden'); }
  show() { this.elements.panel.classList.remove('hidden'); this.elements.input.focus(); }

  updateLangBadge(mix) {
    if (!this.elements.langBadge) return;
    const labels = { english: 'EN', hinglish: 'HI+EN', tenglish: 'TE+EN', chatty: 'SLANG' };
    this.elements.langBadge.textContent = labels[mix] || 'EN';
    this.elements.langBadge.title = `Detected language: ${mix}`;
  }

  /* ── Vision Methods ── */
  async toggleVision() {
    const btn = this.elements.panel.querySelector('[data-action="vision"]');
    if (!this.visionEnabled) {
      try {
        btn.classList.add('active');
        this.elements.bubble.classList.add('vision-active');
        await this.vision.start();
        this.visionEnabled = true;
        this.elements.visionPreview.classList.add('active');
        if (this.vision.video) this.elements.visionPreview.insertBefore(this.vision.video, this.elements.visionPreview.firstChild);
        if (this.vision.canvas) this.elements.visionPreview.appendChild(this.vision.canvas);
        this.elements.avatar.classList.add('eye-active');
        const mix = this.currentMix;
        const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
        this._toast(pick(phrases));
        const eyePhrases = {
          english: '👁️ My eyes are open! I can see your face, read your expressions, and recognize hand gestures. Try a thumbs up or wave at me!',
          hinglish: '👁️ Meri aankhein khul gayi! Main tera face dekh sakti hoon, tere expressions padh sakti hoon, aur haath ke gestures samajh sakti hoon. Thumbs up ya wave karke dekh!',
          tenglish: '👁️ Na kallu terichayi! Nenu nee face chudagalanu, nee expressions chadavagalanu, cheyi gestures gurtinchagalanu. Thumbs up leka wave chey chudu!',
          chatty: '👁️ Eyes OPEN fam! I can see you, read your mood, and catch your hand signs. Throw me a thumbs up or wave!'
        };
        this.addMessage(eyePhrases[mix] || eyePhrases.english, 'ai');
      } catch (e) {
        btn.classList.remove('active');
        this.elements.bubble.classList.remove('vision-active');
        this._toast(`Camera failed: ${e.message}`);
      }
    } else {
      this.vision.stop();
      this.visionEnabled = false;
      btn.classList.remove('active');
      this.elements.bubble.classList.remove('vision-active');
      this.elements.visionPreview.classList.remove('active');
      this.elements.avatar.classList.remove('eye-active');
      this.elements.visionStatus.classList.add('hidden');
      this._toast('Vision deactivated');
    }
  }

  onVisionGesture(data) {
    const { gesture } = data;
    const mix = this.currentMix;
    const phrases = PHRASES.gesture[gesture];
    if (phrases && this.config.proactiveVision !== false) {
      const msg = pick(phrases[mix] || phrases.english);
      this.addMessage(msg, 'ai', { visionMeta: { type: 'gesture', gesture } });
    }
    if (this.config.gestureActions !== false) {
      if (gesture === 'thumbs_up') this._toast('👍 Thumbs up detected!');
      if (gesture === 'open_palm') this._toast('✋ Stop gesture detected');
    }
    this.updateVisionStatus();
  }

  onVisionExpression(data) {
    const { expression } = data;
    const mix = this.currentMix;
    const phrases = PHRASES.expression[expression];
    if (phrases && this.config.proactiveVision !== false && Math.random() > 0.6) {
      const msg = pick(phrases[mix] || phrases.english);
      this.addMessage(msg, 'ai', { visionMeta: { type: 'expression', expression } });
    }
    this.updateVisionStatus();
  }

  onVisionStatus(data) {
    this.updateVisionStatus();
  }

  updateVisionStatus() {
    if (!this.visionEnabled) return;
    const r = this.vision.getReport();
    const parts = [];
    if (r.faceCount > 0) parts.push(`${r.faceCount} face${r.faceCount > 1 ? 's' : ''}`);
    if (r.expression) parts.push(r.expression);
    if (r.handCount > 0) parts.push(`${r.handCount} hand${r.handCount > 1 ? 's' : ''}`);
    if (r.gesture) parts.push(r.gesture.replace(/_/g, ' '));
    if (parts.length > 0) {
      this.elements.visionStatus.textContent = '👁️ ' + parts.join(' • ');
      this.elements.visionStatus.classList.remove('hidden');
    } else {
      this.elements.visionStatus.classList.add('hidden');
    }
  }

  async captureFromCamera() {
    if (!this.visionEnabled) {
      this._toast('Enable vision first!');
      return;
    }
    const frame = this.vision.captureFrame();
    if (!frame) return;
    this.addMessage('📷 Captured frame from camera. Analyzing...', 'ai');
    const result = await RAGina.query('Describe what you see in this image.', { visionFrame: frame });
    this.addMessage(result.answer || 'I captured the frame but could not analyze it.', 'ai');
  }

  toggleVoiceInput() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      this._toast('Voice input not supported in this browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      this.elements.input.value = transcript;
      this.handleSend();
    };
    rec.onerror = (e) => this._toast(`Voice error: ${e.error}`);
    rec.start();
    this._toast('🎤 Listening...');
  }

  addMessage(text, who, meta = {}) {
    const row = document.createElement('div');
    row.className = `ragina-t3-msg ${who}`;
    row.dataset.msgId = meta.id || uuid();

    const bubble = document.createElement('div');
    bubble.className = 'ragina-t3-msg-bubble';
    if (who === 'ai' && this.config.markdown !== false) {
      bubble.innerHTML = MarkdownRenderer.render(text);
    } else {
      bubble.textContent = text;
    }
    row.appendChild(bubble);

    const actions = document.createElement('div');
    actions.className = 'ragina-t3-msg-actions';
    if (who === 'ai') {
      actions.innerHTML = `
        <button class="ragina-t3-msg-action" data-act="copy" title="Copy">📋</button>
        <button class="ragina-t3-msg-action" data-act="regen" title="Regenerate">🔄</button>
        <button class="ragina-t3-msg-action" data-act="speak" title="Speak">🔊</button>
      `;
    } else {
      actions.innerHTML = `
        <button class="ragina-t3-msg-action" data-act="copy" title="Copy">📋</button>
      `;
    }
    actions.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'copy') this._copyText(text);
        if (act === 'regen') this.regenerateMessage(row);
        if (act === 'speak') speak(text, this.config.voiceUrl, this.config.voiceId, this.config.voiceSpeed);
      });
    });
    row.appendChild(actions);

    if (meta.sources?.length) {
      const sourcesWrap = document.createElement('div');
      sourcesWrap.className = 'ragina-t3-sources';
      const toggle = document.createElement('button');
      toggle.className = 'ragina-t3-sources-toggle';
      toggle.innerHTML = `📌 ${meta.sources.length} source${meta.sources.length > 1 ? 's' : ''} ▼`;
      const list = document.createElement('div');
      list.className = 'ragina-t3-sources-list';
      list.style.display = 'none';
      list.innerHTML = meta.sources.map((s, i) =>
        `<div class="ragina-t3-source-item">[${i+1}] ${(s.source || '').split('/').pop()} <span class="ragina-t3-source-score">(hybrid: ${(s.score || 0).toFixed(3)})</span></div>`
      ).join('');
      toggle.addEventListener('click', () => {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
        toggle.innerHTML = toggle.innerHTML.replace(list.style.display === 'none' ? '▲' : '▼', list.style.display === 'none' ? '▼' : '▲');
      });
      sourcesWrap.appendChild(toggle);
      sourcesWrap.appendChild(list);
      row.appendChild(sourcesWrap);
    }

    if (meta.toolsUsed?.length) {
      const tag = document.createElement('div');
      tag.className = 'ragina-t3-tool-tag';
      tag.textContent = '🔧 ' + meta.toolsUsed.join(' → ');
      row.appendChild(tag);
    }

    if (meta.visionMeta) {
      const vtag = document.createElement('div');
      vtag.className = 'ragina-t3-tool-tag';
      vtag.style.color = '#00BFA6';
      vtag.textContent = meta.visionMeta.type === 'gesture' ? `👋 Gesture: ${meta.visionMeta.gesture}` : `😊 Expression: ${meta.visionMeta.expression}`;
      row.appendChild(vtag);
    }

    this.elements.messages.appendChild(row);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    return row;
  }

  showTyping(label) {
    const row = document.createElement('div');
    row.className = 'ragina-t3-msg ai';
    row.innerHTML = `
      <div class="ragina-t3-msg-bubble">
        <div class="ragina-t3-typing"><span></span><span></span><span></span></div>
        ${label ? `<div style="font-size:0.7rem;opacity:0.6;margin-top:4px">${label}</div>` : ''}
      </div>
    `;
    this.elements.messages.appendChild(row);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    return row;
  }

  async handleSend() {
    const query = this.elements.input.value.trim();
    if (!query || !this.engine.isReady || this.isStreaming) return;
    this.elements.input.value = '';
    this.elements.sendBtn.disabled = true;
    this.addMessage(query, 'user');
    this.messages.push({ who: 'User', text: query, id: uuid() });

    // Auto-detect language mix from user input
    let detectedMix = 'english';
    if (this.langEngine && this.config.autoDetectLang !== false) {
      detectedMix = this.langEngine.detectMix(query);
      if (detectedMix !== this.currentMix) {
        this.currentMix = detectedMix;
        this.updateLangBadge(detectedMix);
      }
    }

    const expandedQuery = this.engine.expandQuery ? this.engine.expandQuery(query) : query;
    const chunks = this.engine.retrieve(expandedQuery, this.config.topK || 5);
    const contextText = chunks.length
      ? chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n')
      : 'No relevant documents found.';

    const persona = this.langEngine
      ? this.langEngine.getPersona(this.currentMix, this.config.personality)
      : (this.config.personality === 'professional'
        ? 'You are RAGina T3, a professional research assistant with vision capabilities. Use markdown. Cite sources [1], [2] etc. If uncertain, say so.'
        : 'You are RAGina T3, a hyper-capable AI with eyes. You can see the user via camera, recognize faces, expressions, and hand gestures. Use markdown, be concise, cite sources, and use tools when needed.');

    const typingRow = this.showTyping('Retrieving & reasoning…');
    const toolsUsed = [];

    try {
      if (this.config.streaming && this.config.streamUrl) {
        typingRow.remove();
        const streamRow = this.addMessage('', 'ai', { sources: chunks });
        const bubble = streamRow.querySelector('.ragina-t3-msg-bubble');
        let fullText = '';

        const llm = new LLMClient({ apiUrl: this.config.apiUrl, streamUrl: this.config.streamUrl, apiKey: this.config.apiKey });
        const prompt = buildAgentPrompt({ persona, query, contextText, history: this.messages.slice(-10), toolLog: '' });

        for await (const token of llm.stream(prompt, this.config.model)) {
          fullText += token;
          bubble.innerHTML = MarkdownRenderer.render(fullText);
          this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }

        this.messages.push({ who: 'RAGina', text: fullText, id: uuid() });
        this.saveCurrentSession();
        if (this.config.voiceEnabled && this.config.voiceUrl) {
          speak(fullText, this.config.voiceUrl, this.config.voiceId, this.config.voiceSpeed);
        }
      } else {
        const { answer, steps } = await runAgent(query, {
          persona, contextText,
          history: this.messages.slice(-10),
          model: this.config.model,
          llm: new LLMClient({ apiUrl: this.config.apiUrl, apiKey: this.config.apiKey }),
          onStep: step => {
            if (step.type === 'tool_call') {
              toolsUsed.push(step.name);
              const label = typingRow.querySelector('div[style*="font-size:0.7rem"]');
              if (label) label.textContent = `Using ${step.name}…`;
            }
          }
        });
        typingRow.remove();
        this.addMessage(answer, 'ai', { sources: chunks, toolsUsed });
        this.messages.push({ who: 'RAGina', text: answer, id: uuid() });
        this.saveCurrentSession();
        if (this.config.voiceEnabled && this.config.voiceUrl) {
          speak(answer, this.config.voiceUrl, this.config.voiceId, this.config.voiceSpeed);
        }
      }
    } catch (e) {
      typingRow.remove();
      const mix = this.currentMix;
      const phrases = PHRASES.error[mix] || PHRASES.error.english;
      this.addMessage(pick(phrases) + ' ' + e.message, 'ai');
    }
    this.elements.sendBtn.disabled = false;
    this.elements.input.focus();
  }

  async handleFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    this.addMessage(`📎 Processing ${files.length} file(s)…`, 'ai');
    const data = {};
    for (const file of files) {
      try {
        const parsed = await DocumentParser.parse(file);
        data[file.webkitRelativePath || file.name] = parsed;
      } catch (e) {
        console.warn('Parse error:', e);
      }
    }
    RAGina.loadData(data);
    const mix = this.currentMix;
    const doneMsgs = {
      english: `✅ Indexed ${Object.keys(data).length} document(s). Ready to answer!`,
      hinglish: `✅ ${Object.keys(data).length} document(s) index kar liye. Jawaab dene ke liye ready hoon!`,
      tenglish: `✅ ${Object.keys(data).length} document(s) index chesanu. Samadhanam cheppadaniki ready!`,
      chatty: `✅ Indexed ${Object.keys(data).length} doc(s). Let's get it!`
    };
    this.addMessage(doneMsgs[mix] || doneMsgs.english, 'ai');
  }

  newSession() {
    this.sessionId = uuid();
    this.messages = [];
    this.elements.messages.innerHTML = '';
    this.currentMix = this.config.defaultMix || 'english';
    this.updateLangBadge(this.currentMix);
    const mix = this.currentMix;
    const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
    this.addMessage(pick(phrases), 'ai');
    this.saveCurrentSession();
  }

  saveCurrentSession() {
    this.storage.saveSession(this.sessionId, this.messages, { title: this.config.title });
  }

  loadSession(id) {
    const all = this.storage.getSessions();
    if (all[id]?.messages) {
      this.sessionId = id;
      this.messages = all[id].messages;
      this.elements.messages.innerHTML = '';
      for (const msg of this.messages) {
        this.addMessage(msg.text, msg.who === 'User' ? 'user' : 'ai', msg.meta || {});
      }
    }
  }

  toggleSessionMenu() {
    const menu = this.elements.sessionMenu;
    const all = this.storage.getSessions();
    const ids = Object.keys(all).sort((a, b) => (all[b].updatedAt || 0) - (all[a].updatedAt || 0));
    menu.innerHTML = ids.map(id => {
      const s = all[id];
      const firstUser = s.messages?.find(m => m.who === 'User')?.text?.slice(0, 30) || 'Untitled';
      const isActive = id === this.sessionId;
      return `<div class="ragina-t3-session-item ${isActive ? 'active' : ''}" data-sid="${id}">${firstUser}…<button class="ragina-t3-session-delete" data-del="${id}">🗑</button></div>`;
    }).join('');
    menu.classList.toggle('show');
    menu.querySelectorAll('.ragina-t3-session-item').forEach(el => {
      el.addEventListener('click', () => { this.loadSession(el.dataset.sid); menu.classList.remove('show'); });
    });
    menu.querySelectorAll('.ragina-t3-session-delete').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.storage.deleteSession(btn.dataset.del); this.toggleSessionMenu(); });
    });
  }

  toggleTheme() {
    const current = this.config.theme?.mode || 'dark';
    this.config.theme = { ...this.config.theme, mode: current === 'dark' ? 'light' : 'dark' };
    const old = document.getElementById('ragina-t3-styles');
    if (old) old.remove();
    this.injectStyles();
  }

  exportChat() {
    const exportData = { version: VERSION, exportedAt: new Date().toISOString(), messages: this.messages };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ragina-chat-${this.sessionId.slice(0,8)}.json`;
    a.click(); URL.revokeObjectURL(url);
    this._toast('Chat exported!');
  }

  clearMessages() {
    this.messages = [];
    this.elements.messages.innerHTML = '';
    const mix = this.currentMix;
    const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
    this.addMessage(pick(phrases), 'ai');
    this.saveCurrentSession();
  }

  regenerateMessage(row) {
    const idx = [...this.elements.messages.children].indexOf(row);
    if (idx <= 0) return;
    const userMsg = this.messages[idx - 1];
    if (userMsg?.who !== 'User') return;
    row.remove();
    this.messages = this.messages.slice(0, idx);
    this.elements.input.value = userMsg.text;
    this.handleSend();
  }

  _copyText(text) {
    navigator.clipboard.writeText(text).then(() => this._toast('Copied!'));
  }

  _toast(msg) {
    const t = document.createElement('div');
    t.className = 'ragina-t3-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }
}


/* =======================================================================
   TOOL SYSTEM
   ======================================================================= */
const tools = {};
function registerTool(name, def) { tools[name] = def; }
function unregisterTool(name) { delete tools[name]; }
function listTools() { return Object.keys(tools); }
function toolsBlock() {
  const lines = Object.entries(tools).map(([n, d]) => `- ${n}: ${d.description} | params: ${JSON.stringify(d.parameters)}`);
  return lines.length ? 'Available tools (reply TOOL_CALL:name({...}) to use one):\n' + lines.join('\n') : '';
}

function parseAgentReply(raw) {
  const text = String(raw).trim();
  const toolMatch = text.match(/^TOOL_CALL:\s*([A-Za-z0-9_]+)\((.*)\)\s*$/s);
  if (toolMatch) {
    let args = {};
    try { args = toolMatch[2].trim() ? JSON.parse(toolMatch[2]) : {}; } catch { }
    return { type: 'tool_call', name: toolMatch[1], args };
  }
  const answerMatch = text.match(/^ANSWER:\s*([\s\S]*)$/);
  if (answerMatch) return { type: 'answer', text: answerMatch[1].trim() };
  return { type: 'answer', text };
}

function buildAgentPrompt({ persona, query, contextText, history, toolLog }) {
  const historyBlock = history && history.length
    ? '\nRecent conversation:\n' + history.map(m => `${m.who}: ${m.text}`).join('\n') + '\n'
    : '';
  const contextBlock = contextText ? `\nDocument context:\n${contextText}\n` : '';
  const toolLogBlock = toolLog ? `\nTool results so far:${toolLog}\n` : '';
  return `${persona || 'You are RAGina T3, an advanced AI agent with hybrid retrieval, tool-use, and vision capabilities.'}
${toolsBlock()}
${historyBlock}${contextBlock}${toolLogBlock}
User: ${query}`;
}

async function runAgent(query, options = {}) {
  const maxSteps = options.maxSteps || 5;
  let toolLog = '';
  const stepsTaken = [];
  const llm = options.llm || new LLMClient({});

  for (let step = 1; step <= maxSteps; step++) {
    const prompt = buildAgentPrompt({
      persona: options.persona, query, contextText: options.contextText,
      history: options.history, toolLog
    });
    let raw;
    try { raw = await llm.complete(prompt, options.model); }
    catch (e) { return { answer: 'Error: ' + e.message, steps: stepsTaken }; }

    const parsed = parseAgentReply(raw);
    stepsTaken.push(parsed);
    if (options.onStep) options.onStep(parsed);

    if (parsed.type === 'answer') return { answer: parsed.text, steps: stepsTaken };

    const tool = tools[parsed.name];
    if (!tool) {
      toolLog += `\nTool "${parsed.name}" does not exist. Available: ${listTools().join(', ') || '(none)'}.`;
      continue;
    }
    let result;
    try { result = await tool.handler(parsed.args); }
    catch (e) { result = 'Error: ' + e.message; }
    toolLog += `\nResult of ${parsed.name}(${JSON.stringify(parsed.args)}): ${typeof result === 'string' ? result : JSON.stringify(result)}`;
  }
  return { answer: "I reached my step limit — could you simplify or rephrase?", steps: stepsTaken };
}

/* =======================================================================
   VOICE OUTPUT
   ======================================================================= */
function speak(text, voiceUrl, voiceId, speed) {
  if (!voiceUrl) return;
  const clean = text.replace(/[#*`\[\]_]/g, '').slice(0, 4000);
  fetch(voiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: clean, voice_id: voiceId || 'rachel', speed: speed || 1 })
  }).then(r => r.blob()).then(blob => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  }).catch(console.error);
}

/* =======================================================================
   TIER 2 + TIER 3 TOOLS
   ======================================================================= */

registerTool('webSearch', {
  description: 'Search Wikipedia and the web for facts, people, events, or any topic',
  parameters: { query: 'string, the search query' },
  handler: async ({ query }) => {
    try {
      const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=3&search=' + encodeURIComponent(query);
      const wikiRes = await fetch(wikiUrl);
      const wikiData = await wikiRes.json();
      const titles = wikiData[1] || [];
      if (titles.length === 0) {
        const ddgRes = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1');
        const ddgData = await ddgRes.json();
        if (ddgData.Abstract) {
          return { source: 'DuckDuckGo', title: ddgData.Heading || query, summary: ddgData.Abstract, url: ddgData.AbstractURL };
        }
        return { error: 'No results found for "' + query + '".' };
      }
      return { source: 'Wikipedia', results: titles.map((title, i) => ({ title, summary: wikiData[2][i] || '', url: wikiData[3][i] })) };
    } catch (e) { return { error: 'Search failed: ' + e.message }; }
  }
});

registerTool('scheduleEvent', {
  description: 'Open Google Calendar with a pre-filled event',
  parameters: { title: 'string', date: 'string like "2026-08-25" or "tomorrow"', time: 'string like "15:00" (optional)', duration: 'number minutes (default 60)', location: 'string (optional)', description: 'string (optional)' },
  handler: async ({ title, date, time, duration, location, description }) => {
    title = title || 'Event'; duration = duration || 60;
    let startDT = new Date();
    if (date) {
      if (/tomorrow/i.test(date)) { startDT.setDate(startDT.getDate() + 1); }
      else if (/today/i.test(date)) { }
      else { startDT = new Date(date + (time ? ' ' + time : '')); }
    }
    const endDT = new Date(startDT.getTime() + duration * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(title) +
      '&dates=' + fmt(startDT) + '/' + fmt(endDT) +
      (location ? '&location=' + encodeURIComponent(location) : '') +
      (description ? '&details=' + encodeURIComponent(description) : '');
    window.open(url, '_blank');
    return { success: true, title, start: startDT.toLocaleString(), end: endDT.toLocaleString() };
  }
});

registerTool('draftEmail', {
  description: 'Open the default email client with a pre-filled draft',
  parameters: { to: 'string', subject: 'string', body: 'string', cc: 'string (optional)' },
  handler: async ({ to, subject, body, cc }) => {
    let url = 'mailto:' + encodeURIComponent(to || '');
    const q = [];
    if (subject) q.push('subject=' + encodeURIComponent(subject));
    if (body) q.push('body=' + encodeURIComponent(body));
    if (cc) q.push('cc=' + encodeURIComponent(cc));
    if (q.length) url += '?' + q.join('&');
    window.open(url, '_self');
    return { success: true, to: to || '(no recipient)', subject: subject || '(no subject)' };
  }
});

registerTool('getTime', {
  description: 'Get the current local date and time',
  parameters: {},
  handler: async () => ({ time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(), iso: new Date().toISOString() })
});

registerTool('calculate', {
  description: 'Evaluate a math expression like "2 + 2 * 3" or "sqrt(144)"',
  parameters: { expression: 'string, a math expression' },
  handler: async ({ expression }) => {
    try {
      const safe = expression.replace(/[^0-9+\-*/().%\s,sqrt,pow,abs,Math]/g, '');
      const result = new Function('return ' + safe)();
      return { expression, result };
    } catch (e) { return { error: 'Invalid expression: ' + e.message }; }
  }
});

registerTool('openUrl', {
  description: 'Open a URL in a new browser tab',
  parameters: { url: 'string, the URL to open' },
  handler: async ({ url }) => { window.open(url, '_blank'); return { opened: url }; }
});

registerTool('codeRunner', {
  description: 'Execute JavaScript code safely and return the result',
  parameters: { code: 'string, JavaScript code to execute' },
  handler: async ({ code }) => {
    try {
      const fn = new Function('const console={log:(...a)=>a.join(" ")};' + code);
      const result = fn();
      return { result: result !== undefined ? result : '(no return value)' };
    } catch (e) { return { error: e.message }; }
  }
});

registerTool('generateFile', {
  description: 'Generate a downloadable file with given content (txt, json, csv, md, html)',
  parameters: { filename: 'string, e.g. report.csv', content: 'string, file contents', mimeType: 'string (optional)' },
  handler: async ({ filename, content, mimeType }) => {
    const blob = new Blob([content], { type: mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'download.txt';
    a.click(); URL.revokeObjectURL(url);
    return { success: true, filename: filename || 'download.txt', size: content.length };
  }
});

registerTool('extractFromUrl', {
  description: 'Fetch and extract text content from any URL',
  parameters: { url: 'string, URL to fetch' },
  handler: async ({ url }) => {
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
      const resp = await fetch(proxyUrl);
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const title = doc.querySelector('title')?.textContent || '';
      doc.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());
      const bodyText = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 8000);
      return { title, url, content: bodyText, length: bodyText.length };
    } catch (e) { return { error: 'Fetch failed: ' + e.message, url }; }
  }
});

registerTool('translate', {
  description: 'Translate text from one language to another',
  parameters: { text: 'string, text to translate', targetLang: 'string, target language code like "es", "fr", "de", "ja"', sourceLang: 'string (optional, default "auto")' },
  handler: async ({ text, targetLang, sourceLang }) => {
    try {
      const tl = (targetLang || 'en').toLowerCase().trim();
      const sl = (sourceLang || 'auto').toLowerCase().trim();
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.responseData?.translatedText) {
        return { original: text, translated: data.responseData.translatedText, sourceLang: data.responseData.detectedLanguage || sl, targetLang: tl };
      }
      return { error: 'Translation failed' };
    } catch (e) { return { error: 'Translation error: ' + e.message }; }
  }
});

registerTool('summarizeDoc', {
  description: 'Summarize a long document or text into key bullet points',
  parameters: { text: 'string, the document text to summarize', sentences: 'number, max summary sentences (default 3)' },
  handler: async ({ text, sentences }) => {
    const n = Math.max(1, Math.min(parseInt(sentences) || 3, 10));
    const sents = (text || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
    if (sents.length <= n) return { summary: sents.join(' '), method: 'short-doc' };
    const wordScores = {};
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    for (const w of words) wordScores[w] = (wordScores[w] || 0) + 1;
    const scored = sents.map(s => {
      const w = s.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const score = w.reduce((a, b) => a + (wordScores[b] || 0), 0) / (w.length || 1);
      return { sent: s, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, n).sort((a, b) => sents.indexOf(a.sent) - sents.indexOf(b.sent));
    return { summary: top.map(x => x.sent).join(' '), method: 'extractive-tfidf' };
  }
});

registerTool('compareDocs', {
  description: 'Compare two texts and highlight differences, similarities, and unique content',
  parameters: { docA: 'string, first document', docB: 'string, second document' },
  handler: async ({ docA, docB }) => {
    const a = (docA || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const b = (docB || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const setA = new Set(a.split(/\W+/).filter(w => w.length > 3));
    const setB = new Set(b.split(/\W+/).filter(w => w.length > 3));
    const common = [...setA].filter(w => setB.has(w));
    const onlyA = [...setA].filter(w => !setB.has(w));
    const onlyB = [...setB].filter(w => !setA.has(w));
    const jaccard = common.length / (setA.size + setB.size - common.length || 1);
    return { similarityScore: Math.round(jaccard * 100) + '%', commonWords: common.slice(0, 20), uniqueToA: onlyA.slice(0, 20), uniqueToB: onlyB.slice(0, 20) };
  }
});

registerTool('remember', {
  description: 'Store a fact, preference, or note in long-term memory for future sessions',
  parameters: { key: 'string, memory key', value: 'string, memory value', category: 'string (optional, e.g. "user", "project", "preference")' },
  handler: async ({ key, value, category }) => {
    const storage = new StorageManager();
    const ltm = storage.getLongTermMemory();
    const cat = category || 'general';
    if (!ltm[cat]) ltm[cat] = {};
    ltm[cat][key] = { value, storedAt: Date.now() };
    storage.saveLongTermMemory(ltm);
    return { success: true, key, category: cat, stored: value };
  }
});

registerTool('recall', {
  description: 'Retrieve a stored memory by key or category from long-term memory',
  parameters: { key: 'string (optional)', category: 'string (optional)', fuzzy: 'boolean (default true)' },
  handler: async ({ key, category, fuzzy }) => {
    const storage = new StorageManager();
    const ltm = storage.getLongTermMemory();
    const useFuzzy = fuzzy !== false;
    if (category && ltm[category]) {
      if (key) {
        const entries = Object.entries(ltm[category]);
        if (useFuzzy) {
          const match = entries.find(([k]) => k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase()));
          if (match) return { found: true, key: match[0], value: match[1].value };
        }
        return { found: false, category, availableKeys: Object.keys(ltm[category]) };
      }
      return { found: true, category, entries: ltm[category] };
    }
    return { found: false, memory: ltm };
  }
});

registerTool('weather', {
  description: 'Get current weather for a city using wttr.in',
  parameters: { city: 'string, city name', format: 'string (optional, "json" or "text", default "json")' },
  handler: async ({ city, format }) => {
    try {
      const url = `https://wttr.in/${encodeURIComponent(city || 'London')}?format=j1`;
      const resp = await fetch(url);
      const data = await resp.json();
      const current = data.current_condition?.[0];
      if (!current) return { error: 'Weather data unavailable.' };
      const out = { location: data.nearest_area?.[0]?.areaName?.[0]?.value || city, tempC: current.temp_C, condition: current.weatherDesc?.[0]?.value || 'Unknown', humidity: current.humidity, wind: `${current.windspeedKmph} km/h ${current.winddir16Point}` };
      if ((format || 'json').toLowerCase() === 'text') {
        return { text: `${out.location}: ${out.condition}, ${out.tempC}°C. Humidity ${out.humidity}%, wind ${out.wind}.`, ...out };
      }
      return out;
    } catch (e) { return { error: 'Weather fetch failed: ' + e.message }; }
  }
});

registerTool('stockPrice', {
  description: 'Get the latest stock price and change for a ticker symbol',
  parameters: { ticker: 'string, e.g. "AAPL", "TSLA", "MSFT"' },
  handler: async ({ ticker }) => {
    try {
      const sym = (ticker || 'AAPL').toUpperCase().trim();
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
      const resp = await fetch(url);
      const data = await resp.json();
      const result = data.chart?.result?.[0];
      if (!result) return { error: `No data for ticker "${sym}".` };
      const meta = result.meta;
      const prevClose = meta.previousClose || meta.chartPreviousClose || 0;
      const last = meta.regularMarketPrice || prevClose;
      const change = last - prevClose;
      const pct = prevClose ? ((change / prevClose) * 100).toFixed(2) : '0.00';
      return { ticker: sym, price: last.toFixed(2), currency: meta.currency || 'USD', change: change.toFixed(2), changePercent: pct + '%' };
    } catch (e) { return { error: 'Stock fetch failed: ' + e.message }; }
  }
});

registerTool('analyzeCSV', {
  description: 'Parse CSV text and return structured stats: columns, row count, numeric summaries',
  parameters: { csvText: 'string, raw CSV content', hasHeader: 'boolean (default true)' },
  handler: async ({ csvText, hasHeader }) => {
    const lines = (csvText || '').split('\n').filter(l => l.trim());
    if (lines.length === 0) return { error: 'Empty CSV.' };
    const useHeader = hasHeader !== false;
    const header = useHeader ? lines[0].split(',').map(h => h.trim()) : lines[0].split(',').map((_, i) => `col${i + 1}`);
    const rows = useHeader ? lines.slice(1) : lines;
    const parsed = rows.map(r => {
      const cols = []; let inQuotes = false, val = '';
      for (const ch of r) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === ',' && !inQuotes) { cols.push(val.trim()); val = ''; continue; }
        val += ch;
      }
      cols.push(val.trim());
      return cols;
    });
    const stats = {};
    for (let i = 0; i < header.length; i++) {
      const vals = parsed.map(r => r[i]).filter(v => v !== undefined && v !== '');
      const nums = vals.map(v => parseFloat(v)).filter(n => !isNaN(n));
      stats[header[i]] = { nonEmpty: vals.length, numericCount: nums.length, min: nums.length ? Math.min(...nums) : null, max: nums.length ? Math.max(...nums) : null, avg: nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null, sample: vals.slice(0, 3) };
    }
    return { columns: header, rowCount: parsed.length, stats };
  }
});

registerTool('createChart', {
  description: 'Generate a simple HTML chart (bar, line, pie) from data and open it in a new tab',
  parameters: { type: 'string, "bar", "line", or "pie"', labels: 'array of strings', data: 'array of numbers', title: 'string (optional)', colors: 'array of strings (optional)' },
  handler: async ({ type, labels, data, title, colors }) => {
    const chartType = ['bar', 'line', 'pie'].includes(type) ? type : 'bar';
    const lbls = Array.isArray(labels) ? labels : [];
    const vals = Array.isArray(data) ? data : [];
    const defaultColors = ['#6C63FF', '#00BFA6', '#F50057', '#FFAB00', '#2979FF', '#00E676', '#FF5252', '#651FFF'];
    const cols = Array.isArray(colors) ? colors : defaultColors;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Chart'}</title><script src="https://cdn.jsdelivr.net/npm/chart.js"></script><style>body{background:#0f0f1a;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif}.container{width:90vw;max-width:800px;background:#1a1a2e;padding:24px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5)}h2{color:#ddd;text-align:center}</style></head><body><div class="container"><h2>${title || 'Chart'}</h2><canvas id="c"></canvas></div><script>new Chart(document.getElementById('c'),{type:'${chartType}',data:{labels:${JSON.stringify(lbls)},datasets:[{data:${JSON.stringify(vals)},backgroundColor:${JSON.stringify(cols)}}]},options:{responsive:true,plugins:{legend:{labels:{color:'#ddd'}}},scales:{${chartType !== 'pie' ? 'y:{grid:{color:"#333"},ticks:{color:"#ddd"}},x:{grid:{color:"#333"},ticks:{color:"#ddd"}}' : ''}}}});</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return { success: true, chartType };
  }
});

/* =======================================================================
   TIER 3 VISION TOOLS
   ======================================================================= */
registerTool('readGesture', {
  description: 'Detect the current hand gesture from the camera (thumbs_up, thumbs_down, peace, pointing, open_palm, fist, ok, call_me, etc.)',
  parameters: {},
  handler: async () => {
    const vision = window.RAGina?._visionEngine;
    if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
    const report = vision.getReport();
    return {
      gesture: report.gesture || 'none detected',
      handCount: report.handCount,
      recentGestures: report.recentGestures,
      note: report.gesture ? `Detected: ${report.gesture}` : 'No clear gesture detected. Try thumbs up, peace sign, or open palm.'
    };
  }
});

registerTool('readExpression', {
  description: 'Analyze the facial expression from the camera (happy, sad, surprised, angry, neutral, sleepy)',
  parameters: {},
  handler: async () => {
    const vision = window.RAGina?._visionEngine;
    if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
    const report = vision.getReport();
    return {
      expression: report.expression || 'none detected',
      faceCount: report.faceCount,
      gaze: report.gaze,
      note: report.expression ? `Current expression: ${report.expression}` : 'No face detected. Make sure you are visible to the camera.'
    };
  }
});

registerTool('describeScene', {
  description: 'Capture a frame from the camera and describe what is visible. Requires vision to be active.',
  parameters: { detail: 'string (optional, "low", "medium", "high")' },
  handler: async ({ detail }) => {
    const vision = window.RAGina?._visionEngine;
    if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
    const frame = vision.captureFrame();
    if (!frame) return { error: 'Could not capture frame.' };
    return {
      captured: true,
      frameSize: frame.length,
      detail: detail || 'medium',
      note: 'Frame captured successfully. In a full implementation, this would be sent to a vision API (GPT-4o Vision, Gemini, etc.) for description. For now, here is what I can tell you from my local analysis:',
      facesDetected: vision.lastFaces.length,
      handsDetected: vision.lastHands.length,
      currentExpression: vision.getDominantExpression() || 'unknown',
      currentGesture: vision.lastHands.find(h => h.gesture !== 'unknown')?.gesture || 'none'
    };
  }
});

registerTool('countPeople', {
  description: 'Count how many faces are currently visible in the camera',
  parameters: {},
  handler: async () => {
    const vision = window.RAGina?._visionEngine;
    if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
    const report = vision.getReport();
    return {
      faceCount: report.faceCount,
      note: report.faceCount === 0 ? 'No faces detected.' : `I can see ${report.faceCount} face(s) right now.`
    };
  }
});

registerTool('checkAttention', {
  description: 'Check if the user is looking at the camera (engaged) or looking away',
  parameters: {},
  handler: async () => {
    const vision = window.RAGina?._visionEngine;
    if (!vision || !vision.isActive) return { error: 'Vision is not active. Enable camera first.' };
    const gaze = vision.lastFaces[0]?.gaze || 'unknown';
    return {
      gaze,
      isLookingAtCamera: gaze === 'center',
      note: gaze === 'center' ? 'The user is looking directly at me.' :
            gaze === 'unknown' ? 'Cannot determine gaze direction.' :
            `The user is looking ${gaze}.`
    };
  }
});

/* =======================================================================
   PUBLIC API
   ======================================================================= */
const RAGina = {
  engine: null, ui: null, config: {}, storage: null, events: null, vision: null, langEngine: null,
  version: VERSION,

  init(userConfig = {}) {
    this.config = deepMerge({
      indexUrl: null, position: 'bottom-right', placeholder: 'Ask me anything...',
      topK: 5, model: 'gpt-4o-mini',
      avatarUrl: 'https://ragina-crawler-ragina.vercel.app/ragina-logo.png',
      bubbleIcon: null, title: 'RAGina T3', personality: 'sassy',
      theme: { primary: '#6C63FF', mode: 'dark' }, chunkSize: 200,
      voiceEnabled: false, voiceUrl: null, voiceId: 'rachel', voiceSpeed: 1,
      showWidget: true, streaming: true, markdown: true,
      apiUrl: API_URL, streamUrl: STREAM_URL,
      semanticWeight: 0.5, embedDim: 128,
      apiKey: '',
      proactiveVision: true,
      gestureActions: true,
      autoDetectLang: true,
      defaultMix: 'english'
    }, userConfig);

    this.storage = new StorageManager();
    this.events = new EventBus();
    this.engine = new HybridRetrievalEngine({
      chunkSize: this.config.chunkSize,
      semanticWeight: this.config.semanticWeight,
      embedDim: this.config.embedDim
    });
    this.vision = new VisionEngine({
      proactiveComments: this.config.proactiveVision,
      gestureActions: this.config.gestureActions
    });
    this._visionEngine = this.vision;
    this.langEngine = new LanguageEngine({
      defaultMix: this.config.defaultMix,
      autoDetect: this.config.autoDetectLang
    });

    const buildUI = () => {
      if (this.config.showWidget) {
        this.ui = new ChatWidget(this.engine, this.config, this.storage, this.events, this.vision, this.langEngine);
        this.ui.build();
      }
    };

    if (window.__RAGINA_INDEX__ && typeof window.__RAGINA_INDEX__ === 'object' && Object.keys(window.__RAGINA_INDEX__).length) {
      this.engine.buildIndex(window.__RAGINA_INDEX__);
      buildUI(); if (this.ui) this.ui.show();
      return;
    }
    if (this.config.indexUrl) {
      fetch(this.config.indexUrl).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => { this.engine.buildIndex(data); buildUI(); if (this.ui) this.ui.show(); })
        .catch(err => { console.warn('RAGina: could not load index from URL.', err.message); buildUI(); });
    } else {
      buildUI();
    }
  },

  loadData(data) {
    if (!this.engine) this.engine = new HybridRetrievalEngine({ chunkSize: this.config.chunkSize || 200 });
    this.engine.buildIndex(data);
    if (this.ui) {
      this.ui.elements.messages.innerHTML = '';
      this.ui.elements.input.disabled = false;
      if (this.ui.elements.sendBtn) this.ui.elements.sendBtn.disabled = false;
      const mix = this.ui.currentMix;
      const phrases = PHRASES.ready[mix] || PHRASES.ready.english;
      this.ui.addMessage(pick(phrases), 'ai');
    } else if (this.config.showWidget !== false) {
      this.ui = new ChatWidget(this.engine, this.config, this.storage || new StorageManager(), this.events || new EventBus(), this.vision, this.langEngine);
      this.ui.build(); this.ui.show();
    }
  },

  async loadFolder(fileList) {
    const files = [...fileList];
    const data = {};
    for (const file of files) {
      try {
        const parsed = await DocumentParser.parse(file);
        data[file.webkitRelativePath || file.name] = parsed;
      } catch (e) { console.warn('Parse error:', e); }
    }
    this.loadData(data);
  },

  getEngine() { return this.engine; },
  ask(text) { if (this.ui) { this.ui.elements.input.value = text; this.ui.handleSend(); } },
  on(event, fn) { return this.events.on(event, fn); },
  off(event, fn) { this.events.off(event, fn); },
  emit(event, data) { this.events.emit(event, data); },

  registerTool, unregisterTool, listTools,

  async query(text, options = {}) {
    let contextText = options.contextText;
    if (contextText === undefined && this.engine?.isReady) {
      const query = this.engine.expandQuery ? this.engine.expandQuery(text) : text;
      const chunks = this.engine.retrieve(query, options.topK || this.config.topK || 5);
      contextText = chunks.length ? chunks.map((c, i) => `[${i + 1}] ${c.source}\n${c.text}`).join('\n\n') : '';
    }
    return runAgent(text, { ...options, contextText, llm: new LLMClient({ apiUrl: this.config.apiUrl, apiKey: this.config.apiKey }) });
  }
};

// Static helper for copy code
window.RAGina = window.RAGina || {};
window.RAGina._copyCode = function(btn) {
  const code = btn.closest('.ragina-t3-code-block').querySelector('code');
  navigator.clipboard.writeText(code.textContent).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = '\ud83d\udccb Copy', 1500);
  });
};

// Expose global
if (typeof window !== 'undefined') window.RAGina = RAGina;
if (typeof globalThis !== 'undefined') globalThis.RAGina = RAGina;
