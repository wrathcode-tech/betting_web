import React from 'react'
import './profile.css'
import UserHeader from '../customComponents/UserHeader'
import MobileMenu from '../customComponents/MobileMenu'

function ProfilePage() {
  return (
    <>
    <UserHeader />
      <div className='dashboard_page'>
        <div className='container'>
          <div className='profile_section'>
            <h1>Profile</h1>
            <div className='row'>

              <div className='col-md-6'>

                <div className='profile_bio_info d-flex align-items-center gap-3'>
                  <div className='profile_bio_info_img'>
                    <img className='user' src="images/user_vector.png" alt="user" />

                    <div className='user_active'></div>
                  </div>

                  <div className='profile_bio_info_cnt'>
                    <h3>User Name XYZ</h3>
                    <span>XYZ@gmail.com</span>
                    <div className='d-flex align-items-center gap-2 mt-2'>
                      <p><img src="images/noto_trophy.svg" alt="edit" /> Level 1</p>
                      <button className='btn profilebtn'><i class="ri-pencil-line"></i> Edit Profile</button>
                    </div>
                  </div>
                </div>

                <div className='ranklist'>
                  <ul>
                    <li><span>Rank</span>45</li>
                    <li><span>Points</span>860</li>
                    <li><span>Level</span>1</li>
                  </ul>
                </div>

                <div className='statistics_profile'>
                  <h2>Statistics</h2>
                  <ul>
                    <li>
                      <span>Total Wagered</span>
                      0.00
                    </li>
                    <li>
                      <span>Total Bets</span>
                      0
                    </li>
                    <li>
                      <span>Earned Staking</span>
                      0.00
                    </li>
                  </ul>
                </div>

                <div className='statistics_profile'>
                  <h2>Activity</h2>
                  <ul>
                    <li>
                      <span>Total Tips</span>
                      0.00
                    </li>
                    <li>
                      <span>Total Rains</span>
                      0.00
                    </li>
                    <li>
                      <span>Total Coindrops</span>
                      0.00
                    </li>
                  </ul>
                </div>

                <div className='statistics_profile'>
                  <h2>Top Played Games</h2>
                  <ul>
                    <li>
                      <span><img src="images/cricket_world_img.png" alt="game" /></span>
                      Cricket
                    </li>
                    <li>
                      <span><img src="images/basketball_img.png" alt="game" /></span>
                      Basketball
                    </li>
                    <li>
                      <span><img src="images/aviator_img.png" alt="game" /></span>
                      Aviator
                    </li>
                  </ul>
                </div>

              </div>

              <div className='col-md-6'>
                <div className='profile_right_section'>
                  <img src="images/profile_right_vector.png" alt="casino" />
                </div>
              </div>

            </div>



          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default ProfilePage
