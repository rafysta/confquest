/* ConfQuest - 会話トレーニング(選択肢バトル)エンジン */
'use strict';

/* ---------- プレイヤーステータス ---------- */
const Stats = {
  KEYS: {
    network: { label: 'Networking', icon: '🤝', desc: '人とつながる力' },
    english: { label: 'English', icon: '🗣️', desc: '英語で伝える力' },
    confidence: { label: 'Confidence', icon: '🔥', desc: '踏み出す力' },
    topic: { label: 'Topics', icon: '💡', desc: '話題を広げる力' }
  },

  data() {
    return JSON.parse(localStorage.getItem('lq_stats') ||
      '{"network":0,"english":0,"confidence":0,"topic":0}');
  },
  save(d) { localStorage.setItem('lq_stats', JSON.stringify(d)); },

  /** 累積XPからレベルを算出 (Lv n に必要な累積XP = 50*n*(n-1)/2 相当の緩やかな曲線) */
  level(xp) {
    let lv = 1, need = 50, acc = 0;
    while (xp >= acc + need && lv < 99) {
      acc += need; lv++; need = Math.round(need * 1.25);
    }
    return { level: lv, into: xp - acc, need };
  },

  /** XPを加算し、レベルアップしたステータス名の配列を返す */
  add(gains) {
    const d = this.data();
    const levelUps = [];
    for (const [k, v] of Object.entries(gains)) {
      if (!(k in d) || !v) continue;
      const before = this.level(d[k]).level;
      d[k] += v;
      const after = this.level(d[k]).level;
      if (after > before) levelUps.push({ key: k, level: after });
    }
    this.save(d);
    return levelUps;
  },

  totalLevel() {
    const d = this.data();
    return Object.values(d).reduce((sum, xp) => sum + this.level(xp).level, 0);
  }
};

/* ---------- 会話バトル ---------- */
const Convo = {
  scenario: null,
  turnIndex: 0,
  affinity: 50,
  log: [],
  timerId: null,
  turnStartedAt: 0,
  answered: false,

  start(scenarioId) {
    this.scenario = SCENARIOS.find((s) => s.id === scenarioId);
    if (!this.scenario) return false;
    this.turnIndex = 0;
    this.affinity = 50;
    this.log = [];
    this.renderIntro();
    return true;
  },

  renderIntro() {
    const s = this.scenario;
    document.getElementById('convo-stage').innerHTML = `
      <div class="convo-intro">
        <div class="convo-icon">${s.icon}</div>
        <h3>${escapeHtml(s.title)}</h3>
        <p class="convo-setting">${escapeHtml(s.setting)}</p>
        <div class="convo-partner">
          <span class="partner-name">${escapeHtml(s.partner.name)}</span>
          <span class="field-note">${escapeHtml(s.partner.desc)}</span>
        </div>
        <button class="btn-large primary" id="btn-convo-begin">会話を始める</button>
      </div>`;
    document.getElementById('convo-hud').classList.add('hidden');
    document.getElementById('btn-convo-begin').addEventListener('click', () => {
      document.getElementById('convo-hud').classList.remove('hidden');
      this.renderTurn();
    });
  },

  updateHud() {
    const bar = document.getElementById('affinity-bar');
    const val = document.getElementById('affinity-value');
    const pct = Math.max(0, Math.min(100, this.affinity));
    bar.style.width = `${pct}%`;
    bar.className = 'affinity-bar' + (pct >= 70 ? ' high' : (pct < 40 ? ' low' : ''));
    val.textContent = `${Math.round(pct)}`;
    document.getElementById('convo-progress').textContent =
      `${this.turnIndex + 1} / ${this.scenario.turns.length}`;
  },

  renderTurn() {
    const turn = this.scenario.turns[this.turnIndex];
    this.answered = false;
    this.updateHud();

    // 選択肢は毎回シャッフル(位置で覚えないように)
    const order = turn.choices.map((c, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    document.getElementById('convo-stage').innerHTML = `
      <div class="situation">${renderMarkdown(turn.situation)}</div>
      <div class="timer-wrap"><div class="timer-bar" id="timer-bar"></div></div>
      <div class="choices" id="choices">
        ${order.map((i) => `
          <button class="choice-btn" data-choice="${i}">${escapeHtml(turn.choices[i].text)}</button>
        `).join('')}
      </div>`;

    document.querySelectorAll('[data-choice]').forEach((btn) => {
      btn.addEventListener('click', () => this.answer(Number(btn.dataset.choice)));
    });

    this.startTimer(turn.limitSec || 12);
  },

  /** 設定の時間倍率(初期値はゆっくり1.5倍) */
  timeScale() {
    return parseFloat(localStorage.getItem('lq_time_scale') || '1.5') || 1.5;
  },

  startTimer(limitSec) {
    clearInterval(this.timerId);
    this.turnStartedAt = Date.now();
    const bar = document.getElementById('timer-bar');
    const limitMs = limitSec * 1000 * this.timeScale();
    this.timerId = setInterval(() => {
      const left = limitMs - (Date.now() - this.turnStartedAt);
      const frac = Math.max(0, left / limitMs);
      if (bar) {
        bar.style.width = `${frac * 100}%`;
        bar.className = 'timer-bar' + (frac < 0.3 ? ' urgent' : '');
      }
      if (left <= 0) {
        clearInterval(this.timerId);
        if (!this.answered) this.answer(-1);
      }
    }, 100);
  },

  /** choiceIndex = -1 は時間切れ */
  answer(choiceIndex) {
    if (this.answered) return;
    this.answered = true;
    clearInterval(this.timerId);

    const turn = this.scenario.turns[this.turnIndex];
    const limitMs = (turn.limitSec || 12) * 1000 * this.timeScale();
    const elapsed = Date.now() - this.turnStartedAt;
    const timedOut = choiceIndex < 0;
    const choice = timedOut ? null : turn.choices[choiceIndex];

    let delta = timedOut ? -2 : choice.delta;
    let speedBonus = 0;
    // 良い選択を素早くできたらボーナス(間の取り方も実力のうち)
    if (!timedOut && choice.delta >= 2 && elapsed < limitMs * 0.5) {
      speedBonus = 1;
      delta += speedBonus;
    }
    this.affinity = Math.max(0, Math.min(100, this.affinity + delta * 6));

    this.log.push({
      situation: turn.situation,
      chosen: timedOut ? '(時間切れ)' : choice.text,
      delta, timedOut,
      best: turn.choices.find((c) => c.best),
      why: timedOut
        ? '沈黙が長すぎました。懇親会では、完璧な一言より**すぐに返すこと**の方が大事な場面が多いです。'
        : choice.why,
      wasBest: !timedOut && !!choice.best
    });

    this.renderFeedback(timedOut, choice, delta, speedBonus, turn);
  },

  renderFeedback(timedOut, choice, delta, speedBonus, turn) {
    this.updateHud();
    const sign = delta > 0 ? '+' : '';
    const cls = delta > 0 ? 'good' : (delta < 0 ? 'bad' : 'neutral');
    const best = turn.choices.find((c) => c.best);
    const showBest = !timedOut && !choice.best;

    document.getElementById('convo-stage').innerHTML = `
      <div class="feedback ${cls}">
        <div class="fb-head">
          <span class="fb-delta">好感度 ${sign}${delta * 6}</span>
          ${speedBonus ? '<span class="fb-bonus">⚡ 即答ボーナス</span>' : ''}
          ${!timedOut && choice.best ? '<span class="fb-best">★ ベスト</span>' : ''}
        </div>
        <p class="fb-chosen">${timedOut ? '(時間切れ — 何も言えませんでした)' : '「' + escapeHtml(choice.text) + '」'}</p>
        <div class="md-body fb-why">${renderMarkdown(timedOut
          ? '沈黙が長すぎました。懇親会では、完璧な一言より**すぐに返すこと**の方が大事な場面が多いです。'
          : choice.why)}</div>
        ${showBest || timedOut ? `
          <div class="fb-best-box">
            <p class="fb-best-label">この場面のベスト</p>
            <p class="fb-best-text">${escapeHtml(best.text)}</p>
          </div>` : ''}
      </div>
      <button class="btn-large primary" id="btn-convo-next">
        ${this.turnIndex < this.scenario.turns.length - 1 ? '次へ' : '結果を見る'}
      </button>`;

    document.getElementById('btn-convo-next').addEventListener('click', () => {
      if (this.turnIndex < this.scenario.turns.length - 1) {
        this.turnIndex++;
        this.renderTurn();
      } else {
        this.finish();
      }
    });
  },

  finish() {
    const s = this.scenario;
    const rank = affinityRank(this.affinity);
    const bestCount = this.log.filter((l) => l.wasBest).length;

    // XP: 好感度とベスト選択数から算出し、シナリオのfocusに配分
    const baseXp = Math.round(this.affinity / 4) + bestCount * 5;
    const gains = {};
    s.focus.forEach((k) => { gains[k] = baseXp; });
    const levelUps = Stats.add(gains);

    // ポイントとストリークは既存のゲーミフィケーションに合流
    const earned = Gami.recordPractice(this.affinity);

    // 履歴保存
    const hist = JSON.parse(localStorage.getItem('lq_convo_history') || '[]');
    hist.unshift({
      date: new Date().toISOString(), scenarioId: s.id, title: s.title,
      affinity: Math.round(this.affinity), rank: rank.rank, bestCount,
      total: s.turns.length
    });
    localStorage.setItem('lq_convo_history', JSON.stringify(hist.slice(0, 100)));

    if (rank.rank === 'S' && typeof Achievements !== 'undefined') {
      Achievements.unlock('convo-s');
    }
    this.renderResult(rank, bestCount, baseXp, gains, levelUps, earned);
  },

  renderResult(rank, bestCount, baseXp, gains, levelUps, earned) {
    const s = this.scenario;
    const missed = this.log.filter((l) => !l.wasBest);

    document.getElementById('convo-hud').classList.add('hidden');
    document.getElementById('convo-stage').innerHTML = `
      <div class="convo-result">
        <div class="rank-badge" style="color:${rank.color};border-color:${rank.color}">
          <span class="rank-letter">${rank.rank}</span>
        </div>
        <p class="rank-label">${escapeHtml(rank.label)}</p>
        <p class="field-note">好感度 ${Math.round(this.affinity)} / 100 ・ ベスト選択 ${bestCount}/${s.turns.length}</p>

        <div class="xp-gains">
          ${Object.entries(gains).map(([k, v]) =>
            `<span class="xp-chip">${Stats.KEYS[k].icon} ${Stats.KEYS[k].label} +${v} XP</span>`).join('')}
          <span class="xp-chip points">⭐ +${earned} pt</span>
        </div>

        ${levelUps.length ? `
          <div class="levelup-box">
            ${levelUps.map((l) =>
              `<p>🎉 <strong>${Stats.KEYS[l.key].label}</strong> が Lv.${l.level} に上がりました!</p>`).join('')}
          </div>` : ''}

        ${missed.length ? `
          <h3 class="about-section">見直しポイント</h3>
          ${missed.map((l) => `
            <div class="review-item">
              <p class="review-chosen">選んだ: ${escapeHtml(l.chosen)}</p>
              <div class="md-body review-why">${renderMarkdown(l.why)}</div>
              <p class="review-best">ベスト: ${escapeHtml(l.best.text)}</p>
            </div>`).join('')}
        ` : '<p class="all-best">全問ベスト選択! 完璧な立ち回りでした。</p>'}
      </div>
      <div class="results-actions">
        <button class="btn-large primary" id="btn-convo-retry">もう一度</button>
        <button class="btn-large" data-nav="convo-list">場面を選ぶ</button>
        <button class="btn-large" data-nav="home">ホームへ</button>
      </div>`;

    document.getElementById('btn-convo-retry').addEventListener('click', () => this.start(s.id));
    document.querySelectorAll('#convo-stage [data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => showScreen(btn.dataset.nav));
    });
  }
};
