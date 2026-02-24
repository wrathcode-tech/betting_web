import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthService from '../api/services/AuthService'
import { alertErrorMessage, alertSuccessMessage } from './CustomAlertMessage'
import './LoginModal.css'

export default function LoginModal({ show, onHide, initialTab = 'login' }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [forgotMobile, setForgotMobile] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotPassword, setForgotPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPasswordValue] = useState('')
  const [forgotOtpSent, setForgotOtpSent] = useState(false)

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (show) {
      setActiveTab(initialTab)
      setShowPassword(false)
      setShowForgotPassword(false)
      resetForm()
    }
  }, [show, initialTab])

  useEffect(() => {
    let interval
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [otpTimer])

  const resetForm = () => {
    setMobile('')
    setPassword('')
    setConfirmPassword('')
    setReferralCode('')
    setOtp('')
    setOtpSent(false)
    setOtpTimer(0)
    setAgreeTerms(false)
    setForgotMobile('')
    setForgotOtp('')
    setForgotPassword('')
    setForgotConfirmPasswordValue('')
    setForgotOtpSent(false)
    setLoading(false)
    setErrors({})
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setOtp('')
    setOtpSent(false)
    setOtpTimer(0)
    setConfirmPassword('')
    setErrors({})
  }

  const setFieldError = (field, message) => {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }
  const clearFieldError = (field) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSendOtp = async () => {
    if (!mobile || mobile.length !== 10) {
      setFieldError('mobile', 'Please enter a valid 10-digit mobile number')
      return
    }
    clearFieldError('mobile')
    setLoading(true)
    try {
      const result = await AuthService.bettingSendOtp(mobile)
      if (result?.status === 'success' || result?.success) {
        alertSuccessMessage(result?.message || 'OTP sent successfully')
        setOtpSent(true)
        setOtpTimer(60)
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP')
      }
    } catch (error) {
      alertErrorMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!mobile || mobile.length !== 10) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number'
    }
    if (activeTab === 'signup' && (!otp || otp.length !== 6)) {
      newErrors.otp = 'Please enter a valid 6-digit OTP'
    }
    if (!password) {
      newErrors.password = 'Please enter a password'
    }
    if (activeTab === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (activeTab === 'signup' && !agreeTerms) {
      newErrors.agreeTerms = 'Please agree to the Terms and Privacy Policy'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const result = await AuthService.bettingRegister(mobile, otp, password, confirmPassword, referralCode)
      if (result?.status === 'success' || result?.success) {
        alertSuccessMessage(result?.message || 'Registration successful! Please login.')
        setActiveTab('login')
        resetForm()
      } else {
        alertErrorMessage(result?.message || 'Registration failed')
      }
    } catch (error) {
      alertErrorMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!mobile || mobile.length !== 10) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number'
    }
    if (!password) {
      newErrors.password = 'Please enter a password'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const result = await AuthService.bettingLogin(mobile, password)
      if (result?.status === 'success' || result?.success) {
        const token = result?.data?.accessToken || result?.token
        const refreshToken = result?.data?.refreshToken
        if (token) {
          localStorage.setItem('token', token)
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
          sessionStorage.setItem('token', token)
          window.dispatchEvent(new CustomEvent('loginStateChange'))
          alertSuccessMessage('Login successful!')
          onHide()
          navigate('/', { replace: true })
        } else {
          alertErrorMessage('Login failed: No token received')
        }
      } else {
        alertErrorMessage(result?.message || 'Invalid mobile or password')
      }
    } catch (error) {
      alertErrorMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleForgotSendOtp = async () => {
    if (!forgotMobile || forgotMobile.length !== 10) {
      setFieldError('forgotMobile', 'Please enter a valid 10-digit mobile number')
      return
    }
    clearFieldError('forgotMobile')
    setLoading(true)
    try {
      const result = await AuthService.bettingForgotPasswordSendOtp(forgotMobile)
      if (result?.status === 'success' || result?.success) {
        alertSuccessMessage(result?.message || 'OTP sent successfully')
        setForgotOtpSent(true)
      } else {
        alertErrorMessage(result?.message || 'Failed to send OTP')
      }
    } catch (error) {
      alertErrorMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleForgotPasswordReset = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!forgotOtp || forgotOtp.length !== 6) {
      newErrors.forgotOtp = 'Please enter a valid 6-digit OTP'
    }
    if (!forgotPassword) {
      newErrors.forgotPassword = 'Please enter a new password'
    }
    if (forgotPassword !== forgotConfirmPassword) {
      newErrors.forgotConfirmPassword = 'Passwords do not match'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const result = await AuthService.bettingForgotPasswordReset(
        forgotMobile, forgotOtp, forgotPassword, forgotConfirmPassword
      )
      if (result?.status === 'success' || result?.success) {
        alertSuccessMessage(result?.message || 'Password reset successful! Please login.')
        setShowForgotPassword(false)
        resetForm()
      } else {
        alertErrorMessage(result?.message || 'Password reset failed')
      }
    } catch (error) {
      alertErrorMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (!show) return null

  return (
    <div
      className="login_modal_backdrop premium_login_backdrop"
      onClick={onHide}
      onKeyDown={(e) => e.key === 'Escape' && onHide()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className="login_modal_dialog premium_login_dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="login_modal_content premium_login_content">
          <button
            type="button"
            className="login_modal_close premium_login_close"
            onClick={onHide}
            aria-label="Close"
          >
            <i className="ri-close-line" />
          </button>

          <div className="premium_login_inner">
            <div className="premium_login_right">
              <div className="premium_login_logo">
                <img alt="logo" src="images/logo.png" />
              </div>
              {showForgotPassword ? (
                <>
                  <h3 id="login-modal-title" className="premium_forgot_title">Forget Password</h3>
                  <form className="premium_login_form" onSubmit={handleForgotPasswordReset}>
                    <div className="premium_form_group">
                      <div className={`premium_email_otp_box ${errors.forgotMobile ? 'has_error' : ''}`}>
                        <input
                          type="tel"
                          className="premium_email_otp_input"
                          placeholder="Enter Mobile Number"
                          autoComplete="tel"
                          value={forgotMobile}
                          onChange={(e) => { setForgotMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearFieldError('forgotMobile') }}
                          maxLength={10}
                        />
                        <button
                          type="button"
                          className="premium_otp_btn"
                          onClick={handleForgotSendOtp}
                          disabled={loading || forgotOtpSent}
                        >
                          {forgotOtpSent ? 'OTP Sent' : 'Get OTP'}
                        </button>
                      </div>
                      {errors.forgotMobile && <span className="premium_form_error">{errors.forgotMobile}</span>}
                    </div>
                    <div className="premium_form_group">
                      <div className={`premium_email_otp_box ${errors.forgotOtp ? 'has_error' : ''}`}>
                        <input
                          type="text"
                          className="premium_email_otp_input"
                          placeholder="Enter 6-digit OTP"
                          autoComplete="one-time-code"
                          value={forgotOtp}
                          onChange={(e) => { setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearFieldError('forgotOtp') }}
                          maxLength={6}
                        />
                      </div>
                      {errors.forgotOtp && <span className="premium_form_error">{errors.forgotOtp}</span>}
                    </div>
                    <div className="premium_form_group">
                      <div className="premium_password_wrap">
                        <input
                          type={showForgotConfirmPassword ? 'text' : 'password'}
                          className={`premium_form_input ${errors.forgotPassword ? 'has_error' : ''}`}
                          placeholder="New Password"
                          autoComplete="new-password"
                          value={forgotPassword}
                          onChange={(e) => { setForgotPassword(e.target.value); clearFieldError('forgotPassword'); clearFieldError('forgotConfirmPassword') }}
                        />
                        <button
                          type="button"
                          className="premium_password_toggle"
                          onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                          aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showForgotConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </button>
                      </div>
                      {errors.forgotPassword && <span className="premium_form_error">{errors.forgotPassword}</span>}
                    </div>
                    <div className="premium_form_group">
                      <input
                        type="password"
                        className={`premium_form_input ${errors.forgotConfirmPassword ? 'has_error' : ''}`}
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                        value={forgotConfirmPassword}
                        onChange={(e) => { setForgotConfirmPasswordValue(e.target.value); clearFieldError('forgotConfirmPassword') }}
                      />
                      {errors.forgotConfirmPassword && <span className="premium_form_error">{errors.forgotConfirmPassword}</span>}
                    </div>
                    <div className="premium_form_footer premium_forgot_footer">
                      <button
                        type="button"
                        className="premium_login_now_link"
                        onClick={() => { setShowForgotPassword(false); resetForm() }}
                      >
                        Login Now?
                      </button>
                    </div>
                    <button type="submit" className="premium_submit_btn" disabled={loading}>
                      {loading ? 'Please wait...' : 'Reset Password'}
                    </button>
                  </form>
                </>
              ) : (
                <>
              <h3 id="login-modal-title" className="premium_login_title">
                {activeTab === 'login' ? 'Log in' : 'Create account'}
              </h3>

              <div className="premium_login_tabs">
                <button
                  type="button"
                  className={`premium_login_tab ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => handleTabChange('login')}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={`premium_login_tab ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => handleTabChange('signup')}
                >
                  Sign up
                </button>
              </div>

              <form className="premium_login_form" onSubmit={activeTab === 'login' ? handleLogin : handleSignup}>
                <div className="premium_form_group">
                  <label className="premium_form_label">Mobile number</label>
                  <input
                    type="tel"
                    className={`premium_form_input ${errors.mobile ? 'has_error' : ''}`}
                    placeholder="e.g. 9876543210"
                    autoComplete="tel"
                    value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearFieldError('mobile') }}
                    maxLength={10}
                  />
                  {errors.mobile && <span className="premium_form_error">{errors.mobile}</span>}
                </div>

                {activeTab === 'signup' && (
                  <div className="premium_form_group">
                    <label className="premium_form_label">OTP Verification</label>
                    <div className={`premium_email_otp_box ${errors.otp ? 'has_error' : ''}`}>
                      <input
                        type="text"
                        className="premium_email_otp_input"
                        placeholder="Enter 6-digit OTP"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearFieldError('otp') }}
                        maxLength={6}
                      />
                      <button
                        type="button"
                        className="premium_otp_btn"
                        onClick={handleSendOtp}
                        disabled={loading || otpTimer > 0}
                      >
                        {otpTimer > 0 ? `Resend (${otpTimer}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                    {errors.otp && <span className="premium_form_error">{errors.otp}</span>}
                  </div>
                )}

                <div className="premium_form_group">
                  <label className="premium_form_label">Password</label>
                  <div className="premium_password_wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`premium_form_input ${errors.password ? 'has_error' : ''}`}
                      placeholder="Enter your password"
                      autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); if (activeTab === 'signup') clearFieldError('confirmPassword') }}
                    />
                    <button
                      type="button"
                      className="premium_password_toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </button>
                  </div>
                  {errors.password && <span className="premium_form_error">{errors.password}</span>}
                </div>

                {activeTab === 'signup' && (
                  <div className="premium_form_group">
                    <label className="premium_form_label">Confirm Password</label>
                    <div className="premium_password_wrap">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`premium_form_input ${errors.confirmPassword ? 'has_error' : ''}`}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword') }}
                      />
                      <button
                        type="button"
                        className="premium_password_toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="premium_form_error">{errors.confirmPassword}</span>}
                  </div>
                )}

                {activeTab === 'signup' && (
                  <div className="premium_form_group">
                    <label className="premium_form_label">Referral / Promo code (optional)</label>
                    <input
                      type="text"
                      className="premium_form_input"
                      placeholder="Enter code"
                      autoComplete="off"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                )}

                {activeTab === 'login' && (
                  <div className="premium_form_footer">
                    <button type="button" className="premium_forgot_link" onClick={() => { setShowForgotPassword(true); setErrors({}) }}>Forgot password?</button>
                  </div>
                )}

                {activeTab === 'signup' && (
                  <>
                    <label className={`premium_checkbox_wrap ${errors.agreeTerms ? 'has_error' : ''}`}>
                      <input
                        type="checkbox"
                        className="premium_checkbox"
                        checked={agreeTerms}
                        onChange={(e) => { setAgreeTerms(e.target.checked); clearFieldError('agreeTerms') }}
                      />
                      <span className="premium_checkbox_text">
                        I agree to the <a href="#!">Terms</a> and <a href="#!">Privacy Policy</a>
                      </span>
                    </label>
                    {errors.agreeTerms && <span className="premium_form_error">{errors.agreeTerms}</span>}
                  </>
                )}

                <button type="submit" className="premium_submit_btn" disabled={loading}>
                  {loading ? 'Please wait...' : activeTab === 'login' ? 'Log in' : 'Sign up & play'}
                </button>
              </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
