import React, { createContext, useContext, useReducer, ReactNode } from 'react'

/**
 * LemmaEditContext
 * 
 * Context manager per il form multi-step di editing lemma.
 * Mantiene lo stato condiviso tra tutti gli step (Base, Varianti, Definizioni, Riferimenti).
 */

// Types
export interface Definizione {
  id?: string | number
  numero: number
  testo: string
  ricorrenze?: Ricorrenza[]
  _isNew?: boolean
  _isDeleted?: boolean
}

export interface Ricorrenza {
  id?: string | number
  fonte: string | number
  testo_originale: string
  pagina?: string
  livello_razionalita?: string | number
  note?: string
  _isNew?: boolean
  _isDeleted?: boolean
}

export interface Variante {
  id?: string | number
  termine: string
  ordine?: number
  note?: string
  _isNew?: boolean
  _isDeleted?: boolean
}

export interface Riferimento {
  id?: string | number
  lemma_destinazione: string | number
  tipo_riferimento: string
  note?: string
  auto_creato?: boolean
  _isNew?: boolean
  _isDeleted?: boolean
}

export interface LemmaData {
  id?: string | number
  lemmario: string | number
  termine: string
  tipo: 'latino' | 'volgare'
  slug?: string
  ordinamento?: string
  note_redazionali?: string
  pubblicato?: boolean
  data_pubblicazione?: string
}

export interface LemmaEditState {
  lemma: LemmaData | null
  definizioni: Definizione[]
  varianti: Variante[]
  riferimenti: Riferimento[]
  currentStep: number
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

const initialState: LemmaEditState = {
  lemma: null,
  definizioni: [],
  varianti: [],
  riferimenti: [],
  currentStep: 1,
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,
}

// Actions
type LemmaEditAction =
  | { type: 'SET_LEMMA'; payload: LemmaData }
  | { type: 'UPDATE_LEMMA_FIELD'; field: keyof LemmaData; value: any }
  | { type: 'SET_DEFINIZIONI'; payload: Definizione[] }
  | { type: 'ADD_DEFINIZIONE'; payload: Definizione }
  | { type: 'UPDATE_DEFINIZIONE'; index: number; payload: Definizione }
  | { type: 'DELETE_DEFINIZIONE'; index: number }
  | { type: 'ADD_RICORRENZA'; defIndex: number; payload: Ricorrenza }
  | { type: 'UPDATE_RICORRENZA'; defIndex: number; ricIndex: number; payload: Ricorrenza }
  | { type: 'DELETE_RICORRENZA'; defIndex: number; ricIndex: number }
  | { type: 'SET_VARIANTI'; payload: Variante[] }
  | { type: 'ADD_VARIANTE'; payload: Variante }
  | { type: 'UPDATE_VARIANTE'; index: number; payload: Variante }
  | { type: 'DELETE_VARIANTE'; index: number }
  | { type: 'SET_RIFERIMENTI'; payload: Riferimento[] }
  | { type: 'ADD_RIFERIMENTO'; payload: Riferimento }
  | { type: 'UPDATE_RIFERIMENTO'; index: number; payload: Riferimento }
  | { type: 'DELETE_RIFERIMENTO'; index: number }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

// Reducer
export const lemmaEditReducer = (
  state: LemmaEditState,
  action: LemmaEditAction
): LemmaEditState => {
  switch (action.type) {
    case 'SET_LEMMA':
      return { ...state, lemma: action.payload, isDirty: false }

    case 'UPDATE_LEMMA_FIELD':
      return {
        ...state,
        lemma: state.lemma
          ? { ...state.lemma, [action.field]: action.value }
          : null,
        isDirty: true,
      }

    case 'SET_DEFINIZIONI':
      return { ...state, definizioni: action.payload }

    case 'ADD_DEFINIZIONE':
      return {
        ...state,
        definizioni: [...state.definizioni, action.payload],
        isDirty: true,
      }

    case 'UPDATE_DEFINIZIONE':
      return {
        ...state,
        definizioni: state.definizioni.map((def, idx) =>
          idx === action.index ? action.payload : def
        ),
        isDirty: true,
      }

    case 'DELETE_DEFINIZIONE':
      return {
        ...state,
        definizioni: state.definizioni.map((def, idx) =>
          idx === action.index ? { ...def, _isDeleted: true } : def
        ),
        isDirty: true,
      }

    case 'ADD_RICORRENZA':
      return {
        ...state,
        definizioni: state.definizioni.map((def, idx) =>
          idx === action.defIndex
            ? {
                ...def,
                ricorrenze: [...(def.ricorrenze || []), action.payload],
              }
            : def
        ),
        isDirty: true,
      }

    case 'UPDATE_RICORRENZA':
      return {
        ...state,
        definizioni: state.definizioni.map((def, defIdx) =>
          defIdx === action.defIndex
            ? {
                ...def,
                ricorrenze: (def.ricorrenze || []).map((ric, ricIdx) =>
                  ricIdx === action.ricIndex ? action.payload : ric
                ),
              }
            : def
        ),
        isDirty: true,
      }

    case 'DELETE_RICORRENZA':
      return {
        ...state,
        definizioni: state.definizioni.map((def, defIdx) =>
          defIdx === action.defIndex
            ? {
                ...def,
                ricorrenze: (def.ricorrenze || []).map((ric, ricIdx) =>
                  ricIdx === action.ricIndex ? { ...ric, _isDeleted: true } : ric
                ),
              }
            : def
        ),
        isDirty: true,
      }

    case 'SET_VARIANTI':
      return { ...state, varianti: action.payload }

    case 'ADD_VARIANTE':
      return {
        ...state,
        varianti: [...state.varianti, action.payload],
        isDirty: true,
      }

    case 'UPDATE_VARIANTE':
      return {
        ...state,
        varianti: state.varianti.map((v, idx) =>
          idx === action.index ? action.payload : v
        ),
        isDirty: true,
      }

    case 'DELETE_VARIANTE':
      return {
        ...state,
        varianti: state.varianti.map((v, idx) =>
          idx === action.index ? { ...v, _isDeleted: true } : v
        ),
        isDirty: true,
      }

    case 'SET_RIFERIMENTI':
      return { ...state, riferimenti: action.payload }

    case 'ADD_RIFERIMENTO':
      return {
        ...state,
        riferimenti: [...state.riferimenti, action.payload],
        isDirty: true,
      }

    case 'UPDATE_RIFERIMENTO':
      return {
        ...state,
        riferimenti: state.riferimenti.map((r, idx) =>
          idx === action.index ? action.payload : r
        ),
        isDirty: true,
      }

    case 'DELETE_RIFERIMENTO':
      return {
        ...state,
        riferimenti: state.riferimenti.map((r, idx) =>
          idx === action.index ? { ...r, _isDeleted: true } : r
        ),
        isDirty: true,
      }

    case 'SET_STEP':
      return { ...state, currentStep: action.payload }

    case 'MARK_DIRTY':
      return { ...state, isDirty: true }

    case 'MARK_CLEAN':
      return { ...state, isDirty: false }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// Context
interface LemmaEditContextValue {
  state: LemmaEditState
  dispatch: React.Dispatch<LemmaEditAction>
}

const LemmaEditContext = createContext<LemmaEditContextValue | undefined>(undefined)

// Provider
export const LemmaEditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(lemmaEditReducer, initialState)

  return (
    <LemmaEditContext.Provider value={{ state, dispatch }}>
      {children}
    </LemmaEditContext.Provider>
  )
}

// Hook
export const useLemmaEdit = () => {
  const context = useContext(LemmaEditContext)
  if (!context) {
    throw new Error('useLemmaEdit must be used within LemmaEditProvider')
  }
  return context
}
