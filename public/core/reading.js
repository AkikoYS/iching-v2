// core/reading.js
// 純粋関数のみ。DOM・グローバル状態に一切触れない。

const Reading = (() => {

  // 6ビット文字列から卦オブジェクトを返す
  function resolve(bits) {
    return Data.byArray(bits);
  }

  // resultArray + 変爻index(1〜6) → 変卦の6ビット文字列
  function calcChangedBits(bits, yaoIndex) {
    const arr = bits.split('');
    const i = yaoIndex - 1; // yaoIndex=1 → arr[0] (初爻)
    arr[i] = arr[i] === '1' ? '0' : '1';
    return arr.join('');
  }

  // resultArray → { original, reverse, mutual, comprehensive }
  // changed は変爻確定後に別途取得する
  function buildContext(bits) {
    const original = resolve(bits);
    if (!original) return null;
    return {
      original,
      reverse:       Data.byNumber(original.reverse),
      mutual:        Data.byNumber(original.go),
      comprehensive: Data.byNumber(original.sou),
    };
  }

  return { resolve, calcChangedBits, buildContext };
})();
