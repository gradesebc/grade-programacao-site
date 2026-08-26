/*!
 * Sistema de Grade — EBC / TV Brasil
 * Autor e desenvolvedor: Henrique Rude ("HDut")
 * Núcleo de regras: grade, recorrências, episódios, vigências e conflitos.
 * A autoria acompanha os dados exportados (campo `authoredBy`) e as cópias de segurança.
 */
(() => {
  'use strict';
  const VERSION = 6;
  const AUTHOR = 'Henrique Rude (HDut)';
  const AUTHOR_HANDLE = 'HDut';
  const BOOTSTRAP_ADMIN_EMAILS = new Set(['francisco.mauro@ebc.com.br']);
  const LIMITS = Object.freeze({
    workbookBytes:8*1024*1024,workbookRows:20000,workbookSheets:20,episodesPerProgram:5000,
    globalCatalog:20000,channelCatalog:10000,rules:10000,occurrences:50000,
    exceptions:50000,skipRanges:5000,colorGroups:500,users:1000,artworkBytes:8*1024*1024,jsonNodes:300000,jsonDepth:14,stringLength:50000
  });
  const CHANNELS = {
    tv_brasil:{name:'TV Brasil',slug:'tv_brasil',positive:'assets/logos/tv-brasil-positiva.svg',negative:'assets/logos/tv-brasil-negativa.svg'},
    tv_brasil_internacional:{name:'TV Brasil Internacional',slug:'tv_brasil_internacional',positive:'assets/logos/tv-brasil-internacional-positiva.svg',negative:'assets/logos/tv-brasil-internacional-negativa.svg'},
    gov:{name:'Canal Gov',slug:'canal_gov',positive:'assets/logos/gov-positiva.svg',negative:'assets/logos/gov-negativa.svg'}
  };
  const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const DAY_INDEX = {Seg:0,Ter:1,Qua:2,Qui:3,Sex:4,Sáb:5,Dom:6};
  const FILTERS = [
    {id:'live',label:'Ao vivo'},{id:'recorded',label:'Gravado'},{id:'rerun',label:'Reprise'},
    {id:'own',label:'Produção própria'},{id:'independent',label:'Independente'},
    {id:'licensed',label:'Licenciado'},{id:'news',label:'Jornalismo'},{id:'institutional',label:'Institucional'}
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,9);
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const titleKey = value => String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  // Chave usada SO para decidir se duas linhas da planilha sao a mesma obra. Ignora
  // pontuacao porque quem preenche a planilha escreve o mesmo programa de formas
  // diferentes: "O SHOW DA LUNA" e "O SHOW DA LUNA!" sao temporadas do mesmo desenho,
  // e sem isto entravam como dois cadastros separados.
  // Nao substitui titleKey: aquele alimenta o programId, e mexer nele trocaria o
  // identificador de todos os programas ja cadastrados.
  const mergeTitleKey = value => titleKey(value).replace(/[^a-z0-9]+/g,' ').trim();
  const stableHash = value => {let hash=2166136261;for(const char of String(value??'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(36);};
  const slug = value => normalize(value).replace(/\s+/g,'_') || 'sem_identificacao';
  const isoDate = date => {
    const d = date instanceof Date ? date : new Date(date);
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const parseLocalDate = value => {
    if(value instanceof Date) return new Date(value.getFullYear(),value.getMonth(),value.getDate());
    const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1],+m[2]-1,+m[3]) : new Date(value);
  };
  const addDays = (value,days) => { const d=parseLocalDate(value); d.setDate(d.getDate()+days); return d; };
  const startOfWeek = value => { const d=parseLocalDate(value||new Date()); const weekday=d.getDay(); d.setDate(d.getDate()-(weekday===0?6:weekday-1)); return d; };
  const minutes = time => { const m=String(time||'00:00').match(/(\d{1,2}):(\d{2})/); return m ? +m[1]*60 + +m[2] : 0; };
  const opMinutes = time => (minutes(time) - 360 + 1440) % 1440;
  const timeFromMinutes = total => {
    const real = ((total % 1440) + 1440) % 1440;
    return String(Math.floor(real/60)).padStart(2,'0')+':'+String(real%60).padStart(2,'0');
  };
  const timeFromOpMinutes = opMin => timeFromMinutes(opMin + 360);
  const formatDate = (value,options={}) => parseLocalDate(value).toLocaleDateString('pt-BR',options);
  function printSegments(items,date,fromSlot=0,toSlot=96){
    const first=Math.max(0,Math.min(95,Math.floor(+fromSlot||0))),last=Math.max(first+1,Math.min(96,Math.ceil(+toSlot||96))),fromMinute=first*15,toMinute=last*15,starts=new Map();
    const previousDate=isoDate(addDays(date,-1));
    (items||[]).filter(item=>item.date===date||item.date===previousDate).map(item=>{
      const dayOffset=item.date===date?0:-1440;
      const originalStart=opMinutes(item.start)+dayOffset,duration=Math.max(1,+item.duration||30),originalEnd=originalStart+duration;
      if(originalEnd<=fromMinute||originalStart>=toMinute)return null;
      const clippedStart=Math.max(fromMinute,originalStart),clippedEnd=Math.min(toMinute,originalEnd),slot=Math.max(first,Math.floor(clippedStart/15)),endSlot=Math.min(last,Math.ceil(clippedEnd/15));
      return {item,slot,span:Math.max(1,endSlot-slot),continuesBefore:originalStart<fromMinute,continuesAfter:originalEnd>toMinute,originalStart,originalEnd};
    }).filter(Boolean).sort((a,b)=>a.slot-b.slot||a.originalStart-b.originalStart||b.span-a.span).forEach(segment=>{if(!starts.has(segment.slot))starts.set(segment.slot,segment);});
    return starts;
  }
  // Duas células só se fundem quando mostram exatamente a mesma coisa.
  // É isso que separa os dois casos: um programa ao vivo repete idêntico de terça a
  // sexta e vira uma faixa única; uma série muda de episódio a cada dia, o conteúdo
  // difere, e as células continuam separadas — senão o PDF apagaria a numeração.
  function printMergeKey(segment){
    const item=segment?.item||{};
    return [
      String(item.title||''),String(item.season||''),String(item.episodeNumber||''),String(item.episodeTitle||''),
      item.type==='live'?'live':(item.isRerun?'rerun':''),
      segment?.span,segment?.continuesBefore?1:0,segment?.continuesAfter?1:0
    ].join('');
  }
  // Monta a semana impressa já resolvida: onde cada célula começa, quantas linhas
  // ocupa (duração) e quantas colunas ocupa (dias iguais em sequência). Função pura,
  // sem DOM, para poder ser testada de verdade.
  function printWeekLayout(items,weekStart,fromSlot=0,toSlot=96){
    const first=Math.max(0,Math.min(95,Math.floor(+fromSlot||0))),last=Math.max(first+1,Math.min(96,Math.ceil(+toSlot||96)));
    const porDia=DAYS.map((_,index)=>printSegments(items,isoDate(addDays(weekStart,index)),first,last));
    const starts=new Map(),covered=new Set(),pos=(slot,day)=>slot+':'+day;
    for(let slot=first;slot<last;slot++){
      for(let day=0;day<7;day++){
        if(covered.has(pos(slot,day)))continue;
        const segment=porDia[day].get(slot);if(!segment)continue;
        const chave=printMergeKey(segment);
        let colSpan=1;
        while(day+colSpan<7&&!covered.has(pos(slot,day+colSpan))){
          const vizinho=porDia[day+colSpan].get(slot);
          if(!vizinho||printMergeKey(vizinho)!==chave)break;
          colSpan++;
        }
        starts.set(pos(slot,day),{segment,rowSpan:segment.span,colSpan});
        for(let linha=0;linha<segment.span;linha++)for(let coluna=0;coluna<colSpan;coluna++){
          if(!linha&&!coluna)continue;
          covered.add(pos(slot+linha,day+coluna));
        }
        day+=colSpan-1;
      }
    }
    return {starts,covered};
  }
  const DEFAULT_COLOR_GROUPS = [
    {id:'color_licensed',name:'Licenciamento',match:'licensed',background:'#FFFFFF',text:'#12203A',accent:'#2E6AC2'},
    {id:'color_rncp',name:'RNCP',match:'rncp',background:'#3B4658',text:'#FFFFFF',accent:'#0B1A3C'},
    {id:'color_own',name:'Produção própria',match:'own',background:'#BEEBD4',text:'#123B2B',accent:'#08794C'},
    {id:'color_live',name:'Ao vivo',match:'live',background:'#FFE48F',text:'#392C00',accent:'#D53E16'},
    {id:'color_independent',name:'Produção independente',match:'independent',background:'#FFD6A1',text:'#4B2800',accent:'#E86B02'},
    {id:'color_news',name:'Jornalismo',match:'news',background:'#D9E9FF',text:'#0B1A3C',accent:'#2E6AC2'},
    {id:'color_institutional',name:'Institucional',match:'institutional',background:'#FFD7C2',text:'#5A1C0A',accent:'#CF301A'},
    {id:'color_rerun',name:'Reprise',match:'rerun',background:'#E0E0E0',text:'#252B35',accent:'#6F6F6E'}
  ];
  const defaultColorGroups = () => clone(DEFAULT_COLOR_GROUPS);
  const defaultPreferences = () => ({programArtworkEnabled:true,programArtworkOpacity:14,tmdbApiKey:''});
  const emptyChannel = () => ({catalog:[],rules:[],occurrences:[],exceptions:[],skipRanges:[],updatedAt:null});
  const emptyState = () => ({
    schemaVersion:VERSION,globalCatalog:[],channels:Object.fromEntries(Object.keys(CHANNELS).map(id=>[id,emptyChannel()])),
    colorGroups:defaultColorGroups(),imports:[],audit:[],users:{},preferences:defaultPreferences(),backups:[],updatedAt:new Date().toISOString()
  });
  let state = emptyState();
  let session = {user:null,email:'',role:'Operador',channel:localStorage.getItem('tv_canal_ativo')||'',dirty:new Set()};
  let dbPromise = null;
  const gradeUndo = new Map();

  function profileFor(email=session.email){
    const key=String(email||'').toLowerCase()||normalize(session.user);
    return state.users?.[key]||null;
  }
  function isAdmin(){return profileFor()?.role==='Administrador';}
  function allowedChannelIds(){
    if(isAdmin())return Object.keys(CHANNELS);
    return (profileFor()?.channels||[]).filter(id=>CHANNELS[id]);
  }
  function requireSignedIn(){
    if(!session.email)throw new Error('Entre com uma conta Microsoft autorizada.');
  }
  function requireAdmin(){
    requireSignedIn();if(!isAdmin())throw new Error('Somente administradores podem executar esta operacao.');
  }
  function requireChannelAccess(channel=session.channel){
    requireSignedIn();if(!channel||!CHANNELS[channel])throw new Error('Selecione um canal valido.');
    if(!allowedChannelIds().includes(channel))throw new Error('Seu perfil nao tem acesso a este canal.');
  }
  function sessionSnapshot(){
    return Object.freeze({user:session.user,email:session.email,role:isAdmin()?'Administrador':'Operador',channel:session.channel,dirty:new Set(session.dirty),dirtyCount:session.dirty.size});
  }
  function stateSnapshot(){
    requireSignedIn();if(isAdmin())return clone(state);
    const channels=Object.fromEntries(allowedChannelIds().map(id=>[id,clone(state.channels[id])]));
    return {schemaVersion:VERSION,globalCatalog:clone(state.globalCatalog),channels,colorGroups:clone(state.colorGroups),imports:clone(state.imports.filter(item=>item.channel===session.channel)),audit:clone(state.audit.filter(item=>item.channel===session.channel)),users:profileFor()?{[session.email]:clone(profileFor())}:{},preferences:clone(state.preferences),backups:[],updatedAt:state.updatedAt};
  }
  function getUserProfile(email=session.email){const profile=profileFor(email);return profile?clone(profile):null;}
  function dirtyScopes(){return [...session.dirty];}
  function hasDirty(){return session.dirty.size>0;}
  function consumeDirtyScopes(){const scopes=[...session.dirty];session.dirty.clear();return scopes;}
  function restoreDirtyScopes(scopes){(scopes||[]).forEach(scope=>session.dirty.add(scope));}

  function assertSafeTree(value,label='dados',depth=0,counter={count:0}){
    if(depth>LIMITS.jsonDepth)throw new Error(label+' excede a profundidade permitida.');
    if(++counter.count>LIMITS.jsonNodes)throw new Error(label+' excede a quantidade de itens permitida.');
    if(typeof value==='string'&&value.length>LIMITS.stringLength)throw new Error(label+' contem um texto grande demais.');
    if(value===null||typeof value!=='object')return true;
    if(Array.isArray(value)){for(const item of value)assertSafeTree(item,label,depth+1,counter);return true;}
    const proto=Object.getPrototypeOf(value),plain=proto===null||Object.prototype.toString.call(value)==='[object Object]';if(!plain)throw new Error(label+' possui uma estrutura invalida.');
    for(const key of Object.keys(value)){
      if(key==='__proto__'||key==='prototype'||key==='constructor')throw new Error(label+' contem uma chave nao permitida.');
      assertSafeTree(value[key],label,depth+1,counter);
    }
    return true;
  }
  function requireArray(value,name,max){
    if(!Array.isArray(value))throw new Error(name+' precisa ser uma lista.');
    if(value.length>max)throw new Error(name+' excede o limite de '+max+' registros.');
    return value;
  }
  function validateChannelData(input){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Os dados do canal sao invalidos.');
    assertSafeTree(input,'Dados do canal');
    return {
      catalog:clone(requireArray(input.catalog||[],'Catalogo do canal',LIMITS.channelCatalog)),
      rules:clone(requireArray(input.rules||[],'Regras',LIMITS.rules)),
      occurrences:clone(requireArray(input.occurrences||[],'Exibicoes',LIMITS.occurrences)),
      exceptions:clone(requireArray(input.exceptions||[],'Excecoes',LIMITS.exceptions)),
      skipRanges:clone(requireArray(input.skipRanges||[],'Periodos limpos',LIMITS.skipRanges)),
      updatedAt:typeof input.updatedAt==='string'?input.updatedAt:null
    };
  }
  function validateGlobalData(remote){
    if(!remote||typeof remote!=='object'||Array.isArray(remote)||+remote.schemaVersion!==VERSION)throw new Error('Arquivo global incompatível.');
    assertSafeTree(remote,'Dados globais');
    requireArray(remote.globalCatalog||[],'Catalogo global',LIMITS.globalCatalog);
    requireArray(remote.colorGroups||[],'Grupos de cores',LIMITS.colorGroups);
    requireArray(remote.imports||[],'Importacoes',100);
    requireArray(remote.audit||[],'Auditoria',600);
    if(!remote.users||typeof remote.users!=='object'||Array.isArray(remote.users)||Object.keys(remote.users).length>LIMITS.users)throw new Error('Lista de usuarios invalida.');
    return true;
  }

  function openDb(){
    if(dbPromise) return dbPromise;
    if(typeof indexedDB==='undefined')return Promise.resolve(null);
    dbPromise = new Promise(resolve=>{
      const request=indexedDB.open('ebc-grade-v6',1);
      request.onupgradeneeded=()=>{ const db=request.result; if(!db.objectStoreNames.contains('state')) db.createObjectStore('state'); };
      let settled=false;const finish=value=>{if(settled)return;settled=true;clearTimeout(timeout);resolve(value);};
      const timeout=setTimeout(()=>finish(null),3000);
      request.onsuccess=()=>finish(request.result);request.onerror=()=>finish(null);request.onblocked=()=>finish(null);
    });
    return dbPromise;
  }
  async function cacheGet(key){
    try{const db=await openDb();if(!db)return null;return await new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly');const req=tx.objectStore('state').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}catch(_){return null;}
  }
  async function cachePut(key,value){
    try{const db=await openDb();if(!db)return;await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(clone(value),key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch(err){console.warn('Cache local indisponível',err);}
  }
  function stateCacheKey(){
    requireSignedIn();return 'state:'+session.email;
  }
  async function purgeForeignCaches(){
    const active=stateCacheKey();
    try{
      const db=await openDb();if(!db)return;
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),request=store.openCursor();
        request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;const key=String(cursor.key||'');if(key==='state'||(key.startsWith('state:')&&key!==active))cursor.delete();cursor.continue();};
        request.onerror=()=>reject(request.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
    }catch(err){console.warn('Nao foi possivel isolar o cache local',err);}
  }
  async function clearLocalData(){
    state=emptyState();session={user:null,email:'',role:'Operador',channel:'',dirty:new Set()};
    gradeUndo.clear();
    ['tv_canal_ativo','tv_user','tv_user_email','tv_perfil'].forEach(key=>localStorage.removeItem(key));
    try{const db=await openDb();if(db)await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch(err){console.warn('Nao foi possivel limpar o cache local',err);}
  }
  function emit(type,detail={}){window.dispatchEvent(new CustomEvent(type,{detail}));}
  function persist(scope='channel'){
    state.updatedAt=new Date().toISOString(); session.dirty.add(scope==='channel'&&session.channel?'channel:'+session.channel:scope);
    cachePut(stateCacheKey(),state); emit('ebc:data-changed',{scope,channel:session.channel});
  }
  function audit(action,detail='',scope='channel'){
    state.audit.unshift({id:uid('audit'),at:new Date().toISOString(),user:session.user||'Usuário',email:session.email,channel:session.channel,action,detail});
    state.audit=state.audit.slice(0,600); persist(scope);
  }
  function gradeUndoSnapshot(channel=session.channel){
    const source=state.channels[channel]||emptyChannel();
    return clone({rules:source.rules,occurrences:source.occurrences,exceptions:source.exceptions,skipRanges:source.skipRanges,updatedAt:source.updatedAt});
  }
  function captureGradeUndo(label){
    if(!session.channel||!state.channels[session.channel])return;
    const stack=gradeUndo.get(session.channel)||[];
    stack.push({label:String(label||'Alteração da grade'),at:new Date().toISOString(),data:gradeUndoSnapshot()});
    gradeUndo.set(session.channel,stack.slice(-20));
  }
  function canUndoGrade(channel=session.channel){return !!channel&&!!gradeUndo.get(channel)?.length;}
  function undoLastGradeChange(){
    requireChannelAccess();const stack=gradeUndo.get(session.channel)||[],entry=stack.pop();
    if(!entry)throw new Error('Não há outra alteração da grade para desfazer nesta sessão.');
    const channel=currentChannel();channel.rules=clone(entry.data.rules||[]);channel.occurrences=clone(entry.data.occurrences||[]);channel.exceptions=clone(entry.data.exceptions||[]);channel.skipRanges=clone(entry.data.skipRanges||[]);channel.updatedAt=entry.data.updatedAt||null;
    gradeUndo.set(session.channel,stack);audit('Alteração da grade desfeita',entry.label);return {label:entry.label,at:entry.at};
  }
  function programId(title,season='',contract=''){const source=[title,season,contract].join('|');return 'program_'+slug(source)+'_'+stableHash(titleKey(source));}
  function normalizeSubgroups(value){
    const source=Array.isArray(value)?value:String(value||'').split(/[;,|]/);const unique=new Map();
    source.forEach(entry=>{const text=String(entry||'').trim().slice(0,80),key=normalize(text);if(text&&key&&!unique.has(key))unique.set(key,text);});
    return [...unique.values()].slice(0,30);
  }
  function normalizeArtwork(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const directUrl=String(value.url||value.image_url||value.imageUrl||'').trim();
    if(directUrl&&/^https:\/\/[^\s"'<>]{1,1900}$/i.test(directUrl))return {url:directUrl,source:String(value.source||'catalog').slice(0,60),updatedAt:String(value.updatedAt||'').slice(0,40)};
    const fileName=String(value.fileName||'').trim();if(!/^[a-z0-9][a-z0-9._-]{0,180}\.webp$/i.test(fileName))return null;
    return {fileName,mimeType:'image/webp',size:Math.max(0,Math.min(1024*1024,+value.size||0)),opacity:Math.max(.06,Math.min(.24,+value.opacity||.14)),updatedAt:String(value.updatedAt||'').slice(0,40)};
  }
  function episodeModeFor(program){
    const explicit=String(program?.episodeMode||'').trim();
    if(['none','continuous','catalog'].includes(explicit))return explicit;
    const hasEpisodes=(program?.seasons||[]).some(season=>(season.episodes||[]).length||+season.episodeCount>0);
    if(hasEpisodes)return 'catalog';
    if(program?.continuous&&program?.type!=='live'&&program?.origin!=='news')return 'continuous';
    return 'none';
  }
  function enrichEpisodeTitles(programs){
    let changed=0;
    const source=typeof window!=='undefined'&&window.TVBRASIL_EPISODE_TITLES&&typeof window.TVBRASIL_EPISODE_TITLES==='object'?window.TVBRASIL_EPISODE_TITLES:{};
    const lookup=new Map(Object.entries(source).map(([title,record])=>[titleKey(title),record]));
    (programs||[]).forEach(program=>{
      const record=lookup.get(titleKey(program.title));if(!record)return;
      (program.seasons||[]).forEach(season=>{
        const list=record.seasons?.[String(season.number||'')]||[];if(!list.length)return;
        (season.episodes||[]).forEach((episode,index)=>{
          if(String(episode.title||'').trim())return;
          const numeric=Number.parseInt(String(episode.number||''),10);
          const title=list[Number.isFinite(numeric)&&numeric>0?numeric-1:index];
          if(title){episode.title=title;changed++;}
        });
      });
    });
    return changed;
  }
  function normalizeProgramOrigin(value){
    const text=normalize(value);if(!text)return'licensed';if(text.includes('producao propria')||text==='own')return'own';if(text.includes('independente')||text.includes('rncp')||text==='independent')return'independent';if(text.includes('jornal')||text==='news')return'news';if(text.includes('institucional')||text.includes('eleitoral')||text==='institutional')return'institutional';return'licensed';
  }
  function normalizeProgramType(value){const text=normalize(value);if(text.includes('ao vivo')||text==='live')return'live';if(text.includes('misto')||text==='mixed')return'mixed';if(text.includes('gravado')||text==='recorded')return'recorded';return'unspecified';}
  function ensureState(input){
    const next={...emptyState(),...(input||{})}; next.schemaVersion=VERSION;
    next.channels=next.channels||{};
    Object.keys(CHANNELS).forEach(id=>{next.channels[id]={...emptyChannel(),...(next.channels[id]||{})};});
    ['globalCatalog','imports','audit','backups'].forEach(k=>{if(!Array.isArray(next[k]))next[k]=[];});
    if(!Array.isArray(next.colorGroups))next.colorGroups=defaultColorGroups();
    next.users=next.users||{};const incomingPreferences=next.preferences&&typeof next.preferences==='object'&&!Array.isArray(next.preferences)?next.preferences:{};next.preferences={...defaultPreferences(),...incomingPreferences};next.preferences.programArtworkEnabled=next.preferences.programArtworkEnabled!==false;next.preferences.programArtworkOpacity=Math.max(5,Math.min(90,+next.preferences.programArtworkOpacity||14));enrichEpisodeTitles(next.globalCatalog);Object.values(next.channels).forEach(channel=>enrichEpisodeTitles(channel.catalog));return next;
  }
  function normalizeRating(value){
    let text=String(value||'').trim();if(!text)return '';
    // A planilha guarda a classificacao como referencia de anexo do Notion, no formato
    // "attachment:<uuid>:12_anos.png". O uuid tem numeros que enganam a leitura: um que
    // comeca com "18" fazia um programa de 12 anos ser gravado como 18 anos — erro grave
    // de classificacao indicativa numa grade de TV publica. Por isso lemos so o nome do
    // arquivo, e se a referencia nao trouxer nome util preferimos nao classificar a chutar.
    const arquivo=text.match(/([^:/\\?#]+)\.(?:png|jpe?g|svg|webp|gif)(?:[?#].*)?$/i);
    if(arquivo)text=arquivo[1];
    else if(/^attachment:/i.test(text)||/^https?:\/\//i.test(text))return '';
    if(/livre/i.test(text))return 'Livre';
    // O numero precisa vir acompanhado de "anos" (ou de "classificacao"), senao um
    // arquivo chamado "imagem_2025-10-16_134607708" viraria classificacao de 16 anos
    // por causa da data. Um valor digitado a mao que seja so o numero tambem vale.
    const idade=(text.match(/(\d{1,2})\s*[_-]?\s*anos/i)
      ||text.match(/classifica[cç][aã]o[\s_-]*(\d{1,2})/i)
      ||text.match(/^\s*(\d{1,2})\s*$/)||[])[1];
    return ['18','16','14','12','10','6'].includes(idade)?idade+'_anos':'';
  }
  function normalizeLegacyProgram(row,sourceRow=0){
    const get=(...names)=>{
      const entries=Object.entries(row||{}).map(([k,v])=>[normalize(k),v]);
      const preenchido=([,v])=>String(v??'').trim();
      // Primeira passada: nome EXATO da coluna. Antes bastava a coluna CONTER o nome
      // procurado, e isso fazia get('ID') casar com "EMPRESA / DISTRIBUIDOR" — porque
      // "distribuidor" contem "id". O resultado era o programa receber a distribuidora
      // como identificador, e 32 obras da mesma produtora colidirem num id so: ao
      // importar, uma sobrescrevia a outra e a maioria simplesmente sumia.
      for(const name of names){const n=normalize(name);const achado=entries.find(([k,v])=>k===n&&preenchido([k,v]));if(achado)return achado[1];}
      // Segunda passada: correspondencia parcial, util para variacoes como
      // "DURACAO TOTAL (MIN)". Nomes muito curtos ficam de fora justamente porque
      // sao os que produzem falso positivo dentro de palavras maiores.
      for(const name of names){
        const n=normalize(name);
        if(n.length<4)continue;
        const achado=entries.find(([k,v])=>k.includes(n)&&preenchido([k,v]));
        if(achado)return achado[1];
      }
      return '';
    };
    const title=String(get('OBRA AUDIOVISUAL','NOME DA OBRA','PROGRAMA','OBRA','TÍTULO')||'').trim();
    const externalId=String(get('ID','PROGRAMA_ID')||'').trim();
    const seasonRaw=String(get('TEMPORADA','TEMPORADAS')||'').trim();
    const season=/^não seriada?$/i.test(seasonRaw)||/^sem temporadas?$/i.test(seasonRaw)?'':seasonRaw;
    const duration=Math.max(1,Math.min(1440,parseInt(String(get('MINUTOS POR EP','DURAÇÃO','DURACAO','MINUTOS')||'').replace(/\D/g,''),10)||30));
    const count=Math.max(0,Math.min(LIMITS.episodesPerProgram,parseInt(String(get('Nº EPISÓDIOS','EPISÓDIOS','EPISODIOS','EPS')||'').replace(/\D/g,''),10)||0));
    const expiry=normalizeDate(get('FIM VIGÊNCIA','FIM VIGENCIA','DATA FINAL DE VIGÊNCIA','VALIDADE'));
    const limitRaw=String(get('Nº DE EXIBIÇÕES','N DE EXIBICOES','LIMITE DE EXIBIÇÕES')||'').trim();
    const limit=/ILIMIT|SEM RESTRI/i.test(limitRaw)?null:(parseInt(limitRaw.replace(/\D/g,''),10)||null);
    const contract=String(get('CONTRATO','Nº CONTRATO','NUMERO DO CONTRATO')||'').trim();
    const colorGroupName=String(get('GRUPO_COR','GRUPO DE COR','COR DO PROGRAMA')||'').trim(),colorGroupId=(state.colorGroups||[]).find(group=>normalize(group.name)===normalize(colorGroupName))?.id||'';
    const artworkFile=String(get('IMAGEM','IMAGEM DE FUNDO','ARTE')||'').trim();
    const artwork=artworkFile.startsWith('http')?{url:artworkFile,opacity:.14}:normalizeArtwork({fileName:artworkFile,size:0,opacity:.14,updatedAt:''});
    const originRaw=get('ORIGEM','TIPO DE PRODUÇÃO','TIPO DE PRODUCAO','PROCEDÊNCIA','PROCEDENCIA'),origin=normalizeProgramOrigin(originRaw);
    const categoryRaw=get('CATEGORIA','GÊNERO','GENERO','CLASSIFICAÇÃO DE CONTEÚDO','CLASSIFICACAO DE CONTEUDO'),category=String(categoryRaw||'').trim().slice(0,200);
    const subgroupsRaw=get('SUBGRUPOS','SUBGRUPO','ETIQUETAS','TAGS'),subgroups=normalizeSubgroups(subgroupsRaw);
    const cl=normalizeRating(get('CL','CLASSIFICAÇÃO INDICATIVA','CLASSIFICACAO INDICATIVA','CLASSIFICACAO','FAIXA ETÁRIA'));
    const distributor=String(get('EMPRESA / DISTRIBUIDORA','EMPRESA','DISTRIBUIDORA')||'').trim();
    const targetAudience=String(get('PÚBLICO-ALVO','PUBLICO-ALVO','PÚBLICO ALVO','PUBLICO ALVO')||'').trim();
    const countryOfOrigin=String(get('PAÍS DE ORIGEM','PAIS DE ORIGEM')||'').trim();
    const suggestedSlot=String(get('FAIXA SUGERIDA','FAIXA')||'').trim();
    const startsAt=normalizeDate(get('INÍCIO VIGÊNCIA','INICIO VIGENCIA','DATA INICIAL DE VIGÊNCIA'));
    const processNumber=String(get('Nº PROCESSO','N PROCESSO','PROCESSO')||'').trim(),tvWindow=String(get('JANELA VT','JANELA DE TV')||'').trim(),ott=String(get('OTT')||'').trim(),territory=String(get('TERRITÓRIO','TERRITORIO')||'').trim(),ottEpisodeLimit=String(get('Nº EPS OTT','N EPS OTT')||'').trim(),periodDays=String(get('PERÍODO DIAS','PERIODO DIAS')||'').trim();
    const status=String(get('STATUS')||'').trim(),nationality=String(get('NACIONALIDADE')||'').trim(),stateOfOrigin=String(get('UF','ESTADO')||'').trim(),cityOfOrigin=String(get('CIDADE')||'').trim(),directorate=String(get('DIRETORIA')||'').trim(),contentFormat=String(get('FORMATO')||'').trim(),productionYear=String(get('ANO DE PRODUÇÃO','ANO DE PRODUCAO')||'').trim(),deliveryExpected=normalizeDate(get('ENTREGA PREVISTA')),exhibitedAt=normalizeDate(get('EXIBIÇÃO EM:','EXIBIÇÃO EM','EXIBICAO EM')),expiryStatus=String(get('VENCIDO POR')||'').trim(),totalDuration=Math.max(0,parseInt(String(get('DURAÇÃO TOTAL','DURACAO TOTAL')||'').replace(/\D/g,''),10)||0);
    const rightData={id:uid('right'),processNumber,contract,tvWindow,ott,territory,ottEpisodeLimit,periodDays,startsAt,endsAt:expiry,exhibitionLimit:limit,rerunsCount:true,channels:Object.keys(CHANNELS),season:season||'',sourceRow};
    const hasRight=Object.entries(rightData).some(([key,value])=>!['id','channels','rerunsCount','season','sourceRow'].includes(key)&&value!==''&&value!==null);
    const seasonId=season?'season_'+slug(title)+'_'+slug(season):'';

    return {
      id:externalId||programId(title),title,scope:'global',type:normalizeProgramType(get('TIPO')),origin,category,subgroups,
      cl,status,distributor,targetAudience,nationality,countryOfOrigin,stateOfOrigin,cityOfOrigin,directorate,contentFormat,suggestedSlot,productionYear,deliveryExpected,exhibitedAt,expiryStatus,totalDuration,
      colorGroupId,artwork,defaultDuration:duration,episodeMode:season?'catalog':'none',continuous:false,episodeCounter:1,
      seasons:season?[{id:seasonId,number:season,title:'Temporada '+season,order:1,episodeCount:count,totalDuration,productionYear,status,distributor,targetAudience,cl,nationality,countryOfOrigin,stateOfOrigin,cityOfOrigin,directorate,contentFormat,suggestedSlot,deliveryExpected,exhibitedAt,sourceRow,sourceRows:[clone(row)],sourceRowNumbers:sourceRow?[sourceRow]:[],sourceConflicts:[],episodes:count?Array.from({length:count},(_,i)=>({id:'episode_'+slug(title)+'_'+slug(season)+'_'+(i+1),number:i+1,title:'',duration,status:'available'})):[]}]:[],
      rights:hasRight?[rightData]:[],raw:clone(row),sourceRows:[clone(row)],sourceRowNumbers:sourceRow?[sourceRow]:[],sourceConflicts:[],
      importFields:{origin:!!String(originRaw||'').trim(),type:!!String(get('TIPO')||'').trim(),category:!!String(categoryRaw||'').trim(),subgroups:!!String(subgroupsRaw||'').trim(),colorGroup:!!colorGroupName,artwork:!!artwork},updatedAt:new Date().toISOString()
    };
  }
  function normalizeDate(value){
    if(value instanceof Date&&!isNaN(value))return isoDate(value);const text=String(value??'').trim();if(!text)return '';
    if(/^\d{4}-\d{2}-\d{2}/.test(text))return text.slice(0,10);let m=text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);if(m){const year=m[3].length===2?String(2000+(+m[3])):m[3];return year+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');}
    if(/^\d{4,5}(\.\d+)?$/.test(text)){const d=new Date(Date.UTC(1899,11,30)+Math.floor(+text)*86400000);return d.toISOString().slice(0,10);}return text;
  }
  function migrateLegacyGrade(channel,target){
    let saved=localStorage.getItem('ebc_grade_data_'+channel);
    if(!saved&&channel==='tv_brasil')saved=localStorage.getItem('tv_grade_data');
    if(!saved)return 0;let grades={};try{grades=JSON.parse(saved)||{};}catch(_){return 0;}let count=0;
    Object.entries(grades).forEach(([week,items])=>(items||[]).forEach(item=>{
      const date=isoDate(addDays(week,DAY_INDEX[item.dia]??0));
      target.occurrences.push({id:'legacy_'+channel+'_'+String(item.id||uid('old')),channel,date,start:item.hora||'00:00',duration:+item.dur||30,programId:'',title:item.obra||'Programa',episodeNumber:item.ep||'',episodeTitle:item.subtit||'',season:item.temp||'',type:item.isRepr?'rerun':(normalize(item.cat).includes('ao vivo')?'live':'recorded'),origin:legacyOrigin(item.cat),category:item.cat||'',isRerun:!!item.isRepr,source:'migration'});
      count++;
    }));return count;
  }
  function legacyOrigin(category){const n=normalize(category);if(n.includes('producao propria'))return'own';if(n.includes('rncp')||n.includes('independente'))return'independent';if(n.includes('jornal'))return'news';if(n.includes('institucional')||n.includes('eleitoral'))return'institutional';return'licensed';}
  async function init(identity){
    if(identity)setUser(identity,{bootstrap:false});requireSignedIn();await purgeForeignCaches();
    const cached=await cacheGet(stateCacheKey());if(cached?.schemaVersion===VERSION){state=ensureState(cached);return state;}
    state=emptyState();let legacy=[];try{legacy=JSON.parse(localStorage.getItem('tv_catalogo_data')||'[]')||[];}catch(_){}
    state.globalCatalog=legacy.map(normalizeLegacyProgram).filter(p=>p.title);
    let migrated=state.globalCatalog.length;Object.keys(CHANNELS).forEach(id=>{migrated+=migrateLegacyGrade(id,state.channels[id]);});
    if(migrated)audit('Migração concluída',migrated+' registros convertidos da versão anterior.','global');else await cachePut(stateCacheKey(),state);
    return state;
  }
  function setUser(identity,{bootstrap=false}={}){
    const previousEmail=String(localStorage.getItem('tv_user_email')||'').toLowerCase();
    session.user=identity?.nome||identity?.name||identity?.email||'Usuário';session.email=String(identity?.email||'').trim().toLowerCase();
    requireSignedIn();
    if(previousEmail&&previousEmail!==session.email){
      state=emptyState();session.channel='';session.dirty.clear();localStorage.removeItem('tv_canal_ativo');cachePut(stateCacheKey(),state);
    }
    const key=session.email,canBootstrap=bootstrap&&!Object.keys(state.users).length&&BOOTSTRAP_ADMIN_EMAILS.has(key);
    if(canBootstrap){
      state.users[key]={name:session.user,email:session.email,role:'Administrador',channels:Object.keys(CHANNELS)};
      persist('global');
    }
    const profile=profileFor();session.role=profile?.role==='Administrador'?'Administrador':'Operador';
    if(session.channel&&!allowedChannelIds().includes(session.channel)){session.channel='';localStorage.removeItem('tv_canal_ativo');}
    localStorage.setItem('tv_user',session.user);localStorage.setItem('tv_user_email',session.email);localStorage.setItem('tv_perfil',session.role);
    return sessionSnapshot();
  }
  function setChannel(channel){requireChannelAccess(channel);session.channel=channel;localStorage.setItem('tv_canal_ativo',channel);return channel;}
  function currentChannel(){return state.channels[session.channel]||emptyChannel();}
  function getCatalog(scope='all'){
    requireSignedIn();if(scope!=='global')requireChannelAccess();
    const global=state.globalCatalog.map(p=>({...p,scope:'global'}));const local=currentChannel().catalog.map(p=>({...p,scope:'channel'}));
    if(scope==='global')return global;if(scope==='channel')return local;const map=new Map(global.map(p=>[p.id,p]));local.forEach(p=>map.set(p.id,{...(map.get(p.id)||{}),...p,scope:'channel'}));return [...map.values()];
  }
  function saveProgram(program,scope='global'){
    if(scope==='global')requireAdmin();else requireChannelAccess();
    assertSafeTree(program,'Programa');const title=String(program?.title||'').trim().slice(0,300);if(!title)throw new Error('Informe o nome do programa.');const seasons=requireArray(program.seasons||[],'Temporadas',500),episodeTotal=seasons.reduce((sum,season)=>sum+requireArray(season?.episodes||[],'Episodios',LIMITS.episodesPerProgram).length,0);if(episodeTotal>LIMITS.episodesPerProgram)throw new Error('O programa excede o limite de '+LIMITS.episodesPerProgram+' episodios.');
    const list=scope==='channel'?currentChannel().catalog:state.globalCatalog,limit=scope==='channel'?LIMITS.channelCatalog:LIMITS.globalCatalog;const validTypes=['live','recorded','mixed','unspecified'],validOrigins=['own','independent','licensed','news','institutional'],episodeMode=episodeModeFor(program);const item={...clone(program),title,id:program.id||programId(title,program.seasons?.[0]?.number||''),scope,type:validTypes.includes(program.type)?program.type:'unspecified',origin:validOrigins.includes(program.origin)?program.origin:'licensed',category:String(program.category||'').trim().slice(0,200),subgroups:normalizeSubgroups(program.subgroups),cl:normalizeRating(program.cl),distributor:String(program.distributor||'').trim(),targetAudience:String(program.targetAudience||'').trim(),countryOfOrigin:String(program.countryOfOrigin||'').trim(),suggestedSlot:String(program.suggestedSlot||'').trim(),colorGroupId:String(program.colorGroupId||'').trim(),artwork:normalizeArtwork(program.artwork),defaultDuration:Math.max(1,Math.min(1440,+program.defaultDuration||30)),episodeMode,continuous:episodeMode==='continuous',seasons:episodeMode==='catalog'?seasons:[],updatedAt:new Date().toISOString()};enrichEpisodeTitles([item]);const index=list.findIndex(p=>p.id===item.id);if(index<0&&list.length>=limit)throw new Error('O catalogo atingiu o limite de '+limit+' programas.');if(index>=0)list[index]=item;else list.push(item);audit(index>=0?'Programa atualizado':'Programa cadastrado',item.title,scope==='global'?'global':'channel');return clone(item);
  }
  function bulkUpdatePrograms(refs,changes={},options={}){
    requireArray(refs,'Programas selecionados',LIMITS.globalCatalog+LIMITS.channelCatalog);if(!refs.length)throw new Error('Selecione pelo menos um programa.');assertSafeTree(changes,'Alteracoes em lote');
    const validTypes=['live','recorded','mixed','unspecified'],validOrigins=['own','independent','licensed','news','institutional'],mode=['replace','add','remove'].includes(options.subgroupMode)?options.subgroupMode:'replace',propagate=options.propagate!==false,today=isoDate(new Date()),affectedChannels=new Set(),touchedScopes=new Set();let changed=0;
    const patchProgram=program=>{const next={...program};if(Object.prototype.hasOwnProperty.call(changes,'type'))next.type=validTypes.includes(changes.type)?changes.type:'unspecified';if(Object.prototype.hasOwnProperty.call(changes,'origin'))next.origin=validOrigins.includes(changes.origin)?changes.origin:'licensed';if(Object.prototype.hasOwnProperty.call(changes,'category'))next.category=String(changes.category||'').trim().slice(0,200);if(Object.prototype.hasOwnProperty.call(changes,'colorGroupId'))next.colorGroupId=String(changes.colorGroupId||'').trim();if(Object.prototype.hasOwnProperty.call(changes,'subgroups')){const incoming=normalizeSubgroups(changes.subgroups),current=normalizeSubgroups(next.subgroups);if(mode==='add')next.subgroups=normalizeSubgroups([...current,...incoming]);else if(mode==='remove'){const removing=new Set(incoming.map(normalize));next.subgroups=current.filter(item=>!removing.has(normalize(item)));}else next.subgroups=incoming;}next.updatedAt=new Date().toISOString();return next;};
    refs.forEach(ref=>{const scope=ref?.scope==='channel'?'channel':'global';if(scope==='global')requireAdmin();else requireChannelAccess();const list=scope==='global'?state.globalCatalog:currentChannel().catalog,index=list.findIndex(program=>program.id===ref.id);if(index<0)return;list[index]=patchProgram(list[index]);changed++;touchedScopes.add(scope==='global'?'global':'channel:'+session.channel);
      if(propagate){Object.entries(state.channels).forEach(([channelId,channel])=>{if(scope==='channel'&&channelId!==session.channel)return;let channelChanged=false;(channel.rules||[]).forEach(item=>{if(item.programId!==ref.id)return;if(Object.prototype.hasOwnProperty.call(changes,'origin'))item.origin=list[index].origin;if(Object.prototype.hasOwnProperty.call(changes,'category'))item.category=list[index].category;if(Object.prototype.hasOwnProperty.call(changes,'colorGroupId'))item.colorGroupId=list[index].colorGroupId;channelChanged=true;});(channel.occurrences||[]).forEach(item=>{if(item.programId!==ref.id||item.date<today)return;if(Object.prototype.hasOwnProperty.call(changes,'origin'))item.origin=list[index].origin;if(Object.prototype.hasOwnProperty.call(changes,'category'))item.category=list[index].category;if(Object.prototype.hasOwnProperty.call(changes,'colorGroupId'))item.colorGroupId=list[index].colorGroupId;channelChanged=true;});if(channelChanged)affectedChannels.add(channelId);});}
    });
    if(!changed)throw new Error('Nenhum programa editavel foi encontrado.');state.audit.unshift({id:uid('audit'),at:new Date().toISOString(),user:session.user||'Usuário',email:session.email,channel:session.channel,action:'Programas atualizados em lote',detail:changed+' programa(s) · '+[...touchedScopes].join(', ')});state.audit=state.audit.slice(0,600);affectedChannels.forEach(channel=>touchedScopes.add('channel:'+channel));touchedScopes.forEach(persist);return {changed,channels:[...affectedChannels]};
  }
  function getColorGroups(){requireSignedIn();return clone(state.colorGroups||[]);}
  function getPreferences(){requireSignedIn();return clone({...defaultPreferences(),...(state.preferences||{})});}
  function savePreferences(changes={}){
    requireAdmin();assertSafeTree(changes,'Preferencias');const next={...defaultPreferences(),...(state.preferences||{})};
    if(Object.prototype.hasOwnProperty.call(changes,'programArtworkEnabled'))next.programArtworkEnabled=changes.programArtworkEnabled!==false;
    if(Object.prototype.hasOwnProperty.call(changes,'programArtworkOpacity'))next.programArtworkOpacity=Math.max(5,Math.min(90,+changes.programArtworkOpacity||14));
    // Chave do TMDB: fica aqui, no OneDrive, e nunca no repositorio. Aceita so o
    // formato de chave (hex ou token) para nao virar campo de texto livre.
    if(Object.prototype.hasOwnProperty.call(changes,'tmdbApiKey')){
      const bruta=String(changes.tmdbApiKey||'').trim();
      next.tmdbApiKey=/^[A-Za-z0-9._-]{0,200}$/.test(bruta)?bruta:'';
    }
    state.preferences=next;audit('Preferências de exibição atualizadas','Imagens '+(next.programArtworkEnabled?'ativadas':'desativadas')+' · opacidade '+next.programArtworkOpacity+'%','global');return clone(next);
  }
  function normalizeColor(value,fallback){const text=String(value||'').trim().toUpperCase();return /^#[0-9A-F]{6}$/.test(text)?text:fallback;}
  function colorLuminance(hex){const values=normalizeColor(hex,'#FFFFFF').slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.03928?value/12.92:Math.pow((value+.055)/1.055,2.4));return .2126*values[0]+.7152*values[1]+.0722*values[2];}
  function colorContrast(a,b){const x=colorLuminance(a),y=colorLuminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function deriveColorPalette(background='#FFFFFF',licensed=false){
    if(licensed)return {background:'#FFFFFF',text:'#12203A',accent:'#2E6AC2',contrast:colorContrast('#FFFFFF','#12203A')};
    const bg=normalizeColor(background,'#FFFFFF'),rgb=bg.slice(1).match(/../g).map(value=>parseInt(value,16)),accent='#'+rgb.map(value=>Math.max(0,Math.min(255,Math.round(value*.55))).toString(16).padStart(2,'0')).join('').toUpperCase();
    const candidates=['#111827','#FFFFFF'],text=candidates.sort((a,b)=>colorContrast(bg,b)-colorContrast(bg,a))[0];
    return {background:bg,text,accent,contrast:colorContrast(bg,text)};
  }
  function saveColorGroup(group){
    requireAdmin();
    const name=String(group?.name||'').trim();if(!name)throw new Error('Informe o nome do grupo de cor.');
    const id=group.id||uid('color'),match=['licensed','rncp','own','live','independent','news','institutional','rerun'].includes(group.match)?group.match:'';
    if(state.colorGroups.some(item=>item.id!==id&&normalize(item.name)===normalize(name)))throw new Error('Já existe um grupo de cor com esse nome.');
    if(match&&state.colorGroups.some(item=>item.id!==id&&item.match===match))throw new Error('Essa aplicação automática já está vinculada a outro grupo.');
    const palette=deriveColorPalette(group.background,id==='color_licensed'||match==='licensed');
    const item={id,name,match,...palette,updatedAt:new Date().toISOString()};delete item.contrast;
    const index=state.colorGroups.findIndex(entry=>entry.id===id);if(index>=0)state.colorGroups[index]=item;else state.colorGroups.push(item);audit(index>=0?'Grupo de cor atualizado':'Grupo de cor criado',name,'global');return clone(item);
  }
  function colorGroupUsage(id){let count=state.globalCatalog.filter(program=>program.colorGroupId===id).length;Object.values(state.channels).forEach(channel=>{count+=(channel.catalog||[]).filter(program=>program.colorGroupId===id).length;});return count;}
  function removeColorGroup(id){requireAdmin();const index=state.colorGroups.findIndex(group=>group.id===id);if(index<0)return 0;const [group]=state.colorGroups.splice(index,1);let affected=0;const clear=list=>(list||[]).forEach(program=>{if(program.colorGroupId===id){program.colorGroupId='';affected++;}});clear(state.globalCatalog);Object.values(state.channels).forEach(channel=>clear(channel.catalog));audit('Grupo de cor excluído',group.name+' · '+affected+' programa(s) voltaram para a cor automática.','global');return affected;}
  function removeProgram(id,scope){if(scope==='global')requireAdmin();else requireChannelAccess();const list=scope==='channel'?currentChannel().catalog:state.globalCatalog;const index=list.findIndex(p=>p.id===id);if(index<0)return false;const [item]=list.splice(index,1);audit('Programa removido',item.title,scope==='global'?'global':'channel');return true;}
  function episodeSequence(program,selectedSeasons=[]){
    const seasons=(program?.seasons||[]).filter(s=>!selectedSeasons.length||selectedSeasons.map(String).includes(String(s.id))||selectedSeasons.map(String).includes(String(s.number)));
    return seasons.sort((a,b)=>(+a.order||+a.number||0)-(+b.order||+b.number||0)).flatMap(s=>(s.episodes||[]).sort((a,b)=>(+a.number||0)-(+b.number||0)).map(e=>({...e,season:s.number||s.title||''})));
  }
  // Posição da sequência em que a regra começa a contar. Guardamos o id do episódio
  // para o ponto de partida sobreviver a reordenações do catálogo.
  function sequenceStartOffset(rule,sequence){
    if(!sequence.length)return 0;
    if(rule?.startEpisodeId){const found=sequence.findIndex(episode=>String(episode.id)===String(rule.startEpisodeId));if(found>=0)return found;}
    return Math.max(0,Math.min(sequence.length-1,(+rule?.startEpisodeIndex||1)-1));
  }
  function primaryDatesUntil(rule,endDate){
    const start=parseLocalDate(rule.startsAt);const end=parseLocalDate(endDate);const dates=[];let cursor=start;let guard=0;
    while(cursor<=end&&guard++<40000){const day=DAYS[(cursor.getDay()+6)%7];if((rule.weekdays||[]).includes(day))dates.push(isoDate(cursor));cursor=addDays(cursor,1);}return dates;
  }
  function skipped(channel,date){return (channel.skipRanges||[]).some(range=>date>=range.start&&date<=range.end);}
  function weekdayOf(date){return DAYS[(parseLocalDate(date).getDay()+6)%7];}
  // Agenda de horários ocupados indexada por dia operacional, para descobrir rapidamente
  // se uma data da regra já está tomada por outro programa.
  function busyIndex(){
    const map=new Map(),bounds=(date,start,duration)=>{const s=operationalAbsoluteStart(date,start),e=s+Math.max(1,Math.min(1440,+duration||30));return [s,e,Math.floor(s/1440),Math.floor((e-1)/1440)];};
    return {
      add(date,start,duration){const [s,e,first,last]=bounds(date,start,duration);for(let day=first;day<=last;day++){if(!map.has(day))map.set(day,[]);map.get(day).push({start:s,end:e});}},
      free(date,start,duration){const [s,e,first,last]=bounds(date,start,duration);for(let day=first;day<=last;day++){const list=map.get(day);if(list&&list.some(slot=>s<slot.end&&e>slot.start))return false;}return true;}
    };
  }
  // Um ciclo de filmes tem metragens diferentes: 75, 150, 110 minutos. Quando o episódio
  // traz a sua própria duração, ela vence o slot da regra.
  // Cuidado com o modelo de dados: o formulário grava a duração do episódio já preenchida
  // com o padrão do programa quando o campo fica vazio. Então "ter duração" não basta —
  // só tratamos como deliberada a duração que DIFERE do padrão do programa. Assim as
  // grades antigas, em que todos os episódios herdaram o mesmo número, seguem intactas.
  function episodeDuration(episode,program){
    const propria=Math.max(0,+episode?.duration||0),padrao=Math.max(0,+program?.defaultDuration||0);
    return propria&&propria!==padrao?Math.min(1440,propria):0;
  }
  function ruleOccurrence(rule,date,index,program){
    const sequence=episodeSequence(program,rule.selectedSeasons||[]);const cycles=Math.max(1,+rule.cycles||1);const limit=sequence.length?sequence.length*cycles:Infinity;
    if(rule.endMode==='cycles'&&index>=limit)return null;if(rule.endsAt&&date>rule.endsAt)return null;
    const mode=rule.episodeMode||episodeModeFor(program),offset=sequenceStartOffset(rule,sequence),episode=mode==='catalog'&&sequence.length?sequence[(index+offset)%sequence.length]:null;const number=episode?.number||(mode==='continuous'?(+rule.startEpisode||1)+index:'');
    return {id:'gen_'+rule.id+'_'+date,ruleId:rule.id,channel:rule.channel,date,occurrenceDate:date,occurrenceKind:'primary',start:rule.start,duration:episodeDuration(episode,program)||+rule.duration||program?.defaultDuration||30,programId:rule.programId,title:rule.title||program?.title||'Programa',season:episode?.season||rule.season||'',episodeId:episode?.id||'',episodeNumber:number,episodeTitle:episode?.title||'',type:rule.type||program?.type||'recorded',origin:rule.origin||program?.origin||'licensed',category:rule.category||program?.category||'',isRerun:false,source:'rule'};
  }
  function occurrenceAnchorDate(item){return item?.occurrenceDate||item?.date||'';}
  function occurrenceKind(item){return item?.occurrenceKind||(item?.isRerun?'rerun':'primary');}
  function sameOccurrence(a,b){
    if(!a||!b)return false;if((a.source==='manual'||a.source==='migration'||!a.ruleId)&&(b.source==='manual'||b.source==='migration'||!b.ruleId))return !!a.id&&a.id===b.id;
    return !!a.ruleId&&a.ruleId===b.ruleId&&occurrenceAnchorDate(a)===occurrenceAnchorDate(b)&&occurrenceKind(a)===occurrenceKind(b);
  }
  function applyException(item,exceptions){
    const anchor=occurrenceAnchorDate(item),kind=occurrenceKind(item),ex=[...(exceptions||[])].reverse().find(e=>e.ruleId===item.ruleId&&e.date===anchor&&(!e.occurrenceKind||e.occurrenceKind===kind));
    if(!ex)return item;if(ex.action==='cancel')return null;return {...item,...clone(ex.changes||{}),occurrenceDate:anchor,occurrenceKind:kind,id:item.id+'_exception',exceptionId:ex.id};
  }
  function upsertOccurrenceException(item,action,changes={}){
    const channel=currentChannel(),anchor=occurrenceAnchorDate(item),kind=occurrenceKind(item);let ex=item.exceptionId&&channel.exceptions.find(entry=>entry.id===item.exceptionId);
    if(!ex)ex=[...channel.exceptions].reverse().find(entry=>entry.ruleId===item.ruleId&&entry.date===anchor&&(!entry.occurrenceKind||entry.occurrenceKind===kind));
    if(ex){ex.action=action;ex.changes=action==='change'?clone(changes):{};ex.date=anchor;ex.occurrenceKind=kind;return ex;}
    ex={id:uid('exception'),ruleId:item.ruleId,date:anchor,occurrenceKind:kind,action};if(action==='change')ex.changes=clone(changes);channel.exceptions.push(ex);return ex;
  }
  // Reprise por dia da semana: cada dia marcado vira a PROXIMA data daquele dia
  // depois da exibicao principal, dentro de sete dias. "Reprise no sabado" quer
  // dizer o sabado seguinte, nao um sabado qualquer do calendario. Devolve tambem
  // o deslocamento, que o gerador usa para decidir sobre os dias da regra.
  function rerunWeekdayDates(primaryDate,weekdays){
    const datas=[];
    for(let passo=1;passo<=7;passo++){
      const data=isoDate(addDays(primaryDate,passo));
      if(weekdays.includes(weekdayOf(data)))datas.push({data,offset:passo});
    }
    return datas;
  }
  function getOccurrences(channelId,from,to){
    requireChannelAccess(channelId);
    const channel=state.channels[channelId]||emptyChannel();const catalogMap=new Map(getCatalog().map(p=>[p.id,p]));const result=channel.occurrences.filter(o=>o.date>=from&&o.date<=to).map(clone);
    // As exibições avulsas têm prioridade: a recorrência se acomoda em volta delas.
    const busy=busyIndex();(channel.occurrences||[]).forEach(item=>busy.add(item.date,item.start,item.duration));
    channel.rules.filter(r=>r.active!==false&&r.startsAt<=to&&(!r.endsAt||r.endsAt>=from)).forEach(rule=>{
      const program=catalogMap.get(rule.programId),movedAnchors=channel.exceptions.filter(ex=>ex.ruleId===rule.id&&ex.action==='change'&&ex.changes?.date>=from&&ex.changes?.date<=to).map(ex=>ex.date).filter(Boolean),generationTo=[to,...movedAnchors].sort().at(-1),dates=primaryDatesUntil(rule,generationTo);
      const rerunsFollowWeekdays=rule.rerunsAnyDay!==true;
      // aired conta só os dias que realmente foram ao ar: um dia ocupado não gasta episódio,
      // ele simplesmente escorrega para o próximo dia válido da regra.
      let aired=0;
      dates.forEach(date=>{
        if(skipped(channel,date))return;
        const basePrimary=ruleOccurrence(rule,date,aired,program);if(!basePrimary)return;
        if(!busy.free(date,basePrimary.start,basePrimary.duration))return;
        busy.add(date,basePrimary.start,basePrimary.duration);aired++;
        const primary=applyException(basePrimary,channel.exceptions);if(primary&&primary.date>=from&&primary.date<=to)result.push(primary);
        (rule.reruns||[]).forEach((rerun,rIndex)=>{
          // Dias marcados a mao mandam: quem escolheu "sábado e domingo" quer o sábado
          // e o domingo seguintes, mesmo que a exibição principal não passe nesses dias.
          // Sem dias marcados, vale o deslocamento de sempre — regra antiga não muda.
          const escolhidos=(rerun.weekdays||[]).filter(Boolean);
          const datas=escolhidos.length?rerunWeekdayDates(date,escolhidos)
            :[{data:isoDate(addDays(date,+rerun.dayOffset||0)),offset:+rerun.dayOffset||0}];
          datas.forEach((alvo,dIndex)=>{
            const rerunDate=alvo.data,offset=alvo.offset;
            if(skipped(channel,rerunDate))return;
            // Sem dias marcados, a reprise nunca cai num dia que a regra não contempla
            // (era assim que a sexta virava sábado).
            if(!escolhidos.length&&offset&&rerunsFollowWeekdays&&!(rule.weekdays||[]).includes(weekdayOf(rerunDate)))return;
            const rerunStart=rerun.start||basePrimary.start;if(!busy.free(rerunDate,rerunStart,basePrimary.duration))return;
            busy.add(rerunDate,rerunStart,basePrimary.duration);
            // O sufixo só aparece quando há vários dias: assim o id das regras antigas
            // continua exatamente o mesmo de antes.
            const marca='gen_'+rule.id+'_'+date+'_rerun_'+rIndex+(escolhidos.length?'_'+dIndex:'');
            let copy={...basePrimary,id:marca,date:rerunDate,occurrenceDate:rerunDate,start:rerunStart,type:'rerun',category:'Reprise',isRerun:true,originalDate:date,occurrenceKind:'rerun'};
            copy=applyException(copy,channel.exceptions);if(copy&&copy.date>=from&&copy.date<=to)result.push(copy);
          });
        });
      });
    });
    return result.sort((a,b)=>a.date.localeCompare(b.date)||minutes(a.start)-minutes(b.start));
  }
  function getWeek(channel,week){const start=isoDate(startOfWeek(week));return getOccurrences(channel,start,isoDate(addDays(start,6)));}
  function conflicts(items){
    const found=[];const timeline=(items||[]).map(item=>{const start=operationalAbsoluteStart(item.date,item.start),duration=Math.max(1,Math.min(1440,+item.duration||30));return {item,start,end:start+duration};}).sort((a,b)=>a.start-b.start||a.end-b.end);
    for(let i=0;i<timeline.length;i++)for(let j=i+1;j<timeline.length;j++){const a=timeline[i],b=timeline[j];if(b.start>=a.end)break;found.push({a:a.item,b:b.item,date:a.item.date});}
    return found;
  }
  function operationalDayValue(value){const parsed=parseLocalDate(value);return parsed?Math.floor(Date.UTC(parsed.getFullYear(),parsed.getMonth(),parsed.getDate())/86400000):0;}
  function operationalAbsoluteStart(date,start){return operationalDayValue(date)*1440+opMinutes(start);}
  function findNearestAvailableSlot(item,date,start,duration=item?.duration||30){
    requireChannelAccess();if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(start||'')))throw new Error('A data ou o horário de destino é inválido.');
    const requestedOp=Math.max(0,Math.min(1425,Math.round(opMinutes(start)/15)*15)),safeDuration=Math.max(1,Math.min(1440,+duration||30));
    const others=getOccurrences(session.channel,isoDate(addDays(date,-1)),isoDate(addDays(date,1))).filter(other=>!sameOccurrence(other,item));
    const intervals=others.map(other=>{const absolute=operationalAbsoluteStart(other.date,other.start);return {start:absolute,end:absolute+Math.max(1,Math.min(1440,+other.duration||30))};});
    const isFree=op=>{const absolute=operationalAbsoluteStart(date,timeFromOpMinutes(op)),end=absolute+safeDuration;return intervals.every(interval=>end<=interval.start||absolute>=interval.end);};
    if(isFree(requestedOp))return {date,start:timeFromOpMinutes(requestedOp),adjusted:false,requestedStart:timeFromOpMinutes(requestedOp)};
    const requestedAbsolute=operationalAbsoluteStart(date,timeFromOpMinutes(requestedOp)),originalAbsolute=operationalAbsoluteStart(item?.date||date,item?.start||start),preferredDirection=requestedAbsolute>=originalAbsolute?1:-1;
    for(let distance=15;distance<=1425;distance+=15){
      const candidates=[requestedOp+distance*preferredDirection,requestedOp-distance*preferredDirection];
      for(const op of candidates)if(op>=0&&op<=1425&&isFree(op))return {date,start:timeFromOpMinutes(op),adjusted:true,requestedStart:timeFromOpMinutes(requestedOp)};
    }
    throw new Error('Não há espaço livre suficiente neste dia para esse programa.');
  }
  function validateRule(rule){
    assertSafeTree(rule,'Regra');if(currentChannel().rules.length>=LIMITS.rules&&!rule.id)throw new Error('O canal atingiu o limite de regras recorrentes.');
    if(!rule.programId&&!rule.title)throw new Error('Escolha um programa.');if(!rule.startsAt||!rule.start)throw new Error('Informe data e horário.');if(!(rule.weekdays||[]).length)throw new Error('Escolha pelo menos um dia da semana.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(rule.startsAt))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(rule.start)))throw new Error('A data ou o horario da regra e invalido.');
    if(rule.endMode==='date'&&!rule.endsAt)throw new Error('Informe a data de término da recorrência.');
    const testState=clone(currentChannel().rules);const candidate={...rule,id:rule.id||uid('rule'),channel:session.channel,selectedSeasons:Array.isArray(rule.selectedSeasons)?rule.selectedSeasons.map(String):[]};currentChannel().rules=[...testState.filter(r=>r.id!==candidate.id),candidate];
    // Dias já ocupados são pulados silenciosamente pelo gerador; só recusamos a regra
    // quando ela não consegue ir ao ar em nenhum dia dos próximos 90.
    const end=isoDate(addDays(candidate.startsAt,90));let airings=0;
    try{airings=getOccurrences(session.channel,candidate.startsAt,end).filter(item=>item.ruleId===candidate.id).length;}finally{currentChannel().rules=testState;}
    if(!airings)throw new Error('Nenhum dia dessa recorrência está livre nos próximos 90 dias. Ajuste o horário, a duração ou os dias escolhidos.');return candidate;
  }
  function saveRule(rule){requireChannelAccess();const candidate=validateRule(rule);const list=currentChannel().rules;const index=list.findIndex(r=>r.id===candidate.id);captureGradeUndo(index>=0?'Editar regra recorrente':'Criar regra recorrente');if(index>=0)list[index]=candidate;else list.push(candidate);audit(index>=0?'Regra atualizada':'Programação recorrente criada',candidate.title||getCatalog().find(p=>p.id===candidate.programId)?.title||'Programa');return candidate;}
  function saveOccurrence(item,control={}){
    requireChannelAccess();
    assertSafeTree(item,'Exibicao');if(!/^\d{4}-\d{2}-\d{2}$/.test(String(item?.date||''))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(item?.start||'')))throw new Error('A data ou o horario da exibicao e invalido.');
    const occurrence={...clone(item),title:String(item.title||'Programa').trim().slice(0,300),duration:Math.max(1,Math.min(1440,+item.duration||30)),id:item.id||uid('event'),channel:session.channel,source:item.source||'manual'};const list=currentChannel().occurrences;const index=list.findIndex(o=>o.id===occurrence.id);if(index<0&&list.length>=LIMITS.occurrences)throw new Error('O canal atingiu o limite de exibicoes manuais.');
    const others=getOccurrences(session.channel,isoDate(addDays(occurrence.date,-1)),isoDate(addDays(occurrence.date,1))).filter(o=>!sameOccurrence(o,occurrence));
    if(conflicts([...others,occurrence]).length)throw new Error('Já existe um programa ocupando esse horário.');
    if(control?.capture!==false)captureGradeUndo(index>=0?'Editar exibição':'Adicionar exibição');
    if(index>=0)list[index]=occurrence;else list.push(occurrence);audit(index>=0?'Exibição atualizada':'Exibição adicionada',occurrence.title);return occurrence;
  }
  function validateOccurrenceMove(item,changes){
    const candidate={...clone(item),...clone(changes),id:item.id,date:changes.date||item.date,start:changes.start||item.start,duration:Math.max(1,Math.min(1440,+changes.duration||item.duration||30))};
    const others=getOccurrences(session.channel,isoDate(addDays(candidate.date,-1)),isoDate(addDays(candidate.date,1))).filter(other=>!sameOccurrence(other,item));
    if(conflicts([...others,candidate]).some(conflict=>conflict.a===candidate||conflict.b===candidate))throw new Error('Conflito de horário: escolha um espaço livre antes de mover o programa.');
  }
  function changeOccurrence(item,changes,scope='one'){
    requireChannelAccess();
    assertSafeTree(changes,'Alteracao da exibicao');
    const needsException=!(item.source==='manual'||item.source==='migration');
    if(needsException&&currentChannel().exceptions.length+(scope==='week'?7:1)>LIMITS.exceptions)throw new Error('O canal atingiu o limite de excecoes.');
    if(scope==='one')validateOccurrenceMove(item,changes);
    captureGradeUndo('Alterar '+(item.title||'exibição'));
    if(item.source==='manual'||item.source==='migration')return saveOccurrence({...item,...changes},{capture:false});
    if(scope==='future'){const anchor=occurrenceAnchorDate(item),rule=currentChannel().rules.find(r=>r.id===item.ruleId);if(rule){Object.assign(rule,changes,{startsAt:anchor});audit('Regra alterada a partir de '+formatDate(anchor),item.title);return rule;}}
    if(scope==='week'){
      // Só os dias que a regra realmente contempla: antes isto criava exceção também no sábado e no domingo.
      const week=isoDate(startOfWeek(item.date)),rule=currentChannel().rules.find(r=>r.id===item.ruleId),days=rule?.weekdays||[];
      DAYS.forEach((weekday,i)=>{const date=isoDate(addDays(week,i));if(days.length&&!days.includes(weekday))return;currentChannel().exceptions.push({id:uid('exception'),ruleId:item.ruleId,date,action:'change',changes:clone(changes)});});
    }
    else upsertOccurrenceException(item,'change',changes);
    audit('Exibição excepcional alterada',item.title);return true;
  }
  function cancelOccurrence(item,scope='one'){
    requireChannelAccess();
    if(item.source!=='manual'&&item.source!=='migration'&&scope!=='future'&&currentChannel().exceptions.length>=LIMITS.exceptions)throw new Error('O canal atingiu o limite de excecoes.');
    captureGradeUndo('Cancelar '+(item.title||'exibição'));
    if(item.source==='manual'||item.source==='migration'){const list=currentChannel().occurrences;const i=list.findIndex(o=>o.id===item.id);if(i>=0)list.splice(i,1);}
    else if(scope==='future'){const rule=currentChannel().rules.find(r=>r.id===item.ruleId);if(rule)rule.endsAt=isoDate(addDays(occurrenceAnchorDate(item),-1));}
    else upsertOccurrenceException(item,'cancel');
    audit('Exibição cancelada',item.title);return true;
  }
  function getAlerts(){
    const today=parseLocalDate(new Date()),todayIso=isoDate(today),alerts=[],allCounts=new Map(),primaryCounts=new Map();
    // Um contrato pode valer só para uma temporada. Por isso contamos as exibições duas
    // vezes: pelo programa inteiro e por programa+temporada. Sem isso, um contrato da T2
    // enxergaria também as exibições da T1 e acusaria limite estourado sem ter estourado.
    const allBySeason=new Map(),primaryBySeason=new Map();
    const seasonKey=(programId,season)=>programId+' '+String(season??'').trim();
    const bump=(map,key)=>map.set(key,(map.get(key)||0)+1);
    allowedChannelIds().forEach(channelId=>{const channel=state.channels[channelId],dates=[...channel.rules.map(r=>r.startsAt),...channel.occurrences.map(o=>o.date)].filter(Boolean).sort(),from=dates[0]||isoDate(addDays(today,-3650));getOccurrences(channelId,from,todayIso).forEach(item=>{bump(allCounts,item.programId);bump(allBySeason,seasonKey(item.programId,item.season));if(!item.isRerun){bump(primaryCounts,item.programId);bump(primaryBySeason,seasonKey(item.programId,item.season));}});});
    getCatalog().forEach(program=>{
      if(!program.title||!program.defaultDuration)alerts.push({id:uid('al'),type:'incomplete',severity:'warning',programId:program.id,title:program.title||'Programa sem nome',message:'Cadastro incompleto: confira título e duração.',scope:program.scope});
      (program.rights||[]).forEach(right=>{
        // Quando o contrato é de uma temporada específica, o alerta precisa dizer qual —
        // senão dois contratos do mesmo programa geram avisos visualmente idênticos.
        const daTemporada=String(right.season??'').trim(),prefixo=daTemporada?'Temporada '+daTemporada+': ':'';
        if(right.endsAt){const days=Math.ceil((parseLocalDate(right.endsAt)-today)/86400000);if(days<0&&days>=-30)alerts.push({id:uid('al'),type:'expired',severity:'critical',programId:program.id,title:program.title,season:daTemporada,message:prefixo+'Vigência encerrada há '+Math.abs(days)+' dia(s).',date:right.endsAt,scope:program.scope});else if(days< -30)alerts.push({id:uid('al'),type:'expired',severity:'history',programId:program.id,title:program.title,season:daTemporada,message:prefixo+'Vigência encerrada há '+Math.abs(days)+' dia(s).',date:right.endsAt,scope:program.scope,historical:true});else if(days>=0&&days<=60)alerts.push({id:uid('al'),type:'expiring',severity:days<=15?'critical':'warning',programId:program.id,title:program.title,season:daTemporada,message:prefixo+(days===0?'Vigência termina hoje.':'Vigência termina em '+days+' dia(s).'),date:right.endsAt,scope:program.scope});}
        // "ILIMITADAS" e "SEM RESTRIÇÃO" viram null na importação — é assim que o
        // sistema guarda "sem limite". Só que +null vale 0 e passa no Number.isFinite,
        // então todo contrato ilimitado virava um alerta de "0 exibições disponíveis",
        // com o texto "0 de null utilizadas". Eram 119 dos 184 alertas: dois terços do
        // painel apontando escassez justamente onde não há limite nenhum.
        const limiteBruto=right.exhibitionLimit;
        const semLimite=limiteBruto===null||limiteBruto===undefined||String(limiteBruto).trim()===''
          ||/ilimit|sem restri/i.test(String(limiteBruto));
        if(!semLimite&&Number.isFinite(+limiteBruto)&&+limiteBruto>0){
          // Contrato preso a uma temporada conta só as exibições daquela temporada.
          const temporada=String(right.season??'').trim(),porTemporada=temporada!=='';
          const contagem=right.rerunsCount===false?(porTemporada?primaryBySeason:primaryCounts):(porTemporada?allBySeason:allCounts);
          const used=contagem.get(porTemporada?seasonKey(program.id,temporada):program.id)||0,left=+right.exhibitionLimit-used;
          if(left<=2)alerts.push({id:uid('al'),type:'limit',severity:left<=0?'critical':'warning',programId:program.id,title:program.title,season:temporada,message:(porTemporada?'Temporada '+temporada+': ':'')+(left<0?'Limite excedido em '+Math.abs(left)+' exibição(ões).':left+' exibição(ões) disponível(is).'),detail:used+' de '+right.exhibitionLimit+' utilizadas'+(right.contract?' · '+right.contract:''),scope:program.scope});
        }
      });
    });
    const start=isoDate(startOfWeek(new Date())),items=getWeek(session.channel,start);
    conflicts(items).forEach((c,i)=>alerts.push({id:'conflict_'+i,type:'conflict',severity:'critical',title:c.a.title+' × '+c.b.title,message:'Conflito em '+formatDate(c.date)+' às '+c.b.start,date:c.date,programId:c.a.programId}));
    // Um programa com dois contratos iguais na planilha gerava o mesmo aviso duas vezes,
    // palavra por palavra. Repetir não informa nada e faz a lista parecer maior do que o
    // problema é. Avisos de temporadas diferentes têm texto diferente e continuam separados.
    const vistos=new Set();
    const unicos=alerts.filter(alerta=>{
      const chave=[alerta.type,alerta.programId||'',alerta.season||'',alerta.message,alerta.detail||''].join(' ');
      if(vistos.has(chave))return false;
      vistos.add(chave);return true;
    });
    alerts.length=0;alerts.push(...unicos);
    const rank={critical:0,warning:1,history:2};
    return alerts.sort((a,b)=>(rank[a.severity]??1)-(rank[b.severity]??1)||String(a.title||'').localeCompare(String(b.title||''),'pt-BR'));
  }
  function headerScore(row){const names=(row||[]).map(normalize);let score=0;if(names.some(v=>v==='obra audiovisual'))score+=8;else if(names.some(v=>/(obra|programa|titulo)/.test(v)))score+=4;if(names.some(v=>v.includes('episod')))score+=2;if(names.some(v=>v.includes('duracao')||v.includes('minutos')))score+=2;if(names.some(v=>v.includes('vigencia')))score+=3;if(names.some(v=>v.includes('exibic')))score+=2;return score;}
  function locateTable(workbook){
    if(!Array.isArray(workbook.SheetNames)||workbook.SheetNames.length>LIMITS.workbookSheets)throw new Error('A planilha possui abas demais.');
    let best=null;workbook.SheetNames.forEach(name=>{const matrix=XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:'',raw:false,dateNF:'yyyy-mm-dd'});if(matrix.length>LIMITS.workbookRows)throw new Error('A planilha excede '+LIMITS.workbookRows+' linhas.');matrix.slice(0,40).forEach((row,index)=>{const score=headerScore(row);if(!best||score>best.score)best={name,matrix,index,score};});});return best?.score>=6?best:null;
  }
  function collectSourceConflicts(rows,rowNumbers=[]){
    if(!Array.isArray(rows)||rows.length<2)return[];
    const seasonOf=row=>{const entry=Object.entries(row||{}).find(([key])=>['temporada','temporadas'].includes(normalize(key)));return String(entry?.[1]??'').trim();};
    const groups=new Map();rows.forEach((row,index)=>{const season=seasonOf(row),key=normalize(season)||'__sem_temporada__';if(!groups.has(key))groups.set(key,{season,entries:[]});groups.get(key).entries.push({row,sourceRow:+rowNumbers[index]||0});});
    const ignored=new Set(['OBRA AUDIOVISUAL','PROGRAMA','ID','PROGRAMA_ID','TEMPORADA','TEMPORADAS']),conflicts=[];
    groups.forEach(group=>{
      if(group.entries.length<2)return;const headers=[...new Set(group.entries.flatMap(entry=>Object.keys(entry.row||{})))];
      headers.filter(header=>!ignored.has(String(header).toUpperCase())).forEach(header=>{const values=[...new Set(group.entries.map(entry=>String(entry.row?.[header]??'').trim()).filter(Boolean))];if(values.length>1)conflicts.push({field:header,values:values.slice(0,12),season:group.season,rows:group.entries.map(entry=>entry.sourceRow).filter(Boolean)});});
    });
    return conflicts;
  }
  function workbookRows(workbook,sheetName){
    const actual=(workbook.SheetNames||[]).find(name=>normalize(name)===normalize(sheetName));if(!actual)return[];
    const rows=XLSX.utils.sheet_to_json(workbook.Sheets[actual],{defval:'',raw:false,dateNF:'yyyy-mm-dd'});
    if(rows.length>LIMITS.workbookRows)throw new Error('A aba '+actual+' excede '+LIMITS.workbookRows+' linhas.');return rows;
  }
  function enrichProgramsFromExport(workbook,programs){
    const byId=new Map(programs.map(program=>[String(program.id),program]));
    const findProgram=row=>byId.get(String(row.PROGRAMA_ID||row.ID||''))||programs.find(program=>titleKey(program.title)===titleKey(row.PROGRAMA||row['OBRA AUDIOVISUAL']||''));
    const seasonRows=workbookRows(workbook,'Temporadas'),episodeRows=workbookRows(workbook,'Episódios'),rightRows=workbookRows(workbook,'Direitos');
    const touchedSeasons=new Set();
    seasonRows.forEach((row,index)=>{const program=findProgram(row);if(!program)return;if(!touchedSeasons.has(program.id)){program.seasons=[];touchedSeasons.add(program.id);}program.seasons.push({id:String(row.TEMPORADA_ID||uid('season')),number:String(row.TEMPORADA||''),title:String(row.TITULO||''),order:+row.ORDEM||index+1,episodeCount:Math.max(0,+row['Nº EPISÓDIOS']||0),totalDuration:+row['DURAÇÃO TOTAL']||0,productionYear:String(row.ANO_PRODUCAO||row['ANO DE PRODUÇÃO']||''),status:String(row.STATUS||''),distributor:String(row.DISTRIBUIDORA||row['EMPRESA / DISTRIBUIDORA']||''),targetAudience:String(row.PUBLICO_ALVO||row['PÚBLICO-ALVO']||''),cl:normalizeRating(row.CL),contentFormat:String(row.FORMATO||''),suggestedSlot:String(row.FAIXA||row['FAIXA SUGERIDA']||''),deliveryExpected:normalizeDate(row.ENTREGA),exhibitedAt:normalizeDate(row.EXIBICAO),sourceRow:+row.LINHA_ORIGEM||0,sourceRowNumbers:String(row.LINHAS_ORIGEM||row.LINHA_ORIGEM||'').split(/[;,]/).map(value=>+value).filter(Boolean),sourceRows:[],sourceConflicts:[],episodes:[]});});
    const seasonsById=new Map();programs.forEach(program=>(program.seasons||[]).forEach(season=>seasonsById.set(String(season.id),{program,season})));
    episodeRows.forEach(row=>{const linked=seasonsById.get(String(row.TEMPORADA_ID||'')),program=linked?.program||findProgram(row),season=linked?.season||program?.seasons?.[0];if(!program||!season)return;season.episodes.push({id:String(row.EPISODIO_ID||uid('episode')),number:String(row.NUMERO||''),title:String(row.TITULO||''),duration:Math.max(1,+row.DURACAO||program.defaultDuration||30),status:String(row.SITUACAO||'available'),synopsis:String(row.SINOPSE||'')});season.episodeCount=season.episodes.length;});
    const touchedRights=new Set();
    rightRows.forEach(row=>{const program=findProgram(row);if(!program)return;if(!touchedRights.has(program.id)){program.rights=[];touchedRights.add(program.id);}const rawLimit=String(row.LIMITE??'').trim(),limit=/ILIMIT|SEM RESTRI/i.test(rawLimit)?null:(parseInt(rawLimit.replace(/\D/g,''),10)||null);program.rights.push({id:String(row.DIREITO_ID||uid('right')),processNumber:String(row.PROCESSO||''),contract:String(row.CONTRATO||''),tvWindow:String(row.JANELA_VT||''),ott:String(row.OTT||''),territory:String(row.TERRITORIO||''),ottEpisodeLimit:String(row.LIMITE_EPS_OTT||''),periodDays:String(row.PERIODO_DIAS||''),startsAt:normalizeDate(row.INICIO),endsAt:normalizeDate(row.FIM),exhibitionLimit:limit,rerunsCount:normalize(row.REPRISE_CONTA)!=='nao',channels:String(row.CANAIS||'').split(',').map(value=>value.trim()).filter(Boolean),season:String(row.TEMPORADA||''),sourceRow:+row.LINHA_ORIGEM||0});});
  }
  function rightIdentity(right){return [right.contract,right.processNumber,right.startsAt,right.endsAt,right.tvWindow,right.ott,right.territory,right.season].map(value=>normalize(value)).join('|');}
  function mergeImportedSeasons(existing=[],incoming=[]){
    const used=new Set(),merged=incoming.map(season=>{const index=existing.findIndex((old,i)=>!used.has(i)&&(String(old.id||'')===String(season.id||'')||normalize(old.number)===normalize(season.number)));if(index<0)return clone(season);used.add(index);const old=existing[index],oldEpisodes=old.episodes||[],episodes=(season.episodes||[]).map(episode=>{const previous=oldEpisodes.find(item=>String(item.id||'')===String(episode.id||'')||normalize(item.number)===normalize(episode.number));return previous?{...clone(previous),...clone(episode),title:episode.title||previous.title||'',synopsis:episode.synopsis||previous.synopsis||'',status:episode.status||previous.status||'available'}:clone(episode);});oldEpisodes.forEach(episode=>{if(!episodes.some(item=>String(item.id||'')===String(episode.id||'')||normalize(item.number)===normalize(episode.number)))episodes.push(clone(episode));});return {...clone(old),...clone(season),title:season.title||old.title||'',episodes,episodeCount:Math.max(+season.episodeCount||0,episodes.length)};});
    existing.forEach((season,index)=>{if(!used.has(index))merged.push(clone(season));});return merged;
  }
  function mergeImportedRights(existing=[],incoming=[]){
    const merged=clone(existing);incoming.forEach(right=>{const index=merged.findIndex(old=>(+right.sourceRow>0&&+old.sourceRow===+right.sourceRow)||(normalize(old.season)===normalize(right.season)&&normalize(old.contract)===normalize(right.contract)&&normalize(old.processNumber)===normalize(right.processNumber)));if(index<0)merged.push(clone(right));else{const old=merged[index];merged[index]={...old,...clone(right),id:old.id||right.id};}});return merged;
  }
  function parseWorkbook(buffer){
    requireSignedIn();if(!window.XLSX)throw new Error('O leitor de planilhas local não foi carregado.');if(!buffer||buffer.byteLength>LIMITS.workbookBytes)throw new Error('A planilha deve ter no máximo 8 MB.');
    const workbook=XLSX.read(buffer,{type:'array',cellDates:true,cellFormula:false,cellHTML:false,bookVBA:false,bookFiles:false,WTF:false,sheetRows:LIMITS.workbookRows+1});const table=locateTable(workbook);if(!table)throw new Error('Não encontrei os cabeçalhos de programa, episódios ou vigência.');
    const headers=table.matrix[table.index].map(v=>String(v??'').trim());const rawRows=table.matrix.slice(table.index+1).map((row,index)=>{const out={};headers.forEach((h,i)=>{if(h)out[h]=row[i]??'';});return {data:out,sourceRow:table.index+index+2};}).filter(entry=>Object.values(entry.data).some(v=>String(v).trim()));
    const titleMap=new Map();
    rawRows.forEach(entry=>{
      const p=normalizeLegacyProgram(entry.data,entry.sourceRow);
      if(!p.title)return;
      const key=titleKey(p.title);
      if(!titleMap.has(key)){
        titleMap.set(key,p);
      }else{
        const ex=titleMap.get(key);
        if(!ex.cl&&p.cl)ex.cl=p.cl;
        if(!ex.distributor&&p.distributor)ex.distributor=p.distributor;
        if(!ex.targetAudience&&p.targetAudience)ex.targetAudience=p.targetAudience;
        if(!ex.nationality&&p.nationality)ex.nationality=p.nationality;
        if(!ex.countryOfOrigin&&p.countryOfOrigin)ex.countryOfOrigin=p.countryOfOrigin;
        if(!ex.stateOfOrigin&&p.stateOfOrigin)ex.stateOfOrigin=p.stateOfOrigin;
        if(!ex.cityOfOrigin&&p.cityOfOrigin)ex.cityOfOrigin=p.cityOfOrigin;
        if(!ex.directorate&&p.directorate)ex.directorate=p.directorate;
        if(!ex.contentFormat&&p.contentFormat)ex.contentFormat=p.contentFormat;
        if(!ex.suggestedSlot&&p.suggestedSlot)ex.suggestedSlot=p.suggestedSlot;
        if(!ex.productionYear&&p.productionYear)ex.productionYear=p.productionYear;
        if(!ex.deliveryExpected&&p.deliveryExpected)ex.deliveryExpected=p.deliveryExpected;
        if(!ex.exhibitedAt&&p.exhibitedAt)ex.exhibitedAt=p.exhibitedAt;
        if(ex.type==='unspecified'&&p.type!=='unspecified')ex.type=p.type;
        if((!ex.artwork||!ex.artwork.fileName&&!ex.artwork.url)&&p.artwork)ex.artwork=p.artwork;
        ex.sourceRows.push(...(p.sourceRows||[]));ex.sourceRowNumbers.push(...(p.sourceRowNumbers||[]));
        (p.seasons||[]).forEach(s=>{
          const sIdx=ex.seasons.findIndex(es=>String(es.number)===String(s.number));
          if(sIdx<0)ex.seasons.push(s);
          else{const current=ex.seasons[sIdx],sourceRows=[...(current.sourceRows||[]),...(s.sourceRows||[])],sourceRowNumbers=[...(current.sourceRowNumbers||[]),...(s.sourceRowNumbers||[])],incomingHasMore=(s.episodes?.length||0)>(current.episodes?.length||0),chosen=incomingHasMore?{...current,...s}:{...current};chosen.sourceRows=sourceRows;chosen.sourceRowNumbers=sourceRowNumbers;chosen.sourceRow=sourceRowNumbers[0]||current.sourceRow||s.sourceRow||0;chosen.sourceConflicts=collectSourceConflicts(sourceRows,sourceRowNumbers);ex.seasons[sIdx]=chosen;}
        });
        (p.rights||[]).forEach(r=>{
          if(!ex.rights.some(er=>rightIdentity(er)===rightIdentity(r)))ex.rights.push(r);
        });
      }
    });
    const programs=Array.from(titleMap.values());enrichProgramsFromExport(workbook,programs);enrichEpisodeTitles(programs);programs.forEach(program=>{program.sourceConflicts=collectSourceConflicts(program.sourceRows,program.sourceRowNumbers);program.sourceRowCount=program.sourceRows.length;(program.seasons||[]).forEach(season=>{if(season.sourceRows?.length)season.sourceConflicts=collectSourceConflicts(season.sourceRows,season.sourceRowNumbers);});});
    const exactRows=new Set(rawRows.map(entry=>JSON.stringify(entry.data))),conflicts=programs.filter(program=>program.sourceConflicts.length).map(program=>({programId:program.id,title:program.title,rows:program.sourceRowNumbers,fields:clone(program.sourceConflicts)}));
    return {sheet:table.name,rows:rawRows.length,headers:headers.filter(Boolean),programs,sourceDuplicates:rawRows.length-exactRows.size,conflicts};
  }
  function previewImport(programs,target='global'){
    const existing=target==='global'?state.globalCatalog:currentChannel().catalog,byId=new Map(existing.map(p=>[p.id,p])),byTitle=new Map(existing.map(p=>[titleKey(p.title),p]));let added=0,updated=0,duplicates=0,invalid=0;
    programs.forEach(p=>{if(!p.title){invalid++;return;}const old=byId.get(p.id)||byTitle.get(titleKey(p.title)),incomingSource=p.sourceRows?.length?p.sourceRows:[p.raw||{}],oldSource=old?.sourceRows?.length?old.sourceRows:(old?.raw?[old.raw]:[]);if(!old)added++;else if(JSON.stringify(oldSource)===JSON.stringify(incomingSource))duplicates++;else updated++;});
    return {added,updated,duplicates,invalid,total:programs.length,sourceRows:programs.reduce((sum,p)=>sum+(p.sourceRows?.length||1),0),seasons:programs.reduce((sum,p)=>sum+(p.seasons?.length||0),0),conflicts:programs.reduce((sum,p)=>sum+(p.sourceConflicts?.length||0),0),conflictPrograms:programs.filter(p=>p.sourceConflicts?.length).length};
  }
  function applyImport(programs,{target='global',mode='merge',fileName='',sheet=''}={}){
    if(target==='global')requireAdmin();else requireChannelAccess();
    const list=target==='global'?state.globalCatalog:currentChannel().catalog;const before=clone(list);let next;
    if(mode==='replace')next=programs.map(p=>({...p,scope:target==='global'?'global':'channel'}));else{const map=new Map(list.map(p=>[p.id,p])),titleIds=new Map(list.map(p=>[mergeTitleKey(p.title),p.id]));programs.forEach(p=>{const matchedId=map.has(p.id)?p.id:titleIds.get(mergeTitleKey(p.title)),old=matchedId?map.get(matchedId):null,finalId=old?.id||p.id,merged={...(old||{}),...p,id:finalId,scope:target==='global'?'global':'channel'};
      // O casamento por mergeTitleKey so junta titulos que diferem em pontuacao,
      // acento ou caixa. Nesses casos mantemos o nome ja cadastrado: deixar a ultima
      // linha da planilha renomear o programa faria "O SHOW DA LUNA" virar
      // "O SHOW DA LUNA!" a cada importacao, ao sabor de como alguem digitou.
      if(old&&old.title)merged.title=old.title;
      if(old){merged.seasons=mergeImportedSeasons(old.seasons||[],p.seasons||[]);merged.rights=mergeImportedRights(old.rights||[],p.rights||[]);}if(old&&!p.importFields?.origin)merged.origin=old.origin;if(old&&!p.importFields?.type)merged.type=old.type;if(old&&!p.importFields?.category)merged.category=old.category;if(old&&!p.importFields?.subgroups)merged.subgroups=clone(old.subgroups||[]);if(old&&!p.importFields?.colorGroup)merged.colorGroupId=old.colorGroupId||'';if(old&&!p.importFields?.artwork)merged.artwork=clone(old.artwork||null);if(old&&matchedId!==p.id)map.delete(matchedId);map.set(finalId,merged);titleIds.set(titleKey(merged.title),finalId);});next=[...map.values()];}
    enrichEpisodeTitles(next);if(target==='global')state.globalCatalog=next;else currentChannel().catalog=next;
    state.imports.unshift({id:uid('import'),at:new Date().toISOString(),user:session.user,channel:session.channel,fileName,sheet,target,mode,count:programs.length,before});state.imports=state.imports.slice(0,20);
    audit('Planilha importada',programs.length+' registros de '+(fileName||sheet),target==='global'?'global':'channel');return next.length;
  }
  function undoImport(){
    const batch=state.imports.find(item=>item.target==='global'||(item.target==='channel'&&item.channel===session.channel));if(!batch)throw new Error('Não há importação para desfazer.');
    if(batch.target==='global')requireAdmin();else requireChannelAccess();
    if(batch.target==='global')state.globalCatalog=clone(batch.before);else currentChannel().catalog=clone(batch.before);state.imports=state.imports.filter(i=>i.id!==batch.id);audit('Importação desfeita',batch.fileName||batch.id,batch.target==='global'?'global':'channel');return true;
  }
  function saveUserProfile(profile){
    requireAdmin();
    const email=String(profile.email||'').trim().toLowerCase();if(!email||!email.includes('@'))throw new Error('Informe um e-mail corporativo válido.');
    const role=profile.role==='Administrador'?'Administrador':'Operador',channels=(profile.channels||[]).filter(id=>CHANNELS[id]);
    if(role==='Operador'&&!channels.length)throw new Error('Escolha pelo menos um canal para o operador.');
    const existing=state.users[email];
    if(existing?.role==='Administrador'&&role!=='Administrador'&&Object.values(state.users).filter(item=>item?.role==='Administrador').length<=1)throw new Error('O sistema precisa manter pelo menos um administrador.');
    state.users[email]={name:String(profile.name||email).trim(),email,role,channels:role==='Administrador'?Object.keys(CHANNELS):channels};
    audit('Permissão de usuário atualizada',email+' · '+role,'global');return state.users[email];
  }
  function counts(scope,week){
    if(scope==='week')return getWeek(session.channel,week).length;if(scope==='channel'){const c=currentChannel();return c.rules.length+c.occurrences.length+c.exceptions.length+c.catalog.length;}
    if(!isAdmin())return 0;
    return state.globalCatalog.length+Object.values(state.channels).reduce((sum,c)=>sum+c.rules.length+c.occurrences.length+c.exceptions.length+c.catalog.length,0);
  }
  function makeFullBackup(reason='Copia administrativa'){
    requireAdmin();return {schemaVersion:VERSION,type:'ebc-grade-full-internal-backup',id:uid('backup'),exportedAt:new Date().toISOString(),exportedBy:session.user,reason,state:clone(state)};
  }
  function makeChannelBackup(reason='Copia manual do canal',channel=session.channel){
    requireChannelAccess(channel);return {schemaVersion:VERSION,type:'ebc-grade-channel-backup',authoredBy:AUTHOR,id:uid('backup'),channel,channelName:CHANNELS[channel].name,exportedAt:new Date().toISOString(),exportedBy:session.user,reason,data:clone(state.channels[channel])};
  }
  function snapshot(reason,scope='channel'){
    const backup=scope==='global'?makeFullBackup(reason):makeChannelBackup(reason);
    state.backups.unshift({id:backup.id,at:backup.exportedAt,user:backup.exportedBy,reason:backup.reason,channel:backup.channel||'global'});state.backups=state.backups.slice(0,50);return backup;
  }
  function createCleanupBackup(scope,week){
    if(scope==='global')return makeFullBackup('Antes da limpeza global');
    requireChannelAccess();return makeChannelBackup(scope==='week'?'Antes da limpeza da semana '+isoDate(startOfWeek(week)):'Antes da limpeza do canal');
  }
  function cleanup(scope,week){
    if(scope==='global')requireAdmin();else requireChannelAccess();
    if(scope==='week'){const start=isoDate(startOfWeek(week)),end=isoDate(addDays(start,6)),c=currentChannel();c.occurrences=c.occurrences.filter(o=>o.date<start||o.date>end);c.exceptions=c.exceptions.filter(e=>e.date<start||e.date>end);c.skipRanges.push({id:uid('skip'),start,end,reason:'Limpeza semanal'});}
    else if(scope==='channel'){state.channels[session.channel]=emptyChannel();}
    else if(scope==='global'){state.globalCatalog=[];Object.keys(CHANNELS).forEach(id=>{state.channels[id]=emptyChannel();persist('channel:'+id);});state.imports=[];}
    else throw new Error('Tipo de limpeza invalido.');
    audit('Limpeza executada',scope==='week'?formatDate(startOfWeek(week)):(scope==='channel'?CHANNELS[session.channel].name:'Todos os canais'),scope==='global'?'global':'channel');return true;
  }
  function makeBackup(){return makeChannelBackup();}
  function inspectBackup(data){
    requireChannelAccess();assertSafeTree(data,'Copia de seguranca');
    if(!data||data.type!=='ebc-grade-channel-backup'||+data.schemaVersion!==VERSION||data.channel!==session.channel)throw new Error('Escolha uma copia valida do canal '+CHANNELS[session.channel].name+'.');
    const checked=validateChannelData(data.data);
    return {channel:data.channel,channelName:CHANNELS[data.channel].name,exportedAt:data.exportedAt||'',exportedBy:data.exportedBy||'',reason:data.reason||'',counts:{catalog:checked.catalog.length,rules:checked.rules.length,occurrences:checked.occurrences.length,exceptions:checked.exceptions.length},data:checked};
  }
  function restoreBackup(data){
    const checked=inspectBackup(data),recovery=makeChannelBackup('Antes de restaurar copia externa');
    state.channels[session.channel]=checked.data;gradeUndo.delete(session.channel);audit('Copia do canal restaurada',(checked.exportedAt||'Data desconhecida')+' · '+(checked.exportedBy||'Usuario desconhecido'),'channel');
    return {channel:session.channel,recovery,counts:checked.counts};
  }
  function exportRows(){
    const programs=getCatalog(),programRows=[],seasonRows=[],episodeRows=[],rightRows=[];
    const colorNames=new Map((state.colorGroups||[]).map(group=>[group.id,group.name]));programs.forEach(p=>{const normalized={ID:p.id,PROGRAMA:p.title,'OBRA AUDIOVISUAL':p.title,TIPO:p.type,ORIGEM:p.origin,CATEGORIA:p.category,SUBGRUPOS:normalizeSubgroups(p.subgroups).join('; '),GRUPO_COR:colorNames.get(p.colorGroupId)||'',IMAGEM:p.artwork?.url||p.artwork?.fileName||'',DURACAO:p.defaultDuration,CONTINUO:p.continuous?'Sim':'Não',ESCOPO:p.scope,STATUS:p.status||'','EMPRESA / DISTRIBUIDORA':p.distributor||'',NACIONALIDADE:p.nationality||'','PAÍS DE ORIGEM':p.countryOfOrigin||'',UF:p.stateOfOrigin||'',CIDADE:p.cityOfOrigin||'',DIRETORIA:p.directorate||'',FORMATO:p.contentFormat||'','FAIXA SUGERIDA':p.suggestedSlot||'','PÚBLICO-ALVO':p.targetAudience||'','ANO DE PRODUÇÃO':p.productionYear||'','ENTREGA PREVISTA':p.deliveryExpected||'','EXIBIÇÃO EM:':p.exhibitedAt||'',CL:p.cl||''};const sources=p.sourceRows?.length?p.sourceRows:[{}];sources.forEach(source=>programRows.push({...normalized,...clone(source),ID:p.id,PROGRAMA:p.title,'OBRA AUDIOVISUAL':p.title}));(p.seasons||[]).forEach(s=>{seasonRows.push({PROGRAMA_ID:p.id,TEMPORADA_ID:s.id,TEMPORADA:s.number,TITULO:s.title,ORDEM:s.order,'Nº EPISÓDIOS':s.episodes?.length||s.episodeCount||0,'DURAÇÃO TOTAL':s.totalDuration||'',ANO_PRODUCAO:s.productionYear||'',STATUS:s.status||'',DISTRIBUIDORA:s.distributor||'',PUBLICO_ALVO:s.targetAudience||'',CL:s.cl||'',FORMATO:s.contentFormat||'',FAIXA:s.suggestedSlot||'',ENTREGA:s.deliveryExpected||'',EXIBICAO:s.exhibitedAt||''});(s.episodes||[]).forEach(e=>episodeRows.push({PROGRAMA_ID:p.id,TEMPORADA_ID:s.id,EPISODIO_ID:e.id,NUMERO:e.number,TITULO:e.title,DURACAO:e.duration||p.defaultDuration,SITUACAO:e.status||'available',SINOPSE:e.synopsis||''}));});(p.rights||[]).forEach(r=>rightRows.push({PROGRAMA_ID:p.id,DIREITO_ID:r.id,PROCESSO:r.processNumber||'',CONTRATO:r.contract,JANELA_VT:r.tvWindow||'',OTT:r.ott||'',TERRITORIO:r.territory||'',LIMITE_EPS_OTT:r.ottEpisodeLimit||'',PERIODO_DIAS:r.periodDays||'',INICIO:r.startsAt,FIM:r.endsAt,LIMITE:r.exhibitionLimit??'ILIMITADAS',REPRISE_CONTA:r.rerunsCount===false?'Não':'Sim',CANAIS:(r.channels||[]).join(', '),TEMPORADA:r.season||''}));});
    const exhibitions=[];allowedChannelIds().forEach(channel=>getOccurrences(channel,isoDate(addDays(new Date(),-365)),isoDate(addDays(new Date(),730))).forEach(o=>exhibitions.push({CANAL:CHANNELS[channel].name,DATA:o.date,HORA:o.start,DURACAO:o.duration,PROGRAMA_ID:o.programId,PROGRAMA:o.title,TEMPORADA:o.season,EPISODIO:o.episodeNumber,TITULO_EPISODIO:o.episodeTitle,TIPO:o.type,REPRISE:o.isRerun?'Sim':'Não'})));
    return {programs:programRows,seasons:seasonRows,episodes:episodeRows,rights:rightRows,exhibitions};
  }
  function serializeGlobal(){requireAdmin();return {schemaVersion:VERSION,type:'ebc-grade-global',authoredBy:AUTHOR,savedAt:new Date().toISOString(),savedBy:session.user,globalCatalog:clone(state.globalCatalog),colorGroups:clone(state.colorGroups),imports:clone(state.imports),audit:clone(state.audit),users:clone(state.users),preferences:clone(state.preferences),backups:clone(state.backups)};}
  function serializeChannel(channel=session.channel){requireChannelAccess(channel);return {schemaVersion:VERSION,type:'ebc-grade-channel',authoredBy:AUTHOR,channel,savedAt:new Date().toISOString(),savedBy:session.user,data:clone(state.channels[channel])};}
  // Nunca confia cegamente em papel/canais vindos de um arquivo remoto: role vira um dos dois
  // valores válidos, e canais são filtrados contra os canais que realmente existem.
  function sanitizeUsers(users){
    return Object.fromEntries(Object.entries(users||{}).map(([email,profile])=>{const key=String(email||'').trim().toLowerCase(),role=profile?.role==='Administrador'?'Administrador':'Operador',channels=(profile?.channels||[]).filter(id=>CHANNELS[id]);return [key,{name:String(profile?.name||key),email:key,role,channels:role==='Administrador'?Object.keys(CHANNELS):channels}];}).filter(([email])=>email.includes('@')));
  }
  function mergeGlobal(remote){
    validateGlobalData(remote);
    state.globalCatalog=clone(remote.globalCatalog||[]);const researchedTitles=enrichEpisodeTitles(state.globalCatalog);state.colorGroups=clone(remote.colorGroups||defaultColorGroups());state.imports=clone(remote.imports||[]).slice(0,100);state.audit=clone(remote.audit||[]).slice(0,600);
    state.users=sanitizeUsers(remote.users);
    const remotePreferences=remote.preferences&&typeof remote.preferences==='object'&&!Array.isArray(remote.preferences)?remote.preferences:{};state.preferences={...defaultPreferences(),...clone(remotePreferences)};state.preferences.programArtworkEnabled=state.preferences.programArtworkEnabled!==false;state.preferences.programArtworkOpacity=Math.max(5,Math.min(90,+state.preferences.programArtworkOpacity||14));state.backups=clone(remote.backups||[]).slice(0,50);if(researchedTitles)persist("global");else cachePut(stateCacheKey(),state);return true;
  }
  // ---------------------------------------------------------------------------
  // Merge de três vias para edição simultânea.
  // base = versão que este navegador carregou; mine = o que editei; theirs = o que
  // outra pessoa gravou enquanto isso. Quem mexeu num registro ganha aquele registro;
  // quando os dois mexeram no MESMO registro, o local prevalece e o caso é contado.
  // ---------------------------------------------------------------------------
  const sameValue=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
  function mergeKeyed(base,mine,theirs,stats){
    const keyOf=(item,index)=>{const id=item?.id;return id===undefined||id===null||id===''?'#'+stableHash(JSON.stringify(item??index)):String(id);};
    const index=list=>new Map((list||[]).map((item,i)=>[keyOf(item,i),item]));
    const b=index(base),m=index(mine),t=index(theirs),out=[],seen=new Set();
    for(const key of [...m.keys(),...t.keys()]){
      if(seen.has(key))continue;seen.add(key);
      const inBase=b.has(key),inMine=m.has(key),inTheirs=t.has(key),bv=b.get(key),mv=m.get(key),tv=t.get(key);
      if(inMine&&!inTheirs){if(inBase&&sameValue(bv,mv)){stats.removed++;continue;}out.push(mv);continue;}
      if(!inMine&&inTheirs){if(inBase&&sameValue(bv,tv)){stats.removed++;continue;}out.push(tv);stats.incoming++;continue;}
      if(sameValue(mv,tv)){out.push(mv);continue;}
      const mineChanged=!inBase||!sameValue(bv,mv),theirsChanged=!inBase||!sameValue(bv,tv);
      if(mineChanged&&theirsChanged){stats.conflicts++;out.push(mv);continue;}
      if(theirsChanged){out.push(tv);stats.incoming++;continue;}
      out.push(mv);
    }
    return out;
  }
  function mergeKeyedObject(base,mine,theirs,stats){
    const toList=obj=>Object.entries(obj||{}).map(([id,value])=>({id,value}));
    const merged=mergeKeyed(toList(base),toList(mine),toList(theirs),stats);
    return Object.fromEntries(merged.map(entry=>[entry.id,entry.value]));
  }
  function mergeObjectFields(base,mine,theirs,defaults,stats){
    const b={...defaults,...clone(base||{})},m={...defaults,...clone(mine||{})},t={...defaults,...clone(theirs||{})},out={};
    new Set([...Object.keys(b),...Object.keys(m),...Object.keys(t)]).forEach(key=>{
      if(sameValue(m[key],t[key])){out[key]=clone(m[key]);return;}
      const mineChanged=!sameValue(b[key],m[key]),theirsChanged=!sameValue(b[key],t[key]);
      if(mineChanged&&theirsChanged){stats.conflicts++;out[key]=clone(m[key]);return;}
      if(theirsChanged){stats.incoming++;out[key]=clone(t[key]);return;}
      out[key]=clone(m[key]);
    });
    return out;
  }
  function mergeConcurrentChannel(base,mine,theirs){
    const stats={conflicts:0,incoming:0,removed:0};
    const pick=(source,field)=>clone(source?.data?.[field]||source?.[field]||[]);
    const data={};
    ['catalog','rules','occurrences','exceptions','skipRanges'].forEach(field=>{
      data[field]=mergeKeyed(pick(base,field),pick(mine,field),pick(theirs,field),stats);
    });
    data.updatedAt=new Date().toISOString();
    return {data,stats};
  }
  function mergeConcurrentGlobal(base,mine,theirs){
    const stats={conflicts:0,incoming:0,removed:0};
    const pick=(source,field,fallback)=>clone(source?.[field]??fallback);
    const merged={
      globalCatalog:mergeKeyed(pick(base,'globalCatalog',[]),pick(mine,'globalCatalog',[]),pick(theirs,'globalCatalog',[]),stats),
      colorGroups:mergeKeyed(pick(base,'colorGroups',[]),pick(mine,'colorGroups',[]),pick(theirs,'colorGroups',[]),stats),
      imports:mergeKeyed(pick(base,'imports',[]),pick(mine,'imports',[]),pick(theirs,'imports',[]),stats),
      users:mergeKeyedObject(pick(base,'users',{}),pick(mine,'users',{}),pick(theirs,'users',{}),stats),
      // Auditoria é um log: junta os dois lados, ordena do mais novo e corta no limite.
      audit:[...clone(mine?.audit||[]),...clone(theirs?.audit||[])].filter((entry,i,list)=>list.findIndex(other=>other.id===entry.id)===i).sort((a,b)=>String(b.at||'').localeCompare(String(a.at||''))).slice(0,600),
      preferences:mergeObjectFields(base?.preferences,mine?.preferences,theirs?.preferences,defaultPreferences(),stats)
    };
    return {data:merged,stats};
  }
  // Aplica o resultado do merge ao estado local sem passar pelas validações de
  // arquivo remoto: os dados já vieram de duas fontes que passaram por elas.
  function applyMergedChannel(channelId,data){
    requireChannelAccess(channelId);state.channels[channelId]=validateChannelData(data);gradeUndo.delete(channelId);cachePut(stateCacheKey(),state);return true;
  }
  function applyMergedGlobal(data){
    // Mesmo padrão de mergeGlobal(): só administrador grava estado global, e a forma dos
    // dados é validada mesmo vindo de um merge local — nunca confia em dado remoto sem checar.
    requireAdmin();assertSafeTree(data,'Dados globais unidos');
    state.globalCatalog=clone(requireArray(data.globalCatalog||[],'Catalogo global',LIMITS.globalCatalog));
    state.colorGroups=clone(requireArray(data.colorGroups||defaultColorGroups(),'Grupos de cores',LIMITS.colorGroups));
    state.imports=clone(data.imports||[]).slice(0,100);state.audit=clone(data.audit||[]).slice(0,600);
    state.users=sanitizeUsers(data.users);state.preferences={...defaultPreferences(),...clone(data.preferences||{})};
    cachePut(stateCacheKey(),state);return true;
  }
  function mergeChannel(remote){if(!remote||+remote.schemaVersion!==VERSION||!CHANNELS[remote.channel])throw new Error('Arquivo de canal incompatível.');requireChannelAccess(remote.channel);state.channels[remote.channel]=validateChannelData(remote.data||{});const researchedTitles=enrichEpisodeTitles(state.channels[remote.channel].catalog);gradeUndo.delete(remote.channel);if(researchedTitles)persist("channel");else cachePut(stateCacheKey(),state);return true;}
  function importLegacySnapshot(snapshot,channel=session.channel){
    requireChannelAccess(channel);assertSafeTree(snapshot,'Dados antigos');if(!snapshot)return false;if(Array.isArray(snapshot.catalog)&&!state.globalCatalog.length&&isAdmin())state.globalCatalog=snapshot.catalog.map(normalizeLegacyProgram).filter(p=>p.title).slice(0,LIMITS.globalCatalog);
    const target=state.channels[channel];Object.entries(snapshot.grade||{}).forEach(([week,items])=>(items||[]).forEach(item=>target.occurrences.push({id:'graph_v4_'+String(item.id||uid('old')),channel,date:isoDate(addDays(week,DAY_INDEX[item.dia]??0)),start:item.hora||'00:00',duration:+item.dur||30,programId:'',title:item.obra||'Programa',season:item.temp||'',episodeNumber:item.ep||'',episodeTitle:item.subtit||'',type:item.isRepr?'rerun':(normalize(item.cat).includes('ao vivo')?'live':'recorded'),origin:legacyOrigin(item.cat),category:item.cat||'',isRerun:!!item.isRepr,source:'migration'})));
    audit('Versão online antiga migrada','Dados v4 convertidos para v6.','global');return true;
  }
  const api={VERSION,AUTHOR,AUTHOR_HANDLE,CHANNELS,DAYS,DAY_INDEX,FILTERS,LIMITS,init,get state(){return stateSnapshot();},get session(){return sessionSnapshot();},setUser,setChannel,getCatalog,saveProgram,bulkUpdatePrograms,removeProgram,getColorGroups,getPreferences,savePreferences,saveColorGroup,deriveColorPalette,colorGroupUsage,removeColorGroup,episodeModeFor,episodeSequence,sequenceStartOffset,getOccurrences,getWeek,conflicts,findNearestAvailableSlot,saveRule,saveOccurrence,changeOccurrence,cancelOccurrence,canUndoGrade,undoLastGradeChange,getAlerts,parseWorkbook,previewImport,applyImport,undoImport,saveUserProfile,counts,snapshot,createCleanupBackup,cleanup,makeBackup,makeChannelBackup,inspectBackup,restoreBackup,exportRows,serializeGlobal,serializeChannel,mergeGlobal,mergeChannel,mergeConcurrentChannel,mergeConcurrentGlobal,applyMergedChannel,applyMergedGlobal,importLegacySnapshot,audit,persist,clone,uid,normalize,slug,isoDate,parseLocalDate,addDays,startOfWeek,minutes,opMinutes,timeFromMinutes,timeFromOpMinutes,formatDate,normalizeDate,programId,printSegments,printWeekLayout,printMergeKey,isAdmin,allowedChannelIds,getUserProfile,hasDirty,dirtyScopes,consumeDirtyScopes,restoreDirtyScopes,clearLocalData};
  window.EBCGrade=api;
})();
