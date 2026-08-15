/* ConfQuest - Language Quest 音声基盤 (Phase 2)
 * VoiceStore : パートナーのお手本録音 (IndexedDB保存、カードIDに紐付け)
 * MicRec     : マイク録音の小さなラッパー
 * SpeakCheck : 発話チェック (録音 → Whisper → 類似度 → ⭐判定)
 */
'use strict';

/* ---------- お手本録音の保存 (IndexedDB) ---------- */
const VoiceStore = {
  DB_NAME: 'confquest-voices',
  STORE: 'voices',
  _ids: new Set(),   // 同期判定用のキャッシュ
  _urls: {},         // cardId -> objectURL (再生用キャッシュ)

  supported() { return typeof indexedDB !== 'undefined'; },

  _open() {
    return new Promise((resolve, reject) => {
      const rq = indexedDB.open(this.DB_NAME, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore(this.STORE);
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => reject(rq.error);
    });
  },

  /** 起動時に呼ぶ。保存済みカードIDの一覧をメモリに読む */
  async init() {
    if (!this.supported()) return;
    try {
      const db = await this._open();
      await new Promise((resolve) => {
        const rq = db.transaction(this.STORE).objectStore(this.STORE).getAllKeys();
        rq.onsuccess = () => { this._ids = new Set(rq.result); resolve(); };
        rq.onerror = () => resolve();
      });
      db.close();
    } catch (_) { /* プライベートモード等では無効 */ }
  },

  has(id) { return this._ids.has(id); },
  countByLang(lang) {
    if (typeof Phrases === 'undefined') return 0;
    return Phrases.byLang(lang).filter((c) => this.has(c.id)).length;
  },

  async put(id, blob) {
    const db = await this._open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).put(blob, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    this._ids.add(id);
    if (this._urls[id]) { URL.revokeObjectURL(this._urls[id]); delete this._urls[id]; }
  },

  async get(id) {
    const db = await this._open();
    const blob = await new Promise((resolve) => {
      const rq = db.transaction(this.STORE).objectStore(this.STORE).get(id);
      rq.onsuccess = () => resolve(rq.result || null);
      rq.onerror = () => resolve(null);
    });
    db.close();
    return blob;
  },

  async remove(id) {
    const db = await this._open();
    await new Promise((resolve) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      tx.objectStore(this.STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
    this._ids.delete(id);
    if (this._urls[id]) { URL.revokeObjectURL(this._urls[id]); delete this._urls[id]; }
  },

  /** お手本を再生。無ければfalse(呼び出し側でTTSにフォールバック) */
  async play(id, rate) {
    if (!this.has(id)) return false;
    try {
      if (!this._urls[id]) {
        const blob = await this.get(id);
        if (!blob) return false;
        this._urls[id] = URL.createObjectURL(blob);
      }
      const a = new Audio(this._urls[id]);
      a.playbackRate = rate || 1;
      await a.play();
      return true;
    } catch (_) { return false; }
  }
};
if (VoiceStore.supported()) VoiceStore.init();

/* ---------- マイク録音 ---------- */
const MicRec = {
  rec: null,
  chunks: [],
  get active() { return !!(this.rec && this.rec.state === 'recording'); },

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.rec = new MediaRecorder(stream);
    this.rec.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.rec.start();
  },

  /** 録音を止めてBlobを返す */
  stop() {
    return new Promise((resolve) => {
      const rec = this.rec;
      if (!rec || rec.state !== 'recording') { resolve(null); return; }
      rec.onstop = () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }));
      };
      rec.stop();
    });
  },

  cancel() {
    if (this.rec && this.rec.state === 'recording') {
      this.rec.onstop = () => this.rec.stream.getTracks().forEach((t) => t.stop());
      this.rec.stop();
    }
  }
};

/* ---------- 発話チェック (Whisper判定) ---------- */
const SpeakCheck = {
  /** 発話チェックが使える端末・設定か */
  available() {
    return !!localStorage.getItem('lq_openai_key') &&
      typeof MediaRecorder !== 'undefined' &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  /* 広東語: Whisperは簡体字で返すことが多いので、照合前に簡体字へ正規化する */
  TRAD2SIMP: {
    '謝': '谢', '係': '系', '學': '学', '緊': '紧', '廣': '广', '東': '东',
    '話': '话', '員': '员', '點': '点', '飽': '饱', '靚': '靓', '養': '养',
    '顧': '顾', '幫': '帮', '譯': '译', '講': '讲', '識': '识', '飲': '饮',
    '勝': '胜', '開': '开', '興': '兴', '認': '认', '請': '请', '見': '见',
    '嚟': '来', '來': '来', '佢': '渠', '哋': '哋', '媽': '妈', '爸': '爸',
    '氣': '气', '歡': '欢', '茶': '茶', '嗎': '吗', '唔': '唔', '喇': '喇',
    '禮': '礼', '乾': '干'
  },

  normalize(s, lang) {
    let t = String(s || '').toLowerCase();
    // 空白・句読点・記号を除去
    t = t.replace(/[\s　.,!?;:。、!?…・'"'"「」『』()()\[\]\-—〜~]/g, '');
    if (lang === 'yue') {
      t = [...t].map((ch) => this.TRAD2SIMP[ch] || ch).join('');
    }
    return t;
  },

  /** レーベンシュタイン距離による類似度 (0〜1) */
  similarity(a, b) {
    if (!a.length && !b.length) return 1;
    if (!a.length || !b.length) return 0;
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return 1 - prev[n] / Math.max(m, n);
  },

  /** 類似度→⭐数。「通じるレベルでOK」の甘め設計 */
  stars(ratio) {
    if (ratio >= 0.8) return 3;
    if (ratio >= 0.55) return 2;
    if (ratio >= 0.3) return 1;
    return 0;
  },

  /**
   * 録音Blobを判定する。{ text, ratio, stars } を返す。
   * 韓国語は language=ko。広東語は yue指定が不安定なため zh 指定+簡体字正規化で照合。
   */
  async judge(blob, card) {
    const langCode = card.lang === 'ko' ? 'ko' : 'zh';
    const segs = await STT.transcribe(blob, langCode);
    const text = segs.map((s) => s.text).join(' ').trim();
    const ratio = this.similarity(
      this.normalize(text, card.lang),
      this.normalize(card.t, card.lang));
    return { text, ratio, stars: this.stars(ratio) };
  }
};
