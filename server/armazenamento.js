import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(aqui, 'dados');

const cache = new Map();

function lerJson(nome) {
  if (cache.has(nome)) return cache.get(nome);
  const conteudo = JSON.parse(fs.readFileSync(path.join(base, nome), 'utf8'));
  cache.set(nome, conteudo);
  return conteudo;
}

export function ativos() {
  return lerJson('ativos.json');
}

export function sensores() {
  return lerJson('sensores.json');
}

export function ordens() {
  return lerJson('ordens.json');
}

export function alarmes() {
  return lerJson('alarmes.json');
}

export function paradas() {
  return lerJson('paradas.json');
}

export function diasDisponiveis() {
  return fs
    .readdirSync(path.join(base, 'leituras'))
    .filter((arquivo) => arquivo.endsWith('.ndjson'))
    .map((arquivo) => arquivo.replace('.ndjson', ''))
    .sort();
}

export function leiturasDoDia(dia) {
  const chave = `leituras/${dia}`;
  if (cache.has(chave)) return cache.get(chave);

  const arquivo = path.join(base, 'leituras', `${dia}.ndjson`);
  if (!fs.existsSync(arquivo)) return [];

  const linhas = fs
    .readFileSync(arquivo, 'utf8')
    .split('\n')
    .filter((linha) => linha.trim().length > 0)
    .map((linha) => JSON.parse(linha));

  cache.set(chave, linhas);
  return linhas;
}

export function todasAsLeituras() {
  const tudo = [];
  for (const dia of diasDisponiveis()) {
    tudo.push(...leiturasDoDia(dia));
  }
  return tudo;
}

export function leiturasDoSensor(identificador) {
  const encontradas = [];

  for (const dia of diasDisponiveis()) {
    for (const leitura of leiturasDoDia(dia)) {
      const alvo = leitura.s !== undefined ? leitura.s : leitura.sensor;
      if (alvo === identificador) encontradas.push(leitura);
    }
  }

  return encontradas;
}

export function tamanhos() {
  const arquivos = {};
  let total = 0;

  for (const nome of ['ativos.json', 'sensores.json', 'ordens.json', 'alarmes.json', 'paradas.json']) {
    const bytes = fs.statSync(path.join(base, nome)).size;
    arquivos[nome] = bytes;
    total += bytes;
  }

  let bytesDeLeituras = 0;
  let linhasDeLeituras = 0;

  for (const dia of diasDisponiveis()) {
    const arquivo = path.join(base, 'leituras', `${dia}.ndjson`);
    bytesDeLeituras += fs.statSync(arquivo).size;
  }

  for (const dia of diasDisponiveis()) {
    linhasDeLeituras += leiturasDoDia(dia).length;
  }

  arquivos['leituras/*.ndjson'] = bytesDeLeituras;
  total += bytesDeLeituras;

  return {
    arquivos,
    totalBytes: total,
    contagens: {
      ativos: ativos().length,
      sensores: sensores().length,
      leituras: linhasDeLeituras,
      ordens: ordens().length,
      alarmes: alarmes().length,
      paradas: paradas().length,
    },
    dias: diasDisponiveis().length,
  };
}
