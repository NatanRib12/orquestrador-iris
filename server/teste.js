import { 
  sanitizarAlarmes, 
  sanitizarAtivos, 
  sanitizarSensores, 
  sanitizarOrdens, 
  sanitizarParadas 
} from './servicos/index.js';

function testarSanitizadores() {
  console.log('=== TESTANDO A SANITIZAÇÃO DE CADA ARQUIVO ===\n');

  // 1. Teste de Alarmes (Verifica flapping, severidade e erros temporais)
  console.log('--- 1. Sanitização de Alarmes ---');
  const alarmes = sanitizarAlarmes();
  const comFlapping = alarmes.filter(a => a.em_flapping);
  const comErroTemporal = alarmes.filter(a => a.inconsistencia_temporal);
  
  console.log(`Total de alarmes após agrupamento: ${alarmes.length}`);
  console.log(`Alarmes identificados em flapping: ${comFlapping.length}`);
  console.log(`Alarmes com data invertida: ${comErroTemporal.length}`);
  console.log('Amostra de 1 alarme sanitizado:', alarmes[0] || 'Nenhum alarme');
  console.log('\n');

  // 2. Teste de Ativos (Verifica remoção de lixo e padronização de tags)
  console.log('--- 2. Sanitização de Ativos ---');
  const ativos = sanitizarAtivos();
  console.log(`Total de ativos válidos: ${ativos.length}`);
  console.log('Amostra de 1 ativo sanitizado:', ativos[0] || 'Nenhum ativo');
  console.log('\n');

  // 3. Teste de Sensores (Verifica unificação de unidades e schema)
  console.log('--- 3. Sanitização de Sensores ---');
  const sensores = sanitizarSensores();
  console.log(`Total de sensores sanitizados: ${sensores.length}`);
  console.log('Amostra de 1 sensor sanitizado:', sensores[0] || 'Nenhum sensor');
  console.log('\n');

  // 4. Teste de Ordens de Serviço (Verifica status e padronização de custo)
  console.log('--- 4. Sanitização de Ordens de Serviço ---');
  const ordens = sanitizarOrdens();
  console.log(`Total de ordens sanitizadas: ${ordens.length}`);
  console.log('Amostra de 1 ordem sanitizada:', ordens[0] || 'Nenhuma ordem');
  console.log('\n');

  // 5. Teste de Paradas (Verifica conversão de booleanos)
  console.log('--- 5. Sanitização de Paradas ---');
  const paradas = sanitizarParadas();
  console.log(`Total de paradas sanitizadas: ${paradas.length}`);
  console.log('Amostra de 1 parada sanitizada:', paradas[0] || 'Nenhuma parada');
}

testarSanitizadores();