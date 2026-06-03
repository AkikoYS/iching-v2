// app.js — v2 minimum I Ching reading flow
// Self-contained IIFE. No globals. No build step.
(() => {
  'use strict';

  const state = {
    hexagrams: [],
    clicks: 0,
    bits: '',
    anim: null,
    busy: false,
  };

  const GUIDES = [
    'Tap to cast the oracle...',
    'Tap again..',
    'Tap again..',
    'Tap again..',
    'Tap again..',
    'Last tap to reveal your hexagram...',
  ];

  async function loadHexagrams() {
    const res = await fetch('./hexagram.json');
    if (!res.ok) throw new Error(`hexagram.json: ${res.status}`);
    state.hexagrams = await res.json();
  }

  function findByBits(str) {
    return state.hexagrams.find(h => h.array === str) ?? null;
  }

  function initSpinner() {
    const el = document.getElementById('lottie-el');
    el.innerHTML = '';
    state.anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: './assets/animations/spinner.json',
    });
    state.anim.addEventListener('DOMLoaded', () => state.anim.play());
  }

  function destroySpinner() {
    if (state.anim) { state.anim.destroy(); state.anim = null; }
  }

  function pulse(cb) {
    const w = document.getElementById('spinner-wrap');
    w.classList.remove('pulse');
    void w.offsetWidth;
    w.classList.add('pulse');
    w.addEventListener('animationend', () => { w.classList.remove('pulse'); cb(); }, { once: true });
  }

  function hideSpinner(cb) {
    const screen = document.getElementById('screen-spin');

    screen.style.display = 'flex';
    screen.style.opacity = '1';
    screen.style.transform = 'scale(1)';
    screen.style.filter = 'blur(0px)';
    screen.style.transformOrigin = 'center center';

    requestAnimationFrame(() => {
      screen.style.transition =
        'opacity 1s ease, transform 1s ease, filter 1s ease';

      screen.style.opacity = '0';
      screen.style.transform = 'scale(0.5)';
      screen.style.filter = 'blur(4px)';

      setTimeout(() => {
        destroySpinner();
        screen.classList.remove('active');
        screen.style.display = 'none';
        cb();
      }, 800);
    });
  }
  function showResultWithReveal() {
    const result = document.getElementById('screen-result');

    result.style.transition = 'none';
    result.style.opacity = '0';
    result.style.filter = 'blur(12px)';
    result.style.transform = 'scale(0.94)';

    show('screen-result');

    result.offsetHeight;

    requestAnimationFrame(() => {
      result.style.transition =
        'opacity 1.8s ease, filter 1.8s ease, transform 1.8s ease';
      result.style.opacity = '1';
      result.style.filter = 'blur(0px)';
      result.style.transform = 'scale(1)';
    });
  }

  function drawYao(bit, lineNo) {
    ['#yao-stack-spin', '#yao-stack'].forEach(id => {
      const old = document.querySelector(`${id} .yao[data-line="${lineNo}"]`);
      if (!old) return;
      const fresh = document.createElement('div');
      fresh.className = `yao ${bit === '1' ? 'yang' : 'yin'}`;
      fresh.dataset.line = lineNo;
      old.replaceWith(fresh);
    });
  }

  function clearYao() {
    ['#yao-stack-spin', '#yao-stack'].forEach(id => {
      document.querySelectorAll(`${id} .yao`).forEach(el => {
        const n = el.dataset.line;
        const blank = document.createElement('div');
        blank.className = 'yao';
        blank.dataset.line = n;
        el.replaceWith(blank);
      });
    });
  }

  function setGuide(text) {
    const el = document.getElementById('guide');
    if (!el) return;
    el.textContent = text;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.id === id);
    });
  }

  function renderResult(hex) {
    document.getElementById('result-card').innerHTML = `
      <p class="rc-label">Your hexagram</p>
      <p class="rc-number">No. ${hex.number}</p>
      <h1 class="rc-name">
        <span class="rc-kanji">${hex.name}</span>
        <span class="rc-yomi">${hex.reading}</span>
      </h1>
      <p class="rc-summary">${hex.summary}</p>
      <div class="rc-rule"></div>
      <p class="rc-desc">${hex.description}</p>
    `;
  }



  function onTap() {
    if (state.busy || state.clicks >= 6) return;
    state.busy = true;

    if (state.anim) state.anim.goToAndStop(state.anim.currentFrame, true);

    pulse(() => {
      const bit = Math.random() < 0.5 ? '0' : '1';
      state.bits += bit;
      state.clicks++;

      if (state.clicks < 6) {
        setGuide('');
        setTimeout(() => {
          drawYao(bit, state.clicks);
          setTimeout(() => {
            if (state.clicks === 5) {
              setGuide('Last tap to reveal your hexagram...');
            } else {
              setGuide('Tap again..');
            }
            if (state.anim) state.anim.play();
            state.busy = false;
          }, 600);
        }, 0);
      } else {
        setGuide('');
        const hex = findByBits(state.bits);
        if (!hex) {
          console.error('no hexagram for', state.bits);
          state.busy = false;
          return;
        }

        setTimeout(() => {
          drawYao(bit, state.clicks);
        }, 0);

        setTimeout(() => {
          hideSpinner(() => {
            renderResult(hex);

            setTimeout(() => {
              console.log('showResultWithReveal fired');
              showResultWithReveal();
            }, 0);
          });
        }, 600);
      }
    }); // ← pulse() 閉じ
  } // ← onTap() 閉じ

  function reset() {
    state.clicks = 0;
    state.bits = '';
    state.busy = false;

    const screen = document.getElementById('screen-spin');
    screen.style.display = '';
    screen.style.opacity = '';
    screen.style.transition = '';
    screen.style.opacity = '1';
    screen.style.transform = 'scale(1)';
    screen.style.filter = 'blur(0px)';

    clearYao();
    setGuide(GUIDES[0]);
    destroySpinner();
    initSpinner();
    show('screen-spin');
  }

  async function init() {
    try {
      await loadHexagrams();
    } catch (e) {
      console.error(e);
      return;
    }
    initSpinner();
    document.getElementById('spinner-wrap').addEventListener('click', onTap);
    document.getElementById('btn-again').addEventListener('click', reset);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
