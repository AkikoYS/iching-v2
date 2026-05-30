// app.js — v2 minimum I Ching reading flow
// Self-contained IIFE. No globals. No build step.

(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  let hexagrams  = [];
  let clicks     = 0;
  let bits       = '';      // accumulates '0'/'1', length 0–6
  let anim       = null;    // Lottie instance
  let busy       = false;   // guard against double-tap

  const GUIDES = [
    'タップして易を立てる',
    '二爻目',
    '三爻目',
    '四爻目',
    '五爻目',
    'あと一回',
  ];

  // ── Data ───────────────────────────────────────────────────
  async function loadHexagrams() {
    const res = await fetch('./hexagram.json');
    if (!res.ok) throw new Error(`hexagram.json: ${res.status}`);
    hexagrams = await res.json();
  }

  function findByBits(str) {
    return hexagrams.find(h => h.array === str) ?? null;
  }

  // ── Lottie spinner ─────────────────────────────────────────
  function initSpinner() {
    const el = document.getElementById('lottie-el');
    el.innerHTML = '';
    anim = lottie.loadAnimation({
      container: el,
      renderer:  'svg',
      loop:      true,
      autoplay:  false,
      path:      './assets/animations/spinner.json',
    });
    anim.addEventListener('DOMLoaded', () => anim.play());
  }

  function destroySpinner() {
    if (anim) { anim.destroy(); anim = null; }
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
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.id === id);
    });
  }

  // ── Result ─────────────────────────────────────────────────
  function renderResult(hex) {
    document.getElementById('result-card').innerHTML = `
      <p class="rc-label">あなたの卦</p>
      <p class="rc-number">第 ${hex.number} 卦</p>
      <div class="rc-symbol">${hex.unicode}</div>
      <h1 class="rc-name">
        <ruby>${hex.name}<rt>${hex.reading}</rt></ruby>
      </h1>
      <p class="rc-summary">${hex.summary}</p>
      <div class="rc-rule"></div>
      <p class="rc-desc">${hex.description}</p>
    `;
  }

  // ── Click handler ──────────────────────────────────────────
  function onTap() {
    if (busy || clicks >= 6) return;
    busy = true;

    // freeze lottie at current frame
    if (anim) anim.goToAndStop(anim.currentFrame, true);

    pulse(() => {
      const bit = Math.random() < 0.5 ? '0' : '1';
      bits += bit;
      clicks++;
      drawYao(bit, clicks);

      if (clicks < 6) {
        setGuide(GUIDES[clicks]);
        if (anim) anim.play();
        busy = false;
      } else {
        // 6th line — brief pause, then transition
        setGuide('');
        const hex = findByBits(bits);
        if (!hex) { console.error('no hexagram for', bits); busy = false; return; }
        setTimeout(() => hideSpinner(() => { renderResult(hex); show('screen-result'); }), 650);
      }
    });
  }

  // ── Reset ──────────────────────────────────────────────────
  function reset() {
    clicks = 0;
    bits   = '';
    busy   = false;
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
