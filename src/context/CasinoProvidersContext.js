import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import AuthService from '../api/services/AuthService'

const CasinoProvidersContext = createContext({
  providers: [],
  loadingProviders: false,
  refetchProviders: () => {},
})

export function CasinoProvidersProvider({ children }) {
  const [providers, setProviders] = useState([])
  const [loadingProviders, setLoadingProviders] = useState(false)

  const fetchProviders = useCallback(() => {
    setLoadingProviders(true)
    AuthService.bettingGamesGetProviders()
      .then((r) => r?.data?.providers || [])
      .then((list) => setProviders(Array.isArray(list) ? list : []))
      .catch(() => setProviders([]))
      .finally(() => setLoadingProviders(false))
  }, [])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  useEffect(() => {
    const onLoginStateChange = () => fetchProviders()
    window.addEventListener('loginStateChange', onLoginStateChange)
    return () => window.removeEventListener('loginStateChange', onLoginStateChange)
  }, [fetchProviders])

  const value = useMemo(
    () => ({
      providers,
      loadingProviders,
      refetchProviders: fetchProviders,
    }),
    [providers, loadingProviders, fetchProviders]
  )

  return (
    <CasinoProvidersContext.Provider value={value}>
      {children}
    </CasinoProvidersContext.Provider>
  )
}

const defaultCasinoProvidersValue = {
  providers: [],
  loadingProviders: false,
  refetchProviders: () => {},
}

export function useCasinoProviders() {
  try {
    const ctx = useContext(CasinoProvidersContext)
    if (!ctx || typeof ctx !== 'object') return defaultCasinoProvidersValue
    return {
      providers: Array.isArray(ctx.providers) ? ctx.providers : defaultCasinoProvidersValue.providers,
      loadingProviders: !!ctx.loadingProviders,
      refetchProviders: typeof ctx.refetchProviders === 'function' ? ctx.refetchProviders : () => {},
    }
  } catch (_) {
    return defaultCasinoProvidersValue
  }
}
