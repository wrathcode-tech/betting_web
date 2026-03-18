import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage';
import { usePlatformConfig } from '../context/PlatformConfigContext';
import '../customComponents/Deposit.css';
import './NewDeposit.css';

/** Build UPI payment URI so QR scan opens app with backend UPI ID (and optional amount). */
function buildUpiUri(upiId, upiName = '', amount = '') {
  if (!upiId || typeof upiId !== 'string') return '';
  const pa = encodeURIComponent(upiId.trim());
  const pn = encodeURIComponent((upiName || '').trim() || 'Pay');
  const am = amount && Number(amount) > 0 ? `&am=${Number(amount)}` : '';
  return `upi://pay?pa=${pa}&pn=${pn}${am}&cu=INR`;
}

const AMOUNT_OPTIONS = [500, 1000, 5000, 10000, 25000, 50000, 100000, 500000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1000000;
const MIN_UTR_LENGTH = 6;

const BANK_TRANSFER_OPTIONS = [
  { value: 'imps', label: 'IMPS' },
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
];

// Fallback when API returns no accounts – options tab dikhane ke liye
const FALLBACK_BANK_ACCOUNTS = [
  { _id: 'fallback-1', type: 'bank', bankName: 'State Bank of India', accountHolderName: 'Admin Account', accountNumber: '1234567890123456', ifscCode: 'SBIN0001234', minDeposit: MIN_AMOUNT, maxDeposit: MAX_AMOUNT },
  { _id: 'fallback-2', type: 'bank', bankName: 'HDFC Bank', accountHolderName: 'Admin Account', accountNumber: '9876543210987654', ifscCode: 'HDFC0000567', minDeposit: MIN_AMOUNT, maxDeposit: MAX_AMOUNT },
  { _id: 'fallback-3', type: 'bank', bankName: 'ICICI Bank', accountHolderName: 'Admin Account', accountNumber: '5555666677778888', ifscCode: 'ICIC0000890', minDeposit: MIN_AMOUNT, maxDeposit: MAX_AMOUNT },
];

function NewDeposit() {
  const { config: platformConfig } = usePlatformConfig();
  const [masterAccounts, setMasterAccounts] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState('bank');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [bankTransferMethod, setBankTransferMethod] = useState('imps');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [transactionLimits, setTransactionLimits] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (platformConfig.depositServiceStatus === false) {
      alertErrorMessage('Deposits are temporarily unavailable. Please try again later.');
    }
  }, [platformConfig.depositServiceStatus]);

  useEffect(() => {
    const fetchAccounts = async () => {
      setOptionsLoading(true);
      const res = await AuthService.getMasterDepositAccounts();
      setOptionsLoading(false);
      if (res?.success && res?.data?.accounts) {
        const accounts = res.data.accounts;
        setMasterAccounts(accounts);
        const banks = accounts.filter((a) => a.type === 'bank');
        const upis = accounts.filter((a) => a.type === 'upi');
        if (banks.length === 0 && upis.length > 0) setSelectedPayment('upi');
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchLimits = async () => {
      const res = await AuthService.getTransactionLimits();
      if (res?.success && res?.data) setTransactionLimits(res.data);
    };
    fetchLimits();
  }, []);

  const bankAccounts = masterAccounts.filter((a) => a.type === 'bank');
  const upiAccounts = masterAccounts.filter((a) => a.type === 'upi');
  // API se accounts na aaye to fallback – Option 1, 2, 3 hamesha dikhenge (Bank)
  const currentOptionList =
    selectedPayment === 'bank'
      ? (bankAccounts.length > 0 ? bankAccounts : FALLBACK_BANK_ACCOUNTS)
      : upiAccounts;
  const safeOptionIndex = currentOptionList.length > 0 && selectedOptionIndex >= currentOptionList.length ? 0 : selectedOptionIndex;
  const selectedAccount = currentOptionList[safeOptionIndex] || currentOptionList[0] || null;
  const usingFallback = selectedPayment === 'bank' && bankAccounts.length === 0 && FALLBACK_BANK_ACCOUNTS.length > 0;

  const handleAmountOption = (value) => {
    setSelectedAmount(value);
    setAmountInput(String(value));
  };

  const handleClearAmount = () => {
    setSelectedAmount(null);
    setAmountInput('');
  };

  const handlePaymentTypeChange = (type) => {
    setSelectedPayment(type);
    setSelectedOptionIndex(0);
  };

  const currentDetailId = usingFallback ? null : (selectedAccount?._id || null);

  // Validation strictly as per GET /api/v1/user/transaction-limits (minDepositLimit, maxDepositLimit)
  const limitMin = transactionLimits?.minDepositLimit != null ? Number(transactionLimits.minDepositLimit) : null;
  const limitMax = transactionLimits?.maxDepositLimit != null ? Number(transactionLimits.maxDepositLimit) : null;
  const accountMin = selectedAccount?.minDeposit != null ? Number(selectedAccount.minDeposit) : MIN_AMOUNT;
  const accountMax = selectedAccount?.maxDeposit != null ? Number(selectedAccount.maxDeposit) : MAX_AMOUNT;
  const minAllowed = limitMin != null ? limitMin : accountMin;
  const maxAllowed = limitMax != null ? limitMax : accountMax;

  const handleNext = () => {
    if (!platformConfig.depositServiceStatus) return;
    const amount = Number(amountInput?.replace(/,/g, '')) || 0;
    if (amount < minAllowed) {
      alertErrorMessage(`Minimum deposit amount is ₹${minAllowed}`);
      return;
    }
    if (amount > maxAllowed) {
      alertErrorMessage(`Maximum deposit amount is ₹${maxAllowed.toLocaleString('en-IN')}`);
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleConfirmPayment = async () => {
    if (!platformConfig.depositServiceStatus) return;
    const amount = Number(amountInput?.replace(/,/g, '')) || 0;
    const utr = (utrInput || '').trim();
    if (amount < minAllowed) {
      alertErrorMessage(`Minimum deposit amount is ₹${minAllowed}`);
      return;
    }
    if (amount > maxAllowed) {
      alertErrorMessage(`Maximum deposit amount is ₹${maxAllowed.toLocaleString('en-IN')}`);
      return;
    }
    if (utr.length < MIN_UTR_LENGTH) {
      alertErrorMessage('Please enter UTR / Reference ID (at least 6 characters)');
      return;
    }

    const paymentMethod = selectedAccount?.type === 'bank' ? bankTransferMethod : 'upi';

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
      setStep(1);
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
          {!platformConfig.depositServiceStatus ? (
            <div className="platform_service_banner platform_service_banner_disabled" role="alert">
              Deposits are temporarily unavailable. Please try again later.
            </div>
          ) : (
            <>
              <div className="top_bar_hd">
                <h2>Deposit</h2>
                <p>
                  {step === 1
                    ? 'Select payment method, choose or enter amount, then click Next.'
                    : 'Pay to the account below and enter your payment details.'}
                </p>
              </div>

              {/* Step indicator */}


              {/* 1. Method: Bank / UPI (Step 1 only) */}
              {step === 1 && (
                <>
                  {!optionsLoading && masterAccounts.length === 0 && (
                    <p className="text-white-50 mb-3">Using default options. Add accounts via API to see dynamic list.</p>
                  )}
                  {/* Desktop: buttons; Mobile: dropdown */}
                  <div className="payment_type_select_mobile">
                    <select
                      className="payment_type_select deposit_btn_style"
                      value={selectedPayment}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                      aria-label="Select payment method"
                    >
                      <option value="bank">Bank Transfer</option>
                      {upiAccounts.length > 0 && <option value="upi">UPI</option>}
                    </select>
                  </div>
                  <div className="payment_topbr payment_topbr_buttons">
                    <button
                      type="button"
                      className={selectedPayment === 'bank' ? 'active' : ''}
                      onClick={() => handlePaymentTypeChange('bank')}
                    >
                      Bank
                    </button>
                    {upiAccounts.length > 0 && (
                      <button
                        type="button"
                        className={selectedPayment === 'upi' ? 'active' : ''}
                        onClick={() => handlePaymentTypeChange('upi')}
                      >
                        UPI
                      </button>
                    )}
                  </div>

                  {/* Option 1, Option 2, ... – API se jitne aaye utne, nahi to fallback 3 options */}
                  <div className="payment_topbr payment_topbr_options">
                    {currentOptionList.map((acc, idx) => (
                      <button
                        key={acc._id}
                        type="button"
                        className={safeOptionIndex === idx ? 'active' : ''}
                        onClick={() => setSelectedOptionIndex(idx)}
                      >
                        Option {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Predefined amount list */}
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

                  {/* Amount input */}
                  <div className="enter_amount_deposit">
                    <h5>Enter Amount (INR)</h5>
                    {(minAllowed !== MIN_AMOUNT || maxAllowed !== MAX_AMOUNT || (transactionLimits?.bonusPercentage != null)) && (
                      <p className="text-white-50 small mb-2">
                        Limit: ₹{minAllowed.toLocaleString('en-IN')} – ₹{maxAllowed.toLocaleString('en-IN')}.
                        {transactionLimits?.bonusPercentage != null && ` Bonus: ${Number(transactionLimits.bonusPercentage)}%.`}
                      </p>
                    )}
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

                  {/* Next button – Step 1 */}
                  <div className="payment_btn">
                    <button
                      type="button"
                      className="confirm_payment_btn next_btn"
                      onClick={handleNext}
                      disabled={optionsLoading}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Bank/UPI details + Transfer type + UTR + Payment proof */}
              {step === 2 && (
                <div className="account_detail_payment deposit_step2">
                  <button type="button" className="deposit_back_btn" onClick={handleBack}>
                    Back
                  </button>

                  <h5>Pay to this {selectedAccount?.type === 'bank' ? 'bank' : 'UPI'} account</h5>
                  {selectedAccount?.type === 'bank' ? (
                    <>
                      <ul>
                        <li><span>Bank name</span>{selectedAccount.bankName || '—'}</li>
                        <li><span>Account Holder Name</span><span className="text_uppercase">{selectedAccount.accountHolderName || '—'}</span></li>
                        <li><span>Account Number</span>{selectedAccount.accountNumber || '—'}</li>
                        <li><span>IFSC Code</span>{selectedAccount.ifscCode || '—'}</li>
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
                  ) : selectedAccount?.type === 'upi' ? (
                    <div className="upi_details_capcha">
                      <div className="upi_details_capcha_img upi_qr_wrapper">
                        {selectedAccount.upiId ? (
                          <QRCodeSVG
                            value={buildUpiUri(selectedAccount.upiId, selectedAccount.upiName, amountInput)}
                            size={280}
                            level="M"
                            includeMargin={true}
                            aria-label="Scan to pay via UPI"
                          />
                        ) : (
                          <img src="images/upi_capcha.svg" alt="UPI" />
                        )}
                      </div>
                      <div className="capcha_text">
                        UPI ID :
                        <p> {selectedAccount.upiId || '—'}</p>
                        {selectedAccount.upiName && (
                          <small className="text-white-50 d-block">{selectedAccount.upiName}</small>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-white-50">No account selected.</p>
                  )}

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

                  <p className="note_text note_text_step2">
                    Note: Please allow up to 30 mins for deposit to credit. For delay, contact support.
                  </p>

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
              )}
            </>
          )}
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewDeposit;
