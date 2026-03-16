import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MobileMenu from '../customComponents/MobileMenu';
import '../newDeposit/NewDeposit.css';
import './AddAccount.css';

const HAS_BANK_ACCOUNT_KEY = 'user_has_bank_account';
const SAVED_BANK_DETAILS_KEY = 'saved_bank_details';

function getBanksList() {
  try {
    const s = localStorage.getItem(SAVED_BANK_DETAILS_KEY);
    if (!s) return [];
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && (parsed.bankName || parsed.accountNumber || parsed.ifscCode)) {
      return [{ ...parsed, id: 1 }];
    }
    return [];
  } catch {
    return [];
  }
}

function saveBanksList(banks) {
  localStorage.setItem(SAVED_BANK_DETAILS_KEY, JSON.stringify(banks));
  localStorage.setItem(HAS_BANK_ACCOUNT_KEY, banks.length ? 'true' : '');
}

function AddBank() {
  const navigate = useNavigate();
  const accountNumberRef = useRef(null);
  const accountHolderNameRef = useRef(null);
  const bankNameRef = useRef(null);
  const branchNameRef = useRef(null);
  const ifscRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const details = {
      id: Date.now(),
      accountNumber: accountNumberRef.current?.value?.trim() ?? '',
      accountHolderName: accountHolderNameRef.current?.value?.trim() ?? '',
      bankName: bankNameRef.current?.value?.trim() ?? '',
      branchName: branchNameRef.current?.value?.trim() ?? '',
      ifscCode: ifscRef.current?.value?.trim() ?? '',
    };
    const banks = getBanksList();
    const next = [...banks, details];
    saveBanksList(next);
    navigate('/add-account', { replace: true });
  };

  return (
    <>
      <div className="new_add_account_page new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <div className="d-flex align-items-center gap-2">
              <Link to="/add-account" className="back_link_btn" aria-label="Back to Bank Details">
                <i className="ri-arrow-left-s-line" />
              </Link>
              <div>
                <h2>Add Bank</h2>
                <p>Enter your bank account details.</p>
              </div>
            </div>
          </div>

          <div className="withdrawal_from_dl add_account_from_dl add_bank_details_section">
            <form onSubmit={handleSubmit}>
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
                <label>IFSC Code</label>
                <div className="enter_filed d-flex">
                  <input ref={ifscRef} type="text" placeholder="IFSC Code" />
                </div>
              </div>
              <div className="payment_btn">
                <button type="submit">Add Bank</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default AddBank;
