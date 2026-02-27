import React, { useState, useEffect, useRef } from 'react';
import MobileMenu from '../customComponents/MobileMenu';
import AuthService from '../api/services/AuthService';
import { alertSuccessMessage, alertErrorMessage } from '../customComponents/CustomAlertMessage';
import '../newDeposit/newDeposit.css';
import './addAccount.css';

const MAX_ACCOUNTS = 3;

function maskAccountNumber(num) {
  if (!num || num.length < 4) return '****';
  return '****' + num.slice(-4);
}

function AddAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const formRef = useRef(null);

  const [form, setForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
    otp: '',
  });

  const fetchAccounts = async () => {
    const token = sessionStorage.getItem('token');
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
    fetchAccounts();
  }, []);

  const selectAccount = async (accountId) => {
    const res = await AuthService.bettingBankAccountsSetDefault(accountId);
    if (res?.success) await fetchAccounts();
    else alertErrorMessage(res?.message || 'Failed to set default account');
  };

  const removeAccount = async (e, accountId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this bank account?')) return;
    const res = await AuthService.bettingBankAccountsDelete(accountId);
    if (res?.success) {
      alertSuccessMessage('Account removed');
      await fetchAccounts();
    } else {
      alertErrorMessage(res?.message || 'Failed to delete');
    }
  };

  const openBankForm = () => {
    if (accounts.length >= MAX_ACCOUNTS) {
      alertErrorMessage(`You can add at most ${MAX_ACCOUNTS} bank accounts`);
      return;
    }
    setShowBankForm(true);
    setOtpSent(false);
    setForm({ accountHolderName: '', accountNumber: '', bankName: '', branchName: '', ifscCode: '', otp: '' });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendOtp = async () => {
    const { accountHolderName, accountNumber, bankName, ifscCode } = form;
    if (!accountHolderName?.trim() || !accountNumber?.trim() || !bankName?.trim() || !ifscCode?.trim()) {
      alertErrorMessage('Please fill Account Holder, Account Number, Bank Name and IFSC');
      return;
    }
    if (ifscCode.trim().length !== 11) {
      alertErrorMessage('IFSC must be 11 characters');
      return;
    }
    setOtpLoading(true);
    const res = await AuthService.bettingBankAccountsSendOtp();
    setOtpLoading(false);
    if (res?.success) {
      alertSuccessMessage('OTP sent to your registered mobile');
      setOtpSent(true);
    } else {
      alertErrorMessage(res?.message || 'Failed to send OTP');
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    const { accountHolderName, accountNumber, bankName, branchName, ifscCode, otp } = form;
    if (!otp || otp.length !== 6) {
      alertErrorMessage('Enter 6-digit OTP');
      return;
    }
    setAddLoading(true);
    const res = await AuthService.bettingBankAccountsAdd({
      accountHolderName: accountHolderName?.trim(),
      accountNumber: accountNumber?.trim(),
      bankName: bankName?.trim(),
      branchName: branchName?.trim() || undefined,
      ifscCode: ifscCode?.trim(),
      otp,
    });
    setAddLoading(false);
    if (res?.success) {
      alertSuccessMessage('Bank account added successfully');
      setShowBankForm(false);
      setOtpSent(false);
      setForm({ accountHolderName: '', accountNumber: '', bankName: '', branchName: '', ifscCode: '', otp: '' });
      await fetchAccounts();
    } else {
      alertErrorMessage(res?.message || 'Failed to add account');
    }
  };

  return (
    <>
      <div className="new_add_account_page new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <h2>Add Account</h2>
            <p>Add up to 3 bank accounts. OTP will be sent to your registered mobile. Select one for withdrawal.</p>
          </div>
          <div className="payment_topbr">
            <button type="button" className="active">Bank</button>
          </div>

          <div className="choose_payment_option_bl">
            <h5>Your bank accounts</h5>
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
                    <button
                      type="button"
                      className="account_card_delete"
                      onClick={(e) => removeAccount(e, acc._id)}
                      aria-label="Remove account"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                    <div className="account_card_content">
                      <p className="account_card_bank">{acc.bankName}</p>
                      <p className="account_card_holder">{acc.accountHolderName}</p>
                      <p className="account_card_number">{maskAccountNumber(acc.accountNumber)}</p>
                      <p className="account_card_ifsc">IFSC: {acc.ifscCode}</p>
                      {acc.isDefaultForWithdrawal && (
                        <span className="account_card_default_badge">Use for withdrawal</span>
                      )}
                    </div>
                  </div>
                ))}
                {accounts.length < MAX_ACCOUNTS && (
                  <button type="button" className="account_card account_card_add" onClick={openBankForm}>
                    <span className="account_card_add_icon"><i className="ri-add-line" /></span>
                    <span className="account_card_add_text">Add Account</span>
                  </button>
                )}
              </div>
          </div>

          {showBankForm && (
            <div className="withdrawal_from_dl add_account_from_dl add_bank_details_section" ref={formRef}>
              <h5>Add bank details</h5>
              <p className="text-white-50 small">OTP will be sent to your registered mobile number.</p>
              <form onSubmit={handleAddAccount}>
                <div className="enter_amount_deposit">
                  <label>Account Holder Name</label>
                  <div className="enter_filed d-flex">
                    <input
                      type="text"
                      placeholder="Account Holder Name"
                      value={form.accountHolderName}
                      onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>Account Number</label>
                  <div className="enter_filed d-flex">
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={form.accountNumber}
                      onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>Bank Name</label>
                  <div className="enter_filed d-flex">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={form.bankName}
                      onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>Branch Name (optional)</label>
                  <div className="enter_filed d-flex">
                    <input
                      type="text"
                      placeholder="Branch Name"
                      value={form.branchName}
                      onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>IFSC Code (11 characters)</label>
                  <div className="enter_filed d-flex">
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={form.ifscCode}
                      onChange={(e) => setForm((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                      maxLength={11}
                    />
                  </div>
                </div>
                <div className="enter_amount_deposit">
                  <label>OTP (sent to your registered mobile)</label>
                  <div className="enter_filed d-flex">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={form.otp}
                      onChange={(e) => setForm((p) => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      maxLength={6}
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
                <div className="payment_btn d-flex justify-content-between gap-3">
                  <button type="submit" disabled={addLoading || !otpSent}>
                    {addLoading ? 'Adding...' : 'Add Account'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary ms-2 cancel_btn"
                    onClick={() => {
                      setShowBankForm(false);
                      setOtpSent(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="note_text">
            Select one account above to use for withdrawal requests. You can add up to 3 bank accounts and remove any time.
          </p>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default AddAccount;
