import { useEffect, useState } from 'react';
import { estatisticas } from '../api';

export function Cabecalho() {
  const [base, setBase] = useState<any>(null);

  useEffect(() => {
    estatisticas()
      .then(setBase)
      .catch(() => setBase(null));
  }, []);

  return (
    <header className="cabecalho">
      <div className="marca">
        <span className="ponto" />
        <h1>IRIS Orquestrador</h1>
        <span className="unidade">Montes Claros</span>
      </div>

      {base && (
        <div className="base">
          <span>{base.contagens.ativos} ativos</span>
          <span>{base.contagens.sensores} sensores</span>
          <span>{base.contagens.leituras.toLocaleString('pt-BR')} leituras</span>
          <span>{base.contagens.alarmes.toLocaleString('pt-BR')} alarmes</span>
          <span>{(base.totalBytes / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      )}
    </header>
  );
}
