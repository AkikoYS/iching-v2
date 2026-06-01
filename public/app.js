// app.js — v2 minimum I Ching reading flow
// Self-contained IIFE. No globals. No build step.

(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  const state = {
    hexagrams: [],
    clicks: 0,
    bits: '',      // '0'/'1' × 6
    anim: null,    // Lottie instance
    busy: false,   // guard against double-tap
  };
  const GUIDES = [
    'Tap to cast the oracle...',
    'Tap again..',
    'Tap again..',
    'Tap again..',
    'Tap again..',
    'Tap again..',
    'Last tap to reveal your hexagram',
  ];

  // ── Data ───────────────────────────────────────────────────
  async function loadHexagrams() {
    const res = await fetch('./hexagram.json');
    if (!res.ok) throw new Error(`hexagram.json: ${res.status}`);
    state.hexagrams = await res.json();
  }

  function findByBits(str) {
    return state.hexagrams.find(h => h.array === str) ?? null;
  }

  // ── Lottie spinner ─────────────────────────────────────────
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

  // visual pulse → cb when done
  function pulse(cb) {
    const w = document.getElementById('spinner-wrap');
    w.classList.remove('pulse');
    void w.offsetWidth;                       // reflow to restart animation
    w.classList.add('pulse');
    w.addEventListener('animationend', () => { w.classList.remove('pulse'); cb(); }, { once: true });
  }

  // scale to zero → cb when done
  function hideSpinner(cb) {
    const w = document.getElementById('spinner-wrap');
    w.classList.add('gone');
    setTimeout(cb, 520);
  }

  // ── Yao (爻) rendering ─────────────────────────────────────
  // Uses CSS-only bars — no image files needed.
  function drawYao(bit, lineNo) {
    // Replace the slot node to re-trigger the CSS animation
    const old = document.querySelector(`#yao-stack .yao[data-line="${lineNo}"]`);
    if (!old) return;
    const fresh = document.createElement('div');
    fresh.className = `yao ${bit === '1' ? 'yang' : 'yin'}`;
    fresh.dataset.line = lineNo;
    old.replaceWith(fresh);
  }

  function clearYao() {
    document.querySelectorAll('#yao-stack .yao').forEach(el => {
      const n = el.dataset.line;
      const blank = document.createElement('div');
      blank.className = 'yao';
      blank.dataset.line = n;
      el.replaceWith(blank);
    });
  }

  // ── Guide text ─────────────────────────────────────────────
  function setGuide(text) {
    const el = document.getElementById('guide');
    if (el) el.textContent = text;
  }

  // ── Screen transition ──────────────────────────────────────
  function show(id) {
    if (id === 'screen-result') {
      const stack = document.getElementById('yao-stack');
      const resultCard = document.getElementById('result-card');
      if (stack && resultCard) {
        resultCard.parentElement.insertBefore(stack, resultCard);
      }
    }
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.id === id);
    });
  }

  // ── Result ─────────────────────────────────────────────────
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

  // ── Click handler ──────────────────────────────────────────
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
            setGuide(GUIDES[state.clicks]);
            if (state.anim) state.anim.play();
            state.busy = false;
          }, 900);
        }, 600);
      } else {
        setGuide('');
        const hex = findByBits(state.bits);
        if (!hex) { console.error('no hexagram for', state.bits); state.busy = false; return; }
        setTimeout(() => {
          drawYao(bit, state.clicks);
          setTimeout(() => hideSpinner(() => { renderResult(hex); show('screen-result'); }), 1800);
        }, 600);
      }
    });
  }

  // ── Reset ──────────────────────────────────────────────────
  function reset() {
    state.clicks = 0;
    state.bits = '';
    state.busy = false;

    const stack = document.getElementById('yao-stack');
    const spinner = document.getElementById('spinner-wrap');
    if (stack && spinner) {
      spinner.parentElement.insertBefore(stack, spinner);
    }
    stack.style.opacity = '1';

    clearYao();
    setGuide(GUIDES[0]);
    document.getElementById('spinner-wrap').classList.remove('gone');
    destroySpinner();
    initSpinner();
    show('screen-spin');
  }

  // ── Bootstrap ──────────────────────────────────────────────
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
