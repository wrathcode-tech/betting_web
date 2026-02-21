/**
 * Casino game images used for all categories (same as main Casino page).
 */
const CASINO_GAME_IMAGES = [
  { id: 1, badge: 'Top', image: 'images/betcasino_img.png' },
  { id: 2, badge: null, image: 'images/betcasino_img2.png' },
  { id: 3, badge: 'Top', image: 'images/betcasino_img3.png' },
  { id: 4, badge: null, image: 'images/betcasino_img4.png' },
  { id: 5, badge: 'Hot', image: 'images/betcasino_img5.png' },
  { id: 6, badge: null, image: 'images/betcasino_img6.png' },
  { id: 7, badge: null, image: 'images/betcasino_img7.png' },
  { id: 8, badge: null, image: 'images/betcasino_img.png' },
  { id: 9, badge: 'Hot', image: 'images/betcasino_img2.png' },
  { id: 10, badge: null, image: 'images/betcasino_img3.png' },
];

/**
 * Category id and name. All categories use the same Casino game images.
 */
export const CASINO_CATEGORIES = [
  { id: 'fun', name: 'Fun Games', games: CASINO_GAME_IMAGES },
  { id: 'live', name: 'Live', games: CASINO_GAME_IMAGES },
  { id: 'prediction', name: 'Prediction', games: CASINO_GAME_IMAGES },
  { id: 'virtuals', name: 'Virtuals', games: CASINO_GAME_IMAGES },
  { id: 'color', name: 'Color', games: CASINO_GAME_IMAGES },
  { id: 'chicken', name: 'Chicken Games', games: CASINO_GAME_IMAGES },
];
