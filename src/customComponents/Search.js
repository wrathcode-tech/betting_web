import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clampSliderTranslate } from '../utils/sliderClamp'
import { useSliderDrag } from '../hooks/useSliderDrag'
import './Search.css'

const MAX_CONTENT_BEFORE_VIEW_ALL = 15;
const SEARCH_ITEM_WIDTH = 178 + 18;

const searchGameItemsBase = [
    { id: 1, badge: 'Top', image: 'images/game_itemslider.png' },
    { id: 2, badge: null, image: 'images/game_itemslider2.png' },
    { id: 3, badge: 'Top', image: 'images/game_itemslider3.png' },
    { id: 4, badge: null, image: 'images/game_itemslider4.png' },
    { id: 5, badge: 'Hot', image: 'images/game_itemslider5.png' },
    { id: 6, badge: null, image: 'images/game_itemslider6.png' },
    { id: 7, badge: null, image: 'images/game_itemslider7.png' },
    { id: 8, badge: null, image: 'images/game_itemslider4.png' },
];

function Search({ isOpen, onClose }) {
    const gameItems = searchGameItemsBase.length >= MAX_CONTENT_BEFORE_VIEW_ALL
        ? searchGameItemsBase.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL)
        : Array.from({ length: MAX_CONTENT_BEFORE_VIEW_ALL }, (_, i) => ({
            ...searchGameItemsBase[i % searchGameItemsBase.length],
            id: i + 1,
        }));
    const displayItems = [
        ...gameItems.map((item) => ({ ...item, viewAll: false })),
        { viewAll: true, to: '/casino' },
    ];

    const searchSliderRef = useRef(null);
    const [searchSliderIndex, setSearchSliderIndex] = useState(0);
    const { handleMouseDown: handleSliderMouseDown, handleClickCapture: handleSliderClickCapture } = useSliderDrag();

    useEffect(() => {
        const el = searchSliderRef.current;
        if (el) el.style.transform = `translateX(${clampSliderTranslate(el, -searchSliderIndex * SEARCH_ITEM_WIDTH)}px)`;
    }, [searchSliderIndex]);

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
                        </div>
                        <div
                            className="game_items_slider_wrapper"
                            onMouseDown={(e) => handleSliderMouseDown(e, {
                                sliderRef: searchSliderRef,
                                getItemWidth: SEARCH_ITEM_WIDTH,
                                itemsPerSet: displayItems.length,
                                currentIndex: searchSliderIndex,
                                setIndex: setSearchSliderIndex,
                            })}
                            onClickCapture={handleSliderClickCapture}
                            style={{ cursor: 'grab' }}
                        >
                            <div className="game_items_slider" ref={searchSliderRef}>
                                {displayItems.map((item, index) =>
                                    item.viewAll ? (
                                        <Link
                                            key="view-all-search"
                                            to={item.to}
                                            className="game_items_inner slider_view_all_card"
                                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                                            onClick={onClose}
                                        >
                                            <span className="slider_view_all_text">View All</span>
                                        </Link>
                                    ) : (
                                        <Link
                                            key={`search-${item.id}-${index}`}
                                            to="/casino"
                                            className="game_items_inner"
                                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                                            onClick={onClose}
                                        >
                                            <div className='playbtn'>
                                                <img src="images/playbtn.png" alt="game" />
                                            </div>
                                            {item.badge && (
                                                <div className="top_ads">{item.badge}</div>
                                            )}
                                            <img src={item.image} alt="game" />
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Search
