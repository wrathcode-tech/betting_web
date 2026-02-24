import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenu from '../customComponents/MobileMenu';
import '../customComponents/Deposit.css';
import './newDeposit.css';

const AMOUNT_OPTIONS = [500, 1000, 5000, 10000, 25000, 50000, 100000, 500000];
const SAVED_BANK_DETAILS_KEY = 'saved_bank_details';
const SAVED_UPI_DETAILS_KEY = 'saved_upi_details';

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

function getSavedUpiDetails() {
  try {
    const s = localStorage.getItem(SAVED_UPI_DETAILS_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function NewDeposit() {
  const navigate = useNavigate();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('bank'); // 'bank' | 'upi'
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);

  const savedBank = useMemo(() => getSavedBankDetails(), []);
  const hasSavedBank = savedBank && (savedBank.bankName || savedBank.accountNumber || savedBank.ifscCode);
  const savedUpi = useMemo(() => getSavedUpiDetails(), []);
  const hasSavedUpi = savedUpi && (savedUpi.upiId || savedUpi.vpa);
  const hasAnyAccount = hasSavedBank || hasSavedUpi;

  const handleAmountOption = (value) => {
    setSelectedAmount(value);
    setAmountInput(String(value));
  };

  const handleClearAmount = () => {
    setSelectedAmount(null);
    setAmountInput('');
  };

  const handleNext = () => {
    setShowAccountDetails(true);
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

          {!hasAnyAccount && (
            <div className='account_detail_payment add_account_cta'>
              <h5>Add payment method</h5>
              <p className='add_account_text'>Add Bank or UPI to deposit. Choose one:</p>
              <div className='add_account_btns d-flex gap-2'>
                <button type="button" className="add_bank_btn" onClick={() => navigate('/add-account')}>
                  Add Bank
                </button>
                <button type="button" className="add_bank_btn add_upi_btn" onClick={() => navigate('/add-account')}>
                  Add UPI
                </button>
              </div>
            </div>
          )}

          {showAccountDetails && (
            <div className='account_detail_payment'>
              {selectedPayment === 'bank' ? (
                <>
                  <h5>Account Details</h5>
                  {!hasSavedBank ? (
                    <div className='add_account_cta'>
                      <p className='add_account_text'>Add bank account to continue.</p>
                      <button type="button" className="add_bank_btn" onClick={() => navigate('/add-account')}>
                        Add bank
                      </button>
                    </div>
                  ) : (
                    <>
                      <ul>
                        <li><span>Bank name</span>{hasSavedBank?.bankName || '----'}</li>
                        <li><span>Account Name</span>{hasSavedBank?.accountHolderName || '----'}</li>
                        <li><span>Account Number</span>{hasSavedBank?.accountNumber || '----'}</li>
                        <li><span>IFSC Code</span>{hasSavedBank?.ifscCode || '----'}</li>
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
                    </>
                  )}
                </>
              ) : (
                <>
                  <h5>Account Details</h5>
                  {!hasSavedUpi ? (
                    <div className='add_account_cta'>
                      <p className='add_account_text'>Add UPI to continue.</p>
                      <button type="button" className="add_bank_btn add_upi_btn" onClick={() => navigate('/add-account')}>
                        Add UPI
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="upi_details_capcha">
                        <div className="upi_details_capcha_img">
                        <img src="images/upi_capcha.svg" alt="capcha" />
                        </div>
                    <div className='capcha_text'>
                    <p>LVTCU6RZKRPEQL3BKR3EU3TVMUQTGVBPH43G622YPMXCQS</p>
                    <button type="button" className="capcha_refresh_btn"><i className="ri-file-copy-line"></i></button>
                    </div>    
                      </div>
                      <div className='enter_amount_deposit'>
                        <h5>Enter Reference ID/Transaction ID (Re-verify for correctness)</h5>
                        <div className='enter_filed d-flex'>
                          <input
                            type="text"
                            placeholder="Enter Reference ID / Transaction ID"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                          />
                          <button type="button" onClick={() => setUtrInput('')}>Clear</button>
                        </div>
                      </div>
                      <div className='enter_amount_deposit file_upload_section'>
                        <div
                          className='file_upload_trigger'
                          onClick={() => fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="file_upload_input"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setSelectedFileName(file ? file.name : '');
                            }}
                            aria-label="Choose a file"
                          />
                          <i className="ri-upload-cloud-line file_upload_icon" aria-hidden />
                          <span className="file_upload_text">{selectedFileName || 'Choose a File'}</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <div className='payment_btn'>
            {showAccountDetails ? (
              <button type="button" className="confirm_payment_btn" onClick={handleConfirmPayment}>
                Confirm Payment
              </button>
            ) : hasAnyAccount ? (
              <button type="button" onClick={handleNext}>Next</button>
            ) : null}
          </div>


        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewDeposit;
