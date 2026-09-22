import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from '../common/Footer.jsx'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    return window.innerWidth >= 900 && window.innerWidth < 1100
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('glug-collapsed', collapsed)
    return () => document.body.classList.remove('glug-collapsed')
  }, [collapsed])

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('glug-sidebar-mobile-open')
      document.documentElement.classList.add('glug-sidebar-mobile-open')
    } else {
      document.body.classList.remove('glug-sidebar-mobile-open')
      document.documentElement.classList.remove('glug-sidebar-mobile-open')
    }
    return () => {
      document.body.classList.remove('glug-sidebar-mobile-open')
      document.documentElement.classList.remove('glug-sidebar-mobile-open')
    }
  }, [mobileOpen])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) {
        setMobileOpen(false)
      } else {
        setCollapsed(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isFullApp =
    location.pathname.startsWith('/compiler') ||
    location.pathname.startsWith('/terminal') ||
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/messages')

  return (
    <div className={`app-shell-v2${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
      />
      <div className="app-main-viewport">
        <TopBar />
        <main className={`main-content${isFullApp ? ' is-full-app' : ''}`}>
          <Outlet />
          {!isFullApp && <Footer />}
        </main>
      </div>
      <div
        className={`sidebar-backdrop${mobileOpen ? ' show' : ''}`}
        onClick={() => setMobileOpen(false)}
        onTouchMove={(e) => {
          if (e.cancelable) e.preventDefault()
        }}
      />
    </div>
  )
}