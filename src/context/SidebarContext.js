import React, { createContext, useContext, useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 991

const SidebarContext = createContext({
  sidebarOpen: true,
  setSidebarOpen: () => {},
})

function getInitialSidebarOpen() {
  if (typeof window === 'undefined') return true
  return window.innerWidth > MOBILE_BREAKPOINT
}

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarOpen)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) return { sidebarOpen: true, setSidebarOpen: () => {} }
  return ctx
}
