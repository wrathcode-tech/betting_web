import React from 'react'
import MobileMenu from '../customComponents/MobileMenu'
import './profileTransactions.css'
import Header from '../customComponents/Header'

function ProfileTransactions() {
    // Sample transaction data
    const transactions = [
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'KYC Pending',
            paymentMethod: 'Bank Transfer',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5,000',
            status: 'Approved',
            notes: 'Successful',
            paymentMethod: 'UPI',
        },
        {
            time: '2026-02-04 10:15 AM',
            id: 'TXN1001',
            type: 'Deposit',
            amount: '5,000',
            approvedAmount: '5000',
            status: 'Approved',
            notes: 'VIP User',
            paymentMethod: 'UPI',
        },
    ]

    return (
        <>
            <Header />
            <div className='dashboard_page'>
                <div className='container'>
                    <div className='profile_transactions_section'>
                        <div className='transactions_header'>
                            <h1>My Transactions</h1>
                            <div className='transactions_header_right'>
                                <div className='date_range_picker'>
                                    <div className='date_input_wrapper'>
                                        <input type="date" className='date_input' defaultValue="2025-05-30" />
                                        <i className="ri-arrow-down-s-line date_arrow"></i>
                                    </div>
                                    <div className='date_input_wrapper'>
                                        <input type="date" className='date_input' defaultValue="2025-06-13" />
                                        <i className="ri-arrow-down-s-line date_arrow"></i>
                                    </div>
                                </div>
                                <button className='btn deposit_btn'>
                                    Deposit
                                <i className="ri-arrow-down-s-line"></i>
                                </button>
                            </div>
                        </div>

                        <div className='transactions_table_wrapper'>
                            <table className='transactions_table'>
                                <thead>
                                    <tr>
                                        <th>Transaction Time</th>
                                        <th>Transaction ID</th>
                                        <th>Transaction Type</th>
                                        <th>Amount</th>
                                        <th>Approved Amount</th>
                                        <th>Transaction Status</th>
                                        <th>Notes</th>
                                        <th>Payment Method</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((transaction, index) => (
                                        <tr key={index}>
                                            <td>{transaction.time}</td>
                                            <td>{transaction.id}</td>
                                            <td>{transaction.type}</td>
                                            <td>{transaction.amount}</td>
                                            <td>{transaction.approvedAmount}</td>
                                            <td>
                                                <span>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td>{transaction.notes}</td>
                                            <td>{transaction.paymentMethod}</td>
                                            <td>
                                                <button className='view_btn'>View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className='transactions_cards_wrapper'>
                            {transactions.map((transaction, index) => (
                                <div key={index} className='transaction_card'>
                                    <div className='transaction_card_header'>
                                        <div className='transaction_card_title'>
                                            <h3>{transaction.type}</h3>
                                            <span className={`status_badge status_${transaction.status.toLowerCase()}`}>
                                                {transaction.status}
                                            </span>
                                        </div>
                                        <button className='view_btn'>View</button>
                                    </div>
                                    <div className='transaction_card_body'>
                                        <div className='transaction_card_row'>
                                            <span className='transaction_label'>Transaction Time</span>
                                            <span className='transaction_value'>{transaction.time}</span>
                                        </div>
                                        <div className='transaction_card_row'>
                                            <span className='transaction_label'>Transaction ID</span>
                                            <span className='transaction_value'>{transaction.id}</span>
                                        </div>
                                        <div className='transaction_card_row'>
                                            <span className='transaction_label'>Amount</span>
                                            <span className='transaction_value amount_value'>{transaction.amount}</span>
                                        </div>
                                        <div className='transaction_card_row'>
                                            <span className='transaction_label'>Approved Amount</span>
                                            <span className='transaction_value'>{transaction.approvedAmount}</span>
                                        </div>
                                        <div className='transaction_card_row'>
                                            <span className='transaction_label'>Payment Method</span>
                                            <span className='transaction_value'>{transaction.paymentMethod}</span>
                                        </div>
                                        <div className='transaction_card_row'>
                                            <span className='transaction_label'>Notes</span>
                                            <span className='transaction_value'>{transaction.notes}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <MobileMenu />
        </>
    )
}

export default ProfileTransactions
