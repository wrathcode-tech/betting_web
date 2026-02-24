import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../customComponents/footer';
import '../customComponents/Footer.css';

function LandingPage() {
  const videoRef = useRef(null);

  // TOP SLOTS slider state
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  // BetCasino Original slider state
  const [betCasinoIndex, setBetCasinoIndex] = useState(0);
  const betCasinoSliderRef = useRef(null);

  // Live Casino slider state
  const [liveCasinoIndex, setLiveCasinoIndex] = useState(0);
  const liveCasinoSliderRef = useRef(null);

  // Highroller Hall slider state
  const [highrollerIndex, setHighrollerIndex] = useState(0);
  const highrollerSliderRef = useRef(null);

  // TOP Sports slider state
  const [topSportsIndex, setTopSportsIndex] = useState(0);
  const topSportsSliderRef = useRef(null);

  // TOP Matches slider state
  const [topMatchesIndex, setTopMatchesIndex] = useState(0);
  const topMatchesSliderRef = useRef(null);

  // Landing about section – Show more
  const [showMore, setShowMore] = useState(false);

  // Mouse drag-to-scroll state (shared for all sliders) – no auto-slide
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

  const gameItems = [
    { id: 1, badge: 'Top', image: 'images/game_itemslider.png' },
    { id: 2, badge: null, image: 'images/game_itemslider2.png' },
    { id: 3, badge: 'Top', image: 'images/game_itemslider3.png' },
    { id: 4, badge: null, image: 'images/game_itemslider4.png' },
    { id: 5, badge: 'Hot', image: 'images/game_itemslider5.png' },
    { id: 6, badge: null, image: 'images/game_itemslider6.png' },
    { id: 7, badge: null, image: 'images/game_itemslider7.png' },
    { id: 8, badge: null, image: 'images/game_itemslider4.png' },
  ];

  // BetCasino Original items
  const betCasinoItems = [
    { id: 1, badge: 'Top', image: 'images/betcasino_img.png' },
    { id: 2, badge: null, image: 'images/betcasino_img2.png' },
    { id: 3, badge: 'Top', image: 'images/betcasino_img3.png' },
    { id: 4, badge: null, image: 'images/betcasino_img4.png' },
    { id: 5, badge: 'Hot', image: 'images/betcasino_img5.png' },
    { id: 6, badge: null, image: 'images/betcasino_img6.png' },
    { id: 7, badge: null, image: 'images/betcasino_img7.png' },
    { id: 8, badge: null, image: 'images/betcasino_img3.png' },
  ];

  // Live Casino items
  const liveCasinoItems = [
    { id: 1, icon: 'worldicon', image: 'images/casino_gallery_img.png' },
    { id: 2, icon: null, image: 'images/casino_gallery_img2.png' },
    { id: 3, icon: 'worldicon', image: 'images/casino_gallery_img3.png' },
    { id: 4, icon: null, image: 'images/casino_gallery_img4.png' },
    { id: 5, icon: 'worldicon', image: 'images/casino_gallery_img5.png' },
    { id: 6, icon: null, image: 'images/casino_gallery_img6.png' },
    { id: 7, icon: null, image: 'images/casino_gallery_img7.png' },
    { id: 8, icon: null, image: 'images/casino_gallery_img3.png' },
  ];

  // Highroller Hall items
  const highrollerItems = [
    { id: 1, icon: 'worldicon', image: 'images/highroller_gallery_img.png' },
    { id: 2, icon: null, image: 'images/highroller_gallery_img2.png' },
    { id: 3, icon: 'worldicon', image: 'images/highroller_gallery_img3.png' },
    { id: 4, icon: null, image: 'images/highroller_gallery_img4.png' },
    { id: 5, icon: 'worldicon', image: 'images/highroller_gallery_img5.png' },
    { id: 6, icon: null, image: 'images/highroller_gallery_img6.png' },
    { id: 7, icon: null, image: 'images/highroller_gallery_img7.png' },
    { id: 8, icon: null, image: 'images/highroller_gallery_img2.png' },
  ];

  // TOP Sports items
  const topSportsItems = [
    { id: 1, badge: 'Hot', icon: 'fifa_icon.svg', title: 'Match' },
    { id: 2, badge: 'Hot', icon: 'tennis_icon.svg', title: 'Tennis' },
    { id: 3, icon: 'basketball_icon.svg', title: 'Basketball' },
    { id: 4, icon: 'soccer_icon.svg', title: 'Soccer' },
    { id: 5, icon: 'horse_icon.svg', title: 'Horse Racing' },
    { id: 6, icon: 'nba_icon.svg', title: 'NBA 2K' },
  ];

  // TOP Matches items
  const topMatchesItems = [
    {
      id: 1,
      tournament: 'ICC U19 World Cup',
      teams: 'India vs Australia',
      time: 'Today 01:00 PM',
      viewCount: '3.12',
      viewK: '357K',
      likeCount: '3.12',
      likeK: '357K'
    },
    {
      id: 2,
      tournament: 'Premier League',
      teams: 'Manchester United vs Liverpool',
      time: 'Today 03:30 PM',
      viewCount: '5.24',
      viewK: '421K',
      likeCount: '4.18',
      likeK: '389K'
    },
    {
      id: 3,
      tournament: 'NBA Championship',
      teams: 'Lakers vs Warriors',
      time: 'Today 06:00 PM',
      viewCount: '7.89',
      viewK: '512K',
      likeCount: '6.45',
      likeK: '478K'
    },
    {
      id: 4,
      tournament: 'Tennis Grand Slam',
      teams: 'Djokovic vs Nadal',
      time: 'Today 08:00 PM',
      viewCount: '4.56',
      viewK: '298K',
      likeCount: '3.89',
      likeK: '267K'
    },
    {
      id: 5,
      tournament: 'Cricket T20',
      teams: 'Pakistan vs England',
      time: 'Tomorrow 02:00 PM',
      viewCount: '6.23',
      viewK: '445K',
      likeCount: '5.67',
      likeK: '412K'
    },
    {
      id: 6,
      tournament: 'FIFA World Cup',
      teams: 'Brazil vs Argentina',
      time: 'Tomorrow 04:30 PM',
      viewCount: '9.12',
      viewK: '678K',
      likeCount: '8.45',
      likeK: '623K'
    },
  ];

  const MAX_SLIDER_ITEMS = 15;
  const MAX_CONTENT_BEFORE_VIEW_ALL = MAX_SLIDER_ITEMS - 1;

  const topSlotsDisplayItems = [...gameItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }];
  const betCasinoDisplayItems = [...betCasinoItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }];
  const liveCasinoDisplayItems = [...liveCasinoItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }];
  const highrollerDisplayItems = [...highrollerItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/casino' }];
  const topSportsDisplayItems = [...topSportsItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/sports' }];
  const topMatchesDisplayItems = [...topMatchesItems.slice(0, MAX_CONTENT_BEFORE_VIEW_ALL), { viewAll: true, to: '/sports' }];

  const itemsPerSet = topSlotsDisplayItems.length;
  const betCasinoItemsPerSet = betCasinoDisplayItems.length;
  const liveCasinoItemsPerSet = liveCasinoDisplayItems.length;
  const highrollerItemsPerSet = highrollerDisplayItems.length;
  const topSportsItemsPerSet = topSportsDisplayItems.length;
  const topMatchesItemsPerSet = topMatchesDisplayItems.length;

  // TOP SLOTS slider – sync transform to index (mouse drag only)
  useEffect(() => {
    if (sliderRef.current) {
      const itemWidth = 178 + 18;
      const translateX = -currentIndex * itemWidth;
      sliderRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [currentIndex]);

  // BetCasino Original slider – sync transform to index
  useEffect(() => {
    if (betCasinoSliderRef.current) {
      const itemWidth = 178 + 18;
      const translateX = -betCasinoIndex * itemWidth;
      betCasinoSliderRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [betCasinoIndex]);

  // Live Casino slider – sync transform to index
  useEffect(() => {
    if (liveCasinoSliderRef.current) {
      const itemWidth = 178 + 18;
      const translateX = -liveCasinoIndex * itemWidth;
      liveCasinoSliderRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [liveCasinoIndex]);

  // Highroller Hall slider – sync transform to index
  useEffect(() => {
    if (highrollerSliderRef.current) {
      const itemWidth = 178 + 18;
      const translateX = -highrollerIndex * itemWidth;
      highrollerSliderRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [highrollerIndex]);

  // TOP Sports slider – sync transform to index
  useEffect(() => {
    if (topSportsSliderRef.current) {
      const itemWidth = 178 + 8;
      const translateX = -topSportsIndex * itemWidth;
      topSportsSliderRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [topSportsIndex]);

  // TOP Matches slider handlers
  const getTopMatchesItemWidth = () => {
    if (!topMatchesSliderRef.current) return 0;
    const containerWidth = topMatchesSliderRef.current.offsetWidth;
    const windowWidth = window.innerWidth;

    if (windowWidth <= 767) {
      // Mobile: 1 item per view
      return containerWidth;
    } else if (windowWidth <= 991) {
      // Tablet: 2 items per view
      return containerWidth / 2;
    } else {
      // Desktop: 3 items per view
      return containerWidth / 3;
    }
  };

  // TOP Matches – sync transform to index
  useEffect(() => {
    if (topMatchesSliderRef.current) {
      const itemWidth = getTopMatchesItemWidth();
      const translateX = -topMatchesIndex * itemWidth;
      topMatchesSliderRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [topMatchesIndex]);

  // Handle window resize for TOP Matches slider
  useEffect(() => {
    const handleResize = () => {
      if (topMatchesSliderRef.current) {
        const itemWidth = getTopMatchesItemWidth();
        const translateX = -topMatchesIndex * itemWidth;
        topMatchesSliderRef.current.style.transform = `translateX(${translateX}px)`;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [topMatchesIndex]);

  // Sliders scroll only on mouse drag – no auto-slide

  // Prevent link click when user just finished dragging
  const handleSliderClickCapture = (e) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
    }
  };

  // Mouse drag-to-scroll: start drag (call from each wrapper's onMouseDown)
  const handleSliderMouseDown = (e, config) => {
    if (e.button !== 0 || !config.sliderRef?.current) return;
    e.preventDefault();
    const itemWidth = typeof config.getItemWidth === 'function' ? config.getItemWidth() : config.getItemWidth;
    const startTranslate = -config.currentIndex * itemWidth;
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

  // Window listeners for drag (mousemove + mouseup)
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
      const itemWidth = typeof d.getItemWidth === 'function' ? d.getItemWidth() : d.getItemWidth;
      let nearestIndex = Math.round(-d.lastTranslate / itemWidth);
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

  // Smooth video loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // When video is near the end (last 0.5 seconds), fade out
      if (video.duration - video.currentTime < 0.5) {
        video.style.opacity = '0';
      }
    };

    const handleEnded = () => {
      // Fade in when video restarts
      video.currentTime = 0;
      video.style.opacity = '1';
      video.play();
    };

    const handleSeeking = () => {
      // Fade in when video seeks (for smooth restart)
      if (video.currentTime < 0.1) {
        video.style.opacity = '1';
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, []);

  return (
    <>
      <div className="casino_hero_s">
        {/* Desktop: video background */}
        <div className="hero_bg_video_wrapper">
          <video
            ref={videoRef}
            className="hero_bg_video"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="images/herobg.mp4" type="video/mp4" />
          </video>
        </div>
        {/* Aviator SVG: float left-bottom → top-right, then restart (mobile) */}
        <div className="hero_avitor_svg" aria-hidden="true">
          <img src="images/avitor.svg" alt="" />
        </div>
        {/* Mobile only: Aviator (lift+right), Cricket, Casino – full animations */}
        <div className="hero_mobile_animation" aria-hidden="true">
          <div className="hero_mobile_anim_bg">
            <div className="hero_mobile_bg_planet" />
            <div className="hero_mobile_bg_glow" />
          </div>
          {/* Cricket: ball in arc + stumps (stumps on right) */}
          <div className="hero_mob_cricket_ball" />
          <div className="hero_mob_cricket_stumps" />
          {/* Casino: dice roll + cards float */}
          <div className="hero_mob_casino_dice"><i className="ri-dice-5-fill" aria-hidden="true" /></div>
          <div className="hero_mob_casino_card"><i className="ri-poker-spades-fill" aria-hidden="true" /></div>
          <div className="hero_mob_casino_chip" />
        </div>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <div className="casino_hero_s_lft">
                <h1><span>Your Ultimate</span> Casino &amp; Sports Gaming Hub</h1>
                <p>Play Casino. Bet on Sports. Win Big.</p>

                <div className="d-flex align-items-center gap-3 mt-4">
                  <button type="button" className="btnbnr" onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'signup' }))}>Sign Up and Play</button>
                  <ul className="social_icons d-flex align-items-center gap-2 hero_activity_icons">
                    <li><Link to="/casino" className="social_icon_btn" title="Casino" aria-label="Casino"><i className="ri-poker-spades-fill" /></Link></li>
                    <li><Link to="/sports" className="social_icon_btn" title="Sports" aria-label="Sports"><i className="ri-basketball-fill" /></Link></li>
                    <li><Link to="/game" className="social_icon_btn" title="Slots" aria-label="Slots"><i className="ri-dice-5-fill" /></Link></li>
                    <li><Link to="/casino" className="social_icon_btn" title="Games" aria-label="Games"><i className="ri-focus-3-fill" /></Link></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="casino_bnr_img">
                <img fetchPriority="high" src="images/heroimg_chibi_fire.svg" alt="casino" />
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="container-fluid mobileview">
<div className="casino_sport_mobile_section">

      <div className="casinobox_item">
        <Link to="/casino" className="casino_lft" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>Casino <i class="ri-arrow-right-s-line"></i></h3>
          <div className="gameimg">
            <img src="images/casino_vector.svg" alt="game" />
          </div>
        </Link>
      </div>
      <div className="casinobox_item  sport_bg">
        <Link to="/sports" className="casino_lft" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3>Sport <i class="ri-arrow-right-s-line"></i></h3>  
          <div className="gameimg">
            <img src="images/sport_vector.svg" alt="game" />
          </div>
        </Link>
      </div>
  </div>
</div>

      <div className="landing_page_content">
        <div className="top_slot_outer">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2">TOP SLOTS</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/casino"><button type="button" className="slotbtn">Go to Slots</button></Link>
              </div>
            </div>

            <div
              className="game_items_slider_wrapper"
              onMouseDown={(e) => handleSliderMouseDown(e, {
                sliderRef,
                getItemWidth: 178 + 18,
                itemsPerSet: itemsPerSet,
                currentIndex,
                setIndex: setCurrentIndex,
              })}
              onClickCapture={handleSliderClickCapture}
              style={{ cursor: 'grab' }}
            >
              <div className="game_items_slider" ref={sliderRef}>
                {topSlotsDisplayItems.map((item, index) => (
                  item.viewAll ? (
                    <Link key="view-all-slots" to={item.to} className="game_items_inner slider_view_all_card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                    <Link key={`${item.id}-${index}`} to="/casino" className="game_items_inner" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <div className='playbtn'>
                        <img loading="lazy" src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img loading="lazy" src={item.image} alt="game" />
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="top_match_section">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2">TOP Sports</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/sports"><button type="button" className="slotbtn">Go to Sports</button></Link>
              </div>
            </div>

          <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
              sliderRef: topSportsSliderRef,
              getItemWidth: 178 + 8,
              itemsPerSet: topSportsItemsPerSet,
              currentIndex: topSportsIndex,
              setIndex: setTopSportsIndex,
            })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className='match_slider_sports d-flex align-items-center gap-2' ref={topSportsSliderRef}>
              {topSportsDisplayItems.map((item, index) => (
                item.viewAll ? (
                  <Link key="view-all-sports" to={item.to} className="match_slider_sports_item slider_view_all_card sports_view_all" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <span className="slider_view_all_text">View All</span>
                  </Link>
                ) : (
                  <div key={`topsports-${item.id}-${index}`} className='match_slider_sports_item'>
                    <div className='spot_value'>{item.badge}</div>
                    <img loading="lazy" src={`images/${item.icon}`} alt="match" />
                    <h3>{item.title}</h3>
                  </div>
                )
              ))}
            </div>
      </div>
        </div>
      </div>

        <div className="casino_sport_section">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-6">
                <Link to="/casino" className="casino_sport_section_lft" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="cntlft">
                    <h3>Casino</h3>
                    <p>Enjoy BetFury Originals and other casino games from top providers.</p>
                  </div>
                  <div className="gameimg">
                    <img loading="lazy" src="images/gold_img.png" alt="game" />
                  </div>
                </Link>
              </div>
              <div className="col-md-6">
                <Link to="/sports" className="casino_sport_section_lft sport_bg" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="cntlft">
                    <h3>Sport</h3>
                    <p>Bet on popular sports events with high odds and other great features.</p>
                  </div>
                  <div className="gameimg">
                    <img loading="lazy" src="images/sports_img.png" alt="game" />
                  </div>
                </Link>
              </div>
              <div className="col-md-12 desktopview">
                <div className="casino_sport_section_lft casino_bg2">
                  <div className="cntlft">
                    <h3>Sport</h3>
                    <p>Bet on popular sports events with high odds and other great features.</p>
                  </div>
                  <div className="gameimg">
                    <img loading="lazy" src="images/gold_img.png" alt="game" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

   

      <div className='playearn_section'>
          <div className='container-fluid'>
            <div className='row'>
              <div className='col-md-8'>
                <div className='playearn_big_lft'>
                  <div className='playearn_big_lft_cnt'>
                    <h2>PLAY & EARN BIG</h2>
                    <p>Daily rewards, instant wins aur non-stop fun.</p>
                    <Link to="/game"><button type="button" className='playearn_btn'>Start Playing</button></Link>
                  </div>
                  <div className='playearn_big_rgt'>
                    <img loading="lazy" src="images/golden_treasure.svg" alt="PLAY & EARN BIG" />
                  </div>
                </div>
              </div>
              <div className='col-md-4 desktopview'>
                <div className='gameright_s d-flex'>

                  <div className='gameright_s_item'>
                    <div className='gameright_s_item_cnt'>
                      <h4>YOUR LUCK
                        STARTS HERE</h4>
                      <p>Exclusive games. Real rewards. Zero boredom.</p>
                    </div>
                    <div className='gameright_s_item_img'>
                      <img loading="lazy" src="images/luxury_casino.svg" alt="YOUR LUCK STARTS HERE" />
                    </div>
                  </div>

                  <div className='gameright_s_item rewardsbg'>
                    <div className='gameright_s_item_cnt'>
                      <h4>TURN FUN INTO REWARDS</h4>
                      <p>Spin, play, and unlock exciting prizes every day.</p>
                    </div>
                    <div className='gameright_s_item_img'>
                      <img loading="lazy" src="images/3d_gift_box.svg" alt="TURN FUN INTO REWARDS" />
                    </div>
                  </div>

                </div>
              </div>

              <div className='col-md-3 desktopview'>
                <Link to="/casino" className='gameright_s_item height0 casinozone_s' style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className='gameright_s_item_cnt'>
                    <h4>Casino Zone</h4>
                    <p>Slots, cards & instant win games</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/3d_casino_games.svg" alt="Casino Zone" />
                  </div>
                </Link>

              </div>

              <div className='col-md-3 desktopview'>
                <Link to="/sports" className='gameright_s_item height0 sportsbg2' style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className='gameright_s_item_cnt'>
                    <h4>Sports Arena</h4>
                    <p>Live matches & smart predictions</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/astronaut_spacesuit.svg" alt="Sports Arena" />
                  </div>
                </Link>

              </div>

              <div className='col-md-3 desktopview'>
                <Link to="/rank" className='gameright_s_item height0 rewardsbg2' style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className='gameright_s_item_cnt'>
                    <h4>Daily Rewards</h4>
                    <p>Log in daily and unlock exciting gifts.</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/3d_gift_box_isolated.svg" alt="Daily Rewards" />
                  </div>
                </Link>

              </div>


              <div className='col-md-3 desktopview'>
                <Link to="/rank" className='gameright_s_item height0 battlebg' style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div className='gameright_s_item_cnt'>
                    <h4>Battle Mode</h4>
                    <p>Compete with others and climb the leaderboard.</p>
                  </div>
                  <div className='gameright_s_item_img'>
                    <img loading="lazy" src="images/alien_head.svg" alt="Battle Mode" />
                  </div>
                </Link>

              </div>

            </div>
          </div>
        </div>


        <div className="top_match_section sportsmatch_s">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <Link to="/sports" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="heading_h2" style={{ cursor: 'pointer' }}>TOP Matches</h2></Link>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/sports"><button type="button" className="slotbtn">Go to Sports</button></Link>
              </div>
            </div>

          <div
            className='match_slider_wrapper'
            onMouseDown={(e) => handleSliderMouseDown(e, {
              sliderRef: topMatchesSliderRef,
              getItemWidth: getTopMatchesItemWidth,
              itemsPerSet: topMatchesItemsPerSet,
              currentIndex: topMatchesIndex,
              setIndex: setTopMatchesIndex,
            })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className='match_slider_container' ref={topMatchesSliderRef}>
                {topMatchesDisplayItems.map((match, index) => (
                  match.viewAll ? (
                    <Link key="view-all-matches" to={match.to} className='match_slider slider_view_all_card matches_view_all' style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                  <Link key={`topmatch-${match.id}-${index}`} to="/sports" className='match_slider' style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div className='match_slider_inner'>
                      <div className='matchtp_hd d-flex justify-content-between align-items-center gap-2'>
                        <div className='hd_match d-flex align-items-center gap-2'>
                          <img loading="lazy" src="images/cricket_world.png" alt="match" />
                          <h3>Match</h3>
                        </div>
                        <ul>
                          <li>MO</li>
                          <li>BM</li>
                          <li>F</li>
                        </ul>
                      </div>
                      <p>{match.tournament}</p>
                      <div className='match_info'>
                        <p className='match_team'>{match.teams}</p>
                        <span>{match.time}</span>
                      </div>
                      <div className='d-flex justify-content-between align-items-center gap-2'>
                        <div className='view_matchlike'>
                          <button type="button" className='view_match' onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>{match.viewCount} <span>{match.viewK}</span></button>
                          <button type="button" className='like_match' onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>{match.likeCount} <span>{match.likeK}</span></button>
                        </div>
                        <div className='view_matchlike'>
                          <button type="button" className='view_match disabled' onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><i className="ri-lock-line"></i></button>
                          <button type="button" className='like_match disabled' onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><i className="ri-lock-line"></i></button>
                        </div>
                        <div className='view_matchlike'>
                          <button type="button" className='view_match' onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>{match.viewCount} <span>{match.viewK}</span></button>
                          <button type="button" className='like_match' onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>{match.likeCount} <span>{match.likeK}</span></button>
                        </div>
                      </div>
                    </div>
                  </Link>
                  )
                ))}
              </div>
            </div>


          </div>
        </div>

        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2">BetCasino Original</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/casino"><button type="button" className="slotbtn">Go to Casino</button></Link>
              </div>
            </div>

          <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
              sliderRef: betCasinoSliderRef,
              getItemWidth: 178 + 18,
              itemsPerSet: betCasinoItemsPerSet,
              currentIndex: betCasinoIndex,
              setIndex: setBetCasinoIndex,
            })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className="game_items_slider mt-2" ref={betCasinoSliderRef}>
              {betCasinoDisplayItems.map((item, index) => (
                  item.viewAll ? (
                    <Link key="view-all-betcasino" to={item.to} className="game_items_inner slider_view_all_card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                  <Link key={`betcasino-${item.id}-${index}`} to="/casino" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div className='playbtn'>
                      <img loading="lazy" src="images/playbtn.png" alt="game" />
                    </div>
                    {item.badge && (
                      <div className="top_ads">
                        {item.badge}
                      </div>
                    )}
                    <img loading="lazy" src={item.image} alt="game" />
                  </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src="images/live_icon.svg" alt="game" /> Live Casino</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/casino"><button type="button" className="slotbtn">All 1159</button></Link>
              </div>
            </div>

          <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
              sliderRef: liveCasinoSliderRef,
              getItemWidth: 178 + 18,
              itemsPerSet: liveCasinoItemsPerSet,
              currentIndex: liveCasinoIndex,
              setIndex: setLiveCasinoIndex,
            })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className="game_items_slider mt-2" ref={liveCasinoSliderRef}>
              {liveCasinoDisplayItems.map((item, index) => (
                  item.viewAll ? (
                    <Link key="view-all-livecasino" to={item.to} className="game_items_inner slider_view_all_card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                  <Link key={`livecasino-${item.id}-${index}`} to="/casino" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div className='playbtn'>
                      <img loading="lazy" src="images/playbtn.png" alt="game" />
                    </div>
                    {item.icon && (
                      <div className="top_icon">
                        <img loading="lazy" src={`images/${item.icon}.svg`} alt="game" />
                      </div>
                    )}
                    <img loading="lazy" src={item.image} alt="game" />
                  </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>


        <div className="top_slot_outer top_slot_outer_casino">
          <div className="container-fluid">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img loading="lazy" src="images/crownicon.svg" alt="game" /> Highroller Hall</h2>
              <div className="top_hd_right d-flex align-items-center gap-2">
                <Link to="/casino"><button type="button" className="slotbtn">All 20</button></Link>
              </div>
            </div>

          <div
            className="game_items_slider_wrapper"
            onMouseDown={(e) => handleSliderMouseDown(e, {
              sliderRef: highrollerSliderRef,
              getItemWidth: 178 + 18,
              itemsPerSet: highrollerItemsPerSet,
              currentIndex: highrollerIndex,
              setIndex: setHighrollerIndex,
            })}
            onClickCapture={handleSliderClickCapture}
            style={{ cursor: 'grab' }}
          >
            <div className="game_items_slider mt-2" ref={highrollerSliderRef}>
              {highrollerDisplayItems.map((item, index) => (
                  item.viewAll ? (
                    <Link key="view-all-highroller" to={item.to} className="game_items_inner slider_view_all_card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                      <span className="slider_view_all_text">View All</span>
                    </Link>
                  ) : (
                  <Link key={`highroller-${item.id}-${index}`} to="/casino" className="game_items_inner" style={{ display: 'block', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                    <div className='playbtn'>
                      <img loading="lazy" src="images/playbtn.png" alt="game" />
                    </div>
                    {item.icon && (
                      <div className="top_icon">
                        <img loading="lazy" src={`images/${item.icon}.svg`} alt="game" />
                      </div>
                    )}
                    <img loading="lazy" src={item.image} alt="game" />
                  </Link>
                  )
                ))}
            </div>
            </div>
          </div>
        </div>

        <div className='container-fluid support_help_container'>
          <div className='support_help_card'>
            <i className='ri-customer-service-2-fill support_help_card_icon' aria-hidden="true" />
            <p className='support_help_card_text'>Need help? Our 24/7 support is here for you.</p>
          </div>
        </div>

        <div className="container-fluid p_space_footer landing_footer_section">
          <div className="d-flex topfooter">
            <div className="secure_img">
              <img src="/images/secure.png" alt="game" />
            </div>
            <div className="safe_cnt">
              <h5>Secure &amp; Private</h5>
              <p>Your data is protected with encryption. Bet and play with a secure, private connection.</p>
            </div>
          </div>
          <div className="footer_description_container">
            <div
              className="footer_description_content crownbet_content"
              style={{
                maxHeight: showMore ? 'none' : '320px',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease-out',
                position: 'relative',
              }}
            >
              <h2 className="crownbet_title">Crypto Sports Betting at CrownBet</h2>
              <p>CrownBet is a BTC sport betting site where you can wager on thousands of sports events using Bitcoin and 50+ other cryptocurrencies. Live odds, pre-match markets, fast payouts, and no banking fees. That&apos;s what you get here.</p>
              <p>Whether you follow soccer, basketball, or MMA, we cover it all. You can also bet on eSports tournaments happening around the clock. The platform works 24/7, so there&apos;s always something to bet on.</p>

              <h3 className="crownbet_heading">Why Choose a Bitcoin Sportsbook?</h3>
              <p>Crypto sports betting changes how people gamble online. No bank delays. No extra fees eating into your winnings. Your deposits hit your account in minutes, and withdrawals work just as fast.</p>
              <p>Here&apos;s what makes betting with bitcoin different from traditional methods:</p>
              <ul className="crownbet_list crownbet_list_bullet">
                <li><strong>Speed:</strong> Crypto deposits confirm in minutes, not days</li>
                <li><strong>Lower costs:</strong> No middleman fees from banks or payment processors</li>
                <li><strong>Privacy:</strong> You control your funds without sharing banking details</li>
                <li><strong>Global access:</strong> Bet from anywhere without currency conversion headaches</li>
                <li><strong>True ownership:</strong> Your crypto stays yours until you decide to bet</li>
              </ul>
              <p>Bitcoin&apos;s price can swing up or down, which some bettors actually like. Win a bet when BTC is low, and your winnings might grow if the price rises later. It&apos;s a bit of a double game, honestly.</p>

              <h3 className="crownbet_heading">Sports You Can Bet On</h3>
              <p>Our sportsbook covers pretty much every major sport. From the Premier League to La Liga and Serie A, soccer fans have tons of options.</p>
              <p>American sports are well represented too, with full coverage of the NBA, NFL, MLB, and NHL.</p>
              <p>Tennis betting includes the ATP Tour, WTA Tour, and Grand Slam tournaments.</p>
              <p>Combat sports fans can bet on boxing matches and Ultimate Fighting Championship events through the MMA section. Volleyball and American football round out the traditional sports lineup.</p>
              <p>Want something different? Horse racing markets let you bet on races from major tracks worldwide.</p>

              <h3 className="crownbet_heading">Esports Betting</h3>
              <p>Esports betting keeps growing. Millions watch competitive gaming, and our crypto sportsbook lets you bet with crypto on the biggest tournaments.</p>
              <p>The esports section includes:</p>
              <ul className="crownbet_list crownbet_list_dash">
                <li><strong>Dota 2</strong> – The International and DPC events</li>
                <li><strong>Counter-Strike 2</strong> – Major championships and ESL tournaments</li>
                <li><strong>League of Legends</strong> – Worlds, LCS, LEC, and regional leagues</li>
                <li><strong>StarCraft II</strong> – GSL and international competitions</li>
                <li><strong>Honor of Kings</strong> – One of Asia&apos;s most popular mobile esports</li>
              </ul>
              <p>Esports matches run around the clock since tournaments happen across different time zones. You&apos;ll find odds on matches from North America, Europe, China, Korea, and Southeast Asia.</p>

              <h3 className="crownbet_heading">Virtual Sports Betting</h3>
              <p>Can&apos;t wait for real matches? Virtual sports fill the gaps. These are simulated games with quick results, usually finishing within minutes.</p>
              <p>We offer eSoccer and eSoccer Volta for virtual football action. eBasketball simulates NBA-style games. eRocket League brings the popular car-soccer video game to betting markets.</p>
              <p>Virtual sports run 24/7 with new events starting every few minutes. Results come from random number generators, so past performance doesn&apos;t predict future outcomes. Think of them as quick entertainment between real matches.</p>

              <h3 className="crownbet_heading">Understanding Betting Markets</h3>
              <p>New to sports betting with Bitcoin? Here&apos;s how the main bet types work.</p>
              <div className="crownbet_table_wrap">
                <table className="crownbet_table">
                  <thead>
                    <tr>
                      <th>Market Type</th>
                      <th>What It Means</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Moneyline/Winner</td><td>Pick who wins the match</td><td>Team A to beat Team B</td></tr>
                    <tr><td>Handicap/Spread</td><td>Team must win by certain margin</td><td>Team A -1.5 goals</td></tr>
                    <tr><td>Over/Under (Totals)</td><td>Combined score above or below a number</td><td>Over 2.5 goals in match</td></tr>
                    <tr><td>1X2</td><td>Home win, draw, or away win</td><td>Used mainly in soccer</td></tr>
                    <tr><td>Prop Bets</td><td>Specific events within a game</td><td>First goalscorer, total corners</td></tr>
                    <tr><td>Outright/Futures</td><td>Season-long predictions</td><td>League winner, MVP</td></tr>
                  </tbody>
                </table>
              </div>
              <p>Handicap betting levels the playing field between mismatched teams. If you bet on a strong favorite at -1.5, they need to win by at least 2 goals for your bet to pay out. The underdog at +1.5 just needs to lose by 1 or draw or win.</p>
              <p>Live betting lets you place wagers while games are happening. Odds shift based on the action, so you can react to what you&apos;re watching.</p>

              <h3 className="crownbet_heading">Cryptocurrencies Accepted for Betting</h3>
              <p>Our bitcoin sportsbook isn&apos;t limited to BTC. CrownBet accepts over 50 different cryptocurrencies for deposits and withdrawals.</p>
              <p>Popular options include Bitcoin, Ethereum, Litecoin, Tether (USDT), Ripple (XRP), and Dogecoin. Stablecoins like USDT let you avoid crypto price swings if that concerns you.</p>
              <p>Deposits process quickly once network confirmations complete. Withdrawals go straight to your wallet without waiting for bank approval.</p>
              <p>No minimum deposits exist for most cryptocurrencies, making it easy to start small.</p>

              <h3 className="crownbet_heading">The BFG Token Advantage</h3>
              <p>BFG is CrownBet&apos;s own cryptocurrency. You can buy it, earn it through casino games, and use it for betting.</p>
              <p>BFG holders can stake their tokens and earn passive income from the platform&apos;s profits. The more BFG you hold and stake, the more you earn from daily payouts.</p>
              <p>You earn BFG automatically when playing casino games. Sports betting doesn&apos;t generate BFG directly, but the tokens you earn elsewhere work perfectly for placing sports wagers.</p>

              <h3 className="crownbet_heading">How to Start Bitcoin Sports Betting</h3>
              <p>Getting started takes just a few minutes:</p>
              <ol className="crownbet_list crownbet_list_numbered">
                <li>Create an account</li>
                <li>Deposit crypto</li>
                <li>Browse the sports section</li>
                <li>Add selections to your bet slip</li>
                <li>Enter your stake and confirm</li>
              </ol>
              <p>Single bets are straightforward. Parlays (accumulators) combine multiple selections into one bet with higher potential payouts. Every selection must win for a parlay to pay out.</p>

              <h3 className="crownbet_heading">Bonuses and Promotions</h3>
              <p>CrownBet offers various bonuses for sports bettors, including:</p>
              <ul className="crownbet_list crownbet_list_tick">
                <li>Welcome bonuses</li>
                <li>Reload offers</li>
                <li>Cashback deals</li>
                <li>Special event promotions</li>
              </ul>
              <p>The promotions page shows all current offers and gets updated regularly.</p>

              <h3 className="crownbet_heading">Tips for Crypto Sports Betting Success</h3>
              <ul className="crownbet_list crownbet_list_tick">
                <li>Know your sport before placing bets</li>
                <li>Start with simple markets like moneyline or totals</li>
                <li>Set bankroll limits</li>
                <li>Avoid chasing losses</li>
                <li>Practice live betting with small stakes first</li>
              </ul>

              <h3 className="crownbet_heading">What Makes a Good Bitcoin Bookmaker?</h3>
              <p>When looking for the best Bitcoin sportsbook, focus on:</p>
              <ul className="crownbet_list crownbet_list_tick">
                <li>Wide variety of sports and markets</li>
                <li>Fast withdrawals</li>
                <li>Strong security</li>
                <li>Competitive odds</li>
                <li>Reliable customer support</li>
              </ul>
              <p>Even small differences in odds can impact long-term results.</p>

              <h3 className="crownbet_heading">Why Choose CrownBet?</h3>
              <p>CrownBet combines crypto sports betting with a complete casino section. You can switch between sports wagers and casino games seamlessly.</p>
              <ul className="crownbet_list crownbet_list_tick">
                <li>24/7 customer support</li>
                <li>Fast crypto withdrawals</li>
                <li>Mobile-friendly interface</li>
                <li>Thousands of betting markets</li>
                <li>Competitive odds</li>
              </ul>

              <h3 className="crownbet_heading">Final Thoughts on Betting with BTC</h3>
              <p>Crypto betting offers speed and convenience that traditional sportsbooks can&apos;t match. CrownBet delivers thousands of betting markets across dozens of sports, all accessible with Bitcoin and other major cryptocurrencies.</p>
              <p>The combination of traditional sports, esports, and virtual sports means there&apos;s always action available. Whether you&apos;re following the Premier League, watching NBA games, or betting on Counter-Strike majors, CrownBet provides a complete crypto sportsbook experience focused on variety, speed, and fair odds.</p>
            </div>
            <button
              type="button"
              className="footer_show_more_btn"
              onClick={() => setShowMore((prev) => !prev)}
              aria-expanded={showMore}
            >
              {showMore ? 'Show Less' : 'Show More'}
              <i className={showMore ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default LandingPage;
