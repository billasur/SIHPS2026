import { useState, useCallback, useRef } from 'react'

export function useLocalStorageMap(key) {
  const cacheRef = useRef(null)

  const readStore = useCallback(() => {
    if (cacheRef.current !== null) return cacheRef.current
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : {}
      cacheRef.current = parsed
      return parsed
    } catch {
      return {}
    }
  }, [key])

  const [store, setStore] = useState(readStore)

  const setValue = useCallback((id, value) => {
    setStore(prev => {
      const next = { ...prev, [id]: value }
      cacheRef.current = next
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [key])

  const getValue = useCallback((id, defaultValue) => {
    return store[id] ?? defaultValue
  }, [store])

  return { getValue, setValue, store }
}
