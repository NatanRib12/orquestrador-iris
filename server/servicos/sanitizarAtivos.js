import { ativos as obterAtivosBrutos } from '../armazenamento.js';

function padronizarPlanta(planta) {
  if (!planta) return 'Montes Claros';
  const p = String(planta).toLowerCase();
  if (['moc', 'montes claros', 'mc'].includes(p)) return 'Montes Claros';
  return planta;
}

export function sanitizarAtivos() {
  const brutos = obterAtivosBrutos();
  const sanitizados = [];

  for (const item of brutos) {
    const codigoFormatado = (item.codigo || item.tag || '').toUpperCase().replace(/_/g, '-').replace(/\s+/g, '-');
    
    if (codigoFormatado.includes('XXX') || item.nome === 'TESTE' || item.nome === 'nao usar') {
      continue;
    }

    sanitizados.push({
      id: item.id,
      codigo: codigoFormatado,
      nome: item.nome || item.descricao || 'Ativo sem nome',
      linha: item.linha ? String(item.linha).toLowerCase() : 'desconhecida',
      criticidade: item.criticidade ?? null,
      planta: padronizarPlanta(item.planta),
      instalado_em: item.instalado_em || null
    });
  }

  return sanitizados;
}