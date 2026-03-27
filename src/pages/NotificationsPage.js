import React from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'

function NotificationsPage() {
  return (
    <>
      <Header />
      <div className='dashboard_page'>
        <div className='container-fluid'>
          <div className='profile_transactions_section'>
            <div className='transactions_header'>
              <h1>Notifications</h1>
            </div>
            <p className='empty_state_message'>No notifications yet.</p>
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default NotificationsPage
