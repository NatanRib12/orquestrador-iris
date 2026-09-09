import type { Mensagem as TipoMensagem } from '../api';

export function Mensagem({ mensagem }: { mensagem: TipoMensagem }) {
  return (
    <div className={mensagem.papel === 'agente' ? 'mensagem agente' : 'mensagem usuario'}>
      <span className="autor">{mensagem.papel === 'agente' ? 'IRIS' : 'você'}</span>
      <p>{mensagem.texto}</p>
    </div>
  );
}
