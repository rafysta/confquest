/* ConfQuest - AI連携 (Claude / OpenAI 切替可能 + 文字起こし) */
'use strict';

/* ---------- 🔑 APIキーの案内 ----------
 * キーが未設定のまま機能を使うと、取得手順つきの案内を出す(app.jsのshowApiKeyHelp)。
 * ここでは「キーが無い」ことが分かるエラー(err.noKey)を投げるところまでを担当する。
 */
const API_KEY_INFO = {
  claude: {
    name: 'Anthropic (Claude)',
    field: 'api-key',
    fieldLabel: 'Anthropic APIキー',
    url: 'https://console.anthropic.com/settings/keys',
    site: 'Anthropic Console',
    prefix: 'sk-ant-',
    cost: '会話1回で数円程度。使った分だけの従量課金です(事前に少額のクレジット購入が必要)。'
  },
  openai: {
    name: 'OpenAI',
    field: 'openai-key',
    fieldLabel: 'OpenAI APIキー',
    url: 'https://platform.openai.com/api-keys',
    site: 'OpenAI Platform',
    prefix: 'sk-',
    cost: '文字起こしは約0.9円/分、会話1回は数円程度の従量課金です(事前に少額のクレジット購入が必要)。'
  }
};

/** 「APIキーが無い」ことを示すエラーを作る。err.noKey / err.provider で判別できる */
function apiKeyError(provider, what) {
  const info = API_KEY_INFO[provider] || API_KEY_INFO.claude;
  const err = new Error(`${what || 'この機能'}には ${info.name} のAPIキーが必要です。設定画面で登録してください。`);
  err.noKey = true;
  err.provider = provider;
  return err;
}

/** 「APIキーはあるが認証に失敗した(無効・失効)」エラーを作る。err.badKey で判別できる */
function apiAuthError(provider, status) {
  const info = API_KEY_INFO[provider] || API_KEY_INFO.claude;
  const err = new Error(
    `${info.name} のAPIキーが認証エラーになりました(${status})。キーが無効か、失効しているか、貼り付け時に一部欠けた可能性があります。`);
  err.badKey = true;
  err.provider = provider;
  return err;
}

/**
 * 「本文が1文字も返らなかった」エラーを作る。err.emptyReply で判別できる。
 *
 * ⚠ これは失敗なのに HTTP 200 で返ってきます。検出しないと、空の要約が
 *   「成功」として保存され、一覧に「要約なし」とだけ並びます。
 *
 * いちばん多い原因は max_tokens の使い切りです。Sonnet 5 以降のモデルは
 * thinking を指定しなくても「考えてから答える」ため、思考ぶんも max_tokens
 * から引かれます。入力が長いほど思考も長くなるので、予算が小さいと
 * 思考だけで打ち切られ、本文(textブロック)が0個のまま返ります。
 */
function emptyReplyError(hitLimit) {
  const err = new Error(hitLimit
    ? 'AIの出力が上限(max_tokens)に達し、本文が返りませんでした。'
      + '入力が長いほど起きやすくなります。文字起こしを短くするか、出力上限を上げてください。'
    : 'AIから空の応答が返りました。もう一度お試しください。');
  err.emptyReply = true;
  return err;
}

/** OpenAIによる文字起こし */
const STT = {
  getKey() {
    return localStorage.getItem('lq_openai_key') || '';
  },
  getModel() {
    return localStorage.getItem('lq_stt_model') || 'whisper-1';
  },

  /**
   * 音声Blobを文字起こしし、[{start, end, text}] (秒単位) を返す
   */
  async transcribe(blob, lang, prompt) {
    const key = this.getKey();
    if (!key) throw apiKeyError('openai', '音声の文字起こし');
    const ext = (blob.type.includes('ogg')) ? 'ogg'
      : (blob.type.includes('mp4') ? 'mp4' : 'webm');
    const model = this.getModel();
    const form = new FormData();
    form.append('file', blob, `recording.${ext}`);
    form.append('model', model);
    // whisper-1 のみ verbose_json (タイムスタンプ付き) に対応
    if (model === 'whisper-1') {
      form.append('response_format', 'verbose_json');
    } else {
      form.append('response_format', 'json');
    }
    if (lang) form.append('language', lang.split('-')[0]); // en-US -> en
    // 期待するフレーズをヒントとして渡すと、短い発話の認識が目標語彙に寄る
    if (prompt) form.append('prompt', prompt);

    // ★ 大きなパート(数MB〜十数MB)の送信は、VPN・電波・画面消灯などで途中で切れることがある。
    //   その場合 fetch は HTTP 応答なしの TypeError("Failed to fetch") を投げるので、
    //   時間切れ(AbortController)と一時的な失敗(ネットワーク断・5xx・429)は数回やり直す。
    //   401/403/400 のような「やり直しても同じ」失敗は即座に投げる。
    const mb = (blob.size / 1048576).toFixed(1);
    const timeoutMs = this.uploadTimeoutMs(blob.size);
    let lastErr = null;
    for (let attempt = 1; attempt <= this.UPLOAD_RETRIES; attempt++) {
      const ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
      let res;
      try {
        res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}` },
          body: form,
          signal: ctl ? ctl.signal : undefined
        });
      } catch (err) {
        if (timer) clearTimeout(timer);
        const aborted = err && err.name === 'AbortError';
        lastErr = new Error(aborted
          ? `送信が${Math.round(timeoutMs / 1000)}秒以内に終わりませんでした(${mb}MB)`
          : `送信中に接続が切れました(${mb}MB): ${(err && err.message) || err}`);
        if (attempt < this.UPLOAD_RETRIES) { await this._sleep(this.retryWaitMs(attempt)); continue; }
        throw new Error(`${lastErr.message} — ${this.UPLOAD_RETRIES}回試しました。VPNをオフにする・Wi-Fiに切り替える・画面を消さない、で改善することがあります`);
      }
      if (timer) clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.segments) && data.segments.length > 0) {
          return data.segments.map((sg) => ({ start: sg.start, end: sg.end, text: sg.text }));
        }
        // segmentsが無い場合は全文を1セグメント扱い
        return data.text ? [{ start: 0, end: 0, text: data.text }] : [];
      }
      if (res.status === 401 || res.status === 403) throw apiAuthError('openai', res.status);
      const body = await res.text().catch(() => '');
      lastErr = new Error(`文字起こしAPIエラー (${res.status}): ${body.slice(0, 200)}`);
      const transient = res.status === 429 || res.status >= 500;
      if (!transient || attempt >= this.UPLOAD_RETRIES) throw lastErr;
      await this._sleep(this.retryWaitMs(attempt));
    }
    throw lastErr || new Error('文字起こしに失敗しました');
  },

  /** 送信のやり直し回数(初回を含む) */
  UPLOAD_RETRIES: 3,
  /** 送信の時間切れ: 基本60秒 + 1MBあたり20秒(遅い回線で10MBなら約4分半) */
  uploadTimeoutMs(bytes) {
    return 60000 + Math.round(bytes / 1048576) * 20000;
  },
  /** 待ち時間: 2秒 → 5秒 */
  retryWaitMs(attempt) { return attempt === 1 ? 2000 : 5000; },
  _sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },

  /**
   * 文字起こしAPIに届くかを短時間で確かめる(キーの正否も分かる)。
   * 録音を始める前の確認用。{ ok, why } を返し、例外は投げない。
   */
  async checkConnection(timeoutMs) {
    const key = this.getKey();
    if (!key) return { ok: false, why: 'OpenAI APIキーが未設定です' };
    const ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs || 8000) : null;
    try {
      const res = await fetch('https://api.openai.com/v1/models/whisper-1', {
        headers: { 'Authorization': `Bearer ${key}` },
        signal: ctl ? ctl.signal : undefined
      });
      if (timer) clearTimeout(timer);
      if (res.status === 401 || res.status === 403) return { ok: false, why: 'APIキーが認証エラーです' };
      return { ok: true };
    } catch (err) {
      if (timer) clearTimeout(timer);
      return { ok: false, why: (err && err.name === 'AbortError') ? '応答がありません(時間切れ)' : '接続できません' };
    }
  }
};



const AI = {
  /** 'claude' | 'openai' */
  getProvider() {
    return localStorage.getItem('lq_ai_provider') || 'claude';
  },
  getKey() {
    return this.getProvider() === 'openai'
      ? (localStorage.getItem('lq_openai_key') || '')
      : (localStorage.getItem('lq_api_key') || '');
  },
  getModel() {
    return this.getProvider() === 'openai'
      ? (localStorage.getItem('lq_openai_model') || 'gpt-5')
      : (localStorage.getItem('lq_ai_model') || 'claude-sonnet-5');
  },
  providerLabel() {
    return this.getProvider() === 'openai' ? 'OpenAI' : 'Anthropic';
  },

  /**
   * 選択中のプロバイダのAPIを呼ぶ。messages: [{role, content}]
   * 戻り値: アシスタントのテキスト
   */
  /** 現在のプロバイダのキーが登録されているか */
  hasKey() { return !!this.getKey(); },

  /**
   * AI機能に入る前のチェック。キーが無ければ案内を出してfalseを返す。
   * provider省略時は現在のAIプロバイダ、'openai'指定で文字起こし用のキーを見る。
   */
  ensureKey(provider, what) {
    const p = provider || this.getProvider();
    const key = p === 'openai'
      ? (localStorage.getItem('lq_openai_key') || '')
      : (localStorage.getItem('lq_api_key') || '');
    if (key) return true;
    if (typeof showApiKeyHelp === 'function') showApiKeyHelp(p, what);
    else if (typeof appAlert === 'function') appAlert(apiKeyError(p, what).message, '🔑 APIキーが必要');
    return false;
  },

  /**
   * このモデルが adaptive thinking(と effort 指定)を受け付けるか。
   * Haiku 4.5 のような旧世代に thinking を送ると 400 で弾かれるので、
   * 対応モデルにだけ付ける。
   */
  supportsThinking(model) {
    return /^claude-(fable-5|opus-5|opus-4-[678]|sonnet-5|sonnet-4-6)/.test(model || '');
  },

  /**
   * opts(任意): { effort: 'low'|'medium'|'high'|'xhigh'|'max' }
   * 長い入力を扱う呼び出しは effort を下げて、思考が max_tokens を
   * 食い尽くさないようにする(要約はこれを使う)。
   */
  async chat(systemPrompt, messages, maxTokens = 1500, opts) {
    const key = this.getKey();
    if (!key) throw apiKeyError(this.getProvider());
    return this.getProvider() === 'openai'
      ? this._chatOpenAI(key, systemPrompt, messages, maxTokens, opts)
      : this._chatClaude(key, systemPrompt, messages, maxTokens, opts);
  },

  async _chatClaude(key, systemPrompt, messages, maxTokens, opts) {
    const model = this.getModel();
    const body = {
      model: model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages
    };
    if (opts && opts.effort && this.supportsThinking(model)) {
      body.thinking = { type: 'adaptive' };
      body.output_config = { effort: opts.effort };
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw apiAuthError('claude', res.status);
      const body = await res.text().catch(() => '');
      throw new Error(`Claude APIエラー (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    // thinkingブロックは中身が空で返るので、textブロックだけを拾う。
    // それが0個なら「成功したが本文が無い」状態 → 黙って空文字を返さない
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    if (!text.trim()) throw emptyReplyError(data.stop_reason === 'max_tokens');
    return text;
  },

  async _chatOpenAI(key, systemPrompt, messages, maxTokens, opts) {
    const body = {
      model: this.getModel(),
      max_completion_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages]
    };
    // GPT-5系も推論トークンが max_completion_tokens から引かれるので、
    // 長い入力では推論の量を下げて本文ぶんを残す
    if (opts && opts.effort && /^gpt-5/.test(body.model)) {
      body.reasoning_effort = opts.effort === 'medium' ? 'medium' : 'low';
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw apiAuthError('openai', res.status);
      const body = await res.text().catch(() => '');
      throw new Error(`OpenAI APIエラー (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const choice = (data.choices && data.choices[0]) || null;
    const text = (choice && choice.message && choice.message.content) || '';
    if (!text.trim()) throw emptyReplyError(choice && choice.finish_reason === 'length');
    return text;
  },

  /** 発表のAIフィードバック */
  async presentationFeedback(session) {
    const slideSummary = session.slides.map((s, i) =>
      `Slide ${i + 1}: ${PracticeUtil.fmtTime(s.timeMs)} 滞在, 発話: "${(s.transcript || '').slice(0, 500)}"`
    ).join('\n');

    const sys = `あなたは学会発表のコーチです。日本人研究者の英語プレゼン練習を分析し、日本語でフィードバックしてください。

出力はMarkdown形式で、以下の見出し構成に厳密に従ってください。スマホの狭い画面で読むため、各項目は2〜3行以内に収めてください。

## 良かった点
- (2つ、箇条書き)

## 次回直すべき3点
1. (最重要から順に、具体的な行動として書く)
2.
3.

## 英語表現の改善
実際の発話から1〜2箇所を引用し、以下の形式で示す:
> 元: (引用)
> 改善案: \`(より自然な英語)\`
理由を1行で。

強調には **太字**、英語表現には \`バッククォート\` を使ってください。`;

    const user = `発表時間: ${PracticeUtil.fmtTime(session.totalMs)} (目標 ${PracticeUtil.fmtTime(session.targetMs)})
WPM: ${session.wpm}
Filler語: ${session.fillerCount}回 (${session.fillerDetail})
スライドごとの記録:
${slideSummary}

全体の文字起こし:
${session.fullTranscript.slice(0, 6000)}`;

    return this.chat(sys, [{ role: 'user', content: user }]);
  },

  /** Q&Aシミュレータの質問生成・追撃。
   *  queued に想定質問(QGen が作ったもの)を渡すと、その場で考えた質問ではなく
   *  リストの質問を順に出す。想定質問は講演の内容に根ざしているので、
   *  「毎回どこかで聞いたような質問しか来ない」状態を避けられる。 */
  qaSystemPrompt(persona, session, queued) {
    const p = QGen.PERSONAS[persona] || QGen.PERSONAS.general;
    let sys = `You are simulating audience Q&A after a scientific conference talk. You are ${p.en}
The presentation transcript is below. Ask ONE question at a time in English, based on the actual content. After the presenter answers, either ask a natural follow-up question or briefly (1 sentence) evaluate the answer and ask a new question. Keep each message short (2-4 sentences). You may use **bold** for emphasis and \`backticks\` for technical terms, but do not use headings or long lists.`;
    if (queued && queued.length) {
      sys += `

QUESTIONS TO ASK:
Work through the numbered list below, in order, one question per message. Ask each one essentially as written (you may adjust the wording slightly so it sounds natural in conversation). After the presenter answers, you may ask at most ONE follow-up before moving on to the next number. Do not invent questions of your own until the list is exhausted; once it is, say so in one sentence and then continue freely.
${queued.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }
    return `${sys}

TRANSCRIPT:
${session.fullTranscript.slice(0, 6000)}`;
  }
};

/* ---------- 💡 質問づくり (v1.35.0) ----------
 * 講演の文字起こしから、質問の候補を作る共通の置き場。2か所から使う。
 *
 *   mode:'listener'  🎓講演・発表モード — 自分が聴衆。学会の質疑で自分が聞く質問。
 *                    ⚙設定の「自分の研究・関心」が質問の視点になる。
 *   mode:'presenter' 🎤発表練習のQ&A   — 自分が発表者。聴衆から飛んできそうな質問。
 *                    視点は「質問者のタイプ」(persona)で、自分の研究・関心は使わない
 *                    (発表内容そのものなので、視点にすると自問自答になる)。
 *
 * どちらもJSON配列で受け取る。読めなければ raw を呼び出し側がそのまま見せる
 * (質問が読めれば用は足りるので、形式の失敗で捨てない)。
 */
const QGen = {
  MAX_TOKENS: 6000,
  EFFORT: 'low',              // 速さ優先。学会の質疑応答に間に合わせるため

  TYPES: {
    memo:      { label: 'メモより',     icon: '📝' },
    confirm:   { label: '確認',         icon: '🔍' },
    interpret: { label: '別の解釈',     icon: '🔀' },
    consensus: { label: '通説との違い', icon: '📚' },
    propose:   { label: '解析の提案',   icon: '🧪' },
    relate:    { label: '自分の研究と', icon: '🤝' }
  },

  PERSONAS: {
    student: {
      ja: '大学院生',
      en: 'a curious graduate student. Ask basic but sincere questions.',
      qja: '好奇心のある大学院生。基本的だが真剣な質問をする。専門用語の意味や、なぜその手法を選んだのかを素直に聞く。'
    },
    general: {
      ja: '分野外の生物学者',
      en: 'a biologist from a different field. Ask questions about significance and methodology at a general level.',
      qja: '分野外の生物学者。この研究が何の役に立つのか、他の系にも当てはまるのか、手法の妥当性を一般的なレベルで聞く。'
    },
    specialist: {
      ja: '同分野の専門家',
      en: 'a specialist in the same field. Ask detailed technical questions.',
      qja: '同じ分野の専門家。手法の細部、パラメータの選び方、先行研究との食い違い、追加で行える解析まで踏み込んで聞く。'
    },
    critical: {
      ja: '厳しい査読者',
      en: 'a very critical reviewer. Ask sharp questions about causality, controls, and alternative interpretations.',
      qja: '厳しい査読者。対照実験の不足、因果と相関の混同、別の解釈の可能性、結論の言い過ぎを鋭く突く。ただし敵意ではなく、論文審査の場として聞く。'
    }
  },

  /** 種類の表示(未知の値が来ても落ちないように) */
  type(key) { return this.TYPES[key] || this.TYPES.confirm; },

  _listenerPrompt(partial) {
    return `あなたは、学会講演を聴いている研究者(以下「聴講者」)が質疑応答で良い質問をするのを助けるアシスタントです。講演の文字起こしを読み、聴講者がその中から選んで使える質問の候補を作ってください。

入力について:
- 文字起こしは自動音声認識の出力で、専門用語や固有名詞の聞き間違いを含みます。スライドは見えていません。
- 「聴講者の研究・関心」は、聴講者本人が書いた自己紹介です。質問の視点として使ってください。
- 「メモ」は聴講者が講演中に書いたもの、「重要マーク箇所」は聴講者が注目した場面です。${partial ? `
- ⚠ この文字起こしは講演の【途中まで】です。結論やまとめはまだ含まれていない可能性があります。すでに示された結果に基づいて質問を作り、「このあと話されそうなこと」を聞く質問は避けてください。` : `
- 文字起こしに質疑応答が含まれている場合、会場ですでに出た質問と同じ内容は出さないでください。`}

${this._commonRules()}

質問の種類(type):
- "memo": メモに聴講者自身が考えた質問が書かれている場合、その内容を変えずに自然な表現に整えたもの。あれば必ず含め、先頭に置く。
- "confirm": 手法・条件・定義の確認。気軽に聞けて、答えが結果の解釈に効くもの。
- "interpret": 同じデータから別の解釈が成り立たないか、対照実験、因果と相関の区別、結論の一般性を問うもの。
- "consensus": その分野で一般に受け入れられている理解と、この講演の主張・結果が食い違う点、または通説を更新する点を取り上げるもの。発表者が最も話したい新規性であることが多い。通説の側はあなた自身の知識に基づくので、断定せず "I had the impression that ... is generally thought to ... . How do you reconcile this with your result?" のように聞く。通説の内容に自信が持てないとき、食い違いが聞き間違いのせいかもしれないときは、この種類は出さない。
- "propose": 聴講者の専門(解析手法・持っているツールやデータ)から、発表者のデータに対して行える具体的な解析や比較を提案し、そこから何が分かりそうかを一言添えるもの(例: "Have you looked at ...? If ..., I would expect ... ")。押しつけにならない聞き方にする。聴講者の情報が無ければ、講演内容から自然に導かれる解析の提案にする。
- "relate": 聴講者の研究との接点を問うもの。講演後の会話や共同研究のきっかけになりうるもの。聴講者の情報もメモも無ければ出さない。

個数と順序:
- 全部で6〜8個。"memo" と "relate" 以外の種類はできるだけ1個以上含め、聴講者の研究・関心が書かれていれば "propose" は2個まで出してよい。
- 無理に数を合わせない。根拠の弱い質問を足すくらいなら少なくてよい。
- あなたが勧める順に並べる(重要マーク箇所に関するものは優先)。

${this._outputRules()}`;
  },

  _presenterPrompt(persona) {
    const p = this.PERSONAS[persona] || this.PERSONAS.general;
    return `あなたは、学会発表の練習をしている研究者(以下「発表者」)が質疑応答に備えるのを助けるアシスタントです。発表の文字起こしを読み、本番で聴衆から飛んできそうな質問を作ってください。発表者はこれを使って答える練習をします。

質問者の立場:
あなたは【${p.ja}】として質問します。${p.qja}

入力について:
- 文字起こしは、発表者が練習で話した内容を自動音声認識にかけたものです。専門用語や固有名詞の聞き間違いを含みます。スライドは見えていません。
- 文字起こしが途中で切れている、または一部しか無い場合は、聞き取れた範囲だけを根拠にしてください。

${this._commonRules()}
- 発表の中で明確に答えられている内容は聞かないでください。ただし、一度触れただけで説明が足りない点、聞き手が誤解しそうな点は、むしろ良い質問になります。
- 答えにくい質問を避けないでください。本番で困るのは、準備していなかった質問です。

質問の種類(type):
- "confirm": 手法・条件・定義の確認。発表では飛ばされたが、結果の解釈に必要なもの。
- "interpret": 同じデータから別の解釈が成り立たないか、対照実験の不足、因果と相関の区別、結論の一般性を問うもの。
- "consensus": その分野で一般に受け入れられている理解と、この発表の主張が食い違う点。断定はせず、どう両立するのかを尋ねる形にする。自信が持てないときはこの種類を出さない。
- "propose": 発表のデータに対して行える追加の解析や実験を提案し、そこから何が分かりそうかを添えるもの。

個数と順序:
- 全部で6〜8個。答えやすいものから難しいものへ並べる(本番もたいていその順で来る)。
- 無理に数を合わせない。根拠の弱い質問を足すくらいなら少なくてよい。

${this._outputRules(true)}`;
  },

  _commonRules() {
    return `良い質問の条件:
- 発表で実際に述べられた特定の結果・手法・主張を1つ取り上げ、冒頭でそれに短く触れてから聞く(例: "You showed that ... . Did you ...?")。どの発表にも当てはまる一般的な質問(他の生物種では? 今後の計画は?)は出さない。
- スライドにしか無い情報を前提にしない。
- 1問につき聞くことは1つ。2〜3文以内、声に出して20秒以内。
- 発表と同じ言語で書く(英語の発表なら英語)。平易で、そのまま読み上げられる文にする。
- 聞き間違いの疑いがある固有名詞を質問の中心に据えない。必要なら "the factor you mentioned" のように言い換える。
- 発表者を試したり誤りを指摘したりする調子にしない。発表者が話したくなる、議論が広がる聞き方にする。`;
  },

  _outputRules(forPresenter) {
    return `出力形式:
JSON配列だけを出力してください。前置き・後書き・コードブロックの記号は不要です。各要素は次の形です。
{"type":"confirm","ja":"何を聞く質問かを日本語で30字程度(一覧から選ぶときに読む)","q":"質問文","basis":"${forPresenter ? '発表のどの内容に対する質問かを日本語で短く' : '講演のどの内容に基づくかを日本語で短く'}"}`;
  },

  /** AIの応答から質問の配列を取り出す。読めなければ null(呼び出し側が raw を見せる) */
  parse(text) {
    const t = String(text || '').replace(/```json|```/g, '').trim();
    const a = t.indexOf('[');
    const b = t.lastIndexOf(']');
    if (a < 0 || b <= a) return null;
    let arr;
    try { arr = JSON.parse(t.slice(a, b + 1)); } catch (_) { return null; }
    if (!Array.isArray(arr)) return null;
    const items = arr
      .filter((x) => x && typeof x.q === 'string' && x.q.trim())
      .map((x) => ({
        type: this.TYPES[x.type] ? x.type : 'confirm',
        ja: String(x.ja || '').trim(),
        q: x.q.trim(),
        basis: String(x.basis || '').trim(),
        picked: false
      }));
    return items.length ? items : null;
  },

  /**
   * 質問を作る。戻り値 { items, raw }。items が空で raw だけのことがある。
   * ctx: { mode, transcript, title, speaker, venue, myResearch, note,
   *        markedText, partial, persona, limit }
   */
  async generate(ctx) {
    const c = ctx || {};
    const transcript = String(c.transcript || '');
    if (!transcript.trim()) throw new Error('文字起こしがありません。');
    const presenter = c.mode === 'presenter';
    const sys = presenter ? this._presenterPrompt(c.persona) : this._listenerPrompt(!!c.partial);

    let user = presenter
      ? `発表タイトル: ${c.title || '不明'}`
      : `講演タイトル: ${c.title || '不明'}\n発表者: ${c.speaker || '不明'}\n会場・セッション: ${c.venue || '不明'}`;
    if (!presenter) {
      user += `\n\n聴講者の研究・関心:\n${c.myResearch || '(未記入)'}`;
      if (c.note) user += `\n\nメモ:\n${c.note}`;
      if (c.markedText && c.markedText.length) {
        user += `\n\n重要マーク箇所:\n${c.markedText.join('\n')}`;
      }
    }
    user += `\n\n文字起こし:\n${transcript.slice(0, c.limit || 200000)}`;

    const text = await AI.chat(sys, [{ role: 'user', content: user }],
      this.MAX_TOKENS, { effort: this.EFFORT });
    const items = this.parse(text);
    return { items: items || [], raw: items ? '' : String(text || '').trim() };
  }
};

/* ---------- 会話バトルの言語ヘルプ(🔊読み上げ + 🇯🇵AI解説) ----------
 * 学会攻略・会話トレーニングの解説画面から使う。
 * 読み上げは端末のTTS(無料・オフライン可)、意味の解説はAI(APIキー必要)。
 */
const LangHelp = {
  /** 文字種から読み上げ言語を推定 */
  guessLang(text) {
    const t = String(text || '');
    if (/[가-힣]/.test(t)) return 'ko-KR';
    if (/[一-鿿]/.test(t) && !/[ぁ-んァ-ン]/.test(t)) return 'zh-HK';
    return 'en-US';
  },
  /** 外国語(英語・韓国語・広東語)を含むか。かなを含む文は日本語とみなす */
  hasForeign(text) {
    const t = String(text || '');
    if (/[A-Za-z가-힣]/.test(t)) return true;
    return /[一-鿿]/.test(t) && !/[ぁ-ゟァ-ヿ]/.test(t);
  },
  /** 複数テキストを順番に読み上げる */
  speakMany(texts) {
    try {
      speechSynthesis.cancel();
      const cleaned = texts.map((t) => String(t || '').replace(/[「」]/g, '').trim()).filter(Boolean);
      [...new Set(cleaned)].forEach((clean) => {
        const u = new SpeechSynthesisUtterance(clean);
        u.lang = this.guessLang(clean);
        u.rate = 0.92;
        speechSynthesis.speak(u);
      });
    } catch (_) { /* TTS非対応端末では何もしない */ }
  },

  /** 会話ターンの外国語文をAIが日本語で解説する */
  async explainTurn(ctx) {
    const sys = `あなたは日本人研究者の英語・韓国語学習を支えるコーチです。学会での会話ゲームの1場面について、外国語の文の意味を日本語で簡潔に解説してください。

出力形式(Markdown、全体で12行以内。スマホの狭い画面で読みます):
## 訳
- 出てきた英文(や外国語文)それぞれの自然な日本語訳を1行ずつ
## ポイント
- 重要な単語・イディオム・ニュアンスを2〜3個(用語は\`バッククォート\`、強調は**太字**)`;
    const parts = [`場面(状況説明):\n${ctx.situation || '(なし)'}`];
    if (ctx.chosen) parts.push(`わたしが選んだ返答: ${ctx.chosen}`);
    if (ctx.best && ctx.best !== ctx.chosen) parts.push(`ベストとされた返答: ${ctx.best}`);
    parts.push('これらに含まれる外国語文の意味とニュアンスを教えてください。');
    return AI.chat(sys, [{ role: 'user', content: parts.join('\n\n') }], 700);
  },

  /** 発話チェックの結果から、発音の改善ポイントを日本語で解説する */
  async pronunciationHint(card, result) {
    const langName = card.lang === 'ko' ? '韓国語' : '広東語';
    const sys = `あなたは日本人向けの${langName}発音コーチです。学習者が目標フレーズを発音し、音声認識(Whisper)が聞き取った結果と比べて、どこがどう違ったのかを日本語で具体的に解説してください。

前提: 音声認識の結果は完璧ではありません。認識のブレの可能性にも一言触れつつ、それでも改善に役立つ指摘をしてください。

出力形式(Markdown、全体で12行以内。スマホで読みます):
## どう聞こえたか
- 目標とのずれを1〜2行で(どの単語・どの音が別の音に化けたか)
## 直すポイント
- ずれた音を最大3つ。それぞれ「カタカナでの近似 → 口・舌の動かし方のコツ」の形で(用語は\`バッククォート\`、強調は**太字**)
## 練習のコツ
- 1行。次の1回で意識すること`;
    const user = `目標フレーズ(${langName}): ${card.t}
読み: ${card.k}(${card.r})
意味: ${card.ja}

Whisperが聞き取った結果: 「${result.text || '(無音/認識できず)'}」
文字一致率: ${Math.round((result.ratio || 0) * 100)}%

私の発音のどこを直せばよいですか?`;
    return AI.chat(sys, [{ role: 'user', content: user }], 800);
  },

  /** 解説画面に埋め込むボタン行のHTML */
  buttonsHtml() {
    return `
      <div class="lang-help-row">
        <button class="btn-control" data-lh="speak">🔊 発音を聞く</button>
        <button class="btn-control" data-lh="explain">🇯🇵 意味を教えて</button>
      </div>
      <div class="fb-explain-area hidden" data-lh-area></div>`;
  },

  /** buttonsHtml()を含むコンテナにイベントを配線する */
  wire(root, ctx) {
    if (!root) return;
    const speakBtn = root.querySelector('[data-lh="speak"]');
    const exBtn = root.querySelector('[data-lh="explain"]');
    const area = root.querySelector('[data-lh-area]');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        const texts = [ctx.chosen, ctx.best].filter((t) => t && this.hasForeign(t));
        if (!texts.length) {
          if (typeof showToast === 'function') showToast('読み上げる英文がこの場面にはありません');
          return;
        }
        this.speakMany(texts);
      });
    }
    if (exBtn && area) {
      exBtn.addEventListener('click', async () => {
        exBtn.disabled = true;
        area.classList.remove('hidden');
        area.innerHTML = '<p class="field-note">🤖 解説を考えています…</p>';
        try {
          const text = await this.explainTurn(ctx);
          area.innerHTML = `<div class="md-body">${renderMarkdown(text)}</div>`;
        } catch (err) {
          const msg = (typeof aiErrorText === 'function') ? aiErrorText(err) : '⚠ ' + err.message;
          area.innerHTML = `<p class="field-note" style="color:var(--danger)">${escapeHtml(msg)}</p>`;
          exBtn.disabled = false;
        }
      });
    }
  }
};
