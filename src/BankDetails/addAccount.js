import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MobileMenu from '../customComponents/MobileMenu';
import '../newDeposit/newDeposit.css';
import './addAccount.css';

const HAS_BANK_ACCOUNT_KEY = 'user_has_bank_account';
export const SAVED_BANK_DETAILS_KEY = 'saved_bank_details';

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

function maskAccountNumber(num) {
  if (!num || num.length < 4) return '****';
  return '****' + num.slice(-4);
}

function AddAccount() {
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    setBanks(getBanksList());
  }, []);

  const removeBank = (id) => {
    const next = banks.filter((b) => b.id !== id);
    setBanks(next);
    saveBanksList(next);
  };

  const copyDetail = (text) => {
    if (text && text !== '—') navigator.clipboard.writeText(String(text)).catch(() => {});
  };

  return (
    <>
      <div className="new_add_account_page new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <h2>Bank Details</h2>
            <p>Manage your saved bank accounts for deposit and withdrawal.</p>
          </div>

          <div className="bank_list_section">
            <div className="bank_list_header d-flex align-items-center justify-content-between">
              <h5>Your saved banks</h5>
              <Link to="/add-bank" className="add_bank_btn_header">
                <i className="ri-add-line" aria-hidden />
                Add Bank
              </Link>
            </div>

            {banks.length === 0 ? (
              <div className="bank_list_empty">
                <p>No bank account added yet.</p>
                <Link to="/add-bank" className="add_bank_btn">
                  Add Bank
                </Link>
              </div>
            ) : (
              <ul className="bank_list">
                {banks.map((bank) => (
                  <li key={bank.id} className="bank_list_item">
                    <div className="bank_list_item_content">
                      <div className="bank_list_item_main">
                        <div className="bank_list_detail_row">
                          <span className="bank_list_detail_label">Bank</span>
                          <div className="bank_list_detail_value_wrap">
                            <span className="bank_list_detail_value">{bank.bankName || '—'}</span>
                            <button type="button" className="bank_list_detail_copy" onClick={() => copyDetail(bank.bankName)} aria-label="Copy bank name" title="Copy"><i className="ri-file-copy-line" /></button>
                          </div>
                        </div>
                        <div className="bank_list_detail_row">
                          <span className="bank_list_detail_label">Account Holder</span>
                          <div className="bank_list_detail_value_wrap">
                            <span className="bank_list_detail_value">{bank.accountHolderName || '—'}</span>
                            <button type="button" className="bank_list_detail_copy" onClick={() => copyDetail(bank.accountHolderName)} aria-label="Copy account holder" title="Copy"><i className="ri-file-copy-line" /></button>
                          </div>
                        </div>
                        <div className="bank_list_detail_row">
                          <span className="bank_list_detail_label">Account Number</span>
                          <div className="bank_list_detail_value_wrap">
                            <span className="bank_list_detail_value">{bank.accountNumber ? maskAccountNumber(bank.accountNumber) : '—'}</span>
                            <button type="button" className="bank_list_detail_copy" onClick={() => copyDetail(bank.accountNumber)} aria-label="Copy account number" title="Copy"><i className="ri-file-copy-line" /></button>
                          </div>
                        </div>
                        <div className="bank_list_detail_row">
                          <span className="bank_list_detail_label">IFSC</span>
                          <div className="bank_list_detail_value_wrap">
                            <span className="bank_list_detail_value">{bank.ifscCode || '—'}</span>
                            <button type="button" className="bank_list_detail_copy" onClick={() => copyDetail(bank.ifscCode)} aria-label="Copy IFSC" title="Copy"><i className="ri-file-copy-line" /></button>
                          </div>
                        </div>
                        {bank.branchName && (
                          <div className="bank_list_detail_row">
                            <span className="bank_list_detail_label">Branch</span>
                            <div className="bank_list_detail_value_wrap">
                              <span className="bank_list_detail_value">{bank.branchName}</span>
                              <button type="button" className="bank_list_detail_copy" onClick={() => copyDetail(bank.branchName)} aria-label="Copy branch" title="Copy"><i className="ri-file-copy-line" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="bank_list_item_actions">
                        <button
                          type="button"
                          className="bank_list_item_remove"
                          onClick={() => removeBank(bank.id)}
                          aria-label="Remove bank"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default AddAccount;
