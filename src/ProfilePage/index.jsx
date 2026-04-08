import React, { useState, useEffect } from 'react'
import AuthService from '../api/services/AuthService'
import { ApiConfig } from '../api/apiConfig/apiConfig'
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage'
import './profile.css'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'

function ProfilePage() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editProfileImageFile, setEditProfileImageFile] = useState(null)
  const [editProfileImagePreview, setEditProfileImagePreview] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)

  const data = profileData ?? {}
  const user = data?.user ?? data
  const wallet = data?.wallet ?? user?.wallet ?? {}
  const referral = data?.referral ?? user?.referral ?? {}
  const session = data?.session ?? user?.session ?? {}
  const stats = data?.stats ?? user?.stats ?? {}
  const bettingStats = data?.bettingStats ?? user?.bettingStats ?? {}

  const displayName = user?.fullName || user?.username || 'User'
  const baseUrl = (ApiConfig.baseBettingUrl || '').replace(/\/$/, '')
  const profileImageSrc = user?.profileImage
    ? (user.profileImage.startsWith('http') ? baseUrl + (user.profileImage) : baseUrl + (user.profileImage.startsWith('/') ? user.profileImage : '/' + user.profileImage)) + (user.updatedAt ? `?t=${new Date(user.updatedAt).getTime()}` : '')
    : null
  const safeUser = user ?? {}

  const fetchProfile = async (keepPreviousExtra = false) => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await AuthService.bettingGetMe()
      if (result?.success) {
        const raw = result?.data ?? result
        const merged = {
          user: raw?.user ?? raw,
          wallet: raw?.wallet,
          referral: raw?.referral,
          session: raw?.session,
          stats: raw?.stats,
          bettingStats: raw?.bettingStats,
          accountStatus: raw?.accountStatus,
        }
        if (keepPreviousExtra) {
          setProfileData((prev) => {
            if (!prev) return merged
            return {
              ...merged,
              wallet: merged.wallet ?? prev.wallet,
              referral: merged.referral ?? prev.referral,
              session: merged.session ?? prev.session,
              stats: merged.stats ?? prev.stats,
              bettingStats: merged.bettingStats ?? prev.bettingStats,
            }
          })
        } else {
          setProfileData(merged)
        }
      } else if (result?.message === 'Token is expired' || result?.statusCode === 401) {
        setProfileData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const openEditModal = () => {
    setEditFullName(safeUser.fullName ?? '')
    setEditEmail(safeUser.email ?? '')
    setEditProfileImageFile(null)
    setEditProfileImagePreview(null)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    if (editProfileImagePreview) URL.revokeObjectURL(editProfileImagePreview)
    setShowEditModal(false)
    setEditProfileImageFile(null)
    setEditProfileImagePreview(null)
  }

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0] || null
    if (editProfileImagePreview) URL.revokeObjectURL(editProfileImagePreview)
    setEditProfileImageFile(file)
    setEditProfileImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const hasName = editFullName.trim()
    const hasEmail = editEmail.trim()
    if (!hasName && !hasEmail && !editProfileImageFile) {
      alertErrorMessage('Change at least one field or choose a profile image')
      return
    }
    setSaveLoading(true)
    let payload
    if (editProfileImageFile) {
      // Image upload: always send fullName and email with the image (required by backend)
      payload = {
        fullName: hasName || safeUser.fullName || '',
        email: hasEmail || safeUser.email || '',
      }
    } else {
      payload = {}
      if (hasName) payload.fullName = hasName
      if (hasEmail) payload.email = hasEmail
    }
    const result = await AuthService.bettingUpdateProfile(payload, editProfileImageFile || undefined)
    setSaveLoading(false)
    if (result?.success) {
      alertSuccessMessage(result?.message || 'Profile updated successfully')
      const updatedUser = result?.data?.user ?? result?.user
      closeEditModal()
      await fetchProfile(true)
      if (updatedUser) setProfileData((prev) => (prev ? { ...prev, user: { ...(prev.user || {}), ...updatedUser } } : prev))
    } else {
      alertErrorMessage(result?.message || 'Failed to update profile')
    }
  }

  if (!profileData && !loading) {
    return (
      <>
        <Header />
        <div className="dashboard_page">
          <div className="container">
            <div className="profile_section">
              <h1>Profile</h1>
              <p className="text-white">Please log in to view your profile.</p>
            </div>
          </div>
        </div>
        <MobileMenu />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container">
          <div className="profile_section">
            <div className="profile_page_heading" role="banner" aria-label="Profile heading">
              <h1>My Profile</h1>
              <p>Your account, activity, and wallet overview</p>
            </div>
            <div className="profile_section_row">
              <div className="profile_section_left">
                <div className="profile_bio_info d-flex align-items-center gap-3">
                  <div className="profile_bio_info_img">
                    {profileImageSrc ? (
                      <img className="user" crossOrigin="anonymous" src={profileImageSrc} alt="profile" />
                    ) : (
                      <img className="user" src="images/user_vector.png" alt="user" />
                    )}
                    <div className="user_active"></div>
                  </div>
                  <div className="profile_bio_info_cnt">
                    <h3 className="text_uppercase">{displayName}</h3>
                    <span>{safeUser?.email || '—'}</span>  <br />{/* TODO: Add mobile number */}
                    <span>{safeUser?.mobile || '—'}</span>
                    {user?.username && <span className="d-block text-white-50 small">@{user.username}</span>}
                    <div className="d-flex align-items-center gap-2 mt-2">
                      {user?.riskLevel && <p><img src="images/noto_trophy.svg" alt="level" /> Risk: {user.riskLevel}</p>}
                      <button type="button" className="btn profilebtn" onClick={openEditModal}>
                        <i className="ri-pencil-line"></i> Edit Profile
                      </button>
                    </div>
                  </div>
                </div>

                <div className="profile_stats_wrap">
                  <div className="statistics_profile">
                    <h2>Wallet &amp; Stats</h2>
                    <ul className="profile_stat_grid">
                      <li><span>Available Balance</span><strong>₹{Number(wallet?.balance ?? 0).toFixed(2)}</strong></li>
                      <li><span>Bonus Balance</span><strong>₹{Number(wallet?.bonusBalance ?? 0).toFixed(2)}</strong></li>
                      <li><span>Total Deposit</span><strong>₹{Number(wallet?.totalDeposited ?? 0).toFixed(2)}</strong></li>
                      <li><span>Total Withdrawn</span><strong>₹{Number(wallet?.totalWithdrawn ?? 0).toFixed(2)}</strong></li>
                    </ul>
                  </div>

                  <div className="statistics_profile">
                    <h2>Betting Stats</h2>
                    <ul className="profile_stat_grid">
                      {/* <li><span>Total Wagered</span><strong>₹{Number(stats?.totalWagered ?? bettingStats?.totalStake ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong></li> */}
                      <li><span>Total Bets</span><strong>{Number(stats?.totalBets ?? bettingStats?.totalBets ?? 0).toLocaleString('en-IN')}</strong></li>
                      <li><span>Sports Bets</span><strong>{Number(bettingStats?.totalSportsBets ?? 0).toLocaleString('en-IN')}</strong><small>W: {bettingStats?.sportsBetsWon ?? 0} / L: {bettingStats?.sportsBetsLost ?? 0}</small></li>
                      <li><span>Casino Bets</span><strong>{Number(bettingStats?.totalCasinoBets ?? 0).toLocaleString('en-IN')}</strong></li>
                      {/* <li><span>Lifetime P&amp;L</span><strong>₹{Number(bettingStats?.lifetimePnl ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></li> */}
                      {/* <li><span>Earned (Staking)</span><strong>₹{Number(stats?.earnedStaking ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></li> */}
                    </ul>
                  </div>

                  <div className="statistics_profile">
                    <h2>Account</h2>
                    <ul className="profile_stat_grid">
                      <li><span>Referral Code</span><strong>{referral?.referralCode || '—'}</strong></li>
                      <li><span>Total Referrals</span><strong>{Number(referral?.totalReferrals ?? 0).toLocaleString('en-IN')}</strong></li>
                      <li><span>Last Login</span><strong className="profile_stat_small">{session?.lastLoginAt ? new Date(session.lastLoginAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</strong></li>
                      <li><span>Login Count</span><strong>{Number(session?.loginCount ?? 0).toLocaleString('en-IN')}</strong></li>
                    </ul>
                  </div>

                  <div className="statistics_profile top_played_games">
                    <h2>Top Played</h2>
                    <ul className="profile_stat_grid profile_top_played">
                      <li><span><img src="images/cricket_world_img.png" alt="game" /></span><strong>Cricket</strong>{bettingStats?.totalSportsBets > 0 ? ` (${bettingStats.totalSportsBets})` : ''}</li>
                      <li><span><img src="images/aviator_img.png" alt="game" /></span><strong>Casino</strong>{bettingStats?.totalCasinoBets > 0 ? ` (${bettingStats.totalCasinoBets})` : ''}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="profile_right_section">
                <img src="images/profile_right_vector.png" alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div
          className="login_modal_backdrop premium_login_backdrop"
          onClick={closeEditModal}
          onKeyDown={(e) => e.key === 'Escape' && closeEditModal()}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="login_modal_dialog premium_login_dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login_modal_content premium_login_content">
              <button
                type="button"
                className="login_modal_close premium_login_close"
                onClick={closeEditModal}
                aria-label="Close"
              >
                <i className="ri-close-line" />
              </button>
              <div className="premium_login_inner">
                <div className="premium_login_right">
                  <h3 className="premium_login_title">Edit Profile</h3>
                  <form className="premium_login_form" onSubmit={handleSaveProfile}>
                    <div className="premium_form_group">
                      <label className="premium_form_label">Full Name</label>
                      <input
                        type="text"
                        className="premium_form_input"
                        placeholder="Enter full name"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                      />
                      <small className="text-muted">If empty, username will be shown</small>
                    </div>
                    <div className="premium_form_group">
                      <label className="premium_form_label">Email</label>
                      <input
                        type="email"
                        className="premium_form_input"
                        placeholder="Enter email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                      />
                    </div>
                    <div className="premium_form_group">
                      <label className="premium_form_label">Profile Image</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="premium_form_input"
                        onChange={handleProfileImageChange}
                      />
                      {editProfileImageFile && (
                        <p className="mt-2 text-white-50 small">Selected: {editProfileImageFile.name}</p>
                      )}
                      {editProfileImagePreview && (
                        <div className="profile_image_preview_wrap mt-2">
                          <p className="text-white-50 small mb-1">Preview</p>
                          <img
                            src={editProfileImagePreview}
                            alt="Preview"
                            className="profile_image_preview"
                          />
                        </div>
                      )}
                      <small className="text-muted d-block mt-1">JPG, PNG or WEBP. Max 2MB.</small>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                      <button type="button" className="premium_submit_btn" onClick={closeEditModal}>
                        Cancel
                      </button>
                      <button type="submit" className="premium_submit_btn" disabled={saveLoading}>
                        {saveLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileMenu />
    </>
  )
}

export default ProfilePage
