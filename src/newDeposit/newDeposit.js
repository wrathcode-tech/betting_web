import React, { useState, useMemo } from 'react';
import MobileMenu from '../customComponents/MobileMenu';
import '../customComponents/Deposit.css';
import './newDeposit.css';

const AMOUNT_OPTIONS = [500, 1000, 5000, 10000, 25000, 50000, 100000, 500000];
const SAVED_BANK_DETAILS_KEY = 'saved_bank_details';

function getSavedBankDetails() {
  try {
    const s = localStorage.getItem(SAVED_BANK_DETAILS_KEY);
    if (!s) return null;
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed) && parsed.length) return parsed[0];
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}

function NewDeposit() {
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('bank');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [utrInput, setUtrInput] = useState('');

  const savedBank = useMemo(() => getSavedBankDetails(), []);

  const handleNext = () => setShowAccountDetails(true);

  const handleAmountOption = (value) => {
    setSelectedAmount(value);
    setAmountInput(String(value));
  };

  const handleClearAmount = () => {
    setSelectedAmount(null);
    setAmountInput('');
  };

  const handleConfirmPayment = () => {
    // TODO: submit deposit (payment, amount, UTR etc.)
  };

  return (
    <>
      <div className="new_deposit_page">
        <div className="container">
          <div className='top_bar_hd'>
            <h2>Deposit</h2>
            <p>Please select deposit method:</p>
          </div>
          <p className='bank'>Bank transfer offers the most reliable and efficient payment experience.</p>

          <div className='payment_topbr'>
            <button
              type="button"
              className={selectedPayment === 'bank' ? 'active' : ''}
              onClick={() => setSelectedPayment('bank')}
            >
              Bank
            </button>
            <button
              type="button"
              className={selectedPayment === 'upi' ? 'active' : ''}
              onClick={() => setSelectedPayment('upi')}
            >
              UPI
            </button>
          </div>

          <div className='payment_selected_dl'>
            <ul>
              {AMOUNT_OPTIONS.map((value) => (
                <li key={value}>
                  <button
                    type="button"
                    className={selectedAmount === value ? 'active' : ''}
                    onClick={() => handleAmountOption(value)}
                  >
                    +{value.toLocaleString('en-IN')}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className='note_text'>Note : Please allow 30mins for deposit amount to credit, in case of any further delay reach out to customer care.</p>

          <div className='enter_amount_deposit'>
            <h5>Enter Amount (INR)</h5>
            <div className='enter_filed d-flex'>
              <input
                type="text"
                placeholder="Enter Amount To Be Deposited"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              <button type="button" onClick={handleClearAmount}>Clear</button>
            </div>
          </div>

          <div className='payment_btn'>
            {!showAccountDetails ? (
              <button type="button" onClick={handleNext}>Next</button>
            ) : null}
          </div>

          {showAccountDetails && (
            <>
              <div className='account_detail_payment'>
                <h5>Account Details</h5>
                <ul>
                  <li><span>Bank name</span>{savedBank?.bankName || '-----'}</li>
                  <li><span>Account Name</span>{savedBank?.accountHolderName || '-----'}</li>
                  <li><span>Account Number</span>{savedBank?.accountNumber || '-----'}</li>
                  <li><span>IFSC Code</span>{savedBank?.ifscCode || '-----'}</li>
                </ul>
                <div className='enter_amount_deposit'>
                  <h5>Enter Reference ID/UTR (Re-verify for correctness)</h5>
                  <div className='enter_filed d-flex'>
                    <input
                      type="text"
                      placeholder="Enter Reference ID/UTR"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                    />
                    <button type="button" onClick={() => setUtrInput('')}>Clear</button>
                  </div>
                </div>
              </div>

              <div className='payment_btn'>
                <button type="button" className="confirm_payment_btn" onClick={handleConfirmPayment}>
                  Confirm Payment
                </button>
              </div>
            </>
          )}


        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewDeposit;
