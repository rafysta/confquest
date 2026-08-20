/* ConfQuest - 録音装置の音声ファイルを読み込むモジュール(v1.31.0)
 *
 * ICレコーダーで録った音声を、アプリ内の録音と同じように文字起こし・要約できるようにする。
 *
 * ■ なぜ「そのまま送る」のではなく変換するのか
 *   ① 形式がばらばら — MP3・WAV・M4A・WMA…。Whisperが受け付けるのは
 *      flac/m4a/mp3/mp4/mpeg/mpga/oga/ogg/wav/webm だけで、WMA等は弾かれる。
 *      ブラウザでいったんデコードしてWAVに揃えれば、ブラウザが再生できる形式は全部通る。
 *   ② 大きすぎる — WAV(リニアPCM 44.1kHz ステレオ)は1分あたり約10MB。
 *      1時間で600MBになり、25MBの上限に何度もぶつかる。
 *   ③ 途中で切れない — MP3やM4Aをバイト単位で切ると、ヘッダの無い断片ができて
 *      再生も文字起こしもできない(v1.30.1で直したのと同じ壊れ方)。
 *      PCMに直してから切れば、どのかけらも完全なWAVファイルになる。
 *
 * ■ 16kHz・モノラルにする理由
 *   Whisperは内部で16kHzモノラルに落としてから認識する。先に落としておけば
 *   音質は変わらないまま、送るデータが 44.1kHzステレオの約1/5.5 になる。
 *   16kHz・16bit・モノラル = 毎秒32,000バイト = 1分あたり約1.9MB。
 *
 * ■ 切る位置
 *   機械的に8分ちょうどで切ると、たいてい単語の途中で切れて、その語が失われる。
 *   目標位置の前後30秒でいちばん静かなところを探して切る(findQuietCut)。
 *   講演なら文の切れ目・息継ぎがほぼ必ず見つかる。
 */
'use strict';

const AudioImport = {
  TARGET_RATE: 16000,                   // Whisperが内部で使うサンプリングレート
  CHUNK_SEC: 480,                       // 1かけら8分 = 約15.4MB(上限25MBに余裕)
  SEARCH_SEC: 30,                       // 切る位置を探す範囲(目標の前後)
  QUIET_WIN_SEC: 0.30,                  // 「静か」とみなす窓の長さ
  MAX_TOTAL_BYTES: 700 * 1024 * 1024,   // これを超えるファイルは読み込む前に止める

  /** ブラウザがこの機能を使えるか */
  supported() {
    return typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
  },

  /** 拡張子とMIMEから「たぶん音声ファイル」と判断する(選択の取り違え防止) */
  looksAudio(file) {
    if (!file) return false;
    if (String(file.type || '').indexOf('audio') === 0) return true;
    if (String(file.type || '').indexOf('video/mp4') === 0) return true;   // .m4aがvideo/mp4になる端末がある
    return /\.(mp3|wav|wave|m4a|mp4|aac|ogg|oga|opus|flac|webm|wma|3gp|amr|aiff?|mpga|mpeg)$/i
      .test(file.name || '');
  },

  /** ブラウザが自力では開けない可能性が高い形式(案内を出すため) */
  likelyUnsupported(file) {
    return /\.(dss|ds2|lpec|msv|dvf|vy1|wma|amr|ra|shn)$/i.test((file && file.name) || '');
  },

  /* ---------- 長さの下見 ---------- */

  /**
   * デコードする前に、そのファイルが何秒なのかだけを調べる。
   * <audio> にメタデータだけ読ませるので、中身の展開は起きず一瞬で終わる。
   * 分からなければ null(確認画面で「—」と出すだけで、処理は続けられる)。
   */
  probeDuration(file) {
    return new Promise((resolve) => {
      let url = null;
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        if (url) { try { URL.revokeObjectURL(url); } catch (_) { /* 無視 */ } }
        resolve(v);
      };
      try {
        url = URL.createObjectURL(file);
        const a = document.createElement('audio');
        a.preload = 'metadata';
        a.onloadedmetadata = () => finish(isFinite(a.duration) && a.duration > 0 ? a.duration : null);
        a.onerror = () => finish(null);
        a.src = url;
        setTimeout(() => finish(null), 8000);   // 反応がなければ諦める
      } catch (_) {
        finish(null);
      }
    });
  },

  /** 選んだファイル全部の長さを調べる。[{file, sec}] を返す(secはnullのことがある) */
  async probeAll(files) {
    const out = [];
    for (const f of files) out.push({ file: f, sec: await this.probeDuration(f) });
    return out;
  },

  /** 秒を「1時間2分」の形にする */
  fmtSec(sec) {
    if (sec == null) return '—';
    const s = Math.round(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}時間${String(m).padStart(2, '0')}分`;
    return m ? `${m}分${String(s % 60).padStart(2, '0')}秒` : `${s}秒`;
  },

  /** この長さだと何パートに分かれるかの見込み */
  estimateParts(totalSec) {
    if (!totalSec) return 1;
    return Math.max(1, Math.ceil(totalSec / this.CHUNK_SEC));
  },

  /* ---------- 読み込みとデコード ---------- */

  /**
   * ファイルを 16kHz モノラルの Float32Array に直す。
   * AudioContextに16000を指定するとブラウザ側がリサンプルまでやってくれる。
   * 指定を受け付けない環境では、こちらで線形補間して落とす。
   */
  async decodeMono16k(file) {
    const buf = await file.arrayBuffer();
    let ctx = null;
    let audio = null;
    try {
      const Ctor = typeof AudioContext !== 'undefined' ? AudioContext : webkitAudioContext;
      try {
        ctx = new Ctor({ sampleRate: this.TARGET_RATE });
      } catch (_) {
        ctx = new Ctor();     // sampleRate指定を受け付けない環境
      }
      audio = await new Promise((resolve, reject) => {
        // 古いSafari系はPromiseを返さないので、コールバック形式で呼ぶ
        const p = ctx.decodeAudioData(buf, resolve, reject);
        if (p && typeof p.then === 'function') p.then(resolve, reject);
      });
    } catch (err) {
      if (ctx) { try { ctx.close(); } catch (_) { /* 無視 */ } }
      throw new Error(`「${file.name}」を音声として読み込めませんでした。` +
        'この形式はブラウザが対応していない可能性があります(レコーダー付属のソフトでMP3かWAVに変換してからお試しください)。');
    }

    const mono = this.toMono(audio);
    const rate = audio.sampleRate;
    try { ctx.close(); } catch (_) { /* 無視 */ }
    return rate === this.TARGET_RATE ? mono : this.resample(mono, rate, this.TARGET_RATE);
  },

  /** 複数チャンネルを平均して1本にする(ステレオの片側だけ拾う事故を避ける) */
  toMono(audio) {
    const n = audio.length;
    if (audio.numberOfChannels === 1) return audio.getChannelData(0).slice();
    const out = new Float32Array(n);
    for (let c = 0; c < audio.numberOfChannels; c++) {
      const ch = audio.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] += ch[i];
    }
    const k = 1 / audio.numberOfChannels;
    for (let i = 0; i < n; i++) out[i] *= k;
    return out;
  },

  /** 線形補間のリサンプル(AudioContextがレート指定を受け付けなかったときの保険) */
  resample(data, from, to) {
    if (from === to) return data;
    const ratio = from / to;
    const len = Math.max(1, Math.floor(data.length / ratio));
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const pos = i * ratio;
      const i0 = Math.floor(pos);
      const i1 = Math.min(data.length - 1, i0 + 1);
      const t = pos - i0;
      out[i] = data[i0] * (1 - t) + data[i1] * t;
    }
    return out;
  },

  /* ---------- 分割 ---------- */

  /**
   * target付近でいちばん静かなところを探す。見つからなければtargetをそのまま返す。
   * 0.3秒の窓を0.05秒ずつずらしながら二乗平均をとり、最小の窓の中央で切る。
   */
  findQuietCut(data, target, searchSamples, winSamples, stepSamples) {
    const lo = Math.max(0, target - searchSamples);
    const hi = Math.min(data.length - winSamples, target + searchSamples);
    if (hi <= lo) return target;
    let best = target;
    let bestE = Infinity;
    for (let s = lo; s <= hi; s += stepSamples) {
      let e = 0;
      for (let i = s; i < s + winSamples; i += 4) e += data[i] * data[i];   // 4サンプル間引きで十分
      if (e < bestE) { bestE = e; best = s + (winSamples >> 1); }
    }
    return best;
  },

  /**
   * 16kHzモノラルのPCMを、8分前後のかけらに切る本体。
   * keepTail が真のときは、最後の中途半端な残りを切らずに rest として返す。
   * こうすると次のファイルの先頭とつなげて切れるので、
   *  ・ファイルの切れ目が「必ずパートの切れ目」にならない(短い断片が量産されない)
   *  ・ファイルをまたいだ位置でも、静かなところを選んで切れる
   * 一方で、抱えたままにするのは1かたまりぶん(9分弱)だけなので、
   * 何時間ぶん読み込んでもメモリは増え続けない。
   *
   * 戻り値: { parts:[{blob,startSec,durationSec}], rest:Float32Array, restStartSec }
   */
  _split(data, offsetSec, keepTail) {
    const rate = this.TARGET_RATE;
    const chunk = this.CHUNK_SEC * rate;
    const search = this.SEARCH_SEC * rate;
    const win = Math.max(1, Math.round(this.QUIET_WIN_SEC * rate));
    const step = Math.max(1, Math.round(0.05 * rate));
    const parts = [];
    let pos = 0;
    while (pos < data.length) {
      let end;
      if (data.length - pos <= chunk + search) {
        if (keepTail) break;              // 残りは次のファイルとつなげる
        end = data.length;                // 残りが少なければ切らずに最後まで
      } else {
        end = this.findQuietCut(data, pos + chunk, search, win, step);
        if (end <= pos + rate) end = pos + chunk;   // 念のため(前に戻ることはない)
      }
      const part = data.subarray(pos, end);
      parts.push({
        blob: this.encodeWav(part, rate),
        startSec: (offsetSec || 0) + pos / rate,
        durationSec: part.length / rate
      });
      pos = end;
    }
    return {
      parts,
      rest: data.subarray(pos),
      restStartSec: (offsetSec || 0) + pos / rate
    };
  },

  /** 1本ぶんをまとめて切る(残りも最後のパートにする) */
  splitToWav(data, offsetSec) {
    return this._split(data, offsetSec, false).parts;
  },

  /** 2本のPCMをつなぐ。片方が空ならコピーせずそのまま返す */
  concat(a, b) {
    if (!a || !a.length) return b;
    if (!b || !b.length) return a;
    const out = new Float32Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
  },

  /* ---------- WAVの書き出し ---------- */

  /**
   * Float32のPCMを 16bit リニアPCM の WAV(RIFF)にする。
   * ヘッダは44バイト固定。どのかけらも単独で再生できる完全なファイルになる。
   */
  encodeWav(data, rate) {
    const n = data.length;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const str = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
    str(0, 'RIFF');
    v.setUint32(4, 36 + n * 2, true);       // これ以降のバイト数
    str(8, 'WAVE');
    str(12, 'fmt ');
    v.setUint32(16, 16, true);              // fmtチャンクの長さ
    v.setUint16(20, 1, true);               // 1 = リニアPCM
    v.setUint16(22, 1, true);               // モノラル
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true);        // 毎秒のバイト数
    v.setUint16(32, 2, true);               // 1サンプルのバイト数
    v.setUint16(34, 16, true);              // 量子化ビット数
    str(36, 'data');
    v.setUint32(40, n * 2, true);
    let off = 44;
    for (let i = 0; i < n; i++) {
      let s = data[i];
      if (s > 1) s = 1; else if (s < -1) s = -1;     // クリップ(歪みを防ぐ)
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
    return new Blob([buf], { type: 'audio/wav' });
  },

  /* ---------- まとめ役 ---------- */

  /** 読み込む前に分かる問題を返す(なければ null) */
  precheck(files) {
    if (!this.supported()) return 'このブラウザでは音声ファイルの読み込みに対応していません。';
    if (!files || !files.length) return 'ファイルが選ばれていません。';
    const bad = files.filter((f) => !this.looksAudio(f));
    if (bad.length) {
      return `音声ファイルではないものが含まれています: ${bad.map((f) => f.name).join(', ')}`;
    }
    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > this.MAX_TOTAL_BYTES) {
      return `ファイルが大きすぎます(合計 ${(total / 1048576).toFixed(0)}MB)。` +
        '一度に読み込むのは700MBまでにしてください。分けて読み込むか、レコーダー側で圧縮設定にしてください。';
    }
    return null;
  },

  /** ファイル名を「1_2_10」が正しく並ぶように比較する(REC_2 が REC_10 の前に来るように) */
  compareName(a, b) {
    return String(a).localeCompare(String(b), 'ja', { numeric: true, sensitivity: 'base' });
  },

  /**
   * 選ばれたファイル群を、文字起こしにそのまま使えるセグメントの配列にする。
   * 複数ファイルは名前順につなぎ、startSec は先頭からの通し時間になる。
   * onProgress(fileIndex, fileTotal, fileName) で進捗を通知。
   */
  async prepare(files, onProgress) {
    const list = files.slice().sort((a, b) => this.compareName(a.name, b.name));
    const segments = [];
    const notes = [];
    let pending = null;        // まだ切っていないPCM(前のファイルの終わり)
    let pendingStart = 0;      // pending の先頭が全体の何秒目にあたるか
    let offset = 0;            // ここまでに読み込んだ合計秒数
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (onProgress) onProgress(i + 1, list.length, f.name);
      let data;
      try {
        data = await this.decodeMono16k(f);
      } catch (err) {
        // 1つ読めなくても、残りのファイルで続ける
        notes.push({ file: f.name, why: err.message });
        continue;
      }
      if (!data.length) {
        notes.push({ file: f.name, why: '中身が空でした' });
        continue;
      }
      offset += data.length / this.TARGET_RATE;
      const merged = this.concat(pending, data);
      const isLast = i === list.length - 1;
      const r = this._split(merged, pendingStart, !isLast);
      r.parts.forEach((s) => segments.push(s));
      // subarrayのままだと元の大きな配列を掴んだままになるので、必要な分だけ複製する
      pending = r.rest.length ? r.rest.slice() : null;
      pendingStart = r.restStartSec;
      await new Promise((r2) => setTimeout(r2, 0));   // 画面の描き替えに息継ぎを与える
    }
    // 最後のファイルが読み込めなかった場合、残りがそのままになるので流し切る
    if (pending && pending.length) {
      this._split(pending, pendingStart, false).parts.forEach((s) => segments.push(s));
      pending = null;
    }
    if (!segments.length) {
      const err = new Error('読み込める音声がありませんでした。\n' +
        notes.map((n) => `・${n.file}: ${n.why}`).join('\n'));
      err.partNotes = notes;
      throw err;
    }
    return { segments, notes, durationSec: offset, fileCount: list.length, files: list };
  }
};
