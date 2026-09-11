import 'dotenv/config';
import { alarmes as obterAlarmesBrutos } from './armazenamento.js';
import { orquestrarResposta } from './servicos/orquestrador.js';

// Preços do modelo GPT-5.6 Luna por 1 Milhão (1.000.000) de Tokens em Dólares (US$)
const PRECO_ENTRADA_POR_1M = 0.20; // US$ 0,20 por 1M tokens de Entrada (Prompt)
const PRECO_SAIDA_POR_1M = 1.20;   // US$ 1,20 por 1M tokens de Saída (Resposta)

/**
 * Calcula explicitamente os custos de entrada, saída e total em US$
 */
function calcularCustoDetalhado(tokensEntrada, tokensSaida) {
  const custoEntrada = (tokensEntrada / 1_000_000) * PRECO_ENTRADA_POR_1M;
  const custoSaida = (tokensSaida / 1_000_000) * PRECO_SAIDA_POR_1M;
  const custoTotal = custoEntrada + custoSaida;

  return {
    custoEntrada,
    custoSaida,
    custoTotal
  };
}

async function rodarBenchmark() {
  const pergunta = 'Como está a Prensa 01 hoje?';
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('Erro: OPENAI_API_KEY não configurada.');
    return;
  }

  console.log('=== BENCHMARK DE CONSUMO: DADOS CRUS VS DADOS OTIMIZADOS ===\n');

  // 1. CHAMADA COM DADOS CRUS (alarmes.json bruto)
  console.log('⏳ 1/2 Chamando API com DADOS CRUS...');
  const alarmesBrutos = obterAlarmesBrutos();
  const promptCru = `Você é a IRiS. Responda à dúvida do usuário com base nestes dados brutos:\n${JSON.stringify(alarmesBrutos)}`;

  const resCru = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5.6-luna',
      messages: [
        { role: 'system', content: promptCru },
        { role: 'user', content: pergunta }
      ]
    })
  });

  const dadosCru = await resCru.json();
  const tokensCru = {
    prompt: dadosCru.usage?.prompt_tokens || 0,
    resposta: dadosCru.usage?.completion_tokens || 0,
    total: dadosCru.usage?.total_tokens || 0
  };

  // 2. CHAMADA COM DADOS OTIMIZADOS (Orquestrador IRiS)
  console.log('⏳ 2/2 Chamando API com DADOS OTIMIZADOS...');
  const resultadoOtimizado = await orquestrarResposta(pergunta);
  
  const tokensOtimizado = {
    prompt: resultadoOtimizado.tokensConsumidos?.prompt || 0,
    resposta: resultadoOtimizado.tokensConsumidos?.resposta || 0,
    total: resultadoOtimizado.tokensConsumidos?.total || 0
  };

  // CÁLCULOS MONETÁRIOS
  const custosCru = calcularCustoDetalhado(tokensCru.prompt, tokensCru.resposta);
  const custosOtimizado = calcularCustoDetalhado(tokensOtimizado.prompt, tokensOtimizado.resposta);

  const economiaCustoTotal = custosCru.custoTotal - custosOtimizado.custoTotal;

  // RELATÓRIO FINAL
  console.log('\n======================================================================');
  console.log('📊 RELATÓRIO DE RESULTADOS (EM DÓLARES)');
  console.log('======================================================================\n');

  console.log('1.');
  console.log(`   • Dados Crus:        ${tokensCru.total.toLocaleString('pt-BR')} tokens (Entrada: ${tokensCru.prompt} | Saída: ${tokensCru.resposta})`);
  console.log(`   • Dados Otimizados:  ${tokensOtimizado.total.toLocaleString('pt-BR')} tokens (Entrada: ${tokensOtimizado.prompt} | Saída: ${tokensOtimizado.resposta})\n`);

  console.log('2.');
  console.log('   --- CUSTO COM DADOS CRUS ---');
  console.log(`   • Entrada (Prompt):    US$ ${custosCru.custoEntrada.toFixed(6)}`);
  console.log(`   • Saída (Resposta):    US$ ${custosCru.custoSaida.toFixed(6)}`);
  console.log(`   • TOTAL CRU:           US$ ${custosCru.custoTotal.toFixed(6)}\n`);

  console.log('   --- CUSTO COM DADOS OTIMIZADOS ---');
  console.log(`   • Entrada (Prompt):    US$ ${custosOtimizado.custoEntrada.toFixed(6)}`);
  console.log(`   • Saída (Resposta):    US$ ${custosOtimizado.custoSaida.toFixed(6)}`);
  console.log(`   • TOTAL OTIMIZADO:     US$ ${custosOtimizado.custoTotal.toFixed(6)}\n`);

  console.log('   --- DIFERENÇA ---');
  console.log(`   • ECONOMIA: US$ ${economiaCustoTotal.toFixed(6)}`);
  console.log('\n======================================================================\n');
}

rodarBenchmark();