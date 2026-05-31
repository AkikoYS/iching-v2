// app.js — v2 minimum I Ching reading flow
// Self-contained IIFE. No globals. No build step.

(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  const state = {
+ hexagrams: [],
  +    clicks: 0,
    +    bits: '',      // '0'/'1' × 6
      +    anim: null,    // Lottie instance
        +    busy: false,   // guard against double-tap
          +  };
+
  +  const GUIDES = [
    +    'Tap to cast the oracle',
    +    'Cast line 2',
    +    'Cast line 3',
    +    'Cast line 4',
    +    'Cast line 5',
    +    'One more',
    +  ];

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
  state.anim.addEventListener('DOMLoaded', () => anim.play());
}

function destroySpinner() {
  if (state.anim) { state.anim.destroy(); anim = null; }
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
      <p class="rc-label">Your hexagram</p>
      <p class="rc-number">No ${hex.number} 卦</p>
      <div class="rc-symbol">${hex.unicode}</div>
      <h1 class="rc-name">
       <span class="rc-kanji">${hex.name}</span>
+        <span class="rc-yomi">${hex.reading}</span>
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

  // freeze lottie at current frame
  if (anim) anim.goToAndStop(anim.currentFrame, true);

  pulse(() => {
    const bit = Math.random() < 0.5 ? '0' : '1';
    state.bits += bit;
    state.clicks++;
    drawYao(bit, state.clicks);

    if (state.clicks < 6) {
      setGuide(GUIDES[clicks]);
      if (state.anim) state.anim.play();
      state.busy = false;
    } else {
      // 6th line — brief pause, then transition
      setGuide('');
      const hex = findByBits(state.bits);
      if (!hex) { console.error('no hexagram for', bits); busy = false; return; }
      setTimeout(() => hideSpinner(() => { renderResult(hex); show('screen-result'); }), 650);
    }
  });
}

// ── Reset ──────────────────────────────────────────────────
function reset() {
  state.clicks = 0;
  state.bits = '';
  busy = false;
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

}) ();
