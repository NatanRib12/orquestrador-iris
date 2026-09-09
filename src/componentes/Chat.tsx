import { useRef, useState } from 'react';
import { conversar, type Mensagem as TipoMensagem } from '../api';
import { Mensagem } from './Mensagem';
import { Sugestoes } from './Sugestoes';

export function Chat() {
  const [mensagens, setMensagens] = useState<TipoMensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  async function enviar(pergunta: string) {
    const limpa = pergunta.trim();
    if (limpa === '' || carregando) return;

    const historico: TipoMensagem[] = [...mensagens, { papel: 'usuario', texto: limpa }];

    setMensagens(historico);
    setTexto('');
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await conversar(historico);

      if (resposta.erro) {
        setErro(resposta.detalhe ? `${resposta.erro}: ${resposta.detalhe}` : resposta.erro);
      } else {
        setMensagens([...historico, { papel: 'agente', texto: resposta.texto || '' }]);
      }
    } catch (falha: any) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
      requestAnimationFrame(() => fim.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  return (
    <main className="chat">
      <div className="conversa">
        {mensagens.length === 0 && !carregando && <Sugestoes onEscolher={enviar} />}

        {mensagens.map((mensagem, indice) => (
          <Mensagem key={indice} mensagem={mensagem} />
        ))}

        {carregando && (
          <div className="pensando">
            <span className="bolinha" />
            <span className="bolinha" />
            <span className="bolinha" />
          </div>
        )}

        {erro && (
          <div className="erro">
            <strong>A rota /api/chat respondeu com erro</strong>
            <span>{erro}</span>
          </div>
        )}

        <div ref={fim} />
      </div>

      <div className="envio">
        <input
          className="entrada"
          placeholder="pergunte sobre os ativos da planta"
          value={texto}
          disabled={carregando}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') enviar(texto);
          }}
        />
        <button className="botao" disabled={carregando} onClick={() => enviar(texto)}>
          enviar
        </button>
      </div>
    </main>
  );
}
