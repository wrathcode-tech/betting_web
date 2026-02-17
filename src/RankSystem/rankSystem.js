import React from 'react'
import './rankSystem.css'
import AuthHeader from '../customComponents/AuthHeader'
import MobileMenu from '../customComponents/MobileMenu'

function RankSystem() {
    return (
        <>
            <AuthHeader />
            <div className='rank_system_hero_s'>
                <div className='container'>
                    <div className='row align-items-center'>

                        <div className='col-md-7'>
                            <div className='rank_system_hero_s_cnt'>
                                <h1>A lot of benefits with <span>rank system</span></h1>

                                <ul>
                                    <li>
                                        <img src="images/getting_rewards.svg" width={100} alt="Rank System" />
                                        <div className='rank_system_hero_s_cnt_item_cnt'>
                                            <h3>Levels &amp; Rewards</h3>
                                            <p>The more you play - the more you gain</p>
                                        </div>
                                    </li>
                                    <li>
                                        <img src="images/coupon_gift_box.svg" width={100} alt="Rank System" />
                                        <div className='rank_system_hero_s_cnt_item_cnt'>
                                            <h3>Exclusive Promotions</h3>
                                            <p>Reach higher rank to unlock unique benefits</p>
                                        </div>
                                    </li>
                                    <li>
                                        <img src="images/vip_icon.svg" width={100} alt="Rank System" />
                                        <div className='rank_system_hero_s_cnt_item_cnt'>
                                            <h3>VIP Club</h3>
                                            <p>Become a part of VIP Club exclusive bonuses</p>
                                        </div>
                                    </li>
                                </ul>

                            </div>
                        </div>

                        <div className='col-md-5'>
                            <div className='rank_system_hero_s_img'>
                                <img src="images/rank_system_hero_s_img.svg" alt="Rank System" />
                            </div>
                        </div>

                    </div>


                </div>
            </div>

            <div className='how_work_section'>
                <div className='container'>
                    <h2>How does it work?</h2>
                    <p className='subtext'>Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                        Lorem Ipsum has been the industry&apos;s standard dummy text ever since the
                        1500s, when an unknown .</p>

                    <div className='work_steps_bl'>
                        <div className='work_steps_bl_item'>
                            <div className='work_steps_bl_item_cnt'>
                                <h3>Login on Crownbet</h3>
                                <p>India&apos;s trusted online casino platform. Play casino, sports &amp; live games. Fast deposit
                                    • Quick withdrawal • 24/7 Support</p>
                            </div>
                            <div className='work_steps_bl_item_img'>
                                <img src="images/crownbet.png" alt="Rank System" />
                            </div>
                        </div>

                        <div className='work_steps_bl_item increase_rank_item'>
                            <div className='work_steps_bl_item_cnt'>
                                <h3>Play Games and bet on Sports</h3>
                                <p>Enjoy exciting casino games, live betting, cricket, football &amp; more. High odds •
                                    Instant payouts • Safe platform</p>
                            </div>
                            <div className='work_steps_bl_item_img'>
                                <img src="images/betsports.png" alt="Rank System" />
                            </div>
                        </div>

                        <div className='work_steps_bl_item sports_rank_item'>
                            <div className='work_steps_bl_item_cnt'>
                                <h3>Increase your rank</h3>
                                <p>Play more, win more &amp; level up faster. Unlock exclusive rewards &amp; VIP benefits.
                                    Climb the leaderboard and become a champion.</p>
                            </div>
                            <div className='work_steps_bl_item_img'>
                                <img src="images/increaserank.png" alt="Rank System" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className='work_level_reach_s'>
                <div className='container'>
                    <h2>You can reach 20 levels</h2>
                    <p className='subtext'>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
                        industry's standard dummy text ever since the 1500s, when an unknown .</p>

                <ul>
                    <li>
                        <img src="images/smartlevel.svg" alt="Rank System" />
                        <h3>Smart contract #1</h3>
                        <p>Play daily and earn XP faster</p>
                    </li>
                    <li>
                        <img src="images/smartleve2.svg" alt="Rank System" />
                        <h3>Smart contract #2</h3>
                        <p>Unlock special bonuses at every level</p>
                    </li>
                    
                    <li>
                        <img src="images/smartleve3.svg" alt="Rank System" />
                        <h3>Smart contract #3</h3>
                        <p>Get VIP rewards as you level up</p>
                    </li>
                </ul>        

                    <div className='bottom_img'>
                        <img src="images/bottom_img.svg" alt="Rank System" />
                    </div>

                </div>
            </div>
            <MobileMenu />
        </>
    );
}

export default RankSystem;
