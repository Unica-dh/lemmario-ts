import React, { useState, useEffect } from 'react'
import { useLemmaEdit } from '../context'
import type { Riferimento } from '../context'

/**
 * Step 4: Riferimenti Incrociati
 */

export const RiferimentiStep: React.FC = () => {
  const { state, dispatch } = useLemmaEdit()
  const { riferimenti, lemma } = state

  const [lemmi, setLemmi] = useState<any[]>([])
  const [loadingLemmi, setLoadingLemmi] = useState(true)

  // Carica lista lemmi per dropdown
  useEffect(() => {
    const loadLemmi = async () => {
      try {
        const res = await fetch('/api/lemmi?limit=1000&sort=termine')
        const data = await res.json()
        // Escludi il lemma corrente
        setLemmi((data.docs || []).filter((l: any) => l.id !== lemma?.id))
        setLoadingLemmi(false)
      } catch (error) {
        console.error('Errore caricamento lemmi:', error)
        setLoadingLemmi(false)
      }
    }

    loadLemmi()
  }, [lemma?.id])

  const activeRiferimenti = riferimenti.filter((r) => !r._isDeleted)

  const handleAddRiferimento = () => {
    const nuovoRif: Riferimento = {
      lemma_destinazione: '',
      tipo_riferimento: 'VEDI ANCHE',
      note: '',
      _isNew: true,
    }
    dispatch({ type: 'ADD_RIFERIMENTO', payload: nuovoRif })
  }

  const handleDeleteRiferimento = (index: number) => {
    if (window.confirm('Eliminare questo riferimento? (Verrà eliminato anche il riferimento inverso)')) {
      dispatch({ type: 'DELETE_RIFERIMENTO', index })
    }
  }

  const handleUpdateRiferimento = (index: number, field: keyof Riferimento, value: any) => {
    const updated = { ...riferimenti[index], [field]: value }
    dispatch({ type: 'UPDATE_RIFERIMENTO', index, payload: updated })
  }

  if (loadingLemmi) {
    return <div>Caricamento lemmi...</div>
  }

  return (
    <div className="riferimenti-step">
      <h2>Riferimenti Incrociati</h2>
      <p className="description">
        Collega questo lemma ad altri lemmi correlati. I riferimenti inversi vengono creati automaticamente.
      </p>

      {/* Lista riferimenti esistenti */}
      {activeRiferimenti.length > 0 && (
        <div className="riferimenti-list">
          {activeRiferimenti.map((rif, _idx) => {
            const realIndex = riferimenti.indexOf(rif)

            return (
              <div key={realIndex} className="riferimento-item">
                <div className="rif-row">
                  <div className="rif-field">
                    <label>Tipo Riferimento</label>
                    <select
                      value={rif.tipo_riferimento}
                      onChange={(e) =>
                        handleUpdateRiferimento(realIndex, 'tipo_riferimento', e.target.value)
                      }
                    >
                      <option value="VEDI">VEDI</option>
                      <option value="VEDI ANCHE">VEDI ANCHE</option>
                      <option value="CFR">CFR (Confronta)</option>
                      <option value="SINONIMO">Sinonimo</option>
                      <option value="CONTRARIO">Contrario</option>
                      <option value="CORRELATO">Correlato</option>
                    </select>
                  </div>

                  <div className="rif-field">
                    <label>Lemma Destinazione *</label>
                    <select
                      value={rif.lemma_destinazione}
                      onChange={(e) =>
                        handleUpdateRiferimento(realIndex, 'lemma_destinazione', e.target.value)
                      }
                    >
                      <option value="">Seleziona lemma...</option>
                      {lemmi.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.termine} ({l.tipo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rif-row">
                  <div className="rif-field full-width">
                    <label>Note</label>
                    <input
                      type="text"
                      value={rif.note || ''}
                      onChange={(e) =>
                        handleUpdateRiferimento(realIndex, 'note', e.target.value)
                      }
                      placeholder="Note aggiuntive sul riferimento..."
                    />
                  </div>
                </div>

                <div className="rif-actions">
                  {rif.auto_creato && (
                    <span className="badge-auto">Auto-creato (bidirezionale)</span>
                  )}
                  <button
                    type="button"
                    className="btn-delete-rif"
                    onClick={() => handleDeleteRiferimento(realIndex)}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottone aggiungi riferimento */}
      <button type="button" className="btn-add-rif" onClick={handleAddRiferimento}>
        + Aggiungi Riferimento
      </button>

      {activeRiferimenti.length === 0 && (
        <p className="empty-state">Nessun riferimento incrociato aggiunto</p>
      )}

      <div className="info-box">
        <strong>ℹ️ Nota:</strong> Quando crei un riferimento A → B, il sistema creerà automaticamente
        anche il riferimento inverso B → A grazie all'hook di bidirezionalità.
      </div>
    </div>
  )
}
