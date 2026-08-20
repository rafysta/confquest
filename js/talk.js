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
    const notes = [];
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
        notes.map((n) => `・パート${n.part}: ${n.why}`).join('\n'));
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
        notes.map((n) => `・パート${n.part}: ${n.why}`).join('\n'));
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

  /* ---------- 要約 ---------- */
  async summarize() {
    const c = this.current;
    if (!c.transcript) throw new Error('文字起こしがありません。');
    const sys = c.kind === 'meeting' ? this._meetingPrompt() : this._talkPrompt();

    let user = `${c.kind === 'meeting' ? '会議名' : '講演タイトル'}: ${c.title}
${c.kind === 'meeting' ? '参加者' : '発表者'}: ${c.speaker || '不明'}
${c.kind === 'meeting' ? '場所' : '会場・セッション'}: ${c.venue || '不明'}
録音時間: ${PracticeUtil.fmtTime(c.durationMs)}`;

    if (c.markedText && c.markedText.length) {
      user += `\n\n「重要」とマークした箇所(特に丁寧に反映してください):\n${c.markedText.join('\n')}`;
    }
    if (c.note) user += `\n\nメモ:\n${c.note}`;
    user += `\n\n文字起こし:\n${c.transcript.slice(0, 40000)}`;

    c.summary = await AI.chat(sys, [{ role: 'user', content: user }], 3000);
    return c.summary;
  },

  /** 👥 ミーティング用: 議事録形式+話者のAI推定 */
  _meetingPrompt() {
    return `あなたは会議の議事録を作るアシスタントです。ミーティングの録音の文字起こしを読み、日本語で議事録を作成してください。

注意: 文字起こしには話者の区別がありません。発言の内容・立場・口調の変化から話者を推定し、「話者A」「話者B」…と分けてください(参加者名が文脈から特定できる場合はその名前を使う)。推定なので間違いうることを議事録の冒頭に1行だけ注記し、確信の持てない発言は無理に割り当てないでください。

出力はMarkdown形式で、以下の見出し構成に従ってください。該当が無い項目は「(なし)」と書いてください。

## 概要
この会議は何についてのものか、2〜3文で。

## 議題と論点
話し合われたトピックごとに、主な論点を箇条書きで。

## 決定事項
決まったことを箇条書きで。決まっていないが方向性が出たものは「(仮)」を付ける。

## TODO・宿題
誰が・何を・いつまでに(わかる範囲で)。

## 話者ごとの主な発言
- **話者A**: 主な発言・立場を2〜3行で
- **話者B**: 同上(登場した人数分)

## キーワード
重要語を10個程度、カンマ区切りで。`;
  },

  /** 🎓 講演用(従来) */
  _talkPrompt() {
    return `あなたは生命科学分野の研究者を補佐するアシスタントです。学会講演の文字起こしを読み、後でPCで整理しやすい要約を日本語で作成してください。

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
    doc += `- 録音時間: ${PracticeUtil.fmtTime(c.durationMs)}\n`;
    if (c.note) doc += `\n## 自分のメモ\n\n${c.note}\n`;
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
      lang: c.lang || '', partNotes: c.partNotes || null
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
