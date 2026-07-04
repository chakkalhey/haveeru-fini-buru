import { dom, isTouchDevice } from './ui.js';

export function initInput({ onStart, onLaneChange, onJump, onSlide, isRunning, isCrashed }) {
  window.addEventListener('keydown', (e) => {
    if (!isRunning()) {
      if (e.code === 'Space' || e.code === 'Enter') onStart();
      return;
    }
    if (isCrashed()) return;
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        onLaneChange(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        onLaneChange(1);
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        onJump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        onSlide();
        break;
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;

  dom.container.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  dom.container.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (!isRunning()) {
      onStart();
      return;
    }
    if (isCrashed()) return;

    if (Math.max(adx, ady) < 24) return;

    if (adx > ady) {
      onLaneChange(dx > 0 ? 1 : -1);
    } else if (dy < 0) {
      onJump();
    } else {
      onSlide();
    }
  }, { passive: true });

  function bindHold(el, fn) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isRunning()) {
        onStart();
        return;
      }
      if (!isCrashed()) fn();
    });
  }
  bindHold(dom.btnLeft, () => onLaneChange(-1));
  bindHold(dom.btnRight, () => onLaneChange(1));
  bindHold(dom.btnJump, onJump);
  bindHold(dom.btnSlide, onSlide);

  dom.startBtn.addEventListener('click', onStart);
  dom.restartBtn.addEventListener('click', onStart);

  if (isTouchDevice()) {
    dom.touchControls.classList.remove('hidden');
  }
}
