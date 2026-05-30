// core/data.js
// hexagram.json を一度だけ fetch し、Promise で提供する。
// グローバル変数への書き込みはしない。
// app.js が await Data.ready() してから使う。

const Data = (() => {
  let _hexagrams = null;

  const _ready = fetch('./hexagram.json')
    .then(r => {
      if (!r.ok) throw new Error(`hexagram.json load failed: ${r.status}`);
      return r.json();
    })
    .then(data => {
      _hexagrams = data;
      return data;
    });

  return {
    // データが揃うまで待つ
    ready: () => _ready,

    // number から卦を返す
    byNumber: (n) => _hexagrams?.find(h => h.number === n) ?? null,

    // 6ビット文字列 ("011010") から卦を返す
    byArray: (str) => _hexagrams?.find(h => h.array === str) ?? null,
  };
})();
