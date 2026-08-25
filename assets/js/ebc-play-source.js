/*!
 * Sistema de Grade - EBC / TV Brasil
 * Autor e desenvolvedor: Henrique Rude ("HDut")
 * Consulta ao acervo publico do TV Brasil Play para enriquecer o catalogo com
 * capas, sinopses, classificacao indicativa e nomes de episodios.
 *
 * IMPORTANTE: esta e uma API interna da EBC, sem documentacao e sem contrato de
 * estabilidade. Por isso ela e usada apenas como fonte de ENRIQUECIMENTO, nunca
 * como dependencia de exibicao: o resultado e gravado no OneDrive e a grade
 * continua funcionando por completo se o servico mudar ou sair do ar.
 */
(() => {
  'use strict';

  const BASE = 'https://play.ebc.com.br';
  const CATALOGO = BASE + '/v2/conteudos?limit=500';
  const EPISODIOS = id => BASE + '/v2/conteudos/' + encodeURIComponent(id) + '/episodios';
  const TEMPO_LIMITE = 15000;
  const MAX_ITENS = 2000;

  // "A Alma Quer Voar" e "ALMA QUER VOAR" precisam se encontrar; "Repórter Brasil"
  // e "Repórter Brasil Tarde" NAO podem, porque sao programas diferentes.
  const ARTIGOS = new Set(['a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e']);
  const normalizar = valor => String(valor ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const tokens = valor => normalizar(valor).split(' ').filter(Boolean);
  const tokensFortes = valor => { const lista = tokens(valor).filter(t => !ARTIGOS.has(t)); return lista.length ? lista : tokens(valor); };

  // Coeficiente de Dice sobre o conjunto de palavras relevantes.
  function similaridade(a, b) {
    const x = new Set(tokensFortes(a)), y = new Set(tokensFortes(b));
    if (!x.size || !y.size) return 0;
    let comuns = 0; x.forEach(t => { if (y.has(t)) comuns++; });
    return (2 * comuns) / (x.size + y.size);
  }

  function classificarCorrespondencia(titulo, candidato) {
    const a = normalizar(titulo), b = normalizar(candidato);
    if (!a || !b) return null;
    if (a === b) return 'exata';
    if (tokensFortes(a).join(' ') === tokensFortes(b).join(' ')) return 'alta';
    const score = similaridade(a, b);
    // 0.9 exige praticamente as mesmas palavras. Uma palavra relevante sobrando
    // derruba para 'media', que nunca e aplicada sozinha: e assim que
    // "Reporter Brasil" nao vira "Reporter Brasil Tarde" (Dice 0.8).
    if (score >= 0.9) return 'alta';
    if (score >= 0.75) return 'media';
    return null;
  }

  async function pegarJson(url) {
    const controle = new AbortController();
    const alarme = setTimeout(() => controle.abort(), TEMPO_LIMITE);
    try {
      const resposta = await fetch(url, { signal: controle.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!resposta.ok) throw new Error('O acervo do TV Brasil Play respondeu ' + resposta.status + '.');
      const dados = await resposta.json();
      return dados;
    } finally { clearTimeout(alarme); }
  }

  let catalogoPromessa = null;
  function catalogo(forcar = false) {
    if (forcar) catalogoPromessa = null;
    if (!catalogoPromessa) {
      catalogoPromessa = pegarJson(CATALOGO)
        .then(lista => {
          if (!Array.isArray(lista)) throw new Error('O acervo veio em formato inesperado.');
          return lista.slice(0, MAX_ITENS).map(normalizarConteudo).filter(item => item.titulo);
        })
        .catch(erro => { catalogoPromessa = null; throw erro; });
    }
    return catalogoPromessa;
  }

  const imagemSegura = valor => {
    const url = String(valor || '').trim();
    if (!/^https:\/\//i.test(url)) return '';
    try { return new URL(url).hostname.endsWith('ebc.com.br') ? url : ''; } catch (_) { return ''; }
  };

  function normalizarConteudo(bruto) {
    return {
      id: bruto?.id_conteudo,
      titulo: String(bruto?.nm_conteudo || '').trim(),
      tipo: String(bruto?.nm_tipo_conteudo || '').trim(),      // Série, Unitário, Programa, Mini-série...
      genero: String(bruto?.nm_genero || '').trim(),           // Documentário, Jornalismo...
      classificacao: String(bruto?.ds_sigla_classificacao_indicativa || '').trim(),
      sinopse: String(bruto?.ds_sinopse || '').trim(),
      ano: +bruto?.nr_ano_lancamento || 0,
      internacional: !!bruto?.bl_licenciado_internacional,
      capa: imagemSegura(bruto?.ds_caminho_capa_vertical) || imagemSegura(bruto?.ds_caminho_capa_horizontal) || imagemSegura(bruto?.ds_caminho_logo)
    };
  }

  // Segundos -> minutos inteiros, dentro dos limites que o catalogo aceita.
  const duracaoEmMinutos = segundos => {
    const total = Math.round((+segundos || 0) / 60);
    return total > 0 && total <= 1440 ? total : 0;
  };

  // Classificacao indicativa do Play -> os codigos usados pelo catalogo da grade.
  const MAPA_CL = { L: 'Livre', 10: '10_anos', 12: '12_anos', 14: '14_anos', 16: '16_anos', 18: '18_anos' };
  const traduzirClassificacao = sigla => MAPA_CL[String(sigla || '').trim().toUpperCase()] || '';

  function melhorCorrespondencia(titulo, lista) {
    let melhor = null;
    for (const item of lista || []) {
      const nivel = classificarCorrespondencia(titulo, item.titulo);
      if (!nivel) continue;
      const peso = { exata: 3, alta: 2, media: 1 }[nivel];
      if (!melhor || peso > melhor.peso) melhor = { item, nivel, peso, score: similaridade(titulo, item.titulo) };
      if (melhor.peso === 3) break;
    }
    return melhor ? { conteudo: melhor.item, confianca: melhor.nivel, similaridade: melhor.score } : null;
  }

  async function procurarPrograma(titulo, opcoes = {}) {
    const lista = opcoes.catalogo || await catalogo();
    return melhorCorrespondencia(titulo, lista);
  }

  // Devolve as temporadas no formato que o catalogo da grade ja entende.
  async function temporadasDe(idConteudo) {
    const bruto = await pegarJson(EPISODIOS(idConteudo));
    const grupos = Array.isArray(bruto) ? bruto : [bruto];
    const temporadas = [];
    grupos.forEach(grupo => (grupo?.temporada || []).forEach((temporada, indice) => {
      const episodios = (temporada?.episodios || []).map((episodio, ordem) => ({
        id: 'play_ep_' + (episodio?.id_episodio ?? (indice + '_' + ordem)),
        number: String(episodio?.nr_episodio ?? (ordem + 1)),
        title: String(episodio?.nm_episodio || '').trim(),
        synopsis: String(episodio?.ds_sinopse || '').trim(),
        // A planilha traz "MINUTOS POR EP", que e uma media aplicada a todos os episodios.
        // Aqui vem a metragem real de cada um, em segundos.
        duration: duracaoEmMinutos(episodio?.qt_duracao_segundos),
        status: 'available'
      })).filter(episodio => episodio.title || episodio.number);
      if (!episodios.length) return;
      temporadas.push({
        id: 'play_t_' + (temporada?.id_temporada ?? indice),
        number: String(temporada?.nr_temporada ?? (indice + 1)),
        title: String(temporada?.nm_temporada || '').trim(),
        order: indice + 1,
        episodeCount: episodios.length,
        episodes: episodios
      });
    }));
    return temporadas;
  }

  // CAMADA 2 — mapa montado offline a partir dos sites da EBC (tvbrasil.ebc.com.br,
  // ebc.com.br/imprensa e afins). Entra quando o acervo do Play nao tem o titulo ou
  // nao tem capa. E consultado por titulo porque as URLs de programa da EBC nao seguem
  // padrao previsivel: testamos "tvbrasil.ebc.com.br/<slug>" e volta 404.
  function procurarNoMapaEbc(titulo) {
    const mapa = window.TVBRASIL_PROGRAM_ARTWORKS || {};
    const alvo = normalizar(titulo);
    if (!alvo) return null;
    let aproximado = null;
    for (const [chave, valor] of Object.entries(mapa)) {
      const imagem = String(valor?.image_url || '').trim();
      if (!imagem || !/^https:\/\//i.test(imagem)) continue;
      const nivel = classificarCorrespondencia(titulo, chave);
      if (!nivel) continue;
      if (nivel === 'exata') return { url: imagem, titulo: chave, confianca: nivel };
      if (nivel === 'alta' && !aproximado) aproximado = { url: imagem, titulo: chave, confianca: nivel };
    }
    return aproximado;
  }

  // CAMADA 3 — busca aberta na Wikipedia (a API dela aceita chamada do navegador,
  // com origin=*; a maioria dos sites nao aceita e por isso nao da para varrer a
  // internet inteira daqui).
  //
  // CUIDADO QUE JUSTIFICA O CODIGO ABAIXO: a busca da Wikipedia SEMPRE devolve algo.
  // Procurando "Caminhos da Reportagem" ela respondeu "Tonny Brasil" — outro assunto
  // por completo. Uma imagem errada com cara de certa e pior do que nenhuma imagem,
  // porque ninguem vai conferir. Por isso so aceitamos quando o titulo do ARTIGO bate
  // com o titulo do programa pelo mesmo criterio conservador das outras camadas.
  const WIKIPEDIA = 'https://pt.wikipedia.org/w/api.php';
  async function procurarNaWikipedia(titulo) {
    const limpo = String(titulo || '').trim();
    if (limpo.length < 3) return null;
    const url = WIKIPEDIA + '?action=query&format=json&origin=*&prop=pageimages&piprop=original'
      + '&generator=search&gsrlimit=3&gsrsearch=' + encodeURIComponent(limpo);
    const dados = await pegarJson(url);
    const paginas = Object.values(dados?.query?.pages || {});
    for (const pagina of paginas) {
      const imagem = String(pagina?.original?.source || '').trim();
      if (!imagem || !/^https:\/\//i.test(imagem)) continue;
      const nivel = classificarCorrespondencia(limpo, pagina.title || '');
      // 'media' nao entra: e justamente onde moram os falsos positivos.
      if (nivel === 'exata' || nivel === 'alta') return { url: imagem, titulo: pagina.title, confianca: nivel };
    }
    return null;
  }

  // Monta uma SUGESTAO. Nao grava nada: preenche apenas o que esta vazio no
  // cadastro e devolve a lista de campos tocados para a interface mostrar.
  // Ordem das fontes: acervo do Play -> mapa dos sites da EBC -> Wikipedia -> manual.
  async function sugerirPara(programa, opcoes = {}) {
    let achado = null;
    try { achado = await procurarPrograma(programa?.title || '', opcoes); }
    catch (erro) { if (!opcoes.tolerarFalhaDeRede) throw erro; }
    if (achado && opcoes.minimo === 'alta' && achado.confianca === 'media') achado = null;
    const semImagem = !String(programa?.artwork?.url || '').trim() && !String(programa?.artwork?.fileName || '').trim();
    if (!achado) {
      if (!semImagem) return null;
      // Sem correspondencia no Play: mapa da EBC e, por ultimo, a busca aberta.
      let fonte = 'mapa_ebc', externa = procurarNoMapaEbc(programa?.title || '');
      if (!externa && opcoes.buscaAberta !== false) {
        fonte = 'wikipedia';
        try { externa = await procurarNaWikipedia(programa?.title || ''); }
        catch (_) { externa = null; }
      }
      if (!externa) return null;
      return {
        programId: programa?.id || '', title: programa?.title || '',
        confianca: externa.confianca, fonte,
        correspondente: { titulo: externa.titulo },
        campos: { artwork: { url: externa.url, source: fonte === 'wikipedia' ? 'web' : 'ebc_site' } },
        tocados: ['imagem']
      };
    }
    const conteudo = achado.conteudo, campos = {}, tocados = [];
    const vazio = valor => valor === undefined || valor === null || String(valor).trim() === '';

    let fonteDaCapa = 'ebc_play';
    if (semImagem) {
      // Play primeiro; se o titulo estiver la sem capa, desce para o mapa da EBC e,
      // por ultimo, para a busca aberta.
      let capa = conteudo.capa;
      if (!capa) { const daEbc = procurarNoMapaEbc(programa?.title || ''); if (daEbc) { capa = daEbc.url; fonteDaCapa = 'ebc_site'; } }
      if (!capa && opcoes.buscaAberta !== false) {
        try { const daWeb = await procurarNaWikipedia(programa?.title || ''); if (daWeb) { capa = daWeb.url; fonteDaCapa = 'web'; } }
        catch (_) { /* sem busca aberta agora; as outras fontes ja falharam */ }
      }
      if (capa) { campos.artwork = { url: capa, source: fonteDaCapa }; tocados.push('imagem'); }
    }
    if (vazio(programa?.cl)) {
      const cl = traduzirClassificacao(conteudo.classificacao);
      if (cl) { campos.cl = cl; tocados.push('classificação indicativa'); }
    }
    if (vazio(programa?.category) && conteudo.genero) { campos.category = conteudo.genero; tocados.push('categoria'); }
    if (vazio(programa?.synopsis) && conteudo.sinopse) { campos.synopsis = conteudo.sinopse; tocados.push('sinopse'); }
    if (!+programa?.productionYear && conteudo.ano) { campos.productionYear = conteudo.ano; tocados.push('ano de produção'); }

    // O acervo sabe o formato da obra: Unitário, Série, Mini-série, Programa.
    // "Unitário" e obra fechada — filme, documentario, especial: nao tem episodio.
    if (vazio(programa?.contentFormat) && conteudo.tipo) { campos.contentFormat = conteudo.tipo; tocados.push('formato'); }

    // Correcao de um erro que aparece na pratica: filme cadastrado com numeracao
    // continua, ganhando "EP 1, EP 2, EP 3" a cada exibicao como se fosse serie.
    // So mexemos no caso seguro — de 'continuous' para 'none', que nao tem temporada
    // para perder. Nunca tocamos em 'catalog': saveProgram apaga as temporadas ao
    // sair desse modo, e isso destruiria cadastro de episodio feito a mao.
    const modoAtual = String(programa?.episodeMode || '').trim();
    const semTemporadas = !(programa?.seasons || []).some(t => (t.episodes || []).length || +t.episodeCount > 0);
    if (/unit[áa]rio/i.test(conteudo.tipo) && modoAtual === 'continuous' && semTemporadas) {
      campos.episodeMode = 'none';
      campos.continuous = false;
      tocados.push('numeração de episódios (obra única não numera)');
    }

    return {
      programId: programa?.id || '',
      title: programa?.title || '',
      confianca: achado.confianca,
      similaridade: achado.similaridade,
      fonte: campos.artwork ? fonteDaCapa : 'ebc_play',
      correspondente: { id: conteudo.id, titulo: conteudo.titulo, tipo: conteudo.tipo, internacional: conteudo.internacional },
      campos, tocados
    };
  }

  // Nomes de episodios: so faz sentido para series/minisseries com temporadas.
  async function sugerirEpisodios(programa, opcoes = {}) {
    const achado = await procurarPrograma(programa?.title || '', opcoes);
    if (!achado || achado.confianca === 'media') return null;
    const temporadas = await temporadasDe(achado.conteudo.id);
    if (!temporadas.length) return null;
    const existentes = programa?.seasons || [];
    // Nunca sobrescreve temporada ja cadastrada: apenas completa titulos em branco
    // e acrescenta o que ainda nao existe.
    const porNumero = new Map(existentes.map(t => [String(t.number), t]));
    // Copia profunda ate o episodio. getCatalog() devolve copia RASA, entao mexer nos
    // objetos de episodio aqui escreveria direto no estado da aplicacao, sem passar por
    // saveProgram() — sem validacao, sem auditoria e sem marcar para sincronizar.
    const resultado = existentes.map(t => ({ ...t, episodes: (t.episodes || []).map(e => ({ ...e })) }));
    // A importacao da planilha aplica "MINUTOS POR EP" igual para todos os episodios da
    // temporada. Essa duracao herdada e uma media, nao a metragem real: podemos substitui-la
    // pela do acervo. Ja uma duracao que alguem ajustou a mao (diferente da media) fica.
    const mediaImportada = Math.max(0, +programa?.defaultDuration || 0);
    const podeTrocarDuracao = atual => {
      const valor = Math.max(0, +atual?.duration || 0);
      return !valor || valor === mediaImportada;
    };
    let preenchidos = 0, novas = 0, duracoes = 0;
    temporadas.forEach(vinda => {
      const atual = porNumero.get(String(vinda.number));
      if (!atual) { resultado.push(vinda); novas++; return; }
      const destino = resultado.find(t => String(t.number) === String(vinda.number));
      vinda.episodes.forEach(episodio => {
        const existente = (destino.episodes || []).find(e => String(e.number) === String(episodio.number));
        if (!existente) { destino.episodes.push(episodio); preenchidos++; return; }
        if (!String(existente.title || '').trim() && episodio.title) { existente.title = episodio.title; preenchidos++; }
        if (episodio.duration && podeTrocarDuracao(existente) && episodio.duration !== +existente.duration) {
          existente.duration = episodio.duration; duracoes++;
        }
      });
    });
    preenchidos += duracoes;
    if (!preenchidos && !novas) return null;
    return { programId: programa?.id || '', title: programa?.title || '', confianca: achado.confianca, seasons: resultado, preenchidos, novas, duracoes };
  }

  window.EBCPlay = {
    catalogo, procurarPrograma, temporadasDe, sugerirPara, sugerirEpisodios,
    // expostos para teste
    _normalizar: normalizar, _similaridade: similaridade, _classificar: classificarCorrespondencia,
    _normalizarConteudo: normalizarConteudo, _traduzirClassificacao: traduzirClassificacao, _melhor: melhorCorrespondencia
  };
})();
