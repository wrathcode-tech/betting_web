import React, { createContext, useContext, useState } from 'react'

const SidebarContext = createContext({
  sidebarOpen: true,
  setSidebarOpen: () => {},
})

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 991 ? false : true
  )

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
