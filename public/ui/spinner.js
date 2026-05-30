// ui/spinner.js
// Lottie スピナーの init / pulse / shrink のみを担当。
// ゲームロジックは app.js が持つ。

const Spinner = (() => {
  let _anim = null;
  const LOTTIE_PATH = './assets/animations/spinner.json';

  function init() {
    const el = document.getElementById('lottie-target');
    if (!el) return;
    el.innerHTML = '';

    _anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: LOTTIE_PATH,
    });

    _anim.addEventListener('DOMLoaded', () => _anim.play());
  }

  // クリック時のパルスアニメーション → 終わったらコールバック
  function pulse(onComplete) {
    const wrap = document.getElementById('spinner-wrap');
    if (!wrap) { onComplete?.(); return; }

    wrap.classList.remove('pulse');
    void wrap.offsetWidth; // reflow
    wrap.classList.add('pulse');

    wrap.addEventListener('animationend', () => {
      wrap.classList.remove('pulse');
      onComplete?.();
    }, { once: true });
  }

  // スピナーを縮小して消す → 完了後コールバック
  function shrink(onComplete) {
    const wrap = document.getElementById('spinner-wrap');
    if (!wrap) { onComplete?.(); return; }

    wrap.classList.add('shrink');
    // CSS transition は 0.6s
    setTimeout(() => onComplete?.(), 650);
  }

  // スピナー画面をリセット（再占い用）
  function reset() {
    const wrap = document.getElementById('spinner-wrap');
    if (wrap) wrap.classList.remove('shrink', 'pulse');
    if (_anim) {
      _anim.destroy();
      _anim = null;
    }
    init();
  }

  // 現フレームで停止
  function stop() {
    if (_anim) {
      const f = _anim.currentFrame;
      _anim.goToAndStop(f, true);
    }
  }

  return { init, pulse, stop, shrink, reset };
})();
