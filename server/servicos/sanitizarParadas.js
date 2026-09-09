import { paradas as obterParadasBrutas } from '../armazenamento.js';

function normalizarBooleano(valor) {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return valor === 1;
  if (typeof valor === 'string') {
    const v = valor.toLowerCase();
    return v === 'sim' || v === '1' || v === 'true';
  }
  return false;
}

export function sanitizarParadas() {
  const brutas = obterParadasBrutas();

  return brutas.map(item => ({
    id: item.id,
    ativo: item.ativo,
    inicio: item.inicio,
    fim: item.fim || null,
    motivo: item.motivo ? String(item.motivo).toLowerCase() : 'não informado',
    programada: normalizarBooleano(item.programada),
    turno: item.turno || 'N/A'
  }));
}