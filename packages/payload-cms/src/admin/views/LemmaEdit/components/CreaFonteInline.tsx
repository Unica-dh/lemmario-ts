import React, { useState } from 'react'

interface CreaFonteInlineProps {
  onFonteCreated?: (fonteId: string | number) => void
}

/**
 * Panel espandibile inline per creare rapidamente una nuova Fonte
 *
 * Specifiche:
 * - Campi obbligatori: titolo, riferimento_completo
 * - shorthand_id viene generato automaticamente dal backend
 * - Dopo la creazione il panel rimane aperto per crearne un'altra
 * - UI: Panel espandibile inline (non modal)
 */
export const CreaFonteInline: React.FC<CreaFonteInlineProps> = ({ onFonteCreated }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [titolo, setTitolo] = useState('')
  const [riferimentoCompleto, setRiferimentoCompleto] = useState('')
  const [autore, setAutore] = useState('')
  const [anno, setAnno] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validazione
    if (!titolo.trim()) {
      setError('Il campo Titolo è obbligatorio')
      return
    }
    if (!riferimentoCompleto.trim()) {
      setError('Il campo Riferimento Completo è obbligatorio')
      return
    }

    setSaving(true)

    try {
      // Genera automaticamente shorthand_id da titolo
      const shorthandId = titolo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 50) // Limita lunghezza

      const fonteData = {
        shorthand_id: shorthandId,
        titolo: titolo.trim(),
        riferimento_completo: riferimentoCompleto.trim(),
        autore: autore.trim() || undefined,
        anno: anno.trim() || undefined,
      }

      const response = await fetch('/api/fonti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fonteData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Errore durante la creazione della fonte')
      }

      const result = await response.json()
      setSuccessMessage(`✓ Fonte "${titolo}" creata con successo!`)

      // Notifica il parent component
      if (onFonteCreated && result.doc?.id) {
        onFonteCreated(result.doc.id)
      }

      // Reset form ma mantieni panel aperto
      setTitolo('')
      setRiferimentoCompleto('')
      setAutore('')
      setAnno('')

      // Nascondi messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione della fonte')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setTitolo('')
    setRiferimentoCompleto('')
    setAutore('')
    setAnno('')
    setError('')
    setSuccessMessage('')
  }

  return (
    <div className="crea-fonte-inline">
      <button
        type="button"
        className="btn-toggle-panel"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '▼' : '▶'} {isOpen ? 'Nascondi' : 'Crea nuova fonte'}
      </button>

      {isOpen && (
        <div className="fonte-panel">
          <h4>Crea Nuova Fonte</h4>

          {error && <div className="panel-error">{error}</div>}
          {successMessage && <div className="panel-success">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="titolo">
                Titolo <span className="required">*</span>
              </label>
              <input
                type="text"
                id="titolo"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="es. Statuto dell'Arte dei fornai..."
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="riferimento_completo">
                Riferimento Completo <span className="required">*</span>
              </label>
              <textarea
                id="riferimento_completo"
                value={riferimentoCompleto}
                onChange={(e) => setRiferimentoCompleto(e.target.value)}
                placeholder="es. Statuti dell'Arte dei fornai e dei vinattieri di Firenze (1337-1339), a cura di F. Morandini..."
                rows={3}
                disabled={saving}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="autore">Autore</label>
                <input
                  type="text"
                  id="autore"
                  value={autore}
                  onChange={(e) => setAutore(e.target.value)}
                  placeholder="es. F. Morandini"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="anno">Anno</label>
                <input
                  type="text"
                  id="anno"
                  value={anno}
                  onChange={(e) => setAnno(e.target.value)}
                  placeholder="es. 1337-1339"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-submit"
                disabled={saving}
              >
                {saving ? 'Creazione...' : 'Crea Fonte'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={saving}
              >
                Annulla
              </button>
            </div>
          </form>

          <p className="help-text">
            <small>
              Il campo <em>shorthand_id</em> verrà generato automaticamente dal titolo
            </small>
          </p>
        </div>
      )}
    </div>
  )
}
