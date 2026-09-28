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
    if (!p.id) {
      // 同じミリ秒に2件作っても id が重ならないようにする
      p.id = Date.now();
      while (all.some((x) => x.id === p.id)) p.id += 1;
    }
    if (!p.createdAt) p.createdAt = new Date().toISOString();
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

  /** 一覧表示用の短い日付("10/29" など)。ISO 日付でなければそのまま */
  fmtDate(s) {
    const m = String(s || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? `${Number(m[2])}/${Number(m[3])}` : String(s || '');
  }
};
