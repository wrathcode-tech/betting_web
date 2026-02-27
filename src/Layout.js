import React, { Suspense, lazy, memo, useCallback, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSidebar } from './context/SidebarContext'

const DESKTOP_BREAKPOINT = 991

const Header = lazy(() => import('./customComponents/Header'))
const SideBar = lazy(() => import('./customComponents/SideBar/sideBar'))

function Layout() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { pathname } = useLocation()

  const onCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [setSidebarOpen])

  // Desktop: sidebar default open on every page / after navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > DESKTOP_BREAKPOINT) {
      setSidebarOpen(true)
    }
  }, [pathname, setSidebarOpen])

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <div className={`main_content_wrapper ${sidebarOpen ? 'sidebar_open' : 'sidebar_closed'}`}>
        <aside className="left_sidebar_side" aria-label="Sidebar">
          <Suspense fallback={null}>
            <SideBar isOpen={sidebarOpen} onClose={onCloseSidebar} />
          </Suspense>
        </aside>
        <div className="right_content_side">
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default memo(Layout)
