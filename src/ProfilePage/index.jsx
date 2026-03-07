import React, { useState, useEffect } from 'react'
import AuthService from '../api/services/AuthService'
import { ApiConfig } from '../api/apiConfig/apiConfig'
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage'
import './profile.css'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'

function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editProfileImageFile, setEditProfileImageFile] = useState(null)
  const [editProfileImagePreview, setEditProfileImagePreview] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)

  const displayName = user?.fullName || user?.username || 'User'
  const baseUrl = (ApiConfig.baseBettingUrl || '').replace(/\/$/, '')
  const profileImageSrc = user?.profileImage
    ? (user.profileImage.startsWith('http') ? user.profileImage : baseUrl + (user.profileImage.startsWith('/') ? user.profileImage : '/' + user.profileImage)) + (user.updatedAt ? `?t=${new Date(user.updatedAt).getTime()}` : '')
    : null
  const safeUser = user ?? {}

  const fetchProfile = async () => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    const result = await AuthService.bettingGetMe()
    setLoading(false)
    if (result?.success) {
      const profileUser = result?.data?.user ?? result?.user ?? null
      setUser(profileUser)
    } else if (result?.message === 'Token is expired' || result?.statusCode === 401) {
      setUser(null)
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
      if (updatedUser) setUser((prev) => ({ ...(prev || {}), ...updatedUser }))
      await fetchProfile()
      closeEditModal()
    } else {
      alertErrorMessage(result?.message || 'Failed to update profile')
    }
  }

  if (!user && !loading) {
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
            <h1>My Profile</h1>
            <div className="row">
              <div className="col-md-6">
                <div className="profile_bio_info d-flex align-items-center gap-3">
                  <div className="profile_bio_info_img">
                    {profileImageSrc ? (
                      <img className="user" src={profileImageSrc} alt="profile" />
                    ) : (
                      <img className="user" src="images/user_vector.png" alt="user" />
                    )}
                    <div className="user_active"></div>
                  </div>
                  <div className="profile_bio_info_cnt">
                    <h3>{displayName}</h3>
                    <span>{safeUser.email || safeUser.mobile || '—'}</span>
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <p><img src="images/noto_trophy.svg" alt="edit" /> Level 1</p>
                      <button type="button" className="btn profilebtn" onClick={openEditModal}>
                        <i className="ri-pencil-line"></i> Edit Profile
                      </button>
                    </div>
                  </div>
                </div>

                <div className="statistics_profile">
                <h2>Statistics</h2>
                  <ul>
                    <li><span>Total deposit</span>₹{Number(safeUser.wallet?.totalDeposited ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
                    <li><span>Total Wagered</span>860</li>
                    <li><span>Total Bets</span>0</li>
                  </ul>
                </div>

                <div className="statistics_profile">
                  <h2></h2>
                  <ul>
                    <li><span>Exposure Credited</span>0.00</li>
                    <li><span>Available Balance</span>0</li>
                    <li><span>Bonus Rewarded</span>0.00</li>
                  </ul>
                </div>

                <div className="statistics_profile">
                  <h2>Activity</h2>
                  <ul>
                    <li><span>Total Tips</span>0.00</li>
                    <li><span>Total Rains</span>0.00</li>
                    <li><span>Total Coindrops</span>0.00</li>
                  </ul>
                </div>

                <div className="statistics_profile top_played_games">
                  <h2>Top Played Games</h2>
                  <ul>
                    <li><span><img src="images/cricket_world_img.png" alt="game" /></span>Cricket</li>
                    <li><span><img src="images/basketball_img.png" alt="game" /></span>Basketball</li>
                    <li><span><img src="images/aviator_img.png" alt="game" /></span>Aviator</li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <div className="profile_right_section">
                  <img src="images/profile_right_vector.png" alt="casino" />
                </div>
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
