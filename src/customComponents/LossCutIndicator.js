import React, { useState } from 'react'
import './LossCutIndicator.css'

const MAX_LOSS_LIMIT = 500000 // ₹5 lakh max per API

/**
 * Loss Cut indicator – shows current loss vs daily loss limit (GET/PUT /loss-limit).
 * @param {number|null} currentLoss - Current loss amount (from exposure or API)
 * @param {number|null} lossLimit - Daily loss limit from API (data.dailyLossLimit); null = not set
 * @param {boolean} compact - Smaller layout for betslip
 * @param {function} onSetLimit - Optional. (amount | null) => Promise. amount 0–500000 or null to remove limit.
 */
export default function LossCutIndicator({ currentLoss = 0, lossLimit = null, compact = false, onSetLimit }) {
  const limit = lossLimit != null && Number(lossLimit) >= 0 ? Number(lossLimit) : null
  const loss = Number(currentLoss) || 0
  const pct = limit != null && limit > 0 ? Math.min(100, (loss / limit) * 100) : 0

  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(String(limit))
  const [saving, setSaving] = useState(false)

  let zone = 'safe'
  let message = ''
  if (limit != null && limit > 0) {
    if (loss >= limit) {
      zone = 'reached'
      message = 'Loss Limit Reached'
    } else if (pct >= 80 || (limit - loss) < limit * 0.2) {
      zone = 'warning'
      message = 'Approaching Loss Limit'
    }
  }

  const format = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  const handleSave = async () => {
    if (!onSetLimit) return
    const trimmed = String(inputValue).trim()
    const isRemove = trimmed === ''
    const num = isRemove ? null : Number(trimmed)
    if (!isRemove && (num === undefined || num === null || !Number.isFinite(num) || num < 0 || num > MAX_LOSS_LIMIT)) {
      return
    }
    setSaving(true)
    try {
      await onSetLimit(num)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = () => {
    setInputValue(limit != null ? String(limit) : '')
    setIsEditing(true)
  }

  return (
    <div className={`loss_cut_indicator loss_cut_${zone} ${compact ? 'loss_cut_compact' : ''}`}>
      <div className="loss_cut_row">
        <span className="loss_cut_label">Current Loss</span>
        <span className="loss_cut_value">{format(loss)}</span>
      </div>
      <div className="loss_cut_row">
        <span className="loss_cut_label">Loss Limit</span>
        {!isEditing ? (
          <div className="loss_cut_limit_right">
            <span className="loss_cut_value">{limit != null && limit >= 0 ? format(limit) : 'Not set'}</span>
            {typeof onSetLimit === 'function' && (
              <button type="button" className="loss_cut_set_btn" onClick={handleOpenEdit}>
                Set limit
              </button>
            )}
          </div>
        ) : (
          <div className="loss_cut_edit_row">
            <input
              type="number"
              className="loss_cut_input"
              min={0}
              max={MAX_LOSS_LIMIT}
              step={1000}
              placeholder="Remove limit"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={saving}
            />
            <button type="button" className="loss_cut_save_btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="loss_cut_cancel_btn" onClick={() => setIsEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        )}
      </div>
      {!isEditing && (
        <>
          {limit != null && limit > 0 && (
            <div className="loss_cut_progress_wrap">
              <div className="loss_cut_progress_bar" style={{ width: `${pct}%` }} />
            </div>
          )}
          {message && (
            <p className="loss_cut_message">
              {zone === 'reached' ? 'Loss Limit Reached' : 'LOSS LIMIT NEAR'}
            </p>
          )}
        </>
      )}
    </div>
  )
}
