import React from 'react'
import { useLemmaEdit } from '../context'

/**
 * Componente Anteprima Lemma
 *
 * Specifiche:
 * - Visibile nella sidebar destra durante tutti gli steps
 * - Stile semplificato "backend-friendly" (non replica design frontend)
 * - Statica (nessuna interattività)
 * - Aggiornamento in tempo reale (reagisce ai cambiamenti dello state)
 */
export const AnteprimaLemma: React.FC = () => {
  const { state } = useLemmaEdit()
  const { lemma, varianti, definizioni } = state

  const activeVarianti = varianti.filter((v) => !v._isDeleted)
  const activeDefinizioni = definizioni.filter((d) => !d._isDeleted)

  // Se non c'è ancora un lemma, mostra placeholder
  if (!lemma || !lemma.termine) {
    return (
      <div className="anteprima-placeholder">
        <p>L'anteprima apparirà quando inserirai i dati del lemma</p>
      </div>
    )
  }

  return (
    <div className="anteprima-lemma">
      <h3 className="anteprima-title">📄 Anteprima</h3>

      {/* Termine principale */}
      <div className="anteprima-section">
        <h4 className="termine-principale">
          {lemma.termine}
          {lemma.tipo && <span className="badge-tipo">{lemma.tipo}</span>}
        </h4>
      </div>

      {/* Varianti grafiche */}
      {activeVarianti.length > 0 && (
        <div className="anteprima-section">
          <strong className="section-label">Varianti:</strong>
          <div className="varianti-list-preview">
            {activeVarianti.map((v, idx) => (
              <span key={idx} className="variante-badge">
                {v.termine}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Definizioni */}
      {activeDefinizioni.length > 0 ? (
        <div className="anteprima-section">
          <strong className="section-label">
            Definizioni ({activeDefinizioni.length}):
          </strong>
          {activeDefinizioni.map((def, idx) => {
            const activeRicorrenze = (def.ricorrenze || []).filter((r) => !r._isDeleted)

            return (
              <div key={idx} className="def-preview">
                <div className="def-header">
                  <span className="def-numero">#{def.numero}</span>
                  {def.livello_razionalita && (
                    <span className="livello-badge">Liv. {def.livello_razionalita}</span>
                  )}
                </div>
                <div className="def-testo">
                  {def.testo ? def.testo : <em className="text-muted">Testo non inserito</em>}
                </div>

                {activeRicorrenze.length > 0 && (
                  <div className="ricorrenze-list">
                    <div className="ricorrenze-header">
                      <strong>Ricorrenze ({activeRicorrenze.length}):</strong>
                    </div>
                    {activeRicorrenze.map((ric, ricIdx) => (
                      <div key={ricIdx} className="ric-item">
                        <div className="ric-fonte">
                          📚 {ric.fonte_titolo || `Fonte ID: ${ric.fonte}`}
                          {ric.pagina_raw && <span className="ric-pagina"> - {ric.pagina_raw}</span>}
                        </div>
                        {ric.testo_originale && (
                          <div className="ric-testo">
                            "{ric.testo_originale.substring(0, 100)}
                            {ric.testo_originale.length > 100 ? '...' : ''}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="anteprima-section">
          <em className="empty-text">Nessuna definizione aggiunta</em>
        </div>
      )}

      {/* Footer info */}
      <div className="anteprima-footer">
        <small className="footer-note">
          ℹ️ L'anteprima si aggiorna automaticamente mentre modifichi i campi
        </small>
      </div>
    </div>
  )
}
