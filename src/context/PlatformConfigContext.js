import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import AuthService from '../api/services/AuthService'

const defaultConfig = {
  gameServiceStatus: true,
  inPlayServiceStatus: true,
  sportsBookServiceStatus: true,
  depositServiceStatus: true,
  withdrawalServiceStatus: true,
  bonusServiceStatus: true,
  referralServiceStatus: true,
  supportServiceStatus: true,
}

const PlatformConfigContext = createContext({
  config: defaultConfig,
  loading: false,
  refetch: () => {},
})

export function PlatformConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const [loading, setLoading] = useState(false)

  const fetchConfig = useCallback(() => {
    setLoading(true)
    AuthService.getPlatformConfiguration()
      .then((res) => {
        const data = res?.data?.data ?? res?.data
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setConfig({ ...defaultConfig, ...data })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  useEffect(() => {
    const onLoginStateChange = () => fetchConfig()
    window.addEventListener('loginStateChange', onLoginStateChange)
    return () => window.removeEventListener('loginStateChange', onLoginStateChange)
  }, [fetchConfig])

  const value = useMemo(
    () => ({ config, loading, refetch: fetchConfig }),
    [config, loading, fetchConfig]
  )

  return (
    <PlatformConfigContext.Provider value={value}>
      {children}
    </PlatformConfigContext.Provider>
  )
}

export function usePlatformConfig() {
  const ctx = useContext(PlatformConfigContext)
  if (!ctx || typeof ctx !== 'object') {
    return { config: defaultConfig, loading: false, refetch: () => {} }
  }
  return {
    config: { ...defaultConfig, ...(ctx.config || {}) },
    loading: !!ctx.loading,
    refetch: typeof ctx.refetch === 'function' ? ctx.refetch : () => {},
  }
}
