import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Search.css'

const ITEM_WIDTH = 178 + 18;
const MAX_CONTENT_BEFORE_VIEW_ALL = 15;

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
    const [currentIndex, setCurrentIndex] = useState(0);
    const sliderRef = useRef(null);

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
    const itemsPerSet = displayItems.length;

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

    useEffect(() => {
        if (sliderRef.current) {
            const translateX = -currentIndex * ITEM_WIDTH;
            sliderRef.current.style.transform = `translateX(${translateX}px)`;
        }
    }, [currentIndex]);

    const handleSliderClickCapture = (e) => {
        if (justDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            justDraggedRef.current = false;
        }
    };

    const startSliderDrag = (clientX, config) => {
        if (!config.sliderRef?.current) return;
        const startTranslate = -config.currentIndex * (typeof config.getItemWidth === 'function' ? config.getItemWidth() : config.getItemWidth);
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

    if (!isOpen) return null

    const sliderConfig = {
        sliderRef,
        getItemWidth: ITEM_WIDTH,
        itemsPerSet,
        currentIndex,
        setIndex: setCurrentIndex,
    };

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
                            onMouseDown={(e) => handleSliderMouseDown(e, sliderConfig)}
                            onTouchStart={(e) => handleSliderTouchStart(e, sliderConfig)}
                            onClickCapture={handleSliderClickCapture}
                            style={{ cursor: 'grab' }}
                        >
                            <div className="game_items_slider" ref={sliderRef}>
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
