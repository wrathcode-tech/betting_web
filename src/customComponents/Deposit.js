import React from 'react'
import './Deposit.css'

function Deposit({ isOpen, onClose }) {
    if (!isOpen) return null

    return (
        <>
            <div className='deposit_overlay' onClick={onClose}></div>
            <div className='deposit_modal'>
           

                <div className='deposit_contentpop d-flex'>
                   <div className='deposit_content_left'>
                    <div className='girlefire_img'>
                        <img src="images/figurine_girlfire.png" alt="girlefire" />
                    </div>
                
                    </div>

                    <div className='deposit_content_right'>
                        
                        <div className='deposit_header'>
                            <div className='deposit_header_left d-flex align-items-center gap-2'>
                        <button className='deposit_back_btn' onClick={onClose}>
                            <i className="ri-arrow-left-s-line"></i>
                        </button>
                        <h2>Deposit</h2>
                        </div>
                        <button className='deposit_close_btn' onClick={onClose}>
                            <i className="ri-close-line"></i>
                        </button>
                    </div>

            <form className='depositform'>
                <div className='deposit_form_group'>
                    <div className='d-flex align-items-center gap-1'>
                        <div className='select_box'>
                            <select name="" id="">
                                <option value="">India</option>
                                <option value="">USA</option>
                                <option value="">UK</option>
                                <option value="">Canada</option>
                                <option value="">Other</option>
                            </select>
                        </div>
                        <div className='d-flex align-items-center justify-content-between gap-1'>
                            <div className='deposit_amount_input'>
                                <input type="text" placeholder='Enter Amount' />
                            </div>
                            <div className='max'>MAX</div>
                        </div>
                    </div>
                </div>
                <legend>Min amount is <span>₹ 500 INR</span></legend>

                <label>Deposit method</label> 
                <div className='deposit_form_group'>
                    <div className='d-flex align-items-center gap-1'>
                      
                        <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                            <div className='upi_icon'>
                                <img src="images/upi_icon.svg" alt="upi icon" />
                            </div>
                            <div className='min_amount'>min Amount<span>500 INR</span></div>
                        </div>
                    </div>
                </div>

                <div className='deposit_form_group mt-3'>
                    <div className='d-flex align-items-center gap-1'>
                      
                        <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                            <div className='upi_icon'>
                                <img src="images/bank_icon.svg" alt="bank icon" />
                            </div>
                            <div className='min_amount'>min Amount<span>500 INR</span></div>
                        </div>
                    </div>
                </div>

                <label className='mt-3'>Personal information</label> 
                <div className='d-flex align-items-center gap-3'>
                <div className='deposit_form_group'>
                        <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                        <div className='deposit_amount_input'>
                                <input type="text" placeholder='Name' />
                            </div>
                        </div>
                </div>

                <div className='deposit_form_group'>
                        <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                        <div className='deposit_amount_input'>
                                <input type="text" placeholder='LastName' />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='deposit_form_group mt-3'>
                        <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                        <div className='deposit_amount_input'>
                                <input type="email" placeholder='Email' />
                            </div>
                        </div>
                    </div>

                    <div className='deposit_form_group mt-3'>
                        <div className='d-flex align-items-center gap-1 fullwidth'>
                            <div className='select_box phone_country_code'>
                                <select name="" id="">
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                    <option value="+44">+44</option>
                                    <option value="+61">+61</option>
                                    <option value="+86">+86</option>
                                    <option value="+81">+81</option>
                                    <option value="+49">+49</option>
                                    <option value="+33">+33</option>
                                    <option value="+39">+39</option>
                                    <option value="+34">+34</option>
                                    <option value="+7">+7</option>
                                    <option value="+82">+82</option>
                                    <option value="+55">+55</option>
                                    <option value="+52">+52</option>
                                    <option value="+27">+27</option>
                                    <option value="+971">+971</option>
                                    <option value="+966">+966</option>
                                    <option value="+65">+65</option>
                                    <option value="+60">+60</option>
                                    <option value="+66">+66</option>
                                    <option value="+84">+84</option>
                                    <option value="+62">+62</option>
                                    <option value="+63">+63</option>
                                    <option value="+92">+92</option>
                                    <option value="+880">+880</option>
                                    <option value="+94">+94</option>
                                    <option value="+977">+977</option>
                                    <option value="+20">+20</option>
                                    <option value="+234">+234</option>
                                    <option value="+254">+254</option>
                                    <option value="+212">+212</option>
                                    <option value="+31">+31</option>
                                    <option value="+46">+46</option>
                                    <option value="+47">+47</option>
                                    <option value="+45">+45</option>
                                    <option value="+41">+41</option>
                                    <option value="+32">+32</option>
                                    <option value="+351">+351</option>
                                    <option value="+30">+30</option>
                                    <option value="+90">+90</option>
                                    <option value="+48">+48</option>
                                    <option value="+420">+420</option>
                                    <option value="+36">+36</option>
                                    <option value="+40">+40</option>
                                    <option value="+64">+64</option>
                                    <option value="+54">+54</option>
                                    <option value="+56">+56</option>
                                    <option value="+57">+57</option>
                                </select>
                            </div>
                            <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                                <div className='deposit_amount_input'>
                                    <input type="tel" placeholder='Phone' />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='deposit_form_group mt-3'>
                        <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                        <div className='deposit_amount_input'>
                                <input type="text" placeholder='payment account' />
                            </div>
                        </div>
                    </div> 

                  <div className='deposit_form_checkbox mt-3'>
                        <div className='d-flex align-items-center fullwidth'>
                        <span><input type="checkbox" name="checkbox"/></span>I have read and agree disclaimer <a href="#!" className='policy_link'> disclaimer</a>
                        </div>
                    </div>     
                    <button className='deposit_submit_btn'>Deposit</button>
            </form>

                   </div>
                </div>
            </div>
        </>
    )
}

export default Deposit
