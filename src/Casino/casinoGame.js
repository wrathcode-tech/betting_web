import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './casino.css'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'

function CasinoGame() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeTab, setActiveTab] = useState('lobby');
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
    
    const itemsPerSet = gameItems.length;
    const duplicatedItems = [...gameItems, ...gameItems, ...gameItems];
    const gallerySlides = [
        "images/casino_bnr_img.png",
        "images/casino_bnr_img2.png",
        "images/casino_bnr_img3.png",
        "images/casino_bnr_img4.png",
        "images/casino_bnr_img5.png",
        "images/casino_bnr_img2.png",
        "images/casino_bnr_img3.png",
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
    }, [lobbySlider1Index]);
    useEffect(() => {
        if (lobbySlider2Ref.current) {
            const tx = -lobbySlider2Index * itemWidth;
            lobbySlider2Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider2Index]);
    useEffect(() => {
        if (lobbySlider3Ref.current) {
            const tx = -lobbySlider3Index * itemWidth;
            lobbySlider3Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider3Index]);
    useEffect(() => {
        if (lobbySlider4Ref.current) {
            const tx = -lobbySlider4Index * itemWidth;
            lobbySlider4Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider4Index]);
    useEffect(() => {
        if (lobbySlider5Ref.current) {
            const tx = -lobbySlider5Index * itemWidth;
            lobbySlider5Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider5Index]);
    useEffect(() => {
        if (lobbySlider6Ref.current) {
            const tx = -lobbySlider6Index * itemWidth;
            lobbySlider6Ref.current.style.transform = `translateX(${tx}px)`;
        }
    }, [lobbySlider6Index]);

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
        const w = window.innerWidth;
        if (w >= 1025) return 3;
        if (w >= 769) return 2;
        return 1;
    };
    const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView);
    const [layoutKey, setLayoutKey] = useState(0);

    useEffect(() => {
        const mq3 = window.matchMedia('(min-width: 1025px)');
        const mq2 = window.matchMedia('(min-width: 769px)');
        const update = () => {
            setSlidesPerView(mq3.matches ? 3 : mq2.matches ? 2 : 1);
        };
        update();
        mq3.addEventListener('change', update);
        mq2.addEventListener('change', update);
        return () => {
            mq3.removeEventListener('change', update);
            mq2.removeEventListener('change', update);
        };
    }, []);
    useEffect(() => {
        const onResize = () => setLayoutKey((k) => k + 1);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const maxIndex = Math.max(0, gallerySlides.length - slidesPerView);
    const handleBannerPrev = () => {
        if (slidesPerView === 1) {
            setCurrentSlide((prev) => (prev <= 0 ? gallerySlides.length - 1 : prev - 1));
        } else {
            setCurrentSlide((prev) => (prev <= 0 ? maxIndex : prev - 1));
        }
    };
    const handleBannerNext = () => {
        if (slidesPerView === 1) {
            setCurrentSlide((prev) => (prev >= gallerySlides.length - 1 ? 0 : prev + 1));
        } else {
            setCurrentSlide((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }
    };

    const GALLERY_GAP = 18;
    useEffect(() => {
        if (!sliderRef.current) return;
        if (slidesPerView === 1) {
            sliderRef.current.style.transform = `translateX(-${currentSlide * 100}%)`;
        } else {
            const firstSlide = sliderRef.current.querySelector('.casinobnr_gallery_slide');
            const slideWidth = firstSlide ? firstSlide.offsetWidth : 0;
            const step = slideWidth + GALLERY_GAP;
            sliderRef.current.style.transform = `translateX(-${currentSlide * step}px)`;
        }
    }, [currentSlide, slidesPerView, layoutKey]);

    const dotCount = slidesPerView === 1 ? gallerySlides.length : maxIndex + 1;
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
            <Header />
            <div className='dashboard_page'>
            <div className='casino_outer'>
                <div className='container'>
                    <div className='casino_hero_section'>
                        <div
                            className={`casinobnr_gallery_wrapper ${arrowsVisible ? 'casinobnr_arrows_visible' : ''}`}
                            onMouseEnter={handleSliderEnter}
                            onMouseLeave={handleSliderLeave}
                            onTouchStart={handleSliderTouchStart}
                            onTouchEnd={handleSliderTouchEnd}
                        >
                            <button type="button" className='casinobnr_arrow casinobnr_arrow_prev' onClick={handleBannerPrev} aria-label="Previous slide">
                                <i className="ri-arrow-left-s-line"></i>
                            </button>
                            <button type="button" className='casinobnr_arrow casinobnr_arrow_next' onClick={handleBannerNext} aria-label="Next slide">
                                <i className="ri-arrow-right-s-line"></i>
                            </button>
                            <div className='casinobnr_gallery_track' ref={sliderRef}>
                                {gallerySlides.map((image, index) => (
                                    <div key={index} className='casinobnr_gallery_slide'>
                                        <img src={image} alt={`Casino gallery ${index + 1}`} />
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
                  <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                  {item.badge && <div className="top_ads">{item.badge}</div>}
                  <img alt="game" src={item.image} />
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
         <h2 className="heading_h2">Originals </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div className="game_items_grid">
         {originalsItems.map((item, index) => (
            <Link key={`grid-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
               <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
               {item.badge && <div className="top_ads">{item.badge}</div>}
               <img alt="game" src={item.image} />
            </Link>
         ))}
      </div>
 
</div>

</div>
)}

{activeTab === 'slots' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Slots </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div className="game_items_grid">
         {originalsItems.map((item, index) => (
            <Link key={`slots-grid-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
               <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
               {item.badge && <div className="top_ads">{item.badge}</div>}
               <img alt="game" src={item.image} />
            </Link>
         ))}
      </div>
</div>
</div>
)}

{activeTab === 'live' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Live Casino </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div className="game_items_grid">
         {originalsItems.map((item, index) => (
            <Link key={`live-grid-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
               <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
               {item.badge && <div className="top_ads">{item.badge}</div>}
               <img alt="game" src={item.image} />
            </Link>
         ))}
      </div>
</div>
</div>
)}

{activeTab === 'table' && (
<div className='inner_tabs_block show'>
<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">Table Games </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div className="game_items_grid">
         {originalsItems.map((item, index) => (
            <Link key={`table-grid-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
               <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
               {item.badge && <div className="top_ads">{item.badge}</div>}
               <img alt="game" src={item.image} />
            </Link>
         ))}
      </div>
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
