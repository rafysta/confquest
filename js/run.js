/* ConfQuest - 学会攻略モード(ローグライク) Phase 1
 * マップ進行・会話戦闘・お店・休憩所・お宝(簡易)・アイテム・セーブ
 */
'use strict';

/* ---------- アイテム定義 ---------- */
const RUN_ITEMS = {
  shirt:    { icon: '👔', name: 'アイロンがけしたシャツ', price: 60, kind: 'gadget',
              desc: '会話で得られる研究費が25%増える',
              how: '🛒 お店で購入 ・ 🎁 お宝でもらえることも ・ 💎 ジェム特典' },
  earphone: { icon: '🎧', name: '翻訳イヤホン', price: 70, kind: 'gadget',
              desc: 'スピードゲージの減りが25%遅くなる',
              how: '🛒 お店で購入 ・ 🎁 お宝でもらえることも ・ 💎 ジェム特典' },
  cardcase: { icon: '💼', name: '名刺入れ', price: 55, kind: 'gadget',
              desc: '会話の各ターンで30%の確率で最悪の選択肢が消える',
              how: '🛒 お店で購入 ・ 🎁 お宝でもらえることも' },
  coupon:   { icon: '🎫', name: '学会クーポン', price: 45, kind: 'gadget',
              desc: 'お店の売買が20%有利になる',
              how: '🛒 お店で購入 ・ 🎁 お宝でもらえることも' },
  charm:    { icon: '🧿', name: 'お守り', price: 80, kind: 'gadget',
              desc: 'メンタルが0になっても一度だけHP15で復活する(消滅)',
              how: '🛒 お店で購入 ・ 🎁 お宝でもらえることも ・ 💎 ジェム特典' },
  trophy:   { icon: '🏆', name: '記念トロフィー', price: 999, kind: 'gadget',
              desc: '効果はないが高く売れる(80pt)', sellValue: 80, noShop: true,
              how: '⭐ エリートに勝利すると1個もらえる' },
  mic:      { icon: '🎤', name: '座長の推薦状', price: 999, kind: 'gadget', noShop: true,
              desc: '会話で得られる研究費が15%増える(Day 1ボス撃破の証)', sellValue: 60,
              how: '👑 Day 1 ボス撃破の証' },
  goldcard: { icon: '🥇', name: '大御所の名刺', price: 999, kind: 'gadget', noShop: true,
              desc: '会話で受けるダメージが25%減る(Day 2ボス撃破の証)', sellValue: 70,
              how: '👑 Day 2 ボス撃破の証' },
  // ドリンク(使い切り。アイコンをタップして使用)
  coffee:   { icon: '☕', name: 'コーヒー', price: 20, kind: 'drink',
              desc: '使うと、次の会話だけスピードゲージの減りが半分になる',
              how: '🛒 お店 ・ 🛍️ 売店 ・ 🎟️ 抽選会 ・ 📦 落とし物' },
  energy:   { icon: '🧃', name: '栄養ドリンク', price: 15, kind: 'drink',
              desc: '使うと、🧠が15回復する',
              how: '🛒 お店 ・ 🛍️ 売店 ・ 🚶 コーヒーブレイク ・ 📦 落とし物' },
  invite:   { icon: '🍀', name: '招待状', price: 35, kind: 'drink',
              desc: '研究者ノードに入るとき、会話を1回スキップできる(自動で確認されます)',
              how: '🛒 お店 ・ 🛍️ 売店 ・ 🚶 コーヒーブレイク ・ 📦 落とし物' },
  armband:  { icon: '🗓️', name: 'プログラム委員の腕章', price: 70, kind: 'drink',
              desc: 'マップの未訪問マスを1つ、好きな種類(💬🎁☕🛒)に作り変える(👑ボスと🛡️質疑応答は変更不可)。マップ画面でアイコンをタップして使う',
              how: '🛒 お店で購入' },
  // レリック: 効果は地味だが、学会を完走したとき特別ボーナスをくれる
  notebook: { icon: '📓', name: 'research notebook', price: 90, kind: 'relic',
              desc: '学会攻略をクリアしたとき ⭐+150 のボーナス(所持していること)',
              clearBonus: { pt: 150, msg: '📓 ノートに書き溜めたアイデアが形になった' },
              how: '🛒 お店にたまに入荷(✨レリック枠)' },
  passport: { icon: '🛂', name: 'よく使い込まれたパスポート', price: 110, kind: 'relic',
              desc: '学会攻略をクリアしたとき 💎+15 のボーナス(所持していること)',
              clearBonus: { gems: 15, msg: '🛂 旅の記録が次の招待につながった' },
              how: '🛒 お店にたまに入荷(✨レリック枠)' },
  ribbon:   { icon: '🎀', name: 'Invited Speaker リボン', price: 130, kind: 'relic',
              desc: '学会攻略をクリアしたとき ⭐+100 と 💎+10 のボーナス(所持していること)',
              clearBonus: { pt: 100, gems: 10, msg: '🎀 招待講演者としての評判が広まった' },
              how: '🛒 お店にたまに入荷(✨レリック枠)' },
  // バッドアイテム(拾ってしまうことがある。お店で売って処分)
  jetlag:      { icon: '😪', name: '時差ボケ', price: 20, kind: 'bad', noShop: true,
                 desc: 'スピードゲージの減りが25%速くなる(バッドアイテム。お店で売って処分できます)',
              how: '📦 落とし物イベントで拾ってしまう(お店で売って処分)' },
  proceedings: { icon: '📚', name: '分厚いプロシーディングス', price: 20, kind: 'bad', noShop: true,
                 desc: '会話中、30%の確率で紛らわしい選択肢が1つ増える(バッドアイテム。お店で売って処分できます)',
              how: '📦 落とし物イベントで拾ってしまう(お店で売って処分)' }
};

const NODE_TYPES = {
  researcher: { icon: '💬', label: '研究者',
                desc: '会話バトル。良い返しを選ぶと💰研究費とXPがもらえる' },
  treasure:   { icon: '🎁', label: 'お宝',
                desc: 'スロットやクイズなどのミニゲーム。💰やアイテムが手に入る' },
  shop:       { icon: '🛒', label: 'お店',
                desc: '💰研究費でアイテムを買える。不要なものは売って処分' },
  rest:       { icon: '☕', label: '休憩所',
                desc: '🧠を回復するか、好きな能力に+30XP。たまに売店が出ていることも' },
  random:     { icon: '❓', label: 'ランダム',
                desc: '何が起こるかお楽しみ。良い出来事も悪い出来事もある' },
  topic:      { icon: '🎴', label: '話題トーク',
                desc: '手札から話題を選んで相手との距離を縮めるカードバトル。地雷話題に注意' },
  stroll:     { icon: '🚶', label: 'コーヒーブレイク',
                desc: '15分の休憩時間。誰に・どの順で会いに行くか、動線を考える' },
  badge:      { icon: '👥', label: '名刺交換',
                desc: '新しい出会い。相手の名前は、あとで思い出すことになるかも…' },
  qa:         { icon: '🛡️', label: '質疑応答',
                desc: 'ボス前の関門。飛んでくる質問を「答える/確認/持ち帰る」で捌く' },
  elite:      { icon: '⭐', label: 'エリート',
                desc: '強敵との会話。ダメージ大きめ、勝てば報酬も豪華(🏆)' },
  boss:       { icon: '👑', label: 'ボス',
                desc: 'その日の最後の関門。倒すと次の日へ進める' }
};

const Run = {
  state: null,

  /* ---------- セーブ ---------- */
  save() { localStorage.setItem('lq_run', JSON.stringify(this.state)); },
  hasActive() {
    try {
      const s = JSON.parse(localStorage.getItem('lq_run') || 'null');
      return !!(s && s.active);
    } catch (_) { return false; }
  },
  resume() {
    try {
      this.state = JSON.parse(localStorage.getItem('lq_run'));
    } catch (_) { this.state = null; }
    if (!this.state) return false;
    return this.migrate();
  },

  /** 旧バージョンのセーブデータを現行形式に補正する。修復不能ならfalse */
  migrate() {
    const s = this.state;
    try {
      if (!s.map || !Array.isArray(s.map.layers) || !Array.isArray(s.map.edges)) return false;
      if (!s.day) s.day = 1;
      if (s.day > 3) s.day = 3;
      if (!Array.isArray(s.items)) s.items = [];
      if (!Array.isArray(s.usedCards)) s.usedCards = [];
      if (!Array.isArray(s.qaUsed)) s.qaUsed = [];
      if (!Array.isArray(s.topicUsed)) s.topicUsed = [];
      if (!('badge' in s)) s.badge = null;
      if (typeof s.hp !== 'number' || typeof s.funds !== 'number') return false;
      // 旧形式(最上段がエリート)はボスに変換
      const top = s.map.layers[s.map.layers.length - 1];
      if (top && top[0] && top[0].type !== 'boss') top[0].type = 'boss';
      // 存在しないアイテムIDを除去
      s.items = s.items.filter((id) => RUN_ITEMS[id]);
      this.save();
      return true;
    } catch (_) { return false; }
  },
  end() {
    if (this.state) this.state.active = false;
    localStorage.removeItem('lq_run');
  },

  /* ---------- ラン開始とマップ生成 ---------- */
  newRun() {
    // ジェムショップで購入した特典を適用
    const perk = (typeof GemShop !== 'undefined')
      ? GemShop.consume() : { items: [], funds: 0, maxHp: 0 };
    const maxHp = 50 + (perk.maxHp || 0);
    // その日の実施回数に応じた報酬倍率(1回目が最も高い)
    const mult = (typeof DailyBonus !== 'undefined')
      ? DailyBonus.record('run') : 1;

    this.state = {
      active: true,
      day: 1,
      hp: maxHp, maxHp,
      funds: 30 + (perk.funds || 0),
      items: [],
      dailyMult: mult,
      perkNote: perk,
      layer: -1,          // 現在の層(-1 = まだマップ上のどこにもいない)
      nodeIndex: -1,
      usedCards: [],
      qaUsed: [],         // 質疑応答で出題済みの質問ID
      topicUsed: [],      // 話題トークで登場済みの相手ID
      badge: null,        // 名刺交換の状態(1ランに1回だけ)
      map: null
    };
    // マップ生成はstate確定後に(名刺交換の出現判定がstateを見るため)
    this.state.map = this.genMap();
    (perk.items || []).forEach((id) => this.gainItem(id));
    this.save();
  },

  genMap() {
    const LAYERS = 8;
    const layers = [];
    for (let i = 0; i < LAYERS; i++) {
      let count;
      if (i === LAYERS - 1) count = 1;                       // 最上段はボス
      else if (i === LAYERS - 2) count = 1;                  // ボス直前は🛡️質疑応答の関門
      else if (i === 0) count = 3;
      else count = 2 + Math.floor(Math.random() * 3);        // 2〜4
      const nodes = [];
      for (let j = 0; j < count; j++) {
        nodes.push({ type: this.pickType(i, LAYERS), visited: false });
      }
      layers.push(nodes);
    }
    // 固定配置: 上書きしてはいけないタイプを避けつつ、必ず1つ置く
    const flat = layers.slice(1, -1).flat();
    const SPECIAL = ['shop', 'rest', 'qa', 'stroll', 'badge', 'boss', 'elite'];
    const place = (type, minLayer, maxLayer) => {
      const range = layers.slice(minLayer, maxLayer + 1).flat();
      let candidates = range.filter((n) => !SPECIAL.includes(n.type));
      // 空きがなければエリートも上書き対象にする(qa/bossは不可侵)
      if (!candidates.length) candidates = range.filter((n) => n.type === 'elite');
      if (!candidates.length) return false;
      candidates[Math.floor(Math.random() * candidates.length)].type = type;
      return true;
    };
    place('rest', 5, 5);                                     // 休憩所はボス2つ前に必ず1つ
    place('shop', 2, 5);                                     // お店は1日1軒
    place('stroll', 2, 5);                                   // コーヒーブレイクも1日1回
    if (Math.random() < 0.5) place('rest', 2, 3);            // たまに序盤にもう1つ
    // 名刺交換は1ランに1回だけ(まだ出会っていなければ序盤に配置)
    if (!(this.state && this.state.badge && this.state.badge.met)) {
      place('badge', 1, 3);
    }
    // 話題トークは2〜3回に揃える
    const topics = flat.filter((n) => n.type === 'topic');
    for (let i = 3; i < topics.length; i++) topics[i].type = 'researcher';
    if (topics.length < 2) {
      const mid = layers.slice(1, -2).flat();
      const convertible = mid.filter((n) => n.type === 'researcher')
        .concat(mid.filter((n) => n.type === 'random'))
        .concat(mid.filter((n) => n.type === 'treasure'));
      for (let i = 0; i < 2 - topics.length && i < convertible.length; i++) {
        convertible[i].type = 'topic';
      }
    }
    // エリートは1つまで
    let eliteSeen = false;
    for (const n of flat) {
      if (n.type === 'elite') {
        if (eliteSeen) n.type = 'researcher';
        eliteSeen = true;
      }
    }

    // 層間の接続: 双方向に最低1本を保証
    const edges = [];
    for (let i = 0; i < LAYERS - 1; i++) {
      const a = layers[i].length, b = layers[i + 1].length;
      const used = new Set();
      for (let j = 0; j < a; j++) {
        // 位置が近いノードへ1〜2本
        const t1 = Math.min(b - 1, Math.round(j * (b - 1) / Math.max(1, a - 1)));
        edges.push([i, j, t1]); used.add(t1);
        if (Math.random() < 0.4) {
          const t2 = Math.max(0, Math.min(b - 1, t1 + (Math.random() < 0.5 ? -1 : 1)));
          if (t2 !== t1) { edges.push([i, j, t2]); used.add(t2); }
        }
      }
      for (let k = 0; k < b; k++) {
        if (!used.has(k)) {
          const from = Math.min(a - 1, Math.round(k * (a - 1) / Math.max(1, b - 1)));
          edges.push([i, from, k]);
        }
      }
    }
    return { layers, edges };
  },

  pickType(layerIdx, totalLayers) {
    if (layerIdx === totalLayers - 1) return 'boss';
    if (layerIdx === totalLayers - 2) return 'qa';         // ボス直前は必ず質疑応答
    if (layerIdx === 0) return 'researcher';               // 最初は必ず会話から
    const r = Math.random();
    if (r < 0.42) return 'researcher';
    if (r < 0.62) return 'treasure';                       // 豆知識・クイズ系は多めに
    if (r < 0.76) return 'topic';                          // 話題トーク(後で2〜3個に調整)
    if (r < 0.92) return 'random';
    return 'elite';                                        // 中盤に稀に出現(1つまで)
    // お店・休憩所・コーヒーブレイク・名刺交換・質疑応答は genMap 側で固定配置
  },

  hasItem(id) { return this.state.items.includes(id); },
  removeItem(id) {
    const i = this.state.items.indexOf(id);
    if (i >= 0) this.state.items.splice(i, 1);
  },
  /** アイテム入手はすべてここを通す(図鑑に記録するため) */
  gainItem(id) {
    this.state.items.push(id);
    // 変動クエスト「掘り出し物」: 今日の対象アイテムなら達成
    if (typeof Quests !== 'undefined') {
      const v = Quests.data().vary || {};
      if (v.item === id) Quests.tryComplete('item-get');
    }
    if (typeof ItemDex !== 'undefined') {
      ItemDex.record(id);
      if (ItemDex.count() >= Object.keys(RUN_ITEMS).length &&
          typeof Achievements !== 'undefined') {
        Achievements.unlock('dex-complete');
      }
    }
  },

  /* ---------- HUD ---------- */
  renderHud() {
    const s = this.state;
    document.querySelectorAll('.run-hud').forEach((el) => {
      el.innerHTML = `
        <div class="hud-row">
          <div class="hud-hp">
            <span>🧠</span>
            <div class="hud-hp-track"><div class="hud-hp-fill ${s.hp <= s.maxHp * 0.3 ? 'low' : ''}"
              style="width:${Math.max(0, s.hp / s.maxHp * 100)}%"></div></div>
            <span class="hud-hp-num">${Math.max(0, s.hp)}/${s.maxHp}</span>
          </div>
          <span class="hud-funds">💰 ${s.funds}</span>
        </div>
        <div class="hud-items-row">${s.items.map((id, i) =>
          `<button class="hud-item" data-item-info="${id}" data-item-idx="${i}">${RUN_ITEMS[id].icon}</button>`).join('') || '<span class="field-note">アイテムなし</span>'}</div>`;
    });
    document.querySelectorAll('[data-item-info]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.itemInfo;
        const it = RUN_ITEMS[id];
        // 🗓️腕章: マップ画面でマス変更モードに入る(もう一度タップで中止)
        if (id === 'armband') {
          const onMap = document.getElementById('screen-run-map').classList.contains('active');
          if (!onMap) { appAlert(it.desc, `${it.icon} ${it.name}`); return; }
          if (this.armbandMode) { this.cancelArmband(); return; }
          const use = await appConfirm(`${it.desc}\n\n使いますか?`, `${it.icon} ${it.name}`);
          if (use) this.startArmband();
          return;
        }
        // ドリンクはタップで使用できる
        if (it.kind === 'drink' && id !== 'invite') {
          const use = await appConfirm(`${it.desc}\n\n今すぐ使いますか?`, `${it.icon} ${it.name}`);
          if (!use) return;
          if (id === 'energy') {
            this.state.hp = Math.min(this.state.maxHp, this.state.hp + 15);
            this.removeItem(id);
            showToast('🧃 🧠が15回復した');
          } else if (id === 'coffee') {
            if (this.state.coffeeBuff) { showToast('☕ すでにコーヒーの効果があります'); return; }
            this.state.coffeeBuff = true;
            this.removeItem(id);
            showToast('☕ 次の会話はゲージがゆっくりになる');
          }
          this.save();
          this.renderHud();
        } else {
          appAlert(it.desc, `${it.icon} ${it.name}`);
        }
      });
    });
  },

  /* ---------- マップ表示 ---------- */
  renderMap() {
    this.renderHud();
    const dayInfo = (typeof DAY_INFO !== 'undefined')
      ? DAY_INFO[(this.state.day || 1) - 1] : null;
    const h = document.querySelector('#screen-run-map h2');
    if (h) {
      const m = this.state.dailyMult || 1;
      h.textContent = (dayInfo ? dayInfo.name : '学会攻略') +
        (m > 1 ? ' 🌟×1.5' : (m < 1 ? ` ×${m}` : ''));
    }
    const { layers, edges } = this.state.map;
    const W = 100, ROWH = 84;
    const H = layers.length * ROWH;
    const pos = (i, j) => ({
      x: (j + 1) / (layers[i].length + 1) * W,
      y: H - (i + 0.5) * ROWH
    });

    const reachable = this.reachableNodes();
    let svg = '';
    for (const [li, a, b] of edges) {
      const p1 = pos(li, a), p2 = pos(li + 1, b);
      svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"></line>`;
    }

    let nodesHtml = '';
    layers.forEach((nodes, i) => {
      nodes.forEach((n, j) => {
        const p = pos(i, j);
        const isCur = i === this.state.layer && j === this.state.nodeIndex;
        const can = reachable.some(([ri, rj]) => ri === i && rj === j);
        if (this.armbandMode) {
          // 腕章モード: 変更できるマスだけタップ可能にする
          const ok = this.armbandTargetable(i, j);
          nodesHtml += `<button class="map-node ${n.visited ? 'visited' : ''} ${isCur ? 'current' : ''} ${ok ? 'armband-target' : ''}"
            style="left:${p.x}%;top:${p.y}px"
            ${ok ? `data-armband="${i},${j}"` : 'disabled'}
            aria-label="${NODE_TYPES[n.type].label}">${NODE_TYPES[n.type].icon}</button>`;
        } else {
          nodesHtml += `<button class="map-node ${n.visited ? 'visited' : ''} ${isCur ? 'current' : ''} ${can ? 'reachable' : ''}"
            style="left:${p.x}%;top:${p.y}px"
            ${can ? `data-go="${i},${j}"` : 'disabled'}
            aria-label="${NODE_TYPES[n.type].label}">${NODE_TYPES[n.type].icon}</button>`;
        }
      });
    });

    document.getElementById('run-map-area').innerHTML = `
      <div class="map-wrap" style="height:${H}px">
        <svg class="map-lines" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${svg}</svg>
        ${nodesHtml}
      </div>
      ${this.armbandMode
        ? '<p class="field-note armband-note" style="text-align:center">🗓️ 紫に光るマスをタップして種類を変更(🗓️アイコンをもう一度タップで中止)</p>'
        : '<p class="field-note" style="text-align:center">光っているノードをタップして進みます</p>'}`;

    document.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [i, j] = btn.dataset.go.split(',').map(Number);
        this.enterNode(i, j);
      });
    });
    document.querySelectorAll('[data-armband]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [i, j] = btn.dataset.armband.split(',').map(Number);
        this.applyArmband(i, j);
      });
    });

    const area = document.getElementById('run-map-area');
    area.scrollTop = area.scrollHeight;
  },

  /* ---------- 🗓️プログラム委員の腕章(マス変更) ---------- */
  armbandMode: false,

  /** 変更できないマス: ボス・質疑応答の関門・訪問済み・現在地・過ぎた層 */
  ARMBAND_LOCKED: ['boss', 'qa'],
  ARMBAND_CHOICES: ['researcher', 'treasure', 'rest', 'shop'],

  armbandTargetable(i, j) {
    const n = this.state.map.layers[i][j];
    if (n.visited) return false;
    if (i <= this.state.layer) return false;                  // もう通り過ぎた層
    if (this.ARMBAND_LOCKED.includes(n.type)) return false;
    return true;
  },

  startArmband() {
    this.armbandMode = true;
    this.renderMap();
  },
  cancelArmband() {
    this.armbandMode = false;
    this.renderMap();
    showToast('🗓️ マスの変更をやめた(腕章は消費されていません)');
  },

  async applyArmband(i, j) {
    if (!this.armbandMode || !this.hasItem('armband')) return;
    const node = this.state.map.layers[i][j];
    const pick = await appChoice(
      `${NODE_TYPES[node.type].icon} ${NODE_TYPES[node.type].label} のマスを何に変える?`,
      this.ARMBAND_CHOICES.filter((t) => t !== node.type).map((t) => ({
        label: `${NODE_TYPES[t].icon} ${NODE_TYPES[t].label}`,
        value: t,
        desc: NODE_TYPES[t].desc
      })));
    if (!pick) return;                                        // モードは維持(選び直せる)
    node.type = pick;
    this.removeItem('armband');
    this.armbandMode = false;
    this.save();
    this.renderMap();
    showToast(`🗓️ プログラムを書き換えた! マスが ${NODE_TYPES[pick].icon}${NODE_TYPES[pick].label} になった`);
  },

  /* ---------- アイコンの説明(凡例) ---------- */
  showLegend() {
    if (document.getElementById('run-legend-overlay')) return;
    const nodeRows = Object.values(NODE_TYPES).map((t) => `
      <div class="legend-row">
        <span class="legend-icon">${t.icon}</span>
        <span class="legend-body"><strong>${t.label}</strong>
          <span>${t.desc}</span></span>
      </div>`).join('');
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'run-legend-overlay';
    ov.innerHTML = `
      <div class="modal-box legend-box">
        <p class="modal-title">🗺️ マップの見方</p>
        <h4 class="about-section">マス(ノード)の種類</h4>
        ${nodeRows}
        <h4 class="about-section">マスの状態</h4>
        <div class="legend-row">
          <span class="legend-icon sample-reachable">💬</span>
          <span class="legend-body"><strong>光っているマス</strong>
            <span>いま進める場所。タップで入る</span></span>
        </div>
        <div class="legend-row">
          <span class="legend-icon sample-current">💬</span>
          <span class="legend-body"><strong>黄色い枠のマス</strong>
            <span>いまいる場所</span></span>
        </div>
        <div class="legend-row">
          <span class="legend-icon sample-visited">💬</span>
          <span class="legend-body"><strong>薄いマス</strong>
            <span>通過済み、または選ばなかった道</span></span>
        </div>
        <h4 class="about-section">画面上部の表示</h4>
        <div class="legend-row">
          <span class="legend-icon">🧠</span>
          <span class="legend-body"><strong>メンタル</strong>
            <span>会話の失敗で減り、0になるとゲームオーバー。休憩所などで回復</span></span>
        </div>
        <div class="legend-row">
          <span class="legend-icon">💰</span>
          <span class="legend-body"><strong>研究費</strong>
            <span>このラン中のお金。クリア時に⭐ptへ換金される</span></span>
        </div>
        <div class="legend-row">
          <span class="legend-icon">🎒</span>
          <span class="legend-body"><strong>アイテム欄</strong>
            <span>アイコンをタップすると効果を確認。ドリンクはタップで使える</span></span>
        </div>
        <p class="field-note" style="margin-top:10px">マップは下から上へ、線でつながったマスへ進めます。</p>
        <button class="btn-large primary" id="btn-legend-close" style="margin-top:12px">閉じる</button>
      </div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('#btn-legend-close').addEventListener('click', close);
  },

  reachableNodes() {
    const s = this.state;
    if (s.layer < 0) return s.map.layers[0].map((_, j) => [0, j]);
    if (s.layer >= s.map.layers.length - 1) return [];
    return s.map.edges
      .filter(([li, a]) => li === s.layer && a === s.nodeIndex)
      .map(([li, _a, b]) => [li + 1, b]);
  },

  async enterNode(i, j) {
    const node = this.state.map.layers[i][j];
    this.state.layer = i;
    this.state.nodeIndex = j;
    node.visited = true;
    this.save();
    if (node.type === 'researcher') {
      // 招待状があればスキップ可能
      if (this.hasItem('invite')) {
        const skip = await appConfirm(
          '🍀 招待状を使って、この会話をスキップしますか?\n(報酬はもらえません)', '招待状');
        if (skip) {
          this.removeItem('invite');
          this.save();
          showToast('🍀 会釈だけして通り過ぎた');
          this.renderMap();
          return;
        }
      }
      this.startBattle(false);
    }
    else if (node.type === 'elite') this.startBattle(true);
    else if (node.type === 'boss') this.startBossBattle();
    else if (node.type === 'shop') this.openShop();
    else if (node.type === 'rest') this.openRest();
    else if (node.type === 'treasure') this.openTreasure();
    else if (node.type === 'random') this.openRandom();
    else if (node.type === 'topic') this.startTopic();
    else if (node.type === 'stroll') this.openStroll();
    else if (node.type === 'badge') this.openBadgeMeet();
    else if (node.type === 'qa') this.startQaDefense();
  },

  /* ---------- 会話戦闘 ---------- */
  battle: null,

  drawCard() {
    const s = this.state;
    let pool = RUN_CARDS.filter((c) => !s.usedCards.includes(c.id));
    if (pool.length === 0) { s.usedCards = []; pool = RUN_CARDS.slice(); }
    const card = pool[Math.floor(Math.random() * pool.length)];
    s.usedCards.push(card.id);
    return card;
  },

  startBattle(isElite, cardOverride, rewardMult) {
    let title, partner, turns, focus;
    if (cardOverride) {
      title = cardOverride.title;
      partner = cardOverride.partner || '';
      turns = cardOverride.turns;
      focus = cardOverride.focus;
    } else if (isElite) {
      const sc = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      title = `⭐ ${sc.title}`;
      partner = `${sc.partner.name} — ${sc.partner.desc}`;
      turns = sc.turns;
      focus = sc.focus;
    } else {
      const card = this.drawCard();
      title = card.title;
      partner = card.partner || '';
      turns = card.turns;
      focus = card.focus;
    }
    // コーヒーは会話1回分で消費
    let coffee = false;
    if (this.state.coffeeBuff) {
      coffee = true;
      this.state.coffeeBuff = false;
      this.save();
    }
    this.battle = {
      isElite, title, partner, turns, focus, coffee,
      isBoss: false, bossDay: 0, timeMult: 1,
      rewardMult: rewardMult || 1,
      turnIndex: 0, totalDelta: 0, bestCount: 0,
      log: [], answered: false, timerId: null, startedAt: 0, curChoices: null
    };
    showScreen('run-battle');
    document.getElementById('run-battle-title').textContent = title;
    document.getElementById('run-battle-partner').textContent = partner;
    if (isElite) this.renderEliteIntro();
    else this.renderBattleTurn();
  },

  /** その日のボス戦を開始 */
  startBossBattle() {
    const day = this.state.day || 1;
    const boss = BOSSES[day - 1];
    // コーヒーはボス戦でも消費される
    let coffee = false;
    if (this.state.coffeeBuff) {
      coffee = true;
      this.state.coffeeBuff = false;
      this.save();
    }
    this.battle = {
      isElite: false, isBoss: true, bossDay: day,
      title: boss.title, partner: boss.partner,
      turns: boss.turns, focus: boss.focus, coffee,
      timeMult: boss.timeMult || 1,
      rewardMult: 1,
      turnIndex: 0, totalDelta: 0, bestCount: 0,
      log: [], answered: false, timerId: null, startedAt: 0, curChoices: null
    };
    showScreen('run-battle');
    document.getElementById('run-battle-title').textContent = boss.title;
    document.getElementById('run-battle-partner').textContent = boss.partner;
    this.renderEliteIntro(true);
  },

  /** エリート/ボス戦前の短い演出(タップでスキップ可) */
  renderEliteIntro(isBoss) {
    const stage = document.getElementById('run-battle-stage');
    document.getElementById('run-battle-progress').textContent = '';
    stage.innerHTML = `
      <div class="elite-intro ${isBoss ? 'boss' : ''}">
        <div class="elite-warning">${isBoss ? '👑 BOSS 👑' : '⚠ 強敵出現 ⚠'}</div>
        <div class="elite-star">${isBoss ? '👑' : '⭐'}</div>
        <p class="elite-name">${escapeHtml(this.battle.partner)}</p>
        <p class="elite-hint">${isBoss
          ? (this.battle.timeMult < 1 ? '相手は容赦がない。考える時間も短い…' : 'この日の集大成。深呼吸して臨みましょう…')
          : '深呼吸して、会話に臨みましょう…'}</p>
      </div>`;
    let started = false;
    const begin = () => {
      if (started || !this.battle) return;
      started = true;
      this.renderBattleTurn();
    };
    stage.addEventListener('click', begin, { once: true });
    setTimeout(begin, 2600);   // タップでいつでもスキップできる
  },

  battleTimeMs(limitSec) {
    let ms = limitSec * 1000 * Convo.timeScale();
    if (this.hasItem('earphone')) ms *= 1.25;
    if (this.hasItem('jetlag')) ms *= 0.8;          // バッドアイテム
    if (this.battle && this.battle.coffee) ms *= 2; // コーヒー効果
    if (this.battle && this.battle.isElite) ms *= 0.9;
    if (this.battle && this.battle.isBoss) ms *= 0.9 * (this.battle.timeMult || 1);
    return ms;
  },

  renderBattleTurn() {
    const b = this.battle;
    const turn = b.turns[b.turnIndex];
    b.answered = false;
    this.renderHud();
    document.getElementById('run-battle-progress').textContent =
      `${b.turnIndex + 1} / ${b.turns.length}`;

    // 選択肢の構築: 名刺入れ(最悪を隠す) / プロシーディングス(紛らわしいのが増える)
    let choices = turn.choices.slice();
    let notes = [];
    if (this.hasItem('cardcase') && Math.random() < 0.3) {
      const worst = choices.reduce((a, c) => (c.delta < a.delta ? c : a), choices[0]);
      choices = choices.filter((c) => c !== worst);
      notes.push('💼 名刺入れが怪しい選択肢を1つ隠した');
    }
    if (this.hasItem('proceedings') && Math.random() < 0.3) {
      const decoy = DECOY_CHOICES[Math.floor(Math.random() * DECOY_CHOICES.length)];
      choices.push(decoy);
      notes.push('📚 プロシーディングスが紛らわしい選択肢を混ぜてきた…');
    }
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    b.curChoices = choices;

    document.getElementById('run-battle-stage').innerHTML = `
      <div class="situation">${renderMarkdown(turn.situation)}</div>
      <div class="timer-wrap"><div class="timer-bar" id="run-timer-bar"></div></div>
      ${b.coffee ? '<p class="field-note" style="text-align:center">☕ コーヒー効果: ゲージがゆっくり</p>' : ''}
      ${notes.map((n) => `<p class="field-note" style="text-align:center">${n}</p>`).join('')}
      <div class="choices">
        ${choices.map((c, i) =>
          `<button class="choice-btn" data-rchoice="${i}">${escapeHtml(c.text)}</button>`).join('')}
      </div>`;

    document.querySelectorAll('[data-rchoice]').forEach((btn) => {
      btn.addEventListener('click', () => this.answerBattle(Number(btn.dataset.rchoice)));
    });

    // タイマー
    clearInterval(b.timerId);
    b.startedAt = Date.now();
    const limitMs = this.battleTimeMs(turn.limitSec || 12);
    const bar = document.getElementById('run-timer-bar');
    b.timerId = setInterval(() => {
      const left = limitMs - (Date.now() - b.startedAt);
      const frac = Math.max(0, left / limitMs);
      if (bar) {
        bar.style.width = `${frac * 100}%`;
        bar.className = 'timer-bar' + (frac < 0.3 ? ' urgent' : '');
      }
      if (left <= 0) {
        clearInterval(b.timerId);
        if (!b.answered) this.answerBattle(-1);
      }
    }, 100);
  },

  answerBattle(choiceIndex) {
    const b = this.battle;
    if (b.answered) return;
    b.answered = true;
    clearInterval(b.timerId);

    const turn = b.turns[b.turnIndex];
    const timedOut = choiceIndex < 0;
    const choice = timedOut ? null : (b.curChoices || turn.choices)[choiceIndex];
    const limitMs = this.battleTimeMs(turn.limitSec || 12);
    const elapsed = Date.now() - b.startedAt;

    let delta = timedOut ? -2 : choice.delta;
    let speedBonus = 0;
    if (!timedOut && choice.delta >= 2 && elapsed < limitMs * 0.5) {
      speedBonus = 1; delta += 1;
    }
    b.totalDelta += Math.max(0, delta);
    if (!timedOut && choice.best) b.bestCount++;

    // ダメージ
    let dmg = 0;
    if (timedOut) dmg = 8;
    else if (choice.delta < 0) dmg = Math.abs(choice.delta) * 4;
    if (b.isElite) dmg = Math.round(dmg * 1.25);
    if (b.isBoss) dmg = Math.round(dmg * 1.5);
    if (this.hasItem('goldcard')) dmg = Math.round(dmg * 0.75); // 大御所の名刺
    if (dmg > 0) this.state.hp -= dmg;

    b.log.push({
      situation: turn.situation,
      chosen: timedOut ? '(時間切れ)' : choice.text,
      why: timedOut ? '沈黙が長すぎました。完璧な一言より、すぐ返すことが大事な場面が多いです。' : choice.why,
      best: turn.choices.find((c) => c.best),
      wasBest: !timedOut && !!choice.best
    });

    // 復活判定
    let revived = false;
    if (this.state.hp <= 0 && this.hasItem('charm')) {
      this.state.items = this.state.items.filter((x) => x !== 'charm');
      this.state.hp = 15;
      revived = true;
    }
    this.save();
    this.renderHud();

    const cls = delta > 0 ? 'good' : (dmg > 0 ? 'bad' : 'neutral');
    const showBest = (timedOut || !choice.best);
    const best = turn.choices.find((c) => c.best);
    // 最終ターンかつ生存中なら、結果を同じ画面に続けて出す(ボスだけは
    // 撃破の余韻を専用画面で見せたいので従来どおり分ける)
    const merge = !b.isBoss && this.state.hp > 0 && b.turnIndex >= b.turns.length - 1;
    document.getElementById('run-battle-stage').innerHTML = `
      <details class="fb-situation" ${merge ? '' : 'open'}>
        <summary>状況をもう一度読む</summary>
        <div class="md-body">${renderMarkdown(turn.situation)}</div>
      </details>
      <div class="feedback ${cls}">
        <div class="fb-head">
          ${dmg > 0 ? `<span class="fb-delta" style="color:var(--danger)">🧠 -${dmg}</span>` : `<span class="fb-delta">好感 +${Math.max(0, delta)}</span>`}
          ${speedBonus ? '<span class="fb-bonus">⚡ 即答ボーナス</span>' : ''}
          ${!timedOut && choice.best ? '<span class="fb-best">★ ベスト</span>' : ''}
        </div>
        <p class="fb-chosen">${timedOut ? '(時間切れ)' : '「' + escapeHtml(choice.text) + '」'}</p>
        <div class="md-body fb-why">${renderMarkdown(b.log[b.log.length - 1].why)}</div>
        ${showBest ? `<div class="fb-best-box"><p class="fb-best-label">この場面のベスト</p>
          <p class="fb-best-text">${escapeHtml(best.text)}</p></div>` : ''}
        ${revived ? '<div class="levelup-box">🧿 お守りが砕けて、あなたを守った! (HP15で復活)</div>' : ''}
        ${typeof LangHelp !== 'undefined' ? LangHelp.buttonsHtml() : ''}
      </div>
      ${merge ? '<div id="run-battle-endbox"></div>' : `
      <button class="btn-large primary" id="btn-run-battle-next">
        ${this.state.hp <= 0 ? '…' : (b.turnIndex < b.turns.length - 1 ? '次へ' : '会話を終える')}
      </button>`}`;

    if (typeof LangHelp !== 'undefined') {
      LangHelp.wire(document.getElementById('run-battle-stage'), {
        situation: turn.situation,
        chosen: timedOut ? '' : choice.text,
        best: best ? best.text : ''
      });
    }
    if (merge) {
      // 最終ターンの手ごたえと結果を1画面にまとめる(「次へ」のタップを省く)
      this.endBattle(true);
      return;
    }
    document.getElementById('btn-run-battle-next').addEventListener('click', () => {
      if (this.state.hp <= 0) { this.gameOver(); return; }
      if (b.turnIndex < b.turns.length - 1) {
        b.turnIndex++;
        this.renderBattleTurn();
      } else {
        this.endBattle();
      }
    });
  },

  /**
   * 会話の締め。merged=true なら、フィードバックの下に結果を差し込む
   * (ボス以外は「次へ」→結果 の2タップを1タップに減らす)。
   */
  endBattle(merged) {
    const b = this.battle;
    let reward = 8 + 3 * b.totalDelta;
    if (b.isElite) reward = Math.round(reward * 2.5) + 20;
    if (b.isBoss) reward += DAY_INFO[b.bossDay - 1].bossReward.funds;
    reward = Math.round(reward * (b.rewardMult || 1));
    reward = Math.round(reward * (this.state.dailyMult || 1));     // 本日初回ボーナス等
    if (this.hasItem('shirt')) reward = Math.round(reward * 1.25);
    if (this.hasItem('mic')) reward = Math.round(reward * 1.15);   // 座長の推薦状
    this.state.funds += reward;

    // XP(既存ステータスへ恒常的に加算)
    const xp = 5 + b.bestCount * 5 + (b.isElite ? 15 : 0) + (b.isBoss ? 25 : 0);
    const gains = {};
    (b.focus || ['network']).forEach((k) => { gains[k] = xp; });
    const levelUps = Stats.add(gains);

    // 特別報酬
    let itemNote = '';
    if (b.isElite && !this.hasItem('trophy')) {
      this.gainItem('trophy');
      itemNote = `<div class="levelup-box">🏆 ${RUN_ITEMS.trophy.name} を手に入れた!(${RUN_ITEMS.trophy.desc})</div>`;
    }
    if (b.isBoss) {
      const bossItem = DAY_INFO[b.bossDay - 1].bossReward.item;
      if (bossItem && !this.hasItem(bossItem)) {
        this.gainItem(bossItem);
        itemNote = `<div class="levelup-box">${RUN_ITEMS[bossItem].icon} ${RUN_ITEMS[bossItem].name} を手に入れた!(${RUN_ITEMS[bossItem].desc})</div>`;
      }
    }
    this.save();
    this.renderHud();

    // デイリークエスト: 学会攻略で会話を1回終える
    if (typeof Quests !== 'undefined') Quests.tryComplete('play');

    const missed = b.log.filter((l) => !l.wasBest);
    // 実績: ボス戦を全ターンベストで制覇
    if (b.isBoss && missed.length === 0 && typeof Achievements !== 'undefined') {
      Achievements.unlock('boss-perfect');
    }
    // Day 1・2 のボスを倒したら、ここで一晩明けまで済ませてしまう。
    // 「ボス撃破」と「Day Nクリア」で画面を2枚使わないためのテンポ改善。
    const toNextDay = b.isBoss && b.bossDay < 3;
    const nextInfo = toNextDay ? this.nextDay(true) : null;
    const nextLabel = b.isBoss
      ? (b.bossDay >= 3 ? '🎓 学会を終える' : `${nextInfo.name} を始める`)
      : 'マップに戻る';

    const html = `
      <div class="convo-result">
        <p class="rank-label">${b.isBoss ? '👑 ボス撃破!' : '会話終了'}</p>
        <div class="xp-gains">
          <span class="xp-chip points">💰 +${reward}</span>
          ${Object.entries(gains).map(([k, v]) =>
            `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${v}XP</span>`).join('')}
        </div>
        ${itemNote}
        ${levelUps.map((l) =>
          `<div class="levelup-box">🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に!</div>`).join('')}
        ${toNextDay ? `<div class="nextday-box">
          🌅 ホテルでぐっすり眠った。<strong>🧠 +15</strong> 回復。💰とアイテムはそのまま持ち越し。<br>
          明日は「${escapeHtml(nextInfo.name)}」— さらに手強い相手が待っている。
        </div>` : ''}
        ${merged ? '' : (missed.length ? `<div class="review-item" style="margin-top:10px">
          <div class="md-body review-situation">${renderMarkdown(missed[0].situation)}</div>
          <p class="review-chosen">選んだ: ${escapeHtml(missed[0].chosen)}</p>
          <p class="review-best">ベスト: ${escapeHtml(missed[0].best.text)}</p>
        </div>` : (b.turns.length === 1
          ? '<p class="all-best">ベストな返しができた!</p>'
          : '<p class="all-best">全ターンでベスト選択!</p>'))}
      </div>
      <button class="btn-large primary" id="btn-run-battle-done">${nextLabel}</button>`;

    // merged のときはフィードバックの下に差し込む(画面を作り直さない)
    const box = merged ? document.getElementById('run-battle-endbox') : null;
    if (box) {
      box.innerHTML = html;
      try { box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) { /* 古い端末 */ }
    } else {
      document.getElementById('run-battle-stage').innerHTML = html;
    }

    document.getElementById('btn-run-battle-done').addEventListener('click', () => {
      if (b.isBoss && b.bossDay >= 3) { this.clearRun(); return; }
      showScreen('run-map');
    });
  },

  /**
   * 次の日へ: マップを再生成し、一晩の休息で少し回復する。
   * silent=true なら画面を出さず、次の日の DAY_INFO を返すだけ
   * (ボスの結果画面に「一晩明けた」ことを一緒に載せるため)。
   */
  nextDay(silent) {
    const s = this.state;
    s.day = (s.day || 1) + 1;
    s.hp = Math.min(s.maxHp, s.hp + 15);
    s.layer = -1;
    s.nodeIndex = -1;
    s.map = this.genMap();
    this.save();
    const info = DAY_INFO[s.day - 1];
    if (silent) { this.renderHud(); return info; }
    showScreen('run-result');
    document.getElementById('run-result-content').innerHTML = `
      <div class="rank-badge" style="color:var(--accent);border-color:var(--accent)">
        <span class="rank-letter">🌅</span></div>
      <p class="rank-label">Day ${s.day - 1} クリア!</p>
      <p class="field-note" style="margin-bottom:14px">
        ホテルでぐっすり眠った。🧠が15回復。<br>
        明日は「${escapeHtml(info.name)}」— さらに手強い相手が待っている。
      </p>
      <div class="xp-gains">
        <span class="xp-chip points">💰 ${s.funds} は持ち越し</span>
        <span class="xp-chip">🎒 アイテムも持ち越し</span>
      </div>
      <button class="btn-large primary" id="btn-next-day" style="margin-top:14px">${escapeHtml(info.name)} を始める</button>`;
    document.getElementById('btn-next-day').addEventListener('click', () => {
      showScreen('run-map');
    });
    return info;
  },

  /* ---------- お店 ---------- */
  shopStock: null,

  priceBuy(id) {
    let p = RUN_ITEMS[id].price;
    if (this.hasItem('coupon')) p = Math.round(p * 0.8);
    return p;
  },
  priceSell(id) {
    let p = RUN_ITEMS[id].sellValue || Math.round(RUN_ITEMS[id].price * 0.6);
    if (this.hasItem('coupon')) p = Math.round(p * 1.2);
    return p;
  },

  openShop() {
    const gadgets = Object.keys(RUN_ITEMS)
      .filter((id) => RUN_ITEMS[id].kind === 'gadget' && !RUN_ITEMS[id].noShop);
    this.shopStock = gadgets.filter((id) => !this.hasItem(id))
      .sort(() => Math.random() - 0.5).slice(0, 3);
    // レリックは1つだけ、たまに並ぶ(完走を狙う人向けの高額商品)
    const relics = Object.keys(RUN_ITEMS)
      .filter((id) => RUN_ITEMS[id].kind === 'relic' && !this.hasItem(id));
    this.relicStock = (relics.length && Math.random() < 0.6)
      ? [relics[Math.floor(Math.random() * relics.length)]] : [];
    showScreen('run-event');
    this.renderShop();
  },

  renderShop() {
    this.renderHud();
    const s = this.state;
    const drinks = ['coffee', 'energy', 'invite', 'armband'];
    const row = (id, priceLabel, dataAttr, enabled) => `
      <div class="shop-row">
        <span class="shop-icon">${RUN_ITEMS[id].icon}</span>
        <span class="shop-body"><strong>${RUN_ITEMS[id].name}</strong>
          <span class="field-note">${RUN_ITEMS[id].desc}</span></span>
        <button class="btn-control ${enabled ? 'primary' : ''}" ${dataAttr}="${id}"
          ${enabled ? '' : 'disabled'}>${priceLabel}</button>
      </div>`;

    document.getElementById('run-event-content').innerHTML = `
      <div class="convo-icon" style="text-align:center">🛒</div>
      <h3 style="text-align:center;margin-bottom:4px">学会ブース</h3>
      <p class="field-note" style="text-align:center;margin-bottom:14px">研究費で売り買いできます${this.hasItem('coupon') ? ' (🎫クーポン適用中)' : ''}</p>
      <h4 class="about-section">ガジェット</h4>
      ${this.shopStock.length ? this.shopStock.map((id) =>
        row(id, `💰${this.priceBuy(id)}`, 'data-buy', s.funds >= this.priceBuy(id))).join('')
        : '<p class="field-note">在庫切れです</p>'}
      ${this.relicStock && this.relicStock.length ? `
        <h4 class="about-section">✨ レリック(完走ボーナス)</h4>
        ${this.relicStock.map((id) =>
          row(id, `💰${this.priceBuy(id)}`, 'data-buy', s.funds >= this.priceBuy(id))).join('')}` : ''}
      <h4 class="about-section">ドリンク・使い切り</h4>
      ${drinks.map((id) =>
        row(id, `💰${this.priceBuy(id)}`, 'data-buy', s.funds >= this.priceBuy(id))).join('')}
      <h4 class="about-section">売却</h4>
      ${s.items.length ? s.items.map((id, idx) => `
        <div class="shop-row">
          <span class="shop-icon">${RUN_ITEMS[id].icon}</span>
          <span class="shop-body"><strong>${RUN_ITEMS[id].name}</strong>
            <span class="field-note">${RUN_ITEMS[id].desc}</span>
            ${RUN_ITEMS[id].kind === 'bad' ? '<span class="field-note" style="color:var(--warn)">バッドアイテム — 売って処分!</span>' : ''}
            ${RUN_ITEMS[id].kind === 'relic' ? '<span class="field-note" style="color:#c084fc">✨ 完走ボーナス付き — 売ると効果は失われます</span>' : ''}</span>
          <button class="btn-control" data-sell="${idx}">売る 💰${this.priceSell(id)}</button>
        </div>`).join('') : '<p class="field-note">売れるものがありません</p>'}
      <button class="btn-large primary" style="margin-top:14px" id="btn-shop-leave">店を出る</button>`;

    document.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buy;
        if (this.state.funds < this.priceBuy(id)) return;
        const price = this.priceBuy(id);
        this.state.funds -= price;
        this.gainItem(id);
        this.shopStock = this.shopStock.filter((x) => x !== id);
        if (this.relicStock) this.relicStock = this.relicStock.filter((x) => x !== id);
        if (typeof Quests !== 'undefined') Quests.addSpend(price);
        this.save(); this.renderShop();
      });
    });
    document.querySelectorAll('[data-sell]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.sell);
        const id = this.state.items[idx];
        if (!id) return;
        this.state.funds += this.priceSell(id);
        this.state.items.splice(idx, 1);
        if (RUN_ITEMS[id].kind === 'gadget' && !RUN_ITEMS[id].noShop &&
            !this.shopStock.includes(id)) this.shopStock.push(id);
        this.save(); this.renderShop();
      });
    });
    document.getElementById('btn-shop-leave').addEventListener('click', () => showScreen('run-map'));
  },

  /* ---------- 休憩所 ---------- */
  openRest() {
    showScreen('run-event');
    this.renderHud();
    // 名刺交換した相手との再会イベント(1ランに1回、少し時間が経ってから)
    const b = this.state.badge;
    if (b && b.met && !b.resolved &&
        (this.state.day > b.day || this.state.layer >= b.layer + 2)) {
      this.renderBadgeRecall();
      return;
    }
    this._restKiosk = this.buildRestKiosk();
    this.renderRestMenu();
  },

  /** 休憩所の売店の品揃え(半分の確率で出店。ドリンク2種+ガジェット1種) */
  buildRestKiosk() {
    if (Math.random() < 0.5) return null;
    const drinks = mgShuffle(['coffee', 'energy', 'invite']).slice(0, 2);
    const gadgets = Object.keys(RUN_ITEMS)
      .filter((id) => RUN_ITEMS[id].kind === 'gadget' && !RUN_ITEMS[id].noShop && !this.hasItem(id));
    return drinks.concat(gadgets.length
      ? [gadgets[Math.floor(Math.random() * gadgets.length)]] : []);
  },

  renderRestMenu() {
    this.renderHud();
    const kiosk = this._restKiosk;
    document.getElementById('run-event-content').innerHTML = `
      <div class="convo-icon" style="text-align:center">☕</div>
      <h3 style="text-align:center;margin-bottom:4px">休憩スペース</h3>
      <p class="field-note" style="text-align:center;margin-bottom:16px">静かなソファを見つけました。どう過ごしますか?</p>
      <button class="btn-large primary" id="btn-rest-heal">☕ 休む(🧠を${Math.round(this.state.maxHp * 0.3)}回復)</button>
      <button class="btn-large" id="btn-rest-study" style="margin-top:10px">📖 予習する(好きな能力に+30XP)</button>
      ${kiosk && kiosk.length ? `
        <h4 class="about-section">🛍️ 小さな売店が出ている</h4>
        ${kiosk.map((id) => `
          <div class="shop-row">
            <span class="shop-icon">${RUN_ITEMS[id].icon}</span>
            <span class="shop-body"><strong>${RUN_ITEMS[id].name}</strong>
              <span class="field-note">${RUN_ITEMS[id].desc}</span></span>
            <button class="btn-control ${this.state.funds >= this.priceBuy(id) ? 'primary' : ''}" data-rest-buy="${id}"
              ${this.state.funds >= this.priceBuy(id) ? '' : 'disabled'}>💰${this.priceBuy(id)}</button>
          </div>`).join('')}
        <p class="field-note" style="text-align:center">買い物をしても、休む/予習はそのまま選べます</p>` : ''}`;

    document.getElementById('btn-rest-heal').addEventListener('click', () => {
      this.state.hp = Math.min(this.state.maxHp,
        this.state.hp + Math.round(this.state.maxHp * 0.3));
      this.save();
      this.eventDone('☕ ひと息ついた。🧠が回復した。');
    });
    document.getElementById('btn-rest-study').addEventListener('click', () => {
      document.getElementById('run-event-content').innerHTML = `
        <h3 style="text-align:center;margin:12px 0 16px">どの能力を伸ばす?</h3>
        ${Object.entries(Stats.KEYS).map(([k, meta]) =>
          `<button class="btn-large" style="margin-bottom:10px" data-study="${k}">${meta.icon} ${meta.label} +30XP</button>`).join('')}`;
      document.querySelectorAll('[data-study]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const ups = Stats.add({ [btn.dataset.study]: 30 });
          this.save();
          this.eventDone(`📖 ${Stats.KEYS[btn.dataset.study].label} が +30XP` +
            (ups.length ? ` — 🎉 Lv.${ups[0].level} に上がった!` : ''));
        });
      });
    });
    document.querySelectorAll('[data-rest-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.restBuy;
        const price = this.priceBuy(id);
        if (this.state.funds < price) return;
        this.state.funds -= price;
        this.gainItem(id);
        this._restKiosk = (this._restKiosk || []).filter((x) => x !== id);
        if (typeof Quests !== 'undefined') Quests.addSpend(price);
        this.save();
        showToast(`${RUN_ITEMS[id].icon} ${RUN_ITEMS[id].name} を買った`);
        this.renderRestMenu();
      });
    });
  },

  /* ---------- お宝(ミニゲーム) ---------- */
  openTreasure() {
    showScreen('run-event');
    this.renderHud();
    const r = Math.random();
    if (r < 0.22) this.miniSlot();
    else if (r < 0.56) this.miniTrivia();                  // 豆知識クイズを多めに
    else if (r < 0.80) this.miniLang();
    else this.freeTreasure();
  },

  eventHead(icon, title, sub) {
    return `<div class="convo-icon" style="text-align:center">${icon}</div>
      <h3 style="text-align:center;margin-bottom:4px">${title}</h3>
      ${sub ? `<p class="field-note" style="text-align:center;margin-bottom:14px">${sub}</p>` : ''}`;
  },

  /** スロット: タップで1リールずつ止める */
  miniSlot() {
    const SYMBOLS = ['⭐', '💰', '🧬', '☕', '🏆', '📖'];
    const el = document.getElementById('run-event-content');
    el.innerHTML = `
      ${this.eventHead('🎰', '展示ブースのスロット', '3つ揃えば大当たり! 各リールの下のボタンで止めます')}
      <div class="slot-row">
        ${[0, 1, 2].map((i) => `
          <div class="slot-col">
            <span class="slot-reel" id="reel-${i}">${SYMBOLS[i]}</span>
            <button class="btn-control primary slot-stop" data-stop="${i}">止める</button>
          </div>`).join('')}
      </div>
      <div id="slot-result"></div>`;

    const current = [0, 1, 2];
    const spinning = [true, true, true];
    const timers = [0, 1, 2].map((i) =>
      setInterval(() => {
        if (!spinning[i]) return;
        current[i] = Math.floor(Math.random() * SYMBOLS.length);
        const reel = document.getElementById(`reel-${i}`);
        if (reel) reel.textContent = SYMBOLS[current[i]];
      }, 90 + i * 25));

    document.querySelectorAll('[data-stop]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.stop);
        if (!spinning[i]) return;
        spinning[i] = false;
        clearInterval(timers[i]);
        btn.disabled = true;
        document.getElementById(`reel-${i}`).classList.add('stopped');
        if (spinning.some((x) => x)) return;
        // 全リール停止 → 判定
        const [a, b, c] = current;
        let msg;
        if (a === b && b === c) {
          this.state.funds += 40;
          msg = `🎉 大当たり! ${SYMBOLS[a]}が3つ揃って 💰40 を獲得!`;
          if (typeof Achievements !== 'undefined') Achievements.unlock('slot-jackpot');
        } else if (a === b || b === c || a === c) {
          this.state.funds += 15;
          msg = '✨ 2つ揃った! 💰15 を獲得。';
        } else {
          this.state.funds += 3;
          msg = '残念、揃わず… 参加賞の💰3をもらった。';
        }
        this.save();
        this.eventDone(msg);
      });
    });
  },

  /** クイズ共通描画 */
  renderQuiz(icon, title, q, onAnswer) {
    const el = document.getElementById('run-event-content');
    const idxs = q.choices.map((_, i) => i).sort(() => Math.random() - 0.5);
    el.innerHTML = `
      ${this.eventHead(icon, title, '正解すると報酬がもらえます')}
      <div class="situation">${escapeHtml(q.q)}</div>
      <div class="choices">
        ${idxs.map((i) =>
          `<button class="choice-btn" data-quiz="${i}">${escapeHtml(q.choices[i])}</button>`).join('')}
      </div>
      <div id="quiz-result"></div>`;
    document.querySelectorAll('[data-quiz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-quiz]').forEach((x) => { x.disabled = true; });
        onAnswer(Number(btn.dataset.quiz) === q.correct, q);
      });
    });
  },

  miniTrivia() {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    this.renderQuiz('🧠', '学会豆知識クイズ', q, (ok, qq) => {
      let msg;
      if (ok) { this.state.funds += 20; msg = `⭕ 正解! 💰20 を獲得。\n\n${qq.note}`; }
      else { msg = `❌ 残念! 正解は「${qq.choices[qq.correct]}」。\n\n${qq.note}`; }
      this.save();
      this.eventDone(msg);
    });
  },

  miniLang() {
    // Language Questの学習済みカードがあればそこから出題(回答はSRSにも記録)
    let q = null;
    if (typeof Learn !== 'undefined' && typeof SRS !== 'undefined') {
      try { q = Learn.runQuizQuestion(); } catch (_) { q = null; }
    }
    if (!q) q = LANG_QUIZ[Math.floor(Math.random() * LANG_QUIZ.length)];
    this.renderQuiz('🗣️', `${q.lang}クイズ`, q, (ok, qq) => {
      if (qq.cardId && typeof SRS !== 'undefined') SRS.answer(qq.cardId, ok);
      let msg;
      if (ok) {
        this.state.funds += 15;
        this.state.hp = Math.min(this.state.maxHp, this.state.hp + 5);
        msg = `⭕ 正解! 💰15 と 🧠5回復。\n\n${qq.note}`;
      } else {
        msg = `❌ 残念! 正解は「${qq.choices[qq.correct]}」。\n\n${qq.note}`;
      }
      this.save();
      this.eventDone(msg);
    });
  },

  freeTreasure() {
    const r = Math.random();
    let msg;
    if (r < 0.5) {
      const amt = 15 + Math.floor(Math.random() * 16);
      this.state.funds += amt;
      msg = `🎁 机の上に参加賞の封筒があった。💰${amt} を獲得。`;
    } else {
      const candidates = Object.keys(RUN_ITEMS)
        .filter((id) => RUN_ITEMS[id].kind === 'gadget' && !RUN_ITEMS[id].noShop && !this.hasItem(id));
      if (candidates.length) {
        const id = candidates[Math.floor(Math.random() * candidates.length)];
        this.gainItem(id);
        msg = `🎁 ${RUN_ITEMS[id].icon} ${RUN_ITEMS[id].name} をもらった!(${RUN_ITEMS[id].desc})`;
      } else {
        this.state.funds += 20;
        msg = '🎁 もう持っているものばかりだったので、代わりに💰20をもらった。';
      }
    }
    this.save();
    document.getElementById('run-event-content').innerHTML =
      this.eventHead('🎁', 'お宝発見', '');
    this.eventDone(msg);
  },

  /* ---------- 共通: ダメージ適用(名刺/お守り考慮) ---------- */
  applyRunDamage(dmg) {
    if (dmg <= 0) return { dmg: 0, revived: false, dead: false };
    if (this.hasItem('goldcard')) dmg = Math.round(dmg * 0.75);
    this.state.hp -= dmg;
    let revived = false;
    if (this.state.hp <= 0 && this.hasItem('charm')) {
      this.state.items = this.state.items.filter((x) => x !== 'charm');
      this.state.hp = 15;
      revived = true;
    }
    return { dmg, revived, dead: this.state.hp <= 0 };
  },

  /* ---------- 🎴 話題トーク(話題の手札バトル) ---------- */
  topicGame: null,

  startTopic() {
    const used = this.state.topicUsed || [];
    let pool = TOPIC_PARTNERS.filter((p) => !used.includes(p.id));
    if (!pool.length) { pool = TOPIC_PARTNERS.slice(); this.state.topicUsed = []; }
    const partner = pool[Math.floor(Math.random() * pool.length)];
    this.state.topicUsed = (this.state.topicUsed || []).concat(partner.id);
    this.save();
    this.topicGame = {
      partner,
      hand: Topic.dealHand(partner),
      mood: 5, turn: 0, playedTags: [], lastLine: ''
    };
    showScreen('run-event');
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🎴', '話題トーク', '手札から話題を選んで、相手との距離を縮めよう(3ターン・時間制限なし)')}
      <div class="card">
        <p><strong>${this.topicGame.partner.icon} ${escapeHtml(this.topicGame.partner.name)}</strong></p>
        <p class="field-note" style="margin-top:6px">${escapeHtml(this.topicGame.partner.situation)}</p>
        <p class="topic-hint">🔍 ${escapeHtml(this.topicGame.partner.hint)}</p>
      </div>
      <p class="field-note" style="text-align:center;margin-top:8px">ヒントから相手の好みを読み、話題を出す<strong>順番</strong>も考えましょう</p>
      <button class="btn-large primary" style="margin-top:10px" id="btn-topic-go">会話を始める</button>`;
    document.getElementById('btn-topic-go').addEventListener('click', () => this.renderTopicTurn());
  },

  renderTopicTurn() {
    const g = this.topicGame;
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead(g.partner.icon, escapeHtml(g.partner.name), '')}
      <div class="affinity-row" style="margin-bottom:4px">
        <span class="affinity-label">機嫌</span>
        <div class="affinity-track"><div class="affinity-bar" style="width:${g.mood * 10}%"></div></div>
        <span class="affinity-value">${g.mood}/10</span>
      </div>
      <p class="field-note" style="text-align:center">ターン ${g.turn + 1} / 3 ・ 🔍 ${escapeHtml(g.partner.hint)}</p>
      ${g.lastLine ? `<div class="card topic-line">${escapeHtml(g.lastLine)}</div>` : ''}
      <p class="field-note" style="margin:8px 0 4px">どの話題を出す?</p>
      <div class="topic-hand">
        ${g.hand.map((c, i) => `
          <button class="topic-card" data-topic-play="${i}">
            <span class="t-icon">${c.icon}</span>
            <span class="t-label">${escapeHtml(c.label)}</span>
            <span class="t-desc">${escapeHtml(c.desc)}</span>
          </button>`).join('')}
      </div>`;
    document.querySelectorAll('[data-topic-play]').forEach((btn) => {
      btn.addEventListener('click', () => this.playTopicCard(Number(btn.dataset.topicPlay)));
    });
  },

  playTopicCard(idx) {
    const g = this.topicGame;
    const card = g.hand[idx];
    if (!card) return;
    g.hand.splice(idx, 1);
    const res = Topic.evalCard(card, g.partner, g.mood, g.playedTags);
    g.playedTags.push(card.tag);
    g.mood = Math.max(0, Math.min(10, g.mood + res.delta));
    g.turn++;
    const hit = this.applyRunDamage(res.dmg);
    this.save();
    this.renderHud();
    g.lastLine = '';
    const cls = res.delta > 0 ? 'good' : (res.dmg > 0 ? 'bad' : 'neutral');
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead(g.partner.icon, escapeHtml(g.partner.name), '')}
      <div class="affinity-row" style="margin-bottom:4px">
        <span class="affinity-label">機嫌</span>
        <div class="affinity-track"><div class="affinity-bar" style="width:${g.mood * 10}%"></div></div>
        <span class="affinity-value">${g.mood}/10</span>
      </div>
      <div class="feedback ${cls}">
        <div class="fb-head">
          ${res.dmg > 0
            ? `<span class="fb-delta" style="color:var(--danger)">🧠 -${hit.dmg}</span>`
            : `<span class="fb-delta">機嫌 ${res.delta >= 0 ? '+' : ''}${res.delta}</span>`}
        </div>
        <p class="fb-chosen">${card.icon} 「${escapeHtml(card.label)}」を切り出した</p>
        <div class="fb-why">${escapeHtml(res.line)}</div>
        ${hit.revived ? '<div class="levelup-box">🧿 お守りが砕けて、あなたを守った! (HP15で復活)</div>' : ''}
      </div>
      <button class="btn-large primary" id="btn-topic-next">
        ${hit.dead ? '…' : (g.turn < 3 ? '次の話題へ' : '会話を締める')}
      </button>`;
    document.getElementById('btn-topic-next').addEventListener('click', () => {
      if (hit.dead) { this.gameOver(); return; }
      if (g.turn < 3) this.renderTopicTurn();
      else this.endTopic();
    });
  },

  endTopic() {
    const g = this.topicGame;
    let reward = 10 + g.mood * 3;
    reward = Math.round(reward * (this.state.dailyMult || 1));
    if (this.hasItem('shirt')) reward = Math.round(reward * 1.25);
    if (this.hasItem('mic')) reward = Math.round(reward * 1.15);
    this.state.funds += reward;
    const gains = g.mood >= 8 ? { topic: 20, network: 10 }
      : (g.mood >= 5 ? { topic: 12 } : { topic: 6 });
    const levelUps = Stats.add(gains);
    this.save();
    this.renderHud();
    if (typeof Quests !== 'undefined') Quests.tryComplete('play');
    if (g.mood >= 10 && typeof Achievements !== 'undefined') Achievements.unlock('topic-heart');
    const verdict = g.mood >= 8
      ? '🎉 大盛り上がり!「また明日も話しましょう」と連絡先を交換した。'
      : (g.mood >= 5
        ? '😊 感じの良い雑談になった。顔を覚えてもらえたはず。'
        : '😅 会話はぎこちないまま終わった。話題選びを振り返ろう。');
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead(g.partner.icon, '会話終了', '')}
      <div class="convo-result">
        <p class="rank-label">機嫌 ${g.mood}/10</p>
        <p class="field-note" style="margin-bottom:10px">${verdict}</p>
        <div class="xp-gains">
          <span class="xp-chip points">💰 +${reward}</span>
          ${Object.entries(gains).map(([k, v]) =>
            `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${v}XP</span>`).join('')}
        </div>
        ${levelUps.map((l) =>
          `<div class="levelup-box">🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に!</div>`).join('')}
      </div>
      <button class="btn-large primary" style="margin-top:12px" id="btn-topic-done">マップに戻る</button>`;
    document.getElementById('btn-topic-done').addEventListener('click', () => showScreen('run-map'));
    this.topicGame = null;
  },

  /* ---------- 🚶 コーヒーブレイク(動線パズル) ---------- */
  strollGame: null,

  openStroll() {
    this.strollGame = {
      spots: Stroll.gen(), elapsed: 0, visited: [],
      funds: 0, hp: 0, xp: {}, items: [], lastNote: ''
    };
    showScreen('run-event');
    this.renderStroll(true);
  },

  /** 15分の時間帯を横棒で表す。いつまでいるか・何分かかるかを一目で分かるように */
  strollTrack(sp, elapsed) {
    const B = Stroll.TIME_BUDGET;
    const pct = (n) => Math.max(0, Math.min(100, n / B * 100));
    const nowPct = pct(elapsed);
    // その人がいる時間帯(0〜leaveBy)と、いま行った場合に使う時間(now〜now+cost)
    return `<span class="stroll-track" aria-hidden="true">
      <span class="stroll-window" style="width:${pct(sp.leaveBy)}%"></span>
      <span class="stroll-need" style="left:${nowPct}%;width:${pct(elapsed + sp.cost) - nowPct}%"></span>
      <span class="stroll-now" style="left:${nowPct}%"></span>
    </span>`;
  },

  /** いま確保できている価値の合計 */
  strollGot() {
    const st = this.strollGame;
    return st.visited.reduce((a, id) =>
      a + Stroll.value(st.spots.filter((s) => s.id === id)[0]), 0);
  },

  renderStroll(intro) {
    const st = this.strollGame;
    this.renderHud();
    const left = Stroll.TIME_BUDGET - st.elapsed;
    const anyLeft = st.spots.some((sp) =>
      !st.visited.includes(sp.id) && Stroll.canVisit(sp, st.elapsed));
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🚶', 'コーヒーブレイク',
        intro ? '休憩は15分。全員には会えません — 誰に、どの順で会いに行く?' : '')}
      <div class="stroll-clock card">
        <span class="stroll-left">⏰ 残り <strong>${left}</strong> 分</span>
        <span class="stroll-score">いまの成果 <strong>価値 ${this.strollGot()}</strong></span>
      </div>
      ${intro ? `<p class="field-note" style="margin:-4px 0 10px">
        💡「価値」は 💰・🧠・XP・アイテムをまとめて比べるための目安です。
        先に帰ってしまう人から回ると、より多くの人に会えます。</p>` : ''}
      ${st.lastNote ? `<div class="card topic-line">${st.lastNote}</div>` : ''}
      ${st.spots.map((sp, i) => {
        const done = st.visited.includes(sp.id);
        const why = done ? null : Stroll.blockedBy(sp, st.elapsed);
        const can = !done && !why;
        const status = done ? '✅ 会えた'
          : why === 'gone' ? '💨 もう帰ってしまった'
          : why === 'notime' ? `⏰ 残り${left}分では会話${sp.cost}分に足りない`
          : (sp.leaveBy < Stroll.TIME_BUDGET
            ? `⏳ ${sp.leaveBy}分までに行けば会える` : '🪑 最後までいる');
        return `
        <div class="shop-row stroll-row ${done ? 'stroll-done' : ''} ${why ? 'stroll-gone' : ''}">
          <span class="shop-icon">${sp.icon}</span>
          <span class="shop-body">
            <strong>${escapeHtml(sp.name)}</strong>
            <span class="stroll-value">価値 ${Stroll.value(sp)}</span>
            <span class="field-note">${escapeHtml(sp.desc)} ・ ${sp.rewardLabel}</span>
            ${this.strollTrack(sp, st.elapsed)}
            <span class="field-note">⏱ 会話${sp.cost}分 ・ ${status}</span>
          </span>
          <button class="btn-control ${can ? 'primary' : ''}" data-stroll-visit="${i}"
            ${can ? '' : 'disabled'}>${done ? '済' : '会う'}</button>
        </div>`;
      }).join('')}
      <button class="btn-large ${anyLeft ? '' : 'primary'}" style="margin-top:12px" id="btn-stroll-end">
        ${anyLeft ? '⏹ ここで休憩を終える' : '☕ 休憩を終える'}</button>`;
    document.querySelectorAll('[data-stroll-visit]').forEach((btn) => {
      btn.addEventListener('click', () => this.strollVisit(Number(btn.dataset.strollVisit)));
    });
    document.getElementById('btn-stroll-end').addEventListener('click', () => this.endStroll());
  },

  strollVisit(idx) {
    const st = this.strollGame;
    const sp = st.spots[idx];
    if (!sp || st.visited.includes(sp.id) || !Stroll.canVisit(sp, st.elapsed)) return;
    st.elapsed += sp.cost;
    st.visited.push(sp.id);
    const r = sp.reward;
    const notes = [];
    if (r.funds) { this.state.funds += r.funds; st.funds += r.funds; notes.push(`💰+${r.funds}`); }
    if (r.hp) {
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + r.hp);
      st.hp += r.hp; notes.push(`🧠+${r.hp}`);
    }
    if (r.xp) {
      Object.entries(r.xp).forEach(([k, v]) => { st.xp[k] = (st.xp[k] || 0) + v; });
      notes.push(Object.keys(r.xp).map((k) => `${Stats.KEYS[k].icon}XP`).join(''));
    }
    if (r.item) {
      const pool = ['coffee', 'energy', 'invite'];
      const id = pool[Math.floor(Math.random() * pool.length)];
      this.gainItem(id);
      st.items.push(id);
      notes.push(`${RUN_ITEMS[id].icon} ${RUN_ITEMS[id].name}`);
    }
    st.lastNote = `${sp.icon} ${escapeHtml(sp.name)}と話せた! ${notes.join(' ・ ')}`;
    this.save();
    this.renderStroll(false);
  },

  /** 順路を「☕コーヒースタンド(2分) → 📔編集者(5分)」の形に整える */
  strollRouteHtml(spots, idxList) {
    if (!idxList.length) return '<span class="stroll-route-none">(誰にも会わなかった)</span>';
    return idxList.map((i) => {
      const sp = spots[i];
      return `<span class="stroll-step">${sp.icon} ${escapeHtml(sp.name)}` +
        `<span class="stroll-step-min">${sp.cost}分</span></span>`;
    }).join('<span class="stroll-arrow">→</span>');
  },

  endStroll() {
    const st = this.strollGame;
    const idxOf = (id) => st.spots.findIndex((s) => s.id === id);
    const mine = st.visited.map(idxOf);
    const got = this.strollGot();
    // 総当たりで「最善の回り方」を求め、自分の動線と並べて採点する
    const best = Stroll.bestRoute(st.spots);
    const rk = Stroll.rank(got, best.value);
    const tip = Stroll.advice(st.spots, st.visited, best.order);
    const perfect = rk.key === 'perfect' && st.visited.length > 0;

    if (rk.bonus) this.state.funds += rk.bonus;
    const levelUps = Object.keys(st.xp).length ? Stats.add(st.xp) : [];
    if (perfect && typeof Achievements !== 'undefined') Achievements.unlock('stroll-perfect');
    this.save();
    this.renderHud();

    const usedMin = mine.reduce((a, i) => a + st.spots[i].cost, 0);
    const bestMin = best.order.reduce((a, i) => a + st.spots[i].cost, 0);
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🚶', '休憩終了', '')}
      <div class="convo-result">
        <p class="rank-label">${rk.icon} ${escapeHtml(rk.label)}</p>
        <div class="stroll-score-row">
          <span>あなた <strong>価値 ${got}</strong></span>
          <span class="stroll-slash">/</span>
          <span>最善 <strong>価値 ${best.value}</strong></span>
          <span class="stroll-pct">${rk.pct}%</span>
        </div>
        <div class="stroll-compare">
          <p class="stroll-compare-label">あなたの回り方 (${st.visited.length}人・${usedMin}分)</p>
          <div class="stroll-route mine">${this.strollRouteHtml(st.spots, mine)}</div>
          ${perfect ? `<p class="stroll-compare-label ok">✓ これが最善の回り方でした</p>`
            : `<p class="stroll-compare-label">最善の回り方 (${best.order.length}人・${bestMin}分)</p>
               <div class="stroll-route best">${this.strollRouteHtml(st.spots, best.order)}</div>`}
          ${tip ? `<p class="stroll-tip">💡 ${escapeHtml(tip)}</p>` : ''}
        </div>
        <div class="xp-gains">
          ${st.funds ? `<span class="xp-chip points">💰 +${st.funds}</span>` : ''}
          ${rk.bonus ? `<span class="xp-chip points">${rk.icon} 動線ボーナス 💰+${rk.bonus}</span>` : ''}
          ${st.hp ? `<span class="xp-chip">🧠 +${st.hp}</span>` : ''}
          ${Object.entries(st.xp).map(([k, v]) =>
            `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${v}XP</span>`).join('')}
        </div>
        ${levelUps.map((l) =>
          `<div class="levelup-box">🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に!</div>`).join('')}
      </div>
      <button class="btn-large primary" style="margin-top:12px" id="btn-stroll-done">マップに戻る</button>`;
    document.getElementById('btn-stroll-done').addEventListener('click', () => showScreen('run-map'));
    this.strollGame = null;
  },

  /* ---------- 🛡️ 質疑応答ディフェンス(ボス前の関門) ---------- */
  qaGame: null,

  startQaDefense() {
    let pool = QA_QUESTIONS.filter((q) => !(this.state.qaUsed || []).includes(q.id));
    if (pool.length < 5) { pool = QA_QUESTIONS.slice(); this.state.qaUsed = []; }
    const qs = mgShuffle(pool).slice(0, 5);
    this.state.qaUsed = (this.state.qaUsed || []).concat(qs.map((q) => q.id));
    this.save();
    this.qaGame = { qs, i: 0, score: 0, answered: false, timerId: null };
    showScreen('run-event');
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🛡️', '質疑応答ディフェンス', 'ボス前の関門!')}
      <div class="card">
        <p>ボスが待つ会場の前で、あなたの発表への質疑が始まった。<br>
        飛んでくる5つの質問を、正しい対応で捌き切ろう。</p>
        <div class="qa-legend">
          <p>${QA_ACTIONS.answer.icon} <strong>答える</strong> — 知っていることは簡潔に即答</p>
          <p>${QA_ACTIONS.clarify.icon} <strong>言い換えて確認</strong> — 曖昧・複数・攻撃的な質問に</p>
          <p>${QA_ACTIONS.defer.icon} <strong>持ち帰る</strong> — 未実施の実験・うろ覚えの数値に</p>
        </div>
        <p class="field-note">全問正解なら🧠も回復してボス戦へ!</p>
      </div>
      <button class="btn-large primary" style="margin-top:10px" id="btn-qa-go">質疑を受ける</button>`;
    document.getElementById('btn-qa-go').addEventListener('click', () => this.renderQaQuestion());
  },

  renderQaQuestion() {
    const g = this.qaGame;
    const q = g.qs[g.i];
    g.answered = false;
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🛡️', `質問 ${g.i + 1} / ${g.qs.length}`, '')}
      <div class="situation">
        <p class="field-note">🎙️ ${escapeHtml(q.speaker)}:</p>
        <p class="qa-question">"${escapeHtml(q.q)}"</p>
      </div>
      <div class="timer-wrap"><div class="timer-bar" id="qa-timer-bar"></div></div>
      <div class="choices">
        ${Object.entries(QA_ACTIONS).map(([key, a]) =>
          `<button class="choice-btn" data-qa-act="${key}">${a.icon} ${a.label}</button>`).join('')}
      </div>`;
    document.querySelectorAll('[data-qa-act]').forEach((btn) => {
      btn.addEventListener('click', () => this.answerQa(btn.dataset.qaAct));
    });
    clearInterval(g.timerId);
    const startedAt = Date.now();
    const limitMs = 10000 * Convo.timeScale();
    const bar = document.getElementById('qa-timer-bar');
    g.timerId = setInterval(() => {
      const left = limitMs - (Date.now() - startedAt);
      const frac = Math.max(0, left / limitMs);
      if (bar) {
        bar.style.width = `${frac * 100}%`;
        bar.className = 'timer-bar' + (frac < 0.3 ? ' urgent' : '');
      }
      if (left <= 0) {
        clearInterval(g.timerId);
        if (!g.answered) this.answerQa(null);
      }
    }, 100);
  },

  answerQa(action) {
    const g = this.qaGame;
    if (g.answered) return;
    g.answered = true;
    clearInterval(g.timerId);
    const q = g.qs[g.i];
    const timedOut = action === null;
    const correct = !timedOut && action === q.a;
    let hit = { dmg: 0, revived: false, dead: false };
    if (correct) g.score++;
    else hit = this.applyRunDamage(timedOut ? 8 : 5);
    this.save();
    this.renderHud();
    const best = QA_ACTIONS[q.a];
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🛡️', `質問 ${g.i + 1} / ${g.qs.length}`, '')}
      <div class="feedback ${correct ? 'good' : 'bad'}">
        <div class="fb-head">
          ${correct ? '<span class="fb-delta">⭕ 見事な捌き!</span>'
            : `<span class="fb-delta" style="color:var(--danger)">${timedOut ? '⏰ 時間切れ' : '❌'} 🧠 -${hit.dmg}</span>`}
        </div>
        <p class="fb-chosen">"${escapeHtml(q.q)}"</p>
        ${!correct ? `<p class="fb-chosen">正解: ${best.icon} <strong>${best.label}</strong></p>` : ''}
        <div class="fb-why">${escapeHtml(q.why)}</div>
        ${hit.revived ? '<div class="levelup-box">🧿 お守りが砕けて、あなたを守った! (HP15で復活)</div>' : ''}
      </div>
      <button class="btn-large primary" id="btn-qa-next">
        ${hit.dead ? '…' : (g.i < g.qs.length - 1 ? '次の質問' : '質疑を終える')}
      </button>`;
    document.getElementById('btn-qa-next').addEventListener('click', () => {
      if (hit.dead) { this.gameOver(); return; }
      if (g.i < g.qs.length - 1) { g.i++; this.renderQaQuestion(); }
      else this.endQaDefense();
    });
  },

  endQaDefense() {
    const g = this.qaGame;
    const perfect = g.score >= g.qs.length;
    let funds = perfect ? 40 : (g.score >= 3 ? 20 : 5);
    funds = Math.round(funds * (this.state.dailyMult || 1));
    this.state.funds += funds;
    let hpNote = '';
    if (perfect) {
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + 10);
      hpNote = '<span class="xp-chip">🧠 +10</span>';
      if (typeof Achievements !== 'undefined') Achievements.unlock('qa-perfect');
    }
    const gains = perfect ? { confidence: 15, english: 15 }
      : (g.score >= 3 ? { confidence: 10, english: 10 } : { english: 5 });
    const levelUps = Stats.add(gains);
    this.save();
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('🛡️', '質疑応答 終了', '')}
      <div class="convo-result">
        <p class="rank-label">${g.score} / ${g.qs.length} 問クリア</p>
        <p class="field-note" style="margin-bottom:10px">${perfect
          ? '完璧な受け答えに会場から拍手。最高の流れでボスの元へ!'
          : (g.score >= 3 ? '危ない場面もあったが、なんとか捌き切った。'
            : '質疑は課題が残った…。この経験がボス戦の糧になる。')}</p>
        <div class="xp-gains">
          <span class="xp-chip points">💰 +${funds}</span>
          ${hpNote}
          ${Object.entries(gains).map(([k, v]) =>
            `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${v}XP</span>`).join('')}
        </div>
        ${levelUps.map((l) =>
          `<div class="levelup-box">🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に!</div>`).join('')}
      </div>
      <button class="btn-large primary" style="margin-top:12px" id="btn-qa-done">ボスの待つマップへ</button>`;
    document.getElementById('btn-qa-done').addEventListener('click', () => showScreen('run-map'));
    this.qaGame = null;
  },

  /* ---------- 👥 名刺交換(名札記憶ゲーム。1ランに1回) ---------- */
  openBadgeMeet() {
    const people = mgShuffle(BADGE_PEOPLE).slice(0, 3);
    this.state.badge = {
      met: true, resolved: false,
      day: this.state.day, layer: this.state.layer, people
    };
    this.save();
    showScreen('run-event');
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('👥', '名刺交換', 'コーヒー待ちの列で、3人組の研究者と名刺交換をした')}
      ${people.map((p) => `
        <div class="card badge-card">
          <p class="badge-name">${escapeHtml(p.name)}</p>
          <p class="field-note">${escapeHtml(p.affil)} ・ ${escapeHtml(p.topic)}の研究</p>
        </div>`).join('')}
      <p class="field-note" style="text-align:center;margin-top:8px">
        📇 名前と顔(所属・研究テーマ)をつなげて覚えましょう。<br>
        <strong>この名前、あとで思い出すことになるかも…</strong></p>
      <button class="btn-large primary" style="margin-top:10px" id="btn-badge-done">覚えた!(💰+5)</button>`;
    document.getElementById('btn-badge-done').addEventListener('click', () => {
      this.state.funds += 5;
      this.save();
      showScreen('run-map');
    });
  },

  renderBadgeRecall() {
    const b = this.state.badge;
    const target = b.people[Math.floor(Math.random() * b.people.length)];
    const metNames = b.people.map((p) => p.name);
    const decoys = mgShuffle(BADGE_PEOPLE.filter((p) => !metNames.includes(p.name))).slice(0, 1);
    const choices = mgShuffle(b.people.concat(decoys).map((p) => p.name));
    document.getElementById('run-event-content').innerHTML = `
      ${this.eventHead('👤', '見覚えのある顔!', '')}
      <div class="situation">
        休憩スペースに入ると、先日名刺交換した研究者が笑顔で近づいてきた。<br><br>
        <strong>${escapeHtml(target.affil)}</strong>で<strong>${escapeHtml(target.topic)}</strong>を研究している、あの人だ。<br>
        「We met the other day!」 — さて、名前は…?
      </div>
      <div class="choices">
        ${choices.map((name) =>
          `<button class="choice-btn" data-badge-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('')}
      </div>`;
    document.querySelectorAll('[data-badge-name]').forEach((btn) => {
      btn.addEventListener('click', () => {
        b.resolved = true;
        const ok = btn.dataset.badgeName === target.name;
        let msg;
        if (ok) {
          this.state.funds += 40;
          this.state.hp = Math.min(this.state.maxHp, this.state.hp + 8);
          if (typeof Achievements !== 'undefined') Achievements.unlock('badge-remember');
          msg = `⭕ 「${target.name}さんですよね!」\n「覚えていてくれたんですね!」— 相手は明らかに嬉しそうだ。研究の話で盛り上がり、共同研究の芽が生まれた。💰+40 ・ 🧠+8`;
        } else {
          this.state.hp = Math.max(1, this.state.hp - 6);
          msg = `❌ 「…私は ${target.name} です(苦笑)」\n名前を間違えるのは、覚えていないより気まずい…。🧠-6。\n(名刺交換のときは、名前+所属+テーマをセットで覚えるのがコツ)`;
        }
        this.save();
        this.renderHud();
        document.getElementById('run-event-content').innerHTML =
          this.eventHead('👤', ok ? '再会成功!' : '気まずい再会…', '') +
          `<div class="card" style="text-align:center;white-space:pre-line">${escapeHtml(msg)}</div>
          <button class="btn-large primary" style="margin-top:12px" id="btn-badge-rest">☕ 休憩スペースへ</button>`;
        document.getElementById('btn-badge-rest').addEventListener('click', () => {
          this._restKiosk = this.buildRestKiosk();
          this.renderRestMenu();
        });
      });
    });
  },

  /* ---------- ランダムイベント ---------- */
  openRandom() {
    showScreen('run-event');
    this.renderHud();
    const el = document.getElementById('run-event-content');
    el.innerHTML = `
      ${this.eventHead('❓', '何かが起こる…', '')}
      <div class="roulette" id="roulette">🎲</div>`;
    const icons = ['🛗', '☕', '📦', '🎟️', '👋', '🎲'];
    let n = 0;
    const spin = setInterval(() => {
      const r = document.getElementById('roulette');
      if (r) r.textContent = icons[n++ % icons.length];
    }, 110);
    // 待たされるのはテンポが悪いので、タップすればすぐ結果に進めるようにする
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(spin);
      const events = ['elevator', 'spill', 'lost', 'lottery', 'friend'];
      this.resolveRandom(events[Math.floor(Math.random() * events.length)]);
    };
    el.addEventListener('click', finish, { once: true });
    setTimeout(finish, 1400);
  },

  resolveRandom(type) {
    const el = document.getElementById('run-event-content');
    if (type === 'elevator') {
      const card = ELEVATOR_CARDS[Math.floor(Math.random() * ELEVATOR_CARDS.length)];
      el.innerHTML = `
        ${this.eventHead('🛗', 'エレベーターイベント!', '成功すれば報酬2倍の1ターン勝負')}
        <div class="card" style="text-align:center">${escapeHtml(card.partner)}と2人きりになった…</div>
        <button class="btn-large primary" style="margin-top:12px" id="btn-elev-go">会話開始</button>`;
      document.getElementById('btn-elev-go').addEventListener('click', () => {
        this.startBattle(false, card, 2);
      });
      return;
    }
    if (type === 'spill') {
      this.state.hp = Math.max(1, this.state.hp - 5);
      let msg = '☕ 人混みでコーヒーをこぼしてしまった… 🧠-5。';
      if (Math.random() < 0.5) {
        this.state.funds += 10;
        msg += '\nしかし親切な参加者が拭くのを手伝ってくれて、そのまま少し話せた。💰+10。';
      }
      el.innerHTML = this.eventHead('☕', 'アクシデント!', '');
      this.save(); this.eventDone(msg);
      return;
    }
    if (type === 'lost') {
      el.innerHTML = this.eventHead('📦', '落とし物発見', '');
      let msg;
      if (Math.random() < 0.3) {
        const badId = Math.random() < 0.5 ? 'jetlag' : 'proceedings';
        this.gainItem(badId);
        msg = `📦 拾ったのは… ${RUN_ITEMS[badId].icon} ${RUN_ITEMS[badId].name} だった!\n${RUN_ITEMS[badId].desc}`;
      } else {
        const pool = ['coffee', 'energy', 'invite'];
        const id = pool[Math.floor(Math.random() * pool.length)];
        this.gainItem(id);
        msg = `📦 ${RUN_ITEMS[id].icon} ${RUN_ITEMS[id].name} を拾った。(受付に届けたら「どうぞ」と言われた)`;
      }
      this.save(); this.eventDone(msg);
      return;
    }
    if (type === 'lottery') {
      el.innerHTML = this.eventHead('🎟️', '抽選会', '');
      let msg;
      if (Math.random() < 0.6) {
        const amt = 10 + Math.floor(Math.random() * 21);
        this.state.funds += amt;
        msg = `🎟️ 抽選券が当たった! 💰${amt} を獲得。`;
      } else {
        this.gainItem('coffee');
        msg = `🎟️ 景品は ☕ コーヒーだった。(${RUN_ITEMS.coffee.desc})`;
      }
      this.save(); this.eventDone(msg);
      return;
    }
    // friend
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + 10);
    el.innerHTML = this.eventHead('👋', '旧友と再会', '');
    this.save();
    this.eventDone('👋 アメリカの研究所時代の友人とばったり再会! 近況を話して元気が出た。🧠+10。');
  },

  eventDone(msg) {
    this.renderHud();
    const el = document.getElementById('run-event-content');
    el.innerHTML += `
      <div class="card" style="text-align:center;margin-top:8px">${escapeHtml(msg)}</div>
      <button class="btn-large primary" style="margin-top:12px" id="btn-event-done">マップに戻る</button>`;
    document.getElementById('btn-event-done').addEventListener('click', () => showScreen('run-map'));
  },

  /* ---------- 終了 ---------- */
  clearRun() {
    const funds = this.state.funds;
    const bonus = 100; // 完走ボーナス

    // 所持しているレリックの完走ボーナスを精算
    const relicRows = [];
    let relicPt = 0, relicGems = 0;
    for (const id of this.state.items) {
      const it = RUN_ITEMS[id];
      if (!it || !it.clearBonus) continue;
      const cb = it.clearBonus;
      relicPt += cb.pt || 0;
      relicGems += cb.gems || 0;
      relicRows.push(`<div class="relic-bonus">
        <span class="relic-icon">${it.icon}</span>
        <span class="relic-text">${escapeHtml(cb.msg)}<br>
          <strong>${cb.pt ? `⭐+${cb.pt}` : ''}${cb.pt && cb.gems ? ' ・ ' : ''}${cb.gems ? `💎+${cb.gems}` : ''}</strong></span>
      </div>`);
    }

    Gami.recordPractice(100);
    Gami.addPoints(funds + bonus + relicPt);
    if (typeof Achievements !== 'undefined') {
      Achievements.unlock('run-clear');
      if (relicRows.length >= 2) Achievements.unlock('relic-collector');
    }
    if (typeof Gems !== 'undefined') Gems.add(5 + relicGems, '学会制覇');
    this.end();
    showScreen('run-result');
    document.getElementById('run-result-content').innerHTML = `
      <div class="rank-badge" style="color:var(--success);border-color:var(--success)">
        <span class="rank-letter">🎓</span></div>
      <p class="rank-label">学会制覇!</p>
      <p class="field-note" style="margin-bottom:14px">
        座長、大御所、そして鋭いReviewer——<br>
        3日間すべての会話を乗り切りました。<br>
        あなたの学会は、確かな人脈と次の論文の約束とともに終わりました。
      </p>
      <div class="xp-gains">
        <span class="xp-chip points">💰 ${funds} → ⭐ ${funds} pt に換金</span>
        <span class="xp-chip points">🎓 完走ボーナス +${bonus} pt</span>
        <span class="xp-chip">💎 +5</span>
      </div>
      ${relicRows.length ? `<h3 class="about-section">✨ レリックボーナス</h3>${relicRows.join('')}` : ''}
      <button class="btn-large primary" id="btn-run-again" style="margin-top:14px">新しい学会に挑戦</button>
      <button class="btn-large" data-nav="home" style="margin-top:10px">ホームへ</button>`;
    this.wireResultButtons();
  },

  /** 途中で切り上げる。ゲームオーバーより有利(研究費の40%を持ち帰り) */
  retire() {
    const keep = Math.round(this.state.funds * 0.4);
    const day = this.state.day || 1;
    Gami.addPoints(keep);
    if (typeof Achievements !== 'undefined') Achievements.unlock('give-up');
    this.end();
    showScreen('run-result');
    document.getElementById('run-result-content').innerHTML = `
      <div class="rank-badge" style="color:var(--accent);border-color:var(--accent)">
        <span class="rank-letter">🏳️</span></div>
      <p class="rank-label">撤退</p>
      <p class="field-note" style="margin-bottom:14px">
        Day ${day} で学会を切り上げました。<br>
        引き際を見極めるのも大事な判断です。獲得したXPはすべて残ります。
      </p>
      <div class="xp-gains">
        <span class="xp-chip points">💰の40% → ⭐ ${keep} pt を持ち帰り</span>
      </div>
      <button class="btn-large primary" id="btn-run-again" style="margin-top:14px">新しい学会に挑戦</button>
      <button class="btn-large" data-nav="home" style="margin-top:10px">ホームへ</button>`;
    this.wireResultButtons();
  },

  gameOver() {
    const keep = Math.round(this.state.funds * 0.1);
    Gami.addPoints(keep);
    if (typeof Achievements !== 'undefined') Achievements.unlock('gameover');
    this.end();
    showScreen('run-result');
    document.getElementById('run-result-content').innerHTML = `
      <div class="rank-badge" style="color:var(--danger);border-color:var(--danger)">
        <span class="rank-letter">💤</span></div>
      <p class="rank-label">力尽きた…</p>
      <p class="field-note" style="margin-bottom:14px">メンタルが尽きて、ホテルに退散しました。<br>獲得したXPはすべて残ります。</p>
      <div class="xp-gains">
        <span class="xp-chip points">💰の10% → ⭐ ${keep} pt を持ち帰り</span>
      </div>
      <button class="btn-large primary" id="btn-run-again" style="margin-top:14px">再挑戦</button>
      <button class="btn-large" data-nav="home" style="margin-top:10px">ホームへ</button>`;
    this.wireResultButtons();
  },

  wireResultButtons() {
    document.getElementById('btn-run-again').addEventListener('click', () => {
      this.newRun();
      showScreen('run-map');
    });
    document.querySelectorAll('#run-result-content [data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => showScreen(btn.dataset.nav));
    });
  }
};
