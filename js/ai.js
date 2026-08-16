/* ConfQuest - AI連携 (Claude / OpenAI 切替可能 + 文字起こし) */
'use strict';

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
  async transcribe(blob, lang) {
    const key = this.getKey();
    if (!key) {
      throw new Error('OpenAI APIキーが未設定です。設定画面で入力してください。');
    }
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

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}` },
      body: form
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`文字起こしAPIエラー (${res.status}): ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    if (Array.isArray(data.segments) && data.segments.length > 0) {
      return data.segments.map((sg) => ({ start: sg.start, end: sg.end, text: sg.text }));
    }
    // segmentsが無い場合は全文を1セグメント扱い
    return data.text ? [{ start: 0, end: 0, text: data.text }] : [];
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
  async chat(systemPrompt, messages, maxTokens = 1500) {
    const key = this.getKey();
    if (!key) {
      throw new Error(`${this.providerLabel()} のAPIキーが設定されていません。設定画面で入力してください。`);
    }
    return this.getProvider() === 'openai'
      ? this._chatOpenAI(key, systemPrompt, messages, maxTokens)
      : this._chatClaude(key, systemPrompt, messages, maxTokens);
  },

  async _chatClaude(key, systemPrompt, messages, maxTokens) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: this.getModel(),
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Claude APIエラー (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    return (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
  },

  async _chatOpenAI(key, systemPrompt, messages, maxTokens) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: this.getModel(),
        max_completion_tokens: maxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenAI APIエラー (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message.content) || '';
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

  /** Q&Aシミュレータの質問生成・追撃 */
  qaSystemPrompt(persona, session) {
    const personas = {
      student: 'a curious graduate student. Ask basic but sincere questions.',
      general: 'a biologist from a different field. Ask questions about significance and methodology at a general level.',
      specialist: 'a specialist in the same field. Ask detailed technical questions.',
      critical: 'a very critical reviewer. Ask sharp questions about causality, controls, and alternative interpretations.'
    };
    return `You are simulating audience Q&A after a scientific conference talk. You are ${personas[persona] || personas.general}
The presentation transcript is below. Ask ONE question at a time in English, based on the actual content. After the presenter answers, either ask a natural follow-up question or briefly (1 sentence) evaluate the answer and ask a new question. Keep each message short (2-4 sentences). You may use **bold** for emphasis and \`backticks\` for technical terms, but do not use headings or long lists.

TRANSCRIPT:
${session.fullTranscript.slice(0, 6000)}`;
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
          area.innerHTML = `<p class="field-note" style="color:var(--danger)">${escapeHtml(err.message)}</p>`;
          exBtn.disabled = false;
        }
      });
    }
  }
};
