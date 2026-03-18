import React, { Suspense, lazy, memo, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSidebar } from './context/SidebarContext'
import { alertErrorMessage } from './customComponents/CustomAlertMessage'

const DESKTOP_BREAKPOINT = 991

const Header = lazy(() => import('./customComponents/Header'))
const SideBar = lazy(() => import('./customComponents/SideBar/Sidebar'))

function Layout() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const demoBlockedShownRef = useRef(false)

  // When demo user hits blocked route, they are redirected to / with state.demoBlocked; show message once
  useEffect(() => {
    if (pathname !== '/' || !state?.demoBlocked || demoBlockedShownRef.current) return
    demoBlockedShownRef.current = true
    alertErrorMessage(state.message || 'Demo users can only explore the platform.')
    navigate('/', { replace: true, state: {} })
  }, [pathname, state?.demoBlocked, state?.message, navigate])

  const onCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [setSidebarOpen])

  // Mobile: click on main content (outside sidebar) closes sidebar
  const onMainContentClick = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= DESKTOP_BREAKPOINT && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [sidebarOpen, setSidebarOpen])

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
        <div
          className={`right_content_side ${pathname === '/cricket' || pathname === '/soccer' || pathname === '/tennis' ? 'cricketDetail_block' : ''}`}
          onClick={onMainContentClick}
        >
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default memo(Layout)
