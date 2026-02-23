import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import '../newDeposit/newDeposit.css';
import './newWithdrawal.css';

const HAS_BANK_ACCOUNT_KEY = 'user_has_bank_account';

function NewWithdrawal() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem(HAS_BANK_ACCOUNT_KEY)) {
      navigate('/add-account', { replace: true });
    }
  }, [navigate]);

  return (
    <>
      <Header />
      <div className="new_withdrawal_page new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <h2>Withdrawal</h2>
            <p>following payment withdrawal information:: <span>Cashable Amount : 0</span></p>
          </div>
          <div className="payment_topbr">
            <button type="button" className="active">Bank</button>
          </div>

          <div className="choose_payment_option">
            <h3 className="choose_payment_option_title">Add Bank Details</h3>
            <button
              type="button"
              className="add_account_upload add_account_upload_btn"
              onClick={() => navigate('/add-account')}
              aria-label="Add account"
            >
              <div className="add_account_icon_wrap">
                <i className="ri-add-line add_account_plus_icon" aria-hidden />
              </div>
              <span className="add_account_label">Add Account</span>
            </button>
          </div>
<div className='withdrawal_from_dl'>
          <h5>Enter Details</h5>
          <div className="enter_amount_deposit">
        <label>Account Number</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Enter Amount To Be Withdrawn" />
            </div>
          </div>
          <div className="enter_amount_deposit">
        <label>Account Holder Name</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Account Holder Name" />
            </div>
          </div>
          <div className="enter_amount_deposit">
        <label>Bank Name</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Bank Name" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>Branch Name</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Branch Name" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>IFSC Number</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="IFSC Number" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>OTP</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="OTP" />
              <button className='otp_btn' type="button">OTP</button>
            </div>
          </div>

          <div className="payment_btn">
            <button type="button">ADD</button>
          </div>

          </div>


        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewWithdrawal;
