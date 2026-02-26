import React, { createContext, useContext, useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 991

const SidebarContext = createContext({
  sidebarOpen: true,
  setSidebarOpen: () => {},
})

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT ? false : true
  )

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        setSidebarOpen(false)
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
