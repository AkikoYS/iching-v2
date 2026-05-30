// app.js
// アプリケーションの状態と画面遷移を管理する。
// ロジックは core/ に、DOM描画は ui/ に委譲する。

// ─── State ────────────────────────────────────────────────────
const AppState = {
  phase: 'idle',      // idle | spinning | done
  clicks: 0,
  bits: '',           // '0'/'1' を積み上げる文字列 (最終6文字)
  hexagram: null,     // 確定した卦オブジェクト
};

// ─── Guide messages ───────────────────────────────────────────
const GUIDES = [
  'タップして易を立てる',   // 0 clicks
  '２回目',
  '３回目',
  '４回目',
  '５回目',
  'もう１回',
  '',                       // 6 clicks (transition)
];

const YAO_NAMES = ['初', '二', '三', '四', '五', '上'];

// ─── Screen helper ────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('active', s.id === id);
  });
}

// ─── Click handler ────────────────────────────────────────────
function handleClick() {
  if (AppState.phase !== 'spinning' && AppState.phase !== 'idle') return;
  if (AppState.clicks >= 6) return;

  AppState.phase = 'spinning';

  // 停止 → パルス
  Spinner.stop();
  Spinner.pulse(() => {
    // 乱数で陰陽を決定
    const bit = Math.random() < 0.5 ? '0' : '1';
    AppState.bits += bit;
    AppState.clicks++;

    // 爻を描画（1〜6、下から）
    ResultUI.addLine(bit, AppState.clicks);

    // ガイドテキスト更新
    if (AppState.clicks < 6) {
      const yaoName = YAO_NAMES[AppState.clicks - 1];
      const yy = bit === '0' ? '陰' : '陽';
      ResultUI.setGuide(`${yaoName}爻 — ${yy}`);
      AppState.phase = 'spinning';
    } else {
      // 6本揃った
      AppState.phase = 'done';
      ResultUI.setGuide('');
      onSixthClick();
    }
  });
}

// ─── 6回目完了処理 ────────────────────────────────────────────
function onSixthClick() {
  AppState.hexagram = Reading.resolve(AppState.bits);

  if (!AppState.hexagram) {
    console.error('卦が見つかりません:', AppState.bits);
    return;
  }

  // スピナーを縮小 → 結果画面へ
  setTimeout(() => {
    Spinner.shrink(() => {
      ResultUI.showHexagram(AppState.hexagram);
      showScreen('screen-result');
    });
  }, 800); // 6本目をちょっと見せてから遷移
}

// ─── Reset ────────────────────────────────────────────────────
function reset() {
  AppState.phase = 'idle';
  AppState.clicks = 0;
  AppState.bits = '';
  AppState.hexagram = null;

  ResultUI.clearLines();
  ResultUI.setGuide(GUIDES[0]);
  Spinner.reset();
  showScreen('screen-spin');
}

// ─── Init ─────────────────────────────────────────────────────
async function init() {
  try {
    await Data.ready();
  } catch (e) {
    console.error('hexagram.json の読み込みに失敗しました:', e);
    return;
  }

  // スピナー初期化
  Spinner.init();

  // ガイドを初期化
  ResultUI.setGuide(GUIDES[0]);

  // スピナークリック
  document.getElementById('spinner-wrap')
    ?.addEventListener('click', handleClick);

  // リセットボタン
  document.getElementById('btn-reset')
    ?.addEventListener('click', reset);
}

document.addEventListener('DOMContentLoaded', init);
