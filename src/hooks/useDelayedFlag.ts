import { useEffect, useState } from 'react'

/** Devuelve true cuando `active` lleva más de `ms` milisegundos en true. */
export function useDelayedFlag(active: boolean, ms: number) {
  const [flag, setFlag] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => setFlag(true), ms)
    return () => {
      clearTimeout(id)
      setFlag(false)
    }
  }, [active, ms])

  return active && flag
}
