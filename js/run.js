/* ConfQuest - 学会攻略モード(ローグライク) Phase 1
 * マップ進行・会話戦闘・お店・休憩所・お宝(簡易)・アイテム・セーブ
 */
'use strict';

/* ---------- アイテム定義 ---------- */
const RUN_ITEMS = {
  shirt:    { icon: '👔', name: 'アイロンがけしたシャツ', price: 60, kind: 'gadget',
              desc: '会話で得られる研究費が25%増える' },
  earphone: { icon: '🎧', name: '翻訳イヤホン', price: 70, kind: 'gadget',
              desc: 'スピードゲージの減りが25%遅くなる' },
  cardcase: { icon: '💼', name: '名刺入れ', price: 55, kind: 'gadget',
              desc: '会話の各ターンで30%の確率で最悪の選択肢が消える' },
  coupon:   { icon: '🎫', name: '学会クーポン', price: 45, kind: 'gadget',
              desc: 'お店の売買が20%有利になる' },
  charm:    { icon: '🧿', name: 'お守り', price: 80, kind: 'gadget',
              desc: 'メンタルが0になっても一度だけHP15で復活する(消滅)' },
  trophy:   { icon: '🏆', name: '記念トロフィー', price: 999, kind: 'gadget',
              desc: '効果はないが高く売れる(80pt)', sellValue: 80, noShop: true },
  mic:      { icon: '🎤', name: '座長の推薦状', price: 999, kind: 'gadget', noShop: true,
              desc: '会話で得られる研究費が15%増える(Day 1ボス撃破の証)', sellValue: 60 },
  goldcard: { icon: '🥇', name: '大御所の名刺', price: 999, kind: 'gadget', noShop: true,
              desc: '会話で受けるダメージが25%減る(Day 2ボス撃破の証)', sellValue: 70 },
  // ドリンク(使い切り。アイコンをタップして使用)
  coffee:   { icon: '☕', name: 'コーヒー', price: 20, kind: 'drink',
              desc: '使うと、次の会話だけスピードゲージの減りが半分になる' },
  energy:   { icon: '🧃', name: '栄養ドリンク', price: 15, kind: 'drink',
              desc: '使うと、🧠が15回復する' },
  invite:   { icon: '🍀', name: '招待状', price: 35, kind: 'drink',
              desc: '研究者ノードに入るとき、会話を1回スキップできる(自動で確認されます)' },
  // バッドアイテム(拾ってしまうことがある。お店で売って処分)
  jetlag:      { icon: '😪', name: '時差ボケ', price: 20, kind: 'bad', noShop: true,
                 desc: 'スピードゲージの減りが25%速くなる(バッドアイテム。お店で売って処分できます)' },
  proceedings: { icon: '📚', name: '分厚いプロシーディングス', price: 20, kind: 'bad', noShop: true,
                 desc: '会話中、30%の確率で紛らわしい選択肢が1つ増える(バッドアイテム。お店で売って処分できます)' }
};

const NODE_TYPES = {
  researcher: { icon: '💬', label: '研究者' },
  treasure:   { icon: '🎁', label: 'お宝' },
  shop:       { icon: '🛒', label: 'お店' },
  rest:       { icon: '☕', label: '休憩所' },
  random:     { icon: '❓', label: 'ランダム' },
  elite:      { icon: '⭐', label: 'エリート' },
  boss:       { icon: '👑', label: 'ボス' }
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
    this.state = {
      active: true,
      day: 1,
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
      if (i === LAYERS - 1) count = 1;                       // 最上段はボス
      else if (i === 0) count = 3;
      else count = 2 + Math.floor(Math.random() * 3);        // 2〜4
      const nodes = [];
      for (let j = 0; j < count; j++) {
        nodes.push({ type: this.pickType(i, LAYERS), visited: false });
      }
      layers.push(nodes);
    }
    // お店と休憩所が1つも無いマップを防ぐ / エリートは1つまで
    const flat = layers.slice(1, -1).flat();
    const forceType = (type, minLayer, maxLayer, avoid) => {
      if (flat.some((n) => n.type === type)) return;
      // 上書きしてはいけないタイプを避けて配置する
      for (let tries = 0; tries < 20; tries++) {
        const l = minLayer + Math.floor(Math.random() * (maxLayer - minLayer + 1));
        const node = layers[l][Math.floor(Math.random() * layers[l].length)];
        if (!avoid.includes(node.type)) { node.type = type; return; }
      }
    };
    forceType('shop', 2, 5, ['rest']);
    forceType('rest', 4, 6, ['shop']);
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
    if (layerIdx === 0) return 'researcher';               // 最初は必ず会話から
    const r = Math.random();
    if (r < 0.42) return 'researcher';
    if (r < 0.57) return 'treasure';
    if (r < 0.70) return 'random';
    if (r < 0.82) return 'rest';
    if (r < 0.93) return 'shop';
    return 'elite';                                        // 中盤に稀に出現(1つまで)
  },

  hasItem(id) { return this.state.items.includes(id); },
  removeItem(id) {
    const i = this.state.items.indexOf(id);
    if (i >= 0) this.state.items.splice(i, 1);
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
    if (h) h.textContent = dayInfo ? dayInfo.name : '学会攻略';
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
    setTimeout(begin, 3400);
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
    if (b.isBoss) reward += DAY_INFO[b.bossDay - 1].bossReward.funds;
    reward = Math.round(reward * (b.rewardMult || 1));
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
      this.state.items.push('trophy');
      itemNote = `<div class="levelup-box">🏆 ${RUN_ITEMS.trophy.name} を手に入れた!(${RUN_ITEMS.trophy.desc})</div>`;
    }
    if (b.isBoss) {
      const bossItem = DAY_INFO[b.bossDay - 1].bossReward.item;
      if (bossItem && !this.hasItem(bossItem)) {
        this.state.items.push(bossItem);
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
    const nextLabel = b.isBoss
      ? (b.bossDay >= 3 ? '🎓 学会を終える' : '次の日へ')
      : 'マップに戻る';
    document.getElementById('run-battle-stage').innerHTML = `
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
        ${missed.length ? `<div class="review-item" style="margin-top:10px">
          <p class="review-chosen">見直し: ${escapeHtml(missed[0].chosen)}</p>
          <p class="review-best">ベスト: ${escapeHtml(missed[0].best.text)}</p>
        </div>` : (b.turns.length === 1
          ? '<p class="all-best">ベストな返しができた!</p>'
          : '<p class="all-best">全ターンでベスト選択!</p>')}
      </div>
      <button class="btn-large primary" id="btn-run-battle-done">${nextLabel}</button>`;

    document.getElementById('btn-run-battle-done').addEventListener('click', () => {
      if (b.isBoss) {
        if (b.bossDay >= 3) this.clearRun();
        else this.nextDay();
      } else {
        showScreen('run-map');
      }
    });
  },

  /** 次の日へ: マップを再生成し、一晩の休息で少し回復 */
  nextDay() {
    const s = this.state;
    s.day = (s.day || 1) + 1;
    s.hp = Math.min(s.maxHp, s.hp + 15);
    s.layer = -1;
    s.nodeIndex = -1;
    s.map = this.genMap();
    this.save();
    showScreen('run-result');
    const info = DAY_INFO[s.day - 1];
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
    showScreen('run-event');
    this.renderShop();
  },

  renderShop() {
    this.renderHud();
    const s = this.state;
    const drinks = ['coffee', 'energy', 'invite'];
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
      <h4 class="about-section">ドリンク(使い切り)</h4>
      ${drinks.map((id) =>
        row(id, `💰${this.priceBuy(id)}`, 'data-buy', s.funds >= this.priceBuy(id))).join('')}
      <h4 class="about-section">売却</h4>
      ${s.items.length ? s.items.map((id, idx) => `
        <div class="shop-row">
          <span class="shop-icon">${RUN_ITEMS[id].icon}</span>
          <span class="shop-body"><strong>${RUN_ITEMS[id].name}</strong>
            ${RUN_ITEMS[id].kind === 'bad' ? '<span class="field-note" style="color:var(--warn)">バッドアイテム — 売って処分!</span>' : ''}</span>
          <button class="btn-control" data-sell="${idx}">売る 💰${this.priceSell(id)}</button>
        </div>`).join('') : '<p class="field-note">売れるものがありません</p>'}
      <button class="btn-large primary" style="margin-top:14px" id="btn-shop-leave">店を出る</button>`;

    document.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.buy;
        if (this.state.funds < this.priceBuy(id)) return;
        const price = this.priceBuy(id);
        this.state.funds -= price;
        this.state.items.push(id);
        this.shopStock = this.shopStock.filter((x) => x !== id);
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

  /* ---------- お宝(ミニゲーム) ---------- */
  openTreasure() {
    showScreen('run-event');
    this.renderHud();
    const r = Math.random();
    if (r < 0.30) this.miniSlot();
    else if (r < 0.55) this.miniTrivia();
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
    const q = LANG_QUIZ[Math.floor(Math.random() * LANG_QUIZ.length)];
    this.renderQuiz('🗣️', `${q.lang}クイズ`, q, (ok, qq) => {
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
        this.state.items.push(id);
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
    setTimeout(() => {
      clearInterval(spin);
      const events = ['elevator', 'spill', 'lost', 'lottery', 'friend'];
      this.resolveRandom(events[Math.floor(Math.random() * events.length)]);
    }, 1700);
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
        this.state.items.push(badId);
        msg = `📦 拾ったのは… ${RUN_ITEMS[badId].icon} ${RUN_ITEMS[badId].name} だった!\n${RUN_ITEMS[badId].desc}`;
      } else {
        const pool = ['coffee', 'energy', 'invite'];
        const id = pool[Math.floor(Math.random() * pool.length)];
        this.state.items.push(id);
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
        this.state.items.push('coffee');
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
    Gami.recordPractice(100);
    Gami.addPoints(funds + bonus);
    if (typeof Achievements !== 'undefined') Achievements.unlock('run-clear');
    if (typeof Gems !== 'undefined') Gems.add(5, '学会制覇');
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
