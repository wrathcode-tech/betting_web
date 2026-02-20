import React, { useState } from 'react'
import './referralProgram.css'
import AuthHeader from '../customComponents/AuthHeader'
import MobileMenu from '../customComponents/MobileMenu'

function ReferralProgram() {
    const [activeTab, setActiveTab] = useState('dashboard')

    return (
        <>
            <AuthHeader />
            <div className='dashboard_page removebgsports'>
                <div className='container'>
                    <div className='referral_program_section'>
                        <h2>Referral Program</h2>

                        <div className='d-flex align-items-center justify-content-between referral_program_tabs'>
                            <button 
                                className={activeTab === 'dashboard' ? 'active' : ''}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                Dashboard
                            </button>
                            <button 
                                className={activeTab === 'referrals' ? 'active' : ''}
                                onClick={() => setActiveTab('referrals')}
                            >
                                Refferrals
                            </button>
                        </div>

                        {activeTab === 'dashboard' && (
                            <div>
                            <div className='referral_program_content'>

                            <div className='d-flex align-items-center justify-content-between gap-4 programflex_bl'>
                                <div className='referral_profit_tl'>
                                    <ul>
                                        <li>
                                            <div className='referral_profit_tl_item'>
                                                <img src="images/total_profit.svg" alt="profit" />
                                            </div>
                                            <div className='referral_profit_tl_item_cnt'>
                                                <h5>My total profit: <span><i className="ri-error-warning-line"></i></span></h5>
                                                <span className='pricevalue'>$0.00</span>
                                            </div>
                                        </li>
                                        <li><img src="images/gradientborder.svg" alt="arrow" /></li>

                                        <li>
                                            <div className='referral_profit_tl_item'>
                                                <img src="images/total_referrals.svg" alt="profit" />
                                            </div>
                                            <div className='referral_profit_tl_item_cnt'>
                                                <h5>Total referrals  <span><i className="ri-error-warning-line"></i></span></h5>
                                                <span className='pricevalue'>$0.00</span>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                <div className='invite_users_bl'>
                                    <h5>INVITE NEW USERS TO GET:</h5>
                                    <ul>
                                        <li><i className="ri-star-fill"></i> $1500 bonus per referral</li>
                                        <li><i className="ri-star-fill"></i> Up to 30% commissions from users activity</li>
                                    </ul>

                                    <div className='notification_icon'>
                                        <img src="images/notification_icon.svg" alt="notification" />
                                    </div>

                                </div>
                            </div>


                            <div className='referral_campaign_section'>
                                <h4>My referral campaign <span>DEFAULT</span></h4>

                                <div className='d-flex align-items-center justify-content-between gap-4'>
                                    <div className='referral_linkcopy'>
                                        <i className="ri-link"></i>
                                        <div className='referral_input_group'>
                                            <div className='referral_input_group_label'>
                                                <label>Web Referral link</label>
                                                <input type="text" value="https://betfury.com/?r=User2459219" className='referral_input' />
                                            </div>
                                            <button className='referral_copy_btn'>Copy</button>
                                        </div>
                                    </div>

                                    <div className='referral_linkcopy'>
                                        <i className="ri-terminal-window-line"></i>
                                        <div className='referral_input_group'>
                                            <div className='referral_input_group_label'>
                                                <label>Your referral code</label>
                                                <input type="text" value="User23755" className='referral_input' />
                                            </div>
                                            <button className='referral_copy_btn'>Copy</button>
                                        </div>
                                    </div>
                                </div>

                                <div className='d-flex align-items-center justify-content-between gap-4 mt-4'>
                                    <div className='referral_share_cnt'>
                                        <p>Your commissions: <span>100%</span></p>
                                        <p>Shares for referrals: <span>0%</span></p>
                                    </div>
                                    <div className='referral_share_btn'>
                                        <button className='referral_share_btn'>Share my offer</button>
                                        <button className='referral_share_btn campaignbtn'>Create new campaign</button>
                                    </div>
                                </div>


                            </div>


                        </div>

                        <div className='balance_section'>
                            <h5>My balance</h5>

                            <div className='d-flex align-items-center justify-content-between gap-4 mt-3'>
                                <div className='balance_list'>
                                    <div className='d-flex align-items-center justify-content-between gap-2'>
                                        <h6>Referral bonus</h6>
                                        <button>Details <i className="ri-arrow-right-s-line"></i></button>
                                    </div>

                                    <ul>
                                        <li>
                                            <div className='balance_list_cnt_lft'>
                                                <img src="images/dollar_icon.svg" alt="referral_bonus" />
                                                <p>Available <span>$0.00</span></p>
                                            </div>
                                            <div className='balance_list_cnt_rgt'>
                                                $ <span>15.00</span>
                                            </div>
                                        </li>
                                        <li><img src="images/linebr.svg" alt="arrow" /></li>
                                        <li>
                                            <div className='balance_list_cnt_lft'>
                                                <img src="images/lock_sing.svg" alt="referral_bonus" />
                                                <p>Locked balance <span>$0.00</span></p>
                                            </div>
                                            <div className='balance_list_cnt_rgt'>
                                                $ <span>15.00</span>
                                            </div>
                                        </li>
                                    </ul>

                                    <button className='balance_list_btn'>Minimal claim: $1.5</button>

                                </div>

                                <div className='balance_list'>
                                    <div className='d-flex align-items-center justify-content-between gap-2'>
                                        <h6>Referral bonus</h6>
                                        <button>Details <i className="ri-arrow-right-s-line"></i></button>
                                    </div>

                                    <ul>
                                        <li>
                                            <div className='balance_list_cnt_lft'>
                                                <img src="images/dollar_icon.svg" alt="referral_bonus" />
                                                <p>Available <span>$0.00</span></p>
                                            </div>
                                            <div className='balance_list_cnt_rgt'>
                                                $ <span>15.00</span>
                                            </div>
                                        </li>
                                        <li><img src="images/linebr.svg" alt="arrow" /></li>
                                        <li>
                                            <div className='balance_list_cnt_lft'>
                                                <img src="images/lock_sing.svg" alt="referral_bonus" />
                                                <p>Locked balance <span>$0.00</span></p>
                                            </div>
                                            <div className='balance_list_cnt_rgt'>
                                                $ <span>15.00</span>
                                            </div>
                                        </li>
                                    </ul>

                                    <button className='balance_list_btn'>Minimal claim: $1.5</button>

                                </div>

                            </div>


                        </div>


                        <div className='referrals_profit_data'>
                            <div className='d-flex align-items-center justify-content-between gap-4'>
                                <div className='referrals_profit_data_left'>
                                    <h5>My referrals</h5>

                                    <div className='table-responsive'>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>User</th>
                                                    <th>Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View - My Referrals */}
                                    <div className='referral_cards_wrapper'>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className='referrals_profit_data_left profitbg_data'>
                                    <h5>My Profit</h5>

                                    <div className='table-responsive'>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>User</th>
                                                    <th>Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                                <tr>
                                                    <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                    <td className='pricevalue'>$0.00</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View - My Profit */}
                                    <div className='referral_cards_wrapper'>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='referral_card'>
                                            <div className='referral_card_body'>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>User</span>
                                                    <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                                </div>
                                                <div className='referral_card_row'>
                                                    <span className='referral_label'>Price</span>
                                                    <span className='referral_value pricevalue'>$0.00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>


                        <div className='rewards_history_section d-flex justify-content-between gap-4'>
                            <div className='rewards_history_data_left'>
                                <h5>Rewards history</h5>
                                <div className='table-responsive'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>User</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>
                                            <tr>
                                                <td>03:27:40 AM</td>
                                                <td>User8736113</td>
                                                <td className='pricevalue'>$1.19</td>
                                            </tr>

                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View - Rewards History */}
                                <div className='referral_cards_wrapper'>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Time</span>
                                                <span className='referral_value'>03:27:40 AM</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'>User8736113</span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$1.19</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='live_rewards_right'>
                                <h5>Live rewards</h5>

                                <div className='totalrewards_bl'>
                                    <img className='rewards_iconleft' src="images/rewards_icon.svg" alt="rewards" />
                                    <span>Total Rewards Sent To-Date</span>
                                    <h6>$5,710,545.5</h6>
                                    <img className='rewards_iconright' src="images/rewards_icon.svg" alt="rewards" />
                                </div>

                                <div className='table-responsive'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                            <tr>
                                                <td><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></td>
                                                <td className='pricevalue'>$0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View - Live Rewards */}
                                <div className='referral_cards_wrapper'>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='referral_card'>
                                        <div className='referral_card_body'>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>User</span>
                                                <span className='referral_value'><img src="images/User_icon.svg" alt="user" /> John Doe <span>Clamed</span></span>
                                            </div>
                                            <div className='referral_card_row'>
                                                <span className='referral_label'>Price</span>
                                                <span className='referral_value pricevalue'>$0.00</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="live_rewards_right_bottom">
                                    <h5>Live rewards</h5>
                                    <div className="commingsoon">
                                        <img src="images/comming_img.png" alt="commingsoon" />
                                        <button>Coming soon</button>
                                    </div>
                                    <button className="leaderboard_btn">Go to leaderboard</button>
                                </div>
                            </div>
                        </div>
                            </div>
                        )}

                        {activeTab === 'referrals' && (
                            <div className='referral_program_content tabcontent_referrals2'>

                                <div className='d-flex align-items-center justify-content-between gap-4'>
                                <h5 className='my_referrals_title'>My referrals</h5>
                                
                                <div className='referrals_filter_bar d-flex align-items-center justify-content-between gap-3'>
                                    <div className='referrals_filter_dropdown'>
                                        <select className='referrals_select'>
                                            <option>All campaigns</option>
                                        </select>
                                        <i className="ri-arrow-down-s-line"></i>
                                    </div>
                                    
                                    <div className='referrals_filter_dropdown'>
                                        <select className='referrals_select'>
                                            <option>30/05/2025-13/06/2025</option>
                                        </select>
                                        <i className="ri-arrow-down-s-line"></i>
                                    </div>
                                    
                                    <div className='referrals_filter_dropdown'>
                                        <select className='referrals_select'>
                                            <option>10</option>
                                        </select>
                                        <i className="ri-arrow-down-s-line"></i>
                                    </div>
                                    
                                    <button className='download_csv_btn'>Download as CSV file</button>
                                </div>
                                </div>
                                
                                <div className='referrals_no_data'>
                                    <div className='no_data_icon'>
                                        <img src="images/no_found.svg" alt="no data" />
                                    </div>
                                    <p className='no_data_message'>OOps! You don't have data to display</p>
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

export default ReferralProgram
