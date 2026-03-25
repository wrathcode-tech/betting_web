/**
 * Global balance: real wallet vs demo play money (WCO).
 * - Real users: `balance` from socket; `demoPlayBalance` is null.
 * - Demo users: `balance` is always 0 (never mix with demo credits); `demoPlayBalance` from profile + socket.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  connectBalanceSocket,
  disconnectBalanceSocket,
  getLastBalance,
  getLastDemoPlayBalance,
  addBalanceListener,
  removeBalanceListener,
} from '../socket/balanceSocket'
import { addBetUpdateListener, removeBetUpdateListener } from '../socket/sportsbookSocket'
import { getStoredUserForGuard, isDemoUser } from '../utils/authUtils'

const BalanceContext = createContext({
  balance: null,
  demoPlayBalance: null,
  setBalance: () => {},
  setDemoPlayBalance: () => {},
})

function readDemoUserInitial() {
  const u = getStoredUserForGuard()
  if (!isDemoUser(u)) return { wallet: getLastBalance(), demoPlay: null }
  const fromUser = u?.demoPlayBalance ?? u?.demo_play_balance
  const n = Number(fromUser)
  const fromSocket = getLastDemoPlayBalance()
  return {
    wallet: 0,
    demoPlay: Number.isFinite(fromSocket) ? fromSocket : (Number.isFinite(n) ? n : 0),
  }
}

export function BalanceProvider({ children }) {
  const initial = readDemoUserInitial()
  const [balance, setBalanceState] = useState(initial.wallet)
  const [demoPlayBalance, setDemoPlayBalanceState] = useState(initial.demoPlay)
  const [token, setToken] = useState(() => sessionStorage.getItem('token'))

  const setBalance = useCallback((value) => {
    setBalanceState((prev) => (value === prev ? prev : value))
  }, [])

  const setDemoPlayBalance = useCallback((value) => {
    setDemoPlayBalanceState((prev) => (value === prev ? prev : value))
  }, [])

  useEffect(() => {
    const onLoginChange = () => {
      setToken(sessionStorage.getItem('token'))
      const u = getStoredUserForGuard()
      if (isDemoUser(u)) {
        setBalanceState(0)
        const d = u?.demoPlayBalance ?? u?.demo_play_balance
        const n = Number(d)
        setDemoPlayBalanceState(Number.isFinite(n) ? n : 0)
      } else {
        setDemoPlayBalanceState(null)
        setBalanceState(getLastBalance())
      }
    }
    window.addEventListener('loginStateChange', onLoginChange)
    return () => window.removeEventListener('loginStateChange', onLoginChange)
  }, [])

  useEffect(() => {
    if (!token) {
      disconnectBalanceSocket()
      setBalanceState(null)
      setDemoPlayBalanceState(null)
      return
    }

    const u = getStoredUserForGuard()
    const demo = isDemoUser(u)

    if (demo) {
      setBalanceState(0)
      const d = u?.demoPlayBalance ?? u?.demo_play_balance
      const n = Number(d)
      if (Number.isFinite(n)) setDemoPlayBalanceState(n)
    } else {
      setDemoPlayBalanceState(null)
    }

    connectBalanceSocket(token)
    const onBalance = (payload) => {
      const user = getStoredUserForGuard()
      const isDemo = isDemoUser(user)
      if (isDemo) {
        setBalanceState(0)
        const dpb = payload?.demoPlayBalance ?? payload?.demo_play_balance ?? payload?.demoCredits
        if (dpb != null) {
          const v = Number(dpb)
          if (Number.isFinite(v)) setDemoPlayBalanceState(v)
        }
        window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: 0, demoPlayBalance: dpb != null ? Number(dpb) : undefined, isDemo: true } }))
        return
      }
      const newBalance = payload?.balance
      if (newBalance != null) {
        setBalanceState(newBalance)
        window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: newBalance } }))
      }
    }
    addBalanceListener(onBalance)

    const onBetUpdate = (payload) => {
      const user = getStoredUserForGuard()
      if (isDemoUser(user)) {
        setBalanceState(0)
        window.dispatchEvent(new CustomEvent('sportsbookBetUpdate', { detail: payload }))
        return
      }
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
    }
  }, [token])

  useEffect(() => {
    const onWalletUpdate = (e) => {
      if (e.detail?.isDemo) {
        setBalanceState(0)
        if (e.detail?.demoPlayBalance != null) setDemoPlayBalanceState(Number(e.detail.demoPlayBalance))
        return
      }
      if (e.detail?.balance != null) setBalanceState(e.detail.balance)
    }
    window.addEventListener('walletBalanceUpdate', onWalletUpdate)
    return () => window.removeEventListener('walletBalanceUpdate', onWalletUpdate)
  }, [])

  return (
    <BalanceContext.Provider value={{ balance, demoPlayBalance, setBalance, setDemoPlayBalance }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const ctx = useContext(BalanceContext)
  if (!ctx) return { balance: null, demoPlayBalance: null, setBalance: () => {}, setDemoPlayBalance: () => {} }
  return ctx
}
