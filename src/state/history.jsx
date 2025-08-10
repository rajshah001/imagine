import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'imagine.history.v1'

const HistoryContext = createContext({ items: [], addItem: () => {}, clear: () => {} })

export function HistoryProvider({ children }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const addItem = (entry) => {
    setItems((prev) => {
      const next = [entry, ...prev]
      if (next.length > 50) next.length = 50
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const clear = () => {
    setItems([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const value = useMemo(() => ({ items, addItem, clear }), [items])
  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  )
}

export function useHistoryStore() {
  return useContext(HistoryContext)
}


