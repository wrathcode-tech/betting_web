import React from 'react';
import './promotions.css'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'

function Promotions() {
  return (
    <>
    <Header />
    <div className="new_deposit_page">
        <div className='promotions_top_hd'>
            <h1>Promotions</h1>
            <p>All promotions will be shown here.</p>
        </div>

<div className='promotions_grid'>

        <div className='promotions_block'>
            <div className='promotions_content_item'>
                <h2>Play Smart. 
                Win Big.</h2>
                <p>Classic cards with thrilling rewards!</p>
            </div>
            <div className='promotions_img_item'>
                <img src="images/smiling_cartoon.png" alt="Promotions" width="200" height="200" decoding="async" loading="lazy" />
            </div>
        </div>

        <div className='promotions_block runfast_block'>
            <div className='promotions_content_item'>
                <h2>Run Fast. 
                Win Big.</h2>
                <p>Stay in the game and multiply your rewards.</p>
            </div>
            <div className='promotions_img_item'>
                <img src="images/fun_chicken.png" alt="Promotions" width="200" height="200" decoding="async" loading="lazy" />
            </div>
        </div>

        <div className='promotions_block realdealers_block'>
            <div className='promotions_content_item'>
                <h2>Real Dealers. 
                Real Action.</h2>
                <p>Experience the thrill of live casino games anytime.</p>
            </div>
            <div className='promotions_img_item'>
                <img src="images/dealers_vector.png" alt="Promotions" width="200" height="200" decoding="async" loading="lazy" />
            </div>
        </div>


        <div className='promotions_block startbig_block'>
            <div className='promotions_content_item'>
                <h2>Start Big. 
                Win Bigger.</h2>
                <p>Get a big boost on your first deposit.</p>
            </div>
            <div className='promotions_img_item'>
                <img src="images/startbig_vector.png" alt="Promotions" />
            </div>
        </div>


        <div className='promotions_block basketball_block'>
            <div className='promotions_content_item'>
                <h2>Basketball 
                Bets</h2>
                <p>Real-Time Odds. Real-Time Thrill.</p>
            </div>
            <div className='promotions_img_item'>
                <img src="images/basketball_vector.png" alt="Promotions" width="200" height="200" decoding="async" loading="lazy" />
            </div>
        </div>



        <div className='promotions_block cricket_block'>
            <div className='promotions_content_item'>
                <h2>Play Smart. 
                Score More.</h2>
                <p>Bet on every over and cash out strong!</p>
            </div>
            <div className='promotions_img_item'>
                <img src="images/cricket_player.png" alt="Promotions" width="200" height="200" decoding="async" loading="lazy" />
            </div>
        </div>

        </div>


    </div>
    <MobileMenu />
    </>
  );
}

export default Promotions;