import { alarmes as obterAlarmesBrutos } from '../armazenamento.js';

function padronizarSeveridade(sev) {
  if (!sev) return 'desconhecida';
  const valor = String(sev).toLowerCase();
  
  if (['critical', 'critica', 'p1', '1'].includes(valor)) return 'critica';
  if (['alta', 'p2', '2'].includes(valor)) return 'alta';
  if (['media', 'p3', '3'].includes(valor)) return 'media';
  if (['baixa', 'p4', '4'].includes(valor)) return 'baixa';
  
  return valor;
}

function agruparFlapping(alarmes) {
  const ordenados = [...alarmes].sort((a, b) => new Date(a.aberto) - new Date(b.aberto));
  const resultado = [];
  const JANELA_MS = 5 * 60 * 1000;

  for (const alarme of ordenados) {
    if (resultado.length === 0) {
      resultado.push({ ...alarme, quantidade_disparos: 1, em_flapping: false });
      continue;
    }

    const ultimo = resultado[resultado.length - 1];
    const dataAtual = new Date(alarme.aberto);
    const dataUltimo = new Date(ultimo.aberto);

    const mesmoSensor = alarme.sensor === ultimo.sensor;
    const mesmaMensagem = alarme.mensagem === ultimo.mensagem;
    const dentroDaJanela = (dataAtual - dataUltimo) <= JANELA_MS;

    if (mesmoSensor && mesmaMensagem && dentroDaJanela) {
      ultimo.quantidade_disparos += 1;
      ultimo.em_flapping = true;
      ultimo.ultimo_disparo = alarme.aberto;
    } else {
      resultado.push({ ...alarme, quantidade_disparos: 1, em_flapping: false });
    }
  }

  return resultado;
}

export function sanitizarAlarmes() {
  const brutos = obterAlarmesBrutos();
  const préProcessados = [];

  for (const item of brutos) {
    const dataAbertura = item.aberto ? new Date(item.aberto) : null;
    const dataFechamento = item.fechado ? new Date(item.fechado) : null;
    
    const temErroTemporal = Boolean(
      dataAbertura && dataFechamento && dataAbertura > dataFechamento
    );

    préProcessados.push({
      id: item.id,
      sensor: item.sensor,
      ativo: item.ativo,
      severidade: padronizarSeveridade(item.severidade),
      mensagem: item.mensagem,
      aberto: item.aberto,
      fechado: item.fechado,
      em_aberto: item.fechado === null,
      inconsistencia_temporal: temErroTemporal
    });
  }

  return agruparFlapping(préProcessados);
}