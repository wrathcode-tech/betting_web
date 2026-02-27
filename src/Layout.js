import React, { Suspense, lazy, memo, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSidebar } from './context/SidebarContext'

const Header = lazy(() => import('./customComponents/Header'))
const SideBar = lazy(() => import('./customComponents/SideBar/sideBar'))

function Layout() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const { pathname } = useLocation()
  const isGamePage = pathname === '/game'

  const onCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [setSidebarOpen])

  if (isGamePage) {
    return (
      <div className="main_content_wrapper game_page_layout">
        <div className="right_content_side" style={{ width: '100%' }}>
          <Outlet />
        </div>
      </div>
    )
  }

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
