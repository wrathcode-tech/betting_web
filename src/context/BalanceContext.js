/**
 * Global balance state – socket updates flow here so every page gets instant balance.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  connectBalanceSocket,
  disconnectBalanceSocket,
  getLastBalance,
  addBalanceListener,
  removeBalanceListener,
} from '../socket/balanceSocket'
import {
  connectSportsbookSocket,
  disconnectSportsbookSocket,
  addBetUpdateListener,
  removeBetUpdateListener,
} from '../socket/sportsbookSocket'
import { getToken } from '../utils/authStorage'
import { useAuth } from './AuthContext'

const BalanceContext = createContext({
  balance: null,
  setBalance: () => {},
})

export function BalanceProvider({ children }) {
  const [balance, setBalanceState] = useState(() => getLastBalance())
  const [token, setToken] = useState(() => getToken())
  const { isDemo } = useAuth()

  const setBalance = useCallback((value) => {
    setBalanceState((prev) => (value === prev ? prev : value))
  }, [])

  useEffect(() => {
    const onLoginChange = () => setToken(getToken())
    window.addEventListener('loginStateChange', onLoginChange)
    return () => window.removeEventListener('loginStateChange', onLoginChange)
  }, [])

  useEffect(() => {
    if (!token) {
      disconnectBalanceSocket()
      disconnectSportsbookSocket()
      setBalanceState(null)
      return
    }

    // Balance socket: real user only. Demo token must not connect (backend rejects).
    if (!isDemo) {
      connectBalanceSocket(token)
    } else {
      disconnectBalanceSocket()
    }

    const onBalance = (payload) => {
      const newBalance = payload?.balance
      if (newBalance != null) {
        setBalanceState(newBalance)
        window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: newBalance } }))
      }
    }
    addBalanceListener(onBalance)

    // Sportsbook socket: optional token (guest / demo / user). Connects with token for full access.
    connectSportsbookSocket(token)
    const onBetUpdate = (payload) => {
      if (payload?.balanceAfter != null) {
        setBalanceState(payload.balanceAfter)
        window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: payload.balanceAfter } }))
      }
      window.dispatchEvent(new CustomEvent('sportsbookBetUpdate', { detail: payload }))
    }
    addBetUpdateListener(onBetUpdate)

    return () => {
      removeBalanceListener(onBalance)
      removeBetUpdateListener(onBetUpdate)
      disconnectBalanceSocket()
      disconnectSportsbookSocket()
      setBalanceState(null)
    }
  }, [token, isDemo])

  useEffect(() => {
    const onWalletUpdate = (e) => {
      if (e.detail?.balance != null) setBalanceState(e.detail.balance)
    }
    window.addEventListener('walletBalanceUpdate', onWalletUpdate)
    return () => window.removeEventListener('walletBalanceUpdate', onWalletUpdate)
  }, [])

  return (
    <BalanceContext.Provider value={{ balance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const ctx = useContext(BalanceContext)
  if (!ctx) return { balance: null, setBalance: () => {} }
  return ctx
}
