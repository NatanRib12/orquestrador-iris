const PERGUNTAS = [
  'Como está a Prensa 01 hoje?',
  'Quais ativos mais pararam nos últimos 30 dias?',
  'Tem algum sensor com leitura suspeita?',
  'Quanto a gente gastou com manutenção corretiva na linha de Injeção?',
  'Qual foi a temperatura média do Banbury 03 no turno da noite?',
  'Qual máquina abriu mais alarme esse mês?',
];

export function Sugestoes({ onEscolher }: { onEscolher: (pergunta: string) => void }) {
  return (
    <div className="sugestoes">
      <h2>O que você quer saber da planta?</h2>
      <p>
        O agente ainda não responde nada. Fazer ele responder, consultando os dados da fábrica sem
        estourar o orçamento de tokens, é o desafio.
      </p>

      <div className="chips">
        {PERGUNTAS.map((pergunta) => (
          <button key={pergunta} className="chip" onClick={() => onEscolher(pergunta)}>
            {pergunta}
          </button>
        ))}
      </div>
    </div>
  );
}
