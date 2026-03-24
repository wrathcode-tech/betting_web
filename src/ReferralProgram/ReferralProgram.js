import React, { useEffect, useState, useCallback } from 'react'
import AuthService from '../api/services/AuthService'
import { ApiConfig } from '../api/apiConfig/apiConfig'
import LoaderHelper from '../customComponents/Loading/LoaderHelper'
import { alertErrorMessage, alertSuccessMessage } from '../customComponents/CustomAlertMessage'
import { useBalance } from '../context/BalanceContext'
import { usePlatformConfig } from '../context/PlatformConfigContext'
import MobileMenu from '../customComponents/MobileMenu'
import './ReferralProgram.css'

const REFERRALS_PAGE_SIZE = 20
const REWARDS_PAGE_SIZE = 20
const PROFIT_PAGE_SIZE = 20

function ReferralProgram() {
    const { setBalance } = useBalance()
    const { config: platformConfig } = usePlatformConfig()

    const [referralCode, setReferralCode] = useState('')
    const [referralLink, setReferralLink] = useState('')
    const [dashboard, setDashboard] = useState(null)
    const [balanceInfo, setBalanceInfo] = useState(null)
    const [referralList, setReferralList] = useState([])
    const [referralPagination, setReferralPagination] = useState({ page: 1, total: 0, totalPages: 0 })
    const [rewardsHistory, setRewardsHistory] = useState([])
    const [rewardsPagination, setRewardsPagination] = useState({ page: 1, totalPages: 0 })
    const [profitList, setProfitList] = useState([])
    const [profitPagination, setProfitPagination] = useState({ page: 1, totalPages: 0 })
    const [rewardsLive, setRewardsLive] = useState([])
    const [isClaiming, setIsClaiming] = useState(false)
    const [activeTab, setActiveTab] = useState('dashboard')

    const [referralSearchQuery, setReferralSearchQuery] = useState('')
    const [rewardSearchQuery, setRewardSearchQuery] = useState('')
    const [profitSearchQuery, setProfitSearchQuery] = useState('')
    const [referralFrom, setReferralFrom] = useState('')
    const [referralTo, setReferralTo] = useState('')
    const [rewardsFrom, setRewardsFrom] = useState('')
    const [rewardsTo, setRewardsTo] = useState('')

    const [applyCodeInput, setApplyCodeInput] = useState('')
    const [isApplying, setIsApplying] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        loadDashboard()
        loadBalance()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadRewardsHistory(1)
            loadProfit(1)
            loadRewardsLive()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    useEffect(() => {
        if (activeTab === 'referrals') loadReferralList(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    const loadDashboard = async () => {
        try {
            LoaderHelper.show()
            const res = await AuthService.referralDashboard()
            if (res?.success === false) {
                if (res?.message) alertErrorMessage(res.message)
                return
            }
            const data = res?.data ?? res
            if (data && typeof data === 'object') {
                setDashboard(data)
                const code = data.referralCode ?? data.referral_code ?? data.code ?? data.user_code ?? (balanceInfo?.referralCode ?? balanceInfo?.referral_code ?? '')
                setReferralCode(String(code || ''))
                const link = data.referralLink ?? data.referral_link
                if (link && typeof link === 'string' && link.trim()) {
                    setReferralLink(link.trim())
                } else {
                    const base = (typeof window !== 'undefined' && window.location?.origin) || ApiConfig.deployedUrl || ''
                    setReferralLink(base ? `${base.replace(/\/$/, '')}/signup?r=${encodeURIComponent(code || '')}` : '')
                }
            }
        } catch (e) {
            alertErrorMessage(e?.message || 'Failed to load referral dashboard.')
        } finally {
            LoaderHelper.hide()
        }
    }

    const loadBalance = useCallback(async () => {
        try {
            const res = await AuthService.referralBalance()
            const data = res?.data ?? res
            if (data && typeof data === 'object') {
                setBalanceInfo(data)
                if (!referralCode && (data.referralCode ?? data.referral_code ?? data.code)) {
                    const code = data.referralCode ?? data.referral_code ?? data.code ?? ''
                    setReferralCode(String(code))
                    const link = data.referralLink ?? data.referral_link
                    if (link && typeof link === 'string' && link.trim()) {
                        setReferralLink(link.trim())
                    } else {
                        const base = (typeof window !== 'undefined' && window.location?.origin) || ApiConfig.deployedUrl || ''
                        setReferralLink(base ? `${base.replace(/\/$/, '')}/signup?r=${encodeURIComponent(code)}` : '')
                    }
                }
            }
        } catch {
            setBalanceInfo(null)
        }
    }, [referralCode])

    const loadReferralList = async (page = 1) => {
        try {
            LoaderHelper.show()
            const params = { page, limit: REFERRALS_PAGE_SIZE }
            if (referralFrom) params.from = referralFrom
            if (referralTo) params.to = referralTo
            if (referralSearchQuery.trim()) params.search = referralSearchQuery.trim()
            const res = await AuthService.referralList(params)
            if (res?.success === false) {
                setReferralList([])
                setReferralPagination({ page: 1, total: 0, totalPages: 0 })
                if (res?.message) alertErrorMessage(res.message)
                return
            }
            const data = res?.data ?? res
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.referrals) ? data.referrals : Array.isArray(data) ? data : []
            setReferralList(list)
            const total = data?.total ?? data?.totalCount ?? data?.pagination?.totalRecords ?? list.length
            const totalPages = data?.totalPages ?? data?.pagination?.totalPages ?? Math.max(1, Math.ceil(Number(total) / REFERRALS_PAGE_SIZE))
            setReferralPagination({ page, total: Number(total) || 0, totalPages })
        } catch (e) {
            setReferralList([])
            setReferralPagination({ page: 1, total: 0, totalPages: 0 })
            if (e?.message) alertErrorMessage(e.message)
        } finally {
            LoaderHelper.hide()
        }
    }

    const loadRewardsHistory = async (page = 1) => {
        try {
            if (page === 1) LoaderHelper.show()
            const params = { page, limit: REWARDS_PAGE_SIZE }
            if (rewardsFrom) params.from = rewardsFrom
            if (rewardsTo) params.to = rewardsTo
            if (rewardSearchQuery.trim()) params.search = rewardSearchQuery.trim()
            const res = await AuthService.referralRewardsHistory(params)
            if (res?.success === false) {
                setRewardsHistory([])
                setRewardsPagination({ page: 1, total: 0, totalPages: 0 })
                if (res?.message) alertErrorMessage(res.message)
                return
            }
            const data = res?.data ?? res
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.rewards) ? data.rewards : Array.isArray(data) ? data : []
            setRewardsHistory(list)
            const pag = data?.pagination ?? data
            const total = pag?.totalRecords ?? data?.total ?? data?.totalCount ?? list.length
            const totalPages = pag?.totalPages ?? data?.totalPages ?? Math.max(1, Math.ceil(Number(total) / REWARDS_PAGE_SIZE))
            setRewardsPagination({ page, total: Number(total) || 0, totalPages })
        } catch (e) {
            setRewardsHistory([])
            setRewardsPagination({ page: 1, total: 0, totalPages: 0 })
            if (e?.message) alertErrorMessage(e.message)
        } finally {
            LoaderHelper.hide()
        }
    }

    const loadProfit = async (page = 1) => {
        try {
            if (page === 1) LoaderHelper.show()
            const params = { page, limit: PROFIT_PAGE_SIZE }
            if (profitSearchQuery.trim()) params.search = profitSearchQuery.trim()
            const res = await AuthService.referralProfit(params)
            if (res?.success === false) {
                setProfitList([])
                setProfitPagination({ page: 1, total: 0, totalPages: 0 })
                if (res?.message) alertErrorMessage(res.message)
                return
            }
            const data = res?.data ?? res
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.profit) ? data.profit : Array.isArray(data) ? data : []
            setProfitList(list)
            const total = data?.total ?? data?.totalCount ?? data?.pagination?.totalRecords ?? list.length
            const totalPages = data?.totalPages ?? data?.pagination?.totalPages ?? Math.max(1, Math.ceil(Number(total) / PROFIT_PAGE_SIZE))
            setProfitPagination({ page, total: Number(total) || 0, totalPages })
        } catch (e) {
            setProfitList([])
            setProfitPagination({ page: 1, total: 0, totalPages: 0 })
            if (e?.message) alertErrorMessage(e.message)
        } finally {
            LoaderHelper.hide()
        }
    }

    const loadRewardsLive = async () => {
        try {
            const res = await AuthService.referralRewardsLive(10)
            if (res?.success === false) return
            const data = res?.data ?? res
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.rewards) ? data.rewards : Array.isArray(data) ? data : []
            setRewardsLive(list)
        } catch {
            setRewardsLive([])
        }
    }

    const handleClaim = async () => {
        try {
            setIsClaiming(true)
            LoaderHelper.show()
            const res = await AuthService.referralClaim()
            if (res?.success !== false && !res?.message?.toLowerCase().includes('fail')) {
                alertSuccessMessage(res?.message || 'Amount claimed successfully.')
                const walletRes = await AuthService.bettingGetBalance()
                const bal = walletRes?.data?.balance ?? walletRes?.balance
                if (bal != null) setBalance(bal)
                await loadBalance()
                loadDashboard()
            } else {
                alertErrorMessage(res?.message || 'Unable to claim.')
            }
        } catch (e) {
            alertErrorMessage(e?.message || 'Something went wrong while claiming.')
        } finally {
            setIsClaiming(false)
            LoaderHelper.hide()
        }
    }

    const handleExport = async () => {
        try {
            setIsExporting(true)
            LoaderHelper.show()
            const params = {}
            if (referralFrom) params.from = referralFrom
            if (referralTo) params.to = referralTo
            const res = await AuthService.referralExport(params)
            if (res?.success === false) {
                alertErrorMessage(res?.message || 'Export failed.')
                return
            }
            const raw = res?.data ?? res
            const blob = raw?.data ?? raw?.csv ?? raw
            if (blob instanceof Blob) {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `referrals_export_${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                URL.revokeObjectURL(url)
                alertSuccessMessage('Export downloaded.')
            } else if (typeof blob === 'string' && blob.length > 0) {
                const a = document.createElement('a')
                a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(blob)
                a.download = `referrals_export_${new Date().toISOString().slice(0, 10)}.csv`
                a.click()
                alertSuccessMessage('Export downloaded.')
            } else {
                alertErrorMessage('Export format not supported.')
            }
        } catch (e) {
            alertErrorMessage(e?.message || 'Failed to export.')
        } finally {
            setIsExporting(false)
            LoaderHelper.hide()
        }
    }

    const handleApplyCode = async () => {
        const code = String(applyCodeInput || '').trim()
        if (!code) {
            alertErrorMessage('Please enter a referral code.')
            return
        }
        if (code.length !== 8 || !/^[A-Za-z0-9]+$/.test(code)) {
            alertErrorMessage('Referral code must be exactly 8 characters (letters and numbers only).')
            return
        }
        try {
            setIsApplying(true)
            LoaderHelper.show()
            const res = await AuthService.referralApply(code)
            if (res?.success !== false && !res?.message?.toLowerCase().includes('fail')) {
                alertSuccessMessage(res?.message || 'Referral code applied successfully.')
                setApplyCodeInput('')
                loadDashboard()
                loadBalance()
            } else {
                alertErrorMessage(res?.message || 'Could not apply referral code.')
            }
        } catch (e) {
            alertErrorMessage(e?.message || 'Something went wrong.')
        } finally {
            setIsApplying(false)
            LoaderHelper.hide()
        }
    }

    const copyToClipboard = async (text, successMsg, errorMsg) => {
        try {
            if (!text) return
            if (window?.navigator?.clipboard?.writeText) {
                await window.navigator.clipboard.writeText(text)
            } else {
                const ta = document.createElement('textarea')
                ta.value = text
                ta.setAttribute('readonly', '')
                ta.style.position = 'fixed'
                ta.style.opacity = '0'
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
            }
            alertSuccessMessage(successMsg)
        } catch {
            alertErrorMessage(errorMsg)
        }
    }

    const availableBalance = balanceInfo?.available ?? balanceInfo?.availableBalance ?? dashboard?.balance?.available ?? 0
    const lockedBalance = balanceInfo?.locked ?? balanceInfo?.lockedBalance ?? dashboard?.balance?.locked ?? 0
    const totalClaimed = balanceInfo?.totalClaimed ?? balanceInfo?.total_claimed ?? 0
    const minClaim = balanceInfo?.minClaim ?? balanceInfo?.min_claim ?? dashboard?.minClaimAmount ?? dashboard?.min_claim_amount ?? 0
    const totalProfit = dashboard?.totalProfit ?? dashboard?.total_profit ?? 0
    const totalReferrals = dashboard?.totalReferrals ?? dashboard?.total_referrals ?? referralPagination?.total ?? (referralList?.length ?? 0)

    const filteredReferralList = referralList

    const filteredRewardsHistory = rewardsHistory
    const filteredProfitList = profitList

    const formatDate = (val) => {
        if (!val) return '—'
        try {
            const d = new Date(val)
            return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        } catch {
            return String(val)
        }
    }

    return (
        <>
            <div className="dashboard_page removebgsports">
                <div className="container-fluid">
                    {!platformConfig.referralServiceStatus && (
                        <div className="platform_service_banner platform_service_banner_disabled" role="alert">
                            Referral program is temporarily unavailable. Please try again later.
                        </div>
                    )}
                    <div className="profile_transactions_section referral_program_section">
                        <div className="transactions_header referral_header">
                            <h1>Referral Program</h1>
                            <div className="referral_program_tabs">
                                <button
                                    type="button"
                                    className={activeTab === 'dashboard' ? 'active' : ''}
                                    onClick={() => setActiveTab('dashboard')}
                                >
                                    Dashboard
                                </button>
                                <button
                                    type="button"
                                    className={activeTab === 'referrals' ? 'active' : ''}
                                    onClick={() => setActiveTab('referrals')}
                                >
                                    Referrals
                                </button>
                            </div>
                        </div>

                        {activeTab === 'dashboard' && (
                            <div className="referral_dashboard_content">
                                <div className="referral_stats_row">
                                    <div className="referral_stat_card">
                                        <div className="referral_stat_icon">
                                            <img src="/images/total_profit.svg" loading="lazy" alt="" />
                                        </div>
                                        <div className="referral_stat_body">
                                            <span className="referral_stat_label">Total Profit</span>
                                            <span className="referral_stat_value">₹ {Number(totalProfit) > 0 ? Number(totalProfit).toFixed(2) : '0.00'}</span>
                                        </div>
                                    </div>
                                    <div className="referral_stat_card">
                                        <div className="referral_stat_icon">
                                            <img src="/images/total_referrals.svg" loading="lazy" alt="" />
                                        </div>
                                        <div className="referral_stat_body">
                                            <span className="referral_stat_label">Total Referrals</span>
                                            <span className="referral_stat_value">{totalReferrals}</span>
                                        </div>
                                    </div>
                                    <div className="referral_invite_card">
                                        <h3>Invite & Earn</h3>
                                        <ul>
                                            <li><i class="ri-star-fill"></i> Your friend gets a bonus when they join</li>
                                            <li><i class="ri-star-fill"></i> Earn commission on every game your friends play</li>
                                        </ul>
                                        <div class="notification_icon"><img alt="notification" width="24" height="24" decoding="async" src="images/notification_icon.png" /></div>
                                    </div>

                                </div>

                                <div className="referral_link_section">
                                    <h4>My Referral Code</h4>
                                    <div className="referral_link_grid">
                                        <div className="referral_link_item">
                                            <label>Web Referral link</label>
                                            <div className="referral_link_input_wrap">
                                                <input type="text" value={referralLink} readOnly />
                                                <button type="button" className="referral_btn_copy" onClick={() => copyToClipboard(referralLink, 'Link copied', 'Failed to copy')}>Copy</button>
                                            </div>
                                        </div>
                                        <div className="referral_link_item">
                                            <label>Your referral code</label>
                                            <div className="referral_link_input_wrap">
                                                <input type="text" value={referralCode} readOnly />
                                                <button type="button" className="referral_btn_copy" onClick={() => copyToClipboard(referralCode, 'Code copied', 'Failed to copy')}>Copy</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="referral_balance_card">
                                    <div className="referral_balance_info">
                                        <span className="referral_balance_label">Available Commission</span>
                                        <span className="referral_balance_value">₹ {Number(availableBalance) > 0 ? Number(availableBalance).toFixed(2) : '0.00'}</span>
                                        {(lockedBalance > 0 || totalClaimed > 0) && (
                                            <div className="referral_balance_extra">
                                                {Number(lockedBalance) > 0 && <span>Locked: ₹ {Number(lockedBalance).toFixed(2)}</span>}
                                                {Number(totalClaimed) > 0 && <span>Total Claimed: ₹ {Number(totalClaimed).toFixed(2)}</span>}
                                            </div>
                                        )}
                                        {Number(minClaim) > 0 && <span className="referral_min_claim">Min claim: ₹ {Number(minClaim).toFixed(2)}</span>}
                                    </div>
                                    <button
                                        type="button"
                                        className="referral_btn_claim"
                                        onClick={handleClaim}
                                        disabled={Number(availableBalance) <= 0 || (Number(minClaim) > 0 && Number(availableBalance) < Number(minClaim)) || isClaiming}
                                    >
                                        {isClaiming ? 'Claiming...' : 'Claim Now'}
                                    </button>
                                </div>

                                <div className="referral_apply_section">
                                    <h4>Apply Referral Code</h4>
                                    <div className="referral_apply_row">
                                        <input
                                            type="text"
                                            placeholder="Enter referral code"
                                            value={applyCodeInput}
                                            onChange={(e) => setApplyCodeInput(e.target.value)}
                                            className="referral_apply_input"
                                        />
                                        <button type="button" className="referral_btn_apply" onClick={handleApplyCode} disabled={isApplying}>
                                            {isApplying ? 'Applying...' : 'Apply'}
                                        </button>
                                    </div>
                                </div>

                                {rewardsLive.length > 0 && (
                                    <div className="referral_table_block referral_live_block">
                                        <h3>Live Rewards</h3>
                                        <div className="referral_live_list">
                                            {rewardsLive.slice(0, 10).map((row, idx) => (
                                                <div key={row?.id ?? row?._id ?? idx} className="referral_live_item">
                                                    <span className="text_uppercase">{row?.userId?.fullName ?? row?.userName ?? '—'}</span>
                                                    <span>₹ {row?.amount ?? row?.commissionAmount ?? '0'}</span>
                                                    <span>{formatDate(row?.createdAt ?? row?.created_at)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="referral_table_block">
                                    <div className="transactions_header align-items-center">
                                        <h3>Recent Commission / Profit</h3>
                                        <div className="referral_filters_row">
                                            <input
                                                type="text"
                                                className="transactions_search_input"
                                                placeholder="Search by name..."
                                                value={profitSearchQuery}
                                                onChange={(e) => setProfitSearchQuery(e.target.value)}
                                            />
                                            <button type="button" className="referral_btn_filter" onClick={() => loadProfit(1)}>Search</button>
                                        </div>
                                    </div>
                                    <div className={`referral_table_wrap ${filteredProfitList.length === 0 ? 'no-data' : ''}`}>
                                        <table className="referral_table">
                                            <thead>
                                                <tr><th>#</th><th>Name</th><th>Amount</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredProfitList.length === 0 && <tr><td colSpan={3}>No data</td></tr>}
                                                {filteredProfitList.map((row, idx) => (
                                                    <tr key={row?.id ?? row?._id ?? idx}>
                                                        <td>{(profitPagination.page - 1) * PROFIT_PAGE_SIZE + idx + 1}</td>
                                                        <td className="text_uppercase">{row?.name ?? row?.username ?? row?.userId?.fullName ?? row?.fullName ?? '—'}</td>
                                                        <td>₹ {row?.amount ?? row?.totalProfit ?? row?.profit ?? row?.commissionAmount ?? '0'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {profitPagination.totalPages > 1 && (
                                        <div className="referral_pagination">
                                            <button type="button" disabled={profitPagination.page <= 1} onClick={() => loadProfit(profitPagination.page - 1)}>Prev</button>
                                            <span>Page {profitPagination.page} of {profitPagination.totalPages}</span>
                                            <button type="button" disabled={profitPagination.page >= profitPagination.totalPages} onClick={() => loadProfit(profitPagination.page + 1)}>Next</button>
                                        </div>
                                    )}
                                </div>

                                <div className="referral_table_block">
                                    <div className="transactions_header align-items-center">
                                        <h3>Rewards History</h3>
                                        <div className="referral_filters_row history_filters_row">
                                            <input type="date" value={rewardsFrom} onChange={(e) => setRewardsFrom(e.target.value)} className="referral_date_input" placeholder="From" />
                                            <input type="date" value={rewardsTo} onChange={(e) => setRewardsTo(e.target.value)} className="referral_date_input" placeholder="To" />
                                            <button type="button" className="referral_btn_filter" onClick={() => loadRewardsHistory(1)}>Apply</button>
                                            <input
                                                type="text"
                                                className="transactions_search_input"
                                                placeholder="Search..."
                                                value={rewardSearchQuery}
                                                onChange={(e) => setRewardSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className={`referral_table_wrap ${filteredRewardsHistory.length === 0 ? 'no-data' : ''}`}>
                                        <table className="referral_table">
                                            <thead>
                                                <tr><th>#</th><th>Date</th><th>User</th><th>Amount</th><th>Status</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredRewardsHistory.length === 0 && <tr><td colSpan={5}>No data</td></tr>}
                                                {filteredRewardsHistory.map((row, idx) => (
                                                    <tr key={row?.id ?? row?._id ?? idx}>
                                                        <td>{(rewardsPagination.page - 1) * REWARDS_PAGE_SIZE + idx + 1}</td>
                                                        <td>{formatDate(row?.date ?? row?.createdAt ?? row?.created_at)}</td>
                                                        <td className="text_uppercase">{row?.user ?? row?.username ?? row?.userId?.fullName ?? row?.userName ?? '—'}</td>
                                                        <td>₹ {row?.amount ?? row?.bonusAmount ?? row?.commissionAmount ?? '0'}</td>
                                                        <td>{row?.status ?? '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {rewardsPagination.totalPages > 1 && (
                                        <div className="referral_pagination">
                                            <button type="button" disabled={rewardsPagination.page <= 1} onClick={() => loadRewardsHistory(rewardsPagination.page - 1)}>Prev</button>
                                            <span>Page {rewardsPagination.page} of {rewardsPagination.totalPages}</span>
                                            <button type="button" disabled={rewardsPagination.page >= rewardsPagination.totalPages} onClick={() => loadRewardsHistory(rewardsPagination.page + 1)}>Next</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'referrals' && (
                            <div className="referral_referrals_content">
                                <div className="transactions_header align-items-center">
                                    <h3>Referrals History</h3>
                                    <div className="referral_filters_row referrals_filters_row_his">
                                        <input type="date" value={referralFrom} onChange={(e) => setReferralFrom(e.target.value)} className="referral_date_input" placeholder="From" />
                                        <input type="date" value={referralTo} onChange={(e) => setReferralTo(e.target.value)} className="referral_date_input" placeholder="To" />
                                      <div className="referral_filters_row_buttons d-flex align-items-center gap-2">
                                        <button type="button" className="referral_btn_filter" onClick={() => loadReferralList(1)}>Apply</button>
                                        <button type="button" className="referral_btn_export" onClick={handleExport} disabled={isExporting}>
                                            {isExporting ? 'Exporting...' : <><i className="ri-download-2-line" aria-hidden /> CSV</>}
                                        </button>
                                        </div>
                                        <input
                                            type="text"
                                            className="transactions_search_input w-100_inmobile"
                                            placeholder="Search by name, mobile..."
                                            value={referralSearchQuery}
                                            onChange={(e) => setReferralSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className={`referral_table_wrap ${filteredReferralList.length === 0 ? 'no-data' : ''}`}>
                                    <table className="referral_table">
                                        <thead>
                                            <tr><th>#</th><th>Date & Time</th><th>User Name</th><th>Mobile</th><th>Status</th><th>Total Earnings</th></tr>
                                        </thead>
                                        <tbody>
                                            {filteredReferralList.length === 0 && <tr><td colSpan={6}>No referrals yet</td></tr>}
                                            {filteredReferralList.map((row, idx) => {
                                                const user = row?.user ?? row
                                                const dateTime = row?.dateTime ?? row?.joinedAt ?? user?.createdAt ?? user?.created_at ?? row?.createdAt
                                                const userName = row?.userName ?? user?.fullName ?? user?.full_name ?? '—'
                                                const mobile = row?.mobile ?? user?.mobile ?? user?.mobileNumber ?? '—'
                                                const totalEarnings = row?.totalEarnings ?? row?.total_earnings ?? '—'
                                                const status = row?.status ?? '—'
                                                return (
                                                    <tr key={row?.id ?? row?._id ?? idx}>
                                                        <td data-label="#">{(referralPagination.page - 1) * REFERRALS_PAGE_SIZE + idx + 1}</td>
                                                        <td data-label="Date & Time">{formatDate(dateTime)}</td>
                                                        <td data-label="User Name" className="text_uppercase">{userName}</td>
                                                        <td data-label="Mobile">{mobile}</td>
                                                        <td data-label="Status">{status}</td>
                                                        <td data-label="Total Earnings">{typeof totalEarnings === 'number' ? `₹ ${Number(totalEarnings).toFixed(2)}` : totalEarnings}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {referralPagination.totalPages > 1 && (
                                    <div className="referral_pagination">
                                        <button type="button" disabled={referralPagination.page <= 1} onClick={() => loadReferralList(referralPagination.page - 1)}>Prev</button>
                                        <span>Page {referralPagination.page} of {referralPagination.totalPages}</span>
                                        <button type="button" disabled={referralPagination.page >= referralPagination.totalPages} onClick={() => loadReferralList(referralPagination.page + 1)}>Next</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <MobileMenu />
        </>
    )
}

export default ReferralProgram
