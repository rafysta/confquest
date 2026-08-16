/* ConfQuest - 学会講演の録音・要約モジュール */
'use strict';

const Talk = {
  recorder: null,
  chunks: [],
  audioBlob: null,
  audioUrl: null,
  current: null,
  timer: null,
  paused: false,
  pauseStartedAt: 0,

  /* ---------- 録音 ---------- */
  async start(meta) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: true, channelCount: 1 }
    });
    this.chunks = [];
    this.audioBlob = null;
    // 32kbps mono: 30分で約7MB。Whisperの25MB上限に余裕をもって収まる
    let opts = { audioBitsPerSecond: 32000 };
    try {
      this.recorder = new MediaRecorder(stream, opts);
    } catch (_) {
      this.recorder = new MediaRecorder(stream);
    }
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(5000); // 5秒ごとにデータを確保(長時間録音でのメモリ対策)
    this.setupMeter(stream);   // 🎙️ 音量インジケーター

    this.current = {
      id: Date.now(),
      date: new Date().toISOString(),
      title: meta.title || '無題の講演',
      speaker: meta.speaker || '',
      venue: meta.venue || '',
      lang: meta.lang != null ? meta.lang : '',   // '' = Whisperの自動判定
      marks: [],
      note: '',
      transcript: '',
      summary: '',
      durationMs: 0,
      startTime: Date.now(),
      pausedMs: 0
    };
    this.paused = false;
    this.timer = setInterval(() => this.updateUI(), 500);
    this.updateUI();
  },

  /* ---------- 🎙️ 音量インジケーター ---------- */
  meterCtx: null,
  analyser: null,
  meterTimer: null,
  _meterBuf: null,
  _quietSince: 0,

  /** マイク入力をWeb Audioで監視する(非対応端末では静かに諦める) */
  setupMeter(stream) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) throw new Error('no AudioContext');
      this.meterCtx = new Ctx();
      const src = this.meterCtx.createMediaStreamSource(stream);
      this.analyser = this.meterCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      src.connect(this.analyser);   // 出力(スピーカー)へはつながない
      this._meterBuf = new Float32Array(this.analyser.fftSize);
      this._quietSince = Date.now();
      this.meterTimer = setInterval(() => this.updateMeter(), 120);
      const box = document.getElementById('talk-meter');
      if (box) box.classList.remove('hidden');
    } catch (_) {
      const box = document.getElementById('talk-meter');
      if (box) box.classList.add('hidden');
    }
  },

  /**
   * 音量(RMS)を「量と評価」に変換する。テスト可能な純関数。
   * 戻り値: { pct: 0-100, zone: 'quiet'|'ok'|'loud', label }
   */
  meterInfo(rms) {
    const db = 20 * Math.log10(Math.max(rms, 1e-6));   // -120〜0 dBFS
    const pct = Math.max(0, Math.min(100, Math.round((db + 60) / 60 * 100)));
    if (db < -45) return { pct, zone: 'quiet', label: '🔇 音が小さいようです — 端末を音源に近づけてください' };
    if (db > -6) return { pct, zone: 'loud', label: '⚠ 大きすぎるかも(音割れ注意) — 少し離すと安全です' };
    return { pct, zone: 'ok', label: '✓ 十分な音量で録音できています' };
  },

  updateMeter() {
    if (!this.analyser) return;
    const fill = document.getElementById('talk-meter-fill');
    const label = document.getElementById('talk-meter-label');
    const warn = document.getElementById('talk-meter-warn');
    if (!fill || !label) return;
    if (this.paused) {
      label.textContent = '⏸ 一時停止中(音量の監視も停止)';
      fill.style.width = '0%';
      fill.dataset.zone = 'quiet';
      this._quietSince = Date.now();
      if (warn) warn.classList.add('hidden');
      return;
    }
    this.analyser.getFloatTimeDomainData(this._meterBuf);
    let sum = 0;
    for (let i = 0; i < this._meterBuf.length; i++) sum += this._meterBuf[i] * this._meterBuf[i];
    const info = this.meterInfo(Math.sqrt(sum / this._meterBuf.length));
    fill.style.width = info.pct + '%';
    fill.dataset.zone = info.zone;
    label.textContent = info.label;
    // 10秒以上「小さすぎ」が続いたら強めの警告
    if (info.zone === 'quiet') {
      if (warn) warn.classList.toggle('hidden', Date.now() - this._quietSince < 10000);
    } else {
      this._quietSince = Date.now();
      if (warn) warn.classList.add('hidden');
    }
  },

  stopMeter() {
    clearInterval(this.meterTimer);
    this.meterTimer = null;
    this.analyser = null;
    if (this.meterCtx) {
      try { this.meterCtx.close(); } catch (_) { /* 既に閉じている */ }
      this.meterCtx = null;
    }
  },

  elapsedMs() {
    if (!this.current) return 0;
    let e = Date.now() - this.current.startTime - this.current.pausedMs;
    if (this.paused) e -= (Date.now() - this.pauseStartedAt);
    return Math.max(0, e);
  },

  updateUI() {
    const el = document.getElementById('talk-elapsed');
    if (el) el.textContent = PracticeUtil.fmtTime(this.elapsedMs());
    const mk = document.getElementById('talk-mark-count');
    if (mk && this.current) {
      mk.textContent = this.current.marks.length
        ? `${this.current.marks.length}箇所にマーク` : 'マークなし';
    }
    // 推定ファイルサイズ(Whisper上限の目安)
    const warn = document.getElementById('talk-size-warn');
    if (warn) {
      const mb = (this.elapsedMs() / 60000) * 0.24; // 32kbps ≒ 0.24MB/分
      warn.classList.toggle('hidden', mb < 22);
    }
  },

  /** 「今の話は重要」マークを打つ */
  addMark() {
    if (!this.current || this.paused) return;
    this.current.marks.push(Math.round(this.elapsedMs() / 1000));
    this.updateUI();
    const btn = document.getElementById('btn-talk-mark');
    if (btn) {
      btn.classList.add('marked');
      setTimeout(() => btn.classList.remove('marked'), 400);
    }
  },

  togglePause() {
    if (!this.recorder) return;
    if (!this.paused) {
      this.paused = true;
      this.pauseStartedAt = Date.now();
      if (this.recorder.state === 'recording') this.recorder.pause();
    } else {
      this.current.pausedMs += Date.now() - this.pauseStartedAt;
      this.paused = false;
      if (this.recorder.state === 'paused') this.recorder.resume();
    }
    const btn = document.getElementById('btn-talk-pause');
    if (btn) btn.textContent = this.paused ? '▶ 再開' : '⏸ 一時停止';
    document.getElementById('talk-rec-dot').classList.toggle('paused', this.paused);
  },

  stop() {
    return new Promise((resolve) => {
      clearInterval(this.timer);
      this.stopMeter();
      if (!this.recorder || this.recorder.state === 'inactive') { resolve(); return; }
      this.current.durationMs = this.elapsedMs();
      this.recorder.onstop = () => {
        this.audioBlob = new Blob(this.chunks, { type: this.recorder.mimeType });
        if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.recorder.stream.getTracks().forEach((t) => t.stop());
        resolve();
      };
      this.recorder.stop();
    });
  },

  /* ---------- 文字起こし ---------- */
  async transcribe() {
    if (!this.audioBlob || this.audioBlob.size === 0) {
      throw new Error('録音データがありません。');
    }
    const MAX = 24 * 1024 * 1024;
    if (this.audioBlob.size > MAX) {
      throw new Error(
        `録音が大きすぎます (${(this.audioBlob.size / 1048576).toFixed(1)}MB)。` +
        'APIの上限は25MBです。講演ごとに分けて録音してください。'
      );
    }
    const segments = await STT.transcribe(this.audioBlob, this.current.lang);
    this.current.transcript = segments.map((s) => s.text.trim()).join(' ');
    // マーク時刻の前後を抜き出して「注目箇所」にする
    this.current.markedText = this.current.marks.map((t) => {
      const near = segments.filter((s) => s.end >= t - 25 && s.start <= t + 10);
      const txt = near.map((s) => s.text.trim()).join(' ');
      return `[${PracticeUtil.fmtTime(t * 1000)}] ${txt}`.trim();
    }).filter((s) => s.length > 12);
    return this.current.transcript;
  },

  /* ---------- 要約 ---------- */
  async summarize() {
    const c = this.current;
    if (!c.transcript) throw new Error('文字起こしがありません。');

    const sys = `あなたは生命科学分野の研究者を補佐するアシスタントです。学会講演の文字起こしを読み、後でPCで整理しやすい要約を日本語で作成してください。

出力はMarkdown形式で、以下の見出し構成に従ってください。内容が読み取れない項目は「(聞き取れず)」と書いてください。専門用語・遺伝子名・手法名は英語のまま残してください。

## 概要
3〜4文で研究の全体像。

## 背景と問い
何を明らかにしようとしたか。

## 手法
使われた実験・解析手法を箇条書きで。

## 主要な結果
重要な順に3〜5点、箇条書きで。数値やデータがあれば含める。

## 結論とインパクト

## 気になった点・質問候補
この講演に対してその場で聞けそうな質問を2〜3個、英語で。

## キーワード
重要語を10個程度、カンマ区切りで(英語)。`;

    let user = `講演タイトル: ${c.title}
発表者: ${c.speaker || '不明'}
会場・セッション: ${c.venue || '不明'}
録音時間: ${PracticeUtil.fmtTime(c.durationMs)}`;

    if (c.markedText && c.markedText.length) {
      user += `\n\n聴講者が「重要」とマークした箇所(特に丁寧に要約に反映してください):\n${c.markedText.join('\n')}`;
    }
    if (c.note) user += `\n\n聴講者のメモ:\n${c.note}`;
    user += `\n\n文字起こし:\n${c.transcript.slice(0, 40000)}`;

    c.summary = await AI.chat(sys, [{ role: 'user', content: user }], 3000);
    return c.summary;
  },

  /* ---------- 共有 ---------- */
  /** 共有用のMarkdown全文を組み立てる */
  buildDocument(includeTranscript) {
    const c = this.current;
    const d = new Date(c.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    let doc = `# ${c.title}\n\n`;
    doc += `- 発表者: ${c.speaker || '不明'}\n`;
    if (c.venue) doc += `- 会場・セッション: ${c.venue}\n`;
    doc += `- 日時: ${dateStr}\n`;
    doc += `- 録音時間: ${PracticeUtil.fmtTime(c.durationMs)}\n`;
    if (c.note) doc += `\n## 自分のメモ\n\n${c.note}\n`;
    doc += `\n${c.summary}\n`;
    if (c.markedText && c.markedText.length) {
      doc += `\n## マークした箇所\n\n${c.markedText.map((t) => `- ${t}`).join('\n')}\n`;
    }
    if (includeTranscript && c.transcript) {
      doc += `\n---\n\n## 文字起こし全文\n\n${c.transcript}\n`;
    }
    doc += `\n---\n_ConfQuest v${APP_VERSION} で作成_\n`;
    return doc;
  },

  fileName() {
    const c = this.current;
    const d = new Date(c.date);
    const safe = c.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
    return `${d.toISOString().slice(0, 10)}_${safe}.md`;
  },

  /** 共有シートを開く(主にAndroid用)。
   *  ⚠ ブラウザの共有は1クリックにつき1回しか呼べない(2回目は
   *  "Must be handling a user gesture" エラーになる)ため、事前に
   *  ファイル共有かテキスト共有かを決めて1回だけ呼ぶ。
   *  共有が使えない・拒否された環境(PCなど)では自動でダウンロードに切り替える。 */
  async share(includeTranscript, forceText) {
    const doc = this.buildDocument(includeTranscript);
    const name = this.fileName();

    // 共有ペイロードを先に決める(share()の呼び出しは1回だけ)
    let payload = null;
    if (!forceText && navigator.share && navigator.canShare && typeof File !== 'undefined') {
      try {
        const file = new File([doc], name, { type: 'text/markdown' });
        if (navigator.canShare({ files: [file] })) {
          payload = { files: [file], title: this.current.title };
        }
      } catch (_) { /* File非対応の環境ではテキスト共有へ */ }
    }
    if (!payload && navigator.share) {
      payload = { title: this.current.title, text: doc };
    }
    if (!payload) {
      // 共有API自体が無い環境 → ダウンロードで代替
      this.download(includeTranscript);
      return 'download';
    }
    try {
      await navigator.share(payload);
      return payload.files ? 'file' : 'text';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'cancelled';
      if (payload.files) {
        // ファイル共有が拒否された。同じタップ内では共有を呼び直せないので、
        // 「テキストで共有し直す」ボタン(=新しいタップ)を出してもらう
        return 'file-failed';
      }
      // テキスト共有まで拒否された環境 → ファイル保存に切り替える(内容は同じ)
      this.download(includeTranscript);
      return 'download';
    }
  },

  /** ファイルとして保存 */
  download(includeTranscript) {
    const blob = new Blob([this.buildDocument(includeTranscript)],
      { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.fileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },

  async copy(includeTranscript) {
    await navigator.clipboard.writeText(this.buildDocument(includeTranscript));
  },

  /* ---------- 保存 ---------- */
  save() {
    const c = this.current;
    const list = JSON.parse(localStorage.getItem('lq_talks') || '[]');
    list.unshift({
      id: c.id, date: c.date, title: c.title, speaker: c.speaker, venue: c.venue,
      durationMs: c.durationMs, summary: c.summary, transcript: c.transcript,
      markedText: c.markedText || [], note: c.note
    });
    // 端末の保存領域を圧迫しないよう50件まで
    localStorage.setItem('lq_talks', JSON.stringify(list.slice(0, 50)));
  },

  load(id) {
    const list = JSON.parse(localStorage.getItem('lq_talks') || '[]');
    const found = list.find((t) => t.id === id);
    if (found) {
      this.current = Object.assign({ marks: [], lang: 'en' }, found);
      this.audioUrl = null;
    }
    return found;
  }
};
