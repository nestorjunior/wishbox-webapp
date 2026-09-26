# Auditoria de paridade funcional — Wishbox WebApp

**Data da revisão:** 18 de setembro de 2026
**Aplicação revisada:** `wishbox-webapp` (branch `work`, commit-base `1e5f544`)

## Objetivo e método

Este documento inventaria as funcionalidades visíveis no WebApp e aponta o trabalho ainda necessário para alcançar uma experiência funcional completa equivalente à proposta do Wishbox Mobile, respeitando as diferenças entre React Native e Next.js.

A classificação não considera apenas a existência de uma tela: uma funcionalidade só é marcada como **implementada** quando a interface chama a API/Firebase e trata o resultado. **Parcial** indica fluxo presente, mas com estado apenas local, integração incompleta ou uma parte relevante ausente.

> **Limitação da revisão:** o ambiente de execução não conseguiu baixar o repositório público `wishbox-mobile` (o proxy respondeu HTTP 403). Portanto, não foi possível fazer uma comparação linha a linha com a revisão atual do Mobile. A linha de base usada foi: os fluxos citados no pedido, a estrutura/contratos compartilhados declarados pelo próprio WebApp e as funcionalidades expostas no código do WebApp. Os itens que dependem de confirmação visual/comportamental no Mobile estão explicitamente separados ao final.

## Resumo executivo

O WebApp já cobre o núcleo do produto: autenticação por e-mail, cadastro, recuperação de senha, listas, produtos, conexões, perfis, reservas, comentários/curtidas, notificações, calendário, conversas diretas e em grupo, compartilhamento e exclusão de conta.

As lacunas confirmadas mais importantes não são novas telas principais, mas fluxos que parecem prontos na interface e não persistem no backend:

1. **Pausar uma lista:** o contrato atual não permite persistir esse estado; por isso, a ação foi removida da interface até que exista suporte no backend.
2. **Cancelar reserva pela tela “Reservados”:** altera somente o estado local, sem chamada à API.
3. **Denunciar produto:** mostra confirmação, mas não envia a denúncia ao backend.
4. **Contas bloqueadas:** o item de configuração não executa nenhuma ação.
5. **Preferências de lembrete:** aniversário e datas comemorativas ficam apenas no armazenamento local do navegador.
6. **Perfil:** upload de avatar, nome, `username`, bio, nascimento e visibilidade do ano são editáveis; gênero, e-mail e senha ainda não são.
7. **Mensagens e notificações em tempo real:** não há canal realtime/push no cliente web; os dados são carregados por requisições pontuais.

## Matriz de funcionalidades

| Área | Funcionalidade | Estado no WebApp | Evidência/comentário |
|---|---|---:|---|
| Acesso | Login com e-mail e senha | ✅ Implementada | Firebase Auth e criação/recuperação da sessão no backend. |
| Acesso | Criar conta | ✅ Implementada | Nome, `username`, e-mail, senha, gênero e nascimento; cria usuário no Firebase e sincroniza o perfil backend. |
| Acesso | Esqueci minha senha | ✅ Implementada | Envio de e-mail pelo Firebase. |
| Acesso | Logout | ✅ Implementada | Encerra Firebase Auth, limpa o estado e volta ao login. |
| Conta | Excluir conta | ✅ Implementada, com ressalva | Exclui no backend e no Firebase. Se o Firebase exigir login recente, o backend já terá sido excluído e o usuário recebe uma mensagem para concluir depois; convém tornar a operação atômica ou reautenticar antes. |
| Perfil | Ver perfil próprio/alheio | ✅ Implementada | Exibe perfil, listas e ações sociais. |
| Perfil | Editar nome, `username`, bio e privacidade | ✅ Implementada | Persistência via `updateUser`. |
| Perfil | Editar foto/avatar | 🟡 Parcial | A tela permite validar, pré-visualizar e enviar uma nova foto; a remoção do avatar ainda não está disponível. |
| Perfil | Editar nascimento e gênero | 🟡 Parcial | Dia/mês e a preferência de exibir o ano são atualizados pela API; gênero ainda não está disponível na edição. |
| Perfil | Alterar e-mail e senha | ❌ Ausente | Não existe fluxo de segurança/reauth dedicado. |
| Perfil | Bloquear/desbloquear pessoas | ❌ Ausente | “Contas bloqueadas” tem `onClick` vazio e não há contrato de bloqueio no cliente API. |
| Listas | Criar lista por modelo | ✅ Implementada | Modelos, descrição e três opções de visibilidade são enviados ao backend. |
| Listas | Editar lista | ✅ Implementada | O formulário diferencia criação/edição, preserva o tipo da lista e usa `PATCH /v1/lists/{listId}` para nome, descrição e privacidade. |
| Listas | Excluir lista | ✅ Implementada | Confirmação e `DELETE` no backend. |
| Listas | Pausar/retomar lista | ➖ Fora do contrato | A ação local, reintroduzida por engano na interface, foi removida novamente porque a API de listas não oferece campo de status ou endpoint de pausa. Pode voltar somente quando houver persistência no backend. |
| Listas | Mudar privacidade | ✅ Implementada | A tela de edição envia `private` pelo endpoint de atualização e preserva o `listType`, que não é editável pelo contrato atual. |
| Listas | Compartilhar por link/WhatsApp/e-mail/Web Share/mensagem | ✅ Implementada | Oferece fallback de cópia para área de transferência. |
| Listas | Lista colaborativa/convidados | 🟡 Parcial | Criação colaborativa e gerenciamento de membros/papéis estão implementados. Ainda não há compartilhamento por círculo, embora a API exponha `/circle-shares`. |
| Listas | Lista padrão do perfil | ❌ Ausente | A API oferece `PUT /v1/lists/{listId}/default`, mas o WebApp não expõe a ação nem identifica visualmente a lista padrão. |
| Produtos | Cadastrar produto | ✅ Implementada | Nome, preço, loja, detalhes, URL/importação assistida e imagem; cria e associa à lista. |
| Produtos | Editar produto | ✅ Implementada | A tela reutiliza dados do produto e chama `updateItem`. |
| Produtos | Pausar/retomar produto | ✅ Implementada | Persiste o status no backend. |
| Produtos | Excluir produto | ✅ Implementada | Persiste no backend. |
| Produtos | Copiar/duplicar produto para outra lista | ✅ Implementada | Usa `addItemToList` e atualiza o catálogo. |
| Produtos | Curtir/descurtir | ✅ Implementada | Integra endpoints de like/unlike. |
| Produtos | Comentar | ✅ Implementada | Carrega e cria comentários no backend. |
| Produtos | Curtir comentário/responder comentário | ❌ Ausente/incompleta | O tipo/reducer prevê estado local de like e `parentId`, mas o cliente não expõe endpoints/fluxos completos dessas interações. |
| Produtos | Denunciar produto | 🟡 Somente interface | O formulário termina em um toast; não há requisição de denúncia. |
| Reservas | Reservar/desfazer na lista ou detalhe | ✅ Implementada | Integra API e notifica o dono. |
| Reservas | Ver itens reservados | ✅ Implementada | Catálogo filtrado na rota `/reserved`. |
| Reservas | Desfazer pela rota `/reserved` | ❌ Não persistida | A ação despacha somente `product/unreserve`; depois de recarregar, o servidor volta a ser a fonte de verdade. |
| Reservas | Marcar como comprado | ❌ Ausente | O botão “Comprar” apenas abre o detalhe do produto; não registra compra/status. Confirmar se esse estado existe no Mobile/backend. |
| Social | Buscar pessoas | ✅ Implementada | Autocomplete/busca backend. |
| Social | Seguir, solicitar, aceitar, recusar, cancelar e deixar de seguir | ✅ Implementada | Fluxos cobertos pela tela de conexões e store. |
| Social | Buscar/explorar listas | ✅ Implementada | Busca combinada de usuários e listas. |
| Social | Círculos/grupos sociais | 🟡 Parcial | Círculos são lidos para selecionar participantes de conversa, mas não há tela para criar, renomear, editar membros ou excluir círculos. |
| Mensagens | Conversa direta | ✅ Implementada | Cria conversa, carrega histórico, envia e marca leitura. |
| Mensagens | Conversa em grupo | ✅ Implementada | Seleção de pessoas/círculos, nome opcional e envio. |
| Mensagens | Atualização em tempo real | ❌ Ausente | Não há WebSocket/SSE/listener ou polling contínuo; novas mensagens de terceiros dependem de nova carga/navegação. |
| Mensagens | Anexos, áudio, imagens e apagar conversa/mensagem | ❌ Ausente | Cliente trabalha somente com conteúdo textual e não oferece ações de remoção. Confirmar escopo equivalente no Mobile. |
| Notificações | Listar e marcar como lida/todas lidas | ✅ Implementada | Dados e mutações vêm da API. |
| Notificações | Convite de lista e solicitação social | ✅ Implementada | Ações aceitar/recusar disponíveis na central. |
| Notificações | Push no navegador | ❌ Ausente | Não há Firebase Cloud Messaging, service worker, permissão do navegador ou registro de token web. |
| Calendário | Próximos aniversários e datas comemorativas | ✅ Implementada | Consulta `/v1/calendar/upcoming` para 366 dias e agrupa por data. |
| Calendário | Preferências de lembretes sincronizadas | 🟡 Parcial | Toggles alteram apenas estado persistido localmente; não acompanham o usuário em outro dispositivo. |
| Aparência | Modo escuro | ✅ Implementada | Estado persistido no navegador e aplicado ao documento. |
| Plataforma | Deep links/links públicos compartilháveis | 🟡 Parcial | URLs são produzidas, mas as rotas de lista/produto dependem da sessão/catálogo carregado; validar acesso de destinatário deslogado e metadados sociais. |
| Plataforma | PWA/offline/instalação | ❌ Ausente | Não há manifesto, service worker ou estratégia offline. Só é paridade necessária se o Mobile oferecer esse requisito no navegador. |

## Ordem de execução recomendada

Os itens abaixo devem ser executados **um por pull request**, na ordem indicada dentro de cada prioridade. Assim, cada correção pode ser revisada, testada e homologada sem misturar domínios. Um item só passa para `Concluído` depois que os testes automatizados e o roteiro manual correspondente forem executados.

Estados sugeridos para acompanhamento: `A fazer` → `Em andamento` → `Em validação` → `Concluído` (ou `Bloqueado`, acompanhado do motivo).

### P0 — integridade dos fluxos existentes

| Ordem | ID | Estado | Entrega | Dependência | Validação mínima |
|---:|---|---|---|---|---|
| 1 | `WB-P0-01` | Em validação | **Implementar edição real de lista:** lê `listId`, preenche o formulário, preserva o tipo da lista e chama `updateList` em vez de `createList`. | Contrato de `PATCH /v1/lists/:id` confirmado: aceita `name`, `description` e `private`; `listType` não é editável. | Testes do formulário nos modos criar/editar; editar e recarregar; garantir que nenhuma lista nova foi criada. |
| 2 | `WB-P0-02` | Concluído | **Remover pausar/retomar lista:** a antiga ação alterava apenas o estado local e foi retirada por não existir suporte no contrato da API de listas. | Um campo de status ou endpoint será necessário antes de reintroduzir a funcionalidade. | Confirmar que o menu não promete uma alteração sem persistência e que pausar produtos continua disponível. |
| 3 | `WB-P0-03` | Bloqueado | **Persistir reserva e cancelamento:** integrar os fluxos do detalhe, cards e `/reserved` a endpoints próprios de reserva. | A API de itens informa `reserved`/`reservedByMe`, mas não documenta operações para reservar/desfazer; `PATCH status` é uma mutação do item e não identifica o usuário que reservou. | Reservar/cancelar e recarregar; simular erro; testar concorrência, reserva de outro usuário e sessão expirada. |
| 4 | `WB-P0-04` | A fazer | **Integrar denúncia de produto:** enviar motivo/detalhes, tratar loading, sucesso, erro e duplicidade. Se não houver endpoint, ocultar a ação até o backend existir. | Endpoint/contrato de denúncia no backend. | Teste unitário do submit; sucesso e falha HTTP; verificar payload e impedir envio vazio/duplicado. |
| 5 | `WB-P0-05` | A fazer | **Implementar ou remover “Contas bloqueadas”:** nunca deixar o item clicável sem ação. | Endpoints de listar, bloquear e desbloquear usuários. | Acesso à tela; bloquear/desbloquear; reflexo em busca, mensagens e perfil; estados vazio/erro. |

### P1 — conta, perfil e comunicação

| Ordem | ID | Estado | Entrega | Dependência | Validação mínima |
|---:|---|---|---|---|---|
| 6 | `WB-P1-01` | Em validação | Concluir troca e remoção de foto/avatar; troca, validação e upload já estão implementados. | Contrato para remover `avatarPath`. | Formato/tamanho inválido, upload, remoção e persistência após novo login. |
| 7 | `WB-P1-02` | Em andamento | Concluir atualização de nascimento e gênero; dia/mês e visibilidade do ano já estão implementados. | Confirmar persistência do ano e regras de gênero da API. | Datas válidas/inválidas, campos opcionais e persistência. |
| 8 | `WB-P1-03` | A fazer | Adicionar alteração de e-mail/senha e reautenticação; reautenticar **antes** da exclusão definitiva. | Política do Firebase Auth e comportamento do backend. | Credencial inválida, sessão antiga, troca bem-sucedida e exclusão sem estado parcial. |
| 9 | `WB-P1-04` | A fazer | Sincronizar preferências de lembretes no backend por usuário. | Contrato de preferências. | Alterar em um navegador e conferir em outro; rollback em falha. |
| 10 | `WB-P1-05` | A fazer | Atualizar mensagens em tempo real e mostrar estados de envio, erro e não lidas. | Escolha entre WebSocket, SSE ou listener suportado pelo backend. | Duas sessões simultâneas, reconexão, duplicidade, ordenação e falha de envio. |
| 11 | `WB-P1-06` | A fazer | Implementar push web ou documentar oficialmente que a central será somente in-app. | FCM/service worker e endpoints de token. | Permissão aceita/negada, token renovado/removido, clique e usuário deslogado. |

### P2 — expansão social e robustez web

| Ordem | ID | Estado | Entrega | Dependência | Validação mínima |
|---:|---|---|---|---|---|
| 12 | `WB-P2-01` | A fazer | Criar gestão de círculos (CRUD e membros), caso confirmada no Mobile. | Validação direta contra Mobile e contratos backend. | CRUD, permissões, membros duplicados e uso ao criar conversa. |
| 13 | `WB-P2-02` | A fazer | Completar respostas/likes em comentários ou retirar ações/tipos locais sem suporte. | Definição do produto e endpoints. | Criar resposta, curtir/descurtir, recarregar e tratar exclusão do comentário pai. |
| 14 | `WB-P2-03` | A fazer | Validar links compartilhados, acesso anônimo, autorização e previews Open Graph. | Regras de privacidade e domínio público final. | Janela anônima para lista pública/privada/convidados e preview em compartilhamento. |
| 15 | `WB-P2-04` | A fazer | Definir se “Comprar” é link externo ou estado de negócio e implementar o comportamento aprovado. | Decisão de produto e possível campo/endpoint. | URL segura ou transição de status; permissões e persistência. |
| 16 | `WB-P2-05` | A fazer | Adicionar anexos e gerenciamento de conversas, se confirmados no Mobile. | Validação de paridade, storage e endpoints. | Tipo/tamanho de arquivo, upload, download, exclusão e autorização. |
| 17 | `WB-P2-06` | A fazer | Consolidar estados de erro/retry e testes E2E dos fluxos críticos. | Itens P0 e P1 estabilizados. | Suíte E2E de login, cadastro, lista, produto, conexão, mensagem, reserva e conta. |

## Processo ponto a ponto

Para cada ID, usar o mesmo ciclo:

1. **Confirmar o contrato:** registrar endpoint, payload, resposta, permissões e diferenças intencionais em relação ao Mobile.
2. **Criar um teste que falha:** cobrir primeiro o problema observado ou o principal critério de aceite.
3. **Implementar somente aquele item:** evitar refatorações e funcionalidades não relacionadas no mesmo pull request.
4. **Executar validação local:** no mínimo `npm run lint`, `npm run typecheck`, `npm run build` e os testes específicos adicionados.
5. **Testar manualmente:** executar o roteiro da coluna “Validação mínima”, incluindo sucesso, falha da API, recarga e permissões.
6. **Registrar evidências:** anexar ao PR comandos executados, resultado, screenshots quando houver mudança visual e limitações do ambiente.
7. **Homologar e atualizar este documento:** mudar o estado somente após aceite; então iniciar o próximo ID.

O item `WB-P0-01` está implementado e aguarda homologação integrada com a API. O `WB-P0-02` foi concluído removendo a ação sem persistência. O `WB-P0-03` depende da documentação dos endpoints próprios de reserva: não é seguro usar o status do item para representar quem fez a reserva.

## Critérios de aceite sugeridos

- Toda mutação continua aplicada depois de recarregar a página e entrar em outro navegador.
- Falhas HTTP não exibem confirmação de sucesso nem deixam o estado local divergente.
- Funcionalidades visíveis sempre têm ação, loading, sucesso, erro e autorização definidos.
- Os mesmos papéis (dono/editor/visualizador), regras de privacidade e regras de reserva são aplicados no Mobile e WebApp.
- Login, cadastro, lista, produto, conexão, mensagem, reserva e exclusão de conta possuem testes E2E de caminho feliz e falha.

## Validação ainda necessária contra o Mobile

Quando o repositório Mobile estiver disponível no ambiente de CI/revisão, comparar especificamente:

1. provedores de login adicionais (Google/Apple/telefone);
2. gestão de círculos e bloqueios;
3. câmera, galeria, compartilhamento nativo e deep links;
4. push, badges e preferências de notificação;
5. anexos, realtime e ações de conversa;
6. regras de “comprado”, reserva anônima e notificações ao dono;
7. campos editáveis de perfil e processo de exclusão/reauth;
8. comportamentos offline e cache.

Essa segunda passagem deve converter cada item acima em **equivalente**, **diferença intencional de plataforma** ou **gap**, e registrar a versão/commit exato dos dois repositórios.
