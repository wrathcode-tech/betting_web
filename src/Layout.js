import React, { Suspense, memo, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSidebar } from './context/SidebarContext'
import { alertErrorMessage } from './customComponents/CustomAlertMessage'
import Header from './customComponents/Header'
import SideBar from './customComponents/SideBar/Sidebar'
import { schedulePrefetchAllRouteChunks } from './utils/routePrefetch'

const DESKTOP_BREAKPOINT = 991

function RouteContentFallback() {
  return <div className="route_content_fallback" aria-hidden="true" />
}

function Layout() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const demoBlockedShownRef = useRef(false)

  // When demo user hits blocked route, redirect to home + show toast once
  useEffect(() => {
    if (pathname !== '/' || !state?.demoBlocked || demoBlockedShownRef.current) return
    demoBlockedShownRef.current = true
    alertErrorMessage(state.message || 'Login required to access this feature')
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

  useEffect(() => {
    schedulePrefetchAllRouteChunks()
  }, [])

  return (
    <>
      <Header />
      <div className={`main_content_wrapper ${sidebarOpen ? 'sidebar_open' : 'sidebar_closed'}`}>
        <aside className="left_sidebar_side" aria-label="Sidebar">
          <SideBar isOpen={sidebarOpen} onClose={onCloseSidebar} />
        </aside>
        <div
          className={`right_content_side ${pathname === '/cricket' || pathname === '/soccer' || pathname === '/tennis' ? 'cricketDetail_block' : ''}`}
          onClick={onMainContentClick}
        >
          <Suspense fallback={<RouteContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default memo(Layout)
