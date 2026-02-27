import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginModal from '../customComponents/LoginModal'

export default function LoginPage() {
  const navigate = useNavigate()

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

  return (
    <div className="login_page_wrapper" style={{ minHeight: '100vh', background: '#0d131c' }}>
      <LoginModal show={true} onHide={handleHide} initialTab="login" />
    </div>
  )
}
