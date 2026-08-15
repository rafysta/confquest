/* ConfQuest - Language Quest 学習エンジン (Phase 1)
 * フレーズカード育成 × 簡易SRS(間隔反復)
 *   Lv1 🌱 認識(4択) → Lv2 🌿 聞き取り(TTS) → Lv3 🌸 想起(制限時間つき)
 *   Lv4 ⭐ 発話(Whisper判定)は Phase 2 で実装予定。
 * データは js/phrases.js。SRS状態は localStorage('lq_srs')。
 */
'use strict';

/* ---------- 読み上げ(Web Speech API / speechSynthesis) ----------
 * 注意: 不採用にしたのは音声認識(SpeechRecognition)。読み上げは録音と競合しない。
 */
const Speech = {
  _voices: [],
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { this._voices = speechSynthesis.getVoices() || []; };
    load();
    if (typeof speechSynthesis.addEventListener === 'function') {
      speechSynthesis.addEventListener('voiceschanged', load);
    }
  },
  /** lang('ko'|'yue') に合う音声を探す。無ければnull */
  voiceFor(lang) {
    const prefs = (LEARN_LANGS[lang] || {}).ttsLangs || [];
    for (const p of prefs) {
      const v = this._voices.find((x) =>
        x.lang && x.lang.toLowerCase().startsWith(p.toLowerCase()));
      if (v) return v;
    }
    return null;
  },
  /** 確実に読み上げられるか(聞き取り問題を出して良いか) */
  canSpeak(lang) { return !!this.voiceFor(lang); },
  /** 読み上げる。音声が無くても utterance.lang 指定で一応試みる */
  speak(text, lang, rate) {
    if (!('speechSynthesis' in window)) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.voiceFor(lang);
      if (v) u.voice = v;
      u.lang = ((LEARN_LANGS[lang] || {}).ttsLangs || ['en'])[0];
      u.rate = rate || 0.9;
      speechSynthesis.speak(u);
      return true;
    } catch (_) { return false; }
  }
};
Speech.init();

/* ---------- SRS(簡易SM-2) ---------- */
const SRS = {
  KEY: 'lq_srs',
  INTERVALS: [0, 1, 3, 7, 14, 30],  // box → 次回までの日数
  REVIEW_CAP: 20,                    // 1日の復習上限(復習負債による挫折を防ぐ)
  NEW_PER_DAY: 5,                    // 1日に新しく学べるカード数(言語ごとに別枠)

  data() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (d && d.cards) return d;
    } catch (_) { /* fallthrough */ }
    return { cards: {}, newLog: {} };
  },
  save(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },

  get(id) { return this.data().cards[id] || null; },
  isIntroduced(id) { return !!this.get(id); },

  /** 今日新しく学んだ枚数(言語別。v1.4.0の数値形式は韓国語の記録として読む) */
  newToday(lang, now) {
    const log = this.data().newLog[localDayKey(now)];
    if (!log) return 0;
    if (typeof log === 'number') return lang === 'ko' ? log : 0;
    return log[lang] || 0;
  },
  newRemaining(lang, now) { return Math.max(0, this.NEW_PER_DAY - this.newToday(lang, now)); },

  addDays(dayKey, n) {
    const [y, m, d] = dayKey.split('-').map(Number);
    const t = new Date(y, m - 1, d + n);
    return localDayKey(t);
  },

  /** 新カードを学習開始 */
  introduce(id, now) {
    const d = this.data();
    if (d.cards[id]) return;
    const today = localDayKey(now);
    const lang = (Phrases.byId(id) || {}).lang || 'ko';
    d.cards[id] = { b: 0, due: today, lv: 1, s: 0, first: today, n: 0, ok: 0 };
    let log = d.newLog[today];
    if (typeof log === 'number') log = { ko: log };  // 旧形式からの移行
    if (!log || typeof log !== 'object') log = {};
    log[lang] = (log[lang] || 0) + 1;
    d.newLog[today] = log;
    // 60日より古い導入ログは掃除
    Object.keys(d.newLog).sort().slice(0, -60).forEach((k) => delete d.newLog[k]);
    this.save(d);
    if (typeof Achievements !== 'undefined') Achievements.unlock('lang-first');
  },

  /** 回答を記録。{levelUp: 新Lv|null} を返す */
  answer(id, correct, now) {
    const d = this.data();
    const rec = d.cards[id];
    if (!rec) return { levelUp: null };
    const today = localDayKey(now);
    rec.n++;
    let levelUp = null;
    if (correct) {
      rec.ok++;
      rec.b = Math.min(this.INTERVALS.length - 1, rec.b + 1);
      rec.s++;
      // 同じLvで2回連続正解したら次の段階へ(Phase 1はLv3まで)
      if (rec.s >= 2 && rec.lv < 3) { rec.lv++; rec.s = 0; levelUp = rec.lv; }
    } else {
      rec.b = Math.max(0, rec.b - 2);
      rec.s = 0;
    }
    rec.due = this.addDays(today, this.INTERVALS[rec.b]);
    this.save(d);
    if (levelUp && rec.lv >= 3) this.checkCollectAchievements();
    return { levelUp };
  },

  /** 復習期限が来ているカード(言語で絞り込み、期限が古い順)
   *  ⚠️要修正フラグのカードは、間違いを覚え込まないよう修正まで除外する */
  dueCards(lang, now) {
    const d = this.data();
    const today = localDayKey(now);
    return Phrases.all()
      .filter((c) => (!lang || c.lang === lang))
      .filter((c) => d.cards[c.id] && d.cards[c.id].due <= today)
      .filter((c) => typeof ReviewFlags === 'undefined' || ReviewFlags.get(c.id) !== 'fix')
      .sort((a, b) => d.cards[a.id].due < d.cards[b.id].due ? -1 : 1);
  },

  stageIcon(lv) { return ['', '🌱', '🌿', '🌸', '⭐'][lv] || '🌱'; },
  stageName(lv) { return ['', '認識', '聞き取り', '想起', '発話マスター'][lv] || ''; },

  /** 発話チェック合格でLv4(⭐マスター)にする */
  master(id, now) {
    const d = this.data();
    const rec = d.cards[id];
    if (!rec || rec.lv >= 4) return false;
    rec.lv = 4;
    rec.s = 0;
    this.save(d);
    if (typeof Achievements !== 'undefined') Achievements.unlock('lang-speak');
    this.checkCollectAchievements();
    return true;
  },

  /** 集計 */
  counts(lang) {
    const d = this.data();
    const cards = Phrases.byLang(lang);
    const out = { total: cards.length, introduced: 0, bloomed: 0, mastered: 0 };
    cards.forEach((c) => {
      const r = d.cards[c.id];
      if (r) {
        out.introduced++;
        if (r.lv >= 3) out.bloomed++;
        if (r.lv >= 4) out.mastered++;
      }
    });
    return out;
  },
  unitProgress(unitId) {
    const d = this.data();
    const u = Phrases.unit(unitId);
    const out = { total: u.cards.length, introduced: 0, bloomed: 0 };
    u.cards.forEach((c) => {
      const r = d.cards[c.id];
      if (r) { out.introduced++; if (r.lv >= 3) out.bloomed++; }
    });
    return out;
  },
  checkCollectAchievements() {
    if (typeof Achievements === 'undefined') return;
    const d = this.data();
    const bloomed = Phrases.all().filter((c) => d.cards[c.id] && d.cards[c.id].lv >= 3);
    if (bloomed.length >= 30) Achievements.unlock('lang-bloom30');
    for (const u of PHRASE_UNITS) {
      if (u.cards.every((c) => d.cards[c.id] && d.cards[c.id].lv >= 3)) {
        Achievements.unlock('lang-unit');
        break;
      }
    }
  }
};

/* ---------- イベント日カウントダウン ---------- */
const EventDates = {
  get(lang) { return localStorage.getItem(LEARN_LANGS[lang].eventKey) || ''; },
  set(lang, v) {
    if (v) localStorage.setItem(LEARN_LANGS[lang].eventKey, v);
    else localStorage.removeItem(LEARN_LANGS[lang].eventKey);
  },
  daysLeft(lang, now) {
    const v = this.get(lang);
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const base = now ? new Date(now) : new Date();
    const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    return Math.round((target - today) / 86400000);
  },
  chip(lang) {
    const meta = LEARN_LANGS[lang];
    const left = this.daysLeft(lang);
    if (left === null) {
      return `<button class="countdown-chip unset" data-nav="settings">${meta.eventIcon} ${meta.event}の日付を設定 →</button>`;
    }
    if (left > 0) {
      return `<span class="countdown-chip">${meta.eventIcon} ${meta.event}まで <strong>あと${left}日</strong></span>`;
    }
    if (left === 0) return `<span class="countdown-chip today">${meta.eventIcon} ${meta.event}は今日! 楽しんで!</span>`;
    return `<span class="countdown-chip past">${meta.eventIcon} ${meta.event} おつかれさまでした!</span>`;
  }
};

/* ---------- 監修フラグ(ネイティブチェック用) ---------- */
const ReviewFlags = {
  KEY: 'lq_review_flags',
  data() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); }
    catch (_) { return {}; }
  },
  get(id) { return this.data()[id] || ''; },
  /** タップで 未確認 → ✅OK → ⚠要修正 → 未確認 と循環。⚠を外すとメモも消す */
  cycle(id) {
    const d = this.data();
    const cur = d[id] || '';
    const next = cur === '' ? 'ok' : (cur === 'ok' ? 'fix' : '');
    if (next) d[id] = next; else delete d[id];
    localStorage.setItem(this.KEY, JSON.stringify(d));
    if (cur === 'fix' && next === '') this.setNote(id, '');
    return next;
  },
  /* ⚠に添える監修メモ */
  NOTES_KEY: 'lq_review_notes',
  notes() {
    try { return JSON.parse(localStorage.getItem(this.NOTES_KEY) || '{}'); }
    catch (_) { return {}; }
  },
  note(id) { return this.notes()[id] || ''; },
  setNote(id, text) {
    const n = this.notes();
    if (text) n[id] = text; else delete n[id];
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(n));
  },
  counts(lang) {
    const d = this.data();
    const out = { ok: 0, fix: 0, none: 0 };
    Phrases.byLang(lang).forEach((c) => {
      const f = d[c.id];
      if (f === 'ok') out.ok++; else if (f === 'fix') out.fix++; else out.none++;
    });
    return out;
  }
};

/** カード音声の再生: パートナーのお手本録音があれば優先、無ければTTS */
function playCardAudio(card, rate) {
  if (typeof VoiceStore !== 'undefined' && VoiceStore.has(card.id)) {
    VoiceStore.play(card.id, rate).then((ok) => {
      if (!ok) Speech.speak(card.t, card.lang, rate);
    });
    return;
  }
  Speech.speak(card.t, card.lang, rate);
}

/** このカードの音声を聞かせられるか(聞き取り出題して良いか) */
function canHearCard(card) {
  return (typeof VoiceStore !== 'undefined' && VoiceStore.has(card.id)) ||
    Speech.canSpeak(card.lang);
}

/* ---------- 学習UI ---------- */
const Learn = {
  lang: localStorage.getItem('lq_learn_lang') || 'ko',
  queue: [],          // [{type:'intro'|'quiz', card, mode}]
  idx: 0,
  firstTry: {},       // id -> まだ初回answerを記録していないか
  correct: 0,
  answered: 0,
  sessionKind: '',    // 'review' | 'unit'
  timerId: null,
  turnStartedAt: 0,
  locked: false,

  timeScale() { return parseFloat(localStorage.getItem('lq_time_scale') || '1.5') || 1.5; },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('lq_learn_lang', lang);
    this.renderHome();
  },

  /* ----- ホーム(言語タブ・復習CTA・ユニット一覧) ----- */
  renderHome() {
    const lang = this.lang;
    const meta = LEARN_LANGS[lang];
    const counts = SRS.counts(lang);
    const due = SRS.dueCards(lang);
    const dueShown = Math.min(due.length, SRS.REVIEW_CAP);
    const newRemain = SRS.newRemaining(lang);
    const ttsOk = Speech.canSpeak(lang);

    const el = document.getElementById('learn-content');
    el.innerHTML = `
      <div class="learn-tabs">
        ${Object.entries(LEARN_LANGS).map(([k, m]) => `
          <button class="learn-tab ${k === lang ? 'active' : ''}" data-learn-lang="${k}">
            ${m.flag} ${m.label}
          </button>`).join('')}
      </div>

      <div class="countdown-row">${EventDates.chip(lang)}</div>

      ${typeof Route !== 'undefined' ? (() => {
        const rkey = lang === 'ko' ? 'korea' : 'hk';
        const r = ROUTES[rkey];
        return `<button class="learn-cta card route-cta" id="btn-open-route" data-route="${rkey}">
          <span class="learn-cta-icon">${rkey === 'ko' || rkey === 'korea' ? '🚄' : '💒'}</span>
          <span class="learn-cta-body">
            <strong>${rkey === 'korea' ? 'Korea Route' : 'Hong Kong Route(Wedding Quest)'}</strong>
            <span class="field-note">${rkey === 'korea' ? '11月の旅程を先取りする路線図' : '結婚式までの物語を進む路線図'} ・ ${Route.clearedCount(rkey)}/${r.list.length}駅クリア</span>
          </span>
          <span class="learn-cta-go">▶</span>
        </button>`;
      })() : ''}

      ${dueShown > 0 ? `
        <button class="learn-cta card" id="btn-learn-review">
          <span class="learn-cta-icon">📖</span>
          <span class="learn-cta-body">
            <strong>今日の復習 ${dueShown}枚</strong>
            <span class="field-note">${due.length > SRS.REVIEW_CAP ? `残り${due.length - SRS.REVIEW_CAP}枚は明日に繰り越し・` : ''}記憶が消える前に育てましょう</span>
          </span>
          <span class="learn-cta-go">▶</span>
        </button>` : `
        <div class="learn-cta card done">
          <span class="learn-cta-icon">✅</span>
          <span class="learn-cta-body">
            <strong>今日の復習は完了!</strong>
            <span class="field-note">${counts.introduced ? '新しいカードを学びましょう' : '下のユニットから最初のカードを学びましょう'}</span>
          </span>
        </div>`}

      <div class="learn-stats card">
        <div class="learn-stat"><span class="val">${counts.introduced}<span class="sub">/${counts.total}</span></span><span class="lbl">学習中</span></div>
        <div class="learn-stat"><span class="val">🌸${counts.bloomed}${counts.mastered ? ` ⭐${counts.mastered}` : ''}</span><span class="lbl">育った${counts.mastered ? '/マスター' : ''}</span></div>
        <div class="learn-stat"><span class="val">${newRemain}</span><span class="lbl">今日の新規残り</span></div>
        <div class="learn-stat-btns">
          <button class="btn-control" id="btn-learn-dex">📔 図鑑</button>
          <button class="btn-control" id="btn-learn-check">✍️ 監修${ReviewFlags.counts(lang).fix ? `<span class="fix-badge">${ReviewFlags.counts(lang).fix}</span>` : ''}</button>
        </div>
      </div>

      ${!ttsOk && lang === 'yue' ? (() => {
        const rec = (typeof VoiceStore !== 'undefined') ? VoiceStore.countByLang('yue') : 0;
        return rec > 0
          ? `<p class="field-note" style="margin-bottom:10px">❤️ パートナーのお手本録音が${rec}枚あります。録音済みのカードは聞き取り問題が出せます(残りは✍️監修画面から吹き込み)。</p>`
          : `<p class="field-note tts-warn">🔇 この端末には広東語の読み上げ音声がありません。✍️監修画面でパートナーにお手本を吹き込んでもらうと、そのカードは音声つきで学べるようになります。</p>`;
      })() : ''}
      ${lang === 'yue' ? `
        <p class="field-note" style="margin-bottom:10px">📝 広東語フレーズはパートナー監修前のドラフトです。おかしな表現があったら教えてもらいましょう。</p>` : ''}

      <h3 class="about-section">${meta.flag} ユニット</h3>
      ${Phrases.units(lang).map((u) => {
        const p = SRS.unitProgress(u.id);
        const complete = p.bloomed === p.total;
        const pct = Math.round(p.introduced / p.total * 100);
        const bloomPct = Math.round(p.bloomed / p.total * 100);
        return `<button class="unit-row ${complete ? 'complete' : ''}" data-learn-unit="${u.id}">
          <span class="unit-icon">${u.icon}</span>
          <span class="unit-body">
            <span class="unit-title">${escapeHtml(u.title)} ${complete ? '🏅' : ''}</span>
            <span class="field-note">${escapeHtml(u.desc)}</span>
            <span class="unit-track">
              <span class="unit-fill" style="width:${pct}%"></span>
              <span class="unit-fill bloom" style="width:${bloomPct}%"></span>
            </span>
          </span>
          <span class="unit-count">${p.introduced}/${p.total}</span>
        </button>`;
      }).join('')}
    `;

    el.querySelectorAll('[data-learn-lang]').forEach((b) =>
      b.addEventListener('click', () => this.setLang(b.dataset.learnLang)));
    el.querySelectorAll('[data-nav]').forEach((b) =>
      b.addEventListener('click', () => showScreen(b.dataset.nav)));
    const rv = document.getElementById('btn-learn-review');
    if (rv) rv.addEventListener('click', () => this.startReview());
    const rt = document.getElementById('btn-open-route');
    if (rt) rt.addEventListener('click', () => {
      Route.setRoute(rt.dataset.route);
      showScreen('route');
    });
    document.getElementById('btn-learn-dex').addEventListener('click', () => showScreen('learn-dex'));
    document.getElementById('btn-learn-check').addEventListener('click', () => showScreen('learn-check'));
    el.querySelectorAll('[data-learn-unit]').forEach((b) =>
      b.addEventListener('click', () => this.startUnit(b.dataset.learnUnit)));
  },

  /* ----- セッション構築 ----- */
  startReview() {
    const due = SRS.dueCards(this.lang).slice(0, SRS.REVIEW_CAP);
    if (!due.length) return;
    this.queue = due.map((c) => ({ type: 'quiz', card: c }));
    this.beginSession('review', '📖 今日の復習');
  },

  async startUnit(unitId) {
    const u = Phrases.unit(unitId);
    const notFixed = (c) => ReviewFlags.get(c.id) !== 'fix';
    const fresh = u.cards.filter((c) => !SRS.isIntroduced(c.id)).filter(notFixed);
    const remain = SRS.newRemaining(u.lang);
    if (!u.cards.some((c) => !SRS.isIntroduced(c.id))) {
      // 全カード導入済み → このユニットだけ総復習(⚠️修正待ちは除外)
      const cards = u.cards.filter(notFixed);
      if (!cards.length) {
        await appAlert('このユニットのカードはすべて⚠️修正待ちです。監修画面でフラグを確認してください。', '⚠️ 修正待ち');
        return;
      }
      this.queue = cards.map((c) => ({
        type: 'quiz', card: Object.assign({ unitId: u.id, lang: u.lang }, c)
      }));
      this.beginSession('unit-review', `${u.icon} ${u.title}(総復習)`);
      return;
    }
    if (!fresh.length) {
      await appAlert(
        'このユニットの残りのカードは⚠️要修正フラグが付いているため、修正されるまで学習をスキップします。\n(監修画面でフラグを外すと再開できます)',
        '⚠️ 修正待ちのためスキップ');
      return;
    }
    if (remain <= 0) {
      const label = LEARN_LANGS[u.lang].label;
      await appAlert(
        `今日の${label}の新規カードはもう満タンです(言語ごとに1日${SRS.NEW_PER_DAY}枚まで)。\n` +
        'もう一方の言語の新規は別枠で学べます。欲張るより毎日続ける方が強くなります!',
        '🌱 今日はここまで');
      return;
    }
    const batch = fresh.slice(0, remain).map((c) =>
      Object.assign({ unitId: u.id, lang: u.lang }, c));
    // 導入 → すぐ確認クイズ の順で並べる
    this.queue = [];
    batch.forEach((c) => this.queue.push({ type: 'intro', card: c }));
    batch.forEach((c) => this.queue.push({ type: 'quiz', card: c }));
    this.beginSession('unit', `${u.icon} ${u.title}`);
  },

  beginSession(kind, title) {
    this.sessionKind = kind;
    this.idx = 0;
    this.correct = 0;
    this.answered = 0;
    this.firstTry = {};
    this.queue.forEach((q) => { this.firstTry[q.card.id] = true; });
    document.getElementById('learn-session-title').textContent = title;
    showScreen('learn-session');
    this.renderStep();
  },

  updateProgress() {
    document.getElementById('learn-progress').textContent =
      `${Math.min(this.idx + 1, this.queue.length)} / ${this.queue.length}`;
  },

  renderStep() {
    clearInterval(this.timerId);
    if (this.idx >= this.queue.length) { this.finishSession(); return; }
    this.updateProgress();
    const step = this.queue[this.idx];
    if (step.type === 'intro') this.renderIntro(step.card);
    else this.renderQuiz(step.card);
  },

  /* ----- 新カード紹介 ----- */
  renderIntro(card) {
    const meta = LEARN_LANGS[card.lang];
    SRS.introduce(card.id);
    document.getElementById('learn-stage').innerHTML = `
      <p class="field-note" style="text-align:center">🌱 新しいカード</p>
      <div class="phrase-card card">
        <p class="phrase-target">${escapeHtml(card.t)}</p>
        <p class="phrase-kana">${escapeHtml(card.k)}</p>
        <p class="phrase-roman">${meta.romanLabel}: ${escapeHtml(card.r)}</p>
        <p class="phrase-ja">${escapeHtml(card.ja)}</p>
        <div class="phrase-tts">
          <button class="tts-btn" id="btn-tts">🔊 聞く</button>
          <button class="tts-btn" id="btn-tts-slow">🐢 ゆっくり</button>
        </div>
        ${card.note ? `<p class="phrase-note">💡 ${escapeHtml(card.note)}</p>` : ''}
      </div>
      <button class="btn-large primary" id="btn-learn-next">覚えた!次へ</button>
    `;
    const play = (rate) => playCardAudio(card, rate);
    document.getElementById('btn-tts').addEventListener('click', () => play(0.9));
    document.getElementById('btn-tts-slow').addEventListener('click', () => play(0.6));
    document.getElementById('btn-learn-next').addEventListener('click', () => {
      this.idx++; this.renderStep();
    });
    if (canHearCard(card)) setTimeout(() => play(0.9), 350);
  },

  /* ----- 出題 ----- */
  quizMode(card) {
    const lv = (SRS.get(card.id) || { lv: 1 }).lv;
    if (lv >= 4) return 'recall';  // マスター済みは高速な想起で維持
    if (lv === 3) {
      // 🌸→⭐への昇格試験は「声に出して言う」。使えない環境では想起で維持
      return (typeof SpeakCheck !== 'undefined' && SpeakCheck.available()) ? 'speak' : 'recall';
    }
    if (lv === 2 && canHearCard(card)) return 'listen';
    return 'read';
  },

  /** 同じ言語のカードから誤答選択肢を3つ選ぶ */
  distractors(card, key) {
    const pool = Phrases.byLang(card.lang).filter((c) => c.id !== card.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const seen = new Set([card[key]]);
    const out = [];
    for (const c of pool) {
      if (out.length >= 3) break;
      if (seen.has(c[key])) continue;
      seen.add(c[key]);
      out.push(c);
    }
    return out;
  },

  renderQuiz(card, forceMode) {
    const mode = forceMode || this.quizMode(card);
    this.locked = false;
    if (mode === 'speak') { this.renderSpeakQuiz(card); return; }
    const stage = document.getElementById('learn-stage');
    const lv = (SRS.get(card.id) || { lv: 1 }).lv;

    let promptHtml, answerKey;
    if (mode === 'recall') {
      // 日本語 → 現地語(制限時間つき、会話の想起速度を鍛える)
      answerKey = 't';
      promptHtml = `
        <p class="quiz-kind">🌸 想起 — 1秒で口から出るように</p>
        <div class="quiz-prompt card"><p class="quiz-ja">${escapeHtml(card.ja)}</p>
        <p class="field-note">この意味の${LEARN_LANGS[card.lang].label}は?</p></div>
        <div class="timer-wrap"><div class="timer-bar" id="learn-timer"></div></div>`;
    } else if (mode === 'listen') {
      answerKey = 'ja';
      promptHtml = `
        <p class="quiz-kind">🌿 聞き取り</p>
        <div class="quiz-prompt card" style="text-align:center">
          <button class="tts-btn big" id="btn-quiz-tts">🔊 もう一度聞く</button>
          <p class="field-note">音声の意味は?</p>
        </div>`;
    } else {
      answerKey = 'ja';
      promptHtml = `
        <p class="quiz-kind">🌱 認識</p>
        <div class="quiz-prompt card" style="text-align:center">
          <p class="phrase-target">${escapeHtml(card.t)}</p>
          <p class="phrase-kana">${escapeHtml(card.k)}</p>
          <p class="field-note">この意味は?</p>
        </div>`;
    }

    const wrong = this.distractors(card, answerKey);
    const options = [{ v: card[answerKey], ok: true }]
      .concat(wrong.map((c) => ({ v: c[answerKey], ok: false })));
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    stage.innerHTML = promptHtml + `
      <div class="choices">
        ${options.map((o, i) => `
          <button class="choice-btn learn-choice" data-learn-choice="${i}">
            ${escapeHtml(o.v)}${answerKey === 't' ? `<span class="choice-kana">${escapeHtml((Phrases.byLang(card.lang).find((c) => c.t === o.v) || {}).k || '')}</span>` : ''}
          </button>`).join('')}
      </div>`;

    stage.querySelectorAll('[data-learn-choice]').forEach((btn) => {
      btn.addEventListener('click', () =>
        this.answer(card, mode, options[Number(btn.dataset.learnChoice)].ok, btn));
    });

    if (mode === 'listen') {
      const play = () => playCardAudio(card, 0.85);
      document.getElementById('btn-quiz-tts').addEventListener('click', play);
      setTimeout(play, 350);
    }
    if (mode === 'recall') this.startTimer(10, () => this.answer(card, mode, false, null));
  },

  /* ----- 発話クイズ(🌸→⭐の昇格試験) ----- */
  renderSpeakQuiz(card) {
    const stage = document.getElementById('learn-stage');
    stage.innerHTML = `
      <p class="quiz-kind">🎙️ 発話 — 声に出して言えたら ⭐マスター</p>
      <div class="quiz-prompt card" style="text-align:center">
        <p class="quiz-ja">${escapeHtml(card.ja)}</p>
        <p class="field-note">この意味の${LEARN_LANGS[card.lang].label}を、マイクに向かって言いましょう</p>
        <button class="tts-btn" id="btn-speak-hint">💡 ヒントを見る</button>
        <div id="speak-hint" class="hidden">
          <p class="phrase-target small">${escapeHtml(card.t)}</p>
          <p class="phrase-kana">${escapeHtml(card.k)}</p>
          <button class="tts-btn" id="btn-speak-listen">🔊 お手本を聞く</button>
        </div>
      </div>
      <button class="btn-large primary speak-rec-btn" id="btn-speak-rec">🎤 タップして話す</button>
      <button class="btn-large" id="btn-speak-text">✏️ 今日は文字で答える</button>
      <p class="field-note" id="speak-status" style="text-align:center"></p>
    `;

    document.getElementById('btn-speak-hint').addEventListener('click', () => {
      document.getElementById('speak-hint').classList.remove('hidden');
      document.getElementById('btn-speak-hint').style.display = 'none';
    });
    document.getElementById('btn-speak-listen').addEventListener('click', () =>
      playCardAudio(card, 0.85));
    document.getElementById('btn-speak-text').addEventListener('click', () => {
      MicRec.cancel();
      this.renderQuiz(card, 'recall');  // 文字回答(⭐にはならないが復習は進む)
    });

    const recBtn = document.getElementById('btn-speak-rec');
    const status = document.getElementById('speak-status');
    let autoT = null;

    const doJudge = async () => {
      clearTimeout(autoT);
      if (!MicRec.active || this.locked) return;
      this.locked = true;
      recBtn.disabled = true;
      recBtn.classList.remove('recording');
      recBtn.textContent = '🔎 判定中...';
      status.textContent = 'Whisperが聞き取っています…';
      const blob = await MicRec.stop();
      try {
        if (!blob || blob.size < 800) throw new Error('録音が短すぎました');
        const result = await SpeakCheck.judge(blob, card);
        this.finishSpeak(card, result);
      } catch (err) {
        this.locked = false;
        recBtn.disabled = false;
        recBtn.textContent = '🎤 もう一度話す';
        status.textContent = `⚠ ${err.message} — もう一度試すか、「文字で答える」を選んでください`;
      }
    };

    recBtn.addEventListener('click', async () => {
      if (this.locked) return;
      if (MicRec.active) { doJudge(); return; }
      try {
        await MicRec.start();
      } catch (err) {
        status.textContent = '⚠ マイクを使用できません: ' + err.message;
        return;
      }
      recBtn.classList.add('recording');
      recBtn.textContent = '🔴 録音中… タップで判定';
      status.textContent = '発音してください(最長6秒)';
      autoT = setTimeout(doJudge, 6000);
    });
  },

  finishSpeak(card, result) {
    const pass = result.stars >= 1;
    let mastered = false;
    if (this.firstTry[card.id]) {
      this.firstTry[card.id] = false;
      SRS.answer(card.id, pass);
      this.answered++;
      if (pass) this.correct++;
      if (pass && SRS.get(card.id).lv === 3) mastered = SRS.master(card.id);
    }
    if (!pass && !this.queue.slice(this.idx + 1).some((q) => q.card.id === card.id)) {
      this.queue.push({ type: 'quiz', card, retry: true });
    }
    const rec = SRS.get(card.id) || { lv: 3 };
    const starStr = '⭐'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
    const stage = document.getElementById('learn-stage');
    const fb = document.createElement('div');
    fb.className = `learn-fb ${pass ? 'good' : 'bad'}`;
    fb.innerHTML = `
      <p class="fb-verdict">${pass ? '⭕ 通じました!' : '❌ うまく聞き取れませんでした'}</p>
      <p class="speak-stars">${starStr}</p>
      ${result.text ? `<p class="field-note" style="text-align:center">聞こえた音: 「${escapeHtml(result.text)}」</p>` : ''}
      <div class="fb-card">
        <p class="phrase-target small">${escapeHtml(card.t)}</p>
        <p class="phrase-kana">${escapeHtml(card.k)} <span class="phrase-roman">(${escapeHtml(card.r)})</span></p>
        <p class="phrase-ja">${escapeHtml(card.ja)}</p>
        <button class="tts-btn" id="btn-fb-tts">🔊 お手本を聞く</button>
      </div>
      ${mastered ? '<p class="fb-levelup">🎉 このカードを ⭐発話マスター しました!本番で使えます!</p>' : ''}
      ${!pass ? '<p class="field-note" style="text-align:center">お手本を聞いてもう一度。判定は「通じるか」基準なので気楽に!</p>' : ''}
      <p class="field-note" style="text-align:center">現在 ${SRS.stageIcon(rec.lv)} ${SRS.stageName(rec.lv)}</p>
      <button class="btn-large primary" id="btn-learn-next">次へ</button>
    `;
    stage.appendChild(fb);
    stage.querySelectorAll('.speak-rec-btn, #btn-speak-text').forEach((b) => { b.disabled = true; });
    document.getElementById('btn-fb-tts').addEventListener('click', () => playCardAudio(card, 0.85));
    document.getElementById('btn-learn-next').addEventListener('click', () => {
      this.idx++; this.renderStep();
    });
    fb.scrollIntoView({ behavior: 'smooth', block: 'end' });
  },

  startTimer(limitSec, onTimeout) {
    clearInterval(this.timerId);
    this.turnStartedAt = Date.now();
    const bar = document.getElementById('learn-timer');
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
        if (!this.locked) onTimeout();
      }
    }, 100);
  },

  answer(card, mode, correct, btn) {
    if (this.locked) return;
    this.locked = true;
    clearInterval(this.timerId);

    // SRSには各カードの初回回答だけを反映(セッション内の再挑戦は練習扱い)
    let levelUp = null;
    if (this.firstTry[card.id]) {
      this.firstTry[card.id] = false;
      levelUp = SRS.answer(card.id, correct).levelUp;
      this.answered++;
      if (correct) this.correct++;
    }
    // 間違えたカードはセッション末尾でもう一度
    if (!correct && !this.queue.slice(this.idx + 1).some((q) => q.card.id === card.id)) {
      this.queue.push({ type: 'quiz', card, retry: true });
    }
    if (btn) btn.classList.add(correct ? 'correct' : 'wrong');
    this.renderFeedback(card, correct, levelUp);
  },

  renderFeedback(card, correct, levelUp) {
    const meta = LEARN_LANGS[card.lang];
    const rec = SRS.get(card.id) || { lv: 1 };
    const stage = document.getElementById('learn-stage');
    const fb = document.createElement('div');
    fb.className = `learn-fb ${correct ? 'good' : 'bad'}`;
    fb.innerHTML = `
      <p class="fb-verdict">${correct ? '⭕ 正解!' : '❌ 残念…このカードは後でもう一度'}</p>
      <div class="fb-card">
        <p class="phrase-target small">${escapeHtml(card.t)}</p>
        <p class="phrase-kana">${escapeHtml(card.k)} <span class="phrase-roman">(${escapeHtml(card.r)})</span></p>
        <p class="phrase-ja">${escapeHtml(card.ja)}</p>
        <button class="tts-btn" id="btn-fb-tts">🔊 聞く</button>
        ${card.note ? `<p class="phrase-note">💡 ${escapeHtml(card.note)}</p>` : ''}
      </div>
      ${levelUp ? `<p class="fb-levelup">✨ このカードが ${SRS.stageIcon(levelUp)} ${SRS.stageName(levelUp)} に成長しました!</p>` : ''}
      <p class="field-note" style="text-align:center">現在 ${SRS.stageIcon(rec.lv)} ${SRS.stageName(rec.lv)}</p>
      <button class="btn-large primary" id="btn-learn-next">次へ</button>
    `;
    stage.appendChild(fb);
    // 選択肢は押せないように
    stage.querySelectorAll('.learn-choice').forEach((b) => { b.disabled = true; });
    document.getElementById('btn-fb-tts').addEventListener('click', () =>
      playCardAudio(card, 0.85));
    document.getElementById('btn-learn-next').addEventListener('click', () => {
      this.idx++; this.renderStep();
    });
    fb.scrollIntoView({ behavior: 'smooth', block: 'end' });
  },

  /* ----- セッション終了 ----- */
  finishSession() {
    const total = this.answered;
    const perfect = total > 0 && this.correct === total;
    const earned = this.correct * 2 + (perfect ? 5 : 0) + (this.sessionKind === 'unit' ? 5 : 0);
    if (typeof Gami !== 'undefined' && earned) Gami.addPoints(earned);
    if (typeof Quests !== 'undefined') Quests.tryComplete('study');
    SRS.checkCollectAchievements();

    const counts = SRS.counts(this.lang);
    const due = SRS.dueCards(this.lang).length;
    document.getElementById('learn-stage').innerHTML = `
      <div class="convo-result">
        <div class="learn-result-icon">${perfect ? '🎉' : '📖'}</div>
        <h3>${perfect ? 'パーフェクト!' : 'セッション完了!'}</h3>
        <p class="field-note">正解 ${this.correct} / ${total}${total === 0 ? '(新カードの学習)' : ''}</p>
        <div class="xp-gains">
          <span class="xp-chip points">⭐ +${earned} pt</span>
          <span class="xp-chip">🌸 育った ${counts.bloomed}/${counts.total}</span>
        </div>
        ${due > 0
          ? `<p class="field-note" style="margin-top:10px">📖 復習が残り${Math.min(due, SRS.REVIEW_CAP)}枚あります</p>`
          : '<p class="field-note" style="margin-top:10px">✅ 今日の復習はすべて完了!</p>'}
      </div>
      <div class="results-actions">
        ${due > 0 ? '<button class="btn-large primary" id="btn-learn-more">📖 続けて復習する</button>' : ''}
        <button class="btn-large ${due > 0 ? '' : 'primary'}" data-nav="learn">ユニット一覧へ</button>
        <button class="btn-large" data-nav="home">ホームへ</button>
      </div>`;

    const more = document.getElementById('btn-learn-more');
    if (more) more.addEventListener('click', () => this.startReview());
    document.querySelectorAll('#learn-stage [data-nav]').forEach((btn) =>
      btn.addEventListener('click', () => showScreen(btn.dataset.nav)));
  },

  /* ----- 監修モード(ネイティブに見せてチェックしてもらう画面) ----- */
  renderCheck() {
    const lang = this.lang;
    const meta = LEARN_LANGS[lang];
    const cnt = ReviewFlags.counts(lang);
    const el = document.getElementById('learn-check-content');
    el.innerHTML = `
      <div class="learn-tabs">
        ${Object.entries(LEARN_LANGS).map(([k, m]) => `
          <button class="learn-tab ${k === lang ? 'active' : ''}" data-check-lang="${k}">
            ${m.flag} ${m.label}
          </button>`).join('')}
      </div>
      <div class="card check-intro">
        <p><strong>${meta.flag} ${meta.label}の全${Phrases.byLang(lang).length}フレーズを、学習状況に関係なく表示しています。</strong></p>
        <p class="field-note" style="margin-top:6px">ネイティブの方へ: フレーズ・カタカナ・解説を見て、左のマークをタップしてください。
        タップするたびに <strong>未確認 → ✅ 自然でOK → ⚠️ 要修正</strong> と切り替わります。
        ⚠️を付けると<strong>メモの入力欄</strong>が開くので、どこがおかしいか一言残してください(あとからメモをタップして書き直せます)。
        ⚠️のカードは修正されるまで学習(新規・復習・クイズ)から自動的に外れます。🔊で読み上げも確認できます。</p>
        ${(typeof MediaRecorder !== 'undefined' && typeof VoiceStore !== 'undefined' && VoiceStore.supported()) ? `
        <p class="field-note" style="margin-top:6px">🎤 さらに、<strong>お手本の声を吹き込めます</strong>。🎤をタップ→フレーズを発音→■で保存。
        録音があるカードは、学習中の再生と聞き取り問題に合成音声の代わりにその声が使われます。</p>` : ''}
      </div>
      <div class="check-summary card">
        <span>✅ ${cnt.ok}</span><span>⚠️ ${cnt.fix}</span><span>未確認 ${cnt.none}</span>
      </div>
      <div class="check-export">
        <button class="btn-control" id="btn-check-share">📤 結果を共有</button>
        <button class="btn-control" id="btn-check-copy">📋 コピー</button>
        <button class="btn-control" id="btn-check-dl">⬇ 保存</button>
      </div>
      <p class="field-note" id="check-export-status" style="text-align:center;margin-bottom:12px"></p>
      ${Phrases.units(lang).map((u) => `
        <h3 class="about-section">${u.icon} ${escapeHtml(u.title)}</h3>
        ${u.cards.map((c) => {
          const f = ReviewFlags.get(c.id);
          return `<div class="check-row ${f}">
            <button class="check-flag" data-check-flag="${c.id}" aria-label="チェック切替">
              ${f === 'ok' ? '✅' : (f === 'fix' ? '⚠️' : '◻️')}
            </button>
            <div class="check-body">
              <p class="check-t">${escapeHtml(c.t)}</p>
              <p class="check-k">${escapeHtml(c.k)} <span class="phrase-roman">(${escapeHtml(c.r)})</span></p>
              <p class="check-ja">${escapeHtml(c.ja)}</p>
              ${c.note ? `<p class="check-note">💡 ${escapeHtml(c.note)}</p>` : ''}
              ${f === 'fix' ? `<p class="check-memo" data-check-memo="${c.id}">📝 ${ReviewFlags.note(c.id) ? escapeHtml(ReviewFlags.note(c.id)) : 'メモなし(タップで追加)'}</p>` : ''}
            </div>
            <div class="check-audio">
              <button class="tts-btn" data-check-tts="${c.id}">🔊</button>
              ${(typeof MediaRecorder !== 'undefined' && typeof VoiceStore !== 'undefined' && VoiceStore.supported()) ? `
                ${VoiceStore.has(c.id) ? `
                  <button class="tts-btn voice-play" data-check-play="${c.id}">▶ 声</button>
                  <button class="tts-btn voice-del" data-check-del="${c.id}">🗑</button>` : ''}
                <button class="tts-btn" data-check-rec="${c.id}">🎤</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      `).join('')}
    `;

    el.querySelectorAll('[data-check-lang]').forEach((b) =>
      b.addEventListener('click', () => {
        this.lang = b.dataset.checkLang;
        localStorage.setItem('lq_learn_lang', this.lang);
        this.renderCheck();
      }));
    document.getElementById('btn-check-share').addEventListener('click', () => this.exportCheck('share'));
    document.getElementById('btn-check-copy').addEventListener('click', () => this.exportCheck('copy'));
    document.getElementById('btn-check-dl').addEventListener('click', () => this.exportCheck('dl'));
    /* ⚠️メモの表示を行内で更新し、タップで編集できるようにする */
    const editMemo = async (id, memoEl) => {
      const c = Phrases.byId(id);
      const text = await appPrompt(
        '📝 要修正メモ',
        `「${c.t}」のどこを直せばいいですか?`,
        ReviewFlags.note(id),
        '例: 発音表記が違う / こうは言わない / もっと自然な言い方は◯◯');
      if (text === null) return;  // スキップ
      ReviewFlags.setNote(id, text);
      if (memoEl) memoEl.textContent = '📝 ' + (text || 'メモなし(タップで追加)');
    };
    const bindMemo = (memoEl) =>
      memoEl.addEventListener('click', () => editMemo(memoEl.dataset.checkMemo, memoEl));
    el.querySelectorAll('[data-check-memo]').forEach(bindMemo);

    el.querySelectorAll('[data-check-flag]').forEach((b) =>
      b.addEventListener('click', async () => {
        const id = b.dataset.checkFlag;
        const next = ReviewFlags.cycle(id);
        b.textContent = next === 'ok' ? '✅' : (next === 'fix' ? '⚠️' : '◻️');
        const row = b.closest('.check-row');
        row.className = `check-row ${next}`;
        const c2 = ReviewFlags.counts(lang);
        el.querySelector('.check-summary').innerHTML =
          `<span>✅ ${c2.ok}</span><span>⚠️ ${c2.fix}</span><span>未確認 ${c2.none}</span>`;
        // メモ表示の追加/削除
        let memoEl = row.querySelector('.check-memo');
        if (next === 'fix') {
          if (!memoEl) {
            memoEl = document.createElement('p');
            memoEl.className = 'check-memo';
            memoEl.dataset.checkMemo = id;
            row.querySelector('.check-body').appendChild(memoEl);
            bindMemo(memoEl);
          }
          memoEl.textContent = '📝 メモなし(タップで追加)';
          await editMemo(id, memoEl);  // ⚠️を付けた直後にメモ入力を促す
        } else if (memoEl) {
          memoEl.remove();
        }
      }));
    el.querySelectorAll('[data-check-tts]').forEach((b) =>
      b.addEventListener('click', () => {
        const c = Phrases.byId(b.dataset.checkTts);
        Speech.speak(c.t, c.lang, 0.85);
      }));
    el.querySelectorAll('[data-check-play]').forEach((b) =>
      b.addEventListener('click', () => VoiceStore.play(b.dataset.checkPlay)));
    el.querySelectorAll('[data-check-del]').forEach((b) =>
      b.addEventListener('click', async () => {
        const c = Phrases.byId(b.dataset.checkDel);
        const go = await appConfirm(
          `「${c.t}」のお手本録音を削除しますか?\n(削除後は🎤で録り直せます)`,
          '🗑 録音を削除');
        if (!go) return;
        await VoiceStore.remove(c.id);
        showToast('録音を削除しました');
        this.renderCheck();
      }));

    // お手本の吹き込み: 🎤タップで録音開始 → ■タップで保存
    let recId = null;
    el.querySelectorAll('[data-check-rec]').forEach((b) =>
      b.addEventListener('click', async () => {
        const id = b.dataset.checkRec;
        if (MicRec.active && recId === id) {
          const blob = await MicRec.stop();
          recId = null;
          if (blob && blob.size > 500) {
            await VoiceStore.put(id, blob);
            if (typeof Achievements !== 'undefined') Achievements.unlock('lang-voice');
            showToast('❤️ お手本の声を保存しました');
          } else {
            showToast('録音が短すぎたため保存しませんでした');
          }
          this.renderCheck();
          return;
        }
        if (MicRec.active) { showToast('別のカードを録音中です'); return; }
        try {
          await MicRec.start();
        } catch (err) {
          appAlert('マイクを使用できませんでした: ' + err.message, '🎤 録音');
          return;
        }
        recId = id;
        b.classList.add('recording');
        b.textContent = '■ 保存';
      }));
  },

  /* ----- 監修結果のレポート生成と書き出し ----- */
  reviewReport() {
    const stamp = localDayKey();
    let out = `# ConfQuest フレーズ監修結果 (${stamp})\n`;
    for (const lang of ['yue', 'ko']) {
      const meta = LEARN_LANGS[lang];
      const cnt = ReviewFlags.counts(lang);
      if (cnt.ok + cnt.fix === 0) continue;  // 未着手の言語は省略
      out += `\n## ${meta.flag} ${meta.label} (✅${cnt.ok} / ⚠️${cnt.fix} / 未確認${cnt.none})\n`;
      const fixes = [];
      const oks = [];
      Phrases.units(lang).forEach((u) => u.cards.forEach((c) => {
        const f = ReviewFlags.get(c.id);
        if (f === 'fix') fixes.push(c);
        else if (f === 'ok') oks.push(c);
      }));
      if (fixes.length) {
        out += `\n### ⚠️ 要修正 (${fixes.length}件)\n`;
        fixes.forEach((c) => {
          out += `- [${c.id}] ${c.t}(${c.k} / ${c.r})— ${c.ja}\n`;
          const memo = ReviewFlags.note(c.id);
          out += `  📝 ${memo || '(メモなし)'}\n`;
        });
      }
      if (oks.length) {
        out += `\n### ✅ OK (${oks.length}件)\n${oks.map((c) => c.t).join('、')}\n`;
      }
    }
    out += '\n---\nこのレポートをそのままClaudeに貼り付ければ、phrases.jsの修正に使えます。\n';
    return out;
  },

  async exportCheck(mode) {
    const status = document.getElementById('check-export-status');
    const text = this.reviewReport();
    try {
      if (mode === 'share') {
        if (navigator.share) {
          await navigator.share({ title: 'ConfQuest フレーズ監修結果', text });
          status.textContent = '✓ 共有しました';
        } else {
          await navigator.clipboard.writeText(text);
          status.textContent = 'この環境に共有機能が無いため、クリップボードにコピーしました';
        }
      } else if (mode === 'copy') {
        await navigator.clipboard.writeText(text);
        status.textContent = '✓ クリップボードにコピーしました';
      } else {
        const blob = new Blob([text], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `confquest-review-${localDayKey()}.md`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        status.textContent = '✓ ダウンロードフォルダに保存しました';
      }
    } catch (err) {
      if (err && err.name === 'AbortError') { status.textContent = '共有をキャンセルしました'; return; }
      status.textContent = '⚠ ' + (err.message || err);
    }
  },

  /* ----- 学会攻略のお宝クイズ用の問題生成(SRSと共有) ----- */
  runQuizQuestion() {
    const introduced = Phrases.all().filter((c) => SRS.isIntroduced(c.id))
      .filter((c) => ReviewFlags.get(c.id) !== 'fix');
    if (introduced.length < 4) return null;
    const due = SRS.dueCards();
    const pool = due.length ? due.slice(0, 8) : introduced;
    const card = pool[Math.floor(Math.random() * pool.length)];
    const wrong = this.distractors(card, 'ja');
    if (wrong.length < 3) return null;
    return {
      lang: LEARN_LANGS[card.lang].label,
      cardId: card.id,
      q: `「${card.t}(${card.k})」の意味は?`,
      choices: [card.ja, ...wrong.map((c) => c.ja)],
      correct: 0,
      note: `${card.ja}。${card.note || ''} 回答はLanguage Questの復習にも記録されます。`
    };
  },

  /* ----- フレーズ図鑑 ----- */
  renderDex() {
    const lang = this.lang;
    const counts = SRS.counts(lang);
    const el = document.getElementById('learn-dex-content');
    el.innerHTML = `
      <div class="learn-tabs">
        ${Object.entries(LEARN_LANGS).map(([k, m]) => `
          <button class="learn-tab ${k === lang ? 'active' : ''}" data-dex-lang="${k}">
            ${m.flag} ${m.label}
          </button>`).join('')}
      </div>
      <p class="field-note" style="margin-bottom:12px">
        🌱認識 → 🌿聞き取り → 🌸想起 と正解を重ねるとカードが育ちます(⭐発話はPhase 2で解放)。
        現在 🌸${counts.bloomed} / ${counts.total}枚。
      </p>
      ${Phrases.units(lang).map((u) => {
        const p = SRS.unitProgress(u.id);
        return `
        <h3 class="about-section">${u.icon} ${escapeHtml(u.title)} <span class="dex-count">${p.bloomed}🌸/${p.total}</span></h3>
        <div class="dex-list">
          ${u.cards.map((c) => {
            const r = SRS.get(c.id);
            const fix = ReviewFlags.get(c.id) === 'fix';
            return `<button class="dex-phrase ${r ? (r.lv >= 3 ? 'bloomed' : 'growing') : 'locked'} ${fix ? 'fixwait' : ''}" data-dex-card="${c.id}">
              <span class="dex-stage">${fix ? '⚠️' : (r ? SRS.stageIcon(r.lv) : '🔒')}</span>
              <span class="dex-t">${escapeHtml(c.t)}</span>
              <span class="dex-ja">${fix ? '修正待ち' : (r ? escapeHtml(c.ja) : '???')}</span>
            </button>`;
          }).join('')}
        </div>`;
      }).join('')}
    `;
    el.querySelectorAll('[data-dex-lang]').forEach((b) =>
      b.addEventListener('click', () => {
        this.lang = b.dataset.dexLang;
        localStorage.setItem('lq_learn_lang', this.lang);
        this.renderDex();
      }));
    el.querySelectorAll('[data-dex-card]').forEach((b) =>
      b.addEventListener('click', () => {
        const c = Phrases.byId(b.dataset.dexCard);
        const r = SRS.get(c.id);
        if (!r) {
          appAlert('まだ学習していないカードです。ユニットから学ぶと図鑑に記録されます。', '🔒 未習得');
          return;
        }
        playCardAudio(c, 0.85);
        const memo = ReviewFlags.get(c.id) === 'fix'
          ? `\n\n⚠️ 監修メモ: ${ReviewFlags.note(c.id) || '(メモなし)'}` : '';
        appAlert(
          `${c.k}(${c.r})\n${c.ja}\n\n${c.note || ''}${memo}\n\n` +
          `育成段階: ${SRS.stageIcon(r.lv)} ${SRS.stageName(r.lv)} ・ 正解 ${r.ok}/${r.n}回\n次の復習: ${r.due}`,
          `${c.t}`);
      }));
  }
};
