import React, { useState } from 'react'
import { useLemmaEdit } from '../context'
import type { Variante } from '../context'

/**
 * Step 2: Varianti Grafiche
 */

export const VariantiStep: React.FC = () => {
  const { state, dispatch } = useLemmaEdit()
  const { varianti } = state

  const [newVariante, setNewVariante] = useState('')

  // Filtra varianti non eliminate
  const activeVarianti = varianti.filter((v) => !v._isDeleted)

  const handleAddVariante = () => {
    if (!newVariante.trim()) return

    const variante: Variante = {
      termine: newVariante.trim(),
      ordine: activeVarianti.length + 1,
      _isNew: true,
    }

    dispatch({ type: 'ADD_VARIANTE', payload: variante })
    setNewVariante('')
  }

  const handleDeleteVariante = (index: number) => {
    if (window.confirm('Eliminare questa variante grafica?')) {
      dispatch({ type: 'DELETE_VARIANTE', index })
    }
  }

  const handleUpdateVariante = (index: number, field: keyof Variante, value: any) => {
    const updated = { ...varianti[index], [field]: value }
    dispatch({ type: 'UPDATE_VARIANTE', index, payload: updated })
  }

  return (
    <div className="varianti-step">
      <h2>Varianti Grafiche</h2>
      <p className="description">
        Aggiungi varianti ortografiche del lemma (es. "abattere", "abbattire" per "abbattere")
      </p>

      {/* Lista varianti esistenti */}
      {activeVarianti.length > 0 && (
        <div className="varianti-list">
          {activeVarianti.map((variante, idx) => (
            <div key={idx} className="variante-item">
              <div className="variante-input">
                <input
                  type="text"
                  value={variante.termine}
                  onChange={(e) =>
                    handleUpdateVariante(
                      varianti.indexOf(variante),
                      'termine',
                      e.target.value
                    )
                  }
                  placeholder="Termine variante"
                />
              </div>
              <div className="variante-note">
                <input
                  type="text"
                  value={variante.note || ''}
                  onChange={(e) =>
                    handleUpdateVariante(
                      varianti.indexOf(variante),
                      'note',
                      e.target.value
                    )
                  }
                  placeholder="Note (opzionale)"
                />
              </div>
              <button
                type="button"
                className="btn-delete"
                onClick={() => handleDeleteVariante(varianti.indexOf(variante))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form per nuova variante */}
      <div className="add-variante-form">
        <input
          type="text"
          value={newVariante}
          onChange={(e) => setNewVariante(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddVariante()
            }
          }}
          placeholder="Nuova variante grafica..."
        />
        <button type="button" className="btn-add" onClick={handleAddVariante}>
          + Aggiungi Variante
        </button>
      </div>

      {activeVarianti.length === 0 && (
        <p className="empty-state">Nessuna variante grafica aggiunta</p>
      )}
    </div>
  )
}
