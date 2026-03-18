import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AuthService from '../api/services/AuthService'
import { clampSliderTranslate } from '../utils/sliderClamp'
import { useSliderDrag } from '../hooks/useSliderDrag'
import './Search.css'

const SEARCH_ITEM_WIDTH = 178 + 18
const SEARCH_MIN_CHARS = 3
const SEARCH_LIMIT = 15
const DEBOUNCE_MS = 350

function gameToUrl(game) {
  if (!game) return '/casino'
  const provider = game.providerCode || game.provider_code || 'all'
  const cat = game.category?.[0]?.code || game.category?.[0]?.name || game.categoryCode || game.category_code || 'lobby'
  const name = game.name || game.gameName || game.game_name || ''
  return `/casino?provider=${encodeURIComponent(provider)}&category=${encodeURIComponent(cat)}&gameName=${encodeURIComponent(name)}`
}

/** Game image – same fields as Landing (thumb, thumbnail, image, icon, logo) so images match API data */
function gameImage(game) {
  if (!game) return `${process.env.PUBLIC_URL || ''}/images/game_itemslider.png`
  const url = game.thumb || game.thumbnail || game.thumbnailUrl || game.image || game.imageUrl || game.icon || game.logo
  return url || `${process.env.PUBLIC_URL || ''}/images/game_itemslider.png`
}

function parseSearchResponse(res) {
  const raw = res?.data ?? res
  const games = Array.isArray(raw?.games) ? raw.games : Array.isArray(raw?.data?.games) ? raw.data.games : []
  const matches = Array.isArray(raw?.matches) ? raw.matches : Array.isArray(raw?.data?.matches) ? raw.data.matches : []
  if (games.length || matches.length) return { games, matches }
  if (Array.isArray(raw)) return { games: raw, matches: [] }
  return { games: [], matches: [] }
}

function Search({ isOpen, onClose }) {
  const searchSliderRef = useRef(null)
  const searchDebounceRef = useRef(null)
  const [searchSliderIndex, setSearchSliderIndex] = useState(0)
  const [trendingGames, setTrendingGames] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ games: [], matches: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const { handleMouseDown: handleSliderMouseDown, handleClickCapture: handleSliderClickCapture } = useSliderDrag()

  // Use same source as Landing page Trending section (bettingGamesLanding) so Search shows same games
  const loadTrending = useCallback(async () => {
    setTrendingLoading(true)
    try {
      const landingRes = await AuthService.bettingGamesLanding()
      const data = landingRes?.data ?? landingRes
      const list = Array.isArray(data?.trending) ? data.trending : []
      setTrendingGames(list)
    } catch {
      setTrendingGames([])
    } finally {
      setTrendingLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSearchResults({ games: [], matches: [] })
      loadTrending()
    }
  }, [isOpen, loadTrending])

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < SEARCH_MIN_CHARS) {
      setSearchResults({ games: [], matches: [] })
      return
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await AuthService.search(searchQuery.trim(), SEARCH_LIMIT)
        const parsed = parseSearchResponse(res)
        setSearchResults(parsed)
      } catch {
        setSearchResults({ games: [], matches: [] })
      } finally {
        setSearchLoading(false)
      }
      searchDebounceRef.current = null
    }, DEBOUNCE_MS)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [searchQuery])

  useEffect(() => {
    const el = searchSliderRef.current
    if (el && trendingGames.length > 0) {
      el.style.transform = `translateX(${clampSliderTranslate(el, -searchSliderIndex * SEARCH_ITEM_WIDTH)}px)`
    }
  }, [searchSliderIndex, trendingGames.length])

  const displayTrending = trendingGames.slice(0, 20)
  const hasSearchText = searchQuery.trim().length >= SEARCH_MIN_CHARS
  const { games: resultGames, matches: resultMatches } = searchResults

  if (!isOpen) return null

  return (
    <>
      <div className="search_overlay" onClick={onClose} aria-hidden="true" />
      <div className="search_modal">
        <div className="search_header">
          <div className="search_header_left d-flex align-items-center gap-2">
            <h2>Search</h2>
          </div>
          <button type="button" className="search_close_btn" onClick={onClose} aria-label="Close">
            <i className="ri-close-line" aria-hidden="true" />
          </button>
        </div>

        <div className="search_content">
          <div className="search_box_bl">
            <i className="ri-search-line" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search games and matches"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          {!hasSearchText && (
            <div className="search_results_text">
              <span>Enter at least {SEARCH_MIN_CHARS} characters to search</span>
            </div>
          )}

          {hasSearchText && (
            <div className="search_results_section">
              {searchLoading ? (
                <div className="search_results_text">Searching...</div>
              ) : (
                <>
                  {resultGames.length > 0 && (
                    <div className="search_results_block">
                      <h3 className="search_results_heading">Games</h3>
                      <div className="search_results_list">
                        {resultGames.map((game, idx) => (
                          <Link
                            key={game?.code || game?.id || game?._id || idx}
                            to={gameToUrl(game)}
                            className="search_result_item"
                            onClick={onClose}
                          >
                            <img src={gameImage(game)} alt="" className="search_result_img" />
                            <span className="search_result_name">{game?.name || game?.gameName || 'Game'}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {resultMatches.length > 0 && (
                    <div className="search_results_block">
                      <h3 className="search_results_heading">Matches</h3>
                      <div className="search_results_list">
                        {resultMatches.map((match, idx) => {
                          const name = match?.eventName ?? match?.event_name ?? match?.name ?? match?.teams ?? 'Match'
                          const gameId = match?.gameId ?? match?.game_id
                          const eventId = match?.eventId ?? match?.event_id
                          const sport = (match?.sport ?? match?.sportName ?? 'cricket').toLowerCase()
                          const path = sport === 'tennis' ? '/tennis' : sport === 'soccer' ? '/soccer' : '/cricket'
                          const state = gameId || eventId ? { gameId, eventId, eventName: name, sportName: sport } : undefined
                          return (
                            <Link
                              key={match?.id ?? match?._id ?? idx}
                              to={path}
                              state={state}
                              className="search_result_item search_result_match"
                              onClick={onClose}
                            >
                              <span className="search_result_name">{name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {!searchLoading && resultGames.length === 0 && resultMatches.length === 0 && (
                    <div className="search_results_text">No games or matches found</div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="top_slot_outer">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2">Trending games</h2>
              <Link to="/casino" onClick={onClose}>
                <span className="search_view_all_link">View all</span>
              </Link>
            </div>
            {trendingLoading ? (
              <div className="search_results_text">Loading trending...</div>
            ) : (
              <div
                className="game_items_slider_wrapper"
                onMouseDown={(e) =>
                  handleSliderMouseDown(e, {
                    sliderRef: searchSliderRef,
                    getItemWidth: () => SEARCH_ITEM_WIDTH,
                    itemsPerSet: displayTrending.length + 1,
                    currentIndex: searchSliderIndex,
                    setIndex: setSearchSliderIndex,
                  })
                }
                onClickCapture={handleSliderClickCapture}
                style={{ cursor: 'grab' }}
              >
                <div className="game_items_slider" ref={searchSliderRef}>
                  {displayTrending.map((game, index) => (
                    <Link
                      key={game?.code || game?.id || game?._id || index}
                      to={gameToUrl(game)}
                      className="game_items_inner"
                      style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                      onClick={onClose}
                    >
                      <div className="playbtn">
                        <img src="images/playbtn.png" alt="play" />
                      </div>
                      <img src={gameImage(game)} alt={game?.name || ''} loading="lazy" />
                    </Link>
                  ))}
                  <Link
                    to="/casino"
                    className="game_items_inner slider_view_all_card"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    onClick={onClose}
                  >
                    <span className="slider_view_all_text">View All</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Search
