import 'dotenv/config';
import express from 'express';
import * as dados from './armazenamento.js';
import { gerar, existeBase } from './gerar-dados.js';
import { orquestrarResposta } from './servicos/orquestrador.js';

const app = express();
const PORTA = Number(process.env.PORT || 3001);

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const bytes = res.getHeader('content-length') || 0;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - inicio}ms ${Number(bytes).toLocaleString('pt-BR')} bytes`,
    );
  });
  next();
});

app.get('/api/estatisticas', (req, res) => {
  res.json(dados.tamanhos());
});

app.get('/api/ativos', (req, res) => {
  res.json(dados.ativos());
});

app.get('/api/sensores', (req, res) => {
  res.json(dados.sensores());
});

app.get('/api/ordens', (req, res) => {
  res.json(dados.ordens());
});

app.get('/api/alarmes', (req, res) => {
  res.json(dados.alarmes());
});

app.get('/api/paradas', (req, res) => {
  res.json(dados.paradas());
});

app.get('/api/dias', (req, res) => {
  res.json(dados.diasDisponiveis());
});

app.get('/api/leituras', (req, res) => {
  const { sensor, dia } = req.query;

  if (sensor) {
    return res.json(dados.leiturasDoSensor(String(sensor)));
  }

  if (dia) {
    return res.json(dados.leiturasDoDia(String(dia)));
  }

  res.json(dados.todasAsLeituras());
});

app.get('/api/tudo', (req, res) => {
  res.json({
    ativos: dados.ativos(),
    sensores: dados.sensores(),
    ordens: dados.ordens(),
    alarmes: dados.alarmes(),
    paradas: dados.paradas(),
  });
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { mensagem, mensagens } = req.body;

    let textoUsuario = mensagem;

    if (!textoUsuario && Array.isArray(mensagens) && mensagens.length > 0) {
      const ultima = mensagens[mensagens.length - 1];
      textoUsuario = typeof ultima === 'string' 
        ? ultima 
        : (ultima.conteudo || ultima.content || ultima.texto || ultima.mensagem);
    }

    if (!textoUsuario) {
      return res.status(400).json({ erro: 'A mensagem do usuário é obrigatória.' });
    }

    const resultado = await orquestrarResposta(textoUsuario);

    return res.json(resultado);
  } catch (erro) {
    next(erro);
  }
});

app.use((erro, req, res, next) => {
  console.error(erro);
  if (res.headersSent) return next(erro);
  res.status(500).json({ erro: 'erro interno', detalhe: erro.message });
});

if (!existeBase()) {
  console.log('gerando a base de dados, isso leva alguns segundos...');
  const resumo = gerar();
  console.log('base pronta:', JSON.stringify(resumo));
}

app.listen(PORTA, () => {
  const t = dados.tamanhos();
  console.log(`API do orquestrador em http://localhost:${PORTA}`);
  console.log(
    `base: ${t.contagens.leituras.toLocaleString('pt-BR')} leituras, ${t.contagens.alarmes.toLocaleString('pt-BR')} alarmes, ${(t.totalBytes / 1024 / 1024).toFixed(1)} MB em disco`,
  );
});
