# Guia de testes automatizados

Este documento define como introduzir testes no Wishbox sem transformar o
primeiro pull request em uma tentativa de cobrir toda a aplicação.

## Ordem de implementação

1. Execute a suíte unitária mínima com o runner nativo do Node.js.
2. Cubra primeiro funções puras e mapeadores sem adicionar dependências.
3. Adote Vitest/Testing Library e Playwright em um segundo PR, mas mantenha testes que exigem credenciais fora da
   execução local padrão.
4. Valide login e logout em staging.
5. Amplie os cenários para reservas e bloqueios com duas contas independentes.

## 1. Suíte mínima sem novas dependências

O projeto começa com `node:test`, incluído no Node.js 20, e o compilador
TypeScript que já faz parte do projeto. Isso evita conflitos de peer
dependencies e permite obter cobertura útil imediatamente:

```bash
npm run test:unit
```

O script compila apenas os arquivos listados em `tsconfig.test.json` para
`.test-dist` e executa os testes JavaScript gerados. O diretório temporário é
ignorado pelo Git. Ao adicionar um novo módulo sob teste, inclua-o no campo
`include` do `tsconfig.test.json`.

Esta etapa é intencionalmente limitada a funções puras. Componentes React e
automação de navegador entram na etapa seguinte.

## 2. Dependências da etapa de componentes e E2E

Instale as ferramentas em um ambiente com acesso ao npm:

```bash
npm install --save-dev \
  vitest@3.2.4 @vitejs/plugin-react@latest vite-tsconfig-paths@5.1.4 jsdom \
  @testing-library/react @testing-library/dom \
  @testing-library/jest-dom@6 @testing-library/user-event \
  @playwright/test
npx playwright install --with-deps chromium
```

O Vitest 5 exige tipos do Node mais novos do que os usados atualmente pelo
projeto. Por isso, enquanto o projeto permanecer com `@types/node@20`, use
Vitest 3 e Jest DOM 6; não use `--force` nem `--legacy-peer-deps` para esconder
o conflito. O `package-lock.json` deve ser atualizado e commitado junto com o
`package.json`. Não edite o lockfile manualmente.

## 3. Scripts esperados na etapa Vitest/Playwright

Adicione ao `package.json`:

```json
{
  "scripts": {
    "test": "npm run test:unit",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

`test` deve ser determinístico e terminar sozinho, por isso ele usa `vitest
run`, e não o modo watch.

## 4. Organização sugerida

```text
tests/
  unit/                 # funções puras, mapeadores e cliente HTTP
  components/           # componentes cliente com DOM simulado
  e2e/                  # fluxos pelo navegador
  setup/
    vitest.ts            # matchers e limpeza global
    render.tsx           # render com providers do app
vitest.config.mts
playwright.config.ts
```

Não teste detalhes internos do reducer ou classes CSS. Prefira comportamento
observável: texto, papel acessível, request enviado e alteração apresentada ao
usuário.

## 5. Primeiros testes unitários

Comece por casos que não exigem Firebase nem servidor:

- normalização e validação de username;
- validação de preço, data e formulários;
- mapeamento de item/reserva/bloqueio do backend para o modelo da interface;
- paginação até `totalPages`;
- normalização de erros `401`, `403`, `404`, `409`, `413` e `500`;
- reducer de reserva e bloqueio sem duplicação de identificadores.

Para o cliente HTTP, substitua `globalThis.fetch` com `vi.stubGlobal` e restaure
o mock depois de cada teste. Verifique URL, método, token, body e o erro
produzido; não faça chamadas reais em testes unitários.

## 6. Smoke E2E de autenticação

O primeiro E2E integrado deve validar:

1. a tela de login abre;
2. credenciais inválidas exibem erro e não autenticam;
3. uma conta de teste válida entra e carrega a home autenticada;
4. logout encerra a sessão;
5. atualizar a página depois do logout não restaura dados privados.

Use variáveis exclusivas do runner, nunca valores versionados:

```text
E2E_BASE_URL=https://staging.example.com
E2E_USER_EMAIL=...
E2E_USER_PASSWORD=...
E2E_SECOND_USER_EMAIL=...
E2E_SECOND_USER_PASSWORD=...
```

Se as variáveis não existirem, o arquivo de autenticação deve ser marcado como
ignorado com uma justificativa explícita. Ele nunca deve passar usando mocks e
se apresentar como validação integrada.

## 7. Reservas e bloqueios

Esses testes precisam de duas sessões isoladas do navegador:

- **Reserva:** os dois usuários tentam reservar o mesmo item; somente um recebe
  sucesso, o outro recebe conflito, e o resultado persiste após reload.
- **Cancelamento:** somente quem possui autorização cancela pelo
  `reservationId` e o item volta a ficar disponível.
- **Bloqueio:** depois que A bloqueia B, valide busca, perfil, conexão, convite e
  mensagem nos dois sentidos.
- **Desbloqueio:** a relação some da tela de contas bloqueadas e continua
  removida depois de uma nova sessão.

Cada teste deve criar dados com um prefixo único e removê-los no `afterEach` ou
por uma API administrativa de fixtures. Testes não podem depender da ordem.

## 8. CI

O job obrigatório de pull request deve executar:

```bash
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

O E2E deve ficar em um job separado, com `timeout-minutes`, ambiente de staging
explícito e concurrency para impedir duas execuções sobre as mesmas contas.
Publique o relatório HTML, traces, screenshots e vídeos somente em falhas. As
credenciais devem vir de GitHub Actions Secrets.

## 9. Critério de aceite

O primeiro PR de infraestrutura está concluído quando:

- `npm run test:unit` funciona localmente e no CI;
- os testes unitários não acessam rede;
- `npm run test:e2e` inicia o app ou usa `E2E_BASE_URL` explicitamente;
- o smoke de autenticação usa uma conta reproduzível de staging;
- falhas E2E preservam diagnóstico sem expor credenciais;
- testes limpam os dados que criam;
- typecheck, lint, testes e build permanecem verdes.

## Próximo PR recomendado

O escopo deve ser somente **configuração do Vitest/Testing Library, primeiros
testes unitários, configuração do Playwright e smoke de autenticação**. Não
misture nesse PR correções funcionais de exclusão de conta, links públicos ou
upload; elas devem entrar em mudanças menores, cada uma acompanhada por seus
testes.
