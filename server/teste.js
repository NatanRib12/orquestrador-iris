import 'dotenv/config'; // Carrega as variáveis do arquivo .env
import { orquestrarResposta } from './servicos/orquestrador.js';

async function testarChamadaOpenAI() {
  console.log('=== TESTANDO INTEGRAÇÃO REAL COM A OPENAI ===\n');

  try {
    const pergunta = 'Quais máquinas apresentaram erro de alarme ou flapping?';
    console.log(`Pergunta enviada: "${pergunta}"\n`);
    
    const resultado = await orquestrarResposta(pergunta);
    
    console.log('--- RESPOSTA DA IRiS ---');
    console.log(resultado.resposta);
    console.log('\n--- MÉTRICAS DE CONSUMO ---');
    console.log('Tokens do Prompt:', resultado.tokensConsumidos.prompt);
    console.log('Tokens da Resposta:', resultado.tokensConsumidos.resposta);
    console.log('Total de Tokens:', resultado.tokensConsumidos.total);
    console.log('Origem:', resultado.origem);
  } catch (erro) {
    console.error('Erro no teste:', erro.message);
  }
}

testarChamadaOpenAI();