export type Mensagem = {
  papel: 'usuario' | 'agente';
  texto: string;
};

export type RespostaDoChat = {
  texto?: string;
  resposta?: string;
  erro?: string;
  detalhe?: string;
  tokensConsumidos?: {
    prompt: number;
    resposta: number;
    total: number;
  };
  origem?: string;
};

export async function conversar(mensagens: Mensagem[]): Promise<RespostaDoChat> {
  const resposta = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mensagens }),
  });

  const corpo = await resposta.json();

  if (!resposta.ok) {
    return { erro: corpo.erro || `HTTP ${resposta.status}`, detalhe: corpo.detalhe };
  }

  return {
    ...corpo,
    texto: corpo.texto || corpo.resposta
  };
}

export async function estatisticas() {
  const resposta = await fetch('/api/estatisticas');
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}
