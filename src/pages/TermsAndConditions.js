import React, { memo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import '../GameRule/gamerules.css'
import '../customComponents/Footer.css'

const TermsAndConditions = memo(function TermsAndConditions() {
  return (
    <>
      <Header />
      <div className="dashboard_page terms_page">
        <div className="container-fluid">
          <div className="promotions_top_hd">
            <h1>Terms &amp; Conditions</h1>
            <p>Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Please read these terms carefully before using our services.</p>
          </div>

          <div className="terms_content betgugly_content">
            <h2 className="betgugly_heading">1. Acceptance of Terms</h2>
            <p>By accessing or using this platform, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.</p>

            <h2 className="betgugly_heading">2. Eligibility</h2>
            <p>You must be at least 18 years of age (or the legal age for gambling in your jurisdiction) to use this platform. By using our services, you represent that you meet the age requirement and that gambling is legal in your location. We reserve the right to verify your age and identity at any time.</p>

            <h2 className="betgugly_heading">3. Account and Registration</h2>
            <p>To place bets or use certain features, you must register and maintain an account. You are responsible for keeping your login details confidential and for all activity on your account. You must provide accurate and complete information during registration and keep it updated.</p>

            <h2 className="betgugly_heading">4. Betting and Gaming Rules</h2>
            <p>All bets and wagers are subject to our Game Rules and the rules of the relevant sport or game. We reserve the right to void, cancel or settle bets in accordance with our rules, including in cases of obvious errors, fraud, or breach of terms. Our decision on settlement is final.</p>

            <h2 className="betgugly_heading">5. Deposits and Withdrawals</h2>
            <p>Deposits and withdrawals are subject to our payment policy and any limits or processing times we communicate. You are responsible for any fees charged by your bank or payment provider. We may require identity verification before processing withdrawals.</p>

            <h2 className="betgugly_heading">6. Responsible Gaming</h2>
            <p>We encourage responsible gaming. You may set deposit limits, loss limits, or self-exclude from our services. If you believe you have a gambling problem, please seek help from a recognised organisation and use our responsible gaming tools.</p>

            <h2 className="betgugly_heading">7. Prohibited Use</h2>
            <p>You must not use our platform for any illegal purpose, to collude, cheat, or use automated systems or bots without our permission. We may suspend or close your account and withhold funds if we suspect fraud or breach of these terms.</p>

            <h2 className="betgugly_heading">8. Limitation of Liability</h2>
            <p>To the extent permitted by law, we are not liable for any indirect, incidental, or consequential losses arising from your use of our services. Our total liability is limited to the amount of your stake or balance in relation to the matter in question.</p>

            <h2 className="betgugly_heading">9. Changes to Terms</h2>
            <p>We may update these Terms and Conditions from time to time. The updated version will be posted on this page with a new “Last updated” date. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>

            <h2 className="betgugly_heading">10. Contact</h2>
            <p>For questions about these Terms and Conditions, please contact our support team through the Help or Contact options available on the platform.</p>

            <p className="terms_back_link">
              <Link to="/" className="footer_show_more_btn" style={{ display: 'inline-flex', textDecoration: 'none', color: '#fff' }}>Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
})

export default TermsAndConditions
