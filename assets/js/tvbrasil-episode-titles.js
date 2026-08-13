/*
 * Títulos de episódios confirmados em páginas oficiais da TV Brasil/EBC.
 * A numeração é mantida no campo number; o texto é somente o título do episódio.
 */
(()=>{
  const titles={
    "AYRTON: RETRATOS E MEMÓRIAS":{
      source:"https://tvbrasil.ebc.com.br/ayrton-retratos-e-memorias",
      seasons:{
        "1":[
          "Um certo Silva",
          "Batismo de Fogo",
          "Velozes e Orgulhosos",
          "O Samurai e o Professor",
          "O Maior Duelo",
          "Companheiros de Classe",
          "Segredos do Paddock",
          "Vida de Campeão",
          "Ímola",
          "Legados"
        ]
      }
    },
    "O DIÁRIO DE MIKA":{
      source:"https://tvbrasil.ebc.com.br/o-diario-de-mika",
      seasons:{
        "1":[
          "A Caneta Brilhante",
          "Daniel está falando",
          "Mika quer Óculos",
          "Eu quero crescer",
          "Onde está o Eco?",
          "Brincando com balões",
          "Saudades do papai",
          "Mika Não Quer Ir Para a Escola",
          "Fazendo Barulho",
          "Organização",
          "Bolhinhas de Sabão"
        ]
      }
    }
  };
  window.TVBRASIL_EPISODE_TITLES=titles;
})();