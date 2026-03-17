import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LoginModal from '../customComponents/LoginModal'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const referralFromQuery = searchParams.get('r') || searchParams.get('ref') || ''
  const isSignupPath = location.pathname === '/signup'
  const initialTab = isSignupPath ? 'signup' : 'login'

  const isLoggedIn = !!(sessionStorage.getItem('token'))

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const handleHide = () => {
    navigate('/', { replace: true })
  }

  if (isLoggedIn) return null

  const returnTo = (location.state?.returnTo && String(location.state.returnTo).trim()) ? String(location.state.returnTo).trim() : '/'

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
