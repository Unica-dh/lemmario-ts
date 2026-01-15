import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { LemmaEditProvider, useLemmaEdit } from './context'
import { useSync } from './hooks'
import { StepTabs } from './components'
import { BaseStep, VariantiStep, DefinizioniStep, RiferimentiStep } from './steps'

/**
 * LemmaEditView - Custom Edit View per Collection Lemmi
 * 
 * Form multi-step unificato che permette di gestire:
 * - Dati base lemma
 * - Varianti grafiche
 * - Definizioni con ricorrenze
 * - Riferimenti incrociati
 */

const LemmaEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()
  const { state, dispatch } = useLemmaEdit()
  const { loadLemma, saveAll, isLoading, isSaving, error } = useSync()

  const { lemma, isDirty, currentStep } = state

  // Carica lemma all'avvio
  useEffect(() => {
    if (id && id !== 'create') {
      loadLemma(id).catch((err) => {
        console.error('Errore caricamento lemma:', err)
        alert('Errore nel caricamento del lemma')
      })
    }
  }, [id])

  // Warning prima di lasciare la pagina con modifiche non salvate
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleSave = async () => {
    if (!isDirty) {
      alert('Nessuna modifica da salvare')
      return
    }

    try {
      await saveAll()
      alert('✅ Lemma salvato con successo!')
    } catch (err: any) {
      console.error('Errore salvataggio:', err)
      alert(`❌ Errore nel salvataggio: ${err.message}`)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirm = window.confirm(
        'Hai modifiche non salvate. Vuoi davvero annullare?'
      )
      if (!confirm) return
    }
    history.push('/admin/collections/lemmi')
  }

  const steps = [
    { id: 1, label: 'Dati Base', component: <BaseStep /> },
    { id: 2, label: 'Varianti Grafiche', component: <VariantiStep /> },
    { id: 3, label: 'Definizioni', component: <DefinizioniStep /> },
    { id: 4, label: 'Riferimenti', component: <RiferimentiStep /> },
  ]

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Caricamento lemma...</p>
      </div>
    )
  }

  if (!lemma && id !== 'create') {
    return (
      <div className="error-container">
        <h2>Lemma non trovato</h2>
        <button onClick={handleCancel}>← Torna alla lista</button>
      </div>
    )
  }

  return (
    <div className="lemma-edit-view">
      {/* Header */}
      <header className="edit-header">
        <div className="header-left">
          <h1>
            {lemma?.id ? `Modifica Lemma: ${lemma.termine}` : 'Nuovo Lemma'}
          </h1>
          <span className={`status-badge ${isDirty ? 'unsaved' : 'saved'}`}>
            {isDirty ? '⚠️ Non salvato' : '✅ Salvato'}
          </span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annulla
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Salvataggio...' : '💾 Salva Tutto'}
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <strong>❌ Errore:</strong> {error}
        </div>
      )}

      {/* Multi-step form */}
      <div className="edit-content">
        <StepTabs steps={steps} />
      </div>

      {/* Footer */}
      <footer className="edit-footer">
        <div className="footer-info">
          <p>
            Step {currentStep} di {steps.length} •{' '}
            {isDirty ? 'Modifiche non salvate' : 'Tutto salvato'}
          </p>
        </div>
        <div className="footer-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-prev"
              onClick={() =>
                dispatch({ type: 'SET_STEP', payload: currentStep - 1 })
              }
            >
              ← Precedente
            </button>
          )}
          {currentStep < steps.length && (
            <button
              type="button"
              className="btn-next"
              onClick={() =>
                dispatch({ type: 'SET_STEP', payload: currentStep + 1 })
              }
            >
              Successivo →
            </button>
          )}
          {currentStep === steps.length && (
            <button
              type="button"
              className="btn-save-final"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? 'Salvataggio...' : '✅ Salva e Completa'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

// Wrapper con Provider
export const LemmaEditView: React.FC = () => {
  return (
    <LemmaEditProvider>
      <LemmaEditContent />
    </LemmaEditProvider>
  )
}

export default LemmaEditView
