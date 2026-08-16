/* ConfQuest - 🏳️ 国旗アイコンのフォールバック
 * Windows の Chrome / Edge には国旗絵文字のフォントが無く、🇰🇷 が「KR」の
 * 2文字に見えてしまう。この環境でだけ、画面上の国旗絵文字をSVG画像に置き換える。
 * スマホ(iOS/Android)や Firefox では絵文字がそのまま出るので何もしない。
 * 依存なし。index.html と sw.js の両方に登録すること。
 */
'use strict';

/** 国旗絵文字 → { label(読み上げ用), svg } */
const FLAG_SVG = {
  '🇰🇷': { label: '韓国', svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'><rect width='30' height='20' fill='#fff'/><g transform='translate(15,10) rotate(-33)'><circle r='4' fill='#cd2e3a'/><path d='M-4,0 A4,4 0 0,0 4,0 A2,2 0 0,0 0,0 A2,2 0 0,1 -4,0' fill='#0047a0'/></g><g fill='#000' transform='translate(15,10)'><g transform='rotate(-56.3) translate(0,-7.5)'><rect x='-2.4' y='-1.5' width='4.8' height='0.8'/><rect x='-2.4' y='-0.4' width='4.8' height='0.8'/><rect x='-2.4' y='0.7' width='4.8' height='0.8'/></g><g transform='rotate(56.3) translate(0,-7.5)'><rect x='-2.4' y='-1.5' width='2.1' height='0.8'/><rect x='0.3' y='-1.5' width='2.1' height='0.8'/><rect x='-2.4' y='-0.4' width='4.8' height='0.8'/><rect x='-2.4' y='0.7' width='2.1' height='0.8'/><rect x='0.3' y='0.7' width='2.1' height='0.8'/></g><g transform='rotate(-123.7) translate(0,-7.5)'><rect x='-2.4' y='-1.5' width='2.1' height='0.8'/><rect x='0.3' y='-1.5' width='2.1' height='0.8'/><rect x='-2.4' y='-0.4' width='2.1' height='0.8'/><rect x='0.3' y='-0.4' width='2.1' height='0.8'/><rect x='-2.4' y='0.7' width='4.8' height='0.8'/></g><g transform='rotate(123.7) translate(0,-7.5)'><rect x='-2.4' y='-1.5' width='2.1' height='0.8'/><rect x='0.3' y='-1.5' width='2.1' height='0.8'/><rect x='-2.4' y='-0.4' width='2.1' height='0.8'/><rect x='0.3' y='-0.4' width='2.1' height='0.8'/><rect x='-2.4' y='0.7' width='2.1' height='0.8'/><rect x='0.3' y='0.7' width='2.1' height='0.8'/></g></g></svg>" },
  '🇯🇵': { label: '日本', svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'><rect width='30' height='20' fill='#fff'/><circle cx='15' cy='10' r='6' fill='#bc002d'/></svg>" },
  '🇺🇸': { label: 'アメリカ', svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'><rect width='30' height='20' fill='#fff'/><g fill='#b22234'><rect y='0' width='30' height='1.54'/><rect y='3.08' width='30' height='1.54'/><rect y='6.15' width='30' height='1.54'/><rect y='9.23' width='30' height='1.54'/><rect y='12.31' width='30' height='1.54'/><rect y='15.38' width='30' height='1.54'/><rect y='18.46' width='30' height='1.54'/></g><rect width='13' height='10.77' fill='#3c3b6e'/><g fill='#fff'><circle cx='2.2' cy='1.8' r='0.75'/><circle cx='5.6' cy='1.8' r='0.75'/><circle cx='9' cy='1.8' r='0.75'/><circle cx='3.9' cy='4' r='0.75'/><circle cx='7.3' cy='4' r='0.75'/><circle cx='10.7' cy='4' r='0.75'/><circle cx='2.2' cy='6.2' r='0.75'/><circle cx='5.6' cy='6.2' r='0.75'/><circle cx='9' cy='6.2' r='0.75'/><circle cx='3.9' cy='8.5' r='0.75'/><circle cx='7.3' cy='8.5' r='0.75'/><circle cx='10.7' cy='8.5' r='0.75'/></g></svg>" },
  '🇭🇰': { label: '香港', svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'><rect width='30' height='20' fill='#de2910'/><g transform='translate(15,10)' fill='#fff'><ellipse cx='0' cy='-4.2' rx='1.5' ry='3.4'/><g transform='rotate(72)'><ellipse cx='0' cy='-4.2' rx='1.5' ry='3.4'/></g><g transform='rotate(144)'><ellipse cx='0' cy='-4.2' rx='1.5' ry='3.4'/></g><g transform='rotate(216)'><ellipse cx='0' cy='-4.2' rx='1.5' ry='3.4'/></g><g transform='rotate(288)'><ellipse cx='0' cy='-4.2' rx='1.5' ry='3.4'/></g></g></svg>" },
  '🇬🇧': { label: 'イギリス', svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'><rect width='30' height='20' fill='#012169'/><path d='M0,0 L30,20 M30,0 L0,20' stroke='#fff' stroke-width='4'/><path d='M0,0 L30,20 M30,0 L0,20' stroke='#c8102e' stroke-width='2.2'/><path d='M15,0 V20 M0,10 H30' stroke='#fff' stroke-width='6.6'/><path d='M15,0 V20 M0,10 H30' stroke='#c8102e' stroke-width='4'/></svg>" }
};

/** 連続する2つの地域表示記号(=国旗絵文字) */
const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;

const Flag = {
  _supported: null,
  _busy: false,

  /** この端末が国旗絵文字を1つの絵として描けるか(Windowsのブラウザはfalse) */
  supported() {
    if (this._supported !== null) return this._supported;
    this._supported = true;
    try {
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return this._supported;
      ctx.font = '24px sans-serif';
      const one = ctx.measureText('\u{1F1F0}').width;          // 🇰 単体
      const two = ctx.measureText('\u{1F1F0}\u{1F1F7}').width;  // 🇰🇷
      // 国旗として合成されていれば1文字分に近い幅になる。「KR」と2文字で出る環境は約2倍
      if (one > 0 && two >= one * 1.8) this._supported = false;
    } catch (_) { /* 判定できない環境では絵文字のまま(現状維持) */ }
    return this._supported;
  },

  /** 国旗絵文字1つ分のHTML(非対応環境向けのSVGアイコン) */
  imgHtml(emoji) {
    const f = FLAG_SVG[emoji];
    if (!f) return emoji;
    return `<span class="flag-ico" role="img" aria-label="${f.label}" style="background-image:url(&quot;${this.dataUri(emoji)}&quot;)"></span>`;
  },

  dataUri(emoji) {
    const f = FLAG_SVG[emoji];
    return f ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(f.svg) : '';
  },

  /** テキストノードを走査して国旗絵文字をSVGアイコンに置き換える */
  fix(root) {
    if (!root || this.supported()) return;
    if (root.nodeType === 3) { this._replaceNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    let walker;
    try {
      walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const p = n.parentNode;
          if (!p) return NodeFilter.FILTER_REJECT;
          const tag = p.nodeName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'OPTION' ||
              tag === 'INPUT' || tag === 'TITLE') return NodeFilter.FILTER_REJECT;
          FLAG_RE.lastIndex = 0;
          return FLAG_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
    } catch (_) { return; }
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach((n) => this._replaceNode(n));
  },

  _replaceNode(node) {
    const text = node.nodeValue;
    FLAG_RE.lastIndex = 0;
    if (!FLAG_RE.test(text)) return;
    const parent = node.parentNode;
    if (!parent) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    FLAG_RE.lastIndex = 0;
    let m;
    while ((m = FLAG_RE.exec(text)) !== null) {
      if (!FLAG_SVG[m[0]]) continue;              // 手持ちにない国旗はそのまま
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = document.createElement('span');
      span.className = 'flag-ico';
      span.setAttribute('role', 'img');
      span.setAttribute('aria-label', FLAG_SVG[m[0]].label);
      span.style.backgroundImage = `url("${this.dataUri(m[0])}")`;
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (!frag.childNodes.length) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, node);
  },

  /** 動的に描画される画面にも追従する */
  watch() {
    if (this.supported() || typeof MutationObserver === 'undefined') return;
    const obs = new MutationObserver((muts) => {
      if (this._busy) return;
      this._busy = true;
      try {
        for (const m of muts) {
          if (m.type === 'characterData') this.fix(m.target);
          else m.addedNodes.forEach((n) => this.fix(n));
        }
      } catch (_) { /* 表示だけの機能なので握りつぶす */ }
      this._busy = false;
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  },

  init() {
    if (this.supported()) return;   // 絵文字が出る端末では何もしない
    this.fix(document.body);
    this.watch();
  }
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Flag.init());
  } else {
    Flag.init();
  }
}
