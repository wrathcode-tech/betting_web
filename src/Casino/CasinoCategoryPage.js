import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import Header from '../customComponents/Header'
import Footer from '../customComponents/footer'
import MobileMenu from '../customComponents/MobileMenu'
import { CASINO_CATEGORIES } from './casinoCategoryConfig'
import './casino.css'

export default function CasinoCategoryPage() {
  const { categoryId } = useParams()
  const category = CASINO_CATEGORIES.find((c) => c.id === categoryId)

  if (!category) {
    return <Navigate to="/casino" replace />
  }

  return (
    <>
      <Header />
      <div className="dashboard_page">
        <div className="casino_outer">
          <div className="container">
            <div className="casino_category_page_header">
              <Link to="/casino" className="casino_category_back">
                <i className="ri-arrow-left-s-line" /> Back to Casino
              </Link>
              <h1 className="casino_category_title">{category.name}</h1>
            </div>

            <div className="top_slot_outer">
              <div className="game_items_grid">
                {category.games.map((game) => (
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
                    <img src={`${process.env.PUBLIC_URL || ''}/${game.image}`} alt={category.name} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MobileMenu />
    </>
  )
}
