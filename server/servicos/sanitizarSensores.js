import { sensores as obterSensoresBrutos } from '../armazenamento.js';

export function sanitizarSensores() {
  const brutos = obterSensoresBrutos();
  const sanitizados = [];

  for (const item of brutos) {
    const idSensor = item.codigo || item.sensor_id || item.id;
    const idAtivo = item.ativo || item.ativo_id || null;

    let tipo = item.tipo ? String(item.tipo).toLowerCase() : 'desconhecido';
    if (tipo === 'temp') tipo = 'temperatura';
    if (tipo === 'vibr' || tipo === 'corr') tipo = tipo === 'vibr' ? 'vibracao' : 'corrente';

    let unidade = item.unidade;
    if (['F', '°F', 'fahrenheit'].includes(unidade)) {
      unidade = '°C';
    } else if (['C', 'celsius'].includes(unidade)) {
      unidade = '°C';
    }

    sanitizados.push({
      id: item.id,
      codigo_sensor: idSensor ? String(idSensor).toUpperCase() : null,
      ativo_associado: idAtivo,
      tipo,
      unidade: unidade || 'N/A'
    });
  }

  return sanitizados;
}