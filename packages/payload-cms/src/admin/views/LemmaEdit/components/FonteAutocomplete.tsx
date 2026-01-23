import React, { useState, useEffect, useRef } from 'react'

interface Fonte {
  id: string | number
  titolo: string
  shorthand_id?: string
  autore?: string
  anno?: string
}

interface FonteAutocompleteProps {
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
}

/**
 * Componente Autocomplete per selezione Fonte
 *
 * Specifiche:
 * - Ricerca su tutti i campi (titolo, shorthand_id, autore, anno, riferimento_completo)
 * - Visualizza solo titolo nei risultati
 * - Minimo 2 caratteri per avviare ricerca
 * - Massimo 15 risultati
 * - Debounce 300ms per ottimizzare chiamate API
 */
export const FonteAutocomplete: React.FC<FonteAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Cerca fonte...',
}) => {
  const [searchText, setSearchText] = useState('')
  const [results, setResults] = useState<Fonte[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFonte, setSelectedFonte] = useState<Fonte | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Carica la fonte selezionata quando value cambia
  useEffect(() => {
    if (value && !selectedFonte) {
      fetch(`/api/fonti/${value}`)
        .then((res) => res.json())
        .then((data) => {
          setSelectedFonte(data)
          setSearchText(data.titolo || '')
        })
        .catch((err) => console.error('Errore caricamento fonte:', err))
    }
  }, [value, selectedFonte])

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Ricerca con debounce
  useEffect(() => {
    if (searchText.length < 2) {
      setResults([])
      setIsOpen(false)
      return undefined
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Costruisci query Payload per ricerca su tutti i campi
        const query = encodeURIComponent(searchText)
        const url = `/api/fonti?limit=15&where[or][0][titolo][contains]=${query}&where[or][1][shorthand_id][contains]=${query}&where[or][2][autore][contains]=${query}&where[or][3][anno][contains]=${query}&where[or][4][riferimento_completo][contains]=${query}`

        const res = await fetch(url)
        const data = await res.json()
        setResults(data.docs || [])
        setIsOpen(true)
      } catch (error) {
        console.error('Errore ricerca fonti:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchText])

  const handleSelect = (fonte: Fonte) => {
    setSelectedFonte(fonte)
    setSearchText(fonte.titolo)
    setIsOpen(false)
    onChange(fonte.id)
  }

  const handleClear = () => {
    setSelectedFonte(null)
    setSearchText('')
    setResults([])
    setIsOpen(false)
    onChange('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
    if (selectedFonte) {
      setSelectedFonte(null)
      onChange('')
    }
  }

  return (
    <div className="fonte-autocomplete" ref={wrapperRef}>
      <div className="autocomplete-input-wrapper">
        <input
          type="text"
          className="autocomplete-input"
          value={searchText}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
        />
        {loading && <span className="autocomplete-loading">...</span>}
        {selectedFonte && (
          <button
            type="button"
            className="autocomplete-clear"
            onClick={handleClear}
            title="Cancella selezione"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="autocomplete-results">
          {results.map((fonte) => (
            <li
              key={fonte.id}
              className="autocomplete-result-item"
              onClick={() => handleSelect(fonte)}
            >
              {fonte.titolo}
            </li>
          ))}
        </ul>
      )}

      {isOpen && !loading && results.length === 0 && searchText.length >= 2 && (
        <div className="autocomplete-no-results">Nessuna fonte trovata</div>
      )}
    </div>
  )
}
