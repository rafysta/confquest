/* ConfQuest - 学会攻略モード(ローグライク) Phase 1
 * マップ進行・会話戦闘・お店・休憩所・お宝(簡易)・アイテム・セーブ
 */
'use strict';

/* ---------- アイテム定義 ---------- */
const RUN_ITEMS = {
  shirt:    { icon: '👔', name: 'アイロンがけしたシャツ', price: 60,
              desc: '会話で得られる研究費が25%増える' },
  earphone: { icon: '🎧', name: '翻訳イヤホン', price: 70,
              desc: 'スピードゲージの減りが25%遅くなる' },
  cardcase: { icon: '💼', name: '名刺入れ', price: 55,
              desc: '会話の各ターンで30%の確率で最悪の選択肢が消える' },
  coupon:   { icon: '🎫', name: '学会クーポン', price: 45,
              desc: 'お店の売買が20%有利になる' },
  charm:    { icon: '🧿', name: 'お守り', price: 80,
              desc: 'メンタルが0になっても一度だけHP15で復活する(消滅)' },
  trophy:   { icon: '🏆', name: '記念トロフィー', price: 999,
              desc: '効果はないが高く売れる(80pt)', sellValue: 80, noShop: true }
};

const NODE_TYPES = {
  researcher: { icon: '💬', label: '研究者' },
  treasure:   { icon: '🎁', label: 'お宝' },
  shop:       { icon: '🛒', label: 'お店' },
  rest:       { icon: '☕', label: '休憩所' },
  elite:      { icon: '⭐', label: 'エリート' }
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
    this.state = JSON.parse(localStorage.getItem('lq_run'));
    return !!this.state;
  },
  end() {
    if (this.state) this.state.active = false;
    localStorage.removeItem('lq_run');
  },

  /* ---------- ラン開始とマップ生成 ---------- */
  newRun() {
    this.state = {
      active: true,
      hp: 50, maxHp: 50,
      funds: 30,
      items: [],
      layer: -1,          // 現在の層(-1 = まだマップ上のどこにもいない)
      nodeIndex: -1,
      usedCards: [],
      map: this.genMap()
    };
    this.save();
  },

  genMap() {
    const LAYERS = 8;
    const layers = [];
    for (let i = 0; i < LAYERS; i++) {
      let count;
      if (i === LAYERS - 1) count = 1;                       // 最上段はエリート
      else if (i === 0) count = 3;
      else count = 2 + Math.floor(Math.random() * 3);        // 2〜4
      const nodes = [];
      for (let j = 0; j < count; j++) {
        nodes.push({ type: this.pickType(i, LAYERS), visited: false });
      }
      layers.push(nodes);
    }
    // お店と休憩所が1つも無いマップを防ぐ
    const flat = layers.slice(1, -1).flat();
    if (!flat.some((n) => n.type === 'shop')) {
      const l = 2 + Math.floor(Math.random() * 4);
      layers[l][Math.floor(Math.random() * layers[l].length)].type = 'shop';
    }
    if (!flat.some((n) => n.type === 'rest')) {
      const l = 4 + Math.floor(Math.random() * 3);
      layers[l][Math.floor(Math.random() * layers[l].length)].type = 'rest';
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
    if (layerIdx === totalLayers - 1) return 'elite';
    if (layerIdx === 0) return 'researcher';               // 最初は必ず会話から
    const r = Math.random();
    if (r < 0.50) return 'researcher';
    if (r < 0.68) return 'treasure';
    if (r < 0.84) return 'rest';
    return 'shop';
  },

  hasItem(id) { return this.state.items.includes(id); },

  /* ---------- HUD ---------- */
  renderHud() {
    const s = this.state;
    document.querySelectorAll('.run-hud').forEach((el) => {
      el.innerHTML = `
        <div class="hud-hp">
          <span>🧠</span>
          <div class="hud-hp-track"><div class="hud-hp-fill ${s.hp <= s.maxHp * 0.3 ? 'low' : ''}"
            style="width:${Math.max(0, s.hp / s.maxHp * 100)}%"></div></div>
          <span class="hud-hp-num">${Math.max(0, s.hp)}/${s.maxHp}</span>
        </div>
        <span class="hud-funds">💰 ${s.funds}</span>
        <span class="hud-items">${s.items.map((id) =>
          `<button class="hud-item" data-item-info="${id}">${RUN_ITEMS[id].icon}</button>`).join('') || '<span class="field-note">アイテムなし</span>'}</span>`;
    });
    document.querySelectorAll('[data-item-info]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const it = RUN_ITEMS[btn.dataset.itemInfo];
        alert(`${it.icon} ${it.name}\n${it.desc}`);
      });
    });
  },

  /* ---------- マップ表示 ---------- */
  renderMap() {
    this.renderHud();
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
        nodesHtml += `<button class="map-node ${n.visited ? 'visited' : ''} ${isCur ? 'current' : ''} ${can ? 'reachable' : ''}"
          style="left:${p.x}%;top:${p.y}px"
          ${can ? `data-go="${i},${j}"` : 'disabled'}
          aria-label="${NODE_TYPES[n.type].label}">${NODE_TYPES[n.type].icon}</button>`;
      });
    });

    document.getElementById('run-map-area').innerHTML = `
      <div class="map-wrap" style="height:${H}px">
        <svg class="map-lines" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${svg}</svg>
        ${nodesHtml}
      </div>
      <p class="field-note" style="text-align:center">光っているノードをタップして進みます</p>`;

    document.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [i, j] = btn.dataset.go.split(',').map(Number);
        this.enterNode(i, j);
      });
    });

    const area = document.getElementById('run-map-area');
    area.scrollTop = area.scrollHeight;
  },

  reachableNodes() {
    const s = this.state;
    if (s.layer < 0) return s.map.layers[0].map((_, j) => [0, j]);
    if (s.layer >= s.map.layers.length - 1) return [];
    return s.map.edges
      .filter(([li, a]) => li === s.layer && a === s.nodeIndex)
      .map(([li, _a, b]) => [li + 1, b]);
  },

  enterNode(i, j) {
    const node = this.state.map.layers[i][j];
    this.state.layer = i;
    this.state.nodeIndex = j;
    node.visited = true;
    this.save();
    if (node.type === 'researcher') this.startBattle(false);
    else if (node.type === 'elite') this.startBattle(true);
    else if (node.type === 'shop') this.openShop();
    else if (node.type === 'rest') this.openRest();
    else if (node.type === 'treasure') this.openTreasure();
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

  startBattle(isElite) {
    let title, partner, turns, focus;
    if (isElite) {
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
    this.battle = {
      isElite, title, partner, turns, focus,
      turnIndex: 0, totalDelta: 0, bestCount: 0,
      log: [], answered: false, timerId: null, startedAt: 0
    };
    showScreen('run-battle');
    document.getElementById('run-battle-title').textContent = title;
    document.getElementById('run-battle-partner').textContent = partner;
    this.renderBattleTurn();
  },

  battleTimeMs(limitSec) {
    let ms = limitSec * 1000 * Convo.timeScale();
    if (this.hasItem('earphone')) ms *= 1.25;
    if (this.battle.isElite) ms *= 0.9;
    return ms;
  },

  renderBattleTurn() {
    const b = this.battle;
    const turn = b.turns[b.turnIndex];
    b.answered = false;
    this.renderHud();
    document.getElementById('run-battle-progress').textContent =
      `${b.turnIndex + 1} / ${b.turns.length}`;

    // 選択肢: 名刺入れで最悪の1つが消えることがある
    let idxs = turn.choices.map((_, i) => i);
    let removedNote = '';
    if (this.hasItem('cardcase') && Math.random() < 0.3) {
      const worst = idxs.reduce((a, i) =>
        turn.choices[i].delta < turn.choices[a].delta ? i : a, idxs[0]);
      idxs = idxs.filter((i) => i !== worst);
      removedNote = '<p class="field-note" style="text-align:center">💼 名刺入れが怪しい選択肢を1つ隠した</p>';
    }
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }

    document.getElementById('run-battle-stage').innerHTML = `
      <div class="situation">${renderMarkdown(turn.situation)}</div>
      <div class="timer-wrap"><div class="timer-bar" id="run-timer-bar"></div></div>
      ${removedNote}
      <div class="choices">
        ${idxs.map((i) =>
          `<button class="choice-btn" data-rchoice="${i}">${escapeHtml(turn.choices[i].text)}</button>`).join('')}
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
    const choice = timedOut ? null : turn.choices[choiceIndex];
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
    if (dmg > 0) this.state.hp -= dmg;

    b.log.push({
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
    document.getElementById('run-battle-stage').innerHTML = `
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
      </div>
      <button class="btn-large primary" id="btn-run-battle-next">
        ${this.state.hp <= 0 ? '…' : (b.turnIndex < b.turns.length - 1 ? '次へ' : '会話を終える')}
      </button>`;

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

  endBattle() {
    const b = this.battle;
    let reward = 8 + 3 * b.totalDelta;
    if (b.isElite) reward = Math.round(reward * 2.5) + 20;
    if (this.hasItem('shirt')) reward = Math.round(reward * 1.25);
    this.state.funds += reward;

    // XP(既存ステータスへ恒常的に加算)
    const xp = 5 + b.bestCount * 5 + (b.isElite ? 15 : 0);
    const gains = {};
    (b.focus || ['network']).forEach((k) => { gains[k] = xp; });
    const levelUps = Stats.add(gains);

    // エリート報酬: トロフィー
    let itemNote = '';
    if (b.isElite && !this.hasItem('trophy')) {
      this.state.items.push('trophy');
      itemNote = `<div class="levelup-box">🏆 ${RUN_ITEMS.trophy.name} を手に入れた!(${RUN_ITEMS.trophy.desc})</div>`;
    }
    this.save();
    this.renderHud();

    const missed = b.log.filter((l) => !l.wasBest);
    document.getElementById('run-battle-stage').innerHTML = `
      <div class="convo-result">
        <p class="rank-label">会話終了</p>
        <div class="xp-gains">
          <span class="xp-chip points">💰 +${reward}</span>
          ${Object.entries(gains).map(([k, v]) =>
            `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${v}XP</span>`).join('')}
        </div>
        ${itemNote}
        ${levelUps.map((l) =>
          `<div class="levelup-box">🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に!</div>`).join('')}
        ${missed.length ? `<div class="review-item" style="margin-top:10px">
          <p class="review-chosen">見直し: ${escapeHtml(missed[0].chosen)}</p>
          <p class="review-best">ベスト: ${escapeHtml(missed[0].best.text)}</p>
        </div>` : '<p class="all-best">全ターンでベスト選択!</p>'}
      </div>
      <button class="btn-large primary" id="btn-run-battle-done">${b.isElite ? '結果へ' : 'マップに戻る'}</button>`;

    document.getElementById('btn-run-battle-done').addEventListener('click', () => {
      if (b.isElite) this.clearRun();
      else { showScreen('run-map'); }
    });
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
    const all = Object.keys(RUN_ITEMS).filter((id) => !RUN_ITEMS[id].noShop);
    this.shopStock = all.filter((id) => !this.hasItem(id))
      .sort(() => Math.random() - 0.5).slice(0, 3);
    showScreen('run-event');
    this.renderShop();
  },

  renderShop() {
    this.renderHud();
    const s = this.state;
    document.getElementById('run-event-content').innerHTML = `
      <div class="convo-icon" style="text-align:center">🛒</div>
      <h3 style="text-align:center;margin-bottom:4px">学会ブース</h3>
      <p class="field-note" style="text-align:center;margin-bottom:14px">研究費でガジェットを売り買いできます${this.hasItem('coupon') ? ' (🎫クーポン適用中)' : ''}</p>
      <h4 class="about-section">購入</h4>
      ${this.shopStock.length ? this.shopStock.map((id) => `
        <div class="shop-row">
          <span class="shop-icon">${RUN_ITEMS[id].icon}</span>
          <span class="shop-body"><strong>${RUN_ITEMS[id].name}</strong>
            <span class="field-note">${RUN_ITEMS[id].desc}</span></span>
          <button class="btn-control ${s.funds >= this.priceBuy(id) ? 'primary' : ''}" data-buy="${id}"
            ${s.funds < this.priceBuy(id) ? 'disabled' : ''}>💰${this.priceBuy(id)}</button>
        </div>`).join('') : '<p class="field-note">在庫切れです</p>'}
      <div class="shop-row">
        <span class="shop-icon">🧃</span>
        <span class="shop-body"><strong>栄養ドリンク</strong><span class="field-note">その場で🧠15回復</span></span>
        <button class="btn-control ${s.funds >= 15 && s.hp < s.maxHp ? 'primary' : ''}" data-buy-drink
          ${s.funds < 15 || s.hp >= s.maxHp ? 'disabled' : ''}>💰15</button>
      </div>
      <h4 class="about-section">売却</h4>
      ${s.items.length ? s.items.map((id) => `
        <div class="shop-row">
          <span class="shop-icon">${RUN_ITEMS[id].icon}</span>
          <span class="shop-body"><strong>${RUN_ITEMS[id].name}</strong></span>
          <button class="btn-control" data-sell="${id}">売る 💰${this.priceSell(id)}</button>
        </div>`).join('') : '<p class="field-note">売れるものがありません</p>'}
      <button class="btn-large primary" style="margin-top:14px" id="btn-shop-leave">店を出る</button>`;

    document.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buy;
        if (this.state.funds < this.priceBuy(id)) return;
        this.state.funds -= this.priceBuy(id);
        this.state.items.push(id);
        this.shopStock = this.shopStock.filter((x) => x !== id);
        this.save(); this.renderShop();
      });
    });
    const drink = document.querySelector('[data-buy-drink]');
    if (drink) drink.addEventListener('click', () => {
      if (this.state.funds < 15 || this.state.hp >= this.state.maxHp) return;
      this.state.funds -= 15;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + 15);
      this.save(); this.renderShop();
    });
    document.querySelectorAll('[data-sell]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.sell;
        this.state.funds += this.priceSell(id);
        this.state.items = this.state.items.filter((x) => x !== id);
        if (!RUN_ITEMS[id].noShop && !this.shopStock.includes(id)) this.shopStock.push(id);
        this.save(); this.renderShop();
      });
    });
    document.getElementById('btn-shop-leave').addEventListener('click', () => showScreen('run-map'));
  },

  /* ---------- 休憩所 ---------- */
  openRest() {
    showScreen('run-event');
    this.renderHud();
    document.getElementById('run-event-content').innerHTML = `
      <div class="convo-icon" style="text-align:center">☕</div>
      <h3 style="text-align:center;margin-bottom:4px">休憩スペース</h3>
      <p class="field-note" style="text-align:center;margin-bottom:16px">静かなソファを見つけました。どう過ごしますか?</p>
      <button class="btn-large primary" id="btn-rest-heal">☕ 休む(🧠を${Math.round(this.state.maxHp * 0.3)}回復)</button>
      <button class="btn-large" id="btn-rest-study" style="margin-top:10px">📖 予習する(好きな能力に+30XP)</button>`;

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
  },

  /* ---------- お宝(Phase 1は無条件報酬のみ) ---------- */
  openTreasure() {
    showScreen('run-event');
    this.renderHud();
    const r = Math.random();
    let msg;
    if (r < 0.45) {
      const amt = 15 + Math.floor(Math.random() * 16);
      this.state.funds += amt;
      msg = `🎁 展示ブースの抽選で当たりが出た! 💰${amt} を獲得。`;
    } else if (r < 0.75) {
      const amt = 10 + Math.floor(Math.random() * 6);
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + amt);
      msg = `🎁 無料のお菓子とコーヒーを見つけた。🧠が${amt}回復。`;
    } else {
      const candidates = Object.keys(RUN_ITEMS)
        .filter((id) => !RUN_ITEMS[id].noShop && !this.hasItem(id));
      if (candidates.length) {
        const id = candidates[Math.floor(Math.random() * candidates.length)];
        this.state.items.push(id);
        msg = `🎁 ${RUN_ITEMS[id].icon} ${RUN_ITEMS[id].name} をもらった!(${RUN_ITEMS[id].desc})`;
      } else {
        this.state.funds += 20;
        msg = '🎁 もう持っているものばかりだったので、代わりに💰20をもらった。';
      }
    }
    this.save();
    document.getElementById('run-event-content').innerHTML = `
      <div class="convo-icon" style="text-align:center">🎁</div>
      <h3 style="text-align:center;margin-bottom:16px">お宝発見</h3>`;
    this.eventDone(msg);
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
    Gami.recordPractice(80);
    const g = Gami.data(); g.points += funds; Gami.save(g);
    this.end();
    showScreen('run-result');
    document.getElementById('run-result-content').innerHTML = `
      <div class="rank-badge" style="color:var(--success);border-color:var(--success)">
        <span class="rank-letter">🎓</span></div>
      <p class="rank-label">Day 1 クリア!</p>
      <p class="field-note" style="margin-bottom:14px">エリートとの会話を乗り切りました。<br>(Day 2以降はPhase 3で追加予定)</p>
      <div class="xp-gains">
        <span class="xp-chip points">💰 ${funds} → ⭐ ${funds} pt に換金</span>
      </div>
      <button class="btn-large primary" id="btn-run-again" style="margin-top:14px">もう一度挑戦</button>
      <button class="btn-large" data-nav="home" style="margin-top:10px">ホームへ</button>`;
    this.wireResultButtons();
  },

  gameOver() {
    const keep = Math.round(this.state.funds * 0.1);
    const g = Gami.data(); g.points += keep; Gami.save(g);
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
