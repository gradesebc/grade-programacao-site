/*!
 * Sistema de Grade - EBC / TV Brasil
 * Autor e desenvolvedor: Henrique Rude ("HDut")
 * Camada de interface: grade semanal, catalogo, modais, impressao e sincronizacao visual.
 */
(() => {
  'use strict';
  const C=()=>window.EBCGrade,G=()=>window.EBCGraphStore,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const icons={
    microsoft:'<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',library:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',transfer:'<path d="m17 3 4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/>',alert:'<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
    cloud:'<path d="M17.5 19H6a4 4 0 0 1-.7-7.9A6 6 0 0 1 17 9.5h.5a4.8 4.8 0 0 1 0 9.5z"/><path d="m9 15 3-3 3 3M12 12v7"/>',switch:'<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',logout:'<path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',density:'<path d="M4 6h16M4 12h16M4 18h16"/>',print:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',upload:'<path d="M12 3v12M7 8l5-5 5 5M5 21h14"/>',preview:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',sheet:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',refresh:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-3L4 8M6 15a7 7 0 0 0 12 3l2-2"/>',tv:'<rect x="2" y="6" width="20" height="14" rx="2"/><path d="m8 2 4 4 4-4M8 22h8"/>',database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v7c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12v7c0 1.7 4 3 9 3s9-1.3 9-3v-7"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>'
  };
  // Estes três estavam sendo pedidos pelo HTML mas não existiam no mapa: renderIcons
  // desiste em silêncio quando não encontra, então os botões apareciam sem símbolo.
  Object.assign(icons,{
    filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    undo:'<path d="M3 7v6h6"/><path d="M3.5 13a9 9 0 1 0 2.1-5.6L3 10"/>',
    'panel-left':'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>'
  });
  Object.assign(icons,{moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',minus:'<path d="M5 12h14"/>',palette:'<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.4-.4-.6-.9-.6-1.4a2 2 0 0 1 2-2h2.1A5.1 5.1 0 0 0 22 10.1C22 5.6 17.5 2 12 2z"/>'});
  icons['panel-left']='<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 9l-3 3 3 3"/>';
  icons.undo='<path d="M9 7 4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>';
  const ui={week:C()?.isoDate(C().startOfWeek(new Date()))||'',view:'week',day:0,zoom:+localStorage.getItem('ebc_grade_zoom')||100,filters:new Set(),search:'',hideUnmatched:false,importData:null,page:'grade',catalogSelected:new Set(),catalogVisible:[],catalogView:localStorage.getItem('ebc_catalog_view')||'compact',dragItem:null};let hostingPrincipal=null,modalReturnFocus=null,artworkIndexPromise=null,linkedArtworkIndex=null,artworkObserver=null;const artworkCache=new Map();
  function programForItem(item){const catalog=C().getCatalog(),byId=item?.programId&&catalog.find(program=>program.id===item.programId);return byId||catalog.find(program=>C().normalize(program.title)===C().normalize(item?.title));}
  async function artworkIndex(){
    if(artworkIndexPromise)return artworkIndexPromise;artworkIndexPromise=(async()=>{if(typeof graphObterPastaCaminho!=='function'||typeof graphListarFilhos!=='function')return new Map();const folder=await graphObterPastaCaminho(['dados','v6','midias','programas'],false);if(!folder)return new Map();const files=await graphListarFilhos(folder.id);return new Map(files.filter(item=>item.file).map(item=>[item.name.toLowerCase(),item]));})().catch(err=>{artworkIndexPromise=null;throw err;});return artworkIndexPromise;
  }
  async function artworkUrl(artwork,programTitle=''){
    if(!linkedArtworkIndex)linkedArtworkIndex=new Map(Object.entries(window.TVBRASIL_PROGRAM_ARTWORKS||{}).map(([title,value])=>[C().normalize(title),value]));
    const normalizePageUrl=value=>String(value||'').trim().replace(/[?#].*$/,'').replace(/\/$/,'').toLowerCase();
    const directUrl=String(artwork?.url||'').trim();
    if(directUrl){
      const pageKey=normalizePageUrl(directUrl);
      const mapped=Object.values(window.TVBRASIL_PROGRAM_ARTWORKS||{}).find(value=>normalizePageUrl(value?.page_url)===pageKey);
      if(mapped?.image_url)return mapped.image_url;
      // Qualquer endereço HTTPS é aceito: quem decide se presta é o carregamento real
      // da imagem em loadArtwork, que remove o fundo se falhar.
      if(/^https:\/\//i.test(directUrl))return directUrl;
    }
    const linked=linkedArtworkIndex.get(C().normalize(programTitle));if(linked?.image_url)return linked.image_url;
    const name=String(artwork?.fileName||'').toLowerCase();if(!name)return'';if(artworkCache.has(name))return artworkCache.get(name);const pending=(async()=>{const file=(await artworkIndex()).get(name);if(!file||typeof graphLerArquivoBlob!=='function')return'';const blob=await graphLerArquivoBlob(file.id);if(!blob||blob.size>1024*1024||!String(blob.type||'image/webp').startsWith('image/'))return'';return URL.createObjectURL(blob);})().catch(err=>{console.warn('Imagem do programa indisponível',err);return'';});artworkCache.set(name,pending);return pending;
  }
  function normalizedPageUrl(value){let clean=String(value||'').trim().split('#')[0].split('?')[0].toLowerCase();while(clean.endsWith('/'))clean=clean.slice(0,-1);return clean;}
  function safeHttpsUrl(value){try{const raw=String(value||''),parsed=new URL(raw);return parsed.protocol==='https:'&&!['"',"'","<",">"].some(char=>raw.includes(char));}catch(_){return false;}}
  function directArtworkUrl(value){const clean=normalizedPageUrl(value),extensions=['.avif','.gif','.jpg','.jpeg','.png','.webp'];return extensions.some(extension=>clean.endsWith(extension))||clean.includes('/@@images/')||clean.includes('imagens.ebc.com.br/');}
  // Muitos servidores entregam imagem sem extensão no endereço. Em vez de adivinhar
  // pelo formato do texto, carregamos de fato e vemos se vira uma imagem.
  function carregaComoImagem(url,limite=8000){
    return new Promise(resolve=>{
      const probe=new Image();let resolvido=false;
      const terminar=valor=>{if(resolvido)return;resolvido=true;probe.onload=probe.onerror=null;resolve(valor);};
      probe.referrerPolicy='no-referrer';
      probe.onload=()=>terminar(probe.naturalWidth>0&&probe.naturalHeight>0);
      probe.onerror=()=>terminar(false);
      setTimeout(()=>terminar(false),limite);
      probe.src=url;
    });
  }
  function mappedArtworkPage(value){const normalized=normalizedPageUrl(value);return Object.values(window.TVBRASIL_PROGRAM_ARTWORKS||{}).some(item=>normalizedPageUrl(item?.page_url)===normalized);}
  function artworkPreferences(){try{return C().getPreferences();}catch(_){return {programArtworkEnabled:true,programArtworkOpacity:14};}}
  function clearRenderedArtwork(){$$('.has-program-artwork').forEach(element=>{element.classList.remove('has-program-artwork');element.style.removeProperty('--program-artwork');element.style.removeProperty('--program-artwork-opacity');});}
  function loadArtwork(element,program){
    if(!element||!artworkPreferences().programArtworkEnabled)return;
    const p=program||element._artworkProgram,title=p?.title||'';
    const globalOpacity=artworkPreferences().programArtworkOpacity/100;
    artworkUrl(p?.artwork,title).then(url=>{if(!url||!element.isConnected)return;const probe=new Image();probe.referrerPolicy='no-referrer';probe.onload=()=>{if(!element.isConnected)return;element.classList.add('has-program-artwork');element.style.setProperty('--program-artwork','url("'+url.replace(/["\\]/g,'')+'")');element.style.setProperty('--program-artwork-opacity',String(globalOpacity));};probe.onerror=()=>{element.classList.remove('has-program-artwork');element.style.removeProperty('--program-artwork');console.warn('Imagem externa indisponível para o programa:',title,url);};probe.src=url;});
  }
  function queueArtwork(element,item){
    if(!artworkPreferences().programArtworkEnabled)return;const program=programForItem(item)||item;if(!program?.title)return;element._artworkProgram=program;if(!('IntersectionObserver'in window)){loadArtwork(element,program);return;}if(!artworkObserver)artworkObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;artworkObserver.unobserve(entry.target);loadArtwork(entry.target,entry.target._artworkProgram);}),{rootMargin:'240px'});artworkObserver.observe(element);
  }
  window.addEventListener('ebc:remote-loaded',()=>{artworkIndexPromise=null;artworkCache.forEach((cached,key)=>Promise.resolve(cached).then(url=>{if(!url)artworkCache.delete(key);}));});
  function renderIcons(root=document){$$('[data-icon]',root).forEach(el=>{const name=el.dataset.icon;if(!icons[name])return;el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';});}
  function renderAppVersion(){
    const version=document.querySelector('meta[name="application-version"]')?.content?.trim()||'não identificada';
    const releaseDate=document.querySelector('meta[name="application-release-date"]')?.content?.trim()||'';
    const label='Versão '+version+(releaseDate?' · '+releaseDate:'');
    // Assinatura de autoria: aparece no console do navegador, não na interface.
    console.info('%cSistema de Grade — EBC%c\n'+label+'\nDesenvolvido por '+(C()?.AUTHOR||'Henrique Rude (HDut)'),'font-weight:bold;font-size:13px','font-weight:normal');
    $$('[data-app-version]').forEach(element=>{element.textContent=label;});
    const sidebar=$('.sidebar-version');if(sidebar){sidebar.dataset.versionShort='v'+version;sidebar.title='Versão instalada: '+version+(releaseDate?' · '+releaseDate:'');}
    document.documentElement.dataset.appVersion=version;
  }
  function allowedChannels(){return C().allowedChannelIds();}
  function isLocalHosting(){return ['localhost','127.0.0.1'].includes(location.hostname);}
  async function ensureHostingAuthorization(){
    if(isLocalHosting())return true;
    const response=await fetch('/.auth/me',{credentials:'same-origin',cache:'no-store'});
    // GitHub Pages e outros hosts estaticos nao oferecem /.auth/me; nesses casos o MSAL e o Microsoft Graph sao a barreira real.
    if(response.status===404)return true;if(!response.ok)throw new Error('Nao foi possivel validar o acesso da hospedagem.');
    const payload=await response.json(),principal=payload?.clientPrincipal;if(!principal){location.replace('/.auth/login/aad?post_login_redirect_uri='+encodeURIComponent(location.pathname+location.search));return false;}
    if(principal.identityProvider!=='aad')throw new Error('Entre usando a conta corporativa Microsoft da EBC.');hostingPrincipal=principal;return true;
  }
  function validateHostingIdentity(identity){const hosted=String(hostingPrincipal?.userDetails||'').trim().toLowerCase(),graph=String(identity?.email||'').trim().toLowerCase();if(hosted.includes('@')&&graph&&hosted!==graph)throw new Error('A conta do site e a conta do OneDrive precisam ser a mesma.');}
  function toast(message,type=''){const el=document.createElement('div');el.className='toast '+type;el.textContent=message;$('#toast-region').append(el);setTimeout(()=>el.remove(),4200);}
  // Enriquecimento pelo acervo do TV Brasil Play. Roda solto: cede o fio a cada
  // programa para a interface continuar respondendo enquanto a pessoa navega.
  let enriquecendo=false;
  async function enriquecerCatalogo(){
    if(enriquecendo)return;
    if(!window.EBCPlay){toast('O módulo de consulta ao acervo não foi carregado.','error');return;}
    const botao=$('#enrich-catalog');enriquecendo=true;if(botao){botao.disabled=true;botao.dataset.rotulo=botao.textContent;botao.textContent='Buscando...';}
    let aplicados=0,comEpisodios=0,comDuracao=0,semCorrespondencia=0,falhas=0;
    try{
      toast('Consultando o acervo do TV Brasil Play. Pode continuar usando o sistema.','success');
      const acervo=await window.EBCPlay.catalogo();
      const programas=C().getCatalog().filter(programa=>programa.scope==='channel'||C().isAdmin());
      for(let i=0;i<programas.length;i++){
        const programa=programas[i];
        try{
          const sugestao=await window.EBCPlay.sugerirPara(programa,{catalogo:acervo,minimo:'alta'});
          if(!sugestao){semCorrespondencia++;}
          else if(Object.keys(sugestao.campos).length){C().saveProgram({...programa,...sugestao.campos},programa.scope);aplicados++;}
          // Episódios custam uma requisição cada. Vale a pena quando falta título ou quando a
          // duração ainda é a média que veio da planilha (todos os episódios com o mesmo número).
          const media=+programa.defaultDuration||0;
          const precisaEpisodios=sugestao&&C().episodeModeFor(programa)==='catalog'&&(programa.seasons||[]).some(t=>(t.episodes||[]).some(e=>!String(e.title||'').trim()||!+e.duration||+e.duration===media));
          if(precisaEpisodios){
            const vindo=await window.EBCPlay.sugerirEpisodios(programa,{catalogo:acervo});
            if(vindo){C().saveProgram({...C().getCatalog().find(p=>p.id===programa.id)||programa,seasons:vindo.seasons},programa.scope);comEpisodios++;comDuracao+=vindo.duracoes||0;}
          }
        }catch(err){falhas++;console.warn('Falha ao enriquecer',programa.title,err);}
        if(botao&&i%10===0)botao.textContent='Buscando... '+Math.round((i/programas.length)*100)+'%';
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      renderCatalog();
      const partes=[aplicados+' programa(s) completados'];
      if(comEpisodios)partes.push(comEpisodios+' com episódios');
      if(comDuracao)partes.push(comDuracao+' duração(ões) reais no lugar da média da planilha');
      if(semCorrespondencia)partes.push(semCorrespondencia+' sem correspondência no acervo');
      if(falhas)partes.push(falhas+' falha(s) de consulta');
      toast(partes.join(' · '),aplicados||comEpisodios?'success':'');
    }catch(err){
      console.error(err);
      toast('Não foi possível consultar o acervo do TV Brasil Play agora. O cadastro manual continua disponível.','error');
    }finally{
      enriquecendo=false;if(botao){botao.disabled=false;botao.textContent=botao.dataset.rotulo||'Buscar imagens e episódios';}
    }
  }
  function openModal({title,kicker='Sistema de Grade',body='',footer='',wide=false}){modalReturnFocus=document.activeElement;$('#app-shell').setAttribute('inert','');$('#modal-title').textContent=title;$('#modal-kicker').textContent=kicker;$('#modal-body').innerHTML=body;$('#modal-footer').innerHTML=footer;$('#app-modal').style.width=wide?'min(920px,calc(100% - 32px))':'';$('#app-modal').classList.remove('hidden');$('#modal-backdrop').classList.remove('hidden');renderIcons($('#app-modal'));setTimeout(()=>$('#app-modal input, #app-modal select, #modal-close')?.focus(),20);}
  function closeModal(){$('#app-modal').classList.add('hidden');$('#modal-backdrop').classList.add('hidden');$('#modal-body').innerHTML='';$('#modal-footer').innerHTML='';if(!$('#app-shell').classList.contains('hidden'))$('#app-shell').removeAttribute('inert');modalReturnFocus?.focus?.();modalReturnFocus=null;}
  function trapModalFocus(event){
    if(event.key!=='Tab'||$('#app-modal').classList.contains('hidden'))return;const focusable=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',$('#app-modal')).filter(el=>el.getClientRects().length);if(!focusable.length){event.preventDefault();return;}const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  function closeDrawer(){$('#detail-drawer').classList.remove('open');$('#detail-drawer').setAttribute('aria-hidden','true');$('#drawer-backdrop').classList.add('hidden');}
  function showPage(page){ui.page=page;$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));$$('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const titles={grade:['Programação','Grade semanal'],metrics:['Acompanhamento','Métricas de exibição'],catalog:['Base de conteúdos','Programas e episódios'],import:['Dados seguros','Importar e exportar'],alerts:['Acompanhamento','Alertas e vigências'],history:['Rastreabilidade','Histórico'],admin:['Área controlada','Administração']};$('#page-kicker').textContent=titles[page][0];$('#page-title').textContent=titles[page][1];renderPage(page);$('.sidebar').classList.remove('open');}
  function setAppAvailability(available){
    const shell=$('#app-shell');shell.classList.toggle('hidden',!available);shell.setAttribute('aria-hidden',available?'false':'true');if(available)shell.removeAttribute('inert');else shell.setAttribute('inert','');
  }
  async function enterApp(identity){
    validateHostingIdentity(identity);C().setUser(identity,{bootstrap:false});await C().init(identity);
    await G().init();C().setUser(identity,{bootstrap:true});$('#sidebar-user').textContent=C().session.user+' · '+C().session.role;applyRoleUi();renderChannels();
    $('#login-overlay').classList.add('hidden');setAppAvailability(true);iniciarRelogioNoAr();
    if(!allowedChannels().length){showChannels();$('#channel-greeting').textContent='Sua conta foi autenticada, mas ainda nao recebeu acesso a nenhum canal. Solicite a liberacao a um administrador.';return;}
    if(C().session.channel&&allowedChannels().includes(C().session.channel))await selectChannel(C().session.channel);else showChannels();
  }
  function applyRoleUi(){
    const admin=C().isAdmin(),globalImport=$('#import-target option[value="global"]');if(globalImport)globalImport.disabled=!admin;if(!admin)$('#import-target').value='channel';
    $('#color-groups').disabled=!admin;$('#color-groups').title=admin?'Configurar grupos de cores':'Somente administradores podem alterar as cores compartilhadas.';
  }
  function showChannels(){$('#channel-greeting').textContent='Olá, '+(C().session.user||'usuário')+'. Escolha a grade que deseja editar.';$('#channel-overlay').classList.remove('hidden');}
  async function selectChannel(id){
    if(!allowedChannels().includes(id))throw new Error('Seu perfil não tem acesso a este canal.');
    const previous=C().session.channel;if(previous&&previous!==id&&C().hasDirty()&&G().connected)await G().saveNow();
    C().setChannel(id);document.body.dataset.channel=id;const channel=C().CHANNELS[id];$('#channel-overlay').classList.add('hidden');$('#app-shell').classList.remove('hidden');$('#sidebar-channel').textContent=channel.name;$('#sidebar-logo').src=channel.negative;$('#sidebar-logo').alt=channel.name;$('#header-logo').src=document.body.classList.contains('theme-dark')?channel.negative:channel.positive;$('#header-logo').alt=channel.name;document.title='Sistema de Grade - '+channel.name;
    if(G().connected)await G().loadChannel(id);renderAll();
  }
  function renderChannels(){
    const grid=$('#channel-grid');grid.innerHTML='';Object.entries(C().CHANNELS).filter(([id])=>allowedChannels().includes(id)).forEach(([id,channel])=>{const button=document.createElement('button');button.type='button';button.className='channel-choice';button.dataset.channel=id;button.setAttribute('aria-label','Abrir grade da '+channel.name);const img=document.createElement('img');img.src=channel.positive;img.alt=channel.name;button.append(img);button.addEventListener('click',()=>selectChannel(id).catch(err=>toast(err.message,'error')));grid.append(button);});
  }
  function bind(){
    $('#login-button').addEventListener('click',async()=>{try{$('#login-status').textContent='Abrindo a autenticação da Microsoft...';await entrarMicrosoftGraph();}catch(err){console.error(err);$('#login-status').textContent='Não foi possível iniciar o login.';toast(err.message||'Falha no login Microsoft.','error');}});
    $$('.nav-button').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));
    $('#switch-channel').addEventListener('click',showChannels);$('#logout-button').addEventListener('click',logoutSafely);
    $('#sync-now').addEventListener('click',()=>G().sync().then(()=>{renderAll();toast('Sincronização concluída.','success');}).catch(err=>toast(err.message,'error')));
    $('#menu-toggle').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
    $('#sidebar-collapse').addEventListener('click',()=>setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed')));
    $('#modal-close').addEventListener('click',closeModal);$('#modal-backdrop').addEventListener('click',closeModal);$('#drawer-close').addEventListener('click',closeDrawer);$('#drawer-backdrop').addEventListener('click',closeDrawer);
    document.addEventListener('keydown',event=>{trapModalFocus(event);if(event.key==='Escape'){closeModal();closeDrawer();return;}const target=event.target,editing=target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName);if((event.ctrlKey||event.metaKey)&&!event.shiftKey&&String(event.key).toLowerCase()==='z'&&ui.page==='grade'&&!editing&&$('#app-modal').classList.contains('hidden')){event.preventDefault();undoGrade();}});
    $('#previous-week').addEventListener('click',()=>moveWeek(-1));$('#next-week').addEventListener('click',()=>moveWeek(1));$('#current-week').addEventListener('click',()=>{ui.week=C().isoDate(C().startOfWeek(new Date()));ui.day=0;renderGrade();});
    $('#week-picker').addEventListener('change',event=>{if(event.target.value){ui.week=C().isoDate(C().startOfWeek(event.target.value));ui.day=Math.max(0,Math.min(6,Math.round((C().parseLocalDate(event.target.value)-C().startOfWeek(event.target.value))/86400000)));renderGrade();}});
    $('#back-to-week').addEventListener('click',()=>{ui.view='week';renderGrade();});$('#previous-day').addEventListener('click',()=>moveFocusedDay(-1));$('#next-day').addEventListener('click',()=>moveFocusedDay(1));
    $('#grade-search').addEventListener('input',event=>{ui.search=C().normalize(event.target.value);applyCardFilters();});$('#hide-unmatched').addEventListener('change',event=>{ui.hideUnmatched=event.target.checked;renderActiveFilters();applyCardFilters();});
    // Painel de filtros recolhido: abre sob demanda e fecha ao clicar fora ou com Esc.
    $('#toggle-filters')?.addEventListener('click',()=>{
      const painel=$('#filter-panel'),abrindo=painel.classList.contains('hidden');
      painel.classList.toggle('hidden',!abrindo);
      $('#toggle-filters').setAttribute('aria-expanded',String(abrindo));
    });
    document.addEventListener('click',event=>{
      const painel=$('#filter-panel');if(!painel||painel.classList.contains('hidden'))return;
      if(event.target.closest('#filter-panel')||event.target.closest('#toggle-filters')||event.target.closest('#active-filters'))return;
      painel.classList.add('hidden');$('#toggle-filters')?.setAttribute('aria-expanded','false');
    });$('#clear-filters').addEventListener('click',()=>{ui.filters.clear();ui.search='';ui.hideUnmatched=false;$('#grade-search').value='';$('#hide-unmatched').checked=false;renderFilters();applyCardFilters();});
    $('#grade-undo').addEventListener('click',undoGrade);$('#new-schedule').addEventListener('click',()=>openScheduleForm());$('#new-program').addEventListener('click',()=>openProgramForm());$('#color-groups').addEventListener('click',()=>openColorGroupsManager());$('#enrich-catalog')?.addEventListener('click',enriquecerCatalogo);
    $('#catalog-search').addEventListener('input',renderCatalog);['catalog-scope','catalog-type','catalog-origin','catalog-content','catalog-rights','catalog-sort','catalog-category','catalog-subgroup','catalog-grouping'].forEach(id=>$('#'+id).addEventListener('change',renderCatalog));$('#clear-catalog-filters').addEventListener('click',clearCatalogFilters);$('#metrics-period').addEventListener('change',renderMetrics);
    $('#catalog-select-visible').addEventListener('change',toggleVisibleCatalogSelection);$('#catalog-bulk-edit').addEventListener('click',openBulkProgramEditor);$('#catalog-clear-selection').addEventListener('click',()=>{ui.catalogSelected.clear();renderCatalog();});$$('[data-catalog-view]').forEach(button=>button.addEventListener('click',()=>setCatalogView(button.dataset.catalogView)));
    $('#import-file').addEventListener('change',event=>{$('#import-file-name').textContent=event.target.files[0]?.name||'Nenhum arquivo selecionado';ui.importData=null;$('#confirm-import').disabled=true;});
    $('#analyze-import').addEventListener('click',analyzeImport);$('#confirm-import').addEventListener('click',confirmImport);$('#undo-import').addEventListener('click',undoImport);
    $('#export-xlsx').addEventListener('click',exportXlsx);$('#export-template').addEventListener('click',exportTemplate);$('#export-json').addEventListener('click',exportJson);$('#restore-json').addEventListener('change',restoreJson);
    ['alert-type','alert-severity','alert-search'].forEach(id=>$('#'+id).addEventListener(id==='alert-search'?'input':'change',renderAlerts));
    $('#refresh-history').addEventListener('click',renderHistory);$('#new-user-profile').addEventListener('click',()=>openUserProfile());$$('[data-cleanup]').forEach(button=>button.addEventListener('click',()=>openCleanup(button.dataset.cleanup)));
    $('#open-print').addEventListener('click',openPrintOptions);
    $('#theme-toggle').addEventListener('click',()=>applyTheme(document.body.classList.contains('theme-dark')?'light':'dark'));$('#font-toggle').addEventListener('click',()=>{document.body.classList.toggle('text-large');localStorage.setItem('ebc_pref_text_large',document.body.classList.contains('text-large')?'1':'0');});
    $('#grade-zoom').addEventListener('input',event=>setGradeZoom(+event.target.value));$('#zoom-out').addEventListener('click',()=>setGradeZoom(ui.zoom-10));$('#zoom-in').addEventListener('click',()=>setGradeZoom(ui.zoom+10));$('#density-toggle').addEventListener('click',()=>setGradeZoom(ui.zoom>=175?40:ui.zoom+10));
    window.addEventListener('scroll',agendarAtualizacaoDeScroll,{passive:true});window.addEventListener('resize',agendarAtualizacaoDeScroll,{passive:true});
    // A grade rola na horizontal por conta própria. Sem ouvir isso, o cabeçalho fixo
    // ficava para trás das colunas — era a "parte fora do design" ao rolar de lado.
    $('#schedule-board')?.addEventListener('scroll',agendarAtualizacaoDeScroll,{passive:true});
    window.addEventListener('ebc:sync-status',event=>updateSync(event.detail));window.addEventListener('ebc:remote-loaded',renderAll);
    // Alguém salvou junto e o store uniu as duas versões: a tela precisa refletir o resultado.
    window.addEventListener('ebc:merged-remote',event=>{
      renderAll();
      const {incoming=0,conflicts=0}=event.detail||{};
      if(conflicts)toast(conflicts+' item(ns) foram editados por você e por outra pessoa ao mesmo tempo. A sua versão foi mantida.','error');
      else if(incoming)toast(incoming+' alteração(ões) de outra pessoa foram incorporadas à grade.','success');
    });
    window.addEventListener('afterprint',()=>{$('#print-root').innerHTML='';});
  }
  async function logoutSafely(){
    try{if(C().hasDirty()){if(!G().connected)throw new Error('Ha alteracoes locais ainda nao salvas. Conecte o OneDrive e sincronize antes de sair.');await G().saveNow();}await C().clearLocalData();await sairMicrosoftGraph();}
    catch(err){toast(err.message||'Nao foi possivel sair com seguranca.','error');}
  }
  function updateSync({kind,title,detail}){$('#sync-dot').className='status-dot '+({offline:'',pending:'pending',saving:'saving',saved:'saved',error:'error'}[kind]||'');$('#sync-title').textContent=title;$('#sync-detail').textContent=detail;}
  // Proposta visual: preferência local de cada pessoa, guardada só neste navegador.
  // Não vai para o OneDrive, não afeta outras pessoas e não altera dado nenhum —
  // é apenas a classe que ativa assets/css/grade-v6-proposta.css.
  function applyPropostaVisual(ligado){
    document.body.classList.toggle('visual-proposta',!!ligado);
    localStorage.setItem('ebc_visual_proposta',ligado?'1':'0');
    const campo=$('#visual-proposta-toggle');if(campo)campo.checked=!!ligado;
    // O sotaque de cor por canal só existe na proposta, mas escrever sempre é inofensivo.
    if(C()?.session?.channel)document.body.dataset.channel=C().session.channel;
  }
  function applyTheme(theme){document.body.classList.toggle('theme-dark',theme==='dark');localStorage.setItem('ebc_theme',theme);const icon=$('#theme-toggle [data-icon]');if(icon){icon.dataset.icon=theme==='dark'?'sun':'moon';icon.innerHTML='';renderIcons($('#theme-toggle'));}const channel=C().session?.channel&&C().CHANNELS[C().session.channel],header=$('#header-logo');if(channel&&header){header.src=theme==='dark'?channel.negative:channel.positive;header.alt=channel.name;}$('#theme-toggle').setAttribute('aria-label',theme==='dark'?'Usar tema claro':'Usar tema escuro');}
  function setSidebarCollapsed(collapsed){
    document.body.classList.toggle('sidebar-collapsed',collapsed);localStorage.setItem('ebc_sidebar_collapsed',collapsed?'1':'0');
    const toggle=$('#sidebar-collapse'),description=collapsed?'Expandir menu lateral':'Recolher menu lateral';toggle.setAttribute('aria-label',description);toggle.setAttribute('aria-expanded',collapsed?'false':'true');toggle.dataset.tooltip=description;
    $$('.nav-button').forEach(button=>{const label=$('.nav-label',button)?.textContent.trim()||'';button.setAttribute('aria-label',label);if(collapsed)button.dataset.tooltip=label;else delete button.dataset.tooltip;});
    [[`#sync-now`,`Sincronizar agora`],[`#switch-channel`,`Trocar canal`],[`#logout-button`,`Sair`]].forEach(([selector,label])=>{const button=$(selector);button.setAttribute('aria-label',label);if(collapsed)button.dataset.tooltip=label;else delete button.dataset.tooltip;});
  }
  function setGradeZoom(value,rerender=true){ui.zoom=Math.max(40,Math.min(175,Math.round(value/10)*10));localStorage.setItem('ebc_grade_zoom',ui.zoom);document.documentElement.style.setProperty('--minute',(1.6*ui.zoom/100)+'px');$('#grade-zoom').value=ui.zoom;$('#zoom-label').textContent=(ui.zoom>=100?'15 min':ui.zoom>=70?'30 min':'1 h')+' '+String.fromCharCode(183)+' '+ui.zoom+'%';if(rerender)renderGrade();}
  function updateGradeSticky(){const zone=$('.grade-sticky-zone');if(!zone)return;zone.classList.toggle('is-compact',window.scrollY>Math.max(0,zone.offsetTop-104));}
  // O navegador dispara scroll dezenas de vezes por segundo. Sem isto, cada evento
  // forçava leitura de layout e reconstrução de DOM no meio da rolagem — era daí que
  // vinha a piscada. Agora o trabalho acontece uma vez por quadro, junto com a pintura.
  let scrollAgendado=false;
  function agendarAtualizacaoDeScroll(){
    if(scrollAgendado)return;
    scrollAgendado=true;
    requestAnimationFrame(()=>{scrollAgendado=false;updateGradeSticky();updateFloatingDayHeader();});
  }
  function clearDropPreview(){ui.dragItem=null;$$('.drop-preview').forEach(item=>item.remove());$$('.day-track.drag-hover').forEach(track=>track.classList.remove('drag-hover'));$$('.day-track').forEach(track=>delete track._dropSlot);}
  function dropSlotForEvent(track,event,item=ui.dragItem){if(!item)return null;const rect=track.getBoundingClientRect(),minutePx=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6,snappedOpMin=Math.min(1425,Math.max(0,Math.floor(Math.max(0,event.clientY-rect.top)/minutePx/15)*15)),requested=C().timeFromOpMinutes(snappedOpMin);return C().findNearestAvailableSlot(item,track.dataset.date,requested,item.duration);}
  function showDropPreview(track,event){const item=ui.dragItem;if(!item)return;try{const slot=dropSlotForEvent(track,event,item);if(!slot)return;track._dropSlot=slot;$$('.drop-preview').forEach(marker=>{if(marker.parentElement!==track)marker.remove();});let marker=$('.drop-preview',track);if(!marker){marker=document.createElement('div');marker.className='drop-preview';track.append(marker);}const startOp=C().opMinutes(slot.start),duration=Math.max(15,+item.duration||30),end=C().timeFromMinutes(C().minutes(slot.start)+duration);marker.style.top='calc('+startOp+' * var(--minute))';marker.style.height='max(34px,calc('+Math.min(duration,1440-startOp)+' * var(--minute) - 3px))';marker.innerHTML='<strong>'+esc(slot.start)+'–'+esc(end)+'</strong><span>'+esc(C().formatDate(slot.date,{weekday:'short',day:'2-digit',month:'2-digit'}))+(slot.adjusted?' · autoajuste':'')+'</span>';track.classList.add('drag-hover');}catch(_){track._dropSlot=null;}}
  function updateFloatingDayHeader(){const floating=$('#floating-day-header'),board=$('#schedule-board'),shell=$('.timeline-shell',board),zone=$('.grade-sticky-zone');if(!floating||!board||!shell||ui.page!=='grade'){if(floating)floating.hidden=true;return;}const rect=board.getBoundingClientRect(),top=Math.max(0,zone?.getBoundingClientRect().bottom||0),show=rect.top<top&&rect.bottom>top+70;if(!show){floating.hidden=true;return;}const columns=getComputedStyle(shell).gridTemplateColumns,headers=$(':scope > .timeline-header',shell)?$$(':scope > .timeline-header',shell):[];floating.hidden=false;floating.style.left=rect.left+'px';floating.style.top=top+'px';floating.style.width=rect.width+'px';const inner=floating.firstElementChild;
    // Só reconstrói quando o conteúdo realmente mudou (trocou de semana, mudou o zoom,
    // redimensionou). Durante a rolagem, apenas o deslocamento horizontal é reescrito —
    // que é a única coisa que de fato muda ao rolar.
    const assinatura=columns+'|'+shell.scrollWidth+'|'+headers.map(header=>header.className+'~'+header.innerHTML).join('#');
    if(inner.dataset.assinatura!==assinatura){
      inner.dataset.assinatura=assinatura;
      inner.style.width=shell.scrollWidth+'px';
      inner.style.gridTemplateColumns=columns;
      inner.innerHTML=headers.map(header=>'<div class="'+header.className.replace('day-header-button','')+'">'+header.innerHTML+'</div>').join('');
    }
    inner.style.transform='translateX('+(-board.scrollLeft)+'px)';}
  function moveWeek(amount){ui.week=C().isoDate(C().addDays(ui.week,amount*7));renderGrade();}
  function undoGrade(){try{const result=C().undoLastGradeChange();closeDrawer();closeModal();renderAll();toast('Desfeito: '+result.label+'.','success');}catch(err){toast(err.message,'info');}}
  // Arrastar uma exibição que veio de uma regra é onde mais se perde trabalho sem
  // perceber: a pessoa move um dia achando que moveu a faixa inteira — ou o contrário.
  // O motor já sabe os três alcances; o que faltava era a interface perguntar.
  function pedirEscopoDaMudanca(item,changes,aplicar){
    const geradaPorRegra=!!item.ruleId&&item.source!=='manual'&&item.source!=='migration';
    if(!geradaPorRegra){aplicar('one');return;}
    const destino=C().formatDate(changes.date||item.date,{weekday:'long',day:'2-digit',month:'2-digit'});
    const opcao=(valor,titulo,ajuda,marcado)=>'<label class="check-option" style="align-items:flex-start;margin-top:9px"><input type="radio" name="escopo-mudanca" value="'+valor+'" '+(marcado?'checked':'')+'><span><strong>'+titulo+'</strong><br><small class="muted">'+ajuda+'</small></span></label>';
    openModal({
      title:'Mover ‘'+(item.title||'exibição')+'’',
      kicker:'Programação recorrente',
      body:'<p>Esta exibição vem de uma programação recorrente. A mudança para <strong>'+esc(destino)+' às '+esc(changes.start||item.start)+'</strong> vale para o quê?</p>'
        +opcao('one','Somente esta exibição','Cria uma exceção só para este dia. O restante da recorrência continua como está.',true)
        +opcao('future','Esta e as próximas','Altera a própria regra a partir deste dia. As exibições já passadas não mudam.',false)
        +opcao('week','Toda esta semana','Aplica nos dias desta semana que a regra contempla.',false),
      footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="confirmar-escopo" class="button button-primary" type="button">Mover</button>'
    });
    // Cancelar precisa redesenhar: o cartão volta para o lugar de origem.
    $('[data-modal-cancel]').addEventListener('click',()=>{closeModal();renderAll();});
    $('#confirmar-escopo').addEventListener('click',()=>{const escopo=$('input[name="escopo-mudanca"]:checked')?.value||'one';closeModal();aplicar(escopo);});
  }
  function handleAutomaticDrop(event){
    event.preventDefault();event.stopImmediatePropagation();const track=event.currentTarget,raw=event.dataTransfer?.getData('application/json');if(!raw){clearDropPreview();return;}
    try{
      const item=JSON.parse(raw),slot=track._dropSlot||dropSlotForEvent(track,event,item);if(!slot)throw new Error('Não foi possível calcular o novo horário.');clearDropPreview();
      const mudanca={date:slot.date,start:slot.start};
      pedirEscopoDaMudanca(item,mudanca,escopo=>{
        try{
          C().changeOccurrence(item,mudanca,escopo);renderAll();
          const alcance=escopo==='future'?' Vale desta data em diante.':escopo==='week'?' Vale para esta semana.':'';
          toast((slot.adjusted?'Horário ocupado. Ajustado automaticamente para '+C().formatDate(slot.date)+' às '+slot.start+'.':'Programa reposicionado para '+C().formatDate(slot.date)+' às '+slot.start+'.')+alcance,slot.adjusted?'info':'success');
        }catch(err){renderAll();toast(err.message,'error');}
      });
    }catch(err){clearDropPreview();toast(err.message,'error');}
  }
  function openDay(index){ui.day=index;ui.view='day';renderGrade();setTimeout(()=>$('#schedule-board').focus({preventScroll:true}),20);}
  function moveFocusedDay(amount){let next=ui.day+amount;if(next<0){ui.week=C().isoDate(C().addDays(ui.week,-7));next=6;}else if(next>6){ui.week=C().isoDate(C().addDays(ui.week,7));next=0;}ui.day=next;ui.view='day';renderGrade();}
  function isoWeekNumber(value){const date=C().parseLocalDate(value),target=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));target.setUTCDate(target.getUTCDate()+4-(target.getUTCDay()||7));const first=new Date(Date.UTC(target.getUTCFullYear(),0,1));return Math.ceil((((target-first)/86400000)+1)/7);}
  function renderAll(){renderFilters();renderGrade();renderOnAirNow();renderCatalog();renderMetrics();renderAlerts();renderAdmin();if(ui.page==='history')renderHistory();}
  function renderPage(page){if(page==='grade')renderGrade();if(page==='metrics')renderMetrics();if(page==='catalog')renderCatalog();if(page==='alerts')renderAlerts();if(page==='history')renderHistory();if(page==='admin')renderAdmin();}
  // "No ar agora" segundo a GRADE — não é telemetria do sinal. Se a grade estiver
  // incompleta, isto mostra vazio, e é assim que tem de ser: melhor não afirmar nada
  // do que afirmar com confiança algo que não medimos. O rótulo diz isso na cara.
  let relogioNoAr=null;
  function renderOnAirNow(){
    const caixa=$('#on-air-now');if(!caixa)return;
    if(!C().session.channel||ui.page!=='grade'){caixa.hidden=true;return;}
    const agora=new Date(),minutosReais=agora.getHours()*60+agora.getMinutes();
    // Antes das 06:00 ainda é o dia operacional anterior.
    const dataOperacional=minutosReais<360?C().isoDate(C().addDays(C().isoDate(agora),-1)):C().isoDate(agora);
    let itens=[];
    try{itens=C().getOccurrences(C().session.channel,C().isoDate(C().addDays(dataOperacional,-1)),C().isoDate(C().addDays(dataOperacional,1)));}
    catch(_){caixa.hidden=true;return;}
    const agoraOp=C().opMinutes(String(agora.getHours()).padStart(2,'0')+':'+String(agora.getMinutes()).padStart(2,'0'));
    const absolutoAgora=(C().parseLocalDate(dataOperacional).getTime()/86400000|0)*1440+agoraOp;
    const comJanela=itens.map(item=>{
      const inicio=(C().parseLocalDate(item.date).getTime()/86400000|0)*1440+C().opMinutes(item.start);
      return {item,inicio,fim:inicio+Math.max(1,+item.duration||30)};
    }).sort((a,b)=>a.inicio-b.inicio);
    const atual=comJanela.find(x=>absolutoAgora>=x.inicio&&absolutoAgora<x.fim);
    const proximo=comJanela.find(x=>x.inicio>absolutoAgora);
    if(!atual&&!proximo){caixa.hidden=true;return;}
    caixa.hidden=false;
    if(atual){
      const restam=Math.max(0,Math.round(atual.fim-absolutoAgora));
      const texto=restam>=60?Math.floor(restam/60)+'h'+String(restam%60).padStart(2,'0'):restam+' min';
      caixa.innerHTML='<span class="on-air-flag">Segundo a grade</span>'
        +'<strong class="on-air-title">'+esc(atual.item.title)+'</strong>'
        +'<span class="on-air-left">restam '+texto+'</span>'
        +(proximo?'<span class="on-air-next">a seguir · '+esc(proximo.item.title)+' às '+esc(proximo.item.start)+'</span>':'');
    }else{
      caixa.innerHTML='<span class="on-air-flag">Segundo a grade</span><span class="on-air-left">nada programado agora</span>'
        +'<span class="on-air-next">a seguir · '+esc(proximo.item.title)+' às '+esc(proximo.item.start)+'</span>';
    }
  }
  function iniciarRelogioNoAr(){
    if(relogioNoAr)return;
    // Atualiza de minuto em minuto e para com a aba em segundo plano: não faz sentido
    // gastar bateria recalculando um contador que ninguém está vendo.
    relogioNoAr=setInterval(()=>{if(document.visibilityState==='visible')renderOnAirNow();},60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')renderOnAirNow();});
  }
  function renderFilters(){
    const box=$('#grade-filters');box.innerHTML='';C().FILTERS.forEach(filter=>{const b=document.createElement('button');b.type='button';b.className='filter-chip'+(ui.filters.has(filter.id)?' active':'');b.innerHTML='<span class="filter-dot '+filter.id+'"></span>'+esc(filter.label);b.addEventListener('click',()=>{ui.filters.has(filter.id)?ui.filters.delete(filter.id):ui.filters.add(filter.id);renderFilters();applyCardFilters();});box.append(b);});
    renderActiveFilters();
  }
  // Com o painel recolhido, o que está filtrado precisa continuar à vista. Filtro
  // esquecido e invisível faz a pessoa abrir a grade, ver pouca coisa e achar que
  // perdeu programação — é o jeito mais fácil de assustar quem opera.
  function renderActiveFilters(){
    const faixa=$('#active-filters'),contador=$('#filter-count');if(!faixa)return;
    const ativos=C().FILTERS.filter(filter=>ui.filters.has(filter.id));
    const ocultando=$('#hide-unmatched')?.checked;
    const total=ativos.length+(ocultando?1:0);
    if(contador){contador.textContent=String(total);contador.classList.toggle('hidden',!total);}
    $('#toggle-filters')?.classList.toggle('has-filters',!!total);
    faixa.innerHTML='';
    faixa.classList.toggle('hidden',!total);
    if(!total)return;
    ativos.forEach(filter=>{
      const chip=document.createElement('button');
      chip.type='button';chip.className='active-filter-chip';
      chip.innerHTML='<span class="filter-dot '+filter.id+'"></span>'+esc(filter.label)+'<span data-icon="close" aria-hidden="true"></span>';
      chip.setAttribute('aria-label','Remover filtro '+filter.label);
      chip.addEventListener('click',()=>{ui.filters.delete(filter.id);renderFilters();applyCardFilters();});
      faixa.append(chip);
    });
    if(ocultando){
      const chip=document.createElement('button');
      chip.type='button';chip.className='active-filter-chip';
      chip.innerHTML='Ocultando os demais<span data-icon="close" aria-hidden="true"></span>';
      chip.setAttribute('aria-label','Voltar a mostrar os demais programas');
      chip.addEventListener('click',()=>{const campo=$('#hide-unmatched');if(campo){campo.checked=false;ui.hideUnmatched=false;}renderActiveFilters();applyCardFilters();});
      faixa.append(chip);
    }
    renderIcons(faixa);
  }
  function cardClass(item){const category=C().normalize(item.category);if(item.isRerun||item.type==='rerun'||category.includes('reprise'))return'rerun';if(item.type==='live'||category.includes('ao vivo'))return'live';if(category.includes('rncp'))return'rncp';if(item.origin==='own'||category.includes('producao propria'))return'own';if(item.origin==='institutional'||category.includes('institucional')||category.includes('eleitoral'))return'institutional';if(item.origin==='news'||category.includes('jornal'))return'news';if(item.origin==='independent')return'independent';return'licensed';}
  function filterTokens(item){return [item.type,item.isRerun?'rerun':'',item.origin,item.category].map(C().normalize).join(' ');}
  function matches(item){
    const text=C().normalize([item.title,item.episodeTitle,item.category,item.season,item.episodeNumber].join(' '));if(ui.search&&!text.includes(ui.search))return false;
    if(!ui.filters.size)return true;const tokens=filterTokens(item);return [...ui.filters].every(filter=>filter==='recorded'?(item.type==='recorded'&&!item.isRerun):tokens.includes(filter));
  }
  function applyCardFilters(){$$('.schedule-board .program-card').forEach(card=>{const item=card._item,match=matches(item);card.classList.toggle('dimmed',!match&&!ui.hideUnmatched);card.classList.toggle('hidden-card',!match&&ui.hideUnmatched);});}
  function scheduleSegments(item,date){
    const start=C().opMinutes(item.start),duration=Math.max(15,+item.duration||30),end=start+duration,segments=[];
    if(item.date===date&&start<1440)segments.push({startOp:start,duration:Math.min(duration,1440-start),continuation:false});
    const nextDate=C().isoDate(C().addDays(item.date,1));
    if(nextDate===date&&end>1440)segments.push({startOp:0,duration:Math.min(end-1440,1440),continuation:true});
    return segments;
  }
  function focusConflict(conflict){
    if(!conflict)return;const date=conflict.date||conflict.a?.date||ui.week;ui.week=C().isoDate(C().startOfWeek(date));ui.day=Math.max(0,Math.min(6,Math.round((C().parseLocalDate(date)-C().startOfWeek(date))/86400000)));ui.view='day';renderGrade();setTimeout(()=>{const cards=$$('.program-card').filter(card=>card._item?.id===conflict.a?.id||card._item?.id===conflict.b?.id);cards.forEach(card=>{card.classList.add('conflict-focus');setTimeout(()=>card.classList.remove('conflict-focus'),2200);});const board=$('#schedule-board'),op=Math.min(C().opMinutes(conflict.a?.start||'06:00'),C().opMinutes(conflict.b?.start||'06:00'));board?.scrollTo({top:op*(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6)-80,behavior:'smooth'});cards[0]?.focus({preventScroll:true});},30);
  }
  function renderGrade(){
    if(!C().session.channel)return;const start=C().isoDate(C().startOfWeek(ui.week));ui.week=start;const end=C().isoDate(C().addDays(start,6)),items=C().getWeek(C().session.channel,start),detectedConflicts=C().conflicts(items),conflictIds=new Set(detectedConflicts.flatMap(conflict=>[conflict.a.id,conflict.b.id])),currentStart=C().isoDate(C().startOfWeek(new Date()));
    const weekNumber=isoWeekNumber(start),isCurrent=start===currentStart;$('#week-label').textContent=(isCurrent?'Semana atual':'Semana '+weekNumber)+' · '+C().formatDate(start,{day:'2-digit',month:'short'})+' a '+C().formatDate(end,{day:'2-digit',month:'short',year:'numeric'});$('#week-number').textContent='Semana '+weekNumber;$('#week-number').classList.toggle('is-current',isCurrent);$('#current-week').textContent=isCurrent?'Atual':'Voltar à atual';$('#week-subtitle').textContent=C().CHANNELS[C().session.channel].name+' · '+items.length+' exibição(ões) programada(s)';$('#week-picker').value=start;
    $('#grade-summary').innerHTML='<span class="summary-pill">'+items.filter(i=>i.type==='live').length+' ao vivo</span><span class="summary-pill">'+items.filter(i=>i.isRerun).length+' reprises</span><button type="button" class="summary-pill summary-conflict'+(detectedConflicts.length?' has-conflicts':'')+'">'+detectedConflicts.length+' conflitos</button>';if(detectedConflicts.length)$('#grade-summary .summary-conflict').addEventListener('click',()=>focusConflict(detectedConflicts[0]));$('#grade-undo').disabled=!C().canUndoGrade();$('#grade-undo').setAttribute('aria-label',C().canUndoGrade()?'Desfazer última alteração da grade (Ctrl+Z)':'Nenhuma alteração disponível para desfazer');
    const board=$('#schedule-board');board.innerHTML='';board.tabIndex=0;board.classList.remove('density-quarter','density-half','density-hour','density-compact');board.classList.add('density-'+(ui.zoom>=100?'quarter':ui.zoom>=70?'half':'hour'));const shell=document.createElement('div');shell.className='timeline-shell'+(ui.view==='day'?' day-mode':'');board.append(shell);const days=ui.view==='day'?[ui.day]:[0,1,2,3,4,5,6],cornerLeft=document.createElement('div');cornerLeft.className='timeline-header';cornerLeft.textContent='Hora';shell.append(cornerLeft);
    days.forEach(index=>{const date=C().isoDate(C().addDays(start,index)),today=C().isoDate(date)===C().isoDate(new Date()),h=document.createElement(ui.view==='week'?'button':'div');if(h.tagName==='BUTTON'){h.type='button';h.addEventListener('click',()=>openDay(index));h.setAttribute('aria-label','Ampliar '+C().DAYS[index]+' '+C().formatDate(date));}h.className='timeline-header day-header'+(today?' today':'')+(ui.view==='week'?' day-header-button':'');h.innerHTML='<div><strong>'+C().DAYS[index]+'</strong><span>'+C().formatDate(date,{day:'2-digit',month:'2-digit'})+'</span>'+(ui.view==='week'?'<small>Clique para ampliar</small>':'')+'</div>';shell.append(h);});if(ui.view==='week'){const cornerRight=document.createElement('div');cornerRight.className='timeline-header timeline-header-right';cornerRight.textContent='Hora';shell.append(cornerRight);}
    const addAxis=axis=>{for(let slot=0;slot<96;slot++){const label=document.createElement('span');label.className='time-label'+(slot%4===0?' hour':'')+(slot%2===0?' half-hour':'');label.style.top='calc('+(slot*15+7.5)+' * var(--minute))';label.textContent=C().timeFromOpMinutes(slot*15);axis.append(label);}};const axisLeft=document.createElement('div');axisLeft.className='time-axis time-axis-left';addAxis(axisLeft);shell.append(axisLeft);
    days.forEach(index=>{const date=C().isoDate(C().addDays(start,index)),track=document.createElement('div');track.className='day-track'+(date===C().isoDate(new Date())?' today':'');track.dataset.date=date;items.forEach(item=>scheduleSegments(item,date).forEach(segment=>track.append(programCard(item,segment,conflictIds))));track.addEventListener('click',event=>{if(event.target.closest('.program-card'))return;const rect=track.getBoundingClientRect(),minutePx=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6,snappedOpMinutes=Math.floor(Math.max(0,event.clientY-rect.top)/minutePx/15)*15;openScheduleForm(date,C().timeFromOpMinutes(Math.min(1425,snappedOpMinutes)));});track.addEventListener('mousemove',e=>{if(e.target.closest('.program-card')){$('#slot-hover-tooltip')?.classList.remove('active');return;}const tooltip=$('#slot-hover-tooltip');if(!tooltip)return;const rect=track.getBoundingClientRect(),minutePx=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6,snappedOpMin=Math.floor(Math.max(0,e.clientY-rect.top)/minutePx/15)*15;tooltip.textContent=C().timeFromOpMinutes(Math.min(1425,snappedOpMin))+' · Clique para agendar';tooltip.style.left=(e.clientX+12)+'px';tooltip.style.top=(e.clientY+12)+'px';tooltip.classList.add('active');});track.addEventListener('mouseleave',()=>$('#slot-hover-tooltip')?.classList.remove('active'));track.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';showDropPreview(track,e);});track.addEventListener('dragleave',e=>{if(!track.contains(e.relatedTarget)){track.classList.remove('drag-hover');$('.drop-preview',track)?.remove();delete track._dropSlot;}});shell.append(track);});
    $$('.day-track',shell).forEach(track=>track.addEventListener('drop',handleAutomaticDrop,true));
    if(ui.view==='week'){const axisRight=document.createElement('div');axisRight.className='time-axis time-axis-right';addAxis(axisRight);shell.append(axisRight);}$$('.chip-time').forEach(btn=>{btn.onclick=()=>{const time=btn.dataset.time||'06:00',opMin=C().opMinutes(time),minutePx=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6,targetTop=opMin*minutePx;$('#schedule-board')?.scrollTo({top:targetTop,behavior:'smooth'});toast('Horário '+time+' posicionado.','info');};});
    board.onscroll=updateFloatingDayHeader;const focus=$('#day-focus-bar');focus.classList.toggle('hidden',ui.view!=='day');if(ui.view==='day'){$('#focused-day-label').textContent=C().DAYS[ui.day]+' · '+C().formatDate(C().addDays(start,ui.day),{day:'2-digit',month:'long',year:'numeric'});$('#page-title').textContent='Grade do dia';}else $('#page-title').textContent='Grade semanal';updateNowIndicators();applyCardFilters();updateGradeSticky();updateFloatingDayHeader();
  }
  function programCard(item,segment={startOp:C().opMinutes(item.start),duration:Math.max(15,+item.duration||30),continuation:false},conflictIds=new Set()){
    const button=document.createElement('button'),duration=segment.duration,originalDuration=Math.max(15,+item.duration||30),realEnd=C().timeFromMinutes(C().minutes(item.start)+originalDuration),displayStart=segment.continuation?'06:00':item.start;
    let resizing=false,nextDuration=originalDuration,suppressClick=false;
    button.type='button';button.draggable=true;button.className='program-card '+cardClass(item)+(duration<=15?' short-card':duration<=30?' medium-card':'')+(conflictIds.has(item.id)?' conflict':'')+(segment.continuation?' continuation-card':'');button.style.top='calc('+segment.startOp+' * var(--minute))';button.style.height='calc('+duration+' * var(--minute) - 3px)';button.dataset.search=C().normalize([item.title,item.episodeTitle,item.category].join(' '));button._item=item;
    button.addEventListener('dragstart',e=>{if(resizing){e.preventDefault();return;}ui.dragItem=C().clone(item);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/json',JSON.stringify(item));button.classList.add('dragging');});
    button.addEventListener('dragend',()=>{button.classList.remove('dragging');clearDropPreview();});
    const episode=item.episodeNumber||item.episodeTitle?'<span class="program-episode">'+esc(item.season?'T'+item.season+' · ':'')+(item.episodeNumber?'EP '+esc(item.episodeNumber):'')+(item.episodeTitle?' · '+esc(item.episodeTitle):'')+'</span>':'<span class="program-episode">'+esc(item.category||originLabel(item.origin))+'</span>',badges=(item.type==='live'?'<span class="live-pill">AO VIVO</span>':'')+(item.isRerun?'<span class="card-badge">REPRISE</span>':'')+(conflictIds.has(item.id)?'<span class="card-badge conflict-badge">CONFLITO</span>':'');
    button.innerHTML='<span class="program-time"><b>'+esc(displayStart)+'</b><span>'+esc(realEnd)+'</span></span><span class="program-copy"><strong class="program-title">'+esc(item.title)+'</strong>'+episode+'</span><span class="program-badges">'+badges+'</span><span class="program-resize-grip" aria-hidden="true"></span>';
    button.setAttribute('aria-label',displayStart+' a '+realEnd+', '+item.title+'. Arraste para mover; use a alça inferior para ajustar a duração.');
    button.addEventListener('pointerdown',event=>{
      if(!event.target.closest('.program-resize-grip')||event.button!==0)return;
      event.preventDefault();event.stopPropagation();resizing=true;suppressClick=true;button.draggable=false;button.classList.add('resizing');
      const startY=event.clientY,startSegmentDuration=duration,minutePx=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6,pointerId=event.pointerId;
      button.setPointerCapture?.(pointerId);
      const onMove=moveEvent=>{
        const delta=Math.round((moveEvent.clientY-startY)/minutePx/15)*15;
        nextDuration=Math.max(15,Math.min(1440,originalDuration+delta));
        const previewDuration=Math.max(15,startSegmentDuration+(nextDuration-originalDuration));
        button.style.height='calc('+previewDuration+' * var(--minute) - 3px)';
        button.dataset.resizeMinutes=String(nextDuration);
      };
      const finish=()=>{
        button.removeEventListener('pointermove',onMove);button.removeEventListener('pointerup',finish);button.removeEventListener('pointercancel',cancel);
        try{button.releasePointerCapture?.(pointerId);}catch(_){}
        resizing=false;button.draggable=true;button.classList.remove('resizing');delete button.dataset.resizeMinutes;
        if(nextDuration!==originalDuration){
          try{C().changeOccurrence(item,{duration:nextDuration},'one');renderAll();toast('Duração ajustada para '+nextDuration+' minutos.','success');}
          catch(err){renderAll();toast(err.message,'error');}
        }else button.style.height='calc('+duration+' * var(--minute) - 3px)';
        setTimeout(()=>{suppressClick=false;},0);
      };
      const cancel=()=>{nextDuration=originalDuration;finish();};
      button.addEventListener('pointermove',onMove);button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',cancel);
    });
    button.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();return;}openOccurrenceDrawer(item);});
    button.addEventListener('contextmenu',event=>{event.preventDefault();openReplaceOccurrence(item);});applyProgramColor(button,item);queueArtwork(button,item);return button;
  }
  function updateNowIndicators(){
    $$('.now-line').forEach(el=>el.remove());const now=new Date(),realMinutes=now.getHours()*60+now.getMinutes(),today=C().isoDate(now),operationalDate=realMinutes<360?C().isoDate(C().addDays(today,-1)):today,track=$('.day-track[data-date="'+operationalDate+'"]');$$('.schedule-board .program-card').forEach(card=>{const item=card._item,start=C().opMinutes(item.start),opNow=(realMinutes-360+1440)%1440;card.classList.toggle('current',item.date===operationalDate&&opNow>=start&&opNow<start+(+item.duration||30));});if(!track)return;const opNow=(realMinutes-360+1440)%1440,line=document.createElement('div');line.className='now-line';line.style.top='calc('+opNow+' * var(--minute))';line.innerHTML='<span class="now-label">AGORA</span>';track.append(line);
  }
  function openOccurrenceDrawer(item){
    $('#drawer-kicker').textContent=item.isRerun?'Reprise':(item.type==='live'?'Ao vivo':'Exibição');$('#drawer-title').textContent=item.title;
    $('#drawer-content').innerHTML='<div class="metric-grid drawer-facts"><div class="metric"><span>Data</span><strong>'+C().formatDate(item.date)+'</strong></div><div class="metric"><span>Horário</span><strong>'+esc(item.start)+'</strong></div></div><p><strong>Duração:</strong> '+esc(item.duration)+' minutos</p>'+(item.episodeNumber||item.episodeTitle?'<p><strong>Episódio:</strong> '+esc(item.episodeNumber||'')+' '+esc(item.episodeTitle||'')+'</p>':'')+'<p><strong>Classificação:</strong> '+esc(item.category||item.origin||'Não definida')+'</p><div class="drawer-duration-actions" aria-label="Ajustar duração"><button id="drawer-shrink" class="button button-secondary" type="button" '+((+item.duration||30)<=15?'disabled':'')+'>− 15 min</button><button id="drawer-grow" class="button button-secondary" type="button">+ 15 min</button></div><div class="button-row"><button id="drawer-replace" class="button button-secondary" type="button">Substituir programa</button><button id="drawer-dup" class="button button-secondary" type="button"><span data-icon="plus"></span> Duplicar para amanhã (+24h)</button><button id="drawer-edit" class="button button-primary" type="button">Editar ocorrência</button><button id="drawer-delete" class="button button-danger" type="button">Cancelar exibição</button></div>';
    $('#detail-drawer').classList.add('open');$('#detail-drawer').setAttribute('aria-hidden','false');$('#drawer-backdrop').classList.remove('hidden');
    $('#drawer-dup').addEventListener('click',()=>{
      const nextDate=C().isoDate(C().addDays(item.date,1));
      const dup={...item,id:C().uid('dup'),date:nextDate,source:'manual'};
      try{C().saveOccurrence(dup);}catch(err){toast(err.message,'error');return;}
      closeDrawer();renderAll();
      // Dizemos o dia da semana: duplicar a sexta cai no sábado, e isso precisa ficar evidente.
      toast('Exibição duplicada para '+C().formatDate(nextDate,{weekday:'long',day:'2-digit',month:'2-digit'})+' às '+item.start,'success');
    });
    $('#drawer-replace').addEventListener('click',()=>{closeDrawer();openReplaceOccurrence(item);});
    const resizeBy=delta=>{try{const duration=Math.max(15,(+item.duration||30)+delta);C().changeOccurrence(item,{duration},'one');closeDrawer();renderAll();toast('Duração ajustada para '+duration+' minutos.','success');}catch(err){toast(err.message,'error');}};
    $('#drawer-shrink').addEventListener('click',()=>resizeBy(-15));
    $('#drawer-grow').addEventListener('click',()=>resizeBy(15));
    $('#drawer-edit').addEventListener('click',()=>{closeDrawer();openOccurrenceEdit(item);});
    $('#drawer-delete').addEventListener('click',()=>{closeDrawer();openCancelOccurrence(item);});
  }
  function programOptions(selected=''){return C().getCatalog().sort((a,b)=>a.title.localeCompare(b.title,'pt-BR')).map(p=>'<option value="'+esc(p.id)+'" '+(p.id===selected?'selected':'')+'>'+esc(p.title)+'</option>').join('');}
  function openReplaceOccurrence(item){
    const catalog=C().getCatalog().filter(program=>program.id!==item.programId).sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));if(!catalog.length){toast('Não há outro programa disponível no catálogo.','error');return;}
    const scopeOptions=item.source==='rule'?'<option value="one">Somente nesta exibição</option><option value="week">Nesta semana</option><option value="future">Nesta e nas próximas</option>':'<option value="one">Somente nesta exibição</option>';
    openModal({title:'Substituir programa',kicker:'Troca rápida e segura',wide:true,body:'<div class="replace-current"><span>Programa atual</span><strong>'+esc(item.title)+'</strong><small>'+C().formatDate(item.date)+' · '+esc(item.start)+' · '+esc(item.duration)+' min</small></div><label class="field">Buscar programa<input id="replace-search" type="search" placeholder="Digite parte do título, categoria ou subgrupo"></label><label class="field">Novo programa<select id="replace-program" size="8"></select></label><label class="field">Aplicar a troca<select id="replace-scope">'+scopeOptions+'</select></label><div class="notice"><strong>Horário preservado:</strong> a substituição mantém a data, o horário e a duração atuais para não criar sobreposição. Temporada e episódio poderão ser escolhidos depois em “Editar ocorrência”.</div>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="replace-confirm" class="button button-primary" type="button">Substituir programa</button>'});
    const select=$('#replace-program'),renderOptions=()=>{const query=C().normalize($('#replace-search').value),matches=catalog.filter(program=>!query||C().normalize([program.title,program.category,(program.subgroups||[]).join(' ')].join(' ')).includes(query));select.innerHTML=matches.map(program=>'<option value="'+esc(program.id)+'">'+esc(program.title)+(program.category?' · '+esc(program.category):'')+'</option>').join('');$('#replace-confirm').disabled=!matches.length;};
    $('#replace-search').addEventListener('input',renderOptions);$('[data-modal-cancel]').addEventListener('click',closeModal);$('#replace-confirm').addEventListener('click',()=>{try{const replacement=catalog.find(program=>program.id===select.value);if(!replacement)throw new Error('Escolha o novo programa.');const changes={programId:replacement.id,title:replacement.title,type:replacement.type==='unspecified'?item.type:replacement.type,origin:replacement.origin||item.origin,category:replacement.category||'',colorGroupId:replacement.colorGroupId||'',duration:item.duration,isRerun:false,season:'',episodeNumber:'',episodeTitle:''};C().changeOccurrence(item,changes,$('#replace-scope').value);closeModal();renderAll();toast('Programa substituído sem alterar o horário.','success');}catch(err){toast(err.message,'error');}});renderOptions();select.focus();
  }
  function openScheduleForm(preDate='',preTime=''){
    const today=preDate||C().isoDate(new Date()),timeVal=preTime||'12:00',weekday=C().DAYS[(C().parseLocalDate(today).getDay()+6)%7];
    openModal({title:'Programar conteúdo',kicker:'Nova exibição',wide:true,body:
      '<div class="form-grid"><label>Tipo de programação<select id="schedule-mode"><option value="rule">Recorrente</option><option value="manual">Somente uma data</option></select></label><label>Programa<select id="schedule-program"><option value="">Selecione...</option>'+programOptions()+'</select></label></div>'+
      '<div class="inline-fields"><label class="field">Data inicial<input id="schedule-date" type="date" value="'+today+'"></label><label class="field">Horário<input id="schedule-time" type="time" step="900" value="'+timeVal+'"></label><label class="field">Duração (min)<input id="schedule-duration" type="number" min="1" value="30"></label></div>'+
      '<fieldset id="season-fields" class="form-section hidden"><legend>Temporadas e ponto de partida</legend><div id="schedule-season-list" class="check-grid"></div><label class="field">Começar em<select id="schedule-start-episode-id"></select><span class="helper">A sequência segue a partir daí e volta ao início ao terminar.</span></label></fieldset>'+
      '<fieldset id="recurrence-fields" class="form-section"><legend>Dias de exibição principal</legend><div class="check-grid">'+C().DAYS.map(d=>'<label class="check-option"><input name="weekdays" type="checkbox" value="'+d+'" '+(d===weekday?'checked':'')+'>'+d+'</label>').join('')+'</div><div class="form-grid"><label>Encerramento<select id="schedule-end-mode"><option value="none">Sem término</option><option value="date">Em uma data</option><option value="cycles">Após ciclos completos</option></select></label><label>Data final<input id="schedule-end-date" type="date"></label><label>Ciclos da sequência<input id="schedule-cycles" type="number" min="1" value="1"></label><label>Episódio inicial<input id="schedule-start-episode" type="number" min="1" value="1"></label></div></fieldset>'+
      '<fieldset class="form-section"><legend>Formato da exibição</legend><div class="form-grid"><label>Tipo<select id="schedule-type"><option value="live">Ao vivo</option><option value="recorded" selected>Gravado</option><option value="mixed">Misto</option><option value="unspecified">Sem definição</option></select></label><label>Origem<select id="schedule-origin"><option value="own">Produção própria</option><option value="independent">Produção independente</option><option value="licensed" selected>Licenciado</option><option value="news">Jornalismo</option><option value="institutional">Institucional</option></select></label></div><label class="toggle"><input id="schedule-rerun" type="checkbox"> Criar uma reprise vinculada</label><div id="rerun-fields" class="hidden"><div class="inline-fields"><label class="field">Horário da reprise<input id="rerun-time" type="time" step="900" value="20:00"></label><label class="field">Quando<select id="rerun-offset"><option value="0">No mesmo dia</option><option value="1">No dia seguinte</option></select></label></div><label class="toggle"><input id="rerun-any-day" type="checkbox"> Permitir a reprise fora dos dias escolhidos<span class="helper">Desligado, a reprise de sexta não cai no sábado: ela é dispensada.</span></label></div></fieldset>',
      footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="save-schedule" class="button button-primary" type="button">Salvar programação</button>'});
    $('[data-modal-cancel]').addEventListener('click',closeModal);$('#schedule-mode').addEventListener('change',e=>$('#recurrence-fields').classList.toggle('hidden',e.target.value==='manual'));$('#schedule-rerun').addEventListener('change',e=>$('#rerun-fields').classList.toggle('hidden',!e.target.checked));
    const selectedScheduleSeasons=()=>$$('input[name="schedule-season"]:checked',$('#app-modal')).map(input=>input.value);
    const refreshStartEpisodes=()=>{
      const program=C().getCatalog().find(x=>x.id===$('#schedule-program').value),select=$('#schedule-start-episode-id');if(!select)return;
      const sequence=program?C().episodeSequence(program,selectedScheduleSeasons()):[],previous=select.value;
      select.innerHTML=sequence.length?sequence.map(episode=>'<option value="'+esc(episode.id)+'">'+esc((episode.season?'T'+episode.season+' · ':'')+(episode.number?'EP '+episode.number:'Episódio')+(episode.title?' — '+episode.title:''))+'</option>').join(''):'<option value="">Nenhum episódio nas temporadas escolhidas</option>';
      select.disabled=!sequence.length;if(previous&&sequence.some(episode=>String(episode.id)===previous))select.value=previous;
    };
    const updateScheduleEpisodeControl=()=>{
      const program=C().getCatalog().find(x=>x.id===$('#schedule-program').value),mode=program?C().episodeModeFor(program):'none',field=$('#schedule-start-episode')?.closest('label');
      if(field){field.classList.toggle('hidden',mode!=='continuous');field.querySelector('input').disabled=mode!=='continuous';}
      const panel=$('#season-fields');if(!panel)return;
      panel.classList.toggle('hidden',mode!=='catalog');
      if(mode!=='catalog'){$('#schedule-season-list').innerHTML='';return;}
      const seasons=(program.seasons||[]).slice().sort((a,b)=>(+a.order||+a.number||0)-(+b.order||+b.number||0));
      $('#schedule-season-list').innerHTML=seasons.map(season=>'<label class="check-option"><input name="schedule-season" type="checkbox" value="'+esc(season.id)+'" checked>'+esc('T'+(season.number||'?')+(season.title?' · '+season.title:'')+' ('+(season.episodes||[]).length+' ep.)')+'</label>').join('')||'<p class="muted">Este programa ainda não tem temporadas cadastradas.</p>';
      $$('input[name="schedule-season"]',panel).forEach(input=>input.addEventListener('change',refreshStartEpisodes));
      refreshStartEpisodes();
    };
    $('#schedule-program').addEventListener('change',e=>{const p=C().getCatalog().find(x=>x.id===e.target.value);if(p){$('#schedule-duration').value=p.defaultDuration||30;$('#schedule-type').value=p.type==='unspecified'?'recorded':p.type;$('#schedule-origin').value=p.origin||'licensed';}updateScheduleEpisodeControl();});
    updateScheduleEpisodeControl();$('#save-schedule').addEventListener('click',saveScheduleFromForm);
  }
  function saveScheduleFromForm(){
    try{
      const program=C().getCatalog().find(p=>p.id===$('#schedule-program').value);if(!program)throw new Error('Escolha um programa do catálogo.');
      const episodeMode=C().episodeModeFor(program),selectedSeasons=episodeMode==='catalog'?$$('input[name="schedule-season"]:checked',$('#app-modal')).map(input=>input.value):[],startEpisodeId=episodeMode==='catalog'?($('#schedule-start-episode-id')?.value||''):'';
      if(episodeMode==='catalog'&&!selectedSeasons.length)throw new Error('Escolha pelo menos uma temporada.');
      const base={channel:C().session.channel,programId:program.id,title:program.title,startsAt:$('#schedule-date').value,start:$('#schedule-time').value,duration:+$('#schedule-duration').value||program.defaultDuration||30,type:$('#schedule-type').value,origin:program.origin||$('#schedule-origin').value,category:program.category||'',episodeMode,selectedSeasons,startEpisodeId,startEpisode:episodeMode==='continuous'?(+$('#schedule-start-episode')?.value||program.episodeCounter||1):1};
      if($('#schedule-mode').value==='manual'){
        const sequence=episodeMode==='catalog'?C().episodeSequence(program,selectedSeasons):[],chosen=sequence[C().sequenceStartOffset(base,sequence)]||null;
        // Mesma regra da recorrência: metragem própria do episódio vence o slot escolhido.
        const duracaoPropria=+chosen?.duration&&+chosen.duration!==+program.defaultDuration?Math.min(1440,+chosen.duration):0;
        C().saveOccurrence({...base,date:base.startsAt,duration:duracaoPropria||base.duration,season:chosen?.season||'',episodeId:chosen?.id||'',episodeTitle:chosen?.title||'',episodeNumber:episodeMode==='continuous'?base.startEpisode:(chosen?.number||'')});
      }
      else{const weekdays=$$('input[name="weekdays"]:checked',$('#app-modal')).map(i=>i.value);const endMode=$('#schedule-end-mode').value,reruns=$('#schedule-rerun').checked?[{start:$('#rerun-time').value,dayOffset:+$('#rerun-offset').value}]:[];C().saveRule({...base,id:C().uid('rule'),weekdays,endMode,endsAt:endMode==='date'?$('#schedule-end-date').value:'',cycles:endMode==='cycles'?+$('#schedule-cycles').value||1:1,continuous:episodeMode==='continuous',rerunsAnyDay:!!$('#rerun-any-day')?.checked,reruns,active:true});}
      closeModal();renderAll();toast('Programação salva com sucesso.','success');
    }catch(err){toast(err.message,'error');}
  }
  function openOccurrenceEdit(item){
    const program=C().getCatalog().find(entry=>entry.id===item.programId),hasEpisodes=C().episodeModeFor(program||item)!=='none',episodeFields=hasEpisodes?'<label>Número do episódio<input id="edit-episode-number" value="'+esc(item.episodeNumber||'')+'"></label><label>Título do episódio<input id="edit-episode-title" value="'+esc(item.episodeTitle||'')+'"></label>':'<div class="notice episode-notice"><strong>Sem controle de episódios</strong><br>Este programa foi configurado para não numerar exibições.</div>';
    openModal({title:'Editar ocorrência',kicker:'Alteração controlada',body:'<div class="inline-fields"><label class="field">Data<input id="edit-date" type="date" value="'+esc(item.date)+'"></label><label class="field">Horário<input id="edit-time" type="time" value="'+esc(item.start)+'"></label><label class="field">Duração<input id="edit-duration" type="number" min="1" value="'+esc(item.duration)+'"></label></div><div class="form-grid"><label>Título especial<input id="edit-title" value="'+esc(item.title)+'"></label><label>Formato<select id="edit-type"><option value="live" '+(item.type==='live'?'selected':'')+'>Ao vivo</option><option value="recorded" '+(item.type==='recorded'?'selected':'')+'>Gravado</option><option value="rerun" '+(item.isRerun?'selected':'')+'>Reprise</option></select></label>'+episodeFields+'</div><label class="field">Aplicar alteração<select id="edit-scope"><option value="one">Somente nesta ocorrência</option><option value="week">Nesta semana</option><option value="future">Nesta e nas próximas</option></select></label>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="save-occurrence" class="button button-primary" type="button">Salvar alteração</button>'});
    $('[data-modal-cancel]').addEventListener('click',closeModal);$('#save-occurrence').addEventListener('click',()=>{try{const changes={date:$('#edit-date').value,start:$('#edit-time').value,duration:+$('#edit-duration').value||30,title:$('#edit-title').value.trim()||item.title,type:$('#edit-type').value,isRerun:$('#edit-type').value==='rerun',episodeNumber:$('#edit-episode-number')?.value.trim()||'',episodeTitle:$('#edit-episode-title')?.value.trim()||''};C().changeOccurrence(item,changes,$('#edit-scope').value);closeModal();renderAll();toast('Ocorrência atualizada.','success');}catch(err){toast(err.message,'error');}});
  }
  function openCancelOccurrence(item){
    openModal({title:'Cancelar exibição',kicker:'Confirmação',body:'<p>Você está cancelando <strong>'+esc(item.title)+'</strong> em '+C().formatDate(item.date)+' às '+esc(item.start)+'.</p>'+(item.source==='rule'?'<label class="field">Aplicar cancelamento<select id="cancel-scope"><option value="one">Somente nesta ocorrência</option><option value="future">Nesta e nas próximas</option></select></label>':''),footer:'<button class="button button-secondary" data-modal-cancel type="button">Voltar</button><button id="confirm-cancel" class="button button-danger" type="button">Cancelar exibição</button>'});
    $('[data-modal-cancel]').addEventListener('click',closeModal);$('#confirm-cancel').addEventListener('click',()=>{C().cancelOccurrence(item,$('#cancel-scope')?.value||'one');closeModal();renderAll();toast('Exibição cancelada.','success');});
  }
  function clearCatalogFilters(){['catalog-scope','catalog-type','catalog-origin','catalog-content','catalog-rights','catalog-category','catalog-subgroup'].forEach(id=>$('#'+id).value='all');$('#catalog-sort').value='title';$('#catalog-grouping').value='none';$('#catalog-search').value='';renderCatalog();}
  function catalogEpisodeCount(program){return (program.seasons||[]).reduce((sum,season)=>sum+Math.max((season.episodes||[]).length,+season.episodeCount||0),0);}
  function catalogExpiry(program){return (program.rights||[]).map(right=>right.endsAt).filter(Boolean).sort()[0]||'';}
  function catalogSearchText(program){return C().normalize([program.title,program.category,(program.subgroups||[]).join(' '),program.origin,(program.seasons||[]).flatMap(season=>[season.title,season.number,...(season.episodes||[]).flatMap(episode=>[episode.number,episode.title,episode.synopsis])]).join(' '),(program.rights||[]).flatMap(right=>[right.contract,right.startsAt,right.endsAt]).join(' '),JSON.stringify(program.raw||{})].join(' '));}
  function matchesCatalogRights(program,filter){if(filter==='all')return true;const rights=program.rights||[];if(filter==='none')return !rights.length||!rights.some(right=>right.endsAt||right.contract);const expiry=catalogExpiry(program);if(!expiry)return false;const today=C().parseLocalDate(new Date()),days=Math.ceil((C().parseLocalDate(expiry)-today)/86400000);if(filter==='expired')return days<0;if(filter==='expiring')return days>=0&&days<=60;return filter==='active'&&days>60;}
  function catalogKey(program){return program.scope+':'+program.id;}
  function catalogKnownValues(programs,field){const values=programs.flatMap(program=>field==='subgroups'?(program.subgroups||[]):[program[field]]).map(value=>String(value||'').trim()).filter(Boolean);return [...new Map(values.map(value=>[C().normalize(value),value])).values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));}
  function updateCatalogSelect(id,values,label){const select=$('#'+id),selected=select.value||'all';select.innerHTML='<option value="all">'+label+'</option>'+values.map(value=>'<option value="'+esc(C().normalize(value))+'">'+esc(value)+'</option>').join('');select.value=[...select.options].some(option=>option.value===selected)?selected:'all';}
  function setCatalogView(view){ui.catalogView=['list','cards','compact'].includes(view)?view:'list';localStorage.setItem('ebc_catalog_view',ui.catalogView);renderCatalog();}
  function updateCatalogCommandbar(){
    const editableVisible=ui.catalogVisible.filter(program=>program.scope==='channel'||C().isAdmin()),selectedVisible=editableVisible.filter(program=>ui.catalogSelected.has(catalogKey(program))),allVisible=editableVisible.length&&selectedVisible.length===editableVisible.length,select=$('#catalog-select-visible');
    select.checked=!!allVisible;select.indeterminate=selectedVisible.length>0&&!allVisible;select.disabled=!editableVisible.length;$('#catalog-selection-count').textContent=ui.catalogSelected.size?ui.catalogSelected.size+' selecionado(s)':'Nenhum selecionado';$('#catalog-bulk-edit').disabled=!ui.catalogSelected.size;$('#catalog-clear-selection').disabled=!ui.catalogSelected.size;
  }
  function toggleVisibleCatalogSelection(event){const editable=ui.catalogVisible.filter(program=>program.scope==='channel'||C().isAdmin());editable.forEach(program=>event.target.checked?ui.catalogSelected.add(catalogKey(program)):ui.catalogSelected.delete(catalogKey(program)));renderCatalog();}
  function catalogGroupLabel(program,grouping){
    if(grouping==='category')return program.category||'Sem categoria';if(grouping==='subgroup')return (program.subgroups||[])[0]||'Sem subgrupo';if(grouping==='origin')return originLabel(program.origin);if(grouping==='color')return colorGroupForProgram(program)?.name||'Cor automática';return'';
  }
  function clBadgeHtml(clKey){
    if(!clKey)return '';
    const file=clKey==='Livre'?'Livre.svg':(clKey.endsWith('_anos')?clKey+'.svg':'');
    if(!file)return '';
    const label=clKey==='Livre'?'Livre':clKey.replace('_anos',' anos');
    return '<span class="cl-badge" title="Classificação indicativa: '+esc(label)+'"><img src="assets/cl/'+file+'" alt="'+esc(label)+'"></span>';
  }
  function renderCatalogProgram(program){
    const row=document.createElement('article'),episodeMode=C().episodeModeFor(program),seasons=(program.seasons||[]).length,eps=catalogEpisodeCount(program),expiry=catalogExpiry(program)||'Sem data',colorGroup=colorGroupForProgram(program),canEdit=program.scope==='channel'||C().isAdmin(),key=catalogKey(program),selected=ui.catalogSelected.has(key),subgroups=(program.subgroups||[]).map(value=>'<span class="subgroup-pill">'+esc(value)+'</span>').join(''),actions=canEdit?'<button class="icon-button edit-program" type="button" aria-label="Editar programa"><span data-icon="settings"></span></button><button class="icon-button delete-program" type="button" aria-label="Excluir programa"><span data-icon="close"></span></button>':'<span class="muted">Somente leitura</span>',episodeCells=episodeMode==='catalog'?'<div class="catalog-cell"><span>Temporadas</span><strong>'+seasons+'</strong></div><div class="catalog-cell"><span>Episódios</span><strong>'+eps+'</strong></div>':episodeMode==='continuous'?'<div class="catalog-cell"><span>Controle</span><strong>Contínuo</strong></div><div class="catalog-cell"><span>Próximo número</span><strong>'+esc(program.episodeCounter||1)+'</strong></div>':'<div class="catalog-cell"><span>Formato</span><strong>'+esc(typeLabel(program.type))+'</strong></div><div class="catalog-cell"><span>Duração padrão</span><strong>'+esc(program.defaultDuration||30)+' min</strong></div>';
    row.className='catalog-row'+(selected?' selected':'');row.dataset.catalogKey=key;row.innerHTML='<label class="catalog-check" title="Selecionar '+esc(program.title)+'"><input class="select-program" type="checkbox" '+(selected?'checked':'')+' '+(canEdit?'':'disabled')+'><span class="sr-only">Selecionar '+esc(program.title)+'</span></label><div class="catalog-main"><div class="catalog-badges"><span class="scope-pill '+(program.scope==='global'?'global':'')+'">'+(program.scope==='global'?'Global':'Canal')+'</span><span class="type-pill">'+esc(typeLabel(program.type))+'</span><span class="origin-pill">'+esc(originLabel(program.origin))+'</span>'+clBadgeHtml(program.cl)+(colorGroup?'<span class="color-group-pill"><i></i>'+esc(colorGroup.name)+'</span>':'')+'</div><h3>'+esc(program.title)+'</h3><p><strong>'+(program.category?esc(program.category):'Sem categoria')+'</strong></p><div class="subgroup-list">'+(subgroups||'<span class="subgroup-pill muted">Sem subgrupo</span>')+'</div></div>'+episodeCells+'<div class="catalog-cell"><span>Vigência</span><strong>'+esc(expiry==='Sem data'?expiry:C().formatDate(expiry))+'</strong></div><div class="catalog-actions">'+actions+'</div>';
    if(colorGroup){const pill=row.querySelector('.color-group-pill');pill.style.setProperty('--group-bg',colorGroup.background);pill.style.setProperty('--group-text',colorGroup.text);pill.style.setProperty('--group-accent',colorGroup.accent);}
    row.querySelector('.select-program')?.addEventListener('change',event=>{event.target.checked?ui.catalogSelected.add(key):ui.catalogSelected.delete(key);row.classList.toggle('selected',event.target.checked);updateCatalogCommandbar();});
    row.querySelector('.edit-program')?.addEventListener('click',()=>openProgramForm(program));
    row.querySelector('.delete-program')?.addEventListener('click',()=>confirmProgramDelete(program));
    row.addEventListener('click',event=>{
      if(event.target.closest('.select-program, .catalog-actions, button, input, label, a'))return;
      if(canEdit)openProgramForm(program);
    });
    queueArtwork(row,program);renderIcons(row);return row;
  }
  function renderMetrics(){
    const summary=$('#metrics-summary'),list=$('#metrics-list');if(!summary||!list||!C().session.channel)return;
    const period=$('#metrics-period')?.value||'week',today=C().isoDate(new Date()),selectedStart=C().isoDate(C().startOfWeek(ui.week));let from=selectedStart,to=C().isoDate(C().addDays(selectedStart,6));
    if(period==='month'){const now=new Date();from=C().isoDate(new Date(now.getFullYear(),now.getMonth(),1));to=C().isoDate(new Date(now.getFullYear(),now.getMonth()+1,0));}
    if(period==='year'){const now=new Date();from=C().isoDate(new Date(now.getFullYear(),0,1));to=C().isoDate(new Date(now.getFullYear(),11,31));}
    if(period==='all'){const raw=C().state.channels[C().session.channel]||{},dates=[...(raw.occurrences||[]).map(item=>item.date),...(raw.rules||[]).map(item=>item.startsAt)].filter(Boolean).sort();from=dates[0]||C().isoDate(C().addDays(new Date(),-365));to=today>selectedStart?today:selectedStart;}
    let items=[];try{items=C().getOccurrences(C().session.channel,from,to);}catch(err){list.innerHTML='<div class="empty-state compact"><p>Não foi possível calcular as métricas agora.</p></div>';return;}
    const grouped=new Map();items.forEach(item=>{const key=item.programId||'title_'+C().normalize(item.title);const row=grouped.get(key)||{title:item.title||'Programa sem título',count:0,minutes:0,primary:0,reruns:0,dates:new Set()};row.count++;row.minutes+=Math.max(0,+item.duration||0);row.primary+=item.isRerun?0:1;row.reruns+=item.isRerun?1:0;row.dates.add(item.date);grouped.set(key,row);});
    const rows=[...grouped.values()].sort((a,b)=>b.minutes-a.minutes||b.count-a.count||a.title.localeCompare(b.title,'pt-BR')),totalMinutes=rows.reduce((sum,row)=>sum+row.minutes,0),formatDuration=minutes=>{const h=Math.floor(minutes/60),m=minutes%60;return h?(h+'h '+(m?m+'min':'')):m+'min';};
    summary.innerHTML='<div class="metric"><span>Programas exibidos</span><strong>'+rows.length+'</strong></div><div class="metric"><span>Exibições</span><strong>'+items.length+'</strong></div><div class="metric"><span>Tempo ocupado</span><strong>'+esc(formatDuration(totalMinutes))+'</strong></div><div class="metric"><span>Reprises</span><strong>'+items.filter(item=>item.isRerun).length+'</strong></div>';
    list.innerHTML=rows.length?rows.map(row=>'<article class="metrics-row"><div class="metrics-program"><strong>'+esc(row.title)+'</strong><span>'+row.dates.size+' dia(s) no período</span></div><div class="metrics-value"><span>Exibições</span><strong>'+row.count+'</strong></div><div class="metrics-value"><span>Tempo</span><strong>'+esc(formatDuration(row.minutes))+'</strong></div><div class="metrics-value"><span>Principais / reprises</span><strong>'+row.primary+' / '+row.reruns+'</strong></div></article>').join(''):'<div class="empty-state compact"><p>Nenhuma exibição encontrada neste período.</p></div>';
  }
  function renderCatalog(){
    if(!C().session.channel)return;const scope=$('#catalog-scope').value||'all',all=C().getCatalog(scope);updateCatalogSelect('catalog-category',catalogKnownValues(all,'category'),'Todas as categorias');updateCatalogSelect('catalog-subgroup',catalogKnownValues(all,'subgroups'),'Todos os subgrupos');
    const type=$('#catalog-type').value||'all',origin=$('#catalog-origin').value||'all',category=$('#catalog-category').value||'all',subgroup=$('#catalog-subgroup').value||'all',content=$('#catalog-content').value||'all',rights=$('#catalog-rights').value||'all',sort=$('#catalog-sort').value||'title',grouping=$('#catalog-grouping').value||'none',query=C().normalize($('#catalog-search').value),list=all.filter(program=>{const episodes=catalogEpisodeCount(program),programSubgroups=(program.subgroups||[]).map(C().normalize);return(!query||catalogSearchText(program).includes(query))&&(type==='all'||program.type===type)&&(origin==='all'||program.origin===origin)&&(category==='all'||C().normalize(program.category)===category)&&(subgroup==='all'||programSubgroups.includes(subgroup))&&(content==='all'||(content==='episodes'&&episodes>0)||(content==='continuous'&&program.continuous)||(content==='empty'&&!episodes&&!program.continuous))&&matchesCatalogRights(program,rights);});
    const episodes=all.reduce((sum,p)=>sum+catalogEpisodeCount(p),0);$('#catalog-stats').innerHTML='<div class="metric"><span>Programas</span><strong>'+all.length+'</strong></div><div class="metric"><span>Resultados</span><strong>'+list.length+'</strong></div><div class="metric"><span>Episódios cadastrados</span><strong>'+episodes+'</strong></div><div class="metric"><span>Sem categoria</span><strong>'+all.filter(p=>!String(p.category||'').trim()||C().normalize(p.category)==='licenciado').length+'</strong></div>';
    list.sort((a,b)=>sort==='expiry'?(catalogExpiry(a)||'9999').localeCompare(catalogExpiry(b)||'9999'):sort==='updated'?String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')):a.title.localeCompare(b.title,'pt-BR'));ui.catalogVisible=list;const box=$('#catalog-list');box.className='catalog-list view-'+ui.catalogView;$$('[data-catalog-view]').forEach(button=>button.classList.toggle('active',button.dataset.catalogView===ui.catalogView));box.innerHTML='';if(!list.length){box.innerHTML='<div class="empty-state"><p>Nenhum programa encontrado.</p></div>';updateCatalogCommandbar();return;}
    if(grouping==='none')list.forEach(program=>box.append(renderCatalogProgram(program)));else{const groups=new Map();list.forEach(program=>{const label=catalogGroupLabel(program,grouping);if(!groups.has(label))groups.set(label,[]);groups.get(label).push(program);});[...groups.entries()].sort(([a],[b])=>a.localeCompare(b,'pt-BR')).forEach(([label,programs])=>{const section=document.createElement('section');section.className='catalog-group';section.innerHTML='<header><div><p class="eyebrow">Agrupamento</p><h3>'+esc(label)+'</h3></div><span>'+programs.length+' programa(s)</span></header><div class="catalog-group-items"></div>';const target=$('.catalog-group-items',section);programs.forEach(program=>target.append(renderCatalogProgram(program)));box.append(section);});}
    updateCatalogCommandbar();
  }
  function selectedCatalogPrograms(){const map=new Map(C().getCatalog().map(program=>[catalogKey(program),program]));return [...ui.catalogSelected].map(key=>map.get(key)).filter(Boolean).filter(program=>program.scope==='channel'||C().isAdmin());}
  function bulkFieldToggle(id,fieldId){const toggle=$('#'+id),field=$('#'+fieldId);const sync=()=>{field.disabled=!toggle.checked;field.closest('label')?.classList.toggle('field-disabled',!toggle.checked);};toggle.addEventListener('change',sync);sync();}
  function openBulkProgramEditor(){
    const selected=selectedCatalogPrograms();if(!selected.length){toast('Selecione pelo menos um programa editável.','error');return;}const all=C().getCatalog(),categories=catalogKnownValues(all,'category'),subgroups=catalogKnownValues(all,'subgroups');
    openModal({title:'Editar '+selected.length+' programa(s)',kicker:'Alteração em lote',wide:true,body:'<div class="bulk-edit-summary"><strong>'+selected.length+' selecionado(s)</strong><span>Somente os campos marcados serão alterados.</span></div><div class="bulk-edit-grid"><label class="bulk-field"><span><input id="bulk-use-origin" type="checkbox"> Alterar origem</span><select id="bulk-origin"><option value="licensed">Licenciado</option><option value="own">Produção própria</option><option value="independent">Produção independente / RNCP</option><option value="news">Jornalismo</option><option value="institutional">Institucional</option></select></label><label class="bulk-field"><span><input id="bulk-use-type" type="checkbox"> Alterar formato</span><select id="bulk-type"><option value="unspecified">Sem definição</option><option value="recorded">Gravado</option><option value="live">Ao vivo</option><option value="mixed">Misto</option></select></label><label class="bulk-field"><span><input id="bulk-use-category" type="checkbox"> Alterar categoria principal</span><input id="bulk-category" list="bulk-category-list" placeholder="Ex.: Documentário"><datalist id="bulk-category-list">'+categories.map(value=>'<option value="'+esc(value)+'"></option>').join('')+'</datalist></label><label class="bulk-field"><span><input id="bulk-use-subgroups" type="checkbox"> Alterar subgrupos</span><select id="bulk-subgroup-mode"><option value="add">Adicionar aos existentes</option><option value="replace">Substituir os existentes</option><option value="remove">Remover dos existentes</option></select><input id="bulk-subgroups" list="bulk-subgroup-list" placeholder="Música; Cultura; Infantil"><datalist id="bulk-subgroup-list">'+subgroups.map(value=>'<option value="'+esc(value)+'"></option>').join('')+'</datalist><small>Separe vários por ponto e vírgula.</small></label><label class="bulk-field"><span><input id="bulk-use-color" type="checkbox"> Alterar grupo de cor</span><select id="bulk-color"><option value="">Automático pela classificação</option>'+C().getColorGroups().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(group=>'<option value="'+esc(group.id)+'">'+esc(group.name)+'</option>').join('')+'</select></label></div><label class="toggle bulk-propagate"><input id="bulk-propagate" type="checkbox" checked> Atualizar também regras e exibições futuras desses programas</label><div class="notice"><strong>Antes de salvar:</strong> contratos, temporadas, episódios e exibições passadas não serão apagados. O salvamento automático criará uma nova versão recuperável.</div>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="save-bulk-programs" class="button button-primary" type="button">Aplicar alterações</button>'});
    [['bulk-use-origin','bulk-origin'],['bulk-use-type','bulk-type'],['bulk-use-category','bulk-category'],['bulk-use-subgroups','bulk-subgroups'],['bulk-use-color','bulk-color']].forEach(args=>bulkFieldToggle(...args));$('[data-modal-cancel]').addEventListener('click',closeModal);$('#save-bulk-programs').addEventListener('click',saveBulkProgramEditor);
  }
  function saveBulkProgramEditor(){
    try{const changes={};if($('#bulk-use-origin').checked)changes.origin=$('#bulk-origin').value;if($('#bulk-use-type').checked)changes.type=$('#bulk-type').value;if($('#bulk-use-category').checked)changes.category=$('#bulk-category').value.trim();if($('#bulk-use-subgroups').checked)changes.subgroups=$('#bulk-subgroups').value;if($('#bulk-use-color').checked)changes.colorGroupId=$('#bulk-color').value;if(!Object.keys(changes).length)throw new Error('Marque pelo menos um campo para alterar.');const refs=selectedCatalogPrograms().map(program=>({id:program.id,scope:program.scope})),result=C().bulkUpdatePrograms(refs,changes,{subgroupMode:$('#bulk-subgroup-mode').value,propagate:$('#bulk-propagate').checked});ui.catalogSelected.clear();closeModal();renderAll();toast(result.changed+' programa(s) atualizados. O salvamento automático foi acionado.','success');}catch(err){toast(err.message,'error');}
  }
  function typeLabel(type){return({live:'Ao vivo',recorded:'Gravado',mixed:'Misto',unspecified:'Sem definição',rerun:'Reprise'})[type]||type||'Sem definição';}
  function originLabel(origin){return({own:'Produção própria',independent:'Produção independente',licensed:'Licenciado',news:'Jornalismo',institutional:'Institucional'})[origin]||origin||'Não definida';}
  const COLOR_MATCH_LABELS={licensed:'Licenciamento',rncp:'RNCP',own:'Produção própria',live:'Ao vivo',independent:'Produção independente',news:'Jornalismo',institutional:'Institucional',rerun:'Reprise'};
  function safeHex(value,fallback='#FFFFFF'){const color=String(value||'').trim().toUpperCase();return /^#[0-9A-F]{6}$/.test(color)?color:fallback;}
  function colorGroupForProgram(program){const groups=C().getColorGroups(),assigned=groups.find(group=>group.id===program?.colorGroupId);return assigned||groups.find(group=>group.match===cardClass(program||{}))||null;}
  function colorGroupForItem(item){const catalog=C().getCatalog(),program=(item.programId&&catalog.find(entry=>entry.id===item.programId))||catalog.find(entry=>C().normalize(entry.title)===C().normalize(item.title)),groups=C().getColorGroups(),assigned=groups.find(group=>group.id===(item.colorGroupId||program?.colorGroupId));return assigned||groups.find(group=>group.match===cardClass(item))||null;}
  function applyProgramColor(element,item,printing=false){const group=colorGroupForItem(item);if(!group||!element)return;element.classList.add('has-program-color');element.dataset.colorGroup=group.id;element.style.setProperty('--program-bg',safeHex(group.background));element.style.setProperty('--program-text',safeHex(group.text,'#12203A'));element.style.setProperty('--program-accent',safeHex(group.accent,'#2E6AC2'));element.style.backgroundColor=safeHex(group.background);element.style.color=safeHex(group.text,'#12203A');element.style.borderLeftColor=safeHex(group.accent,'#2E6AC2');}
  function colorGroupOptions(selected=''){return '<option value="">Automático pela classificação</option>'+C().getColorGroups().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(group=>'<option value="'+esc(group.id)+'" '+(group.id===selected?'selected':'')+'>'+esc(group.name)+(group.match?' · automático: '+esc(COLOR_MATCH_LABELS[group.match]||group.match):'')+'</option>').join('');}
  function updateProgramColorHelp(){const id=$('#program-color-group')?.value,help=$('#program-color-help');if(!help)return;let group=C().getColorGroups().find(item=>item.id===id),automatic=false;if(!group){group=colorGroupForProgram({type:$('#program-type')?.value,origin:$('#program-origin')?.value,category:$('#program-category')?.value||''});automatic=true;}if(!group){help.textContent='Automático pela classificação';help.removeAttribute('style');return;}help.textContent=(automatic?'Automático: ':'')+group.name;help.style.setProperty('--group-bg',safeHex(group.background));help.style.setProperty('--group-text',safeHex(group.text,'#12203A'));help.style.setProperty('--group-accent',safeHex(group.accent,'#2E6AC2'));}
  function colorMatchOptions(selected=''){return '<option value="">Somente quando selecionado no programa</option>'+Object.entries(COLOR_MATCH_LABELS).map(([value,label])=>'<option value="'+value+'" '+(value===selected?'selected':'')+'>Automático: '+esc(label)+'</option>').join('');}
  function colorField(label,id,value){const color=safeHex(value);return '<label>'+label+'<span class="color-input-pair"><input id="'+id+'-picker" type="color" value="'+color.toLowerCase()+'" aria-label="Escolher '+label.toLowerCase()+'"><input id="'+id+'" value="'+color+'" maxlength="7" spellcheck="false" aria-label="Código hexadecimal de '+label.toLowerCase()+'"></span></label>';}
  function colorLuminance(hex){const values=safeHex(hex).slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.03928?value/12.92:Math.pow((value+.055)/1.055,2.4));return .2126*values[0]+.7152*values[1]+.0722*values[2];}
  function colorContrast(background,text){const a=colorLuminance(background),b=colorLuminance(text);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
  function renderColorPreview(){const background=safeHex($('#color-background')?.value),licensed=$('#color-id')?.value==='color_licensed'||$('#color-match')?.value==='licensed',palette=C().deriveColorPalette(background,licensed),name=$('#color-name')?.value.trim()||'Exemplo do programa',preview=$('#color-preview'),status=$('#color-contrast');if(!preview||!status)return;preview.style.setProperty('--program-bg',palette.background);preview.style.setProperty('--program-text',palette.text);preview.style.setProperty('--program-accent',palette.accent);preview.querySelector('strong').textContent=name;status.textContent=licensed?'Licenciamento mantém o padrão branco e azul.':'Texto e destaque calculados automaticamente · contraste '+palette.contrast.toFixed(1)+':1';status.className='contrast-status good';}
  function bindColorField(id){const picker=$('#'+id+'-picker'),input=$('#'+id);picker.addEventListener('input',()=>{input.value=picker.value.toUpperCase();renderColorPreview();});input.addEventListener('input',()=>{const value=input.value.trim();if(/^#[0-9a-f]{6}$/i.test(value))picker.value=value;renderColorPreview();});}
  function openColorGroupsManager(selectedId=''){
    if(!C().isAdmin()){toast('Somente administradores podem alterar as cores compartilhadas.','error');return;}
    const groups=C().getColorGroups().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),selected=groups.find(group=>group.id===selectedId)||{id:'',name:'',match:'',background:'#FFFFFF',text:'#12203A',accent:'#2E6AC2'};
    const list=groups.length?groups.map(group=>'<article class="color-group-row"><button class="color-group-main edit-color-group" data-color-edit="'+esc(group.id)+'" type="button"><span class="color-swatch" style="--swatch-bg:'+safeHex(group.background)+';--swatch-accent:'+safeHex(group.accent)+'"></span><span><strong>'+esc(group.name)+'</strong><small>'+(group.match?'Automático: '+esc(COLOR_MATCH_LABELS[group.match]||group.match):'Seleção manual')+' · '+C().colorGroupUsage(group.id)+' programa(s)</small></span></button><button class="icon-button delete-color-group" data-color-delete="'+esc(group.id)+'" type="button" aria-label="Excluir grupo '+esc(group.name)+'"><span data-icon="close"></span></button></article>').join(''):'<div class="empty-state compact"><p>Nenhum grupo cadastrado.<br>Crie o primeiro grupo ao lado.</p></div>';
    openModal({title:'Cores dos programas',kicker:'Identidade visual compartilhada',wide:true,body:'<p class="muted">Escolha apenas a cor de fundo. O sistema calcula automaticamente o texto e o destaque com contraste seguro. As alterações serão salvas no catálogo global.</p><div class="color-manager-layout"><section><div class="color-manager-heading"><h3>Grupos cadastrados</h3><button id="new-color-group" class="button button-secondary button-compact" type="button"><span data-icon="plus"></span> Novo</button></div><div class="color-group-list">'+list+'</div></section><section class="color-editor"><h3>'+(selected.id?'Editar grupo':'Novo grupo')+'</h3><input id="color-id" type="hidden" value="'+esc(selected.id)+'"><div class="form-grid color-editor-grid"><label>Nome do grupo<input id="color-name" value="'+esc(selected.name)+'" placeholder="Ex.: Infantil"></label><label>Aplicação<select id="color-match">'+colorMatchOptions(selected.match)+'</select></label>'+colorField('Fundo','color-background',selected.background)+'</div><div id="color-preview" class="program-card has-program-color color-preview-card"><span class="program-time"><b>16:00</b><span>17:00</span></span><span class="program-copy"><strong class="program-title">Exemplo do programa</strong><span class="program-episode">Título do episódio</span></span><span class="program-badges"><span class="card-badge">PRÉVIA</span></span></div><p id="color-contrast" class="contrast-status"></p></section></div>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Fechar</button><button id="save-color-group" class="button button-primary" type="button">Salvar grupo</button>'});
    $$('.edit-color-group').forEach(button=>button.addEventListener('click',()=>openColorGroupsManager(button.dataset.colorEdit)));$$('.delete-color-group').forEach(button=>button.addEventListener('click',()=>confirmColorGroupDelete(button.dataset.colorDelete)));$('#new-color-group').addEventListener('click',()=>openColorGroupsManager());bindColorField('color-background');['color-name','color-match'].forEach(id=>$('#'+id).addEventListener(id==='color-name'?'input':'change',renderColorPreview));$('[data-modal-cancel]').addEventListener('click',closeModal);$('#save-color-group').addEventListener('click',saveColorGroupForm);renderColorPreview();
  }
  function saveColorGroupForm(){try{const background=$('#color-background').value.trim();if(!/^#[0-9a-f]{6}$/i.test(background))throw new Error('Use a cor no formato hexadecimal, como #2E6AC2.');const saved=C().saveColorGroup({id:$('#color-id').value||'',name:$('#color-name').value,match:$('#color-match').value,background});renderAll();openColorGroupsManager(saved.id);toast('Grupo de cor salvo e sincronizado.','success');}catch(err){toast(err.message,'error');}}
  function confirmColorGroupDelete(id){const group=C().getColorGroups().find(item=>item.id===id);if(!group)return;const usage=C().colorGroupUsage(id);openModal({title:'Excluir grupo de cor',kicker:'Confirmação',body:'<p>Excluir o grupo <strong>'+esc(group.name)+'</strong>?</p><p class="muted">'+usage+' programa(s) voltarão para a cor automática. Nenhum programa ou exibição será apagado.</p>',footer:'<button class="button button-secondary" id="cancel-color-delete" type="button">Voltar</button><button id="confirm-color-delete" class="button button-danger" type="button">Excluir grupo</button>'});$('#cancel-color-delete').addEventListener('click',()=>openColorGroupsManager(group.id));$('#confirm-color-delete').addEventListener('click',()=>{const affected=C().removeColorGroup(id);renderAll();openColorGroupsManager();toast('Grupo excluído. '+affected+' programa(s) voltaram para a cor automática.','success');});}
  // Varredura das imagens que faltam, disparada na Administração. Roda em segundo
  // plano de verdade: cede o processador entre cada programa, então a pessoa continua
  // navegando, editando e salvando enquanto isso acontece.
  let cacaDeImagens={rodando:false,parar:false};
  async function procurarImagensQueFaltam(){
    if(cacaDeImagens.rodando)return;
    if(!window.EBCPlay){toast('O módulo de consulta ao acervo não foi carregado.','error');return;}
    const botao=$('#artwork-hunt-start'),parar=$('#artwork-hunt-stop'),caixa=$('#artwork-hunt-status'),
          barra=$('#artwork-hunt-fill'),texto=$('#artwork-hunt-text');
    const semImagem=C().getCatalog().filter(p=>(p.scope==='channel'||C().isAdmin())&&!p.artwork?.flagged&&!String(p.artwork?.url||'').trim()&&!String(p.artwork?.fileName||'').trim());
    if(!semImagem.length){toast('Todos os programas já têm imagem.','success');return;}
    cacaDeImagens={rodando:true,parar:false};
    botao.disabled=true;parar.hidden=false;caixa.hidden=false;
    let achadas=0,semFonte=0,falhas=0;
    const porFonte={ebc_play:0,ebc_site:0,web:0};
    for(let i=0;i<semImagem.length;i++){
      if(cacaDeImagens.parar)break;
      const programa=semImagem[i];
      try{
        const sugestao=await window.EBCPlay.sugerirPara(programa,{minimo:'alta'});
        if(sugestao?.campos?.artwork){
          // Relê do catálogo: o programa pode ter sido editado enquanto a varredura corria.
          const atual=C().getCatalog().find(p=>p.id===programa.id);
          if(atual&&!String(atual.artwork?.url||'').trim()){
            C().saveProgram({...atual,artwork:sugestao.campos.artwork},atual.scope);
            achadas++;porFonte[sugestao.fonte]=(porFonte[sugestao.fonte]||0)+1;
          }
        }else semFonte++;
      }catch(_){falhas++;}
      const feito=i+1,pct=Math.round(feito/semImagem.length*100);
      barra.style.width=pct+'%';
      texto.textContent=pct+'% · '+feito+' de '+semImagem.length+' · '+achadas+' imagem(ns) encontrada(s)';
      await new Promise(r=>setTimeout(r,0)); // devolve o controle à interface
    }
    cacaDeImagens.rodando=false;botao.disabled=false;parar.hidden=true;
    const detalhe=[porFonte.ebc_play&&porFonte.ebc_play+' do acervo do Play',porFonte.ebc_site&&porFonte.ebc_site+' dos sites da EBC',porFonte.web&&porFonte.web+' da busca aberta'].filter(Boolean).join(', ');
    texto.textContent=(cacaDeImagens.parar?'Interrompido. ':'Concluído. ')+achadas+' imagem(ns) encontrada(s)'+(detalhe?' ('+detalhe+')':'')+' · '+semFonte+' sem correspondência'+(falhas?' · '+falhas+' falha(s)':'')+'.';
    renderCatalog();renderAdmin();
    toast(achadas?achadas+' imagem(ns) preenchida(s). Confira e marque as que estiverem erradas.':'Nenhuma imagem nova encontrada.',achadas?'success':'');
  }
  // Busca a capa sozinha enquanto a pessoa digita o título do programa. Preenche só
  // quando o campo de imagem está vazio: quem já escolheu uma capa não é atropelado.
  // O que for encontrado além da imagem fica como oferta, não como preenchimento
  // automático — mexer em vários campos sem pedir assusta mais do que ajuda.
  function ligarBuscaAutomaticaDeCapa(){
    const campoTitulo=$('#program-title'),campoUrl=$('#program-artwork-url'),aviso=$('#program-artwork-status');
    if(!campoTitulo||!campoUrl||!aviso||!window.EBCPlay)return;
    let temporizador=null,ultimoBuscado='';
    const mostrar=(texto,classe='')=>{aviso.className='helper artwork-status '+classe;aviso.textContent=texto;};
    const buscar=async()=>{
      const titulo=campoTitulo.value.trim();
      if(titulo.length<3||titulo===ultimoBuscado)return;
      if(campoUrl.value.trim()){mostrar('');return;} // já tem imagem: não mexe
      ultimoBuscado=titulo;
      mostrar('Procurando no acervo do TV Brasil Play…','buscando');
      try{
        const sugestao=await window.EBCPlay.sugerirPara({title:titulo},{minimo:'alta'});
        if(campoUrl.value.trim())return;               // a pessoa digitou enquanto buscávamos
        if(campoTitulo.value.trim()!==titulo)return;   // o título mudou no meio do caminho
        if(!sugestao||!sugestao.campos.artwork){mostrar('Nada encontrado no acervo para este título. Você pode colar o endereço de uma imagem.','vazio');return;}
        campoUrl.value=sugestao.campos.artwork.url;
        const extras=sugestao.tocados.filter(campo=>campo!=='imagem');
        mostrar('Capa encontrada no acervo (‘'+sugestao.correspondente.titulo+'’).'+(extras.length?' Também há '+extras.join(', ')+' — o botão “Buscar imagens e episódios” no catálogo preenche isso.':'')+' Para recusar, apague o endereço.','achou');
      }catch(_){
        mostrar('Não foi possível consultar o acervo agora. O endereço manual continua funcionando.','vazio');
      }
    };
    campoTitulo.addEventListener('input',()=>{clearTimeout(temporizador);temporizador=setTimeout(buscar,700);});
    // Programa novo já abre buscando; programa existente só busca se mexerem no título.
    if(!campoUrl.value.trim()&&campoTitulo.value.trim().length>=3)buscar();
  }
  function openProgramForm(program=null){
    if(program?.scope==='global'&&!C().isAdmin()){toast('Este programa global esta disponivel apenas para leitura.','error');return;}
    const p=C().clone(program||{title:'',scope:C().isAdmin()?'global':'channel',type:'unspecified',origin:'licensed',category:'',subgroups:[],cl:'',defaultDuration:30,episodeMode:'none',continuous:false,episodeCounter:1,seasons:[],rights:[]}),episodeMode=C().episodeModeFor(p),right=p.rights?.[0]||{},scopeOptions=C().isAdmin()?'<option value="global" '+(p.scope!=='channel'?'selected':'')+'>Todos os canais</option><option value="channel" '+(p.scope==='channel'?'selected':'')+'>Somente este canal</option>':'<option value="channel" selected>Somente este canal</option>';
    openModal({title:program?'Editar programa':'Novo programa',kicker:'Catálogo estruturado',wide:true,body:
      '<div class="form-grid"><label>Nome do programa<input id="program-title" value="'+esc(p.title)+'" maxlength="300"></label><label>Disponibilidade<select id="program-scope">'+scopeOptions+'</select></label><label>Formato<select id="program-type"><option value="live" '+(p.type==='live'?'selected':'')+'>Ao vivo</option><option value="recorded" '+(p.type==='recorded'?'selected':'')+'>Gravado</option><option value="mixed" '+(p.type==='mixed'?'selected':'')+'>Misto</option><option value="unspecified" '+(p.type==='unspecified'?'selected':'')+'>Sem definição</option></select></label><label>Origem<select id="program-origin"><option value="own" '+(p.origin==='own'?'selected':'')+'>Produção própria</option><option value="independent" '+(p.origin==='independent'?'selected':'')+'>Produção independente</option><option value="licensed" '+(p.origin==='licensed'?'selected':'')+'>Licenciado</option><option value="news" '+(p.origin==='news'?'selected':'')+'>Jornalismo</option><option value="institutional" '+(p.origin==='institutional'?'selected':'')+'>Institucional</option></select></label><label>Classificação Indicativa (CL)<select id="program-cl"><option value="">Sem classificação</option><option value="Livre" '+(p.cl==='Livre'?'selected':'')+'>Livre</option><option value="6_anos" '+(p.cl==='6_anos'?'selected':'')+'>6 anos</option><option value="10_anos" '+(p.cl==='10_anos'?'selected':'')+'>10 anos</option><option value="12_anos" '+(p.cl==='12_anos'?'selected':'')+'>12 anos</option><option value="14_anos" '+(p.cl==='14_anos'?'selected':'')+'>14 anos</option><option value="16_anos" '+(p.cl==='16_anos'?'selected':'')+'>16 anos</option><option value="18_anos" '+(p.cl==='18_anos'?'selected':'')+'>18 anos</option></select></label><label>Categoria principal<input id="program-category" value="'+esc(p.category)+'" maxlength="200" placeholder="Ex.: Documentário"></label><label>Subgrupos / etiquetas<input id="program-subgroups" value="'+esc((p.subgroups||[]).join('; '))+'" maxlength="1000" placeholder="Ex.: Música; Cultura; Faixa da tarde"><span class="helper">Separe vários subgrupos por ponto e vírgula.</span></label><label>Imagem externa (URL HTTPS)<input id="program-artwork-url" type="url" value="'+esc(p.artwork?.url||'')+'" maxlength="1900" placeholder="https://servidor/imagem.jpg"><span class="helper">Cole o endereço HTTPS direto da imagem, de qualquer site (distribuidora, Google Imagens, Bing Imagens, Prime Video etc.). O sistema testa se ela carrega antes de salvar. Use “Buscar imagens e episódios” no topo para preencher automaticamente pelo acervo da EBC quando disponível. <a id="program-artwork-search" target="_blank" rel="noopener noreferrer">Pesquisar referência na web</a>. O PDF não utiliza a imagem.</span><span id="program-artwork-status" class="helper artwork-status"></span><label class="toggle artwork-wrong"><input id="program-artwork-wrong" type="checkbox" '+(p.artwork?.flagged?'checked':'')+'> Imagem errada ou inadequada<span class="helper">Marque para o sistema parar de sugerir sozinho neste programa. A imagem é retirada e você pode colar outra ou deixar sem nenhuma.</span></label></label><label>Grupo de cor<select id="program-color-group">'+colorGroupOptions(p.colorGroupId)+'</select><span id="program-color-help" class="color-selection-preview">Automático pela classificação</span></label><label>Duração padrão (min)<input id="program-duration" type="number" min="1" max="1440" value="'+esc(p.defaultDuration||30)+'"></label></div>'+
      '<section class="episode-mode-panel"><label class="field">Controle de episódios<select id="program-episode-mode"><option value="none" '+(episodeMode==='none'?'selected':'')+'>Não usa episódios</option><option value="continuous" '+(episodeMode==='continuous'?'selected':'')+'>Numeração contínua</option><option value="catalog" '+(episodeMode==='catalog'?'selected':'')+'>Temporadas e episódios cadastrados</option></select><span id="program-episode-help" class="helper"></span></label><div id="continuous-episode-fields" class="inline-fields"><label class="field">Próximo episódio<input id="program-counter" type="number" min="1" value="'+esc(p.episodeCounter||1)+'"></label></div></section>'+
      '<fieldset id="catalog-episode-fields" class="form-section"><legend>Temporadas e episódios</legend><div id="season-list"></div><button id="add-season" class="button button-secondary" type="button"><span data-icon="plus"></span> Adicionar temporada</button></fieldset>'+
      '<details><summary><strong>Direitos e contrato</strong></summary><div class="form-grid" style="margin-top:12px"><label>Contrato<input id="right-contract" value="'+esc(right.contract||'')+'"></label><label>Fim da vigência<input id="right-expiry" type="date" value="'+esc(right.endsAt||'')+'"></label><label>Limite de exibições<input id="right-limit" type="number" min="0" value="'+esc(right.exhibitionLimit??'')+'"></label><label class="toggle"><input id="right-reruns" type="checkbox" '+(right.rerunsCount!==false?'checked':'')+'> Reprises contam no limite</label></div></details>',
      footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="save-program" class="button button-primary" type="button">Salvar programa</button>'});
    const seasons=p.seasons||[];seasons.forEach(s=>addSeasonEditor(s));$('#add-season').addEventListener('click',()=>addSeasonEditor({id:C().uid('season'),number:$('#season-list').children.length+1,title:'',episodes:[]}));const updateEpisodeMode=()=>{const mode=$('#program-episode-mode').value,help={none:'Para jornais, programas ao vivo, filmes e conteúdos que não precisam de numeração.',continuous:'Para programas diários com sequência aberta e próximo número controlado.',catalog:'Para séries e obras com temporadas e episódios conhecidos.'};$('#program-episode-help').textContent=help[mode];$('#continuous-episode-fields').classList.toggle('hidden',mode!=='continuous');$('#catalog-episode-fields').classList.toggle('hidden',mode!=='catalog');};$('#program-episode-mode').addEventListener('change',updateEpisodeMode);updateEpisodeMode();$('#program-color-group').addEventListener('change',updateProgramColorHelp);['program-type','program-origin'].forEach(id=>$('#'+id).addEventListener('change',updateProgramColorHelp));$('#program-category').addEventListener('input',updateProgramColorHelp);const updateArtworkSearch=()=>{$('#program-artwork-search').href='https://www.bing.com/images/search?q='+encodeURIComponent((($('#program-title').value||'').trim()||'programa')+' TV Brasil EBC');};$('#program-title').addEventListener('input',updateArtworkSearch);updateArtworkSearch();updateProgramColorHelp();ligarBuscaAutomaticaDeCapa();$('[data-modal-cancel]').addEventListener('click',closeModal);$('#save-program').addEventListener('click',()=>saveProgramForm(p));
  }
  function addSeasonEditor(season){
    const card=document.createElement('details');card.className='season-editor panel';card.open=$('#season-list').children.length===0;card.dataset.id=season.id||C().uid('season');
    const epCount=(season.episodes||[]).length;
    card.innerHTML='<summary class="season-summary"><span><strong>Temporada '+(season.number||'1')+'</strong> <span class="scope-pill season-badge">'+epCount+' ep(s)</span></span><button class="button button-danger remove-season" type="button">Remover temporada</button></summary><div class="season-body"><div class="inline-fields" style="margin-top:10px"><label class="field">Nº Temporada<input class="season-number" value="'+esc(season.number||'')+'"></label><label class="field">Nome da temporada<input class="season-title" value="'+esc(season.title||'')+'"></label><label class="field">Quantidade de episódios<input class="season-ep-count" type="number" min="0" value="'+epCount+'"></label></div><details class="episode-list-details"><summary><strong>Editar títulos dos episódios</strong><span class="episode-list-count">'+epCount+' item(ns)</span></summary><div class="episode-editor"></div><button class="text-button add-episode" type="button"><span data-icon="plus"></span> Adicionar episódio individual</button></details></div>';
    $('#season-list').append(card);
    const container=$('.episode-editor',card);
    (season.episodes||[]).forEach(ep=>addEpisodeRow(container,ep));

    const updateCountBadge=()=>{
      const count=container.children.length;
      $('.season-badge',card).textContent=count+' ep(s)';
      $('.episode-list-count',card).textContent=count+' item(ns)';
      $('.season-ep-count',card).value=count;
    };

    $('.add-episode',card).addEventListener('click',()=>{
      addEpisodeRow(container,{id:C().uid('episode'),number:container.children.length+1,title:'',duration:''});
      updateCountBadge();
    });

    $('.season-ep-count',card).addEventListener('change',e=>{
      const target=Math.max(0,+e.target.value||0);
      let current=container.children.length;
      if(target>current){
        for(let i=current+1;i<=target;i++){
          addEpisodeRow(container,{id:C().uid('episode'),number:i,title:'',duration:''});
        }
        updateCountBadge();
      }else if(target<current){
        const rows=[...container.children];
        const trimmed=rows.slice(target);
        const hasData=trimmed.some(row=>['.episode-number','.episode-title','.episode-duration'].some(selector=>String(row.querySelector(selector)?.value||'').trim()));
        if(hasData&&!confirm('Remover '+(current-target)+' episódio(s) preenchidos?')) {
          e.target.value=current;
          return;
        }
        trimmed.forEach(r=>r.remove());
        updateCountBadge();
      }
    });

    $('.remove-season',card).addEventListener('click',e=>{e.preventDefault();card.remove();});
    renderIcons(card);
  }
  function addEpisodeRow(container,episode){
    const row=document.createElement('div');row.className='episode-row';row.dataset.id=episode.id||C().uid('episode');row.innerHTML='<input class="episode-number" aria-label="Número do episódio" value="'+esc(episode.number||'')+'" placeholder="Nº"><input class="episode-title" aria-label="Título do episódio" value="'+esc(episode.title||'')+'" placeholder="Título do episódio"><input class="episode-duration" type="number" aria-label="Duração" value="'+esc(episode.duration||'')+'" placeholder="Min"><button class="icon-button remove-episode" type="button" aria-label="Remover episódio"><span data-icon="close"></span></button>';container.append(row);$('.remove-episode',row).addEventListener('click',()=>{row.remove();const card=container.closest('.season-editor');if(card){const count=container.children.length;$('.season-badge',card).textContent=count+' ep(s)';$('.episode-list-count',card).textContent=count+' item(ns)';$('.season-ep-count',card).value=count;}});renderIcons(row);
  }
  async function saveProgramForm(original){
    try{
      const title=$('#program-title').value.trim();if(!title)throw new Error('Informe o nome do programa.');const episodeMode=$('#program-episode-mode').value,seasons=episodeMode==='catalog'?$$('.season-editor').map((card,index)=>{const previous=(original.seasons||[]).find(season=>season.id===card.dataset.id)||{};const episodes=$$('.episode-row',card).map(row=>({id:row.dataset.id,number:$('.episode-number',row).value.trim(),title:$('.episode-title',row).value.trim(),duration:+$('.episode-duration',row).value||+$('#program-duration').value||30,status:'available'})).filter(e=>e.number||e.title);return {...previous,id:card.dataset.id,number:$('.season-number',card).value.trim(),title:$('.season-title',card).value.trim(),order:index+1,episodeCount:episodes.length,episodes};}).filter(s=>s.number||s.title||s.episodes.length):[];
      const expiry=$('#right-expiry').value,limit=$('#right-limit').value,contract=$('#right-contract').value.trim(),existingRights=original.rights||[],remainingRights=existingRights.slice(1);const rights=expiry||limit||contract?[{...(existingRights[0]||{}),id:existingRights[0]?.id||C().uid('right'),contract,startsAt:existingRights[0]?.startsAt||'',endsAt:expiry,exhibitionLimit:limit===''?null:+limit,rerunsCount:$('#right-reruns').checked,channels:existingRights[0]?.channels||Object.keys(C().CHANNELS)},...remainingRights]:remainingRights;
      const artworkUrlValue=$('#program-artwork-url').value.trim();if(artworkUrlValue&&!safeHttpsUrl(artworkUrlValue))throw new Error('A imagem precisa usar uma URL HTTPS válida.');if(artworkUrlValue&&!directArtworkUrl(artworkUrlValue)&&!mappedArtworkPage(artworkUrlValue)&&!(await carregaComoImagem(artworkUrlValue)))throw new Error('Esse endereço não devolveu uma imagem. Confira se é o endereço direto do arquivo (não o de uma página) e se ele abre sozinho no navegador.');const previousArtwork=original.artwork?.source==='user_catalog'?null:(original.artwork||null),scope=C().isAdmin()?$('#program-scope').value:'channel',item={...original,id:original.id||C().programId(title,seasons[0]?.number||'',contract),title,scope,type:$('#program-type').value,origin:$('#program-origin').value,cl:$('#program-cl').value,category:$('#program-category').value.trim(),subgroups:$('#program-subgroups').value.split(/[;,|]/).map(value=>value.trim()).filter(Boolean),colorGroupId:$('#program-color-group').value,artwork:(()=>{
        // "Imagem errada" é uma decisão da pessoa e precisa sobreviver às buscas
        // automáticas: guardamos flagged no próprio cadastro e a varredura respeita.
        const marcadaErrada=!!$('#program-artwork-wrong')?.checked;
        if(marcadaErrada)return artworkUrlValue?{url:artworkUrlValue,source:'user_catalog',flagged:true}:{flagged:true};
        return artworkUrlValue?{url:artworkUrlValue,source:'user_catalog'}:previousArtwork;
      })(),defaultDuration:Math.max(1,Math.min(1440,+$('#program-duration').value||30)),episodeMode,continuous:episodeMode==='continuous',episodeCounter:Math.max(1,+$('#program-counter').value||original.episodeCounter||1),seasons,rights};
      if(original.id&&original.scope&&original.scope!==scope)C().removeProgram(original.id,original.scope);C().saveProgram(item,scope);closeModal();renderAll();toast('Programa salvo no catálogo.','success');
    }catch(err){toast(err.message,'error');}
  }
  function confirmProgramDelete(program){
    openModal({title:'Excluir programa',kicker:'Confirmação',body:'<p>Excluir <strong>'+esc(program.title)+'</strong> do catálogo '+(program.scope==='global'?'global':'deste canal')+'?</p><p class="muted">As exibições já inseridas na grade não serão apagadas.</p>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="delete-program-confirm" class="button button-danger" type="button">Excluir programa</button>'});$('[data-modal-cancel]').addEventListener('click',closeModal);$('#delete-program-confirm').addEventListener('click',()=>{C().removeProgram(program.id,program.scope);closeModal();renderAll();toast('Programa removido.','success');});
  }
  async function analyzeImport(){
    const file=$('#import-file').files[0];if(!file){toast('Escolha uma planilha.','error');return;}try{if(file.size>C().LIMITS.workbookBytes)throw new Error('A planilha excede o limite de 8 MB.');const parsed=C().parseWorkbook(await file.arrayBuffer()),target=C().isAdmin()?$('#import-target').value:'channel',preview=C().previewImport(parsed.programs,target);ui.importData={...parsed,preview,fileName:file.name,target,mode:$('#import-mode').value};const conflictMarkup=parsed.conflicts?.length?'<details class="import-conflicts"><summary><strong>'+parsed.conflicts.length+' programa(s) exigem conferência</strong> · '+preview.conflicts+' campo(s) divergente(s)</summary><div class="timeline-list">'+parsed.conflicts.slice(0,20).map(item=>'<div class="timeline-entry"><strong>'+esc(item.title)+'</strong><span>Linhas '+esc(item.rows.join(', '))+' · '+esc(item.fields.slice(0,6).map(field=>(field.season?'T'+field.season+': ':'')+field.field).join(', '))+'</span></div>').join('')+'</div>'+(parsed.conflicts.length>20?'<p class="muted">E mais '+(parsed.conflicts.length-20)+' programa(s).</p>':'')+'</details>':'<p class="notice success">Nenhuma divergência entre linhas da mesma temporada.</p>';$('#import-preview').className='';$('#import-preview').innerHTML='<div class="metric-grid"><div class="metric"><span>Novos</span><strong>'+preview.added+'</strong></div><div class="metric"><span>Atualizados</span><strong>'+preview.updated+'</strong></div><div class="metric"><span>Sem alteração</span><strong>'+preview.duplicates+'</strong></div><div class="metric"><span>Conflitos</span><strong>'+preview.conflictPrograms+'</strong></div></div><p><strong>'+preview.total+' programas</strong>, '+preview.seasons+' temporada(s) e '+preview.sourceRows+' linha(s) úteis encontrados na aba “'+esc(parsed.sheet)+'”. Todas as '+parsed.headers.length+' colunas serão preservadas nos dados de origem.</p>'+conflictMarkup+'<p class="muted">Exemplos: '+parsed.programs.slice(0,5).map(p=>esc(p.title)).join(' · ')+'</p>';$('#confirm-import').disabled=!parsed.programs.length;toast('Análise concluída. Revise a prévia e os conflitos.','success');}catch(err){console.error(err);toast(err.message,'error');}
  }
  function confirmImport(){
    if(!ui.importData)return;ui.importData.target=C().isAdmin()?$('#import-target').value:'channel';ui.importData.mode=$('#import-mode').value;
    if(ui.importData.mode==='replace'){openModal({title:'Substituir catálogo?',kicker:'Ação avançada',body:'<p>Esta ação substituirá o catálogo de destino pelos <strong>'+ui.importData.programs.length+' registros</strong> da planilha.</p><label class="field">Digite <strong>SUBSTITUIR</strong><input id="replace-confirm" autocomplete="off"></label>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="replace-go" class="button button-danger" type="button">Criar backup e substituir</button>'});$('[data-modal-cancel]').addEventListener('click',closeModal);$('#replace-go').addEventListener('click',()=>{if($('#replace-confirm').value!=='SUBSTITUIR'){toast('Digite SUBSTITUIR para confirmar.','error');return;}closeModal();applyConfirmedImport();});return;}applyConfirmedImport();
  }
  async function applyConfirmedImport(){
    try{const data=ui.importData,backup=C().snapshot('Antes da importação '+data.fileName,data.target==='global'?'global':'channel');await G().saveBackup(backup);C().applyImport(data.programs,{target:data.target,mode:data.mode,fileName:data.fileName,sheet:data.sheet});await G().saveNow();ui.importData=null;$('#confirm-import').disabled=true;$('#import-file').value='';$('#import-file-name').textContent='Nenhum arquivo selecionado';$('#import-preview').className='empty-state compact';$('#import-preview').innerHTML='<p>Importação concluída e registrada no histórico.</p>';renderAll();toast('Planilha importada com sucesso.','success');}catch(err){toast(err.message,'error');}
  }
  function undoImport(){try{C().undoImport();renderAll();toast('Última importação desfeita.','success');}catch(err){toast(err.message,'error');}}
  function workbookName(prefix,ext){return prefix+'_'+C().isoDate(new Date())+'_'+C().CHANNELS[C().session.channel].slug+'_'+C().slug(C().session.user)+'.'+ext;}
  function exportXlsx(){
    if(!window.XLSX){toast('Biblioteca de planilhas indisponível.','error');return;}const rows=C().exportRows(),wb=XLSX.utils.book_new();[['Programas',rows.programs],['Temporadas',rows.seasons],['Episódios',rows.episodes],['Direitos',rows.rights],['Exibições',rows.exhibitions]].forEach(([name,data])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data.length?data:[{}]),name));XLSX.writeFile(wb,workbookName('catalogo_completo','xlsx'));C().audit('Catálogo exportado','XLSX com cinco abas','channel');toast('Planilha completa gerada.','success');
  }
  function exportTemplate(){
    const wb=XLSX.utils.book_new(),programs=[{'OBRA AUDIOVISUAL':'Exemplo','TEMPORADA':'1','Nº EPISÓDIOS':10,'DURAÇÃO':30,'TÍTULO':'','CATEGORIA':'Documentário','SUBGRUPOS':'Cultura; História','GRUPO_COR':'Produção própria','FIM VIGÊNCIA':'2027-12-31','Nº DE EXIBIÇÕES':12,'TIPO':'Gravado','ORIGEM':'Licenciado'}],episodes=[{'OBRA AUDIOVISUAL':'Exemplo','TEMPORADA':'1','EPISÓDIO':1,'TÍTULO DO EPISÓDIO':'Título','DURAÇÃO':30}];XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(programs),'Programas');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(episodes),'Episódios');XLSX.writeFile(wb,'modelo_importacao_grade_ebc.xlsx');toast('Modelo de importação gerado.','success');
  }
  function downloadBlob(name,data,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
  function exportJson(){downloadBlob(workbookName('copia_canal','json'),JSON.stringify(C().makeBackup(),null,2),'application/json');C().audit('Copia do canal exportada','JSON do canal atual','channel');}
  async function restoreJson(event){
    const file=event.target.files[0];event.target.value='';if(!file)return;
    try{if(file.size>15*1024*1024)throw new Error('O arquivo JSON excede o limite de 15 MB.');const data=JSON.parse(await file.text()),info=C().inspectBackup(data),expected=info.channelName.toUpperCase();openModal({title:'Restaurar copia do canal?',kicker:'Restauracao protegida',body:'<p>Apenas <strong>'+esc(info.channelName)+'</strong> sera substituido.</p><div class="metric-grid"><div class="metric"><span>Programas</span><strong>'+info.counts.catalog+'</strong></div><div class="metric"><span>Regras</span><strong>'+info.counts.rules+'</strong></div><div class="metric"><span>Exibicoes</span><strong>'+info.counts.occurrences+'</strong></div><div class="metric"><span>Excecoes</span><strong>'+info.counts.exceptions+'</strong></div></div><p class="muted">Copia de '+esc(info.exportedAt||'data desconhecida')+' por '+esc(info.exportedBy||'usuario desconhecido')+'. O estado atual sera preservado no OneDrive antes da troca.</p><label class="field">Digite <strong>'+esc(expected)+'</strong><input id="restore-json-confirm" autocomplete="off"></label>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="restore-json-go" class="button button-danger" type="button">Substituir somente este canal</button>'});$('[data-modal-cancel]').addEventListener('click',closeModal);$('#restore-json-go').addEventListener('click',async event=>{if($('#restore-json-confirm').value.trim().toUpperCase()!==expected){toast('A confirmacao digitada nao corresponde.','error');return;}const button=event.currentTarget;button.disabled=true;try{await G().saveBackup(C().makeChannelBackup('Antes de restaurar copia externa'));C().restoreBackup(data);await G().saveNow(true);closeModal();renderAll();toast('Canal restaurado. A versao anterior foi preservada.','success');}catch(err){button.disabled=false;toast(err.message,'error');}});}catch(err){toast(err.message,'error');}
  }
  function renderAlerts(){
    if(!C().session.channel)return;const all=C().getAlerts(),active=all.filter(a=>!a.historical),type=$('#alert-type').value||'all',severity=$('#alert-severity').value||'all',query=C().normalize($('#alert-search').value),matches=a=>(type==='all'||a.type===type)&&(severity==='all'||a.severity===severity)&&(!query||C().normalize([a.title,a.message].join(' ')).includes(query)),filtered=active.filter(matches),archived=all.filter(a=>a.historical&&matches(a));
    $('#alert-badge').textContent=active.length;$('#alert-metrics').innerHTML='<div class="metric"><span>Críticos</span><strong>'+active.filter(a=>a.severity==='critical').length+'</strong></div><div class="metric"><span>Vencendo</span><strong>'+active.filter(a=>a.type==='expiring').length+'</strong></div><div class="metric"><span>Limites</span><strong>'+active.filter(a=>a.type==='limit').length+'</strong></div><div class="metric"><span>Conflitos</span><strong>'+active.filter(a=>a.type==='conflict').length+'</strong></div>';
    const groups=new Map();filtered.forEach(a=>{if(!groups.has(a.title))groups.set(a.title,[]);groups.get(a.title).push(a);});const box=$('#alert-list');box.innerHTML='';if(!filtered.length&&!archived.length){box.innerHTML='<div class="empty-state"><p><strong>Tudo em ordem.</strong><br>Nenhum alerta corresponde aos filtros.</p></div>';return;}
    groups.forEach((items,title)=>{const detail=document.createElement('details');detail.className='alert-group';detail.open=items.some(i=>i.severity==='critical');detail.innerHTML='<summary><span>'+esc(title)+'</span><span class="scope-pill">'+items.length+' alerta(s)</span></summary><div class="alert-items">'+items.map(a=>alertItem(a)).join('')+'</div>';box.append(detail);bindAlertLinks(detail,items);});
    if(archived.length){const history=document.createElement('details');history.className='alert-group alert-history';history.innerHTML='<summary><span>Histórico de vigências antigas</span><span class="scope-pill">'+archived.length+' registro(s)</span></summary><div class="alert-items">'+archived.map(a=>alertItem(a)).join('')+'</div>';box.append(history);bindAlertLinks(history,archived);}}
  function alertItem(a){return '<button class="alert-item alert-go" data-alert="'+esc(a.id)+'" type="button" aria-label="Abrir alerta: '+esc(a.title)+'"><span class="alert-content"><span class="severity '+(a.severity==='critical'?'critical':'')+'"></span><span class="alert-copy"><strong>'+esc(a.title)+'</strong><span>'+esc(a.message)+(a.detail?' · '+esc(a.detail):'')+'</span></span></span><span class="alert-chevron" aria-hidden="true">›</span></button>';}
  function bindAlertLinks(root,items){$$('.alert-go',root).forEach(button=>button.addEventListener('click',()=>goToAlert(items.find(a=>a.id===button.dataset.alert))));}
  function goToAlert(alert){
    if(alert.date){
      ui.week=C().isoDate(C().startOfWeek(alert.date));
      ui.day=Math.max(0,Math.min(6,Math.round((C().parseLocalDate(alert.date)-C().startOfWeek(alert.date))/86400000)));
      ui.view='day';
      showPage('grade');
      renderGrade();
      toast('Item destacado no dia correspondente.','success');
      setTimeout(()=>{
        const targetOpMin=C().opMinutes(alert.start||'06:00');
        const minutePx=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--minute'))||1.6;
        window.scrollTo({top:targetOpMin*minutePx,behavior:'smooth'});
        const card=[...document.querySelectorAll('.program-card')].find(c=>c._item&&c._item.date===alert.date&&(alert.start?c._item.start===alert.start:true));
        if(card){card.classList.add('highlight-pulse');setTimeout(()=>card.classList.remove('highlight-pulse'),3500);}
      },200);
      return;
    }
    const program=C().getCatalog().find(p=>p.id===alert.programId);showPage('catalog');$('#catalog-search').value=program?.title||alert.title;renderCatalog();if(program)setTimeout(()=>openProgramForm(program),100);
  }
  function versionWindowLabel(version){if(!version.historyWindow)return 'Versão individual';const start=new Date(version.historyWindow.startedAt),end=new Date(version.historyWindow.endsAt),timeOptions={hour:'2-digit',minute:'2-digit'};return 'Alterações agrupadas de '+start.toLocaleTimeString('pt-BR',timeOptions)+' a '+end.toLocaleTimeString('pt-BR',timeOptions);}
  function versionSummaryMarkup(version,details=true){
    if(version.recoveryPoint)return '<div class="version-recovery">Ponto de recuperação automático</div>';const summary=version.changeSummary;if(!summary)return '<div class="version-summary-empty">Resumo de mudanças indisponível nesta versão antiga.</div>';
    const metrics='<div class="version-change-summary"><span class="version-metric added"><b>'+esc(summary.added||0)+'</b> adicionados</span><span class="version-metric modified"><b>'+esc(summary.modified||0)+'</b> alterados</span><span class="version-metric deleted"><b>'+esc(summary.deleted||0)+'</b> excluídos</span><span class="version-metric total"><b>'+esc(summary.total||0)+'</b> no total</span></div>',types=Object.entries(summary.byType||{}).filter(([,value])=>value.total).map(([name,value])=>'<li><strong>'+esc(name)+'</strong><span>'+esc(value.added)+' adicionados · '+esc(value.modified)+' alterados · '+esc(value.deleted)+' excluídos</span></li>').join('');
    return metrics+(details&&types?'<details class="version-type-details"><summary>Ver itens por tipo</summary><ul>'+types+'</ul></details>':'');
  }
  async function renderHistory(){
    if(!C().session.channel)return;const audits=C().state.audit.filter(a=>!a.channel||a.channel===C().session.channel).slice(0,80);$('#audit-list').innerHTML=audits.length?audits.map(a=>'<div class="timeline-entry"><strong>'+esc(a.action)+'</strong><span>'+new Date(a.at).toLocaleString('pt-BR')+' · '+esc(a.user)+'<br>'+esc(a.detail||'')+'</span></div>').join(''):'<p class="muted">Nenhuma atividade registrada.</p>';
    const list=$('#version-list');list.innerHTML='<p class="muted">Carregando versões...</p>';try{const versions=await G().listHistory(50),channel=C().CHANNELS[C().session.channel];list.innerHTML=versions.length?versions.map(v=>'<article class="timeline-entry version-entry"><div class="version-entry-header"><div><strong>'+esc(v.label)+'</strong><span>'+esc(channel.name)+' · salvo por '+esc(v.user)+'</span></div><span class="version-window-label">'+esc(versionWindowLabel(v))+'</span></div>'+versionSummaryMarkup(v)+'<button class="text-button restore-version" data-id="'+esc(v.id)+'" type="button">Revisar e restaurar</button></article>').join(''):'<p class="muted">Nenhuma versão v6 encontrada para este canal.</p>';$$('.restore-version',list).forEach(button=>button.addEventListener('click',()=>openRestoreVersion(versions.find(v=>v.id===button.dataset.id))));}catch(err){list.innerHTML='<p class="muted">Não foi possível consultar o OneDrive agora.</p>';}
  }
  function openRestoreVersion(version){
    if(!version)return;const channel=C().CHANNELS[C().session.channel];
    openModal({title:'Restaurar versão do canal?',kicker:'Restauração protegida',body:'<div class="restore-version-overview"><p>A grade e as configurações específicas de <strong>'+esc(channel.name)+'</strong> serão substituídas pela versão de <strong>'+esc(version.label)+'</strong>, salva por <strong>'+esc(version.user)+'</strong>.</p>'+versionSummaryMarkup(version,false)+'</div><p class="muted">O catálogo global, os usuários e os outros canais não serão alterados. Antes da restauração, o estado atual deste canal será salvo como ponto de recuperação.</p>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="restore-version-confirm" class="button button-danger" type="button">Substituir somente este canal</button>'});
    $('[data-modal-cancel]').addEventListener('click',closeModal);$('#restore-version-confirm').addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;button.textContent='Restaurando...';try{await G().restoreVersion(version.id);closeModal();renderAll();toast('Canal restaurado. A versão anterior foi preservada.','success');}catch(err){button.disabled=false;button.textContent='Substituir somente este canal';toast(err.message,'error');}});
  }
  function renderAdmin(){
    if(!C().session.channel)return;const admin=C().isAdmin(),snapshot=C().state;$('#permission-notice').innerHTML='<strong>Seu perfil: '+esc(C().session.role)+'</strong><br>'+(admin?'Você pode administrar acessos e executar os três níveis de limpeza.':'Você pode limpar a semana e o canal atual. A limpeza global e os acessos são exclusivos de administradores.');$('#cleanup-week-count').textContent=C().counts('week',ui.week)+' itens';$('#cleanup-channel-count').textContent=C().counts('channel')+' itens';$('#cleanup-global-count').textContent=C().counts('global')+' itens';$('[data-cleanup="global"]').disabled=!admin;$('#new-user-profile').disabled=!admin;
    // Aparência em teste: preferência individual, liberada para qualquer perfil,
    // porque não altera dados nem o que as outras pessoas veem.
    const caca=$('#artwork-hunt-start');
    if(caca&&!caca.dataset.bound){
      caca.dataset.bound='1';
      caca.addEventListener('click',procurarImagensQueFaltam);
      $('#artwork-hunt-stop')?.addEventListener('click',()=>{cacaDeImagens.parar=true;});
    }
    const visual=$('#visual-proposta-toggle');
    if(visual&&!visual.dataset.bound){
      visual.dataset.bound='1';
      visual.checked=localStorage.getItem('ebc_visual_proposta')==='1';
      visual.addEventListener('change',event=>{applyPropostaVisual(event.target.checked);toast(event.target.checked?'Proposta de visual ativada neste navegador.':'Visual original restaurado.','success');});
    }
    const preferences=C().getPreferences(),enabled=$('#global-artwork-enabled'),opacity=$('#global-artwork-opacity');
    if(enabled){enabled.checked=preferences.programArtworkEnabled;enabled.disabled=!admin;if(!enabled.dataset.bound){enabled.dataset.bound='1';enabled.addEventListener('change',event=>{try{const next=C().savePreferences({programArtworkEnabled:event.target.checked});if(!next.programArtworkEnabled)clearRenderedArtwork();renderAll();toast('Imagens de fundo '+(next.programArtworkEnabled?'ativadas':'desativadas')+' para todos os usuários.','success');}catch(err){event.target.checked=!event.target.checked;toast(err.message,'error');}});}}
    if(opacity){opacity.value=preferences.programArtworkOpacity;opacity.disabled=!admin;if($('#global-opacity-label'))$('#global-opacity-label').textContent=preferences.programArtworkOpacity+'%';document.documentElement.style.setProperty('--program-artwork-opacity',String(preferences.programArtworkOpacity/100));if(!opacity.dataset.bound){opacity.dataset.bound='1';opacity.addEventListener('input',event=>{const val=+event.target.value||14;if($('#global-opacity-label'))$('#global-opacity-label').textContent=val+'%';$$('.has-program-artwork').forEach(el=>el.style.setProperty('--program-artwork-opacity',String(val/100)));});opacity.addEventListener('change',event=>{try{C().savePreferences({programArtworkOpacity:+event.target.value||14});toast('Opacidade compartilhada atualizada.','success');}catch(err){toast(err.message,'error');}});}}
    const profiles=admin?Object.values(snapshot.users):[],list=$('#user-profile-list');list.innerHTML=!admin?'<p class="muted">A lista de usuarios fica visivel somente para administradores.</p>':profiles.length?profiles.map(profile=>'<div class="timeline-entry user-profile-entry"><strong>'+esc(profile.name||profile.email)+'</strong><span>'+esc(profile.email)+' · '+esc(profile.role)+'<br>'+esc((profile.channels||[]).map(id=>C().CHANNELS[id]?.name).filter(Boolean).join(', ')||'Nenhum canal')+'</span><button class="text-button edit-user-profile" data-user="'+esc(profile.email)+'" type="button">Editar acesso</button></div>').join(''):'<p class="muted">Nenhum perfil compartilhado cadastrado.</p>';$$('.edit-user-profile',list).forEach(button=>button.addEventListener('click',()=>openUserProfile(snapshot.users[button.dataset.user])));
  }
  function openUserProfile(profile={}){
    if(!C().isAdmin()){toast('Somente administradores podem alterar permissões.','error');return;}const selected=new Set(profile.channels||[]),channels=Object.entries(C().CHANNELS).map(([id,item])=>'<label class="toggle"><input name="profile-channel" type="checkbox" value="'+id+'" '+(selected.has(id)?'checked':'')+'> '+esc(item.name)+'</label>').join('');
    openModal({title:profile.email?'Editar acesso':'Adicionar usuário',kicker:'Usuários e permissões',body:'<div class="form-grid"><label>Nome exibido na Microsoft<input id="profile-name" value="'+esc(profile.name||'')+'" autocomplete="name"><span class="helper">Copie o nome exibido na conta corporativa.</span></label><label>E-mail Microsoft exato<input id="profile-email" type="email" value="'+esc(profile.email||'')+'" '+(profile.email?'readonly':'')+' autocomplete="email"><span class="helper">O acesso é identificado principalmente por este e-mail.</span></label><label>Perfil<select id="profile-role"><option value="Operador" '+(profile.role!=='Administrador'?'selected':'')+'>Operador</option><option value="Administrador" '+(profile.role==='Administrador'?'selected':'')+'>Administrador</option></select></label></div><fieldset class="channel-permissions"><legend>Canais do operador</legend>'+channels+'</fieldset><p class="muted">Administradores recebem automaticamente todos os canais.</p>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="save-user-profile" class="button button-primary" type="button">Salvar acesso</button>'});
    $('[data-modal-cancel]').addEventListener('click',closeModal);$('#save-user-profile').addEventListener('click',()=>{try{C().saveUserProfile({name:$('#profile-name').value,email:$('#profile-email').value,role:$('#profile-role').value,channels:$$('input[name="profile-channel"]:checked').map(input=>input.value)});closeModal();renderAdmin();toast('Permissão atualizada e pendente de sincronização.','success');}catch(err){toast(err.message,'error');}});
  }
  function openCleanup(scope){
    const labels={week:'esta semana',channel:C().CHANNELS[C().session.channel].name,global:'GLOBAL'},expected=scope==='week'?'LIMPAR SEMANA':scope==='channel'?C().CHANNELS[C().session.channel].name.toUpperCase():'LIMPAR GLOBAL',count=C().counts(scope,ui.week);
    openModal({title:'Confirmar limpeza',kicker:'Cópia de segurança obrigatória',body:'<p>Serão afetados <strong>'+count+' itens</strong> em '+esc(labels[scope])+'. Um backup será criado antes da alteração.</p><label class="field">Digite <strong>'+esc(expected)+'</strong><input id="cleanup-confirm" autocomplete="off"></label>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="cleanup-go" class="button button-danger" type="button">Criar backup e limpar</button>'});
    $('[data-modal-cancel]').addEventListener('click',closeModal);$('#cleanup-go').addEventListener('click',async event=>{if($('#cleanup-confirm').value.trim().toUpperCase()!==expected){toast('A confirmação digitada não corresponde.','error');return;}const button=event.currentTarget;button.disabled=true;try{const backup=C().createCleanupBackup(scope,ui.week);await G().saveBackup(backup);C().cleanup(scope,ui.week);await G().saveNow();closeModal();renderAll();toast('Limpeza concluída com backup preservado.','success');}catch(err){button.disabled=false;toast(err.message,'error');}});
  }
  function openPrintOptions(){
    openModal({title:'Gerar PDF',kicker:'Impressão independente da tela',body:'<p>Escolha o formato. A grade na tela não será alterada.</p><label class="check-option"><input type="radio" name="print-mode" value="summary" checked><span><strong>Resumo em uma página</strong><br><small>Das 06h às 06h em A4 retrato, igual à tela</small></span></label><label class="check-option" style="margin-top:9px"><input type="radio" name="print-mode" value="legible"><span><strong>Modo legível em duas páginas</strong><br><small>06h–18h e 18h–06h</small></span></label>',footer:'<button class="button button-secondary" data-modal-cancel type="button">Cancelar</button><button id="print-go" class="button button-primary" type="button"><span data-icon="print"></span> Abrir impressão</button>'});$('[data-modal-cancel]').addEventListener('click',closeModal);$('#print-go').addEventListener('click',()=>{const mode=$('input[name="print-mode"]:checked').value;closeModal();renderPrint(mode);setTimeout(()=>window.print(),80);});
  }
  function renderPrint(mode){
    const items=C().getWeek(C().session.channel,ui.week),ranges=mode==='legible'?[[0,48],[48,96]]:[[0,96]],root=$('#print-root');root.innerHTML='';
    ranges.forEach(([from,to],index)=>{const page=document.createElement('section');page.className='print-page '+(mode==='legible'?'print-legible':'print-summary');page.innerHTML='<header class="print-header"><img src="'+C().CHANNELS[C().session.channel].positive+'" alt="'+esc(C().CHANNELS[C().session.channel].name)+'"><div><h1>GRADE DE PROGRAMAÇÃO</h1><p>'+C().formatDate(ui.week,{day:'2-digit',month:'2-digit',year:'numeric'})+' a '+C().formatDate(C().addDays(ui.week,6),{day:'2-digit',month:'2-digit',year:'numeric'})+(mode==='legible'?' · Página '+(index+1)+' de 2':'')+'</p></div></header>';page.append(buildPrintTable(items,from,to));const legend=document.createElement('div');legend.className='print-legend';legend.innerHTML='<span><i class="legend-dot live"></i> Ao vivo</span><span><i class="legend-dot own"></i> Produção própria</span><span><i class="legend-dot rerun"></i> Reprise</span><span><i class="legend-dot"></i> Outros conteúdos</span>';page.append(legend);root.append(page);});C().audit('PDF preparado',mode==='legible'?'Duas páginas':'Uma página');
  }
  function buildPrintTable(items,from,to){
    const table=document.createElement('table');table.className='print-grid';table.innerHTML='<thead><tr><th class="print-time">Hora</th>'+C().DAYS.map(d=>'<th>'+d+'</th>').join('')+'</tr></thead>';const body=document.createElement('tbody');
    // O núcleo resolve a mescla: linhas pela duração, colunas pelos dias que repetem
    // exatamente o mesmo conteúdo (uma faixa ao vivo de segunda a sexta vira uma célula só).
    const {starts,covered}=C().printWeekLayout(items,ui.week,from,to);
    for(let slot=from;slot<to;slot++){const tr=document.createElement('tr'),time=slot*15,th=document.createElement('td');th.className='print-time';th.textContent=C().timeFromOpMinutes(time);tr.append(th);
      for(let day=0;day<7;day++){const chave=slot+':'+day;if(covered.has(chave))continue;const celula=starts.get(chave),td=document.createElement('td');if(celula){const segment=celula.segment,event=segment.item,span=celula.rowSpan,sizeClass=span===1?' print-short':span===2?' print-medium':span===3?' print-compact':' print-comfortable',continuation=segment.continuesBefore?'<span class="print-meta print-continuation">CONTINUAÇÃO</span>':'';td.rowSpan=span;if(celula.colSpan>1)td.colSpan=celula.colSpan;td.className='print-merged-cell'+(celula.colSpan>1?' print-faixa':'');td.dataset.duration=String(Math.max(1,+event.duration||30));td.innerHTML='<div class="print-program'+sizeClass+'"><strong class="print-title">'+esc(event.title)+'</strong>'+continuation+(event.episodeNumber||event.episodeTitle?'<span class="print-meta print-episode">'+esc(event.season?'T'+event.season+' ':'')+esc(event.episodeNumber?'EP '+event.episodeNumber:'')+' '+esc(event.episodeTitle||'')+'</span>':'')+(event.type==='live'?'<span class="print-meta print-status">AO VIVO</span>':event.isRerun?'<span class="print-meta print-status">REPRISE</span>':'')+'</div>';applyProgramColor(td,event,true);}tr.append(td);}body.append(tr);
    }table.append(body);return table;
  }
  async function init(){
    renderAppVersion();renderIcons();bind();applyTheme(localStorage.getItem('ebc_theme')||'light');applyPropostaVisual(localStorage.getItem('ebc_visual_proposta')==='1');setSidebarCollapsed(localStorage.getItem('ebc_sidebar_collapsed')==='1');setGradeZoom(ui.zoom,false);if(localStorage.getItem('ebc_pref_text_large')==='1')document.body.classList.add('text-large');
    if(!(await ensureHostingAuthorization()))return;
    let identity=null;try{if(typeof inicializarMicrosoftGraph==='function')identity=await inicializarMicrosoftGraph();}catch(err){console.error(err);$('#login-status').textContent='Falha ao restaurar o login: '+(typeof descreverErroMicrosoft==='function'?descreverErroMicrosoft(err):err.message);}
    if(identity){
      try{await enterApp(identity);}catch(err){console.error(err);await C().clearLocalData();setAppAvailability(false);$('#login-overlay').classList.remove('hidden');$('#login-status').textContent='Acesso não liberado: '+(err.message||'não foi possível validar o OneDrive.');toast('O sistema não abriu dados locais sem validar sua conta e a pasta compartilhada.','error');}
    }else{await C().clearLocalData();setAppAvailability(false);$('#login-overlay').classList.remove('hidden');}
    setInterval(updateNowIndicators,60000);
  }
  document.addEventListener('DOMContentLoaded',()=>init().catch(err=>{console.error(err);toast('Não foi possível iniciar o sistema: '+err.message,'error');}));
})();
