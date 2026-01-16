import React from 'react'
import { useLemmaEdit } from '../context'

/**
 * Step 1: Dati Base del Lemma
 */

export const BaseStep: React.FC = () => {
  const { state, dispatch } = useLemmaEdit()
  const { lemma } = state

  if (!lemma) {
    return <div>Caricamento...</div>
  }

  const handleFieldChange = (field: string, value: any) => {
    dispatch({
      type: 'UPDATE_LEMMA_FIELD',
      field: field as any,
      value,
    })
  }

  return (
    <div className="base-step">
      <h2>Dati Base del Lemma</h2>

      <div className="form-group">
        <label htmlFor="termine">
          Termine <span className="required">*</span>
        </label>
        <input
          type="text"
          id="termine"
          value={lemma.termine || ''}
          onChange={(e) => handleFieldChange('termine', e.target.value)}
          placeholder="Es. Abbattere, ADDITIO, camera"
          required
        />
        <small>Termine principale del lemma</small>
      </div>

      <div className="form-group">
        <label htmlFor="tipo">
          Tipo <span className="required">*</span>
        </label>
        <select
          id="tipo"
          value={lemma.tipo || 'volgare'}
          onChange={(e) => handleFieldChange('tipo', e.target.value)}
          required
        >
          <option value="volgare">Volgare (Italiano)</option>
          <option value="latino">Latino</option>
        </select>
        <small>Tipologia linguistica del termine</small>
      </div>

      <div className="form-group">
        <label htmlFor="slug">Slug URL</label>
        <input
          type="text"
          id="slug"
          value={lemma.slug || ''}
          onChange={(e) => handleFieldChange('slug', e.target.value)}
          placeholder="abbattere (auto-generato se vuoto)"
        />
        <small>URL-friendly identifier (es. "abbattere", "additio-lat")</small>
      </div>

      <div className="form-group">
        <label htmlFor="ordinamento">Chiave di Ordinamento</label>
        <input
          type="text"
          id="ordinamento"
          value={lemma.ordinamento || ''}
          onChange={(e) => handleFieldChange('ordinamento', e.target.value)}
          placeholder="abbattere (auto-generato se vuoto)"
        />
        <small>Usato per ordinamento alfabetico personalizzato</small>
      </div>

      <div className="form-group">
        <label htmlFor="note_redazionali">Note Redazionali</label>
        <textarea
          id="note_redazionali"
          value={lemma.note_redazionali || ''}
          onChange={(e) => handleFieldChange('note_redazionali', e.target.value)}
          rows={4}
          placeholder="Note interne (non visibili pubblicamente)"
        />
        <small>Note per i redattori, non pubblicate</small>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={lemma.pubblicato || false}
            onChange={(e) => handleFieldChange('pubblicato', e.target.checked)}
          />
          <span>Pubblicato (visibile al pubblico)</span>
        </label>
      </div>
    </div>
  )
}
