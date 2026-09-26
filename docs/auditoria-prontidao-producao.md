# Auditoria de prontidão para produção — Wishbox WebApp

**Data:** 18 de setembro de 2026
**Branch revisada:** `work`
**Stack:** Next.js 16.3.4, React 19.2.8, TypeScript e Firebase Auth/Storage

## Parecer executivo

**Decisão recomendada: `NO-GO` para produção neste momento.**

O app compila, passa por TypeScript e ESLint e já possui boa parte das interfaces e integrações do produto. Entretanto, há ações apresentadas como concluídas que alteram apenas o estado em memória, caminhos críticos sem teste automatizado e requisitos operacionais e de segurança ainda não configurados. Publicar assim pode fazer o usuário acreditar que reservou ou bloqueou alguém quando o servidor não registrou a operação.

Os bloqueadores principais são:

1. reserva e cancelamento agora usam a API, mas ainda precisam de homologação concorrente com dois usuários;
2. bloqueio/desbloqueio agora usa a API, mas ainda precisa de homologação entre busca, perfil e mensagens;
3. exclusão apaga primeiro o usuário do backend e só depois tenta remover a conta Firebase, criando estado parcial quando o Firebase exige login recente;
4. não há testes unitários, de integração ou E2E para os fluxos críticos;
5. o upload intermediado pelo servidor não limita tamanho antes de carregar o arquivo em memória;
6. links compartilhados dependem do catálogo autenticado no estado do cliente e ainda não constituem páginas públicas confiáveis.

## Escopo e método

A revisão cobriu todas as rotas, componentes, hooks, store, cliente HTTP, configuração, documentação e CI versionados. Cada funcionalidade foi classificada pela implementação observável no repositório:

- **Pronto:** fluxo integrado e com tratamento básico de sucesso/erro;
- **Parcial:** interface funcional, porém falta persistência, realtime, comportamento público ou uma parte importante;
- **Não pronto:** ação simulada/local, botão sem ação ou requisito ausente;
- **Não validado:** código existe, mas precisa de ambiente integrado e usuários reais para homologação.

Foram executados `npm run typecheck`, `npm run lint` e `npm run build`. Não foi possível validar contratos em um ambiente integrado, porque o repositório não contém credenciais de homologação. O `npm audit --omit=dev` também não pôde consultar o registry, que respondeu HTTP 403.

## Critérios de criticidade e prioridade

| Nível | Definição | Tratamento |
|---|---|---|
| **Crítico** | Pode causar perda/inconsistência de dados, quebra de privacidade/segurança ou fluxo central enganoso. | Corrigir antes de qualquer lançamento. |
| **Alto** | Fluxo importante incompleto, risco operacional relevante ou ausência de proteção/teste essencial. | Corrigir antes do lançamento público; no máximo aceitar em beta fechado com mitigação. |
| **Médio** | Qualidade, acessibilidade, desempenho ou consistência degradados sem bloquear o caminho feliz. | Planejar para a primeira janela pós-bloqueadores. |
| **Baixo** | Evolução, acabamento ou melhoria sem risco imediato. | Backlog priorizado. |
| **P0** | Bloqueia produção. | Agora. |
| **P1** | Necessário para um lançamento público confiável. | Logo após P0, antes do go-live. |
| **P2** | Robustez e escala. | Próximas iterações. |
| **P3** | Melhoria incremental. | Backlog. |

## Matriz das funcionalidades solicitadas

| Funcionalidade | Estado | Criticidade / prioridade | Evidência e ajuste necessário |
|---|---|---|---|
| Login | **Parcial / não validado** | Alto / P1 | Firebase faz login e recuperação de senha. Falta E2E com API, proteção de rota no servidor, verificação de e-mail conforme política do produto, observabilidade e casos de sessão expirada/revogação. |
| Criação de conta | **Parcial / não validado** | Alto / P1 | Cria no Firebase e o provider cria/sincroniza o usuário backend. O fluxo distribuído não tem compensação se uma das etapas falhar e a tela reduz todos os erros a uma mensagem genérica. Validar unicidade de `username`, data, aceite clicável de termos e limpeza de conta órfã. |
| Exclusão de conta | **Não pronta** | **Crítico / P0** | O backend é excluído antes de `deleteUser` do Firebase. Reautenticar primeiro ou implementar operação coordenada/idempotente; confirmar deleção/cascata de listas, mensagens, imagens e dados pessoais; registrar auditoria sem PII. |
| Lista pública | **Implementada / não validada** | Alto / P1 | Criação usa `private: false`. Homologar permissões no backend e acesso por link em janela anônima. |
| Lista privada | **Implementada / não validada** | Alto / P1 | Criação usa `private: true`. Testar que busca, URL direta, API, cache e metadados não vazam dados. |
| Lista de convidados | **Parcial** | Alto / P1 | Lista colaborativa, membros e papéis existem. O convite já adiciona o membro imediatamente e “recusar” apenas marca a notificação como lida; alinhar semântica de convite/aceite, remoção e permissões com o backend. |
| Criar novo produto | **Implementado / não validado** | Alto / P1 | Cria item, associa à lista e envia imagem. Homologar rollback se associação/upload falhar, idempotência, formatos, limites e autorização de editor. |
| Compartilhar lista | **Parcial** | **Crítico / P0** | WhatsApp, e-mail, Web Share, clipboard e mensagem existem, mas a URL aponta para uma rota que resolve a lista pelo catálogo autenticado do cliente. Criar resolução server-side/pública e testar pública, privada, convidados, usuário sem login e preview social. |
| Compartilhar produto | **Parcial** | **Crítico / P0** | Mesma limitação dos links de lista. Definir autorização, página pública, 404/403 e metadados Open Graph específicos. |
| Adicionar amigos/conexões | **Implementado / não validado** | Alto / P1 | Seguir, solicitar e aceitar usam API. Testar conta pública/privada, duplicidade, corrida e falhas 409/401. |
| Bloquear amigos | **Implementado / não validado** | **Crítico / P0** | Bloqueio e desbloqueio usam os endpoints dedicados e a sessão hidrata a lista paginada de bloqueios. Ainda é obrigatório homologar os efeitos server-side em busca, perfil, convites e mensagens com duas contas. |
| Excluir amizades | **Implementado / não validado** | Alto / P1 | `deleteFollow` é usado para deixar de seguir/remover relação conforme estado. Homologar os dois lados da relação, pedido pendente e feedback consistente. |
| Conversas 1:1 | **Parcial** | Alto / P1 | Cria conversa, carrega histórico, envia e marca leitura. Não há realtime/polling, paginação incremental, retry ou prevenção clara de duplicidade; mensagens de outra sessão não aparecem automaticamente. |
| Conversas em grupo/lista | **Parcial** | Alto / P1 | Grupos podem ser criados por seleção, círculo ou participantes da lista. A associação do chat com a lista é inferida por nome + participantes, portanto renomear a lista ou alterar membros pode criar grupos duplicados. Persistir `listId/circleId` como identidade do grupo. |
| Reservados | **Implementado / não validado** | **Crítico / P0** | O cliente passou a usar `POST /v1/items/{itemId}/reservations`, pagina `GET /v1/reservations` para hidratar as reservas do usuário e cancela pelo `reservationId`. Ainda é obrigatório homologar concorrência/409, autorização, privacidade do reservador e persistência após recarga com dois usuários. |
| Conexões | **Implementado / não validado** | Alto / P1 | Lista seguindo, seguidores e solicitações é hidratada pelo backend. Falta paginação visível, retry padronizado e E2E multiusuário. |
| Mensagens de conexões | **Parcial** | Alto / P1 | Perfil inicia conversa e compartilhamento preenche texto. Confirmar política que impede mensagem de bloqueados/não conectados no backend e feedback via toast/estado local consistente. |
| Busca | **Parcial** | Médio / P2 | Tem debounce e busca de usuários/listas, mas o fallback pode baixar todas as páginas de usuários e a busca de listas gera uma chamada por usuário (N+1). Criar endpoint único paginado, cancelamento com `AbortController`, cache e testes de corrida. |
| Perfil privado/público | **Implementado / não validado** | Alto / P1 | Persiste `private` no backend. Testar autorização real em URL direta e remoção de conteúdo sensível de respostas e caches. |
| Contas bloqueadas | **Implementada / não validada** | **Crítico / P0** | A configuração abre uma tela com estado vazio, usuários bloqueados e ação persistida de desbloqueio. Validar paginação, usuários removidos e consistência após recarga. |
| Notificações | **Parcial** | Alto / P1 | Central in-app e leitura existem. O toggle “push” é estado efêmero; não há permissão, FCM/service worker, token nem preferências persistidas. Implementar push ou renomear/remover o controle. |
| Calendário | **Parcial** | Médio / P2 | Consulta eventos e exibe calendário, mas preferências de aniversário/feriados ficam somente no reducer e somem ao recarregar. Persistir por usuário e definir timezone. |
| Modo escuro | **Parcial** | Médio / P2 | Aplica classe apenas durante a sessão; não persiste preferência e pode piscar na primeira renderização. Usar preferência do usuário/localStorage e script de inicialização compatível com SSR. |
| Sair da conta | **Implementado** | Médio / P2 | Firebase sign-out e limpeza do reducer existem. Validar limpeza de caches/dados do usuário anterior e múltiplas abas. |
| Padrão das modais | **Parcial** | Alto / P1 | Há `ConfirmDialog`, mas vários sheets/modais são implementados separadamente. Nem todos têm `role="dialog"`, `aria-modal`, foco preso/restaurado, Escape ou bloqueio de scroll. Criar primitives acessíveis `Dialog` e `Sheet`. |
| Mensagens com Toast | **Parcial** | Alto / P1 | Existe provider central, mas login/cadastro/listas/mensagens ainda usam erros inline e algumas ações locais exibem sucesso indevido. Adicionar `role="status"`/`alert`, fila ou política de substituição, botão de fechar e convenção de erro/sucesso; nunca mostrar sucesso antes do servidor. |

## Achados transversais

### P0 — bloqueadores de produção

| ID | Achado | Risco | Ação de aceite |
|---|---|---|---|
| `PROD-001` | Integração de reservas implementada, aguardando homologação. | Uma divergência no contrato, na paginação ou na atualização de status ainda pode permitir interface desatualizada. | Validar criação/cancelamento, 401/403/404/409/500, recarga e concorrência em E2E com dois usuários. |
| `PROD-002` | Integração de bloqueio/desbloqueio implementada, aguardando homologação. | Se alguma API não aplicar a relação, o usuário bloqueado ainda pode aparecer ou interagir. | Validar persistência e enforcement em busca, perfil, follow, listas, convites e mensagens com duas contas. |
| `PROD-003` | Exclusão de conta não é coordenada. | Conta Firebase pode sobreviver sem perfil backend e exigir suporte manual. | Reautenticar antes, excluir de forma idempotente e testar falha em cada etapa. |
| `PROD-004` | Links compartilhados não possuem carregamento público por id/slug. | Destinatário vê “não encontrado” ou depende de estar autenticado e ter o item no catálogo. | Resolver no servidor com 200/403/404 corretos, regras de privacidade e metadados sociais. |
| `PROD-005` | Upload proxy aceita o `File` inteiro sem limite explícito. | Consumo excessivo de memória/banda e negação de serviço. | Limitar tamanho no proxy/plataforma e backend, validar antes de `arrayBuffer`, rate-limit e retornar 413. Preferir upload direto assinado com CORS correto. |
| `PROD-006` | Nenhum teste automatizado foi encontrado. | Regressões em autenticação, privacidade e mutações não são detectadas pelo CI. | Unitários para domínio/API, integração de componentes e E2E multiusuário dos fluxos críticos no CI. |

### P1 — necessário antes do go-live público

1. **Homologação integrada:** executar todos os fluxos com API/Firebase de staging, pelo menos dois usuários, perfis público/privado e papéis owner/editor/viewer.
2. **Segurança HTTP:** definir CSP, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, HSTS no edge e política de CORS. Revisar rate limit de autenticação, busca, mensagens, comentários e uploads.
3. **Autorização:** confirmar que toda mutação e leitura sensível é autorizada no backend; ocultar botões é apenas UX, não segurança.
4. **Observabilidade:** integrar captura de exceções, logs estruturados com correlation id, métricas, alertas de erro/latência e Web Vitals; hoje o erro global depende de `console.error`.
5. **Realtime e resiliência:** definir WebSocket/SSE/polling para mensagens/notificações, reconexão, ordenação, idempotência e estados de envio.
6. **Acessibilidade:** padronizar dialogs/sheets, foco/teclado, regiões vivas do toast, contraste e alvo de toque; executar axe e navegação apenas por teclado.
7. **Estados de rede:** adicionar timeouts/abort aos requests, retry seletivo, tratamento 401 central e mensagens consistentes. O cliente HTTP hoje não recebe `AbortSignal` e não impõe timeout.
8. **Configuração por ambiente:** remover o domínio de desenvolvimento como default operacional, validar variáveis na inicialização e documentar staging/prod, rotação e rollback.
9. **Privacidade/LGPD:** revisar textos legais com jurídico, base legal/consentimento, exportação/retenção/exclusão, dados em logs e política para nascimento/gênero.
10. **Release:** acrescentar smoke test pós-deploy, preview/staging, migração compatível, backup/restore testado, feature flags e plano de rollback.

### P2 — robustez, desempenho e manutenibilidade

- O provider global tem mais de duas mil linhas e concentra autenticação, catálogo, social, notificações e estado de UI. Separar por domínio ou usar uma camada de query/cache reduz renderizações e acoplamento.
- Quase todas as telas interativas são Client Components. Manter a interatividade na borda, mas mover carregamento público/SEO e composição estática para Server Components quando adequado.
- Adicionar `loading.tsx`/Suspense útil por segmento e estados de retry. Atualmente o app não possui loading boundaries de rota.
- O bootstrap faz múltiplas chamadas encadeadas e busca membros por lista. Medir waterfalls, paginar catálogo e social e evitar N+1.
- Produtos externos usam `next/image` com `unoptimized`; estabelecer proxy/CDN e allowlist para melhorar Core Web Vitals sem abrir otimização arbitrária.
- Adicionar `robots`, `sitemap`, manifesto/PWA apenas se fizer parte do posicionamento, `opengraph-image` e metadata dinâmica para páginas compartilháveis.
- Separar `lib/api.ts` por domínio e gerar/validar contratos em runtime (OpenAPI + schema) para evitar casts cegos de JSON.
- Remover reducers/tipos locais sem persistência ou garantir que toda mutação siga o padrão API → confirmação → store/rollback.

## Avaliação de React/Next.js e padrões de código

### Pontos positivos

- TypeScript está habilitado e `typecheck`, lint e build fazem parte do CI.
- O App Router usa wrappers de página Server Component para metadata e componentes cliente apenas onde há interação.
- Há componentes-base (`Button`, `Field`, `Card`, `Avatar`, `Toggle`, `EmptyState`, `ConfirmDialog`) e tokens visuais coerentes.
- O cliente HTTP centraliza autenticação e normalização de erros; URLs interpoladas usam `encodeURIComponent`.
- O app possui `error.tsx` e `not-found.tsx`, além de loading/disabled em vários formulários.

### Ajustes recomendados

- Criar uma camada de casos de uso por domínio em vez de permitir que telas chamem API, Firebase e reducer diretamente.
- Substituir o estado global monolítico por stores/contextos menores e cache de servidor; memorizar seletores e evitar hidratação integral.
- Usar um primitive único para modal/sheet e um formulário/validação compartilhado para reduzir classes e comportamentos duplicados.
- Centralizar mapeamento de erros Firebase/API para que cadastro, login e mutações mostrem causas acionáveis sem expor mensagens internas.
- Não usar o estado cliente como fonte de autorização; páginas por id devem buscar o recurso e deixar o backend decidir acesso.
- Acrescentar `app/global-error.tsx` se for necessário capturar falhas do root layout, conforme o checklist da versão instalada do Next.js.

## Estratégia mínima de testes

### Próximo passo recomendado

**Sim, devemos iniciar testes automatizados agora, mas não como uma etapa isolada nem tentando cobrir o app inteiro antes das correções.** A sequência mais eficiente é:

1. **Confirmar os contratos restantes dos P0 com o backend:** reserva e bloqueio foram recebidos e integrados; ainda faltam a coordenação da exclusão entre Firebase/backend e a leitura pública de listas/produtos. Sem isso, um E2E pode apenas automatizar o comportamento local incorreto.
2. **Montar a infraestrutura mínima de testes:** Vitest + Testing Library para domínio/componentes e Playwright para E2E. Adicionar scripts separados para `test`, `test:unit` e `test:e2e`, além dos jobs correspondentes no CI.
3. **Criar um smoke E2E do que já deveria funcionar:** login → home → logout. Esse teste valida configuração, Firebase/API de staging, fixtures e execução do navegador antes de ampliar a suíte.
4. **Corrigir cada P0 usando teste primeiro:** começar por reserva, com teste de integração do estado de erro e E2E concorrente com dois usuários; depois bloqueio, exclusão, links públicos e upload.
5. **Só então ampliar a regressão:** cadastro, listas, produtos, conexões, conversas, configurações, acessibilidade e visual.

O próximo PR deve ser **infraestrutura de testes + smoke de autenticação**, sem tentar mockar como “sucesso” as funcionalidades P0 ainda inexistentes. Em paralelo, o backend precisa fechar os contratos restantes. A integração de **reserva persistida** deve receber testes de API/UI e E2E multiusuário antes de sair de P0.

#### Definition of Done do primeiro PR de testes

- `npm run test:unit` executa localmente e no CI;
- `npm run test:e2e` executa contra um ambiente explicitamente configurado;
- segredos e contas de teste ficam no secret manager do CI, nunca no repositório;
- os testes não dependem de ordem e limpam os dados criados;
- há artefatos de trace, screenshot e vídeo apenas nas falhas;
- o smoke cobre login válido, credencial inválida, acesso autenticado e logout;
- falha de serviço externo produz diagnóstico claro, sem falso positivo ou retry ilimitado;
- o README documenta instalação, variáveis, execução e depuração.

> Até existir um ambiente de staging estável, é válido começar pelos testes unitários e de componentes. O E2E de autenticação deve entrar no CI somente quando Firebase e API de teste tiverem contas/fixtures reproduzíveis.

### Unitários

- mapeadores backend → UI, validações de username/data/preço e reducer;
- cliente HTTP: envelopes, erro não JSON, 401/403/404/409/413/500, timeout e cancelamento;
- regras owner/editor/viewer, perfil privado, bloqueio e reserva.

### Integração de componentes

- formulários de login, cadastro, lista e produto com sucesso/falha;
- dialogs/sheets: foco inicial, Tab, Escape, restore focus e loading;
- toast: região viva, substituição/fila, ação e duração;
- busca: debounce, corrida de respostas e cancelamento.

### E2E obrigatórios

1. criar conta → sincronizar backend → logout → login;
2. criar lista pública/privada/convidados → convidar → aceitar/recusar → validar acesso;
3. criar/editar/excluir produto e upload inválido/grande;
4. compartilhar lista/produto e abrir deslogado, autorizado e não autorizado;
5. seguir/aceitar/remover/bloquear/desbloquear com dois usuários;
6. conversa direta e de grupo em duas sessões, incluindo realtime/reconexão;
7. reservar simultaneamente com dois usuários e cancelar após recarga;
8. alterar todas as configurações e validar persistência em outro dispositivo;
9. excluir conta com sessão recente e expirada, sem dados órfãos;
10. smoke dos principais caminhos em viewport móvel e desktop, claro e escuro.

## Plano priorizado de entrega

| Ordem | ID | Prioridade | Entrega | Dependência |
|---:|---|---|---|---|
| 1 | `PROD-001` | P0 | Homologar a integração de reserva persistida e cobrir concorrência. | Staging e duas contas de teste. |
| 2 | `PROD-002` | P0 | Homologar bloqueio/desbloqueio em todos os domínios. | Staging e duas contas de teste. |
| 3 | `PROD-003` | P0 | Exclusão coordenada com reautenticação e cascata. | Firebase/backend. |
| 4 | `PROD-004` | P0 | Rotas compartilháveis reais e autorização. | Regra de produto/SEO. |
| 5 | `PROD-005` | P0 | Limites e proteção do upload. | Infra/backend/storage. |
| 6 | `PROD-006` | P0 | Base de testes + E2E dos cinco itens anteriores. | Staging e contas de teste. |
| 7 | `PROD-007` | P1 | Homologar login, cadastro, listas, produtos e conexões. | Ambiente integrado. |
| 8 | `PROD-008` | P1 | Realtime de chat/notificações e grupos ligados à lista por id. | Backend realtime/modelagem. |
| 9 | `PROD-009` | P1 | Preferências persistidas de push/calendário/tema. | Contrato de preferências/FCM. |
| 10 | `PROD-010` | P1 | Dialog/Sheet/Toast acessíveis e consistentes. | Primitive de UI. |
| 11 | `PROD-011` | P1 | Headers, rate limit, observabilidade e runbooks. | Infra/plataforma. |
| 12 | `PROD-012` | P2 | Performance, paginação, cancelamento e decomposição do store/API. | Métricas de staging. |
| 13 | `PROD-013` | P2 | SEO, Open Graph, Web Vitals e regressão visual. | Domínio final e páginas públicas. |

## Checklist de liberação

Só alterar o parecer para **GO** quando todos os itens abaixo tiverem evidência anexada à release:

- [ ] Todos os P0 concluídos e homologados com dois usuários concorrentes.
- [ ] `npm ci`, typecheck, lint, testes e build verdes em CI a partir de lockfile limpo.
- [ ] E2E dos fluxos críticos verde em staging com serviços reais ou emuladores equivalentes.
- [ ] Matriz de autorização público/privado/convidado/owner/editor/viewer aprovada.
- [ ] Teste de exclusão e retenção de dados aprovado por produto/jurídico.
- [ ] Upload com limite, rate limit e formatos validados.
- [ ] CSP/headers/CORS e varredura de dependências revisados.
- [ ] Monitoramento, alertas, dashboards, health checks e logs sem PII disponíveis.
- [ ] Backup/restore, rollback e resposta a incidente ensaiados.
- [ ] Acessibilidade automatizada e manual sem violações bloqueadoras.
- [ ] Lighthouse/Web Vitals medidos nas rotas críticas e budgets acordados.
- [ ] Política de browsers, domínio, TLS, e-mails Firebase e variáveis de produção validados.
- [ ] Smoke test pós-deploy e responsável pelo go/no-go definidos.

## Conclusão

A base é promissora e o build de produção está saudável, mas **compilar não significa estar pronto para produção**. O primeiro marco deve ser transformar reserva, bloqueio, exclusão e compartilhamento em operações realmente persistidas, autorizadas e testadas. Depois, fechar realtime, preferências, acessibilidade e operação. Com os P0 resolvidos e os P1 homologados, o app passa a ter condições de um lançamento público controlado.
