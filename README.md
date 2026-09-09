# IRIS Orquestrador, parte 2 do desafio

Na parte 1 você consertou um app. Aqui você constrói um.

O objetivo é um **chat que responde perguntas sobre a fábrica** conversando com um modelo de
linguagem, que por sua vez precisa consultar os dados da planta para responder. É o coração do
IRIS de verdade, reduzido ao osso.

A tela do chat já existe e funciona. O que não existe é o agente.

---

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Na primeira vez a API gera a base de dados sozinha, o que leva alguns segundos e ocupa uns
14 MB em `server/dados/`. Depois disso sobe a API em `localhost:3001` e a tela em
`localhost:5173`.

A chave da API eu te passo separado. Coloque em `.env`:

```
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
```

**A chave não pode chegar no navegador em hipótese nenhuma.** Se ela aparecer no bundle do
front, numa variável do Vite ou numa requisição visível no DevTools, está errado, mesmo que
funcione. Pense em quem consegue abrir o DevTools de um site em produção.

## O que já está pronto

```
src/                     a tela do chat, em React
  componentes/Chat.tsx   lista de mensagens, campo de envio, estados de carregando e erro
  api.ts                 chama POST /api/chat
server/
  index.js               a API com as rotas de dados
  armazenamento.js       leitura dos arquivos
  gerar-dados.js         gera a base (não precisa mexer)
  dados/                 a base gerada
```

Rotas que existem hoje:

```
GET  /api/estatisticas          contagens e tamanho em bytes de cada coleção
GET  /api/ativos                todos os ativos
GET  /api/sensores              todos os sensores
GET  /api/ordens                todas as ordens de manutenção
GET  /api/alarmes               todos os alarmes
GET  /api/paradas               todas as paradas de máquina
GET  /api/dias                  os dias com leitura disponível
GET  /api/leituras              todas as leituras
GET  /api/leituras?dia=...      as leituras de um dia
GET  /api/leituras?sensor=...   as leituras de um sensor
GET  /api/tudo                  tudo de uma vez, menos as leituras
POST /api/chat                  responde 501, é o seu trabalho
```

Repare que **nenhuma dessas rotas filtra, agrega ou resume nada**. Elas devolvem o conteúdo
cru dos arquivos. Isso é de propósito.

---

## O desafio

### 1. Fazer o agente funcionar

`POST /api/chat` recebe `{ mensagens: [{ papel, texto }] }` e precisa devolver a resposta do
agente. Entre uma coisa e outra tem você, o modelo e os dados da fábrica.

Use a **Responses API da OpenAI**, não a Chat Completions. Não tem uma linha de código dela
neste repositório, e isso também é de propósito: ler documentação de API e descobrir como uma
coisa funciona é metade do trabalho. Instale o que precisar.

O agente precisa conseguir responder perguntas como as que aparecem na tela inicial:

- Como está a Prensa 01 hoje?
- Quais ativos mais pararam nos últimos 30 dias?
- Tem algum sensor com leitura suspeita?
- Quanto a gente gastou com manutenção corretiva na linha de Injeção?

Nenhuma delas tem resposta pronta em lugar nenhum. Todas exigem olhar os dados e concluir
alguma coisa.

### 2. Não queimar dinheiro

Aqui está o problema de verdade.

Abra `/api/tudo` no navegador e olhe o tamanho da resposta. Depois `/api/leituras`. A base
inteira tem cerca de **190 mil leituras, 10 mil alarmes e 14 MB em disco**, e cresce todo dia
numa fábrica de verdade.

Token custa dinheiro. O IRIS roda o dia inteiro, com várias pessoas perguntando ao mesmo
tempo, e o que você desenhar aqui é o que define a conta no fim do mês.

Então:

- **Meça.** A resposta da API te diz quantos tokens cada chamada consumiu. Mostre esse número
  na tela, em cada mensagem. Se você não mede, você não sabe.
- **Compare.** No relatório, calcule quanto custaria mandar os dados crus para o modelo e
  quanto custa a sua implementação. Escreva a diferença.
- **Justifique.** Diga por que o número que você chegou é aceitável, e o que você faria se
  precisasse cortar pela metade de novo.

Não vou te dar um número alvo. Descobrir qual é a ordem de grandeza aceitável faz parte.

### 3. Botar ordem nos dados

Os dados vieram de três sistemas diferentes ao longo de seis anos e nunca foram padronizados.
Antes do agente conseguir responder qualquer coisa com confiança, alguém precisa arrumar isso,
e esse alguém é você.

O que você vai encontrar, em algum lugar ou em vários:

- o mesmo ativo cadastrado mais de uma vez, com códigos escritos de formas diferentes
- campos com nomes diferentes para a mesma coisa, dependendo de quem gravou o registro
- datas em mais de um formato, no mesmo arquivo
- número gravado como texto, às vezes com vírgula decimal
- registros apontando para coisas que não existem
- valores impossíveis, de sensor com defeito
- vocabulário inconsistente em campos de status e severidade
- unidades de medida misturadas

Cuidado especial com o último item: um agente que responde com número errado, com confiança,
é pior que um agente que não responde. Isso vale mais que qualquer economia de token.

**O backend é seu.** Diferente da parte 1, aqui você pode criar rota, mudar estrutura,
reescrever o que quiser dentro de `server/`, contanto que não mexa em `gerar-dados.js` (é a
fonte da bagunça e ela precisa continuar bagunçada) e que a base continue sendo a mesma.

### 4. UX que não irrita

O chat é a única coisa que o usuário vê. Hoje ele é o mínimo que funciona. Melhore.

Coisas que a gente considera básico num chat que consulta dados:

- a pessoa precisa perceber que algo está acontecendo enquanto espera, e uma consulta ao
  modelo pode demorar vários segundos
- a pessoa precisa saber **de onde veio a resposta**: qual ativo, qual período, quantos
  registros o agente olhou. Resposta de agente sem procedência é chute com boa redação
- erro precisa aparecer de um jeito que dê para agir, não um alerta genérico
- a conversa precisa ter memória do que já foi dito, sem que isso faça o custo crescer sem
  controle a cada pergunta

O resto do desenho é seu. Se você achar que outra coisa melhora a experiência, faça e explique
no relatório por quê.

---

## O que entregar

- O repositório com o que você construiu, funcionando com a chave no `.env`.
- Um `RELATORIO.md` explicando: como você desenhou a solução e por quê, o que descobriu de
  errado nos dados, os números de consumo de token (o antes ingênuo e o seu), e o que você
  deixou de fazer por falta de tempo.
- Um vídeo curto ou uns prints do chat respondendo três perguntas diferentes, para eu ver
  funcionando sem precisar da chave.

## Combinados

- Pode instalar as bibliotecas que precisar. Diga no relatório quais e por quê.
- Pode pesquisar e usar IA à vontade, inclusive para entender a Responses API. Só não traga
  código que você não sabe explicar, porque na semana que vem você vai ter que mexer nele.
- Uns 3 a 4 dias de trabalho, sem virar noite.
- Travou por mais de uma hora no mesmo ponto? Me chama.

## Uma dica só

Antes de escrever qualquer linha de código do agente, abra as rotas de dados no navegador e
olhe o que elas devolvem. Depois pense em como seria a resposta ideal para "como está a Prensa
01 hoje", e quantos dados uma pessoa precisaria olhar para escrever essa resposta à mão.

A diferença entre esses dois tamanhos é o desafio inteiro.
