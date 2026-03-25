import React, { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import Footer from '../customComponents/Footer'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import { CASINO_CATEGORIES } from './casinoCategoryConfig'
import './casino.css'

const API_CATEGORY_NAMES = {
  slots: 'Slots',
  live_casino: 'Live Casino',
  table_games: 'Table Games',
  card_games: 'Card Games',
  arcade: 'Arcade',
  crash: 'Crash',
  other: 'Other',
}

export default function CasinoCategoryPage() {
  const { categoryId } = useParams()
  const staticCategory = CASINO_CATEGORIES.find((c) => c.id === categoryId)
  const isApiCategory = !staticCategory && API_CATEGORY_NAMES[categoryId]

  const [apiGames, setApiGames] = useState([])
  const [loading, setLoading] = useState(!!isApiCategory)

  useEffect(() => {
    if (!isApiCategory) return
    AuthService.bettingGamesByCategory(categoryId, 1, 100)
      .then((r) => setApiGames(Array.isArray(r?.data?.games) ? r.data.games : []))
      .catch(() => setApiGames([]))
      .finally(() => setLoading(false))
  }, [categoryId, isApiCategory])

  if (!staticCategory && !isApiCategory) {
    return <Navigate to="/casino" replace />
  }

  const categoryName = staticCategory ? staticCategory.name : (API_CATEGORY_NAMES[categoryId] || categoryId)

  return (
    <div className="casino_category_page_wrapper">
      <div className="dashboard_page">
        <div className="casino_outer">
          <div className="container">
            <div className="casino_category_page_header">
              <Link to="/casino" className="casino_category_back">
                <i className="ri-arrow-left-s-line" /> Back to Casino
              </Link>
              <h1 className="casino_category_title">{categoryName}</h1>
            </div>

            {staticCategory && (
              <div className="top_slot_outer">
                <div className="game_items_grid">
                  {staticCategory.games.map((game) => (
                    <Link
                      key={game.id}
                      to="/game"
                      className="game_items_inner"
                      style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                      <div className="playbtn">
                        <img src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} alt="play" />
                      </div>
                      {game.badge && <div className="top_ads">{game.badge}</div>}
                      <img loading="lazy" src={`${process.env.PUBLIC_URL || ''}/${game.image}`} alt={staticCategory.name} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {isApiCategory && loading ? (
              <div className="text-center py-5 text-white-50">Loading games…</div>
            ) : null}

            {isApiCategory && !loading && (
              <div className="top_slot_outer">
                <div className="game_items_grid">
                  {apiGames.map((g) => {
                    const sp = new URLSearchParams({
                      gameCode: String(g.gameCode),
                      providerCode: String(g.providerCode),
                    })
                    if (g.name) sp.set('gameName', String(g.name))
                    const pn = g.providerName || g.provider
                    if (pn) sp.set('providerName', String(pn))
                    return (
                      <Link
                        key={`${g.providerCode}-${g.gameCode}`}
                        to={`/game?${sp.toString()}`}
                        state={{ gameCode: g.gameCode, providerCode: g.providerCode, gameName: g.name, providerName: g.providerName || g.provider }}
                        className="game_items_inner casino_api_game_card"
                        style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                      >
                        <div className="playbtn">
                          <img src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} alt="play" />
                        </div>
                        <img loading="lazy" src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} alt={g.name} />
                        <span className="game_card_name">{g.name || g.gameCode}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <MobileMenu />
    </div>
  )
}
