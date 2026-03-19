import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage';
import { useBalance } from '../context/BalanceContext';
import { usePlatformConfig } from '../context/PlatformConfigContext';
import { getToken } from '../utils/authStorage';
import '../newDeposit/NewDeposit.css';
import '../BankDetails/AddAccount.css';
import './NewWithdrawal.css';

function maskAccountNumber(num) {
  if (!num || num.length < 4) return '****';
  return '****' + num.slice(-4);
}

const DEFAULT_MIN_WITHDRAWAL = 500;
const DEFAULT_MAX_WITHDRAWAL = 50000;

function NewWithdrawal() {
  const navigate = useNavigate();
  const { config: platformConfig } = usePlatformConfig();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [transactionLimits, setTransactionLimits] = useState(null);
  const { balance } = useBalance();

  const fetchAccounts = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await AuthService.bettingBankAccountsList();
    setLoading(false);
    if (res?.success && res?.data?.accounts) {
      setAccounts(res.data.accounts);
    }
  };

  useEffect(() => {
    if (platformConfig.withdrawalServiceStatus === false) {
      alertErrorMessage('Withdrawals are temporarily unavailable. Please try again later.');
    }
  }, [platformConfig.withdrawalServiceStatus]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchLimits = async () => {
      const res = await AuthService.getTransactionLimits();
      if (res?.success && res?.data) setTransactionLimits(res.data);
    };
    fetchLimits();
  }, []);

  const selectAccount = async (accountId) => {
    const res = await AuthService.bettingBankAccountsSetDefault(accountId);
    if (res?.success) {
      await fetchAccounts();
    } else {
      alertErrorMessage(res?.message || 'Failed to set default account');
    }
  };

  const defaultAccount = accounts.find((a) => a.isDefaultForWithdrawal) || accounts[0];

  // Validation as per GET /api/v1/user/transaction-limits (minWithdrawalLimit, maxWithdrawalLimit); fallback when API not loaded
  const minWithdrawal = transactionLimits?.minWithdrawalLimit != null ? Number(transactionLimits.minWithdrawalLimit) : DEFAULT_MIN_WITHDRAWAL;
  const maxWithdrawal = transactionLimits?.maxWithdrawalLimit != null ? Number(transactionLimits.maxWithdrawalLimit) : DEFAULT_MAX_WITHDRAWAL;

  const validateAmountAndAccount = () => {
    if (!defaultAccount) {
      alertErrorMessage('Please select a bank account for withdrawal.');
      return null;
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      alertErrorMessage('Enter a valid amount greater than 0.');
      return null;
    }
    if (minWithdrawal != null && numAmount < minWithdrawal) {
      alertErrorMessage(`Minimum withdrawal amount is ₹${minWithdrawal}`);
      return null;
    }
    if (maxWithdrawal != null && numAmount > maxWithdrawal) {
      alertErrorMessage(`Maximum withdrawal amount is ₹${maxWithdrawal.toLocaleString('en-IN')}`);
      return null;
    }
    return numAmount;
  };

  const handleSendOtp = async () => {
    if (!platformConfig.withdrawalServiceStatus) return;
    const numAmount = validateAmountAndAccount();
    if (numAmount == null) return;
    setOtpLoading(true);
    const res = await AuthService.walletRequestWithdrawalOtp();
    setOtpLoading(false);
    if (res?.success) {
      alertSuccessMessage(res?.message || 'OTP sent to your registered mobile.');
      setOtpSent(true);
      setOtp("");
    } else {
      alertErrorMessage(res?.message || 'Failed to send OTP.');
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!platformConfig.withdrawalServiceStatus) return;
    const numAmount = validateAmountAndAccount();
    if (numAmount == null) return;
    if (!otpSent) {
      alertErrorMessage('Please send OTP first.');
      return;
    }
    const otpTrimmed = String(otp || "").replace(/\D/g, "").slice(0, 6);
    if (otpTrimmed.length !== 6) {
      alertErrorMessage('Enter the 6-digit OTP.');
      return;
    }
    const noteTrimmed = String(note || "").trim().slice(0, 200);
    setSubmitLoading(true);
    const res = await AuthService.walletWithdrawal(defaultAccount._id, numAmount, otpTrimmed, noteTrimmed);
    setSubmitLoading(false);
    if (res?.success) {
      alertSuccessMessage(res?.message || 'Withdrawal request submitted successfully.');
      setAmount("");
      setNote("");
      setOtp("");
      setOtpSent(false);
      // Update balance across app (header, game page, etc.) – use response balance if provided, else socket will push
      const newBalance = res?.data?.balance;
      if (typeof newBalance === 'number') {
        window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { detail: { balance: newBalance } }));
      } else {
        window.dispatchEvent(new CustomEvent('walletBalanceUpdate'));
      }
    } else {
      alertErrorMessage(res?.message || 'Withdrawal request failed.');
    }
  };

  return (
    <>
      <div className="new_withdrawal_page new_deposit_page">
        <div className="container">
          {!platformConfig.withdrawalServiceStatus ? (
            <div className="platform_service_banner platform_service_banner_disabled" role="alert">
              Withdrawals are temporarily unavailable. Please try again later.
            </div>
          ) : (
            <>
              <div className="top_bar_hd">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <Link to="/my-wallet" className="back_link_btn withdrawal_back_option" aria-label="Back to My Wallet">
                    <i className="ri-arrow-left-s-line" aria-hidden />
                  </Link>
                  <div>
                    <h2>Withdrawal</h2>
                    <p>Following payment withdrawal information:: <span>Cashable Amount : {balance != null ? Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span></p>
                  </div>
                </div>
              </div>
              <div className="payment_topbr">
                <button type="button" className="active">Bank</button>
              </div>

              {loading ? (
                <p className="text-white-50">Loading bank accounts...</p>
              ) : accounts.length === 0 ? (
                <div className="choose_payment_option">
                  <h3 className="choose_payment_option_title">Add Bank Details</h3>
                  <p className="text-white-50 mb-3">No bank account added yet. Add one to request withdrawal.</p>
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
              ) : (
                <div className="choose_payment_option_bl">
                  <h5>Your bank account</h5>
                  <p className="text-white-50 small mb-2">Withdrawal will be sent to the selected account below.</p>
                  <div className="account_cards_row">
                    {accounts.map((acc) => (
                      <div
                        key={acc._id}
                        role="button"
                        tabIndex={0}
                        className={`account_card account_card_details ${acc.isDefaultForWithdrawal ? 'account_card_selected' : ''}`}
                        onClick={() => selectAccount(acc._id)}
                        onKeyDown={(e) => e.key === 'Enter' && selectAccount(acc._id)}
                        aria-label={`Select account ${acc.bankName}`}
                      >
                        <div className="account_card_content">
                          <p className="account_card_bank">{acc.bankName}</p>
                          <p className="account_card_holder text_uppercase">{acc.accountHolderName}</p>
                          <p className="account_card_number">{maskAccountNumber(acc.accountNumber)}</p>
                          <p className="account_card_ifsc">IFSC: {acc.ifscCode}</p>
                          {acc.isDefaultForWithdrawal && (
                            <span className="account_card_default_badge">Use for withdrawal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && accounts.length > 0 && (
                <form className="withdrawal_from_dl" onSubmit={handleWithdrawalSubmit}>
                  <h5>Enter Details</h5>
                  {(minWithdrawal != null || maxWithdrawal != null || (transactionLimits?.minWagerForWithdrawal != null)) && (
                    <p className="text-white-50 small mb-2">
                      {minWithdrawal != null && `Min withdrawal: ₹${minWithdrawal.toLocaleString('en-IN')}. `}
                      {maxWithdrawal != null && `Max: ₹${maxWithdrawal.toLocaleString('en-IN')}. `}
                      {transactionLimits?.minWagerForWithdrawal != null && `Min wager required: ₹${Number(transactionLimits.minWagerForWithdrawal).toLocaleString('en-IN')}.`}
                    </p>
                  )}
                  <div className="enter_amount_deposit">
                    <label>Amount to withdraw</label>
                    <div className="enter_filed d-flex">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter Amount To Be Withdrawn"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="enter_amount_deposit">
                    <label>Note (optional, max 200 characters)</label>
                    <div className="enter_filed d-flex">
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        maxLength={200}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="enter_amount_deposit">
                    <label>OTP (sent to your registered mobile)</label>
                    <div className="enter_filed d-flex">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                      <button
                        type="button"
                        className="otp_btn"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </div>
                  </div>
                  <div className="payment_btn">
                    <button type="submit" disabled={submitLoading || !otpSent}>
                      {submitLoading ? 'Submitting...' : 'Request Withdrawal'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewWithdrawal;
