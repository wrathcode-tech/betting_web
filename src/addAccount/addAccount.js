import React, { useState } from 'react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import '../newDeposit/newDeposit.css';
import './addAccount.css';

/* Two card images – place card1.png & card2.png in public/images to show your card designs */
const CARD_IMAGES = ['/images/mycard.png', '/images/mycard2.png'];

const DEFAULT_ACCOUNTS = CARD_IMAGES.map((img, i) => ({ id: i + 1, imageUrl: img }));

function AddAccount() {
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);

  const removeAccount = (e, id) => {
    e.stopPropagation();
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      <Header />
      <div className="new_add_account_page new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <h2>Add Account</h2>
            <p>Add your bank or UPI account for deposits and withdrawals.</p>
          </div>
          <div class="payment_topbr">
            <button type="button" class="active">Bank</button>
            </div>

<div className='choose_payment_option_bl'>
          <h5>Choose Payment Option</h5>
          <div className="account_cards_row">
            {accounts.map((acc) => (
              <div key={acc.id} className="account_card">
                <button
                  type="button"
                  className="account_card_delete"
                  onClick={(e) => removeAccount(e, acc.id)}
                  aria-label="Remove card"
                >
                  <i className="ri-delete-bin-line" />
                </button>
                <img src={acc.imageUrl} alt="" className="account_card_img" />
              </div>
            ))}
            <button type="button" className="account_card account_card_add">
              <span className="account_card_add_icon"><i className="ri-add-line" /></span>
              <span className="account_card_add_text">Add Account</span>
            </button>
          </div>
          </div>

          <p className='note_text'>Note : Please allow 30mins for deposit amount to credit, in case of any further delay reach out to customer care.</p>

          <div className="withdrawal_from_dl add_account_from_dl">

            <h5>Enter Payment Details</h5>

            <div className="enter_amount_deposit">
              <label>Enter Amount (INR)</label>
              <div className="enter_filed d-flex">
                <input type="text" placeholder="Enter Withdraw Amount " />
              </div>
            </div>

            <div className="enter_amount_deposit">
              <label>Enter Notes</label>
              <div className="enter_filed d-flex">
                <input type="text" placeholder="Enter Notes" />
              </div>
            </div>

            <p className='note_text'>Reminder: A maximum of 4 withdrawals are allowed per day, with no withdrawals permitted below ₹500.</p>


            <div className="payment_btn">
              <button type="button">Submit</button>
            </div>
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default AddAccount;
