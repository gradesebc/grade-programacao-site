/*!
 * Sistema de Grade - EBC / TV Brasil
 * Autor e desenvolvedor: Henrique Rude ("HDut")
 * Persistencia no OneDrive via Microsoft Graph: estado, historico e backups.
 */
(() => {
  'use strict';
  const core=()=>window.EBCGrade;const DELAY=15000,VERSION_WINDOW_MINUTES=5,MAX_JSON_CHARS=15*1024*1024,MERGE_ATTEMPTS=2,PULL_DELAY=30000,PULL_MAX_FALHAS=3;let timer=null,pollTimer=null,connected=false,saving=false,versions=[],pullFalhasSeguidas=0;const knownSnapshots=new Map(),knownEtags=new Map();
  const safe=value=>core().slug(value).replace(/_+/g,'_');
  const dateFolder=date=>core().isoDate(date||new Date());
  const timeName=date=>{const d=date||new Date();return [String(d.getHours()).padStart(2,'0'),String(d.getMinutes()).padStart(2,'0'),String(d.getSeconds()).padStart(2,'0'),String(d.getMilliseconds()).padStart(3,'0')].join('-');};
  const scopeKey=(scope,channel='')=>scope==='global'?'global':'channel:'+(channel||scope.replace(/^channel:/,''));
  const bucketStart=date=>{const d=new Date(date);d.setMinutes(Math.floor(d.getMinutes()/VERSION_WINDOW_MINUTES)*VERSION_WINDOW_MINUTES,0,0);return d;};
  function addEntity(map,type,id,value){if(id===undefined||id===null||id==='')return;map.set(type+':'+id,{type,value:JSON.stringify(value)});}
  function addPrograms(map,programs,prefix=''){
    (programs||[]).forEach((program,pIndex)=>{const {seasons=[],rights=[],...base}=program||{},programId=program?.id||pIndex;addEntity(map,'Programas',prefix+programId,base);seasons.forEach((season,sIndex)=>{const {episodes=[],...seasonBase}=season||{},seasonId=season?.id||sIndex;addEntity(map,'Temporadas',prefix+programId+':'+seasonId,seasonBase);episodes.forEach((episode,eIndex)=>addEntity(map,'Episódios',prefix+programId+':'+seasonId+':'+(episode?.id||eIndex),episode));});rights.forEach((right,rIndex)=>addEntity(map,'Direitos',prefix+programId+':'+(right?.id||rIndex),right));});
  }
  function entityIndex(scope,data){
    const map=new Map();if(scope==='global'){addPrograms(map,data?.globalCatalog,'global:');(data?.colorGroups||[]).forEach((item,index)=>addEntity(map,'Grupos de cores',item?.id||index,item));Object.entries(data?.users||{}).forEach(([id,item])=>addEntity(map,'Usuários',id,item));(data?.imports||[]).forEach((item,index)=>addEntity(map,'Importações',item?.id||index,item));}
    else{const value=data?.data||{};addPrograms(map,value.catalog,'canal:');(value.rules||[]).forEach((item,index)=>addEntity(map,'Regras recorrentes',item?.id||index,item));(value.occurrences||[]).forEach((item,index)=>addEntity(map,'Exibições',item?.id||index,item));(value.exceptions||[]).forEach((item,index)=>addEntity(map,'Exceções',item?.id||index,item));(value.skipRanges||[]).forEach((item,index)=>addEntity(map,'Períodos limpos',item?.id||index,item));}return map;
  }
  function compareSnapshots(scope,before,after){
    const oldIndex=entityIndex(scope,before),newIndex=entityIndex(scope,after),changes=[];newIndex.forEach((item,key)=>{const previous=oldIndex.get(key);if(!previous)changes.push({key,type:item.type,action:'added'});else if(previous.value!==item.value)changes.push({key,type:item.type,action:'modified'});});oldIndex.forEach((item,key)=>{if(!newIndex.has(key))changes.push({key,type:item.type,action:'deleted'});});return changes;
  }
  function aggregateChanges(existing,changes){
    const refs={...(existing||{})};changes.forEach(change=>{const previous=refs[change.key]?.action;if(!previous){refs[change.key]={type:change.type,action:change.action};return;}if(previous==='added'&&change.action==='deleted'){delete refs[change.key];return;}if(previous==='added'){refs[change.key]={type:change.type,action:'added'};return;}if(previous==='deleted'&&change.action==='added'){refs[change.key]={type:change.type,action:'modified'};return;}if(change.action==='deleted'){refs[change.key]={type:change.type,action:'deleted'};return;}refs[change.key]={type:change.type,action:'modified'};});return refs;
  }
  function summarizeChanges(refs){
    const summary={added:0,modified:0,deleted:0,total:0,byType:{}};Object.values(refs||{}).forEach(item=>{if(!summary[item.action]&&summary[item.action]!==0)return;summary[item.action]++;summary.total++;const type=summary.byType[item.type]||(summary.byType[item.type]={added:0,modified:0,deleted:0,total:0});type[item.action]++;type.total++;});return summary;
  }
  function status(kind,title,detail){window.dispatchEvent(new CustomEvent('ebc:sync-status',{detail:{kind,title,detail}}));}
  function available(){return connected&&typeof graphObterPastaCaminho==='function'&&typeof graphSalvarArquivo==='function';}
  async function findFile(segments,name){
    const folder=await graphObterPastaCaminho(segments,false);if(!folder)return null;const children=await graphListarFilhos(folder.id);return children.find(item=>item.file&&item.name.toLowerCase()===name.toLowerCase())||null;
  }
  function parseJson(text,label='Arquivo JSON'){
    if(typeof text!=='string'||text.length>MAX_JSON_CHARS)throw new Error(label+' excede o limite de 15 MB.');
    try{return JSON.parse(text);}catch(_){throw new Error(label+' esta corrompido ou nao contem JSON valido.');}
  }
  async function readJsonRecord(segments,name){const file=await findFile(segments,name);if(!file)return null;return {data:parseJson(await graphLerArquivo(file.id),name),file};}
  async function readJson(segments,name){return (await readJsonRecord(segments,name))?.data||null;}
  async function writeJson(segments,name,data,control={}){const folder=await graphObterPastaCaminho(segments,true),text=JSON.stringify(data,null,2);if(text.length>MAX_JSON_CHARS)throw new Error('Os dados excedem o limite seguro de 15 MB por arquivo.');return graphSalvarArquivo(folder.id,name,text,control);}
  // Chamada quando o OneDrive recusa a gravação porque outra pessoa salvou antes:
  // relê o remoto, funde registro a registro com o que está aqui e devolve a versão unida.
  async function mergeWithRemote(scope,key,channel,isGlobal,statePath,mine){
    const record=await readJsonRecord(statePath,'atual.json').catch(()=>null);
    if(!record)return null;
    const base=knownSnapshots.get(key)||null,theirs=record.data;
    const result=isGlobal?core().mergeConcurrentGlobal(base,mine,theirs):core().mergeConcurrentChannel(base,mine,theirs);
    if(isGlobal)core().applyMergedGlobal(result.data);else core().applyMergedChannel(channel,result.data);
    const payload=isGlobal?core().serializeGlobal():core().serializeChannel(channel);
    const {conflicts,incoming}=result.stats;
    if(conflicts||incoming){
      const partes=[];if(incoming)partes.push(incoming+' alteração(ões) de outra pessoa incorporada(s)');if(conflicts)partes.push(conflicts+' registro(s) editado(s) pelos dois — a sua versão prevaleceu');
      status('saving','Unindo com outra edição',partes.join(' · '));
      window.dispatchEvent(new CustomEvent('ebc:merged-remote',{detail:{scope,...result.stats}}));
    }
    return {payload,etag:record.file?.eTag};
  }
  async function saveScope(scope,now){
    const channel=scope.startsWith('channel:')?scope.slice(8):core().session.channel,isGlobal=scope==='global';if(!isGlobal&&(!channel||!core().CHANNELS[channel]))return {saved:false,total:0};const key=scopeKey(scope,channel),data=isGlobal?core().serializeGlobal():core().serializeChannel(channel),changes=compareSnapshots(isGlobal?'global':'channel',knownSnapshots.get(key),data);if(!changes.length){knownSnapshots.set(key,data);return {saved:false,total:0};}
    const user=safe(core().session.user||'usuario'),bucket=bucketStart(now),historyPath=isGlobal?['dados','v6','historico','global',dateFolder(bucket)]:['dados','v6','historico','canais',channel,dateFolder(bucket)],stamp=timeName(bucket)+'_'+user+'.json',existingRecord=await readJsonRecord(historyPath,stamp).catch(()=>null),existing=existingRecord?.data,refs=aggregateChanges(existing?.changeRefs,changes),summary=summarizeChanges(refs);
    const statePath=isGlobal?['dados','v6','estado','global']:['dados','v6','estado','canais',channel];
    let savedItem,payload={...data,changeSummary:summary},etag=knownEtags.get(key);
    for(let attempt=0;;attempt++){
      try{savedItem=await writeJson(statePath,'atual.json',payload,etag?{ifMatch:etag}:{});break;}
      catch(err){
        if((err?.status!==409&&err?.status!==412)||attempt>=MERGE_ATTEMPTS)throw err?.status===409||err?.status===412
          ?new Error('Outra pessoa salvou junto com voce e nao foi possivel unir as duas versoes. Sincronize e tente novamente.'):err;
        const merged=await mergeWithRemote(scope,key,channel,isGlobal,statePath,payload);
        if(!merged)throw new Error('Outra pessoa salvou junto com voce e nao foi possivel unir as duas versoes. Sincronize e tente novamente.');
        payload={...merged.payload,changeSummary:summary};etag=merged.etag;
      }
    }
    knownEtags.set(key,savedItem?.eTag||savedItem?.['@odata.etag']||etag);
    // O histórico precisa conter exatamente o estado final que chegou ao OneDrive,
    // inclusive quando outra edição foi incorporada durante uma resposta 409/412.
    // Essa mesma versão vira a nova base do próximo merge concorrente.
    const finalSnapshot={...payload};delete finalSnapshot.changeSummary;
    const historyData={...finalSnapshot,savedAt:now.toISOString(),savedBy:core().session.user||'Usuário',historyWindow:{minutes:VERSION_WINDOW_MINUTES,startedAt:bucket.toISOString(),endsAt:new Date(bucket.getTime()+VERSION_WINDOW_MINUTES*60000).toISOString()},changeSummary:summary,changeRefs:refs};
    await writeJson(historyPath,stamp,historyData,existingRecord?.file?.eTag?{ifMatch:existingRecord.file.eTag}:{});knownSnapshots.set(key,finalSnapshot);return {saved:true,...summary};
  }
  async function saveNow(force=false){
    if(!available()||saving)return false;if(!core().hasDirty()&&!force)return true;saving=true;clearTimeout(timer);timer=null;status('saving','Salvando no OneDrive...','Aguarde a criação da versão compartilhada.');
    const now=new Date(),scopes=core().hasDirty()?core().consumeDirtyScopes():(core().session.channel?['channel:'+core().session.channel]:[]);
    if(!scopes.length){saving=false;status('saved','Tudo atualizado','Nenhuma alteração de dados para enviar.');return true;}
    try{let changed=0;for(const scope of scopes){const result=await saveScope(scope,now);changed+=result?.total||0;}if(changed){localStorage.setItem('ebc_v6_last_saved',now.toISOString());status('saved','Salvo no OneDrive',now.toLocaleString('pt-BR')+' · '+changed+' item(ns) no bloco atual');}else status('saved','Tudo atualizado','Nenhuma alteração de dados para enviar.');startPolling();return true;}
    catch(err){core().restoreDirtyScopes(scopes);console.error('Falha no salvamento v6',err);status('error','Erro ao salvar online',err.message||'Os dados permanecem preservados neste navegador.');throw err;}finally{saving=false;if(core().hasDirty()){clearTimeout(timer);timer=setTimeout(()=>saveNow().catch(()=>{}),DELAY);}}
  }
  function schedule(){if(!connected)return;clearTimeout(timer);status('pending','Alterações pendentes','Salvamento automático em até 15 segundos.');timer=setTimeout(()=>saveNow().catch(()=>{}),DELAY);}
  // Um modal aberto pode ter uma edição em andamento que ainda não foi salva (não passou por
  // persist(), então hasDirty() não a vê). Se a busca em segundo plano precisar renovar o login
  // nesse instante, o Microsoft Graph navega a página inteira para a tela de login e essa edição
  // se perde sem aviso. Por isso a busca silenciosa nunca roda com um modal na tela.
  function modalAberto(){
    if(typeof document==='undefined')return false;
    const modal=document.getElementById('app-modal');
    return !!modal&&!modal.classList.contains('hidden');
  }
  // Busca silenciosa do que outras pessoas gravaram. Só roda com a aba visível, sem
  // nada pendente para enviar, sem salvamento em curso e sem modal aberto — nunca atropela
  // quem está editando.
  async function pullRemote(){
    const channel=core().session?.channel;
    if(!available()||saving||core().hasDirty()||!channel||modalAberto())return false;
    if(typeof document!=='undefined'&&document.visibilityState==='hidden')return false;
    const key='channel:'+channel,path=['dados','v6','estado','canais',channel];
    let record;
    try{record=await readJsonRecord(path,'atual.json');}
    catch(err){
      // Falha persistente (login expirado, pasta indisponível, rede fora): para de tentar
      // sozinho em vez de martelar o Graph a cada 30s para sempre sem o usuário saber.
      if(++pullFalhasSeguidas>=PULL_MAX_FALHAS){stopPolling();status('error','Sincronização automática pausada','Não foi possível buscar alterações de outras pessoas. Use "Sincronizar agora" para tentar de novo.');}
      return false;
    }
    pullFalhasSeguidas=0;
    if(!record)return false;
    const remoteEtag=record.file?.eTag;
    if(remoteEtag&&remoteEtag===knownEtags.get(key))return false; // ninguém mexeu desde a última leitura
    const base=knownSnapshots.get(key)||null,mine=core().serializeChannel(channel);
    const {data,stats}=core().mergeConcurrentChannel(base,mine,record.data);
    core().applyMergedChannel(channel,data);
    knownSnapshots.set(key,core().serializeChannel(channel));knownEtags.set(key,remoteEtag);
    if(stats.incoming||stats.removed||stats.conflicts)window.dispatchEvent(new CustomEvent('ebc:merged-remote',{detail:{scope:key,...stats}}));
    return true;
  }
  function startPolling(){
    pullFalhasSeguidas=0;
    if(pollTimer||typeof setInterval!=='function')return;
    pollTimer=setInterval(()=>{pullRemote().catch(err=>console.warn('Não foi possível buscar alterações remotas',err));},PULL_DELAY);
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pullRemote().catch(()=>{});});
  }
  function stopPolling(){if(pollTimer){clearInterval(pollTimer);pollTimer=null;}}
  async function loadGlobal(){
    const record=await readJsonRecord(['dados','v6','estado','global'],'atual.json');if(record){core().mergeGlobal(record.data);knownSnapshots.set('global',record.data);knownEtags.set('global',record.file.eTag);return true;}return false;
  }
  async function loadLegacyChannel(channel){
    const folder=await graphObterPastaCaminho(['dados','grades',core().CHANNELS[channel].slug],false);if(!folder)return false;
    const days=(await graphListarFilhos(folder.id)).filter(i=>i.folder&&/^\d{4}-\d{2}-\d{2}$/.test(i.name)).sort((a,b)=>b.name.localeCompare(a.name));
    for(const day of days){const files=(await graphListarFilhos(day.id)).filter(i=>i.file&&i.name.endsWith('.json')).sort((a,b)=>b.name.localeCompare(a.name));if(files.length){core().importLegacySnapshot(parseJson(await graphLerArquivo(files[0].id),files[0].name),channel);return true;}}return false;
  }
  async function loadChannel(channel){
    status('saving','Carregando última versão...',core().CHANNELS[channel].name);const record=await readJsonRecord(['dados','v6','estado','canais',channel],'atual.json'),remote=record?.data;
    if(remote){core().mergeChannel(remote);knownSnapshots.set('channel:'+channel,remote);knownEtags.set('channel:'+channel,record.file.eTag);}else await loadLegacyChannel(channel);
    window.dispatchEvent(new CustomEvent('ebc:remote-loaded',{detail:{channel}}));status('saved','OneDrive conectado',remote?'Última versão compartilhada carregada.':'Canal pronto para o primeiro salvamento.');return !!remote;
  }
  async function init(){
    if(typeof microsoftGraphConectado!=='function'||!microsoftGraphConectado()){status('offline','Aguardando login Microsoft','Entre com a conta EBC para ativar o salvamento online.');return false;}
    status('saving','Conectando ao OneDrive...','Validando a pasta compartilhada.');try{await graphResolverPastaRaiz();connected=true;await loadGlobal();startPolling();status('saved','OneDrive conectado','Salvamento automático online ativo.');return true;}catch(err){connected=false;stopPolling();console.error(err);status('error','OneDrive indisponível',err.message||'Não foi possível acessar a pasta compartilhada.');return false;}
  }
  async function sync(){
    if(!connected&&!(await init()))return false;if(core().hasDirty())await saveNow();else{await loadGlobal();if(core().session.channel)await loadChannel(core().session.channel);}return true;
  }
  async function listHistory(limit=50){
    if(!available()||!core().session.channel)return[];const path=['dados','v6','historico','canais',core().session.channel];const folder=await graphObterPastaCaminho(path,false);if(!folder)return[];
    const days=(await graphListarFilhos(folder.id)).filter(i=>i.folder&&/^\d{4}-\d{2}-\d{2}$/.test(i.name)).sort((a,b)=>b.name.localeCompare(a.name));const out=[];
    for(const day of days){const files=(await graphListarFilhos(day.id)).filter(i=>i.file&&i.name.endsWith('.json')).sort((a,b)=>b.name.localeCompare(a.name));out.push(...files.map(file=>{const match=file.name.match(/^(\d{2})-(\d{2})-(\d{2})-(\d{3})_(.+)\.json$/i),time=match?match.slice(1,4).join(':'):file.name.slice(0,8).replace(/-/g,':'),userSlug=match?.[5]||'usuario_nao_identificado',user=userSlug.split('_').filter(Boolean).map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ');return {...file,day:day.name,time,user,label:day.name.split('-').reverse().join('/')+' às '+time};}));if(out.length>=limit)break;}
    const raw=out.slice(0,limit),enriched=[];for(let index=0;index<raw.length;index+=8){const batch=await Promise.all(raw.slice(index,index+8).map(async item=>{try{const data=parseJson(await graphLerArquivo(item.id),item.name);return {...item,user:data.savedBy||item.user,changeSummary:data.changeSummary||null,recoveryPoint:!!data.recoveryPoint,historyWindow:data.historyWindow||null};}catch(_){return item;}}));enriched.push(...batch);}versions=enriched;return versions;
  }
  async function saveRecoveryPoint(channel,now){
    const data=core().serializeChannel(channel),user=safe(core().session.user||'usuario'),stamp=timeName(now)+'_recuperacao_'+user+'.json',summary={added:0,modified:0,deleted:0,total:0,byType:{}};await writeJson(['dados','v6','historico','canais',channel,dateFolder(now)],stamp,{...data,savedAt:now.toISOString(),savedBy:core().session.user||'Usuário',recoveryPoint:true,changeSummary:summary});return true;
  }
  async function restoreVersion(id){
    const item=versions.find(v=>v.id===id);if(!item)throw new Error('Versão não encontrada.');const channel=core().session.channel;if(!channel)throw new Error('Selecione um canal antes de restaurar.');
    const data=parseJson(await graphLerArquivo(item.id),item.name);if(data?.type!=='ebc-grade-channel'||data.channel!==channel)throw new Error('Esta versão não pertence ao canal atual.');
    status('saving','Criando ponto de recuperação...','Preservando a versão atual antes da restauração.');await saveRecoveryPoint(channel,new Date());
    if(!core().mergeChannel(data))throw new Error('Versão incompatível.');core().audit('Versão do OneDrive restaurada',item.label+' · '+item.user);await saveNow(true);window.dispatchEvent(new CustomEvent('ebc:remote-loaded',{detail:{channel}}));return true;
  }
  async function saveBackup(backup){
    if(!available()||!backup)throw new Error('O OneDrive precisa estar conectado para criar a copia de seguranca.');const now=new Date(backup.exportedAt||backup.at||Date.now());const name=timeName(now)+'_'+safe(backup.reason||'backup')+'_'+safe(core().session.user)+'.json';await writeJson(['dados','v6','backups',dateFolder(now)],name,{schemaVersion:core().VERSION,...backup});return true;
  }
  window.addEventListener('ebc:data-changed',schedule);
  window.addEventListener('beforeunload',event=>{if(core()?.hasDirty?.()){event.preventDefault();event.returnValue='';}});
  window.EBCGraphStore={init,sync,saveNow,pullRemote,loadGlobal,loadChannel,listHistory,restoreVersion,saveBackup,get connected(){return connected;}};
})();
