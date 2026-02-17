import React, { useState, useEffect, useRef } from 'react'
import './Search.css'

function Search({ isOpen, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef(null);

    const gameItems = [
        { id: 1, badge: 'Top', image: 'images/game_itemslider.png' },
        { id: 2, badge: null, image: 'images/game_itemslider2.png' },
        { id: 3, badge: 'Top', image: 'images/game_itemslider3.png' },
        { id: 4, badge: null, image: 'images/game_itemslider4.png' },
        { id: 5, badge: 'Hot', image: 'images/game_itemslider5.png' },
    ];

    const itemsPerSet = gameItems.length;
    const duplicatedItems = [...gameItems, ...gameItems, ...gameItems];

    // Slider handlers
    const handlePrev = () => {
        setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex - 1;
            if (nextIndex < 0) {
                requestAnimationFrame(() => {
                    if (sliderRef.current) {
                        const itemWidth = 178 + 18;
                        sliderRef.current.style.transition = 'none';
                        sliderRef.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                        void sliderRef.current.offsetWidth;
                        sliderRef.current.style.transition = 'transform 0.6s ease-in-out';
                    }
                });
                return itemsPerSet;
            }
            return nextIndex;
        });
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= itemsPerSet * 2) {
                requestAnimationFrame(() => {
                    if (sliderRef.current) {
                        const itemWidth = 178 + 18;
                        sliderRef.current.style.transition = 'none';
                        sliderRef.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                        void sliderRef.current.offsetWidth;
                        sliderRef.current.style.transition = 'transform 0.6s ease-in-out';
                    }
                });
                return itemsPerSet;
            }
            return nextIndex;
        });
    };

    useEffect(() => {
        if (sliderRef.current) {
            const itemWidth = 178 + 18;
            const translateX = -currentIndex * itemWidth;
            sliderRef.current.style.transform = `translateX(${translateX}px)`;
        }
    }, [currentIndex]);

    // Initialize slider to middle set when component mounts
    useEffect(() => {
        if (isOpen && sliderRef.current) {
            const itemWidth = 178 + 18;
            setTimeout(() => {
                if (sliderRef.current) {
                    sliderRef.current.style.transition = 'none';
                    sliderRef.current.style.transform = `translateX(${-itemsPerSet * itemWidth}px)`;
                    void sliderRef.current.offsetWidth;
                    sliderRef.current.style.transition = 'transform 0.6s ease-in-out';
                    setCurrentIndex(itemsPerSet);
                }
            }, 50);
        }
    }, [isOpen, itemsPerSet]);

    if (!isOpen) return null

    return (
        <>
            <div className='search_overlay' onClick={onClose}></div>
            <div className='search_modal'>
                <div className='search_header'>
                    <div className='search_header_left d-flex align-items-center gap-2'>
                        <h2>Search</h2>
                    </div>
                    <button className='search_close_btn' onClick={onClose}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>

                <div className='search_content'>

                    <div className='search_box_bl'>
                        <i className="ri-search-line"></i>
                        <input type="text" placeholder='Start entering the games name or theme' />
                    </div>

                    <div className='search_results_text'>
                        <span>Enter at least 3 symbols to start searching</span>
                    </div>


                    <div className="top_slot_outer">
                        <div className="top_hd d-flex align-items-center justify-content-between">
                            <h2 className="heading_h2">Games you should try</h2>
                            <div className="top_hd_right d-flex align-items-center gap-2">
                                <div className="slider_arrows d-flex align-items-center gap-1">
                                    <button className="slider_arrow_btn" onClick={handlePrev}><i className="ri-arrow-left-s-line"></i></button>
                                    <button className="slider_arrow_btn" onClick={handleNext}><i className="ri-arrow-right-s-line"></i></button>
                                </div>
                            </div>
                        </div>
                        <div className="game_items_slider_wrapper">
                            <div className="game_items_slider" ref={sliderRef}>
                                {duplicatedItems.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="game_items_inner">
                                        <div className="playbtn"><img alt="game" src="images/playbtn.png" /></div>
                                        {item.badge && (
                                            <div className="top_ads">{item.badge}</div>
                                        )}
                                        <img alt="game" src={item.image} />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>



                </div>
            </div>
        </>
    )
}

export default Search
