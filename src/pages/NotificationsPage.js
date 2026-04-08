import React, { useEffect, useMemo, useState } from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import './NotificationsPage.css'

function formatRelativeTime(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  const loadNotifications = async (activeRef = { current: true }) => {
    setLoading(true)
    try {
      const res = await AuthService.getUserNotifications({ page: 1, limit: 50 })
      if (!activeRef.current) return
      const root = res?.data ?? res
      const payload = root?.data ?? root
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : Array.isArray(root?.notifications)
            ? root.notifications
            : Array.isArray(payload)
              ? payload
              : Array.isArray(root)
                ? root
                : []
      setNotifications(list)
    } catch {
      if (activeRef.current) setNotifications([])
    } finally {
      if (activeRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const activeRef = { current: true }
    window.dispatchEvent(new CustomEvent('notificationsSeen'))
      ; (async () => { await loadNotifications(activeRef) })()
    return () => { activeRef.current = false }
  }, [])

  const items = useMemo(() => {
    return notifications.map((n, idx) => {
      const isSeen = n?.isSeen === true || String(n?.status || '').toLowerCase() === 'read'
      return {
        id: n?._id ?? n?.id ?? `n-${idx}`,
        title: n?.title ?? n?.heading ?? n?.subject ?? 'Notification',
        message: n?.message ?? n?.description ?? n?.text ?? '—',
        time: formatRelativeTime(n?.createdAt ?? n?.created_at ?? n?.dateTime ?? n?.date ?? n?.time),
        link: n?.link ?? n?.url ?? '',
        isSeen,
      }
    })
  }, [notifications])

  return (
    <>
      <Header />
      <div className='dashboard_page'>
        <div className='container-fluid'>
          <div className='profile_transactions_section notifications_section'>
            <div className='transactions_header notifications_header'>
              <div className='transactions_heading_block' role='banner' aria-label='Notifications heading'>
                <h1 style={{ color: 'white' }}>Notifications</h1>
                <p className='notifications_subtitle'>Stay updated with account alerts, offers, and important activity.</p>
              </div>
            </div>

            {loading ? (
              <p className='empty_state_message'>Loading notifications...</p>
            ) : items.length > 0 ? (
              <div className='notification_table'>
                <h4>Today</h4>
                <table className='notifications_table'>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className={item.isSeen ? '' : 'tb_background'}>
                          <h4>{item.title}</h4>
                          <div className='cnt_p'>
                            <p>{item.message}</p>
                          </div>
                          <div className='cnt_p'>
                            <p>{item.time}</p>
                          </div>
                          {item.link ? (
                            <div className='learn_more'>
                              <a href={item.link} target='_blank' rel='noopener noreferrer'>
                                Learn more 
                              </a>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='notifications_no_data d-flex justify-content-center'>
                <div className='notifications_no_data_card'>
                  <img
                    src='/images/no_data_vector.svg'
                    width='120'
                    height='120'
                    alt='No notifications'
                    className='notifications_no_data_img'
                  />
                  <h4>No notifications yet</h4>
                  <p>You are all caught up. New updates will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default NotificationsPage
