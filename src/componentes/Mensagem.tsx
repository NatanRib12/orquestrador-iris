import type { Mensagem as TipoMensagem } from '../api';

export function Mensagem({ mensagem }: { mensagem: TipoMensagem }) {
  return (
    <div className={mensagem.papel === 'agente' ? 'mensagem agente' : 'mensagem usuario'}>
      <span className="autor">{mensagem.papel === 'agente' ? 'IRIS' : 'você'}</span>
      <p>{mensagem.texto}</p>

      {mensagem.papel === 'agente' && (mensagem.procedencia || mensagem.tokensConsumidos) && (
        <div 
          className="metadados-resposta"
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '0.75rem',
            color: '#a0aec0',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {mensagem.procedencia && (
            <div>
               <strong>Procedência:</strong> Ativo(s): {mensagem.procedencia.ativos.join(', ')} | {mensagem.procedencia.detalheRegistros} ({mensagem.procedencia.totalRegistros} registros)
            </div>
          )}
          {mensagem.tokensConsumidos && (
            <div>
               <strong>Consumo de Tokens:</strong> {mensagem.tokensConsumidos.total.toLocaleString('pt-BR')} tokens (Prompt: {mensagem.tokensConsumidos.prompt.toLocaleString('pt-BR')} | Resposta: {mensagem.tokensConsumidos.resposta.toLocaleString('pt-BR')})
            </div>
          )}
        </div>
      )}
    </div>
  );
}