import React, { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import DateFilter from '../customComponents/DateFilter'
import '../ProfileTransactions/profileTransactions.css'

const PAGE_SIZE = 10

/** CSV cell: comma/quotes escape */
function csvEscape(val) {
  const s = val == null ? '' : String(val).trim()
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function exportToCSV(columns, data, filename = 'export') {
  const headers = columns.map((c) => c.label)
  const rows = data.map((row) => columns.map((col) => csvEscape(row[col.key])))
  const headerLine = headers.map(csvEscape).join(',')
  const dataLines = rows.map((r) => r.join(','))
  const csv = [headerLine, ...dataLines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportToPDF(columns, data, title, filename = 'export') {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text(title, 14, 15)
  const headers = columns.map((c) => c.label)
  const rows = data.map((row) => columns.map((col) => (row[col.key] != null ? String(row[col.key]) : '')))
  autoTable(doc, {
    startY: 22,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [53, 60, 69] },
  })
  doc.save(`${filename}.pdf`)
}

/** Row ke date cell se YYYY-MM-DD nikalo; parse fail ho to null */
function parseDateToYYYYMMDD(cell) {
  if (cell == null || String(cell).trim() === '') return null
  const str = String(cell).trim()
  const ddmmyy = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  const ddmmyyDash = str.match(/(\d{1,2})-(\d{1,2})-(\d{4})/)
  const yymmdd = str.match(/(\d{4})-(\d{2})-(\d{2})/)
  let y, m, day
  if (ddmmyy) {
    y = parseInt(ddmmyy[3], 10)
    m = parseInt(ddmmyy[2], 10)
    day = parseInt(ddmmyy[1], 10)
  } else if (ddmmyyDash) {
    y = parseInt(ddmmyyDash[3], 10)
    m = parseInt(ddmmyyDash[2], 10)
    day = parseInt(ddmmyyDash[1], 10)
  } else if (yymmdd) {
    y = parseInt(yymmdd[1], 10)
    m = parseInt(yymmdd[2], 10)
    day = parseInt(yymmdd[3], 10)
  } else {
    const d = new Date(str)
    if (Number.isNaN(d.getTime())) return null
    y = d.getFullYear()
    m = d.getMonth() + 1
    day = d.getDate()
  }
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(day) || m < 1 || m > 12 || day < 1 || day > 31) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function StatementPage({ title, columns, data, emptyMessage = 'No data to display.', filterColumnKey, dateColumnKey, enableExport = false, exportFileName = 'statement' }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [filterValue, setFilterValue] = useState('all')
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const exportDropdownRef = useRef(null)

  useEffect(() => {
    if (!exportDropdownOpen) return
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) setExportDropdownOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [exportDropdownOpen])

  const searchLower = (search || '').trim().toLowerCase()

  const resolvedDateColumnKey = dateColumnKey || columns.find((c) => c.key === 'date' || c.key === 'dateTime' || c.key === 'time')?.key || 'date'

  const uniqueFilterOptions = useMemo(() => {
    if (!filterColumnKey || !data.length) return []
    const set = new Set()
    data.forEach((row) => {
      const v = row[filterColumnKey]
      if (v != null && String(v).trim() !== '') set.add(String(v).trim())
    })
    return Array.from(set).sort()
  }, [data, filterColumnKey])

  const handleApplyDate = useCallback((from, to) => {
    setAppliedFromDate(from || '')
    setAppliedToDate(to || '')
    setPage(1)
  }, [])

  const filtered = useMemo(() => {
    let list = data
    if (searchLower) {
      list = list.filter((row) =>
        columns.some((col) => {
          const val = row[col.key]
          if (val == null) return false
          return String(val).toLowerCase().includes(searchLower)
        })
      )
    }
    if (filterColumnKey && filterValue !== 'all') {
      list = list.filter((row) => String(row[filterColumnKey] || '').trim() === filterValue)
    }
    if (appliedFromDate || appliedToDate) {
      const dateKey = resolvedDateColumnKey
      list = list.filter((row) => {
        const cell = row[dateKey]
        const rowDateOnly = parseDateToYYYYMMDD(cell)
        if (rowDateOnly == null) return false
        if (appliedFromDate && rowDateOnly < appliedFromDate) return false
        if (appliedToDate && rowDateOnly > appliedToDate) return false
        return true
      })
    }
    return list
  }, [data, columns, searchLower, filterColumnKey, filterValue, appliedFromDate, appliedToDate, resolvedDateColumnKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageData = useMemo(() => filtered.slice(start, start + PAGE_SIZE), [filtered, start])

  const handleExportCSV = useCallback(() => {
    exportToCSV(columns, filtered, exportFileName)
    setExportDropdownOpen(false)
  }, [columns, filtered, exportFileName])

  const handleExportPDF = useCallback(() => {
    exportToPDF(columns, filtered, title, exportFileName)
    setExportDropdownOpen(false)
  }, [columns, filtered, title, exportFileName])

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="container-fluid">
          <div className="profile_transactions_section">
            <div className="transactions_header">
              <h1>{title}</h1>
              <div className="transactions_header_right">
                <input
                  type="text"
                  placeholder="Search..."
                  className="transactions_search_input"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  aria-label="Search"
                />
                <DateFilter
                  fromDate={fromDate}
                  toDate={toDate}
                  onFromDateChange={setFromDate}
                  onToDateChange={setToDate}
                  onApply={handleApplyDate}
                  showWrapper={true}
                />
                {filterColumnKey && (
                  <select
                    className="transactions_filter_select deposit_btn_style"
                    value={filterValue}
                    onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
                    aria-label="Filter"
                  >
                    <option value="all">All</option>
                    {uniqueFilterOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {!filterColumnKey && (
                  <select className="transactions_filter_select deposit_btn_style" value="all" aria-label="Filter">
                    <option value="all">All</option>
                  </select>
                )}
                {enableExport && (
                  <div className="export_dropdown_wrapper" ref={exportDropdownRef}>
                    <button
                      type="button"
                      className="deposit_btn_style btn_export"
                      onClick={() => setExportDropdownOpen((o) => !o)}
                      disabled={filtered.length === 0}
                      aria-label="Export"
                      aria-expanded={exportDropdownOpen}
                      aria-haspopup="true"
                    >
                      Export
                      <i className={`ri-arrow-${exportDropdownOpen ? 'up' : 'down'}-s-line export_dropdown_arrow`} aria-hidden />
                    </button>
                    {exportDropdownOpen && (
                      <div className="export_dropdown_menu" role="menu">
                        <button type="button" className="export_dropdown_item" role="menuitem" onClick={handleExportCSV}>
                          Download CSV
                        </button>
                        <button type="button" className="export_dropdown_item" role="menuitem" onClick={handleExportPDF}>
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {data.length === 0 ? (
              <p className="text-white-50">{emptyMessage}</p>
            ) : pageData.length === 0 ? (
              <p className="text-white-50">
                {(appliedFromDate || appliedToDate) ? 'No data in selected date range. Try different dates or clear From/To and Apply.' : 'No matches for your search.'}
              </p>
            ) : (
              <>
                <div className="transactions_table_wrapper">
                  <table className="transactions_table">
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th key={col.key}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((row) => (
                        <tr key={row.id}>
                          {columns.map((col) => {
                            const val = row[col.key]
                            const isStatus = col.type === 'status'
                            const isAmount = col.type === 'amount'
                            return (
                              <td key={col.key}>
                                {isStatus && row.statusRaw != null ? (
                                  <span className={`status_badge status_${String(row.statusRaw).toLowerCase()}`}>
                                    {val}
                                  </span>
                                ) : isAmount ? (
                                  <span className="transaction_value amount_value">{val}</span>
                                ) : (
                                  val
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="transactions_cards_wrapper">
                  {pageData.map((row) => (
                    <div key={row.id} className="transaction_card">
                      <div className="transaction_card_header">
                        <div className="transaction_card_title">
                          <h3>{row.cardTitle != null ? row.cardTitle : row[columns[0]?.key]}</h3>
                          {row.statusRaw != null && (
                            <span className={`status_badge status_${String(row.statusRaw).toLowerCase()}`}>
                              {row[columns.find((c) => c.type === 'status')?.key]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="transaction_card_body">
                        {columns.map((col) => (
                          <div key={col.key} className="transaction_card_row">
                            <span className="transaction_label">{col.label}</span>
                            <span className={col.type === 'amount' ? 'transaction_value amount_value' : 'transaction_value'}>
                              {row[col.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="transactions_pagination">
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="pagination_info">
                    Page {currentPage} of {totalPages} ({filtered.length} total)
                  </span>
                  <button
                    type="button"
                    className="pagination_btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default memo(StatementPage)
