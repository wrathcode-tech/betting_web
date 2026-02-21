import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginModal({ show, onHide, initialTab = 'login' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeMethod, setActiveMethod] = useState('mobile');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (show) {
      setActiveTab(initialTab);
      setActiveMethod('mobile'); // Reset to mobile when modal opens
      setShowPassword(false); // Reset password visibility
    }
  }, [show, initialTab]);

  return (
    <>
      {show && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={onHide}
        >
          <div 
            className="modal-dialog loginpopup modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content login_modal_content">
              <button 
                type="button" 
                className="btn-close login_modal_close" 
                onClick={onHide}
                aria-label="Close"
              ><i class="ri-close-large-fill"></i></button>
              
              <div className="login_modal_body">
                <div className="login_modal_inner">
                  <div className="login_modal_left">
                    <div className="login_modal_character">
                      <img src="images/stunning_vector.svg" alt="character" />
                    </div>
                    <h2 className="login_modal_bonus">WELCOME BONUS <br />UP TO 590%</h2>
                  </div>

                  <div className="login_modal_right">
                    {/* Tabs */}
                    <div className="login_modal_tabs">
                      <button 
                        className={`login_tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                      >
                        Login
                      </button>
                      <button 
                        className={`login_tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                      >
                        Sign Up
                      </button>
                    </div>

                    <p className="login_modal_methods_text"><span>SHOW ALL METHODS</span></p>
                    
                    {/* Method Tabs - only mobile, email tab commented */}
                    <div className="login_method_tabs">
                      <button 
                        className={`method_tab ${activeMethod === 'mobile' ? 'active' : ''}`}
                        onClick={() => setActiveMethod('mobile')}
                      >
                        Mobile
                      </button>
                      {/* <button 
                        className={`method_tab ${activeMethod === 'email' ? 'active' : ''}`}
                        onClick={() => setActiveMethod('email')}
                      >
                        Email
                      </button> */}
                    </div>

                    {/* Form - only mobile (email form commented) */}
                    <div className="login_form" key={activeMethod}>
                      {activeMethod === 'mobile' ? (
                        <>
                          <div className="form_group">
                            <input 
                              key="mobile-input"
                              type="tel" 
                              className="form-control login_input" 
                              placeholder="Enter Mobile Number"
                              autoComplete="tel"
                            />
                          </div>
                          <div className="form_group">
                            <div className="password_input_wrapper">
                              <input 
                                key="mobile-password"
                                type={showPassword ? 'text' : 'password'} 
                                className="form-control login_input" 
                                placeholder="Enter Password"
                                autoComplete="current-password"
                              />
                              <button 
                                type="button"
                                className="password_toggle"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : null}
                      {/* Email form commented - only mobile for login & signup
                      ) : (
                        <>
                          <div className="form_group">
                            <input 
                              key="email-input"
                              type="email" 
                              className="form-control login_input" 
                              placeholder="Enter Email"
                              autoComplete="email"
                            />
                          </div>
                          <div className="form_group">
                            <div className="password_input_wrapper">
                              <input 
                                key="email-password"
                                type={showPassword ? 'text' : 'password'} 
                                className="form-control login_input" 
                                placeholder="Enter Password"
                                autoComplete="current-password"
                              />
                              <button 
                                type="button"
                                className="password_toggle"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                              </button>
                            </div>
                          </div>
                        </>
                      ) */}

                      {/* Sign Up Additional Fields */}
                      {activeTab === 'signup' && (
                        <div className="form_group">
                          <input 
                            key="referral-input"
                            type="text" 
                            className="form-control login_input" 
                            placeholder="Enter Referral/Promo Code"
                            autoComplete="off"
                          />
                        </div>
                      )}

                      {activeTab === 'login' && (
                        <a href="#!" className="forget_password_link">Forget Password?</a>
                      )}

                      {/* Checkbox for Sign Up */}
                      {activeTab === 'signup' && (
                        <div className="form_group checkbox_group">
                          <label className="checkbox_label">
                            <input type="checkbox" className="login_checkbox" />
                            <span>I have read and agree to the <a href="#!" className="policy_link">user agreement</a> and <a href="#!" className="policy_link">privacy policy</a></span>
                          </label>
                        </div>
                      )}

                      <button
                        type="button"
                        className="login_submit_btn"
                        onClick={() => {
                          sessionStorage.setItem('token', 'demo_logged_in');
                          onHide();
                          navigate('/', { replace: true });
                        }}
                      >
                        {activeTab === 'login' ? 'Login' : 'Sign Up'}
                      </button>

                      {/* <p className="login_or_text"><span>Or Continue With</span></p>

                      <button className="login_google_btn">
                        <img src="images/google_icon.svg" alt="google" />
                        Sign In With Google
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
