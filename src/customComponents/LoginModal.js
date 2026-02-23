import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginModal.css'

export default function LoginModal({ show, onHide, initialTab = 'login' }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)

  useEffect(() => {
    if (show) {
      setActiveTab(initialTab)
      setShowPassword(false)
      setShowForgotPassword(false)
    }
  }, [show, initialTab])

  const handleSubmit = (e) => {
    e.preventDefault()
    sessionStorage.setItem('token', 'demo_logged_in')
    window.dispatchEvent(new CustomEvent('loginStateChange'))
    onHide()
    navigate('/', { replace: true })
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
                  <form className="premium_login_form" onSubmit={(e) => e.preventDefault()}>
                    <div className="premium_form_group">
                      <div className="premium_email_otp_box">
                        <input
                          type="email"
                          className="premium_email_otp_input"
                          placeholder="Enter Email"
                          autoComplete="email"
                        />
                        <button type="button" className="premium_otp_btn">Get OTP</button>
                      </div>
                    </div>
                    <div className="premium_form_group">
                      <div className="premium_email_otp_box">
                        <input
                          type="text"
                          className="premium_email_otp_input"
                          placeholder="Enter Verification Code"
                          autoComplete="one-time-code"
                        />
                      </div>
                    </div>
                    <div className="premium_form_group">
                      <div className="premium_password_wrap">
                        <input
                          type={showForgotConfirmPassword ? 'text' : 'password'}
                          className="premium_form_input"
                          placeholder="Password"
                          autoComplete="new-password"
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
                    </div>
                    <div className="premium_form_group">
                      <input
                        type="password"
                        className="premium_form_input"
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="premium_form_footer premium_forgot_footer">
                      <button
                        type="button"
                        className="premium_login_now_link"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Login Now?
                      </button>
                    </div>
                    <button type="submit" className="premium_submit_btn">Continue</button>
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
                  onClick={() => setActiveTab('login')}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={`premium_login_tab ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => setActiveTab('signup')}
                >
                  Sign up
                </button>
              </div>

              <form className="premium_login_form" onSubmit={handleSubmit}>
                <div className="premium_form_group">
                  <label className="premium_form_label">Mobile number</label>
                  <input
                    type="tel"
                    className="premium_form_input"
                    placeholder="e.g. +91 98765 43210"
                    autoComplete="tel"
                  />
                </div>
                <div className="premium_form_group">
                  <label className="premium_form_label">Password</label>
                  <div className="premium_password_wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="premium_form_input"
                      placeholder="Enter your password"
                      autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
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
                </div>

                {activeTab === 'signup' && (
                  <div className="premium_form_group">
                    <label className="premium_form_label">Referral / Promo code (optional)</label>
                    <input
                      type="text"
                      className="premium_form_input"
                      placeholder="Enter code"
                      autoComplete="off"
                    />
                  </div>
                )}

                {activeTab === 'login' && (
                  <div className="premium_form_footer">
                    <button type="button" className="premium_forgot_link" onClick={() => setShowForgotPassword(true)}>Forgot password?</button>
                  </div>
                )}

                {activeTab === 'signup' && (
                  <label className="premium_checkbox_wrap">
                    <input type="checkbox" className="premium_checkbox" />
                    <span className="premium_checkbox_text">
                      I agree to the <a href="#!">Terms</a> and <a href="#!">Privacy Policy</a>
                    </span>
                  </label>
                )}

                <button type="submit" className="premium_submit_btn">
                  {activeTab === 'login' ? 'Log in' : 'Sign up & play'}
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
