/* ConfQuest - 進捗システム
 * ジェム(💎) / 日別ポイントログ / ログイン記録 / デイリークエスト / 実績
 * Gami(ポイント・ストリーク)は app.js。ここは長期の継続を支える層。
 */
'use strict';

function localDayKey(d) {
  const x = d ? new Date(d) : new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/* ---------- ジェム ---------- */
const Gems = {
  get() { return parseInt(localStorage.getItem('lq_gems') || '0', 10); },
  add(n, reason) {
    if (!n) return;
    const v = this.get() + n;
    localStorage.setItem('lq_gems', String(v));
    if (typeof showToast === 'function' && reason) showToast(`💎 +${n} (${reason})`);
    if (v >= 100 && typeof Achievements !== 'undefined') Achievements.unlock('gem-100');
    const badge = document.getElementById('gems-badge');
    if (badge) badge.textContent = `💎 ${v}`;
  },
  spend(n) {
    if (this.get() < n) return false;
    localStorage.setItem('lq_gems', String(this.get() - n));
    return true;
  }
};

/* ---------- 日別ポイントログ(週間グラフ用) ---------- */
const PointsLog = {
  data() { return JSON.parse(localStorage.getItem('lq_points_log') || '{}'); },
  add(n, now) {
    if (!n || n <= 0) return;
    const d = this.data();
    const k = localDayKey(now);
    d[k] = (d[k] || 0) + n;
    // 30日より古い記録は捨てる
    const keys = Object.keys(d).sort();
    while (keys.length > 30) delete d[keys.shift()];
    localStorage.setItem('lq_points_log', JSON.stringify(d));
  },
  /** 直近7日分 [{label, key, pts, isToday}] */
  week(now) {
    const d = this.data();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const out = [];
    const base = now ? new Date(now) : new Date();
    for (let i = 6; i >= 0; i--) {
      const t = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i);
      const k = localDayKey(t);
      out.push({ label: days[t.getDay()], key: k, pts: d[k] || 0, isToday: i === 0 });
    }
    return out;
  }
};

/* ---------- ログイン記録 ---------- */
const Login = {
  data() {
    return JSON.parse(localStorage.getItem('lq_login') ||
      '{"lastDay":"","streak":0,"total":0}');
  },
  save(d) { localStorage.setItem('lq_login', JSON.stringify(d)); },
  /** 起動時に呼ぶ。日が変わっていればストリーク更新 */
  record(now) {
    const d = this.data();
    const today = localDayKey(now);
    if (d.lastDay !== today) {
      const y = new Date(now ? new Date(now) : new Date());
      y.setDate(y.getDate() - 1);
      d.streak = (d.lastDay === localDayKey(y)) ? d.streak + 1 : 1;
      d.lastDay = today;
      d.total = (d.total || 0) + 1;
      this.save(d);
      if (typeof Achievements !== 'undefined') {
        Achievements.unlock('first-login');
        if (d.streak >= 3) Achievements.unlock('login-3');
        if (d.streak >= 7) Achievements.unlock('login-7');
        if (d.streak >= 30) Achievements.unlock('login-30');
      }
    }
    return d;
  }
};

/* ---------- デイリークエスト ---------- */
const QUEST_DEFS = [
  { id: 'morning', icon: '🌅', name: '朝活', desc: '朝7時〜12時にアプリを開く', pt: 10, gems: 2 },
  { id: 'evening', icon: '🌆', name: '夜活', desc: '夜19時以降にアプリを開く', pt: 10, gems: 2 },
  { id: 'spend',   icon: '💸', name: '投資家', desc: '学会攻略のお店で💰50以上使う', pt: 15, gems: 3,
    nav: 'run', navLabel: '🗺️ 学会攻略へ' },
  { id: 'play',    icon: '🗺️', name: '学会へ行こう', desc: '学会攻略で会話を1回終える', pt: 15, gems: 3,
    nav: 'run', navLabel: '🗺️ 学会攻略へ' },
  { id: 'study',   icon: '📖', name: 'ことばの習慣', desc: 'Language Questで復習か新カードを1セッション終える', pt: 15, gems: 3,
    nav: 'learn', navLabel: '🇰🇷 Language Questへ' }
];

/** 変動クエストの抽選対象アイテム(入手しやすいものだけ: お店・売店・お宝・イベントで手に入る) */
const QUEST_ITEM_POOL = ['shirt', 'earphone', 'cardcase', 'coupon', 'charm',
                         'coffee', 'energy', 'invite', 'armband'];
const QUEST_ALL_BONUS_GEMS = 5;

const Quests = {
  data(now) {
    let d;
    try { d = JSON.parse(localStorage.getItem('lq_quests') || 'null'); } catch (_) { d = null; }
    const today = localDayKey(now);
    if (!d || d.date !== today) {
      d = { date: today, done: {}, ready: {}, spent: 0, vary: this.rollVary(today) };
      localStorage.setItem('lq_quests', JSON.stringify(d));
    }
    if (!d.ready) d.ready = {};  // v1.5.0以前のデータへの移行
    if (!d.vary) {               // v1.18.0以前に作られた当日データへの補完
      d.vary = this.rollVary(today);
      localStorage.setItem('lq_quests', JSON.stringify(d));
    }
    return d;
  },

  /** 日替わり変動クエストの抽選(日付から決定的: 同じ日は必ず同じお題) */
  rollVary(dayKey) {
    let seed = 0;
    for (const ch of String(dayKey)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const next = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed; };
    const vary = {};
    if (typeof TOPIC_DECK !== 'undefined' && TOPIC_DECK.length) {
      const pool = TOPIC_DECK.filter((c) => !c.caution);
      vary.topic = pool[next() % pool.length].id;
    }
    vary.item = QUEST_ITEM_POOL[next() % QUEST_ITEM_POOL.length];
    return vary;
  },

  /** 今日の全クエスト定義(固定+変動) */
  defs(now) {
    const d = this.data(now);
    const out = QUEST_DEFS.slice();
    const v = d.vary || {};
    if (v.topic && typeof TOPIC_DECK !== 'undefined') {
      const c = TOPIC_DECK.find((x) => x.id === v.topic);
      if (c) {
        out.push({ id: 'topic-read', icon: '🚗', name: 'ネタを仕込む',
          desc: `雑談ネタ「${c.icon} ${c.title}」を開いて読む`, pt: 10, gems: 2,
          nav: 'topic', navLabel: '📖 このネタを開く' });
      }
    }
    if (v.item && typeof RUN_ITEMS !== 'undefined' && RUN_ITEMS[v.item]) {
      const it = RUN_ITEMS[v.item];
      out.push({ id: 'item-get', icon: it.icon, name: '掘り出し物',
        desc: `学会攻略で「${it.name}」を入手する(お店・お宝・イベントなど)`, pt: 15, gems: 3,
        nav: 'run', navLabel: '🗺️ 学会攻略へ' });
    }
    return out;
  },
  save(d) { localStorage.setItem('lq_quests', JSON.stringify(d)); },

  doneCount(now) {
    const d = this.data(now);
    return this.defs(now).filter((q) => d.done[q.id]).length;
  },
  readyCount(now) {
    const d = this.data(now);
    return this.defs(now).filter((q) => d.ready[q.id] && !d.done[q.id]).length;
  },

  /** ホーム画面のクエストカード表示を更新 */
  refreshHomeCard(now) {
    const card = document.getElementById('daily-quest-summary');
    if (!card) return;
    const ready = this.readyCount(now);
    card.textContent = ready > 0
      ? `🎁 ${ready}件 受け取れます!`
      : `${this.doneCount(now)}/${this.defs(now).length} 達成`;
    const btn = card.closest('.quest-card');
    if (btn) btn.classList.toggle('has-ready', ready > 0);
  },

  /** 条件を満たしたクエストを「受け取り待ち」にする(報酬はまだ渡さない) */
  tryComplete(id, now) {
    const d = this.data(now);
    if (d.done[id] || d.ready[id]) return false;
    const def = this.defs(now).find((q) => q.id === id);
    if (!def) return false;
    d.ready[id] = new Date().toISOString();
    this.save(d);
    if (typeof showToast === 'function') {
      showToast(`${def.icon} クエスト達成! 「今日のクエスト」で🎁報酬を受け取れます`);
    }
    this.refreshHomeCard(now);
    return true;
  },

  /** 受け取り待ちのクエストをタップで受け取る。付与した定義を返す(不可ならnull) */
  claim(id, now) {
    const d = this.data(now);
    if (!d.ready[id] || d.done[id]) return null;
    const def = this.defs(now).find((q) => q.id === id);
    if (!def) return null;
    delete d.ready[id];
    d.done[id] = new Date().toISOString();
    this.save(d);
    if (typeof Gami !== 'undefined') Gami.addPoints(def.pt);
    Gems.add(def.gems);
    this.refreshHomeCard(now);
    return def;
  },

  /** 全達成ボーナスの状態: 'locked' | 'ready' | 'claimed' */
  bonusState(now) {
    const d = this.data(now);
    if (d.bonus) return 'claimed';
    return this.defs(now).every((q) => d.done[q.id]) ? 'ready' : 'locked';
  },
  claimBonus(now) {
    if (this.bonusState(now) !== 'ready') return false;
    const d = this.data(now);
    d.bonus = new Date().toISOString();
    this.save(d);
    Gems.add(QUEST_ALL_BONUS_GEMS);
    if (typeof Achievements !== 'undefined') Achievements.unlock('quest-all');
    return true;
  },

  /** ログイン時刻に応じた朝/夜クエスト判定 */
  onLogin(now) {
    const h = (now ? new Date(now) : new Date()).getHours();
    if (h >= 7 && h < 12) this.tryComplete('morning', now);
    if (h >= 19) this.tryComplete('evening', now);
  },

  /** 学会攻略のお店での消費を累積 */
  addSpend(amount, now) {
    const d = this.data(now);
    if (d.done.spend) return;
    d.spent = (d.spent || 0) + amount;
    this.save(d);
    if (d.spent >= 50) this.tryComplete('spend', now);
  }
};

/* ---------- 1日の回数と報酬倍率 ----------
 * 「やりすぎを止める」のではなく「毎日やる方が得」にする設計。
 * 何回でも遊べるが、その日の1回目が最も報酬が高い。
 */
const DailyBonus = {
  data(now) {
    let d;
    try { d = JSON.parse(localStorage.getItem('lq_daily_plays') || 'null'); } catch (_) { d = null; }
    const today = localDayKey(now);
    if (!d || d.date !== today) {
      d = { date: today, counts: {} };
      localStorage.setItem('lq_daily_plays', JSON.stringify(d));
    }
    return d;
  },
  /** activity の今日の実施回数 */
  count(activity, now) { return this.data(now).counts[activity] || 0; },
  /** これから行う回の倍率(1回目1.5倍 / 2回目1.0倍 / 3回目以降0.7倍) */
  nextMultiplier(activity, now) {
    const n = this.count(activity, now);
    if (n === 0) return 1.5;
    if (n === 1) return 1.0;
    return 0.7;
  },
  multiplierLabel(activity, now) {
    const m = this.nextMultiplier(activity, now);
    if (m > 1) return '🌟 本日初回 報酬1.5倍';
    if (m === 1) return '報酬 通常';
    return '報酬 0.7倍(今日はもう十分がんばりました)';
  },
  /** 実施を記録して、その回の倍率を返す */
  record(activity, now) {
    const d = this.data(now);
    const mult = this.nextMultiplier(activity, now);
    d.counts[activity] = (d.counts[activity] || 0) + 1;
    localStorage.setItem('lq_daily_plays', JSON.stringify(d));
    return mult;
  }
};

/* ---------- ジェムショップ(ランを有利に始める) ---------- */
const GEM_SHOP = [
  { id: 'start-earphone', icon: '🎧', name: '翻訳イヤホン持参', cost: 20,
    desc: '次のランを 🎧翻訳イヤホン を持った状態で始める',
    effect: { startItem: 'earphone' } },
  { id: 'start-shirt', icon: '👔', name: 'きちんとした身なり', cost: 20,
    desc: '次のランを 👔アイロンがけしたシャツ を持った状態で始める',
    effect: { startItem: 'shirt' } },
  { id: 'start-charm', icon: '🧿', name: 'お守りを持つ', cost: 30,
    desc: '次のランを 🧿お守り を持った状態で始める(1度だけ復活)',
    effect: { startItem: 'charm' } },
  { id: 'start-funds', icon: '💰', name: '追加の研究費', cost: 15,
    desc: '次のランの開始時研究費 +50',
    effect: { funds: 50 } },
  { id: 'start-hp', icon: '💪', name: '万全の体調', cost: 25,
    desc: '次のランの🧠上限とHPを +15',
    effect: { maxHp: 15 } }
];

const GemShop = {
  /** 次のランに適用される購入済み特典 */
  pending() {
    try { return JSON.parse(localStorage.getItem('lq_gem_pending') || '[]'); }
    catch (_) { return []; }
  },
  savePending(list) { localStorage.setItem('lq_gem_pending', JSON.stringify(list)); },
  has(id) { return this.pending().includes(id); },
  buy(id) {
    const item = GEM_SHOP.find((g) => g.id === id);
    if (!item || this.has(id)) return false;
    if (!Gems.spend(item.cost)) return false;
    const list = this.pending();
    list.push(id);
    this.savePending(list);
    return true;
  },
  /** ラン開始時に適用して消費する。{items, funds, maxHp} を返す */
  consume() {
    const list = this.pending();
    const out = { items: [], funds: 0, maxHp: 0 };
    for (const id of list) {
      const item = GEM_SHOP.find((g) => g.id === id);
      if (!item) continue;
      if (item.effect.startItem) out.items.push(item.effect.startItem);
      if (item.effect.funds) out.funds += item.effect.funds;
      if (item.effect.maxHp) out.maxHp += item.effect.maxHp;
    }
    this.savePending([]);
    return out;
  }
};

/* ---------- アイテム図鑑(取得したことのあるアイテムの記録) ---------- */
const ItemDex = {
  data() { return JSON.parse(localStorage.getItem('lq_itemdex') || '{}'); },
  has(id) { return !!this.data()[id]; },
  count() { return Object.keys(this.data()).length; },
  /** アイテム入手時に呼ぶ。初取得ならtrue */
  record(id) {
    const d = this.data();
    if (d[id]) return false;
    d[id] = new Date().toISOString();
    localStorage.setItem('lq_itemdex', JSON.stringify(d));
    return true;
  },
  recordAll(ids) { (ids || []).forEach((id) => this.record(id)); }
};

/* ---------- 実績 ---------- */
const ACHIEVEMENT_DEFS = [
  { id: 'first-login',    icon: '🎉', name: 'はじめの一歩', desc: '初めてアプリを起動した' },
  { id: 'login-3',        icon: '🔥', name: '三日坊主卒業', desc: '3日連続でアプリを起動した' },
  { id: 'login-7',        icon: '📅', name: '一週間の習慣', desc: '7日連続でアプリを起動した' },
  { id: 'login-30',       icon: '🏛️', name: '継続は力なり', desc: '30日連続でアプリを起動した' },
  { id: 'first-practice', icon: '🎤', name: '初舞台', desc: '発表練習を1回完了した' },
  { id: 'first-talk',     icon: '📚', name: '聴講レポーター', desc: '講演の要約を1回作成した' },
  { id: 'convo-s',        icon: '💬', name: '社交の達人', desc: '会話トレーニングでSランクを取った' },
  { id: 'run-clear',      icon: '🎓', name: '学会制覇', desc: '学会攻略を3日間完走した' },
  { id: 'boss-perfect',   icon: '👑', name: '完璧な受け答え', desc: 'ボス戦を全ターンベスト選択で制した' },
  { id: 'gameover',       icon: '💤', name: 'それも経験', desc: 'ゲームオーバーになった(失敗から学ぼう)' },
  { id: 'slot-jackpot',   icon: '🎰', name: '大当たり', desc: 'スロットで3つ揃えた' },
  { id: 'quest-all',      icon: '📋', name: '完全稼働', desc: 'デイリークエストを1日で全て達成した' },
  { id: 'gem-100',        icon: '💎', name: 'コレクター', desc: 'ジェムを100個集めた' },
  { id: 'relic-collector', icon: '✨', name: '思い出の品', desc: 'レリックを2つ以上持って学会を制覇した' },
  { id: 'dex-complete',   icon: '📖', name: '収集家', desc: 'すべてのアイテムを1度は手に入れた' },
  { id: 'give-up',        icon: '🏳️', name: '撤退も戦術', desc: '学会攻略を途中で切り上げた' },
  { id: 'lang-first',     icon: '🌱', name: 'ことばの種', desc: 'Language Questで最初のカードを学んだ' },
  { id: 'lang-bloom30',   icon: '🌸', name: '花ひらく語彙', desc: 'フレーズカード30枚を🌸想起まで育てた' },
  { id: 'lang-unit',      icon: '📗', name: 'ユニット制覇', desc: '1つのユニットの全カードを🌸まで育てた' },
  { id: 'lang-speak',     icon: '🎙️', name: '声に出して言えた', desc: '発話チェックに初めて合格し⭐マスターした' },
  { id: 'lang-voice',     icon: '❤️', name: 'ふたりの教科書', desc: 'パートナーのお手本録音を初めて保存した' },
  { id: 'topic-heart',    icon: '🎴', name: '話題の名手', desc: '話題トークで相手の機嫌を最高潮(10)にした' },
  { id: 'qa-perfect',     icon: '🛡️', name: '鉄壁の質疑応答', desc: '質疑応答ディフェンスを全問正解で切り抜けた' },
  { id: 'badge-remember', icon: '👥', name: '名前を覚える人', desc: '名刺交換した相手の名前を再会時に思い出せた' },
  { id: 'sniper-combo8',  icon: '🎧', name: '耳のスナイパー', desc: '聞き取りスナイパーで8コンボを達成した' },
  { id: 'route-first',    icon: '🚉', name: '出発進行', desc: '路線図モードで最初の駅をクリアした' },
  { id: 'route-clear',    icon: '🚄', name: 'Korea Route制覇', desc: 'Korea Routeの全駅をクリアした' },
  { id: 'wedding-clear',  icon: '💒', name: 'Wedding Quest制覇', desc: 'Hong Kong Routeの全駅をクリアした' }
];
const ACHIEVEMENT_GEMS = 10;

const Achievements = {
  data() { return JSON.parse(localStorage.getItem('lq_achv') || '{}'); },
  count() { return Object.keys(this.data()).length; },
  has(id) { return !!this.data()[id]; },
  unlock(id) {
    const d = this.data();
    if (d[id]) return false;
    const def = ACHIEVEMENT_DEFS.find((a) => a.id === id);
    if (!def) return false;
    d[id] = new Date().toISOString();
    localStorage.setItem('lq_achv', JSON.stringify(d));
    if (typeof showToast === 'function') showToast(`🏅 実績解除: ${def.icon} ${def.name}`);
    Gems.add(ACHIEVEMENT_GEMS, '実績報酬');
    return true;
  }
};

/* ---------- 🎓キャリア称号(⭐pt累計による生涯業績ランク) ----------
 * 設計: docs/pt-career-design.md
 * 称号は lq_gami.points から毎回導出する(Single Source of Truth)。
 * 保存するのは「どこまで報酬を受け取ったか」(claimedIdx)と到達日(log)のみ。
 */
const CAREER_RANKS = [
  { id: 'b4',       icon: '🎒', name: '学部生',       need: 0,     gems: 0  },
  { id: 'master',   icon: '📖', name: '修士課程',     need: 150,   gems: 5  },
  { id: 'doctor',   icon: '🔬', name: '博士課程',     need: 400,   gems: 5  },
  { id: 'postdoc',  icon: '🎓', name: 'ポスドク',     need: 800,   gems: 8  },
  { id: 'jokyo',    icon: '🧑‍🏫', name: '助教',         need: 1400,  gems: 10 },
  { id: 'koshi',    icon: '📝', name: '講師',         need: 2200,  gems: 10 },
  { id: 'junkyoju', icon: '🏛️', name: '准教授',       need: 3200,  gems: 12 },
  { id: 'kyoju',    icon: '👑', name: '教授',         need: 9000,  gems: 15 },
  { id: 'dean',     icon: '🏫', name: '学部長',       need: 16000, gems: 18 },
  { id: 'meiyo',    icon: '🌟', name: '名誉教授',     need: 25000, gems: 20 },
  { id: 'kaicho',   icon: '🏆', name: '学会長',       need: 36000, gems: 30 },
  { id: 'juchin',   icon: '🎖️', name: '学界の重鎮',   need: 50000, gems: 35 },
  { id: 'authority',icon: '🌏', name: '世界的権威',   need: 68000, gems: 40 },
  { id: 'legend',   icon: '🪐', name: '伝説の研究者', need: 90000, gems: 50 }
];

const CareerRank = {
  data() {
    try {
      const d = JSON.parse(localStorage.getItem('lq_career') || 'null');
      if (d && typeof d.claimedIdx === 'number') { if (!d.log) d.log = {}; return d; }
    } catch (_) { /* 破損時は初期化 */ }
    return { claimedIdx: -1, log: {} };
  },
  save(d) { localStorage.setItem('lq_career', JSON.stringify(d)); },
  points() { return (typeof Gami !== 'undefined') ? (Gami.data().points || 0) : 0; },

  /** 累計ptから現在のランクindexを導出 */
  index(pts) {
    const p = (pts === undefined) ? this.points() : pts;
    let i = 0;
    for (let k = 0; k < CAREER_RANKS.length; k++) {
      if (p >= CAREER_RANKS[k].need) i = k;
    }
    return i;
  },
  /** 表示用ランクindex: 一度到達した称号は、しきい値の調整後も失わない */
  effectiveIndex() {
    const claimed = Math.min(this.data().claimedIdx, CAREER_RANKS.length - 1);
    return Math.max(this.index(), claimed);
  },
  current() { return CAREER_RANKS[this.effectiveIndex()]; },
  next() {
    const i = this.effectiveIndex();
    return i < CAREER_RANKS.length - 1 ? CAREER_RANKS[i + 1] : null;
  },
  /** 次ランクへの進捗 {into, span, pct}。最高位ならnull */
  progress() {
    const nxt = this.next();
    if (!nxt) return null;
    const base = CAREER_RANKS[this.effectiveIndex()].need;
    const span = nxt.need - base;
    const into = Math.max(0, this.points() - base);
    return { into, span, pct: Math.max(0, Math.min(100, Math.round(into / span * 100))) };
  },

  /** 未受け取りの昇格を精算する。昇格していれば {rank, gems, count, retro} を返す。
   *  複数ランク同時昇格はまとめて💎付与し、演出は最終到達ランクのみ。
   *  初回(claimedIdx=-1)は導入時の遡及付与(retro=true)。 */
  checkUp() {
    const d = this.data();
    const idx = this.index();
    if (idx <= d.claimedIdx) return null;
    const retro = d.claimedIdx < 0;
    let gems = 0, count = 0;
    const now = new Date().toISOString();
    for (let k = Math.max(0, d.claimedIdx + 1); k <= idx; k++) {
      gems += CAREER_RANKS[k].gems || 0;
      if (!d.log[CAREER_RANKS[k].id]) d.log[CAREER_RANKS[k].id] = now;
      count++;
    }
    d.claimedIdx = idx;
    this.save(d);
    if (gems > 0 && typeof Gems !== 'undefined') Gems.add(gems, 'キャリア昇格');
    // 学部生(idx0)どまりなら記録だけして演出はしない
    if (idx === 0) return null;
    return { rank: CAREER_RANKS[idx], gems, count, retro };
  },

  /** ランクの到達日(未到達ならnull) */
  reachedAt(id) { return this.data().log[id] || null; }
};
