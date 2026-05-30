// ui/result.js
// 卦オブジェクトを受け取ってDOMに描画する。
// ロジックは持たない。

const ResultUI = (() => {

  // 爻を1本積み上げる（下から上 = data-line 1〜6）
  function addLine(bit, lineNo) {
    const slot = document.querySelector(`#hex-build .hex-slot[data-line="${lineNo}"]`);
    if (!slot) return;
    slot.innerHTML = '';

    const img = document.createElement('img');
    const isYin = bit === '0';
    img.src = isYin ? 'assets/images/yin.svg' : 'assets/images/yang.svg';
    img.alt = isYin ? '陰' : '陽';
    img.className = isYin ? 'yin' : 'yang';
    slot.appendChild(img);
  }

  // 爻スタックを全クリア
  function clearLines() {
    document.querySelectorAll('#hex-build .hex-slot')
      .forEach(s => s.innerHTML = '');
  }

  // ガイドテキストを更新
  function setGuide(text) {
    const el = document.getElementById('guide');
    if (el) el.textContent = text;
  }

  // 結果画面に卦を描画
  function showHexagram(hexagram) {
    const el = document.getElementById('result-inner');
    if (!el || !hexagram) return;

    const padded = String(hexagram.number).padStart(2, '0');
    const svgPath = `assets/images/hexagrams/hexagram_${padded}.svg`;

    el.innerHTML = `
      <p class="result-label">あなたの本卦は</p>
      <p class="result-number">第 ${hexagram.number} 卦</p>
      <h1 class="result-name">
        <ruby>${hexagram.name}<rt>${hexagram.reading}</rt></ruby>
      </h1>
      <p class="result-summary">${hexagram.summary}</p>
      <img
        class="result-hexagram-svg"
        src="${svgPath}"
        alt="${hexagram.name}"
        onerror="this.style.display='none'"
      />
      <p class="result-hexagram-text">「${hexagram.hexagram_text}」</p>
      <p class="result-description">${hexagram.description}</p>
    `;
  }

  return { addLine, clearLines, setGuide, showHexagram };
})();
