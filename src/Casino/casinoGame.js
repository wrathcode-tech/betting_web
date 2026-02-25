import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './casino.css'
import MobileMenu from '../customComponents/MobileMenu'
import AuthService from '../api/services/AuthService'

function CasinoGame() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeTab, setActiveTab] = useState('lobby');
    const [providers, setProviders] = useState([]);
    const [featuredGames, setFeaturedGames] = useState([]);
    const [allGames, setAllGames] = useState([]);
    const [gamesLoading, setGamesLoading] = useState(false);
    const [slotsGames, setSlotsGames] = useState([]);
    const [liveGames, setLiveGames] = useState([]);
    const [tableGames, setTableGames] = useState([]);
    const [tabLoading, setTabLoading] = useState({ slots: false, live: false, table: false });
    const sliderRef = useRef(null);
    
    // Slider states for lobby tabs
    const [lobbySlider1Index, setLobbySlider1Index] = useState(0);
    const lobbySlider1Ref = useRef(null);
    
    const [lobbySlider2Index, setLobbySlider2Index] = useState(0);
    const lobbySlider2Ref = useRef(null);
    
    const [lobbySlider3Index, setLobbySlider3Index] = useState(0);
    const lobbySlider3Ref = useRef(null);
    
    const [lobbySlider4Index, setLobbySlider4Index] = useState(0);
    const lobbySlider4Ref = useRef(null);
    
    const [lobbySlider5Index, setLobbySlider5Index] = useState(0);
    const lobbySlider5Ref = useRef(null);
    
    const [lobbySlider6Index, setLobbySlider6Index] = useState(0);
    const lobbySlider6Ref = useRef(null);

    useEffect(() => {
        let cancelled = false
        setGamesLoading(true)
        Promise.all([
            AuthService.bettingGamesGetProviders().then((r) => r?.data?.providers || []),
            AuthService.bettingGamesFeatured(24).then((r) => r?.data?.games || []),
            AuthService.bettingGamesByCategory('all', 1, 200).then((r) => r?.data?.games || []),
        ]).then(([provs, featured, all]) => {
            if (!cancelled) {
                setProviders(Array.isArray(provs) ? provs : [])
                setFeaturedGames(Array.isArray(featured) ? featured : [])
                setAllGames(Array.isArray(all) ? all : [])
            }
        }).catch(() => {
            if (!cancelled) setFeaturedGames([]); if (!cancelled) setAllGames([])
        }).finally(() => {
            if (!cancelled) setGamesLoading(false)
        })
        return () => { cancelled = true }
    }, [])

    // Load category games when user switches to Slots / Live / Table tab
    useEffect(() => {
        if (activeTab === 'slots' && slotsGames.length === 0 && !tabLoading.slots) {
            setTabLoading((p) => ({ ...p, slots: true }))
            AuthService.bettingGamesByCategory('slots', 1, 100).then((r) => {
                setSlotsGames(Array.isArray(r?.data?.games) ? r.data.games : [])
            }).finally(() => setTabLoading((p) => ({ ...p, slots: false })))
        }
        if (activeTab === 'live' && liveGames.length === 0 && !tabLoading.live) {
            setTabLoading((p) => ({ ...p, live: true }))
            AuthService.bettingGamesByCategory('live_casino', 1, 100).then((r) => {
                setLiveGames(Array.isArray(r?.data?.games) ? r.data.games : [])
            }).finally(() => setTabLoading((p) => ({ ...p, live: false })))
        }
        if (activeTab === 'table' && tableGames.length === 0 && !tabLoading.table) {
            setTabLoading((p) => ({ ...p, table: true }))
            AuthService.bettingGamesByCategory('table_games', 1, 100).then((r) => {
                setTableGames(Array.isArray(r?.data?.games) ? r.data.games : [])
            }).finally(() => setTabLoading((p) => ({ ...p, table: false })))
        }
    }, [activeTab, slotsGames.length, liveGames.length, tableGames.length, tabLoading.slots, tabLoading.live, tabLoading.table])

    const handlePlayGame = (game) => {
        if (!game?.gameCode || !game?.providerCode) return
        navigate('/game', { state: { gameCode: game.gameCode, providerCode: game.providerCode, gameName: game.name } })
    }
    
    // Lobby category sections (replacing BetCasino Original)
    const lobbyCategories = [
        { id: 'fun', name: 'Fun Games', ref: lobbySlider1Ref, index: lobbySlider1Index, setIndex: setLobbySlider1Index },
        { id: 'live', name: 'Live', ref: lobbySlider2Ref, index: lobbySlider2Index, setIndex: setLobbySlider2Index },
        { id: 'prediction', name: 'Prediction', ref: lobbySlider3Ref, index: lobbySlider3Index, setIndex: setLobbySlider3Index },
        { id: 'virtuals', name: 'Virtuals', ref: lobbySlider4Ref, index: lobbySlider4Index, setIndex: setLobbySlider4Index },
        { id: 'color', name: 'Color', ref: lobbySlider5Ref, index: lobbySlider5Index, setIndex: setLobbySlider5Index },
        { id: 'chicken', name: 'Chicken Games', ref: lobbySlider6Ref, index: lobbySlider6Index, setIndex: setLobbySlider6Index },
    ];
    
    // Game items for sliders (7 items each)
    const gameItems = [
        { id: 1, badge: 'Top', image: 'images/betcasino_img.png' },
        { id: 2, badge: null, image: 'images/betcasino_img2.png' },
        { id: 3, badge: 'Top', image: 'images/betcasino_img3.png' },
        { id: 4, badge: null, image: 'images/betcasino_img4.png' },
        { id: 5, badge: 'Hot', image: 'images/betcasino_img5.png' },
        { id: 6, badge: null, image: 'images/betcasino_img6.png' },
        { id: 7, badge: null, image: 'images/betcasino_img7.png' },
    ];
    
    // Create 18 items for originals grid by repeating
    const originalsItems = [];
    for (let i = 0; i < 18; i++) {
        const item = gameItems[i % gameItems.length];
        originalsItems.push({ ...item, id: i + 1 });
    }
    
    const duplicatedItems = [...gameItems, ...gameItems, ...gameItems];
    const gallerySlides = [
        "images/casino_bnr_img.svg",
        "images/casino_bnr_img2.svg",
        "images/casino_bnr_img3.svg",
        "images/casino_bnr_img4.svg",
        "images/casino_bnr_img5.svg",
        "images/casino_bnr_img6.svg",
    ];

    // No auto-slide: banner changes only on dot click; lobby sliders on mouse drag

    const itemWidth = 178 + 18;
    const lobbyItemsPerSet = duplicatedItems.length;

    // Sync slider transform to index (mouse drag only)
    useEffect(() => {
        if (lobbySlider1Ref.current) {
            const tx = -lobbySlider1Index * itemWidth;
            lobbySlider1Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider1Index, itemWidth]);
    useEffect(() => {
        if (lobbySlider2Ref.current) {
            const tx = -lobbySlider2Index * itemWidth;
            lobbySlider2Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider2Index, itemWidth]);
    useEffect(() => {
        if (lobbySlider3Ref.current) {
            const tx = -lobbySlider3Index * itemWidth;
            lobbySlider3Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider3Index, itemWidth]);
    useEffect(() => {
        if (lobbySlider4Ref.current) {
            const tx = -lobbySlider4Index * itemWidth;
            lobbySlider4Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider4Index, itemWidth]);
    useEffect(() => {
        if (lobbySlider5Ref.current) {
            const tx = -lobbySlider5Index * itemWidth;
            lobbySlider5Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider5Index, itemWidth]);
    useEffect(() => {
        if (lobbySlider6Ref.current) {
            const tx = -lobbySlider6Index * itemWidth;
            lobbySlider6Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider6Index, itemWidth]);

    // Mouse drag-to-scroll (no auto)
    const dragStateRef = useRef({
        isDragging: false,
        startX: 0,
        startTranslate: 0,
        lastTranslate: 0,
        sliderEl: null,
        getItemWidth: null,
        itemsPerSet: null,
        setIndex: null,
    });
    const justDraggedRef = useRef(false);

    const handleSliderClickCapture = (e) => {
        if (justDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            justDraggedRef.current = false;
        }
    };

    const handleSliderMouseDown = (e, config) => {
        if (e.button !== 0 || !config.sliderRef?.current) return;
        e.preventDefault();
        const iw = typeof config.getItemWidth === 'function' ? config.getItemWidth() : config.getItemWidth;
        const startTranslate = -config.currentIndex * iw;
        dragStateRef.current = {
            isDragging: true,
            startX: e.clientX,
            startTranslate,
            lastTranslate: startTranslate,
            sliderEl: config.sliderRef.current,
            getItemWidth: config.getItemWidth,
            itemsPerSet: config.itemsPerSet,
            setIndex: config.setIndex,
        };
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            const d = dragStateRef.current;
            if (!d.isDragging || !d.sliderEl) return;
            const deltaX = e.clientX - d.startX;
            const newTranslate = d.startTranslate - deltaX;
            d.sliderEl.style.transition = 'none';
            d.sliderEl.style.transform = `translateX(${newTranslate}px)`;
            d.lastTranslate = newTranslate;
        };
        const onMouseUp = () => {
            const d = dragStateRef.current;
            if (!d.isDragging || !d.sliderEl) return;
            const moved = Math.abs(d.lastTranslate - d.startTranslate) > 5;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            d.isDragging = false;
            if (moved) justDraggedRef.current = true;
            const iw = typeof d.getItemWidth === 'function' ? d.getItemWidth() : d.getItemWidth;
            let nearestIndex = Math.round(-d.lastTranslate / iw);
            if (nearestIndex < 0) nearestIndex = 0;
            if (nearestIndex >= d.itemsPerSet) nearestIndex = d.itemsPerSet - 1;
            d.setIndex(nearestIndex);
            d.sliderEl.style.transition = '';
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    const getSlidesPerView = () => {
        if (typeof window === 'undefined') return 1;
        return window.matchMedia('(min-width: 769px)').matches ? 4 : 1;
    };
    const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView);
    const [layoutKey, setLayoutKey] = useState(0);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 769px)');
        const update = () => setSlidesPerView(mq.matches ? 4 : 1);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        const onResize = () => setLayoutKey((k) => k + 1);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const maxIndex = Math.max(0, Math.floor(gallerySlides.length - slidesPerView));
    const canGoPrev = currentSlide > 0;
    const canGoNext = currentSlide < maxIndex;

    const handleBannerPrev = () => {
        if (!canGoPrev) return;
        setCurrentSlide((prev) => prev - 1);
    };
    const handleBannerNext = () => {
        if (!canGoNext) return;
        setCurrentSlide((prev) => prev + 1);
    };

    const GALLERY_GAP = 18;
    useEffect(() => {
        if (!sliderRef.current) return;
        const track = sliderRef.current;
        const wrapper = track.parentElement;
        const firstSlide = track.querySelector('.casinobnr_gallery_slide');
        const slideWidth = firstSlide ? firstSlide.offsetWidth : 0;
        const step = slideWidth + GALLERY_GAP;
        const trackWidth = track.offsetWidth;
        const wrapperWidth = wrapper ? wrapper.offsetWidth : 0;
        const maxTranslate = Math.max(0, trackWidth - wrapperWidth);
        const rawTranslate = currentSlide * step;
        const cappedTranslate = Math.min(rawTranslate, maxTranslate);
        track.style.transform = `translateX(-${cappedTranslate}px)`;
    }, [currentSlide, slidesPerView, layoutKey]);

    const dotCount = maxIndex + 1;
    const handleDotClick = (index) => setCurrentSlide(index);
    const isDotActive = (index) => index === currentSlide;

    const [arrowsVisible, setArrowsVisible] = useState(false);
    const touchHideTimerRef = useRef(null);
    const handleSliderEnter = () => setArrowsVisible(true);
    const handleSliderLeave = () => setArrowsVisible(false);
    const handleSliderTouchStart = () => {
        if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current);
        setArrowsVisible(true);
    };
    const handleSliderTouchEnd = () => {
        touchHideTimerRef.current = setTimeout(() => setArrowsVisible(false), 400);
    };
    useEffect(() => {
        return () => {
            if (touchHideTimerRef.current) clearTimeout(touchHideTimerRef.current);
        };
    }, []);

    return (
        <>
            <div className='dashboard_page'>
            <div className='casino_outer'>
                <div className='container-fluid'>
                    <div className='casino_hero_section'>
                        <div
                            className={`casinobnr_gallery_wrapper ${arrowsVisible ? 'casinobnr_arrows_visible' : ''}`}
                            onMouseEnter={handleSliderEnter}
                            onMouseLeave={handleSliderLeave}
                            onTouchStart={handleSliderTouchStart}
                            onTouchEnd={handleSliderTouchEnd}
                        >
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
                                {Array.from({ length: dotCount }, (_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`dot ${isDotActive(index) ? 'active' : ''}`}
                                        onClick={() => handleDotClick(index)}
                                        aria-label={`Page ${index + 1}`}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    </div>


                    <div className='lobby_section'>
                        <div className='d-flex align-items-center justify-content-between casinotop_tabbar'>
                            <ul className='lobbytabs_list'>
                                <li 
                                    className={activeTab === 'lobby' ? 'active' : ''}
                                    onClick={() => setActiveTab('lobby')}
                                >
                                    <img src="images/lobby_icon.svg" alt="Lobby" /> Lobby <span>12k</span>
                                </li>
                                <li 
                                    className={activeTab === 'originals' ? 'active' : ''}
                                    onClick={() => setActiveTab('originals')}
                                >
                                    <img src="images/originals_icon.svg" alt="Originals" /> Originals <span>12k</span>
                                </li>
                                <li 
                                    className={activeTab === 'slots' ? 'active' : ''}
                                    onClick={() => setActiveTab('slots')}
                                >
                                    <img src="images/slotsicon.svg" alt="Slots" /> Slots <span>12k</span>
                                </li>
                                <li 
                                    className={activeTab === 'live' ? 'active' : ''}
                                    onClick={() => setActiveTab('live')}
                                >
                                    <img src="images/live_icon2.svg" alt="Live" /> Live <span>12k</span>
                                </li>
                                <li 
                                    className={activeTab === 'table' ? 'active' : ''}
                                    onClick={() => setActiveTab('table')}
                                >
                                    <img src="images/table_icon.svg" alt="Table" /> Table <span>12k</span>
                                </li>
                            </ul>

                            <div
                                className='searchright_lobby'
                                onClick={() => window.dispatchEvent(new CustomEvent('openSearchModal'))}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && window.dispatchEvent(new CustomEvent('openSearchModal'))}
                                aria-label="Open search"
                            >
                            <button type="button"><i className="ri-search-line"></i></button>
                               <span>Search</span>
                            </div>

                        </div>


<div className='lobbytabs_content'>

{activeTab && (
<>
<div className={`inner_tabs_block ${activeTab === 'lobby' ? 'show' : ''}`}>

{/* Featured games from API – click opens game in iframe */}
{featuredGames.length > 0 && (
<div className="top_slot_outer">
  <div className="top_hd d-flex align-items-center justify-content-between">
    <h2 className="heading_h2">Featured Games</h2>
  </div>
  <div className="game_items_grid">
    {featuredGames.map((g) => (
      <button
        key={`feat-${g.providerCode}-${g.gameCode}`}
        type="button"
        className="game_items_inner casino_api_game_card"
        onClick={() => handlePlayGame(g)}
      >
        <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
        <img loading="lazy" alt={g.name} src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} />
        <span className="game_card_name">{g.name || g.gameCode}</span>
      </button>
    ))}
  </div>
</div>
)}

{/* All games from DB – click → authenticate & launch in iframe */}
{allGames.length > 0 && (
<div className="top_slot_outer">
  <div className="top_hd d-flex align-items-center justify-content-between">
    <h2 className="heading_h2">All Games</h2>
  </div>
  <div className="game_items_grid">
    {allGames.map((g) => (
      <button
        key={`all-${g.providerCode}-${g.gameCode}`}
        type="button"
        className="game_items_inner casino_api_game_card"
        onClick={() => handlePlayGame(g)}
      >
        <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
        <img loading="lazy" alt={g.name} src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} />
        <span className="game_card_name">{g.name || g.gameCode}</span>
      </button>
    ))}
  </div>
</div>
)}

{lobbyCategories.map((cat) => (
<div key={cat.id} className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">{cat.name}</h2>
         <div className="top_hd_right"><Link to={`/casino/category/${cat.id}`}><button type="button" className="slotbtn">Go to {cat.name}</button></Link></div>
      </div>
      <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
                sliderRef: cat.ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: cat.index,
                setIndex: cat.setIndex,
            })}
            onClickCapture={handleSliderClickCapture}
          >
         <div className="game_items_slider mt-2" ref={cat.ref}>
            {duplicatedItems.map((item, index) => (
               <Link key={`${cat.id}-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <div className="playbtn"><img loading="lazy" alt="game" src="images/playbtn.png" /></div>
                  {item.badge && <div className="top_ads">{item.badge}</div>}
                  <img loading="lazy" alt="game" src={item.image} />
               </Link>
            ))}
         </div>
      </div>
</div>
))}

</div>

{activeTab === 'originals' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Originals</h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div className="game_items_grid">
         {allGames.map((g) => (
            <button key={`orig-${g.providerCode}-${g.gameCode}`} type="button" className="game_items_inner casino_api_game_card" onClick={() => handlePlayGame(g)}>
               <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
               <img loading="lazy" alt={g.name} src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} />
               <span className="game_card_name">{g.name || g.gameCode}</span>
            </button>
         ))}
      </div>
</div>
</div>
)}

{activeTab === 'slots' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Slots</h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      {tabLoading.slots ? (
        <div className="text-center py-4">Loading games...</div>
      ) : (
      <div className="game_items_grid">
         {slotsGames.map((g) => (
            <button key={`slots-${g.providerCode}-${g.gameCode}`} type="button" className="game_items_inner casino_api_game_card" onClick={() => handlePlayGame(g)}>
               <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
               <img loading="lazy" alt={g.name} src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} />
               <span className="game_card_name">{g.name || g.gameCode}</span>
            </button>
         ))}
      </div>
      )}
</div>
</div>
)}

{activeTab === 'live' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Live Casino</h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      {tabLoading.live ? (
        <div className="text-center py-4">Loading games...</div>
      ) : (
      <div className="game_items_grid">
         {liveGames.map((g) => (
            <button key={`live-${g.providerCode}-${g.gameCode}`} type="button" className="game_items_inner casino_api_game_card" onClick={() => handlePlayGame(g)}>
               <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
               <img loading="lazy" alt={g.name} src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} />
               <span className="game_card_name">{g.name || g.gameCode}</span>
            </button>
         ))}
      </div>
      )}
</div>
</div>
)}

{activeTab === 'table' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Table Games</h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      {tabLoading.table ? (
        <div className="text-center py-4">Loading games...</div>
      ) : (
      <div className="game_items_grid">
         {tableGames.map((g) => (
            <button key={`table-${g.providerCode}-${g.gameCode}`} type="button" className="game_items_inner casino_api_game_card" onClick={() => handlePlayGame(g)}>
               <div className="playbtn"><img loading="lazy" alt="play" src={`${process.env.PUBLIC_URL || ''}/images/playbtn.png`} /></div>
               <img loading="lazy" alt={g.name} src={g.thumbnail || `${process.env.PUBLIC_URL || ''}/images/betcasino_img.png`} />
               <span className="game_card_name">{g.name || g.gameCode}</span>
            </button>
         ))}
      </div>
      )}
</div>
</div>
)}
</>
)}

</div>

                    </div>



                </div>
            </div>
            </div>
            <MobileMenu />
        </>
    )
}

export default CasinoGame
