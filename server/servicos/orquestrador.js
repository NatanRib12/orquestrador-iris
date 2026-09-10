import { 
  sanitizarAlarmes, 
  sanitizarAtivos, 
  sanitizarSensores, 
  sanitizarOrdens, 
  sanitizarParadas 
} from './index.js';

function extrairTagAtivo(texto, ativos) {
  const t = texto.toLowerCase();
  
  // Tenta encontrar por código exato ou por nome amigável
  const ativoEncontrado = ativos.find(a => 
    t.includes(a.codigo.toLowerCase()) || 
    t.includes(a.nome.toLowerCase()) ||
    t.includes(a.codigo.replace(/-/g, ' ').toLowerCase())
  );

  return ativoEncontrado ? ativoEncontrado.codigo : null;
}

function selecionarContexto(mensagem) {
  const texto = mensagem.toLowerCase();
  const todosAtivos = sanitizarAtivos();
  const tagEspecifica = extrairTagAtivo(texto, todosAtivos);
  
  const contexto = {};

  // Se encontrou uma máquina específica, filtra todos os dados referentes a ela
  if (tagEspecifica) {
    contexto.ativoAlvo = todosAtivos.find(a => a.codigo === tagEspecifica);
    contexto.alarmes = sanitizarAlarmes().filter(a => a.ativo === tagEspecifica);
    contexto.ordens = sanitizarOrdens().filter(o => o.ativo === tagEspecifica);
    contexto.paradas = sanitizarParadas().filter(p => p.ativo === tagEspecifica);
    return contexto;
  }

  // Caso contrário, faz a seleção por categorias com limite de amostragem
  if (texto.includes('alarme') || texto.includes('falha') || texto.includes('flapping')) {
    contexto.alarmes = sanitizarAlarmes().filter(a => a.em_flapping || a.severidade === 'critica');
  }

  if (texto.includes('ativo') || texto.includes('maquina') || texto.includes('equipamento')) {
    contexto.ativos = todosAtivos;
  }

  if (texto.includes('ordem') || texto.includes('manutencao') || texto.includes('custo')) {
    contexto.ordens = sanitizarOrdens().slice(0, 50); // Limita às 50 mais recentes
  }

  if (texto.includes('parada') || texto.includes('downtime')) {
    contexto.paradas = sanitizarParadas().slice(0, 50);
  }

  return contexto;
}

function serializarParaTexto(contexto) {
  let texto = '';

  if (contexto.ativoAlvo) {
    const a = contexto.ativoAlvo;
    texto += `[ATIVO SELECIONADO]\nCodigo: ${a.codigo} | Nome: ${a.nome} | Linha: ${a.linha} | Criticidade: ${a.criticidade}\n\n`;
  }

  if (contexto.ativos && !contexto.ativoAlvo) {
    texto += `[LISTA DE ATIVOS]\n` + contexto.ativos.map(a => `${a.codigo} | ${a.nome} | Criticidade:${a.criticidade}`).join('\n') + '\n\n';
  }

  if (contexto.alarmes && contexto.alarmes.length > 0) {
    texto += `[ALARMES (${contexto.alarmes.length})]\n` + contexto.alarmes.map(a => 
      `${a.ativo} | Sensor:${a.sensor} | Sev:${a.severidade} | Msg:${a.mensagem} | Disparos:${a.quantidade_disparos} | Flapping:${a.em_flapping}`
    ).join('\n') + '\n\n';
  }

  if (contexto.ordens && contexto.ordens.length > 0) {
    texto += `[ORDENS DE SERVIÇO (${contexto.ordens.length})]\n` + contexto.ordens.map(o => 
      `${o.ativo} | Status:${o.status} | Tipo:${o.tipo} | Custo:R$${o.custo} | Desc:${o.descricao}`
    ).join('\n') + '\n\n';
  }

  if (contexto.paradas && contexto.paradas.length > 0) {
    texto += `[PARADAS DE PRODUÇÃO (${contexto.paradas.length})]\n` + contexto.paradas.map(p => 
      `${p.ativo} | Motivo:${p.motivo} | Programada:${p.programada} | Turno:${p.turno}`
    ).join('\n') + '\n\n';
  }

  return texto;
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

  if (!temContexto) {
    return {
      resposta: 'Olá! Sou a IRiS. Para que eu possa te responder com precisão, por favor especifique sua dúvida sobre uma das áreas da fábrica: **Ativos/Máquinas**, **Alarmes**, **Sensores**, **Ordens de Serviço** ou **Paradas de Produção**.',
    };
  }

  const contextoFiltrado = serializarParaTexto(contextoDados);
  const promptSistema = construirPromptSistema(contextoFiltrado);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('A variável de ambiente OPENAI_API_KEY não foi configurada.');
  }

  // Chamada HTTP para a API da OpenAI via fetch nativo
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-5.6-luna',
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: mensagemUsuario }
      ],
    })
  });

  if (!response.ok) {
    const erroBody = await response.json().catch(() => ({}));
    throw new Error(`Erro na API da OpenAI (${response.status}): ${erroBody.error?.message || response.statusText}`);
  }

  const dados = await response.json();

  // Extração do conteúdo e medição dos tokens consumidos
  return {
    resposta: dados.choices[0]?.message?.content || 'Não foi possível gerar uma resposta.',
    tokensConsumidos: {
      prompt: dados.usage?.prompt_tokens || 0,
      resposta: dados.usage?.completion_tokens || 0,
      total: dados.usage?.total_tokens || 0
    },
    origem: 'openai_api'
  };
}