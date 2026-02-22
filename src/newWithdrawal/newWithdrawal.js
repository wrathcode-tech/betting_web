import React, { useRef, useState } from 'react';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import '../newDeposit/newDeposit.css';
import './newWithdrawal.css';

function NewWithdrawal() {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Header />
      <div className="new_withdrawal_page new_deposit_page">
        <div className="container">
          <div className="top_bar_hd">
            <h2>Withdrawal</h2>
            <p>following payment withdrawal information:: <span>Cashable Amount : 0</span></p>
          </div>

       
          <div className="payment_topbr">
            <button type="button" className="active">Bank</button>
          </div>

          <div className="choose_payment_option">
            <h3 className="choose_payment_option_title">Choose Payment Option</h3>
            <div
              className={`add_account_upload ${isDragging ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="add_account_file_input"
                aria-label="Add account document"
              />
              <div className="add_account_icon_wrap">
                <i className="ri-add-line add_account_plus_icon" aria-hidden />
              </div>
              <span className="add_account_label">Add Account</span>
            </div>
            {selectedFiles.length > 0 && (
              <ul className="add_account_file_list">
                {selectedFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    <span className="add_account_file_name">{file.name}</span>
                    <button type="button" className="add_account_remove_btn" onClick={(e) => { e.stopPropagation(); removeFile(index); }} aria-label="Remove file">
                      <i className="ri-close-line" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

<div className='withdrawal_from_dl'>

          <h5>Enter Details</h5>

          <div className="enter_amount_deposit">
        <label>Account Number</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Enter Amount To Be Withdrawn" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>Account Holder Name</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Account Holder Name" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>Bank Name</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Bank Name" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>Branch Name</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="Branch Name" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>IFSC Number</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="IFSC Number" />
            </div>
          </div>

          <div className="enter_amount_deposit">
        <label>OTP</label>
            <div className="enter_filed d-flex">
              <input type="text" placeholder="OTP" />
              <button className='otp_btn' type="button">OTP</button>
            </div>
          </div>

          <div className="payment_btn">
            <button type="button">ADD</button>
          </div>

          </div>


        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewWithdrawal;
