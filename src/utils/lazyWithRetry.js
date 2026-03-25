import { lazy } from 'react'

function isChunkLoadError(error) {
  if (!error) return false
  if (error.name === 'ChunkLoadError') return true
  const msg = String(error.message || error?.toString?.() || '')
  const fromCause = error?.cause ? String(error.cause.message || '') : ''
  const combined = `${msg} ${fromCause}`
  if (/chunk load error/i.test(combined)) return true
  if (/loading chunk/i.test(combined) && /failed/i.test(combined)) return true
  if (/failed to fetch dynamically imported module/i.test(combined)) return true
  if (/importing a module script failed/i.test(combined)) return true
  return false
}

/**
 * Same as React.lazy, but recovers when a cached main bundle requests a stale code-split chunk
 * (common after deploy or dev-server HMR). Triggers a full reload once.
 */
export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem('chunk_reload_attempt')
      return mod
    } catch (error) {
      if (!isChunkLoadError(error)) throw error
      const reloaded = sessionStorage.getItem('chunk_reload_attempt')
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload_attempt', '1')
        window.location.reload()
        return new Promise(() => {})
      }
      sessionStorage.removeItem('chunk_reload_attempt')
      throw error
    }
  })
}
