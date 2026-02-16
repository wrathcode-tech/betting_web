import React from 'react'
import './Withdrawal.css'

function Withdrawal({ isOpen, onClose }) {
    if (!isOpen) return null

    return (
        <>
            <div className='withdrawal_overlay' onClick={onClose}></div>
            <div className='withdrawal_modal'>
                <div className='withdrawal_contentpop d-flex'>
                    <div className='withdrawal_content_left'>
                        <div className='girlefire_img'>
                            <img src="images/featuring_minimalist.svg" alt="girlefire" />
                        </div>
                    </div>

                    <div className='withdrawal_content_right'>
                        <div className='withdrawal_header'>
                            <div className='withdrawal_header_left d-flex align-items-center gap-2'>
                                <button className='withdrawal_back_btn' onClick={onClose}>
                                    <i className="ri-arrow-left-s-line"></i>
                                </button>
                                <h2>Withdrawal</h2>
                            </div>
                            <button className='withdrawal_close_btn' onClick={onClose}>
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <form className='withdrawalform'>
                            <div className='withdrawal_form_group'>
                                <div className='d-flex align-items-center justify-content-between gap-1'>
                                    <div className='withdrawal_amount_input'>
                                        <input type="text" placeholder='Enter Amount' />
                                    </div>
                                    <div className='max'>MAX</div>
                                </div>

                            </div>

                            <div className='withdrawal_form_group mt-3'>
                                <div className='d-flex align-items-center justify-content-between gap-1'>
                                    <div className='withdrawal_amount_input'>
                                        <input type="text" placeholder='OTP' />
                                    </div>
                                    <div className='otp_btn'><button>OTP</button></div>
                                </div>

                            </div>

                            <div className='withdrawal_form_group mt-3'>
                                <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                                    <div className='withdrawal_amount_input'>
                                        <input type="text" placeholder='Online Bank Tranfer' />
                                    </div>
                                </div>
                            </div>


                            <div className='withdrawal_form_group mt-3'>
                                <div className='d-flex align-items-center justify-content-between gap-1 fullwidth'>
                                    <div className='withdrawal_amount_input'>
                                        <input type="text" placeholder='Yes Bank (12345670)' />
                                    </div>
                                </div>
                            </div>

                            <div className='bankdetil_cnt'>
                                <label className='mt-3'>Bank Details </label>

                                <legend className='bl_list'>Bank name <span>----</span></legend>
                                <legend className='bl_list'>Account Name <span>----</span></legend>
                                <legend className='bl_list'>Account Number <span>----</span></legend>
                                <legend className='bl_list'>IFSC Code <span>----</span></legend>
                            </div>

                            <button className='withdrawal_submit_btn'>Withdraw</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Withdrawal
