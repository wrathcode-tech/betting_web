/**
 * Global balance state – socket updates flow here so every page gets instant balance.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { connectBalanceSocket, disconnectBalanceSocket, getLastBalance } from '../socket/balanceSocket'
import {
  connectSportsbookSocket,
  disconnectSportsbookSocket,
  addBetUpdateListener,
  removeBetUpdateListener,
} from '../socket/sportsbookSocket'

const BalanceContext = createContext({
  balance: null,
  setBalance: () => {},
})

export function BalanceProvider({ children }) {
  const [balance, setBalanceState] = useState(() => getLastBalance())
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))

  const setBalance = useCallback((value) => {
    setBalanceState((prev) => (value === prev ? prev : value))
  }, [])

  useEffect(() => {
    const onLoginChange = () => setToken(sessionStorage.getItem('token'))
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

    connectBalanceSocket(token, (newBalance) => {
      setBalanceState(newBalance)
      window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: newBalance } }))
    })

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
      removeBetUpdateListener(onBetUpdate)
      disconnectBalanceSocket()
      disconnectSportsbookSocket()
      setBalanceState(null)
    }
  }, [token])

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
