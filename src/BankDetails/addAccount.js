import React, { useState, useRef } from 'react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import '../newDeposit/newDeposit.css';
import './addAccount.css';

const HAS_BANK_ACCOUNT_KEY = 'user_has_bank_account';
export const SAVED_BANK_DETAILS_KEY = 'saved_bank_details';

/* Two card images – place card1.png & card2.png in public/images to show your card designs */
const CARD_IMAGES = ['/images/mycard.png', '/images/mycard2.png'];

const DEFAULT_ACCOUNTS = CARD_IMAGES.map((img, i) => ({ id: i + 1, imageUrl: img }));

function AddAccount() {
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState(DEFAULT_ACCOUNTS[0]?.id ?? null);
  const [showBankForm, setShowBankForm] = useState(false);
  const bankFormRef = useRef(null);
  const accountNumberRef = useRef(null);
  const accountHolderNameRef = useRef(null);
  const bankNameRef = useRef(null);
  const branchNameRef = useRef(null);
  const ifscRef = useRef(null);

  const removeAccount = (e, id) => {
    e.stopPropagation();
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (selectedAccountId === id) {
        setSelectedAccountId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const selectAccount = (id) => {
    setSelectedAccountId(id);
  };

  const openBankDetailsForm = () => {
    setShowBankForm(true);
    setTimeout(() => bankFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleAddBankSubmit = (e) => {
    e.preventDefault();
    const details = {
      accountNumber: accountNumberRef.current?.value?.trim() ?? '',
      accountHolderName: accountHolderNameRef.current?.value?.trim() ?? '',
      bankName: bankNameRef.current?.value?.trim() ?? '',
      branchName: branchNameRef.current?.value?.trim() ?? '',
      ifscCode: ifscRef.current?.value?.trim() ?? '',
    };
    localStorage.setItem(HAS_BANK_ACCOUNT_KEY, 'true');
    localStorage.setItem(SAVED_BANK_DETAILS_KEY, JSON.stringify(details));
    setShowBankForm(false);
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
          <div className="payment_topbr">
            <button type="button" className="active">Bank</button>
          </div>

<div className='choose_payment_option_bl'>
          <h5>Choose Payment Option</h5>
          <div className="account_cards_row">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                role="button"
                tabIndex={0}
                className={`account_card ${selectedAccountId === acc.id ? 'account_card_selected' : ''}`}
                onClick={() => selectAccount(acc.id)}
                onKeyDown={(e) => e.key === 'Enter' && selectAccount(acc.id)}
                aria-label={`Select account ${acc.id}`}
              >
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
            <button type="button" className="account_card account_card_add" onClick={openBankDetailsForm}>
              <span className="account_card_add_icon"><i className="ri-add-line" /></span>
              <span className="account_card_add_text">Add Account</span>
            </button>
          </div>
          </div>

          {showBankForm && (
            <div className="withdrawal_from_dl add_account_from_dl add_bank_details_section" ref={bankFormRef}>
              <h5>Add Bank Details</h5>
              <form onSubmit={handleAddBankSubmit}>
                <div className="enter_amount_deposit">
                  <label>Account Number</label>
                  <div className="enter_filed d-flex">
                    <input ref={accountNumberRef} type="text" placeholder="Enter Account Number" />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>Account Holder Name</label>
                  <div className="enter_filed d-flex">
                    <input ref={accountHolderNameRef} type="text" placeholder="Account Holder Name" />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>Bank Name</label>
                  <div className="enter_filed d-flex">
                    <input ref={bankNameRef} type="text" placeholder="Bank Name" />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>Branch Name</label>
                  <div className="enter_filed d-flex">
                    <input ref={branchNameRef} type="text" placeholder="Branch Name" />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>IFSC Number</label>
                  <div className="enter_filed d-flex">
                    <input ref={ifscRef} type="text" placeholder="IFSC Number" />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>OTP</label>
                  <div className="enter_filed d-flex">
                    <input type="text" placeholder="OTP" />
                    <button className="otp_btn" type="button">OTP</button>
                  </div>
                </div>
                <div className="payment_btn">
                  <button type="submit">ADD</button>
                </div>
              </form>
            </div>
          )}

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
