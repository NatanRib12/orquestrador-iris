import { 
  sanitizarAlarmes, 
  sanitizarAtivos, 
  sanitizarSensores, 
  sanitizarOrdens, 
  sanitizarParadas 
} from './index.js';

function selecionarContexto(mensagem) {
  const texto = mensagem.toLowerCase();
  const contexto = {};

  if (texto.includes('alarme') || texto.includes('falha') || texto.includes('disparo') || texto.includes('flapping')) {
    contexto.alarmes = sanitizarAlarmes();
  }

  if (texto.includes('ativo') || texto.includes('maquina') || texto.includes('máquina') || texto.includes('linha') || texto.includes('equipamento')) {
    contexto.ativos = sanitizarAtivos();
  }

  if (texto.includes('sensor') || texto.includes('sensores') || texto.includes('telemetria')) {
    contexto.sensores = sanitizarSensores();
  }

  if (texto.includes('ordem') || texto.includes('manutencao') || texto.includes('manutenção') || texto.includes('os') || texto.includes('custo')) {
    contexto.ordens = sanitizarOrdens();
  }

  if (texto.includes('parada') || texto.includes('parou') || texto.includes('downtime') || texto.includes('turno')) {
    contexto.paradas = sanitizarParadas();
  }

  return contexto;
}

function construirPromptSistema(contextoDados) {
  return `Você é a IRiS, um assistente virtual especializada em gestão industrial e manutenção preditiva.

    Suas diretrizes de resposta são:
    1. Responda de forma clara, direta e objetiva com base EXCLUSIVAMENTE nos dados fornecidos abaixo.
    2. Se o contexto contiver alarmes com "em_flapping: true", alertar o usuário que o sensor está apresentando disparos em rajada (ruído técnico).
    3. Se o contexto contiver alarmes com "inconsistencia_temporal: true", avisar que a data de abertura consta como posterior ao fechamento.
    4. Se a informação solicitada não estiver presente no contexto, informe abertamente que não possui esse dado no sistema.

--- CONTEXTO DE DADOS DA FÁBRICA ---
${JSON.stringify(contextoDados, null, 2)}
`;
}

export async function orquestrarResposta(mensagemUsuario) {
  const contextoDados = selecionarContexto(mensagemUsuario);
  const temContexto = Object.keys(contextoDados).length > 0;

  // Interceptação de perguntas genéricas: evita gasto desnecessário de tokens
  if (!temContexto) {
    return {
      resposta: 'Olá! Sou a IRiS. Para que eu possa te responder com precisão, por favor especifique sua dúvida sobre uma das áreas da fábrica: **Ativos/Máquinas**, **Alarmes**, **Sensores**, **Ordens de Serviço** ou **Paradas de Produção**.',
    };
  }

  const promptSistema = construirPromptSistema(contextoDados);

  // [Próximo Passo]: Montagem do System Prompt e integração com a Responses API da OpenAI
  return {
    mensagemUsuario,
    contextoCarregado: Object.keys(contextoDados),
    status: 'prompt-done'
  };
}