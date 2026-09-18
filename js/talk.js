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

  /* ---------- 録音 ----------
   * 長時間対応: 一定のサイズ/時間ごとに録音を「セグメント」として確定し、新しい
   * MediaRecorderで続きを録る。各セグメントは独立した完全な音声ファイルになるので、
   * Whisperの25MB制限を気にせず何時間でも録音できる。
   *
   * ⚠ ここは一度壊した箇所なので注意してください(v1.30.1で修正)。
   * MediaRecorder.stop() を呼んでも、最後の dataavailable と onstop は
   * 「非同期」で後から届きます。受け皿を this.chunks のような共有の場所にすると、
   * すぐ次のレコーダーを起動した時点で受け皿が差し替わっているため、
   * 古いレコーダーの最後のデータが【次のセグメントの中に紛れ込みます】。
   * その結果、パート2以降は別ストリームの断片が挟まったファイルになり、
   * 再生できず、Whisperにも "Invalid file format" (400) で弾かれます。
   * → 受け皿は必ずレコーダーごとのクロージャに閉じ込めること。
   */
  SEGMENT_SEC: 2700,                    // 45分。多くの講演は1パートに収まる
  SEGMENT_BYTES: 18 * 1024 * 1024,      // 18MB(APIの25MB上限に余裕を持たせる)
  stream: null,
  segments: [],       // 確定済みセグメント [{blob, startSec}]
  segStartSec: 0,     // 現在録音中セグメントの開始位置(全体の経過秒)
  audioUrls: [],      // 再生用URL(セグメントごと)

  async start(meta) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: true, channelCount: 1 }
    });
    this.stream = stream;
    this.segments = [];
    this.segStartSec = 0;
    this.chunks = [];
    this.audioBlob = null;
    if (this.audioUrls) this.audioUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) { /* 無視 */ } });
    this.audioUrls = [];
    this._startRecorder();
    this.setupMeter(stream);   // 🎙️ 音量インジケーター

    this.current = {
      id: Date.now(),
      date: new Date().toISOString(),
      kind: meta.kind === 'meeting' ? 'meeting' : 'talk',
      title: meta.title || (meta.kind === 'meeting' ? '無題のミーティング' : '無題の講演'),
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

  /**
   * 📁 録音装置で録った音声ファイルを、録音したのと同じ状態にセットする(v1.31.0)。
   * AudioImport.prepare() が作ったセグメントをそのまま Talk.segments に入れるので、
   * このあとの文字起こし・要約・共有・保存・やり直しは録音とまったく同じ経路を通る。
   *
   * prepared: { segments:[{blob,startSec,durationSec}], notes, durationSec, files }
   */
  loadImported(meta, prepared) {
    this.discardAudio();
    clearInterval(this.timer);
    this.timer = null;
    this.stream = null;
    this.recorder = null;
    this.paused = false;

    this.segments = prepared.segments;
    this.audioUrls = this.segments.map((s) => URL.createObjectURL(s.blob));
    this.audioUrl = this.audioUrls[0] || null;
    this.audioBlob = this.segments[0] ? this.segments[0].blob : null;

    const names = (prepared.files || []).map((f) => f.name);
    this.current = {
      id: Date.now(),
      date: new Date().toISOString(),
      kind: meta.kind === 'meeting' ? 'meeting' : 'talk',
      title: meta.title || (meta.kind === 'meeting' ? '無題のミーティング' : '無題の講演'),
      speaker: meta.speaker || '',
      venue: meta.venue || '',
      lang: meta.lang != null ? meta.lang : '',
      marks: [],                        // 読み込みでは「ここは重要」が押せないので常に空
      note: '',
      transcript: '',
      summary: '',
      durationMs: Math.round((prepared.durationSec || 0) * 1000),
      startTime: Date.now(),
      pausedMs: 0,
      source: 'import',                 // 録音ではなく読み込み(結果画面の表示に使う)
      sourceFiles: names,
      // 読み込めなかったファイルの記録。transcribe() が partNotes を作り直すので、
      // そちらに引き継がせるために importNotes として別に持っておく
      importNotes: (prepared.notes && prepared.notes.length) ? prepared.notes.slice() : null,
      partNotes: (prepared.notes && prepared.notes.length) ? prepared.notes.slice() : null
    };
    return this.current;
  },

  /** 現在のストリームで新しいMediaRecorderを開始する */
  _startRecorder() {
    // ★受け皿はこのレコーダー専用にする(this.chunks を参照してはいけない)
    const chunks = [];
    let rec;
    // 32kbps mono: 1時間で約14MB。Whisperの25MB上限に余裕をもって収まる
    try {
      rec = new MediaRecorder(this.stream, { audioBitsPerSecond: 32000 });
    } catch (_) {
      rec = new MediaRecorder(this.stream);
    }
    rec._chunks = chunks;
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    this.recorder = rec;
    this.chunks = chunks;      // 互換のため「いまのレコーダーの受け皿」を指しておく
    rec.start(5000);           // 5秒ごとにデータを確保(長時間録音でのメモリ対策)
  },

  /** いま録音中のセグメントのバイト数 */
  currentBytes() {
    const c = this.recorder && this.recorder._chunks;
    if (!c) return 0;
    let n = 0;
    for (let i = 0; i < c.length; i++) n += c[i].size;
    return n;
  },

  /**
   * いまのレコーダーを閉じて1セグメントとして確定する。
   * 先に「場所」を確保してから閉じるので、非同期で確定しても順番が入れ替わらない。
   */
  _closeSegment() {
    const rec = this.recorder;
    if (!rec || rec.state === 'inactive') return null;
    const slot = { blob: null, startSec: this.segStartSec };
    this.segments.push(slot);
    rec.onstop = () => {
      slot.blob = new Blob(rec._chunks, { type: rec.mimeType || 'audio/webm' });
    };
    this.segStartSec = this.elapsedMs() / 1000;
    rec.stop();
    return slot;
  },

  /**
   * サイズか時間が上限に達していたらセグメントを確定して録音を続ける。
   * サイズでも見るのは、端末によっては指定したビットレートが効かず、
   * 時間だけで区切ると1パートが25MBを超えてしまうことがあるため。
   * (updateUIから呼ばれる)
   */
  maybeRotate() {
    if (!this.recorder || this.paused || this.recorder.state !== 'recording') return;
    const secs = this.elapsedMs() / 1000 - this.segStartSec;
    if (secs < this.SEGMENT_SEC && this.currentBytes() < this.SEGMENT_BYTES) return;
    this._closeSegment();
    this._startRecorder();   // 同じストリームで即座に続きを録る
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
    // 長時間録音: 10分ごとにセグメントを確定(Whisper 25MB制限の回避)
    this.maybeRotate();
    // メモリの目安として2時間で注意を出す(上限ではない)
    const warn = document.getElementById('talk-size-warn');
    if (warn) warn.classList.toggle('hidden', this.elapsedMs() < 2 * 3600 * 1000);
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
      const rec = this.recorder;
      const slot = { blob: null, startSec: this.segStartSec };
      this.segments.push(slot);
      rec.onstop = () => {
        slot.blob = new Blob(rec._chunks, { type: rec.mimeType || 'audio/webm' });
        // 直前のセグメントの確定がまだ終わっていない可能性があるので少し待つ
        let waited = 0;
        const finish = () => {
          if (this.segments.some((sg) => !sg.blob) && waited < 60) {
            waited++;
            setTimeout(finish, 30);
            return;
          }
          this.segments = this.segments.filter((sg) => sg.blob && sg.blob.size > 0);
          this.audioUrls = this.segments.map((sg) => URL.createObjectURL(sg.blob));
          this.audioUrl = this.audioUrls[0] || null;
          this.audioBlob = this.segments[0] ? this.segments[0].blob : null;
          if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
          resolve();
        };
        finish();
      };
      rec.stop();
    });
  },

  /* ---------- 音声の扱い ----------
   * 既定では録音音声は保存しない。要約が終わって画面を離れた時点で
   * メモリから破棄する(要約・文字起こしは残る)。
   * 残したい場合だけ TalkAudio(backup.js)に明示的に保存する。 */

  /** メモリ上に再生できる録音があるか */
  hasMemoryAudio() {
    if (this.segments && this.segments.some((s) => s && s.blob && s.blob.size > 0)) return true;
    return !!(this.audioBlob && this.audioBlob.size > 0);
  },

  /** メモリ上の録音を破棄する(保存済みのIndexedDBには触らない) */
  discardAudio() {
    if (this.audioUrls) {
      this.audioUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (_) { /* 無視 */ } });
    }
    this.audioUrls = [];
    this.audioUrl = null;
    this.audioBlob = null;
    this.segments = [];
    this.chunks = [];
  },

  /* ---------- 文字起こし ---------- */

  /**
   * そのBlobが「ちゃんとした音声ファイル」として始まっているかを見る。
   * webm/ogg は先頭の数バイトで判別できる。判別できない形式は通す(誤って弾かない)。
   * 壊れたパートをAPIに送っても400で弾かれるだけなので、手前で気づくためのもの。
   */
  async looksPlayable(blob) {
    if (!blob || blob.size < 8) return false;
    const t = String(blob.type || '').toLowerCase();
    try {
      const h = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
      if (t.indexOf('webm') >= 0 || t.indexOf('matroska') >= 0) {
        // EBML: 1A 45 DF A3
        return h[0] === 0x1A && h[1] === 0x45 && h[2] === 0xDF && h[3] === 0xA3;
      }
      if (t.indexOf('ogg') >= 0) {
        // "OggS"
        return h[0] === 0x4F && h[1] === 0x67 && h[2] === 0x67 && h[3] === 0x53;
      }
      if (t.indexOf('wav') >= 0) {
        // "RIFF" — 読み込んだ音声ファイルを変換したもの
        return h[0] === 0x52 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x46;
      }
      return true;   // mp4/mp3など、ここでは判別しない形式は通す
    } catch (_) {
      return true;
    }
  },

  /**
   * 全セグメントを順に文字起こしして結合する。onProgress(done, total)で進捗を通知。
   * 1つのパートが駄目でも全体を止めず、無事なパートだけで文字起こしを作る。
   * 駄目だったパートは current.partNotes に理由つきで残す。
   */
  async transcribe(onProgress) {
    const segs = (this.segments && this.segments.length)
      ? this.segments
      : (this.audioBlob ? [{ blob: this.audioBlob, startSec: 0 }] : []);
    if (!segs.length) throw new Error('録音データがありません。');

    const MAX = 24 * 1024 * 1024;
    // 読み込みの段階で落ちたファイルがあれば、その記録を引き継ぐ(上書きして消さない)
    const notes = (this.current && this.current.importNotes) ? this.current.importNotes.slice() : [];
    const usable = [];
    for (let i = 0; i < segs.length; i++) {
      const sg = segs[i];
      const part = i + 1;
      if (!sg.blob || sg.blob.size === 0) {
        notes.push({ part, why: '中身が空でした' });
      } else if (sg.blob.size > MAX) {
        notes.push({ part, why: `大きすぎます (${(sg.blob.size / 1048576).toFixed(1)}MB / 上限25MB)` });
      } else if (!(await this.looksPlayable(sg.blob))) {
        notes.push({ part, why: '音声ファイルとして壊れていました(再生もできません)' });
      } else {
        usable.push({ sg, part });
      }
    }

    if (!usable.length) {
      const err = new Error('文字起こしに使えるパートがありませんでした。\n' +
        notes.map((n) => `・${n.file ? n.file : 'パート' + n.part}: ${n.why}`).join('\n'));
      err.partNotes = notes;
      this.current.partNotes = notes;
      throw err;
    }

    const all = [];
    for (let k = 0; k < usable.length; k++) {
      if (onProgress) onProgress(k + 1, usable.length);
      try {
        const res = await STT.transcribe(usable[k].sg.blob, this.current.lang);
        // セグメント内の相対時刻を、録音全体の時刻に直して結合する
        res.forEach((x) => all.push({
          start: x.start + usable[k].sg.startSec,
          end: x.end + usable[k].sg.startSec,
          text: x.text
        }));
      } catch (err) {
        // APIキーの問題は全体を止める(1パートずつ失敗させても意味がない)
        if (err && (err.noKey || err.badKey)) throw err;
        notes.push({ part: usable[k].part, why: (err && err.message) || '不明なエラー' });
      }
    }

    this.current.partNotes = notes;
    if (!all.length) {
      const err = new Error('どのパートも文字起こしできませんでした。\n' +
        notes.map((n) => `・${n.file ? n.file : 'パート' + n.part}: ${n.why}`).join('\n'));
      err.partNotes = notes;
      throw err;
    }

    this.current.transcript = all.map((x) => x.text.trim()).join(' ');
    // マーク時刻の前後を抜き出して「注目箇所」にする
    this.current.markedText = (this.current.marks || []).map((t) => {
      const near = all.filter((x) => x.end >= t - 25 && x.start <= t + 10);
      const txt = near.map((x) => x.text.trim()).join(' ');
      return `[${PracticeUtil.fmtTime(t * 1000)}] ${txt}`.trim();
    }).filter((x) => x.length > 12);
    return this.current.transcript;
  },

  /* ---------- 要約 ----------
   * ⚠ max_tokens は「思考+本文」の合計です。
   *   Sonnet 5 以降のモデルは thinking を指定しなくても考えてから答えるため、
   *   思考ぶんもこの予算から引かれます。3000 にしていた頃は、80分級の
   *   長い文字起こしだと思考だけで使い切り、本文が1文字も返らないまま
   *   「要約なし」で保存されていました。
   *   80分の会議(英語で約4万字)を通すため、予算を16000に上げ、
   *   effort を下げて思考が伸びすぎないようにしています。
   */
  SUMMARY_MAX_TOKENS: 16000,
  SUMMARY_EFFORT: 'medium',
  TRANSCRIPT_LIMIT: 200000,   // AIに渡す文字起こしの上限(80分の会議で約4万字)

  async summarize() {
    const c = this.current;
    if (!c.transcript) throw new Error('文字起こしがありません。');
    const sys = c.kind === 'meeting' ? this._meetingPrompt() : this._talkPrompt();

    let user = `${c.kind === 'meeting' ? '会議名' : '講演タイトル'}: ${c.title}
${c.kind === 'meeting' ? '参加者(出席者の一覧。全員が発言したとは限らない)' : '発表者'}: ${c.speaker || '不明'}
${c.kind === 'meeting' ? '場所' : '会場・セッション'}: ${c.venue || '不明'}
録音時間: ${c.source === 'text' ? '不明(文字起こしテキストから作成)' : PracticeUtil.fmtTime(c.durationMs)}`;

    if (c.markedText && c.markedText.length) {
      user += `\n\n「重要」とマークした箇所(特に丁寧に反映してください):\n${c.markedText.join('\n')}`;
    }
    if (c.note) user += `\n\nメモ:\n${c.note}`;

    // 長すぎる場合だけ切るが、黙っては切らない(要約に注記させる)
    const body = c.transcript.slice(0, this.TRANSCRIPT_LIMIT);
    user += `\n\n文字起こし:\n${body}`;
    if (body.length < c.transcript.length) {
      user += `\n\n(※ 文字起こしが長いため、全${c.transcript.length}文字のうち冒頭${body.length}文字までを渡しています。`
        + '後半が欠けていることを要約の冒頭に1行だけ注記してください)';
    }

    const text = await AI.chat(sys, [{ role: 'user', content: user }],
      this.SUMMARY_MAX_TOKENS, { effort: this.SUMMARY_EFFORT });
    if (!text || !text.trim()) throw new Error('要約が空でした。もう一度お試しください。');
    c.summary = text;
    return c.summary;
  },

  /** 👥 ミーティング用: 議事録形式。
   *  ⚠ 話者ラベルの無い文字起こしが入力なので、「全員に発言を割り当てる」
   *  形式にすると、参加者欄の名前を埋めるために発言を捏造する
   *  (9/17ラボ会議で、発言していない参加者に役割が付いた/伝聞が本人の発言になった/
   *   一人称の作業が別人のTODOになった)。
   *  → 話者は確実なときだけ、決定とTODOは根拠の引用つき、提案は別の見出しへ。 */
  _meetingPrompt() {
    return `あなたは研究室ミーティングの議事録を作るアシスタントです。録音の文字起こしを読み、日本語で議事録を作成してください。
この議事録は数週間〜数か月後に「何が報告され、どんな結果で、何が議論され、次に何をすることになったか」を確認するために使います。読みやすさやもっともらしさより正確さを優先し、分からないことは分からないと書いてください。

## 入力について
- 根拠にしてよいのは、文字起こし・「重要」マーク箇所・ユーザーのメモだけです。
- 文字起こしは自動音声認識の出力です。話者ラベルが無く、専門用語や固有名詞の聞き間違いを含みます。
- 「参加者」欄は出席者の一覧で、名前の表記の参考にしてよいですが、全員が発言したとは限りません。発言が確認できない人に、発言・意見・担当を割り当てないでください。
- メモに用語や人名の正しい表記が書かれている場合は、それを優先してください。

## 用語と数値
- 専門用語、gene/protein名、手法名、project名、ジャーナル名は英語表記のまま残す(カタカナにしない。キーワードも同じ)。
- 聞き間違いと思われる語を、確信が無いのに別の語へ直さない。文脈に合わない語は日本語に訳さず、元の語のまま「[要確認]」を付ける。メモや文脈から正しい語が確実に分かるときだけ直す。
- 数値・単位・sample数・read数・割合・resolution・thresholdはできるだけ残し、何を数えた値かを必ず添える。別々の対象の数値を1文に混ぜない。
- 数値は換算しない(billion/million を 億/万 に直さず、聞こえたとおり英語で書く)。

## 話者
- 名前で呼びかけられた直後の応答、自分の名乗り、司会の指名など、確実な手がかりがあるときだけ人名を使う。迷ったら人名を付けない。
- 「AがBから聞いた」「Bが言っていた」は、Aの発言(Bの伝聞)として扱う。名前が出ただけの人を発言者にしない。
- 研究テーマや立場だけを根拠に話者を決めない。
- "I" や "we" の作業予定は、その話者が確実に分かるときだけ担当者にする。

## 区別すること
観察された結果 / 解釈・仮説 / 質問・懸念 / 提案 / 明示的な合意 / 依頼・引き受けた作業、を混ぜない。
- 提案や質問は、相手が同意・引き受けた発言が無いかぎり「決定事項」「Action items」に入れず、「今後検討する事項」に入れる。
- 期限は明示されたものだけ。無ければ「未指定」。

出力はMarkdown形式で、以下の見出し構成に従ってください。該当が無い項目は「(なし)」と書いてください。冒頭に「人名は文字起こしの内容から判断したもので、誤りがありえます」と1行だけ注記してください。

## 要点
会議全体の重要点を3〜5項目。30秒で読める長さ。

## 議題と主な結果
議題ごとに小見出し(### 議題名)を立てる。研究報告は次の4項目で、事務連絡などは要点の箇条書きだけでよい。長い研究報告は、示された解析・図のまとまりごとに結果を拾い、後半を省略しない。
- **報告・目的**:
- **主な結果**: (数値・解析条件・sample情報はここに)
- **議論・解釈**:
- **未解決点・懸念**:

## 決定事項
明示的に合意されたことだけ。各項目の末尾に、根拠となる発言を原文のまま短く引用する(例: — "let's check it")。無ければ「明確な決定事項なし」。

## Action items
- **担当者**: 内容(期限: …) — "根拠となる発言の短い引用"
担当が確実でなければ「担当不明」。引き受けた・依頼された発言が無いものは載せない。

## 今後検討する事項
提案された追加解析、結論の出ていない問題、確認が必要な点。誰の提案かは確実なときだけ書く。

## 要確認の語
聞き間違いの可能性がある専門用語・固有名詞を、元の語のまま列挙する(正しい語の候補があれば「→ 候補」と添える)。

## キーワード
後から検索するための語を10〜20個、カンマ区切りで。専門用語は英語。`;
  },

  /** 🎓 講演用の要約。
   *  v1.34.0 から質問候補はここでは作らない(makeQuestions() が専用の呼び出しで作る)。
   *  理由: 質疑応答は講演の直後なので、長い要約の完成を待たずに質問だけ先に出したい。
   *  録音中の「💡質問を先に作る」と、終了後の質問づくりで同じプロンプトを使うためでもある。 */
  _talkPrompt() {
    return `あなたは生命科学分野の研究者を補佐するアシスタントです。学会講演の文字起こしを読み、後でPCで整理しやすい要約を日本語で作成してください。

入力について:
- 文字起こしは自動音声認識(または動画の自動字幕)の出力で、専門用語や固有名詞の聞き間違いを含みます。スライドは見えていません。
- 聞き間違いと思われる語を、確信が無いのに別の語へ直さないでください。文脈に合わない語は元の語のまま「[要確認]」を付けてください。
- 数値は何の値かを添え、換算しないでください(billion/million を 億/万 に直さない)。
- 「メモ」は聴講者本人が講演中に書いたものです。「重要」マーク箇所は本人が注目した場面です。

出力はMarkdown形式で、以下の見出し構成に従ってください。内容が読み取れない項目は「(聞き取れず)」と書いてください。専門用語・遺伝子名・手法名は英語のまま残してください。質問の候補は別に作るので、ここには書かないでください。

## 概要
3〜4文で研究の全体像。

## 背景と問い
何を明らかにしようとしたか。

## 手法
使われた実験・解析手法を箇条書きで。

## 主要な結果
重要な順に3〜5点、箇条書きで。数値やデータがあれば含める。

## 結論とインパクト

## 質疑応答
録音に質疑応答が含まれていれば、質問と回答の要点を箇条書きで。無ければ「(なし)」。

## キーワード
重要語を10個程度、カンマ区切りで(英語)。`;
  },

  /* ---------- 💡 質問候補 (v1.34.0) ----------
   * 要約とは別の、短い専用の呼び出しで作る。
   *   ・録音中の「💡質問を先に作る」(ここまでの録音のスナップショットから)
   *   ・録音終了後(全文から。要約と並行して走り、先にできたほうから表示)
   *   ・保存済みの講演からの作り直し
   * のどれも同じ makeQuestions() を通る。
   *
   * 結果は current.questions に入る:
   *   { items:[{type, ja, q, basis, picked}], raw, partial, atSec, createdAt }
   * items が空で raw だけある場合は、JSONとして読めなかった応答。そのままMarkdownで見せる
   * (質問が読めれば用は足りるので、形式の失敗で捨てない)。
   */
  MY_RESEARCH_KEY: 'lq_my_research',
  QUESTION_MAX_TOKENS: 6000,
  QUESTION_EFFORT: 'low',          // 速さ優先。質疑応答に間に合わせるため

  QUESTION_TYPES: {
    memo:      { label: 'メモより',     icon: '📝' },
    confirm:   { label: '確認',         icon: '🔍' },
    interpret: { label: '別の解釈',     icon: '🔀' },
    consensus: { label: '通説との違い', icon: '📚' },
    propose:   { label: '解析の提案',   icon: '🧪' },
    relate:    { label: '自分の研究と', icon: '🤝' }
  },

  myResearch() {
    return (localStorage.getItem(this.MY_RESEARCH_KEY) || '').trim();
  },

  _questionPrompt(partial) {
    return `あなたは、学会講演を聴いている研究者(以下「聴講者」)が質疑応答で良い質問をするのを助けるアシスタントです。講演の文字起こしを読み、聴講者がその中から選んで使える質問の候補を作ってください。

入力について:
- 文字起こしは自動音声認識の出力で、専門用語や固有名詞の聞き間違いを含みます。スライドは見えていません。
- 「聴講者の研究・関心」は、聴講者本人が書いた自己紹介です。質問の視点として使ってください。
- 「メモ」は聴講者が講演中に書いたもの、「重要マーク箇所」は聴講者が注目した場面です。${partial ? `
- ⚠ この文字起こしは講演の【途中まで】です。結論やまとめはまだ含まれていない可能性があります。すでに示された結果に基づいて質問を作り、「このあと話されそうなこと」を聞く質問は避けてください。` : `
- 文字起こしに質疑応答が含まれている場合、会場ですでに出た質問と同じ内容は出さないでください。`}

良い質問の条件:
- 講演で実際に述べられた特定の結果・手法・主張を1つ取り上げ、冒頭でそれに短く触れてから聞く(例: "You showed that ... . Did you ...?")。どの講演にも当てはまる一般的な質問(他の生物種では? 今後の計画は?)は出さない。
- 講演の中ですでに答えが述べられていることは聞かない。スライドにしか無い情報を前提にしない。
- 1問につき聞くことは1つ。2〜3文以内、声に出して20秒以内。
- 講演と同じ言語で書く(英語の講演なら英語)。平易で、そのまま読み上げられる文にする。
- 聞き間違いの疑いがある固有名詞を質問の中心に据えない。必要なら "the factor you mentioned" のように言い換える。
- 発表者を試したり誤りを指摘したりする調子にしない。発表者が話したくなる、議論が広がる聞き方にする。

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

出力形式:
JSON配列だけを出力してください。前置き・後書き・コードブロックの記号は不要です。各要素は次の形です。
{"type":"confirm","ja":"何を聞く質問かを日本語で30字程度(一覧から選ぶときに読む)","q":"質問文","basis":"講演のどの内容に基づくかを日本語で短く"}`;
  },

  /** 質問づくりに渡す利用者メッセージ */
  _questionUserMessage(transcript, markedText) {
    const c = this.current;
    let user = `講演タイトル: ${c.title}
発表者: ${c.speaker || '不明'}
会場・セッション: ${c.venue || '不明'}`;
    const me = this.myResearch();
    user += `\n\n聴講者の研究・関心:\n${me || '(未記入)'}`;
    if (c.note) user += `\n\nメモ:\n${c.note}`;
    if (markedText && markedText.length) {
      user += `\n\n重要マーク箇所:\n${markedText.join('\n')}`;
    }
    user += `\n\n文字起こし:\n${String(transcript).slice(0, this.TRANSCRIPT_LIMIT)}`;
    return user;
  },

  /** AIの応答から質問の配列を取り出す。読めなければ null(呼び出し側が raw を見せる) */
  _parseQuestions(text) {
    let t = String(text || '').replace(/```json|```/g, '').trim();
    const a = t.indexOf('[');
    const b = t.lastIndexOf(']');
    if (a < 0 || b <= a) return null;
    let arr;
    try { arr = JSON.parse(t.slice(a, b + 1)); } catch (_) { return null; }
    if (!Array.isArray(arr)) return null;
    const items = arr
      .filter((x) => x && typeof x.q === 'string' && x.q.trim())
      .map((x) => ({
        type: this.QUESTION_TYPES[x.type] ? x.type : 'confirm',
        ja: String(x.ja || '').trim(),
        q: x.q.trim(),
        basis: String(x.basis || '').trim(),
        picked: false
      }));
    return items.length ? items : null;
  },

  /**
   * 質問候補を作って current.questions に入れる。
   * opts: { transcript, markedText, partial, atSec }
   *   transcript を省くと current.transcript(全文)を使う。
   * ⭐を付けた質問は、作り直しても消さずに先頭へ残す(選んだものが入れ替わると困るため)。
   */
  async makeQuestions(opts) {
    const o = opts || {};
    const c = this.current;
    const transcript = o.transcript != null ? o.transcript : c.transcript;
    if (!transcript || !String(transcript).trim()) throw new Error('文字起こしがありません。');
    const marked = o.markedText != null ? o.markedText : (c.markedText || []);

    const text = await AI.chat(
      this._questionPrompt(!!o.partial),
      [{ role: 'user', content: this._questionUserMessage(transcript, marked) }],
      this.QUESTION_MAX_TOKENS, { effort: this.QUESTION_EFFORT });

    // 待っている間に状況が変わっていたら、結果を捨てる:
    //  ・別の録音に移っていた
    //  ・途中版(録音中に作ったもの)なのに、すでに全文版ができている
    //    (「終了して要約」を押したあとで、先に頼んだ途中版が遅れて返ってきた場合)
    if (c !== this.current) return c.questions || null;
    if (o.partial && c.questions && !c.questions.partial) return c.questions;

    const items = this._parseQuestions(text);
    const kept = ((c.questions && c.questions.items) || []).filter((x) => x.picked);
    const fresh = (items || []).filter((x) => !kept.some((k) => k.q === x.q));
    c.questions = {
      items: kept.concat(fresh),
      raw: items ? '' : String(text || '').trim(),
      partial: !!o.partial,
      atSec: o.atSec != null ? o.atSec : null,
      createdAt: new Date().toISOString()
    };
    return c.questions;
  },

  /* ---------- 💡 録音中に、ここまでの分から質問を先に作る ----------
   * 録音は止めない。いまのレコーダーが溜めているデータの「写し」を取り、
   * それを文字起こしして質問だけを作る。
   *
   * ⚠ 写しは _chunks を読むだけで、録音側の状態(segments / recorder)には一切触らない。
   *   ここで _closeSegment() を呼ぶと、本番の文字起こしのパート割りが変わってしまう。
   * ⚠ webm/ogg は先頭のチャンクにヘッダーがあるので、「先頭からここまで」をつなげば
   *   単体で再生できるファイルになる。途中から切り出すことはできない。
   *   (そのため、終了後の文字起こしと費用が二重になるのは避けられない)
   * ⚠ iOS Safari(mp4)では、つないだ写しが再生できる形にならない可能性がある。
   *   その場合は文字起こしAPIがエラーを返すので、メッセージを出して録音はそのまま続ける。
   */
  async snapshotSegments() {
    const rec = this.recorder;
    const segs = (this.segments || []).filter((sg) => sg.blob && sg.blob.size > 0)
      .map((sg) => ({ blob: sg.blob, startSec: sg.startSec }));
    if (rec && rec.state !== 'inactive' && rec._chunks) {
      // 直近(最大5秒ぶん)のデータを吐き出させてから写す
      const before = rec._chunks.length;
      try { rec.requestData(); } catch (_) { /* 非対応なら今あるぶんだけで作る */ }
      for (let i = 0; i < 20 && rec._chunks.length === before; i++) {
        await new Promise((r) => setTimeout(r, 50));
      }
      if (rec._chunks.length) {
        segs.push({
          blob: new Blob(rec._chunks.slice(), { type: rec.mimeType || 'audio/webm' }),
          startSec: this.segStartSec
        });
      }
    }
    return segs;
  },

  /** マーク時刻の前後を抜き出す(transcribe() と同じ規則) */
  _markedTextFrom(all, marks) {
    return (marks || []).map((t) => {
      const near = all.filter((x) => x.end >= t - 25 && x.start <= t + 10);
      const txt = near.map((x) => x.text.trim()).join(' ');
      return `[${PracticeUtil.fmtTime(t * 1000)}] ${txt}`.trim();
    }).filter((x) => x.length > 12);
  },

  /**
   * 録音を続けたまま、ここまでの分から質問を作る。onStage('stt'|'ai') で進み具合を通知。
   * 失敗しても録音には影響しない(例外は呼び出し側で表示する)。
   */
  async earlyQuestions(onStage) {
    const atSec = Math.round(this.elapsedMs() / 1000);
    const segs = await this.snapshotSegments();
    if (!segs.length) throw new Error('まだ録音データがありません。少し待ってからお試しください。');
    const MAX = 24 * 1024 * 1024;
    if (onStage) onStage('stt');
    const all = [];
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].blob.size > MAX) continue;      // 通常は起きない(18MBで区切っているため)
      const res = await STT.transcribe(segs[i].blob, this.current.lang);
      res.forEach((x) => all.push({
        start: x.start + segs[i].startSec, end: x.end + segs[i].startSec, text: x.text
      }));
    }
    const transcript = all.map((x) => x.text.trim()).join(' ');
    if (transcript.trim().length < 200) {
      throw new Error('ここまでの文字起こしが短すぎます(' + transcript.trim().length +
        '文字)。講演がもう少し進んでからお試しください。');
    }
    if (onStage) onStage('ai');
    return this.makeQuestions({
      transcript,
      markedText: this._markedTextFrom(all, this.current.marks),
      partial: true,
      atSec
    });
  },

  /** 共有用: 質問候補をMarkdownにする(⭐を付けたものが先) */
  questionsMarkdown() {
    const qs = this.current && this.current.questions;
    if (!qs) return '';
    if (!qs.items || !qs.items.length) return qs.raw ? `## 質問候補\n\n${qs.raw}\n` : '';
    const sorted = qs.items.filter((x) => x.picked).concat(qs.items.filter((x) => !x.picked));
    const lines = sorted.map((x) => {
      const t = this.QUESTION_TYPES[x.type] || this.QUESTION_TYPES.confirm;
      return `- ${x.picked ? '⭐ ' : ''}**[${t.label}]** ${x.q}\n  - ${x.ja}${x.basis ? `(根拠: ${x.basis})` : ''}`;
    });
    const head = qs.partial && qs.atSec != null
      ? `(録音の途中 ${PracticeUtil.fmtTime(qs.atSec * 1000)} 時点までの内容から作成)\n\n` : '';
    return `## 質問候補\n\n${head}${lines.join('\n')}\n`;
  },

  /* ---------- 📝 文字起こしテキストの読み込み (v1.34.0) ----------
   * 音声を経由せず、すでにある文字起こし(YouTubeの字幕、別ツールの出力、
   * 過去の会議の記録など)から要約と質問を作る。プロンプトの試験にも使う。
   * 文字起こしの費用はかからない。
   */

  /** 字幕ファイルや貼り付けテキストから、時刻や連番などの「本文でない行」を落とす */
  cleanTranscriptText(raw) {
    const lines = String(raw || '').replace(/\r/g, '').split('\n');
    const out = [];
    for (let line of lines) {
      line = line.replace(/<[^>]+>/g, '').trim();                  // VTTの <c> や <00:00:01.000> タグ
      if (!line) continue;
      if (/^WEBVTT/i.test(line) || /^(Kind|Language|NOTE)\b/i.test(line)) continue;
      if (/-->/.test(line)) continue;                               // SRT/VTTの時刻行
      if (/^\d+$/.test(line)) continue;                             // SRTの連番
      if (/^\[?\(?\d{1,2}:\d{2}(:\d{2})?\)?\]?$/.test(line)) continue;   // YouTubeの「0:15」だけの行
      line = line.replace(/^\[?\(?\d{1,2}:\d{2}(:\d{2})?\)?\]?\s+/, '');  // 行頭の時刻
      // YouTubeの自動字幕(VTT)は同じ行を繰り返すので、直前と同じ行は捨てる
      if (out.length && out[out.length - 1] === line) continue;
      out.push(line);
    }
    return out.join(' ').replace(/\s+/g, ' ').trim();
  },

  /** テキストを「文字起こし済みの講演」としてセットする。このあとは talkSummarizeStep() へ */
  loadText(meta, text, sourceName) {
    this.discardAudio();
    clearInterval(this.timer);
    this.timer = null;
    this.stream = null;
    this.recorder = null;
    this.paused = false;
    this.current = {
      id: Date.now(),
      date: new Date().toISOString(),
      kind: meta.kind === 'meeting' ? 'meeting' : 'talk',
      title: meta.title || (meta.kind === 'meeting' ? '無題のミーティング' : '無題の講演'),
      speaker: meta.speaker || '',
      venue: meta.venue || '',
      lang: meta.lang != null ? meta.lang : '',
      marks: [],
      note: meta.note || '',
      transcript: text,
      markedText: [],
      summary: '',
      durationMs: 0,
      startTime: Date.now(),
      pausedMs: 0,
      source: 'text',
      sourceFiles: sourceName ? [sourceName] : null
    };
    return this.current;
  },

  /* ---------- 共有 ---------- */
  /** 共有用のMarkdown全文を組み立てる */
  buildDocument(includeTranscript) {
    const c = this.current;
    const d = new Date(c.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    let doc = `# ${c.title}\n\n`;
    doc += `- ${c.kind === 'meeting' ? '参加者' : '発表者'}: ${c.speaker || '不明'}\n`;
    if (c.venue) doc += `- ${c.kind === 'meeting' ? '場所' : '会場・セッション'}: ${c.venue}\n`;
    doc += `- 日時: ${dateStr}\n`;
    if (c.source === 'text') {
      doc += `- 元データ: 文字起こしテキスト${c.sourceFiles && c.sourceFiles.length ? '(' + c.sourceFiles.join(' / ') + ')' : '(貼り付け)'}\n`;
    } else {
      doc += `- ${c.source === 'import' ? '音声の長さ' : '録音時間'}: ${PracticeUtil.fmtTime(c.durationMs)}\n`;
    }
    // どの音声から作った要約なのかは、あとで見返すときに効くので必ず残す
    if (c.source === 'import' && c.sourceFiles && c.sourceFiles.length) {
      doc += `- 元の音声ファイル: ${c.sourceFiles.join(' / ')}\n`;
    }
    if (c.note) doc += `\n## 自分のメモ\n\n${c.note}\n`;
    const qmd = this.questionsMarkdown();
    if (qmd) doc += `\n${qmd}`;
    doc += `\n${c.summary}\n`;
    if (c.markedText && c.markedText.length) {
      doc += `\n## マークした箇所\n\n${c.markedText.map((t) => `- ${t}`).join('\n')}\n`;
    }
    // 区切り線に「---」を使わない: Gmailなどのメールアプリは末尾の「--」風の
    // 区切り以降を署名とみなして折りたたむ(「…」の裏に隠れて見えなくなる)ため
    const HR = '\n\n＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝\n\n';
    if (includeTranscript && c.transcript) {
      doc += `${HR}## 文字起こし全文(${c.transcript.length}文字)\n\n${c.transcript}\n`;
    } else if (includeTranscript) {
      // 「含める」指定なのに文字起こしが無い場合も、黙って省かず明記する
      doc += `${HR}## 文字起こし全文\n\n(この講演には文字起こしがありません)\n`;
    }
    doc += `${HR}ConfQuest v${APP_VERSION} で作成\n`;
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
    const entry = {
      id: c.id, date: c.date, kind: c.kind || 'talk',
      title: c.title, speaker: c.speaker, venue: c.venue,
      durationMs: c.durationMs, summary: c.summary, transcript: c.transcript,
      markedText: c.markedText || [], note: c.note,
      lang: c.lang || '', partNotes: c.partNotes || null,
      source: c.source || 'record', sourceFiles: c.sourceFiles || null,
      questions: c.questions || null
    };
    // 同じIDが既にあれば置きかえる(文字起こしのやり直しで二重に増やさない)
    const list = JSON.parse(localStorage.getItem('lq_talks') || '[]')
      .filter((t) => t.id !== c.id);
    list.unshift(entry);
    // 端末の保存領域を圧迫しないよう50件まで
    localStorage.setItem('lq_talks', JSON.stringify(list.slice(0, 50)));
  },

  load(id) {
    const list = JSON.parse(localStorage.getItem('lq_talks') || '[]');
    const found = list.find((t) => t.id === id);
    if (found) {
      this.current = Object.assign({ marks: [], lang: '', kind: 'talk' }, found);
      this.audioUrl = null;
      this.audioUrls = [];
      this.segments = [];      // 前の録音のパートが残っていると、それを文字起こししてしまう
      this.audioBlob = null;
    }
    return found;
  }
};
