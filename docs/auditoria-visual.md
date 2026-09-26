# Auditoria visual — Wishbox WebApp

**Data da revisão:** 18 de setembro de 2026  
**Referência informada:** `https://wish-gift-unveil.lovable.app/`  
**Escopo:** tipografia, espaçamento, iconografia, cores e consistência dos componentes.

## Limitação da comparação externa

O endereço de referência não pôde ser carregado no ambiente de revisão: tanto o
acesso HTTP direto quanto o navegador de pesquisa retornaram bloqueio do proxy
(`403`/`401`). Por isso, esta auditoria **não afirma paridade pixel a pixel** com o
layout publicado no Lovable. A avaliação abaixo é uma inspeção estática completa
do sistema visual presente no repositório e deixa explícitos os pontos que ainda
precisam de uma comparação visual quando a referência estiver acessível.

## Resumo executivo

O WebApp segue um padrão visual coerente na maior parte das telas. A identidade é
baseada em Plus Jakarta Sans, roxo como cor de ação, fundos claros levemente
acinzentados, cartões brancos, bordas discretas, ícones Lucide e uma escala compacta
adequada a uma interface mobile-first. Os componentes estruturais (`Screen`,
`AppHeader`, `BottomNav`) também compartilham o mesmo limite de largura de 840 px.

O resultado é **consistente e os principais valores estruturais estão tokenizados**.
A revisão posterior à auditoria centralizou largura, sombras e raio circular, além
de remover cores fixas do login e do toast. A escala tipográfica ainda é implícita,
composta por diversos valores avulsos, e permanece como a principal oportunidade
de evolução do sistema.

| Critério | Estado | Conclusão |
|---|---:|---|
| Fonte | ✅ Aderente | Plus Jakarta Sans é aplicada globalmente com fallback seguro. |
| Cores principais | ✅ Aderente | Fundo, texto, primária, estados e tints têm tokens claros e versões dark. |
| Cores auxiliares | ✅ Aderente | Login e feedback usam tokens; cores oficiais de integrações são exceções intencionais. |
| Espaçamento | ✅ Aderente | Predomina a escala Tailwind de 4 px; estrutura e gutters são consistentes. |
| Raios e sombras | ✅ Aderente | Raios estruturais e sombras recorrentes usam tokens compartilhados. |
| Ícones | ✅ Aderente | A aplicação usa Lucide de forma praticamente exclusiva e com tamanhos próximos. |
| Tipografia | 🟡 Parcial | Família e pesos são coerentes; tamanhos/entrelinhas ainda não formam uma escala nomeada. |
| Responsividade | ✅ Aderente | Conteúdo mobile-first, centralizado e limitado a 840 px. |
| Paridade com Lovable | ⚪ Pendente | Exige acesso à referência para captura nas mesmas dimensões e estados. |

## 1. Fonte e hierarquia tipográfica

### O que está correto

- `Plus_Jakarta_Sans` é carregada por `next/font/google`, exposta em variável CSS
  e aplicada como fonte sans do tema. Isso evita variação entre páginas e reduz
  layout shift.
- A hierarquia é estável: títulos usam `font-bold`/`font-extrabold`, textos de
  apoio usam a cor muted e ações usam peso forte.
- Os tamanhos recorrentes (10–13 px para metadados, 14 px para corpo, 17–24 px
  para títulos) produzem uma interface compacta e consistente com o contexto móvel.

### Pontos de atenção

- Existem muitos tamanhos arbitrários (`9`, `10`, `11`, `12`, `13`, `14`, `15`,
  `16`, `17`, `22` e `23` px), além dos tamanhos da escala Tailwind. Sem papéis
  nomeados, componentes equivalentes podem divergir por 1–2 px.
- Entrelinhas também alternam entre valores da escala e valores diretos como
  `17px` e `18px`.
- Recomenda-se definir papéis semânticos — por exemplo `caption`, `label`, `body`,
  `section-title`, `page-title` e `display` — antes de ajustar tamanhos isolados.

## 2. Espaçamento e estrutura

### O que está correto

- O gutter principal é de 16 px (`px-4`) e o espaço inferior reserva 96 px
  (`pb-24`) para a navegação fixa.
- Cabeçalho e navegação inferior usam a mesma largura máxima do conteúdo (840 px),
  preservando alinhamento em telas maiores.
- Campos têm 46 px de altura e botões variam entre 36, 40 e 44 px. Essa progressão
  diferencia densidades sem alterar a linguagem visual.
- Grades e blocos usam majoritariamente múltiplos de 4 px, com exceções pequenas
  e justificáveis para ajustes ópticos.

### Pontos de atenção

- A largura máxima de 840 px foi centralizada no token de container `app`, usado
  pelo conteúdo, cabeçalho e navegação inferior.
- Valores de altura de modais (`80vh` e `85vh`) e larguras internas específicas
  são apropriados ao conteúdo, mas precisam ser conferidos na comparação visual
  com a referência em 320, 375, 390, 768 e 1024 px.

## 3. Ícones

### O que está correto

- A biblioteca `lucide-react` é usada de modo consistente; não há mistura visível
  de famílias de ícones de interface.
- Os tamanhos se concentram entre 16 e 20 px e os ícones herdam as cores dos tokens.
- Ações possuem rótulos acessíveis nos casos em que o ícone aparece sozinho.

### Pontos de atenção

- O `strokeWidth` varia entre o padrão da biblioteca, `2`, `2.4` e `2.5`. A marca
  pode justificar traço mais pesado no logotipo, mas ícones funcionais deveriam
  adotar uma regra única (recomendação: 2 px) salvo exceção documentada.
- Emojis são usados como ilustrações de listas. Isso é intencional, mas sua aparência
  muda entre sistemas operacionais; não devem ser usados quando a paridade exata
  com a referência for requisito.

## 4. Cores e modo escuro

### Paleta encontrada

| Papel | Claro | Escuro |
|---|---|---|
| Fundo | `#F6F6FA` | `#111020` |
| Texto principal | `#14141C` | `#FFFFFF` |
| Primária | `#5B2BE8` | `#7B4FF0` |
| Superfície | `#FFFFFF` | `#1C1A2E` |
| Texto secundário | `#6C6C7E` | `#8E8AA0` |
| Borda | `#EAEAF1` | `#2C2840` |
| Erro | `#E4405F` | `#FF6B7A` |
| Sucesso | `#12A594` | `#2DC98E` |
| Aviso | `#B34700` | `#FFB15C` |

### O que está correto

- Os papéis principais e os seis fundos tint possuem tokens em claro e escuro.
- Componentes base usam majoritariamente nomes semânticos (`primary`, `card`,
  `muted`, `border`) em vez de cores de implementação.
- Contrastes essenciais são preservados pela troca de paleta no seletor `.dark`.

### Pontos de atenção

- O rodapé do login e o toast foram migrados para tokens semânticos e agora
  acompanham o modo escuro.
- As cores oficiais de canais externos (WhatsApp e e-mail) podem permanecer locais,
  mas devem ser nomeadas como tokens de integração para esclarecer a exceção.
- A paleta está duplicada em CSS e TypeScript. Uma fonte de verdade reduziria o risco
  de uma alteração ser aplicada apenas em um dos dois lugares.

## 5. Bordas, raios e sombras

### O que está correto

- A base oferece raios de 8, 12, 16 e 20 px, suficientes para controles, cartões,
  painéis e superfícies de destaque.
- Cartões usam borda clara e sombra suave, mantendo separação sem deixar a interface
  pesada.

### Pontos de atenção

- Raios avulsos de 10, 14 e 18 px foram substituídos pelos raios nomeados mais
  próximos (`md`, `lg` e `xl`).
- Sombras de cartão, cartão compacto, ação primária, menu, toast e bottom sheet
  foram centralizadas em tokens com variantes adequadas ao modo escuro.
- Elementos circulares usam `rounded-full`, eliminando fallbacks locais.

## 6. Componentes e consistência entre telas

### Componentes alinhados

- `Button`, `Field`, `Card`, `Chip`, `Avatar`, `Toggle` e `EmptyState` centralizam os
  padrões mais recorrentes.
- `Screen` mantém fundo, largura, gutters e compensação da navegação.
- `AppHeader` e `BottomNav` compartilham identidade, largura e linguagem de ícones.

### Desvios encontrados

- Algumas telas recriam cartões, campos e botões com classes locais em vez de usar
  os componentes de UI. Isso já gera pequenas diferenças de altura, raio e sombra.
- As cores são referenciadas tanto pela sintaxe curta do tema (`text-muted`) quanto
  diretamente por variável (`text-(--color-muted)`). O resultado é equivalente,
  mas uma única convenção deixaria o código mais fácil de revisar.
- O toast passou a consumir superfície, texto, borda, aviso, raio e sombra do tema.

## Verificação recomendada contra a referência

Quando o endereço estiver acessível, executar a comparação abaixo sem alterar os
tokens antes de obter as evidências:

1. Capturar referência e WebApp em 390 × 844 px, 768 × 1024 px e 1440 × 900 px.
2. Usar os mesmos estados: login vazio, login com foco/erro, home com listas, lista
   com produtos, detalhe de produto, bottom sheet e modo escuro.
3. Sobrepor capturas a 50% de opacidade e medir fonte, line-height, gutters, alturas,
   raios, sombras, tamanhos de ícone e posições da navegação.
4. Registrar diferenças acima de 2 px e diferenças de cor por valor hexadecimal.
5. Classificar cada diferença como intencional, limitação web ou correção necessária.

## Plano de correção priorizado

1. **P0 — evidência visual:** liberar acesso à referência e produzir capturas
   comparáveis; sem isso, nenhuma alegação de paridade deve ser aprovada.
2. **P1 — tipografia:** consolidar os tamanhos recorrentes em papéis tipográficos.
3. **P1 — cores:** manter cores de marcas externas como exceções nomeadas e validar
   contraste em testes automatizados.
4. **P2 — primitives:** substituir controles e cartões locais pelos componentes de UI.
5. **P2 — iconografia:** padronizar tamanho e espessura por contexto.
6. **P3 — regressão:** adicionar snapshots visuais das telas críticas nos breakpoints
   acordados, inclusive em modo escuro.

## Conclusão

A aplicação **segue o padrão visual interno de forma satisfatória** em fonte,
estrutura, cores principais e iconografia. Ela ainda não pode ser declarada idêntica
ao layout de referência porque este não ficou acessível durante a revisão. Para
chegar a um sistema robusto e comprovadamente aderente, o trabalho mais importante
é capturar a referência e, em seguida, consolidar os papéis tipográficos antes de
realizar ajustes pontuais por tela.
