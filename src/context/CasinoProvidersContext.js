import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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

  // Fetch on mount (global data, no auth required)
  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  // Refetch on login so data is fresh if API returns more when authenticated
  useEffect(() => {
    const onLoginStateChange = () => fetchProviders()
    window.addEventListener('loginStateChange', onLoginStateChange)
    return () => window.removeEventListener('loginStateChange', onLoginStateChange)
  }, [fetchProviders])

  const value = {
    providers,
    loadingProviders,
    refetchProviders: fetchProviders,
  }

  return (
    <CasinoProvidersContext.Provider value={value}>
      {children}
    </CasinoProvidersContext.Provider>
  )
}

export function useCasinoProviders() {
  const ctx = useContext(CasinoProvidersContext)
  if (!ctx) {
    return {
      providers: [],
      loadingProviders: false,
      refetchProviders: () => {},
    }
  }
  return ctx
}
