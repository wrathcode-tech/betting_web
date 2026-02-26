import React, { useState } from 'react'
import Header from '../customComponents/Header'
import MobileMenu from '../customComponents/MobileMenu'
import './gamerules.css'

const FAQ_ITEMS = [
  {
    id: 1,
    q: 'How do I place a bet on sports?',
    a: 'Go to Sports, select a match, choose a market (e.g. Match Winner, Total Runs), click on the odds, enter your stake in the betslip, and confirm your bet. Your bet is active once the slip is submitted.',
  },
  {
    id: 2,
    q: 'What is the minimum deposit and withdrawal amount?',
    a: 'Minimum deposit is typically ₹500 and minimum withdrawal is ₹1,000. These limits may vary by payment method. Check the Deposit and Withdrawal pages for current limits.',
  },
  {
    id: 3,
    q: 'When are my bets settled?',
    a: 'Sports bets are settled after the event is completed and the result is confirmed. In-play bets are usually settled within a few minutes. Casino and games settle instantly after the round ends.',
  },
  {
    id: 4,
    q: 'What happens if a match is abandoned or void?',
    a: 'If a match is abandoned, postponed, or declared void as per our rules, all single bets on that match are void and your stake is returned. In accumulators, that selection is treated as void and the bet continues on the remaining selections.',
  },
  {
    id: 5,
    q: 'How do I claim a bonus or free bet?',
    a: 'Opt in to the offer (if required), meet the qualifying conditions (e.g. minimum deposit), and the bonus or free bet will be credited as per the offer terms. Check the Promotions page and your Bonus Statement for details.',
  },
  {
    id: 6,
    q: 'Is my personal and financial information secure?',
    a: 'Yes. We use encryption and secure payment channels. Your data is used only for account and transaction purposes and is not shared with third parties for marketing without your consent.',
  },
  {
    id: 7,
    q: 'Can I set limits on my account?',
    a: 'Yes. You can set deposit limits, loss limits, and session time limits from your account settings. We encourage responsible gaming and support self-exclusion if needed.',
  },
]

function GameRules() {
  const [openFaqId, setOpenFaqId] = useState(null)

  return (
    <>
      <Header />
      <div className="dashboard_page game_rules_page_wrap">
        <div className="container-fluid">
          <div className="game_rules_hero">
            <h1>Game Rules</h1>
            <p>Please read these rules carefully. All bets and game play are subject to these Game Rules and our Terms & Conditions.</p>
          </div>

          <div className="game_rules_grid">
            <section className="game_rules_card">
              <div className="game_rules_card_icon">
                <i className="ri-cricket-ball-line" aria-hidden />
              </div>
              <h2>Cricket Betting Rules</h2>
              <ul>
                <li><strong>Match result:</strong> Settled on the official result as declared by the governing body. For limited-overs matches, the result is after the scheduled overs (or revised overs in case of D/L or VJD). Tie, no result, or abandonment is settled as per the official competition rules.</li>
                <li><strong>Minimum overs:</strong> For match winner and most run markets, a minimum number of overs must be bowled for bets to stand: Test matches – at least 60 overs in the fourth innings (unless a result is achieved earlier); One-Day matches – at least 25 overs per side (or as per official rules); T20 – at least 10 overs per side (or as per official rules). If the match is reduced and the minimum is not met, match bets are void and stakes returned.</li>
                <li><strong>Duckworth-Lewis / VJD:</strong> Where the result is determined by D/L or VJD, that result is used for settlement. Bets placed after the interruption may be voided if the market was offered in error.</li>
                <li><strong>Postponement / Abandonment:</strong> If a match is postponed and not played on the scheduled date (or official reserve day where applicable), all bets on that match are void unless the match is played within the timeframe specified in the market rules. If a match is abandoned without an official result, match winner and similar markets are void; markets already determined (e.g. first innings runs, session runs) may be settled at the figure when play stopped.</li>
                <li><strong>Session / Fancy / Innings runs:</strong> Session and innings runs are settled at the score when the relevant session or innings is complete or when the match is officially stopped. Once a session is completed and settled, it is not reversed even if the match is later abandoned or no result.</li>
                <li><strong>Player markets (top batsman, runs, wickets):</strong> The player must take part in the match (bat or bowl as applicable) for bets to stand. If the player does not participate, bets are void. Settlement is based on official statistics.</li>
              </ul>
            </section>

            <section className="game_rules_card">
              <div className="game_rules_card_icon">
                <i className="ri-football-line" aria-hidden />
              </div>
              <h2>Football Betting Rules</h2>
              <ul>
                <li><strong>Match result (1X2, Draw No Bet, etc.):</strong> Settled on the result at the end of normal time (90 minutes plus injury time). Extra time and penalty shootouts do not count unless the market explicitly states “Including Extra Time” or “To Qualify”.</li>
                <li><strong>Postponement:</strong> If a match is postponed and not played within 48 hours of the original scheduled kick-off time (unless otherwise stated in the market), all bets on that match are void and stakes returned.</li>
                <li><strong>Abandonment:</strong> If a match is abandoned after kick-off and not resumed within 48 hours, all bets are void except for markets whose outcome has already been determined (e.g. first half result, first goal scorer if a goal was scored, corners in first half). Such determined markets are settled on the result at the time of abandonment.</li>
                <li><strong>Own goals:</strong> Count towards the team that benefits from the goal (the team that scores it) for total goals and correct score markets. For “first goal scorer” and “anytime scorer”, the player credited with the goal (including own goal) is the winner.</li>
                <li><strong>Cards and corners:</strong> Only cards shown to players on the field during normal time count. Corners awarded but not taken (e.g. match abandoned) do not count. Settlement is based on official match statistics.</li>
              </ul>
            </section>

            <section className="game_rules_card">
              <div className="game_rules_card_icon">
                <i className="ri-gamepad-line" aria-hidden />
              </div>
              <h2>Tennis & Other Sports</h2>
              <ul>
                <li><strong>Tennis – Match winner:</strong> Settled on the winner of the match. If a player retires or is disqualified, the player who advances is the winner and all match bets stand. Set and game markets may be void if not completed.</li>
                <li><strong>Walkover:</strong> If a player receives a walkover before the match has started, all bets on that match are void. If the match has started and a player retires, match winner bets stand on the player who advances.</li>
                <li><strong>Other sports:</strong> Settlement is based on the official result and rules of the governing body for that sport. In case of dispute, our decision (based on official sources) is final.</li>
              </ul>
            </section>

            <section className="game_rules_card">
              <div className="game_rules_card_icon">
                <i className="ri-dice-5-fill" aria-hidden />
              </div>
              <h2>Casino & Games Rules</h2>
              <ul>
                <li><strong>Teen Patti (3 Patti):</strong> Standard Teen Patti rules apply as displayed in the game. Hand rankings (Trail, Pure Sequence, Sequence, Color, Pair, High Card) are as per the game rules. In case of tie, the hand with higher value wins as per the game’s tie rules. Dealer’s decision in live games is final.</li>
                <li><strong>Roulette:</strong> Results are determined by the ball landing in a numbered pocket. Single-zero and double-zero rules apply as per the variant. Outside bets (Red/Black, Odd/Even, Dozens) are settled according to the number. Zero may result in loss of outside bets unless “La Partage” or “En Prison” applies as stated in the game.</li>
                <li><strong>Slots & RNG games:</strong> Outcomes are determined by a certified Random Number Generator (RNG). Each spin or round is independent. Game rounds are final once the result is displayed. In case of malfunction (e.g. game freeze, incorrect display), the round may be voided and stakes returned; we will not pay out on incorrect results.</li>
                <li><strong>Live dealer:</strong> Live dealer games follow the rules displayed in the game. The dealer’s decision is final. If there is a dispute due to stream or technical error, we may void the round and refund stakes.</li>
                <li><strong>Bonuses:</strong> Bonus offers (welcome bonus, free spins, cashback, etc.) are subject to wagering requirements, game weightings, and time limits as stated in the offer terms. Bonus abuse (e.g. multiple accounts, chip dumping) will result in forfeiture of bonus and winnings and possible account closure.</li>
              </ul>
            </section>

            <section className="game_rules_card">
              <div className="game_rules_card_icon">
                <i className="ri-file-list-3-line" aria-hidden />
              </div>
              <h2>General Rules</h2>
              <ul>
                <li><strong>Eligibility:</strong> You must be at least 18 years of age (or the legal age for gambling in your jurisdiction) to open an account and place bets or play games. You must not be resident in a jurisdiction where online betting or gaming is prohibited.</li>
                <li><strong>One account:</strong> Only one account per person, household, IP address, or device is permitted. Multiple accounts may be detected, closed, and balances withheld. You must provide accurate registration and KYC details; failure to do so may result in account closure and forfeiture of funds.</li>
                <li><strong>Odds and stakes:</strong> Odds at the time of bet placement are final. We reserve the right to limit stakes, refuse bets, or void bets placed in error (e.g. incorrect odds due to technical fault, obvious pricing error). Maximum payouts may apply as stated in our Terms.</li>
                <li><strong>Responsible gaming:</strong> We promote responsible gaming. You can set deposit limits, loss limits, and session time limits from your account. Self-exclusion is available. If you need help, please use the responsible gaming tools or contact support.</li>
                <li><strong>Agreement:</strong> By placing a bet or playing a game, you agree to these Game Rules and our Terms & Conditions. We reserve the right to amend these rules; continued use of the service constitutes acceptance of the updated rules.</li>
              </ul>
            </section>

            <section className="game_rules_card">
              <div className="game_rules_card_icon">
                <i className="ri-shield-check-line" aria-hidden />
              </div>
              <h2>Settlement, Void & Fair Play</h2>
              <ul>
                <li><strong>Official result:</strong> All settlements are based on the official result, statistics, and rules of the relevant governing body or game provider. We do not accept responsibility for incorrect data from third-party feeds; we will correct settlements when the official result is confirmed.</li>
                <li><strong>Dead heat:</strong> Where two or more selections tie for a position (e.g. top batsman tie), dead heat rules apply: payout is (stake × (odds ÷ number of tied selections)). Stake is not multiplied by the number of ties.</li>
                <li><strong>Void bets:</strong> Bets may be voided if the event is cancelled, abandoned, or declared void; if the market was offered in error; or if there is evidence of fraud, manipulation, or breach of terms. Stakes will be returned for void bets.</li>
                <li><strong>Fair play:</strong> Our games and RNG are tested for fairness. Any attempt to cheat, collude, use bots, or abuse promotions will result in account closure, forfeiture of funds, and we may report to authorities. If you have a dispute, contact support with your username and bet/transaction ID; we will investigate and respond in line with our dispute policy.</li>
              </ul>
            </section>
          </div>

          <div className="game_rules_faq_section">
            <h2 className="game_rules_faq_title">
              <i className="ri-question-line" aria-hidden />
              Frequently Asked Questions
            </h2>
            <div className="game_rules_faq_list">
              {FAQ_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`game_rules_faq_item ${openFaqId === item.id ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="game_rules_faq_question"
                    onClick={() => setOpenFaqId(openFaqId === item.id ? null : item.id)}
                    aria-expanded={openFaqId === item.id}
                  >
                    <span>{item.q}</span>
                    <i className="ri-arrow-down-s-line game_rules_faq_arrow" aria-hidden />
                  </button>
                  <div className="game_rules_faq_answer_wrap">
                    <p className="game_rules_faq_answer">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="game_rules_help_cta">
            <p>Still have questions?</p>
            <button
              type="button"
              className="game_rules_help_btn"
              onClick={() => window.dispatchEvent(new CustomEvent('openChat'))}
            >
              <i className="ri-customer-service-2-line" aria-hidden />
              Contact Support
            </button>
          </div>
        </div>
      </div>
      <MobileMenu />
    </>
  )
}

export default GameRules
