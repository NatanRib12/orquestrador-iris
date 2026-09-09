import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const destino = path.join(aqui, 'dados');

const SEMENTE = 20260904;
const DIAS = 30;
const FIM = new Date('2026-09-04T00:00:00Z');

function criarRng(semente) {
  let estado = semente;
  return function () {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = criarRng(SEMENTE);

function escolher(lista) {
  return lista[Math.floor(r() * lista.length)];
}

function entre(minimo, maximo) {
  return minimo + r() * (maximo - minimo);
}

function inteiro(minimo, maximo) {
  return Math.floor(entre(minimo, maximo + 1));
}

function chance(p) {
  return r() < p;
}

const LINHAS = [
  { nome: 'Prensas', prefixo: 'PRE', quantidade: 12, tipo: 'prensa' },
  { nome: 'Mistura', prefixo: 'BAN', quantidade: 6, tipo: 'banbury' },
  { nome: 'Injecao', prefixo: 'INJ', quantidade: 24, tipo: 'injetora' },
  { nome: 'Extrusao', prefixo: 'EXT', quantidade: 8, tipo: 'extrusora' },
  { nome: 'Vulcanizacao', prefixo: 'VUL', quantidade: 10, tipo: 'autoclave' },
  { nome: 'Corte', prefixo: 'COR', quantidade: 14, tipo: 'cortadeira' },
  { nome: 'Utilidades', prefixo: 'UTL', quantidade: 6, tipo: 'compressor' },
];

const NOMES_TIPO = {
  prensa: 'Prensa',
  banbury: 'Banbury',
  injetora: 'Injetora',
  extrusora: 'Extrusora',
  autoclave: 'Autoclave',
  cortadeira: 'Cortadeira',
  compressor: 'Compressor',
};

const PERFIS = {
  temperatura: { base: 78, amplitude: 16, unidade: 'C' },
  vibracao: { base: 4.6, amplitude: 3.2, unidade: 'mm/s' },
  corrente: { base: 42, amplitude: 14, unidade: 'A' },
  pressao: { base: 6.2, amplitude: 1.4, unidade: 'bar' },
  rotacao: { base: 1480, amplitude: 240, unidade: 'rpm' },
};

const VARIACOES_LINHA = ['', 'minusculo', 'maiusculo', 'prefixado', 'vazio'];

function variarLinha(nome) {
  const modo = escolher(VARIACOES_LINHA);
  if (modo === 'minusculo') return nome.toLowerCase();
  if (modo === 'maiusculo') return nome.toUpperCase();
  if (modo === 'prefixado') return `Linha de ${nome}`;
  if (modo === 'vazio') return '';
  return nome;
}

function maquinas() {
  const lista = [];
  let sequencial = 1;

  for (const linha of LINHAS) {
    for (let i = 1; i <= linha.quantidade; i++) {
      const numero = String(i).padStart(2, '0');
      lista.push({
        interno: `AT-${String(sequencial).padStart(4, '0')}`,
        codigo: `MC-${linha.prefixo}-${numero}`,
        nome: `${NOMES_TIPO[linha.tipo]} ${numero}`,
        linha: linha.nome,
        tipo: linha.tipo,
        criticidade: inteiro(1, 5),
        instaladoEm: `${inteiro(2014, 2024)}-${String(inteiro(1, 12)).padStart(2, '0')}-${String(inteiro(1, 28)).padStart(2, '0')}`,
      });
      sequencial++;
    }
  }

  return lista;
}

function registrosDeAtivos(base) {
  const registros = [];
  let sequencial = 5000;

  for (const maquina of base) {
    registros.push({
      id: maquina.interno,
      codigo: maquina.codigo,
      nome: maquina.nome,
      linha: variarLinha(maquina.linha),
      criticidade: maquina.criticidade,
      planta: 'Montes Claros',
      instalado_em: maquina.instaladoEm,
    });

    if (chance(0.34)) {
      const formato = escolher(['sublinhado', 'curto', 'espacado']);
      const codigoAlternativo =
        formato === 'sublinhado'
          ? maquina.codigo.toLowerCase().replace(/-/g, '_')
          : formato === 'curto'
            ? maquina.codigo.replace('MC-', '')
            : maquina.codigo.replace(/-/g, ' ');

      registros.push({
        id: `AT-${sequencial++}`,
        tag: codigoAlternativo,
        descricao: `${maquina.nome.toUpperCase()} ${chance(0.5) ? '- ' + maquina.linha.toUpperCase() : ''}`.trim(),
        linha: variarLinha(maquina.linha),
        criticidade: escolher(['alta', 'media', 'baixa', String(maquina.criticidade), maquina.criticidade]),
        planta: escolher(['MOC', 'Montes Claros', 'montes claros', 'MC']),
      });
    }

    if (chance(0.12)) {
      registros.push({
        id: `AT-${sequencial++}`,
        codigo: maquina.codigo,
        nome: null,
        linha: '',
        criticidade: null,
        planta: 'Montes Claros',
        observacao: escolher([
          'cadastro migrado do sistema antigo',
          'conferir com PCM',
          'duplicado?',
          '',
        ]),
      });
    }
  }

  for (let i = 0; i < 9; i++) {
    registros.push({
      id: `AT-${sequencial++}`,
      codigo: `MC-XXX-${String(inteiro(80, 99))}`,
      nome: escolher(['TESTE', 'nao usar', 'ativo teste integracao', 'AAA']),
      linha: escolher(['', 'teste', null]),
      criticidade: 0,
      planta: 'Montes Claros',
    });
  }

  return registros;
}

function registrosDeSensores(base) {
  const registros = [];
  const reais = [];
  let sequencial = 1;

  for (const maquina of base) {
    const tipos = ['temperatura', 'vibracao'];
    if (chance(0.7)) tipos.push('corrente');
    if (maquina.tipo === 'compressor' || chance(0.2)) tipos.push('pressao');
    if (maquina.tipo === 'injetora' && chance(0.4)) tipos.push('rotacao');

    for (const tipo of tipos) {
      const id = `SN-${String(sequencial).padStart(4, '0')}`;
      const codigo = `TR-${1000 + sequencial * 7}-${tipo.slice(0, 4).toUpperCase()}`;
      const fahrenheit = tipo === 'temperatura' && chance(0.14);

      const perfil = PERFIS[tipo];
      reais.push({
        id,
        codigo,
        maquina: maquina.codigo,
        tipo,
        fahrenheit,
        base: perfil.base * entre(0.82, 1.24),
        amplitude: perfil.amplitude * entre(0.7, 1.35),
        degradando: chance(0.1),
      });

      const formaDoCodigo = escolher(['normal', 'normal', 'minusculo', 'sem-traco']);
      const codigoRegistrado =
        formaDoCodigo === 'minusculo'
          ? codigo.toLowerCase()
          : formaDoCodigo === 'sem-traco'
            ? codigo.replace(/-/g, '')
            : codigo;

      const registro = {
        id,
        tipo: escolher([tipo, tipo.toUpperCase(), tipo.slice(0, 4), tipo[0].toUpperCase() + tipo.slice(1)]),
        unidade: fahrenheit
          ? escolher(['F', '°F', 'fahrenheit'])
          : tipo === 'temperatura'
            ? escolher(['C', '°C', 'celsius'])
            : perfil.unidade,
      };

      if (chance(0.55)) {
        registro.codigo = codigoRegistrado;
        registro.ativo = maquina.codigo;
      } else {
        registro.sensor_id = codigoRegistrado;
        registro.ativo_id = maquina.interno;
      }

      if (chance(0.08)) registro.unidade = null;

      registros.push(registro);
      sequencial++;
    }
  }

  for (let i = 0; i < 46; i++) {
    const id = `SN-${String(sequencial++).padStart(4, '0')}`;
    registros.push({
      id,
      codigo: `TR-${inteiro(9000, 9999)}-TEMP`,
      ativo: `MC-${escolher(['ZZZ', 'XXX', 'OLD'])}-${inteiro(10, 99)}`,
      tipo: 'temperatura',
      unidade: escolher(['C', null, '°C']),
    });
  }

  return { registros, reais };
}

function formatarInstante(data, formato) {
  const p = (n) => String(n).padStart(2, '0');

  if (formato === 'iso') return data.toISOString();
  if (formato === 'epoch') return data.getTime();

  if (formato === 'ingenuo') {
    return `${data.getUTCFullYear()}-${p(data.getUTCMonth() + 1)}-${p(data.getUTCDate())} ${p(data.getUTCHours())}:${p(data.getUTCMinutes())}:00`;
  }

  return `${p(data.getUTCDate())}/${p(data.getUTCMonth() + 1)}/${data.getUTCFullYear()} ${p(data.getUTCHours())}:${p(data.getUTCMinutes())}`;
}

function formatarValor(numero) {
  const arredondado = Number(numero.toFixed(2));
  if (chance(0.18)) return String(arredondado).replace('.', ',');
  return arredondado;
}

function gerarLeituras(sensores) {
  fs.mkdirSync(path.join(destino, 'leituras'), { recursive: true });

  let total = 0;
  const codigosInvalidos = ['TR-0000-TEMP', 'sn-9999', 'TR-1234-VIBR', ''];

  for (let dia = DIAS - 1; dia >= 0; dia--) {
    const inicioDoDia = new Date(FIM.getTime() - dia * 24 * 60 * 60 * 1000);
    const nomeDoDia = inicioDoDia.toISOString().slice(0, 10);
    const linhas = [];

    for (const sensor of sensores) {
      const progresso = (DIAS - dia) / DIAS;

      for (let hora = 0; hora < 24; hora++) {
        const instante = new Date(inicioDoDia.getTime() + hora * 60 * 60 * 1000);

        let valor =
          sensor.base +
          Math.sin((hora + dia * 3) / 3.2) * sensor.amplitude * 0.5 +
          (r() - 0.5) * sensor.amplitude * 0.5;

        if (sensor.degradando) valor += sensor.amplitude * progresso * 1.4;
        if (sensor.fahrenheit) valor = valor * 1.8 + 32;

        const defeito = chance(0.014);
        const bruto = defeito ? escolher([-999, 0, 65535, -1]) : valor;

        const formato = escolher(['iso', 'iso', 'iso', 'ingenuo', 'ingenuo', 'brasileiro', 'epoch']);
        const identificador = chance(0.012) ? escolher(codigosInvalidos) : sensor.id;

        if (chance(0.7)) {
          linhas.push(JSON.stringify({ s: identificador, ts: formatarInstante(instante, formato), v: formatarValor(bruto) }));
        } else {
          linhas.push(
            JSON.stringify({
              sensor: identificador,
              timestamp: formatarInstante(instante, formato),
              valor: formatarValor(bruto),
            }),
          );
        }

        if (chance(0.028)) {
          linhas.push(
            JSON.stringify({
              s: sensor.id,
              ts: formatarInstante(instante, 'iso'),
              v: formatarValor(bruto * entre(0.98, 1.02)),
            }),
          );
        }
      }
    }

    fs.writeFileSync(path.join(destino, 'leituras', `${nomeDoDia}.ndjson`), linhas.join('\n') + '\n');
    total += linhas.length;
  }

  return total;
}

const DEFEITOS = [
  'troca de rolamento do mancal LA',
  'vazamento de oleo na unidade hidraulica',
  'alinhamento a laser do conjunto motor bomba',
  'substituicao de resistencia da zona 3',
  'limpeza de trocador de calor',
  'reaperto de barramento',
  'troca de correia',
  'ajuste de pressao de fechamento',
  'inspecao termografica',
  'sensor sem leitura, conferir cabo',
  'ruido anormal na caixa de reducao',
  'calibracao de termopar',
];

const STATUS = ['aberta', 'ABERTA', 'aberto', 'em andamento', 'Em Andamento', 'EM_ANDAMENTO', 'concluida', 'CONCLUIDA', 'Concluída', 'done', 'fechado', '3', 3];

function gerarOrdens(base) {
  const ordens = [];
  let sequencial = 1000;

  for (let i = 0; i < 740; i++) {
    const maquina = escolher(base);
    const abertura = new Date(FIM.getTime() - inteiro(0, 400) * 24 * 60 * 60 * 1000);
    const duracao = inteiro(0, 22);
    const fechamento = new Date(abertura.getTime() + duracao * 24 * 60 * 60 * 1000);
    const status = escolher(STATUS);
    const custo = entre(120, 18000);

    const ordem = {
      id: `OS-${sequencial++}`,
      status,
      tipo: escolher(['corretiva', 'preventiva', 'CORRETIVA', 'preditiva', 'Corretiva']),
      descricao: escolher(DEFEITOS),
      custo: chance(0.4) ? custo.toFixed(2).replace('.', ',') : Number(custo.toFixed(2)),
      responsavel: escolher(['PCM', 'Manutencao Mecanica', 'manutencao eletrica', 'terceiro', '']),
    };

    if (chance(0.5)) {
      ordem.ativo = maquina.codigo;
      ordem.abertura = abertura.toISOString().slice(0, 10);
      ordem.fechamento = duracao > 0 ? fechamento.toISOString().slice(0, 10) : null;
    } else {
      ordem.ativo_id = maquina.interno;
      ordem.aberta_em = formatarInstante(abertura, 'brasileiro');
      ordem.fechada_em = duracao > 0 ? formatarInstante(fechamento, 'brasileiro') : '';
    }

    ordens.push(ordem);

    if (chance(0.07)) {
      ordens.push({ ...ordem, id: `OS-${sequencial++}`, descricao: ordem.descricao.toUpperCase() });
    }
  }

  return ordens;
}

const MENSAGENS_ALARME = [
  'temperatura acima do limite',
  'vibracao acima da faixa ISO 10816',
  'corrente acima do nominal',
  'sem comunicacao com o sensor',
  'pressao abaixo do minimo',
  'variacao brusca de leitura',
];

function gerarAlarmes(sensores) {
  const alarmes = [];
  let sequencial = 80000;

  for (let i = 0; i < 1900; i++) {
    const sensor = escolher(sensores);
    const abertura = new Date(FIM.getTime() - entre(0, DIAS) * 24 * 60 * 60 * 1000);
    const duracaoMin = inteiro(1, 340);
    const fechamento = new Date(abertura.getTime() + duracaoMin * 60 * 1000);
    const invertido = chance(0.03);

    const alarme = {
      id: sequencial++,
      sensor: sensor.id,
      ativo: sensor.maquina,
      severidade: escolher(['alta', 'ALTA', 'media', 'MEDIA', 'baixa', 'critica', 'critical', 'P1', 'P2', '3', '1']),
      mensagem: escolher(MENSAGENS_ALARME),
      aberto: abertura.toISOString(),
      fechado: chance(0.16) ? null : (invertido ? abertura.toISOString() : fechamento.toISOString()),
    };

    if (invertido) alarme.aberto = fechamento.toISOString();

    alarmes.push(alarme);

    if (chance(0.16)) {
      const repeticoes = inteiro(8, 42);
      for (let k = 1; k <= repeticoes; k++) {
        alarmes.push({
          ...alarme,
          id: sequencial++,
          aberto: new Date(abertura.getTime() + k * inteiro(2, 9) * 1000).toISOString(),
        });
      }
    }
  }

  return alarmes;
}

const MOTIVOS_PARADA = [
  'troca de ferramenta',
  'setup de produto',
  'falta de material',
  'manutencao corretiva',
  'MANUTENCAO CORRETIVA',
  'limpeza',
  'falta de energia',
  'parada programada',
  'sem operador',
  '',
];

function gerarParadas(base) {
  const paradas = [];
  let sequencial = 200;

  for (let i = 0; i < 410; i++) {
    const maquina = escolher(base);
    const inicio = new Date(FIM.getTime() - entre(0, DIAS) * 24 * 60 * 60 * 1000);
    const minutos = inteiro(5, 900);
    const fim = new Date(inicio.getTime() + minutos * 60 * 1000);

    paradas.push({
      id: `PD-${String(sequencial++).padStart(4, '0')}`,
      ativo: chance(0.6) ? maquina.codigo : maquina.interno,
      inicio: chance(0.7) ? inicio.toISOString() : formatarInstante(inicio, 'ingenuo'),
      fim: chance(0.05) ? null : chance(0.7) ? fim.toISOString() : formatarInstante(fim, 'ingenuo'),
      motivo: escolher(MOTIVOS_PARADA),
      programada: escolher([true, false, 'sim', 'nao', 0, 1]),
      turno: escolher(['A', 'B', 'C', '', null]),
    });

    if (chance(0.09)) {
      paradas.push({
        id: `PD-${String(sequencial++).padStart(4, '0')}`,
        ativo: maquina.codigo,
        inicio: new Date(inicio.getTime() + inteiro(-20, 20) * 60 * 1000).toISOString(),
        fim: new Date(fim.getTime() + inteiro(-20, 20) * 60 * 1000).toISOString(),
        motivo: escolher(MOTIVOS_PARADA),
        programada: false,
        turno: escolher(['A', 'B', 'C']),
      });
    }
  }

  return paradas;
}

export function gerar() {
  fs.mkdirSync(destino, { recursive: true });

  const base = maquinas();
  const ativos = registrosDeAtivos(base);
  const { registros: sensores, reais } = registrosDeSensores(base);

  fs.writeFileSync(path.join(destino, 'ativos.json'), JSON.stringify(ativos, null, 1));
  fs.writeFileSync(path.join(destino, 'sensores.json'), JSON.stringify(sensores, null, 1));

  const totalLeituras = gerarLeituras(reais);

  const ordens = gerarOrdens(base);
  const alarmes = gerarAlarmes(reais);
  const paradas = gerarParadas(base);

  fs.writeFileSync(path.join(destino, 'ordens.json'), JSON.stringify(ordens, null, 1));
  fs.writeFileSync(path.join(destino, 'alarmes.json'), JSON.stringify(alarmes, null, 1));
  fs.writeFileSync(path.join(destino, 'paradas.json'), JSON.stringify(paradas, null, 1));

  return {
    ativos: ativos.length,
    sensores: sensores.length,
    leituras: totalLeituras,
    ordens: ordens.length,
    alarmes: alarmes.length,
    paradas: paradas.length,
  };
}

export function existeBase() {
  return fs.existsSync(path.join(destino, 'ativos.json'));
}

if (process.argv[1] && process.argv[1].endsWith('gerar-dados.js')) {
  const resumo = gerar();
  console.log('base gerada em server/dados');
  for (const [chave, valor] of Object.entries(resumo)) {
    console.log(`  ${chave}: ${valor.toLocaleString('pt-BR')}`);
  }
}
