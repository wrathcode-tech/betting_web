import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './casino.css'
import AuthHeader from '../customComponents/AuthHeader'
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
    
    // Reset sliders to start when user scrolls section out of view and comes back
    const lobbySectionRef = useRef(null);
    const wasOutOfViewRef = useRef(false);
    useEffect(() => {
        const el = lobbySectionRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry) return;
                if (entry.isIntersecting) {
                    if (wasOutOfViewRef.current) {
                        setCurrentSlide(0);
                        setLobbySlider1Index(0);
                        setLobbySlider2Index(0);
                        setLobbySlider3Index(0);
                        setLobbySlider4Index(0);
                        wasOutOfViewRef.current = false;
                    }
                } else {
                    wasOutOfViewRef.current = true;
                }
            },
            { threshold: 0.1, rootMargin: '0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    
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
    const slides = [
        {
            image: "images/casino_slide_img.jpg",
            days: "26 day left",
            title: "Million Drops",
            prize: "€90,000"
        },
        {
            image: "images/casino_slide_img2.jpg",
            days: "30 day left",
            title: "Winter Edition",
            prize: "€25,000,000"
        },
        {
            image: "images/casino_slide_img.jpg",
            days: "26 day left",
            title: "Million Drops",
            prize: "€90,000"
        },
        {
            image: "images/casino_slide_img2.jpg",
            days: "20 day left",
            title: "Drops & Wins",
            prize: "€50,000"
        },
        {
            image: "images/casino_slide_img.jpg",
            days: "15 day left",
            title: "Big Win",
            prize: "€100,000"
        }
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

    const startSliderDrag = (clientX, config) => {
        if (!config.sliderRef?.current) return;
        const iw = typeof config.getItemWidth === 'function' ? config.getItemWidth() : config.getItemWidth;
        const startTranslate = -config.currentIndex * iw;
        dragStateRef.current = {
            isDragging: true,
            startX: clientX,
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

    const handleSliderMouseDown = (e, config) => {
        if (e.button !== 0 || !config.sliderRef?.current) return;
        e.preventDefault();
        startSliderDrag(e.clientX, config);
    };

    const handleSliderTouchStart = (e, config) => {
        if (!e.touches.length || !config.sliderRef?.current) return;
        startSliderDrag(e.touches[0].clientX, config);
    };

    useEffect(() => {
        const applyMove = (clientX) => {
            const d = dragStateRef.current;
            if (!d.isDragging || !d.sliderEl) return;
            const deltaX = clientX - d.startX;
            const newTranslate = d.startTranslate - deltaX;
            d.sliderEl.style.transition = 'none';
            d.sliderEl.style.transform = `translateX(${newTranslate}px)`;
            d.lastTranslate = newTranslate;
        };
        const endDrag = () => {
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
        const onMouseMove = (e) => applyMove(e.clientX);
        const onMouseUp = () => endDrag();
        const onTouchMove = (e) => {
            if (dragStateRef.current.isDragging && e.touches.length) {
                e.preventDefault();
                applyMove(e.touches[0].clientX);
            }
        };
        const onTouchEnd = () => endDrag();
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchEnd);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove, { passive: false });
            window.removeEventListener('touchend', onTouchEnd);
            window.removeEventListener('touchcancel', onTouchEnd);
        };
    }, []);

    // Calculate which slides to show (current, prev, next)
    const getVisibleSlides = () => {
        const visible = [];
        for (let i = -1; i <= 1; i++) {
            let index = currentSlide + i;
            if (index < 0) index = slides.length + index;
            if (index >= slides.length) index = index - slides.length;
            visible.push({ slide: slides[index], position: i, index });
        }
        return visible;
    };

    const visibleSlides = getVisibleSlides();

    return (
        <>
            <AuthHeader />
            <div className='dashboard_page'>
            <div className='casino_outer'>
                <div className='container'>
                    <div className='casino_hero_section'>
                        <div className='casinobnr_slider_wrapper'>
                            <div
                                className='casinobnr_slider'
                                ref={sliderRef}
                            >
                                {visibleSlides.map((item, idx) => (
                                    <div
                                        key={`${item.index}-${currentSlide}`}
                                        className={`casinobnr_slider_bl ${item.position === 0 ? 'active' : ''}`}
                                    >
                                        <img src={item.slide.image} alt="casino" />
                                        <div className='casinobnr_slider_item_content'>
                                            <h6>{item.slide.days}</h6>
                                            <h3>{item.slide.title}</h3>
                                            <div className='price_value'>
                                                <span>Prize pool</span>
                                                {item.slide.prize}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className='casinobnr_slider_dots'>
                                {slides.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`dot ${index === currentSlide ? 'active' : ''}`}
                                        onClick={() => setCurrentSlide(index)}
                                    ></button>
                                ))}
                            </div>
                        </div>
                    </div>


                    <div className='lobby_section' ref={lobbySectionRef}>
                        <div className='d-flex align-items-center justify-content-between'>
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

                            <div className='searchright_lobby'>
                                <input type="text" placeholder='Search' />
                                <button><i className="ri-search-line"></i></button>
                            </div>

                        </div>


<div className='lobbytabs_content'>

{activeTab && (
<>
<div className={`inner_tabs_block ${activeTab === 'lobby' ? 'show' : ''}`}>

<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">BetCasino Original </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
                sliderRef: lobbySlider1Ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: lobbySlider1Index,
                setIndex: setLobbySlider1Index,
            })}
            onTouchStart={(e) => handleSliderTouchStart(e, {
                sliderRef: lobbySlider1Ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: lobbySlider1Index,
                setIndex: setLobbySlider1Index,
            })}
            onClickCapture={handleSliderClickCapture}
          >
         <div className="game_items_slider mt-2" ref={lobbySlider1Ref}>
            {duplicatedItems.map((item, index) => (
               <Link key={`slider1-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                  {item.badge && <div className="top_ads">{item.badge}</div>}
                  <img alt="game" src={item.image} />
               </Link>
            ))}
         </div>
      </div>
 
</div>

<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">BetCasino Original </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
                sliderRef: lobbySlider2Ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: lobbySlider2Index,
                setIndex: setLobbySlider2Index,
            })}
            onTouchStart={(e) => handleSliderTouchStart(e, {
                sliderRef: lobbySlider2Ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: lobbySlider2Index,
                setIndex: setLobbySlider2Index,
            })}
            onClickCapture={handleSliderClickCapture}
          >
         <div className="game_items_slider mt-2" ref={lobbySlider2Ref}>
            {duplicatedItems.map((item, index) => (
               <Link key={`slider2-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                  {item.badge && <div className="top_ads">{item.badge}</div>}
                  <img alt="game" src={item.image} />
               </Link>
            ))}
         </div>
      </div>
 
</div>

<div className="top_slot_outer">
      <div className="top_hd d-flex align-items-center justify-content-between">
         <h2 className="heading_h2">BetCasino Original </h2>
         <div className="top_hd_right"><Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link></div>
      </div>
      <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
                sliderRef: lobbySlider3Ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: lobbySlider3Index,
                setIndex: setLobbySlider3Index,
            })}
            onTouchStart={(e) => handleSliderTouchStart(e, {
                sliderRef: lobbySlider3Ref,
                getItemWidth: itemWidth,
                itemsPerSet: lobbyItemsPerSet,
                currentIndex: lobbySlider3Index,
                setIndex: setLobbySlider3Index,
            })}
            onClickCapture={handleSliderClickCapture}
          >
         <div className="game_items_slider mt-2" ref={lobbySlider3Ref}>
            {duplicatedItems.map((item, index) => (
               <Link key={`slider3-${index}`} to="/game" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                  <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                  {item.badge && <div className="top_ads">{item.badge}</div>}
                  <img alt="game" src={item.image} />
               </Link>
            ))}
         </div>
      </div>
 
</div>

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
