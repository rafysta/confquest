/* ---------- 📅 予定の講演 (v1.38.0) ----------
 * 学会の前に「聴く予定の講演」を登録しておき、会場では一覧から選んで
 * ● 録音を開始 を押すだけで始められるようにする。
 *
 * 登録した内容は 3 か所で使われる:
 *   1. Whisper の prompt(語彙ヒント)  → 専門用語・人名の聞き取りが目標語彙に寄る
 *   2. 要約のプロンプト                → 抄録・下調べと突き合わせて要約できる
 *   3. 質問候補のプロンプト            → 講演者の以前の主張との違いなど、踏み込んだ質問が作れる
 *
 * 保存先は localStorage `lq_talk_plans`(JSON配列)。lq_ で始まるので
 * 💾バックアップにも自動で含まれる。
 *
 * plan = {
 *   id, createdAt,
 *   title, speaker, affil, venue, date, lang,
 *   abstract,   // 抄録(プログラムからコピー)
 *   prep,       // 下調べ(Claude 等に作ってもらった Markdown を貼り付け)
 *   terms,      // Whisper に渡す語彙(改行またはカンマ区切りの文字列)
 *   usedAt, talkId   // この予定で録音したら入る
 * }
 */
const Plans = {
  KEY: 'lq_talk_plans',
  MAX: 60,
  /* Whisper の prompt は末尾 224 トークンしか使われない。英語の専門用語は
   * 1 語 2〜3 トークンになりがちなので、文字数で控えめに切る。 */
  PROMPT_MAX_CHARS: 700,
  /* 要約・質問のプロンプトに渡す下調べの上限(長すぎる下調べは前から切る) */
  CONTEXT_MAX_CHARS: 14000,

  list() {
    try {
      const a = JSON.parse(localStorage.getItem(this.KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (_) { return []; }
  },

  get(id) {
    if (id == null || id === '') return null;
    const n = Number(id);
    return this.list().find((p) => p.id === n) || null;
  },

  /** 予定を保存(同じ id があれば置きかえ)。戻り値は保存した plan */
  save(plan) {
    const p = Object.assign({}, plan);
    const all = this.list();
    /* 編集画面のフォームは中身の欄しか持たないので、既存の予定を保存し直すときは
     * 作成日時と録音済みの印を引き継ぐ(v1.40.0 まではここで作成日時が毎回新しくなり、
     * 録音済みの予定を編集すると「未使用」に戻っていた。作成日時は端末間で
     * 同じ予定かどうかを見分けるのに使う) */
    const prev = p.id ? all.find((x) => x.id === p.id) : null;
    if (prev) ['createdAt', 'usedAt', 'talkId'].forEach((k) => { if (p[k] === undefined && prev[k] !== undefined) p[k] = prev[k]; });
    if (!p.id) {
      // 同じミリ秒に2件作っても id が重ならないようにする
      p.id = Date.now();
      while (all.some((x) => x.id === p.id)) p.id += 1;
    }
    if (!p.createdAt) p.createdAt = new Date().toISOString();
    // 書き出し→別の端末で読み込んだときに、どちらが新しいかを比べるのに使う
    p.updatedAt = new Date().toISOString();
    ['title', 'speaker', 'affil', 'venue', 'date', 'lang', 'abstract', 'prep', 'terms']
      .forEach((k) => { p[k] = String(p[k] == null ? '' : p[k]).trim(); });
    if (!p.title) p.title = '無題の講演';
    const rest = all.filter((x) => x.id !== p.id);
    rest.unshift(p);
    localStorage.setItem(this.KEY, JSON.stringify(rest.slice(0, this.MAX)));
    return p;
  },

  remove(id) {
    const n = Number(id);
    localStorage.setItem(this.KEY, JSON.stringify(this.list().filter((p) => p.id !== n)));
  },

  /** この予定で録音した、と記録する(一覧では「済」に回る) */
  markUsed(id, talkId) {
    const p = this.get(id);
    if (!p) return;
    p.usedAt = new Date().toISOString();
    p.talkId = talkId || null;
    this.save(p);
  },

  /** 未使用の予定を、日付(空欄は最後)→登録順で並べる */
  upcoming() {
    return this.list().filter((p) => !p.usedAt).sort((a, b) => {
      const da = a.date || '9999', db = b.date || '9999';
      if (da !== db) return da < db ? -1 : 1;
      return (a.id || 0) - (b.id || 0);
    });
  },
  done() {
    return this.list().filter((p) => p.usedAt);
  },

  /** 語彙欄(改行・カンマ・セミコロン区切り)を配列に。重複は除く */
  termList(text) {
    const seen = new Set();
    return String(text || '').split(/[\n,;、，]+/)
      .map((s) => s.trim()).filter(Boolean)
      .filter((s) => { const k = s.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  },

  /**
   * 下調べの Markdown から語彙を拾う。
   * 「## 語彙リスト」(or Glossary / Terms / 用語) の見出しの下にある
   * 箇条書きの先頭語・カンマ区切りの行を語彙として取り出す。
   * Claude への依頼文(requestText)はこの見出しで出すよう頼んでいるので、
   * 貼り付けた直後に AI を呼ばずに語彙が埋まる。
   */
  termsFromPrep(prep) {
    const text = String(prep || '');
    const m = text.match(/^#{1,4}\s*(?:語彙リスト|語彙|用語集|用語|Glossary|Terms|Key terms|Vocabulary)[^\n]*\n([\s\S]*?)(?=\n#{1,4}\s|(?![\s\S]))/im);
    if (!m) return [];
    const body = m[1];
    const out = [];
    body.split('\n').forEach((line) => {
      let s = line.replace(/^\s*(?:[-*+•]|\d+[.)])\s*/, '').trim();
      if (!s) return;
      // 「**term** — 説明」「term: 説明」「term（説明）」は term だけ
      s = s.replace(/^\*\*(.+?)\*\*.*$/, '$1');
      s = s.replace(/^([^:：—–(（]+?)\s*(?:[:：—–]|\(|（).*$/, '$1');
      s = s.replace(/[`*]/g, '').trim();
      if (!s) return;
      // 1 行にカンマで並んでいる場合はばらす
      if (s.includes(',') && s.split(',').length > 2) s.split(',').forEach((t) => { t = t.trim(); if (t) out.push(t); });
      else out.push(s);
    });
    return this.termList(out.join('\n'));
  },

  /**
   * Whisper へ渡す prompt。
   * 形は「実際の講演の書き起こしの冒頭」に見せる(Whisper は prompt を直前の
   * 文脈として扱うので、リストより自然文のほうが効きやすい)。
   * 語彙は末尾に置く。切り詰めは前から行われる(末尾 224 トークンが残る)ので、
   * いちばん効いてほしい語彙が残る。
   */
  whisperPrompt(plan) {
    if (!plan) return '';
    const parts = [];
    const who = [plan.speaker, plan.affil].filter(Boolean).join(', ');
    // prompt の言語は自動判定の結果に影響する(英語の prompt は英語寄りにする)。
    // 講演の言語が分かっている、またはタイトルが日本語・韓国語なら、見出し語をその言語にする。
    const lang = plan.lang || (/[ぁ-ゟァ-ヿ一-鿿]/.test(plan.title || '') ? 'ja'
      : (/[가-힣]/.test(plan.title || '') ? 'ko' : ''));
    const L = lang === 'ja' ? { talk: '講演:', who: '講演者:', terms: '用語:', end: '。' }
      : lang === 'ko' ? { talk: '강연:', who: '연사:', terms: '용어:', end: '.' }
      : { talk: 'Talk:', who: 'Speaker:', terms: 'Key terms:', end: '.' };
    if (plan.title) parts.push(`${L.talk} ${plan.title}${L.end}`);
    if (who) parts.push(`${L.who} ${who}${L.end}`);
    const terms = this.termList(plan.terms);
    if (terms.length) parts.push(`${L.terms} ${terms.join(', ')}${L.end}`);
    let s = parts.join(' ');
    if (s.length > this.PROMPT_MAX_CHARS) s = s.slice(s.length - this.PROMPT_MAX_CHARS);
    return s;
  },

  /** 要約・質問のプロンプトに添える事前情報(空なら '') */
  contextText(prep) {
    if (!prep) return '';
    const blocks = [];
    if (prep.abstract) blocks.push(`【抄録(プログラム掲載)】\n${prep.abstract}`);
    if (prep.notes) blocks.push(`【下調べ(講演前に調べた講演者の研究の流れ・語彙・論点)】\n${prep.notes}`);
    let s = blocks.join('\n\n');
    if (s.length > this.CONTEXT_MAX_CHARS) {
      s = s.slice(0, this.CONTEXT_MAX_CHARS) + '\n(※ 下調べが長いため、ここまでで切っています)';
    }
    return s;
  },

  /** 録音(Talk.current)へ持たせるスナップショット。予定を消しても録音側に残る */
  snapshot(plan) {
    if (!plan) return null;
    const snap = {
      planId: plan.id,
      abstract: plan.abstract || '',
      notes: plan.prep || '',
      terms: this.termList(plan.terms),
      affil: plan.affil || ''
    };
    if (!snap.abstract && !snap.notes && !snap.terms.length) return null;
    return snap;
  },

  /**
   * Claude(チャット)へ貼り付ける依頼文。
   * 出力の見出しを固定して頼むことで、貼り戻したときに語彙が自動で拾える。
   * 自分の研究(lq_my_research)を添えると「自分との接点」まで調べてもらえる。
   */
  requestText(plan) {
    const p = plan || {};
    const my = (localStorage.getItem('lq_my_research') || '').trim();
    const who = [p.speaker, p.affil].filter(Boolean).join('（') + (p.affil ? '）' : '');
    return `学会で次の講演を聴きます。講演を聴く前の下調べとして、講演者の研究の流れと、聴きながら注目すべき点、質疑応答で聞く価値のある論点をまとめてください。ウェブ検索や論文データベースを使えるなら、講演者の最近の論文(直近5年程度)を実際に調べたうえで書いてください。

講演タイトル: ${p.title || '(不明)'}
講演者: ${who || '(不明)'}
学会・セッション: ${p.venue || '(不明)'}${p.date ? `\n日時: ${p.date}` : ''}
${p.abstract ? `\n抄録:\n${p.abstract}\n` : '\n抄録: (なし。タイトルと講演者から推測してください)\n'}
${my ? `私(聴講者)の研究・関心:\n${my}\n` : ''}
出力は Markdown で、以下の見出しをこの順で使ってください(全体で 1500 語程度まで)。
## 講演者の研究の流れ
主要な問い、これまでの中心的な主張、使ってきた系・手法。
## 最近の主要論文
年・誌名・要点を 1 行ずつ、3〜8 本。確信が持てないものは「(未確認)」と付ける。
## この講演で予想される内容
抄録とこれまでの流れから、話されそうなこと。まだ論文になっていないと思われる部分はどこか。
## 論点・未解決の問い
この分野で議論が分かれている点、講演者の主張に対して出されている批判や別解釈。
## 質問の切り口
質疑応答で聞く価値のある観点を 5〜8 個。${my ? '私の研究との接点も含めて。' : ''}
## 語彙リスト
講演中に口頭で出てきそうな専門用語・遺伝子名・手法名・生物種名・人名・略語を 40〜80 個、英語で、1 行にカンマ区切りで。音声認識(Whisper)への語彙ヒントとして使うので、略語は「Hi-C」「ChIP-seq」のように口頭で言われる形で。

この出力をそのままアプリに貼り付けて使います。`;
  },

  /**
   * AI に語彙を作らせる(下調べが無い、または「## 語彙リスト」が拾えなかったとき用)。
   * タイトル・抄録・下調べから、口頭で出そうな用語をカンマ区切りで返す。
   */
  async generateTerms(plan) {
    const p = plan || {};
    const sys = `あなたは学会講演の音声認識(Whisper)を助けるアシスタントです。講演の情報から、講演中に口頭で出てきそうな専門用語・遺伝子名・タンパク質名・手法名・生物種名・人名・略語を英語で挙げてください。
出力はカンマ区切りの 1 行だけ。40〜70 個。説明・番号・前置きは不要。略語は口頭で言われる形(Hi-C, ChIP-seq, CRISPR)で。一般的すぎる語(cell, gene, protein)は入れない。`;
    let user = `講演タイトル: ${p.title || '(不明)'}\n講演者: ${[p.speaker, p.affil].filter(Boolean).join(', ') || '(不明)'}`;
    if (p.abstract) user += `\n\n抄録:\n${p.abstract}`;
    if (p.prep) user += `\n\n下調べ:\n${String(p.prep).slice(0, 12000)}`;
    const text = await AI.chat(sys, [{ role: 'user', content: user }], 1200, { effort: 'low' });
    return this.termList(String(text || '').replace(/\n+/g, ', ')).join(', ');
  },

  /* ---------- 📤📥 端末間の受け渡し (v1.40.0) ----------
   * 予定は端末(ブラウザ)ごとの localStorage にあるので、PC で作った予定は
   * そのままでは携帯に出てこない。💾バックアップの復元は「全部置きかえ」なので
   * 携帯側の学習の進行まで消えてしまう。そこで予定だけを書き出し、読み込む側では
   * 既存の予定に「足す」形にする。
   *
   * 形は 2 通り:
   *   ファイル … JSON そのまま(Nextcloud・Google Drive・Gmail の添付で運ぶ)
   *   テキスト … JSON を UTF-8 → Base64 にして目印の行で挟む(Gmail・LINE・Keep に貼る)。
   *             引用符の置きかえ・改行の挿入・前後の文章が付いても壊れないように Base64 にする。
   *             目印に「---」を使わないのは、Gmail が `---` 以降を署名として折りたたむため。
   */
  EXPORT_KIND: 'confquest-talk-plans',
  EXPORT_FORMAT: 1,
  TEXT_BEGIN: '#### CONFQUEST PLANS BEGIN ####',
  TEXT_END: '#### CONFQUEST PLANS END ####',
  FIELDS: ['title', 'speaker', 'affil', 'venue', 'date', 'lang', 'abstract', 'prep', 'terms'],
  FIELD_MAX: { title: 400, speaker: 300, affil: 300, venue: 300, date: 40, lang: 8, abstract: 20000, prep: 60000, terms: 8000 },

  /** 書き出す中身。録音済みの印(usedAt/talkId)は運ばない(相手の端末では未使用の予定) */
  exportPayload(plans) {
    return {
      kind: this.EXPORT_KIND,
      format: this.EXPORT_FORMAT,
      exportedAt: new Date().toISOString(),
      plans: (plans || []).map((p) => {
        const o = { id: p.id, createdAt: p.createdAt || '', updatedAt: p.updatedAt || p.createdAt || '' };
        this.FIELDS.forEach((k) => { o[k] = p[k] == null ? '' : String(p[k]); });
        return o;
      })
    };
  },

  exportJson(plans) {
    return JSON.stringify(this.exportPayload(plans), null, 1);
  },

  exportFileName() {
    const d = new Date();
    const z = (n) => String(n).padStart(2, '0');
    return `confquest-plans-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}.json`;
  },

  _b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  },
  _b64decode(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  },

  /** メールやチャットに貼るテキスト。説明文 + 目印 + Base64(76 文字で改行) */
  exportText(plans) {
    const list = plans || [];
    const b64 = this._b64encode(JSON.stringify(this.exportPayload(list)));
    const lines = b64.match(/.{1,76}/g) || [];
    const titles = list.slice(0, 8).map((p) => `・${this.fmtDate(p.date) ? this.fmtDate(p.date) + ' ' : ''}${p.title || '無題の講演'}`);
    if (list.length > 8) titles.push(`・ほか ${list.length - 8} 件`);
    return [
      `ConfQuest「予定の講演」${list.length}件`,
      ...titles,
      '',
      '受け取る端末の ConfQuest で「📅 予定の講演」→「📥 読み込む」→「📋 貼り付けて読み込む」を開き、このメッセージを丸ごと貼り付けてください。',
      '',
      this.TEXT_BEGIN,
      ...lines,
      this.TEXT_END
    ].join('\n');
  },

  /**
   * 読み込んだファイル・貼り付けたテキストから予定の配列を取り出す。
   * 受け付けるもの: exportText の出力(前後に別の文章があってもよい)/ exportJson の出力 /
   * 予定の配列そのもの。読めなければ Error(日本語の説明つき)を投げる。
   */
  parseImport(text) {
    let s = String(text || '').replace(/^﻿/, '');
    if (!s.trim()) throw new Error('中身が空です。');
    let data = null;
    const bi = s.indexOf(this.TEXT_BEGIN);
    if (bi >= 0) {
      const ei = s.indexOf(this.TEXT_END, bi);
      if (ei < 0) throw new Error('終わりの目印(CONFQUEST PLANS END)が見つかりません。メッセージが途中で切れていないか確かめてください。');
      // メールの引用記号(> )や改行・空白が混じっても、Base64 の文字だけを拾えば元に戻る
      const body = s.slice(bi + this.TEXT_BEGIN.length, ei).replace(/^[ \t]*>+/gm, '').replace(/[^A-Za-z0-9+/=]/g, '');
      try { data = JSON.parse(this._b64decode(body)); } catch (_) {
        throw new Error('貼り付けた内容を読み取れませんでした(途中が欠けているか、別の文字に置きかわっています)。もう一度コピーし直してください。');
      }
    } else {
      const a = s.search(/[[{]/);
      if (a < 0) throw new Error('ConfQuest の予定のデータが見つかりません。');
      const close = s[a] === '{' ? '}' : ']';
      const b = s.lastIndexOf(close);
      try { data = JSON.parse(s.slice(a, b + 1)); } catch (_) {
        throw new Error('ConfQuest の予定のデータとして読み取れませんでした。');
      }
    }
    let plans;
    if (Array.isArray(data)) plans = data;
    else if (data && Array.isArray(data.plans) && (!data.kind || data.kind === this.EXPORT_KIND)) plans = data.plans;
    else throw new Error('ConfQuest の予定のデータではないようです。');
    if (data && data.format && data.format > this.EXPORT_FORMAT) {
      throw new Error('新しい版の ConfQuest で書き出されたデータです。この端末のアプリを 🔄 更新してから読み込んでください。');
    }
    const out = [];
    plans.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return;
      const p = {};
      this.FIELDS.forEach((k) => {
        p[k] = String(raw[k] == null ? '' : raw[k]).trim().slice(0, this.FIELD_MAX[k]);
      });
      if (!['', 'en', 'ja', 'ko'].includes(p.lang)) p.lang = '';
      if (!p.title && !p.speaker && !p.abstract && !p.prep) return;   // 空の予定は無視
      if (!p.title) p.title = '無題の講演';
      const id = Number(raw.id);
      p.id = Number.isFinite(id) && id > 0 ? id : 0;
      p.createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : '';
      p.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : p.createdAt;
      out.push(p);
    });
    if (!out.length) throw new Error('読み込める予定が 1 件もありませんでした。');
    return out;
  },

  /** 同じ予定か(id と作成日時が同じ = 同じ予定を書き出したもの) */
  _samePlan(a, b) {
    return a.id && b.id && a.id === b.id && (a.createdAt || '') === (b.createdAt || '');
  },
  _sameContent(a, b) {
    return this.FIELDS.every((k) => String(a[k] || '') === String(b[k] || ''));
  },

  /**
   * 読み込む前の見積もり。各予定に action を付けて返す:
   *   'add'  … この端末に無い予定(新しく足す)
   *   'update' … 同じ予定があり、中身が違い、読み込むほうが新しい(上書きする)
   *   'same' … 同じ予定があり、中身も同じ(何もしない)
   *   'older' … 同じ予定があり、この端末のほうが新しく直されている(何もしない)
   */
  planImport(incoming) {
    const local = this.list();
    return (incoming || []).map((p) => {
      const cur = local.find((x) => this._samePlan(x, p));
      if (!cur) return { plan: p, action: 'add' };
      if (this._sameContent(cur, p)) return { plan: p, action: 'same', local: cur };
      const lu = cur.updatedAt || cur.createdAt || '';
      const iu = p.updatedAt || p.createdAt || '';
      if (lu && iu && lu > iu) return { plan: p, action: 'older', local: cur };
      return { plan: p, action: 'update', local: cur };
    });
  },

  /** planImport の結果を書き込む。戻り値 {add, update, same, older} の件数 */
  applyImport(items) {
    const all = this.list();
    const counts = { add: 0, update: 0, same: 0, older: 0 };
    const added = [];
    (items || []).forEach((it) => {
      counts[it.action] = (counts[it.action] || 0) + 1;
      const p = it.plan;
      if (it.action === 'update') {
        const cur = all.find((x) => this._samePlan(x, p));
        if (!cur) return;
        this.FIELDS.forEach((k) => { cur[k] = p[k]; });   // 録音済みの印(usedAt/talkId)はこの端末のまま
        cur.updatedAt = p.updatedAt || new Date().toISOString();
      } else if (it.action === 'add') {
        const n = Object.assign({}, p);
        // id が無い・この端末の別の予定と重なる場合は振り直す
        if (!n.id || all.some((x) => x.id === n.id) || added.some((x) => x.id === n.id)) {
          n.id = Date.now();
          while (all.some((x) => x.id === n.id) || added.some((x) => x.id === n.id)) n.id += 1;
        }
        if (!n.createdAt) n.createdAt = new Date().toISOString();
        if (!n.updatedAt) n.updatedAt = n.createdAt;
        added.push(n);
      }
    });
    const merged = added.concat(all);
    if (merged.length > this.MAX) {
      // 上限を超えたら、録音済みの古いものから落とす(未使用の予定はなるべく残す)
      const keep = merged.filter((p) => !p.usedAt);
      const used = merged.filter((p) => p.usedAt);
      const room = Math.max(0, this.MAX - keep.length);
      const kept = new Set(keep.slice(0, this.MAX).concat(used.slice(0, room)));
      localStorage.setItem(this.KEY, JSON.stringify(merged.filter((p) => kept.has(p))));
    } else {
      localStorage.setItem(this.KEY, JSON.stringify(merged));
    }
    return counts;
  },

  /** 一覧表示用の短い日付("10/29" など)。ISO 日付でなければそのまま */
  fmtDate(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? `${Number(m[2])}/${Number(m[3])}` : String(s || '');
  }
};
