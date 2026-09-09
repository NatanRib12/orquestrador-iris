import { ordens as obterOrdensBrutas } from '../armazenamento.js';

function normalizarCusto(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    return parseFloat(valor.replace(',', '.')) || 0;
  }
  return 0;
}

function normalizarStatus(status) {
  if (!status) return 'desconhecido';
  const s = String(status).toLowerCase();
  if (['aberta', 'aberto', 'em andamento', 'em_andamento'].includes(s)) return 'em_andamento';
  if (['concluida', 'concluída', 'done', 'fechado', '3'].includes(s)) return 'concluida';
  return s;
}

export function sanitizarOrdens() {
  const brutas = obterOrdensBrutas();
  
  return brutas.map(item => ({
    id: item.id,
    ativo: item.ativo || item.ativo_id || null,
    status: normalizarStatus(item.status),
    tipo: item.tipo ? String(item.tipo).toLowerCase() : 'desconhecido',
    descricao: item.descricao || '',
    custo: normalizarCusto(item.custo),
    responsavel: item.responsavel || 'Não atribuído',
    data_abertura: item.abertura || item.aberta_em || null,
    data_fechamento: item.fechamento || item.fechada_em || null
  }));
}