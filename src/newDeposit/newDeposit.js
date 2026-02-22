import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../customComponents/Header';
import MobileMenu from '../customComponents/MobileMenu';
import '../customComponents/Deposit.css';
import './newDeposit.css';

function NewDeposit() {
  return (
    <>
      <Header />
      <div className="new_deposit_page">
        <div className="container">
                              <div className='top_bar_hd'>
                                <h2>Deposit</h2>
                                <p>Please select deposit method:</p>
                              </div>
                              <p className='bank'>Bank transfer offers the most reliable and efficient payment experience.</p>


<div className='payment_topbr'>
    <button className='active'>Bank (5% Bonus)</button>
    <button>UPI</button>
</div>

<div className='payment_selected_dl'>
    <ul>
        <li>
            <button>+500</button>
        </li>
        <li>
            <button>+1000</button>
        </li>
        <li>
            <button>+5000</button>
        </li>
        <li>
            <button>+10000</button>
        </li>
        <li>
            <button>+25000</button>
        </li>
        <li>
            <button>+50000</button>
        </li>
        <li>
            <button>+100000</button>
        </li>
        <li>
            <button>+500000</button>
        </li>
    </ul>
</div>

<p className='note_text'>Note : Please allow 30mins for deposit amount to credit, in case of any further delay reach out to customer care.</p>

<div className='enter_amount_deposit'>
    <h5>Enter Amount (INR)</h5>

<div className='enter_filed d-flex'>
    <input type='text' placeholder='Enter Amount To Be Deposited'></input>
    <button>Clear</button>
</div>


</div>




<div className='account_detail_payment'>
    <h3>Account Details </h3>


<ul>
    <li><span> Bank name</span>----</li>
    <li><span> Account Name</span>----</li>
    <li><span> Account Number</span>----</li>
    <li><span> IFSC Code</span>----</li>
</ul>

</div>


<div className='payment_btn'>
    <button>Next</button>
</div>


        </div>
      </div>
      <MobileMenu />
    </>
  );
}

export default NewDeposit;
