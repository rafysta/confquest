/* ConfQuest - バックアップ/復元 と 講演録音の音声保存
 *
 * MiniZip   : 依存ライブラリなしの最小ZIP(無圧縮)書き出し・読み込み
 * IDBUtil   : IndexedDBの汎用ヘルパー(全件取得・一括保存)
 * TalkAudio : 講演・会議の録音音声を端末に残す(既定はオフ=破棄)
 * Backup    : lq_* の設定・進行状況 + 音声を1ファイルにまとめて保存/復元
 *
 * 方針: バックアップファイルは「普通のZIP」にする。エクスプローラーで開けば
 * confquest-backup.json と audio/ が見えるので、中身が確認できて安心。
 * 音声は既に圧縮済み(webm/opus, mp3)なので無圧縮(store)で十分。
 */
'use strict';

/* ==================== 最小ZIP ==================== */
const MiniZip = {
  _crc: null,

  crcTable() {
    if (this._crc) return this._crc;
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    this._crc = t;
    return t;
  },

  crc32(u8) {
    const t = this.crcTable();
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  },

  dosTime(d) {
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2))) & 0xFFFF;
  },
  dosDate(d) {
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  },

  /**
   * entries: [{ name, data: Uint8Array | Blob }] → ZIPのBlob
   * 音声Blobは1件ずつしかメモリに展開しない(CRC計算後は元のBlobを使う)。
   */
  async write(entries, now) {
    const stamp = now || new Date();
    const time = this.dosTime(stamp);
    const date = this.dosDate(stamp);
    const enc = new TextEncoder();
    const body = [];      // ローカルヘッダ+データ
    const central = [];   // 中央ディレクトリ
    let offset = 0;
    let cdSize = 0;

    for (const e of entries) {
      const isBytes = e.data instanceof Uint8Array;
      const u8 = isBytes ? e.data : new Uint8Array(await e.data.arrayBuffer());
      const size = u8.length;
      const crc = this.crc32(u8);
      const name = enc.encode(e.name);

      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true);
      lh.setUint16(4, 20, true);        // version needed
      lh.setUint16(6, 0x0800, true);    // UTF-8 filename
      lh.setUint16(8, 0, true);         // method = store
      lh.setUint16(10, time, true);
      lh.setUint16(12, date, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, size, true);
      lh.setUint32(22, size, true);
      lh.setUint16(26, name.length, true);
      lh.setUint16(28, 0, true);
      // データ本体はBlobのまま渡す(巨大な音声をメモリに残さない)
      body.push(new Uint8Array(lh.buffer), name, isBytes ? u8 : e.data);

      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);        // version made by
      cd.setUint16(6, 20, true);        // version needed
      cd.setUint16(8, 0x0800, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, time, true);
      cd.setUint16(14, date, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, size, true);
      cd.setUint32(24, size, true);
      cd.setUint16(28, name.length, true);
      cd.setUint16(30, 0, true);        // extra
      cd.setUint16(32, 0, true);        // comment
      cd.setUint16(34, 0, true);        // disk
      cd.setUint16(36, 0, true);        // internal attrs
      cd.setUint32(38, 0, true);        // external attrs
      cd.setUint32(42, offset, true);
      central.push(new Uint8Array(cd.buffer), name);

      offset += 30 + name.length + size;
      cdSize += 46 + name.length;
    }

    const eo = new DataView(new ArrayBuffer(22));
    eo.setUint32(0, 0x06054b50, true);
    eo.setUint16(4, 0, true);
    eo.setUint16(6, 0, true);
    eo.setUint16(8, entries.length, true);
    eo.setUint16(10, entries.length, true);
    eo.setUint32(12, cdSize, true);
    eo.setUint32(16, offset, true);
    eo.setUint16(20, 0, true);

    return new Blob(body.concat(central, [new Uint8Array(eo.buffer)]),
      { type: 'application/zip' });
  },

  /** ZIPのBlob → [{name, blob}]。中央ディレクトリだけ読むので大きくても軽い */
  async read(blob) {
    const size = blob.size;
    if (size < 22) throw new Error('ファイルが小さすぎます。バックアップファイルではないようです。');
    const tailLen = Math.min(size, 66000);
    const tail = new Uint8Array(await blob.slice(size - tailLen).arrayBuffer());
    let p = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) { p = i; break; }
    }
    if (p < 0) throw new Error('ZIPとして読めませんでした。ConfQuestのバックアップファイルを選んでください。');
    const tv = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
    const count = tv.getUint16(p + 10, true);
    const cdSize = tv.getUint32(p + 12, true);
    const cdOff = tv.getUint32(p + 16, true);

    const cd = new Uint8Array(await blob.slice(cdOff, cdOff + cdSize).arrayBuffer());
    const cv = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
    const dec = new TextDecoder();
    const heads = [];
    let q = 0;
    for (let i = 0; i < count; i++) {
      if (q + 46 > cd.length || cv.getUint32(q, true) !== 0x02014b50) break;
      const nl = cv.getUint16(q + 28, true);
      const xl = cv.getUint16(q + 30, true);
      const cl = cv.getUint16(q + 32, true);
      heads.push({
        name: dec.decode(cd.subarray(q + 46, q + 46 + nl)),
        method: cv.getUint16(q + 10, true),
        compSize: cv.getUint32(q + 20, true),
        lho: cv.getUint32(q + 42, true)
      });
      q += 46 + nl + xl + cl;
    }

    const out = [];
    for (const h of heads) {
      const lv = new DataView(await blob.slice(h.lho, h.lho + 30).arrayBuffer());
      if (lv.getUint32(0, true) !== 0x04034b50) throw new Error('ZIPの構造が壊れています。');
      const start = h.lho + 30 + lv.getUint16(26, true) + lv.getUint16(28, true);
      let part = blob.slice(start, start + h.compSize);
      if (h.method === 8) {
        // 他のツールで作り直された場合(deflate)にも一応対応する
        if (typeof DecompressionStream === 'undefined') {
          throw new Error(`圧縮されたZIPには対応していません (${h.name})。ConfQuestが作ったファイルをそのままお使いください。`);
        }
        part = await new Response(part.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
      } else if (h.method !== 0) {
        throw new Error(`未対応の圧縮方式です (${h.name})。`);
      }
      out.push({ name: h.name, blob: part });
    }
    return out;
  }
};

/* ==================== IndexedDB ヘルパー ==================== */
const IDBUtil = {
  open(dbName, store) {
    return new Promise((resolve, reject) => {
      const rq = indexedDB.open(dbName, 1);
      rq.onupgradeneeded = () => {
        if (!rq.result.objectStoreNames.contains(store)) rq.result.createObjectStore(store);
      };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  },

  /** 全件を [{key, value}] で返す */
  async all(dbName, store) {
    const db = await this.open(dbName, store);
    const out = await new Promise((resolve) => {
      const os = db.transaction(store).objectStore(store);
      const items = [];
      const rq = os.openCursor();
      rq.onsuccess = () => {
        const c = rq.result;
        if (!c) { resolve(items); return; }
        items.push({ key: c.key, value: c.value });
        c.continue();
      };
      rq.onerror = () => resolve(items);
    });
    db.close();
    return out;
  },

  async putMany(dbName, store, items) {
    if (!items.length) return;
    const db = await this.open(dbName, store);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      items.forEach((it) => os.put(it.value, it.key));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  },

  async clear(dbName, store) {
    const db = await this.open(dbName, store);
    await new Promise((resolve) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
  }
};

/* ==================== 講演録音の音声保存 ==================== */
/* 既定では録音音声は保存されない(要約が終わればメモリから破棄)。
 * ⚙設定のスイッチをオンにすると自動保存、オフのままでも録音ごとに
 * 「この録音を残す」を選べる。 */
const TalkAudio = {
  DB_NAME: 'confquest-talk-audio',
  STORE: 'audio',
  INDEX_KEY: 'lq_talk_audio_index',   // {id: {bytes, savedAt, parts}} 表示用の軽い索引

  supported() { return typeof indexedDB !== 'undefined'; },

  /** 設定: 録音音声を既定で残すか */
  keepDefault() { return localStorage.getItem('lq_keep_audio') === '1'; },
  setKeepDefault(on) { localStorage.setItem('lq_keep_audio', on ? '1' : '0'); },

  index() {
    try { return JSON.parse(localStorage.getItem(this.INDEX_KEY) || '{}'); } catch (_) { return {}; }
  },
  _saveIndex(ix) { localStorage.setItem(this.INDEX_KEY, JSON.stringify(ix)); },

  has(id) { return Object.prototype.hasOwnProperty.call(this.index(), String(id)); },

  /** 保存済み音声の合計バイト数 */
  totalBytes() {
    const ix = this.index();
    return Object.keys(ix).reduce((s, k) => s + (ix[k].bytes || 0), 0);
  },
  count() { return Object.keys(this.index()).length; },

  /** 実体(IndexedDB)と索引(localStorage)のズレを直す */
  async init() {
    if (!this.supported()) return;
    try {
      const db = await IDBUtil.open(this.DB_NAME, this.STORE);
      const keys = await new Promise((resolve) => {
        const rq = db.transaction(this.STORE).objectStore(this.STORE).getAllKeys();
        rq.onsuccess = () => resolve(rq.result.map(String));
        rq.onerror = () => resolve(null);
      });
      db.close();
      if (!keys) return;
      const ix = this.index();
      let changed = false;
      Object.keys(ix).forEach((k) => {
        if (keys.indexOf(k) < 0) { delete ix[k]; changed = true; }
      });
      keys.forEach((k) => {
        if (!ix[k]) { ix[k] = { bytes: 0, savedAt: '', parts: 1 }; changed = true; }
      });
      if (changed) this._saveIndex(ix);
    } catch (_) { /* プライベートモード等 */ }
  },

  /** parts: [{blob, startSec}] */
  async put(id, parts, meta) {
    if (!this.supported()) throw new Error('この端末では音声を保存できません。');
    const clean = parts.filter((p) => p && p.blob && p.blob.size > 0);
    if (!clean.length) throw new Error('保存できる録音データがありません。');
    const bytes = clean.reduce((s, p) => s + p.blob.size, 0);
    const rec = {
      id: String(id),
      savedAt: new Date().toISOString(),
      title: (meta && meta.title) || '',
      durationMs: (meta && meta.durationMs) || 0,
      bytes,
      parts: clean.map((p) => ({ blob: p.blob, startSec: p.startSec || 0 }))
    };
    await IDBUtil.putMany(this.DB_NAME, this.STORE, [{ key: String(id), value: rec }]);
    const ix = this.index();
    ix[String(id)] = { bytes, savedAt: rec.savedAt, parts: clean.length };
    this._saveIndex(ix);
    return rec;
  },

  async get(id) {
    if (!this.supported()) return null;
    const db = await IDBUtil.open(this.DB_NAME, this.STORE);
    const rec = await new Promise((resolve) => {
      const rq = db.transaction(this.STORE).objectStore(this.STORE).get(String(id));
      rq.onsuccess = () => resolve(rq.result || null);
      rq.onerror = () => resolve(null);
    });
    db.close();
    return rec;
  },

  async remove(id) {
    if (!this.supported()) return;
    const db = await IDBUtil.open(this.DB_NAME, this.STORE);
    await new Promise((resolve) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).delete(String(id));
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
    const ix = this.index();
    delete ix[String(id)];
    this._saveIndex(ix);
  },

  async clearAll() {
    if (!this.supported()) return;
    await IDBUtil.clear(this.DB_NAME, this.STORE);
    this._saveIndex({});
  },

  /** いま録音したもの(Talk.segments)をそのまま保存する */
  async saveCurrent() {
    if (typeof Talk === 'undefined' || !Talk.current) throw new Error('録音がありません。');
    const parts = (Talk.segments && Talk.segments.length)
      ? Talk.segments
      : (Talk.audioBlob ? [{ blob: Talk.audioBlob, startSec: 0 }] : []);
    return this.put(Talk.current.id, parts, Talk.current);
  }
};

/* ==================== バックアップ/復元 ==================== */
const Backup = {
  FORMAT: 'confquest-backup',
  FORMAT_VERSION: 1,
  META_NAME: 'confquest-backup.json',
  SECRET_KEYS: ['lq_api_key', 'lq_openai_key'],
  VOICE_DB: 'confquest-voices',
  VOICE_STORE: 'voices',

  /* ---------- 小さな純関数(テストしやすい単位) ---------- */

  /** MIMEタイプ → ZIP内での拡張子 */
  extFor(type) {
    const t = String(type || '').toLowerCase();
    if (t.indexOf('webm') >= 0) return 'webm';
    if (t.indexOf('ogg') >= 0) return 'ogg';
    if (t.indexOf('mpeg') >= 0 || t.indexOf('mp3') >= 0) return 'mp3';
    if (t.indexOf('mp4') >= 0 || t.indexOf('m4a') >= 0 || t.indexOf('aac') >= 0) return 'm4a';
    if (t.indexOf('wav') >= 0) return 'wav';
    return 'bin';
  },

  /** バイト数を読みやすく */
  fmtBytes(n) {
    if (!n) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1048576).toFixed(1)} MB`;
    return `${(n / 1073741824).toFixed(2)} GB`;
  },

  /** ファイル名: confquest-backup_2026-08-17_full.zip */
  fileName(withAudio, now) {
    const d = now || new Date();
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `confquest-backup_${day}_${withAudio ? 'full' : 'light'}.zip`;
  },

  /** バックアップ対象のlocalStorage(lq_で始まるものすべて)を集める */
  collectLocal(includeKeys, store) {
    const ls = store || localStorage;
    const out = {};
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (!k || k.indexOf('lq_') !== 0) continue;
      if (!includeKeys && this.SECRET_KEYS.indexOf(k) >= 0) continue;
      out[k] = ls.getItem(k);
    }
    return out;
  },

  /** メタ情報 → 確認ダイアログ用の人間向けサマリー(純関数) */
  summarize(meta) {
    const L = (meta && meta.localStorage) || {};
    const num = (k, path) => {
      try {
        const v = JSON.parse(L[k] || 'null');
        if (v == null) return 0;
        return path ? (v[path] || 0) : (Array.isArray(v) ? v.length : Object.keys(v).length);
      } catch (_) { return 0; }
    };
    const audio = (meta && meta.audio) || [];
    const voice = audio.filter((a) => a.store === 'voice').length;
    const talkA = audio.filter((a) => a.store === 'talk').length;
    const bytes = audio.reduce((s, a) => s + (a.bytes || 0), 0);
    const d = meta && meta.createdAt ? new Date(meta.createdAt) : null;
    const when = d && !isNaN(d.getTime())
      ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : '不明';
    const lines = [
      `作成日時: ${when}`,
      `アプリ版: v${(meta && meta.appVersion) || '?'}`,
      `⭐ポイント: ${num('lq_gami', 'points')} ・ 🔥ストリーク: ${num('lq_gami', 'streak')}日`,
      `🎙️ 録音の要約: ${num('lq_talks')}件`,
      `📇 学習カードの記録: ${num('lq_srs')}件`,
      `🔑 APIキー: ${meta && meta.includeKeys ? '含まれています' : '含まれていません'}`,
      `🎵 音声: ${audio.length ? `お手本・読み上げ ${voice}件 / 講演 ${talkA}件 (${this.fmtBytes(bytes)})` : '含まれていません'}`
    ];
    return lines;
  },

  /** 最後にバックアップした日時の表示文(純関数) */
  lastBackupText(iso, now) {
    if (!iso) return '⚠ まだ一度もバックアップしていません。';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '⚠ まだ一度もバックアップしていません。';
    const base = now || new Date();
    const days = Math.floor((base - d) / 86400000);
    const day = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    const ago = days <= 0 ? '今日' : days === 1 ? '昨日' : `${days}日前`;
    const warn = days >= 14 ? ' ⚠ そろそろ取り直しをおすすめします。' : '';
    return `最後のバックアップ: ${day} (${ago})${warn}`;
  },

  /* ---------- 作成 ---------- */
  /**
   * options: { audio, keys, onProgress(text) }
   * 戻り値: { blob, name, meta, bytes }
   */
  async create(options) {
    const opt = options || {};
    const say = opt.onProgress || function () {};
    const now = new Date();
    const meta = {
      format: this.FORMAT,
      formatVersion: this.FORMAT_VERSION,
      appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?',
      createdAt: now.toISOString(),
      includeAudio: !!opt.audio,
      includeKeys: !!opt.keys,
      localStorage: this.collectLocal(!!opt.keys),
      audio: []
    };

    const files = [];
    if (opt.audio && typeof indexedDB !== 'undefined') {
      say('お手本録音を集めています…');
      let n = 0;
      try {
        const voices = await IDBUtil.all(this.VOICE_DB, this.VOICE_STORE);
        for (const v of voices) {
          if (!v.value || typeof v.value.size !== 'number' || !v.value.size) continue;
          const path = `audio/voice/${String(++n).padStart(4, '0')}.${this.extFor(v.value.type)}`;
          meta.audio.push({ path, store: 'voice', key: String(v.key), type: v.value.type || '', bytes: v.value.size });
          files.push({ name: path, data: v.value });
        }
      } catch (_) { /* お手本録音が無い端末 */ }

      say('保存した講演の音声を集めています…');
      try {
        const talks = await IDBUtil.all(TalkAudio.DB_NAME, TalkAudio.STORE);
        let m = 0;
        for (const t of talks) {
          const rec = t.value;
          if (!rec || !rec.parts) continue;
          rec.parts.forEach((p, i) => {
            if (!p.blob || !p.blob.size) return;
            const path = `audio/talk/${String(++m).padStart(4, '0')}.${this.extFor(p.blob.type)}`;
            meta.audio.push({
              path, store: 'talk', key: String(rec.id), part: i,
              startSec: p.startSec || 0, title: rec.title || '',
              durationMs: rec.durationMs || 0, savedAt: rec.savedAt || '',
              type: p.blob.type || '', bytes: p.blob.size
            });
            files.push({ name: path, data: p.blob });
          });
        }
      } catch (_) { /* 保存した講演音声が無い */ }
    }

    say('ファイルにまとめています…');
    const enc = new TextEncoder();
    const entries = [
      { name: this.META_NAME, data: enc.encode(JSON.stringify(meta, null, 2)) },
      { name: 'README.txt', data: enc.encode(this.readme(meta)) }
    ].concat(files);

    const blob = await MiniZip.write(entries, now);
    localStorage.setItem('lq_last_backup', now.toISOString());
    return { blob, name: this.fileName(!!opt.audio, now), meta, bytes: blob.size };
  },

  readme(meta) {
    return [
      'ConfQuest バックアップファイル',
      '',
      `作成日時 : ${meta.createdAt}`,
      `アプリ版 : v${meta.appVersion}`,
      `音声      : ${meta.includeAudio ? '含む' : '含まない'}`,
      `APIキー   : ${meta.includeKeys ? '含む(このファイルは他の人と共有しないでください)' : '含まない'}`,
      '',
      '【復元のしかた】',
      '1. ConfQuest を開く (https://rafysta.github.io/confquest/)',
      '2. ⚙設定 → 「バックアップと復元」 → 「⬆ バックアップから復元」',
      '3. このZIPファイルを選ぶ',
      '',
      '※ このファイルは展開しないでください。ZIPのまま選んでください。',
      '※ confquest-backup.json に設定と進行状況、audio/ に音声が入っています。'
    ].join('\n');
  },

  /* ---------- 中身の確認 ---------- */
  /** ZIPを読んで {meta, entries} を返す(まだ書き込まない) */
  async inspect(file) {
    const entries = await MiniZip.read(file);
    const metaEntry = entries.find((e) => e.name === this.META_NAME);
    if (!metaEntry) throw new Error('ConfQuestのバックアップファイルではないようです(confquest-backup.json が見つかりません)。');
    let meta;
    try {
      meta = JSON.parse(await metaEntry.blob.text());
    } catch (_) {
      throw new Error('バックアップの中身が壊れています。');
    }
    if (meta.format !== this.FORMAT) throw new Error('ConfQuestのバックアップファイルではないようです。');
    if (meta.formatVersion > this.FORMAT_VERSION) {
      throw new Error(`このバックアップは新しい形式(v${meta.formatVersion})です。先にアプリを更新してください。`);
    }
    return { meta, entries };
  },

  /* ---------- 復元 ---------- */
  /**
   * inspect()の結果を渡して復元する。
   * options: { keys: APIキーも復元するか, onProgress(text) }
   * 既存の lq_* は「バックアップに入っていないもの」も含めて置き換える
   * (＝ほかの端末とまったく同じ状態にする)。ただしAPIキーは、
   * バックアップに無い/復元しない場合は今の端末のものを残す。
   */
  async restore(inspected, options) {
    const opt = options || {};
    const say = opt.onProgress || function () {};
    const meta = inspected.meta;
    const entries = inspected.entries;
    const byPath = {};
    entries.forEach((e) => { byPath[e.name] = e.blob; });

    say('設定と進行状況を書き戻しています…');
    const keepSecrets = {};
    this.SECRET_KEYS.forEach((k) => { keepSecrets[k] = localStorage.getItem(k); });

    // 既存の lq_* を一掃してから書き戻す
    const old = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf('lq_') === 0) old.push(k);
    }
    old.forEach((k) => localStorage.removeItem(k));

    const L = meta.localStorage || {};
    Object.keys(L).forEach((k) => {
      if (!opt.keys && this.SECRET_KEYS.indexOf(k) >= 0) return;
      localStorage.setItem(k, L[k]);
    });
    // APIキーを復元しない(または入っていない)ときは、今の端末のキーを残す
    this.SECRET_KEYS.forEach((k) => {
      if (!localStorage.getItem(k) && keepSecrets[k]) localStorage.setItem(k, keepSecrets[k]);
    });

    const stats = { keys: Object.keys(L).length, voices: 0, talks: 0, missing: 0 };
    const audio = meta.audio || [];
    if (audio.length && typeof indexedDB !== 'undefined') {
      say('お手本録音を書き戻しています…');
      const voiceItems = [];
      const talkParts = {};
      for (const a of audio) {
        const b = byPath[a.path];
        if (!b) { stats.missing++; continue; }
        const blob = new Blob([b], { type: a.type || 'audio/webm' });
        if (a.store === 'voice') {
          voiceItems.push({ key: a.key, value: blob });
        } else if (a.store === 'talk') {
          if (!talkParts[a.key]) {
            talkParts[a.key] = { id: a.key, savedAt: a.savedAt || meta.createdAt, title: a.title || '', durationMs: a.durationMs || 0, bytes: 0, parts: [] };
          }
          talkParts[a.key].parts.push({ blob, startSec: a.startSec || 0, _i: a.part || 0 });
          talkParts[a.key].bytes += blob.size;
        }
      }
      if (voiceItems.length) {
        await IDBUtil.putMany(this.VOICE_DB, this.VOICE_STORE, voiceItems);
        stats.voices = voiceItems.length;
      }
      const talkIds = Object.keys(talkParts);
      if (talkIds.length) {
        say('講演の音声を書き戻しています…');
        const ix = {};
        const items = talkIds.map((id) => {
          const rec = talkParts[id];
          rec.parts.sort((x, y) => x._i - y._i);
          rec.parts.forEach((p) => { delete p._i; });
          ix[id] = { bytes: rec.bytes, savedAt: rec.savedAt, parts: rec.parts.length };
          return { key: id, value: rec };
        });
        await IDBUtil.putMany(TalkAudio.DB_NAME, TalkAudio.STORE, items);
        localStorage.setItem(TalkAudio.INDEX_KEY, JSON.stringify(ix));
        stats.talks = talkIds.length;
      }
    }
    return stats;
  }
};

if (typeof indexedDB !== 'undefined') TalkAudio.init();
