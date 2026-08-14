/* ConfQuest - AI連携 (Claude API + Whisper文字起こし) */
'use strict';

/** OpenAI Whisperによる文字起こし */
const STT = {
  getKey() {
    return localStorage.getItem('lq_openai_key') || '';
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
    const form = new FormData();
    form.append('file', blob, `recording.${ext}`);
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
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
  getKey() {
    return localStorage.getItem('lq_api_key') || '';
  },
  getModel() {
    return localStorage.getItem('lq_ai_model') || 'claude-sonnet-5';
  },

  /**
   * Claude APIを呼ぶ。messages: [{role, content}]
   * 戻り値: アシスタントのテキスト
   */
  async chat(systemPrompt, messages, maxTokens = 1500) {
    const key = this.getKey();
    if (!key) {
      throw new Error('APIキーが設定されていません。設定画面で入力してください。');
    }
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
      throw new Error(`APIエラー (${res.status}): ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    return (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
  },

  /** 発表のAIフィードバック */
  async presentationFeedback(session) {
    const slideSummary = session.slides.map((s, i) =>
      `Slide ${i + 1}: ${PracticeUtil.fmtTime(s.timeMs)} 滞在, 発話: "${(s.transcript || '').slice(0, 500)}"`
    ).join('\n');

    const sys = `あなたは学会発表のコーチです。日本人研究者の英語プレゼン練習を分析し、日本語でフィードバックしてください。
以下の形式で簡潔に:
1. 良かった点(2つ)
2. 次回の練習で直すべき点(最重要の3つ、具体的に)
3. 言い回しの改善例(実際の発話から1-2箇所を引用し、より自然な英語表現を提案)`;

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
The presentation transcript is below. Ask ONE question at a time in English, based on the actual content. After the presenter answers, either ask a natural follow-up question or briefly (1 sentence) evaluate the answer and ask a new question. Keep each message short.

TRANSCRIPT:
${session.fullTranscript.slice(0, 6000)}`;
  }
};
