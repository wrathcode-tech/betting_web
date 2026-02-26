import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './casino.css'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'
import { useCasinoProviders } from '../context/CasinoProvidersContext'

function CasinoGame() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { providers } = useCasinoProviders();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedProviderCode, setSelectedProviderCode] = useState('all');
    const [selectedCategoryCode, setSelectedCategoryCode] = useState('lobby');
    const [categoryThumbErrors, setCategoryThumbErrors] = useState(() => new Set());
    const [providerCategoryGames, setProviderCategoryGames] = useState([]);
    const [loadingProviderCategory, setLoadingProviderCategory] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [gamesPage, setGamesPage] = useState(1);
    const [hasMoreGames, setHasMoreGames] = useState(true);
    const sliderRef = useRef(null);
    const loadMoreSentinelRef = useRef(null);
    const GAMES_PAGE_SIZE = 20;
    const GAME_THUMB_FALLBACK = `${process.env.PUBLIC_URL || ''}/images/home_bnr7.png`;

    // Sync selected provider from URL ?provider= when providers are loaded
    useEffect(() => {
        const code = searchParams.get('provider');
        if (!code) return;
        const normalized = String(code).trim().toLowerCase();
        if (normalized === 'all') {
            setSelectedProviderCode('all');
            return;
        }
        if (providers.some((p) => (p.code || '').toLowerCase() === normalized)) {
            setSelectedProviderCode(providers.find((p) => (p.code || '').toLowerCase() === normalized).code);
        }
    }, [searchParams, providers]);

    const handlePlayGame = (game) => {
        if (!game?.gameCode || !game?.providerCode) return;
        try { sessionStorage.removeItem('wcoGameSession'); } catch (_) {}
        navigate('/game', { state: { gameCode: game.gameCode, providerCode: game.providerCode, gameName: game.name } });
    };

    const selectedProvider = selectedProviderCode && selectedProviderCode !== 'all'
        ? providers.find((p) => p.code === selectedProviderCode) || null
        : null;

    // When "All" provider: categories = Lobby + unique categories from all providers. Otherwise single provider's categories.
    const categoriesForProvider = (() => {
        const lobby = { code: 'lobby', name: 'Lobby' };
        if (selectedProviderCode === 'all' || !selectedProviderCode) {
            const seen = new Set(['lobby']);
            const combined = [lobby];
            providers.forEach((p) => {
                (p.categories || []).forEach((c) => {
                    if (c?.code && !seen.has(c.code)) {
                        seen.add(c.code);
                        combined.push({ code: c.code, name: c.name || c.code, thumb: c.thumb });
                    }
                });
            });
            return combined;
        }
        return selectedProvider
            ? [lobby, ...(selectedProvider.categories || [])]
            : [lobby];
    })();

    const handleProviderChange = (code) => {
        setSelectedProviderCode(code);
        setSelectedCategoryCode('lobby');
    };

    const handleCategoryThumbError = (catCode) => {
        setCategoryThumbErrors((prev) => new Set([...prev, catCode]));
    };

    // Fetch first page when provider or category changes (providerCode 'all' → API expects 'ALL')
    useEffect(() => {
        if (!selectedProviderCode) return;
        setLoadingProviderCategory(true);
        setProviderCategoryGames([]);
        setGamesPage(1);
        setHasMoreGames(true);
        const categoryParam = selectedCategoryCode === 'lobby' ? 'all' : selectedCategoryCode;
        const apiProviderCode = String(selectedProviderCode).toLowerCase() === 'all' ? 'ALL' : selectedProviderCode;
        AuthService.bettingGamesList(apiProviderCode, categoryParam, 1, GAMES_PAGE_SIZE)
            .then((res) => {
                const list = res?.data?.games;
                const games = Array.isArray(list) ? list : [];
                setProviderCategoryGames(games);
                setHasMoreGames(games.length >= GAMES_PAGE_SIZE);
            })
            .catch(() => {
                setProviderCategoryGames([]);
                setHasMoreGames(false);
            })
            .finally(() => setLoadingProviderCategory(false));
    }, [selectedProviderCode, selectedCategoryCode]);

    // Load more games (next page) and append
    const loadMoreGames = useCallback(() => {
        if (!selectedProviderCode || loadingMore || !hasMoreGames) return;
        setLoadingMore(true);
        const nextPage = gamesPage + 1;
        const categoryParam = selectedCategoryCode === 'lobby' ? 'all' : selectedCategoryCode;
        const apiProviderCode = String(selectedProviderCode).toLowerCase() === 'all' ? 'ALL' : selectedProviderCode;
        AuthService.bettingGamesList(apiProviderCode, categoryParam, nextPage, GAMES_PAGE_SIZE)
            .then((res) => {
                const list = res?.data?.games;
                const newGames = Array.isArray(list) ? list : [];
                setProviderCategoryGames((prev) => [...prev, ...newGames]);
                setHasMoreGames(newGames.length >= GAMES_PAGE_SIZE);
                setGamesPage(nextPage);
            })
            .catch(() => setHasMoreGames(false))
            .finally(() => setLoadingMore(false));
    }, [selectedProviderCode, selectedCategoryCode, gamesPage, loadingMore, hasMoreGames]);

    // IntersectionObserver: load more when sentinel enters viewport
    useEffect(() => {
        const sentinel = loadMoreSentinelRef.current;
        if (!sentinel || !hasMoreGames) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const [e] = entries;
                if (e?.isIntersecting && !loadingProviderCategory && !loadingMore && providerCategoryGames.length > 0) {
                    loadMoreGames();
                }
            },
            { root: null, rootMargin: '200px', threshold: 0 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreGames, loadingProviderCategory, loadingMore, providerCategoryGames.length, loadMoreGames]);

    const gallerySlides = [
        'images/casino_bnr_img.png',
        'images/casino_bnr_img2.png',
        'images/casino_bnr_img3.png',
        'images/casino_bnr_img4.png',
        'images/casino_bnr_img5.png',
        'images/casino_bnr_img6.png',
    ];

    // Banner dots click + arrows
    const maxBannerIndex = Math.max(0, gallerySlides.length - 1);
    const canGoPrev = currentSlide > 0;
    const canGoNext = currentSlide < maxBannerIndex;
    const handleBannerPrev = () => { if (canGoPrev) setCurrentSlide((p) => p - 1); };
    const handleBannerNext = () => { if (canGoNext) setCurrentSlide((p) => p + 1); };

    useEffect(() => {
        if (!sliderRef.current) return;
        const track = sliderRef.current;
        const firstSlide = track.querySelector('.casinobnr_gallery_slide');
        const slideWidth = firstSlide ? firstSlide.offsetWidth : 0;
        const step = slideWidth + 18;
        track.style.transform = `translateX(-${currentSlide * step}px)`;
    }, [currentSlide]);

    return (
        <>
            <div className='dashboard_page'>
                <div className='casino_outer'>
                    <div className='container-fluid'>
                        <div className='casino_hero_section'>
                            <div className='casinobnr_gallery_wrapper'>
                                <button type="button" className={`casinobnr_arrow casinobnr_arrow_prev ${!canGoPrev ? 'casinobnr_arrow_disabled' : ''}`} onClick={handleBannerPrev} disabled={!canGoPrev} aria-label="Previous slide">
                                    <i className="ri-arrow-left-s-line"></i>
                                </button>
                                <button type="button" className={`casinobnr_arrow casinobnr_arrow_next ${!canGoNext ? 'casinobnr_arrow_disabled' : ''}`} onClick={handleBannerNext} disabled={!canGoNext} aria-label="Next slide">
                                    <i className="ri-arrow-right-s-line"></i>
                                </button>
                                <div className='casinobnr_gallery_track' ref={sliderRef}>
                                    {gallerySlides.map((image, index) => (
                                        <div key={index} className='casinobnr_gallery_slide'>
                                            <img loading="lazy" src={image} alt={`Casino gallery ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                                <div className='casinobnr_slider_dots'>
                                    {gallerySlides.map((_, i) => (
                                        <button key={i} type="button" className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(i)} aria-label={`Page ${i + 1}`}></button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className='lobby_section'>
                            <div className='d-flex align-items-center justify-content-between casinotop_tabbar'>
                                <div className="casino_provider_category_tabs">
                                    <div className='d-flex align-items-center justify-content-end'>
                                <div className='searchright_lobby w-10' onClick={() => window.dispatchEvent(new CustomEvent('openSearchModal'))} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && window.dispatchEvent(new CustomEvent('openSearchModal'))} aria-label="Open search">
                                        <button type="button"><i className="ri-search-line"></i></button>
                                        <span>Search</span>
                                    </div>
                                    </div>
                                    <ul className='lobbytabs_list lobbytabs_list_providers' role="tablist">
                                        <li
                                            role="tab"
                                            aria-selected={selectedProviderCode === 'all'}
                                            className={selectedProviderCode === 'all' ? 'active provider-tab-color' : ''}
                                            onClick={() => handleProviderChange('all')}
                                        >
                                            All
                                        </li>
                                        {providers.map((p) => (
                                            <li
                                                key={p.code}
                                                role="tab"
                                                aria-selected={selectedProviderCode === p.code}
                                                className={selectedProviderCode === p.code ? 'active provider-tab-color' : ''}
                                                onClick={() => handleProviderChange(p.code)}
                                            >
                                                {p.name}
                                                {p.totalGames != null && <span>{p.totalGames}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                   
                                    <ul className='lobbytabs_list lobbytabs_list_categories' role="tablist">
                                        {categoriesForProvider.map((cat) => {
                                            const isLobby = cat.code === 'lobby';
                                            const showThumb = cat.thumb && !categoryThumbErrors.has(cat.code) && !isLobby;
                                            return (
                                                <li
                                                    key={cat.code}
                                                    role="tab"
                                                    aria-selected={selectedCategoryCode === cat.code}
                                                    className={selectedCategoryCode === cat.code ? 'active' : ''}
                                                    onClick={() => setSelectedCategoryCode(cat.code)}
                                                >
                                                    {showThumb ? (
                                                        <img
                                                            src={cat.thumb}
                                                            alt=""
                                                            className="lobbytab_category_thumb"
                                                            onError={() => handleCategoryThumbError(cat.code)}
                                                        />
                                                    ) : (
                                                        <i className={`lobbytab_category_icon ${isLobby ? 'ri-gamepad-line' : 'ri-honor-of-kings-fill'}`} aria-hidden />
                                                    )}
                                                    {cat.name}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                              
                            </div>

                            <div className='lobbytabs_content'>
                                {/* Provider + category games (GET /api/v1/games) */}
                                <div className="inner_tabs_block show">
                                    {loadingProviderCategory && providerCategoryGames.length === 0 ? (
                                        <div className="game_items_grid d-flex justify-content-center align-items-center loader-color" style={{ minHeight: 200 }}>
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Loading…</span>
                                            </div>
                                        </div>
                                    ) : providerCategoryGames.length > 0 ? (
                                        <div className="top_slot_outer">
                                            <div className="top_hd d-flex align-items-center justify-content-between">
                                                <h2 className="heading_h2">
                                                    {selectedProviderCode === 'all' ? 'All Games' : (selectedProvider?.name || 'Games')}
                                                    {selectedCategoryCode !== 'lobby' && categoriesForProvider.find((c) => c.code === selectedCategoryCode)?.name && (
                                                        <span> – {categoriesForProvider.find((c) => c.code === selectedCategoryCode).name}</span>
                                                    )}
                                                </h2>
                                            </div>
                                            <div className="game_items_grid">
                                                {providerCategoryGames.map((g) => {
                                                    const gameCode = g.gameCode ?? g.code;
                                                    const providerCode = g.providerCode;
                                                    const name = g.name;
                                                    const thumb = g.thumbnail ?? g.thumb;
                                                    return (
                                                        <button
                                                            key={`${providerCode}-${gameCode}`}
                                                            type="button"
                                                            className="game_items_inner casino_api_game_card"
                                                            onClick={() => handlePlayGame({ gameCode, providerCode, name })}
                                                        >
                                                            <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
                                                            <img
                                                                loading="lazy"
                                                                alt={name}
                                                                src={thumb || GAME_THUMB_FALLBACK}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = GAME_THUMB_FALLBACK; }}
                                                            />
                                                            <span className="game_card_name">{name || gameCode}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div ref={loadMoreSentinelRef} style={{ height: 1 }} aria-hidden />
                                            {loadingMore && (
                                                <div className="game_items_grid d-flex justify-content-center loader-color py-3">
                                                    <div className="spinner-border" role="status">
                                                        <span className="visually-hidden">Loading more…</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedProviderCode && !loadingProviderCategory ? (
                                        <div className="text-center py-4">No games in this category.</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <MobileMenu />
        </>
    );
}

export default CasinoGame;
