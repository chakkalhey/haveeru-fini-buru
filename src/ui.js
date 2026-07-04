export const dom = {
  container: document.getElementById('game-container'),
  hud: document.getElementById('hud'),
  scoreValueEl: document.getElementById('score-value'),
  mbValueEl: document.getElementById('mb-value'),
  boostWrap: document.getElementById('boost-wrap'),
  boostFill: document.getElementById('boost-fill'),
  startScreen: document.getElementById('start-screen'),
  gameOverScreen: document.getElementById('gameover-screen'),
  finalScoreEl: document.getElementById('final-score'),
  finalMbEl: document.getElementById('final-mb'),
  bestScoreEl: document.getElementById('best-score'),
  startBtn: document.getElementById('start-btn'),
  restartBtn: document.getElementById('restart-btn'),
  touchControls: document.getElementById('touch-controls'),
  btnLeft: document.getElementById('btn-left'),
  btnRight: document.getElementById('btn-right'),
  btnJump: document.getElementById('btn-jump'),
  btnSlide: document.getElementById('btn-slide'),
};

export function showHUD() {
  dom.hud.classList.remove('hidden');
}
export function hideHUD() {
  dom.hud.classList.add('hidden');
}
export function showStartScreen() {
  dom.startScreen.classList.remove('hidden');
}
export function hideStartScreen() {
  dom.startScreen.classList.add('hidden');
}
export function showGameOverScreen() {
  dom.gameOverScreen.classList.remove('hidden');
}
export function hideGameOverScreen() {
  dom.gameOverScreen.classList.add('hidden');
}
export function showBoostBar() {
  dom.boostWrap.classList.remove('hidden');
}
export function hideBoostBar() {
  dom.boostWrap.classList.add('hidden');
}
export function setBoostFill(percent) {
  dom.boostFill.style.width = percent + '%';
}

export function updateHUD(scoreAccum, mbTotal) {
  dom.scoreValueEl.textContent = Math.floor(scoreAccum);
  dom.mbValueEl.textContent = mbTotal;
}

export function showGameOverStats(finalScore, mbTotal, best) {
  dom.finalScoreEl.textContent = finalScore;
  dom.finalMbEl.textContent = mbTotal;
  dom.bestScoreEl.textContent = best;
}

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}
