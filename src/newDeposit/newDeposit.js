import React, { useState, useEffect, useRef } from 'react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage';
import '../customComponents/Deposit.css';
import './newDeposit.css';

const AMOUNT_OPTIONS = [500, 1000, 5000, 10000, 25000, 50000, 100000, 500000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1000000;
const MIN_UTR_LENGTH = 6;

// Fallback dummy details if API fails (admin bank/UPI for testing)
const DUMMY_BANK = {
  bankName: 'Dummy Bank (Test)',
  accountHolderName: 'Admin Deposit Account',
  accountNumber: '0000111122223333',
  ifscCode: 'DUMM0001234',
};
const DUMMY_UPI = {
  upiId: 'admin@dummyupi',
  upiName: 'Admin Dummy UPI',
};

const BANK_TRANSFER_OPTIONS = [
  { value: 'imps', label: 'IMPS' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
];

function NewDeposit() {
  const [depositOptions, setDepositOptions] = useState({ bank: null, upi: null });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState('bank');
  const [bankTransferMethod, setBankTransferMethod] = useState('imps');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      const res = await AuthService.bettingGetDepositOptions();
      setOptionsLoading(false);
      if (res?.success && res?.data) {
        setDepositOptions({
          bank: res.data.bank || null,
          upi: res.data.upi || null,
        });
      }
    };
    fetchOptions();
  }, []);

  const handleAmountOption = (value) => {
    setSelectedAmount(value);
    setAmountInput(String(value));
  };

  const handleClearAmount = () => {
    setSelectedAmount(null);
    setAmountInput('');
  };

  // Admin details to show: from API or dummy
  const bankDetail = depositOptions.bank || DUMMY_BANK;
  const upiDetail = depositOptions.upi || DUMMY_UPI;
  const currentDetail = selectedPayment === 'bank' ? bankDetail : upiDetail;
  const currentDetailId = selectedPayment === 'bank' ? depositOptions.bank?.id : depositOptions.upi?.id;

  const handleConfirmPayment = async () => {
    const amount = Number(amountInput?.replace(/,/g, '')) || 0;
    const utr = (utrInput || '').trim();

    if (amount < MIN_AMOUNT) {
      alertErrorMessage(`Minimum deposit amount is ₹${MIN_AMOUNT}`);
      return;
    }
    if (amount > MAX_AMOUNT) {
      alertErrorMessage(`Maximum deposit amount is ₹${MAX_AMOUNT.toLocaleString('en-IN')}`);
      return;
    }
    if (utr.length < MIN_UTR_LENGTH) {
      alertErrorMessage('Please enter UTR / Reference ID (at least 6 characters)');
      return;
    }

    const paymentMethod = selectedPayment === 'bank' ? bankTransferMethod : 'upi';

    setSubmitLoading(true);
    const payload = {
      amount,
      utrNumber: utr,
      paymentMethod,
      adminDetailId: currentDetailId || null,
    };
    const result = await AuthService.bettingCreateDeposit(payload, paymentProofFile || undefined);
    setSubmitLoading(false);

    if (result?.success) {
      alertSuccessMessage(result?.message || 'Deposit request submitted successfully');
      setAmountInput('');
      setSelectedAmount(null);
      setUtrInput('');
      setPaymentProofFile(null);
      setSelectedFileName('');
      window.dispatchEvent(new CustomEvent('walletBalanceUpdate'));
    } else {
      alertErrorMessage(result?.message || 'Failed to submit deposit request');
    }
  };

  return (
    <>
      <Header />
      <div className="new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <h2>Deposit</h2>
            <p>Select payment method, enter amount, then pay to the details below.</p>
          </div>
          <p className="bank">Bank transfer and UPI – pay to the admin account shown below.</p>

          {/* 1. Method: Bank / UPI */}
          <div className="payment_topbr">
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

          {/* 2. Amount */}
          <div className="payment_selected_dl">
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
          <div className="enter_amount_deposit">
            <h5>Enter Amount (INR)</h5>
            <div className="enter_filed d-flex">
              <input
                type="text"
                placeholder="Enter Amount To Be Deposited"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
              <button type="button" onClick={handleClearAmount}>
                Clear
              </button>
            </div>
          </div>

          {/* 3. Admin details */}
          <div className="account_detail_payment">
            <h5>Pay to this {selectedPayment === 'bank' ? 'bank' : 'UPI'} account</h5>
            {selectedPayment === 'bank' ? (
              <>
                <ul>
                  <li><span>Bank name</span>{bankDetail.bankName || '—'}</li>
                  <li><span>Account Name</span>{bankDetail.accountHolderName || '—'}</li>
                  <li><span>Account Number</span>{bankDetail.accountNumber || '—'}</li>
                  <li><span>IFSC Code</span>{bankDetail.ifscCode || '—'}</li>
                </ul>
                <div className="enter_amount_deposit">
                  <h5>Transfer type (IMPS / NEFT / RTGS)</h5>
                  <select
                    className="premium_form_input"
                    value={bankTransferMethod}
                    onChange={(e) => setBankTransferMethod(e.target.value)}
                    style={{ width: '100%', maxWidth: '320px', padding: '10px 12px' }}
                  >
                    {BANK_TRANSFER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="upi_details_capcha">
                <div className="upi_details_capcha_img">
                  <img src="images/upi_capcha.svg" alt="UPI" />
                </div>
                <div className="capcha_text">
                  <p>{upiDetail.upiId || '—'}</p>
                  {upiDetail.upiName && (
                    <small className="text-white-50 d-block">{upiDetail.upiName}</small>
                  )}
                </div>
              </div>
            )}

            {/* 4. UTR number */}
            <div className="enter_amount_deposit">
              <h5>UTR Number / Reference ID (from your payment)</h5>
              <div className="enter_filed d-flex">
                <input
                  type="text"
                  placeholder="Enter UTR / Reference ID"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                />
                <button type="button" onClick={() => setUtrInput('')}>
                  Clear
                </button>
              </div>
            </div>

            {/* 5. Screenshot */}
            <div className="enter_amount_deposit file_upload_section">
              <h5>Screenshot (payment proof)</h5>
              <div
                className="file_upload_trigger"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="file_upload_input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setPaymentProofFile(file || null);
                    setSelectedFileName(file ? file.name : '');
                  }}
                  aria-label="Choose screenshot"
                />
                <i className="ri-upload-cloud-line file_upload_icon" aria-hidden />
                <span className="file_upload_text">
                  {selectedFileName || 'Choose screenshot (optional)'}
                </span>
              </div>
            </div>
          </div>

          <p className="note_text">
            Note: Please allow up to 30 mins for deposit to credit. For delay, contact support.
          </p>

          {/* 6. Confirm Payment */}
          <div className="payment_btn">
            <button
              type="button"
              className="confirm_payment_btn"
              onClick={handleConfirmPayment}
              disabled={submitLoading}
            >
              {submitLoading ? 'Submitting...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewDeposit;
