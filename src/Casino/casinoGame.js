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

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [slides.length]);

    // Slider 1 auto-scroll (4 seconds)
    useEffect(() => {
        if (lobbySlider1Ref.current) {
            const itemWidth = 178 + 18;
            // Set initial position to 0 (no movement)
            lobbySlider1Ref.current.style.transition = 'none';
            lobbySlider1Ref.current.style.transform = `translateX(0px)`;
            
            // After delay, move to middle position and start auto-slide
            setTimeout(() => {
                if (lobbySlider1Ref.current) {
                    lobbySlider1Ref.current.style.transition = 'transform 1.2s ease-in-out';
                    lobbySlider1Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                    setLobbySlider1Index(itemsPerSet);
                }
            }, 500);
        }
    }, [itemsPerSet]);

    useEffect(() => {
        // Only start auto-slide if index is set (not 0)
        if (lobbySlider1Index === 0) return;
        
        const interval = setInterval(() => {
            setLobbySlider1Index((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= itemsPerSet * 2) {
                    requestAnimationFrame(() => {
                        if (lobbySlider1Ref.current) {
                            const itemWidth = 178 + 18;
                            lobbySlider1Ref.current.style.transition = 'none';
                            lobbySlider1Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                            void lobbySlider1Ref.current.offsetWidth;
                            lobbySlider1Ref.current.style.transition = 'transform 1.2s ease-in-out';
                        }
                    });
                    return itemsPerSet;
                }
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [itemsPerSet, lobbySlider1Index]);

    useEffect(() => {
        if (lobbySlider1Ref.current && lobbySlider1Index > 0) {
            const itemWidth = 178 + 18;
            const translateX = -lobbySlider1Index * itemWidth;
            lobbySlider1Ref.current.style.transform = `translateX(${translateX}px)`;
        }
    }, [lobbySlider1Index]);

    // Slider 2 auto-scroll (4.5 seconds)
    useEffect(() => {
        if (lobbySlider2Ref.current) {
            const itemWidth = 178 + 18;
            // Set initial position to 0 (no movement)
            lobbySlider2Ref.current.style.transition = 'none';
            lobbySlider2Ref.current.style.transform = `translateX(0px)`;
            
            // After delay, move to middle position and start auto-slide
            setTimeout(() => {
                if (lobbySlider2Ref.current) {
                    lobbySlider2Ref.current.style.transition = 'transform 1.2s ease-in-out';
                    lobbySlider2Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                    setLobbySlider2Index(itemsPerSet);
                }
            }, 600);
        }
    }, [itemsPerSet]);

    useEffect(() => {
        // Only start auto-slide if index is set (not 0)
        if (lobbySlider2Index === 0) return;
        
        const interval = setInterval(() => {
            setLobbySlider2Index((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= itemsPerSet * 2) {
                    requestAnimationFrame(() => {
                        if (lobbySlider2Ref.current) {
                            const itemWidth = 178 + 18;
                            lobbySlider2Ref.current.style.transition = 'none';
                            lobbySlider2Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                            void lobbySlider2Ref.current.offsetWidth;
                            lobbySlider2Ref.current.style.transition = 'transform 1.2s ease-in-out';
                        }
                    });
                    return itemsPerSet;
                }
                return nextIndex;
            });
        }, 4500);

        return () => clearInterval(interval);
    }, [itemsPerSet, lobbySlider2Index]);

    useEffect(() => {
        if (lobbySlider2Ref.current && lobbySlider2Index > 0) {
            const itemWidth = 178 + 18;
            const translateX = -lobbySlider2Index * itemWidth;
            lobbySlider2Ref.current.style.transform = `translateX(${translateX}px)`;
        }
    }, [lobbySlider2Index]);

    // Slider 3 auto-scroll (5 seconds)
    useEffect(() => {
        if (lobbySlider3Ref.current) {
            const itemWidth = 178 + 18;
            // Set initial position to 0 (no movement)
            lobbySlider3Ref.current.style.transition = 'none';
            lobbySlider3Ref.current.style.transform = `translateX(0px)`;
            
            // After delay, move to middle position and start auto-slide
            setTimeout(() => {
                if (lobbySlider3Ref.current) {
                    lobbySlider3Ref.current.style.transition = 'transform 1.2s ease-in-out';
                    lobbySlider3Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                    setLobbySlider3Index(itemsPerSet);
                }
            }, 700);
        }
    }, [itemsPerSet]);

    useEffect(() => {
        // Only start auto-slide if index is set (not 0)
        if (lobbySlider3Index === 0) return;
        
        const interval = setInterval(() => {
            setLobbySlider3Index((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= itemsPerSet * 2) {
                    requestAnimationFrame(() => {
                        if (lobbySlider3Ref.current) {
                            const itemWidth = 178 + 18;
                            lobbySlider3Ref.current.style.transition = 'none';
                            lobbySlider3Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                            void lobbySlider3Ref.current.offsetWidth;
                            lobbySlider3Ref.current.style.transition = 'transform 1.2s ease-in-out';
                        }
                    });
                    return itemsPerSet;
                }
                return nextIndex;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [itemsPerSet, lobbySlider3Index]);

    useEffect(() => {
        if (lobbySlider3Ref.current && lobbySlider3Index > 0) {
            const itemWidth = 178 + 18;
            const translateX = -lobbySlider3Index * itemWidth;
            lobbySlider3Ref.current.style.transform = `translateX(${translateX}px)`;
        }
    }, [lobbySlider3Index]);

    // Slider 4 auto-scroll (5.5 seconds)
    useEffect(() => {
        if (lobbySlider4Ref.current) {
            const itemWidth = 178 + 18;
            // Set initial position to 0 (no movement)
            lobbySlider4Ref.current.style.transition = 'none';
            lobbySlider4Ref.current.style.transform = `translateX(0px)`;
            
            // After delay, move to middle position and start auto-slide
            setTimeout(() => {
                if (lobbySlider4Ref.current) {
                    lobbySlider4Ref.current.style.transition = 'transform 1.2s ease-in-out';
                    lobbySlider4Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                    setLobbySlider4Index(itemsPerSet);
                }
            }, 800);
        }
    }, [itemsPerSet]);

    useEffect(() => {
        // Only start auto-slide if index is set (not 0)
        if (lobbySlider4Index === 0) return;
        
        const interval = setInterval(() => {
            setLobbySlider4Index((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= itemsPerSet * 2) {
                    requestAnimationFrame(() => {
                        if (lobbySlider4Ref.current) {
                            const itemWidth = 178 + 18;
                            lobbySlider4Ref.current.style.transition = 'none';
                            lobbySlider4Ref.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                            void lobbySlider4Ref.current.offsetWidth;
                            lobbySlider4Ref.current.style.transition = 'transform 1.2s ease-in-out';
                        }
                    });
                    return itemsPerSet;
                }
                return nextIndex;
            });
        }, 5500);

        return () => clearInterval(interval);
    }, [itemsPerSet, lobbySlider4Index]);

    useEffect(() => {
        if (lobbySlider4Ref.current && lobbySlider4Index > 0) {
            const itemWidth = 178 + 18;
            const translateX = -lobbySlider4Index * itemWidth;
            lobbySlider4Ref.current.style.transform = `translateX(${translateX}px)`;
        }
    }, [lobbySlider4Index]);

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


                    <div className='lobby_section'>
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
      <div className="game_items_slider_wrapper">
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
      <div className="game_items_slider_wrapper">
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
      <div className="game_items_slider_wrapper">
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
