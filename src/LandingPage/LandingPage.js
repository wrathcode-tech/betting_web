import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import UserHeader from '../customComponents/UserHeader';
import Footer from '../customComponents/footer';

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
    { id: 3, badge: 'Hot', icon: 'basketball_icon.svg', title: 'Basketball' },
    { id: 4, badge: 'Hot', icon: 'soccer_icon.svg', title: 'Soccer' },
    { id: 5, badge: 'Hot', icon: 'horse_icon.svg', title: 'Horse Racing' },
    { id: 6, badge: 'Hot', icon: 'nba_icon.svg', title: 'NBA 2K' },
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
      <UserHeader />
      <div className="casino_hero_s">
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
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="casino_hero_s_lft">
                <h1><span>WELCOME BONUS</span> UP TO 590%</h1>
                <p>+ 225 Free Spins</p>

                <div className="d-flex align-items-center gap-3 mt-4">
                  <button type="button" className="btnbnr" onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'signup' }))}>Sign Up and Play</button>
                  <ul className="social_icons d-flex align-items-center gap-2">
                    <li><button type="button" className="social_icon_btn"><img src="images/googleicon.svg" alt="google" /></button></li>
                    <li><button type="button" className="social_icon_btn"><img src="images/telegramicon.svg" alt="telegram" /></button></li>
                    <li><button type="button" className="social_icon_btn"><img src="images/walleticon.svg" alt="wallet" /></button></li>
                    <li><button type="button" className="social_icon_btn"><img src="images/trusticon.svg" alt="trust" /></button></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="casino_bnr_img">
                <img src="images/heroimg_chibi_fire.svg" alt="casino" />
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="container mobileview">
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
          <div className="container">
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
                        <img src="images/playbtn.png" alt="game" />
                      </div>
                      {item.badge && (
                        <div className="top_ads">
                          {item.badge}
                        </div>
                      )}
                      <img src={item.image} alt="game" />
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="top_match_section">
          <div className="container">
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
                    <img src={`images/${item.icon}`} alt="match" />
                    <h3>{item.title}</h3>
                  </div>
                )
              ))}
            </div>
      </div>
        </div>
      </div>

        <div className="casino_sport_section">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <Link to="/casino" className="casino_sport_section_lft" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="cntlft">
                    <h3>Casino</h3>
                    <p>Enjoy BetFury Originals and other casino games from top providers.</p>
                  </div>
                  <div className="gameimg">
                    <img src="images/gold_img.png" alt="game" />
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
                    <img src="images/sports_img.png" alt="game" />
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
                    <img src="images/gold_img.png" alt="game" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

   

      <div className='playearn_section'>
          <div className='container'>
            <div className='row'>
              <div className='col-md-8'>
                <div className='playearn_big_lft'>
                  <div className='playearn_big_lft_cnt'>
                    <h2>PLAY & EARN BIG</h2>
                    <p>Daily rewards, instant wins aur non-stop fun.</p>
                    <Link to="/game"><button type="button" className='playearn_btn'>Start Playing</button></Link>
                  </div>
                  <div className='playearn_big_rgt'>
                    <img src="images/golden_treasure.svg" alt="PLAY & EARN BIG" />
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
                      <img src="images/luxury_casino.svg" alt="YOUR LUCK STARTS HERE" />
                    </div>
                  </div>

                  <div className='gameright_s_item rewardsbg'>
                    <div className='gameright_s_item_cnt'>
                      <h4>TURN FUN INTO REWARDS</h4>
                      <p>Spin, play, and unlock exciting prizes every day.</p>
                    </div>
                    <div className='gameright_s_item_img'>
                      <img src="images/3d_gift_box.svg" alt="TURN FUN INTO REWARDS" />
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
                    <img src="images/3d_casino_games.svg" alt="Casino Zone" />
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
                    <img src="images/astronaut_spacesuit.svg" alt="Sports Arena" />
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
                    <img src="images/3d_gift_box_isolated.svg" alt="Daily Rewards" />
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
                    <img src="images/alien_head.svg" alt="Battle Mode" />
                  </div>
                </Link>

              </div>

            </div>
          </div>
        </div>


        <div className="top_match_section sportsmatch_s">
          <div className="container">
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
                          <img src="images/cricket_world.png" alt="match" />
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

        <div className="top_slot_outer">
          <div className="container">
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
                      <img src="images/playbtn.png" alt="game" />
                    </div>
                    {item.badge && (
                      <div className="top_ads">
                        {item.badge}
                      </div>
                    )}
                    <img src={item.image} alt="game" />
                  </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="top_slot_outer">
          <div className="container">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img src="images/live_icon.svg" alt="game" /> Live Casino</h2>
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
                      <img src="images/playbtn.png" alt="game" />
                    </div>
                    {item.icon && (
                      <div className="top_icon">
                        <img src={`images/${item.icon}.svg`} alt="game" />
                      </div>
                    )}
                    <img src={item.image} alt="game" />
                  </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>


        <div className="top_slot_outer">
          <div className="container">
            <div className="top_hd d-flex align-items-center justify-content-between">
              <h2 className="heading_h2"><img src="images/crownicon.svg" alt="game" /> Highroller Hall</h2>
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
                      <img src="images/playbtn.png" alt="game" />
                    </div>
                    {item.icon && (
                      <div className="top_icon">
                        <img src={`images/${item.icon}.svg`} alt="game" />
                      </div>
                    )}
                    <img src={item.image} alt="game" />
                  </Link>
                  )
                ))}
            </div>
            </div>
          </div>
        </div>

        <div className='container support_help_container'>
          <div className='support_help_s'>
            <p>Need help? Our 24/7 support team is here for you anytime!</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default LandingPage;
