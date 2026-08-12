# Dependências locais

Verificação realizada em 12/08/2026. A aplicação não carrega bibliotecas de CDN em produção.

| Dependência | Versão | Finalidade | Licença | Origem |
|---|---:|---|---|---|
| Microsoft Authentication Library for Browser | 5.18.0 | Login Microsoft Entra e aquisição de token para o Microsoft Graph | MIT | https://github.com/AzureAD/microsoft-authentication-library-for-js |
| SheetJS Community Edition | 0.20.3 | Leitura e geração de XLSX, XLS e CSV no navegador | Apache-2.0 | https://cdn.sheetjs.com/xlsx-0.20.3/ |
| esbuild | 0.28.2 | Geração local do pacote MSAL, sem execução no navegador | MIT | https://github.com/evanw/esbuild |

O MSAL é empacotado em `assets/js/microsoft-graph.bundle.js` pelo script `npm run build:auth`.
O SheetJS é mantido em `assets/vendor/xlsx.full.min.js`, acompanhado por `SHEETJS-LICENSE.txt`.
Em 12/08/2026, `npm audit` não identificou vulnerabilidades nas dependências npm e `npm outdated` não indicou atualização pendente. O SheetJS 0.20.3 foi conferido na documentação oficial do projeto.

Dexie, rrule.js, vis-timeline e SortableJS foram avaliados como referências, mas não foram incorporados. As necessidades atuais foram atendidas com APIs nativas do navegador e código de domínio menor, evitando peso e dependências desnecessárias.

Também foram avaliados `focus-trap`, `Floating UI` e `Fluent UI System Icons`. O sistema adotou os padrões úteis sem incluir os pacotes completos: controle de foco foi implementado no código local, os tooltips existentes atendem ao menu compacto e somente o novo ícone necessário foi desenhado no conjunto SVG já usado. Isso mantém a aplicação menor, offline e sem novas superfícies de atualização.
