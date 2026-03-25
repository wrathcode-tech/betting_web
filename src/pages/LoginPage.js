import React, { useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LoginModal from '../customComponents/LoginModal'

function sanitizeReturnTo(raw) {
  const rt = (raw && String(raw).trim()) || '/'
  if (!rt.startsWith('/') || rt.startsWith('//')) return '/'
  return rt
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const referralFromQuery = searchParams.get('r') || searchParams.get('ref') || ''
  const isSignupPath = location.pathname === '/signup'
  const initialTab = isSignupPath ? 'signup' : 'login'

  const isLoggedIn = !!(sessionStorage.getItem('token'))

  const postLoginPath = useMemo(
    () => sanitizeReturnTo(location.state?.returnTo),
    [location.state?.returnTo],
  )

  useEffect(() => {
    if (isLoggedIn) {
      navigate(postLoginPath, { replace: true })
    }
  }, [isLoggedIn, navigate, postLoginPath])

  const handleHide = () => {
    if (sessionStorage.getItem('token')) {
      navigate(postLoginPath, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  if (isLoggedIn) return null

  const returnTo = postLoginPath

  return (
    <div className="login_page_wrapper" style={{ minHeight: '100vh', background: '#0d131c' }}>
      <LoginModal
        show={true}
        onHide={handleHide}
        initialTab={initialTab}
        initialReferralCode={referralFromQuery}
        returnTo={returnTo}
      />
    </div>
  )
}
